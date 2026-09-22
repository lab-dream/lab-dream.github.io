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

  // Home hero gallery — 5.5초마다 크로스페이드, 마우스/포커스 시 멈춤, 모션 줄이기 설정 존중
  document.querySelectorAll("[data-gallery]").forEach(function (gal) {
    var slides = gal.querySelectorAll(".gallery__slide");
    if (slides.length < 2) return;
    var dots = gal.querySelectorAll("[data-go]");
    var caption = gal.querySelector(".gallery__caption");
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var index = 0, timer = null, paused = false;

    var show = function (i) {
      index = (i + slides.length) % slides.length;
      slides.forEach(function (sl, k) {
        var on = k === index;
        sl.classList.toggle("is-active", on);
        if (on) sl.removeAttribute("aria-hidden"); else sl.setAttribute("aria-hidden", "true");
      });
      dots.forEach(function (d, k) {
        if (k === index) d.setAttribute("aria-current", "true"); else d.removeAttribute("aria-current");
      });
      if (caption) caption.textContent = slides[index].dataset.caption || "";
    };
    var stop = function () { if (timer) { clearInterval(timer); timer = null; } };
    var start = function () {
      stop();
      if (!reduce && !paused && !document.hidden) timer = setInterval(function () { show(index + 1); }, 5500);
    };

    gal.querySelector("[data-prev]").addEventListener("click", function () { show(index - 1); start(); });
    gal.querySelector("[data-next]").addEventListener("click", function () { show(index + 1); start(); });
    dots.forEach(function (d) {
      d.addEventListener("click", function () { show(parseInt(d.dataset.go, 10)); start(); });
    });
    gal.addEventListener("mouseenter", function () { paused = true; stop(); });
    gal.addEventListener("mouseleave", function () { paused = false; start(); });
    gal.addEventListener("focusin", function () { paused = true; stop(); });
    gal.addEventListener("focusout", function () { paused = false; start(); });
    gal.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { show(index - 1); }
      if (e.key === "ArrowRight") { show(index + 1); }
    });
    // 터치 스와이프
    var x0 = null;
    gal.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    gal.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) { show(index + (dx < 0 ? 1 : -1)); start(); }
    });
    document.addEventListener("visibilitychange", start);
    start();
  });

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

  // 과제 영상 — 화면에 보일 때만 재생(데이터 절약), 모션 줄이기 설정이면 자동재생 안 함
  document.querySelectorAll("video[data-autoplay]").forEach(function (video) {
    var btn = video.parentElement.querySelector(".media-toggle");
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var userPaused = reduce;
    function sync() {
      if (!btn) return;
      var paused = video.paused;
      btn.classList.toggle("is-paused", paused);
      btn.setAttribute("aria-label", paused ? btn.dataset.labelPlay : btn.dataset.labelPause);
    }
    function play() { var p = video.play(); if (p && p.catch) p.catch(function () {}); }
    if (btn) {
      btn.hidden = false;
      btn.addEventListener("click", function () {
        if (video.paused) { userPaused = false; play(); } else { userPaused = true; video.pause(); }
      });
    }
    video.addEventListener("play", sync);
    video.addEventListener("pause", sync);
    sync();
    if (!("IntersectionObserver" in window)) { if (!userPaused) play(); return; }
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { if (!userPaused) play(); } else if (!video.paused) video.pause();
      });
    }, { threshold: 0.35 }).observe(video);
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
