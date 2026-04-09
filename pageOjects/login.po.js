const { expect } = require("@playwright/test");

exports.LoginPage = class LoginPage {
    constructor(page) {
        this.page = page;
        this.loginHeader = '//a[@id="headerLoginButton"]';
        this.emailLogin = '//button[@id="switch-to-email"]';
        this.usernameInput = '//input[@id="user-email"]';;
        this.passwordInput = '//input[@id="user-password"]';
        this.loginButton = '//button[@class="button login-email"]';
        this.closeBuyPopup = '//button[@id="close-sub"]';
        this.logOut = '//button[@id="logout"]';
        this.loginValidation = '//p[contains(text(),"Click on any contact to view the Contact Details")]';
        this.alertMessage = '//span[@id="error"]';
    }

    // async login(username, password) {
    //     const [newPagePromise] = await Promise.all([
    //         this.page.context().waitForEvent('page'), // Waits for new tab
    //         (async () => {
    //             await this.page.locator(this.loginHeader).click();
    //             await this.page.locator(this.emailLogin).click();
    //             await this.page.locator(this.usernameInput).fill(username);
    //             await this.page.locator(this.passwordInput).fill(password);
    //             await this.page.locator(this.loginButton).click({ delay: 1000 });
    //         })()
    //     ]);
    
    //     // const buyTab = await newPagePromise;
    //     // await buyTab.waitForLoadState(); // Ensure the new tab has loaded
    
    //     // // Optional: log the URL or do any checks
    //     // console.log('Buy tab opened at:', buyTab.url());
    
    //     // // Close the new tab
    //     // await buyTab.close();
    
    //     // // Return to the original page (this.page is still the original)
    //     // await this.page.bringToFront(); // Ensure it's focused (optional)

    //     // Selector for popup close button (adjust as needed)
    // const popupCloseBtn = await this.page.locator(this.closeBuyPopup);

    // // Race between new tab and popup
    // const result = await Promise.race([
    //     newPagePromise.then(page => ({ type: 'tab', page })),
    //     popupCloseBtn.waitFor({ state: 'visible', timeout: 5000 })
    //         .then(() => ({ type: 'popup' }))
    // ]);

    // // 👉 Handle new tab
    // if (result?.type === 'tab' && result.page) {
    //     const buyTab = result.page;
    //     await buyTab.waitForLoadState();
    //     console.log('New tab opened at:', buyTab.url());
    //     await buyTab.close();
    // }

    // // 👉 Handle popup
    // if (result?.type === 'popup') {
    //     console.log('Popup appeared — closing it');
    //     await popupCloseBtn.click();
    // }


    async login(username, password) {
        const context = this.page.context();
    
        // 👂 Start listening for new tab (DO NOT await)
        const newPagePromise = context.waitForEvent('page');
    
        await this.page.locator(this.loginHeader).click();
        await this.page.locator(this.emailLogin).click();
        await this.page.locator(this.usernameInput).fill(username);
        await this.page.locator(this.passwordInput).fill(password);
        await this.page.locator(this.loginButton).click({ delay: 1000 });
    
        const popupCloseBtn = this.page.locator(this.closeBuyPopup);
    
        const result = await Promise.race([
            newPagePromise.then(page => ({ type: 'tab', page })),
            popupCloseBtn
                .waitFor({ state: 'visible', timeout: 5000 })
                .then(() => ({ type: 'popup' }))
        ]);
    
        if (result.type === 'tab') {
            await result.page.waitForLoadState();
            console.log('New tab opened at:', result.page.url());
            await result.page.close();
        }
    
        if (result.type === 'popup') {
            console.log('Popup appeared — closing it');
            await popupCloseBtn.click();
        }
    }    
    
}