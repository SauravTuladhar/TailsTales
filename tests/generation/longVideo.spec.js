import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fetchAndCombineShorts, lastFetchedTitles } from '../shortsToLong';
import { uploadVideo } from '../../utils/youtubeUpload';

test.describe.serial('Automated Upload Long Video', () => {

    test('Upload long video', async ({ page }) => {
        const VIDEOS_DIR = path.join(__dirname, '../../resources/longVideo');
        const videoPath = path.join(VIDEOS_DIR, 'output.mp4');

        // Generate long video if not exists
        if (!fs.existsSync(videoPath)) {
            console.log('⚡ Long video not found. Generating from Shorts...');
            await fetchAndCombineShorts();
        }

        // Title & description dynamically from Shorts
        const title = `Latest top ${lastFetchedTitles.length} Shorts Compilation – TailsAndTales1`;
        const description = lastFetchedTitles
            .map((t, idx) => `${idx + 1}. ${t}`)
            .join('\n');

        // Upload
        await new Promise((resolve, reject) => {
            // monkey-patch console.log inside uploadVideo to detect completion
            const originalLog = console.log;
            console.log = (msg, ...args) => {
                originalLog(msg, ...args);
                if (typeof msg === 'string' && msg.includes('🎉 Video uploaded successfully')) {
                    console.log = originalLog; // restore
                    resolve();
                }
            };

            uploadVideo(videoPath, title, description);
        });

        console.log('✅ Upload completed, test finished');
    });

});