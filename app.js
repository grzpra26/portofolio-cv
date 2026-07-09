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


function normalizeTheme(themeInput) {
  if (!themeInput) return {};

  // Preferred content.json format: { primary_color: "#...", ... }
  if (!Array.isArray(themeInput) && typeof themeInput === "object") {
    if (themeInput.primary_color || themeInput.background_color || themeInput.text_color) {
      return themeInput;
    }

    // Fallback for older Apps Script output that only returns one key-value row.
    if (themeInput.setting_key && themeInput.value) {
      return { [String(themeInput.setting_key).trim()]: themeInput.value };
    }

    return themeInput;
  }

  // If CMS returns rows, convert setting_key/value into an object.
  if (Array.isArray(themeInput)) {
    return themeInput.reduce((acc, row) => {
      if (row.setting_key) acc[String(row.setting_key).trim()] = row.value;
      return acc;
    }, {});
  }

  return {};
}

function applyTheme(themeInput) {
  const theme = normalizeTheme(themeInput);
  const root = document.documentElement;

  const mapping = {
    primary_color: "--accent",
    secondary_color: "--accent2",
    background_color: "--bg",
    surface_color: "--card",
    text_color: "--text",
    muted_text_color: "--muted",
    border_color: "--line"
  };

  Object.entries(mapping).forEach(([key, cssVar]) => {
    if (theme[key]) root.style.setProperty(cssVar, String(theme[key]).trim());
  });

  if (theme.font_family) {
    root.style.setProperty("--font-family", `${String(theme.font_family).trim()}, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`);
  }

  if (theme.button_radius) {
    const radius = String(theme.button_radius).trim();
    root.style.setProperty("--button-radius", radius.endsWith("px") ? radius : `${radius}px`);
  }

  if (theme.primary_color) {
    root.style.setProperty("--dark", shadeColor(String(theme.primary_color).trim(), -35));
    root.style.setProperty("--soft", hexToRgba(String(theme.primary_color).trim(), 0.10));
  }
}

function shadeColor(hex, percent) {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return hex;

  const num = parseInt(clean, 16);
  let r = (num >> 16) + percent;
  let g = ((num >> 8) & 0x00FF) + percent;
  let b = (num & 0x0000FF) + percent;

  r = Math.max(Math.min(255, r), 0);
  g = Math.max(Math.min(255, g), 0);
  b = Math.max(Math.min(255, b), 0);

  return `#${(b | (g << 8) | (r << 16)).toString(16).padStart(6, "0")}`;
}

function hexToRgba(hex, alpha) {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return hex;
  const num = parseInt(clean, 16);
  const r = num >> 16;
  const g = (num >> 8) & 0x00FF;
  const b = num & 0x0000FF;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getCssVar(name, fallback) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
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

function renderProofMap(items = []) {
  // Safe fallback: this website version may not have a proof map section in HTML.
  const target = $("#proofMapGrid");
  if (!target) return;

  const cleanItems = Array.isArray(items) ? items : [];
  target.innerHTML = cleanItems.map(item => `
    <article class="fit-card reveal visible">
      <h3>${escapeHtml(item.title || item.label || "")}</h3>
      <p>${escapeHtml(item.description || item.proof || "")}</p>
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

let experienceExpanded = false;
let currentExperienceItems = [];

function renderExperience(items = []) {
  const target = $("#experienceTimeline");
  if (!target) return;

  currentExperienceItems = items;
  const visibleItems = experienceExpanded ? items : items.slice(0, 3);

  target.innerHTML = visibleItems.map(item => {
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

  renderExperienceToggle(items.length);
}

function renderExperienceToggle(totalItems) {
  const timeline = $("#experienceTimeline");
  if (!timeline) return;

  let wrapper = $("#experienceToggleWrapper");

  if (totalItems <= 3) {
    if (wrapper) wrapper.remove();
    return;
  }

  if (!wrapper) {
    wrapper = document.createElement("div");
    wrapper.id = "experienceToggleWrapper";
    wrapper.className = "experience-toggle-wrapper";
    timeline.insertAdjacentElement("afterend", wrapper);
  }

  wrapper.innerHTML = `
    <button class="experience-toggle" type="button">
      ${experienceExpanded ? "Show less experience" : `See more experience (${totalItems - 3} more)`}
    </button>
  `;

  const button = wrapper.querySelector(".experience-toggle");
  button.addEventListener("click", () => {
    experienceExpanded = !experienceExpanded;
    renderExperience(currentExperienceItems);

    if (!experienceExpanded) {
      document.querySelector("#experience")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  });
}

function renderSkills(items = []) {
  const target = $("#skillsGrid");
  if (!target) return;

  currentSkillItems = Array.isArray(items) ? items : [];
  const visibleItems = skillsExpanded ? currentSkillItems : currentSkillItems.slice(0, 2);

  target.innerHTML = visibleItems.map(item => `
    <article class="skill-box reveal visible">
      <h3>${escapeHtml(item.category || item.title || "")}</h3>
      <p>${escapeHtml(item.items || item.description || "")}</p>
    </article>
  `).join("");

  renderSkillsToggle(currentSkillItems.length);
}

function renderSkillsToggle(totalItems) {
  const grid = $("#skillsGrid");
  if (!grid) return;

  let wrapper = $("#skillsToggleWrapper");

  if (totalItems <= 2) {
    if (wrapper) wrapper.remove();
    return;
  }

  if (!wrapper) {
    wrapper = document.createElement("div");
    wrapper.id = "skillsToggleWrapper";
    wrapper.className = "experience-toggle-wrapper";
    grid.insertAdjacentElement("afterend", wrapper);
  }

  wrapper.innerHTML = `
    <button class="experience-toggle" type="button">
      ${skillsExpanded ? "Show less skills" : `See more skills (${totalItems - 2} more)`}
    </button>
  `;

  const button = wrapper.querySelector(".experience-toggle");
  button.addEventListener("click", () => {
    skillsExpanded = !skillsExpanded;
    renderSkills(currentSkillItems);

    if (!skillsExpanded) {
      document.querySelector("#skills")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  });
}

function renderCertifications(items = []) {
  const target = $("#certificationGrid");
  if (!target) return;

  currentCertificationItems = items;
  const visibleItems = certificationsExpanded ? items : items.slice(0, 3);

  target.innerHTML = visibleItems.map(item => `
    <article class="cert-card reveal visible">
      <h3>${escapeHtml(item.name)}</h3>
      <p>${escapeHtml(item.issuer)} • ${escapeHtml(item.date)}</p>
      <small>Credential: ${escapeHtml(item.credential)}</small>
    </article>
  `).join("");

  renderCertificationToggle(items.length);
}

function renderCertificationToggle(totalItems) {
  const grid = $("#certificationGrid");
  if (!grid) return;

  let wrapper = $("#certificationToggleWrapper");

  if (totalItems <= 3) {
    if (wrapper) wrapper.remove();
    return;
  }

  if (!wrapper) {
    wrapper = document.createElement("div");
    wrapper.id = "certificationToggleWrapper";
    wrapper.className = "certification-toggle-wrapper";
    grid.insertAdjacentElement("afterend", wrapper);
  }

  wrapper.innerHTML = `
    <button class="certification-toggle" type="button">
      ${certificationsExpanded ? "Show less certifications" : `See more certifications (${totalItems - 3} more)`}
    </button>
  `;

  const button = wrapper.querySelector(".certification-toggle");
  button.addEventListener("click", () => {
    certificationsExpanded = !certificationsExpanded;
    renderCertifications(currentCertificationItems);

    if (!certificationsExpanded) {
      document.querySelector("#certifications")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  });
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
    gradient.addColorStop(0, getCssVar("--accent", "#2F6B4F"));
    gradient.addColorStop(1, getCssVar("--accent2", "#D8A84F"));
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

function normalizeBoolean(value, defaultValue = true) {
  if (value === undefined || value === null || value === "") return defaultValue;

  const normalized = String(value).trim().toLowerCase();

  if (["true", "yes", "y", "1", "show", "visible"].includes(normalized)) return true;
  if (["false", "no", "n", "0", "hide", "hidden"].includes(normalized)) return false;

  return defaultValue;
}

function getSectionConfig(data, key) {
  const sections = Array.isArray(data?.sections) ? data.sections : [];
  return sections.find(item =>
    String(item.section_key || item.key || "").trim() === key
  );
}

function isSectionVisible(data, key, defaultValue = true) {
  const section = getSectionConfig(data, key);

  // Important: if a section row does not exist, keep section visible.
  if (!section) return defaultValue;

  // Supports both `visible` and older `is_visible`.
  return normalizeBoolean(section.visible ?? section.is_visible, defaultValue);
}

function setElementVisibility(selector, visible) {
  document.querySelectorAll(selector).forEach(element => {
    element.hidden = !visible;
    element.style.display = visible ? "" : "none";
  });
}

function applySectionVisibility(data) {
  const mapping = {
    profile: "#home",
    metrics: "#metrics",
    roleFit: "#fit",
    proofMap: "#proofMap",
    capabilities: "#visuals",
    projects: "#projects",
    experience: "#experience",
    skills: "#skills",
    certifications: "#certifications",
    links: "#contact",
    roleSwitcher: ".role-switcher"
  };

  Object.entries(mapping).forEach(([key, selector]) => {
    setElementVisibility(selector, isSectionVisible(data, key, true));
  });
}

function renderAll(data) {
  if (!data) return;

  applyTheme(data.theme);
  renderProfile(data.profile);
  renderRoleSwitcher(data.roleSwitcher);
  renderMetrics(data.metrics);
  renderRoleFit(data.roleFit);
  renderProofMap(data.proofMap);
  renderProjects(data.projects);
  renderExperience(data.experience);
  renderSkills(data.skills);
  renderCertifications(data.certifications);
  renderLinks(data.links);
  drawCapabilityChart(data.capabilities);

  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  // Apply visibility after rendering so hidden sections do not break rendering.
  applySectionVisibility(data);
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
