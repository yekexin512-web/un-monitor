import unittest
from datetime import date
from types import SimpleNamespace
from unittest.mock import patch
from urllib.parse import parse_qs, urlparse

from un_intern_monitor.multi_scraper import fetch_unesco_jobs
from work.export_live_jobs import convert


def row(job_id, title="INTERNSHIP: Education Sector", family="Internship",
        posted="4 Sept 2026", closing="31/12/2026"):
    return f"""
    <tr class="data-row">
      <td class="colTitle">
        <span class="jobTitle hidden-phone">
          <a href="/job/Multiple-Internship/{job_id}/">{title}</a>
        </span>
        <div class="visible-phone">
          <a class="jobTitle-link" href="/job/Multiple-Internship/{job_id}/">{title}</a>
          <span class="jobDate">{posted}</span>
        </div>
      </td>
      <td class="colLocation"><span class="jobLocation">Multiple, Multiple</span></td>
      <td class="colFacility"><span class="jobFacility">{family}</span></td>
      <td class="colDepartment"><span class="jobDepartment">{family}</span></td>
      <td class="colShifttype"><span class="jobShifttype">{closing}</span></td>
      <td></td>
    </tr>
    """


class UnescoScraperTests(unittest.TestCase):
    @patch("un_intern_monitor.multi_scraper._get")
    def test_official_fields_and_export(self, get):
        get.return_value = SimpleNamespace(text=row("1347773857"))
        jobs = fetch_unesco_jobs()
        self.assertEqual(len(jobs), 1)
        job = jobs[0]
        self.assertEqual(job.job_opening_id, "UNESCO-1347773857")
        self.assertEqual(job.title, "INTERNSHIP: Education Sector")
        self.assertEqual(job.location, "Multiple, Multiple")
        self.assertEqual(job.posted_date, date(2026, 9, 4))
        self.assertEqual(job.deadline_date, date(2026, 12, 31))
        self.assertEqual(job.apply_url, "https://careers.unesco.org/job/Multiple-Internship/1347773857/")
        self.assertEqual(convert(job)["organization"], "UNESCO")
        self.assertEqual(convert(job)["deadline"], "2026-12-31")
        self.assertNotIn("title=intern", get.call_args.args[0])

    @patch("un_intern_monitor.multi_scraper._get")
    def test_pagination_filters_duplicates_and_return_links(self, get):
        page1 = row("1347773857") + row("1347000000", "International Consultant", "Consultant")
        page1 += """
          <div class="pagination">
            <a href="/go/All-jobs-openings/784002/25/?q=">2</a>
            <a href="/go/All-jobs-openings/784002/25/?q=">Next</a>
          </div>
        """
        page2 = row("1347773857") + row("1347780957", closing="30/6/2026")
        page2 += """
          <div class="pagination">
            <a href="/go/All-jobs-openings/784002/">1</a>
            <a href="https://example.org/go/All-jobs-openings/784002/50/">3</a>
          </div>
        """
        get.side_effect = [SimpleNamespace(text=page1), SimpleNamespace(text=page2)]
        jobs = fetch_unesco_jobs()
        self.assertEqual([j.job_opening_id for j in jobs], ["UNESCO-1347773857", "UNESCO-1347780957"])
        self.assertEqual(jobs[1].deadline_date, date(2026, 6, 30))
        self.assertEqual(get.call_count, 2)
        next_query = parse_qs(urlparse(get.call_args.args[0]).query)
        self.assertEqual(next_query["department"], ["Internship"])

    @patch("un_intern_monitor.multi_scraper._get")
    def test_no_matching_jobs(self, get):
        get.return_value = SimpleNamespace(text="<div>No jobs matching your search</div>")
        self.assertEqual(fetch_unesco_jobs(), [])

    @patch("un_intern_monitor.multi_scraper._get")
    def test_network_failure_is_reported(self, get):
        get.side_effect = RuntimeError("UNESCO unavailable")
        with self.assertRaisesRegex(RuntimeError, "UNESCO unavailable"):
            fetch_unesco_jobs()


if __name__ == "__main__":
    unittest.main()
