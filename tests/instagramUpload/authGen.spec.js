const { chromium } = require('@playwright/test');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome',
    args: ['--start-maximized']
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('https://www.instagram.com/accounts/login/');
  console.log('🔐 Please log in manually and wait for feed to load...');
  await page.waitForTimeout(6000);
  // await page.pause(); // Allow manual login

  // 🔄 Wait for user to reach the home/feed page
  await page.waitForURL('https://www.instagram.com', { timeout: 60_000 });
  console.log('🔐 URL verified...');

  await context.storageState({ path: 'auth/instagram-auth.json' });
  await browser.close();

  console.log('✅ Session saved to auth/instagram-auth.json');
})();

