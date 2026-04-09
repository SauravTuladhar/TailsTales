import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pageOjects/login.po';
const testData = require('../../fixtures/loginFixture.json');


test.beforeEach(async ({ page }) => {
    await page.goto('/');
})

test.describe('Valid login tests', () => {
    test('Login using valid username and password', async ({ page }) => {
        const login = new LoginPage(page);
        await login.login(testData.validUser.userName, testData.validUser.password);
        await login.verifyValidLogin();
    });
})

test.afterEach(async ({ page }) => {
    await page.close();
})