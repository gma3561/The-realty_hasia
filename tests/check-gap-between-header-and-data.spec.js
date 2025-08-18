import { test, expect } from '@playwright/test';

test('헤더와 데이터 사이 공백 확인', async ({ page }) => {
  console.log('🔍 헤더와 데이터 사이 공백 분석');
  
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto('https://gma3561.github.io/The-realty_hasia/');
  await page.waitForTimeout(5000);
  
  const gapAnalysis = await page.evaluate(() => {
    const thead = document.querySelector('.data-table thead');
    const tbody = document.querySelector('.data-table tbody');
    const firstRow = document.querySelector('.data-table tbody tr:first-child');
    const tableContainer = document.querySelector('.table-container');
    
    if (!thead || !tbody || !firstRow) return null;
    
    const theadRect = thead.getBoundingClientRect();
    const tbodyRect = tbody.getBoundingClientRect();
    const firstRowRect = firstRow.getBoundingClientRect();
    const containerRect = tableContainer.getBoundingClientRect();
    
    const theadStyle = window.getComputedStyle(thead);
    const tbodyStyle = window.getComputedStyle(tbody);
    const containerStyle = window.getComputedStyle(tableContainer);
    
    return {
      thead: {
        y: theadRect.y,
        bottom: theadRect.bottom,
        height: theadRect.height,
        position: theadStyle.position,
        top: theadStyle.top
      },
      tbody: {
        y: tbodyRect.y,
        top: tbodyRect.top,
        height: tbodyRect.height,
        paddingTop: tbodyStyle.paddingTop,
        marginTop: tbodyStyle.marginTop,
        display: tbodyStyle.display,
        position: tbodyStyle.position
      },
      firstRow: {
        y: firstRowRect.y,
        top: firstRowRect.top,
        height: firstRowRect.height
      },
      container: {
        paddingTop: containerStyle.paddingTop,
        y: containerRect.y
      },
      gaps: {
        theadToTbody: tbodyRect.y - theadRect.bottom,
        theadToFirstRow: firstRowRect.y - theadRect.bottom,
        containerPadding: containerStyle.paddingTop
      }
    };
  });
  
  console.log('분석 결과:');
  console.log('THEAD 위치:', gapAnalysis.thead);
  console.log('TBODY 위치:', gapAnalysis.tbody);
  console.log('첫 번째 행 위치:', gapAnalysis.firstRow);
  console.log('컨테이너 설정:', gapAnalysis.container);
  console.log('\n공백 분석:');
  console.log(`THEAD 하단에서 TBODY까지: ${gapAnalysis.gaps.theadToTbody}px`);
  console.log(`THEAD 하단에서 첫 데이터까지: ${gapAnalysis.gaps.theadToFirstRow}px`);
  console.log(`컨테이너 padding-top: ${gapAnalysis.gaps.containerPadding}`);
  
  if (gapAnalysis.gaps.theadToFirstRow > 5) {
    console.log(`\n❌ 문제: 헤더와 데이터 사이에 ${gapAnalysis.gaps.theadToFirstRow}px의 불필요한 공백이 있습니다!`);
    
    if (gapAnalysis.tbody.paddingTop !== '0px') {
      console.log(`원인: TBODY의 padding-top이 ${gapAnalysis.tbody.paddingTop} 설정되어 있습니다.`);
    }
  }
});