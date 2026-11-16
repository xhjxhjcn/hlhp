/* Home page: pointer glow, warm light, headline rotation, panel tabs. */
(function () {
  "use strict";

  var page = document.querySelector("[data-home]");
  if (!page) return;

  var board = page.querySelector(".qc-board");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function readJson(id, fallback) {
    var node = document.getElementById(id);
    if (!node) return fallback;
    try {
      return JSON.parse(node.textContent);
    } catch (error) {
      return fallback;
    }
  }

  /* ----------------------------------------------------- pointer glow */
  if (board && !reduceMotion) {
    var raf = null;
    board.addEventListener(
      "pointermove",
      function (event) {
        if (raf) return;
        raf = window.requestAnimationFrame(function () {
          var rect = board.getBoundingClientRect();
          board.style.setProperty("--pointer-x", (event.clientX - rect.left).toFixed(0) + "px");
          board.style.setProperty("--pointer-y", (event.clientY - rect.top).toFixed(0) + "px");
          raf = null;
        });
      },
      { passive: true }
    );
  }

  /* ------------------------------------------------------- warm light */
  var lightSwitch = page.querySelector("[data-light]");
  if (lightSwitch) {
    var stored = null;
    try {
      stored = window.localStorage.getItem("juhuayu:warm");
    } catch (error) {
      stored = null;
    }

    var applyWarm = function (value) {
      page.classList.toggle("is-warm", !!value);
      lightSwitch.setAttribute("aria-pressed", value ? "true" : "false");
      lightSwitch.setAttribute("aria-label", value ? "关掉暖光" : "点亮暖光");
      try {
        window.localStorage.setItem("juhuayu:warm", value ? "1" : "0");
      } catch (error) {
        /* storage unavailable — the switch still works for this visit */
      }
    };

    applyWarm(stored === "1");

    lightSwitch.addEventListener("click", function () {
      applyWarm(!page.classList.contains("is-warm"));
    });
  }

  /* ------------------------------------------ headline + pager captions */
  var headlineNode = page.querySelector("[data-headline]");
  var pagerNote = page.querySelector("[data-pager-note]");
  var headlines = readJson("headline-data", headlineNode ? [headlineNode.textContent.trim()] : []);
  var notes = readJson("pager-data", pagerNote ? [pagerNote.textContent.trim()] : [""]);
  var index = 0;

  function step(delta) {
    if (!headlineNode || headlines.length < 2) return;
    index = (index + delta + headlines.length) % headlines.length;
    if (reduceMotion) {
      headlineNode.textContent = headlines[index];
    } else {
      headlineNode.style.opacity = "0";
      window.setTimeout(function () {
        headlineNode.textContent = headlines[index];
        headlineNode.style.opacity = "1";
      }, 150);
    }
    if (pagerNote && notes.length) pagerNote.textContent = notes[index % notes.length];
  }

  if (headlineNode) {
    if (!reduceMotion) {
      headlineNode.style.transition = "opacity .2s ease";
    }
    var prevBtn = page.querySelector('[data-pager="prev"]');
    var nextBtn = page.querySelector('[data-pager="next"]');
    var randomBtn = page.querySelector('[data-pager="random"]');
    if (prevBtn) prevBtn.addEventListener("click", function () {
      step(-1);
    });
    if (nextBtn) nextBtn.addEventListener("click", function () {
      step(1);
    });
    if (randomBtn)
      randomBtn.addEventListener("click", function () {
        step(1 + Math.floor(Math.random() * Math.max(1, headlines.length - 1)));
      });
  }

  /* ------------------------------------------------------ left panel tabs */
  var panelTabs = Array.prototype.slice.call(page.querySelectorAll("[data-panel-tab]"));
  var panels = {
    notice: page.querySelector('[data-panel="notice"]'),
    calendar: page.querySelector('[data-panel="calendar"]'),
    stats: page.querySelector('[data-panel="stats"]'),
  };

  panelTabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var target = tab.getAttribute("data-panel-tab");
      panelTabs.forEach(function (other) {
        other.setAttribute("aria-pressed", other === tab ? "true" : "false");
      });
      Object.keys(panels).forEach(function (key) {
        var panel = panels[key];
        if (!panel || key === "notice") return;
        panel.hidden = key !== target;
      });
    });
  });

  /* ------------------------------------------------- mobile section tabs */
  var sectionTabs = Array.prototype.slice.call(page.querySelectorAll("[data-tab]"));
  var leftColumn = page.querySelector(".qc-left");
  var rightColumn = page.querySelector(".qc-right");
  var centerColumn = page.querySelector(".qc-center");

  sectionTabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var key = tab.getAttribute("data-tab");
      sectionTabs.forEach(function (other) {
        other.setAttribute("aria-pressed", other === tab ? "true" : "false");
      });
      var show = function (node, visible) {
        if (node) node.style.display = visible ? "" : "none";
      };
      show(centerColumn, key === "canvas");
      show(rightColumn, key === "feed" || key === "canvas");
      show(leftColumn, key === "left" || key === "canvas");
    });
  });
})();
