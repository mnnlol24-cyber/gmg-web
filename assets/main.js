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

/* ═══════════ Galería de especialistas ═══════════
   Una ficha a la vez, como las fotos de un hotel: entrada direccional,
   la fotografía cierra un leve acercamiento y las miniaturas permiten
   saltar a cualquier especialista. Sin JavaScript se ve la primera ficha
   completa, que sigue siendo información útil. */
(function galeriaEspecialistas() {
  const stage = document.getElementById("gStage");
  if (!stage) return;

  const gallery = document.getElementById("gallery");
  const slides = Array.from(stage.children);
  const thumbsWrap = document.getElementById("gThumbs");
  const playBtn = document.getElementById("gPlay");
  const contador = document.getElementById("gCur");
  const prevBtn = document.querySelector('.car-btn[data-dir="prev"]');
  const nextBtn = document.querySelector('.car-btn[data-dir="next"]');
  const sinMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let actual = 0;

  /* --- miniaturas, tomadas de los propios retratos --- */
  slides.forEach((slide, i) => {
    const foto = slide.querySelector(".gslide-photo img");
    const nombre = slide.querySelector("h3").textContent;
    const li = document.createElement("li");
    const b = document.createElement("button");
    b.type = "button";
    b.className = "thumb";
    b.setAttribute("role", "tab");
    b.setAttribute("aria-selected", i === 0 ? "true" : "false");
    b.setAttribute("aria-label", `Ver a ${nombre}`);
    const img = document.createElement("img");
    // versión ligera de 160px: la miniatura mide 52px, no vale traer el retrato completo
    img.src = foto.dataset.thumb || foto.src;
    img.alt = "";
    img.loading = "lazy";
    b.appendChild(img);
    b.addEventListener("click", () => { pausarPorGesto(); mostrar(i); });
    li.appendChild(b);
    thumbsWrap.appendChild(li);
  });
  const thumbs = Array.from(thumbsWrap.querySelectorAll(".thumb"));

  function mostrar(i, dir) {
    const total = slides.length;
    const destino = (i + total) % total; // circular: del último vuelve al primero
    if (destino === actual) return;
    stage.dataset.dir = dir || (destino > actual ? "next" : "prev");

    slides[actual].removeAttribute("data-active");
    slides[actual].setAttribute("aria-hidden", "true");
    slides[destino].setAttribute("data-active", "");
    slides[destino].setAttribute("aria-hidden", "false");

    thumbs[actual].setAttribute("aria-selected", "false");
    thumbs[destino].setAttribute("aria-selected", "true");

    contador.textContent = String(destino + 1).padStart(2, "0");
    actual = destino;
  }

  prevBtn.addEventListener("click", () => { pausarPorGesto(); mostrar(actual - 1, "prev"); });
  nextBtn.addEventListener("click", () => { pausarPorGesto(); mostrar(actual + 1, "next"); });

  /* --- teclado --- */
  gallery.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    pausarPorGesto();
    e.key === "ArrowRight" ? mostrar(actual + 1, "next") : mostrar(actual - 1, "prev");
  });

  /* --- deslizar con el dedo --- */
  let x0 = null;
  gallery.addEventListener("pointerdown", (e) => { x0 = e.clientX; });
  gallery.addEventListener("pointerup", (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0;
    x0 = null;
    if (Math.abs(dx) < 45) return;
    pausarPorGesto();
    dx < 0 ? mostrar(actual + 1, "next") : mostrar(actual - 1, "prev");
  });

  /* --- avance automático --- */
  let temporizador = null;
  let pausadoPorUsuario = false;
  let fueraDePantalla = false;

  function arrancar() {
    detener();
    if (sinMovimiento || pausadoPorUsuario || fueraDePantalla) return;
    temporizador = setInterval(() => mostrar(actual + 1, "next"), 6000);
  }
  function detener() {
    if (temporizador) { clearInterval(temporizador); temporizador = null; }
  }
  function pausarPorGesto() {
    if (pausadoPorUsuario) return;
    pausadoPorUsuario = true;
    detener();
    reflejarBoton();
  }
  function reflejarBoton() {
    playBtn.setAttribute("aria-pressed", String(pausadoPorUsuario));
    playBtn.querySelector(".car-play-label").textContent = pausadoPorUsuario ? "Reanudar" : "Pausar";
  }

  if (sinMovimiento) {
    playBtn.hidden = true;
  } else {
    playBtn.addEventListener("click", () => {
      pausadoPorUsuario = !pausadoPorUsuario;
      reflejarBoton();
      pausadoPorUsuario ? detener() : arrancar();
    });

    gallery.addEventListener("pointerenter", detener);
    gallery.addEventListener("pointerleave", arrancar);
    gallery.addEventListener("focusin", detener);
    gallery.addEventListener("focusout", arrancar);

    if (hasIO) {
      new IntersectionObserver(
        ([e]) => { fueraDePantalla = !e.isIntersecting; e.isIntersecting ? arrancar() : detener(); },
        { threshold: 0.3 }
      ).observe(gallery);
    } else {
      arrancar();
    }
  }
})();
