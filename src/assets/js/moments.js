/* Moments page: keyboard/swipe photo lightbox. Columns are laid out at build time. */
(function () {
  "use strict";

  var page = document.querySelector("[data-moments]");
  if (!page) return;

  var dataNode = document.getElementById("photo-data");
  var items = [];
  try {
    items = JSON.parse(dataNode ? dataNode.textContent : "[]");
  } catch (error) {
    items = [];
  }
  if (!items.length) return;

  var box = document.querySelector("[data-lightbox]");
  if (!box) return;

  var imgNode = box.querySelector("[data-lb-img]");
  var titleNode = box.querySelector("[data-lb-title]");
  var descNode = box.querySelector("[data-lb-desc]");
  var metaNode = box.querySelector("[data-lb-meta]");
  var counterNode = box.querySelector("[data-lb-counter]");
  var index = 0;
  var lastFocus = null;

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function show(i) {
    index = (i + items.length) % items.length;
    var item = items[index];
    imgNode.src = item.src;
    imgNode.alt = item.title;
    titleNode.textContent = item.title;
    descNode.textContent = item.description || "";
    metaNode.textContent = [item.date, item.location, item.camera, item.shutter, item.aperture, "ISO " + item.iso]
      .filter(Boolean)
      .join("  ·  ");
    counterNode.textContent = pad(index + 1) + " / " + pad(items.length);
  }

  function open(i) {
    lastFocus = document.activeElement;
    show(i);
    box.classList.add("is-open");
    document.body.classList.add("is-locked");
    var closeBtn = box.querySelector("[data-lb-close]");
    if (closeBtn) closeBtn.focus();
  }

  function close() {
    box.classList.remove("is-open");
    document.body.classList.remove("is-locked");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  page.addEventListener("click", function (event) {
    var card = event.target.closest("[data-photo]");
    if (!card) return;
    var id = card.getAttribute("data-photo");
    var found = items.findIndex(function (item) {
      return item.id === id;
    });
    open(found < 0 ? 0 : found);
  });

  box.querySelector("[data-lb-close]").addEventListener("click", close);
  box.querySelector("[data-lb-prev]").addEventListener("click", function () {
    show(index - 1);
  });
  box.querySelector("[data-lb-next]").addEventListener("click", function () {
    show(index + 1);
  });
  box.addEventListener("click", function (event) {
    if (event.target === box || event.target.classList.contains("lightbox-stage")) close();
  });

  document.addEventListener("keydown", function (event) {
    if (!box.classList.contains("is-open")) return;
    if (event.key === "Escape") close();
    if (event.key === "ArrowLeft") show(index - 1);
    if (event.key === "ArrowRight") show(index + 1);
  });

  /* --------------------------------------------------------- swipe */
  var startX = null;
  box.addEventListener(
    "touchstart",
    function (event) {
      startX = event.touches[0].clientX;
    },
    { passive: true }
  );
  box.addEventListener(
    "touchend",
    function (event) {
      if (startX === null) return;
      var dx = event.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 46) show(index + (dx < 0 ? 1 : -1));
      startX = null;
    },
    { passive: true }
  );
})();
