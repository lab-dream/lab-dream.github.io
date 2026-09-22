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

  // 구간 클립 — YouTube 영상의 일부 구간(start~end)을 소리 없이 반복 재생 (GIF처럼).
  // 화면에 보일 때 플레이어를 불러오고, 벗어나면 멈춤. 🔇 버튼을 누르면 소리를 켜고 구간 처음부터.
  // 모션 줄이기 설정이면 자동재생 없이 누를 때만 재생합니다.
  var ytQueue = null;
  function loadYT(cb) {
    if (window.YT && window.YT.Player) return cb();
    if (ytQueue) return ytQueue.push(cb);
    ytQueue = [cb];
    var prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
      if (prev) prev();
      ytQueue.forEach(function (f) { f(); });
    };
    var s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(s);
  }
  var CLIP_ICON = {
    play: '<path d="M8 5v14l11-7z" fill="currentColor"/>',
    muted: '<path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16.5 9.5l5 5m0-5l-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    sound: '<path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'
  };
  document.querySelectorAll("[data-clip]").forEach(function (box) {
    var start = Math.floor(parseFloat(box.dataset.start) || 0);
    var end = parseFloat(box.dataset.end) || start + 6;
    var btn = box.querySelector(".clip__btn");
    var frame = box.querySelector(".clip__frame");
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var player = null, ready = false, sound = false, visible = false;

    function setBtn() {
      var mode = !player ? "play" : sound ? "sound" : "muted";
      var text = mode === "play" ? box.dataset.labelPlay : mode === "sound" ? box.dataset.labelOff : box.dataset.labelOn;
      btn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">' + CLIP_ICON[mode] + "</svg>";
      btn.setAttribute("aria-label", text);
      btn.title = text;
    }
    function tick() {
      if (!ready) return;
      var t = player.getCurrentTime();
      if (player.getPlayerState() === 1 && t > start + 0.2) box.classList.remove("is-buffering");
      if (t >= end - 0.05 || t < start - 1) {
        box.classList.add("is-buffering");   // 되감는 순간의 로딩 표시를 잠깐 가림
        player.seekTo(start, true);
      }
    }
    function create(withSound) {
      if (player) return;
      sound = withSound;
      box.classList.add("is-loading");
      loadYT(function () {
        var target = document.createElement("div"); // YT가 이 요소를 iframe으로 바꿈 → .clip__frame 안에 들어가 CSS가 적용됨
        frame.appendChild(target);
        player = new YT.Player(target, {
          host: "https://www.youtube-nocookie.com",
          videoId: box.dataset.clip,
          playerVars: { start: start, autoplay: 1, mute: withSound ? 0 : 1, controls: 0, rel: 0, playsinline: 1, disablekb: 1, fs: 0, iv_load_policy: 3 },
          events: {
            onReady: function (e) {
              ready = true;
              if (sound) e.target.unMute(); else e.target.mute();
              if (visible || withSound) e.target.playVideo();
              setInterval(tick, 150);
              setBtn();
            },
            onStateChange: function (e) {
              if (e.data === YT.PlayerState.PLAYING) {
                box.classList.remove("is-loading");
                box.classList.add("is-playing");
              }
              if (e.data === YT.PlayerState.ENDED) { e.target.seekTo(start, true); e.target.playVideo(); }
            }
          }
        });
        var iframe = frame.querySelector("iframe");
        if (iframe) iframe.setAttribute("tabindex", "-1");
        setBtn();
      });
    }
    function toggleSound() {
      if (!player) { create(true); return; }
      if (!ready) return;
      sound = !sound;
      if (sound) { player.unMute(); player.setVolume(100); box.classList.add("is-buffering"); player.seekTo(start, true); player.playVideo(); }
      else player.mute();
      setBtn();
    }

    btn.hidden = false;
    setBtn();
    btn.addEventListener("click", function (e) { e.stopPropagation(); toggleSound(); });
    box.addEventListener("click", toggleSound);

    if (!("IntersectionObserver" in window)) { if (!reduce) { visible = true; create(false); } return; }
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        visible = en.isIntersecting;
        if (visible && !player) { if (!reduce) create(false); }
        else if (ready) { if (visible) player.playVideo(); else player.pauseVideo(); }
      });
    }, { threshold: 0.4 }).observe(box);
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
