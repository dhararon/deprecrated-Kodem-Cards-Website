import { Builder } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener __dirname equivalente en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// URL de la aplicación
const APP_URL = 'http://localhost:3000';

/**
 * Captura una captura de pantalla de la aplicación
 */
async function captureScreenshot() {
    let driver;

    try {
        console.log('Iniciando captura de pantalla con Selenium...');

        // Configurar opciones de Chrome
        const options = new chrome.Options();
        // No usamos headless para que se vea la ventana y los estilos correctamente
        options.addArguments('--start-maximized');
        options.addArguments('--disable-dev-shm-usage');
        options.addArguments('--no-sandbox');

        // Inicializar el driver
        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();

        // Navegar a la aplicación
        console.log(`Navegando a ${APP_URL}...`);
        await driver.get(APP_URL);

        // Esperar un poco para que se carguen completamente los estilos
        await driver.sleep(2000);

        // Crear directorio para capturas si no existe
        const screenshotsDir = path.join(__dirname, 'screenshots');
        if (!fs.existsSync(screenshotsDir)) {
            fs.mkdirSync(screenshotsDir, { recursive: true });
        }

        // Capturar una captura de pantalla
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const screenshotPath = path.join(screenshotsDir, `tailwind-styles-${timestamp}.png`);

        const screenshot = await driver.takeScreenshot();
        fs.writeFileSync(screenshotPath, screenshot, 'base64');

        console.log(`Captura de pantalla guardada en: ${screenshotPath}`);

        return screenshotPath;
    } catch (error) {
        console.error('Error al capturar la pantalla:', error);
        throw error;
    } finally {
        // Cerrar el navegador
        if (driver) {
            console.log('Cerrando el navegador...');
            await driver.quit();
        }
    }
}

// Si el script se ejecuta directamente (no se importa como módulo)
if (import.meta.url === `file://${process.argv[1]}`) {
    captureScreenshot().catch(err => {
        console.error('Error en la captura de pantalla:', err);
        process.exit(1);
    });
}

export { captureScreenshot }; 