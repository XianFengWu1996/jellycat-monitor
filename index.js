"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const puppeteer_1 = require("puppeteer");
const puppeteer_extra_1 = __importDefault(require("puppeteer-extra"));
const puppeteer_extra_plugin_stealth_1 = __importDefault(require("puppeteer-extra-plugin-stealth"));
const twilio_1 = __importDefault(require("twilio"));
const user_agents_1 = __importDefault(require("user-agents"));
const cron_1 = require("cron");
dotenv_1.default.config();
const userAgent = new user_agents_1.default();
const client = (0, twilio_1.default)(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
// run iife
(() => {
    // get all the urls from the environment variables
    const urls = process.env.MONITOR_URLS.split(',');
    urls.map((url) => {
        try {
            // run the cron job every 15 minutes
            const task = new cron_1.CronJob('*/15 * * * *', () => monitor(url, task));
            task.start();
            console.log('url:' + url, task);
        }
        catch (error) {
            console.log(error);
        }
    });
})();
function monitor(url, task) {
    return __awaiter(this, void 0, void 0, function* () {
        puppeteer_extra_1.default.use((0, puppeteer_extra_plugin_stealth_1.default)());
        const browser = yield puppeteer_extra_1.default.launch({
            executablePath: (0, puppeteer_1.executablePath)(),
        }); // launch the browser
        const page = yield browser.newPage(); // open a new page
        yield page.setViewport({
            width: 1920,
            height: 1280,
            deviceScaleFactor: 1,
        });
        yield page.goto(url);
        yield page.setUserAgent(userAgent.random().toString()); // set a random user agent
        const itemName = yield page.$eval('#ProductHeadingNotNarrow > h1', (el) => el.textContent);
        const availability = yield page.$eval('#variant-grid-area > div.pl2-notnarrow > div.pt0-5 > div.mt0-25 > span.inline-block.align-left', (el) => el.textContent);
        if (availability && formatAvailablity(availability) === 'instock') {
            yield client.messages.create({
                body: `${itemName} is now in stock. ${url}`,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: process.env.VERIFY_PHONE_NUMBER,
            });
            console.log(task);
            task.stop();
        }
        console.log(availability);
        yield page.screenshot({ path: 'screenshot.png' });
        yield browser.close(); // close the browser
    });
}
const formatAvailablity = (s) => {
    return s.replace(/\s/g, '').toLowerCase(); // remove the space and make it lowercase for comparison
};
