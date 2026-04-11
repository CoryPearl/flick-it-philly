import "dotenv/config";

export default {
  expo: {
    name: "Flick It Philly",
    slug: "flick-it-philly",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#0a1628",
    },
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSCameraUsageDescription:
          "Flick It Philly needs camera access to photograph city issues for your report.",
        NSPhotoLibraryUsageDescription:
          "Flick It Philly needs photo library access to attach images to your report.",
        NSMicrophoneUsageDescription:
          "Flick It Philly uses the microphone when you record a voice note for your report.",
        NSLocationWhenInUseUsageDescription:
          "Flick It Philly uses your location to tag reports with approximate coordinates.",
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0a1628",
      },
      edgeToEdgeEnabled: true,
      permissions: [
        "CAMERA",
        "RECORD_AUDIO",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "READ_MEDIA_IMAGES",
        "READ_EXTERNAL_STORAGE",
      ],
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      [
        "expo-camera",
        {
          cameraPermission:
            "Flick It Philly needs camera access to photograph city issues for your report.",
          microphonePermission:
            "Flick It Philly uses the microphone when you record a voice note for your report.",
        },
      ],
      [
        "expo-image-picker",
        {
          photosPermission:
            "Flick It Philly needs photo library access to attach existing photos to your report.",
          cameraPermission:
            "Flick It Philly needs the camera to photograph issues for your report.",
        },
      ],
      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "Flick It Philly uses your location to tag reports with approximate coordinates.",
        },
      ],
    ],
    extra: {
      geminiApiKey:
        process.env.GEMINI_API_KEY ??
        process.env.EXPO_PUBLIC_GEMINI_API_KEY ??
        "",
      /** Comma-separated Gemini model ids, e.g. "gemini-2.5-flash,gemini-flash-latest" */
      geminiModels:
        (process.env.GEMINI_MODEL ||
          process.env.EXPO_PUBLIC_GEMINI_MODEL ||
          ""
        ).trim(),
    },
  },
};
