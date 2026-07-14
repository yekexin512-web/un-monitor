const categories = [
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
];

const categoryAliases = {
  "Economics / Policy / Development": "Economics & Development",
  "Data / Statistics / Analytics": "Data & Analytics",
  "Technology / Software / Digital": "Tech & Digital",
  "Communications / Media / Advocacy": "Communications & Advocacy",
  "Programme / Project Support": "Programme & Project",
  "Humanitarian / Social Policy": "Humanitarian & Protection",
  "Partnerships / External Relations": "Partnerships",
  "Legal / Human Rights / Governance": "Legal & Human Rights",
  "Environment / Climate / Energy": "Climate & Environment",
  "Operations / HR / Administration / Finance": "Admin, Finance & HR",
};

const statusLabels = {
  found: "Found",
  applied: "Applied",
  assessment: "Assessment",
  interview: "Interview",
  rejected: "Reject",
};

const allowedStatuses = Object.keys(statusLabels);
const dashboardStatuses = ["found", "applied", "assessment", "interview", "rejected"];
const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
const unicefSearchUrl = "https://jobs.unicef.org/en-us/search/?search-keyword=internship";

const continentKeywords = {
  Africa: [
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
  Asia: [
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
  Europe: [
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
  "South America": ["argentina", "brazil", "chile", "colombia", "peru", "santiago", "sao paulo", "são paulo"],
  Oceania: ["australia", "new zealand", "fiji", "samoa"],
  "Remote / Global": ["remote", "home-based", "home based", "multiple", "global", "various"],
};

const sampleJobs = [
  {
    id: "unicef-594069",
    title: "Batch Internship - Budget Transparency, Social Accountability and Citizen Engagement",
    organization: "UNICEF",
    location: "Nampula and Zambezia, Mozambique",
    source: "UNICEF Careers",
    category: "Economics / Policy / Development",
    tags: ["public finance", "governance", "data analysis", "education"],
    deadline: "2026-07-03",
    postedDate: "2026-06-25",
    fitScore: 93,
    status: "found",
    appliedAt: null,
    url: "https://jobs.unicef.org/en-us/job/594069/batch-internship-budget-transparency-social-accountability-and-citizen-engagement-nampula-and-zambezia-mozambique",
    summary:
      "Paid six-month internship supporting budget transparency, public financial management, school accountability, community engagement, and education-sector monitoring.",
    responsibilities: [
      "Develop citizen-friendly budget and planning information for schools and communities.",
      "Support school-level accountability and transparency tools.",
      "Collect, compile, and analyze data on education financing and service delivery.",
      "Prepare briefing notes, reports, presentations, evidence products, and donor reporting materials.",
    ],
    requirements: [
      "Undergraduate, graduate, or recent graduate within the past two years.",
      "Background in Economics, Public Policy, Public Finance, Governance, Statistics, Education Planning, or Social Sciences.",
      "Experience or interest in data collection, research, analysis, and Microsoft Office.",
      "English plus Portuguese required.",
    ],
  },
  {
    id: "unicef-594064",
    title: "Internship - Child Protection Section, Migration Programme",
    organization: "UNICEF",
    location: "Rabat, Morocco",
    source: "UNICEF Careers",
    category: "Humanitarian / Social Policy",
    tags: ["migration", "child protection", "programme support"],
    deadline: "2026-07-05",
    postedDate: "2026-06-25",
    fitScore: 72,
    status: "found",
    appliedAt: null,
    url: "https://jobs.unicef.org/en-us/job/594064/internship-section-protection-de-lenfance-programme-migration-rabat-maroc-3-mois",
    summary:
      "Three-month internship supporting the migration programme and child protection work in Morocco.",
    responsibilities: [
      "Support ongoing programme implementation and follow-up.",
      "Assist the Migration Programme Officer with documentation and coordination.",
      "Contribute to child protection and migration-related programme tracking.",
    ],
    requirements: ["Relevant academic background.", "French language likely required.", "Interest in migration, protection, and programme support."],
  },
  {
    id: "unicef-593651",
    title: "National Intern: Advocacy Research",
    organization: "UNICEF",
    location: "Accra, Ghana",
    source: "UNICEF Careers",
    category: "Communications / Media / Advocacy",
    tags: ["advocacy", "research", "policy trends"],
    deadline: "2026-07-06",
    postedDate: "2026-06-25",
    fitScore: 78,
    status: "found",
    appliedAt: null,
    url: "https://jobs.unicef.org/en-us/job/593651/national-intern-advocacy-research-accra-ghana-26-weeks",
    summary:
      "Research-focused advocacy internship generating evidence and analyzing policy/development trends for UNICEF Ghana.",
    responsibilities: [
      "Conduct advocacy research and synthesize policy and development trends.",
      "Generate evidence to inform advocacy strategies and decision-making.",
      "Support written outputs and briefing material for advocacy work.",
    ],
    requirements: ["Research skills.", "Strong writing and analytical ability.", "Interest in advocacy and development policy."],
  },
  {
    id: "unicef-niger-health-nutrition",
    title: "Intern - Health and Nutrition Assistant",
    organization: "UNICEF",
    location: "Agadez, Niger",
    source: "UNICEF Careers",
    category: "Humanitarian / Social Policy",
    tags: ["health", "nutrition", "programme"],
    deadline: "2026-06-30",
    postedDate: "2026-06-24",
    fitScore: 58,
    status: "found",
    appliedAt: null,
    url: unicefSearchUrl,
    summary: "Support implementation of the 2026 annual work plan in the health and nutrition sector in Agadez.",
    responsibilities: ["Support health and nutrition programme activities.", "Assist monitoring and documentation.", "Coordinate with programme staff."],
    requirements: ["Relevant health, nutrition, development, or programme background.", "French likely required."],
  },
  {
    id: "unicef-niger-programme",
    title: "Intern - Programme Assistant",
    organization: "UNICEF",
    location: "Agadez, Niger",
    source: "UNICEF Careers",
    category: "Programme / Project Support",
    tags: ["programme", "operations", "coordination"],
    deadline: "2026-06-30",
    postedDate: "2026-06-24",
    fitScore: 70,
    status: "found",
    appliedAt: null,
    url: unicefSearchUrl,
    summary: "Support programmatic and operational activities under the Agadez field office.",
    responsibilities: ["Assist programme implementation.", "Support operational follow-up.", "Prepare simple documentation and activity tracking."],
    requirements: ["Programme support skills.", "Coordination and documentation ability.", "French likely required."],
  },
  {
    id: "unicef-niger-emergency",
    title: "Intern - Emergency Assistant",
    organization: "UNICEF",
    location: "Niamey, Niger",
    source: "UNICEF Careers",
    category: "Humanitarian / Social Policy",
    tags: ["emergency", "humanitarian", "coordination"],
    deadline: "2026-06-30",
    postedDate: "2026-06-24",
    fitScore: 64,
    status: "found",
    appliedAt: null,
    url: unicefSearchUrl,
    summary:
      "Support emergency preparedness, coordination, and implementation of humanitarian response for children and families affected by crises.",
    responsibilities: ["Support preparedness activities.", "Assist inter-sector coordination.", "Track emergency response activities against humanitarian standards."],
    requirements: ["Interest in humanitarian response.", "Coordination and monitoring skills.", "French likely required."],
  },
  {
    id: "unicef-niger-education-data",
    title: "Intern - Education Programme Assistant",
    organization: "UNICEF",
    location: "Niamey, Niger",
    source: "UNICEF Careers",
    category: "Data / Statistics / Analytics",
    tags: ["education", "data collection", "information management"],
    deadline: "2026-06-30",
    postedDate: "2026-06-24",
    fitScore: 82,
    status: "found",
    appliedAt: null,
    url: unicefSearchUrl,
    summary: "Support data collection and consolidation for the Education section and information management for the Education Cluster.",
    responsibilities: ["Collect and consolidate education data.", "Support information management.", "Assist education programme reporting."],
    requirements: ["Data handling skills.", "Education or programme background.", "French likely required."],
  },
  {
    id: "unicef-niger-communications",
    title: "Intern - Institutional Communication, Advocacy and Media Relations",
    organization: "UNICEF",
    location: "Niamey, Niger",
    source: "UNICEF Careers",
    category: "Communications / Media / Advocacy",
    tags: ["communications", "advocacy", "media relations"],
    deadline: "2026-06-30",
    postedDate: "2026-06-24",
    fitScore: 67,
    status: "found",
    appliedAt: null,
    url: unicefSearchUrl,
    summary: "Support media relations, institutional content production, event coverage, and visibility of UNICEF actions in Niger.",
    responsibilities: ["Prepare communication content.", "Support events and media relations.", "Track visibility and advocacy activities."],
    requirements: ["Writing and communication skills.", "Interest in media relations and advocacy.", "French likely required."],
  },
  {
    id: "unicef-niger-digital-impact",
    title: "Intern - Digital Impact Assistant",
    organization: "UNICEF",
    location: "Niamey, Niger",
    source: "UNICEF Careers",
    category: "Technology / Software / Digital",
    tags: ["digital", "technology", "ICT"],
    deadline: "2026-06-30",
    postedDate: "2026-06-24",
    fitScore: 84,
    status: "found",
    appliedAt: null,
    url: unicefSearchUrl,
    summary: "Support digital initiatives and deployment of technology solutions under UNICEF Niger ICT work.",
    responsibilities: ["Assist digital-impact initiatives.", "Support technology solution rollout.", "Document digital implementation activities."],
    requirements: ["ICT or digital background.", "Strong documentation and support skills.", "French likely required."],
  },
  {
    id: "unicef-niger-risk-compliance",
    title: "Intern - Risk and Compliance Assistant",
    organization: "UNICEF",
    location: "Niamey, Niger",
    source: "UNICEF Careers",
    category: "Operations / HR / Administration / Finance",
    tags: ["risk", "compliance", "finance"],
    deadline: "2026-06-30",
    postedDate: "2026-06-24",
    fitScore: 60,
    status: "found",
    appliedAt: null,
    url: unicefSearchUrl,
    summary: "Support the finance team with risk and compliance tasks.",
    responsibilities: ["Assist compliance follow-up.", "Support risk documentation.", "Help finance team track required controls."],
    requirements: ["Finance or administration interest.", "Detail orientation.", "French likely required."],
  },
  {
    id: "unicef-niger-admin",
    title: "Intern - Administrative Assistant",
    organization: "UNICEF",
    location: "Niamey, Niger",
    source: "UNICEF Careers",
    category: "Operations / HR / Administration / Finance",
    tags: ["administration", "operations"],
    deadline: "2026-06-30",
    postedDate: "2026-06-24",
    fitScore: 52,
    status: "found",
    appliedAt: null,
    url: unicefSearchUrl,
    summary: "Support the Administrative Services unit with daily administrative tasks.",
    responsibilities: ["Assist administrative execution.", "Support unit documentation.", "Help organize office processes."],
    requirements: ["Administration interest.", "Organization and documentation skills.", "French likely required."],
  },
  {
    id: "unicef-niger-finance",
    title: "Intern - Finance Assistant",
    organization: "UNICEF",
    location: "Niamey, Niger",
    source: "UNICEF Careers",
    category: "Operations / HR / Administration / Finance",
    tags: ["finance", "budget", "operations"],
    deadline: "2026-06-30",
    postedDate: "2026-06-24",
    fitScore: 66,
    status: "applied",
    appliedAt: "2026-06-28",
    url: unicefSearchUrl,
    summary: "Support the Finance Associate and finance unit with daily finance tasks.",
    responsibilities: ["Assist finance documentation.", "Support budget and payment process tracking.", "Maintain finance records."],
    requirements: ["Finance or accounting interest.", "Excel skills.", "French likely required."],
  },
  {
    id: "unicef-benin-info-management",
    title: "Intern - Information and Management System",
    organization: "UNICEF",
    location: "Parakou, Benin",
    source: "UNICEF Careers",
    category: "Data / Statistics / Analytics",
    tags: ["information management", "systems", "programme data"],
    deadline: "2026-06-30",
    postedDate: "2026-06-23",
    fitScore: 86,
    status: "assessment",
    appliedAt: "2026-06-27",
    url: unicefSearchUrl,
    summary: "Support programme and operational information management in UNICEF Benin's Parakou field office.",
    responsibilities: ["Support information systems.", "Organize programme data.", "Assist reporting and information management workflows."],
    requirements: ["Information management skills.", "Data organization ability.", "French likely required."],
  },
  {
    id: "unicef-benin-education-km",
    title: "Intern - Education Section, Knowledge Management",
    organization: "UNICEF",
    location: "Cotonou, Benin",
    source: "UNICEF Careers",
    category: "Programme / Project Support",
    tags: ["education", "knowledge management", "programme"],
    deadline: "2026-06-30",
    postedDate: "2026-06-23",
    fitScore: 74,
    status: "applied",
    appliedAt: "2026-06-26",
    url: unicefSearchUrl,
    summary: "Support knowledge management and implementation of the WEZIZA education programme in Benin.",
    responsibilities: ["Support education programme knowledge management.", "Document implementation progress.", "Assist programme reporting."],
    requirements: ["Education or development background.", "Knowledge management and writing skills.", "French likely required."],
  },
  {
    id: "unicef-benin-social-policy-finance",
    title: "Intern - Social Policy, Public Finance",
    organization: "UNICEF",
    location: "Cotonou, Benin",
    source: "UNICEF Careers",
    category: "Economics / Policy / Development",
    tags: ["social policy", "public finance", "research"],
    deadline: "2026-06-30",
    postedDate: "2026-06-23",
    fitScore: 90,
    status: "applied",
    appliedAt: "2026-06-25",
    url: unicefSearchUrl,
    summary: "Support UNICEF Benin's Social Policy section, with focus on public finance and development policy.",
    responsibilities: ["Assist social policy analysis.", "Support public finance research.", "Prepare programme notes and background material."],
    requirements: ["Public finance, economics, policy, or development background.", "Research and writing skills.", "French likely required."],
  },
  {
    id: "unicef-benin-community-data-tools",
    title: "Intern - Simplified Community Data Collection Tools",
    organization: "UNICEF",
    location: "Cotonou, Benin",
    source: "UNICEF Careers",
    category: "Data / Statistics / Analytics",
    tags: ["data collection", "community engagement", "tools"],
    deadline: "2026-06-30",
    postedDate: "2026-06-23",
    fitScore: 83,
    status: "found",
    appliedAt: null,
    url: unicefSearchUrl,
    summary: "Support development of simplified community data collection tools for programme feedback and rapid research.",
    responsibilities: ["Develop simplified data collection tools.", "Support community engagement data workflows.", "Document tool use and learning."],
    requirements: ["Data collection or research skills.", "Community engagement interest.", "French likely required."],
  },
  {
    id: "unicef-benin-digital-content",
    title: "Intern - Digital Content for Communities",
    organization: "UNICEF",
    location: "Cotonou, Benin",
    source: "UNICEF Careers",
    category: "Communications / Media / Advocacy",
    tags: ["digital content", "community", "communications"],
    deadline: "2026-06-30",
    postedDate: "2026-06-23",
    fitScore: 65,
    status: "found",
    appliedAt: null,
    url: unicefSearchUrl,
    summary: "Support creation of digital content adapted to communities in the child protection programme context.",
    responsibilities: ["Create community-oriented digital content.", "Support child-protection communication activities.", "Assist content documentation."],
    requirements: ["Digital content skills.", "Communication interest.", "French likely required."],
  },
  {
    id: "unicef-benin-admin",
    title: "Intern - Administration",
    organization: "UNICEF",
    location: "Cotonou, Benin",
    source: "UNICEF Careers",
    category: "Operations / HR / Administration / Finance",
    tags: ["administration", "operations"],
    deadline: "2026-06-30",
    postedDate: "2026-06-23",
    fitScore: 50,
    status: "found",
    appliedAt: null,
    url: unicefSearchUrl,
    summary: "Support UNICEF Benin operations section with administrative tasks.",
    responsibilities: ["Assist administrative processes.", "Support office documentation.", "Track routine operational tasks."],
    requirements: ["Administration interest.", "Organization skills.", "French likely required."],
  },
  {
    id: "unicef-benin-wash",
    title: "Intern - WASH in Institutions",
    organization: "UNICEF",
    location: "Cotonou, Benin",
    source: "UNICEF Careers",
    category: "Humanitarian / Social Policy",
    tags: ["WASH", "schools", "health centers"],
    deadline: "2026-06-30",
    postedDate: "2026-06-23",
    fitScore: 55,
    status: "found",
    appliedAt: null,
    url: unicefSearchUrl,
    summary: "Support WASH activities in schools and health centers under UNICEF Benin's child survival and development work.",
    responsibilities: ["Assist WASH programme activities.", "Support documentation and field follow-up.", "Contribute to programme reporting."],
    requirements: ["WASH, public health, development, or programme interest.", "French likely required."],
  },
  {
    id: "unicef-togo-architect",
    title: "Intern - Architect",
    organization: "UNICEF",
    location: "Lome, Togo",
    source: "UNICEF Careers",
    category: "Operations / HR / Administration / Finance",
    tags: ["architecture", "facilities", "technical"],
    deadline: "2026-07-03",
    postedDate: "2026-06-25",
    fitScore: 45,
    status: "found",
    appliedAt: null,
    url: unicefSearchUrl,
    summary: "Three-month architecture internship in Togo.",
    responsibilities: ["Support technical and facilities-related work.", "Assist documentation and coordination."],
    requirements: ["Architecture background.", "French likely required."],
  },
];

let state = loadState();
let selectedJobId = state.jobs[0]?.id;
let chartRange = 7;

function loadState() {
  const liveJobs = window.UN_MONITOR_LIVE_JOBS?.jobs;
  const liveGeneratedAt = window.UN_MONITOR_LIVE_JOBS?.generatedAt || "";
  const saved = localStorage.getItem("unmonitor-v2-state");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (
        Array.isArray(parsed.jobs) &&
        parsed.liveGeneratedAt === liveGeneratedAt &&
        parsed.jobs.length >= (liveJobs?.length || sampleJobs.length)
      ) {
        return {
          ...parsed,
          jobs: parsed.jobs.map(normalizeJob),
        };
      }
    } catch {
      localStorage.removeItem("unmonitor-v2-state");
    }
  }
  if (Array.isArray(liveJobs) && liveJobs.length) {
    return {
      liveGeneratedAt,
      jobs: liveJobs.map(normalizeJob),
      profile: {
        targets: "Economics, Data, Programme",
        skills: "Python, Excel, policy research, data visualization, SDGs, report writing",
        evidence: "Add reusable CV bullets and project examples here.",
      },
      draftNote: "",
    };
  }
  return {
    jobs: sampleJobs.map(normalizeJob),
    profile: {
      targets: "Economics, Data, Programme",
      skills: "Python, Excel, policy research, data visualization, SDGs, report writing",
      evidence: "Add reusable CV bullets and project examples here.",
    },
    draftNote: "",
  };
}

function normalizeJob(job) {
  const statusMap = {
    shortlisted: "found",
    drafting: "found",
    ready: "found",
    offer: "interview",
    reject: "rejected",
  };
  const status = statusMap[job.status] || job.status || "found";
  return {
    ...job,
    category: categoryAliases[job.category] || job.category || "Programme & Project",
    continent: job.continent || inferContinent(job.location),
    status: allowedStatuses.includes(status) ? status : "found",
  };
}

function inferContinent(location) {
  const text = String(location || "").toLowerCase();
  for (const [continent, keywords] of Object.entries(continentKeywords)) {
    if (keywords.some((keyword) => text.includes(keyword))) return continent;
  }
  return "Remote / Global";
}

function saveState() {
  localStorage.setItem("unmonitor-v2-state", JSON.stringify(state));
}

function parseDate(dateString) {
  return new Date(`${dateString}T12:00:00`);
}

function daysUntil(dateString) {
  return Math.ceil((parseDate(dateString) - today) / 86400000);
}

function daysSince(dateString) {
  return Math.floor((today - parseDate(dateString)) / 86400000);
}

function formatDeadline(dateString) {
  const days = daysUntil(dateString);
  if (days < 0) return `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return "Due today";
  return `Due in ${days}d`;
}

function setupNavigation() {
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
      document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
      button.classList.add("active");
      document.getElementById(`${button.dataset.view}-view`).classList.add("active");
      document.getElementById("view-title").textContent = button.textContent.trim();
    });
  });
}

function setupFilters() {
  const categoryFilter = document.getElementById("category-filter");
  const sourceFilter = document.getElementById("source-filter");
  const addCategory = document.getElementById("add-category");
  categories.forEach((category) => {
    categoryFilter.append(new Option(category, category));
    addCategory.append(new Option(category, category));
  });
  populateSourceFilter();
  ["job-search", "category-filter", "source-filter", "continent-filter", "status-filter", "posted-filter", "deadline-filter"].forEach((id) => {
    document.getElementById(id).addEventListener("input", renderOpportunities);
  });
}

function populateSourceFilter() {
  const sourceFilter = document.getElementById("source-filter");
  const currentValue = sourceFilter.value || "all";
  sourceFilter.innerHTML = '<option value="all">All sources</option>';
  getSources().forEach((source) => {
    sourceFilter.append(new Option(source, source));
  });
  sourceFilter.value = Array.from(sourceFilter.options).some((option) => option.value === currentValue)
    ? currentValue
    : "all";
}

function getSources() {
  return Array.from(new Set(state.jobs.map((job) => job.source).filter(Boolean))).sort();
}

function getFilteredJobs() {
  const query = document.getElementById("job-search").value.trim().toLowerCase();
  const category = document.getElementById("category-filter").value;
  const source = document.getElementById("source-filter").value;
  const continent = document.getElementById("continent-filter").value;
  const status = document.getElementById("status-filter").value;
  const posted = document.getElementById("posted-filter").value;
  const deadline = document.getElementById("deadline-filter").value;
  return state.jobs.filter((job) => {
    const searchText = [
      job.title,
      job.organization,
      job.location,
      job.source,
      job.category,
      job.summary,
      ...(job.tags || []),
      ...(job.responsibilities || []),
      ...(job.requirements || []),
    ]
      .join(" ")
      .toLowerCase();
    const postedDays = daysSince(job.postedDate);
    const dueDays = daysUntil(job.deadline);
    const postedMatch = posted === "all" || (posted === "today" && postedDays === 0) || (posted === "7" && postedDays >= 0 && postedDays <= 7);
    const deadlineMatch =
      deadline === "all" ||
      (deadline === "expired7" && dueDays < 0 && dueDays >= -7) ||
      (deadline === "tomorrow" && dueDays === 1) ||
      (deadline === "soon3" && dueDays >= 0 && dueDays <= 3) ||
      (deadline === "soon7" && dueDays >= 0 && dueDays <= 7) ||
      (deadline === "soon14" && dueDays >= 0 && dueDays <= 14);
    return (
      (!query || searchText.includes(query)) &&
      (category === "all" || job.category === category) &&
      (source === "all" || job.source === source) &&
      (continent === "all" || (job.continent || inferContinent(job.location)) === continent) &&
      (status === "all" || job.status === status) &&
      postedMatch &&
      deadlineMatch
    );
  });
}

function renderOpportunities() {
  const jobs = getFilteredJobs();
  const list = document.getElementById("job-list");
  document.getElementById("job-count").textContent = `${jobs.length} jobs`;
  list.innerHTML = "";
  jobs.forEach((job) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `job-card ${job.id === selectedJobId ? "selected" : ""}`;
    card.innerHTML = `
      <div class="job-card-top">
        <div>
          <h4>${escapeHtml(job.title)}</h4>
          <div class="job-meta">
            <span>${escapeHtml(job.organization)}</span>
            <span>${escapeHtml(job.location)}</span>
            <span>${escapeHtml(job.continent || inferContinent(job.location))}</span>
            <span>${escapeHtml(job.source)}</span>
          </div>
        </div>
      </div>
      <div class="job-tags">
        <span class="tag">${escapeHtml(job.category)}</span>
        ${daysUntil(job.deadline) <= 7 && daysUntil(job.deadline) >= 0 ? '<span class="tag urgent">Expiring soon</span>' : ""}
        ${daysUntil(job.deadline) < 0 ? '<span class="tag expired">Recently expired</span>' : ""}
        <span>Posted ${escapeHtml(job.postedDate)}</span>
        <span>${formatDeadline(job.deadline)}</span>
      </div>
    `;
    card.addEventListener("click", () => {
      selectedJobId = job.id;
      renderOpportunities();
      renderJobDetail();
    });
    list.append(card);
  });
  if (!jobs.some((job) => job.id === selectedJobId)) selectedJobId = jobs[0]?.id;
  renderJobDetail();
}

function renderJobDetail() {
  const detail = document.getElementById("job-detail");
  const job = state.jobs.find((item) => item.id === selectedJobId);
  if (!job) {
    detail.innerHTML = `<div class="empty-state"><h3>No matching jobs</h3><p>Adjust filters or add a job manually.</p></div>`;
    return;
  }
  detail.innerHTML = `
    <div class="detail-body">
      <div>
        <p class="eyebrow">${escapeHtml(job.source)}</p>
        <h3>${escapeHtml(job.title)}</h3>
      </div>
      <div class="job-meta">
        <span>${escapeHtml(job.organization)}</span>
        <span>${escapeHtml(job.location)}</span>
        <span>${escapeHtml(job.continent || inferContinent(job.location))}</span>
        <span>Posted ${escapeHtml(job.postedDate)}</span>
        <span>Deadline ${escapeHtml(job.deadline)}</span>
      </div>
      <div class="job-tags">
        <span class="tag">${escapeHtml(job.category)}</span>
        ${(job.tags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
      </div>
      <div class="action-block">
        <label>
          <span>Application status</span>
          <select class="status-select" id="detail-status">
            ${Object.entries(statusLabels)
              .map(([value, label]) => `<option value="${value}" ${job.status === value ? "selected" : ""}>${label}</option>`)
              .join("")}
          </select>
        </label>
        <div class="detail-actions">
          <button class="primary-btn" id="mark-applied" type="button">Mark applied</button>
          <a class="primary-btn apply-link" href="${escapeHtml(job.url)}" target="_blank" rel="noreferrer">Open JD / Apply</a>
          <button class="secondary-btn" id="send-studio" type="button">Open Studio</button>
        </div>
      </div>
      <section class="jd-section">
        <h4>JD summary</h4>
        <p>${escapeHtml(job.summary)}</p>
      </section>
      <section class="jd-section">
        <h4>Responsibilities</h4>
        <ul>${(job.responsibilities || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </section>
      <section class="jd-section">
        <h4>Requirements</h4>
        <ul>${(job.requirements || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </section>
    </div>
  `;
  document.getElementById("detail-status").addEventListener("change", (event) => updateJobStatus(job.id, event.target.value));
  document.getElementById("mark-applied").addEventListener("click", () => updateJobStatus(job.id, "applied", true));
  document.getElementById("send-studio").addEventListener("click", () => {
    document.querySelector('[data-view="studio"]').click();
    document.getElementById("draft-note").value =
      `Target role: ${job.title}\nOrganization: ${job.organization}\nJD link: ${job.url}\nJD focus: ${job.summary}`;
  });
}

function updateJobStatus(jobId, status, markDate = false) {
  const job = state.jobs.find((item) => item.id === jobId);
  if (!job) return;
  job.status = status;
  if (status === "applied" && (markDate || !job.appliedAt)) job.appliedAt = today.toISOString().slice(0, 10);
  saveState();
  renderAll();
}

function renderDashboard() {
  document.getElementById("metric-new-today").textContent = state.jobs.filter((job) => daysSince(job.postedDate) === 0).length;
  document.getElementById("metric-expiring").textContent = state.jobs.filter((job) => daysUntil(job.deadline) >= 0 && daysUntil(job.deadline) <= 7).length;
  const todayKey = today.toISOString().slice(0, 10);
  document.getElementById("metric-applied-today").textContent = state.jobs.filter((job) => job.appliedAt === todayKey).length;
  document.getElementById("metric-applied-30").textContent = state.jobs.filter((job) => job.appliedAt && daysSince(job.appliedAt) <= 30).length;
  document.getElementById("metric-applied-total").textContent = state.jobs.filter((job) => job.appliedAt || job.status === "applied").length;
  renderApplicationChart();
  renderCategoryChart();
  renderKanban();
}

function renderLastUpdated() {
  const stamp = document.getElementById("last-updated");
  const generatedAt = window.UN_MONITOR_LIVE_JOBS?.generatedAt;
  const errors = window.UN_MONITOR_LIVE_JOBS?.errors || [];
  if (!stamp) return;
  if (!generatedAt) {
    stamp.textContent = "Last updated: demo data";
    return;
  }
  const formatted = new Date(generatedAt).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  stamp.textContent = `Last updated: ${formatted}${errors.length ? ` (${errors.length} source warning${errors.length > 1 ? "s" : ""})` : ""}`;
}

function renderApplicationChart() {
  const chart = document.getElementById("application-chart");
  chart.innerHTML = "";
  const days = Array.from({ length: chartRange }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (chartRange - index - 1));
    const key = date.toISOString().slice(0, 10);
    return { key, count: state.jobs.filter((job) => job.appliedAt === key).length, label: `${date.getMonth() + 1}/${date.getDate()}` };
  });
  const max = Math.max(1, ...days.map((item) => item.count));
  days.forEach((item) => {
    const wrap = document.createElement("div");
    wrap.className = "bar-wrap";
    const height = item.count ? Math.max(8, (item.count / max) * 190) : 0;
    wrap.innerHTML = `
      <span class="bar-count">${item.count}</span>
      <div class="bar-slot">
        <div class="bar ${item.count ? "" : "zero"}" style="height:${height}px"></div>
      </div>
      <span class="bar-label">${item.label}</span>
    `;
    chart.append(wrap);
  });
}

function renderCategoryChart() {
  const chart = document.getElementById("category-chart");
  chart.innerHTML = "";
  const counts = categories
    .map((category) => ({ category, count: state.jobs.filter((job) => job.category === category && (job.appliedAt || job.status === "applied")).length }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);
  const max = Math.max(1, ...counts.map((item) => item.count));
  if (!counts.length) {
    chart.innerHTML = '<p class="empty-state">No submitted applications yet.</p>';
    return;
  }
  counts.forEach((item) => {
    const row = document.createElement("div");
    row.className = "category-row";
    row.innerHTML = `
      <div class="category-row-top"><strong>${escapeHtml(item.category)}</strong><span>${item.count}</span></div>
      <div class="progress-track"><div class="progress-fill" style="width:${(item.count / max) * 100}%"></div></div>
    `;
    chart.append(row);
  });
}

function renderKanban() {
  const board = document.getElementById("kanban");
  board.innerHTML = "";
  dashboardStatuses.forEach((status) => {
    const col = document.createElement("section");
    col.className = "kanban-col";
    const jobs = state.jobs.filter((job) => job.status === status);
    col.innerHTML = `<h4>${statusLabels[status]} · ${jobs.length}</h4>`;
    jobs.forEach((job) => {
      const card = document.createElement("div");
      card.className = "kanban-card";
      card.innerHTML = `<strong>${escapeHtml(job.title)}</strong><span>${escapeHtml(job.organization)}</span><div class="job-tags"><span>${formatDeadline(job.deadline)}</span></div>`;
      col.append(card);
    });
    board.append(col);
  });
}

function setupCharts() {
  document.querySelectorAll(".segmented button").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".segmented button").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      chartRange = Number(button.dataset.range);
      renderApplicationChart();
    });
  });
}

function setupForms() {
  const dialog = document.getElementById("add-job-dialog");
  document.getElementById("open-add-job").addEventListener("click", () => dialog.showModal());
  document.getElementById("add-job-form").addEventListener("submit", (event) => {
    if (event.submitter?.value === "cancel") return;
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const summary = data.get("summary");
    const category = data.get("category");
    const job = {
      id: `job-${Date.now()}`,
      title: data.get("title"),
      organization: data.get("organization"),
      category,
      location: data.get("location"),
      continent: inferContinent(data.get("location")),
      deadline: data.get("deadline"),
      summary,
      source: "Manual",
      postedDate: today.toISOString().slice(0, 10),
      fitScore: guessFitScore(summary, category),
      status: "found",
      appliedAt: null,
      url: "#",
      tags: guessTags(summary),
      responsibilities: ["Review the pasted JD and add responsibilities here in the next backend version."],
      requirements: ["Review the pasted JD and add requirements here in the next backend version."],
    };
    state.jobs.unshift(job);
    selectedJobId = job.id;
    saveState();
    dialog.close();
    event.currentTarget.reset();
    renderAll();
  });
  document.getElementById("profile-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    state.profile = { targets: data.get("targets"), skills: data.get("skills"), evidence: data.get("evidence") };
    saveState();
  });
  document.getElementById("save-draft-note").addEventListener("click", () => {
    state.draftNote = document.getElementById("draft-note").value;
    saveState();
  });
  document.getElementById("reset-demo").addEventListener("click", () => {
    localStorage.removeItem("unmonitor-v2-state");
    state = loadState();
    selectedJobId = state.jobs[0]?.id;
    hydrateProfile();
    renderAll();
  });
}

function guessFitScore(summary, category) {
  const text = `${summary} ${category}`.toLowerCase();
  let score = 55;
  ["python", "data", "economic", "policy", "finance", "dashboard", "research", "digital"].forEach((word) => {
    if (text.includes(word)) score += 6;
  });
  return Math.min(94, score);
}

function guessTags(summary) {
  const text = String(summary || "").toLowerCase();
  return ["Python", "data", "policy", "research", "communications", "dashboard", "SDGs", "finance", "digital"].filter((tag) =>
    text.includes(tag.toLowerCase()),
  );
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function hydrateProfile() {
  const form = document.getElementById("profile-form");
  form.elements.targets.value = state.profile.targets;
  form.elements.skills.value = state.profile.skills;
  form.elements.evidence.value = state.profile.evidence;
  document.getElementById("draft-note").value = state.draftNote;
}

function renderAll() {
  renderLastUpdated();
  populateSourceFilter();
  renderOpportunities();
  renderDashboard();
}

setupNavigation();
setupFilters();
setupCharts();
setupForms();
hydrateProfile();
renderAll();
