from __future__ import annotations

import json
import re
import time
from datetime import date, timedelta
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup, Tag

from .date_utils import parse_date
from .models import Job
from .scraper import fetch_internship_jobs as fetch_un_careers_jobs


HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json, text/html;q=0.9,*/*;q=0.8",
    "Content-Type": "application/json",
    "Accept-Language": "en-US,en;q=0.9",
}
GET_HEADERS = {key: value for key, value in HEADERS.items() if key.lower() != "content-type"}
WFP_INTERNSHIP_URL = (
    "https://wd3.myworkdaysite.com/en-US/recruiting/wfp/job_openings/jobs"
    "?workerSubType=59387fe40123101e856f1834e09b0002"
)


def fetch_all_internship_jobs(un_careers_url: str, *, headless: bool, today: date) -> list[Job]:
    jobs: list[Job] = []
    fetchers = [
        lambda: fetch_un_careers_jobs(un_careers_url, headless=headless),
        lambda: fetch_unhcr_jobs(today),
        lambda: fetch_undp_jobs(),
        lambda: fetch_unido_jobs(),
        lambda: fetch_wfp_jobs(today),
        lambda: fetch_unicef_jobs(),
        lambda: fetch_fao_jobs(),
        lambda: fetch_itu_jobs(),
        lambda: fetch_unu_jobs(),
    ]
    for fetcher in fetchers:
        try:
            jobs.extend(fetcher())
        except Exception as exc:
            print(f"Warning: skipped one source: {exc}")
    return _dedupe_jobs(jobs)


def fetch_unhcr_jobs(today: date) -> list[Job]:
    return _fetch_workday_jobs(
        source="UNHCR",
        api_base="https://unhcr.wd3.myworkdayjobs.com/wday/cxs/unhcr/External",
        public_base="https://unhcr.wd3.myworkdayjobs.com/External",
        payload={"limit": 20, "offset": 0, "searchText": "intern", "appliedFacets": {}},
        today=today,
    )


def fetch_wfp_jobs(today: date) -> list[Job]:
    return _fetch_workday_jobs(
        source="WFP",
        api_base="https://wd3.myworkdaysite.com/wday/cxs/wfp/job_openings",
        public_base=WFP_INTERNSHIP_URL,
        payload={
            "limit": 20,
            "offset": 0,
            "searchText": "",
            "appliedFacets": {"workerSubType": ["59387fe40123101e856f1834e09b0002"]},
        },
        today=today,
    )


def _fetch_workday_jobs(source: str, api_base: str, public_base: str, payload: dict, today: date) -> list[Job]:
    headers = {
        "User-Agent": HEADERS["User-Agent"],
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Accept-Language": HEADERS["Accept-Language"],
        "Origin": _origin(api_base),
        "Referer": _origin(api_base),
    }
    jobs: list[Job] = []
    offset = int(payload.get("offset") or 0)
    limit = int(payload.get("limit") or 20)
    total: int | None = None
    while total is None or offset < total:
        page_payload = {**payload, "offset": offset, "limit": limit}
        response = requests.post(f"{api_base}/jobs", json=page_payload, headers=headers, timeout=30)
        response.raise_for_status()
        data = response.json()
        postings = data.get("jobPostings", [])
        if not postings:
            break
        for item in postings:
            title = item.get("title") or ""
            if not is_internship_text(title) and source != "WFP":
                continue
            external_path = item.get("externalPath") or ""
            raw_id = _first_bullet_id(item.get("bulletFields", [])) or _id_from_path(external_path)
            if not raw_id:
                continue
            detail = _workday_detail(api_base, external_path)
            jobs.append(
                Job(
                    job_opening_id=f"{source}-{raw_id}",
                    title=title,
                    department=source,
                    location=item.get("locationsText") or "",
                    posted_date=_parse_workday_posted(item.get("postedOn"), today),
                    deadline_date=_deadline_from_html(detail),
                    apply_url=_workday_public_url(public_base, external_path),
                    source=source,
                )
            )
        total = int(data.get("total") or len(jobs))
        offset += limit
    return jobs


def _workday_detail(api_base: str, external_path: str) -> str:
    if not external_path:
        return ""
    response = requests.get(f"{api_base}{external_path}", headers=HEADERS, timeout=30)
    response.raise_for_status()
    return response.json().get("jobPostingInfo", {}).get("jobDescription", "")


def _workday_public_url(public_base: str, external_path: str) -> str:
    if "/jobs?" in public_base:
        return public_base
    if not external_path:
        return public_base
    return f"{public_base.rstrip('/')}/{external_path.lstrip('/')}"


def fetch_unido_jobs() -> list[Job]:
    url = "https://careers.unido.org/search/?q=&q2=&alertId=&locationsearch=&title=&location=&department=&facility=intern&shifttype=#searchresults"
    response = _get(url, timeout=30)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    jobs: list[Job] = []
    for row in soup.select("tr.data-row"):
        link = row.find("a", href=True)
        if not link:
            continue
        cells = [cell.get_text(" ", strip=True) for cell in row.find_all("td")]
        href = urljoin(url, str(link["href"]))
        raw_id = _id_from_path(href)
        jobs.append(
            Job(
                job_opening_id=f"UNIDO-{raw_id}",
                title=link.get_text(" ", strip=True),
                department="UNIDO",
                location=_pick_cell(cells, 1),
                posted_date=None,
                deadline_date=parse_date(cells[-1] if cells else None),
                apply_url=href,
                source="UNIDO",
            )
        )
    return jobs


def fetch_unicef_jobs() -> list[Job]:
    url = "https://jobs.unicef.org/en-us/filter/?search-keyword=&pay-scale=internship"
    response = requests.get(url, headers=HEADERS, timeout=90)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    jobs_by_id: dict[str, Job] = {}
    for link in soup.find_all("a", href=re.compile(r"/en-us/job/\d+")):
        title = link.get_text(" ", strip=True)
        href = urljoin(url, str(link["href"]))
        raw_id = _id_from_path(href)
        if not raw_id or f"UNICEF-{raw_id}" in jobs_by_id:
            continue
        container = link.find_parent(class_="row-content") or link.find_parent(class_="row-content--text") or link.parent
        text = container.get_text("\n", strip=True) if container else title
        jobs_by_id[f"UNICEF-{raw_id}"] = Job(
            job_opening_id=f"UNICEF-{raw_id}",
            title=title,
            department="UNICEF",
            location=_field_after_label(text, "Location"),
            posted_date=None,
            deadline_date=parse_date(_field_after_label(text, "Deadline")),
            apply_url=href,
            source="UNICEF",
        )
    return list(jobs_by_id.values())


def fetch_fao_jobs() -> list[Job]:
    url = "https://jobs.fao.org/careersection/rest/jobboard/searchjobs?lang=en&portal=8105120163"
    filtered_payload = {
        "multilineEnabled": True,
        "sortingSelection": {"sortBySelectionParam": "1", "ascendingSortingOrder": "false"},
        "fieldData": {"fields": {}, "valid": True},
        "filterSelectionParam": {
            "searchFilterSelections": [{"id": "JOB_TYPE", "selectedValues": ["2"]}]
        },
        "advancedSearchFiltersSelectionParam": {"searchFilterSelections": []},
    }
    headers = {
        "User-Agent": HEADERS["User-Agent"],
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Accept-Language": HEADERS["Accept-Language"],
        "Referer": "https://jobs.fao.org/careersection/fao_external/jobsearch.ftl?lang=en",
        "Origin": "https://jobs.fao.org",
        "tz": "GMT+00:00",
        "tzname": "Europe/London",
    }
    session = requests.Session()
    session.get(headers["Referer"], headers=headers, timeout=30)
    jobs = _fetch_fao_pages(session, url, headers, filtered_payload)
    if jobs:
        return jobs

    all_jobs_payload = {
        **filtered_payload,
        "filterSelectionParam": {"searchFilterSelections": []},
    }
    return _fetch_fao_pages(session, url, headers, all_jobs_payload)


def _fetch_fao_pages(session: requests.Session, url: str, headers: dict[str, str], payload_base: dict) -> list[Job]:
    jobs: list[Job] = []
    total_count = None
    page_no = 1
    while total_count is None or len(jobs) < total_count:
        payload = {**payload_base, "pageNo": page_no}
        response = session.post(url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        data = response.json()
        postings = data.get("requisitionList", [])
        if not postings:
            break
        for item in postings:
            job = _fao_job_from_item(item)
            if job:
                jobs.append(job)
        paging = data.get("pagingData", {})
        total_count = int(paging.get("totalCount") or len(jobs))
        page_size = int(paging.get("pageSize") or len(postings) or 25)
        if page_no * page_size >= total_count:
            break
        page_no += 1
    return jobs


def fetch_itu_jobs() -> list[Job]:
    url = (
        "https://jobs.itu.int/go/View-all-categories/8942455/"
        "?q=&q2=&alertId=&locationsearch=&title=intern&location=&department=&date=#searchresults"
    )
    response = _get(url, timeout=30)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    jobs_by_id: dict[str, Job] = {}
    for row in soup.select("tr.data-row"):
        link = row.select_one("span.jobTitle.hidden-phone a[href]") or row.find("a", href=True)
        if not link:
            continue
        title = link.get_text(" ", strip=True)
        family = _select_text(row, ".colDepartment .jobDepartment")
        if not is_internship_text(title) and not is_internship_text(family):
            continue
        href = urljoin(url, str(link["href"]))
        raw_id = _id_from_path(href)
        if not raw_id:
            continue
        detail = _itu_detail(href)
        jobs_by_id[f"ITU-{raw_id}"] = Job(
            job_opening_id=f"ITU-{raw_id}",
            title=title,
            department=_itu_department(detail),
            location=_itu_location(detail) or _select_text(row, ".colLocation .jobLocation"),
            posted_date=parse_date(_select_text(row, ".colDate .jobDate")),
            deadline_date=_itu_deadline(detail),
            apply_url=href,
            source="ITU",
        )
    return list(jobs_by_id.values())


def fetch_unu_jobs() -> list[Job]:
    url = "https://careers.unu.edu/?jobs-c08a5887%5Bsearch%5D=intern"
    response = _get(url, timeout=30)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    app = soup.select_one('div[data-component="PublicApp"][data-props]')
    if not app:
        return []
    data = json.loads(str(app["data-props"]))
    config = data.get("appConfig", {})
    departments = {
        item.get("id"): item.get("translations", {}).get("en", {}).get("name", "")
        for item in config.get("departments", [])
    }
    locations = {
        item.get("id"): item.get("translations", {}).get("en", {})
        for item in config.get("locations", [])
    }
    jobs: list[Job] = []
    for offer in config.get("offers", []):
        translation = offer.get("translations", {}).get("en", {})
        title = _clean_unu_text(translation.get("title") or "")
        employment_type = str(offer.get("employmentType") or "")
        description = _unu_offer_text(translation)
        if "internship" not in employment_type.lower() and not is_internship_text(f"{title} {description}"):
            continue
        raw_id = str(offer.get("externalId") or offer.get("id") or offer.get("guid") or offer.get("slug") or "")
        if not raw_id:
            continue
        slug = str(offer.get("slug") or "")
        jobs.append(
            Job(
                job_opening_id=f"UNU-{raw_id}",
                title=title,
                department=departments.get(offer.get("departmentId")) or "UNU",
                location=_unu_location(offer, locations),
                posted_date=None,
                deadline_date=_unu_deadline(description),
                apply_url=f"https://careers.unu.edu/o/{slug}" if slug else url,
                source="UNU",
            )
        )
    return jobs


def fetch_undp_jobs() -> list[Job]:
    url = "https://jobs.undp.org/cj_view_jobs.cfm"
    response = requests.get(url, headers=HEADERS, timeout=90)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    jobs_by_id: dict[str, Job] = {}
    for link in soup.find_all("a", href=re.compile(r"/requisitions/job/\d+")):
        text = re.sub(r"\s+", " ", link.get_text(" ", strip=True))
        if not is_internship_text(text):
            continue
        raw_id = _id_from_path(str(link["href"]))
        if not raw_id:
            continue
        title = _between(text, "Job Title", "Post level") or text
        jobs_by_id[f"UNDP-{raw_id}"] = Job(
            job_opening_id=f"UNDP-{raw_id}",
            title=title.strip(),
            department=_between(text, "Agency", "Location") or "UNDP",
            location=_after(text, "Location"),
            posted_date=None,
            deadline_date=parse_date(_between(text, "Apply by", "Agency")),
            apply_url=str(link["href"]),
            source="UNDP",
        )
    return list(jobs_by_id.values())


def _dedupe_jobs(jobs: list[Job]) -> list[Job]:
    jobs_by_id = {job.job_opening_id: job for job in jobs}
    return sorted(jobs_by_id.values(), key=lambda job: (job.source, job.deadline_date or date.max, job.title))


def is_internship_text(text: str) -> bool:
    return bool(re.search(r"\b(intern|interns|internship|internships)\b", text, flags=re.IGNORECASE))


def _parse_workday_posted(value: str | None, today: date) -> date | None:
    if not value:
        return None
    text = value.strip().lower()
    if text == "posted today":
        return today
    if text == "posted yesterday":
        return today - timedelta(days=1)
    match = re.search(r"posted\s+(\d+)\s+days?\s+ago", text)
    if match:
        return today - timedelta(days=int(match.group(1)))
    return parse_date(value)


def _deadline_from_html(html: str) -> date | None:
    text = BeautifulSoup(html, "html.parser").get_text("\n", strip=True)
    match = re.search(
        r"(?:Deadline for Applications|DEADLINE FOR APPLICATIONS|Deadline)\s*\n?\s*([A-Za-z]{3,9}\s+\d{1,2},\s+\d{4}|\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}(?:-\d{1,2}:\d{2}[^\\n]*)?)",
        text,
        flags=re.IGNORECASE,
    )
    return parse_date(match.group(1)) if match else parse_date(text)


def _field_after_label(text: str, label: str) -> str:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    for index, line in enumerate(lines[:-1]):
        if line.rstrip(":").lower() == label.lower():
            return lines[index + 1]
    return ""


def _select_text(soup: BeautifulSoup | Tag, selector: str) -> str:
    element = soup.select_one(selector)
    return element.get_text(" ", strip=True) if element else ""


def _itu_detail(url: str) -> str:
    response = _get(url, timeout=30)
    response.raise_for_status()
    return response.text


def _get(url: str, *, timeout: int) -> requests.Response:
    last_error: Exception | None = None
    for attempt in range(3):
        try:
            response = requests.get(url, headers=GET_HEADERS, timeout=timeout)
            response.raise_for_status()
            return response
        except requests.RequestException as exc:
            last_error = exc
            if attempt < 2:
                time.sleep(1 + attempt)
    assert last_error is not None
    raise last_error


def _itu_deadline(html: str) -> date | None:
    text = BeautifulSoup(html, "html.parser").get_text("\n", strip=True)
    value = _field_after_label(text, "Application deadline (Midnight Geneva Time)")
    if not value:
        match = re.search(
            r"Application deadline\s*\(Midnight Geneva Time\)\s*:?\s*([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}\s+[A-Za-z]+\s+\d{4})",
            BeautifulSoup(html, "html.parser").get_text(" ", strip=True),
            flags=re.IGNORECASE,
        )
        value = match.group(1) if match else ""
    return parse_date(value)


def _itu_department(html: str) -> str:
    text = BeautifulSoup(html, "html.parser").get_text("\n", strip=True)
    sector = _field_after_label(text, "Sector")
    department = _field_after_label(text, "Department")
    return " / ".join(part for part in (sector, department) if part) or "ITU"


def _itu_location(html: str) -> str:
    text = BeautifulSoup(html, "html.parser").get_text("\n", strip=True)
    duty_station = _field_after_label(text, "Duty station")
    country = _field_after_label(text, "Country of contract")
    return ", ".join(part for part in (duty_station, country) if part)


def _unu_offer_text(translation: dict) -> str:
    html = " ".join(
        str(translation.get(key) or "")
        for key in ("highlightHtml", "descriptionHtml", "requirementsHtml", "sharingDescription")
    )
    return _clean_unu_text(BeautifulSoup(html, "html.parser").get_text("\n", strip=True))


def _unu_deadline(text: str) -> date | None:
    match = re.search(
        r"(?:Application\s+deadline|Deadline)\s*:?\s*(?:\n|\s)+([^\n]+)",
        text,
        flags=re.IGNORECASE,
    )
    return parse_date(match.group(1)) if match else parse_date(text)


def _unu_location(offer: dict, locations: dict) -> str:
    names = []
    for location_id in offer.get("locationIds", []):
        location = locations.get(location_id, {})
        name = location.get("name") or ", ".join(
            part for part in (location.get("city"), location.get("country")) if part
        )
        if name:
            names.append(_clean_unu_text(name))
    if not names:
        city = offer.get("city") or ""
        country = offer.get("countryCode") or ""
        if city or country:
            names.append(_clean_unu_text(", ".join(part for part in (city, country) if part)))
    location_text = "; ".join(dict.fromkeys(names))
    if offer.get("remote"):
        return f"Remote - {location_text}" if location_text else "Remote"
    return location_text


def _clean_unu_text(value: str) -> str:
    return (
        str(value or "")
        .replace("\ufffdC", "-")
        .replace("\ufffd", "")
        .replace("–", "-")
        .replace("—", "-")
        .replace("\xa0", " ")
        .strip()
    )


def _first_bullet_id(values: list[str]) -> str:
    for value in values:
        if re.search(r"[A-Za-z]*\d{4,}", str(value)):
            return str(value)
    return ""


def _id_from_path(value: str) -> str:
    matches = re.findall(r"([A-Za-z]*\d{4,})", value)
    return matches[-1] if matches else ""


def _pick_cell(cells: list[str], index: int) -> str:
    return cells[index] if len(cells) > index else ""


def _fao_job_from_item(item: dict) -> Job | None:
    columns = item.get("column") or []
    contest_no = str(item.get("contestNo") or _pick_cell(columns, 1)).strip()
    if not contest_no:
        return None
    title = _clean_fao_text(_pick_cell(columns, 0))
    if not is_internship_text(title) and not is_internship_text(_pick_cell(columns, 2)):
        return None
    return Job(
        job_opening_id=f"FAO-{contest_no}",
        title=title,
        department=_clean_fao_text(_pick_cell(columns, 3)) or "FAO",
        location=_fao_location(_pick_cell(columns, 4)),
        posted_date=parse_date(_pick_cell(columns, 5)),
        deadline_date=parse_date(_pick_cell(columns, 6)),
        apply_url=f"https://jobs.fao.org/careersection/fao_external/jobdetail.ftl?lang=en&job={contest_no}",
        source="FAO",
    )


def _fao_location(value: str) -> str:
    if not value:
        return ""
    try:
        parsed = json.loads(value)
    except json.JSONDecodeError:
        return value.strip()
    if isinstance(parsed, list):
        return ", ".join(_clean_fao_text(str(item)) for item in parsed if str(item).strip())
    return _clean_fao_text(str(parsed))


def _clean_fao_text(value: str) -> str:
    return value.replace("\ufffdC", "-").replace("–", "-").replace("—", "-").strip()


def _origin(url: str) -> str:
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}"


def _between(text: str, start: str, end: str) -> str:
    match = re.search(rf"{re.escape(start)}\s*(.*?)\s*{re.escape(end)}", text, flags=re.IGNORECASE)
    return match.group(1).strip() if match else ""


def _after(text: str, start: str) -> str:
    match = re.search(rf"{re.escape(start)}\s*(.*)$", text, flags=re.IGNORECASE)
    return match.group(1).strip() if match else ""
