from __future__ import annotations

import json
import sys
from datetime import date, datetime
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT_DIR))

OUT_FILE = ROOT_DIR / "outputs" / "unmonitor-v2" / "jobs-data.js"

CATEGORIES = [
    "Economics & Development",
    "Data & Analytics",
    "Tech & Digital",
    "Communications & Advocacy",
    "Programme & Project",
    "Humanitarian & Protection",
    "Partnerships",
    "Legal & Human Rights",
    "Climate & Environment",
    "Admin, Finance & HR",
]

CONTINENT_KEYWORDS = {
    "Africa": [
        "addis ababa",
        "arusha",
        "benin",
        "cairo",
        "ghana",
        "kenya",
        "morocco",
        "mozambique",
        "nairobi",
        "niger",
        "togo",
        "cotonou",
        "niamey",
        "rabat",
        "accra",
        "lome",
        "agadez",
        "parakou",
    ],
    "Asia": [
        "amman",
        "ashkhabad",
        "astana",
        "bangkok",
        "beijing",
        "bishkek",
        "china",
        "dushanbe",
        "fukuoka",
        "india",
        "indonesia",
        "incheon",
        "jakarta",
        "japan",
        "korea",
        "new delhi",
        "tehran",
        "thailand",
        "tashkent",
        "tokyo",
        "vietnam",
    ],
    "Europe": [
        "brindisi",
        "brussels",
        "copenhagen",
        "denmark",
        "france",
        "geneva",
        "germany",
        "italy",
        "netherlands",
        "pristina",
        "rome",
        "spain",
        "switzerland",
        "the hague",
        "valencia",
        "vienna",
    ],
    "North America": ["canada", "mexico city", "montreal", "new york", "panama city", "san jose", "san salvador", "usa", "united states", "washington"],
    "South America": ["argentina", "brazil", "chile", "colombia", "peru", "santiago", "sao paulo", "sao-paulo"],
    "Oceania": ["australia", "new zealand", "fiji", "samoa"],
    "Remote / Global": ["remote", "home-based", "home based", "multiple", "global", "various"],
}


def clean_text(value: object) -> str:
    text = str(value or "")
    replacements = {
        "\u2013": "-",
        "\u2014": "-",
        "\u2019": "'",
        "\u2018": "'",
        "\u201c": '"',
        "\u201d": '"',
        "\ufffd": "",
        "鈥?": "-",
        "鈥": "-",
        "茅": "e",
        "谷": "e",
        "每": "-",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return " ".join(text.split())


def infer_category(title: str, source: str = "") -> str:
    text = f"{title} {source}".lower()
    rules = [
        ("Data & Analytics", ["data", "database", "data analyst", "statistics", "analytics", "monitoring", "evaluation", "information management", "indicator", "gis"]),
        ("Tech & Digital", ["software", "developer", "digital", "ict", "artificial intelligence", "web", "information systems", "drone", "forensics"]),
        ("Communications & Advocacy", ["communication", "media", "advocacy", "content", "public information", "outreach", "social media"]),
        ("Economics & Development", ["economic", "policy", "finance", "budget", "public finance", "trade", "sustainable development", "sdg"]),
        ("Partnerships", ["partnership", "pph", "resource mobilization", "external relations", "donor"]),
        ("Legal & Human Rights", ["legal", "human rights", "governance", "rule of law"]),
        ("Climate & Environment", ["climate", "environment", "energy", "green", "chemicals", "waste"]),
        ("Admin, Finance & HR", ["admin", "administration", "human resources", "risk", "compliance", "audit", "operations", "procurement"]),
        ("Humanitarian & Protection", ["humanitarian", "protection", "migration", "health", "nutrition", "education", "wash", "emergency"]),
        ("Programme & Project", ["programme", "program", "project", "coordination", "assistant"]),
    ]
    for category, needles in rules:
        if any(needle in text for needle in needles):
            return category
    return "Programme & Project"


def infer_continent(location: str) -> str:
    text = location.lower()
    for continent, keywords in CONTINENT_KEYWORDS.items():
        if any(keyword in text for keyword in keywords):
            return continent
    return "Remote / Global"


def tags_for(title: str, category: str) -> list[str]:
    text = f"{title} {category}".lower()
    tags = []
    for tag in ["data", "policy", "research", "communications", "digital", "finance", "monitoring", "advocacy", "legal", "programme"]:
        if tag in text:
            tags.append(tag)
    return tags


def role_pack(title: str, category: str, source: str, location: str) -> tuple[str, list[str], list[str]]:
    title_text = title.lower()
    packs = {
        "Economics & Development": (
            "Policy and development role focused on research, analysis, briefing material, and evidence for economic or sustainable-development work.",
            [
                "Support policy research, background notes, and evidence synthesis.",
                "Analyze programme, economic, budget, or development information for team outputs.",
                "Prepare short written products such as briefs, talking points, tables, and presentations.",
            ],
            [
                "Background in economics, public policy, development, social sciences, or a related field.",
                "Strong research, writing, Excel, and analytical skills.",
                "Interest in UN development priorities and sustainable development issues.",
            ],
        ),
        "Data & Analytics": (
            "Data-oriented internship involving information management, monitoring, dashboards, statistics, or analytical support.",
            [
                "Clean, organize, and analyze datasets or monitoring information.",
                "Support dashboards, indicators, visualizations, reports, or information-management products.",
                "Document data workflows and help teams use evidence for decision-making.",
            ],
            [
                "Experience with Excel and ideally Python, SQL, R, Power BI, Tableau, GIS, or similar tools.",
                "Comfort with data cleaning, structured analysis, and documentation.",
                "Ability to translate data into clear written or visual outputs.",
            ],
        ),
        "Tech & Digital": (
            "Technical or digital role supporting software, ICT, digital transformation, AI, GIS, or technology-enabled workflows.",
            [
                "Support digital tools, systems, prototypes, or technical documentation.",
                "Assist with requirements gathering, testing, implementation support, or workflow mapping.",
                "Contribute to technology-enabled analysis, automation, or knowledge products.",
            ],
            [
                "Technical background in computer science, information systems, GIS, digital innovation, or related field.",
                "Relevant software, web, database, GIS, or ICT skills.",
                "Ability to explain technical work clearly to non-technical stakeholders.",
            ],
        ),
        "Communications & Advocacy": (
            "Communications role focused on public information, campaigns, advocacy, media, storytelling, or digital content.",
            [
                "Draft, edit, and package communication materials for web, social media, campaigns, or events.",
                "Support advocacy research, media tracking, content planning, or stakeholder messaging.",
                "Help translate programme evidence into accessible public-facing content.",
            ],
            [
                "Strong writing, editing, storytelling, and communication skills.",
                "Experience or interest in social media, campaigns, multimedia, or public information.",
                "Ability to adapt messages for different audiences.",
            ],
        ),
        "Programme & Project": (
            "Programme support role involving coordination, documentation, reporting, stakeholder follow-up, and implementation support.",
            [
                "Track activities, deliverables, meetings, and programme documentation.",
                "Support reporting, coordination, note-taking, research, and knowledge management.",
                "Assist teams with day-to-day implementation and follow-up with partners or colleagues.",
            ],
            [
                "Strong organization, writing, coordination, and research skills.",
                "Interest in project/programme management and UN operational workflows.",
                "Ability to work across teams and keep clear records.",
            ],
        ),
        "Humanitarian & Protection": (
            "Humanitarian, migration, protection, health, nutrition, education, or social-policy role supporting vulnerable populations.",
            [
                "Support programme implementation, research, monitoring, or field coordination.",
                "Contribute to documentation, needs analysis, protection or service-delivery follow-up.",
                "Prepare notes, data summaries, and programme materials for humanitarian or social-policy teams.",
            ],
            [
                "Interest or background in humanitarian affairs, migration, protection, public health, education, or social policy.",
                "Research, documentation, and coordination skills.",
                "Sensitivity to working with vulnerable populations and rights-based approaches.",
            ],
        ),
        "Partnerships": (
            "Partnerships or external-relations role supporting donor engagement, stakeholder mapping, fundraising, or resource mobilization.",
            [
                "Support donor/stakeholder mapping and external-relations tracking.",
                "Prepare briefing notes, partner profiles, presentations, or visibility material.",
                "Assist with resource-mobilization and partnership documentation.",
            ],
            [
                "Strong research, writing, and stakeholder-analysis skills.",
                "Interest in partnerships, fundraising, external relations, or private-sector engagement.",
                "Ability to synthesize information for senior audiences.",
            ],
        ),
        "Legal & Human Rights": (
            "Legal, governance, or human-rights role focused on research, analysis, documentation, and support to legal/policy teams.",
            [
                "Conduct legal, governance, or human-rights desk research.",
                "Summarize documents, cases, policies, or country developments.",
                "Support reports, briefings, meeting preparation, or documentation workflows.",
            ],
            [
                "Background in law, international relations, human rights, governance, or related field.",
                "Strong legal/policy research and concise writing skills.",
                "Attention to detail and ability to handle sensitive material.",
            ],
        ),
        "Climate & Environment": (
            "Environment or climate role supporting research, data, reporting, and policy work on sustainability topics.",
            [
                "Support research on climate, environment, energy, chemicals, waste, or green economy topics.",
                "Prepare evidence products, summaries, tables, or presentations.",
                "Assist with programme documentation and stakeholder materials.",
            ],
            [
                "Background or strong interest in environment, climate, energy, sustainability, or development.",
                "Research, writing, and data-handling skills.",
                "Ability to connect technical topics with policy or programme needs.",
            ],
        ),
        "Admin, Finance & HR": (
            "Operations role supporting administration, finance, HR, risk, compliance, audit, procurement, or office workflows.",
            [
                "Support documentation, tracking, and daily operational workflows.",
                "Assist with finance, HR, administration, risk, compliance, audit, or procurement tasks.",
                "Prepare records, tables, notes, and process follow-up material.",
            ],
            [
                "Organization, attention to detail, Excel, and documentation skills.",
                "Interest in operations, finance, HR, compliance, administration, or procurement.",
                "Ability to work carefully with procedures and records.",
            ],
        ),
    }
    summary, responsibilities, requirements = packs.get(category, packs["Programme & Project"])
    summary = f"{summary} Source: {source}. Location: {location or 'unspecified'}. Title signal: {title}."
    if "intern" not in title_text:
        responsibilities.append("Confirm internship eligibility on the official vacancy page.")
    return summary, responsibilities, requirements


def iso(value) -> str | None:
    return value.isoformat() if value else None


def convert(job) -> dict:
    title = clean_text(job.title)
    location = clean_text(job.location)
    source = clean_text(job.source or job.department or "UN")
    category = infer_category(title, source)
    summary, responsibilities, requirements = role_pack(title, category, source, location)
    return {
        "id": clean_text(job.job_opening_id),
        "title": title,
        "organization": source,
        "location": location or "Unspecified",
        "continent": infer_continent(location),
        "source": source,
        "category": category,
        "tags": tags_for(title, category),
        "deadline": iso(job.deadline_date) or "2026-07-06",
        "postedDate": iso(job.posted_date) or "2026-06-29",
        "status": "found",
        "appliedAt": None,
        "url": clean_text(job.apply_url),
        "summary": summary,
        "responsibilities": responsibilities,
        "requirements": requirements,
    }


def main() -> None:
    from un_intern_monitor.config import load_settings
    from un_intern_monitor.multi_scraper import fetch_unhcr_jobs, fetch_unicef_jobs, fetch_wfp_jobs
    from un_intern_monitor.scraper import fetch_internship_jobs

    today = date.today()
    settings = load_settings()
    jobs = []
    errors: list[str] = []
    for name, fetcher in [
        ("Inspira", lambda: fetch_internship_jobs(settings.search_url, settings.playwright_headless)),
        ("UNICEF", fetch_unicef_jobs),
        ("UNHCR", lambda: fetch_unhcr_jobs(today)),
        ("WFP", lambda: fetch_wfp_jobs(today)),
    ]:
        try:
            jobs.extend(fetcher())
        except Exception as exc:
            errors.append(f"{name}: {exc!r}")

    rows = [convert(job) for job in jobs]
    rows.sort(key=lambda item: (item["deadline"], item["organization"], item["title"]))

    if not rows and errors:
        raise RuntimeError("All sources failed; keeping the existing jobs-data.js unchanged.")

    payload = {
        "generatedAt": datetime.now().isoformat(timespec="seconds"),
        "errors": errors,
        "jobs": rows,
    }
    OUT_FILE.write_text(
        "window.UN_MONITOR_LIVE_JOBS = " + json.dumps(payload, ensure_ascii=False, indent=2) + ";\n",
        encoding="utf-8",
    )
    print(f"wrote {len(rows)} jobs to {OUT_FILE}")
    if errors:
        print("errors:")
        for error in errors:
            print("-", error)


if __name__ == "__main__":
    main()
