/* About page: changelog modal is bound by site.js; nothing else needed yet. */
(function () {
  "use strict";

  // Reveal sections gently on first scroll (respects reduced motion via CSS).
  var sections = Array.prototype.slice.call(
    document.querySelectorAll("[data-about] .about-profile, [data-about] .about-license")
  );
  if (!sections.length || !("IntersectionObserver" in window)) return;

  sections.forEach(function (section) {
    section.style.opacity = "0";
    section.style.transform = "translateY(14px)";
    section.style.transition = "opacity .6s ease, transform .6s cubic-bezier(.22,.7,.22,1)";
  });

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.style.opacity = "1";
        entry.target.style.transform = "none";
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -12% 0px" }
  );

  sections.forEach(function (section) {
    observer.observe(section);
  });
})();
