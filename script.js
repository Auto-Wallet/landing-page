// Scroll-triggered reveals (progressive enhancement only) + sticker timer.
// Reveal animations are guarded by `.js-reveal-ready` on <html> so content is
// fully visible by default and never gets stuck hidden on non-scrolling
// renders (print, full-page screenshots, reduced-motion users, etc).

const prefersMotion = matchMedia("(prefers-reduced-motion: no-preference)").matches;

if (prefersMotion && "IntersectionObserver" in window) {
  document.documentElement.classList.add("js-reveal-ready");

  const revealTargets = document.querySelectorAll(
    ".section-head, .how__diagram, .how__safety, .tour__row, .feat, .sec-card, .eip, .cta__inner"
  );
  revealTargets.forEach((el) => el.setAttribute("data-reveal", ""));

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
  );
  revealTargets.forEach((el) => io.observe(el));

  // Safety net: if anything is still hidden after 2.5s, reveal it.
  setTimeout(() => {
    revealTargets.forEach((el) => el.classList.add("is-visible"));
  }, 2500);
}

// Subtle parallax on the hero device cluster
const device = document.querySelector(".hero__device");
if (device && matchMedia("(prefers-reduced-motion: no-preference)").matches) {
  const onScroll = () => {
    const rect = device.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > innerHeight) return;
    const t = (rect.top + rect.height / 2 - innerHeight / 2) * 0.05;
    device.style.transform = `translateY(${-t}px)`;
  };
  document.addEventListener("scroll", onScroll, { passive: true });
}

// Fetch latest release tag from GitHub.
// Cached in sessionStorage for 1h so we don't hammer the unauth rate limit
// (60 req/h per IP) when users open multiple tabs.
(async function loadLatestRelease() {
  const slots = document.querySelectorAll("[data-release-version]");
  const statusSlots = document.querySelectorAll("[data-release-status]");
  if (!slots.length) return;

  const repo = "Auto-Wallet/auto-wallet";
  const cacheKey = "aw:release";
  const ttlMs = 60 * 60 * 1000; // 1h

  const writeRelease = (release) => {
    if (!release || !release.tag) return;
    slots.forEach((el) => (el.textContent = release.tag));
    statusSlots.forEach((el) => {
      el.textContent = release.prerelease ? "pre-release" : "stable";
    });
  };

  // Try cache first
  try {
    const cached = JSON.parse(sessionStorage.getItem(cacheKey) || "null");
    if (cached && Date.now() - cached.t < ttlMs) {
      writeRelease(cached);
      return;
    }
  } catch {}

  try {
    const res = await fetch(
      `https://api.github.com/repos/${repo}/releases/latest`,
      { headers: { Accept: "application/vnd.github+json" } }
    );
    if (!res.ok) throw new Error(`gh ${res.status}`);
    const data = await res.json();
    if (!data.tag_name) throw new Error("no tag");

    const release = {
      tag: data.tag_name,
      prerelease: Boolean(data.prerelease),
      t: Date.now(),
    };
    sessionStorage.setItem(cacheKey, JSON.stringify(release));
    writeRelease(release);
  } catch {
    // Silent — placeholder text remains visible
  }
})();

// Sticker timer: shows "Auto-signed in X.Xs"
const sticker = document.querySelector(".device__sticker");
if (sticker) {
  let val = 0.3;
  setInterval(() => {
    val = +(0.25 + Math.random() * 0.4).toFixed(2);
    sticker.lastChild.textContent = ` Auto-signed in ${val}s`;
  }, 2400);
}
