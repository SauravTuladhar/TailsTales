// utils/fetchAndCombineShorts.js
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHANNEL_NAME = 'TailsAndTales1'; // Replace with your channel
const MAX_SHORTS = 10;
const VIDEOS_DIR = path.join(__dirname, '../resources/longVideo');

export let lastFetchedTitles = []; // Will hold titles for description

function runCommand(cmd) {
    try {
        execSync(cmd, { stdio: 'inherit' });
    } catch (e) {
        console.error(`❌ Command failed: ${cmd}`);
    }
}

export async function fetchAndCombineShorts() {
    lastFetchedTitles = [];

    // Step 0: Check yt-dlp
    try {
        execSync('yt-dlp --version', { stdio: 'ignore' });
    } catch (e) {
        console.log('❌ yt-dlp is not installed. Install via brew or pip.');
        return;
    }

    // Step 1: Prepare folders
    if (!fs.existsSync(VIDEOS_DIR)) fs.mkdirSync(VIDEOS_DIR, { recursive: true });

    // Step 2: Download Shorts & fetch titles
    console.log('🔍 Downloading latest Shorts via yt-dlp...');
    const shortsUrl = `https://www.youtube.com/@${CHANNEL_NAME}/shorts`;

    for (let i = 1; i <= MAX_SHORTS; i++) {
        const filename = path.join(VIDEOS_DIR, `video_${i - 1}.mp4`);
        if (fs.existsSync(filename)) {
            console.log(`⚡ Skipping already downloaded: ${filename}`);
            // Fetch title anyway
            const info = execSync(`yt-dlp -j --playlist-items ${i} "${shortsUrl}" --quiet --no-progress`);
            const json = JSON.parse(info.toString());
            lastFetchedTitles.push(json.title);
            continue;
        }

        console.log(`⬇️ Downloading video #${i}`);
        // Download video
        // runCommand(`yt-dlp "${shortsUrl}" --playlist-items ${i} -f mp4 -o "${filename}" --quiet --no-progress`);
        runCommand(`yt-dlp "${shortsUrl}" --playlist-items ${i} -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4" -o "${filename}" --no-warnings --quiet --js-runtimes node`);

        // Fetch title
        const info = execSync(`yt-dlp -j --playlist-items ${i} "${shortsUrl}" --quiet --no-progress`);
        const json = JSON.parse(info.toString());
        lastFetchedTitles.push(json.title);
    }

    // Step 3: Prepare FFmpeg file list
    const downloadedFiles = fs.readdirSync(VIDEOS_DIR)
        .filter(f => f.endsWith('.mp4'))
        .map(f => `file '${f}'`)
        .join('\n');

    if (!downloadedFiles) {
        console.log('❌ No videos downloaded. Merge skipped.');
        return;
    }

    const fileListPath = path.join(VIDEOS_DIR, 'filelist.txt');
    fs.writeFileSync(fileListPath, downloadedFiles);

    // Step 4: Merge videos using FFmpeg (proper vertical 720x1280, keep audio)
    const outputPath = path.join(VIDEOS_DIR, 'output.mp4');
    console.log('🎬 Combining videos into output.mp4...');
    runCommand(`cd "${VIDEOS_DIR}" && ffmpeg -y -f concat -safe 0 -i filelist.txt -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2" -r 30 -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k -y -loglevel error  output.mp4`);

    console.log('✅ Done! Combined video at:', outputPath);
    console.log('🎯 Long video title:', `Latest ${lastFetchedTitles.length} Shorts Compilation – ${CHANNEL_NAME}`);
    console.log('📝 Long video description:\n', lastFetchedTitles.map((t, idx) => `${idx+1}. ${t}`).join('\n'));
}