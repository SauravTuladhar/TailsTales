const path = require('path');

exports.InstagramPage = class InstagramPage {
    constructor(page) {
        this.page = page;
        this.usernameInput = '//input[@aria-label="Phone number, username, or email"]';
        this.passwordInput = '//input[@aria-label="Password"]';
        this.loginButton = '//button[@type="submit"]';
        this.createButton = '//span[(text()="Create")]//preceding::div[2]';
        this.selectFromComputer = '//button[(text()="Select from computer")]';
        this.okButton = '//button[(text()="OK")]';
        this.nextButton = '//div[(text()="Next")]';
        this.captionInput = '//div[@aria-label="Write a caption..."]';
        this.shareButton = '//div[(text()="Share")]';
        this.createPost = '//span[(text()="Post")]';
        this.reelSaved = '//h3[text()="Your reel has been shared."] | //*[text()="Your post was shared."]'
        this.messagingPopup = '//div[contains(text(),"OK")]'
    }

    async login(username, password) {
        console.log('🌐 Navigating to Instagram login...');
        await this.page.goto('https://www.instagram.com/accounts/login/');
        await this.page.waitForTimeout(1000);
        try {
            await this.page.waitForSelector(this.usernameInput, { timeout: 10000 });
            await this.page.fill(this.usernameInput, username);
            await this.page.fill(this.passwordInput, password);
            await this.page.click(this.loginButton);    
            console.log('✅ Logged in to Instagram');
        } catch (err) {
            console.error('❌ Instagram login failed:', err);
        }
    }

    async uploadVideo(videoPath, caption) {
        console.log('🌐 Navigating to Instagram...');
        await this.page.goto('https://www.instagram.com/accounts/login/');
        await this.page.waitForTimeout(1000);
        // await this.page.click(this.messagingPopup);
        // await this.page.waitForTimeout(1000);
        const [fileChooser] = await Promise.all([
            this.page.waitForEvent('filechooser'),
            await this.page.waitForSelector(this.createButton, { timeout: 10000 }),
            await this.page.click(this.createButton),
            await this.page.waitForSelector(this.createPost, { timeout: 10000 }),
            await this.page.click(this.createPost),
            await this.page.waitForSelector(this.selectFromComputer, { timeout: 10000 }),
            await this.page.click(this.selectFromComputer),
        ]);
        await fileChooser.setFiles(videoPath);
        await this.page.waitForTimeout(2000);
        await this.page.click(this.okButton);
        await this.page.click(this.nextButton);
        await this.page.waitForTimeout(2000);
        await this.page.click(this.nextButton);
        await this.page.waitForTimeout(2000);
        await this.page.fill(this.captionInput, caption + " #petquotes #petlovers #cutepets #petsarefamily #petlove #dogquotes #catquotes #furryfriends #petsofinstagram #inspirationalquotes #quoteoftheday #feelgoodvibes #positivity #animalwisdom #kindnessquotes #dailyquotes #petinspiration #reelsinstagram #viralreels #reelitfeelit #shortsvideo #explorepage #petreels #animalreels #viralpet #dogquote #ai");
        await this.page.click(this.shareButton);
        console.log('📤 Video uploading to Instagram...');
        await this.page.waitForTimeout(12000);
        const reelsSaved = this.page.locator(this.reelSaved);
        await reelsSaved.waitFor({ state: 'visible' }); 
    }
};