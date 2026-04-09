import { test } from '@playwright/test';
import { InstagramPage } from '../../pageOjects/instagramUpload.po';
const path = require('path');
require('dotenv').config();

test('Upload Video to Instagram', async ({ page }) => {
    const insta = new InstagramPage(page);
    const video = path.resolve('./resources/video202505051415.mp4');
    const caption = "Dogs can learn over 100 words and commands. #petquotes #petlovers #cutepets #petsarefamily #petlove #dogquotes #catquotes #furryfriends #petsofinstagram #inspirationalquotes #quoteoftheday #feelgoodvibes #positivity #animalwisdom #kindnessquotes #dailyquotes #petinspiration #reelsinstagram #viralreels #reelitfeelit #shortsvideo #explorepage #petreels #animalreels #viralpet #dogquote #ai";

    // await insta.login(process.env.INSTAGRAM_USER, process.env.INSTAGRAM_PASS);
    await insta.uploadVideo(video, caption);
});
