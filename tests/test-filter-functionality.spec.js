import { test, expect } from '@playwright/test';

test('필터 기능 테스트', async ({ page }) => {
  console.log('🔍 필터 기능 테스트 시작');
  
  await page.goto('https://gma3561.github.io/The-realty_hasia/');
  await page.waitForTimeout(3000);
  
  // 매물상태 필터 클릭
  console.log('매물상태 필터 클릭');
  await page.click('th:has-text("매물상태")');
  await page.waitForTimeout(1000);
  
  // 필터 메뉴가 표시되는지 확인
  const filterMenu = page.locator('.filter-menu');
  const isVisible = await filterMenu.isVisible();
  console.log(`필터 메뉴 표시 여부: ${isVisible}`);
  
  if (isVisible) {
    // 필터 옵션들 확인
    const options = await page.locator('.filter-menu-option').count();
    console.log(`필터 옵션 개수: ${options}`);
    
    // 첫 번째 옵션 클릭 시도
    if (options > 0) {
      console.log('첫 번째 필터 옵션 클릭 시도');
      await page.locator('.filter-menu-option').first().click();
      await page.waitForTimeout(1000);
      
      // 필터 메뉴가 여전히 표시되는지 확인
      const stillVisible = await filterMenu.isVisible();
      console.log(`클릭 후 필터 메뉴 표시 여부: ${stillVisible}`);
    }
  } else {
    console.log('❌ 필터 메뉴가 표시되지 않음');
  }
  
  // 매물종류 필터 테스트
  console.log('\n매물종류 필터 클릭');
  await page.click('th:has-text("매물종류")');
  await page.waitForTimeout(1000);
  
  const typeFilterVisible = await filterMenu.isVisible();
  console.log(`매물종류 필터 메뉴 표시 여부: ${typeFilterVisible}`);
  
  // 거래유형 필터 테스트
  console.log('\n거래유형 필터 클릭');
  await page.click('th:has-text("거래유형")');
  await page.waitForTimeout(1000);
  
  const tradeFilterVisible = await filterMenu.isVisible();
  console.log(`거래유형 필터 메뉴 표시 여부: ${tradeFilterVisible}`);
});