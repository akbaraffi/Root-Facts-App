import { TENSORFLOW_CONFIG, PERFORMANCE_CONFIG } from "../config.js";
import {
  validateModelMetadata,
  logError,
  isWebGPUSupported,
} from "../utils/index.js";

class DetectionService {
  constructor() {
    this.model = null;
    this.labels = [];
    this.config = TENSORFLOW_CONFIG;
    this.performanceStats = {
      operations: 0,
      totalTime: 0,
      averageTime: 0,
    };
  }

  async loadModel() {
    try {
      const backend = isWebGPUSupported() ? "webgpu" : "webgl";

      await tf.setBackend(backend);
      await tf.ready();
      const backendName = tf.getBackend();
      console.log(`Backend TensorFlow.js yang digunakan: ${backendName}`);

      const [metadata, model] = await Promise.all([
        fetch(this.config.metadataPath).then((r) => r.json()),
        tf.loadLayersModel(this.config.modelPath),
      ]);

      if (!validateModelMetadata(metadata)) {
        throw new Error("Metadata tidak valid: array label tidak ditemukan");
      }

      this.labels = metadata.labels;
      this.model = model;

      return {
        success: true,
        labels: this.labels,
        modelName: metadata.modelName || "Unknown",
        version: metadata.version || "1.0.0",
        backend: backendName,
      };
    } catch (error) {
      logError("Gagal memuat model", error);
      throw new Error(`Gagal memuat model: ${error.message}`);
    }
  }

  isLoaded() {
    return !!this.model;
  }

  async predict(imageElement) {
    if (!this.model) {
      throw new Error("Model belum dimuat");
    }

    const startTime = performance.now();

    try {
      const predictions = tf.tidy(() => {
        const tensor = tf.browser
          .fromPixels(imageElement)
          .resizeNearestNeighbor([
            this.config.imageSize,
            this.config.imageSize,
          ])
          .toFloat()
          .div(255)
          .expandDims(0);

        return this.model.predict(tensor);
      });

      const data = await predictions.data();
      predictions.dispose();

      let maxIndex = 0;
      let maxConfidence = 0;
      for (let i = 0; i < data.length; i++) {
        if (data[i] > maxConfidence) {
          maxConfidence = data[i];
          maxIndex = i;
        }
      }

      const confidence = Math.round(maxConfidence * 100);
      const className = this.labels[maxIndex] || "Tidak dikenal";

      const elapsed = performance.now() - startTime;
      this.performanceStats.operations++;
      this.performanceStats.totalTime += elapsed;
      this.performanceStats.averageTime =
        this.performanceStats.totalTime / this.performanceStats.operations;

      return {
        className,
        confidence,
        isValid: confidence > 50,
        inferenceTime: Math.round(elapsed),
      };
    } catch (error) {
      logError("Gagal melakukan prediksi", error);
      throw new Error(`Prediksi gagal: ${error.message}`);
    }
  }
}

export default DetectionService;
