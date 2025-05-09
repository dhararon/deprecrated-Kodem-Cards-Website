import { defineConfig } from 'cypress';

export default defineConfig({
    e2e: {
        baseUrl: 'http://localhost:5173',
        supportFile: 'cypress/support/e2e.ts',
        specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
        experimentalStudio: true,
        experimentalRunAllSpecs: true,
        viewportWidth: 1280,
        viewportHeight: 720,
        screenshotOnRunFailure: true,
        video: true,
        videoCompression: 32,
        defaultCommandTimeout: 10000,
        retries: {
            runMode: 2,
            openMode: 0,
        },
    },
    component: {
        devServer: {
            framework: 'react',
            bundler: 'vite',
        },
        supportFile: 'cypress/support/component.ts',
        specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}',
        indexHtmlFile: 'cypress/support/component-index.html',
    },
}); 