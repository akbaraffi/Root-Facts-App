const APP_CONFIG = {
  detectionConfidenceThreshold: 70,
  analyzingDelay: 2000,
  factsGenerationDelay: 2000,
  detectionRetryInterval: 100,
};

const UI_CONFIG = {
  animationDuration: 300,
  fadeAnimation: "fadeIn 0.5s ease-out forwards",
  confidenceThresholds: {
    excellent: 90,
    good: 80,
  },
  factsCardOpacity: {
    loading: 0.6,
    normal: 1.0,
  },
};

const CAMERA_CONFIG = {
  defaultFacingMode: "environment",
  frontFacingMode: "user",
  defaultFPS: 30,
  constraints: {
    width: { ideal: 640 },
    height: { ideal: 480 },
  },
};

const TENSORFLOW_CONFIG = {
  modelPath: "/model/model.json",
  metadataPath: "/model/metadata.json",
  imageSize: 224,
};

const TRANSFORMERS_CONFIG = {
  cdnUrl: "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1",
  modelName: "Xenova/LaMini-Flan-T5-248M",
};

const PERFORMANCE_CONFIG = {
  maxOperations: 100,
};

export {
  APP_CONFIG,
  UI_CONFIG,
  CAMERA_CONFIG,
  TENSORFLOW_CONFIG,
  TRANSFORMERS_CONFIG,
  PERFORMANCE_CONFIG,
};
