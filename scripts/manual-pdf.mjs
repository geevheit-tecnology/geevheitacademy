import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.goto(`${process.env.QA_BASE_URL || 'http://localhost:5174'}/manual`);
  await page.getByRole('heading', { name: 'Passo a passo dos 40 processos' }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  await mkdir('public', { recursive: true });
  await page.pdf({ path: 'public/manual-treinamento.pdf', format: 'A4', printBackground: true, preferCSSPageSize: true });
  console.log('PDF gerado: public/manual-treinamento.pdf');
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ media: 'screen' });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    if (overflow) throw Error(`Manual com overflow em ${width}px`);
    await page.screenshot({ path: `docs/qa/correcoes01-manual-${width}.png`, fullPage: true });
    await page.screenshot({ path: `docs/qa/correcoes01-manual-top-${width}.png` });
    console.log(`Manual ${width}px: sem overflow`);
  }
} finally { await browser.close(); }
