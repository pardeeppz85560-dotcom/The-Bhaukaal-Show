
"use strict";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// =====================================
// 1. TOAST NOTIFICATION
// =====================================
let toastTimer;

function showToast(message) {
  const toast = $("#toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
}

// =====================================
// 2. CURRENT YEAR
// =====================================
const yearElement = $("#year");

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

// =====================================
// 3. MOBILE NAVIGATION
// =====================================
const menuBtn = $("#menuBtn");
const nav = $("#nav");

function closeMenu() {
  if (!nav || !menuBtn) return;

  nav.classList.remove("open");
  menuBtn.textContent = "☰";
  menuBtn.setAttribute("aria-expanded", "false");
}

if (menuBtn && nav) {
  menuBtn.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");

    menuBtn.textContent = isOpen ? "✕" : "☰";
    menuBtn.setAttribute("aria-expanded", String(isOpen));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
}

// =====================================
// 4. DARK / LIGHT THEME
// =====================================
const THEME_KEY = "bhaukaalShowTheme";
const themeToggle = $("#themeToggle");

function applyTheme(theme) {
  const light = theme === "light";

  document.body.classList.toggle("light-mode", light);

  if (themeToggle) {
    themeToggle.textContent = light ? "🌙 Dark" : "☀️ Light";
    themeToggle.setAttribute("aria-pressed", String(light));
  }

  try {
    localStorage.setItem(THEME_KEY, light ? "light" : "dark");
  } catch (error) {
    // Theme still works for the current page.
  }
}

let savedTheme = "dark";

try {
  savedTheme = localStorage.getItem(THEME_KEY) || "dark";
} catch (error) {
  // Use the default theme.
}

applyTheme(savedTheme);

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const isLight = document.body.classList.contains("light-mode");
    applyTheme(isLight ? "dark" : "light");
  });
}

// =====================================
// 5. PROFILE PHOTO UPLOAD
// =====================================
const PHOTO_KEY = "bhaukaalShowProfilePhoto";
const photoInput = $("#photoInput");
const heroPhoto = $("#heroPhoto");
const photoPlaceholder = $("#photoPlaceholder");

function showProfilePhoto(src) {
  if (!heroPhoto || !photoPlaceholder) return;

  heroPhoto.src = src;
  heroPhoto.hidden = false;
  photoPlaceholder.hidden = true;
}

try {
  const savedPhoto = localStorage.getItem(PHOTO_KEY);

  if (savedPhoto) {
    showProfilePhoto(savedPhoto);
  }
} catch (error) {
  // Saved photo may be unavailable.
}

if (photoInput) {
  photoInput.addEventListener("change", (event) => {
    const file = event.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please select a valid image.");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast("Please choose an image under 2 MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const imageData = reader.result;

      showProfilePhoto(imageData);

      try {
        localStorage.setItem(PHOTO_KEY, imageData);
        showToast("Profile photo saved in this browser!");
      } catch (error) {
        showToast("Photo preview updated but could not be saved.");
      }
    };

    reader.onerror = () => {
      showToast("Unable to read the selected image.");
    };

    reader.readAsDataURL(file);
  });
}

// =====================================
// 6. VIDEO CATEGORY FILTERS
// =====================================
const videoGrid = $("#videoGrid");
const filterButtons = $$(".filter");

function filterVideos(category) {
  filterButtons.forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.category === category
    );
  });

  $$(".video-card").forEach((card) => {
    card.hidden =
      category !== "All" &&
      card.dataset.category !== category;
  });
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterVideos(button.dataset.category || "All");
  });
});

// =====================================
// 7. YOUTUBE URL VALIDATION
// =====================================
function getYouTubeId(rawUrl) {
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");

    let id = "";

    if (host === "youtu.be") {
      id = url.pathname.split("/").filter(Boolean)[0] || "";
    } else if (
      ["youtube.com", "m.youtube.com", "music.youtube.com"].includes(host)
    ) {
      if (url.pathname === "/watch") {
        id = url.searchParams.get("v") || "";
      } else {
        const parts = url.pathname.split("/").filter(Boolean);

        if (["embed", "shorts", "live"].includes(parts[0])) {
          id = parts[1] || "";
        }
      }
    }

    return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch (error) {
    return null;
  }
}

// =====================================
// 8. SAVE AND LOAD VIDEOS
// =====================================
const VIDEO_KEY = "bhaukaalShowVideos";

function readVideos() {
  try {
    const videos = JSON.parse(
      localStorage.getItem(VIDEO_KEY) || "[]"
    );

    return Array.isArray(videos) ? videos : [];
  } catch (error) {
    return [];
  }
}

function buildVideoCard(video) {
  const card = document.createElement("article");
  card.className = "video-card";
  card.dataset.category = video.category;

  const cover = document.createElement("a");
  cover.className = "video-cover cover-one";
  cover.href =
    "https://www.youtube.com/watch?v=" +
    encodeURIComponent(video.id);
  cover.target = "_blank";
  cover.rel = "noopener noreferrer";
  cover.setAttribute("aria-label", "Watch " + video.title);

  const label = document.createElement("span");
  label.textContent = "▶ YOUR VIDEO";

  const coverTitle = document.createElement("b");
  coverTitle.textContent = video.category.toUpperCase();

  const play = document.createElement("i");
  play.textContent = "▶";

  cover.append(label, coverTitle, play);

  const info = document.createElement("div");
  info.className = "video-info";

  const category = document.createElement("span");
  category.textContent = video.category;

  const title = document.createElement("h3");
  title.textContent = video.title;

  const description = document.createElement("p");
  description.textContent = "Watch this video on YouTube.";

  const link = document.createElement("a");
  link.href = cover.href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "Watch on YouTube ↗";

  info.append(category, title, description, link);
  card.append(cover, info);

  return card;
}

function renderSavedVideos() {
  if (!videoGrid) return;

  readVideos().forEach((video) => {
    if (
      video &&
      /^[A-Za-z0-9_-]{11}$/.test(video.id) &&
      typeof video.title === "string" &&
      typeof video.category === "string"
    ) {
      videoGrid.appendChild(buildVideoCard(video));
    }
  });
}

renderSavedVideos();

// =====================================
// 9. ADD A VIDEO
// =====================================
const videoForm = $("#videoForm");

if (videoForm) {
  videoForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const title = $("#videoTitle").value.trim();
    const rawUrl = $("#videoUrl").value.trim();
    const category = $("#videoCategory").value;
    const id = getYouTubeId(rawUrl);

    if (!title) {
      showToast("Please enter a video title.");
      return;
    }

    if (!id) {
      showToast("Please enter a valid YouTube video URL.");
      return;
    }

    const videos = readVideos();

    if (videos.some((video) => video.id === id)) {
      showToast("This video is already added.");
      return;
    }

    const newVideo = { id, title, category };
    videos.unshift(newVideo);

    try {
      localStorage.setItem(VIDEO_KEY, JSON.stringify(videos));
    } catch (error) {
      showToast("Browser storage is full. Video was not saved.");
      return;
    }

    if (videoGrid) {
      videoGrid.prepend(buildVideoCard(newVideo));
    }

    videoForm.reset();
    filterVideos("All");
    showToast("Video added successfully!");
  });
}

// =====================================
// 10. PHOTO GALLERY UPLOAD
// =====================================
const galleryUpload = $("#galleryUpload");
const galleryGrid = $("#galleryGrid");

if (galleryUpload && galleryGrid) {
  galleryUpload.addEventListener("change", (event) => {
    const files = Array.from(event.target.files || []);

    const validFiles = files.filter(
      (file) =>
        file.type.startsWith("image/") &&
        file.size <= 5 * 1024 * 1024
    );

    if (validFiles.length < files.length) {
      showToast("Some photos were skipped. Images must be under 5 MB.");
    }

    validFiles.forEach((file) => {
      const reader = new FileReader();

      reader.onload = () => {
        const figure = document.createElement("figure");
        figure.className = "gallery-tile";

        const img = document.createElement("img");
        img.src = reader.result;
        img.alt = file.name;
        img.loading = "lazy";

        const caption = document.createElement("figcaption");
        caption.textContent =
          file.name.length > 30
            ? file.name.slice(0, 27) + "..."
            : file.name;

        figure.append(img, caption);
        galleryGrid.prepend(figure);
      };

      reader.onerror = () => {
        showToast("Could not load " + file.name);
      };

      reader.readAsDataURL(file);
    });

    event.target.value = "";
  });
}

// =====================================
// 11. GOOGLE APPS SCRIPT EMAIL
// =====================================

// Paste your deployed Apps Script Web App URL here.
// The URL must end in /exec.
const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyuIEIDBztKj0PZ3YbSqfiaEYkRFB_u9xAKMuq0SKebpXa-IZPzZcg49mpTQmITrMkI/exec";

const feedbackForm = $("#feedbackForm");
const formStatus = $("#formStatus");
const sendBtn = $("#sendBtn");

const validScriptUrl =
  /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(
    GOOGLE_SCRIPT_URL
  );

if (feedbackForm) {
  if (validScriptUrl) {
    feedbackForm.action = GOOGLE_SCRIPT_URL;
  }

  feedbackForm.addEventListener("submit", (event) => {
    const name = $("#visitorName")?.value.trim() || "";
    const email = $("#visitorEmail")?.value.trim() || "";
    const message = $("#visitorMessage")?.value.trim() || "";

    if (!name || !email || !message) {
      event.preventDefault();

      if (formStatus) {
        formStatus.textContent =
          "Please fill in your name, email and message.";
        formStatus.className = "form-status error";
      }

      return;
    }

    if (!validScriptUrl) {
      event.preventDefault();

      if (formStatus) {
        formStatus.textContent =
          "Email setup incomplete. Add your Apps Script Web App URL in script.js.";
        formStatus.className = "form-status error";
      }

      showToast("Please configure the email URL first.");
      return;
    }

    // Submit normally to Google Apps Script.
    // The browser will open the response page.
    if (formStatus) {
      formStatus.textContent = "Submitting your feedback...";
      formStatus.className = "form-status";
    }

    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.textContent = "Submitting...";
    }
  });
}

console.log("The Bhaukaal Show JavaScript loaded successfully.");
