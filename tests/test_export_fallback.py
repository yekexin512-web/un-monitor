import json
import unittest
from contextlib import ExitStack, redirect_stdout
from datetime import date
from io import StringIO
from pathlib import Path
from tempfile import TemporaryDirectory
from types import SimpleNamespace
from unittest.mock import patch

from un_intern_monitor.models import Job
from work import export_live_jobs
from work.job_catalog import parse_jobs


class ExportFallbackTests(unittest.TestCase):
    def test_failed_source_is_preserved_while_unesco_is_added(self):
        existing = {"generatedAt": "2026-09-20T09:00:00", "jobs": [
            {"id": "UN-123456", "organization": "UN Careers", "title": "Intern", "deadline": "2026-10-01"},
            {"id": "UNESCO-old", "organization": "UNESCO", "title": "Old listing", "deadline": "2026-01-01"},
        ]}
        new_job = Job("UNESCO-1347773857", "INTERNSHIP: Education Sector",
                      "UNESCO", "Multiple, Multiple", date(2026, 8, 27),
                      date(2026, 12, 31), "https://careers.unesco.org/job/Multiple/1347773857/",
                      source="UNESCO")
        with TemporaryDirectory() as directory, ExitStack() as stack:
            output = Path(directory) / "jobs-data.js"
            output.write_text("window.UN_MONITOR_LIVE_JOBS = " + json.dumps(existing) + ";\n", encoding="utf-8")
            stack.enter_context(patch.object(export_live_jobs, "OUT_FILE", output))
            stack.enter_context(patch("un_intern_monitor.config.load_settings", return_value=SimpleNamespace(
                search_url="https://careers.un.org/", playwright_headless=True)))
            stack.enter_context(patch("un_intern_monitor.scraper.fetch_internship_jobs",
                                      side_effect=RuntimeError("temporarily unavailable")))
            for source in ("unicef", "unhcr", "unido", "wfp", "fao", "itu", "unu"):
                stack.enter_context(patch(f"un_intern_monitor.multi_scraper.fetch_{source}_jobs", return_value=[]))
            stack.enter_context(patch("un_intern_monitor.multi_scraper.fetch_unesco_jobs", return_value=[new_job]))
            with redirect_stdout(StringIO()):
                export_live_jobs.main()
            payload = json.loads(output.read_text(encoding="utf-8").split(" = ", 1)[1].strip().removesuffix(";"))
            self.assertEqual([row["id"] for row in payload["jobs"]], ["UN-123456", "UNESCO-1347773857"])
            self.assertEqual(payload["jobs"][0], existing["jobs"][0])
            self.assertIn("retained 1 previous jobs", payload["errors"][0])
            catalog = parse_jobs(output.with_name("jobs-catalog.js").read_text(encoding="utf-8"), "UN_MONITOR_JOB_CATALOG")
            self.assertEqual({job["id"] for job in catalog}, {"UN-123456", "UNESCO-old", "UNESCO-1347773857"})
            self.assertTrue(all("status" not in job for job in catalog))


if __name__ == "__main__":
    unittest.main()
