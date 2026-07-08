const fallbackUrl = "content.json";

const roleDescriptions = {
  vibe: "I translate real operational problems into logic, workflows, and AI-assisted prototypes.",
  data: "I analyze messy operational data, validate patterns, and turn field signals into structured insights.",
  web: "I am building toward AI-assisted web and internal tools development for dashboards, forms, and workflow tools."
};

let showAllExperience = false;
let showAllSkills = false;
let showAllCertifications = false;
let cachedExperience = [];
let cachedSkills = [];
let cachedCertifications = [];

function $(selector) { return document.querySelector(selector); }
function $all(selector) { return Array.from(document.querySelectorAll(selector)); }

function setText(selector, text) {
  const el = $(selector);
  if (el && text) el.textContent = text;
}

function escapeHtml(str = "") {
  return String(str).replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}

async function loadData() {
  const url = window.CMS_URL && window.CMS_URL.trim() ? window.CMS_URL.trim() : fallbackUrl;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to load CMS data");
    return await res.json();
  } catch (err) {
    console.warn("Could not load CMS data. Using local fallback.", err);
    const res = await fetch(fallbackUrl);
    return await res.json();
  }
}

function renderProfile(profile) {
  if (!profile) return;
  document.title = `${profile.name || "Portfolio CV"} — ${profile.title || ""}`;
  $all("[data-field='name']").forEach(el => el.textContent = profile.name || "Your Name");
  $all("[data-field='tagline']").forEach(el => el.textContent = profile.tagline || "");
  $all("[data-field='headline']").forEach(el => el.textContent = profile.headline || "");
  $all("[data-field='summary']").forEach(el => el.textContent = profile.summary || "");
  $all("[data-field='contactHeadline']").forEach(el => el.textContent = profile.contactHeadline || "");
  $all("[data-field='contactText']").forEach(el => el.textContent = profile.contactText || "");
}

function renderMetrics(metrics = []) {
  $("#metricsGrid").innerHTML = metrics.map(item => `
    <article class="metric-card reveal">
      <strong>${escapeHtml(item.value)}</strong>
      <h3>${escapeHtml(item.label)}</h3>
      <p>${escapeHtml(item.description)}</p>
    </article>
  `).join("");
}

function renderQuickScan(items = []) {
  const grid = $("#quickScanGrid");
  if (!grid) return;
  grid.innerHTML = items.map((item, index) => `
    <article class="quick-card reveal">
      <span>0${index + 1}</span>
      <h3>${escapeHtml(item.label)}</h3>
      <strong>${escapeHtml(item.value)}</strong>
      <p>${escapeHtml(item.note)}</p>
    </article>
  `).join("");
}

function renderProofMap(items = []) {
  const grid = $("#proofMapGrid");
  if (!grid) return;
  grid.innerHTML = items.map((item, index) => `
    <article class="proof-step reveal">
      <span>${escapeHtml(item.stage)}</span>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.description)}</p>
      ${index < items.length - 1 ? '<div class="flow-arrow">→</div>' : ''}
    </article>
  `).join("");
}

function renderRoleFit(items = []) {
  $("#roleFitGrid").innerHTML = items.map(item => `
    <article class="fit-card reveal">
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.description)}</p>
    </article>
  `).join("");
}

function renderProjects(projects = []) {
  $("#projectList").innerHTML = projects.map((project, index) => {
    const tools = String(project.tools || "").split(",").map(t => t.trim()).filter(Boolean);
    return `
      <article class="project-card reveal">
        <div>
          <p class="project-tag">${escapeHtml(project.tag)}</p>
          <h3>${escapeHtml(project.title)}</h3>
          <p>${escapeHtml(project.description)}</p>

          <details class="case-details" ${index === 0 ? "open" : ""}>
            <summary>Why this matters</summary>
            <div class="case-grid">
              <div><strong>Problem</strong><p>${escapeHtml(project.problem)}</p></div>
              <div><strong>Approach</strong><p>${escapeHtml(project.approach)}</p></div>
              <div><strong>Evidence</strong><p>${escapeHtml(project.evidence)}</p></div>
            </div>
          </details>
        </div>
        <div class="project-meta">
          ${tools.map(tool => `<span>${escapeHtml(tool)}</span>`).join("")}
        </div>
      </article>
    `;
  }).join("");
}

function renderExperience(items = []) {
  cachedExperience = items;
  const defaultCount = window.innerWidth <= 700 ? 2 : 3;
  const visibleItems = showAllExperience ? items : items.slice(0, defaultCount);

  $("#experienceTimeline").innerHTML = visibleItems.map((item, index) => {
    const bullets = String(item.bullets || "").split("|").map(b => b.trim()).filter(Boolean);
    const shortBullets = showAllExperience ? bullets : bullets.slice(0, 4);
    return `
      <article class="timeline-item reveal ${index > 2 ? "extra-experience" : ""}">
        <div class="timeline-date">${escapeHtml(item.period)}</div>
        <div class="timeline-content">
          <h3>${escapeHtml(item.role)} — ${escapeHtml(item.company)}</h3>
          <ul>${shortBullets.map(b => `<li>${escapeHtml(b)}</li>`).join("")}</ul>
        </div>
      </article>
    `;
  }).join("");

  const toggle = $("#toggleExperience");
  if (toggle) {
    if (items.length <= 3) {
      toggle.style.display = "none";
    } else {
      toggle.style.display = "inline-flex";
      toggle.textContent = showAllExperience ? "Show less" : `See more experience (${items.length - defaultCount} more)`;
    }
  }

  observeReveals();
}

function renderSkills(items = []) {
  cachedSkills = items;
  const defaultCount = window.innerWidth <= 700 ? 2 : 4;
  const visibleItems = showAllSkills ? items : items.slice(0, defaultCount);

  $("#skillsGrid").innerHTML = visibleItems.map(item => `
    <article class="skill-box reveal">
      <h3>${escapeHtml(item.category)}</h3>
      <p>${escapeHtml(item.items)}</p>
    </article>
  `).join("");

  const toggle = $("#toggleSkills");
  if (toggle) {
    if (items.length <= defaultCount) {
      toggle.style.display = "none";
    } else {
      toggle.style.display = "inline-flex";
      toggle.textContent = showAllSkills ? "Show less" : `See more skills (${items.length - defaultCount} more)`;
    }
  }

  observeReveals();
}

function renderCertifications(items = []) {
  cachedCertifications = items;
  const defaultCount = window.innerWidth <= 700 ? 2 : 3;
  const visibleItems = showAllCertifications ? items : items.slice(0, defaultCount);

  $("#certificationGrid").innerHTML = visibleItems.map(item => `
    <article class="cert-card reveal">
      <h3>${escapeHtml(item.name)}</h3>
      <p>${escapeHtml(item.issuer)} • ${escapeHtml(item.date)}</p>
      <small>Credential: ${escapeHtml(item.credential)}</small>
    </article>
  `).join("");

  const toggle = $("#toggleCertifications");
  if (toggle) {
    if (items.length <= defaultCount) {
      toggle.style.display = "none";
    } else {
      toggle.style.display = "inline-flex";
      toggle.textContent = showAllCertifications ? "Show less" : `See more certifications (${items.length - defaultCount} more)`;
    }
  }

  observeReveals();
}

function renderLinks(items = []) {
  $("#contactLinks").innerHTML = items.map(item => `
    <a href="${escapeHtml(item.url)}" target="${String(item.url).startsWith("mailto:") ? "_self" : "_blank"}" rel="noopener">${escapeHtml(item.label)}</a>
  `).join("");
}

function drawCapabilityChart(items = []) {
  const canvas = $("#capabilityChart");
  if (!canvas || !items.length) return;
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = canvas.clientWidth || 600;
  const cssHeight = Math.round(cssWidth * 0.6);
  canvas.width = cssWidth * dpr;
  canvas.height = cssHeight * dpr;
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, cssWidth, cssHeight);

  const padding = { top: 18, right: 34, bottom: 36, left: 152 };
  const chartW = cssWidth - padding.left - padding.right;
  const rowH = (cssHeight - padding.top - padding.bottom) / items.length;

  ctx.font = "700 13px Inter, system-ui, sans-serif";
  ctx.textBaseline = "middle";

  items.forEach((item, i) => {
    const y = padding.top + i * rowH + rowH / 2;
    const barH = Math.min(28, rowH * 0.48);
    const value = Number(item.value) || 0;
    const barW = chartW * Math.min(value, 100) / 100;

    ctx.fillStyle = "#657180";
    ctx.fillText(item.label, 0, y);

    ctx.fillStyle = "rgba(31,41,51,0.09)";
    roundRect(ctx, padding.left, y - barH / 2, chartW, barH, 999);
    ctx.fill();

    const gradient = ctx.createLinearGradient(padding.left, 0, padding.left + chartW, 0);
    gradient.addColorStop(0, "#b13c2f");
    gradient.addColorStop(1, "#2f6f73");
    ctx.fillStyle = gradient;
    roundRect(ctx, padding.left, y - barH / 2, barW, barH, 999);
    ctx.fill();

    ctx.fillStyle = "#1f2933";
    ctx.font = "800 13px Inter, system-ui, sans-serif";
    ctx.fillText(`${value}%`, padding.left + chartW + 10, y);
    ctx.font = "700 13px Inter, system-ui, sans-serif";
  });
}

function drawRoleEvidenceChart() {
  const canvas = $("#roleEvidenceChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = canvas.clientWidth || 520;
  const cssHeight = Math.max(300, Math.round(cssWidth * 0.75));
  canvas.width = cssWidth * dpr;
  canvas.height = cssHeight * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, cssWidth, cssHeight);

  const cx = cssWidth / 2;
  const cy = cssHeight / 2 + 12;
  const maxR = Math.min(cssWidth, cssHeight) * 0.34;

  const axes = [
    { label: "Data", value: 90, angle: -Math.PI / 2 },
    { label: "Ops", value: 85, angle: -Math.PI / 2 + (2 * Math.PI / 5) },
    { label: "GIS", value: 90, angle: -Math.PI / 2 + (4 * Math.PI / 5) },
    { label: "AI", value: 65, angle: -Math.PI / 2 + (6 * Math.PI / 5) },
    { label: "Web", value: 40, angle: -Math.PI / 2 + (8 * Math.PI / 5) }
  ];

  ctx.strokeStyle = "rgba(31,41,51,0.12)";
  ctx.lineWidth = 1;

  [0.33, 0.66, 1].forEach(scale => {
    ctx.beginPath();
    axes.forEach((axis, i) => {
      const x = cx + Math.cos(axis.angle) * maxR * scale;
      const y = cy + Math.sin(axis.angle) * maxR * scale;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();
  });

  axes.forEach(axis => {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(axis.angle) * maxR, cy + Math.sin(axis.angle) * maxR);
    ctx.stroke();

    const lx = cx + Math.cos(axis.angle) * (maxR + 28);
    const ly = cy + Math.sin(axis.angle) * (maxR + 28);
    ctx.fillStyle = "#1f2933";
    ctx.font = "800 13px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(axis.label, lx, ly);
  });

  const gradient = ctx.createRadialGradient(cx, cy, 8, cx, cy, maxR);
  gradient.addColorStop(0, "rgba(177,60,47,0.45)");
  gradient.addColorStop(1, "rgba(47,111,115,0.28)");

  ctx.beginPath();
  axes.forEach((axis, i) => {
    const r = maxR * axis.value / 100;
    const x = cx + Math.cos(axis.angle) * r;
    const y = cy + Math.sin(axis.angle) * r;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.strokeStyle = "#b13c2f";
  ctx.lineWidth = 2;
  ctx.stroke();

  axes.forEach(axis => {
    const r = maxR * axis.value / 100;
    const x = cx + Math.cos(axis.angle) * r;
    const y = cy + Math.sin(axis.angle) * r;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#b13c2f";
    ctx.fill();
  });

  ctx.textAlign = "center";
  ctx.fillStyle = "#657180";
  ctx.font = "700 12px Inter, system-ui, sans-serif";
  ctx.fillText("Evidence strength by role area", cx, 20);
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, h / 2, w / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function observeReveals() {
  observeReveals();
}

function initInteractions() {
  $all(".role-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      $all(".role-tab").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      $("#roleDescription").textContent = roleDescriptions[btn.dataset.role] || roleDescriptions.vibe;
    });
  });

  const toggleExperience = $("#toggleExperience");
  if (toggleExperience) {
    toggleExperience.addEventListener("click", () => {
      showAllExperience = !showAllExperience;
      renderExperience(cachedExperience);
    });
  }

  const toggleSkills = $("#toggleSkills");
  if (toggleSkills) {
    toggleSkills.addEventListener("click", () => {
      showAllSkills = !showAllSkills;
      renderSkills(cachedSkills);
    });
  }

  const toggleCertifications = $("#toggleCertifications");
  if (toggleCertifications) {
    toggleCertifications.addEventListener("click", () => {
      showAllCertifications = !showAllCertifications;
      renderCertifications(cachedCertifications);
    });
  }

  const menuButton = $(".menu-button");
  const navLinks = $(".nav-links");
  if (menuButton && navLinks) {
    menuButton.addEventListener("click", () => navLinks.classList.toggle("open"));
  }

  observeReveals();
}

async function main() {
  const data = await loadData();
  renderProfile(data.profile);
  renderQuickScan(data.quickScan);
  renderMetrics(data.metrics);
  renderRoleFit(data.roleFit);
  renderProofMap(data.proofMap);
  renderProjects(data.projects);
  renderExperience(data.experience);
  renderSkills(data.skills);
  renderCertifications(data.certifications);
  renderLinks(data.links);
  drawCapabilityChart(data.capabilities);
    drawRoleEvidenceChart();
  drawRoleEvidenceChart();
  $("#year").textContent = new Date().getFullYear();
  initInteractions();
}

window.addEventListener("resize", async () => {
  try {
    const data = await loadData();
    drawCapabilityChart(data.capabilities);
  drawRoleEvidenceChart();
  } catch (e) {}
});

main();
