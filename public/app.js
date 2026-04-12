(function () {
  "use strict";

  var STORAGE_REQUESTS = "flick_requests";
  var STORAGE_SETTINGS = "flick_settings";

  var demo311PollTimer = null;

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

  var UI_LANG_CODES = ["en", "es", "fr", "ja", "zh", "hi", "ar", "bn"];

  function normalizeUiLanguage(code) {
    var c = String(code == null ? "" : code).trim().toLowerCase();
    if (c === "zh-cn" || c === "zh_cn" || c === "zho") c = "zh";
    if (c.indexOf("zh") === 0) c = "zh";
    if (UI_LANG_CODES.indexOf(c) >= 0) return c;
    return "en";
  }

  /** Localized category labels for UI only; slugs and submitted `fields` stay English. */
  var CATEGORY_LABELS_BY_LANG = {
    es: {
    abandoned_automobile: "Vehículo abandonado",
    abandoned_bicycle: "Bicicleta abandonada",
    construction_complaint: "Queja por construcción",
    dangerous_building_complaint: "Edificio peligroso",
    dangerous_sidewalk: "Acera peligrosa",
    fire_safety_complaint: "Seguridad contra incendios",
    graffiti_removal_request: "Eliminación de grafitis",
    homeless_encampment: "Asentamiento informal",
    illegal_dumping: "Vertido ilegal",
    inlet_cleaning: "Limpieza de sumidero",
    maintenance_complaint: "Queja de mantenimiento",
    park_trail_conditions: "Parque y senderos",
    plastic_bag_ban_complaint: "Bolsa de plástico",
    pothole_repair: "Baches",
    private_tree_complaint: "Árbol en propiedad privada",
    recycling_collection: "Reciclaje",
    right_of_way: "Servidumbre de paso",
    rubbish_collection: "Recogida de basura",
    short_term_rental_complaint: "Alquiler temporal",
    smoke_alarm_request: "Detector de humo",
    street_light_out: "Alumbrado público",
    traffic_calming_request: "Calma de tráfico",
    traffic_sign_complaint: "Señal de tráfico",
    traffic_signal_emergency: "Semáforo (emergencia)",
    trash_hauler_noise_complaint: "Ruido de camión de basura",
    unlicensed_business_complaint: "Negocio sin licencia",
    vacant_lot_cleanup: "Lote baldío",
    vacant_property_complaint: "Propiedad vacante",
    water_issue: "Agua / hidrante / inundación",
    other: "Otro",
    },
  };

  var I18N = {
    en: {
      "nav.home": "Home",
      "nav.camera": "Camera",
      "nav.settings": "Settings",
      "nav.main_aria": "Main navigation",
      "set.title": "Settings",
      "set.dark": "Dark mode",
      "set.location": "Use device location",
      "set.camera": "Use device camera",
      "set.microphone": "Use microphone",
      "set.language": "Language",
      "set.open_app": "Open app settings",
      "set.help_blocked":
        "Use this if the camera or microphone prompt was blocked or the live view won’t start.",
      "set.clear": "Clear all local data",
      "home.title": "Flick It Philly",
      "home.reports": "Your reports",
      "home.empty":
        "No reports yet. Use the camera to add photos and/or a voice note, then generate a report. Tap a saved concern for details or submit later.",
      "home.map_title_all": "All reports to 311",
      "home.map_title_mine": "Your reports to 311",
      "home.map_desc":
        "Map shows the last 30 days only. Your submitted concerns are yellow (pending) or green (completed). With Everyone, red and blue dots are real Philly 311 cases from open data (open / closed). Drafts stay off the map.",
      "map.view": "View",
      "map.mine": "Mine only",
      "map.everyone": "Everyone",
      "map.category": "Category",
      "map.all_types": "All types",
      "map.count_none_yours": "No matching reports on the map.",
      "map.count_yours":
        "{n} report{s} on map (yours)",
      "map.count_none": "No matching reports on the map.",
      "map.count_mix":
        "{t} reports on map ({y} yours · {c} city). Tap a cluster to zoom in; tap a dot for details.",
      "cam.slots_aria": "Photo slots, remove with the X button",
      "cam.overlay":
        "Add photos and/or a voice note, then Report",
      "cam.off": "Camera off",
      "cam.off_help":
        "Turn on “Use device camera” in the Settings tab.",
      "cam.unavail": "Camera unavailable",
      "cam.allow": "Allow camera in the Settings tab.",
      "cam.take_photo": "Take a photo",
      "cam.native_help":
        "Tap the round capture button to open your device camera.",
      "cam.pinch_help": "Pinch the preview with two fingers to zoom.",
      "cam.gallery": "Gallery",
      "cam.gallery_aria": "Upload photos from your gallery",
      "cam.report": "Report",
      "cam.preview_aria": "Live camera feed",
      "cam.capture_aria": "Take photo",
      "cam.generate_aria": "Generate report from photos and audio",
      "voice.audio": "Audio",
      "voice.stop": "Stop",
      "voice.recording": "Recording…",
      "voice.ready": "Voice note ready — tap play to replay",
      "voice.mic_off": "Microphone is off in Settings.",
      "voice.btn_aria": "Record or stop voice note",
      "voice.clear": "Clear voice",
      "voice.clear_aria": "Remove voice note",
      "voice.playback_aria": "Replay voice note",
      "voice.playback_heading": "Voice note",
      "modal.confirm_title": "Use this photo?",
      "modal.confirm_img_alt": "Selected photo",
      "modal.retake": "Retake",
      "modal.accept": "Accept",
      "modal.report_title": "Edit report",
      "modal.ai_heading": "AI review",
      "modal.category": "Category",
      "modal.description": "Description",
      "modal.location": "Location (address)",
      "modal.loc_meta":
        "Required — street address or intersection",
      "modal.loc_detail": "street address or intersection",
      "modal.loc_ph": "Required: street address or intersection",
      "modal.desc_staff_hint": "general description for city staff.",
      "modal.desc_optional_hint": "add details if helpful.",
      "modal.primary_note":
        "Your first photo is sent automatically as the primary image with this report.",
      "modal.offline":
        "You’re offline or AI failed — fill in the form manually.",
      "modal.cancel": "Cancel",
      "modal.close": "Close",
      "modal.save": "Save concern",
      "modal.submit": "Submit concern",
      "modal.triage_no":
        "This doesn’t look like a typical 311 issue. Submission is disabled for this draft.",
      "modal.triage_yes":
        "This looks like something Philadelphia 311 can act on. Double-check the details, then submit if it’s accurate.",
      "detail.title": "Your concern",
      "detail.close": "Close",
      "detail.edit": "Edit",
      "detail.submit": "Submit",
      "detail.delete": "Delete",
      "detail.ai_low": " · AI: low priority for 311",
      "detail.no_photos": "No photos attached.",
      "toast.mic_settings": "Turn on the microphone in Settings to record.",
      "toast.mic_unsupported":
        "Voice needs the app or a browser that supports microphone recording.",
      "toast.mic_denied": "Could not access the microphone.",
      "toast.loc_settings": "Turn on location in Settings to use this.",
      "toast.loc_unavail": "Location isn’t available on this device.",
      "toast.loc_read": "Couldn’t read your position.",
      "toast.loc_perm": "Couldn’t get your location. Check permissions.",
      "toast.submitted_demo":
        "Sent to 311 — pending until the city processes it.",
      "toast.submitted_local":
        "Sent on this device. Set FLICK_311_DEMO_URL in .env and restart Expo to sync the demo dashboard.",
      "toast.saved_demo": "Saved. Demo dashboard updated.",
      "toast.saved": "Concern saved on this device.",
      "toast.app_settings": "Opening system settings…",
      "toast.data_cleared": "Local data cleared.",
      "modal.triage_prefix": "Worth submitting: ",
      "field.required": "Required",
      "field.optional": "Optional",
      "field.select_ph": "Select…",
      "field.optional_dash": "—",
      "map.legend_title": "Key",
      "map.legend_region": "Map legend",
      "map.legend_user_pending": "Your report — pending",
      "map.legend_user_done": "Your report — completed",
      "map.legend_city_open": "Philly 311 data — pending",
      "map.legend_city_closed": "Philly 311 data — completed",
      "map.locate_aria": "Go to my location",
      "map.filters_aria": "Map filters",
      "detail.submit311": "Submit to 311",
      "detail.row_category": "Category",
      "detail.row_description": "Description",
      "detail.row_location": "Location",
      "detail.row_ai_note": "AI note",
      "detail.photo_alt": "Report photo",
      "detail.voice_aria": "Voice note",
      "status.completed": "Completed",
      "status.pending": "Pending",
      "status.submitted": "Submitted",
      "status.saved": "Saved",
      "home.no_location": "No location",
      "home.ai_low_flag": "AI: low priority",
      "home.no_image": "No image",
      "slot.remove_aria": "Remove photo",
      "slot.photo": "Photo {n}",
      "confirm.clear_title": "Clear all data",
      "confirm.clear_message":
        "Delete all saved reports and settings on this device?",
      "confirm.delete_all": "Delete all",
      "confirm.delete_title": "Delete",
      "confirm.delete_message": "Delete this concern? This cannot be undone.",
      "confirm.delete": "Delete",
      "confirm.default": "Confirm",
      "app.ok": "OK",
      "val.location": "Address (Location) is required.",
      "val.description": "Description is required for this request type.",
      "val.field": "Please fill required field: {field}.",
      "toast.analyzing": "Analyzing with AI…",
      "toast.camera_not_ready":
        "Camera not ready. Check permissions or use Gallery.",
      "toast.need_media":
        "Add at least one photo or a voice note to generate a report.",
      "toast.slots_partial": "Only {n} empty slot(s); extra files skipped.",
      "toast.demo_unreachable":
        "Could not reach the demo 311 server. Same Wi‑Fi? Check FLICK_311_DEMO_URL and run npm run 311-demo.",
      "toast.concern_not_found": "Concern not found.",
      "toast.completed_no_edit": "This report is completed — it can’t be edited.",
      "toast.deleted": "Concern deleted.",
      "toast.slots_full": "All 5 photo slots are full.",
    },
    es: {
      "nav.home": "Inicio",
      "nav.camera": "Cámara",
      "nav.settings": "Ajustes",
      "nav.main_aria": "Navegación principal",
      "set.title": "Ajustes",
      "set.dark": "Modo oscuro",
      "set.location": "Usar ubicación del dispositivo",
      "set.camera": "Usar cámara del dispositivo",
      "set.microphone": "Usar micrófono",
      "set.language": "Idioma",
      "set.open_app": "Abrir ajustes de la app",
      "set.help_blocked":
        "Úsalo si bloqueaste el permiso de cámara o micrófono o no arranca la vista en vivo.",
      "set.clear": "Borrar todos los datos locales",
      "home.title": "Flick It Philly",
      "home.reports": "Tus reportes",
      "home.empty":
        "Aún no hay reportes. Usa la cámara para añadir fotos y/o una nota de voz, luego genera un reporte. Toca un borrador para ver detalles o enviarlo después.",
      "home.map_title_all": "Todos los reportes a 311",
      "home.map_title_mine": "Tus reportes a 311",
      "home.map_desc":
        "El mapa muestra solo los últimos 30 días. Tus envíos aparecen en amarillo (pendiente) o verde (completado). Con Todos, los puntos rojos y azules son casos reales de 311 de datos abiertos (abierto / cerrado). Los borradores no aparecen.",
      "map.view": "Vista",
      "map.mine": "Solo míos",
      "map.everyone": "Todos",
      "map.category": "Categoría",
      "map.all_types": "Todos los tipos",
      "map.count_none_yours": "No hay reportes coincidentes en el mapa.",
      "map.count_yours": "{n} reporte{s} en el mapa (tuyos)",
      "map.count_none": "No hay reportes coincidentes en el mapa.",
      "map.count_mix":
        "{t} reportes en el mapa ({y} tuyos · {c} ciudad). Toca un grupo para acercar; toca un punto para detalles.",
      "cam.slots_aria": "Ranuras de fotos; quita con la X",
      "cam.overlay":
        "Añade fotos y/o una nota de voz, luego Reporte",
      "cam.off": "Cámara apagada",
      "cam.off_help":
        "Activa “Usar cámara del dispositivo” en la pestaña Ajustes.",
      "cam.unavail": "Cámara no disponible",
      "cam.allow": "Permite la cámara en la pestaña Ajustes.",
      "cam.take_photo": "Tomar una foto",
      "cam.native_help":
        "Toca el botón redondo para abrir la cámara del dispositivo.",
      "cam.pinch_help": "Pellizca la vista previa con dos dedos para zoom.",
      "cam.gallery": "Galería",
      "cam.gallery_aria": "Subir fotos desde la galería",
      "cam.report": "Reporte",
      "cam.preview_aria": "Vista en vivo de la cámara",
      "cam.capture_aria": "Tomar foto",
      "cam.generate_aria": "Generar reporte desde fotos y audio",
      "voice.audio": "Audio",
      "voice.stop": "Detener",
      "voice.recording": "Grabando…",
      "voice.ready": "Nota de voz lista — toca reproducir",
      "voice.mic_off": "El micrófono está desactivado en Ajustes.",
      "voice.btn_aria": "Grabar o detener nota de voz",
      "voice.clear": "Borrar voz",
      "voice.clear_aria": "Quitar nota de voz",
      "voice.playback_aria": "Reproducir nota de voz",
      "voice.playback_heading": "Nota de voz",
      "modal.confirm_title": "¿Usar esta foto?",
      "modal.confirm_img_alt": "Foto seleccionada",
      "modal.retake": "Repetir",
      "modal.accept": "Aceptar",
      "modal.report_title": "Editar reporte",
      "modal.ai_heading": "Revisión IA",
      "modal.category": "Categoría",
      "modal.description": "Descripción",
      "modal.location": "Ubicación (dirección)",
      "modal.loc_meta":
        "Obligatorio — calle o cruce",
      "modal.loc_detail": "calle o intersección",
      "modal.loc_ph": "Obligatorio: dirección o cruce",
      "modal.desc_staff_hint": "descripción general para el personal municipal.",
      "modal.desc_optional_hint": "añade detalles si ayuda.",
      "modal.primary_note":
        "La primera foto se envía automáticamente como imagen principal con este reporte.",
      "modal.offline":
        "Sin conexión o falló la IA — completa el formulario a mano.",
      "modal.cancel": "Cancelar",
      "modal.close": "Cerrar",
      "modal.save": "Guardar borrador",
      "modal.submit": "Enviar reporte",
      "modal.triage_no":
        "No parece un caso típico de 311. El envío está desactivado para este borrador.",
      "modal.triage_yes":
        "Parece algo en lo que Philadelphia 311 puede actuar. Revisa los datos y envía si es correcto.",
      "detail.title": "Tu reporte",
      "detail.close": "Cerrar",
      "detail.edit": "Editar",
      "detail.submit": "Enviar",
      "detail.delete": "Eliminar",
      "detail.ai_low": " · IA: baja prioridad para 311",
      "detail.no_photos": "Sin fotos adjuntas.",
      "toast.mic_settings": "Activa el micrófono en Ajustes para grabar.",
      "toast.mic_unsupported":
        "La voz requiere la app o un navegador compatible con grabación.",
      "toast.mic_denied": "No se pudo acceder al micrófono.",
      "toast.loc_settings": "Activa la ubicación en Ajustes para usar esto.",
      "toast.loc_unavail": "La ubicación no está disponible en este dispositivo.",
      "toast.loc_read": "No se pudo leer tu posición.",
      "toast.loc_perm": "No se obtuvo tu ubicación. Revisa los permisos.",
      "toast.submitted_demo":
        "Enviado a 311 — pendiente hasta que la ciudad lo procese.",
      "toast.submitted_local":
        "Enviado en este dispositivo. Configura FLICK_311_DEMO_URL en .env y reinicia Expo para el panel demo.",
      "toast.saved_demo": "Guardado. Panel demo actualizado.",
      "toast.saved": "Borrador guardado en este dispositivo.",
      "toast.app_settings": "Abriendo ajustes del sistema…",
      "toast.data_cleared": "Datos locales borrados.",
      "modal.triage_prefix": "Conviene enviarlo: ",
      "field.required": "Obligatorio",
      "field.optional": "Opcional",
      "field.select_ph": "Elegir…",
      "field.optional_dash": "—",
      "map.legend_title": "Leyenda",
      "map.legend_region": "Leyenda del mapa",
      "map.legend_user_pending": "Tu reporte — pendiente",
      "map.legend_user_done": "Tu reporte — completado",
      "map.legend_city_open": "Datos 311 de Filadelfia — pendiente",
      "map.legend_city_closed": "Datos 311 de Filadelfia — completado",
      "map.locate_aria": "Ir a mi ubicación",
      "map.filters_aria": "Filtros del mapa",
      "detail.submit311": "Enviar a 311",
      "detail.row_category": "Categoría",
      "detail.row_description": "Descripción",
      "detail.row_location": "Ubicación",
      "detail.row_ai_note": "Nota de IA",
      "detail.photo_alt": "Foto del reporte",
      "detail.voice_aria": "Nota de voz",
      "status.completed": "Completado",
      "status.pending": "Pendiente",
      "status.submitted": "Enviado",
      "status.saved": "Guardado",
      "home.no_location": "Sin ubicación",
      "home.ai_low_flag": "IA: baja prioridad",
      "home.no_image": "Sin imagen",
      "slot.remove_aria": "Quitar foto",
      "slot.photo": "Foto {n}",
      "confirm.clear_title": "Borrar todos los datos",
      "confirm.clear_message":
        "¿Eliminar todos los reportes guardados y la configuración en este dispositivo?",
      "confirm.delete_all": "Eliminar todo",
      "confirm.delete_title": "Eliminar",
      "confirm.delete_message":
        "¿Eliminar este reporte? No se puede deshacer.",
      "confirm.delete": "Eliminar",
      "confirm.default": "Confirmar",
      "app.ok": "Aceptar",
      "val.location": "La dirección (ubicación) es obligatoria.",
      "val.description":
        "La descripción es obligatoria para este tipo de solicitud.",
      "val.field": "Completa el campo obligatorio: {field}.",
      "toast.analyzing": "Analizando con IA…",
      "toast.camera_not_ready":
        "Cámara no lista. Revisa permisos o usa la galería.",
      "toast.need_media":
        "Añade al menos una foto o una nota de voz para generar el reporte.",
      "toast.slots_partial":
        "Solo {n} ranura(s) vacía(s); se omitieron archivos extra.",
      "toast.demo_unreachable":
        "No se alcanzó el servidor demo 311. ¿Misma Wi‑Fi? Revisa FLICK_311_DEMO_URL y ejecuta npm run 311-demo.",
      "toast.concern_not_found": "No se encontró el reporte.",
      "toast.completed_no_edit":
        "Este reporte está completado — no se puede editar.",
      "toast.deleted": "Reporte eliminado.",
      "toast.slots_full": "Las 5 ranuras de fotos están llenas.",
    },
  };

  (function mergeFlickExtraLocales() {
    var w = typeof window !== "undefined" ? window : null;
    if (!w) return;
    var b = w.__FLICK_LOCALES_BUNDLE;
    if (b && typeof b === "object") {
      if (b.i18n && typeof b.i18n === "object") {
        Object.keys(b.i18n).forEach(function (k) {
          I18N[k] = Object.assign({}, I18N.en, b.i18n[k]);
        });
      }
      if (b.categories && typeof b.categories === "object") {
        Object.keys(b.categories).forEach(function (k) {
          CATEGORY_LABELS_BY_LANG[k] = b.categories[k];
        });
      }
    }
    var ix = w.__FLICK_I18N_EXTRA;
    if (ix && typeof ix === "object") {
      Object.keys(ix).forEach(function (k) {
        I18N[k] = Object.assign({}, I18N.en, ix[k]);
      });
    }
    var cx = w.__FLICK_CATEGORY_LABELS_EXTRA;
    if (cx && typeof cx === "object") {
      Object.keys(cx).forEach(function (k) {
        CATEGORY_LABELS_BY_LANG[k] = cx[k];
      });
    }
  })();

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
          uiLanguage: normalizeUiLanguage(s.uiLanguage),
        };
      }
    } catch (e) {}
    return {
      darkMode: true,
      locationEnabled: true,
      cameraEnabled: true,
      microphoneEnabled: true,
      uiLanguage: "en",
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

  function normalize311BaseUrl(s) {
    if (!s || typeof s !== "string") return "";
    return s.trim().replace(/\/+$/, "");
  }

  function get311DemoUrl() {
    try {
      if (
        typeof window !== "undefined" &&
        window.__FLICK_311_DEMO_URL__ != null
      ) {
        var s = String(window.__FLICK_311_DEMO_URL__).trim();
        if (s) return normalize311BaseUrl(s);
      }
    } catch (e) {}
    return "";
  }

  function stop311DemoPoll() {
    if (demo311PollTimer) {
      clearInterval(demo311PollTimer);
      demo311PollTimer = null;
    }
  }

  function start311DemoPoll() {
    stop311DemoPoll();
    if (!get311DemoUrl()) return;
    demo311PollTimer = setInterval(sync311DemoFromServer, 12000);
  }

  var DEMO311_MAX_IMAGES = 8;
  var DEMO311_MAX_IMAGE_CHARS = 1800000;
  var DEMO311_MAX_VOICE_CHARS = 2800000;

  function build311DemoPayload(r) {
    var fields = {};
    if (r.fields && typeof r.fields === "object") {
      Object.keys(r.fields).forEach(function (k) {
        fields[k] = String(r.fields[k]).slice(0, 4000);
      });
    }
    var images = [];
    if (r.images && r.images.length) {
      for (var i = 0; i < r.images.length && i < DEMO311_MAX_IMAGES; i++) {
        var u = String(r.images[i] || "");
        if (u.indexOf("data:") !== 0) continue;
        if (u.length > DEMO311_MAX_IMAGE_CHARS) {
          u = u.slice(0, DEMO311_MAX_IMAGE_CHARS);
        }
        images.push(u);
      }
    }
    var voiceNote = null;
    if (r.voiceNote && String(r.voiceNote).indexOf("data:") === 0) {
      var vn = String(r.voiceNote);
      voiceNote =
        vn.length > DEMO311_MAX_VOICE_CHARS
          ? vn.slice(0, DEMO311_MAX_VOICE_CHARS)
          : vn;
    }
    return {
      id: r.id,
      category: r.category || "other",
      description: String(r.description || "").slice(0, 8000),
      location: String(r.location || "").slice(0, 1000),
      timestamp: typeof r.timestamp === "number" ? r.timestamp : Date.now(),
      lat: typeof r.lat === "number" ? r.lat : null,
      lng: typeof r.lng === "number" ? r.lng : null,
      fields: fields,
      images: images,
      voiceNote: voiceNote,
      primaryPhotoIndex:
        typeof r.primaryPhotoIndex === "number" ? r.primaryPhotoIndex : null,
      worthSubmitting:
        typeof r.worthSubmitting === "boolean" ? r.worthSubmitting : null,
      submissionAdvice: String(r.submissionAdvice || "").slice(0, 4000),
      manualEntry: r.manualEntry === true,
      appStatus: String(r.status || "").slice(0, 32),
    };
  }

  function pushConcernTo311Demo(r) {
    var base = get311DemoUrl();
    if (!base || !r || !r.id) return;
    function warnReach() {
      showToast(tr("toast.demo_unreachable"));
    }
    try {
      fetch(base + "/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(build311DemoPayload(r)),
        mode: "cors",
      })
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
        })
        .catch(warnReach);
    } catch (e) {
      warnReach();
    }
  }

  function deleteConcernOn311Demo(id) {
    var base = get311DemoUrl();
    if (!base || !id) return;
    try {
      fetch(base + "/api/requests/" + encodeURIComponent(id), {
        method: "DELETE",
        mode: "cors",
      }).catch(function () {});
    } catch (e) {}
  }

  function sync311DemoFromServer() {
    var base = get311DemoUrl();
    if (!base) return;
    fetch(base + "/api/requests", { method: "GET", cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("bad");
        return res.json();
      })
      .then(function (data) {
        var rows = (data && data.requests) || [];
        var serverById = {};
        rows.forEach(function (row) {
          if (row && row.id) {
            serverById[row.id] =
              row.dashboardStatus === "completed" ? "completed" : "pending";
          }
        });
        var list = loadRequests();
        var changed = false;
        var next = list.map(function (local) {
          if (!concernIsSubmitted(local)) return local;
          var sv = serverById[local.id];
          if (sv === undefined) return local;

          if (sv === "completed") {
            if (local.status === "completed") return local;
            changed = true;
            return Object.assign({}, local, { status: "completed" });
          }
          if (local.status === "completed") {
            changed = true;
            return Object.assign({}, local, { status: "pending" });
          }
          return local;
        });
        if (changed) {
          saveRequests(next);
          renderHomeList();
          if (state.map) refreshMap();
          if (state.detailConcernId) {
            var dr = getRequestById(state.detailConcernId);
            if (dr) renderConcernDetail(dr);
          }
        }
      })
      .catch(function () {});
  }

  function categoryLabel(value) {
    var slug = null;
    var en = null;
    for (var i = 0; i < CATEGORIES.length; i++) {
      if (CATEGORIES[i].value === value) {
        slug = CATEGORIES[i].value;
        en = CATEGORIES[i].label;
        break;
      }
    }
    if (!en) {
      var resolved = resolveCategoryFromAi(value);
      for (var j = 0; j < CATEGORIES.length; j++) {
        if (CATEGORIES[j].value === resolved) {
          slug = CATEGORIES[j].value;
          en = CATEGORIES[j].label;
          break;
        }
      }
    }
    if (!en) en = (value || "Report").replace(/_/g, " ");
    if (!slug) slug = resolveCategoryFromAi(value || "other");
    var lang =
      typeof state !== "undefined" && state && state.settings
        ? normalizeUiLanguage(state.settings.uiLanguage)
        : "en";
    var locMap = CATEGORY_LABELS_BY_LANG[lang];
    if (locMap && locMap[slug]) return locMap[slug];
    return en;
  }

  /** English catalog label for matching city open-data text (UI may be Spanish). */
  function categoryEnglishLabel(value) {
    for (var i = 0; i < CATEGORIES.length; i++) {
      if (CATEGORIES[i].value === value) return CATEGORIES[i].label;
    }
    var resolved = resolveCategoryFromAi(value);
    for (var j = 0; j < CATEGORIES.length; j++) {
      if (CATEGORIES[j].value === resolved) return CATEGORIES[j].label;
    }
    return (value || "Report").replace(/_/g, " ");
  }

  function numberLocaleForUi() {
    if (typeof state === "undefined" || !state || !state.settings) {
      return "en-US";
    }
    var u = normalizeUiLanguage(state.settings.uiLanguage);
    var m = {
      en: "en-US",
      es: "es-US",
      fr: "fr-FR",
      ja: "ja-JP",
      zh: "zh-CN",
      hi: "hi-IN",
      ar: "ar-SA",
      bn: "bn-BD",
    };
    return m[u] || "en-US";
  }

  function formatTime(ts) {
    var d = new Date(ts);
    return d.toLocaleString(numberLocaleForUi(), {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function concernIsSubmitted(r) {
    return (
      r.status === "submitted" ||
      r.status === "pending" ||
      r.status === "completed"
    );
  }

  function concernIsSavedOnly(r) {
    return !concernIsSubmitted(r);
  }

  /** False once the demo 311 queue marks this request completed (synced from server). */
  function concernIsUserEditable(r) {
    if (!r) return false;
    return r.status !== "completed";
  }

  function concernStatusLabel(r) {
    if (r.status === "completed") return tr("status.completed");
    if (r.status === "pending") return tr("status.pending");
    if (r.status === "submitted") return tr("status.submitted");
    return tr("status.saved");
  }

  function concernStatusPillClass(r) {
    if (r.status === "completed") return "completed";
    if (r.status === "pending") return "pending";
    if (r.status === "submitted") return "submitted";
    return "saved";
  }

  function getRequestById(id) {
    var found = null;
    loadRequests().forEach(function (x) {
      if (x.id === id) found = x;
    });
    return found;
  }

  function toastTeardown(t) {
    var sp = $("toast-spinner");
    t.classList.remove(
      "toast-persistent",
      "toast-with-spinner",
      "toast-hiding"
    );
    t.hidden = true;
    t.removeAttribute("aria-busy");
    if (sp) sp.hidden = true;
  }

  function hideToast() {
    var t = $("toast");
    var sp = $("toast-spinner");
    clearTimeout(showToast._timer);
    showToast._timer = null;
    if (hideToast._fadeTimer) {
      clearTimeout(hideToast._fadeTimer);
      hideToast._fadeTimer = null;
    }
    if (hideToast._onTransitionEnd) {
      t.removeEventListener("transitionend", hideToast._onTransitionEnd);
      hideToast._onTransitionEnd = null;
    }
    if (t.hidden) {
      toastTeardown(t);
      return;
    }
    if (t.classList.contains("toast-hiding")) {
      return;
    }
    hideToast._onTransitionEnd = function (ev) {
      if (ev.target !== t || ev.propertyName !== "opacity") return;
      t.removeEventListener("transitionend", hideToast._onTransitionEnd);
      hideToast._onTransitionEnd = null;
      clearTimeout(hideToast._fadeTimer);
      hideToast._fadeTimer = null;
      toastTeardown(t);
    };
    t.addEventListener("transitionend", hideToast._onTransitionEnd);
    requestAnimationFrame(function () {
      t.classList.add("toast-hiding");
    });
    hideToast._fadeTimer = setTimeout(function () {
      if (hideToast._onTransitionEnd) {
        t.removeEventListener("transitionend", hideToast._onTransitionEnd);
        hideToast._onTransitionEnd = null;
      }
      hideToast._fadeTimer = null;
      toastTeardown(t);
    }, 520);
  }

  function showToast(msg, opts) {
    opts = opts || {};
    var t = $("toast");
    var msgEl = $("toast-message");
    var sp = $("toast-spinner");
    if (hideToast._fadeTimer) {
      clearTimeout(hideToast._fadeTimer);
      hideToast._fadeTimer = null;
    }
    if (hideToast._onTransitionEnd) {
      t.removeEventListener("transitionend", hideToast._onTransitionEnd);
      hideToast._onTransitionEnd = null;
    }
    t.classList.remove("toast-hiding");
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
      hideToast();
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
      title.textContent = tr("cam.off");
      hint.textContent = tr("cam.off_help");
      hint.hidden = false;
    } else if (kind === "blocked") {
      setCameraOverlayMode("error");
      title.textContent = tr("cam.unavail");
      hint.textContent = tr("cam.allow");
      hint.hidden = false;
    } else if (kind === "android-native") {
      setCameraOverlayMode("native");
      title.textContent = tr("cam.take_photo");
      hint.textContent = tr("cam.native_help");
      hint.hidden = false;
    } else {
      setCameraOverlayMode("live");
      title.textContent = tr("cam.overlay");
      hint.textContent = tr("cam.pinch_help");
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

  var VOICE_ICON_MIC_SVG =
    '<svg class="ctrl-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>';
  var VOICE_ICON_STOP_SVG =
    '<svg class="ctrl-btn-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="7" y="7" width="10" height="10" rx="1.5"/></svg>';

  function voiceButtonInnerHtml(isRecording) {
    var icon = isRecording ? VOICE_ICON_STOP_SVG : VOICE_ICON_MIC_SVG;
    var label = isRecording ? tr("voice.stop") : tr("voice.audio");
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
    var playbackWrap = $("voice-playback-wrap");
    if (!btn || !clr) return;
    btn.setAttribute("aria-label", tr("voice.btn_aria"));
    var micOff = !state.settings.microphoneEnabled;
    var locked = state.aiMediaLocked;
    btn.classList.toggle("is-recording", state.voiceRecording);
    btn.innerHTML = voiceButtonInnerHtml(state.voiceRecording);
    btn.disabled =
      (micOff && !state.voiceRecording) ||
      (locked && !state.voiceRecording);
    var has = !!(state.voiceNote && String(state.voiceNote).trim());
    clr.hidden = !has || locked;
    if (st) {
      if (state.voiceRecording) {
        st.hidden = false;
        st.textContent = tr("voice.recording");
      } else if (has) {
        st.hidden = false;
        st.textContent = tr("voice.ready");
      } else if (micOff) {
        st.hidden = false;
        st.textContent = tr("voice.mic_off");
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
        if (playbackWrap) playbackWrap.hidden = true;
      } else {
        aud.hidden = false;
        if (playbackWrap) playbackWrap.hidden = false;
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
      showToast(tr("toast.mic_settings"));
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showToast(tr("toast.mic_unsupported"));
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
        showToast(tr("toast.mic_denied"));
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
    /** true while AI report is generating — cannot remove photos/voice or start new recording */
    aiMediaLocked: false,
    detailConcernId: null,
    map: null,
    /** Dim outside city + boundary stroke (below markers). */
    phlBackdropLayer: null,
    /** City 311 open-data points (last 30 days). */
    otherLayer: null,
    userLayer: null,
    lastPosition: null,
    /** home | camera | settings — kept in sync with showScreen */
    currentScreen: "camera",
    /** false = map shows only this device’s submitted reports */
    mapShowCity311: true,
    /** "" = all categories; else category slug from map filter */
    mapCategorySlug: "",
    /** Last drawn map points for zoom re-cluster (no refetch) */
    mapCachedUserItems: null,
    mapCachedOtherItems: null,
    mapZoomListenerBound: false,
    mapRedrawTimer: null,
    /** Report modal: Cancel vs Close label when language changes */
    reportModalCancelIsClose: false,
  };

  function uiLang() {
    return normalizeUiLanguage(state.settings.uiLanguage);
  }

  function htmlDocLang() {
    var u = uiLang();
    return u === "zh" ? "zh-Hans" : u;
  }

  function tr(key, rep) {
    var pack = I18N[uiLang()] || I18N.en;
    var s = pack[key];
    if (s == null) s = I18N.en[key];
    if (s == null) return key;
    if (rep && typeof rep === "object") {
      Object.keys(rep).forEach(function (k) {
        s = s.split("{" + k + "}").join(String(rep[k]));
      });
    }
    return s;
  }

  function applyUiLanguage() {
    document.documentElement.lang = htmlDocLang();
    document.documentElement.dir = uiLang() === "ar" ? "rtl" : "ltr";
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var k = el.getAttribute("data-i18n");
      if (k) el.textContent = tr(k);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      var k = el.getAttribute("data-i18n-placeholder");
      if (k) el.setAttribute("placeholder", tr(k));
    });
    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      var k = el.getAttribute("data-i18n-aria");
      if (k) el.setAttribute("aria-label", tr(k));
    });
    document.querySelectorAll("[data-i18n-alt]").forEach(function (el) {
      var k = el.getAttribute("data-i18n-alt");
      if (k) el.setAttribute("alt", tr(k));
    });
    syncLanguageSettingFlickSelect();
    updateVoiceUi();
    buildMapCategoryFilterOptions();
    updateMapSectionUiFromState();
    syncNavLabelsI18n();
    if (!$("modal-report").hidden) {
      refreshOpenReportModalButtons();
      updateDescriptionRequiredHint();
      updatePrimaryPhotoNote();
    }
    if (!$("modal-detail").hidden && state.detailConcernId) {
      var dr = getRequestById(state.detailConcernId);
      if (dr) renderConcernDetail(dr);
    }
    renderHomeList();
    renderSlots();
  }

  function syncNavLabelsI18n() {
    document.querySelectorAll(".nav-item[data-nav]").forEach(function (btn) {
      var nav = btn.getAttribute("data-nav");
      var lab = btn.querySelector(".nav-label");
      if (!lab) return;
      if (nav === "home") lab.textContent = tr("nav.home");
      else if (nav === "camera") lab.textContent = tr("nav.camera");
      else if (nav === "settings") lab.textContent = tr("nav.settings");
    });
  }

  function refreshOpenReportModalButtons() {
    if ($("modal-report").hidden) return;
    var sav = $("btn-report-save");
    var sub = $("btn-report-submit");
    var can = $("btn-report-cancel");
    if (sav) sav.textContent = tr("modal.save");
    if (sub) sub.textContent = tr("modal.submit");
    if (can) {
      can.textContent = tr(
        state.reportModalCancelIsClose ? "modal.close" : "modal.cancel"
      );
    }
  }

  function syncLanguageSettingFlickSelect() {
    var root = $("settings-ui-language-root");
    if (!root || typeof flickSelectPopulate !== "function") return;
    flickSelectPopulate(
      root,
      [
        { value: "en", label: "English" },
        { value: "es", label: "Español (Spanish)" },
        { value: "fr", label: "Français (French)" },
        { value: "ja", label: "日本語 (Japanese)" },
        { value: "zh", label: "中文（简体） (Chinese (Simplified))" },
        { value: "hi", label: "हिन्दी (Hindi)" },
        { value: "ar", label: "العربية (Arabic)" },
        { value: "bn", label: "বাংলা (Bengali)" },
      ],
      normalizeUiLanguage(state.settings.uiLanguage)
    );
    var hid = $("set-ui-language");
    if (hid) hid.value = normalizeUiLanguage(state.settings.uiLanguage);
  }

  function updateMapSectionUiFromState() {
    var y = state.mapCachedUserItems ? state.mapCachedUserItems.length : 0;
    var c = state.mapCachedOtherItems ? state.mapCachedOtherItems.length : 0;
    updateMapSectionUi(y, c);
  }

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
    syncLanguageSettingFlickSelect();
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

  var FLICK_SELECT_OPEN = "flick-select-open";
  var flickSelectGlobalsBound = false;

  function flickSelectCloseAll(exceptRoot) {
    document.querySelectorAll(".flick-select." + FLICK_SELECT_OPEN).forEach(
      function (r) {
        if (exceptRoot && r === exceptRoot) return;
        flickSelectSetClosed(r);
      }
    );
  }

  function flickSelectClearPanelLayout(panel) {
    if (!panel) return;
    panel.style.cssText = "";
    panel.hidden = true;
  }

  function flickSelectSetClosed(root) {
    if (!root) return;
    root.classList.remove(FLICK_SELECT_OPEN);
    var panel = root.querySelector(".flick-select-panel");
    var trigger = root.querySelector(".flick-select-trigger");
    flickSelectClearPanelLayout(panel);
    if (trigger) trigger.setAttribute("aria-expanded", "false");
  }

  function flickSelectPositionPanel(root) {
    var trigger = root.querySelector(".flick-select-trigger");
    var panel = root.querySelector(".flick-select-panel");
    if (!trigger || !panel || panel.hidden) return;
    var r = trigger.getBoundingClientRect();
    var margin = 4;
    var pad = 10;
    var maxH = Math.max(
      120,
      Math.min(240, window.innerHeight - r.bottom - margin - pad)
    );
    var w = Math.min(r.width, window.innerWidth - pad * 2);
    var left = Math.min(
      Math.max(pad, r.left),
      window.innerWidth - pad - w
    );
    panel.style.cssText =
      "position:fixed;left:" +
      left +
      "px;top:" +
      (r.bottom + margin) +
      "px;width:" +
      w +
      "px;max-height:" +
      maxH +
      "px;z-index:260;overflow-x:hidden;overflow-y:auto;-webkit-overflow-scrolling:touch;";
  }

  function flickSelectClickOutside(ev) {
    var t = ev.target;
    if (t && typeof t.closest === "function") {
      if (t.closest(".flick-select")) return;
    }
    flickSelectCloseAll();
  }

  function ensureFlickSelectGlobalListeners() {
    if (flickSelectGlobalsBound) return;
    flickSelectGlobalsBound = true;
    document.addEventListener("click", flickSelectClickOutside);
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") flickSelectCloseAll();
    });
    window.addEventListener("resize", function () {
      flickSelectCloseAll();
    });
    window.addEventListener(
      "scroll",
      function (ev) {
        var t = ev.target;
        if (t && typeof t.closest === "function") {
          if (t.closest(".flick-select-panel")) return;
        }
        flickSelectCloseAll();
      },
      true
    );
  }

  function flickSelectBindRoot(root) {
    if (!root || root.dataset.flickSelectBound) return;
    root.dataset.flickSelectBound = "1";
    var trigger = root.querySelector(".flick-select-trigger");
    var panel = root.querySelector(".flick-select-panel");
    var hidden = root.querySelector('input[type="hidden"]');
    if (!trigger || !panel || !hidden) return;

    trigger.addEventListener("click", function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      var wasOpen = root.classList.contains(FLICK_SELECT_OPEN);
      flickSelectCloseAll();
      if (!wasOpen) {
        root.classList.add(FLICK_SELECT_OPEN);
        panel.hidden = false;
        trigger.setAttribute("aria-expanded", "true");
        requestAnimationFrame(function () {
          flickSelectPositionPanel(root);
        });
      }
    });

    panel.addEventListener(
      "touchmove",
      function (ev) {
        ev.stopPropagation();
      },
      { passive: true }
    );

    panel.addEventListener("click", function (ev) {
      ev.stopPropagation();
      var opt = ev.target.closest(".flick-select-option");
      if (!opt || !panel.contains(opt)) return;
      ev.preventDefault();
      var v = opt.getAttribute("data-value") || "";
      var lab = opt.getAttribute("data-label") || opt.textContent || "";
      hidden.value = v;
      var valueSpan = root.querySelector(".flick-select-value");
      if (valueSpan) valueSpan.textContent = lab;
      panel.querySelectorAll(".flick-select-option").forEach(function (el) {
        el.setAttribute(
          "aria-selected",
          el === opt ? "true" : "false"
        );
      });
      flickSelectSetClosed(root);
      hidden.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  /**
   * @param {HTMLElement} root .flick-select
   * @param {Array<{value:string,label:string}>} items
   * @param {string} value
   */
  function flickSelectPopulate(root, items, value) {
    ensureFlickSelectGlobalListeners();
    flickSelectBindRoot(root);
    var panel = root.querySelector(".flick-select-panel");
    var hidden = root.querySelector('input[type="hidden"]');
    var valueSpan = root.querySelector(".flick-select-value");
    if (!panel || !hidden) return;
    var v = value != null ? String(value) : "";
    var found = false;
    var matchLabel = null;
    items.forEach(function (it) {
      if (String(it.value) === v) {
        found = true;
        matchLabel = it.label;
      }
    });
    if (!found) v = "";
    hidden.value = v;
    flickSelectSetClosed(root);
    panel.innerHTML = "";
    items.forEach(function (it) {
      var row = document.createElement("div");
      row.className = "flick-select-option";
      row.setAttribute("role", "option");
      row.setAttribute("data-value", it.value);
      row.setAttribute("data-label", it.label);
      row.setAttribute(
        "aria-selected",
        String(it.value) === (hidden.value || "") ? "true" : "false"
      );
      row.textContent = it.label;
      panel.appendChild(row);
    });
    if (matchLabel == null) {
      items.forEach(function (it) {
        if (String(it.value) === (hidden.value || "")) {
          matchLabel = it.label;
        }
      });
    }
    if (valueSpan) {
      valueSpan.textContent =
        matchLabel != null ? matchLabel : items.length ? items[0].label : "—";
    }
  }

  function buildCategorySelect(selected) {
    var root = $("field-category-root");
    if (!root) return;
    var want = resolveCategoryFromAi(selected || "other");
    var items = [];
    CATEGORIES.forEach(function (c) {
      items.push({ value: c.value, label: categoryLabel(c.value) });
    });
    flickSelectPopulate(root, items, want);
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
      tag.textContent = def.required
        ? tr("field.required")
        : tr("field.optional");
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
        var fsRoot = document.createElement("div");
        fsRoot.className = "flick-select flick-select-dynamic";
        var hid = document.createElement("input");
        hid.type = "hidden";
        hid.dataset.fieldKey = def.key;
        hid.dataset.fieldRequired = def.required ? "1" : "0";
        var fsTrigger = document.createElement("button");
        fsTrigger.type = "button";
        fsTrigger.className = "flick-select-trigger flick-select-trigger-form";
        fsTrigger.setAttribute("aria-haspopup", "listbox");
        fsTrigger.setAttribute("aria-expanded", "false");
        var fsVal = document.createElement("span");
        fsVal.className = "flick-select-value";
        var fsChev = document.createElement("span");
        fsChev.className = "flick-select-chevron";
        fsChev.setAttribute("aria-hidden", "true");
        fsTrigger.appendChild(fsVal);
        fsTrigger.appendChild(fsChev);
        var fsPanel = document.createElement("div");
        fsPanel.className = "flick-select-panel";
        fsPanel.setAttribute("role", "listbox");
        fsPanel.hidden = true;
        fsRoot.appendChild(hid);
        fsRoot.appendChild(fsTrigger);
        fsRoot.appendChild(fsPanel);
        var fsItems = [];
        fsItems.push({
          value: "",
          label: def.required ? tr("field.select_ph") : tr("field.optional_dash"),
        });
        def.options.forEach(function (opt) {
          fsItems.push({ value: opt, label: opt });
        });
        var pick = val && def.options.indexOf(val) >= 0 ? val : "";
        flickSelectPopulate(fsRoot, fsItems, pick);
        ctrl = fsRoot;
      } else {
        ctrl = document.createElement("input");
        ctrl.type = "text";
        ctrl.autocomplete = "off";
        ctrl.value = val;
        ctrl.dataset.fieldKey = def.key;
        ctrl.dataset.fieldRequired = def.required ? "1" : "0";
      }
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
    t.textContent = s.descriptionRequired
      ? tr("field.required")
      : tr("field.optional");
    el.appendChild(t);
    el.appendChild(
      document.createTextNode(
        s.descriptionRequired
          ? " — " + tr("modal.desc_staff_hint")
          : " — " + tr("modal.desc_optional_hint")
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
      return tr("val.location");
    }
    var desc = $("field-description").value.trim();
    if (schema.descriptionRequired && !desc) {
      return tr("val.description");
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
      return tr("val.field", { field: missingLabel });
    }
    return null;
  }

  function setAiMediaLocked(locked) {
    state.aiMediaLocked = !!locked;
    var gen = $("btn-generate");
    if (gen) gen.disabled = state.aiMediaLocked;
    renderSlots();
    updateVoiceUi();
  }

  function clearSlot(index) {
    if (state.aiMediaLocked) return;
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
        img.alt = tr("slot.photo", { n: String(i + 1) });
        inner.appendChild(img);
        if (!state.aiMediaLocked) {
          var rm = document.createElement("button");
          rm.type = "button";
          rm.className = "slot-remove";
          rm.setAttribute("aria-label", tr("slot.remove_aria"));
          rm.textContent = "×";
          (function (slotIndex) {
            rm.addEventListener("click", function (ev) {
              ev.stopPropagation();
              ev.preventDefault();
              clearSlot(slotIndex);
            });
          })(i);
          inner.appendChild(rm);
        }
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
      showToast(tr("toast.slots_full"));
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
    state.reportModalCancelIsClose = !(
      canSubmitAction || opts.manualFallback
    );
    $("btn-report-save").hidden = false;
    $("btn-report-submit").hidden = !canSubmitAction || isSubmittedEdit;
    $("btn-report-save").textContent = tr("modal.save");
    $("btn-report-submit").textContent = tr("modal.submit");
    $("btn-report-cancel").textContent = tr(
      state.reportModalCancelIsClose ? "modal.close" : "modal.cancel"
    );

    if (opts.manualFallback) {
      triage.hidden = true;
    } else {
      triage.hidden = false;
      var advice = (opts.submissionAdvice || "").trim();
      if (opts.worthSubmitting === false) {
        triage.className = "ai-triage recommend-no";
        triageText.textContent = advice
          ? advice
          : tr("modal.triage_no");
      } else {
        triage.className = "ai-triage recommend-yes";
        triageText.textContent = advice
          ? tr("modal.triage_prefix") + advice
          : tr("modal.triage_yes");
      }
    }

    $("modal-report").hidden = false;
  }

  function closeReportModal() {
    state.currentDraftId = null;
    state.uncommittedAiDraft = null;
    state.reportModalCancelIsClose = false;
    $("modal-report").hidden = true;
    $("btn-report-submit").hidden = false;
    $("btn-report-save").hidden = false;
    $("btn-report-cancel").textContent = tr("modal.cancel");
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
      ? "The resident’s voice recording appears in the message immediately after this text (before any images). Listen to the entire recording and use it to fill BOTH the narrative (description, location) AND the structured `fields` object for your chosen category—anything they state that maps to a catalog key must appear in `fields` with the correct exact option text. Use photos for supporting detail, but whenever spoken words and a photo disagree on any factual point—what the problem is, category, location, severity, water or gas, or what object is shown—the VOICE is authoritative: set category, description, location, and every `fields` value to match what they said. If the voice is silent on something visible in a photo and the photo does not contradict the voice, you may include that detail. Do not tell the user the voice was missing, empty, or “not attached”; work from whatever media is present.\n"
      : "Use every image and the full voice audio if provided (voice may describe the issue when photos are missing or unclear).\n";
    return (
      "You classify Philadelphia 311-style civic issues from the user’s photos, optional voice note, and location hint.\n" +
      "OUTPUT LANGUAGE: The app UI may be in English, Spanish, French, Japanese, Chinese (Simplified), Hindi, Arabic, Bengali, or other languages, and the resident may speak any language in a voice note—but you MUST write every JSON string value in English for Philadelphia 311: `description`, `location`, `submission_advice`, and every string inside `fields` must be English (use exact English catalog option text for dropdown values). The `category` value must remain one of the English slugs listed below.\n" +
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
    var statusOut = mode === "submitted" ? "pending" : "saved";
    var submittedIdForSync = null;
    var editedExistingRequestId = null;

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
      if (mode === "submitted") submittedIdForSync = itemAi.id;
    } else if (id) {
      var existing = getRequestById(id);
      if (!existing) {
        showToast(tr("toast.concern_not_found"));
        return;
      }
      if (!concernIsUserEditable(existing)) {
        showToast(tr("toast.completed_no_edit"));
        return;
      }
      editedExistingRequestId = id;
      var baseFields =
        existing.fields && typeof existing.fields === "object"
          ? existing.fields
          : {};
      var newStatus;
      if (mode === "submitted") {
        newStatus = "pending";
      } else if (concernIsSubmitted(existing)) {
        newStatus = existing.status || "pending";
      } else {
        newStatus = statusOut;
      }
      var patch = {
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
      };
      if (images.length) {
        patch.images = images.slice();
        patch.primaryPhotoIndex = 0;
      }
      updateRequest(id, patch);
      if (mode === "submitted") submittedIdForSync = id;
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
      if (mode === "submitted") submittedIdForSync = item.id;
    }

    var demo311Ready = !!get311DemoUrl();
    var saveSynced311 = false;
    if (demo311Ready) {
      var push311Id = submittedIdForSync || null;
      if (
        !push311Id &&
        mode === "saved" &&
        editedExistingRequestId
      ) {
        var ex = getRequestById(editedExistingRequestId);
        if (ex && concernIsSubmitted(ex)) push311Id = editedExistingRequestId;
      }
      if (push311Id) {
        var syncRec = getRequestById(push311Id);
        if (syncRec && concernIsSubmitted(syncRec)) {
          pushConcernTo311Demo(syncRec);
          if (mode === "saved") saveSynced311 = true;
        }
      }
    }

    closeReportModal();
    stopBrowserVoiceRecording();
    state.voiceNote = null;
    state.voiceRecording = false;
    updateVoiceUi();
    showToast(
      mode === "submitted"
        ? demo311Ready
          ? tr("toast.submitted_demo")
          : tr("toast.submitted_local")
        : saveSynced311
        ? tr("toast.saved_demo")
        : tr("toast.saved")
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
      note.textContent = tr("detail.ai_low");
      line.appendChild(note);
    }

    var imgWrap = $("detail-images");
    imgWrap.innerHTML = "";
    (r.images || []).forEach(function (url) {
      var img = document.createElement("img");
      img.src = url;
      img.alt = tr("detail.photo_alt");
      imgWrap.appendChild(img);
    });
    if (!(r.images && r.images.length)) {
      var empty = document.createElement("p");
      empty.className = "detail-empty-images";
      empty.textContent = tr("detail.no_photos");
      imgWrap.appendChild(empty);
    }

    var vw = $("detail-voice-wrap");
    if (vw) {
      var prevAud = vw.querySelector("audio");
      if (prevAud) revokeVoiceAudioObjectUrl(prevAud);
      vw.innerHTML = "";
      if (r.voiceNote && String(r.voiceNote).indexOf("data:") === 0) {
        vw.hidden = false;
        var wrap = document.createElement("div");
        wrap.className = "voice-playback-wrap voice-playback-wrap--detail";
        var chrome = document.createElement("div");
        chrome.className = "voice-playback-chrome";
        var lab = document.createElement("span");
        lab.className = "voice-playback-label";
        lab.textContent = tr("voice.playback_heading");
        var aud = document.createElement("audio");
        aud.controls = true;
        aud.setAttribute("controlsList", "nodownload");
        aud.className = "detail-audio voice-playback";
        setVoiceAudioElementSrc(aud, r.voiceNote);
        aud.setAttribute("aria-label", tr("detail.voice_aria"));
        aud.addEventListener("play", function () {
          requestNativeSpeakerForVoicePlayback();
        });
        chrome.appendChild(lab);
        chrome.appendChild(aud);
        wrap.appendChild(chrome);
        vw.appendChild(wrap);
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
    addRow(tr("detail.row_category"), categoryLabel(r.category));
    addRow(tr("detail.row_description"), r.description);
    addRow(tr("detail.row_location"), r.location);
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
      addRow(tr("detail.row_ai_note"), r.submissionAdvice);
    }

    $("btn-detail-submit").hidden = !(
      concernIsSavedOnly(r) && r.worthSubmitting !== false
    );
    $("btn-detail-edit").hidden = !concernIsUserEditable(r);
  }

  function openConcernDetail(id) {
    var r = getRequestById(id);
    if (!r) return;
    state.detailConcernId = id;
    renderConcernDetail(r);
    $("modal-detail").hidden = false;
    sync311DemoFromServer();
  }

  function submitConcernFromDetail() {
    var id = state.detailConcernId;
    if (!id) return;
    var r = getRequestById(id);
    if (!r || r.worthSubmitting === false) return;
    if (!concernIsSavedOnly(r)) return;
    updateRequest(id, { status: "pending", timestamp: Date.now() });
    var posted = getRequestById(id);
    var demo311Ready = !!get311DemoUrl();
    if (posted && demo311Ready) pushConcernTo311Demo(posted);
    showToast(
      demo311Ready ? tr("toast.submitted_demo") : tr("toast.submitted_local")
    );
    closeConcernDetail();
    renderHomeList();
    if (state.map) refreshMap();
  }

  function deleteConcernFromDetail() {
    var id = state.detailConcernId;
    if (!id) return;
    showAppConfirm({
      title: tr("confirm.delete_title"),
      message: tr("confirm.delete_message"),
      confirmLabel: tr("confirm.delete"),
      danger: true,
      onConfirm: function () {
        var next = loadRequests().filter(function (r) {
          return r.id !== id;
        });
        saveRequests(next);
        deleteConcernOn311Demo(id);
        showToast(tr("toast.deleted"));
        closeConcernDetail();
        renderHomeList();
        if (state.map) refreshMap();
      },
    });
  }

  function openReportForEditFromDetail() {
    var id = state.detailConcernId;
    if (!id) return;
    var r = getRequestById(id);
    if (!r) return;
    if (!concernIsUserEditable(r)) {
      showToast(tr("toast.completed_no_edit"));
      return;
    }
    closeConcernDetail();
    state.currentDraftId = r.id;
    state.uncommittedAiDraft = null;
    var cap = state.slots.length;
    var fromImgs = r.images && r.images.length ? r.images.slice(0, cap) : [];
    var newSlots = [null, null, null, null, null];
    for (var si = 0; si < fromImgs.length && si < cap; si++) {
      newSlots[si] = fromImgs[si];
    }
    state.slots = newSlots;
    renderSlots();
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
        ph.textContent = tr("home.no_image");
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
        (r.location || tr("home.no_location")) +
        " · " +
        formatTime(r.timestamp);
      var pill = document.createElement("span");
      pill.className = "status-pill " + concernStatusPillClass(r);
      pill.textContent = concernStatusLabel(r);
      body.appendChild(title);
      body.appendChild(meta);
      body.appendChild(pill);
      if (r.worthSubmitting === false) {
        var flag = document.createElement("span");
        flag.className = "ai-flag";
        flag.textContent = tr("home.ai_low_flag");
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
    if (thresholdDeg <= 0) {
      return withCoords.map(function (r) {
        return { lat: r.lat, lng: r.lng, items: [r] };
      });
    }
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

  /** Larger when zoomed out → bigger clusters; 0 at high zoom → points separate. */
  function mapClusterThresholdDeg(zoom) {
    if (zoom >= 16) return 0;
    if (zoom <= 10) return 0.028;
    if (zoom <= 11) return 0.02;
    if (zoom <= 12) return 0.014;
    if (zoom <= 13) return 0.009;
    if (zoom <= 14) return 0.006;
    if (zoom <= 15) return 0.0035;
    return 0.0018;
  }

  function mapUserClusterKind(items) {
    var allDone =
      items.length > 0 &&
      items.every(function (it) {
        return it.status === "completed";
      });
    var allOpen =
      items.length > 0 &&
      items.every(function (it) {
        return it.status !== "completed";
      });
    if (allDone) return "user-done";
    if (allOpen) return "user-pending";
    return "user-mix";
  }

  function mapCityClusterKind(items) {
    var allClosed =
      items.length > 0 &&
      items.every(function (it) {
        return it.completed;
      });
    var allOpen =
      items.length > 0 &&
      items.every(function (it) {
        return !it.completed;
      });
    if (allClosed) return "city-closed";
    if (allOpen) return "city-open";
    return "city-mix";
  }

  function mapClusterCountDivIcon(n, kindClass) {
    var count = n > 999 ? "999+" : String(n);
    return L.divIcon({
      className: "map-cluster-root",
      html:
        '<div class="map-cluster-bubble ' +
        kindClass +
        '"><span class="map-cluster-count">' +
        count +
        "</span></div>",
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    });
  }

  function getExpandedMapBounds() {
    if (!state.map) return null;
    try {
      var b = state.map.getBounds();
      if (!b || !b.isValid()) return null;
      var h = b.getNorth() - b.getSouth();
      var w = b.getEast() - b.getWest();
      var latPad = Math.max(h * 0.12, 0.015);
      var lngPad = Math.max(w * 0.12, 0.015);
      return L.latLngBounds(
        [b.getSouth() - latPad, b.getWest() - lngPad],
        [b.getNorth() + latPad, b.getEast() + lngPad]
      );
    } catch (e) {
      return null;
    }
  }

  function filterMapItemsByBounds(items, bounds) {
    if (!bounds || !items || !items.length) return items || [];
    var out = [];
    var i;
    var it;
    for (i = 0; i < items.length; i++) {
      it = items[i];
      if (
        typeof it.lat === "number" &&
        typeof it.lng === "number" &&
        !isNaN(it.lat) &&
        !isNaN(it.lng) &&
        bounds.contains(L.latLng(it.lat, it.lng))
      ) {
        out.push(it);
      }
    }
    return out;
  }

  /** True while a popup is open (avoids redraw on autoPan moveend killing the popup). */
  function mapPopupIsOpen() {
    if (!state.map) return false;
    var p = state.map._popup;
    return !!(p && typeof p.isOpen === "function" && p.isOpen());
  }

  function scheduleDrawMapFromCacheDebounced(ev) {
    if (!state.map) return;
    if (ev && ev.type === "moveend" && mapPopupIsOpen()) {
      return;
    }
    if (state.mapRedrawTimer) clearTimeout(state.mapRedrawTimer);
    state.mapRedrawTimer = setTimeout(function () {
      state.mapRedrawTimer = null;
      if (mapPopupIsOpen()) {
        return;
      }
      drawMapFromCache({ skipOrient: true });
    }, 120);
  }

  function bindMapZoomRecluster() {
    if (!state.map || state.mapZoomListenerBound) return;
    state.mapZoomListenerBound = true;
    state.map.on("zoomend", scheduleDrawMapFromCacheDebounced);
    state.map.on("moveend", scheduleDrawMapFromCacheDebounced);
  }

  function zoomMapToClusterExtent(items) {
    if (!state.map || !items || !items.length) return;
    var pts = [];
    items.forEach(function (it) {
      if (
        typeof it.lat === "number" &&
        typeof it.lng === "number" &&
        !isNaN(it.lat) &&
        !isNaN(it.lng)
      ) {
        pts.push([it.lat, it.lng]);
      }
    });
    if (!pts.length) return;
    var maxZ = state.map.getMaxZoom();
    if (pts.length === 1) {
      var z1 = Math.min(state.map.getZoom() + 2, maxZ);
      if (typeof state.map.flyTo === "function") {
        state.map.flyTo(pts[0], z1, { duration: 0.4 });
      } else {
        state.map.setView(pts[0], z1);
      }
      return;
    }
    var lats = pts.map(function (p) {
      return p[0];
    });
    var lngs = pts.map(function (p) {
      return p[1];
    });
    var swLat = Math.min.apply(null, lats);
    var neLat = Math.max.apply(null, lats);
    var swLng = Math.min.apply(null, lngs);
    var neLng = Math.max.apply(null, lngs);
    if (swLat === neLat && swLng === neLng) {
      var z2 = Math.min(state.map.getZoom() + 2, maxZ);
      if (typeof state.map.flyTo === "function") {
        state.map.flyTo([swLat, swLng], z2, { duration: 0.4 });
      } else {
        state.map.setView([swLat, swLng], z2);
      }
      return;
    }
    var bounds = L.latLngBounds([swLat, swLng], [neLat, neLng]);
    var fitOpts = { padding: [40, 40], maxZoom: Math.min(18, maxZ) };
    if (typeof state.map.flyToBounds === "function") {
      state.map.flyToBounds(bounds, {
        padding: fitOpts.padding,
        maxZoom: fitOpts.maxZoom,
        duration: 0.45,
      });
    } else {
      state.map.fitBounds(bounds, fitOpts);
    }
  }

  /**
   * Redraw user + city layers using cached items and current zoom threshold.
   * @param {{ skipOrient?: boolean }} opts
   */
  function drawMapFromCache(opts) {
    opts = opts || {};
    if (!state.map || !state.userLayer || !state.otherLayer) return;
    bindMapZoomRecluster();
    var zoom = state.map.getZoom();
    var t = mapClusterThresholdDeg(zoom);
    var userFull = state.mapCachedUserItems || [];
    var otherFull = state.mapCachedOtherItems || [];
    var userItems = userFull;
    var otherItems = otherFull;
    if (opts.skipOrient) {
      var extBounds = getExpandedMapBounds();
      userItems = filterMapItemsByBounds(userFull, extBounds);
      otherItems = filterMapItemsByBounds(otherFull, extBounds);
    }

    state.userLayer.clearLayers();
    state.otherLayer.clearLayers();

    var userBoundsPts = [];
    var uClusters = clusterPoints(userItems, t);
    uClusters.forEach(function (c) {
      userBoundsPts.push([c.lat, c.lng]);
      var n = c.items.length;
      var isMulti = n > 1;
      var allCompleted =
        n > 0 &&
        c.items.every(function (it) {
          return it.status === "completed";
        });
      var stroke;
      var fill;
      if (allCompleted) {
        stroke = "#2d6b44";
        fill = isMulti ? "#3d8f5a" : "#5cb87a";
      } else {
        stroke = "#b8860b";
        fill = isMulti ? "#daa520" : "#f4d03f";
      }
      if (isMulti) {
        var m = L.marker([c.lat, c.lng], {
          icon: mapClusterCountDivIcon(n, mapUserClusterKind(c.items)),
        });
        m.on("click", function (ev) {
          L.DomEvent.stopPropagation(ev);
          zoomMapToClusterExtent(c.items);
        });
        m.addTo(state.userLayer);
      } else {
        var it = c.items[0];
        var popupHtml =
          "<span class=\"map-popup-id map-popup-id-block\">ID: " +
          escapeForPopup(it.id != null && it.id !== "" ? String(it.id) : "—") +
          "</span><br/><strong>" +
          categoryLabel(it.category) +
          "</strong> · " +
          concernStatusLabel(it).toLowerCase() +
          "<br/>" +
          (it.location || "") +
          "<br/><span style='color:#8fa3bf'>" +
          formatTime(it.timestamp) +
          "</span>";
        var marker = L.circleMarker([c.lat, c.lng], {
          radius: 11,
          color: stroke,
          fillColor: fill,
          fillOpacity: 0.9,
          weight: 2.5,
        });
        marker.bindPopup(popupHtml, { autoPanPadding: [20, 20] });
        marker.addTo(state.userLayer);
      }
    });

    var otherPts = [];
    var oClusters = clusterPoints(otherItems, t);
    oClusters.forEach(function (c) {
      otherPts.push([c.lat, c.lng]);
      var n = c.items.length;
      var isMulti = n > 1;
      var allDone =
        n > 0 &&
        c.items.every(function (it) {
          return it.completed;
        });
      var ost;
      var ofill;
      if (allDone) {
        ost = "#1565c0";
        ofill = isMulti ? "#1976d2" : "#1e88e5";
      } else {
        ost = "#b71c1c";
        ofill = isMulti ? "#c62828" : "#e53935";
      }
      if (isMulti) {
        var om = L.marker([c.lat, c.lng], {
          icon: mapClusterCountDivIcon(n, mapCityClusterKind(c.items)),
        });
        om.on("click", function (ev) {
          L.DomEvent.stopPropagation(ev);
          zoomMapToClusterExtent(c.items);
        });
        om.addTo(state.otherLayer);
      } else {
        var oi = c.items[0];
        var phtml =
          "<span class=\"map-popup-id map-popup-id-block\">311 ID: " +
          escapeForPopup(
            oi.requestId != null && oi.requestId !== ""
              ? String(oi.requestId)
              : "—"
          ) +
          "</span><br/><strong>Philly 311 (open data)</strong><br/>" +
          escapeForPopup(oi.category) +
          " · " +
          escapeForPopup(oi.statusLabel || (oi.completed ? "Closed" : "Open")) +
          "<br/>" +
          escapeForPopup(oi.location || "") +
          "<br/><span style='color:#8fa3bf'>" +
          formatTime(oi.ts) +
          "</span>";
        var omarker = L.circleMarker([c.lat, c.lng], {
          radius: 9,
          color: ost,
          fillColor: ofill,
          fillOpacity: 0.9,
          weight: 2,
        });
        omarker.bindPopup(phtml, { autoPanPadding: [20, 20] });
        omarker.addTo(state.otherLayer);
      }
    });

    if (!opts.skipOrient) {
      var combined = userBoundsPts.concat(otherPts);
      orientMapToUserOrFitLocal(
        combined.length ? combined : userBoundsPts
      );
    }
  }

  /** Reports older than this are hidden on the map (~30 days). */
  var MAP_LOOKBACK_MS = 30 * 24 * 60 * 60 * 1000;

  /** City 311 open data (OpenDataPhilly / CARTO SQL API). */
  var PHILLY_311_CARTO_SQL = "https://phl.carto.com/api/v2/sql";
  var PHILLY_311_MAP_ROW_LIMIT = 5000;

  function escapeForPopup(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

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
      zoomControl: false,
      attributionControl: true,
      preferCanvas: true,
      minZoom: 3,
      maxZoom: 19,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap",
    }).addTo(state.map);
    addPhillyMapBackdrop();
    state.otherLayer = L.layerGroup().addTo(state.map);
    state.userLayer = L.layerGroup().addTo(state.map);
    state.map.setView([39.9526, -75.1652], 12);
  }

  function fitMapBoundsLocal(userPts) {
    var all = userPts.slice();
    if (!all.length) {
      state.map.setView([39.9526, -75.1652], 12);
      return;
    }
    if (all.length === 1) {
      state.map.setView([all[0][0], all[0][1]], 14);
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
        var center = [la, lo];
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

  function goMapToMyLocation() {
    initMapIfNeeded();
    if (!state.map) return;
    if (!state.settings.locationEnabled) {
      showToast(tr("toast.loc_settings"));
      return;
    }
    if (!navigator.geolocation) {
      showToast(tr("toast.loc_unavail"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        var la = pos.coords.latitude;
        var lo = pos.coords.longitude;
        if (la == null || lo == null || isNaN(la) || isNaN(lo)) {
          showToast(tr("toast.loc_read"));
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
        var z = Math.max(state.map.getZoom(), 15);
        if (typeof state.map.flyTo === "function") {
          state.map.flyTo([la, lo], z, { duration: 0.5 });
        } else {
          state.map.setView([la, lo], z);
        }
      },
      function () {
        showToast(tr("toast.loc_perm"));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }

  function buildMapCategoryFilterOptions() {
    var root = $("map-filter-category-root");
    if (!root) return;
    var keep = state.mapCategorySlug || "";
    var items = [{ value: "", label: tr("map.all_types") }];
    flickCategoriesList().forEach(function (c) {
      items.push({ value: c.value, label: categoryLabel(c.value) });
    });
    flickSelectPopulate(root, items, keep);
    var hidden = $("map-filter-category");
    if (hidden) state.mapCategorySlug = hidden.value || "";
  }

  function userReportMatchesMapCategory(r, slug) {
    if (!slug) return true;
    var u = resolveCategoryFromAi(r.category || "other");
    var want = normalizeCategorySlug(slug);
    return normalizeCategorySlug(u) === want || u === slug;
  }

  function cityRowMatchesMapCategory(row, slug) {
    if (!slug) return true;
    var label = categoryEnglishLabel(slug).toLowerCase();
    var hay = (
      String(row.service_name || "") +
      " " +
      String(row.subject || "")
    ).toLowerCase();
    if (label && hay.indexOf(label) >= 0) return true;
    var spaced = String(slug).replace(/_/g, " ").toLowerCase();
    if (spaced && hay.indexOf(spaced) >= 0) return true;
    return false;
  }

  /** Philly 311 “information request” cases — hide from map (noise vs actionable issues). */
  function cityRowIsInformationRequest311(row) {
    if (!row) return false;
    var hay = (
      String(row.service_name || "") +
      " " +
      String(row.subject || "")
    ).toLowerCase();
    return hay.indexOf("information request") >= 0;
  }

  function updateMapSectionUi(yoursCount, cityCount) {
    var loc = numberLocaleForUi();
    var titleEl = $("map-section-title");
    if (titleEl) {
      titleEl.textContent = state.mapShowCity311
        ? tr("home.map_title_all")
        : tr("home.map_title_mine");
    }
    var countEl = $("map-dot-count");
    if (countEl) {
      var y = typeof yoursCount === "number" ? yoursCount : 0;
      var c = typeof cityCount === "number" ? cityCount : 0;
      var total = y + c;
      if (!state.mapShowCity311) {
        countEl.textContent =
          y === 0
            ? tr("map.count_none_yours")
            : tr("map.count_yours", {
                n: y.toLocaleString(loc),
                s: y === 1 ? "" : "s",
              });
      } else if (total === 0) {
        countEl.textContent = tr("map.count_none");
      } else {
        countEl.textContent = tr("map.count_mix", {
          t: total.toLocaleString(loc),
          y: y.toLocaleString(loc),
          c: c.toLocaleString(loc),
        });
      }
    }
    var btnMine = $("map-view-mine");
    var btnAll = $("map-view-all");
    if (btnMine) btnMine.textContent = tr("map.mine");
    if (btnAll) btnAll.textContent = tr("map.everyone");
    if (btnMine && btnAll) {
      btnMine.classList.toggle("map-toggle-btn-active", !state.mapShowCity311);
      btnAll.classList.toggle("map-toggle-btn-active", state.mapShowCity311);
    }
  }

  function refreshMap() {
    initMapIfNeeded();
    if (!state.map) return;
    if (!state.otherLayer) {
      state.otherLayer = L.layerGroup().addTo(state.map);
    }
    var cutoff = Date.now() - MAP_LOOKBACK_MS;
    var catSlug = state.mapCategorySlug || "";
    var requests = loadRequests();
    var withCoords = requests.filter(function (r) {
      return (
        concernIsSubmitted(r) &&
        typeof r.lat === "number" &&
        typeof r.lng === "number" &&
        !isNaN(r.lat) &&
        !isNaN(r.lng) &&
        (r.timestamp || 0) >= cutoff
      );
    }).filter(function (r) {
      return userReportMatchesMapCategory(r, catSlug);
    });

    state.mapCachedUserItems = withCoords;

    if (!state.mapShowCity311) {
      state.mapCachedOtherItems = [];
      drawMapFromCache({});
      updateMapSectionUi(withCoords.length, 0);
      return;
    }

    state.mapCachedOtherItems = [];
    drawMapFromCache({ skipOrient: true });

    var sql =
      "SELECT service_request_id, service_name, subject, status, address, requested_datetime, lat, lon " +
      "FROM public_cases_fc " +
      "WHERE requested_datetime >= NOW() - INTERVAL '30 days' " +
      "AND lat IS NOT NULL AND lon IS NOT NULL " +
      "AND NOT (LOWER(COALESCE(service_name::text, '')) LIKE '%information request%' " +
      "OR LOWER(COALESCE(subject::text, '')) LIKE '%information request%') " +
      "ORDER BY requested_datetime DESC " +
      "LIMIT " +
      PHILLY_311_MAP_ROW_LIMIT;

    var cartoUrl =
      PHILLY_311_CARTO_SQL + "?q=" + encodeURIComponent(sql) + "&format=json";

    fetch(cartoUrl, { method: "GET", cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("bad");
        return res.json();
      })
      .then(function (data) {
        var rows = (data && data.rows) || [];
        var otherItems = [];
        rows.forEach(function (row) {
          if (!row) return;
          if (cityRowIsInformationRequest311(row)) return;
          var lat = Number(row.lat);
          var lon = Number(row.lon);
          if (isNaN(lat) || isNaN(lon)) return;
          var ts = row.requested_datetime
            ? new Date(row.requested_datetime).getTime()
            : 0;
          if (ts < cutoff) return;
          if (!cityRowMatchesMapCategory(row, catSlug)) return;
          var st = (row.status && String(row.status)) || "";
          var completed = st.toLowerCase() === "closed";
          var cat = row.service_name || row.subject || "311 request";
          otherItems.push({
            lat: lat,
            lng: lon,
            category: cat,
            location: row.address || "",
            ts: ts,
            completed: completed,
            statusLabel: st,
            requestId:
              row.service_request_id != null && row.service_request_id !== ""
                ? String(row.service_request_id)
                : "",
          });
        });
        state.mapCachedOtherItems = otherItems;
        drawMapFromCache({});
        updateMapSectionUi(withCoords.length, otherItems.length);
      })
      .catch(function () {
        state.mapCachedOtherItems = [];
        drawMapFromCache({});
        updateMapSectionUi(withCoords.length, 0);
      });
  }

  var MAIN_NAV_ORDER = ["home", "camera", "settings"];

  var SCREEN_SLIDE_MS = 450;
  var screenAnimToken = 0;
  var SCREEN_PANEL_IDS = ["screen-home", "screen-camera", "screen-settings"];

  function clearScreenTransitionStyles() {
    SCREEN_PANEL_IDS.forEach(function (id) {
      var el = $(id);
      if (!el) return;
      el.classList.remove(
        "screen-exit-left",
        "screen-exit-right",
        "screen-enter-from-left",
        "screen-enter-from-right"
      );
      el.style.zIndex = "";
      el.style.pointerEvents = "";
    });
  }

  function setScreenVisibility(name) {
    $("screen-home").hidden = name !== "home";
    $("screen-camera").hidden = name !== "camera";
    $("screen-settings").hidden = name !== "settings";
  }

  function updateNavActive(name) {
    document.querySelectorAll(".nav-item").forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-nav") === name);
    });
  }

  function runScreenSideEffects(name) {
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
        sync311DemoFromServer();
      }, 280);
    }
    if (name === "settings") {
      syncLanguageSettingFlickSelect();
    }
  }

  function showScreen(name, animDir) {
    animDir = animDir || 0;
    var mapEl = {
      home: $("screen-home"),
      camera: $("screen-camera"),
      settings: $("screen-settings"),
    };
    var prevName = state.currentScreen;
    var prevEl = mapEl[prevName];
    var nextEl = mapEl[name];
    if (!nextEl) return;

    if (name === prevName) {
      clearScreenTransitionStyles();
      setScreenVisibility(name);
      updateNavActive(name);
      runScreenSideEffects(name);
      return;
    }

    var reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced || animDir === 0 || !prevEl) {
      clearScreenTransitionStyles();
      state.currentScreen = name;
      setScreenVisibility(name);
      updateNavActive(name);
      runScreenSideEffects(name);
      return;
    }

    screenAnimToken++;
    var token = screenAnimToken;
    var done = false;

    clearScreenTransitionStyles();

    MAIN_NAV_ORDER.forEach(function (key) {
      if (key !== prevName && key !== name) {
        mapEl[key].hidden = true;
      }
    });
    prevEl.hidden = false;
    nextEl.hidden = false;
    prevEl.style.zIndex = "1";
    nextEl.style.zIndex = "2";

    if (animDir > 0) {
      prevEl.classList.add("screen-exit-left");
      nextEl.classList.add("screen-enter-from-right");
    } else {
      prevEl.classList.add("screen-exit-right");
      nextEl.classList.add("screen-enter-from-left");
    }

    state.currentScreen = name;
    updateNavActive(name);

    if (name === "camera") {
      startCamera();
    }

    function finishAnim() {
      if (token !== screenAnimToken || done) return;
      done = true;
      nextEl.removeEventListener("animationend", onAnimEnd);
      clearTimeout(fallbackTimer);
      clearScreenTransitionStyles();
      setScreenVisibility(name);
      if (name !== "camera") {
        stopCamera();
      }
      if (name === "home") {
        postNative({ type: "REQUEST_NATIVE_LOCATION" });
        renderHomeList();
        setTimeout(function () {
          refreshMap();
          if (state.map) state.map.invalidateSize();
        }, 280);
      }
    }

    function onAnimEnd(ev) {
      if (token !== screenAnimToken || done) return;
      if (ev && ev.target !== nextEl) return;
      finishAnim();
    }

    var fallbackTimer = setTimeout(finishAnim, SCREEN_SLIDE_MS + 90);
    nextEl.addEventListener("animationend", onAnimEnd);
  }

  function onNavigate(name) {
    if (name === state.currentScreen) return;
    var from = mainNavScreenIndex(state.currentScreen);
    var to = mainNavScreenIndex(name);
    var dir = to > from ? 1 : to < from ? -1 : 0;
    showScreen(name, dir);
  }

  function anyMainModalOpen() {
    return (
      !$("modal-confirm").hidden ||
      !$("modal-report").hidden ||
      !$("modal-detail").hidden ||
      !$("modal-app-confirm").hidden
    );
  }

  var appConfirmOnConfirm = null;

  function closeAppConfirm() {
    appConfirmOnConfirm = null;
    $("modal-app-confirm").hidden = true;
  }

  function showAppConfirm(opts) {
    opts = opts || {};
    $("app-confirm-title").textContent = opts.title || tr("confirm.default");
    $("app-confirm-message").textContent = opts.message || "";
    var okBtn = $("btn-app-confirm-ok");
    okBtn.textContent = opts.confirmLabel || tr("app.ok");
    okBtn.classList.remove("primary", "danger");
    if (opts.danger) {
      okBtn.classList.add("danger");
    } else {
      okBtn.classList.add("primary");
    }
    appConfirmOnConfirm =
      typeof opts.onConfirm === "function" ? opts.onConfirm : null;
    $("modal-app-confirm").hidden = false;
  }

  function mainNavScreenIndex(name) {
    var i = MAIN_NAV_ORDER.indexOf(name);
    return i >= 0 ? i : 1;
  }

  function attachMainSwipeNav() {
    var mainEl = document.querySelector(".main");
    if (!mainEl || mainEl.dataset.flickSwipeNav === "1") return;
    mainEl.dataset.flickSwipeNav = "1";

    var sx = 0;
    var sy = 0;
    var st = 0;
    var ignore = false;

    function swipeTargetDisallowed(el) {
      if (!el || typeof el.closest !== "function") return false;
      if (el.closest("#map")) return true;
      return false;
    }

    mainEl.addEventListener(
      "touchstart",
      function (e) {
        if (anyMainModalOpen()) {
          ignore = true;
          return;
        }
        if (!e.touches) return;
        if (e.touches.length > 1) {
          ignore = true;
          return;
        }
        if (e.touches.length !== 1) return;
        if (swipeTargetDisallowed(e.target)) {
          ignore = true;
          return;
        }
        ignore = false;
        sx = e.touches[0].clientX;
        sy = e.touches[0].clientY;
        st = Date.now();
      },
      { passive: true, capture: true }
    );

    mainEl.addEventListener(
      "touchcancel",
      function () {
        ignore = false;
      },
      { passive: true, capture: true }
    );

    mainEl.addEventListener(
      "touchend",
      function (e) {
        var stillDown = e.touches ? e.touches.length : 0;
        if (ignore) {
          if (stillDown === 0) ignore = false;
          return;
        }
        if (stillDown > 0) return;
        if (anyMainModalOpen()) return;
        var ch = e.changedTouches && e.changedTouches[0];
        if (!ch) return;
        var dx = ch.clientX - sx;
        var dy = ch.clientY - sy;
        if (Date.now() - st > 750) return;
        if (Math.abs(dx) < 56) return;
        if (Math.abs(dx) < Math.abs(dy) * 1.25) return;
        var idx = mainNavScreenIndex(state.currentScreen);
        if (dx < 0 && idx < MAIN_NAV_ORDER.length - 1) {
          onNavigate(MAIN_NAV_ORDER[idx + 1]);
        } else if (dx > 0 && idx > 0) {
          onNavigate(MAIN_NAV_ORDER[idx - 1]);
        }
      },
      { passive: true, capture: true }
    );
  }

  attachMainSwipeNav();

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
      showToast(tr("toast.camera_not_ready"));
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
      showToast(tr("toast.slots_full"));
      e.target.value = "";
      return;
    }
    var toRead = Math.min(files.length, remaining);
    if (toRead < files.length) {
      showToast(tr("toast.slots_partial", { n: String(remaining) }));
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
    if (state.aiMediaLocked) return;
    var imgs = state.slots.filter(Boolean);
    var voice = state.voiceNote;
    if (!imgs.length && !voice) {
      showToast(tr("toast.need_media"));
      return;
    }
    setAiMediaLocked(true);
    showToast(tr("toast.analyzing"), { persistent: true, loading: true });
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
        })
        .finally(function () {
          setAiMediaLocked(false);
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

  $("btn-app-confirm-cancel").addEventListener("click", closeAppConfirm);
  document
    .querySelector('[data-close="app-confirm"]')
    .addEventListener("click", closeAppConfirm);
  $("btn-app-confirm-ok").addEventListener("click", function () {
    var fn = appConfirmOnConfirm;
    closeAppConfirm();
    if (fn) fn();
  });

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

  var setUiLang = $("set-ui-language");
  if (setUiLang) {
    setUiLang.addEventListener("change", function () {
      var v = normalizeUiLanguage(setUiLang.value);
      state.settings.uiLanguage = v;
      saveSettings(state.settings);
      applyUiLanguage();
    });
  }

  $("btn-open-app-settings").addEventListener("click", function () {
    postNative({ type: "OPEN_APP_SETTINGS" });
    showToast(tr("toast.app_settings"));
  });

  $("btn-clear-data").addEventListener("click", function () {
    showAppConfirm({
      title: tr("confirm.clear_title"),
      message: tr("confirm.clear_message"),
      confirmLabel: tr("confirm.delete_all"),
      danger: true,
      onConfirm: function () {
        localStorage.removeItem(STORAGE_REQUESTS);
        localStorage.removeItem(STORAGE_SETTINGS);
        stop311DemoPoll();
        state.settings = {
          darkMode: true,
          locationEnabled: true,
          cameraEnabled: true,
          microphoneEnabled: true,
          uiLanguage: "en",
        };
        saveSettings(state.settings);
        syncSettingsUI();
        applyTheme();
        applyUiLanguage();
        state.slots = [null, null, null, null, null];
        state.voiceNote = null;
        state.voiceRecording = false;
        stopBrowserVoiceRecording();
        setAiMediaLocked(false);
        renderHomeList();
        if (state.map) refreshMap();
        showToast(tr("toast.data_cleared"));
      },
    });
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
      showToast(tr("toast.mic_settings"));
      return;
    }
    if (useNativeVoiceBridge()) {
      postNative({ type: "VOICE_RECORD_TOGGLE" });
    } else {
      startBrowserVoiceRecording();
    }
  });

  $("btn-voice-clear").addEventListener("click", function () {
    if (state.aiMediaLocked) return;
    state.voiceNote = null;
    updateVoiceUi();
  });

  ensureVoicePlaybackSpeakerHook();

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") sync311DemoFromServer();
  });

  applyTheme();
  syncSettingsUI();
  applyUiLanguage();
  var mapViewMine = $("map-view-mine");
  var mapViewAll = $("map-view-all");
  var mapFilterCat = $("map-filter-category");
  if (mapViewMine) {
    mapViewMine.addEventListener("click", function () {
      state.mapShowCity311 = false;
      refreshMap();
    });
  }
  if (mapViewAll) {
    mapViewAll.addEventListener("click", function () {
      state.mapShowCity311 = true;
      refreshMap();
    });
  }
  if (mapFilterCat) {
    mapFilterCat.addEventListener("change", function () {
      state.mapCategorySlug = mapFilterCat.value || "";
      refreshMap();
    });
  }
  var mapLocateMe = $("map-locate-me");
  if (mapLocateMe) {
    mapLocateMe.addEventListener("click", function () {
      goMapToMyLocation();
    });
  }
  start311DemoPoll();
  sync311DemoFromServer();
  renderSlots();
  updateVoiceUi();
  renderHomeList();
  requestLocation();
  showScreen("camera", 0);
})();
