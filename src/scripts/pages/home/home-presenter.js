import CameraService from "../../services/camera.service.js";
import DetectionService from "../../services/detection.service.js";
import RootFactsService from "../../services/rootfacts.service.js";
import { APP_CONFIG } from "../../config.js";
import {
  createDelay,
  isValidDetection,
  logError,
  showElement,
  hideElement,
  setElementText,
  setElementHTML,
  addFadeInAnimation,
  getConfidenceTheme,
} from "../../utils/index.js";

class HomePresenter {
  constructor(view) {
    this.view = view;
    this.config = APP_CONFIG;

    this.detector = null;
    this.camera = null;
    this.generator = null;

    this.isRunning = false;
    this.currentLoopId = 0;
  }

  async init() {
    try {
      this.view.showStatus("Menunggu Model...");
      this.view.disableButton("Memuat...");

      this.view.showStatus("Memuat Model AI... 0%");

      this.detector = new DetectionService();
      this.view.showStatus("Memuat Model Deteksi... 20%");
      await this.detector.loadModel();
      this.view.showStatus("Model Deteksi Siap... 50%");

      this.camera = new CameraService();
      this.view.showStatus("Kamera Siap... 60%");

      this.generator = new RootFactsService(this.view);
      try {
        this.view.showStatus("Memuat Model Generatif... 70%");
        await this.generator.loadModel();
        this.view.showStatus("Model Generatif Siap... 100%");
      } catch (error) {
        logError("Layanan fakta gagal dimuat (mode offline?)", error);
        this.generator = null;
      }

      this.view.showStatus("Model AI Siap");
      this.view.enableButton();
    } catch (error) {
      logError("Gagal menginisialisasi aplikasi", error);
      this.view.showStatus("Model gagal dimuat");
      this.view.showError(`Gagal menginisialisasi: ${error.message}`);
      this.view.disableButton("Model Gagal Dimuat");
    }
  }

  toggleCamera() {
    if (!this.detector || !this.detector.isLoaded()) {
      this.view.showError(
        "Model deteksi AI belum siap. Harap tunggu inisialisasi selesai.",
      );
      return;
    }

    if (!this.isRunning) {
      this.startCamera();
    } else {
      this.stopCamera();
    }
  }

  async startCamera() {
    try {
      const cameraSelect = document.getElementById("camera-select");
      await this.camera.startCamera("media-video", "media-canvas", cameraSelect);

      this.view.updateCameraUI(true, false);
      this.view.switchToState("scanning");

      this.isRunning = true;
      this.currentLoopId++;
      this.detectLoop(this.currentLoopId);
    } catch (error) {
      logError("Gagal memulai kamera", error);
      this.view.showError(error.message);
    }
  }

  stopCamera() {
    this.isRunning = false;
    this.currentLoopId++;

    if (this.camera) {
      this.camera.stopCamera();
    }

    this.view.updateCameraUI(false, false);
    this.view.switchToState("idle");
  }

  stopDetection() {
    this.isRunning = false;
    this.currentLoopId++;
  }

  async detectLoop(loopId) {
    if (!this.isRunning || this.currentLoopId !== loopId) return;

    try {
      if (!this.camera.shouldProcessFrame()) {
        if (this.isRunning && this.currentLoopId === loopId) {
          requestAnimationFrame(() => this.detectLoop(loopId));
        }
        return;
      }

      const canvas = this.camera.captureFrame();
      if (!canvas) {
        if (this.isRunning && this.currentLoopId === loopId) {
          requestAnimationFrame(() => this.detectLoop(loopId));
        }
        return;
      }

      const result = await this.detector.predict(canvas);

      console.log("Deteksi hasil:", result);

      if (isValidDetection(result)) {
        this.stopDetection();
        this.view.switchToState("analyzing");
        await createDelay(this.config.analyzingDelay);
        await this.generateAndShowResults(result);
      }
    } catch (error) {
      logError("Deteksi error", error);
    }

    if (this.isRunning && this.currentLoopId === loopId) {
      requestAnimationFrame(() => this.detectLoop(loopId));
    }
  }

  async generateAndShowResults(detectionResult) {
    try {
      console.log("Memulai proses generasi untuk:", detectionResult.className);

      this.view.showResults(detectionResult, null);

      this.isRunning = false;
      this.stopDetection();

      if (this.camera) {
        this.camera.stopCamera();
      }

      this.view.updateCameraUI(false, true);

      if (this.generator && this.generator.isReady()) {
        console.log("Generator siap, menunggu sebelum memulai generasi...");
        await createDelay(this.config.factsGenerationDelay);
        this.view.updateFactsState("loading");

        try {
          const toneSelect = document.getElementById("tone-select");
          const tone = toneSelect ? toneSelect.value : "normal";

          console.log("Memanggil generateFacts dengan:", detectionResult.className, "tone:", tone);

          const factsData = await this.generator.generateFacts(
            detectionResult.className,
            tone,
          );

          console.log("Hasil generasi diterima:", factsData);

          if (factsData && factsData.fact) {
            this.view.updateFactsState("success", factsData.fact);
          } else {
            this.view.updateFactsState("error");
          }
        } catch (factsError) {
          logError("Gagal menghasilkan fakta menarik", factsError);
          this.view.updateFactsState("error");
        }
      } else {
        console.log("Generator tidak tersedia atau belum siap");
        this.view.updateFactsState("error");
      }
    } catch (error) {
      logError("Gagal menampilkan hasil", error);
      this.view.updateFactsState("error");
    }
  }

  setFPS(fps) {
    if (this.camera) {
      this.camera.setFPS(fps);
    }
  }

  setTone(tone) {
    if (this.generator) {
      this.generator.setTone(tone);
    }
  }
}

export default HomePresenter;
