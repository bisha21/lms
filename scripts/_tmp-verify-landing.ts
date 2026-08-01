import { chromium } from 'playwright';

const SCRATCH = 'C:/Users/BISHAL TIMIL SINA/AppData/Local/Temp/claude/C--Documents-nextjs-dp-lms/2011671f-21bd-40ed-9859-e9cfa8eef4ca/scratchpad';

async function main() {
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('http://localhost:3001/login');
  await page.fill('input[type="email"]', 'alex.kim@seed.dev');
  await page.fill('input[type="password"]', 'Password123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('http://localhost:3001/', { timeout: 15000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${SCRATCH}/landing-while-authed.png` });

  await page.goto('http://localhost:3001/dashboard');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${SCRATCH}/dashboard-while-authed.png` });

  await browser.close();
  console.log('done');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
