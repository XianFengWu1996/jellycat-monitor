import dotenv from 'dotenv';
import { executablePath } from 'puppeteer';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import twilio from 'twilio';
import UserAgent from 'user-agents';
import { CronJob } from 'cron';

dotenv.config();

const userAgent = new UserAgent();

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// run iife
(() => {
  // get all the urls from the environment variables
  const urls = process.env.MONITOR_URLS.split(',');

  urls.map((url) => {
    try {
      // run the cron job every 15 minutes
      const task: CronJob = new CronJob('*/15 * * * *', () =>
        monitor(url, task)
      );
      task.start();

      console.log('url:' + url, task);
    } catch (error) {
      console.log(error);
    }
  });
})();

async function monitor(url: string, task: CronJob) {
  puppeteer.use(StealthPlugin());

  const browser = await puppeteer.launch({
    executablePath: executablePath(),
  }); // launch the browser
  const page = await browser.newPage(); // open a new page
  await page.setViewport({
    width: 1920,
    height: 1280,
    deviceScaleFactor: 1,
  });

  await page.goto(url);

  await page.setUserAgent(userAgent.random().toString()); // set a random user agent

  const itemName = await page.$eval(
    '#ProductHeadingNotNarrow > h1',
    (el) => el.textContent
  );

  const availability = await page.$eval(
    '#variant-grid-area > div.pl2-notnarrow > div.pt0-5 > div.mt0-25 > span.inline-block.align-left',
    (el) => el.textContent
  );

  if (availability && formatAvailablity(availability) === 'instock') {
    await client.messages.create({
      body: `${itemName} is now in stock. ${url}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: process.env.VERIFY_PHONE_NUMBER,
    });

    console.log(task);

    task.stop();
  }

  console.log(availability);

  await page.screenshot({ path: 'screenshot.png' });

  await browser.close(); // close the browser
}

const formatAvailablity = (s: string) => {
  return s.replace(/\s/g, '').toLowerCase(); // remove the space and make it lowercase for comparison
};
