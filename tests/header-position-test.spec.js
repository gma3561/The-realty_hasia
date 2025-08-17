import { test, expect } from '@playwright/test';

test.describe('헤더 위치 테스트', () => {
  test('헤더와 테이블 헤더 위치 확인', async ({ page }) => {
    console.log('🔍 헤더 위치 테스트 시작');
    
    // 메인 페이지 로드
    await page.goto('file://' + process.cwd() + '/index.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    // 헤더 높이 측정
    const headerHeight = await page.locator('.header').evaluate(el => el.offsetHeight);
    console.log(`📏 헤더 높이: ${headerHeight}px`);
    
    // 필터바 높이 측정
    const filterHeight = await page.locator('.filter-bar').evaluate(el => el.offsetHeight);
    console.log(`📏 필터바 높이: ${filterHeight}px`);
    
    // 총 높이
    const totalHeight = headerHeight + filterHeight;
    console.log(`📏 총 높이: ${totalHeight}px`);
    
    // 테이블 헤더의 현재 top 값 확인
    const theadTop = await page.locator('.data-table thead').evaluate(el => {
      const style = window.getComputedStyle(el);
      return style.top;
    });
    console.log(`📏 현재 테이블 헤더 top: ${theadTop}`);
    
    // 스크롤 테스트
    console.log('🔄 스크롤 테스트 진행');
    await page.evaluate(() => {
      window.scrollTo(0, 200);
    });
    await page.waitForTimeout(1000);
    
    // 헤더가 고정되어 있는지 확인
    const headerVisible = await page.locator('.header').isVisible();
    const filterVisible = await page.locator('.filter-bar').isVisible();
    const theadVisible = await page.locator('.data-table thead').isVisible();
    
    console.log(`✅ 헤더 고정 상태: ${headerVisible}`);
    console.log(`✅ 필터바 고정 상태: ${filterVisible}`);
    console.log(`✅ 테이블 헤더 고정 상태: ${theadVisible}`);
    
    // 테이블 헤더가 필터바 바로 아래에 있는지 확인
    const headerRect = await page.locator('.header').boundingBox();
    const filterRect = await page.locator('.filter-bar').boundingBox();
    const theadRect = await page.locator('.data-table thead').boundingBox();
    
    if (headerRect && filterRect && theadRect) {
      console.log(`📍 헤더 위치: y=${headerRect.y}, height=${headerRect.height}`);
      console.log(`📍 필터바 위치: y=${filterRect.y}, height=${filterRect.height}`);
      console.log(`📍 테이블헤더 위치: y=${theadRect.y}, height=${theadRect.height}`);
      
      const expectedTheadY = filterRect.y + filterRect.height;
      const actualGap = Math.abs(theadRect.y - expectedTheadY);
      
      console.log(`🎯 예상 테이블헤더 Y: ${expectedTheadY}`);
      console.log(`🎯 실제 테이블헤더 Y: ${theadRect.y}`);
      console.log(`🎯 차이: ${actualGap}px`);
      
      if (actualGap > 5) {
        console.log(`⚠️ 테이블 헤더 위치 조정 필요: top을 ${Math.round(expectedTheadY)}px로 설정 권장`);
      } else {
        console.log(`✅ 테이블 헤더 위치 정상`);
      }
    }
    
    // 스크린샷 촬영
    await page.screenshot({ path: 'header-position-test.png', fullPage: true });
    console.log('📸 스크린샷 저장: header-position-test.png');
  });
});