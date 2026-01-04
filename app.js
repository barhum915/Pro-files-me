/* =========================
   Helpers
========================= */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[m]));
}

function toast(msg = "تم ✅") {
  const el = $("#toast");
  if (!el) return;
  el.textContent = msg;
  el.hidden = false;
  el.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => {
    el.classList.remove("show");
    el.hidden = true;
  }, 2500);
}

/* =========================
   Theme (Dark/Light)
========================= */
function initTheme() {
  const btn = $("#themeBtn"); // إذا عندك زر للقمر/الشمس
  const key = "bp_theme";
  const saved = localStorage.getItem(key);

  if (saved === "light") document.documentElement.classList.add("light");

  const setTheme = (mode) => {
    if (mode === "light") document.documentElement.classList.add("light");
    else document.documentElement.classList.remove("light");
    localStorage.setItem(key, mode);
  };

  if (btn) {
    btn.addEventListener("click", () => {
      const isLight = document.documentElement.classList.contains("light");
      setTheme(isLight ? "dark" : "light");
    });
  }
}

/* =========================
   Mobile Menu
========================= */
function initMenu() {
  const menuBtn = $("#menuBtn");
  const navLinks = $("#navLinks");
  if (!menuBtn || !navLinks) return;

  const close = () => navLinks.classList.remove("open");
  const toggle = () => navLinks.classList.toggle("open");

  menuBtn.addEventListener("click", toggle);
  $$("#navLinks a").forEach((a) => a.addEventListener("click", close));

  document.addEventListener("click", (e) => {
    if (!navLinks.classList.contains("open")) return;
    if (navLinks.contains(e.target) || menuBtn.contains(e.target)) return;
    close();
  });
}

/* =========================
   Scroll Progress + Active Links
========================= */
function initScrollUI() {
  const progressBar = $("#progressBar");
  const sections = $$("section[id]");
  const links = $$('a[href^="#"]');

  const setActive = () => {
    const y = window.scrollY + 140;
    let currentId = null;

    for (const s of sections) {
      if (s.offsetTop <= y) currentId = s.id;
    }

    links.forEach((a) => {
      const href = a.getAttribute("href");
      if (!href || !href.startsWith("#")) return;
      const id = href.slice(1);
      a.classList.toggle("is-active", id === currentId);
    });
  };

  const setProgress = () => {
    if (!progressBar) return;
    const h = document.documentElement;
    const scrolled = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
    progressBar.style.width = `${Math.min(100, Math.max(0, scrolled))}%`;
  };

  window.addEventListener("scroll", () => {
    setActive();
    setProgress();
  }, { passive: true });

  setActive();
  setProgress();
}

/* =========================
   Reveal on scroll (simple)
========================= */
function initReveal() {
  const items = $$(".reveal");
  if (!items.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add("in");
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.12 });

  items.forEach((el) => io.observe(el));
}

/* =========================
   Skills (edit as you like)
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
        <span>${escapeHtml(s.level)}% • ${escapeHtml(s.note)}</span>
      </div>
      <div class="bar"><i style="width:${escapeHtml(s.level)}%"></i></div>
    </div>
  `).join("");
}

/* =========================
   Projects from GitHub API
   (uses /api/github on Vercel)
========================= */
function renderSkeletonProjects(n = 6) {
  const grid = $("#projectsGrid");
  if (!grid) return;

  grid.innerHTML = "";
  for (let i = 0; i < n; i++) {
    const sk = document.createElement("div");
    sk.className = "project-card skeleton";
    sk.innerHTML = `
      <div class="sk-title"></div>
      <div class="sk-line"></div>
      <div class="sk-actions">
        <div class="sk-btn"></div>
        <div class="sk-btn"></div>
      </div>
    `;
    grid.appendChild(sk);
  }
}

function renderProjects(repos) {
  const grid = $("#projectsGrid");
  if (!grid) return;

  grid.innerHTML = "";

  repos.forEach((repo) => {
    const card = document.createElement("div");
    card.className = "project-card reveal";

    const desc = repo.description ? repo.description : "بدون وصف حالياً";

    card.innerHTML = `
      <h3>${escapeHtml(repo.name)}</h3>
      <p>${escapeHtml(desc)}</p>

      <div class="project-actions">
        <a class="btn-mini" href="${repo.html_url}" target="_blank" rel="noopener">GitHub</a>
        ${
          repo.homepage
            ? `<a class="btn-mini" href="${repo.homepage}" target="_blank" rel="noopener">Live</a>`
            : ``
        }
      </div>
    `;

    grid.appendChild(card);
  });
}

async function loadProjects() {
  const grid = $("#projectsGrid");
  if (!grid) return;

  renderSkeletonProjects(6);

  try {
    const res = await fetch("/api/github", { cache: "no-store" });

    const text = await res.text();
    if (text.trim().startsWith("<")) {
      throw new Error("الـ API رجّع HTML مو JSON (راجع /api/github)");
    }

    const data = JSON.parse(text);

    if (!Array.isArray(data)) {
      throw new Error("الداتا مو Array. راجع /api/github شو عم يرجّع.");
    }

    const filtered = data
      .filter((r) => !r.fork)
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, 6);

    if (filtered.length === 0) {
      grid.innerHTML = `<p style="opacity:.8">ما لقيت مشاريع للعرض.</p>`;
      return;
    }

    renderProjects(filtered);
    initReveal(); // حتى تنعمل reveal للكروت الجديدة

  } catch (err) {
    console.error(err);
    grid.innerHTML = `<p style="color:#ffb3b3">صار خطأ بتحميل المشاريع: ${escapeHtml(err.message)}</p>`;
  }
}

/* =========================
   WhatsApp Contact Form
========================= */
function buildWhatsappText({ name, service, msg }) {
  // لازم Backticks ` `
  return `مرحباً 👋
أنا: ${name}
شو بدك: ${service}
التفاصيل: ${msg}`;
}

function initContactForm() {
  const form = $("#contactForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault(); // أهم شي! حتى ما يرجع لأعلى الصفحة

    const fd = new FormData(form);
    const name = (fd.get("name") || "").toString().trim();
    const service = (fd.get("service") || "").toString().trim();
    const msg = (fd.get("message") || "").toString().trim();

    if (!name || !service || !msg) {
      toast("عبّي الحقول كلها 🙏");
      return;
    }

    // رقمك مع كود البلد بدون +
    const phone = "963968201410";

    const text = buildWhatsappText({ name, service, msg });
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;

    window.open(url, "_blank", "noopener");
    toast("انفتح واتساب ✅");
    // form.reset(); // إذا بدك يفضّي الفورم بعد الإرسال فعّلها
  });
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

  initContactForm();
});
