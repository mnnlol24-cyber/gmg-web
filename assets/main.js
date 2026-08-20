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

/* ═══════════ Carrusel del equipo médico ═══════════
   La pista ya se desliza sola con scroll-snap nativo (dedo, trackpad,
   rueda). Esto solo añade: flechas, marcadores, avance automático y las
   pausas que exige la accesibilidad. Si algo de esto falla, el carrusel
   sigue siendo utilizable. */
(function carruselEquipo() {
  const track = document.getElementById("docTrack");
  if (!track) return;

  const carousel = track.closest(".carousel");
  const cards = Array.from(track.children);
  const dotsWrap = document.getElementById("docDots");
  const playBtn = document.getElementById("docPlay");
  const prevBtn = document.querySelector('.car-btn[data-dir="prev"]');
  const nextBtn = document.querySelector('.car-btn[data-dir="next"]');
  const sinMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- marcadores --- */
  cards.forEach((card, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "car-dot";
    dot.setAttribute("role", "tab");
    dot.setAttribute("aria-selected", i === 0 ? "true" : "false");
    const nombre = card.querySelector("h3");
    dot.setAttribute("aria-label", nombre ? `Ver a ${nombre.textContent}` : `Ficha ${i + 1}`);
    dot.addEventListener("click", () => irA(i));
    dotsWrap.appendChild(dot);
  });
  const dots = Array.from(dotsWrap.children);

  function paso() {
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return cards[0].getBoundingClientRect().width + gap;
  }
  function indiceActual() {
    return Math.round(track.scrollLeft / paso());
  }
  function irA(i) {
    const max = cards.length - 1;
    const destino = Math.max(0, Math.min(i, max));
    track.scrollTo({ left: destino * paso(), behavior: sinMovimiento ? "auto" : "smooth" });
  }

  prevBtn.addEventListener("click", () => { pausarPorGesto(); irA(indiceActual() - 1); });
  nextBtn.addEventListener("click", () => { pausarPorGesto(); irA(indiceActual() + 1); });

  /* --- teclado sobre la pista --- */
  track.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    pausarPorGesto();
    irA(indiceActual() + (e.key === "ArrowRight" ? 1 : -1));
  });

  /* --- estado de flechas y marcadores, sin escuchar el scroll --- */
  if (hasIO) {
    const visto = new Set();
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => (e.isIntersecting ? visto.add(e.target) : visto.delete(e.target)));
        const visibles = cards.filter((c) => visto.has(c));
        if (visibles.length) {
          const i = cards.indexOf(visibles[0]);
          dots.forEach((d, k) => d.setAttribute("aria-selected", String(k === i)));
        }
        prevBtn.disabled = visto.has(cards[0]);
        nextBtn.disabled = visto.has(cards[cards.length - 1]);
      },
      { root: track, threshold: 0.6 }
    );
    cards.forEach((c) => obs.observe(c));
  }

  /* --- avance automático --- */
  let temporizador = null;
  let pausadoPorUsuario = false;
  let fueraDePantalla = false;

  function avanzar() {
    const i = indiceActual();
    const ultimaVisible = track.scrollLeft >= track.scrollWidth - track.clientWidth - 4;
    irA(ultimaVisible ? 0 : i + 1);
  }
  function arrancar() {
    detener();
    if (sinMovimiento || pausadoPorUsuario || fueraDePantalla) return;
    temporizador = setInterval(avanzar, 5000);
  }
  function detener() {
    if (temporizador) { clearInterval(temporizador); temporizador = null; }
  }
  function pausarPorGesto() {
    // Un gesto deliberado del visitante manda sobre el avance automático.
    if (pausadoPorUsuario) return;
    pausadoPorUsuario = true;
    detener();
    reflejarBoton();
  }
  function reflejarBoton() {
    if (!playBtn) return;
    playBtn.setAttribute("aria-pressed", String(pausadoPorUsuario));
    playBtn.querySelector(".car-play-label").textContent = pausadoPorUsuario ? "Reanudar" : "Pausar";
  }

  if (sinMovimiento) {
    if (playBtn) playBtn.hidden = true;
  } else {
    playBtn.addEventListener("click", () => {
      pausadoPorUsuario = !pausadoPorUsuario;
      reflejarBoton();
      pausadoPorUsuario ? detener() : arrancar();
    });

    // Pausa mientras el visitante mira, apunta o navega con el teclado.
    carousel.addEventListener("pointerenter", detener);
    carousel.addEventListener("pointerleave", arrancar);
    carousel.addEventListener("focusin", detener);
    carousel.addEventListener("focusout", arrancar);
    track.addEventListener("pointerdown", pausarPorGesto);

    // No gastar batería animando algo que nadie está viendo.
    if (hasIO) {
      new IntersectionObserver(
        ([e]) => { fueraDePantalla = !e.isIntersecting; e.isIntersecting ? arrancar() : detener(); },
        { threshold: 0.25 }
      ).observe(carousel);
    } else {
      arrancar();
    }
  }
})();
