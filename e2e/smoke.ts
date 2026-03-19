import { chromium } from "playwright";

const BASE = "http://localhost:3100";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors: string[] = [];
  const consoleLogs: string[] = [];

  page.on("console", (msg) => {
    const text = `[${msg.type()}] ${msg.text()}`;
    consoleLogs.push(text);
    if (msg.type() === "error") {
      errors.push(text);
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

  // Test 1: Dashboard
  console.log("\n--- Testing Dashboard (/) ---");
  await page.goto(BASE, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(3000); // wait for polling to fire
  const dashboardContent = await page.textContent("body");
  console.log("Page title visible:", dashboardContent?.includes("Mina Explorer"));
  console.log("Body length:", dashboardContent?.length);

  // Check for visible error messages on the page
  const errorElements = await page.$$eval("[class*='red']", (els) =>
    els.map((el) => el.textContent?.trim()).filter(Boolean)
  );
  if (errorElements.length > 0) {
    console.log("Visible error elements:", errorElements);
    errors.push(...errorElements.map((e) => `[visible-error] ${e}`));
  }

  // Check if status cards loaded
  const statusCards = await page.$$("[class*='rounded-xl']");
  console.log("Status card elements:", statusCards.length);

  // Test 2: Block page (use a real block hash from the dashboard if available)
  console.log("\n--- Testing Block page ---");
  const blockLink = await page.$("a[href*='/block/']");
  if (blockLink) {
    const href = await blockLink.getAttribute("href");
    console.log("Found block link:", href);
    await blockLink.click();
    await page.waitForTimeout(3000);
    const blockContent = await page.textContent("body");
    console.log("Block page loaded, body length:", blockContent?.length);

    const blockErrors = await page.$$eval("[class*='red']", (els) =>
      els.map((el) => el.textContent?.trim()).filter(Boolean)
    );
    if (blockErrors.length > 0) {
      console.log("Block page visible errors:", blockErrors);
      errors.push(...blockErrors.map((e) => `[block-visible-error] ${e}`));
    }
  } else {
    console.log("No block links found on dashboard");
  }

  // Test 3: Account page
  console.log("\n--- Testing Account page ---");
  const accountLink = await page.$("a[href*='/account/']");
  if (accountLink) {
    const href = await accountLink.getAttribute("href");
    console.log("Found account link:", href);
    await accountLink.click();
    await page.waitForTimeout(3000);
    const accountContent = await page.textContent("body");
    console.log("Account page loaded, body length:", accountContent?.length);

    const accountErrors = await page.$$eval("[class*='red']", (els) =>
      els.map((el) => el.textContent?.trim()).filter(Boolean)
    );
    if (accountErrors.length > 0) {
      console.log("Account page visible errors:", accountErrors);
      errors.push(...accountErrors.map((e) => `[account-visible-error] ${e}`));
    }
  } else {
    console.log("No account links found");
  }

  // Summary
  console.log("\n=== SUMMARY ===");
  console.log(`Console errors: ${errors.length}`);
  for (const e of errors) {
    console.log("  ", e);
  }
  console.log(`Total console messages: ${consoleLogs.length}`);
  for (const l of consoleLogs) {
    console.log("  ", l);
  }

  await browser.close();

  if (errors.length > 0) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
