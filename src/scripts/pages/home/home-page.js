import {
  generateCameraSection,
  generateInfoPanel,
  generateFooter,
} from "../../templates.js";
import HomePresenter from "./home-presenter.js";
import {
  showElement,
  hideElement,
  setElementText,
  addFadeInAnimation,
  getConfidenceTheme,
  setElementOpacity,
} from "../../utils/index.js";
import { UI_CONFIG } from "../../config.js";

export default class HomePage {
  #presenter = null;

  async render() {
    return `
      <main class="main-content">
        ${generateCameraSection()}
        ${generateInfoPanel()}
      </main>
      ${generateFooter()}
    `;
  }

  async afterRender() {
    this.#presenter = new HomePresenter(this._createViewInterface());

    this._bindEvents();

    await this.#presenter.init();
  }

  _createViewInterface() {
    return {
      showStatus: (message) => {
        const statusText = document.getElementById("status-text");
        const statusDot = document.getElementById("status-dot");

        if (statusText) statusText.textContent = message;

        if (statusDot) {
          if (
            message.includes("Siap") ||
            message.includes("100%")
          ) {
            statusDot.classList.add("active");
          } else {
            statusDot.classList.remove("active");
          }
        }
      },

      showError: (message) => {
        alert(message);
      },

      enableButton: () => {
        const btn = document.getElementById("btn-toggle");
        if (btn) {
          btn.disabled = false;
          btn.style.opacity = "1";
        }
      },

      disableButton: (text) => {
        const btn = document.getElementById("btn-toggle");
        if (btn) {
          btn.disabled = true;
          btn.style.opacity = "0.5";
        }
      },

      updateCameraUI: (isScanning, isResult) => {
        const btn = document.getElementById("btn-toggle");
        const overlay = document.getElementById("camera-overlay");
        const placeholder = document.getElementById("camera-placeholder");

        if (btn) {
          if (isScanning) {
            btn.classList.add("scanning");
          } else {
            btn.classList.remove("scanning");
          }
        }

        if (overlay) {
          if (isScanning) {
            overlay.classList.add("active");
          } else {
            overlay.classList.remove("active");
          }
        }

        if (placeholder) {
          if (isScanning || isResult) {
            placeholder.classList.add("hidden");
          } else {
            placeholder.classList.remove("hidden");
          }
        }
      },

      switchToState: (state) => {
        const stateIdle = document.getElementById("state-idle");
        const stateLoading = document.getElementById("state-loading");
        const stateResult = document.getElementById("state-result");

        hideElement(stateIdle);
        hideElement(stateLoading);
        hideElement(stateResult);

        switch (state) {
          case "idle":
            showElement(stateIdle);
            addFadeInAnimation(stateIdle);
            break;
          case "scanning":
          case "analyzing":
            showElement(stateLoading);
            addFadeInAnimation(stateLoading);
            if (state === "analyzing") {
              const loadingTitle = stateLoading?.querySelector("h2");
              const loadingDesc = stateLoading?.querySelector("p");
              if (loadingTitle) loadingTitle.textContent = "Menganalisis...";
              if (loadingDesc)
                loadingDesc.textContent =
                  "Sedang mengidentifikasi sayuran Anda";
            }
            break;
          case "result":
            showElement(stateResult);
            addFadeInAnimation(stateResult);
            break;
        }

        if (typeof lucide !== "undefined") {
          lucide.createIcons();
        }
      },

      showResults: (detectionResult, factsData) => {
        const stateIdle = document.getElementById("state-idle");
        const stateLoading = document.getElementById("state-loading");
        const stateResult = document.getElementById("state-result");

        hideElement(stateIdle);
        hideElement(stateLoading);
        showElement(stateResult);
        addFadeInAnimation(stateResult);

        const detectedName = document.getElementById("detected-name");
        if (detectedName) {
          detectedName.textContent = detectionResult.className;
        }

        const confidenceFill = document.getElementById("confidence-fill");
        const confidenceValue =
          document.getElementById("detected-confidence");
        if (confidenceFill) {
          confidenceFill.style.width = `${detectionResult.confidence}%`;

          const theme = getConfidenceTheme(detectionResult.confidence);
          const colorMap = {
            green: "green",
            yellow: "yellow",
            red: "red",
          };
          confidenceFill.style.backgroundColor =
            colorMap[theme] || "green";
        }
        if (confidenceValue) {
          confidenceValue.textContent = `${detectionResult.confidence}%`;
        }

        if (typeof lucide !== "undefined") {
          lucide.createIcons();
        }
      },

      updateFactsState: (state, factsText) => {
        const factLoading = document.getElementById("fun-fact-loading");
        const factContent = document.getElementById("fun-fact-content");
        const factText = document.getElementById("fun-fact-text");

        switch (state) {
          case "loading":
            showElement(factLoading);
            if (factContent)
              factContent.style.opacity =
                UI_CONFIG.factsCardOpacity.loading;
            break;
          case "success":
            hideElement(factLoading);
            if (factContent)
              factContent.style.opacity =
                UI_CONFIG.factsCardOpacity.normal;
            if (factText) {
              factText.textContent =
                factsText || "Tidak ada fakta yang dihasilkan.";
              addFadeInAnimation(factText);
            }
            break;
          case "error":
            hideElement(factLoading);
            if (factContent)
              factContent.style.opacity =
                UI_CONFIG.factsCardOpacity.normal;
            if (factText) {
              factText.textContent =
                "Gagal memuat fakta menarik. Coba scan ulang.";
            }
            break;
        }
      },
    };
  }

  _bindEvents() {
    const btnToggle = document.getElementById("btn-toggle");
    if (btnToggle) {
      btnToggle.addEventListener("click", () => {
        this.#presenter.toggleCamera();
      });
    }

    const fpsSlider = document.getElementById("fps-slider");
    const fpsLabel = document.getElementById("fps-label");
    if (fpsSlider) {
      fpsSlider.addEventListener("input", (e) => {
        const fps = parseInt(e.target.value, 10);
        if (fpsLabel) fpsLabel.textContent = `${fps} FPS`;
        this.#presenter.setFPS(fps);
      });
    }

    const cameraSelect = document.getElementById("camera-select");
    if (cameraSelect) {
      cameraSelect.addEventListener("change", () => {
        if (this.#presenter.isRunning) {
          this.#presenter.stopCamera();
          setTimeout(() => this.#presenter.startCamera(), 300);
        }
      });
    }

    const toneSelect = document.getElementById("tone-select");
    if (toneSelect) {
      toneSelect.addEventListener("change", (e) => {
        this.#presenter.setTone(e.target.value);
      });
    }

    const btnCopy = document.getElementById("btn-copy");
    if (btnCopy) {
      btnCopy.addEventListener("click", async () => {
        const factText = document.getElementById("fun-fact-text");
        if (factText && factText.textContent) {
          try {
            await navigator.clipboard.writeText(factText.textContent);
            btnCopy.classList.add("copied");
            setTimeout(() => btnCopy.classList.remove("copied"), 2000);
          } catch {
            const textArea = document.createElement("textarea");
            textArea.value = factText.textContent;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand("copy");
            document.body.removeChild(textArea);
            btnCopy.classList.add("copied");
            setTimeout(() => btnCopy.classList.remove("copied"), 2000);
          }
        }
      });
    }
  }
}
