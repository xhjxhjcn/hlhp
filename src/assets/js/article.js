/* Article page: scroll-spy outline + reading progress in the title bar. */
(function () {
  "use strict";

  var body = document.querySelector("[data-article-body]");
  if (!body) return;

  var links = Array.prototype.slice.call(document.querySelectorAll("[data-outline-link]"));
  var headings = links
    .map(function (link) {
      var target = document.getElementById(link.getAttribute("data-outline-link"));
      return target ? { link: link, target: target } : null;
    })
    .filter(Boolean);

  if (headings.length) {
    var ticking = false;
    var update = function () {
      var line = window.scrollY + 140;
      var active = headings[0];
      headings.forEach(function (item) {
        if (item.target.offsetTop <= line) active = item;
      });
      headings.forEach(function (item) {
        item.link.classList.toggle("is-active", item === active);
      });
      ticking = false;
    };

    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(update);
        }
      },
      { passive: true }
    );
    update();
  }

  /* ------------------------------------------------------ copy the URL */
  var topbar = document.querySelector(".article-topbar-actions");
  if (topbar && navigator.clipboard) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.setAttribute("aria-label", "复制本页链接");
    btn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';
    btn.addEventListener("click", function () {
      navigator.clipboard
        .writeText(window.location.href)
        .then(function () {
          btn.setAttribute("aria-label", "链接已复制");
          btn.style.background = "#e8eedb";
          window.setTimeout(function () {
            btn.setAttribute("aria-label", "复制本页链接");
            btn.style.background = "";
          }, 1600);
        })
        .catch(function () {
          /* clipboard blocked — no visible failure needed */
        });
    });
    topbar.insertBefore(btn, topbar.firstChild);
  }
})();
