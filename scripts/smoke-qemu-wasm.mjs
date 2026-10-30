import { createRequire } from "node:module";
const require = createRequire(new URL("../webdroid/qemu-smoke/package.json", import.meta.url));
const { chromium } = require("playwright");

const origin = process.env.WEBDROID_TEST_ORIGIN || "http://127.0.0.1:8765";
const cases = [
  { name: "ARM64 Raspberry Pi / BusyBox Linux", path: "/qemu-smoke/raspi3ap.html" },
  { name: "x86_64 PC / Alpine Linux", path: "/qemu-smoke/alpine-x86_64.html" },
];

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

let failed = false;
try {
  for (const test of cases) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const pageErrors = [];
    page.on("pageerror", error => pageErrors.push(error.message));
    page.on("console", message => {
      if (message.type() === "error") pageErrors.push(message.text());
    });

    console.log("Starting browser smoke test:", test.name);
    await page.goto(origin + test.path, { waitUntil: "domcontentloaded", timeout: 60000 });
    const isolated = await page.evaluate(() => ({
      isolated: self.crossOriginIsolated,
      sharedArrayBuffer: typeof SharedArrayBuffer !== "undefined",
    }));
    if (!isolated.isolated || !isolated.sharedArrayBuffer) {
      throw new Error("Browser context is not cross-origin isolated: " + JSON.stringify(isolated));
    }

    await page.waitForFunction(() => window.webdroidReady === true, null, { timeout: 120000 });
    await page.locator("#start").click();
    try {
      await page.waitForFunction(
        () => (window.webdroidGuestOutput || "").includes("Linux version"),
        null,
        { timeout: 8 * 60 * 1000, polling: 1000 },
      );
    } catch (error) {
      const output = await page.evaluate(() => window.webdroidGuestOutput || "");
      throw new Error(
        test.name + " did not print a Linux kernel banner. Recent console output:\n" +
        output.slice(-5000) + "\nPage errors:\n" + pageErrors.join("\n") +
        "\nWait error: " + error.message,
      );
    }

    const output = await page.evaluate(() => window.webdroidGuestOutput || "");
    console.log("PASS:", test.name, "— Linux kernel banner detected.");
    console.log(output.slice(-1200));
    await page.close();
  }
} catch (error) {
  failed = true;
  console.error(error);
} finally {
  await browser.close();
}

if (failed) process.exit(1);
console.log("Both Linux guest browser smoke tests passed.");
