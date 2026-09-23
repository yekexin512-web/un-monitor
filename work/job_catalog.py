"""Keep public vacancy metadata after jobs leave the live feed."""

from __future__ import annotations

import json
import subprocess
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]
FEED_PATH = "outputs/unmonitor-v2/jobs-data.js"
CATALOG_PATH = ROOT_DIR / "outputs" / "unmonitor-v2" / "jobs-catalog.js"
CATALOG_GLOBAL = "UN_MONITOR_JOB_CATALOG"
PUBLIC_FIELDS = (
    "id", "title", "organization", "source", "category", "location", "continent",
    "deadline", "postedDate", "url", "tags", "summary", "responsibilities", "requirements",
)
PUBLIC_SOURCES = {"UN Careers", "UNICEF", "UNHCR", "UNDP", "UNIDO", "WFP", "FAO", "ITU", "UNU", "UNESCO"}


def parse_jobs(content: str, global_name: str) -> list[dict]:
    prefix = f"window.{global_name} = "
    content = content.lstrip("\ufeff")
    if not content.startswith(prefix):
        raise ValueError(f"Unrecognized {global_name} format; existing data will not be replaced.")
    payload = json.loads(content[len(prefix):].strip().removesuffix(";"))
    if not isinstance(payload.get("jobs"), list):
        raise ValueError(f"Invalid jobs in {global_name}")
    return payload["jobs"]


def public_metadata(job: dict) -> dict | None:
    if not isinstance(job, dict) or not job.get("id") or not job.get("title"):
        return None
    if (job.get("source") or job.get("organization")) not in PUBLIC_SOURCES:
        return None
    # Never publish account state, application dates, notes, or manual vacancies.
    result = {key: job[key] for key in PUBLIC_FIELDS if key in job and job[key] not in (None, "", [])}
    result["id"] = str(job["id"])
    return result


def update_catalog(path: Path, *batches: list[dict]) -> list[dict]:
    existing = parse_jobs(path.read_text(encoding="utf-8"), CATALOG_GLOBAL) if path.exists() else []
    by_id: dict[str, dict] = {}
    for batch in (existing, *batches):
        for job in batch:
            metadata = public_metadata(job)
            if metadata:
                by_id.setdefault(metadata["id"], {}).update(metadata)
    jobs = [by_id[key] for key in sorted(by_id)]
    content = f"window.{CATALOG_GLOBAL} = " + json.dumps({"jobs": jobs}, ensure_ascii=False, indent=2) + ";\n"
    if not path.exists() or path.read_text(encoding="utf-8") != content:
        temporary = path.with_suffix(path.suffix + ".tmp")
        temporary.write_text(content, encoding="utf-8")
        temporary.replace(path)
    return jobs


def rebuild_from_git() -> None:
    revisions = subprocess.check_output(
        ["git", "log", "--reverse", "--format=%H", "--", FEED_PATH], cwd=ROOT_DIR, text=True,
    ).splitlines()
    batches = []
    for revision in revisions:
        content = subprocess.check_output(
            ["git", "show", f"{revision}:{FEED_PATH}"], cwd=ROOT_DIR,
        ).decode("utf-8-sig")
        batches.append(parse_jobs(content, "UN_MONITOR_LIVE_JOBS"))
    batches.append(parse_jobs((ROOT_DIR / FEED_PATH).read_text(encoding="utf-8"), "UN_MONITOR_LIVE_JOBS"))
    jobs = update_catalog(CATALOG_PATH, *batches)
    print(f"Retained {len(jobs)} public jobs from {len(revisions)} snapshots in {CATALOG_PATH}")


if __name__ == "__main__":
    rebuild_from_git()
