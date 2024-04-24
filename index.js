const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

const app = express();
app.use(cors({
    origin: ['https://aniplay.lol/', 'http://aniplaynow.live/']
}));

app.get('/', (req, res) => {
    res.send('Hello Deno!');
});

app.get("/download", async (req, res) => {
    const url = req.query.url;
    let options = {};
    if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
        const chromium = require("@sparticuz/chromium");
        options = {
            args: [...chromium.args, "--hide-scrollbars", "--disable-web-security", '--disable-extensions'],
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        };
    } else {
        options = {
            headless: chromium.headless,
        };
    }

    try {
        const browser = await puppeteer.launch(options);
        const page = await browser.newPage();
        await page.goto(url.replace("https://gogohd.net", "https://embtaku.pro"));
        await page.screenshot({ path: "test.png" });
        await page.waitForFunction(() => document.querySelector('a[href*="download.php"]'));
        const html = await page.content();
        const $ = cheerio.load(html);
        const downloads = $("a").toArray();
        const downloadLinks = downloads.map((x, index) => ({ quality: `${[360, 480, 720, 1080][index-1]}p`, link: x.attribs.href })).filter(({ link }) => link.includes("download.php"));
        await browser.close();
        res.json(downloadLinks);
    } catch (error) {
        res.json({ error: error.message });
    }
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
})

module.exports = app;