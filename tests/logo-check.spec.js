// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('정사각형 로고 확인', () => {
  
  test('매물 목록 페이지 로고', async ({ page }) => {
    // sessionStorage 설정하여 스플래시 스크린 건너뛰기
    await page.addInitScript(() => {
      window.sessionStorage.setItem('splashShown', 'true');
    });
    
    await page.goto('file:///Users/hasanghyeon/final_the_realty/index.html');
    await page.waitForTimeout(500);
    
    // 전체 페이지 스크린샷
    await page.screenshot({ 
      path: 'screenshots/list-with-square-logo.png',
      fullPage: false 
    });
    console.log('📸 매물 목록 페이지 저장됨: screenshots/list-with-square-logo.png');
    
    // 로고 확인
    const logo = await page.locator('img.logo').first();
    if (await logo.count() > 0) {
      const box = await logo.boundingBox();
      console.log(`📏 정사각형 로고 크기: ${box?.width}x${box?.height}px`);
      
      // 로고만 캡쳐
      await logo.screenshot({ 
        path: 'screenshots/square-logo-list.png' 
      });
      console.log('📸 로고 스크린샷 저장됨: screenshots/square-logo-list.png');
    }
  });

  test('매물 등록 페이지 로고', async ({ page }) => {
    await page.goto('file:///Users/hasanghyeon/final_the_realty/form.html');
    await page.waitForTimeout(500);
    
    // 전체 페이지 스크린샷
    await page.screenshot({ 
      path: 'screenshots/form-with-square-logo.png',
      fullPage: false 
    });
    console.log('📸 매물 등록 페이지 저장됨: screenshots/form-with-square-logo.png');
    
    // 로고 확인
    const logo = await page.locator('img.logo').first();
    if (await logo.count() > 0) {
      const box = await logo.boundingBox();
      console.log(`📏 정사각형 로고 크기: ${box?.width}x${box?.height}px`);
      
      // 로고만 캡쳐
      await logo.screenshot({ 
        path: 'screenshots/square-logo-form.png' 
      });
      console.log('📸 로고 스크린샷 저장됨: screenshots/square-logo-form.png');
    }
  });

  test('모바일 뷰 확인', async ({ page }) => {
    // sessionStorage 설정
    await page.addInitScript(() => {
      window.sessionStorage.setItem('splashShown', 'true');
    });
    
    // iPhone 12 크기
    await page.setViewportSize({ width: 390, height: 844 });
    
    await page.goto('file:///Users/hasanghyeon/final_the_realty/index.html');
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: 'screenshots/mobile-square-logo.png',
      fullPage: false 
    });
    console.log('📸 모바일 뷰 저장됨: screenshots/mobile-square-logo.png');
    
    const logo = await page.locator('img.logo').first();
    if (await logo.count() > 0) {
      const box = await logo.boundingBox();
      console.log(`📱 모바일 로고 크기: ${box?.width}x${box?.height}px`);
    }
  });
});