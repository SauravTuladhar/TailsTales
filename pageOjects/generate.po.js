const { expect } = require('@playwright/test');
const fs = require("fs");
const path = require("path");
const https = require("https");
const text2image = require('text-to-image');
const ffmpeg = require('fluent-ffmpeg');
const googleTTS = require('google-tts-api');
const { uploadVideo } = require('./../utils/youtubeUpload.js');
const generate = require('./../fixtures/generateFixture.json');

let quoteReceived, videoPath;

exports.GeneratePage = class GeneratePage {
    constructor(page) {
        this.page = page;
        this.prompt = '//textarea[@id="generate-textarea"]';
        this.submit = '//button[@id="modelSubmitButton"]';
        this.downloadButton = '//button[@id="download-button"]';
        this.imageGenerator = '//a[@class="button headerbutton imagegenerator"]';

        this.quote = `//textarea[contains(text(),"${generate.QuoteContent}")]//following::p[1]`;
        this.chat = '//a[@class="button headerbutton aichat"]';
        this.chatPrompt = '//textarea[@placeholder="Message AI Chat..."]';
        this.chatSubmit = '//button[@id="chatSubmitButton"]';
        this.qualityButton = '//button[@id="modelQualityButton"]';
        this.tryItError = '//h2[@id="tryItResultError"]//pre';
    }

    async generateQuote(prompt) {
        console.log(`🚀 Generating quote from prompt: "${prompt}" via DeepAI UI`);

        await this.page.locator(this.chat).click({ delay: 2000 });
        await this.page.locator(this.chatPrompt).fill(prompt, { delay: 2000 });
        await this.page.locator(this.chatSubmit).click({ delay: 2000 });
        await this.page.waitForTimeout(6000); // Wait for image generation
        console.log('✅ Quote generation complete');

        quoteReceived = await this.page.locator(this.quote).textContent();
        console.log("📜 Retrieved Quote:", quoteReceived);
    }

    async generate(prompt) {
        console.log(`🚀 Generating image from prompt: "${prompt}" via DeepAI UI`);

        await this.page.locator(this.imageGenerator).click({ delay: 2000 });
        await this.page.locator(this.prompt).fill(prompt, { delay: 2000 });
        await this.page.locator(this.qualityButton).click({ delay: 1000 });

        const submitButton = this.page.locator(this.submit);
        const errorLocator = this.page.locator(this.tryItError);
        const downloadBtnLocator = this.page.locator(this.downloadButton);

        let attempt = 0;
        while (true) {
            attempt++;
            console.log(`🔁 Attempt #${attempt} to submit`);
            await submitButton.click({ delay: 2000 });

            // Wait for potential error or success
            await this.page.waitForTimeout(5000);

            const errorVisible = await errorLocator.isVisible();
            const downloadVisible = await downloadBtnLocator.isVisible();

            if (!errorVisible && downloadVisible) {
                console.log('✅ Image generation successful, download button is visible');
                break;
            }

            console.log('❌ Error message still visible or download button not yet available, retrying...');
        }
    }

    async downloadImage() {
        console.log('🚀 Waiting for image download');
        await this.page.waitForTimeout(6000);

        const downloadButton = this.page.locator(this.downloadButton);
        await downloadButton.waitFor({ state: 'visible' });

        const [download] = await Promise.all([
            this.page.waitForEvent('download'),
            downloadButton.click()
        ]);

        const saveDir = './resources/';
        fs.mkdirSync(saveDir, { recursive: true });

        const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
        const savePath = path.join(saveDir, `image${timestamp}.png`);

        await download.saveAs(savePath);
        this.imagePath = savePath;
        console.log(`✅ Image downloaded to: ${savePath}`);
        
        return await this.createVideo(quoteReceived);
    }

    async createVideo(quoteText) {
        const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
        const imagePath = this.imagePath;
        const outputVideo = `./resources/video${timestamp}.mp4`;
        const overlayImage = `./resources/overlay${timestamp}.png`;
        const ttsAudioPath = `./resources/audio${timestamp}.mp3`;

        fs.mkdirSync('./resources/', { recursive: true });

        // Generate overlay image from quote text
        const dataUri = await text2image.generate(quoteText, {
            maxWidth: 600,
            fontSize: 30,
            fontFamily: 'Arial',
            lineHeight: 40,
            margin: 20,
            bgColor: 'transparent',
            textColor: 'white',
            customHeight: 400
        });

        // Log generated base64 data
        // console.log('Generated base64 data:', dataUri);

        // Safe base64 decoding and additional checks
        const base64Data = dataUri.split(',')[1];
        if (!base64Data) {
            throw new Error('❌ Invalid image base64 from text-to-image.');
        }

        try {
            const buffer = Buffer.from(base64Data, 'base64');
            fs.writeFileSync(overlayImage, buffer);

            // Check if the overlay image is valid
            const stats = fs.statSync(overlayImage);
            // console.log(`✅ Overlay image saved: ${overlayImage}, size: ${stats.size} bytes`);
        } catch (err) {
            console.error('❌ Error saving overlay image:', err.message);
            return;
        }

        // Ensure overlay image exists
        if (!fs.existsSync(overlayImage)) {
            console.error('❌ Overlay image does not exist!');
            return;
        }

        // Get TTS audio from Google
        // const ttsUrl = googleTTS.getAudioUrl(quoteText, {
        //     lang: 'en',
        //     slow: false,
        //     host: 'https://translate.google.com',
        // });

        // await this.downloadAudio(ttsUrl, ttsAudioPath);

        let audioBuffer = Buffer.alloc(0);

        if (quoteText.length <= 200) {
         // Single request
        const ttsUrl = googleTTS.getAudioUrl(quoteText, {
        lang: 'en',
        slow: false,
        host: 'https://translate.google.com',
        });
        await this.downloadAudio(ttsUrl, ttsAudioPath);
        } else {
        // Use getAllAudioUrls for longer text
        const audioUrls = await googleTTS.getAllAudioUrls(quoteText, {
        lang: 'en',
        slow: false,
        host: 'https://translate.google.com',
        splitPunct: ',.?!',
    });

    // Download and combine all parts
    for (const [i, { url }] of audioUrls.entries()) {
        const tempPath = `./resources/part${i}.mp3`;
        await this.downloadAudio(url, tempPath);
        const partBuffer = fs.readFileSync(tempPath);
        audioBuffer = Buffer.concat([audioBuffer, partBuffer]);
        fs.unlinkSync(tempPath); // Clean up part
    }

    fs.writeFileSync(ttsAudioPath, audioBuffer);
}

        if (!fs.existsSync(ttsAudioPath)) {
            console.error('❌ Audio file not found:', ttsAudioPath);
            return;
        }

        const audioStats = fs.statSync(ttsAudioPath);
        // console.log(`🎧 Audio file size: ${audioStats.size} bytes`);

        if (audioStats.size < 1000) {
            console.warn('⚠️ Warning: Audio file may be too small or invalid.');
        }

        // FFmpeg processing
        return new Promise((resolve, reject) => {
            ffmpeg()
                .input(imagePath) // loop still image
                .input(ttsAudioPath)
                .input(overlayImage)
                .inputOptions('-loop 1') // Treat the overlay image as a video stream
                // .inputFormat('mp3')
                .audioCodec('aac')
                .complexFilter("[0:v][2:v]overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2[outv]")
                .outputOptions([
                    '-c:v libx264',
                    '-c:a libmp3lame',
                    '-b:a 192k',
                    '-pix_fmt yuv420p',
                    '-shortest',
                    '-map [outv]',
                    '-map 1:a',
                    '-y'
                ])
                .output(outputVideo)
                .on('start', cmd => ('🔧 FFmpeg command:\n', cmd))
                .on('stderr', line => ('🛠 FFmpeg log:', line))
                // .on('start', cmd => console.log('🔧 FFmpeg command:\n', cmd))
                // .on('stderr', line => console.log('🛠 FFmpeg log:', line))
                .on('end', () => {
                    console.log(`🎬 Video created at: ${outputVideo}`);
                    videoPath = outputVideo;
                    const shortQuote = "The Shocking Truth About Pets and Happiness";
                    const quoteForTitle = quoteText.length < 100 ? quoteText : shortQuote;
                    uploadVideo(
                    outputVideo,
                    quoteForTitle,
                       quoteText + ". Get ready to howl with Laughter with this hilarious dog quote that will leave you paws-itively entertained! From funny dog sayings to adorable canine quotes, we've got the best dog quotes that will make you go WOOF out loud! Whether you're a dog lover or just need a pick-me-up, this dog quote is sure to put a smile on your face and make your tail wag. So sit back, relax, and get ready to WOOF out loud with this side-splitting dog quote!"
                    );
                    // uploadVideo(outputVideo, quoteText, "Get ready to howl with Laughter with this hilarious dog quote that will leave you paws-itively entertained! From funny dog sayings to adorable canine quotes, we've got the best dog quotes that will make you go WOOF out loud! Whether you're a dog lover or just need a pick-me-up, this dog quote is sure to put a smile on your face and make your tail wag. So sit back, relax, and get ready to WOOF out loud with this side-splitting dog quote!");
                    resolve({ videoPath: outputVideo, quoteText });
                })
                .on('error', err => {
                    console.error('❌ FFmpeg error:', err.message);
                    reject(err);
                })
                .run();
        });
    }

    async downloadAudio(url, filepath) {
        return new Promise((resolve, reject) => {
            const file = fs.createWriteStream(filepath);
            https.get(url, (response) => {
                response.pipe(file);
                file.on('finish', () => {
                    file.close(resolve);
                });
            }).on('error', reject);
        });
    }
}