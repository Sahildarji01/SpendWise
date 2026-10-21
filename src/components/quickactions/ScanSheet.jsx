import { useState, useRef, useCallback, useEffect } from "react";
import {
  ScanLine,
  ImageIcon,
  FileText,
  Camera,
  AlertTriangle,
  Check,
  X,
  HelpCircle,
} from "lucide-react";
import BottomSheet from "../ui/BottomSheet";
import Button from "../ui/Button";
import PermissionHelpDialog from "../permissions/PermissionHelpDialog";
import { cn } from "../../lib/format";
import {
  requestCamera,
  stopMediaTracks,
  getPermissionStatus,
  validateFile,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
} from "../../lib/permissions";

const MAX_FILE_SIZE_MB = MAX_FILE_SIZE / (1024 * 1024);

export default function ScanSheet({ open, onClose }) {
  const [phase, setPhase] = useState("idle"); // idle | camera | denied | error | captured
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [fileError, setFileError] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  // Reset state when sheet opens/closes
  useEffect(() => {
    if (open) {
      setPhase("idle");
      setCameraError(null);
      setFileError(null);
      setCapturedImage(null);
    }
  }, [open]);

  // Clean up camera stream when sheet closes or phase changes away from camera
  useEffect(() => {
    if (!open || phase !== "camera") {
      if (stream) {
        stopMediaTracks(stream);
        setStream(null);
      }
    }
  }, [open, phase, stream]);

  // Attach stream to video element when available
  useEffect(() => {
    if (stream && videoRef.current && phase === "camera") {
      videoRef.current.srcObject = stream;
    }
  }, [stream, phase]);

  const handleStartCamera = useCallback(async () => {
    setCameraError(null);
    setPhase("idle");

    const result = await requestCamera();

    if (!result.granted) {
      if (result.error === "denied") {
        setCameraError("denied");
        setPhase("denied");
      } else if (result.error === "no-device") {
        setCameraError("no-device");
        setPhase("error");
      } else if (result.error === "insecure") {
        setCameraError("insecure");
        setPhase("error");
      } else if (result.error === "unsupported") {
        setCameraError("unsupported");
        setPhase("error");
      } else if (result.error === "busy") {
        setCameraError("busy");
        setPhase("error");
      } else {
        setCameraError("unknown");
        setPhase("error");
      }
      return;
    }

    setStream(result.stream);
    setPhase("camera");
  }, []);

  const handleStopCamera = useCallback(() => {
    if (stream) {
      stopMediaTracks(stream);
      setStream(null);
    }
    setPhase("idle");
  }, [stream]);

  const handleCapture = useCallback(() => {
    if (!videoRef.current || !stream) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1080;
    canvas.height = video.videoHeight || 1920;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedImage(dataUrl);

    // Stop camera tracks after capture
    stopMediaTracks(stream);
    setStream(null);
    setPhase("captured");
  }, [stream]);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);
    const validation = validateFile(file);

    if (!validation.valid) {
      if (validation.error === "invalid-type") {
        setFileError(`Unsupported file type. Please use JPEG, PNG, WebP, HEIC, or PDF.`);
      } else if (validation.error === "too-large") {
        setFileError(`File is too large. Maximum size is ${MAX_FILE_SIZE_MB} MB.`);
      } else {
        setFileError("Could not process this file. Please try another.");
      }
      e.target.value = "";
      return;
    }

    // Read file as data URL for preview
    const reader = new FileReader();
    reader.onload = () => {
      setCapturedImage(reader.result);
      setPhase("captured");
    };
    reader.onerror = () => {
      setFileError("Could not read this file. Please try another.");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, []);

  const handleRetake = useCallback(() => {
    setCapturedImage(null);
    setPhase("idle");
  }, []);

  const handleClose = useCallback(() => {
    if (stream) {
      stopMediaTracks(stream);
      setStream(null);
    }
    setCapturedImage(null);
    setFileError(null);
    setCameraError(null);
    setPhase("idle");
    onClose();
  }, [stream, onClose]);

  return (
    <BottomSheet open={open} onClose={handleClose} title="Scan Receipt">
      <div className="space-y-4">
        {/* Captured image preview */}
        {phase === "captured" && capturedImage && (
          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden border border-[var(--border-strong)]">
              <img src={capturedImage} alt="Captured receipt" className="w-full max-h-80 object-contain bg-charcoal-900" />
            </div>
            <div className="flex items-start gap-2 text-sm text-forest-300 bg-forest-500/10 border border-forest-500/20 rounded-xl px-3 py-2.5">
              <Check size={16} className="shrink-0 mt-0.5" />
              <span>Image captured. Receipt scanning with automatic data extraction is coming soon.</span>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" fullWidth onClick={handleRetake}>
                Retake
              </Button>
              <Button variant="secondary" fullWidth onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
        )}

        {/* Camera view */}
        {phase === "camera" && (
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden bg-charcoal-950 aspect-[3/4]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Scan overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-[80%] h-[60%] border-2 border-forest-400/60 rounded-xl" />
              </div>
              {/* Close button */}
              <button
                onClick={handleStopCamera}
                className="absolute top-3 right-3 h-9 w-9 rounded-lg bg-charcoal-950/60 flex items-center justify-center text-ivory-100 hover:bg-charcoal-950/80 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-charcoal-400 text-center">Point your camera at the receipt and tap capture.</p>
            <Button fullWidth onClick={handleCapture}>
              <Camera size={18} />
              Capture
            </Button>
          </div>
        )}

        {/* Permission denied */}
        {phase === "denied" && (
          <div className="space-y-4">
            <div className="flex items-start gap-2.5 text-sm text-error bg-error/10 border border-error/20 rounded-xl px-3 py-3">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-error mb-1">Camera Access Denied</p>
                <p className="text-charcoal-300 text-xs leading-relaxed">
                  SpendWise needs camera access to capture receipt photos. Please allow camera access in your browser settings, then try again. Alternatively, you can upload an existing photo.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" fullWidth onClick={() => setShowHelp(true)}>
                <HelpCircle size={16} />
                Help
              </Button>
              <Button variant="secondary" fullWidth onClick={handleStartCamera}>
                Try Again
              </Button>
            </div>
            <div className="pt-2 border-t border-[var(--border)]">
              <p className="text-xs text-charcoal-400 text-center mb-3">Or upload an existing photo instead:</p>
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_FILE_TYPES.join(",")}
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button variant="outline" fullWidth onClick={() => fileInputRef.current?.click()}>
                <ImageIcon size={16} />
                Upload Photo
              </Button>
            </div>
          </div>
        )}

        {/* Camera error (no device, unsupported, insecure, busy) */}
        {phase === "error" && (
          <div className="space-y-4">
            <div className="flex items-start gap-2.5 text-sm text-accent-400 bg-accent-500/10 border border-accent-500/20 rounded-xl px-3 py-3">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-accent-400 mb-1">
                  {cameraError === "no-device" && "No Camera Found"}
                  {cameraError === "unsupported" && "Camera Not Supported"}
                  {cameraError === "insecure" && "Secure Connection Required"}
                  {cameraError === "busy" && "Camera In Use"}
                  {cameraError === "unknown" && "Camera Error"}
                </p>
                <p className="text-charcoal-300 text-xs leading-relaxed">
                  {cameraError === "no-device" && "No camera was detected on this device. You can still upload a photo of your receipt."}
                  {cameraError === "unsupported" && "Your browser does not support camera access. You can still upload a photo of your receipt."}
                  {cameraError === "insecure" && "Camera access requires a secure (HTTPS) connection. You can still upload a photo of your receipt."}
                  {cameraError === "busy" && "The camera is being used by another application. Close it and try again, or upload a photo instead."}
                  {cameraError === "unknown" && "Could not access the camera. Please try again or upload a photo instead."}
                </p>
              </div>
            </div>
            {cameraError === "busy" && (
              <Button fullWidth onClick={handleStartCamera}>
                Try Again
              </Button>
            )}
            <div className="pt-2 border-t border-[var(--border)]">
              <p className="text-xs text-charcoal-400 text-center mb-3">Upload a photo of your receipt instead:</p>
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_FILE_TYPES.join(",")}
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button variant="outline" fullWidth onClick={() => fileInputRef.current?.click()}>
                <ImageIcon size={16} />
                Upload Photo
              </Button>
            </div>
          </div>
        )}

        {/* Idle — initial choice screen */}
        {phase === "idle" && (
          <div className="flex flex-col items-center py-4">
            <div className="w-full aspect-[3/4] max-w-[220px] rounded-2xl border-2 border-dashed border-charcoal-600 flex flex-col items-center justify-center gap-3 mb-5">
              <div className="h-14 w-14 rounded-2xl bg-forest-500/10 flex items-center justify-center">
                <ScanLine size={28} className="text-forest-400" />
              </div>
              <p className="text-sm text-charcoal-400 text-center px-6">
                Point your camera at a receipt
              </p>
            </div>

            {/* File error */}
            {fileError && (
              <div className="w-full flex items-start gap-2 text-sm text-error bg-error/10 border border-error/20 rounded-xl px-3 py-2.5 mb-3">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>{fileError}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 w-full mb-4">
              <button
                onClick={handleStartCamera}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-charcoal-800/60 border border-[var(--border)] hover:border-forest-400/40 transition-colors"
              >
                <Camera size={20} className="text-forest-400" />
                <span className="text-xs text-ivory-200">Take Photo</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-charcoal-800/60 border border-[var(--border)] hover:border-forest-400/40 transition-colors"
              >
                <ImageIcon size={20} className="text-ivory-200" />
                <span className="text-xs text-ivory-200">Upload Photo</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_FILE_TYPES.join(",")}
              onChange={handleFileSelect}
              className="hidden"
            />

            <p className="text-xs text-charcoal-400 text-center max-w-xs mb-5">
              Receipt scanning with automatic data extraction is coming soon. For now, use "Add Expense" to log transactions manually.
            </p>

            <Button variant="secondary" fullWidth onClick={handleClose}>
              Close
            </Button>
          </div>
        )}
      </div>

      <PermissionHelpDialog
        open={showHelp}
        onClose={() => setShowHelp(false)}
        permissionType="camera"
        onRetry={handleStartCamera}
        lang="en-IN"
      />
    </BottomSheet>
  );
}
