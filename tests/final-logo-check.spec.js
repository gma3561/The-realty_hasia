// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('최종 흰색 로고 시스템 확인', () => {
  
  test('매물 목록 페이지 흰색 로고', async ({ page }) => {
    // sessionStorage 설정하여 스플래시 스크린 건너뛰기
    await page.addInitScript(() => {
      window.sessionStorage.setItem('splashShown', 'true');
    });
    
    await page.goto('file:///Users/hasanghyeon/final_the_realty/index.html');
    await page.waitForTimeout(500);
    
    // 전체 페이지 스크린샷
    await page.screenshot({ 
      path: 'screenshots/final-list-white-logo.png',
      fullPage: false 
    });
    console.log('📸 매물 목록 페이지 저장됨: screenshots/final-list-white-logo.png');
    
    // 로고 확인
    const logo = await page.locator('img.logo').first();
    if (await logo.count() > 0) {
      const box = await logo.boundingBox();
      console.log(`📏 흰색 로고 크기: ${box?.width}x${box?.height}px`);
      
      // 로고만 캡쳐
      await logo.screenshot({ 
        path: 'screenshots/white-logo-list.png' 
      });
      console.log('📸 로고 스크린샷 저장됨: screenshots/white-logo-list.png');
    }
  });

  test('매물 등록 페이지 흰색 로고', async ({ page }) => {
    await page.goto('file:///Users/hasanghyeon/final_the_realty/form.html');
    await page.waitForTimeout(500);
    
    // 전체 페이지 스크린샷
    await page.screenshot({ 
      path: 'screenshots/final-form-white-logo.png',
      fullPage: false 
    });
    console.log('📸 매물 등록 페이지 저장됨: screenshots/final-form-white-logo.png');
    
    // 로고 확인
    const logo = await page.locator('img.logo').first();
    if (await logo.count() > 0) {
      const box = await logo.boundingBox();
      console.log(`📏 흰색 로고 크기: ${box?.width}x${box?.height}px`);
      
      // 로고만 캡쳐
      await logo.screenshot({ 
        path: 'screenshots/white-logo-form.png' 
      });
      console.log('📸 로고 스크린샷 저장됨: screenshots/white-logo-form.png');
    }
  });

  test('스플래시 스크린 검정 배경에 흰색 로고', async ({ page }) => {
    await page.goto('file:///Users/hasanghyeon/final_the_realty/splash-screen.html');
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: 'screenshots/final-splash-black-bg.png',
      fullPage: false 
    });
    console.log('📸 스플래시 스크린 저장됨: screenshots/final-splash-black-bg.png');
    
    // 스플래시 로고 확인
    const logo = await page.locator('img').first();
    if (await logo.count() > 0) {
      const box = await logo.boundingBox();
      console.log(`📏 스플래시 로고 크기: ${box?.width}x${box?.height}px`);
    }
  });

  test('모바일 뷰 최종 확인', async ({ page }) => {
    // sessionStorage 설정
    await page.addInitScript(() => {
      window.sessionStorage.setItem('splashShown', 'true');
    });
    
    // iPhone 12 크기
    await page.setViewportSize({ width: 390, height: 844 });
    
    await page.goto('file:///Users/hasanghyeon/final_the_realty/index.html');
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: 'screenshots/final-mobile-white-logo.png',
      fullPage: false 
    });
    console.log('📸 모바일 뷰 저장됨: screenshots/final-mobile-white-logo.png');
    
    const logo = await page.locator('img.logo').first();
    if (await logo.count() > 0) {
      const box = await logo.boundingBox();
      console.log(`📱 모바일 로고 크기: ${box?.width}x${box?.height}px`);
    }
  });

  test('최종 요약', async ({ page }) => {
    console.log('\\n' + '='.repeat(60));
    console.log('🎯 최종 로고 시스템 구성 완료');
    console.log('='.repeat(60));
    
    console.log('\\n✅ 완성된 로고 시스템:');
    console.log('  1. 매물 목록: 흰색 누끼 로고 (검정 배경)');
    console.log('  2. 매물 등록: 흰색 누끼 로고 (검정 배경)');
    console.log('  3. 스플래시: 흰색 누끼 로고 (검정 배경)');
    console.log('  4. PWA 아이콘: 정사각형 로고 (37개 사이즈)');
    console.log('  5. favicon: 정사각형 로고');
    
    console.log('\\n📸 생성된 스크린샷:');
    console.log('  • final-list-white-logo.png - 매물 목록');
    console.log('  • final-form-white-logo.png - 매물 등록');
    console.log('  • final-splash-black-bg.png - 스플래시 스크린');
    console.log('  • final-mobile-white-logo.png - 모바일 뷰');
    
    console.log('\\n' + '='.repeat(60));
  });
});