const fallbackUrl = "content.json";

const roleDescriptions = {
  vibe: "I translate real operational problems into logic, workflows, and AI-assisted prototypes.",
  data: "I analyze messy operational data, validate patterns, and turn field signals into structured insights.",
  web: "I am building toward AI-assisted web and internal tools development for dashboards, forms, and workflow tools."
};

let showAllExperience = false;
let cachedExperience = [];

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

function renderRoleFit(items = []) {
  $("#roleFitGrid").innerHTML = items.map(item => `
    <article class="fit-card reveal">
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.description)}</p>
    </article>
  `).join("");
}

function renderProjects(projects = []) {
  $("#projectList").innerHTML = projects.map(project => {
    const tools = String(project.tools || "").split(",").map(t => t.trim()).filter(Boolean);
    return `
      <article class="project-card reveal">
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
  cachedExperience = items;
  const visibleItems = showAllExperience ? items : items.slice(0, 3);

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
      toggle.textContent = showAllExperience ? "Show less" : `See more experience (${items.length - 3} more)`;
    }
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    });
  }, { threshold: 0.12 });

  $all(".timeline-item.reveal").forEach(el => observer.observe(el));
}

function renderSkills(items = []) {
  $("#skillsGrid").innerHTML = items.map(item => `
    <article class="skill-box reveal">
      <h3>${escapeHtml(item.category)}</h3>
      <p>${escapeHtml(item.items)}</p>
    </article>
  `).join("");
}

function renderCertifications(items = []) {
  $("#certificationGrid").innerHTML = items.map(item => `
    <article class="cert-card reveal">
      <h3>${escapeHtml(item.name)}</h3>
      <p>${escapeHtml(item.issuer)} • ${escapeHtml(item.date)}</p>
      <small>Credential: ${escapeHtml(item.credential)}</small>
    </article>
  `).join("");
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

async function main() {
  const data = await loadData();
  renderProfile(data.profile);
  renderMetrics(data.metrics);
  renderRoleFit(data.roleFit);
  renderProjects(data.projects);
  renderExperience(data.experience);
  renderSkills(data.skills);
  renderCertifications(data.certifications);
  renderLinks(data.links);
  drawCapabilityChart(data.capabilities);
  $("#year").textContent = new Date().getFullYear();
  initInteractions();
}

window.addEventListener("resize", async () => {
  try {
    const data = await loadData();
    drawCapabilityChart(data.capabilities);
  } catch (e) {}
});

main();
