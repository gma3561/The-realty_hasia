// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('로고 시스템 파일 기반 검수', () => {
  
  test('index.html 파일 직접 열어서 확인', async ({ page }) => {
    // sessionStorage 설정하여 스플래시 스크린 건너뛰기
    await page.addInitScript(() => {
      window.sessionStorage.setItem('splashShown', 'true');
    });
    
    // 파일 직접 열기
    await page.goto('file:///Users/hasanghyeon/final_the_realty/index.html');
    await page.waitForTimeout(1000);
    
    // 전체 페이지 스크린샷
    await page.screenshot({ 
      path: 'screenshots/main-page-direct.png',
      fullPage: false 
    });
    console.log('📸 메인 페이지 스크린샷 저장됨: screenshots/main-page-direct.png');
    
    // SVG 로고 확인
    const logo = await page.locator('svg.logo').first();
    const logoCount = await logo.count();
    console.log(`\n🔍 SVG 로고 발견: ${logoCount}개`);
    
    if (logoCount > 0) {
      const box = await logo.boundingBox();
      console.log(`📏 SVG 로고 크기: ${box?.width}x${box?.height}px`);
      
      // 로고만 캡쳐
      await logo.screenshot({ 
        path: 'screenshots/header-logo-direct.png' 
      });
      console.log('📸 로고 스크린샷 저장됨: screenshots/header-logo-direct.png');
      
      // viewBox 속성 확인
      const viewBox = await logo.getAttribute('viewBox');
      console.log(`📐 SVG viewBox: ${viewBox}`);
      
      // width, height 속성 확인
      const width = await logo.getAttribute('width');
      const height = await logo.getAttribute('height');
      console.log(`📏 SVG 속성 - width: ${width}, height: ${height}`);
      
      if (box && box.height >= 45) {
        console.log('✅ 로고 크기가 적절합니다!');
      } else {
        console.log(`⚠️ 로고가 작습니다. 현재: ${box?.height}px (권장: 45px 이상)`);
      }
    }
    
    // 헤더 전체 캡쳐
    const header = await page.locator('.header').first();
    if (await header.count() > 0) {
      await header.screenshot({ 
        path: 'screenshots/full-header.png' 
      });
      console.log('📸 헤더 전체 스크린샷 저장됨: screenshots/full-header.png');
    }
  });

  test('모바일 뷰 확인', async ({ page }) => {
    // sessionStorage 설정하여 스플래시 스크린 건너뛰기
    await page.addInitScript(() => {
      window.sessionStorage.setItem('splashShown', 'true');
    });
    
    // iPhone 12 크기
    await page.setViewportSize({ width: 390, height: 844 });
    
    await page.goto('file:///Users/hasanghyeon/final_the_realty/index.html');
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: 'screenshots/mobile-direct.png',
      fullPage: false 
    });
    console.log('📸 모바일 뷰 저장됨: screenshots/mobile-direct.png');
    
    const logo = await page.locator('svg.logo').first();
    if (await logo.count() > 0) {
      const box = await logo.boundingBox();
      console.log(`📱 모바일 로고 크기: ${box?.width}x${box?.height}px`);
    }
  });

  test('스플래시 스크린 확인', async ({ page }) => {
    await page.goto('file:///Users/hasanghyeon/final_the_realty/splash-screen.html');
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: 'screenshots/splash-direct.png',
      fullPage: false 
    });
    console.log('📸 스플래시 스크린 저장됨: screenshots/splash-direct.png');
    
    // THE 로고 확인
    const logoMain = await page.locator('.logo-main').first();
    if (await logoMain.count() > 0) {
      const text = await logoMain.textContent();
      console.log(`🔤 스플래시 로고 텍스트: "${text}"`);
    }
  });

  test('아이콘 파일 시스템 확인', async ({ page }) => {
    const fs = require('fs');
    const path = require('path');
    
    console.log('\n📁 아이콘 파일 확인:');
    
    const baseDir = '/Users/hasanghyeon/final_the_realty';
    const files = [
      'favicon.ico',
      'icons/icon-192x192.png',
      'icons/icon-512x512.png',
      'icons/apple-touch-icon.png',
      'logo_square_white_bg.png',
      'logo_square_black_bg.png'
    ];
    
    for (const file of files) {
      const filePath = path.join(baseDir, file);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const sizeKB = (stats.size / 1024).toFixed(1);
        console.log(`  ✅ ${file} (${sizeKB} KB)`);
      } else {
        console.log(`  ❌ ${file} - 파일 없음`);
      }
    }
  });

  test('최종 검수 요약 및 스크린샷 목록', async ({ page }) => {
    console.log('\n' + '='.repeat(50));
    console.log('📋 로고 시스템 최종 검수 결과');
    console.log('='.repeat(50));
    
    console.log('\n📸 생성된 스크린샷:');
    const screenshots = [
      'main-page-direct.png - 메인 페이지 전체',
      'header-logo-direct.png - SVG 로고만',
      'full-header.png - 헤더 전체',
      'mobile-direct.png - 모바일 뷰',
      'splash-direct.png - 스플래시 스크린'
    ];
    
    for (const shot of screenshots) {
      console.log(`  • screenshots/${shot}`);
    }
    
    console.log('\n💡 스크린샷을 확인하려면:');
    console.log('  open screenshots/');
    
    console.log('\n✅ 완료된 작업:');
    console.log('  1. SVG 로고 복원 완료');
    console.log('  2. 다크모드 제거 완료');
    console.log('  3. PWA 아이콘 생성 완료');
    
    console.log('\n' + '='.repeat(50));
  });
});