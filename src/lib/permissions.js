// Centralized permission management utility for SpendWise.
// Handles microphone, camera, and notifications permissions across browsers.
// Detects supported APIs, queries status where possible, requests access on user action,
// cleans up media tracks and event listeners, and provides consistent states.

// --- Browser/platform detection ---

export function detectBrowser() {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  const isChrome = /Chrome\//.test(ua) && !/Edg\//.test(ua) && !/OPR\//.test(ua);
  const isEdge = /Edg\//.test(ua);
  const isSafari = /Safari\//.test(ua) && !/Chrome\//.test(ua) && !/Edg\//.test(ua);
  const isFirefox = /Firefox\//.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isMac = /Mac/i.test(ua) && !isIOS;
  const isWindows = /Windows/i.test(ua);

  if (isChrome) return { name: "chrome", platform: isAndroid ? "android" : isIOS ? "ios" : isMac ? "mac" : isWindows ? "windows" : "linux" };
  if (isEdge) return { name: "edge", platform: isAndroid ? "android" : isMac ? "mac" : isWindows ? "windows" : "linux" };
  if (isSafari) return { name: "safari", platform: isIOS ? "ios" : isMac ? "mac" : "linux" };
  if (isFirefox) return { name: "firefox", platform: isAndroid ? "android" : isMac ? "mac" : isWindows ? "windows" : "linux" };
  return { name: "unknown", platform: isAndroid ? "android" : isIOS ? "ios" : isMac ? "mac" : isWindows ? "windows" : "linux" };
}

export function isSecureContext() {
  return typeof window !== "undefined" && (window.isSecureContext || location.protocol === "https:" || location.hostname === "localhost");
}

// --- Permission status ---

// Permission states: "granted" | "denied" | "prompt" | "unsupported" | "unknown"

export async function getPermissionStatus(type) {
  if (type === "microphone" || type === "camera") {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return isSecureContext() ? "unsupported" : "unsupported";
    }
    // Try Permissions API — note: many browsers don't support mic/camera queries
    if (navigator.permissions) {
      try {
        const name = type === "microphone" ? "microphone" : "camera";
        const status = await navigator.permissions.query({ name });
        return mapPermissionState(status.state);
      } catch {
        // Permissions API doesn't support this permission type on this browser
      }
    }
    return "unknown";
  }

  if (type === "notifications") {
    if (!("Notification" in window)) return "unsupported";
    if (Notification.permission === "granted") return "granted";
    if (Notification.permission === "denied") return "denied";
    return "prompt";
  }

  if (type === "photos") {
    // File picker doesn't require a permission grant in ordinary browser workflows
    if (typeof window !== "undefined" && window.showOpenFilePicker) return "granted";
    return "granted"; // <input type="file"> works everywhere
  }

  return "unknown";
}

function mapPermissionState(state) {
  if (state === "granted") return "granted";
  if (state === "denied") return "denied";
  if (state === "prompt") return "prompt";
  return "unknown";
}

// --- Request access ---

// Requests microphone access via getUserMedia. Returns { granted, stream, error }.
// The caller is responsible for stopping tracks when done via stopMediaTracks().
export async function requestMicrophone() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return { granted: false, stream: null, error: "unsupported" };
  }
  if (!isSecureContext()) {
    return { granted: false, stream: null, error: "insecure" };
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    return { granted: true, stream, error: null };
  } catch (err) {
    if (err.name === "NotAllowedError" || err.name === "SecurityError") {
      return { granted: false, stream: null, error: "denied" };
    }
    if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
      return { granted: false, stream: null, error: "no-device" };
    }
    if (err.name === "NotReadableError") {
      return { granted: false, stream: null, error: "busy" };
    }
    return { granted: false, stream: null, error: "unknown" };
  }
}

// Requests camera access. Prefer rear camera on mobile. Returns { granted, stream, error }.
export async function requestCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return { granted: false, stream: null, error: "unsupported" };
  }
  if (!isSecureContext()) {
    return { granted: false, stream: null, error: "insecure" };
  }
  try {
    const constraints = {
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return { granted: true, stream, error: null };
  } catch (err) {
    if (err.name === "NotAllowedError" || err.name === "SecurityError") {
      return { granted: false, stream: null, error: "denied" };
    }
    if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
      return { granted: false, stream: null, error: "no-device" };
    }
    if (err.name === "NotReadableError") {
      return { granted: false, stream: null, error: "busy" };
    }
    // Try without facingMode constraint (some desktop cameras don't support it)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      return { granted: true, stream, error: null };
    } catch (err2) {
      return { granted: false, stream: null, error: "unknown" };
    }
  }
}

// Requests notification permission. Returns { granted, error }.
export async function requestNotifications() {
  if (!("Notification" in window)) {
    return { granted: false, error: "unsupported" };
  }
  if (Notification.permission === "granted") {
    return { granted: true, error: null };
  }
  if (Notification.permission === "denied") {
    return { granted: false, error: "denied" };
  }
  try {
    const result = await Notification.requestPermission();
    return { granted: result === "granted", error: result === "denied" ? "denied" : null };
  } catch {
    return { granted: false, error: "unknown" };
  }
}

// --- Cleanup ---

export function stopMediaTracks(stream) {
  if (!stream) return;
  try {
    stream.getTracks().forEach((track) => track.stop());
  } catch {
    // ignore
  }
}

// --- Listen for permission changes ---

// Subscribes to permission status changes via the Permissions API.
// Returns an unsubscribe function. Returns a no-op if unsupported.
export async function onPermissionChange(type, callback) {
  if (!navigator.permissions) return () => {};

  const name = type === "microphone" ? "microphone" : type === "camera" ? "camera" : null;
  if (!name) return () => {};

  try {
    const status = await navigator.permissions.query({ name });
    const handler = () => callback(mapPermissionState(status.state));
    status.addEventListener("change", handler);
    return () => status.removeEventListener("change", handler);
  } catch {
    return () => {};
  }
}

// --- Speech recognition support ---

export function isSpeechRecognitionSupported() {
  if (typeof window === "undefined") return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

// --- File validation for receipt uploads ---

export const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export function validateFile(file) {
  if (!file) return { valid: false, error: "no-file" };
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return { valid: false, error: "invalid-type" };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "too-large" };
  }
  return { valid: true, error: null };
}
