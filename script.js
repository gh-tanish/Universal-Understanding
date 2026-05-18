document.addEventListener("DOMContentLoaded", () => {

  const toggleBtn = document.getElementById("theme-toggle");

  /* =========================
     1. MOBILE BROWSER BAR COLOR
  ========================= */

  let themeMeta = document.querySelector('meta[name="theme-color"]');

  if (!themeMeta) {
    themeMeta = document.createElement("meta");
    themeMeta.name = "theme-color";
    document.head.appendChild(themeMeta);
  }

  function updateThemeColor() {

    if (document.body.classList.contains("light-mode")) {
      themeMeta.setAttribute("content", "#dfe5ee");
    } else {
      themeMeta.setAttribute("content", "#0b0b0f");
    }

  }

  /* =========================
     2. LOAD SAVED THEME ONLY
  ========================= */

  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "light") {
    document.body.classList.add("light-mode");
    document.documentElement.classList.add("light-mode");
  }

  /* =========================
     3. UPDATE BUTTON TEXT
  ========================= */

  function updateButton() {

    if (!toggleBtn) return;

    if (document.body.classList.contains("light-mode")) {
      toggleBtn.textContent = "⏾ Dark Mode";
    } else {
      toggleBtn.textContent = "𖤓 Light Mode";
    }

  }

  updateButton();
  updateThemeColor();

  /* =========================
     4. THEME TOGGLE
  ========================= */

  if (toggleBtn) {

    toggleBtn.addEventListener("click", () => {

      /* Prevent visual flicker during theme switch */
      document.body.classList.add("theme-switching");

      /* Toggle theme */
      document.body.classList.toggle("light-mode");
      document.documentElement.classList.toggle("light-mode");

      /* Save preference */
      if (document.body.classList.contains("light-mode")) {
        localStorage.setItem("theme", "light");
      } else {
        localStorage.setItem("theme", "dark");
      }

      updateButton();
      updateThemeColor();

      /* Re-enable transitions */
      setTimeout(() => {
        document.body.classList.remove("theme-switching");
      }, 80);

    });

  }

  /* =========================
     5. ACTIVE NAV LINK HIGHLIGHT
  ========================= */

  const links = document.querySelectorAll("nav a");

  links.forEach(link => {

    if (link.href === window.location.href) {
      link.style.opacity = "1";
      link.style.textDecoration = "underline";
    }

  });

  /* =========================
     6. SMOOTH PAGE READY STATE
  ========================= */

  document.body.classList.add("loaded");

});

window.addEventListener("load", () => {
  document.body.classList.remove("preload");
});


/* =========================
   PRONUNCIATION SYSTEM
========================= */

let selectedVoice = null;

/* Load + lock voices once available */
function loadVoices() {

  const voices = speechSynthesis.getVoices();

  /* Prefer stable UK female voices */
  selectedVoice =
    voices.find(v => v.name === "Google UK English Female") ||
    voices.find(v => v.name === "Microsoft Susan Desktop - English (United Kingdom)") ||
    voices.find(v =>
      v.lang === "en-GB" &&
      /female|woman|girl/i.test(v.name)
    ) ||
    voices.find(v => v.lang === "en-GB") ||
    voices.find(v => v.lang.startsWith("en")) ||
    voices[0] ||
    null;

}

/* Fix Chrome async voice loading */
loadVoices();
speechSynthesis.onvoiceschanged = loadVoices;

function pronounceWord(text) {

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  utterance.rate = 0.95;
  utterance.pitch = 1;

  if (selectedVoice) {
    utterance.voice = selectedVoice;
    utterance.lang = selectedVoice.lang;
  } else {
    utterance.lang = "en-GB";
  }

  speechSynthesis.speak(utterance);

}