
(() => {
  "use strict";

  const root = document.documentElement;
  const body = document.body;

  const themeToggle = document.getElementById("theme-toggle");
  const themeIcon = themeToggle?.querySelector(".theme-icon");
  const themeLabel = themeToggle?.querySelector(".theme-label");

  const menuToggle = document.getElementById("menu-toggle");
  const navLinks = document.getElementById("nav-links");

  const progressBar = document.getElementById("scroll-progress");
  const scrollTopButton = document.getElementById("scroll-top");

  const motionQuery = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  /* ----------------------------------
     Theme
  ---------------------------------- */

  function getSavedTheme() {
    try {
      const saved = localStorage.getItem("dws-theme");

      if (saved === "light" || saved === "dark") {
        return saved;
      }
    } catch (_) {
      // Storage may be unavailable.
    }

    return null;
  }

  function setTheme(theme, save = false) {
    const validTheme = theme === "dark" ? "dark" : "light";

    root.dataset.theme = validTheme;

    if (themeIcon) {
      themeIcon.textContent = validTheme === "dark" ? "☀" : "☾";
    }

    if (themeLabel) {
      themeLabel.textContent =
        validTheme === "dark" ? "Light mode" : "Dark mode";
    }

    if (themeToggle) {
      themeToggle.setAttribute(
        "aria-label",
        validTheme === "dark"
          ? "Switch to light theme"
          : "Switch to dark theme"
      );
    }

    const themeColor = document.querySelector(
      'meta[name="theme-color"]'
    );

    if (themeColor) {
      themeColor.content =
        validTheme === "dark" ? "#0c1220" : "#f7f9fc";
    }

    if (save) {
      try {
        localStorage.setItem("dws-theme", validTheme);
      } catch (_) {
        // The theme still works when storage is unavailable.
      }
    }
  }

  const savedTheme = getSavedTheme();

  const systemDark = window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  setTheme(savedTheme || (systemDark ? "dark" : "light"));

  themeToggle?.addEventListener("click", () => {
    const nextTheme =
      root.dataset.theme === "dark" ? "light" : "dark";

    setTheme(nextTheme, true);
  });

  /* ----------------------------------
     Mobile navigation
  ---------------------------------- */

  function closeMenu() {
    if (!navLinks || !menuToggle) return;

    navLinks.classList.remove("is-open");

    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
  }

  menuToggle?.addEventListener("click", () => {
    if (!navLinks) return;

    const isOpen = navLinks.classList.toggle("is-open");

    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Close navigation" : "Open navigation"
    );
  });

  navLinks?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  // Close the menu when the user clicks outside it.
  document.addEventListener("click", (event) => {
    if (
      !navLinks ||
      !menuToggle ||
      !navLinks.classList.contains("is-open")
    ) {
      return;
    }

    const target = event.target;

    if (
      target instanceof Node &&
      !navLinks.contains(target) &&
      !menuToggle.contains(target)
    ) {
      closeMenu();
    }
  });

  // Reset mobile navigation when returning to desktop layout.
  const desktopQuery = window.matchMedia("(min-width: 701px)");

  desktopQuery.addEventListener("change", (event) => {
    if (event.matches) {
      closeMenu();
    }
  });

  // Allow keyboard users to close the mobile menu with Escape.
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });

  /* ----------------------------------
     Project filters
  ---------------------------------- */

  const filterButtons = document.querySelectorAll(".filter-button");
  const projectCards = document.querySelectorAll(".project-card");

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter || "all";

      filterButtons.forEach((item) => {
        const active = item === button;

        item.classList.toggle("active", active);
        item.setAttribute("aria-pressed", String(active));
      });

      projectCards.forEach((card) => {
        const show =
          filter === "all" || card.dataset.category === filter;

        card.classList.toggle("is-hidden", !show);

        if (show) {
          // Restart the entrance animation when a card reappears.
          card.classList.remove("is-visible");

          if (!motionQuery.matches) {
            void card.offsetWidth;
          }

          card.classList.add("is-visible");
        } else {
          card.classList.remove("is-visible");
        }
      });
    });
  });

  /* ----------------------------------
     Dynamic copyright year
  ---------------------------------- */

  const year = document.getElementById("year");

  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  /* ----------------------------------
     Scroll reveal
     Elements animate into view when
     scrolling down OR scrolling back up.
  ---------------------------------- */

  const revealItems = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window && !motionQuery.matches) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          } else {
            // Remove the visible state after leaving the viewport.
            // This enables the entrance animation in both directions.
            entry.target.classList.remove("is-visible");
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -35px 0px"
      }
    );

    revealItems.forEach((item, index) => {
      item.style.setProperty(
        "--reveal-delay",
        `${Math.min(index % 4, 3) * 65}ms`
      );

      revealObserver.observe(item);
    });
  } else {
    revealItems.forEach((item) => {
      item.classList.add("is-visible");
    });
  }

  /* ----------------------------------
     Scroll progress and back-to-top
  ---------------------------------- */

  let scrollTicking = false;

  function updateScrollUI() {
    const scrollTop =
      window.scrollY ||
      document.documentElement.scrollTop ||
      0;

    const scrollableHeight =
      document.documentElement.scrollHeight -
      window.innerHeight;

    const progress =
      scrollableHeight > 0
        ? Math.min(100, Math.max(0, (scrollTop / scrollableHeight) * 100))
        : 0;

    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }

    if (scrollTopButton) {
      scrollTopButton.classList.toggle(
        "is-visible",
        scrollTop > 450
      );
    }

    scrollTicking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!scrollTicking) {
        window.requestAnimationFrame(updateScrollUI);
        scrollTicking = true;
      }
    },
    { passive: true }
  );

  window.addEventListener("resize", updateScrollUI, { passive: true });

  scrollTopButton?.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: motionQuery.matches ? "auto" : "smooth"
    });
  });

  updateScrollUI();

  /* ----------------------------------
     Keep the initial viewport visible
     if reduced motion is enabled.
  ---------------------------------- */

  motionQuery.addEventListener("change", (event) => {
    if (event.matches) {
      revealItems.forEach((item) => {
        item.classList.add("is-visible");
        item.style.removeProperty("--reveal-delay");
      });
    }
  });
})();
