/**
 * All Walls Down cinematic preview layer.
 * This enhances the EXISTING React-rendered pages and never replaces content or images.
 * Opts out on portal routes and honors the user's reduced-motion setting.
 */
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (number, min, max) => Math.min(max, Math.max(min, number));
const root = document.documentElement;
let current = { stage: null, pathname: "", hero: null, arts: [], revealObserver: null };
let frame = 0;
let scheduled = false;

function isPublicRoute(pathname) {
  return !/^\/(?:portal(?:\/|$)|staff[-_]portal(?:\/|$))/i.test(pathname);
}

function pageName(pathname) {
  if (pathname === "/") return "home";
  if (/about/i.test(pathname)) return "about";
  if (/ministries/i.test(pathname)) return "ministries";
  if (/leadership/i.test(pathname)) return "leadership";
  if (/involved/i.test(pathname)) return "involved";
  return "public";
}

function updateMotion() {
  scheduled = false;
  if (!current.stage || !current.hero || motionPreference.matches) return;
  const hero = current.hero;
  const rect = hero.getBoundingClientRect();
  const depth = clamp(-rect.top / Math.max(rect.height, 1), 0, 1);
  hero.style.setProperty("--cinema-scroll", depth.toFixed(4));
  current.arts.forEach((art) => {
    const box = art.getBoundingClientRect();
    if (box.bottom < -100 || box.top > window.innerHeight + 100) return;
    const fromCenter = (box.top + box.height / 2 - window.innerHeight / 2) / window.innerHeight;
    art.style.setProperty("--cinema-depth", (clamp(fromCenter, -1, 1) * -24).toFixed(1) + "px");
  });
}

function scheduleMotion() {
  if (scheduled || motionPreference.matches) return;
  scheduled = true;
  frame = window.requestAnimationFrame(updateMotion);
}

function preparePage() {
  const stage = document.querySelector(".route-stage");
  const pathname = window.location.pathname;
  if (current.stage === stage && current.pathname === pathname) return;

  if (current.revealObserver) current.revealObserver.disconnect();
  current = { stage, pathname, hero: null, arts: [], revealObserver: null };
  document.body.classList.remove(
    "cinematic-page-home",
    "cinematic-page-about",
    "cinematic-page-ministries",
    "cinematic-page-leadership",
    "cinematic-page-involved",
    "cinematic-page-public"
  );

  const enabled = isPublicRoute(pathname) && stage && !stage.querySelector(".staff-portal");
  document.body.classList.toggle("cinematic-enhanced", Boolean(enabled));
  if (!enabled) return;

  document.body.classList.add("cinematic-page-" + pageName(pathname));
  stage.classList.add("cinematic-stage");
  const hero = stage.querySelector(".hero, .page-hero");
  current.hero = hero;

  if (hero && !hero.querySelector(".cinematic-hero-flare")) {
    const flare = document.createElement("div");
    flare.className = "cinematic-hero-flare";
    flare.setAttribute("aria-hidden", "true");
    hero.append(flare);

    const cue = document.createElement("div");
    cue.className = "cinematic-scroll-cue";
    cue.setAttribute("aria-hidden", "true");
    const cueLine = document.createElement("span");
    cueLine.className = "cinematic-scroll-cue__line";
    const cueText = document.createElement("span");
    cueText.textContent = "SCROLL TO EXPLORE";
    cue.append(cueLine, cueText);
    hero.append(cue);
  }

  current.arts = [...stage.querySelectorAll(
    ".ministry__art, .split-feature__art, .founders-section__mark, .involved-statement"
  )];

  const targets = [...stage.querySelectorAll(
    ".home-marks > a, .ministry__copy > p, .ministry__copy > blockquote, " +
    ".about-story__copy > h2, .founders-section h2, .section-heading h2, " +
    ".ways article > h3, .public-intake-grid > *, .giving-callout h2"
  )].filter((element) => !element.closest(".donation-modal, .testimonial-modal, .staff-portal"));

  if (motionPreference.matches || !("IntersectionObserver" in window)) {
    targets.forEach((element) => element.classList.add("cinematic-in-view"));
  } else {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("cinematic-in-view");
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.12, rootMargin: "0px 0px -28px 0px" });
    current.revealObserver = observer;
    targets.forEach((element, index) => {
      element.classList.add("cinematic-incoming");
      element.style.setProperty("--cinema-stagger", String(index % 4));
      observer.observe(element);
    });
  }
  scheduleMotion();
}

function bootCinematicPreview() {
  const reactRoot = document.getElementById("root");
  if (!reactRoot) return;
  const observer = new MutationObserver(() => preparePage());
  observer.observe(reactRoot, { childList: true, subtree: true });
  window.addEventListener("scroll", scheduleMotion, { passive: true });
  window.addEventListener("resize", scheduleMotion, { passive: true });
  window.addEventListener("pageshow", preparePage);
  motionPreference.addEventListener?.("change", () => {
    cancelAnimationFrame(frame);
    current.stage = null;
    preparePage();
  });
  preparePage();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootCinematicPreview, { once: true });
} else {
  bootCinematicPreview();
}
