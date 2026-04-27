import { TRANSFORMERS_CONFIG } from "../config.js";
import {
  logError,
  isWebGPUSupported,
  createModelProgressCallback,
} from "../utils/index.js";

class RootFactsService {
  constructor(ui) {
    this.generator = null;
    this.isModelLoaded = false;
    this.isGenerating = false;
    this.config = TRANSFORMERS_CONFIG;
    this.currentBackend = null;
    this.currentTone = "normal";
    this.ui = ui;
  }

  async loadModel() {
    try {
      const { pipeline } = await import(
        /* webpackIgnore: true */ this.config.cdnUrl
      );

      const device = isWebGPUSupported() ? "webgpu" : "wasm";

      this.generator = await pipeline(
        "text2text-generation",
        this.config.modelName,
        {
          dtype: "q4",
          device,
          progress_callback: createModelProgressCallback((progress) => {
            if (this.ui && typeof this.ui.showStatus === "function") {
              this.ui.showStatus(progress.message);
            }
          }),
        },
      );

      this.isModelLoaded = true;
      this.currentBackend = device;

      return { success: true, model: this.config.modelName };
    } catch (error) {
      logError("Kesalahan memuat model Transformers.js", error);
      throw new Error(`Gagal memuat model generasi konten: ${error.message}`);
    }
  }

  setTone(tone) {
    const validTones = ["normal", "funny", "professional", "casual"];
    if (validTones.includes(tone)) {
      this.currentTone = tone;
    }
  }

  _getToneInstruction(tone) {
    const toneMap = {
      normal: "Write one interesting factual sentence about",
      funny: "Write one short funny fact about",
      professional: "Write one precise scientific fact about",
      casual: "Write one casual friendly fact about",
    };
    return toneMap[tone] || toneMap.normal;
  }

  _cleanGeneratedText(rawText, vegetable) {
    let text = rawText.trim();

    const sentenceMatch = text.match(/^[^.!?]*[.!?]/);
    if (sentenceMatch) {
      text = sentenceMatch[0];
    }

    text = text.trim();

    if (!text.toLowerCase().startsWith(vegetable.toLowerCase())) {
      const vegIndex = text.toLowerCase().indexOf(vegetable.toLowerCase());
      if (vegIndex !== -1) {
        text = text.slice(vegIndex);
      } else {
        text = `${vegetable} is ${text.charAt(0).toLowerCase()}${text.slice(1)}`;
      }
    }

    if (text && !/[.!?]$/.test(text)) {
      text += ".";
    }

    return text;
  }

  async generateFacts(vegetable, tone = "normal") {
    if (!this.isModelLoaded || !this.generator) {
      throw new Error("Model belum siap");
    }

    if (this.isGenerating) {
      throw new Error("Sedang memproses permintaan lain");
    }

    const MAX_INPUT_LENGTH = 50;
    if (!vegetable || typeof vegetable !== "string") {
      throw new Error("Input sayuran tidak valid");
    }

    const cleanedInput = vegetable
      .replace(/[^a-zA-Z\s]/g, "")
      .trim()
      .substring(0, MAX_INPUT_LENGTH);

    if (cleanedInput.length === 0) {
      throw new Error("Input sayuran tidak valid setelah pembersihan");
    }

    this.isGenerating = true;

    try {
      const activeTone = tone || this.currentTone;
      const toneInstruction = this._getToneInstruction(activeTone);

      const prompt = `${toneInstruction} ${cleanedInput}. ${cleanedInput} is`;

      const result = await this.generator(prompt, {
        max_new_tokens: 60,
        temperature: 0.7,
        top_p: 0.9,
        do_sample: true,
        repetition_penalty: 1.3,
      });

      let generatedText =
        result && result[0] && result[0].generated_text
          ? result[0].generated_text
          : `${cleanedInput} is a nutritious vegetable.`;

      generatedText = this._cleanGeneratedText(generatedText, cleanedInput);

      if (generatedText.length < 10) {
        generatedText = `${cleanedInput} is a fascinating vegetable worth knowing about.`;
      }

      return {
        vegetable: cleanedInput,
        fact: generatedText,
        tone: activeTone,
      };
    } catch (error) {
      logError("Gagal menghasilkan fakta", error);
      throw new Error(`Gagal menghasilkan fakta: ${error.message}`);
    } finally {
      this.isGenerating = false;
    }
  }

  isReady() {
    return this.isModelLoaded && !!this.generator;
  }
}

export default RootFactsService;