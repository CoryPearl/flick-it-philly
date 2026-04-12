(function () {
  "use strict";

  var STORAGE_REQUESTS = "flick_requests";
  var STORAGE_SETTINGS = "flick_settings";

  var CATEGORIES_FALLBACK = [{ value: "other", label: "Other" }];

  function flickCategoriesList() {
    if (
      typeof window !== "undefined" &&
      window.__FLICK_CATEGORIES &&
      window.__FLICK_CATEGORIES.length
    ) {
      return window.__FLICK_CATEGORIES;
    }
    return CATEGORIES_FALLBACK;
  }

  var CATEGORIES = flickCategoriesList();

  function normalizeCategorySlug(slug) {
    if (!slug) return slug;
    var m =
      typeof window !== "undefined" && window.__FLICK_LEGACY_CATEGORY_MAP
        ? window.__FLICK_LEGACY_CATEGORY_MAP
        : {};
    return Object.prototype.hasOwnProperty.call(m, slug) ? m[slug] : slug;
  }

  function resolveCategoryFromAi(slug) {
    var raw = (slug || "other").toString().trim() || "other";
    var mapped = normalizeCategorySlug(raw);
    if (CATEGORIES.some(function (c) { return c.value === mapped; })) {
      return mapped;
    }
    if (CATEGORIES.some(function (c) { return c.value === raw; })) {
      return raw;
    }
    return "other";
  }

  function getSchemaForCategory(cat) {
    var root =
      typeof window !== "undefined" && window.__FLICK_CATEGORY_SCHEMAS
        ? window.__FLICK_CATEGORY_SCHEMAS
        : {};
    var key = normalizeCategorySlug(cat || "other");
    if (root[key]) return root[key];
    return root.other || { descriptionRequired: true, fields: [] };
  }

  function $(id) {
    return document.getElementById(id);
  }

  function uuid() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return "id-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9);
  }

  function loadSettings() {
    try {
      var raw = localStorage.getItem(STORAGE_SETTINGS);
      if (raw) {
        var s = JSON.parse(raw);
        return {
          darkMode: s.darkMode !== false,
          locationEnabled: s.locationEnabled !== false,
          cameraEnabled: s.cameraEnabled !== false,
          microphoneEnabled: s.microphoneEnabled !== false,
        };
      }
    } catch (e) {}
    return {
      darkMode: true,
      locationEnabled: true,
      cameraEnabled: true,
      microphoneEnabled: true,
    };
  }

  function saveSettings(s) {
    localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(s));
  }

  function loadRequests() {
    try {
      var raw = localStorage.getItem(STORAGE_REQUESTS);
      if (raw) {
        var arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : [];
      }
    } catch (e) {}
    return [];
  }

  function saveRequests(list) {
    localStorage.setItem(STORAGE_REQUESTS, JSON.stringify(list));
  }

  function categoryLabel(value) {
    for (var i = 0; i < CATEGORIES.length; i++) {
      if (CATEGORIES[i].value === value) return CATEGORIES[i].label;
    }
    var resolved = resolveCategoryFromAi(value);
    for (var j = 0; j < CATEGORIES.length; j++) {
      if (CATEGORIES[j].value === resolved) return CATEGORIES[j].label;
    }
    return (value || "Report").replace(/_/g, " ");
  }

  function formatTime(ts) {
    var d = new Date(ts);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function concernIsSubmitted(r) {
    return r.status === "submitted" || r.status === "pending";
  }

  function concernIsSavedOnly(r) {
    return !concernIsSubmitted(r);
  }

  function concernStatusLabel(r) {
    return concernIsSubmitted(r) ? "Submitted" : "Saved";
  }

  function concernStatusPillClass(r) {
    return concernIsSubmitted(r) ? "submitted" : "saved";
  }

  function getRequestById(id) {
    var found = null;
    loadRequests().forEach(function (x) {
      if (x.id === id) found = x;
    });
    return found;
  }

  function hideToast() {
    var t = $("toast");
    var sp = $("toast-spinner");
    clearTimeout(showToast._timer);
    showToast._timer = null;
    t.hidden = true;
    t.classList.remove("toast-persistent", "toast-with-spinner");
    t.removeAttribute("aria-busy");
    if (sp) sp.hidden = true;
  }

  function showToast(msg, opts) {
    opts = opts || {};
    var t = $("toast");
    var msgEl = $("toast-message");
    var sp = $("toast-spinner");
    if (msgEl) {
      msgEl.textContent = msg;
    } else {
      t.textContent = msg;
    }
    if (sp) {
      sp.hidden = !opts.loading;
    }
    if (opts.loading) {
      t.classList.add("toast-with-spinner");
    } else {
      t.classList.remove("toast-with-spinner");
    }
    t.hidden = false;
    clearTimeout(showToast._timer);
    showToast._timer = null;
    if (opts.persistent) {
      t.classList.add("toast-persistent");
      t.setAttribute("aria-busy", "true");
      return;
    }
    t.classList.remove("toast-persistent");
    t.removeAttribute("aria-busy");
    if (sp) sp.hidden = true;
    t.classList.remove("toast-with-spinner");
    showToast._timer = setTimeout(function () {
      t.hidden = true;
    }, 2800);
  }

  function postNative(payload) {
    try {
      if (
        window.ReactNativeWebView &&
        typeof window.ReactNativeWebView.postMessage === "function"
      ) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }
    } catch (e) {}
  }

  function setCameraOverlayMode(mode) {
    var overlay = $("camera-overlay");
    overlay.classList.remove("is-live", "is-error", "is-off", "is-native");
    if (mode === "error") overlay.classList.add("is-error");
    else if (mode === "off") overlay.classList.add("is-off");
    else if (mode === "native") overlay.classList.add("is-native");
    else overlay.classList.add("is-live");
  }

  function useNativeCapture() {
    return (
      typeof window.__FLICK_USE_NATIVE_CAPTURE__ !== "undefined" &&
      window.__FLICK_USE_NATIVE_CAPTURE__ === true
    );
  }

  function useGeminiNative() {
    return (
      typeof window.__FLICK_GEMINI_USE_NATIVE__ !== "undefined" &&
      window.__FLICK_GEMINI_USE_NATIVE__ === true &&
      window.ReactNativeWebView &&
      typeof window.ReactNativeWebView.postMessage === "function"
    );
  }

  function isAndroidShell() {
    return (
      typeof window.__FLICK_IS_ANDROID__ !== "undefined" &&
      window.__FLICK_IS_ANDROID__ === true
    );
  }

  function updateCameraOverlay(kind) {
    var title = $("camera-overlay-title");
    var hint = $("camera-overlay-hint");
    if (kind === "off") {
      setCameraOverlayMode("off");
      title.textContent = "Camera off";
      hint.textContent =
        'Turn on “Use device camera” in the Settings tab.';
      hint.hidden = false;
    } else if (kind === "blocked") {
      setCameraOverlayMode("error");
      title.textContent = "Camera unavailable";
      hint.textContent = "Allow camera in the Settings tab.";
      hint.hidden = false;
    } else if (kind === "android-native") {
      setCameraOverlayMode("native");
      title.textContent = "Take a photo";
      hint.textContent =
        "Tap the round capture button to open your device camera.";
      hint.hidden = false;
    } else {
      setCameraOverlayMode("live");
      title.textContent = "Add photos and/or a voice note, then Report";
      hint.textContent = "Pinch the preview with two fingers to zoom.";
      hint.hidden = false;
    }
  }

  function useNativeVoiceBridge() {
    return (
      window.ReactNativeWebView &&
      typeof window.ReactNativeWebView.postMessage === "function"
    );
  }

  function isAndroidAppShell() {
    return window.__FLICK_IS_ANDROID__ === true;
  }

  function revokeVoiceAudioObjectUrl(aud) {
    if (!aud || !aud.dataset.flickVoiceObjectUrl) return;
    try {
      URL.revokeObjectURL(aud.dataset.flickVoiceObjectUrl);
    } catch (e) {}
    delete aud.dataset.flickVoiceObjectUrl;
  }

  function sniffIs3gpFromFtyp(bytes) {
    if (bytes.length < 12) return false;
    if (bytes[4] !== 0x66 || bytes[5] !== 0x74 || bytes[6] !== 0x79 || bytes[7] !== 0x70)
      return false;
    var brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
    return /^3g/i.test(brand);
  }

  function dataUrlToBlob(dataUrl, repairAndroidMislabeled3gp) {
    var comma = dataUrl.indexOf(",");
    if (comma === -1) return null;
    var meta = dataUrl.slice(0, comma);
    var b64 = dataUrl.slice(comma + 1);
    var mime = "application/octet-stream";
    var m = /^data:([^;,]+)/.exec(meta);
    if (m) mime = m[1];
    try {
      var binary = atob(b64);
      var len = binary.length;
      var bytes = new Uint8Array(len);
      for (var i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
      var outMime = mime;
      if (
        repairAndroidMislabeled3gp &&
        /^audio\/mp4/i.test(mime) &&
        sniffIs3gpFromFtyp(bytes)
      ) {
        outMime = "audio/3gpp";
      }
      return new Blob([bytes], { type: outMime });
    } catch (e) {
      return null;
    }
  }

  /** Android WebView often fails on long data: URLs; object URLs are reliable. */
  function setVoiceAudioElementSrc(aud, dataUrl) {
    if (!aud || !dataUrl) return;
    revokeVoiceAudioObjectUrl(aud);
    if (isAndroidAppShell()) {
      var blob = dataUrlToBlob(dataUrl, true);
      if (blob && blob.size) {
        var u = URL.createObjectURL(blob);
        aud.dataset.flickVoiceObjectUrl = u;
        aud.src = u;
        return;
      }
    }
    aud.src = dataUrl;
  }

  function requestNativeSpeakerForVoicePlayback() {
    if (useNativeVoiceBridge()) {
      postNative({ type: "VOICE_PLAYBACK_SPEAKER" });
    }
  }

  function ensureVoicePlaybackSpeakerHook() {
    var aud = $("voice-note-playback");
    if (!aud || aud.dataset.flickSpeakerHook) return;
    aud.dataset.flickSpeakerHook = "1";
    aud.addEventListener("play", function () {
      requestNativeSpeakerForVoicePlayback();
    });
  }

  function stopVoiceRecordingIfActive() {
    if (!state.voiceRecording) return;
    if (useNativeVoiceBridge()) {
      postNative({ type: "VOICE_RECORD_TOGGLE" });
    } else {
      stopBrowserVoiceRecording();
    }
  }

  var VOICE_ICON_SPEAKER_SVG =
    '<svg class="ctrl-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a9 9 0 0 1 0 14.14"/></svg>';
  var VOICE_ICON_STOP_SVG =
    '<svg class="ctrl-btn-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="7" y="7" width="10" height="10" rx="1.5"/></svg>';

  function voiceButtonInnerHtml(isRecording) {
    var icon = isRecording ? VOICE_ICON_STOP_SVG : VOICE_ICON_SPEAKER_SVG;
    var label = isRecording ? "Stop" : "Audio";
    return (
      '<span class="ctrl-btn-inner">' +
      icon +
      '<span class="ctrl-btn-text">' +
      label +
      "</span></span>"
    );
  }

  function updateVoiceUi() {
    var btn = $("btn-voice");
    var clr = $("btn-voice-clear");
    var st = $("voice-status");
    var aud = $("voice-note-playback");
    if (!btn || !clr) return;
    var micOff = !state.settings.microphoneEnabled;
    btn.classList.toggle("is-recording", state.voiceRecording);
    btn.innerHTML = voiceButtonInnerHtml(state.voiceRecording);
    btn.disabled = micOff && !state.voiceRecording;
    var has = !!(state.voiceNote && String(state.voiceNote).trim());
    clr.hidden = !has;
    if (st) {
      if (state.voiceRecording) {
        st.hidden = false;
        st.textContent = "Recording…";
      } else if (has) {
        st.hidden = false;
        st.textContent = "Voice note ready — tap play to replay";
      } else if (micOff) {
        st.hidden = false;
        st.textContent = "Microphone is off in Settings.";
      } else {
        st.hidden = true;
        st.textContent = "";
      }
    }
    if (aud) {
      if (!has || state.voiceRecording) {
        try {
          aud.pause();
        } catch (e) {}
        revokeVoiceAudioObjectUrl(aud);
        aud.removeAttribute("src");
        voiceNotePlayerSrc = null;
        try {
          aud.load();
        } catch (e2) {}
        aud.hidden = true;
      } else {
        aud.hidden = false;
        if (voiceNotePlayerSrc !== state.voiceNote) {
          voiceNotePlayerSrc = state.voiceNote;
          setVoiceAudioElementSrc(aud, state.voiceNote);
          aud.muted = false;
          try {
            aud.volume = 1;
          } catch (eVol) {}
          try {
            aud.load();
          } catch (e3) {}
        }
      }
    }
  }

  function stopBrowserVoiceRecording() {
    if (browserVoiceRecorder && browserVoiceRecorder.state === "recording") {
      browserVoiceRecorder.stop();
      return;
    }
    state.voiceRecording = false;
    if (browserVoiceStream) {
      browserVoiceStream.getTracks().forEach(function (t) {
        t.stop();
      });
      browserVoiceStream = null;
    }
    browserVoiceRecorder = null;
    browserVoiceChunks = null;
    updateVoiceUi();
  }

  function startBrowserVoiceRecording() {
    if (!state.settings.microphoneEnabled) {
      showToast("Turn on the microphone in Settings to record a voice note.");
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showToast(
        "Voice needs the app or a browser that supports microphone recording."
      );
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(function (stream) {
        browserVoiceStream = stream;
        browserVoiceChunks = [];
        var mimeOpt = "";
        if (
          typeof MediaRecorder !== "undefined" &&
          MediaRecorder.isTypeSupported("audio/webm")
        ) {
          mimeOpt = "audio/webm";
        }
        var mr = new MediaRecorder(
          stream,
          mimeOpt ? { mimeType: mimeOpt } : undefined
        );
        browserVoiceRecorder = mr;
        mr.ondataavailable = function (e) {
          if (e.data && e.data.size) browserVoiceChunks.push(e.data);
        };
        mr.onstop = function () {
          stream.getTracks().forEach(function (t) {
            t.stop();
          });
          browserVoiceStream = null;
          var chunks = browserVoiceChunks;
          var rec = browserVoiceRecorder;
          browserVoiceRecorder = null;
          browserVoiceChunks = null;
          if (!chunks || !chunks.length) {
            state.voiceRecording = false;
            updateVoiceUi();
            return;
          }
          var blob = new Blob(chunks, {
            type: (rec && rec.mimeType) || "audio/webm",
          });
          var reader = new FileReader();
          reader.onloadend = function () {
            state.voiceNote = reader.result;
            state.voiceRecording = false;
            updateVoiceUi();
          };
          reader.readAsDataURL(blob);
        };
        mr.start();
        state.voiceRecording = true;
        updateVoiceUi();
      })
      .catch(function () {
        showToast("Could not access the microphone.");
      });
  }

  var browserVoiceRecorder = null;
  var browserVoiceChunks = null;
  var browserVoiceStream = null;
  /** Last data URL bound to #voice-note-playback (avoid resetting src every tick). */
  var voiceNotePlayerSrc = null;

  var state = {
    settings: loadSettings(),
    slots: [null, null, null, null, null],
    stream: null,
    pendingDataUrl: null,
    currentDraftId: null,
    /** AI-filled draft not yet written to localStorage until user submits */
    uncommittedAiDraft: null,
    /** data URL of recorded voice (native or browser), or null */
    voiceNote: null,
    /** true while native inject or browser MediaRecorder is active */
    voiceRecording: false,
    detailConcernId: null,
    map: null,
    /** Dim outside city + boundary stroke (below markers). */
    phlBackdropLayer: null,
    userLayer: null,
    lastPosition: null,
  };

  window.__FLICK_APPLY_NATIVE_LOCATION = function () {
    var n = window.__FLICK_NATIVE_LOCATION__;
    if (!n || typeof n.lat !== "number" || typeof n.lng !== "number") {
      return;
    }
    if (isNaN(n.lat) || isNaN(n.lng)) return;
    if (!state.settings.locationEnabled) return;
    state.lastPosition = {
      lat: n.lat,
      lng: n.lng,
      accuracy: typeof n.accuracy === "number" ? n.accuracy : null,
      label: typeof n.label === "string" ? n.label : "",
    };
  };

  window.__FLICK_VOICE_RECORDING = function (active) {
    state.voiceRecording = !!active;
    updateVoiceUi();
  };

  window.__FLICK_SET_VOICE_NOTE = function (payload) {
    if (!payload || !payload.data) return;
    var mime = payload.mimeType || "audio/mp4";
    state.voiceNote = "data:" + mime + ";base64," + payload.data;
    state.voiceRecording = false;
    updateVoiceUi();
  };

  function applyTheme() {
    document.body.classList.toggle("light", !state.settings.darkMode);
    var sb =
      typeof window.__setStatusBarStyle === "function"
        ? window.__setStatusBarStyle
        : null;
    if (sb) sb(state.settings.darkMode ? "light" : "dark");
  }

  function syncSettingsUI() {
    $("set-dark").checked = state.settings.darkMode;
    $("set-location").checked = state.settings.locationEnabled;
    $("set-camera").checked = state.settings.cameraEnabled;
    $("set-microphone").checked = state.settings.microphoneEnabled;
  }

  function requestLocation() {
    if (!state.settings.locationEnabled) {
      state.lastPosition = null;
      return;
    }
    postNative({ type: "REQUEST_NATIVE_LOCATION" });
    if (!navigator.geolocation) {
      return;
    }
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        if (!state.settings.locationEnabled) return;
        if (
          state.lastPosition &&
          state.lastPosition.label &&
          typeof state.lastPosition.lat === "number"
        ) {
          return;
        }
        state.lastPosition = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
      },
      function () {},
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 15000 }
    );
  }

  function locationHint() {
    if (!state.settings.locationEnabled) {
      return (
        "User disabled device location in Settings. Infer place only from the photos; " +
        "if unclear use 'Unknown Philadelphia location'—not 'Location to be confirmed'."
      );
    }
    var lp = state.lastPosition;
    if (
      lp &&
      typeof lp.lat === "number" &&
      typeof lp.lng === "number" &&
      !isNaN(lp.lat) &&
      !isNaN(lp.lng)
    ) {
      var coordStr = lp.lat.toFixed(6) + ", " + lp.lng.toFixed(6);
      var acc = lp.accuracy;
      var accStr =
        typeof acc === "number" &&
        !isNaN(acc) &&
        isFinite(acc) &&
        acc > 0 &&
        acc < 50000
          ? " Reported horizontal accuracy: about ±" +
            Math.round(acc) +
            " m (prefer coordinates when the address line seems vague)."
          : "";
      var label = (lp.label && String(lp.label).trim()) || "";
      if (label) {
        return (
          "Device location (reverse-geocoded): " +
          label +
          " · WGS84 " +
          coordStr +
          "." +
          accStr +
          " For the JSON \"location\" field, use the most specific Philadelphia street address or intersection supported by these coordinates and the photos (coordinates are authoritative when in doubt). " +
          'Do not use "Location to be confirmed".'
        );
      }
      return (
        "High-precision GPS: WGS84 " +
        coordStr +
        "." +
        accStr +
        " Name the closest Philadelphia street, intersection, or block from these coordinates and imagery. " +
        'Avoid "Location to be confirmed" unless nothing fits.'
      );
    }
    return (
      "No location fix yet. Infer from image context only; if you cannot estimate a place in Philadelphia use " +
      "'Unknown Philadelphia location'—not 'Location to be confirmed'."
    );
  }

  function getGeminiKey() {
    var k = window.__GEMINI_API_KEY__;
    if (typeof k === "string") {
      k = k.trim();
      if (k.length > 0) return k;
    }
    return "";
  }

  function getGeminiModelIds() {
    var raw =
      typeof window.__GEMINI_MODELS__ === "string"
        ? window.__GEMINI_MODELS__.trim()
        : "";
    if (!raw) return null;
    var ids = raw
      .split(",")
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);
    return ids.length ? ids : null;
  }

  function dataUrlToBase64(dataUrl) {
    var i = dataUrl.indexOf(",");
    return i >= 0 ? dataUrl.slice(i + 1) : dataUrl;
  }

  function mimeFromDataUrl(dataUrl) {
    var m = dataUrl.match(/^data:([^;]+);/);
    return m ? m[1] : "image/jpeg";
  }

  function buildCategorySelect(selected) {
    var sel = $("field-category");
    sel.innerHTML = "";
    var want = resolveCategoryFromAi(selected || "other");
    CATEGORIES.forEach(function (c) {
      var o = document.createElement("option");
      o.value = c.value;
      o.textContent = c.label;
      sel.appendChild(o);
    });
    sel.value = want;
  }

  function renderDynamicFields(category, fields) {
    var wrap = $("field-dynamic");
    wrap.innerHTML = "";
    var schema = getSchemaForCategory(category || "other");
    if (!schema.fields || !schema.fields.length) return;
    fields = fields && typeof fields === "object" ? fields : {};
    schema.fields.forEach(function (def) {
      var lab = document.createElement("label");
      lab.className = "dynamic-field-label";
      var headRow = document.createElement("span");
      headRow.className = "dynamic-field-heading-row";
      var head = document.createElement("span");
      head.className = "dynamic-field-heading";
      head.textContent = def.label;
      var tag = document.createElement("span");
      tag.className = def.required
        ? "field-tag field-tag-required"
        : "field-tag field-tag-optional";
      tag.textContent = def.required ? "Required" : "Optional";
      headRow.appendChild(head);
      headRow.appendChild(tag);
      lab.appendChild(headRow);
      if (def.hint) {
        var h = document.createElement("span");
        h.className = "field-hint";
        h.textContent = def.hint;
        lab.appendChild(h);
      }
      var val =
        fields[def.key] == null ? "" : String(fields[def.key]);
      var ctrl;
      if (def.type === "select" && def.options && def.options.length) {
        ctrl = document.createElement("select");
        var blank = document.createElement("option");
        blank.value = "";
        blank.textContent = def.required ? "Select…" : "—";
        ctrl.appendChild(blank);
        def.options.forEach(function (opt) {
          var o = document.createElement("option");
          o.value = opt;
          o.textContent = opt;
          ctrl.appendChild(o);
        });
        ctrl.value = val && def.options.indexOf(val) >= 0 ? val : "";
      } else {
        ctrl = document.createElement("input");
        ctrl.type = "text";
        ctrl.autocomplete = "off";
        ctrl.value = val;
      }
      ctrl.dataset.fieldKey = def.key;
      ctrl.dataset.fieldRequired = def.required ? "1" : "0";
      lab.appendChild(ctrl);
      wrap.appendChild(lab);
    });
  }

  function collectDynamicFields() {
    var out = {};
    $("field-dynamic")
      .querySelectorAll("[data-field-key]")
      .forEach(function (el) {
        var k = el.dataset.fieldKey;
        if (k) out[k] = (el.value || "").trim();
      });
    return out;
  }

  function updateDescriptionRequiredHint() {
    var el = $("report-description-hint");
    if (!el) return;
    var s = getSchemaForCategory($("field-category").value);
    el.innerHTML = "";
    var t = document.createElement("span");
    t.className = s.descriptionRequired
      ? "field-tag field-tag-required"
      : "field-tag field-tag-optional";
    t.textContent = s.descriptionRequired ? "Required" : "Optional";
    el.appendChild(t);
    el.appendChild(
      document.createTextNode(
        s.descriptionRequired
          ? " — general description for city staff."
          : " — add details if helpful."
      )
    );
  }

  function updatePrimaryPhotoNote() {
    var n = $("report-primary-photo-note");
    if (!n) return;
    n.hidden = !state.slots.some(Boolean);
  }

  function validateReportBeforeCommit() {
    var category = $("field-category").value;
    var schema = getSchemaForCategory(category);
    var loc = $("field-location").value.trim();
    if (!loc) {
      return "Address (Location) is required.";
    }
    var desc = $("field-description").value.trim();
    if (schema.descriptionRequired && !desc) {
      return "Description is required for this request type.";
    }
    var missingLabel = "";
    $("field-dynamic")
      .querySelectorAll("[data-field-key]")
      .forEach(function (el) {
        if (el.dataset.fieldRequired !== "1") return;
        if (missingLabel) return;
        var v = (el.value || "").trim();
        if (!v) {
          var key = el.dataset.fieldKey;
          schema.fields.forEach(function (f) {
            if (f.key === key) missingLabel = f.label;
          });
        }
      });
    if (missingLabel) {
      return "Please fill required field: " + missingLabel + ".";
    }
    return null;
  }

  function clearSlot(index) {
    if (index < 0 || index >= state.slots.length) return;
    if (!state.slots[index]) return;
    state.slots[index] = null;
    renderSlots();
  }

  function renderSlots() {
    var root = $("image-slots");
    root.innerHTML = "";
    for (var i = 0; i < 5; i++) {
      var d = document.createElement("div");
      d.className = "slot" + (state.slots[i] ? " filled" : "");
      d.setAttribute("data-index", String(i));
      if (state.slots[i]) {
        var inner = document.createElement("div");
        inner.className = "slot-inner";
        var img = document.createElement("img");
        img.src = state.slots[i];
        img.alt = "Photo " + (i + 1);
        var rm = document.createElement("button");
        rm.type = "button";
        rm.className = "slot-remove";
        rm.setAttribute("aria-label", "Remove photo");
        rm.textContent = "×";
        (function (slotIndex) {
          rm.addEventListener("click", function (ev) {
            ev.stopPropagation();
            ev.preventDefault();
            clearSlot(slotIndex);
          });
        })(i);
        inner.appendChild(img);
        inner.appendChild(rm);
        d.appendChild(inner);
      } else {
        d.textContent = i + 1;
      }
      root.appendChild(d);
    }
  }

  function firstEmptySlot() {
    for (var i = 0; i < state.slots.length; i++) {
      if (!state.slots[i]) return i;
    }
    return -1;
  }

  function addImageToSlot(dataUrl) {
    var idx = firstEmptySlot();
    if (idx < 0) {
      showToast("All 5 photo slots are full.");
      return false;
    }
    state.slots[idx] = dataUrl;
    renderSlots();
    return true;
  }

  var video = $("camera-preview");
  var previewWrap = $("camera-preview-wrap");

  /** 'hw' = MediaStreamTrack.applyConstraints(zoom); 'sw' = center crop + CSS scale */
  var cameraPinchMode = null;
  var cameraHwZoomMin = 1;
  var cameraHwZoomMax = 1;
  var cameraHwZoom = 1;
  /** Software zoom multiplier 1–4 (Android WebView often omits caps.zoom). */
  var cameraSwScale = 1;
  var cameraPinchActive = false;
  var cameraPinchStartDist = 0;
  var cameraPinchStartValue = 1;

  function getActiveVideoTrack() {
    if (!state.stream) return null;
    var tracks = state.stream.getVideoTracks();
    return tracks.length ? tracks[0] : null;
  }

  function touchDistance(touches) {
    if (!touches || touches.length < 2) return 0;
    var dx = touches[0].clientX - touches[1].clientX;
    var dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function applyHardwareZoomValue(z) {
    var track = getActiveVideoTrack();
    if (!track || cameraPinchMode !== "hw") return;
    if (z < cameraHwZoomMin) z = cameraHwZoomMin;
    if (z > cameraHwZoomMax) z = cameraHwZoomMax;
    cameraHwZoom = z;
    var p = track.applyConstraints({ advanced: [{ zoom: z }] });
    if (p && typeof p.catch === "function") {
      p.catch(function () {
        return track.applyConstraints({ zoom: z });
      }).catch(function () {});
    }
  }

  function setSoftwareZoomVisual(scale) {
    if (!video) return;
    if (scale < 1) scale = 1;
    if (scale > 4) scale = 4;
    cameraSwScale = scale;
    if (scale <= 1) {
      video.style.transform = "";
      video.style.transformOrigin = "";
    } else {
      video.style.transform = "scale(" + scale + ")";
      video.style.transformOrigin = "center center";
    }
  }

  function onCameraPinchStart(e) {
    if (useNativeCapture() || !state.stream || !previewWrap) return;
    if (e.touches.length !== 2) return;
    cameraPinchActive = true;
    cameraPinchStartDist = touchDistance(e.touches);
    if (cameraPinchStartDist < 8) cameraPinchStartDist = 8;
    if (cameraPinchMode === "hw") {
      var track = getActiveVideoTrack();
      var st = {};
      try {
        st = (track && track.getSettings && track.getSettings()) || {};
      } catch (e2) {}
      cameraPinchStartValue =
        st.zoom != null && !isNaN(st.zoom) ? st.zoom : cameraHwZoom;
    } else {
      cameraPinchStartValue = cameraSwScale;
    }
  }

  function onCameraPinchMove(e) {
    if (!cameraPinchActive || e.touches.length < 2) return;
    if (useNativeCapture() || !state.stream) return;
    var dist = touchDistance(e.touches);
    if (dist < 1) return;
    e.preventDefault();
    var ratio = dist / cameraPinchStartDist;
    if (ratio < 0.2) ratio = 0.2;
    if (ratio > 5) ratio = 5;
    if (cameraPinchMode === "hw") {
      var nz = cameraPinchStartValue * ratio;
      applyHardwareZoomValue(nz);
    } else {
      setSoftwareZoomVisual(cameraPinchStartValue * ratio);
    }
  }

  function onCameraPinchEnd(e) {
    if (!e.touches || e.touches.length < 2) {
      cameraPinchActive = false;
    }
  }

  function teardownCameraPinchZoom() {
    if (previewWrap && previewWrap.dataset.flickPinchBound === "1") {
      previewWrap.removeEventListener("touchstart", onCameraPinchStart);
      previewWrap.removeEventListener("touchmove", onCameraPinchMove);
      previewWrap.removeEventListener("touchend", onCameraPinchEnd);
      previewWrap.removeEventListener("touchcancel", onCameraPinchEnd);
      delete previewWrap.dataset.flickPinchBound;
    }
    cameraPinchActive = false;
    cameraPinchMode = null;
    setSoftwareZoomVisual(1);
    cameraHwZoom = 1;
  }

  function setupCameraPinchZoom(stream) {
    teardownCameraPinchZoom();
    if (!previewWrap || useNativeCapture()) return;
    var track = stream.getVideoTracks()[0];
    if (!track) return;
    var caps = null;
    try {
      caps = typeof track.getCapabilities === "function" ? track.getCapabilities() : null;
    } catch (e) {}
    if (
      caps &&
      caps.zoom != null &&
      typeof caps.zoom === "object" &&
      caps.zoom.max != null &&
      caps.zoom.min != null &&
      caps.zoom.max > caps.zoom.min
    ) {
      cameraPinchMode = "hw";
      cameraHwZoomMin = caps.zoom.min;
      cameraHwZoomMax = caps.zoom.max;
      var settings = {};
      try {
        settings = track.getSettings() || {};
      } catch (e2) {}
      cameraHwZoom =
        settings.zoom != null ? settings.zoom : cameraHwZoomMin;
    } else {
      cameraPinchMode = "sw";
      setSoftwareZoomVisual(1);
    }
    previewWrap.addEventListener("touchstart", onCameraPinchStart, {
      passive: true,
    });
    previewWrap.addEventListener("touchmove", onCameraPinchMove, {
      passive: false,
    });
    previewWrap.addEventListener("touchend", onCameraPinchEnd, {
      passive: true,
    });
    previewWrap.addEventListener("touchcancel", onCameraPinchEnd, {
      passive: true,
    });
    previewWrap.dataset.flickPinchBound = "1";
  }

  function stopCamera() {
    teardownCameraPinchZoom();
    if (state.stream) {
      state.stream.getTracks().forEach(function (t) {
        t.stop();
      });
      state.stream = null;
    }
    video.srcObject = null;
  }

  function startCamera() {
    stopCamera();
    if (!state.settings.cameraEnabled) {
      video.hidden = true;
      updateCameraOverlay("off");
      return;
    }
    if (useNativeCapture()) {
      video.hidden = true;
      updateCameraOverlay("android-native");
      return;
    }
    updateCameraOverlay("live");
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      video.hidden = true;
      updateCameraOverlay("blocked");
      return;
    }
    var attempts = [
      { video: { facingMode: { ideal: "environment" } }, audio: false },
      { video: { facingMode: "environment" }, audio: false },
      { video: true, audio: false },
    ];
    var ai = 0;
    function tryNext() {
      if (ai >= attempts.length) {
        video.hidden = true;
        updateCameraOverlay("blocked");
        return;
      }
      var constraints = attempts[ai++];
      navigator.mediaDevices
        .getUserMedia(constraints)
        .then(function (stream) {
          state.stream = stream;
          video.srcObject = stream;
          video.hidden = false;
          updateCameraOverlay("live");
          var pinchSetupDone = false;
          function setupPinchOnce() {
            if (pinchSetupDone || state.stream !== stream) return;
            pinchSetupDone = true;
            setupCameraPinchZoom(stream);
          }
          video.addEventListener("loadedmetadata", setupPinchOnce, {
            once: true,
          });
          setTimeout(setupPinchOnce, 400);
        })
        .catch(function () {
          tryNext();
        });
    }
    tryNext();
  }

  window.__FLICK_RETRY_CAMERA = function () {
    if ($("screen-camera").hidden) return;
    startCamera();
  };

  window.__FLICK_TOAST = showToast;

  window.__FLICK_ADD_IMAGES_FROM_NATIVE = function (urls) {
    if (!urls || !urls.length) return;
    for (var i = 0; i < urls.length; i++) {
      if (!addImageToSlot(urls[i])) {
        break;
      }
    }
  };

  window.__FLICK_OPEN_CAPTURE_CONFIRM = function (dataUrl) {
    if (dataUrl) openConfirm(dataUrl);
  };

  function captureFrameDataUrl() {
    if (!state.stream || !video.videoWidth) return null;
    var vw = video.videoWidth;
    var vh = video.videoHeight;
    var c = document.createElement("canvas");
    var ctx = c.getContext("2d");
    var z = cameraPinchMode === "sw" ? cameraSwScale : 1;
    if (z <= 1 || isNaN(z)) {
      c.width = vw;
      c.height = vh;
      ctx.drawImage(video, 0, 0);
    } else {
      var cw = vw / z;
      var ch = vh / z;
      var sx = (vw - cw) / 2;
      var sy = (vh - ch) / 2;
      c.width = cw;
      c.height = ch;
      ctx.drawImage(video, sx, sy, cw, ch, 0, 0, cw, ch);
    }
    return c.toDataURL("image/jpeg", 0.85);
  }

  function openConfirm(dataUrl) {
    state.pendingDataUrl = dataUrl;
    $("confirm-preview").src = dataUrl;
    $("modal-confirm").hidden = false;
  }

  function closeConfirm() {
    state.pendingDataUrl = null;
    $("modal-confirm").hidden = true;
  }

  function openReportModal(opts) {
    opts = opts || {};
    state.currentDraftId = opts.draftId || null;
    if (opts.draftId) {
      var prevDraft = getRequestById(opts.draftId);
      state.voiceNote =
        prevDraft && prevDraft.voiceNote ? prevDraft.voiceNote : null;
      updateVoiceUi();
    }
    buildCategorySelect(opts.category || "other");
    $("field-description").value = opts.description || "";
    $("field-location").value = opts.location || "";
    renderDynamicFields($("field-category").value, opts.fields || {});
    updateDescriptionRequiredHint();
    updatePrimaryPhotoNote();
    $("report-offline-note").hidden = !opts.manualFallback;

    var triage = $("report-ai-triage");
    var triageText = $("report-ai-triage-text");
    var existing = opts.draftId ? getRequestById(opts.draftId) : null;
    var isSubmittedEdit = existing && concernIsSubmitted(existing);
    var canSubmitAction =
      opts.manualFallback === true || opts.worthSubmitting !== false;
    $("btn-report-save").hidden = false;
    $("btn-report-submit").hidden = !canSubmitAction || isSubmittedEdit;
    $("btn-report-cancel").textContent =
      canSubmitAction || opts.manualFallback ? "Cancel" : "Close";

    if (opts.manualFallback) {
      triage.hidden = true;
    } else {
      triage.hidden = false;
      var advice = (opts.submissionAdvice || "").trim();
      if (opts.worthSubmitting === false) {
        triage.className = "ai-triage recommend-no";
        triageText.textContent = advice
          ? advice
          : "This doesn’t look like a typical 311 issue. Submission is disabled for this draft.";
      } else {
        triage.className = "ai-triage recommend-yes";
        triageText.textContent = advice
          ? "Worth submitting: " + advice
          : "This looks like something Philadelphia 311 can act on. Double-check the details, then submit if it’s accurate.";
      }
    }

    $("modal-report").hidden = false;
  }

  function closeReportModal() {
    state.currentDraftId = null;
    state.uncommittedAiDraft = null;
    $("modal-report").hidden = true;
    $("btn-report-submit").hidden = false;
    $("btn-report-save").hidden = false;
    $("btn-report-cancel").textContent = "Cancel";
  }

  function geminiCategoryFieldsAppendix(hasVoice) {
    var schemas =
      typeof window !== "undefined" && window.__FLICK_CATEGORY_SCHEMAS
        ? window.__FLICK_CATEGORY_SCHEMAS
        : null;
    if (!schemas) return "";
    var lines = [];
    Object.keys(schemas).forEach(function (cat) {
      var s = schemas[cat];
      if (!s || !s.fields || !s.fields.length) return;
      var parts = s.fields.map(function (f) {
        return (
          f.key +
          (f.required
            ? " (required—fill when observable)"
            : " (optional—fill when clearly inferable)")
        );
      });
      lines.push(cat + ": " + parts.join(", "));
    });
    if (!lines.length) return "";
    var conflictRule = hasVoice
      ? " When a voice recording was provided and it conflicts with the photos on any fact, follow the voice for that fact, then set dropdowns to match the narrative you chose (voice wins every such conflict)."
      : " Set the dropdown to match what you state in prose and what the image shows.";
    var voiceFieldsRule = hasVoice
      ? "VOICE → STRUCTURED FIELDS: Treat the recording as the resident answering the city form aloud. Map anything they say that matches a catalog key into `fields` using EXACT dropdown strings (e.g. spoken “yes there’s water” → set `running_water` to the matching Yes option; spoken colors, plate numbers, sizes, yes/no, addresses, or hazard details → fill the corresponding keys). Do not leave a required key empty if the audio clearly states the answer, even when the photo is unclear. Use optional keys when the voice gives that detail. "
      : "";
    return (
      voiceFieldsRule +
      "Field keys by category (use these exact keys in `fields` for the category you choose). " +
      "Populate required keys whenever the photos, voice, or context support them. " +
      "Also populate OPTIONAL keys whenever there is clear evidence—do not skip optional fields if you can reasonably infer them (e.g. vehicle color, presence of debris, time of day mentioned in audio). " +
      "For yes/no style questions use exactly \"Yes\" or \"No\" when those match dropdown options. " +
      "CRITICAL: Every dropdown/select value in `fields` must use one of the EXACT option strings from the catalog for that key (including punctuation and em dashes). " +
      "CRITICAL: `description`, `location`, and all `fields` values must agree with each other—never write in `description` that there is water (or gas, etc.) in a pothole if `running_water` (or `gas_escaping`) is \"No\";" +
      conflictRule +
      "\n\n" +
      lines.join("\n")
    );
  }

  function geminiPromptText(hasVoice) {
    var appendix = geminiCategoryFieldsAppendix(!!hasVoice);
    var mediaInstructions = hasVoice
      ? "The resident’s voice audio is attached in the message immediately after this text (before any images). Listen to the entire recording and use it to fill BOTH the narrative (description, location) AND the structured `fields` object for your chosen category—anything they state that maps to a catalog key must appear in `fields` with the correct exact option text. Use photos for supporting detail, but whenever spoken words and a photo disagree on any factual point—what the problem is, category, location, severity, water or gas, or what object is shown—the VOICE is authoritative: set category, description, location, and every `fields` value to match what they said. If the voice is silent on something visible in a photo and the photo does not contradict the voice, you may include that detail.\n"
      : "Use every image and the full voice audio if provided (voice may describe the issue when photos are missing or unclear).\n";
    return (
      "You classify Philadelphia 311-style civic issues from the user’s photos, optional voice note, and location hint.\n" +
      mediaInstructions +
      "Also judge whether this is worth submitting to the city at all.\n" +
      "SELF-SERVICE / DIY: If the photos (or voice) show something the resident can reasonably handle without 311—bagging leaves or yard waste on their own lot, moving their own belongings from a stoop or sidewalk edge, taking out trash they control, small private-property upkeep, a spill or mess they could clean, routine indoor issues, or anything that is clearly a personal or household task rather than city infrastructure—set `worth_submitting` to false unless there is also a separate, clear public-right-of-way or city-service issue. When you set it false for that reason, `submission_advice` must briefly suggest they can likely take care of it themselves (one concrete tip), not only say “don’t submit.”\n" +
      "Before returning JSON, mentally check: the free-text `description` must not contradict any structured `fields` value (e.g. if you mention water pooling in the pothole, `running_water` must be the \"Yes — call Water Emergency…\" option, not \"No\").\n" +
      "Return ONLY a single JSON object (no markdown) with exactly these keys:\n" +
      '"category" (string, one of: ' +
      CATEGORIES.map(function (c) {
        return c.value;
      }).join(", ") +
      "),\n" +
      '"description" (string, concise professional report for city staff; must be consistent with every `fields` dropdown you output),\n' +
      '"location" (string, human-readable Philadelphia address, intersection, or neighborhood; match the device hint when provided; if truly unknown use Unknown Philadelphia location—not Location to be confirmed),\n' +
      '"fields" (object: string values only. For your chosen category, use ONLY the keys listed for that category in the catalog at the end of this prompt. Each value must be an exact catalog option where the catalog shows (required/optional) after a select-style key. Fill required keys when observable from images OR when clearly stated in the voice recording; actively fill OPTIONAL keys too when images, voice, or context give reasonable evidence. Use exact key names; omit only keys you cannot infer. Narrative and structured answers must match' +
      (hasVoice
        ? ". If a voice note is included: extract spoken facts into `fields` (not only into description)—treat audio as first-class evidence for every catalog key it applies to. If voice and images conflict on a fact, derive that field from the voice."
        : "") +
      "),\n" +
      '"worth_submitting" (boolean: true only if photos and/or voice describe a clear, actionable civic issue 311 could address in Philadelphia — false for selfies, memes, blank/blurry/unusable photos, silence or unrelated audio, obvious jokes, off-topic content, nothing that sounds or looks like infrastructure/sanitation/safety/public-space problems, OR scenes where the issue is something the resident can plausibly fix themselves without the city as described in SELF-SERVICE / DIY above),\n' +
      '"submission_advice" (string: one or two short sentences for the resident. If worth_submitting is false because they can handle it themselves, say so plainly and give one practical suggestion (e.g. bag leaves for sanitation day, move your own bins). Otherwise explain why 311 is or is not a good fit.)\n' +
      "Location hint from user device:\n" +
      locationHint() +
      (appendix ? "\n\n" + appendix : "")
    );
  }

  function parseGeminiJsonText(text) {
    var t = (text || "").trim();
    if (!t) throw new Error("Empty model output");
    if (t.indexOf("```") === 0) {
      t = t
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/i, "")
        .trim();
    }
    var start = t.indexOf("{");
    var end = t.lastIndexOf("}");
    if (start >= 0 && end > start) {
      t = t.slice(start, end + 1);
    }
    return JSON.parse(t);
  }

  function downscaleDataUrlForApi(dataUrl, maxEdge) {
    maxEdge = maxEdge || 1280;
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () {
        var w = img.naturalWidth || img.width;
        var h = img.naturalHeight || img.height;
        if (!w || !h) {
          resolve(dataUrl);
          return;
        }
        if (Math.max(w, h) <= maxEdge) {
          resolve(dataUrl);
          return;
        }
        var scale = maxEdge / Math.max(w, h);
        var cw = Math.round(w * scale);
        var ch = Math.round(h * scale);
        var c = document.createElement("canvas");
        c.width = cw;
        c.height = ch;
        c.getContext("2d").drawImage(img, 0, 0, cw, ch);
        resolve(c.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = function () {
        resolve(dataUrl);
      };
      img.src = dataUrl;
    });
  }

  function extractCandidateText(data) {
    if (!data.candidates || !data.candidates[0]) return "";
    var parts = data.candidates[0].content && data.candidates[0].content.parts;
    if (!parts || !parts.length) return "";
    return parts
      .map(function (p) {
        return p.text || "";
      })
      .join("");
  }

  function geminiRequestOne(modelId, key, imageDataUrls, voiceDataUrl, jsonMode) {
    var hasVoice = !!(voiceDataUrl && String(voiceDataUrl).trim());
    var parts = [{ text: geminiPromptText(hasVoice) }];
    if (hasVoice) {
      parts.push({
        inlineData: {
          mimeType: mimeFromDataUrl(voiceDataUrl),
          data: dataUrlToBase64(voiceDataUrl),
        },
      });
    }
    imageDataUrls.forEach(function (url) {
      parts.push({
        inlineData: {
          mimeType: mimeFromDataUrl(url),
          data: dataUrlToBase64(url),
        },
      });
    });
    var gen = { temperature: 0.35, maxOutputTokens: 2048 };
    if (jsonMode) {
      gen.responseMimeType = "application/json";
    }
    var endpoint =
      "https://generativelanguage.googleapis.com/v1beta/models/" +
      modelId +
      ":generateContent?key=" +
      encodeURIComponent(key);
    return fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: parts }],
        generationConfig: gen,
      }),
    }).then(function (res) {
      return res.text().then(function (raw) {
        var data = null;
        try {
          data = JSON.parse(raw);
        } catch (e) {
          var errParse = new Error(
            res.ok
              ? "Invalid JSON from API"
              : "HTTP " + res.status + ": " + raw.slice(0, 160)
          );
          errParse.status = res.status;
          throw errParse;
        }
        if (!res.ok) {
          var apiMsg =
            (data.error && (data.error.message || data.error.status)) ||
            raw.slice(0, 220);
          var errHttp = new Error(String(apiMsg));
          errHttp.status = res.status;
          throw errHttp;
        }
        return data;
      });
    });
  }

  /**
   * If the model still contradicts itself (e.g. description says water in pothole but running_water is No),
   * align dropdowns to the narrative when the wording is unambiguous.
   */
  function reconcileAiFieldsWithNarrative(category, description, fields) {
    if (!fields || typeof fields !== "object") return;
    var desc = description || "";
    if (category !== "pothole_repair") return;

    var waterNeg =
      /\b(no water|dry(\s+hole|\s+pothole)?|no standing water|not flooded|no visible water|absent water)\b/i.test(
        desc
      );
    var waterPos =
      /\b(water in (the )?(pothole|hole)|standing water|pooling|filled with water|waterlogged|wet (pavement|asphalt)|puddle in (the )?(hole|pothole)|flooded (pothole|hole)|running water)\b/i.test(
        desc
      );
    var rw = fields.running_water;
    if (waterPos && !waterNeg && rw === "No") {
      fields.running_water =
        "Yes — call Water Emergency 215-685-6300";
    }
    if (waterNeg && rw && /^Yes/i.test(String(rw))) {
      fields.running_water = "No";
    }

    var gasNeg = /\b(no gas|no smell of gas)\b/i.test(desc);
    var gasPos =
      /\b(gas escaping|smell of gas|natural gas|gas leak|hissing\b.*\b(hole|pothole))\b/i.test(
        desc
      );
    var gas = fields.gas_escaping;
    if (gasPos && !gasNeg && gas === "No") {
      fields.gas_escaping = "Yes — call 911";
    }
    if (gasNeg && gas && /^Yes/i.test(String(gas))) {
      fields.gas_escaping = "No";
    }
  }

  function normalizeAiParsed(parsed) {
    var ws =
      parsed.worth_submitting !== undefined &&
      parsed.worth_submitting !== null
        ? parsed.worth_submitting
        : parsed.worthSubmitting;
    var worth = ws === false ? false : true;
    var cat = resolveCategoryFromAi(parsed.category || "other");
    var fields = Object.assign(
      {},
      parsed.fields && typeof parsed.fields === "object" ? parsed.fields : {}
    );
    reconcileAiFieldsWithNarrative(cat, parsed.description || "", fields);
    return {
      category: cat,
      description: parsed.description || "",
      location: parsed.location || "",
      fields: fields,
      worthSubmitting: worth,
      submissionAdvice:
        typeof parsed.submission_advice === "string"
          ? parsed.submission_advice
          : "",
    };
  }

  var __geminiNativePending = {};

  window.__FLICK_GEMINI_NATIVE_RESULT = function (raw) {
    try {
      var env = typeof raw === "string" ? JSON.parse(raw) : raw;
      var id = env.requestId;
      var pending = id && __geminiNativePending[id];
      if (!pending) return;
      delete __geminiNativePending[id];
      if (env.ok && env.ai) {
        pending.resolve(normalizeAiParsed(env.ai));
      } else {
        pending.reject(
          new Error(env.error || "AI request failed on device")
        );
      }
    } catch (e) {}
  };

  function callGeminiViaNative(imageDataUrls, voiceDataUrl) {
    var requestId =
      "g" + Date.now() + "_" + Math.random().toString(36).slice(2, 10);
    var images = imageDataUrls.map(function (url) {
      return {
        mimeType: mimeFromDataUrl(url),
        data: dataUrlToBase64(url),
      };
    });
    var audio =
      voiceDataUrl && String(voiceDataUrl).trim()
        ? {
            mimeType: mimeFromDataUrl(voiceDataUrl),
            data: dataUrlToBase64(voiceDataUrl),
          }
        : null;
    return new Promise(function (resolve, reject) {
      __geminiNativePending[requestId] = { resolve: resolve, reject: reject };
      if (isAndroidShell()) {
        postNative({
          type: "GEMINI_GENERATE_META",
          requestId: requestId,
          prompt: geminiPromptText(!!(audio && audio.data)),
          imageCount: images.length,
          expectAudio: !!(audio && audio.data),
        });
        for (var i = 0; i < images.length; i++) {
          postNative({
            type: "GEMINI_GENERATE_IMAGE",
            requestId: requestId,
            index: i,
            mimeType: images[i].mimeType,
            data: images[i].data,
          });
        }
        if (audio && audio.data) {
          postNative({
            type: "GEMINI_GENERATE_AUDIO",
            requestId: requestId,
            mimeType: audio.mimeType,
            data: audio.data,
          });
        }
        postNative({
          type: "GEMINI_GENERATE_RUN",
          requestId: requestId,
        });
      } else {
        postNative({
          type: "GEMINI_GENERATE",
          requestId: requestId,
          prompt: geminiPromptText(!!(audio && audio.data)),
          images: images,
          audio: audio,
        });
      }
      setTimeout(function () {
        if (__geminiNativePending[requestId]) {
          delete __geminiNativePending[requestId];
          reject(new Error("AI request timed out"));
        }
      }, 120000);
    });
  }

  function callGemini(imageDataUrls, voiceDataUrl) {
    var key = getGeminiKey();
    if (!key) {
      return Promise.reject(
        new Error(
          "No API key. Set GEMINI_API_KEY in .env and restart Expo (try: npx expo start -c)."
        )
      );
    }
    var maxEdge = useGeminiNative()
      ? isAndroidShell()
        ? 640
        : 800
      : 1280;
    var voice =
      voiceDataUrl && String(voiceDataUrl).trim() ? voiceDataUrl : null;
    return Promise.all(
      imageDataUrls.map(function (u) {
        return downscaleDataUrlForApi(u, maxEdge);
      })
    ).then(function (scaled) {
      if (useGeminiNative()) {
        return callGeminiViaNative(scaled, voice);
      }
      var models = getGeminiModelIds() || [
        "gemini-2.5-flash",
        "gemini-flash-latest",
        "gemini-2.0-flash",
        "gemini-2.0-flash-001",
        "gemini-2.0-flash-lite",
        "gemini-3-flash-preview",
      ];

      function doCall(idx, jsonMode) {
        if (idx >= models.length) {
          return Promise.reject(
            new Error(
              "All Gemini models failed. Check your key at Google AI Studio and try again."
            )
          );
        }
        return geminiRequestOne(models[idx], key, scaled, voice, jsonMode)
          .then(function (data) {
            if (data.error) {
              var er = new Error(data.error.message || "API error");
              er.status = 400;
              throw er;
            }
            if (data.promptFeedback && data.promptFeedback.blockReason) {
              throw new Error(
                "Blocked: " + data.promptFeedback.blockReason
              );
            }
            if (!data.candidates || !data.candidates.length) {
              throw new Error("No response from model");
            }
            var text = extractCandidateText(data);
            if (!text) {
              throw new Error("Empty model output");
            }
            return normalizeAiParsed(parseGeminiJsonText(text));
          })
          .catch(function (err) {
            var msg = (err && err.message) || String(err);
            var st = err && err.status;
            if (jsonMode && /JSON|parse|Unexpected|SyntaxError/i.test(msg)) {
              return doCall(idx, false);
            }
            if (
              st === 404 ||
              /not found|NOT_FOUND|is not (found|supported)|Invalid model|Unknown model/i.test(
                msg
              )
            ) {
              return doCall(idx + 1, true);
            }
            if (st === 400 && /model|invalid/i.test(msg)) {
              return doCall(idx + 1, true);
            }
            if (
              (st === 429 || st === 503) &&
              idx + 1 < models.length
            ) {
              return doCall(idx + 1, true);
            }
            return Promise.reject(err);
          });
      }

      return doCall(0, true);
    });
  }

  function updateRequest(id, updates) {
    var list = loadRequests();
    var next = list.map(function (r) {
      if (r.id !== id) return r;
      var merged = Object.assign({}, r, updates);
      return merged;
    });
    saveRequests(next);
  }

  function commitReportModal(mode) {
    if (mode === "submitted" && $("btn-report-submit").hidden) {
      return;
    }
    var category = $("field-category").value;
    var description = $("field-description").value.trim();
    var location = $("field-location").value.trim();
    var dyn = collectDynamicFields();
    var images = state.slots.filter(Boolean);

    var validationMsg = validateReportBeforeCommit();
    if (validationMsg) {
      showToast(validationMsg);
      return;
    }

    var id = state.currentDraftId;
    var u = state.uncommittedAiDraft;
    var statusOut = mode === "submitted" ? "submitted" : "saved";

    if (u) {
      state.uncommittedAiDraft = null;
      var listAi = loadRequests();
      var latU = u.lat;
      var lngU = u.lng;
      var itemAi = {
        id: uuid(),
        images: u.images && u.images.length ? u.images.slice() : [],
        category: category,
        description: description,
        location: location,
        fields: Object.assign(
          {},
          u.fields && typeof u.fields === "object" ? u.fields : {},
          dyn
        ),
        worthSubmitting:
          typeof u.worthSubmitting === "boolean" ? u.worthSubmitting : true,
        submissionAdvice:
          typeof u.submissionAdvice === "string" ? u.submissionAdvice : "",
        manualEntry: false,
        status: statusOut,
        timestamp: Date.now(),
      };
      if (latU != null && lngU != null) {
        itemAi.lat = latU;
        itemAi.lng = lngU;
      }
      itemAi.voiceNote = u.voiceNote || null;
      if (itemAi.images && itemAi.images.length) {
        itemAi.primaryPhotoIndex = 0;
      }
      listAi.push(itemAi);
      saveRequests(listAi);
    } else if (id) {
      var existing = getRequestById(id);
      if (!existing) {
        showToast("Concern not found.");
        return;
      }
      var baseFields =
        existing.fields && typeof existing.fields === "object"
          ? existing.fields
          : {};
      var newStatus = concernIsSubmitted(existing) ? "submitted" : statusOut;
      updateRequest(id, {
        category: category,
        description: description,
        location: location,
        fields: Object.assign({}, baseFields, dyn),
        worthSubmitting:
          typeof existing.worthSubmitting === "boolean"
            ? existing.worthSubmitting
            : true,
        submissionAdvice:
          typeof existing.submissionAdvice === "string"
            ? existing.submissionAdvice
            : "",
        manualEntry:
          typeof existing.manualEntry === "boolean"
            ? existing.manualEntry
            : false,
        status: newStatus,
        timestamp: Date.now(),
        voiceNote:
          state.voiceNote != null && String(state.voiceNote).trim() !== ""
            ? state.voiceNote
            : null,
      });
    } else {
      var list = loadRequests();
      var lat = state.lastPosition ? state.lastPosition.lat : null;
      var lng = state.lastPosition ? state.lastPosition.lng : null;
      var item = {
        id: uuid(),
        images: images.length ? images.slice() : [],
        category: category,
        description: description,
        location: location,
        fields: dyn,
        worthSubmitting: true,
        submissionAdvice: "",
        manualEntry: true,
        status: statusOut,
        timestamp: Date.now(),
        voiceNote:
          state.voiceNote != null && String(state.voiceNote).trim() !== ""
            ? state.voiceNote
            : null,
      };
      if (images.length) {
        item.primaryPhotoIndex = 0;
      }
      if (lat != null && lng != null) {
        item.lat = lat;
        item.lng = lng;
      }
      list.push(item);
      saveRequests(list);
    }

    closeReportModal();
    stopBrowserVoiceRecording();
    state.voiceNote = null;
    state.voiceRecording = false;
    updateVoiceUi();
    showToast(
      mode === "submitted"
        ? "Concern submitted (simulated send to 311 ✓)"
        : "Concern saved on this device."
    );
    renderHomeList();
    if (state.map) refreshMap();
  }

  function closeConcernDetail() {
    state.detailConcernId = null;
    $("modal-detail").hidden = true;
  }

  function renderConcernDetail(r) {
    var line = $("detail-status-line");
    line.innerHTML = "";
    var span = document.createElement("span");
    span.className = "status-pill " + concernStatusPillClass(r);
    span.textContent = concernStatusLabel(r);
    line.appendChild(span);
    if (r.worthSubmitting === false) {
      var note = document.createElement("span");
      note.className = "detail-worth-note";
      note.textContent = " · AI: low priority for 311";
      line.appendChild(note);
    }

    var imgWrap = $("detail-images");
    imgWrap.innerHTML = "";
    (r.images || []).forEach(function (url) {
      var img = document.createElement("img");
      img.src = url;
      img.alt = "Report photo";
      imgWrap.appendChild(img);
    });
    if (!(r.images && r.images.length)) {
      var empty = document.createElement("p");
      empty.className = "detail-empty-images";
      empty.textContent = "No photos attached.";
      imgWrap.appendChild(empty);
    }

    var vw = $("detail-voice-wrap");
    if (vw) {
      var prevAud = vw.querySelector("audio");
      if (prevAud) revokeVoiceAudioObjectUrl(prevAud);
      vw.innerHTML = "";
      if (r.voiceNote && String(r.voiceNote).indexOf("data:") === 0) {
        vw.hidden = false;
        var aud = document.createElement("audio");
        aud.controls = true;
        aud.className = "detail-audio";
        setVoiceAudioElementSrc(aud, r.voiceNote);
        aud.setAttribute("aria-label", "Voice note");
        aud.addEventListener("play", function () {
          requestNativeSpeakerForVoicePlayback();
        });
        vw.appendChild(aud);
      } else {
        vw.hidden = true;
      }
    }

    var body = $("detail-body");
    body.innerHTML = "";
    function addRow(label, text) {
      if (text == null || String(text).trim() === "") return;
      var p = document.createElement("p");
      p.className = "detail-row";
      var strong = document.createElement("strong");
      strong.textContent = label;
      p.appendChild(strong);
      var t = document.createElement("span");
      t.textContent = String(text);
      p.appendChild(t);
      body.appendChild(p);
    }
    addRow("Category", categoryLabel(r.category));
    addRow("Description", r.description);
    addRow("Location", r.location);
    if (r.fields && typeof r.fields === "object") {
      Object.keys(r.fields).forEach(function (k) {
        if (
          k === "category" ||
          k === "description" ||
          k === "location"
        ) {
          return;
        }
        var v = r.fields[k];
        if (v != null && String(v).trim() !== "") {
          addRow(k.replace(/_/g, " "), String(v));
        }
      });
    }
    if ((r.submissionAdvice || "").trim()) {
      addRow("AI note", r.submissionAdvice);
    }

    $("btn-detail-submit").hidden = !(
      concernIsSavedOnly(r) && r.worthSubmitting !== false
    );
  }

  function openConcernDetail(id) {
    var r = getRequestById(id);
    if (!r) return;
    state.detailConcernId = id;
    renderConcernDetail(r);
    $("modal-detail").hidden = false;
  }

  function submitConcernFromDetail() {
    var id = state.detailConcernId;
    if (!id) return;
    var r = getRequestById(id);
    if (!r || r.worthSubmitting === false) return;
    if (!concernIsSavedOnly(r)) return;
    updateRequest(id, { status: "submitted", timestamp: Date.now() });
    showToast("Concern submitted (simulated send to 311 ✓)");
    closeConcernDetail();
    renderHomeList();
    if (state.map) refreshMap();
  }

  function deleteConcernFromDetail() {
    var id = state.detailConcernId;
    if (!id) return;
    if (
      !confirm(
        "Remove this concern from this device? This cannot be undone."
      )
    ) {
      return;
    }
    var next = loadRequests().filter(function (r) {
      return r.id !== id;
    });
    saveRequests(next);
    showToast("Concern deleted from this device.");
    closeConcernDetail();
    renderHomeList();
    if (state.map) refreshMap();
  }

  function openReportForEditFromDetail() {
    var id = state.detailConcernId;
    if (!id) return;
    var r = getRequestById(id);
    if (!r) return;
    closeConcernDetail();
    state.currentDraftId = r.id;
    state.uncommittedAiDraft = null;
    openReportModal({
      draftId: r.id,
      category: r.category || "other",
      description: r.description || "",
      location: r.location || "",
      fields: r.fields || {},
      worthSubmitting: r.worthSubmitting !== false,
      submissionAdvice: r.submissionAdvice || "",
      manualFallback: r.manualEntry === true,
    });
  }

  function renderHomeList() {
    var list = loadRequests().sort(function (a, b) {
      return b.timestamp - a.timestamp;
    });
    var ul = $("request-list");
    var empty = $("home-empty");
    ul.innerHTML = "";
    if (!list.length) {
      empty.hidden = false;
      return;
    }
    empty.hidden = true;
    list.forEach(function (r) {
      var li = document.createElement("li");
      li.className = "request-card";
      li.setAttribute("role", "button");
      li.setAttribute("tabindex", "0");
      li.addEventListener("click", function () {
        openConcernDetail(r.id);
      });
      li.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openConcernDetail(r.id);
        }
      });
      if (r.images && r.images[0]) {
        var thumb = document.createElement("img");
        thumb.className = "request-thumb";
        thumb.src = r.images[0];
        thumb.alt = "";
        li.appendChild(thumb);
      } else {
        var ph = document.createElement("div");
        ph.className = "request-thumb placeholder";
        ph.textContent = "No image";
        li.appendChild(ph);
      }
      var body = document.createElement("div");
      body.className = "request-body";
      var title = document.createElement("p");
      title.className = "request-title";
      title.textContent = categoryLabel(r.category);
      var meta = document.createElement("p");
      meta.className = "request-meta";
      meta.textContent =
        (r.location || "No location") + " · " + formatTime(r.timestamp);
      var pill = document.createElement("span");
      pill.className = "status-pill " + concernStatusPillClass(r);
      pill.textContent = concernStatusLabel(r);
      body.appendChild(title);
      body.appendChild(meta);
      body.appendChild(pill);
      if (r.worthSubmitting === false) {
        var flag = document.createElement("span");
        flag.className = "ai-flag";
        flag.textContent = "AI: low priority";
        body.appendChild(flag);
      }
      li.appendChild(body);
      ul.appendChild(li);
    });
  }

  function clusterPoints(requests, thresholdDeg) {
    var withCoords = requests.filter(function (r) {
      return (
        typeof r.lat === "number" &&
        typeof r.lng === "number" &&
        !isNaN(r.lat) &&
        !isNaN(r.lng)
      );
    });
    var clusters = [];
    withCoords.forEach(function (r) {
      var found = null;
      for (var i = 0; i < clusters.length; i++) {
        var c = clusters[i];
        var dx = c.lat - r.lat;
        var dy = c.lng - r.lng;
        if (dx * dx + dy * dy < thresholdDeg * thresholdDeg) {
          found = c;
          break;
        }
      }
      if (found) {
        found.items.push(r);
        found.lat =
          found.items.reduce(function (s, x) {
            return s + x.lat;
          }, 0) / found.items.length;
        found.lng =
          found.items.reduce(function (s, x) {
            return s + x.lng;
          }, 0) / found.items.length;
      } else {
        clusters.push({
          lat: r.lat,
          lng: r.lng,
          items: [r],
        });
      }
    });
    return clusters;
  }

  /** ~City of Philadelphia + immediate border; pan/zoom cannot leave this box. */
  var PHILLY_MAP_BOUNDS = L.latLngBounds(
    [39.86, -75.32],
    [40.14, -74.92]
  );

  /**
   * City limits GeoJSON (EPSG:4326) is injected as window.__FLICK_PHILLY_LIMITS__
   * from public/philly-city-limits.json (generalized City of Philadelphia boundary).
   */
  function getPhillyCityRingLatLng() {
    try {
      var g = window.__FLICK_PHILLY_LIMITS__;
      if (!g || !g.features || !g.features.length) return null;
      var geom = g.features[0].geometry;
      var ring = null;
      if (geom.type === "Polygon") ring = geom.coordinates[0];
      else if (geom.type === "MultiPolygon") ring = geom.coordinates[0][0];
      if (!ring || ring.length < 4) return null;
      return ring.map(function (c) {
        return [c[1], c[0]];
      });
    } catch (e) {
      return null;
    }
  }

  function addPhillyMapBackdrop() {
    if (!state.map || state.phlBackdropLayer) return;
    var hole = getPhillyCityRingLatLng();
    if (!hole) return;
    var outer = [
      [90, -360],
      [90, 360],
      [-90, 360],
      [-90, -360],
    ];
    var mask = L.polygon([outer, hole], {
      stroke: false,
      fill: true,
      fillColor: "#0a1628",
      fillOpacity: 0.78,
      interactive: false,
    });
    var outline = L.polygon(hole, {
      stroke: true,
      color: "#d4af37",
      weight: 2.5,
      opacity: 0.92,
      fill: false,
      interactive: false,
    });
    state.phlBackdropLayer = L.layerGroup([mask, outline]).addTo(state.map);
  }

  function initMapIfNeeded() {
    if (state.map || typeof L === "undefined") return;
    state.map = L.map("map", {
      zoomControl: true,
      attributionControl: true,
      maxBounds: PHILLY_MAP_BOUNDS,
      maxBoundsViscosity: 1,
      minZoom: 10,
      maxZoom: 19,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap",
    }).addTo(state.map);
    addPhillyMapBackdrop();
    state.userLayer = L.layerGroup().addTo(state.map);
    state.map.setView([39.9526, -75.1652], 12);
  }

  function clampLatLngToPhilly(lat, lng) {
    var sw = PHILLY_MAP_BOUNDS.getSouthWest();
    var ne = PHILLY_MAP_BOUNDS.getNorthEast();
    return [
      Math.min(ne.lat, Math.max(sw.lat, lat)),
      Math.min(ne.lng, Math.max(sw.lng, lng)),
    ];
  }

  function fitMapBoundsLocal(userPts) {
    var all = userPts.slice();
    if (!all.length) {
      state.map.setView([39.9526, -75.1652], 12);
      return;
    }
    if (all.length === 1) {
      var c = clampLatLngToPhilly(all[0][0], all[0][1]);
      state.map.setView(c, 14);
      return;
    }
    state.map.fitBounds(all, { padding: [28, 28], maxZoom: 14 });
  }

  function orientMapToUserOrFitLocal(userPts) {
    if (!state.settings.locationEnabled || !navigator.geolocation) {
      fitMapBoundsLocal(userPts);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        var la = pos.coords.latitude;
        var lo = pos.coords.longitude;
        if (la == null || lo == null || isNaN(la) || isNaN(lo)) {
          fitMapBoundsLocal(userPts);
          return;
        }
        var keepLabel =
          state.lastPosition &&
          typeof state.lastPosition.label === "string" &&
          state.lastPosition.label.trim()
            ? state.lastPosition.label
            : "";
        state.lastPosition = {
          lat: la,
          lng: lo,
          accuracy: pos.coords.accuracy,
        };
        if (keepLabel) state.lastPosition.label = keepLabel;
        var center = clampLatLngToPhilly(la, lo);
        if (typeof state.map.flyTo === "function") {
          state.map.flyTo(center, 15, { duration: 0.45 });
        } else {
          state.map.setView(center, 15);
        }
      },
      function () {
        fitMapBoundsLocal(userPts);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 15000 }
    );
  }

  function refreshMap() {
    initMapIfNeeded();
    if (!state.map) return;
    var requests = loadRequests();
    var withCoords = requests.filter(function (r) {
      return (
        concernIsSubmitted(r) &&
        typeof r.lat === "number" &&
        typeof r.lng === "number" &&
        !isNaN(r.lat) &&
        !isNaN(r.lng)
      );
    });
    state.userLayer.clearLayers();

    var userBoundsPts = [];
    var clusters = clusterPoints(withCoords, 0.004);
    clusters.forEach(function (c) {
      userBoundsPts.push([c.lat, c.lng]);
      var isMulti = c.items.length > 1;
      var marker = L.circleMarker([c.lat, c.lng], {
        radius: isMulti ? 18 : 14,
        color: "#d4af37",
        fillColor: isMulti ? "#9a7b2c" : "#d4af37",
        fillOpacity: 0.88,
        weight: 3,
      });
      var popupHtml;
      if (isMulti) {
        popupHtml =
          '<div class="cluster-popup"><strong>' +
          c.items.length +
          " submitted</strong><ul class=\"cluster-list\">";
        c.items.forEach(function (it) {
          popupHtml +=
            "<li>" +
            categoryLabel(it.category) +
            " — " +
            formatTime(it.timestamp) +
            "</li>";
        });
        popupHtml += "</ul></div>";
      } else {
        var it = c.items[0];
        popupHtml =
          "<strong>" +
          categoryLabel(it.category) +
          "</strong> · submitted<br/>" +
          (it.location || "") +
          "<br/><span style='color:#8fa3bf'>" +
          formatTime(it.timestamp) +
          "</span>";
      }
      marker.bindPopup(popupHtml, { autoPanPadding: [20, 20] });
      marker.addTo(state.userLayer);
    });

    orientMapToUserOrFitLocal(userBoundsPts);
  }

  function showScreen(name) {
    $("screen-home").hidden = name !== "home";
    $("screen-camera").hidden = name !== "camera";
    $("screen-settings").hidden = name !== "settings";
    document.querySelectorAll(".nav-item").forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-nav") === name);
    });
    if (name === "camera") {
      startCamera();
    } else {
      stopCamera();
    }
    if (name === "home") {
      postNative({ type: "REQUEST_NATIVE_LOCATION" });
      renderHomeList();
      setTimeout(function () {
        refreshMap();
        if (state.map) state.map.invalidateSize();
      }, 250);
    }
  }

  function onNavigate(name) {
    showScreen(name);
  }

  document.querySelectorAll(".nav-item").forEach(function (btn) {
    btn.addEventListener("click", function () {
      onNavigate(btn.getAttribute("data-nav"));
    });
  });

  $("btn-capture").addEventListener("click", function () {
    if (
      useNativeCapture() &&
      window.ReactNativeWebView &&
      typeof window.ReactNativeWebView.postMessage === "function"
    ) {
      postNative({ type: "NATIVE_CAMERA_CAPTURE" });
      return;
    }
    var dataUrl = captureFrameDataUrl();
    if (!dataUrl) {
      showToast("Camera not ready. Check permissions or use Gallery.");
      startCamera();
      return;
    }
    openConfirm(dataUrl);
  });

  $("btn-gallery").addEventListener("click", function () {
    if (
      window.ReactNativeWebView &&
      typeof window.ReactNativeWebView.postMessage === "function"
    ) {
      postNative({ type: "PICK_IMAGES_FROM_LIBRARY" });
      return;
    }
    $("file-gallery").click();
  });

  $("file-gallery").addEventListener("change", function (e) {
    var files = e.target.files;
    if (!files || !files.length) return;
    var remaining = 5 - state.slots.filter(Boolean).length;
    if (remaining <= 0) {
      showToast("All 5 photo slots are full.");
      e.target.value = "";
      return;
    }
    var toRead = Math.min(files.length, remaining);
    if (toRead < files.length) {
      showToast("Only " + remaining + " empty slot(s); extra files skipped.");
    }
    var i = 0;
    function next() {
      if (i >= toRead) {
        e.target.value = "";
        return;
      }
      var f = files[i];
      i++;
      var reader = new FileReader();
      reader.onload = function (ev) {
        addImageToSlot(ev.target.result);
        next();
      };
      reader.readAsDataURL(f);
    }
    next();
  });

  $("btn-retake").addEventListener("click", closeConfirm);
  document
    .querySelector('[data-close="confirm"]')
    .addEventListener("click", closeConfirm);
  $("btn-accept").addEventListener("click", function () {
    if (state.pendingDataUrl) {
      addImageToSlot(state.pendingDataUrl);
    }
    closeConfirm();
  });

  $("btn-generate").addEventListener("click", function () {
    var imgs = state.slots.filter(Boolean);
    var voice = state.voiceNote;
    if (!imgs.length && !voice) {
      showToast("Add at least one photo or a voice note to generate a report.");
      return;
    }
    showToast("Analyzing with AI…", { persistent: true, loading: true });
    function runAiAfterLocation() {
      callGemini(imgs, voice)
        .then(function (ai) {
          hideToast();
          var lat = state.lastPosition ? state.lastPosition.lat : null;
          var lng = state.lastPosition ? state.lastPosition.lng : null;
          state.uncommittedAiDraft = {
            images: imgs.slice(),
            voiceNote: voice || null,
            fields: ai.fields || {},
            worthSubmitting: ai.worthSubmitting,
            submissionAdvice: ai.submissionAdvice || "",
            lat: lat,
            lng: lng,
          };
          openReportModal({
            draftId: null,
            category: ai.category,
            description: ai.description,
            location: ai.location,
            fields: ai.fields,
            worthSubmitting: ai.worthSubmitting,
            submissionAdvice: ai.submissionAdvice,
            manualFallback: false,
          });
        })
        .catch(function (err) {
          state.uncommittedAiDraft = null;
          hideToast();
          var msg =
            err && err.message ? String(err.message) : "AI request failed.";
          if (msg.length > 120) {
            msg = msg.slice(0, 117) + "…";
          }
          showToast(msg);
          var locFallback = "";
          if (state.lastPosition) {
            if (
              state.lastPosition.label &&
              String(state.lastPosition.label).trim()
            ) {
              locFallback = String(state.lastPosition.label).trim();
            } else if (
              typeof state.lastPosition.lat === "number" &&
              typeof state.lastPosition.lng === "number"
            ) {
              locFallback =
                state.lastPosition.lat.toFixed(6) +
                ", " +
                state.lastPosition.lng.toFixed(6);
            }
          }
          openReportModal({
            draftId: null,
            category: "other",
            description: "",
            location: locFallback,
            fields: {},
            manualFallback: true,
          });
        });
    }
    if (
      window.ReactNativeWebView &&
      typeof window.ReactNativeWebView.postMessage === "function"
    ) {
      postNative({ type: "REQUEST_NATIVE_LOCATION" });
      setTimeout(runAiAfterLocation, 1800);
    } else {
      runAiAfterLocation();
    }
  });

  $("form-report").addEventListener("submit", function (e) {
    e.preventDefault();
  });

  $("field-category").addEventListener("change", function () {
    var cur = collectDynamicFields();
    renderDynamicFields($("field-category").value, cur);
    updateDescriptionRequiredHint();
  });

  $("btn-report-save").addEventListener("click", function () {
    commitReportModal("saved");
  });
  $("btn-report-submit").addEventListener("click", function () {
    commitReportModal("submitted");
  });

  $("btn-report-cancel").addEventListener("click", closeReportModal);
  document
    .querySelector('[data-close="report"]')
    .addEventListener("click", closeReportModal);

  $("btn-detail-close").addEventListener("click", closeConcernDetail);
  document
    .querySelector('[data-close="detail"]')
    .addEventListener("click", closeConcernDetail);
  $("btn-detail-submit").addEventListener("click", submitConcernFromDetail);
  $("btn-detail-edit").addEventListener("click", openReportForEditFromDetail);
  $("btn-detail-delete").addEventListener("click", deleteConcernFromDetail);

  $("set-dark").addEventListener("change", function () {
    state.settings.darkMode = $("set-dark").checked;
    saveSettings(state.settings);
    applyTheme();
  });

  $("set-location").addEventListener("change", function () {
    state.settings.locationEnabled = $("set-location").checked;
    saveSettings(state.settings);
    if (state.settings.locationEnabled) requestLocation();
    else state.lastPosition = null;
  });

  $("set-camera").addEventListener("change", function () {
    state.settings.cameraEnabled = $("set-camera").checked;
    saveSettings(state.settings);
    if (state.settings.cameraEnabled) {
      if (!$("screen-camera").hidden) startCamera();
    } else {
      stopCamera();
      if (!$("screen-camera").hidden) {
        video.hidden = true;
        updateCameraOverlay("off");
      }
    }
  });

  $("set-microphone").addEventListener("change", function () {
    state.settings.microphoneEnabled = $("set-microphone").checked;
    saveSettings(state.settings);
    if (!state.settings.microphoneEnabled) {
      stopVoiceRecordingIfActive();
    }
    updateVoiceUi();
  });

  $("btn-open-app-settings").addEventListener("click", function () {
    postNative({ type: "OPEN_APP_SETTINGS" });
    showToast("Opening system settings…");
  });

  $("btn-clear-data").addEventListener("click", function () {
    if (!confirm("Delete all saved reports and settings on this device?")) {
      return;
    }
    localStorage.removeItem(STORAGE_REQUESTS);
    localStorage.removeItem(STORAGE_SETTINGS);
    state.settings = {
      darkMode: true,
      locationEnabled: true,
      cameraEnabled: true,
      microphoneEnabled: true,
    };
    saveSettings(state.settings);
    syncSettingsUI();
    applyTheme();
    state.slots = [null, null, null, null, null];
    state.voiceNote = null;
    state.voiceRecording = false;
    stopBrowserVoiceRecording();
    renderSlots();
    updateVoiceUi();
    renderHomeList();
    if (state.map) refreshMap();
    showToast("Local data cleared.");
  });

  $("btn-voice").addEventListener("click", function () {
    if (state.voiceRecording) {
      if (useNativeVoiceBridge()) {
        postNative({ type: "VOICE_RECORD_TOGGLE" });
      } else {
        stopBrowserVoiceRecording();
      }
      return;
    }
    if (!state.settings.microphoneEnabled) {
      showToast("Turn on the microphone in Settings to record.");
      return;
    }
    if (useNativeVoiceBridge()) {
      postNative({ type: "VOICE_RECORD_TOGGLE" });
    } else {
      startBrowserVoiceRecording();
    }
  });

  $("btn-voice-clear").addEventListener("click", function () {
    state.voiceNote = null;
    updateVoiceUi();
  });

  ensureVoicePlaybackSpeakerHook();

  applyTheme();
  syncSettingsUI();
  renderSlots();
  updateVoiceUi();
  renderHomeList();
  requestLocation();
  showScreen("camera");
})();
