import { test, expect } from '@playwright/test';

test('CSS computed style 디버깅', async ({ page }) => {
  console.log('🔍 CSS computed style 확인');
  
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('https://gma3561.github.io/The-realty_hasia/');
  await page.waitForTimeout(3000);
  
  // 테이블 헤더의 computed style 확인
  const computedStyle = await page.evaluate(() => {
    const thead = document.querySelector('.data-table thead');
    if (!thead) return null;
    
    const style = window.getComputedStyle(thead);
    return {
      position: style.position,
      top: style.top,
      zIndex: style.zIndex,
      background: style.background,
      backgroundRepeat: style.backgroundRepeat,
      backgroundColor: style.backgroundColor
    };
  });
  
  console.log('테이블 헤더 computed style:', computedStyle);
  
  // CSS 규칙 확인
  const cssRules = await page.evaluate(() => {
    const thead = document.querySelector('.data-table thead');
    if (!thead) return null;
    
    const matchingRules = [];
    const sheets = Array.from(document.styleSheets);
    
    for (const sheet of sheets) {
      try {
        const rules = Array.from(sheet.cssRules || sheet.rules || []);
        for (const rule of rules) {
          if (rule.type === CSSRule.STYLE_RULE) {
            try {
              if (thead.matches(rule.selectorText)) {
                matchingRules.push({
                  selector: rule.selectorText,
                  top: rule.style.top,
                  position: rule.style.position
                });
              }
            } catch(e) {
              // selector가 복잡할 수 있으므로 에러 무시
            }
          }
        }
      } catch(e) {
        // CORS 문제 등으로 접근 불가한 스타일시트 무시
      }
    }
    
    return matchingRules;
  });
  
  console.log('매칭되는 CSS 규칙들:', cssRules);
  
  // 데스크톱에서도 확인
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto('https://gma3561.github.io/The-realty_hasia/');
  await page.waitForTimeout(3000);
  
  const desktopComputedStyle = await page.evaluate(() => {
    const thead = document.querySelector('.data-table thead');
    if (!thead) return null;
    
    const style = window.getComputedStyle(thead);
    return {
      position: style.position,
      top: style.top,
      zIndex: style.zIndex,
      background: style.background,
      backgroundColor: style.backgroundColor
    };
  });
  
  console.log('데스크톱 테이블 헤더 computed style:', desktopComputedStyle);
});