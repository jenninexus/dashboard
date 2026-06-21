const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  
  const profiles = [
    { name: 'seo', url: 'file:///C:/Github/dashboard/profiles/seo/seo.html' },
    { name: 'finances', url: 'file:///C:/Github/dashboard/profiles/finances/finances.html' },
    { name: 'health', url: 'file:///C:/Github/dashboard/profiles/health/health.html' },
  ];
  
  const outDir = 'C:/Github/dashboard/storage/screenshots';
  
  for (const p of profiles) {
    const page = await context.newPage();
    await page.goto(p.url, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(800);
    
    // Expanded screenshot
    await page.screenshot({ path: `${outDir}/${p.name}-expanded.png`, fullPage: true });
    console.log(`${p.name}-expanded.png saved`);
    
    // Click "Collapse All" button
    try {
      const collapseBtn = page.locator('button', { hasText: /collapse all/i }).first();
      if (await collapseBtn.isVisible({ timeout: 2000 })) {
        await collapseBtn.click();
        await page.waitForTimeout(500);
      }
    } catch(e) { console.log(`No collapse button for ${p.name}: ${e.message}`); }
    
    // Collapsed screenshot
    await page.screenshot({ path: `${outDir}/${p.name}-collapsed.png`, fullPage: true });
    console.log(`${p.name}-collapsed.png saved`);
    
    await page.close();
  }
  
  await browser.close();
  console.log('Done');
})();
