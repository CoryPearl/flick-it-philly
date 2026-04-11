import { useEffect, useMemo, useRef } from "react";
import { Linking, Platform, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import Constants from "expo-constants";
import { Audio } from "expo-av";
import { Camera } from "expo-camera";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { WebView } from "react-native-webview";

import webBundle from "./webBundle.js";

const INJECT_RETRY_CAMERA = `try{if(window.__FLICK_RETRY_CAMERA)window.__FLICK_RETRY_CAMERA();}catch(e){}true;`;

let activeVoiceRecording = null;
let voiceMaxTimer = null;

function injectVoiceRecordingState(webRef, active) {
  webRef.current?.injectJavaScript(
    `try{if(window.__FLICK_VOICE_RECORDING)window.__FLICK_VOICE_RECORDING(${active ? "true" : "false"});}catch(e){}true;`
  );
}

async function finishNativeVoiceRecording(webRef) {
  if (voiceMaxTimer) {
    clearTimeout(voiceMaxTimer);
    voiceMaxTimer = null;
  }
  const rec = activeVoiceRecording;
  activeVoiceRecording = null;
  injectVoiceRecordingState(webRef, false);
  if (!rec) {
    injectToast(webRef, "No recording in progress.");
    return;
  }
  try {
    await rec.stopAndUnloadAsync();
    const uri = rec.getURI();
    if (!uri) {
      injectToast(webRef, "No audio file was produced.");
      return;
    }
    const b64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    try {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch {
      /* best-effort temp cleanup */
    }
    const payload = JSON.stringify({
      mimeType: "audio/mp4",
      data: b64,
    });
    webRef.current?.injectJavaScript(
      `try{if(window.__FLICK_SET_VOICE_NOTE)window.__FLICK_SET_VOICE_NOTE(JSON.parse(${JSON.stringify(
        payload
      )}));}catch(e){}true;`
    );
    injectToast(webRef, "Voice note attached.");
  } catch (e) {
    injectToast(
      webRef,
      String(e?.message || e || "Could not save recording").slice(0, 120)
    );
  }
}

async function toggleNativeVoiceRecording(webRef) {
  if (activeVoiceRecording) {
    await finishNativeVoiceRecording(webRef);
    return;
  }
  const perm = await Audio.requestPermissionsAsync();
  if (!perm.granted) {
    injectToast(
      webRef,
      "Microphone access is needed for voice notes. Allow it in Settings."
    );
    return;
  }
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });
    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.LOW_QUALITY
    );
    activeVoiceRecording = recording;
    injectVoiceRecordingState(webRef, true);
    injectToast(webRef, "Recording… tap Voice again to stop.");
    voiceMaxTimer = setTimeout(() => {
      voiceMaxTimer = null;
      injectToast(webRef, "Recording stopped: 90 second limit.");
      void finishNativeVoiceRecording(webRef);
    }, 90000);
  } catch (e) {
    activeVoiceRecording = null;
    injectVoiceRecordingState(webRef, false);
    injectToast(
      webRef,
      String(e?.message || e || "Recording failed").slice(0, 120)
    );
  }
}

function injectNativeLocation(webRef, loc) {
  const payload = JSON.stringify(loc);
  webRef.current?.injectJavaScript(
    `try{window.__FLICK_NATIVE_LOCATION__=JSON.parse(${JSON.stringify(
      payload
    )});if(typeof window.__FLICK_APPLY_NATIVE_LOCATION==='function')window.__FLICK_APPLY_NATIVE_LOCATION();}catch(e){}true;`
  );
}

async function refreshNativeLocationAndInject(webRef) {
  if (!webRef?.current) return;
  const perm = await Location.getForegroundPermissionsAsync();
  if (perm.status !== "granted") {
    return;
  }
  try {
    let pos;
    try {
      pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
        ...(Platform.OS === "android"
          ? { mayShowUserSettingsDialog: true }
          : {}),
      });
    } catch {
      pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        ...(Platform.OS === "android"
          ? { mayShowUserSettingsDialog: true }
          : {}),
      });
    }
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    let label = "";
    try {
      const places = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });
      const a = places?.[0];
      if (a) {
        if (a.formattedAddress) {
          label = a.formattedAddress;
        } else {
          const parts = [
            a.streetNumber,
            a.street,
            a.district || a.subregion,
            a.city,
            a.region,
          ].filter((x) => x != null && String(x).trim() !== "");
          label = parts.join(", ");
        }
      }
    } catch {
      /* keep coords only */
    }
    injectNativeLocation(webRef, {
      lat,
      lng,
      label,
      accuracy: pos.coords.accuracy ?? null,
    });
  } catch {
    /* leave prior __FLICK_NATIVE_LOCATION__ if any */
  }
}

/** Android WebView often drops or corrupts one huge postMessage; reassemble from parts. */
const androidGeminiAssembly = new Map();

function parseGeminiJsonText(text) {
  let t = (text || "").trim();
  if (!t) throw new Error("Empty model output");
  if (t.startsWith("```")) {
    t = t
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();
  }
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start >= 0 && end > start) t = t.slice(start, end + 1);
  return JSON.parse(t);
}

function extractGeminiCandidateText(data) {
  const cand = data?.candidates?.[0];
  const parts = cand?.content?.parts;
  if (!parts?.length) return "";
  return parts.map((p) => p.text || "").join("");
}

function normalizeGeminiAi(parsed) {
  const ws = parsed.worth_submitting;
  const worth = ws === false ? false : true;
  return {
    category: parsed.category || "other",
    description: parsed.description || "",
    location: parsed.location || "",
    fields:
      parsed.fields && typeof parsed.fields === "object" ? parsed.fields : {},
    worthSubmitting: worth,
    submissionAdvice:
      typeof parsed.submission_advice === "string" ? parsed.submission_advice : "",
  };
}

function defaultGeminiModels(csv) {
  if (csv && String(csv).trim()) {
    return String(csv)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [
    "gemini-2.5-flash",
    "gemini-flash-latest",
    "gemini-2.0-flash",
    "gemini-2.0-flash-001",
    "gemini-2.0-flash-lite",
    "gemini-3-flash-preview",
  ];
}

async function geminiRequestOne(modelId, apiKey, prompt, imageParts, jsonMode) {
  const parts = [
    { text: prompt },
    ...imageParts.map((im) => ({
      inlineData: {
        mimeType: im.mimeType || "image/jpeg",
        data: im.data,
      },
    })),
  ];
  const gen = { temperature: 0.35, maxOutputTokens: 2048 };
  if (jsonMode) gen.responseMimeType = "application/json";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: gen,
    }),
  });
  const raw = await res.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    const err = new Error(
      res.ok ? "Invalid JSON from API" : `HTTP ${res.status}: ${raw.slice(0, 160)}`
    );
    err.status = res.status;
    throw err;
  }
  if (!res.ok) {
    const err = new Error(
      String(data?.error?.message || data?.error?.status || raw.slice(0, 220))
    );
    err.status = res.status;
    throw err;
  }
  return data;
}

async function executeGeminiWithRetries(models, apiKey, prompt, imageParts) {
  async function doCall(idx, jsonMode) {
    if (idx >= models.length) {
      throw new Error("All Gemini models failed. Check API key in Google AI Studio.");
    }
    try {
      const data = await geminiRequestOne(
        models[idx],
        apiKey,
        prompt,
        imageParts,
        jsonMode
      );
      if (data.error) {
        const er = new Error(data.error.message || "API error");
        er.status = 400;
        throw er;
      }
      if (data.promptFeedback?.blockReason) {
        throw new Error(`Blocked: ${data.promptFeedback.blockReason}`);
      }
      if (!data.candidates?.length) throw new Error("No response from model");
      const text = extractGeminiCandidateText(data);
      if (!text) throw new Error("Empty model output");
      return normalizeGeminiAi(parseGeminiJsonText(text));
    } catch (err) {
      const msg = String(err?.message || err);
      const st = err?.status;
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
      if ((st === 429 || st === 503) && idx + 1 < models.length) {
        await new Promise((r) => setTimeout(r, st === 429 ? 2000 : 500));
        return doCall(idx + 1, true);
      }
      throw err;
    }
  }
  return doCall(0, true);
}

function injectGeminiNativeResult(webRef, envelope) {
  const raw = JSON.stringify(envelope);
  webRef.current?.injectJavaScript(
    `try{window.__FLICK_GEMINI_NATIVE_RESULT(${JSON.stringify(raw)});}catch(e){}true;`
  );
}

function scheduleAndroidGeminiCleanup(requestId) {
  setTimeout(() => {
    androidGeminiAssembly.delete(requestId);
  }, 125000);
}

function handleAndroidGeminiMessage(webRef, msg) {
  if (msg.type === "GEMINI_GENERATE_META") {
    androidGeminiAssembly.set(msg.requestId, {
      prompt: msg.prompt,
      images: new Array(Math.max(0, msg.imageCount | 0)),
      expected: Math.max(0, msg.imageCount | 0),
      expectAudio: !!msg.expectAudio,
      audio: null,
    });
    scheduleAndroidGeminiCleanup(msg.requestId);
    return true;
  }
  if (msg.type === "GEMINI_GENERATE_IMAGE") {
    const a = androidGeminiAssembly.get(msg.requestId);
    if (!a || typeof msg.index !== "number") return true;
    a.images[msg.index] = {
      mimeType: msg.mimeType || "image/jpeg",
      data: msg.data,
    };
    return true;
  }
  if (msg.type === "GEMINI_GENERATE_AUDIO") {
    const a = androidGeminiAssembly.get(msg.requestId);
    if (!a) return true;
    a.audio = {
      mimeType: msg.mimeType || "audio/mp4",
      data: msg.data,
    };
    return true;
  }
  if (msg.type === "GEMINI_GENERATE_RUN") {
    const a = androidGeminiAssembly.get(msg.requestId);
    androidGeminiAssembly.delete(msg.requestId);
    if (!a) {
      injectGeminiNativeResult(webRef, {
        requestId: msg.requestId,
        ok: false,
        error:
          "Could not read images from the WebView bridge. Try fewer photos or take new pictures.",
      });
      return true;
    }
    const needImages = a.expected > 0;
    const needAudio = !!a.expectAudio;
    let incomplete = !needImages && !needAudio;
    if (needImages) {
      for (let i = 0; i < a.expected; i++) {
        if (!a.images[i] || !a.images[i].data) {
          incomplete = true;
          break;
        }
      }
    }
    if (needAudio && (!a.audio || !a.audio.data)) {
      incomplete = true;
    }
    if (incomplete) {
      injectGeminiNativeResult(webRef, {
        requestId: msg.requestId,
        ok: false,
        error:
          "Some media did not transfer. Try fewer photos, a shorter voice note, or try again.",
      });
      return true;
    }
    void runGeminiGenerate(webRef, {
      requestId: msg.requestId,
      prompt: a.prompt,
      images: a.images,
      audio: a.audio,
    });
    return true;
  }
  return false;
}

async function runGeminiGenerate(webRef, msg) {
  const apiKey = (Constants.expoConfig?.extra?.geminiApiKey ?? "").trim();
  const modelsCsv = Constants.expoConfig?.extra?.geminiModels ?? "";
  const requestId = msg.requestId;
  if (!requestId) return;
  if (!apiKey) {
    injectGeminiNativeResult(webRef, {
      requestId,
      ok: false,
      error:
        "No API key. Set GEMINI_API_KEY in .env and restart Expo (npx expo start -c).",
    });
    return;
  }
  try {
    const models = defaultGeminiModels(modelsCsv);
    const media = [...(msg.images || [])];
    if (msg.audio?.data) {
      media.push({
        mimeType: msg.audio.mimeType || "audio/mp4",
        data: msg.audio.data,
      });
    }
    const ai = await executeGeminiWithRetries(
      models,
      apiKey,
      msg.prompt,
      media
    );
    injectGeminiNativeResult(webRef, { requestId, ok: true, ai });
  } catch (e) {
    injectGeminiNativeResult(webRef, {
      requestId,
      ok: false,
      error: String(e?.message || e).slice(0, 450),
    });
  }
}

function injectToast(webRef, message) {
  const safe = JSON.stringify(message);
  webRef.current?.injectJavaScript(
    `try{if(window.__FLICK_TOAST)window.__FLICK_TOAST(${safe});}catch(e){}true;`
  );
}

async function pickImagesFromLibrary(webRef) {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    injectToast(
      webRef,
      "Photo library access is needed to upload. You can allow it in Settings."
    );
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: true,
    selectionLimit: 5,
    quality: 0.85,
    base64: true,
  });

  if (result.canceled || !result.assets?.length) {
    return;
  }

  const urls = [];
  for (const asset of result.assets) {
    const mime = asset.mimeType || "image/jpeg";
    if (asset.base64) {
      urls.push(`data:${mime};base64,${asset.base64}`);
    }
  }

  if (!urls.length) {
    injectToast(webRef, "Could not read the selected photos. Try again.");
    return;
  }

  const json = JSON.stringify(urls);
  webRef.current?.injectJavaScript(
    `try{var u=JSON.parse(${JSON.stringify(
      json
    )});if(window.__FLICK_ADD_IMAGES_FROM_NATIVE)window.__FLICK_ADD_IMAGES_FROM_NATIVE(u);}catch(e){}true;`
  );
}

async function launchNativeCamera(webRef) {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== "granted") {
    injectToast(
      webRef,
      "Camera permission is needed. Allow it in the dialog or app Settings."
    );
    return;
  }
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images"],
    quality: 0.85,
    base64: true,
  });
  if (result.canceled || !result.assets?.length) {
    return;
  }
  const a = result.assets[0];
  const mime = a.mimeType || "image/jpeg";
  if (!a.base64) {
    injectToast(
      webRef,
      "Could not read the photo. Try again or use Gallery."
    );
    return;
  }
  const dataUrl = `data:${mime};base64,${a.base64}`;
  webRef.current?.injectJavaScript(
    `try{if(window.__FLICK_OPEN_CAPTURE_CONFIRM)window.__FLICK_OPEN_CAPTURE_CONFIRM(${JSON.stringify(
      dataUrl
    )});}catch(e){}true;`
  );
}

export default function App() {
  const apiKey = Constants.expoConfig?.extra?.geminiApiKey ?? "";
  const geminiModels = Constants.expoConfig?.extra?.geminiModels ?? "";
  const webRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await Location.requestForegroundPermissionsAsync().catch(() => {});
      await Camera.requestCameraPermissionsAsync().catch(() => {});
      if (cancelled) return;
      webRef.current?.injectJavaScript(INJECT_RETRY_CAMERA);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const injectedJavaScriptBeforeContentLoaded = useMemo(
    () =>
      `(function(){window.__GEMINI_API_KEY__=${JSON.stringify(apiKey)};window.__GEMINI_MODELS__=${JSON.stringify(geminiModels)};window.__FLICK_USE_NATIVE_CAPTURE__=${Platform.OS === "android" ? "true" : "false"};window.__FLICK_GEMINI_USE_NATIVE__=true;window.__FLICK_IS_ANDROID__=${Platform.OS === "android" ? "true" : "false"};})();true;`,
    [apiKey, geminiModels]
  );

  const handleMessage = (event) => {
    try {
      const raw = event.nativeEvent.data;
      if (!raw || typeof raw !== "string") return;
      const msg = JSON.parse(raw);
      if (handleAndroidGeminiMessage(webRef, msg)) {
        return;
      }
      if (msg.type === "REQUEST_CAMERA_PERMISSION") {
        Camera.requestCameraPermissionsAsync().then(() => {
          webRef.current?.injectJavaScript(INJECT_RETRY_CAMERA);
        });
      } else if (msg.type === "OPEN_APP_SETTINGS") {
        Linking.openSettings();
      } else if (msg.type === "PICK_IMAGES_FROM_LIBRARY") {
        void pickImagesFromLibrary(webRef);
      } else if (msg.type === "NATIVE_CAMERA_CAPTURE") {
        void launchNativeCamera(webRef);
      } else if (msg.type === "GEMINI_GENERATE") {
        void runGeminiGenerate(webRef, msg);
      } else if (msg.type === "VOICE_RECORD_TOGGLE") {
        void toggleNativeVoiceRecording(webRef);
      } else if (msg.type === "REQUEST_NATIVE_LOCATION") {
        void refreshNativeLocationAndInject(webRef);
      }
    } catch {
      /* ignore oversized or invalid messages */
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <WebView
        ref={webRef}
        source={{
          html: webBundle,
          baseUrl: "https://localhost/",
        }}
        style={styles.webview}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        geolocationEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        mediaCapturePermissionGrantType="grant"
        injectedJavaScriptBeforeContentLoaded={
          injectedJavaScriptBeforeContentLoaded
        }
        setSupportMultipleWindows={false}
        onLoadEnd={() => {
          setTimeout(() => {
            webRef.current?.injectJavaScript(INJECT_RETRY_CAMERA);
            void refreshNativeLocationAndInject(webRef);
          }, 300);
        }}
        onMessage={handleMessage}
        {...(Platform.OS === "android"
          ? {
              androidLayerType: "hardware",
              mixedContentMode: "always",
              setBuiltInZoomControls: false,
            }
          : {})}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a1628",
  },
  webview: {
    flex: 1,
    backgroundColor: "#0a1628",
  },
});
