/**
 * MaxPlayer M3U Playlist Creator
 * Interactive tool for building, organizing, previewing, and downloading .m3u playlists.
 */

(function () {
  "use strict";

  // Storage key
  const STORAGE_KEY = "maxplayer_m3u_channels";

  // Default sample channel: Non-copyrighted open-source Creative Commons test stream
  const EXAMPLE_CHANNEL = {
    name: "Big Buck Bunny (HLS 1080p)",
    category: "Animation / Demo",
    tvgId: "BigBuckBunny.open@HD",
    logo: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg",
    url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
  };

  // State
  let channels = [];
  let currentFilter = "";
  let currentCategory = "all";

  // DOM Elements
  const form = document.getElementById("channelForm");
  const editChannelIndexInput = document.getElementById("editChannelIndex");
  const formHeading = document.getElementById("formHeading");
  const formModeTag = document.getElementById("formModeTag");
  const editingBadge = document.getElementById("editingBadge");
  const btnSubmitChannel = document.getElementById("btnSubmitChannel");
  const btnSubmitText = document.getElementById("btnSubmitText");
  const btnSubmitIcon = document.getElementById("btnSubmitIcon");
  const btnResetForm = document.getElementById("btnResetForm");
  const btnCancelEdit = document.getElementById("btnCancelEdit");

  // Inputs
  const nameInput = document.getElementById("channelName");
  const categoryInput = document.getElementById("channelCategory");
  const tvgIdInput = document.getElementById("channelTvgId");
  const logoInput = document.getElementById("channelLogo");
  const urlInput = document.getElementById("channelUrl");

  // Logo Preview
  const logoPreviewImg = document.getElementById("logoPreviewImg");
  const previewPlaceholder = document.getElementById("previewPlaceholder");
  const previewError = document.getElementById("previewError");

  // Grid & Stats
  const channelGrid = document.getElementById("channelGrid");
  const emptyState = document.getElementById("emptyState");
  const statChannelCount = document.getElementById("statChannelCount");
  const statCategoryCount = document.getElementById("statCategoryCount");

  // Download & Actions
  const playlistFileNameInput = document.getElementById("playlistFileName");
  const btnDownloadM3U = document.getElementById("btnDownloadM3U");
  const btnCopyM3U = document.getElementById("btnCopyM3U");
  const btnTogglePreview = document.getElementById("btnTogglePreview");
  const previewToggleText = document.getElementById("previewToggleText");
  const rawCodeSection = document.getElementById("rawCodeSection");
  const rawCodeText = document.getElementById("rawCodeText");
  const btnCopyRawCode = document.getElementById("btnCopyRawCode");

  // Tools & Quick Actions
  const btnLoadExample = document.getElementById("btnLoadExample");
  const btnLoadExampleEmpty = document.getElementById("btnLoadExampleEmpty");
  const btnClearAll = document.getElementById("btnClearAll");
  const btnImportM3UTrigger = document.getElementById("btnImportM3UTrigger");
  const fileInputM3U = document.getElementById("fileInputM3U");

  // Import from URL Modal Elements
  const btnImportUrlTrigger = document.getElementById("btnImportUrlTrigger");
  const importUrlModal = document.getElementById("importUrlModal");
  const btnCloseImportModal = document.getElementById("btnCloseImportModal");
  const btnCancelImportModal = document.getElementById("btnCancelImportModal");
  const importUrlForm = document.getElementById("importUrlForm");
  const importUrlInput = document.getElementById("importUrlInput");
  const importPasteTextarea = document.getElementById("importPasteTextarea");
  const pasteAccordion = document.getElementById("pasteAccordion");
  const btnExecuteImportUrl = document.getElementById("btnExecuteImportUrl");
  const importUrlBtnText = document.getElementById("importUrlBtnText");
  const importUrlBtnSpinner = document.getElementById("importUrlBtnSpinner");

  // Video Player Elements
  const vpOverlay = document.getElementById("vpOverlay");
  const vpCloseBtn = document.getElementById("vpCloseBtn");
  const vpChannelTitle = document.getElementById("vpChannelTitle");
  const vpCategoryBadge = document.getElementById("vpCategoryBadge");
  const vpHeaderLogo = document.getElementById("vpHeaderLogo");
  const vpHeaderLogoImg = document.getElementById("vpHeaderLogoImg");
  const vpUrlText = document.getElementById("vpUrlText");
  const vpCopyUrlBtn = document.getElementById("vpCopyUrlBtn");
  const vpLoadingState = document.getElementById("vpLoadingState");
  const vpErrorState = document.getElementById("vpErrorState");
  const vpErrorMsg = document.getElementById("vpErrorMsg");

  // Subtitle Panel Elements
  const vpSubtitlePanel = document.getElementById("vpSubtitlePanel");
  const vpSubtitleToggle = document.getElementById("vpSubtitleToggle");
  const vpSubtitleBody = document.getElementById("vpSubtitleBody");
  const vpSubtitleActiveBadge = document.getElementById("vpSubtitleActiveBadge");
  const vpSubFileInput = document.getElementById("vpSubFileInput");
  const vpSubFileLabel = document.getElementById("vpSubFileLabel");
  const vpSubLangFile = document.getElementById("vpSubLangFile");
  const vpSubLabelFile = document.getElementById("vpSubLabelFile");
  const vpSubLangUrl = document.getElementById("vpSubLangUrl");
  const vpSubLabelUrl = document.getElementById("vpSubLabelUrl");
  const vpSubUrlInput = document.getElementById("vpSubUrlInput");
  const vpSubApplyFile = document.getElementById("vpSubApplyFile");
  const vpSubApplyUrl = document.getElementById("vpSubApplyUrl");
  const vpSubApplyOff = document.getElementById("vpSubApplyOff");

  // Video.js instance
  let vjsPlayer = null;

  // Filter & Search
  const gridFilterBar = document.getElementById("gridFilterBar");
  const filterInput = document.getElementById("filterInput");
  const clearFilterBtn = document.getElementById("clearFilterBtn");
  const categoryFilterPills = document.getElementById("categoryFilterPills");

  // Toast
  const toastContainer = document.getElementById("toastContainer");

  // --- Initializer ---
  function init() {
    loadSavedChannels();
    setupEventListeners();
    render();
  }

  // --- Persistence ---
  function loadSavedChannels() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        channels = JSON.parse(saved);
        if (!Array.isArray(channels)) channels = [];
        // Clean out any old demo entries if present in local browser cache
        channels = channels.filter(
          (c) => !c.tvgId?.includes("24News") && !c.url?.includes("tangotv")
        );
      } else {
        // If empty on first visit, start with empty list so user can explore
        channels = [];
      }
    } catch (e) {
      console.warn("Could not load channels from localStorage:", e);
      channels = [];
    }
  }

  function saveChannels() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(channels));
    } catch (e) {
      console.warn("Could not save channels to localStorage:", e);
    }
  }

  // --- Event Listeners Setup ---
  function setupEventListeners() {
    // Form submit
    if (form) {
      form.addEventListener("submit", handleFormSubmit);
    }

    // Logo input live preview
    if (logoInput) {
      logoInput.addEventListener("input", debounce(handleLogoInput, 150));
      logoInput.addEventListener("change", handleLogoInput);
      logoInput.addEventListener("paste", () => setTimeout(handleLogoInput, 50));
    }

    // Reset Form button
    if (btnResetForm) {
      btnResetForm.addEventListener("click", resetForm);
    }

    // Cancel Edit button
    if (btnCancelEdit) {
      btnCancelEdit.addEventListener("click", cancelEdit);
    }

    // Load Example Channel buttons
    if (btnLoadExample) {
      btnLoadExample.addEventListener("click", loadExampleChannel);
    }
    if (btnLoadExampleEmpty) {
      btnLoadExampleEmpty.addEventListener("click", loadExampleChannel);
    }

    // Clear All
    if (btnClearAll) {
      btnClearAll.addEventListener("click", handleClearAll);
    }

    // Import .m3u File
    if (btnImportM3UTrigger && fileInputM3U) {
      btnImportM3UTrigger.addEventListener("click", () => fileInputM3U.click());
      fileInputM3U.addEventListener("change", handleFileImport);
    }

    // Import from URL Modal
    if (btnImportUrlTrigger) {
      btnImportUrlTrigger.addEventListener("click", openImportModal);
    }
    if (btnCloseImportModal) {
      btnCloseImportModal.addEventListener("click", closeImportModal);
    }
    if (btnCancelImportModal) {
      btnCancelImportModal.addEventListener("click", closeImportModal);
    }
    if (importUrlModal) {
      importUrlModal.addEventListener("click", (e) => {
        if (e.target === importUrlModal) closeImportModal();
      });
    }
    if (importUrlForm) {
      importUrlForm.addEventListener("submit", handleUrlImportSubmit);
    }

    // Quick Public Presets in URL Modal
    document.querySelectorAll(".preset-pill-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const presetUrl = btn.getAttribute("data-url");
        if (presetUrl && importUrlInput) {
          importUrlInput.value = presetUrl;
          handleUrlImportSubmit();
        }
      });
    });

    // Close modal on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (importUrlModal && importUrlModal.classList.contains("active")) {
          closeImportModal();
        } else if (vpOverlay && vpOverlay.classList.contains("active")) {
          closeVideoPlayer();
        }
      }
    });

    // Video Player: close button & backdrop click
    if (vpCloseBtn) {
      vpCloseBtn.addEventListener("click", closeVideoPlayer);
    }
    if (vpOverlay) {
      vpOverlay.addEventListener("click", (e) => {
        if (e.target === vpOverlay) closeVideoPlayer();
      });
    }
    // Subtitle panel toggle
    if (vpSubtitleToggle) {
      vpSubtitleToggle.addEventListener("click", toggleSubtitlePanel);
      vpSubtitleToggle.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleSubtitlePanel(); }
      });
    }

    // Subtitle source tabs
    document.querySelectorAll(".vp-sub-tab").forEach((tab) => {
      tab.addEventListener("click", () => switchSubTab(tab.getAttribute("data-tab")));
    });

    // File picker trigger
    if (vpSubFileLabel) vpSubFileLabel.addEventListener("click", () => vpSubFileInput && vpSubFileInput.click());

    // File input change — show filename
    if (vpSubFileInput) vpSubFileInput.addEventListener("change", handleSubFileChange);

    // Apply / Remove subtitle buttons
    if (vpSubApplyFile) vpSubApplyFile.addEventListener("click", applySubtitleFromFile);
    if (vpSubApplyUrl)  vpSubApplyUrl.addEventListener("click", applySubtitleFromUrl);
    if (vpSubApplyOff)  vpSubApplyOff.addEventListener("click", removeSubtitles);

    // Video Player: copy stream URL button
    if (vpCopyUrlBtn) {
      vpCopyUrlBtn.addEventListener("click", () => {
        const url = vpUrlText ? vpUrlText.textContent : "";
        if (url) {
          navigator.clipboard?.writeText(url).then(() => showToast("Stream URL copied!", "info")).catch(() => {});
        }
      });
    }

    // Download .m3u
    if (btnDownloadM3U) {
      btnDownloadM3U.addEventListener("click", handleDownloadM3U);
    }

    // Copy M3U text
    if (btnCopyM3U) {
      btnCopyM3U.addEventListener("click", handleCopyM3U);
    }
    if (btnCopyRawCode) {
      btnCopyRawCode.addEventListener("click", handleCopyM3U);
    }

    // Toggle Raw Preview
    if (btnTogglePreview) {
      btnTogglePreview.addEventListener("click", toggleRawCodePreview);
    }

    // Filter & Search
    if (filterInput) {
      filterInput.addEventListener("input", (e) => {
        currentFilter = e.target.value.trim().toLowerCase();
        if (clearFilterBtn) {
          clearFilterBtn.style.display = currentFilter ? "block" : "none";
        }
        renderGrid();
      });
    }

    if (clearFilterBtn) {
      clearFilterBtn.addEventListener("click", () => {
        if (filterInput) {
          filterInput.value = "";
          currentFilter = "";
          clearFilterBtn.style.display = "none";
          renderGrid();
        }
      });
    }
  }

  // --- Live Image Preview Handler ---
  function handleLogoInput() {
    const url = logoInput.value.trim();

    if (!url) {
      logoPreviewImg.style.display = "none";
      logoPreviewImg.src = "";
      previewError.style.display = "none";
      previewPlaceholder.style.display = "flex";
      return;
    }

    // Prepare preview image
    previewPlaceholder.style.display = "none";
    previewError.style.display = "none";

    // Use a temporary image test
    const tempImg = new Image();
    tempImg.onload = () => {
      logoPreviewImg.src = url;
      logoPreviewImg.style.display = "block";
      previewError.style.display = "none";
      previewPlaceholder.style.display = "none";
    };
    tempImg.onerror = () => {
      logoPreviewImg.style.display = "none";
      logoPreviewImg.src = "";
      previewPlaceholder.style.display = "none";
      previewError.style.display = "flex";
    };
    tempImg.src = url;
  }

  // --- Form Submit: Add or Update Channel ---
  function handleFormSubmit(e) {
    e.preventDefault();

    const name = nameInput.value.trim();
    const category = categoryInput.value.trim();
    const tvgId = tvgIdInput.value.trim();
    const logo = logoInput.value.trim();
    const url = urlInput.value.trim();

    if (!name) {
      nameInput.focus();
      showToast("Please enter a channel name.", "warning");
      return;
    }

    if (!url) {
      urlInput.focus();
      showToast("Please enter a valid stream URL.", "warning");
      return;
    }

    const channelData = {
      name,
      category,
      tvgId,
      logo,
      url
    };

    const editIndex = parseInt(editChannelIndexInput.value, 10);

    if (editIndex >= 0 && editIndex < channels.length) {
      // Update existing channel
      channels[editIndex] = channelData;
      showToast(`Updated "${name}"`, "success");
      cancelEdit();
    } else {
      // Add new channel
      channels.push(channelData);
      showToast(`Added "${name}" to playlist`, "success");
      resetForm();
    }

    saveChannels();
    render();

    // Auto-scroll to the channel grid if on mobile or after adding
    if (channels.length === 1) {
      document.getElementById("playlistSection")?.scrollIntoView({ behavior: "smooth" });
    }
  }

  // --- Reset & Cancel Edit ---
  function resetForm() {
    form.reset();
    editChannelIndexInput.value = "-1";
    handleLogoInput();
    nameInput.focus();
  }

  function cancelEdit() {
    resetForm();
    formHeading.textContent = "Add New Channel";
    formModeTag.textContent = "Channel Details";
    editingBadge.style.display = "none";
    btnSubmitText.textContent = "Add Channel to Playlist";
    btnSubmitIcon.textContent = "＋";
    btnCancelEdit.style.display = "none";
  }

  // --- Start Editing a Channel ---
  function editChannel(index) {
    if (index < 0 || index >= channels.length) return;
    const ch = channels[index];

    editChannelIndexInput.value = index;
    nameInput.value = ch.name || "";
    categoryInput.value = ch.category || "";
    tvgIdInput.value = ch.tvgId || "";
    logoInput.value = ch.logo || "";
    urlInput.value = ch.url || "";

    handleLogoInput();

    // UI state for editing
    formHeading.textContent = `Edit: ${ch.name}`;
    formModeTag.textContent = "Editing Mode";
    editingBadge.style.display = "inline-flex";
    btnSubmitText.textContent = "Save Changes";
    btnSubmitIcon.textContent = "✓";
    btnCancelEdit.style.display = "inline-flex";

    // Smooth scroll to form
    form.scrollIntoView({ behavior: "smooth", block: "center" });
    nameInput.focus();
  }

  // --- Delete Channel ---
  function deleteChannel(index) {
    if (index < 0 || index >= channels.length) return;
    const removedName = channels[index].name;

    channels.splice(index, 1);
    saveChannels();

    // If currently editing this item, cancel edit
    if (parseInt(editChannelIndexInput.value, 10) === index) {
      cancelEdit();
    } else if (parseInt(editChannelIndexInput.value, 10) > index) {
      editChannelIndexInput.value = parseInt(editChannelIndexInput.value, 10) - 1;
    }

    render();
    showToast(`Removed "${removedName}"`, "info");
  }

  // --- Reorder Channels ---
  function moveChannel(index, direction) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= channels.length) return;

    const temp = channels[index];
    channels[index] = channels[targetIndex];
    channels[targetIndex] = temp;

    saveChannels();
    render();
  }

  // --- Load Example Channel (Open-Source Demo) ---
  function loadExampleChannel() {
    // Check if channel already exists
    const exists = channels.some(
      (ch) => ch.name === EXAMPLE_CHANNEL.name && ch.url === EXAMPLE_CHANNEL.url
    );

    if (exists) {
      showToast("Demo channel is already in the list!", "info");
      return;
    }

    channels.unshift({ ...EXAMPLE_CHANNEL });
    saveChannels();
    render();
    showToast('Loaded demo channel "Big Buck Bunny"!', "success");
  }

  // --- Clear All Channels ---
  function handleClearAll() {
    if (channels.length === 0) {
      showToast("Playlist is already empty.", "info");
      return;
    }

    if (confirm(`Are you sure you want to remove all ${channels.length} channels from your playlist?`)) {
      channels = [];
      saveChannels();
      cancelEdit();
      render();
      showToast("All channels cleared.", "info");
    }
  }

  // --- Import .m3u File ---
  function handleFileImport(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      const text = event.target.result;
      const imported = parseM3U(text);

      if (imported.length === 0) {
        showToast("No valid channels found in uploaded .m3u file.", "warning");
        return;
      }

      channels = channels.concat(imported);
      saveChannels();
      render();
      showToast(`Successfully imported ${imported.length} channel(s)!`, "success");
      fileInputM3U.value = "";
    };

    reader.onerror = function () {
      showToast("Failed to read the selected file.", "danger");
      fileInputM3U.value = "";
    };

    reader.readAsText(file);
  }

  // --- Import from URL Modal & Fetcher ---
  function openImportModal() {
    if (!importUrlModal) return;
    importUrlModal.classList.add("active");
    importUrlModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    if (importUrlInput) {
      setTimeout(() => importUrlInput.focus(), 100);
    }
  }

  function closeImportModal() {
    if (!importUrlModal) return;
    importUrlModal.classList.remove("active");
    importUrlModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (importUrlForm) importUrlForm.reset();
    setImportLoading(false);
  }

  // --- Video Player: Open / Close / Load ---

  /**
   * Open the Video.js player modal and start playing the given channel's stream.
   * @param {object} ch - Channel object { name, category, logo, url, tvgId }
   */
  function openVideoPlayer(ch) {
    if (!vpOverlay || !ch || !ch.url) {
      showToast("No stream URL found for this channel.", "warning");
      return;
    }

    // Populate header
    if (vpChannelTitle) vpChannelTitle.textContent = ch.name || "Unknown Channel";
    if (vpCategoryBadge) {
      vpCategoryBadge.textContent = ch.category || "";
      vpCategoryBadge.style.display = ch.category ? "inline-flex" : "none";
    }
    if (vpUrlText) vpUrlText.textContent = ch.url;

    // Logo
    if (ch.logo && vpHeaderLogo && vpHeaderLogoImg) {
      vpHeaderLogoImg.src = ch.logo;
      vpHeaderLogoImg.alt = ch.name || "";
      vpHeaderLogo.style.display = "block";
      vpHeaderLogoImg.onerror = () => { vpHeaderLogo.style.display = "none"; };
    } else if (vpHeaderLogo) {
      vpHeaderLogo.style.display = "none";
    }

    // Show overlay
    vpOverlay.classList.add("active");
    vpOverlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    // Reset states
    if (vpLoadingState) vpLoadingState.style.display = "flex";
    if (vpErrorState) vpErrorState.style.display = "none";

    // Determine source MIME type from URL
    const url = ch.url.trim();
    let srcType = "video/mp4";
    if (/\.m3u8?(\?|$)/i.test(url)) srcType = "application/x-mpegURL";
    else if (/\.mpd(\?|$)/i.test(url)) srcType = "application/dash+xml";
    else if (/\.ts(\?|$)/i.test(url)) srcType = "video/mp2t";
    else if (/\.webm(\?|$)/i.test(url)) srcType = "video/webm";

    // Initialise or reuse Video.js instance
    if (!vjsPlayer) {
      // Check videojs is available (loaded from CDN)
      if (typeof videojs === "undefined") {
        if (vpLoadingState) vpLoadingState.style.display = "none";
        if (vpErrorState) {
          vpErrorState.style.display = "flex";
          if (vpErrorMsg) vpErrorMsg.textContent = "Video.js failed to load. Check your internet connection.";
        }
        return;
      }

      vjsPlayer = videojs("vjs-player", {
        controls: true,
        autoplay: true,
        preload: "auto",
        fluid: true,
        responsive: true,
        liveui: true,
        html5: {
          vhs: {
            overrideNative: true,
            enableLowInitialPlaylist: true,
            handleManifestRedirects: true,
          },
          nativeVideoTracks: false,
          nativeAudioTracks: false,
          nativeTextTracks: false,
        },
        userActions: {
          hotkeys: true
        }
      });

      vjsPlayer.on("ready", () => {
        if (vpLoadingState) vpLoadingState.style.display = "none";
      });

      vjsPlayer.on("playing", () => {
        if (vpLoadingState) vpLoadingState.style.display = "none";
        if (vpErrorState) vpErrorState.style.display = "none";
      });

      vjsPlayer.on("waiting", () => {
        if (vpLoadingState) vpLoadingState.style.display = "flex";
      });

      vjsPlayer.on("canplay", () => {
        if (vpLoadingState) vpLoadingState.style.display = "none";
      });

      vjsPlayer.on("error", () => {
        if (vpLoadingState) vpLoadingState.style.display = "none";
        if (vpErrorState) vpErrorState.style.display = "flex";
        const err = vjsPlayer.error();
        const errMessages = {
          1: "Playback aborted.",
          2: "Network error while loading the stream.",
          3: "Stream decoding error. Format may be unsupported by this browser.",
          4: "Stream format not supported by browser. Try the MaxPlayer Android app.",
        };
        if (vpErrorMsg) {
          vpErrorMsg.textContent = errMessages[err ? err.code : 4] || "Unable to play this stream.";
        }
      });
    } else {
      // Reset error/loading state for reuse
      vjsPlayer.error(null);
      vjsPlayer.pause();
      if (vpLoadingState) vpLoadingState.style.display = "flex";
      if (vpErrorState) vpErrorState.style.display = "none";
    }

    // Load the source
    vjsPlayer.src({ src: url, type: srcType });
    vjsPlayer.play().catch(() => {
      // Autoplay may be blocked by browser policy — user can press play
      if (vpLoadingState) vpLoadingState.style.display = "none";
    });
  }

  function closeVideoPlayer() {
    if (!vpOverlay) return;
    vpOverlay.classList.remove("active");
    vpOverlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    // Stop & reset player
    if (vjsPlayer) {
      vjsPlayer.pause();
      vjsPlayer.reset();
    }
    if (vpLoadingState) vpLoadingState.style.display = "flex";
    if (vpErrorState) vpErrorState.style.display = "none";
    resetSubtitlePanel();
  }

  // --- Subtitle Panel Functions ---

  function toggleSubtitlePanel() {
    if (!vpSubtitlePanel || !vpSubtitleBody) return;
    const isOpen = vpSubtitlePanel.classList.toggle("open");
    vpSubtitleBody.style.display = isOpen ? "block" : "none";
    if (vpSubtitleToggle) vpSubtitleToggle.setAttribute("aria-expanded", String(isOpen));
  }

  function resetSubtitlePanel() {
    if (!vpSubtitlePanel) return;
    vpSubtitlePanel.classList.remove("open");
    if (vpSubtitleBody) vpSubtitleBody.style.display = "none";
    if (vpSubtitleToggle) vpSubtitleToggle.setAttribute("aria-expanded", "false");
    if (vpSubtitleActiveBadge) vpSubtitleActiveBadge.style.display = "none";
    switchSubTab("file");
    if (vpSubFileInput) vpSubFileInput.value = "";
    if (vpSubFileLabel) vpSubFileLabel.textContent = "Choose subtitle file (.vtt, .srt)";
    if (vpSubUrlInput) vpSubUrlInput.value = "";
  }

  function switchSubTab(tab) {
    document.querySelectorAll(".vp-sub-tab").forEach((b) => {
      b.classList.toggle("active", b.getAttribute("data-tab") === tab);
    });
    const panels = { file: "vpSubTabFile", url: "vpSubTabUrl", off: "vpSubTabOff" };
    Object.entries(panels).forEach(([key, id]) => {
      const el = document.getElementById(id);
      if (el) el.style.display = key === tab ? "block" : "none";
    });
  }

  function removeAllSubtitleTracks() {
    if (!vjsPlayer) return;
    const tracks = vjsPlayer.remoteTextTracks();
    const toRemove = [];
    for (let i = 0; i < tracks.length; i++) toRemove.push(tracks[i]);
    toRemove.forEach((t) => vjsPlayer.removeRemoteTextTrack(t));
  }

  function applyTextTrack(src, lang, label) {
    if (!vjsPlayer) { showToast("Player not ready.", "warning"); return; }
    removeAllSubtitleTracks();
    const track = vjsPlayer.addRemoteTextTrack(
      { kind: "subtitles", src, srclang: lang || "en", label: label || "Subtitles", default: true },
      false
    );
    if (track && track.track) track.track.mode = "showing";
    if (vpSubtitleActiveBadge) vpSubtitleActiveBadge.style.display = "inline-flex";
    showToast("Subtitles loaded!", "success");
  }

  /**
   * Convert SRT subtitle text to WebVTT format.
   * Browsers only natively support VTT; SRT must be converted before use.
   */
  function srtToVtt(srt) {
    return "WEBVTT\n\n" + srt
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2")
      .replace(/^\d+\n/gm, "");
  }

  function handleSubFileChange() {
    const file = vpSubFileInput && vpSubFileInput.files && vpSubFileInput.files[0];
    if (!file) return;
    if (vpSubFileLabel) vpSubFileLabel.textContent = file.name;
  }

  function applySubtitleFromFile() {
    const file = vpSubFileInput && vpSubFileInput.files && vpSubFileInput.files[0];
    if (!file) { showToast("Please choose a subtitle file first.", "warning"); return; }

    const lang  = (vpSubLangFile  && vpSubLangFile.value.trim())  || "en";
    const label = (vpSubLabelFile && vpSubLabelFile.value.trim()) || "Subtitles";

    const reader = new FileReader();
    reader.onload = (e) => {
      let text = e.target.result;
      if (file.name.toLowerCase().endsWith(".srt")) text = srtToVtt(text);
      const blob = new Blob([text], { type: "text/vtt" });
      const url = URL.createObjectURL(blob);
      applyTextTrack(url, lang, label);
    };
    reader.onerror = () => showToast("Failed to read subtitle file.", "danger");
    reader.readAsText(file);
  }

  function applySubtitleFromUrl() {
    const url   = vpSubUrlInput  && vpSubUrlInput.value.trim();
    const lang  = (vpSubLangUrl  && vpSubLangUrl.value.trim())  || "en";
    const label = (vpSubLabelUrl && vpSubLabelUrl.value.trim()) || "Subtitles";
    if (!url) { showToast("Please enter a subtitle URL.", "warning"); return; }
    applyTextTrack(url, lang, label);
  }

  function removeSubtitles() {
    removeAllSubtitleTracks();
    if (vpSubtitleActiveBadge) vpSubtitleActiveBadge.style.display = "none";
    showToast("Subtitles removed.", "info");
  }

  function setImportLoading(isLoading) {
    if (!btnExecuteImportUrl) return;
    btnExecuteImportUrl.disabled = isLoading;
    if (importUrlBtnSpinner) importUrlBtnSpinner.style.display = isLoading ? "inline-block" : "none";
    if (importUrlBtnText) importUrlBtnText.textContent = isLoading ? "Fetching..." : "Fetch & Import";
  }

  async function handleUrlImportSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();

    // 1. Check if user pasted text in the fallback accordion
    const pastedText = importPasteTextarea ? importPasteTextarea.value.trim() : "";
    if (pastedText) {
      const imported = parseM3U(pastedText);
      if (imported.length > 0) {
        channels = channels.concat(imported);
        saveChannels();
        render();
        closeImportModal();
        showToast(`Successfully imported ${imported.length} channel(s) from pasted text!`, "success");
        return;
      } else {
        showToast("No valid #EXTINF channels found in pasted text.", "warning");
        return;
      }
    }

    // 2. Process web URL
    const url = importUrlInput ? importUrlInput.value.trim() : "";
    if (!url) {
      showToast("Please enter a valid playlist URL or paste M3U text.", "warning");
      importUrlInput?.focus();
      return;
    }

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      showToast("URL must begin with http:// or https://", "warning");
      importUrlInput?.focus();
      return;
    }

    setImportLoading(true);

    try {
      let content = "";

      // Attempt 1: Direct fetch
      try {
        const resp = await fetch(url, { headers: { "Accept": "text/plain, audio/x-mpegurl, */*" } });
        if (resp.ok) {
          content = await resp.text();
        }
      } catch (directErr) {
        // Direct fetch failed (common due to CORS headers on external servers)
        console.warn("Direct fetch blocked or failed, attempting CORS proxy fallback...", directErr);
      }

      // Attempt 2: CORS Proxy Fallback
      if (!content) {
        try {
          const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
          const proxyResp = await fetch(proxyUrl);
          if (proxyResp.ok) {
            content = await proxyResp.text();
          }
        } catch (proxyErr) {
          console.warn("CORS proxy attempt 1 failed:", proxyErr);
        }
      }

      // Attempt 3: Alternative CORS Proxy
      if (!content) {
        try {
          const proxyUrl2 = `https://corsproxy.io/?url=${encodeURIComponent(url)}`;
          const proxyResp2 = await fetch(proxyUrl2);
          if (proxyResp2.ok) {
            content = await proxyResp2.text();
          }
        } catch (proxyErr2) {
          console.warn("CORS proxy attempt 2 failed:", proxyErr2);
        }
      }

      if (!content) {
        setImportLoading(false);
        if (pasteAccordion) pasteAccordion.open = true;
        showToast("Server blocked direct browser access (CORS). Please paste the M3U text directly in the box below.", "danger");
        importPasteTextarea?.focus();
        return;
      }

      const imported = parseM3U(content);
      if (imported.length === 0) {
        setImportLoading(false);
        showToast("No valid channels (#EXTINF) found in the playlist.", "warning");
        return;
      }

      channels = channels.concat(imported);
      saveChannels();
      render();
      closeImportModal();
      showToast(`Successfully imported ${imported.length} channel(s) from URL!`, "success");
    } catch (err) {
      console.error("URL Import Error:", err);
      setImportLoading(false);
      if (pasteAccordion) pasteAccordion.open = true;
      showToast("Error loading playlist URL. You can paste the text directly.", "danger");
    }
  }

  // --- Simple Robust M3U Parser ---
  function parseM3U(content) {
    const lines = content.split(/\r?\n/);
    const parsed = [];
    let currentExtinf = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (line.startsWith("#EXTINF:")) {
        currentExtinf = parseExtinfLine(line);
      } else if (!line.startsWith("#") && currentExtinf) {
        // Line is stream URL
        parsed.push({
          name: currentExtinf.name || "Untitled Channel",
          category: currentExtinf.category || "",
          tvgId: currentExtinf.tvgId || "",
          logo: currentExtinf.logo || "",
          url: line
        });
        currentExtinf = null;
      }
    }

    return parsed;
  }

  function parseExtinfLine(line) {
    const res = {
      name: "",
      category: "",
      tvgId: "",
      logo: ""
    };

    // Extract attributes using regex
    const tvgIdMatch = line.match(/tvg-id="([^"]*)"/i);
    if (tvgIdMatch) res.tvgId = tvgIdMatch[1];

    const tvgLogoMatch = line.match(/tvg-logo="([^"]*)"/i);
    if (tvgLogoMatch) res.logo = tvgLogoMatch[1];

    const groupTitleMatch = line.match(/group-title="([^"]*)"/i);
    if (groupTitleMatch) res.category = groupTitleMatch[1];

    // Name is after the comma
    const commaIndex = line.lastIndexOf(",");
    if (commaIndex !== -1) {
      res.name = line.substring(commaIndex + 1).trim();
    } else {
      res.name = "Untitled Channel";
    }

    return res;
  }

  // --- Generate Standard M3U String ---
  function generateM3UContent() {
    let out = "#EXTM3U\n";

    channels.forEach((ch) => {
      const attrs = [];

      if (ch.tvgId) {
        attrs.push(`tvg-id="${escapeM3UAttr(ch.tvgId)}"`);
      }
      if (ch.logo) {
        attrs.push(`tvg-logo="${escapeM3UAttr(ch.logo)}"`);
      }
      if (ch.category) {
        attrs.push(`group-title="${escapeM3UAttr(ch.category)}"`);
      }

      const attrString = attrs.length > 0 ? " " + attrs.join(" ") : "";
      const channelName = ch.name ? ch.name.trim() : "Untitled Channel";

      out += `#EXTINF:-1${attrString}, ${channelName}\n`;
      out += `${ch.url ? ch.url.trim() : ""}\n`;
    });

    return out;
  }

  function escapeM3UAttr(val) {
    return String(val).replace(/"/g, "'");
  }

  // --- Download .m3u File ---
  function handleDownloadM3U() {
    if (channels.length === 0) {
      showToast("Cannot download: your playlist is empty. Add a channel first!", "warning");
      nameInput.focus();
      return;
    }

    const m3uContent = generateM3UContent();
    let filename = (playlistFileNameInput.value || "playlist.m3u").trim();
    if (!filename.toLowerCase().endsWith(".m3u") && !filename.toLowerCase().endsWith(".m3u8")) {
      filename += ".m3u";
    }

    const blob = new Blob([m3uContent], { type: "audio/x-mpegurl;charset=utf-8" });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);

    showToast(`Downloaded ${filename} (${channels.length} channels)!`, "success");
  }

  // --- Copy Raw M3U to Clipboard ---
  function handleCopyM3U() {
    if (channels.length === 0) {
      showToast("Playlist is empty. Add channels to copy.", "warning");
      return;
    }

    const m3uContent = generateM3UContent();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(m3uContent).then(() => {
        showToast("Full .m3u playlist copied to clipboard!", "success");
      }).catch(() => {
        fallbackCopyText(m3uContent);
      });
    } else {
      fallbackCopyText(m3uContent);
    }
  }

  function fallbackCopyText(text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand("copy");
      showToast("Copied to clipboard!", "success");
    } catch (err) {
      showToast("Failed to copy text.", "danger");
    }
    document.body.removeChild(ta);
  }

  // --- Toggle Raw Code Inspector ---
  function toggleRawCodePreview() {
    if (!rawCodeSection) return;
    const isHidden = rawCodeSection.style.display === "none";
    if (isHidden) {
      updateRawCodeDisplay();
      rawCodeSection.style.display = "block";
      previewToggleText.textContent = "Hide Code";
      rawCodeSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } else {
      rawCodeSection.style.display = "none";
      previewToggleText.textContent = "View Code";
    }
  }

  function updateRawCodeDisplay() {
    if (!rawCodeText) return;
    rawCodeText.textContent = generateM3UContent();
  }

  // --- Render Functions ---
  function render() {
    renderStats();
    renderCategories();
    renderGrid();
    updateRawCodeDisplay();
  }

  function renderStats() {
    statChannelCount.textContent = channels.length;

    const uniqueCategories = new Set(
      channels.map((c) => c.category && c.category.trim()).filter(Boolean)
    );
    statCategoryCount.textContent = uniqueCategories.size;
  }

  function renderCategories() {
    if (!categoryFilterPills) return;

    const cats = Array.from(
      new Set(channels.map((c) => c.category && c.category.trim()).filter(Boolean))
    ).sort();

    let html = `<button type="button" class="cat-pill ${currentCategory === "all" ? "active" : ""}" data-category="all">All (${channels.length})</button>`;

    cats.forEach((cat) => {
      const count = channels.filter((c) => c.category && c.category.trim() === cat).length;
      html += `<button type="button" class="cat-pill ${currentCategory === cat ? "active" : ""}" data-category="${escapeHtml(cat)}">${escapeHtml(cat)} (${count})</button>`;
    });

    categoryFilterPills.innerHTML = html;

    // Attach pill events
    categoryFilterPills.querySelectorAll(".cat-pill").forEach((btn) => {
      btn.addEventListener("click", () => {
        currentCategory = btn.getAttribute("data-category");
        categoryFilterPills.querySelectorAll(".cat-pill").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        renderGrid();
      });
    });
  }

  function renderGrid() {
    if (!channelGrid || !emptyState) return;

    if (channels.length === 0) {
      emptyState.style.display = "block";
      channelGrid.style.display = "none";
      if (gridFilterBar) gridFilterBar.style.display = "none";
      channelGrid.innerHTML = "";
      return;
    }

    emptyState.style.display = "none";
    channelGrid.style.display = "grid";
    if (gridFilterBar) gridFilterBar.style.display = "flex";

    // Filter channels
    const filtered = channels
      .map((ch, originalIndex) => ({ ch, originalIndex }))
      .filter(({ ch }) => {
        // Category filter
        if (currentCategory !== "all") {
          if (!ch.category || ch.category.trim() !== currentCategory) return false;
        }

        // Text search filter
        if (currentFilter) {
          const matchName = ch.name && ch.name.toLowerCase().includes(currentFilter);
          const matchCat = ch.category && ch.category.toLowerCase().includes(currentFilter);
          const matchTvg = ch.tvgId && ch.tvgId.toLowerCase().includes(currentFilter);
          const matchUrl = ch.url && ch.url.toLowerCase().includes(currentFilter);
          return matchName || matchCat || matchTvg || matchUrl;
        }

        return true;
      });

    if (filtered.length === 0) {
      channelGrid.innerHTML = `
        <div class="no-filter-results">
          <p>No channels matching your filter or category search.</p>
          <button type="button" class="button button-quiet" id="btnResetFilterInside">Reset Filters</button>
        </div>
      `;
      const resetBtn = document.getElementById("btnResetFilterInside");
      if (resetBtn) {
        resetBtn.addEventListener("click", () => {
          currentFilter = "";
          currentCategory = "all";
          if (filterInput) filterInput.value = "";
          if (clearFilterBtn) clearFilterBtn.style.display = "none";
          renderCategories();
          renderGrid();
        });
      }
      return;
    }

    // Build cards
    let cardsHtml = "";
    filtered.forEach(({ ch, originalIndex }) => {
      const isFirst = originalIndex === 0;
      const isLast = originalIndex === channels.length - 1;
      const hasUrl = !!ch.url;

      cardsHtml += `
        <div class="channel-card" data-index="${originalIndex}">
          <!-- Play Button — large overlay on the logo -->
          <button type="button" class="card-play-btn btn-play" data-index="${originalIndex}" ${!hasUrl ? "disabled" : ""} title="${hasUrl ? "Play stream in browser" : "No stream URL"}">
            <div class="card-logo-wrap card-logo-wrap-play">
              ${
                ch.logo
                  ? `<img src="${escapeHtml(ch.logo)}" alt="${escapeHtml(ch.name)}" class="card-logo-img" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'card-logo-fallback\\'>TV</div>';">`
                  : `<div class="card-logo-fallback">TV</div>`
              }
              <div class="card-play-icon-wrap">
                <svg class="card-play-icon" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
              </div>
            </div>
          </button>

          <div class="card-info-block">
            <div class="card-title-group">
              <h3 class="card-channel-name" title="${escapeHtml(ch.name)}">${escapeHtml(ch.name)}</h3>
              <div class="card-badges">
                ${
                  ch.category
                    ? `<span class="badge badge-cat">${escapeHtml(ch.category)}</span>`
                    : ""
                }
                ${
                  ch.tvgId
                    ? `<span class="badge badge-epg font-mono" title="tvg-id">${escapeHtml(ch.tvgId)}</span>`
                    : ""
                }
              </div>
            </div>
          </div>

          <div class="card-url-wrap">
            <span class="url-label">STREAM URL</span>
            <div class="url-field">
              <span class="url-text font-mono" title="${escapeHtml(ch.url)}">${escapeHtml(ch.url)}</span>
              <button type="button" class="copy-url-btn" data-url="${escapeHtml(ch.url)}" title="Copy stream URL">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              </button>
            </div>
          </div>

          <div class="card-footer-actions">
            <div class="reorder-btns">
              <button type="button" class="btn-card-action btn-move" data-action="up" data-index="${originalIndex}" ${isFirst ? "disabled" : ""} title="Move Up in Playlist">
                ▲
              </button>
              <button type="button" class="btn-card-action btn-move" data-action="down" data-index="${originalIndex}" ${isLast ? "disabled" : ""} title="Move Down in Playlist">
                ▼
              </button>
            </div>
            <div class="edit-delete-btns">
              <button type="button" class="btn-card-action btn-play-sm btn-play" data-index="${originalIndex}" ${!hasUrl ? "disabled" : ""} title="Play stream">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
                Play
              </button>
              <button type="button" class="btn-card-action btn-edit" data-index="${originalIndex}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                Edit
              </button>
              <button type="button" class="btn-card-action btn-delete" data-index="${originalIndex}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                Delete
              </button>
            </div>
          </div>
        </div>
      `;
    });

    channelGrid.innerHTML = cardsHtml;
    attachCardActionEvents();
  }

  function attachCardActionEvents() {
    // Edit buttons
    channelGrid.querySelectorAll(".btn-edit").forEach((btn) => {
      btn.addEventListener("click", () => {
        const index = parseInt(btn.getAttribute("data-index"), 10);
        editChannel(index);
      });
    });

    // Delete buttons
    channelGrid.querySelectorAll(".btn-delete").forEach((btn) => {
      btn.addEventListener("click", () => {
        const index = parseInt(btn.getAttribute("data-index"), 10);
        deleteChannel(index);
      });
    });

    // Move buttons
    channelGrid.querySelectorAll(".btn-move").forEach((btn) => {
      btn.addEventListener("click", () => {
        const index = parseInt(btn.getAttribute("data-index"), 10);
        const action = btn.getAttribute("data-action");
        moveChannel(index, action === "up" ? -1 : 1);
      });
    });

    // Copy stream URL buttons
    channelGrid.querySelectorAll(".copy-url-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const url = btn.getAttribute("data-url");
        if (url) {
          navigator.clipboard?.writeText(url).then(() => {
            showToast("Stream URL copied!", "info");
          });
        }
      });
    });

    // Play buttons (both big logo overlay and small footer button)
    channelGrid.querySelectorAll(".btn-play").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const index = parseInt(btn.getAttribute("data-index"), 10);
        if (index >= 0 && index < channels.length) {
          openVideoPlayer(channels[index]);
        }
      });
    });
  }

  // --- Toast Notifications ---
  function showToast(message, type = "info") {
    if (!toastContainer) return;

    const toast = document.createElement("div");
    toast.className = `toast-item toast-${type}`;

    let iconSvg = "";
    if (type === "success") {
      iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === "warning") {
      iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#eab308" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    } else if (type === "danger") {
      iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
    } else {
      iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    toast.innerHTML = `
      <span class="toast-icon">${iconSvg}</span>
      <span class="toast-message">${escapeHtml(message)}</span>
    `;

    toastContainer.appendChild(toast);

    // Auto remove after 3.2s
    setTimeout(() => {
      toast.classList.add("toast-fade-out");
      setTimeout(() => {
        if (toast.parentElement) toast.parentElement.removeChild(toast);
      }, 300);
    }, 3200);
  }

  // --- Helpers ---
  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // Run on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
