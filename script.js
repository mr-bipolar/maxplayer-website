// Update footer copyright year
const yearEl = document.getElementById("year");
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

// Mobile navigation menu toggle
const menuButton = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav-links");

if (menuButton && nav) {
  menuButton.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  });

  nav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
    });
  });
}

// Screenshot Showcase Tab Switcher
const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".screens-tab-content");

tabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const targetTab = btn.getAttribute("data-tab");

    tabButtons.forEach(b => b.classList.remove("active"));
    tabContents.forEach(tc => tc.classList.remove("active"));

    btn.classList.add("active");
    const activeContent = document.getElementById(`tab-${targetTab}`);
    if (activeContent) {
      activeContent.classList.add("active");
    }
  });
});

// Lightbox preview for screenshots
const lightboxModal = document.getElementById("lightboxModal");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxCaption = document.getElementById("lightboxCaption");
const lightboxClose = document.getElementById("lightboxClose");

function openLightbox(src, caption) {
  if (!lightboxModal || !lightboxImg) return;
  lightboxImg.src = src;
  lightboxImg.alt = caption || "MaxPlayer Screenshot";
  if (lightboxCaption) {
    lightboxCaption.textContent = caption || "";
  }
  lightboxModal.classList.add("active");
  lightboxModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  if (!lightboxModal || !lightboxImg) return;
  lightboxModal.classList.remove("active");
  lightboxModal.setAttribute("aria-hidden", "true");
  lightboxImg.src = "";
  document.body.style.overflow = "";
}

document.querySelectorAll(".zoomable-img").forEach(item => {
  item.addEventListener("click", () => {
    const src = item.getAttribute("data-src") || item.querySelector("img")?.src || item.src;
    const caption = item.getAttribute("data-caption") || item.querySelector("img")?.alt || item.alt;
    if (src) {
      openLightbox(src, caption);
    }
  });
});

if (lightboxClose) {
  lightboxClose.addEventListener("click", closeLightbox);
}

if (lightboxModal) {
  lightboxModal.addEventListener("click", (e) => {
    if (e.target === lightboxModal) {
      closeLightbox();
    }
  });
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && lightboxModal && lightboxModal.classList.contains("active")) {
    closeLightbox();
  }
});
