(function () {
  try {
    var storedTheme = localStorage.getItem("tipid_theme");
    var schemeMeta = document.querySelector('meta[name="color-scheme"]');
    var content = storedTheme === "dark" || storedTheme === "light" ? storedTheme : "light dark";
    if (schemeMeta) schemeMeta.setAttribute("content", content);

    var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    var isDark = storedTheme === "dark" || (storedTheme !== "light" && prefersDark);
    document.documentElement.classList.toggle("dark", isDark);

    var lang = localStorage.getItem("tipid_lang");
    document.documentElement.lang = lang === "tl" ? "fil" : "en";
  } catch (_) {}
})();
