import json
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

from work.job_catalog import CATALOG_GLOBAL, PUBLIC_FIELDS, parse_jobs, update_catalog


class JobCatalogTests(unittest.TestCase):
    def test_retains_removed_jobs_and_uses_latest_metadata(self):
        with TemporaryDirectory() as directory:
            path = Path(directory) / "jobs-catalog.js"
            old = {"id": 123, "source": "UN Careers", "title": "Old title", "category": "Data & Analytics"}
            new = {"id": "123", "source": "UN Careers", "title": "Updated title"}
            update_catalog(path, [old])
            update_catalog(path, [new, {"id": "456", "source": "UNESCO", "title": "Intern"}])
            jobs = update_catalog(path, [])
            self.assertEqual([job["id"] for job in jobs], ["123", "456"])
            self.assertEqual(jobs[0]["title"], "Updated title")
            self.assertEqual(jobs[0]["category"], "Data & Analytics")
            self.assertEqual(parse_jobs(path.read_text(encoding="utf-8"), CATALOG_GLOBAL), jobs)

    def test_does_not_publish_personal_fields_or_manual_jobs(self):
        with TemporaryDirectory() as directory:
            path = Path(directory) / "jobs-catalog.js"
            job = {"id": "123", "source": "UN Careers", "title": "Intern", "status": "offer",
                   "user_id": "synthetic-user", "appliedAt": "2026-01-01", "notes": "private",
                   "email": "private@example.test", "statusUpdatedAt": "2026-01-01", "firstTrackedAt": "2026-01-01"}
            jobs = update_catalog(path, [job, {"id": "manual", "source": "Manual", "title": "Private role"}])
            self.assertEqual(len(jobs), 1)
            self.assertLessEqual(set(jobs[0]), set(PUBLIC_FIELDS))
            self.assertNotIn("private", path.read_text(encoding="utf-8"))
            self.assertNotIn("appliedAt", path.read_text(encoding="utf-8"))

    def test_malformed_catalog_is_not_silently_overwritten(self):
        with TemporaryDirectory() as directory:
            path = Path(directory) / "jobs-catalog.js"
            path.write_text("broken data", encoding="utf-8")
            with self.assertRaises(ValueError):
                update_catalog(path, [])
            self.assertEqual(path.read_text(encoding="utf-8"), "broken data")

    def test_committed_history_contains_original_public_metadata(self):
        path = Path(__file__).resolve().parents[1] / "outputs/unmonitor-v2/jobs-catalog.js"
        jobs = parse_jobs(path.read_text(encoding="utf-8"), CATALOG_GLOBAL)
        by_id = {job["id"]: job for job in jobs}
        expected = {
            "279488": ("Political Affairs Intern: Policy Planning", "Economics & Development"),
            "279596": ("Administration and Data Analysis Intern", "Data & Analytics"),
            "279655": ("Social Media Internship", "Communications & Advocacy"),
            "279842": ("Intern - Policy, Research, and Advocacy", "Communications & Advocacy"),
            "281956": ("Information Management Intern", "Data & Analytics"),
        }
        for job_id, (title, category) in expected.items():
            self.assertEqual(by_id[job_id]["title"], title)
            self.assertEqual(by_id[job_id]["category"], category)
            self.assertEqual(by_id[job_id]["organization"], "UN Careers")
        for job in jobs:
            self.assertLessEqual(set(job), set(PUBLIC_FIELDS))


if __name__ == "__main__":
    unittest.main()
