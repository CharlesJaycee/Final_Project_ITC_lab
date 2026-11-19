document.addEventListener("DOMContentLoaded", () => {
  const audio = document.getElementById("bg-audio");
  const eqBars = document.getElementById("audio-eq");
  const modal = document.getElementById("popup-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalBody = document.getElementById("modal-body");
  const modalBadge = document.getElementById("modal-badge");
  const closeBtn = document.getElementById("modal-close");

  /* =========================================
     1. SMOOTH VOLUME FADE & EQUALIZER SYNC
     ========================================= */
  function syncEqualizer(isPlaying) {
    if (!eqBars) return;
    eqBars.classList.toggle("is-playing", isPlaying);
  }

  function fadeAudio(targetVolume, duration = 200, callback) {
    if (!audio) {
      if (callback) callback();
      return;
    }

    const startVolume = audio.volume;
    const steps = 15;
    const stepTime = duration / steps;
    const volumeStep = (targetVolume - startVolume) / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const nextVol = startVolume + volumeStep * currentStep;
      audio.volume = Math.min(1, Math.max(0, nextVol));

      if (currentStep >= steps) {
        clearInterval(timer);
        audio.volume = targetVolume;
        if (callback) callback();
      }
    }, stepTime);
  }

  /* =========================================
     2. CONTINUOUS AUDIO INITIALIZATION
     ========================================= */
  if (audio) {
    let isNavigating = false;
    const savedTime = sessionStorage.getItem("cafeAudioTime");
    const shouldPlay = sessionStorage.getItem("cafeAudioPlaying");

    if (savedTime) {
      audio.currentTime = parseFloat(savedTime);
    }

    const startSmoothPlayback = () => {
      audio.volume = 0;
      audio
        .play()
        .then(() => {
          fadeAudio(1, 250);
          syncEqualizer(true);
          sessionStorage.setItem("cafeAudioPlaying", "true");
        })
        .catch(() => {
          audio.volume = 1;
          syncEqualizer(false);
          const unlockAudio = () => {
            audio.volume = 0;
            audio.play().then(() => {
              fadeAudio(1, 250);
              syncEqualizer(true);
            });
            sessionStorage.setItem("cafeAudioPlaying", "true");
            document.removeEventListener("click", unlockAudio);
          };
          document.addEventListener("click", unlockAudio);
        });
    };

    if (shouldPlay !== "false") {
      startSmoothPlayback();
    }

    audio.addEventListener("timeupdate", () => {
      if (!isNavigating) {
        sessionStorage.setItem("cafeAudioTime", audio.currentTime);
      }
    });

    audio.addEventListener("play", () => {
      syncEqualizer(true);
      sessionStorage.setItem("cafeAudioPlaying", "true");
    });

    audio.addEventListener("pause", () => {
      syncEqualizer(false);
      if (!isNavigating) {
        sessionStorage.setItem("cafeAudioPlaying", "false");
      }
    });

    window.addEventListener("beforeunload", () => {
      isNavigating = true;
      sessionStorage.setItem("cafeAudioTime", audio.currentTime);
      sessionStorage.setItem("cafeAudioPlaying", String(!audio.paused));
    });
  }

  /* =========================================
     3. POP-UP MODAL CONTROLS
     ========================================= */
  function openPopup(badgeText, titleText, bodyText) {
    if (!modal) return;
    modalBadge.textContent = badgeText;
    modalTitle.textContent = titleText;
    modalBody.textContent = bodyText;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
  }

  function closePopup() {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  }

  document.querySelectorAll(".nav-cta").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openPopup(
        "STUDENT VIP PASS",
        "15% Off Every Study Session",
        "Show your valid campus ID and code STUDY15 at the counter for 15% off espresso drinks, cold brews, and morning pastries."
      );
    });
  });

  if (closeBtn) closeBtn.addEventListener("click", closePopup);
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closePopup();
    });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePopup();
  });

  /* =========================================
     4. PAGE ANIMATIONS, LIVE HOURS, FILTERS & PRE-ORDER
     ========================================= */
  function initPageFeatures() {
    // A. Live Campus Hours Badge (Mon-Fri 7AM-9PM, Sat 8AM-5PM)
    const statusPill = document.getElementById("live-status-pill");
    const floatingBadge = document.getElementById("floating-status-badge");
    if (statusPill || floatingBadge) {
      const now = new Date();
      const day = now.getDay(); // 0 = Sun, 1-5 = Mon-Fri, 6 = Sat
      const hour = now.getHours();

      let isOpen = false;
      if (day >= 1 && day <= 5) {
        isOpen = hour >= 7 && hour < 21;
      } else if (day === 6) {
        isOpen = hour >= 8 && hour < 17;
      }

      if (statusPill) {
        statusPill.textContent = isOpen ? "OPEN NOW" : "CLOSED NOW";
        statusPill.classList.toggle("is-closed", !isOpen);
      }
      if (floatingBadge) {
        floatingBadge.innerHTML = isOpen ? "OPEN<br>NOW" : "OPENS<br>7 AM";
      }
    }

    // B. Animated Seat Counter (Counts up from 0 to 57)
    const seatCounter = document.getElementById("seat-counter");
    if (seatCounter) {
      const target = parseInt(seatCounter.getAttribute("data-target"), 10) || 57;
      let current = 0;
      const duration = 900;
      const stepTime = Math.max(16, Math.floor(duration / target));

      seatCounter.textContent = "0";
      const counterTimer = setInterval(() => {
        current += 2;
        if (current >= target) {
          seatCounter.textContent = String(target);
          clearInterval(counterTimer);
        } else {
          seatCounter.textContent = String(current);
        }
      }, stepTime);
    }

    // C. Menu Category Filter Pills (menu.html)
    const filterButtons = document.querySelectorAll(".filter-btn");
    const menuItems = document.querySelectorAll(".menu-item");
    if (filterButtons.length && menuItems.length) {
      filterButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          filterButtons.forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");

          const selected = btn.getAttribute("data-filter");
          menuItems.forEach((item) => {
            const categories = (item.getAttribute("data-category") || "").split(" ");
            const matches = selected === "all" || categories.includes(selected);
            item.classList.toggle("is-hidden", !matches);
          });
        });
      });
    }

    // D. One-Click Pre-Order Jump (menu.html -> contact.html)
    document.querySelectorAll(".preorder-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const itemName = btn.getAttribute("data-item");
        if (itemName) {
          sessionStorage.setItem("preorderItem", itemName);
        }
        navigateWithoutAudioCut("contact.html", true);
      });
    });

    // E. Pre-Fill Contact Form if arriving from a Pre-Order click
    const savedPreorder = sessionStorage.getItem("preorderItem");
    const topicSelect = document.getElementById("inquiry-topic");
    const messageBox = document.getElementById("message-box");
    const nameField = document.getElementById("full-name");

    if (savedPreorder && topicSelect && messageBox) {
      topicSelect.value = "preorder";
      messageBox.value = `Hi! I would like to pre-order: ${savedPreorder}.\nPreferred pickup time: `;
      sessionStorage.removeItem("preorderItem");
      if (nameField) nameField.focus();
    }

    // F. Scroll Pop-Up Reveal
    const revealTargets = document.querySelectorAll(
      ".deck-card, .card, .featured-figure, .media-card"
    );

    revealTargets.forEach((el, index) => {
      el.classList.add("reveal-pop");
      el.style.transitionDelay = `${(index % 3) * 90}ms`;
    });

    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            setTimeout(() => {
              entry.target.style.transitionDelay = "0ms";
            }, 600);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    revealTargets.forEach((el) => revealObserver.observe(el));

    // G. 3D Tilt & Spotlight Hover
    const hoverCards = document.querySelectorAll(".deck-card, .card");
    hoverCards.forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -6;
        const rotateY = ((x - centerX) / centerX) * 6;

        card.style.setProperty("--mouse-x", `${x}px`);
        card.style.setProperty("--mouse-y", `${y}px`);
        card.style.transform = `perspective(800px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-6px)`;
      });

      card.addEventListener("mouseleave", () => {
        card.style.transform = "";
      });
    });

    // H. Contact Form Submission Pop-Up
    const contactForm = document.querySelector(".contact-form");
    if (contactForm) {
      contactForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const nameInput = document.getElementById("full-name");
        const userName =
          nameInput && nameInput.value.trim() ? nameInput.value.trim() : "Student";
        openPopup(
          "REQUEST RECEIVED",
          `Thanks, ${userName}!`,
          "Your message has been sent to The Daily Grind team. Check your campus email shortly for confirmation."
        );
        contactForm.reset();
      });
    }
  }

  /* =========================================
     5. ZERO-CUT SEAMLESS PAGE NAVIGATION
     ========================================= */
  function updateActiveNav(targetHref) {
    const pageName = targetHref.split("/").pop() || "index.html";
    document.querySelectorAll(".nav-list a").forEach((navLink) => {
      const linkPage = navLink.getAttribute("href").split("/").pop();
      if (linkPage === pageName) {
        navLink.classList.add("active");
        navLink.setAttribute("aria-current", "page");
      } else {
        navLink.classList.remove("active");
        navLink.removeAttribute("aria-current");
      }
    });
  }

  async function navigateWithoutAudioCut(url, pushHistory = true) {
    try {
      const currentMain = document.querySelector("main");
      if (currentMain) {
        currentMain.classList.add("is-fading");
      }

      const [response] = await Promise.all([
        fetch(url),
        new Promise((resolve) => setTimeout(resolve, 180))
      ]);

      if (!response.ok) throw new Error("Page fetch failed");

      const htmlText = await response.text();
      const parser = new DOMParser();
      const nextDoc = parser.parseFromString(htmlText, "text/html");
      const nextMain = nextDoc.querySelector("main");

      if (!nextMain || !currentMain) {
        window.location.href = url;
        return;
      }

      currentMain.innerHTML = nextMain.innerHTML;
      document.title = nextDoc.title;
      updateActiveNav(url);

      if (pushHistory) {
        window.history.pushState({ url }, "", url);
      }

      window.scrollTo({ top: 0, behavior: "instant" });
      initPageFeatures();

      requestAnimationFrame(() => {
        currentMain.classList.remove("is-fading");
      });
    } catch (err) {
      if (audio && !audio.paused) {
        sessionStorage.setItem("cafeAudioTime", audio.currentTime);
        sessionStorage.setItem("cafeAudioPlaying", "true");
        fadeAudio(0, 120, () => {
          window.location.href = url;
        });
      } else {
        window.location.href = url;
      }
    }
  }

  document.addEventListener("click", (e) => {
    const link = e.target.closest("a[href]");
    if (!link || link.classList.contains("nav-cta")) return;

    const href = link.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto:")) {
      return;
    }

    e.preventDefault();
    navigateWithoutAudioCut(href, true);
  });

  window.addEventListener("popstate", () => {
    const currentFile = window.location.pathname.split("/").pop() || "index.html";
    navigateWithoutAudioCut(currentFile, false);
  });

  initPageFeatures();
});