import { test, expect } from '@playwright/test';

test('실제 문제 분석', async ({ page }) => {
  console.log('🔍 실제 문제 분석 시작');
  
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto('https://gma3561.github.io/The-realty_hasia/');
  await page.waitForTimeout(5000);
  
  // 모든 요소의 위치와 크기 측정
  const analysis = await page.evaluate(() => {
    const header = document.querySelector('.header');
    const filterBar = document.querySelector('.filter-bar');
    const tableContainer = document.querySelector('.table-container');
    const table = document.querySelector('.data-table');
    const thead = document.querySelector('.data-table thead');
    const tbody = document.querySelector('.data-table tbody');
    const firstRow = document.querySelector('.data-table tbody tr');
    
    function getInfo(element, name) {
      if (!element) return { name, exists: false };
      
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      
      return {
        name,
        exists: true,
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        position: style.position,
        top: style.top,
        marginTop: style.marginTop,
        paddingTop: style.paddingTop,
        overflow: style.overflow,
        overflowY: style.overflowY,
        display: style.display,
        height: style.height
      };
    }
    
    // 실제 공백 분석
    const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
    const filterBottom = filterBar ? filterBar.getBoundingClientRect().bottom : 0;
    const theadTop = thead ? thead.getBoundingClientRect().top : 0;
    
    return {
      header: getInfo(header, 'header'),
      filterBar: getInfo(filterBar, 'filter-bar'),
      tableContainer: getInfo(tableContainer, 'table-container'),
      table: getInfo(table, 'table'),
      thead: getInfo(thead, 'thead'),
      tbody: getInfo(tbody, 'tbody'),
      firstRow: getInfo(firstRow, 'first-row'),
      gaps: {
        headerToFilter: filterBar && header ? filterBar.getBoundingClientRect().top - headerBottom : null,
        filterToThead: thead && filterBar ? theadTop - filterBottom : null,
        headerToThead: thead && header ? theadTop - headerBottom : null,
        totalGap: theadTop - headerBottom
      }
    };
  });
  
  console.log('=== 요소별 상세 정보 ===');
  console.log(JSON.stringify(analysis, null, 2));
  
  // 문제 진단
  console.log('\n=== 문제 진단 ===');
  console.log(`헤더 높이: ${analysis.header.rect.height}px`);
  console.log(`필터바 높이: ${analysis.filterBar.rect.height}px`);
  console.log(`헤더+필터바 총 높이: ${analysis.header.rect.height + analysis.filterBar.rect.height}px`);
  console.log(`테이블 헤더 Y 위치: ${analysis.thead.rect.y}px`);
  console.log(`실제 간격: ${analysis.gaps.totalGap}px`);
  
  if (analysis.gaps.filterToThead > 10) {
    console.log(`❌ 문제 발견: 필터바와 테이블 헤더 사이에 ${analysis.gaps.filterToThead}px의 불필요한 간격이 있습니다!`);
  }
  
  // CSS 규칙 확인
  const cssRules = await page.evaluate(() => {
    const styles = Array.from(document.styleSheets);
    const tableRules = [];
    
    for (const sheet of styles) {
      try {
        const rules = Array.from(sheet.cssRules || []);
        for (const rule of rules) {
          if (rule.selectorText && (
            rule.selectorText.includes('.table-container') ||
            rule.selectorText.includes('.data-table') ||
            rule.selectorText.includes('thead')
          )) {
            tableRules.push({
              selector: rule.selectorText,
              styles: rule.style.cssText
            });
          }
        }
      } catch(e) {
        // CORS 에러 무시
      }
    }
    return tableRules;
  });
  
  console.log('\n=== 관련 CSS 규칙 ===');
  cssRules.forEach(rule => {
    if (rule.styles.includes('margin') || rule.styles.includes('padding') || rule.styles.includes('top')) {
      console.log(`${rule.selector}: ${rule.styles}`);
    }
  });
});