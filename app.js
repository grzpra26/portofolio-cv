const fallbackUrl = "content.json";
const CACHE_KEY = "livePortfolioCmsData";
const CMS_TIMEOUT_MS = 3500;

function $(selector) { return document.querySelector(selector); }
function $all(selector) { return Array.from(document.querySelectorAll(selector)); }

function escapeHtml(str = "") {
  return String(str).replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}

async function fetchJsonWithTimeout(url, timeoutMs = CMS_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      cache: "no-store"
    });
    if (!res.ok) throw new Error(`Failed to load ${url}`);
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function loadLocalData() {
  const res = await fetch(fallbackUrl, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load local content.json");
  return await res.json();
}

function getCachedCmsData() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch (err) {
    return null;
  }
}

function setCachedCmsData(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (err) {}
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

function renderRoleSwitcher(items = []) {
  const tabs = $("#roleTabs");
  const desc = $("#roleDescription");
  if (!tabs || !desc) return;

  const cleanItems = items.length ? items : [
    {
      key: "vibe",
      label: "Vibe Coding",
      description: "I translate real operational problems into logic, workflows, and AI-assisted prototypes."
    }
  ];

  tabs.innerHTML = cleanItems.map((item, index) => `
    <button class="role-tab ${index === 0 ? "active" : ""}" data-index="${index}">
      ${escapeHtml(item.label)}
    </button>
  `).join("");

  desc.textContent = cleanItems[0]?.description || "";

  $all(".role-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      $all(".role-tab").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const item = cleanItems[Number(btn.dataset.index)];
      desc.textContent = item?.description || "";
    });
  });
}

function renderMetrics(metrics = []) {
  const target = $("#metricsGrid");
  if (!target) return;
  target.innerHTML = metrics.map(item => `
    <article class="metric-card reveal visible">
      <strong>${escapeHtml(item.value)}</strong>
      <h3>${escapeHtml(item.label)}</h3>
      <p>${escapeHtml(item.description)}</p>
    </article>
  `).join("");
}

function renderRoleFit(items = []) {
  const target = $("#roleFitGrid");
  if (!target) return;
  target.innerHTML = items.map(item => `
    <article class="fit-card reveal visible">
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.description)}</p>
    </article>
  `).join("");
}

function renderProjects(projects = []) {
  const target = $("#projectList");
  if (!target) return;
  target.innerHTML = projects.map(project => {
    const tools = String(project.tools || "").split(",").map(t => t.trim()).filter(Boolean);
    return `
      <article class="project-card reveal visible">
        <div>
          <p class="project-tag">${escapeHtml(project.tag)}</p>
          <h3>${escapeHtml(project.title)}</h3>
          <p>${escapeHtml(project.description)}</p>
        </div>
        <div class="project-meta">
          ${tools.map(tool => `<span>${escapeHtml(tool)}</span>`).join("")}
        </div>
      </article>
    `;
  }).join("");
}

function renderExperience(items = []) {
  const target = $("#experienceTimeline");
  if (!target) return;
  target.innerHTML = items.map(item => {
    const bullets = String(item.bullets || "").split("|").map(b => b.trim()).filter(Boolean);
    return `
      <article class="timeline-item reveal visible">
        <div class="timeline-date">${escapeHtml(item.period)}</div>
        <div class="timeline-content">
          <h3>${escapeHtml(item.role)} — ${escapeHtml(item.company)}</h3>
          <ul>${bullets.map(b => `<li>${escapeHtml(b)}</li>`).join("")}</ul>
        </div>
      </article>
    `;
  }).join("");
}

function renderSkills(items = []) {
  const target = $("#skillsGrid");
  if (!target) return;
  target.innerHTML = items.map(item => `
    <article class="skill-box reveal visible">
      <h3>${escapeHtml(item.category)}</h3>
      <p>${escapeHtml(item.items)}</p>
    </article>
  `).join("");
}

function renderCertifications(items = []) {
  const target = $("#certificationGrid");
  if (!target) return;
  target.innerHTML = items.map(item => `
    <article class="cert-card reveal visible">
      <h3>${escapeHtml(item.name)}</h3>
      <p>${escapeHtml(item.issuer)} • ${escapeHtml(item.date)}</p>
      <small>Credential: ${escapeHtml(item.credential)}</small>
    </article>
  `).join("");
}

function renderLinks(items = []) {
  const target = $("#contactLinks");
  if (!target) return;
  target.innerHTML = items.map(item => `
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

function renderAll(data) {
  if (!data) return;
  renderProfile(data.profile);
  renderRoleSwitcher(data.roleSwitcher);
  renderMetrics(data.metrics);
  renderRoleFit(data.roleFit);
  renderProjects(data.projects);
  renderExperience(data.experience);
  renderSkills(data.skills);
  renderCertifications(data.certifications);
  renderLinks(data.links);
  drawCapabilityChart(data.capabilities);
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();
}

function initInteractions() {
  const menuButton = $(".menu-button");
  const navLinks = $(".nav-links");
  if (menuButton && navLinks) {
    menuButton.addEventListener("click", () => navLinks.classList.toggle("open"));
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    });
  }, { threshold: 0.12 });

  $all(".reveal").forEach(el => observer.observe(el));
}

async function updateFromCmsInBackground() {
  const cmsUrl = window.CMS_URL && window.CMS_URL.trim();
  if (!cmsUrl) return;

  try {
    const cmsData = await fetchJsonWithTimeout(cmsUrl, CMS_TIMEOUT_MS);
    setCachedCmsData(cmsData);
    renderAll(cmsData);
  } catch (err) {
    console.warn("CMS is slow or unavailable. Using cached/local content for now.", err);
  }
}

async function main() {
  const cached = getCachedCmsData();

  if (cached) {
    renderAll(cached);
  } else {
    try {
      const localData = await loadLocalData();
      renderAll(localData);
    } catch (err) {
      console.warn("Local content failed to load.", err);
    }
  }

  updateFromCmsInBackground();
  initInteractions();
}

let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(async () => {
    const cached = getCachedCmsData();
    if (cached) {
      drawCapabilityChart(cached.capabilities);
      return;
    }

    try {
      const localData = await loadLocalData();
      drawCapabilityChart(localData.capabilities);
    } catch (e) {}
  }, 200);
});

main();
