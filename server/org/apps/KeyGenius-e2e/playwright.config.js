"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const preset_1 = require("@nx/playwright/preset");
const devkit_1 = require("@nx/devkit");
// For CI, you may want to set BASE_URL to the deployed application.
const baseURL = process.env['BASE_URL'] || 'http://localhost:3000';
/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();
/**
 * See https://playwright.dev/docs/test-configuration.
 */
exports.default = (0, test_1.defineConfig)({
    ...(0, preset_1.nxE2EPreset)(__filename, { testDir: './src' }),
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        baseURL,
        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: 'on-first-retry'
    },
    /* Run your local dev server before starting the tests */
    webServer: {
        command: 'npx nx run KeyGenius:start',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        cwd: devkit_1.workspaceRoot
    },
    projects: [
        {
            name: 'chromium',
            use: { ...test_1.devices['Desktop Chrome'] }
        },
        {
            name: 'firefox',
            use: { ...test_1.devices['Desktop Firefox'] }
        },
        {
            name: 'webkit',
            use: { ...test_1.devices['Desktop Safari'] }
        }
        // Uncomment for mobile browsers support
        /* {
          name: 'Mobile Chrome',
          use: { ...devices['Pixel 5'] },
        },
        {
          name: 'Mobile Safari',
          use: { ...devices['iPhone 12'] },
        }, */
        // Uncomment for branded browsers
        /* {
          name: 'Microsoft Edge',
          use: { ...devices['Desktop Edge'], channel: 'msedge' },
        },
        {
          name: 'Google Chrome',
          use: { ...devices['Desktop Chrome'], channel: 'chrome' },
        } */
    ]
});
