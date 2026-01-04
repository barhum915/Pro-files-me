// ====== SETTINGS ======
const GITHUB_USER = "barhum915";
const WHATSAPP_NUMBER = "963968201410";
const WHATSAPP_DISPLAY = "0968 201 410";

// ====== DATA ======
const skills = [
  { name: "HTML", level: 90, note: "Semantic & clean" },
  { name: "CSS", level: 85, note: "Responsive / Flex / Grid" },
  { name: "JavaScript", level: 70, note: "DOM / Events / Basics" },
  { name: "UI/UX", level: 70, note: "Spacing & typography" },
  { name: "Git & GitHub", level: 75, note: "Projects & publishing" },
  { name: "WordPress", level: 60, note: "Design & setup" },
];

// ====== HELPERS ======
const $ = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => [...p.querySelectorAll(s)];

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}

function setYear(){ $("#year").textContent = new Date().getFullYear(); }

function toast(msg = "تم ✅") {
  const t = $("#toast");
  if (!t) return;
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => (t.hidden = true), 1600);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast("تم النسخ ✅");
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    toast("تم النسخ ✅");
  }
}

// ====== THEME ======
function initTheme() {
  const saved = localStorage.getItem("theme");
  if (saved) document.documentElement.dataset.theme = saved;

  const btn = $("#themeBtn");
  const icon = btn?.querySelector(".icon");

  const syncIcon = () => {
    const isLight = document.documentElement.dataset.theme === "light";
    if (icon) icon.textContent = isLight ? "☀" : "☾";
  };
  syncIcon();

  btn?.addEventListener("click", () => {
    const current = document.documentElement.dataset.theme;
    const next = current === "light" ? "" : "light";
    if (next) document.documentElement.dataset.theme = next;
    else document.documentElement.removeAttribute("data-theme");
    localStorage.setItem("theme", next || "");
    syncIcon();
  });
}

// ====== MOBILE MENU ======
function initMobileMenu() {
  const btn = $("#menuBtn");
  const menu = $("#mobileNav");
  if (!btn || !menu) return;

  btn.addEventListener("click", () => { menu.hidden = !menu.hidden; });

  $$("#mobileNav a").forEach(a => a.addEventListener("click", () => (menu.hidden = true)));

  window.addEventListener("resize", () => {
    if (window.innerWidth > 950) menu.hidden = true;
  });
}

// ====== REVEAL ======
function initReveal() {
  const items = $$(".reveal");
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("is-visible")),
    { threshold: 0.12 }
  );
  items.forEach((el) => io.observe(el));
}

// ====== SCROLL UX ======
function initScrollUX() {
  const links = $$(".nav__link");
  const sections = ["about", "skills", "projects", "contact"].map(id => document.getElementById(id)).filter(Boolean);

  const setActive = () => {
    const y = window.scrollY + 130;
    let current = "about";
    for (const s of sections) if (s.offsetTop <= y) current = s.id;
    links.forEach(a => a.classList.toggle("is-active", a.getAttribute("href") === `#${current}`));
  };

  const progress = () => {
    const h = document.documentElement;
    const scrolled = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
    $("#progressBar").style.width = `${Math.min(100, Math.max(0, scrolled))}%`;
  };

  window.addEventListener("scroll", () => { setActive(); progress(); }, { passive: true });
  setActive(); progress();
}

// ====== RENDER SKILLS ======
function renderSkills() {
  const wrap = $("#skillsGrid");
  if (!wrap) return;
wrap.innerHTML = skills.map(s => 
  <div class="card skill reveal">
    <div class="skillTop">
      <strong>${escapeHtml(s.name)}</strong>
      <span>${s.level}% • ${escapeHtml(s.note)}</span>
    </div>
    <div class="bar"><i style="width:${s.level}%"></i></div>
  </div>
).join("");
}

// ====== GITHUB PROJECTS (AUTO) + SKELETON ======
function renderSkeletonProjects(n = 6){
  const grid = $("#projectsGrid");
  if(!grid) return;

  grid.innerHTML = Array.from({length:n}).map(() => 
    <article class="card project skeleton">
      <div class="skelLine big"></div>
      <div class="skelLine" style="width:90%"></div>
      <div class="skelLine" style="width:75%"></div>
      <div style="display:flex; gap:8px; margin-top:12px; flex-wrap:wrap">
        <span class="pill skelLine" style="width:70px; height:26px; margin:0"></span>
        <span class="pill skelLine" style="width:90px; height:26px; margin:0"></span>
      </div>
    </article>
  ).join("");
}

function renderGithubCards(list){
  const grid = $("#projectsGrid");
  if(!grid) return;

  grid.innerHTML = list.map(p => 
    <article class="card project">
      <div class="projectTop">
        <h3 style="margin:0;font-size:16px">${escapeHtml(p.title)}</h3>
        <span class="pill">${escapeHtml(p.lang)}</span>
      </div>

      <p class="muted" style="margin-top:10px">${escapeHtml(p.desc)}</p>

      <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:12px; align-items:center">
        <a class="btn btn--small btn--primary" target="_blank" rel="noopener" href="${p.source}">Source</a>
        ${p.live ? <a class="btn btn--small btn--ghost" target="_blank" rel="noopener" href="${p.live}">Live</a> : ""}
        <span class="pill" style="margin-inline-start:auto; opacity:.9">
          Updated: ${p.updated.toLocaleDateString("en-GB")}
        </span>
      </div>
    </article>
  ).join("");
}

async function loadGithubProjects(){
  const note = document.getElementById("projectsNote");
  renderSkeletonProjects();

  try{
    const url = `https://api.github.com/users/${GITHUB_USER}/repos?sort=updated&per_page=9`;
    const res = await fetch(url, {
      headers: { "Accept": "application/vnd.github+json" }
    });

    // لو GitHub عطاك Rate Limit أو Forbidden
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`GitHub error ${res.status}: ${txt.slice(0,120)}`);
    }

    const repos = await res.json();

    const cleaned = repos
      .filter(r => !r.fork)
      .slice(0, 9)
      .map(r => ({
        title: r.name,
        desc: r.description || "بدون وصف حالياً — لاحقاً منضيف وصف أحسن.",
        lang: r.language || "Project",
        updated: new Date(r.updated_at),
        source: r.html_url,
        live: (r.homepage && r.homepage.startsWith("http")) ? r.homepage : null,
      }));

    // إذا ما عندك ريبو غير fork
    if (!cleaned.length) throw new Error("No repos to show (maybe all forks).");

    renderGithubCards(cleaned);
    if(note) note.textContent = `آخر مشاريع من GitHub تلقائياً • المعروض: ${cleaned.length}`;
  }catch(e){
    console.error("Projects load failed:", e);

    const grid = document.getElementById("projectsGrid");
    if(grid){
      // fallback cards (يدوي) بدل ما يضل فاضي
      grid.innerHTML = `
        <div class="card">
          <h3 style="margin:0 0 8px">مشاريعي</h3>
          <p class="muted">تعذر جلب المشاريع تلقائياً حالياً من GitHub (ممكن Rate Limit). هاي روابط مباشرة:</p>
          <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:12px">
            <a class="btn btn--small btn--primary" target="_blank" rel="noopener" href="https://github.com/${GITHUB_USER}">GitHub Profile</a>
            <a class="btn btn--small btn--ghost" target="_blank" rel="noopener" href="https://api.github.com/users/${GITHUB_USER}/repos?sort=updated&per_page=9">API Link</a>
          </div>
        </div>
      `;
    }
    if(note) note.textContent = "ملاحظة: GitHub API ما رجّع بيانات حالياً.";
  }
}


// ====== CONTACT ======
function initContact() {
  $("#copyWhats")?.addEventListener("click", () => copyText(WHATSAPP_DISPLAY.replace(/\s/g,"")));
  $("#copyWhats2")?.addEventListener("click", () => copyText(WHATSAPP_DISPLAY.replace(/\s/g,"")));

  const form = $("#contactForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const fd = new FormData(form);
    const name = String(fd.get("name") || "").trim();
    const service = String(fd.get("service") || "").trim();
    const msg = String(fd.get("message") || "").trim();

    if (name.length < 2 || msg.length < 10 || !service) {
      toast("تأكد من تعبئة الحقول ✅");
      return;
    }

const text = `
مرحبا إبراهيم 👋
أنا: ${name}
بدي: ${service}
التفاصيل: ${msg}
`;

const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
window.open(url, "_blank", "noopener");
    toast("جارٍ فتح WhatsApp ✅");
    form.reset();
  }); 
}
// ====== INIT ======
(function init(){
  setYear();
  initTheme();
  initMobileMenu();
  renderSkills();
  loadGithubProjects();
  initContact();
  initReveal();
  initScrollUX();
})();
async function loadProjects() {
  const grid = document.getElementById("projectsGrid");
  if (!grid) return;

  grid.innerHTML = "<p>عم حمّل المشاريع...</p>";

  try {
    const res = await fetch("/api/github");
    if (!res.ok) throw new Error("API failed: " + res.status);

    const repos = await res.json();

    // فلترة وترتيب (اختياري)
    const filtered = repos
      .filter(r => !r.fork) // يشيل المشاريع المنسوخة fork
      .slice(0, 9);         // أول 9 مشاريع

    grid.innerHTML = "";

    filtered.forEach(repo => {
      const card = document.createElement("div");
      card.className = "project-card";

     card.innerHTML = `
  <h3>${repo.name}</h3>
  <p>${repo.description ? repo.description : "بدون وصف حالياً."}</p>

  <div class="project-actions">
    <a class="btn-mini" href="${repo.html_url}" target="_blank" rel="noopener">GitHub</a>
    ${
      repo.homepage
        ? `<a class="btn-mini" href="${repo.homepage}" target="_blank" rel="noopener">Live</a>`
        : ""
    }
  </div>
`;


      grid.appendChild(card);
    });

    if (filtered.length === 0) {
      grid.innerHTML = "<p>ما لقيت مشاريع لعرضها.</p>";
    }

  } catch (err) {
    grid.innerHTML = `<p>صار خطأ بتحميل المشاريع: ${err.message}</p>`;
  }
}

document.addEventListener("DOMContentLoaded", loadProjects);
