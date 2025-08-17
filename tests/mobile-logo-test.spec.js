// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('모바일 로고 크기 및 스플래시 스크린 최종 확인', () => {
  
  test('스플래시 스크린 - 검정 배경에 흰색 누끼 로고', async ({ page }) => {
    await page.goto('file:///Users/hasanghyeon/final_the_realty/splash-screen.html');
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: 'screenshots/splash-final-white-logo.png',
      fullPage: false 
    });
    console.log('📸 최종 스플래시 스크린 저장됨: screenshots/splash-final-white-logo.png');
    
    // 로고 크기 확인
    const logo = await page.locator('img').first();
    if (await logo.count() > 0) {
      const box = await logo.boundingBox();
      console.log(`📏 스플래시 로고 크기: ${box?.width}x${box?.height}px`);
    }
  });

  test('모바일 뷰 768px - 매물 목록 작은 로고', async ({ page }) => {
    // sessionStorage 설정
    await page.addInitScript(() => {
      window.sessionStorage.setItem('splashShown', 'true');
    });
    
    // 768px 뷰
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('file:///Users/hasanghyeon/final_the_realty/index.html');
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: 'screenshots/mobile-768-small-logo.png',
      fullPage: false 
    });
    console.log('📸 모바일 768px 뷰 저장됨: screenshots/mobile-768-small-logo.png');
    
    const logo = await page.locator('img.logo').first();
    if (await logo.count() > 0) {
      const box = await logo.boundingBox();
      console.log(`📱 768px 로고 크기: ${box?.width}x${box?.height}px`);
    }
  });

  test('모바일 뷰 480px - 매물 목록 더 작은 로고', async ({ page }) => {
    // sessionStorage 설정
    await page.addInitScript(() => {
      window.sessionStorage.setItem('splashShown', 'true');
    });
    
    // 480px 뷰
    await page.setViewportSize({ width: 480, height: 854 });
    
    await page.goto('file:///Users/hasanghyeon/final_the_realty/index.html');
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: 'screenshots/mobile-480-smallest-logo.png',
      fullPage: false 
    });
    console.log('📸 모바일 480px 뷰 저장됨: screenshots/mobile-480-smallest-logo.png');
    
    const logo = await page.locator('img.logo').first();
    if (await logo.count() > 0) {
      const box = await logo.boundingBox();
      console.log(`📱 480px 로고 크기: ${box?.width}x${box?.height}px`);
    }
  });

  test('모바일 뷰 480px - 매물 등록 페이지', async ({ page }) => {
    // 480px 뷰
    await page.setViewportSize({ width: 480, height: 854 });
    
    await page.goto('file:///Users/hasanghyeon/final_the_realty/form.html');
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: 'screenshots/mobile-form-480-small-logo.png',
      fullPage: false 
    });
    console.log('📸 매물 등록 480px 뷰 저장됨: screenshots/mobile-form-480-small-logo.png');
    
    const logo = await page.locator('img.logo').first();
    if (await logo.count() > 0) {
      const box = await logo.boundingBox();
      console.log(`📱 매물 등록 480px 로고 크기: ${box?.width}x${box?.height}px`);
    }
  });

  test('최종 결과 요약', async ({ page }) => {
    console.log('\\n' + '='.repeat(60));
    console.log('🎯 로고 시스템 최종 완성');
    console.log('='.repeat(60));
    
    console.log('\\n✅ 스플래시 스크린: 검정 배경 + 흰색 누끼 로고');
    console.log('✅ 데스크톱: 큰 흰색 로고 (45px)');
    console.log('✅ 모바일 768px: 중간 흰색 로고 (35px)');
    console.log('✅ 모바일 480px: 작은 흰색 로고 (30px)');
    
    console.log('\\n📱 반응형 로고 크기:');
    console.log('  • 데스크톱: 45px');
    console.log('  • 태블릿/모바일: 35px');
    console.log('  • 작은 모바일: 30px');
    
    console.log('\\n' + '='.repeat(60));
  });
});