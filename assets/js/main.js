/* DREAM Lab. — small progressive enhancements (사이트는 JS 없이도 동작합니다) */
(function () {
  "use strict";

  // Mobile navigation
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
    });
  }

  // Home: 다크 히어로 위에서는 어두운 헤더, 스크롤하면 밝은 헤더
  var header = document.querySelector(".site-header");
  if (header && document.body.classList.contains("is-home")) {
    var hero = document.querySelector(".hero");
    var onScroll = function () {
      var limit = hero ? hero.offsetHeight - header.offsetHeight : 80;
      header.classList.toggle("is-scrolled", window.scrollY > limit);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
  }

  // Click-to-load YouTube (가벼운 썸네일 → 클릭 시 플레이어 로드)
  document.querySelectorAll("[data-yt]").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      var iframe = document.createElement("iframe");
      iframe.src = "https://www.youtube-nocookie.com/embed/" + btn.dataset.yt + "?autoplay=1&rel=0";
      iframe.title = btn.getAttribute("aria-label") || "YouTube video";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframe.allowFullscreen = true;
      var frame = document.createElement("div");
      frame.className = btn.className;
      frame.appendChild(iframe);
      btn.replaceWith(frame);
    });
  });

  // Publication filters (type chips + text search)
  var list = document.querySelector("[data-pub-list]");
  if (list) {
    var chips = document.querySelectorAll("[data-filter]");
    var search = document.querySelector("[data-pub-search]");
    var empty = document.querySelector("[data-pub-empty]");
    var years = list.querySelectorAll(".pub-year");
    var state = { type: "all", q: "" };

    var apply = function () {
      var shown = 0;
      years.forEach(function (year) {
        var n = 0;
        year.querySelectorAll(".pub").forEach(function (pub) {
          var okType = state.type === "all" || pub.dataset.type === state.type;
          var okText = !state.q || pub.dataset.search.indexOf(state.q) !== -1;
          var ok = okType && okText;
          pub.hidden = !ok;
          if (ok) n++;
        });
        year.hidden = n === 0;
        shown += n;
      });
      if (empty) empty.hidden = shown !== 0;
    };

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
        chip.setAttribute("aria-pressed", "true");
        state.type = chip.dataset.filter;
        apply();
      });
    });
    if (search) {
      search.addEventListener("input", function () {
        state.q = search.value.trim().toLowerCase();
        apply();
      });
    }
  }

  // BibTeX toggle + copy
  document.querySelectorAll("[data-bibtex-toggle]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var box = btn.closest(".pub__body").querySelector(".bibtex");
      var open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      box.hidden = open;
    });
  });
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.parentElement.querySelector("code").textContent;
      if (!navigator.clipboard) return;
      navigator.clipboard.writeText(text).then(function () {
        var label = btn.textContent;
        btn.textContent = btn.dataset.copied || "Copied";
        setTimeout(function () { btn.textContent = label; }, 1500);
      });
    });
  });
})();
