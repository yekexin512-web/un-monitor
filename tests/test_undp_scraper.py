import unittest
from datetime import date
from types import SimpleNamespace
from unittest.mock import patch

from un_intern_monitor.multi_scraper import fetch_undp_jobs
from work.export_live_jobs import convert


def vacancy(job_id, title, level="IN", deadline="Sep-30-26", location="Home Based"):
    return f"""
      <a href="https://estm.fa.em2.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1/requisitions/job/{job_id}">
        Job Title {title} Post level {level} Apply by {deadline} Agency UNDP Location {location}
      </a>
    """


class UndpScraperTests(unittest.TestCase):
    @patch("un_intern_monitor.multi_scraper._get")
    def test_internships_are_exported_with_official_fields(self, get):
        get.return_value = SimpleNamespace(text=vacancy("33001", "Digital Innovation Fellowship"))

        jobs = fetch_undp_jobs()

        self.assertEqual(len(jobs), 1)
        job = jobs[0]
        self.assertEqual(job.job_opening_id, "UNDP-33001")
        self.assertEqual(job.title, "Digital Innovation Fellowship")
        self.assertEqual(job.location, "Home Based")
        self.assertEqual(job.deadline_date, date(2026, 9, 30))
        self.assertEqual(job.source, "UNDP")
        self.assertEqual(convert(job)["organization"], "UNDP")

    @patch("un_intern_monitor.multi_scraper._get")
    def test_level_and_multilingual_titles_are_included_and_duplicates_removed(self, get):
        html = vacancy("37023", "Graphic Design Fellowship", level="IN")
        html += vacancy("37023", "Graphic Design Fellowship", level="IN")
        html += vacancy("36999", "Programme de Stages du PNUD", level="")
        html += vacancy("36998", "Project Manager", level="NPSA-9")
        get.return_value = SimpleNamespace(text=html)

        jobs = fetch_undp_jobs()

        self.assertEqual({job.job_opening_id for job in jobs}, {"UNDP-37023", "UNDP-36999"})

    @patch("un_intern_monitor.multi_scraper._get")
    def test_network_failure_is_reported(self, get):
        get.side_effect = RuntimeError("UNDP unavailable")
        with self.assertRaisesRegex(RuntimeError, "UNDP unavailable"):
            fetch_undp_jobs()


if __name__ == "__main__":
    unittest.main()
