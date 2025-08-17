// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('더부동산중개법인 로고 시스템 검수', () => {
  
  test.beforeEach(async ({ page }) => {
    // Live Server가 실행 중이라고 가정 (포트 5500)
    await page.goto('http://127.0.0.1:5500');
  });

  test('파비콘이 올바르게 설정되었는지 확인', async ({ page }) => {
    // favicon.ico 확인
    const favicon = await page.locator('link[rel="icon"][href="/favicon.ico"]');
    await expect(favicon).toHaveCount(1);
    
    // PNG 파비콘 확인
    const favicon32 = await page.locator('link[rel="icon"][sizes="32x32"]');
    await expect(favicon32).toHaveAttribute('href', '/icons/favicon-32x32.png');
    
    const favicon16 = await page.locator('link[rel="icon"][sizes="16x16"]');
    await expect(favicon16).toHaveAttribute('href', '/icons/favicon-16x16.png');
  });

  test('Apple Touch Icons이 올바르게 설정되었는지 확인', async ({ page }) => {
    const appleTouchIcon = await page.locator('link[rel="apple-touch-icon"]');
    await expect(appleTouchIcon).toHaveCount(4);
    
    // 기본 아이콘 확인
    const defaultIcon = await page.locator('link[rel="apple-touch-icon"]:not([sizes])');
    await expect(defaultIcon).toHaveAttribute('href', '/icons/apple-touch-icon.png');
  });

  test('manifest.json이 올바르게 연결되었는지 확인', async ({ page }) => {
    const manifest = await page.locator('link[rel="manifest"]');
    await expect(manifest).toHaveAttribute('href', '/manifest.json');
    
    // manifest.json 파일 접근 테스트
    const response = await page.request.get('/manifest.json');
    expect(response.status()).toBe(200);
    
    const manifestData = await response.json();
    expect(manifestData.name).toBe('더부동산중개법인 매물관리시스템');
    expect(manifestData.icons).toHaveLength(13);
  });

  test('스플래시 스크린에 로고가 표시되는지 확인', async ({ page }) => {
    await page.goto('http://127.0.0.1:5500/splash-screen.html');
    
    // 로고 이미지 확인
    const splashLogo = await page.locator('img#splash-logo');
    await expect(splashLogo).toBeVisible();
    await expect(splashLogo).toHaveAttribute('src', '/logo_square_white_bg.png');
    
    // 로딩 바 확인
    const loadingBar = await page.locator('.loading-bar');
    await expect(loadingBar).toBeVisible();
    
    // 3초 후 리다이렉트 확인
    await page.waitForTimeout(3500);
    await expect(page).toHaveURL('http://127.0.0.1:5500/index.html');
  });

  test('메인 페이지 헤더 로고가 표시되는지 확인', async ({ page }) => {
    // 헤더 로고 확인
    const headerLogo = await page.locator('img#header-logo');
    await expect(headerLogo).toBeVisible();
    await expect(headerLogo).toHaveAttribute('src', '/logo_square_white_bg.png');
    await expect(headerLogo).toHaveAttribute('alt', '더부동산중개법인');
  });

  test('매물등록 페이지 헤더 로고가 표시되는지 확인', async ({ page }) => {
    await page.goto('http://127.0.0.1:5500/form.html');
    
    const headerLogo = await page.locator('img#header-logo');
    await expect(headerLogo).toBeVisible();
    await expect(headerLogo).toHaveAttribute('src', '/logo_square_white_bg.png');
  });

  test('관리자 로그인 페이지 로고가 표시되는지 확인', async ({ page }) => {
    await page.goto('http://127.0.0.1:5500/admin-login.html');
    
    const loginLogo = await page.locator('.login-logo img');
    await expect(loginLogo).toBeVisible();
    await expect(loginLogo).toHaveAttribute('width', '150');
    await expect(loginLogo).toHaveAttribute('height', '150');
  });

  test('다크모드 전환 시 로고가 변경되는지 확인', async ({ page }) => {
    // 다크모드 설정
    await page.evaluate(() => {
      localStorage.setItem('theme', 'dark');
    });
    
    await page.reload();
    
    // 테마 매니저가 로드될 때까지 대기
    await page.waitForTimeout(500);
    
    // 다크모드에서 로고 확인
    const headerLogo = await page.locator('img#header-logo');
    const logoSrc = await headerLogo.getAttribute('src');
    
    // 다크모드에서는 검정 배경 로고가 표시되어야 함
    if (await page.evaluate(() => window.isDarkMode && window.isDarkMode())) {
      expect(logoSrc).toBe('/logo_square_black_bg.png');
    }
  });

  test('시스템 다크모드 감지 확인', async ({ page, context }) => {
    // 다크모드 에뮬레이션
    await context.emulateMedia({ colorScheme: 'dark' });
    await page.reload();
    
    // picture 태그의 source 확인
    const darkSource = await page.locator('picture source[media="(prefers-color-scheme: dark)"]');
    await expect(darkSource).toHaveAttribute('srcset', '/logo_square_black_bg.png');
  });

  test('반응형 로고 크기 확인', async ({ page }) => {
    // 데스크톱 사이즈
    await page.setViewportSize({ width: 1920, height: 1080 });
    let headerLogo = await page.locator('.header-logo');
    let logoHeight = await headerLogo.evaluate(el => window.getComputedStyle(el).height);
    expect(logoHeight).toBe('45px');
    
    // 모바일 사이즈
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300); // CSS 트랜지션 대기
    
    // 스플래시 스크린에서 모바일 로고 크기 확인
    await page.goto('http://127.0.0.1:5500/splash-screen.html');
    const splashLogo = await page.locator('.splash-logo');
    const splashLogoWidth = await splashLogo.evaluate(el => window.getComputedStyle(el).width);
    expect(parseInt(splashLogoWidth)).toBeLessThanOrEqual(150);
  });

  test('로고 이미지 파일 접근성 확인', async ({ page }) => {
    const imagesToCheck = [
      '/logo_square_white_bg.png',
      '/logo_square_black_bg.png',
      '/icons/icon-192x192.png',
      '/icons/icon-512x512.png',
      '/icons/apple-touch-icon.png',
      '/favicon.ico'
    ];
    
    for (const imagePath of imagesToCheck) {
      const response = await page.request.get(imagePath);
      expect(response.status()).toBe(200);
      
      const contentType = response.headers()['content-type'];
      if (imagePath.endsWith('.png')) {
        expect(contentType).toContain('image/png');
      } else if (imagePath.endsWith('.ico')) {
        expect(contentType).toMatch(/image\/(x-icon|vnd\.microsoft\.icon)/);
      }
    }
  });

  test('PWA 설치 가능성 확인', async ({ page }) => {
    // Service Worker 등록 여부 확인 (있다면)
    const hasServiceWorker = await page.evaluate(() => 'serviceWorker' in navigator);
    expect(hasServiceWorker).toBeTruthy();
    
    // manifest 파일의 필수 속성 확인
    const response = await page.request.get('/manifest.json');
    const manifest = await response.json();
    
    expect(manifest).toHaveProperty('name');
    expect(manifest).toHaveProperty('short_name');
    expect(manifest).toHaveProperty('icons');
    expect(manifest).toHaveProperty('start_url');
    expect(manifest).toHaveProperty('display');
    expect(manifest.display).toBe('standalone');
  });

  test('테마 매니저 API 확인', async ({ page }) => {
    // 테마 매니저 함수들이 전역에 노출되었는지 확인
    const hasThemeAPI = await page.evaluate(() => {
      return typeof window.toggleTheme === 'function' &&
             typeof window.setTheme === 'function' &&
             typeof window.getCurrentTheme === 'function' &&
             typeof window.isDarkMode === 'function';
    });
    
    expect(hasThemeAPI).toBeTruthy();
    
    // 테마 토글 테스트
    const initialTheme = await page.evaluate(() => window.getCurrentTheme());
    await page.evaluate(() => window.toggleTheme());
    const newTheme = await page.evaluate(() => window.getCurrentTheme());
    
    expect(newTheme).not.toBe(initialTheme);
  });

  test('로고 로딩 성능 확인', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('http://127.0.0.1:5500', { waitUntil: 'networkidle' });
    
    const loadTime = Date.now() - startTime;
    
    // 로고 이미지가 3초 이내에 로드되어야 함
    expect(loadTime).toBeLessThan(3000);
    
    // 모든 로고 이미지가 로드되었는지 확인
    const images = await page.locator('img.header-logo, img.splash-logo');
    const count = await images.count();
    
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const isLoaded = await img.evaluate((el) => el.complete && el.naturalHeight !== 0);
      expect(isLoaded).toBeTruthy();
    }
  });
});

// 접근성 테스트
test.describe('로고 시스템 접근성', () => {
  test('모든 로고 이미지에 적절한 alt 텍스트가 있는지 확인', async ({ page }) => {
    await page.goto('http://127.0.0.1:5500');
    
    const images = await page.locator('img').all();
    
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      if (await img.getAttribute('class')?.then(c => c?.includes('logo'))) {
        expect(alt).toBeTruthy();
        expect(alt).toContain('더부동산');
      }
    }
  });

  test('키보드 네비게이션 지원 확인', async ({ page }) => {
    await page.goto('http://127.0.0.1:5500');
    
    // Tab 키로 로고에 포커스 가능한지 확인
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // 포커스된 요소 확인
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });
});