import { test, expect } from '@playwright/test';

test('테이블 구조 확인', async ({ page }) => {
  console.log('🔍 테이블 구조 확인');
  
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto('https://gma3561.github.io/The-realty_hasia/');
  await page.waitForTimeout(5000);
  
  // 테이블 내부 구조 확인
  const tableStructure = await page.evaluate(() => {
    const table = document.querySelector('.data-table');
    if (!table) return null;
    
    const children = Array.from(table.children);
    const structure = children.map((child, index) => {
      const rect = child.getBoundingClientRect();
      const style = window.getComputedStyle(child);
      
      return {
        index,
        tagName: child.tagName,
        className: child.className,
        position: style.position,
        display: style.display,
        rect: { y: rect.y, height: rect.height },
        childrenCount: child.children.length
      };
    });
    
    // innerHTML 확인
    const tableHTML = table.outerHTML.substring(0, 500);
    
    return {
      structure,
      tableHTML,
      theadFirst: table.firstElementChild?.tagName === 'THEAD'
    };
  });
  
  console.log('테이블 자식 요소들:');
  tableStructure.structure.forEach(child => {
    console.log(`  ${child.index}: ${child.tagName} - Y: ${child.rect.y}, Height: ${child.rect.height}`);
  });
  
  console.log('\nHTML 구조 (첫 500자):');
  console.log(tableStructure.tableHTML);
  
  console.log(`\nTHEAD가 첫 번째 자식인가? ${tableStructure.theadFirst}`);
  
  // 동적으로 생성되는 요소 확인
  const dynamicElements = await page.evaluate(() => {
    const tbody = document.querySelector('.data-table tbody');
    const thead = document.querySelector('.data-table thead');
    
    return {
      tbodyRows: tbody ? tbody.children.length : 0,
      theadRows: thead ? thead.children.length : 0,
      tbodyFirst: tbody ? tbody.firstElementChild?.outerHTML.substring(0, 200) : null,
      theadContent: thead ? thead.innerHTML.substring(0, 200) : null
    };
  });
  
  console.log('\n동적 생성 요소:');
  console.log(`TBODY 행 수: ${dynamicElements.tbodyRows}`);
  console.log(`THEAD 행 수: ${dynamicElements.theadRows}`);
  console.log(`TBODY 첫 행: ${dynamicElements.tbodyFirst}`);
});