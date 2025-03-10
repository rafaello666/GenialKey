"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
(0, test_1.test)('has title', async ({ page }) => {
    await page.goto('/');
    // Expect h1 to contain a substring.
    (0, test_1.expect)(await page.locator('h1').innerText()).toContain('Welcome');
});
