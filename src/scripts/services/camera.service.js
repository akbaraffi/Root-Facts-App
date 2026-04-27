import { CAMERA_CONFIG } from "../config.js";
import { getCameraErrorMessage, logError } from "../utils/index.js";

class CameraService {
  constructor() {
    this.stream = null;
    this.video = null;
    this.canvas = null;
    this.ctx = null;
    this.config = CAMERA_CONFIG;
    this.currentFPS = this.config.defaultFPS;
    this.lastFrameTime = 0;
  }

  initializeElements(videoId, canvasId) {
    this.video = document.getElementById(videoId);
    this.canvas = document.getElementById(canvasId);
    if (this.canvas) {
      this.ctx = this.canvas.getContext("2d");
    }
  }

  async loadCameras(cameraSelect) {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput",
      );

      if (cameraSelect) {
        cameraSelect.innerHTML = "";

        const defaultOption = document.createElement("option");
        defaultOption.value = "default";
        defaultOption.textContent = "Belakang";
        cameraSelect.appendChild(defaultOption);

        const frontOption = document.createElement("option");
        frontOption.value = "front";
        frontOption.textContent = "Depan";
        cameraSelect.appendChild(frontOption);

        videoDevices.forEach((device, index) => {
          const option = document.createElement("option");
          option.value = device.deviceId;
          option.textContent = device.label || `Kamera ${index + 1}`;
          cameraSelect.appendChild(option);
        });
      }

      return videoDevices;
    } catch (error) {
      logError("Gagal memuat daftar kamera", error);
      return [];
    }
  }

  _getConstraints(selectedCamera) {
    const constraints = {
      video: {
        width: this.config.constraints.width,
        height: this.config.constraints.height,
      },
      audio: false,
    };

    if (selectedCamera === "front") {
      constraints.video.facingMode = this.config.frontFacingMode;
    } else if (selectedCamera === "default") {
      constraints.video.facingMode = this.config.defaultFacingMode;
    } else if (selectedCamera) {
      constraints.video.deviceId = { exact: selectedCamera };
    } else {
      constraints.video.facingMode = this.config.defaultFacingMode;
    }

    return constraints;
  }

  async startCamera(videoId, canvasId, cameraSelect) {
    try {
      this.initializeElements(videoId, canvasId);

      const selectedCamera = cameraSelect ? cameraSelect.value : "default";
      const constraints = this._getConstraints(selectedCamera);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Browser tidak mendukung kamera");
      }

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (this.video) {
        this.video.srcObject = this.stream;
        await this.video.play();
      }

      await this.loadCameras(cameraSelect);

      return true;
    } catch (error) {
      const errorMessage = getCameraErrorMessage(error);
      logError("Gagal memulai kamera", error);
      throw new Error(errorMessage);
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
    }
  }

  setFPS(fps) {
    this.currentFPS = Math.max(1, Math.min(60, fps));
  }

  shouldProcessFrame() {
    const now = performance.now();
    const interval = 1000 / this.currentFPS;

    if (now - this.lastFrameTime >= interval) {
      this.lastFrameTime = now;
      return true;
    }
    return false;
  }

  captureFrame() {
    if (!this.video || !this.canvas || !this.ctx) return null;
    if (this.video.readyState < 2) return null;

    this.canvas.width = this.video.videoWidth;
    this.canvas.height = this.video.videoHeight;
    this.ctx.drawImage(this.video, 0, 0);

    return this.canvas;
  }

  isActive() {
    return !!(this.stream && this.stream.active);
  }
}

export default CameraService;
