import { chromium } from "playwright";

const BASE = "http://localhost:3100";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(`[console-error] ${msg.text()}`);
    }
  });

  page.on("pageerror", (err) => {
    errors.push(`[pageerror] ${err.message}`);
  });

  page.on("response", (res) => {
    if (res.status() >= 400) {
      errors.push(`[http ${res.status()}] ${res.url()}`);
    }
  });

  // Navigate to the block page that had "Failed"
  console.log("--- Navigating to block page ---");
  await page.goto(`${BASE}/block/3NKsWUMsvZ6bMcZhGwchG64G5QncBoYs7SpCdp4JEhG16oTNPC4d?network=devnet`, {
    waitUntil: "networkidle",
    timeout: 30000,
  });
  await page.waitForTimeout(5000);

  // Find the "Failed" text and get its context
  const failedElements = await page.$$eval("*", (els) => {
    return els
      .filter((el) => el.textContent?.trim() === "Failed" && el.children.length === 0)
      .map((el) => ({
        tag: el.tagName,
        class: el.className,
        parentText: el.parentElement?.textContent?.trim()?.slice(0, 200),
      }));
  });
  console.log("'Failed' elements found:", JSON.stringify(failedElements, null, 2));

  // Screenshot for visual check
  await page.screenshot({ path: "/tmp/mina-block-page.png", fullPage: true });
  console.log("Screenshot saved to /tmp/mina-block-page.png");

  // Check full page text for context
  const bodyText = await page.textContent("body");
  console.log("\nFull page text (trimmed):\n", bodyText?.replace(/\s+/g, " ").trim().slice(0, 2000));

  console.log("\n=== Errors (excluding visible 'Failed' badges) ===");
  const realErrors = errors.filter((e) => !e.includes("visible-error"));
  console.log(`Real errors: ${realErrors.length}`);
  for (const e of realErrors) {
    console.log("  ", e);
  }

  await browser.close();
  process.exit(realErrors.length > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
