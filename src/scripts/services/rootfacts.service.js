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

      console.log("Model generatif berhasil dimuat:", this.config.modelName, "| Backend:", device);

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

  _buildPrompt(vegetable, tone) {
    const promptMap = {
      normal: `Write a short interesting fact about the vegetable ${vegetable}.`,
      funny: `Write a short funny fact about the vegetable ${vegetable}.`,
      professional: `Write a short scientific fact about the vegetable ${vegetable}.`,
      casual: `Tell me a fun fact about the vegetable ${vegetable}.`,
    };
    return promptMap[tone] || promptMap.normal;
  }

  _cleanGeneratedText(rawText, vegetable) {
    if (!rawText || rawText.trim().length === 0) {
      return `${vegetable} is a nutritious and interesting vegetable.`;
    }

    let text = rawText.trim();

    text = text.replace(/^[\s\n\r]+/, "");

    const sentences = text.match(/[^.!?]*[.!?]+/g);
    if (sentences && sentences.length > 0) {
      text = sentences[0].trim();
    }

    text = text.trim();

    if (text && !/[.!?]$/.test(text)) {
      text += ".";
    }

    if (!text || text.length < 10) {
      return `${vegetable} is a nutritious and interesting vegetable.`;
    }

    return text;
  }

  async generateFacts(vegetable, tone = "normal") {
    if (!this.isModelLoaded || !this.generator) {
      throw new Error("Model belum siap");
    }

    if (this.isGenerating) {
      console.log("Generasi sedang berjalan, menunggu...");
      return {
        vegetable,
        fact: `${vegetable} is a popular and nutritious vegetable.`,
        tone,
      };
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
      const prompt = this._buildPrompt(cleanedInput, activeTone);

      console.log("Prompt untuk model generatif:", prompt);

      const result = await this.generator(prompt, {
        max_new_tokens: 100,
        temperature: 0.7,
        top_p: 0.9,
        do_sample: true,
        repetition_penalty: 1.3,
      });

      console.log("Hasil mentah dari model generatif:", result);

      let generatedText = "";

      if (result && result[0] && result[0].generated_text) {
        generatedText = result[0].generated_text;
      }

      console.log("Teks sebelum pembersihan:", generatedText);

      generatedText = this._cleanGeneratedText(generatedText, cleanedInput);

      console.log("Teks setelah pembersihan:", generatedText);

      return {
        vegetable: cleanedInput,
        fact: generatedText,
        tone: activeTone,
      };
    } catch (error) {
      logError("Gagal menghasilkan fakta", error);

      return {
        vegetable: cleanedInput,
        fact: `${cleanedInput} is a nutritious vegetable enjoyed worldwide.`,
        tone: tone || this.currentTone,
      };
    } finally {
      this.isGenerating = false;
    }
  }

  isReady() {
    return this.isModelLoaded && !!this.generator;
  }
}

export default RootFactsService;