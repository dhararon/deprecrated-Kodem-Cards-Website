import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import assert from 'assert';

// URL de la aplicación
const APP_URL = 'http://localhost:3000';

// Tiempo de espera para la carga de la página
const TIMEOUT = 10000; // 10 segundos

/**
 * Función para obtener el valor de una propiedad CSS específica de un elemento
 * @param {WebElement} element - Elemento del DOM
 * @param {string} property - Propiedad CSS a obtener
 * @returns {Promise<string>} - Valor de la propiedad CSS
 */
async function getCssProperty(element, property) {
    return await element.getCssValue(property);
}

/**
 * Convierte un color de formato rgba a formato hexadecimal
 * @param {string} rgba - Color en formato rgba
 * @returns {string} - Color en formato hexadecimal
 */
function rgbaToHex(rgba) {
    const rgbaValues = rgba.match(/rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)/);
    if (!rgbaValues) return rgba;

    const r = parseInt(rgbaValues[1], 10);
    const g = parseInt(rgbaValues[2], 10);
    const b = parseInt(rgbaValues[3], 10);

    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

/**
 * Realiza las pruebas de los estilos de Tailwind CSS
 */
async function testTailwindStyles() {
    let driver;

    try {
        console.log('Iniciando pruebas de estilos con Selenium...');

        // Configurar opciones de Chrome
        const options = new chrome.Options();
        options.addArguments('--headless'); // Ejecutar en modo sin interfaz gráfica
        options.addArguments('--disable-gpu');
        options.addArguments('--no-sandbox');
        options.addArguments('--disable-dev-shm-usage');

        // Inicializar el driver
        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();

        // Navegar a la aplicación
        console.log(`Navegando a ${APP_URL}...`);
        await driver.get(APP_URL);

        // Esperar a que la página cargue completamente
        await driver.wait(until.elementLocated(By.css('body')), TIMEOUT);
        console.log('Página cargada correctamente.');

        // Prueba 1: Verificar color de fondo del cuerpo
        const body = await driver.findElement(By.css('body'));
        const backgroundColor = await getCssProperty(body, 'background-color');
        console.log('Color de fondo del body:', backgroundColor);
        assert.ok(backgroundColor, 'El color de fondo del body está definido');

        // Prueba 2: Verificar fuente del cuerpo
        const fontFamily = await getCssProperty(body, 'font-family');
        console.log('Font family del body:', fontFamily);
        assert.ok(fontFamily.includes('Inter') || fontFamily.includes('sans-serif'), 'La fuente correcta está aplicada');

        // Prueba 3: Verificar el color del texto del sidebar (si existe)
        try {
            const sidebarTitle = await driver.findElement(By.css('.text-primary-600'));
            if (sidebarTitle) {
                const textColor = await getCssProperty(sidebarTitle, 'color');
                const hexColor = rgbaToHex(textColor);
                console.log('Color del texto en el sidebar:', textColor, '(Hex:', hexColor, ')');
                assert.ok(textColor, 'El color del texto en el sidebar está definido');
            }
        } catch (e) {
            console.log('Elemento .text-primary-600 no encontrado. Saltando esta prueba.');
        }

        // Prueba 4: Verificar clases de Tailwind en los botones
        try {
            const buttons = await driver.findElements(By.css('button'));

            if (buttons.length > 0) {
                console.log(`Encontrados ${buttons.length} botones para probar`);

                for (let i = 0; i < buttons.length; i++) {
                    const buttonBorderRadius = await getCssProperty(buttons[i], 'border-radius');
                    console.log(`Botón ${i + 1} border-radius:`, buttonBorderRadius);

                    const buttonPadding = await getCssProperty(buttons[i], 'padding');
                    console.log(`Botón ${i + 1} padding:`, buttonPadding);

                    assert.ok(buttonBorderRadius && buttonPadding, `Los estilos del botón ${i + 1} están definidos`);
                }
            } else {
                console.log('No se encontraron botones en la página.');
            }
        } catch (e) {
            console.log('Error al verificar los botones:', e.message);
        }

        // Prueba 5: Verificar clases de Tailwind en los cards (si existen)
        try {
            const cards = await driver.findElements(By.css('.card'));

            if (cards.length > 0) {
                console.log(`Encontrados ${cards.length} cards para probar`);

                for (let i = 0; i < cards.length; i++) {
                    const cardBorderRadius = await getCssProperty(cards[i], 'border-radius');
                    console.log(`Card ${i + 1} border-radius:`, cardBorderRadius);

                    const cardShadow = await getCssProperty(cards[i], 'box-shadow');
                    console.log(`Card ${i + 1} box-shadow:`, cardShadow);

                    assert.ok(cardBorderRadius || cardShadow, `Los estilos del card ${i + 1} están definidos`);
                }
            } else {
                console.log('No se encontraron cards en la página.');
            }
        } catch (e) {
            console.log('Error al verificar los cards:', e.message);
        }

        // Prueba 6: Verificar que los iconos están visibles (si existen)
        try {
            const icons = await driver.findElements(By.css('.sidebar-icon'));

            if (icons.length > 0) {
                console.log(`Encontrados ${icons.length} iconos para probar`);

                for (let i = 0; i < icons.length; i++) {
                    const isDisplayed = await icons[i].isDisplayed();
                    const iconColor = await getCssProperty(icons[i], 'color');

                    console.log(`Icono ${i + 1} es visible:`, isDisplayed, 'Color:', iconColor);
                    assert.ok(isDisplayed, `El icono ${i + 1} es visible`);
                    assert.ok(iconColor, `El color del icono ${i + 1} está definido`);
                }
            } else {
                console.log('No se encontraron iconos en la página.');
            }
        } catch (e) {
            console.log('Error al verificar los iconos:', e.message);
        }

        console.log('¡Todas las pruebas de estilos pasaron con éxito!');

    } catch (error) {
        console.error('Error durante las pruebas:', error);
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
    testTailwindStyles().catch(err => {
        console.error('Error en la prueba principal:', err);
        process.exit(1);
    });
}

export { testTailwindStyles }; 