(function () {
  "use strict";

  var STORAGE_REQUESTS = "flick_requests";
  var STORAGE_SETTINGS = "flick_settings";

  var CATEGORIES = [
    { value: "illegal_dumping", label: "Illegal dumping" },
    { value: "pothole", label: "Pothole / street defect" },
    { value: "broken_streetlight", label: "Broken streetlight" },
    { value: "graffiti", label: "Graffiti removal" },
    { value: "abandoned_vehicle", label: "Abandoned vehicle" },
    { value: "sidewalk_defect", label: "Sidewalk defect" },
    { value: "traffic_signal", label: "Traffic signal" },
    { value: "noise_complaint", label: "Noise complaint" },
    { value: "missed_collection", label: "Missed trash/recycling" },
    { value: "water_issue", label: "Water / hydrant / flooding" },
    { value: "other", label: "Other" },
  ];

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
        };
      }
    } catch (e) {}
    return { darkMode: true, locationEnabled: true, cameraEnabled: true };
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
    return value || "Report";
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
    clearTimeout(showToast._timer);
    showToast._timer = null;
    t.hidden = true;
    t.classList.remove("toast-persistent");
    t.removeAttribute("aria-busy");
  }

  function showToast(msg, opts) {
    opts = opts || {};
    var t = $("toast");
    t.textContent = msg;
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
      hint.textContent = "";
      hint.hidden = true;
    }
  }

  function useNativeVoiceBridge() {
    return (
      window.ReactNativeWebView &&
      typeof window.ReactNativeWebView.postMessage === "function"
    );
  }

  function updateVoiceUi() {
    var btn = $("btn-voice");
    var clr = $("btn-voice-clear");
    var st = $("voice-status");
    if (!btn || !clr) return;
    btn.classList.toggle("is-recording", state.voiceRecording);
    btn.textContent = state.voiceRecording ? "Stop" : "Voice";
    var has = !!(state.voiceNote && String(state.voiceNote).trim());
    clr.hidden = !has;
    if (st) {
      if (state.voiceRecording) {
        st.hidden = false;
        st.textContent = "Recording…";
      } else if (has) {
        st.hidden = false;
        st.textContent = "Voice note ready";
      } else {
        st.hidden = true;
        st.textContent = "";
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
    userLayer: null,
    cityLayer: null,
    lastPosition: null,
    city311Cache: null,
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
    CATEGORIES.forEach(function (c) {
      var o = document.createElement("option");
      o.value = c.value;
      o.textContent = c.label;
      sel.appendChild(o);
    });
    if (selected) sel.value = selected;
  }

  function renderDynamicFields(fields) {
    var wrap = $("field-dynamic");
    wrap.innerHTML = "";
    if (!fields || typeof fields !== "object") return;
    Object.keys(fields).forEach(function (key) {
      if (
        key === "category" ||
        key === "description" ||
        key === "location"
      ) {
        return;
      }
      var lab = document.createElement("label");
      lab.textContent = key.replace(/_/g, " ");
      var input = document.createElement("input");
      input.type = "text";
      input.name = "dyn_" + key;
      input.dataset.fieldKey = key;
      input.value =
        fields[key] == null ? "" : String(fields[key]);
      lab.appendChild(input);
      wrap.appendChild(lab);
    });
  }

  function collectDynamicFields() {
    var out = {};
    $("field-dynamic")
      .querySelectorAll("input[data-field-key]")
      .forEach(function (inp) {
        var k = inp.dataset.fieldKey;
        if (k) out[k] = inp.value.trim();
      });
    return out;
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

  function stopCamera() {
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
    var c = document.createElement("canvas");
    c.width = video.videoWidth;
    c.height = video.videoHeight;
    var ctx = c.getContext("2d");
    ctx.drawImage(video, 0, 0);
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
    renderDynamicFields(opts.fields || {});
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

  function geminiPromptText() {
    return (
      "You classify Philadelphia 311-style civic issues from the user’s photos, optional voice note, and location hint.\n" +
      "Use every image and the full voice audio if provided (voice may describe the issue when photos are missing or unclear).\n" +
      "Also judge whether this is worth submitting to the city at all.\n" +
      "Return ONLY a single JSON object (no markdown) with exactly these keys:\n" +
      '"category" (string, one of: illegal_dumping, pothole, broken_streetlight, graffiti, abandoned_vehicle, sidewalk_defect, traffic_signal, noise_complaint, missed_collection, water_issue, other),\n' +
      '"description" (string, concise professional report for city staff),\n' +
      '"location" (string, human-readable Philadelphia address, intersection, or neighborhood; match the device hint when provided; if truly unknown use Unknown Philadelphia location—not Location to be confirmed),\n' +
      '"fields" (object: optional extra strings relevant to the issue, e.g. approximate_size, safety_hazard, debris_type),\n' +
      '"worth_submitting" (boolean: true only if photos and/or voice describe a clear, actionable civic issue 311 could address in Philadelphia — false for selfies, memes, blank/blurry/unusable photos, silence or unrelated audio, purely private indoor matters, obvious jokes, off-topic content, or nothing that sounds or looks like infrastructure, sanitation, safety, or public-space problems),\n' +
      '"submission_advice" (string: one short sentence to the resident explaining why it is or is not worth sending to 311).\n' +
      "Location hint from user device:\n" +
      locationHint()
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
    var parts = [{ text: geminiPromptText() }];
    imageDataUrls.forEach(function (url) {
      parts.push({
        inlineData: {
          mimeType: mimeFromDataUrl(url),
          data: dataUrlToBase64(url),
        },
      });
    });
    if (voiceDataUrl) {
      parts.push({
        inlineData: {
          mimeType: mimeFromDataUrl(voiceDataUrl),
          data: dataUrlToBase64(voiceDataUrl),
        },
      });
    }
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

  function normalizeAiParsed(parsed) {
    var ws =
      parsed.worth_submitting !== undefined &&
      parsed.worth_submitting !== null
        ? parsed.worth_submitting
        : parsed.worthSubmitting;
    var worth = ws === false ? false : true;
    return {
      category: parsed.category || "other",
      description: parsed.description || "",
      location: parsed.location || "",
      fields:
        parsed.fields && typeof parsed.fields === "object"
          ? parsed.fields
          : {},
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
          prompt: geminiPromptText(),
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
          prompt: geminiPromptText(),
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

    if (!description) {
      showToast("Please add a description.");
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
      vw.innerHTML = "";
      if (r.voiceNote && String(r.voiceNote).indexOf("data:") === 0) {
        vw.hidden = false;
        var aud = document.createElement("audio");
        aud.controls = true;
        aud.className = "detail-audio";
        aud.src = r.voiceNote;
        aud.setAttribute("aria-label", "Voice note");
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
    state.userLayer = L.layerGroup().addTo(state.map);
    state.cityLayer = L.layerGroup().addTo(state.map);
    state.map.setView([39.9526, -75.1652], 12);
  }

  /** Live CARTO SQL only — Open + no close time = not completed; Closed excluded. */
  var PHILLY_311_ROW_LIMIT = 8000;
  var PHILLY_311_SQL =
    "SELECT lat, lon, service_name, requested_datetime FROM public_cases_fc WHERE requested_datetime >= NOW() - INTERVAL '90 days' AND status = 'Open' AND closed_datetime IS NULL AND lat IS NOT NULL AND lon IS NOT NULL ORDER BY requested_datetime DESC LIMIT " +
    PHILLY_311_ROW_LIMIT;

  function fetchPhilly311Rows() {
    var url =
      "https://phl.carto.com/api/v2/sql?format=json&q=" +
      encodeURIComponent(PHILLY_311_SQL);
    return fetch(url).then(function (res) {
      return res.json().then(function (data) {
        if (data.error) {
          var em =
            typeof data.error === "string"
              ? data.error
              : data.error.message || JSON.stringify(data.error);
          throw new Error(em);
        }
        return data.rows || [];
      });
    });
  }

  function fetchCity311WithCache() {
    var ttlMs = 8 * 60 * 1000;
    var cacheVer = 3;
    var now = Date.now();
    if (
      state.city311Cache &&
      state.city311Cache.rows &&
      state.city311Cache.ver === cacheVer &&
      now - state.city311Cache.ts < ttlMs
    ) {
      return Promise.resolve(state.city311Cache.rows);
    }
    return fetchPhilly311Rows().then(function (rows) {
      state.city311Cache = { ts: Date.now(), rows: rows, ver: cacheVer };
      return rows;
    });
  }

  function clampLatLngToPhilly(lat, lng) {
    var sw = PHILLY_MAP_BOUNDS.getSouthWest();
    var ne = PHILLY_MAP_BOUNDS.getNorthEast();
    return [
      Math.min(ne.lat, Math.max(sw.lat, lat)),
      Math.min(ne.lng, Math.max(sw.lng, lng)),
    ];
  }

  function fitMapBounds(userPts, cityPts) {
    var all = userPts.slice().concat(cityPts);
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

  function orientMapToUserOrFit(userPts, cityPts) {
    if (!state.settings.locationEnabled || !navigator.geolocation) {
      fitMapBounds(userPts, cityPts);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        var la = pos.coords.latitude;
        var lo = pos.coords.longitude;
        if (la == null || lo == null || isNaN(la) || isNaN(lo)) {
          fitMapBounds(userPts, cityPts);
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
        fitMapBounds(userPts, cityPts);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 15000 }
    );
  }

  function refreshMap() {
    initMapIfNeeded();
    if (!state.map) return;
    var requests = loadRequests();
    var withCoords = requests.filter(function (r) {
      return typeof r.lat === "number" && typeof r.lng === "number";
    });
    state.userLayer.clearLayers();
    state.cityLayer.clearLayers();

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
          " your reports</strong><ul class=\"cluster-list\">";
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
          "</strong> (yours)<br/>" +
          (it.location || "") +
          "<br/><span style='color:#8fa3bf'>" +
          concernStatusLabel(it) +
          "</span>";
      }
      marker.bindPopup(popupHtml, { autoPanPadding: [20, 20] });
      marker.addTo(state.userLayer);
    });

    fetchCity311WithCache()
      .then(function (rows) {
        var cityPts = [];
        rows.forEach(function (row) {
          if (
            typeof row.lat !== "number" ||
            typeof row.lon !== "number" ||
            isNaN(row.lat) ||
            isNaN(row.lon)
          ) {
            return;
          }
          cityPts.push([row.lat, row.lon]);
          var reqTs = row.requested_datetime
            ? new Date(row.requested_datetime).getTime()
            : 0;
          var when =
            reqTs && !isNaN(reqTs) ? formatTime(reqTs) : "";
          var m = L.circleMarker([row.lat, row.lon], {
            radius: 9,
            color: "#a8c8ff",
            weight: 2,
            fillColor: "#4a7fe8",
            fillOpacity: 0.65,
            interactive: true,
          });
          m.bindPopup(
            "<strong>" +
              (row.service_name || "311 request") +
              "</strong><br/><span style='color:#8fa3bf'>Open · City 311 · " +
              when +
              "</span>",
            { autoPanPadding: [20, 20] }
          );
          m.addTo(state.cityLayer);
        });
        orientMapToUserOrFit(userBoundsPts, cityPts);
      })
      .catch(function () {
        orientMapToUserOrFit(userBoundsPts, []);
      });
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
    showToast("Analyzing with AI…", { persistent: true });
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

  $("btn-camera-permission").addEventListener("click", function () {
    postNative({ type: "REQUEST_CAMERA_PERMISSION" });
    showToast("Asking for camera access…");
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
    state.city311Cache = null;
    state.settings = {
      darkMode: true,
      locationEnabled: true,
      cameraEnabled: true,
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

  applyTheme();
  syncSettingsUI();
  renderSlots();
  updateVoiceUi();
  renderHomeList();
  requestLocation();
  showScreen("camera");
})();
