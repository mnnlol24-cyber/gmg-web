// GMG · interacciones ligeras (sin dependencias, sin listeners de scroll)

const hasIO = "IntersectionObserver" in window;
const root = document.documentElement;

// Progressive enhancement: los reveals solo se ocultan si hay JS + IntersectionObserver.
if (hasIO) root.classList.add("js");

/* ---------- Año del pie ---------- */
const year = document.getElementById("year");
if (year) year.textContent = String(new Date().getFullYear());

/* ---------- Menú móvil ---------- */
const nav = document.getElementById("nav");
const toggle = document.getElementById("navToggle");

function closeMenu() {
  nav.classList.remove("open");
  toggle.setAttribute("aria-expanded", "false");
  toggle.querySelector(".icon").className = "icon i-list";
}

toggle.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  toggle.setAttribute("aria-expanded", String(open));
  toggle.querySelector(".icon").className = "icon " + (open ? "i-x" : "i-list");
});

document.querySelectorAll(".nav-mobile a").forEach((a) => a.addEventListener("click", closeMenu));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && nav.classList.contains("open")) {
    closeMenu();
    toggle.focus();
  }
});

if (hasIO) {
  /* ---------- Barra de navegación sólida al bajar ---------- */
  new IntersectionObserver(([entry]) => {
    nav.classList.toggle("solid", !entry.isIntersecting);
  }).observe(document.getElementById("top-sentinel"));

  /* ---------- Revelado progresivo ---------- */
  const items = document.querySelectorAll(".reveal");

  // Lo que ya cabe en la primera pantalla se muestra de inmediato y sin transición:
  // no depende del observador ni de que el navegador entregue fotogramas.
  items.forEach((el) => {
    if (el.getBoundingClientRect().top < window.innerHeight * 1.15) el.classList.add("in", "in-instant");
  });

  // La red de seguridad debe vigilar "el observador nunca respondió", no "nada intersectó":
  // en móvil el hero ocupa toda la pantalla y es normal que nada intersecte al cargar.
  let ioFired = false;
  const io = new IntersectionObserver(
    (entries) => {
      ioFired = true;
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );
  items.forEach((el) => io.observe(el));

  setTimeout(() => {
    if (!ioFired) root.classList.remove("js");
  }, 2500);
} else {
  nav.classList.add("solid");
}
