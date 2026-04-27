import HomePage from "./home/home-page.js";

class App {
  #container = null;

  constructor({ container }) {
    this.#container = container;
    this.registerServiceWorker();
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('SW terdaftar:', registration);
          })
          .catch((error) => {
            console.log('Pendaftaran SW gagal:', error);
          });
      });
    } else {
      console.log('Service Worker tidak diregistrasi di mode development.');
    }
  }

  async renderPage() {
    const page = new HomePage();
    this.#container.innerHTML = await page.render();
    await page.afterRender();
  }
}

export default App;
