/* =========================
   Helpers
========================= */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* =========================
   Theme (Dark/Light)
========================= */
function initTheme() {
  const btn = $("#themeToggle") || $("#themeBtn") || $(".theme-toggle");
  const saved = localStorage.getItem("theme");
  if (saved) document.documentElement.setAttribute("data-theme", saved);

  if (btn) {
    btn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") || "dark";
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
    });
  }
}

/* =========================
   Mobile Menu (optional)
========================= */
function initMenu() {
  const btn = $("#menuToggle") || $("#menuBtn") || $(".menu-toggle");
  const panel = $("#mobileMenu") || $("#nav") || $(".nav");

  if (!btn || !panel) return;

  btn.addEventListener("click", () => {
    panel.classList.toggle("open");
    btn.classList.toggle("open");
  });

  // close when click a link
  panel.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    panel.classList.remove("open");
    btn.classList.remove("open");
  });
}

/* =========================
   Scroll progress + active link
========================= */
function initScrollUI() {
  const progressBar = $("#progressBar");
  const sections = [...$$("section[id]")];
  const links = [...$$('a[href^="#"]')];

  const setActive = () => {
    const y = window.scrollY + 130;
    let current = sections[0]?.id || "";
    for (const s of sections) if (s.offsetTop <= y) current = s.id;

    links.forEach((a) => {
      const href = a.getAttribute("href");
      a.classList.toggle("is-active", href === `#${current}`);
    });
  };

  const progress = () => {
    if (!progressBar) return;
    const h = document.documentElement;
    const max = (h.scrollHeight - h.clientHeight) || 1;
    const scrolled = (h.scrollTop / max) * 100;
    progressBar.style.width = `${Math.min(100, Math.max(0, scrolled))}%`;
  };

  window.addEventListener("scroll", () => {
    setActive();
    progress();
  }, { passive: true });

  setActive();
  progress();
}

/* =========================
   Reveal on scroll (optional)
========================= */
function initReveal() {
  const els = [...$$(".reveal")];
  if (!els.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) e.target.classList.add("show");
    });
  }, { threshold: 0.12 });

  els.forEach((el) => io.observe(el));
}

/* =========================
   Skills data + render
========================= */
const skills = [
  { name: "HTML", level: 90, note: "Structure" },
  { name: "CSS", level: 85, note: "Layout + Responsive" },
  { name: "JavaScript", level: 75, note: "DOM + Fetch" },
  { name: "Git/GitHub", level: 70, note: "Version Control" },
  { name: "Vercel", level: 65, note: "Deploy" },
];

function renderSkills() {
  const wrap = $("#skillsGrid");
  if (!wrap) return;

  wrap.innerHTML = skills.map((s) => `
    <div class="card skill reveal">
      <div class="skillTop">
        <strong>${escapeHtml(s.name)}</strong>
        <span>${s.level}% • ${escapeHtml(s.note || "")}</span>
      </div>
      <div class="bar">
        <i style="width:${s.level}%"></i>
      </div>
    </div>
  `).join("");
}

/* =========================
   Projects (AUTO from GitHub via /api/github)
========================= */
function renderSkeletonProjects(n = 6) {
  const grid = $("#projectsGrid");
  if (!grid) return;

  grid.innerHTML = Array.from({ length: n }).map(() => `
    <div class="project-card skeleton">
      <div class="sk-title"></div>
      <div class="sk-line"></div>
      <div class="sk-line short"></div>
      <div class="sk-btns">
        <div class="sk-btn"></div>
        <div class="sk-btn"></div>
      </div>
    </div>
  `).join("");
}

function renderProjects(repos) {
  const grid = $("#projectsGrid");
  if (!grid) return;

  const filtered = (repos || [])
    .filter((r) => !r.fork)
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 9);

  grid.innerHTML = "";

  filtered.forEach((repo) => {
    const card = document.createElement("div");
    card.className = "project-card reveal";

    card.innerHTML = `
      <h3>${escapeHtml(repo.name)}</h3>
      <p>${repo.description ? escapeHtml(repo.description) : "بدون وصف حالياً."}</p>

    <div class="project-actions">
    <a class="btn-mini" href="${repo.html_url}" target="_blank">GitHub</a>

  ${repo.homepage
    ? <a class="btn-mini" href="${repo.homepage}" target="_blank">Live</a>
    : ""
    }
    </div>
    `;

    grid.appendChild(card);
  });

  if (filtered.length === 0) {
    grid.innerHTML = "<p>ما لقيت مشاريع للعرض.</p>";
  }
}

async function loadProjects() {
  const grid = $("#projectsGrid");
  if (!grid) return;

  renderSkeletonProjects(6);

  try {
    const res = await fetch("/api/github", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    // إذا رجّع HTML بالغلط رح يبين error هون بدل ما يكسر الموقع
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("الـ API رجّع HTML مو JSON (الرابط أو الفنكشن غلط)");
    }

    renderProjects(data);
  } catch (err) {
    grid.innerHTML = `<p>صار خطأ بتحميل المشاريع: ${escapeHtml(err.message)}</p>`;
  }
}

/* =========================
   Contact message template (optional)
   (بيحل مشكلة ${name}... لازم backticks)
========================= */
function buildWhatsappText({ name, service, msg }) {
  return `مرحباً 👋
أنا: ${name}
بدي: ${service}
التفاصيل: ${msg}`;
}

/* =========================
   Init
========================= */
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initMenu();
  initScrollUI();
  initReveal();

  renderSkills();
  loadProjects();
});
