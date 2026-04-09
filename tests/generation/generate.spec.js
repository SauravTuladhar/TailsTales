import { test } from '@playwright/test';
import fs from 'fs';
import { GeneratePage } from '../../pageOjects/generate.po';
import { LoginPage } from '../../pageOjects/login.po';
import { InstagramPage } from '../../pageOjects/instagramUpload.po';
import * as dotenv from 'dotenv';
dotenv.config();

const logintestData = require('../../fixtures/loginFixture.json');
const generatetestData = require('../../fixtures/generateFixture.json');

test.describe.serial('Automated Quote Video Flow', () => {

    test('Generate quote, image and video', async ({ page }) => {
        const login = new LoginPage(page);
        const gene = new GeneratePage(page);
        await page.goto('/');
        await login.login(logintestData.validUser.userName, logintestData.validUser.password);
        await gene.generateQuote(generatetestData.QuoteContent);
        await gene.generate(generatetestData.ImageContent);
        const result = await gene.downloadImage();
        fs.writeFileSync('./output.json', JSON.stringify(result, null, 2));
        console.log(`✅ Output saved to output.json: ${result.videoPath, result.quoteText}`);
    });

    test('Upload video to Instagram using new browser session', async ({ browser }) => {
        // Step 1: Read the video path and quote from output file
        if (!fs.existsSync('./output.json')) {
            throw new Error('❌ output.json not found. Run the generation test first.');
        }
        const { videoPath, quoteText } = JSON.parse(fs.readFileSync('./output.json', 'utf-8'));
        const page = await browser.newPage();
        const insta = new InstagramPage(page);
        await insta.uploadVideo(videoPath, quoteText);
        console.log('📤 Video uploaded to Instagram!');
    });

});
