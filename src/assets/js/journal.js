/* Journal page: list/card view toggle, persisted per visitor. */
(function () {
  "use strict";

  var grid = document.querySelector("[data-grid]");
  var toggle = document.querySelector("[data-view-toggle]");
  if (!grid || !toggle) return;

  var STORAGE_KEY = "juhuayu:journal-view";
  var label = toggle.querySelector("[data-view-label]");

  function apply(view) {
    var isList = view === "list";
    grid.classList.toggle("is-list-view", isList);
    toggle.setAttribute("aria-pressed", isList ? "true" : "false");
    toggle.setAttribute("aria-label", isList ? "切换为卡片模式" : "切换为列表模式");
    if (label) label.textContent = isList ? "卡片模式" : "列表模式";
    try {
      window.localStorage.setItem(STORAGE_KEY, view);
    } catch (error) {
      /* private mode — the toggle still works for this visit */
    }
  }

  var stored = "cards";
  try {
    stored = window.localStorage.getItem(STORAGE_KEY) || "cards";
  } catch (error) {
    stored = "cards";
  }
  apply(stored);

  toggle.addEventListener("click", function () {
    apply(grid.classList.contains("is-list-view") ? "cards" : "list");
  });
})();
