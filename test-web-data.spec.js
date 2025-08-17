import { test, expect } from '@playwright/test';

test('웹사이트 매물 데이터 확인', async ({ page }) => {
    console.log('🌐 웹사이트 접속 중...');
    
    // 웹사이트 접속
    await page.goto('https://gma3561.github.io/The-realty_hasia/');
    
    // 페이지 로드 대기
    await page.waitForTimeout(3000);
    
    // 제목 확인
    const title = await page.title();
    console.log(`📋 페이지 제목: ${title}`);
    
    // 매물 목록 로드 대기
    await page.waitForSelector('.property-item, .property-card, [data-property], .매물', { timeout: 10000 });
    
    // 매물 개수 확인
    const propertyElements = await page.$$('.property-item, .property-card, [data-property], .매물, tr[data-property-id]');
    console.log(`🏠 화면에 표시된 매물 개수: ${propertyElements.length}개`);
    
    // 첫 번째 매물 정보 확인
    if (propertyElements.length > 0) {
        console.log('\n📋 첫 번째 매물 정보:');
        
        // 다양한 셀렉터로 매물 정보 추출 시도
        const selectors = [
            { name: '매물명', selector: '.property-name, .매물명, [data-property-name], td:nth-child(1)' },
            { name: '주소', selector: '.address, .주소, [data-address], td:nth-child(2)' },
            { name: '가격', selector: '.price, .가격, [data-price], td:nth-child(3)' },
            { name: '담당자', selector: '.manager, .담당자, [data-manager], td:nth-child(4)' }
        ];
        
        for (const { name, selector } of selectors) {
            try {
                const element = await page.locator(selector).first();
                const text = await element.textContent();
                if (text && text.trim()) {
                    console.log(`  ${name}: ${text.trim()}`);
                }
            } catch (e) {
                console.log(`  ${name}: 요소를 찾을 수 없음`);
            }
        }
    }
    
    // 테이블이 있는지 확인
    const tableExists = await page.locator('table').count() > 0;
    if (tableExists) {
        console.log('\n📊 테이블 구조 확인:');
        const headers = await page.$$eval('th', elements => elements.map(el => el.textContent?.trim()));
        console.log(`컬럼: ${headers.join(', ')}`);
        
        const rowCount = await page.locator('tbody tr').count();
        console.log(`테이블 행 수: ${rowCount}개`);
    }
    
    // 로딩 상태 확인
    const loadingElements = await page.$$('.loading, .spinner, .로딩중');
    if (loadingElements.length > 0) {
        console.log('⏳ 아직 로딩 중인 요소가 있습니다.');
    }
    
    // 에러 메시지 확인
    const errorElements = await page.$$('.error, .오류, .alert-danger');
    if (errorElements.length > 0) {
        console.log('❌ 에러 메시지 발견:');
        for (const errorEl of errorElements) {
            const errorText = await errorEl.textContent();
            console.log(`  ${errorText}`);
        }
    }
    
    // 스크린샷 저장
    await page.screenshot({ 
        path: 'screenshots/web-data-check.png', 
        fullPage: true 
    });
    console.log('\n📸 스크린샷 저장: screenshots/web-data-check.png');
    
    // 콘솔 로그 확인
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log(`🔴 콘솔 에러: ${msg.text()}`);
        }
    });
    
    console.log('\n✅ 웹사이트 확인 완료');
});