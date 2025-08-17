import { chromium } from 'playwright';

async function checkWebsite() {
    console.log('🌐 웹사이트 매물 데이터 확인 시작...');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        // 웹사이트 접속
        console.log('📱 웹사이트 접속 중...');
        await page.goto('https://gma3561.github.io/The-realty_hasia/');
        
        // 페이지 로드 대기
        await page.waitForTimeout(5000);
        
        // 제목 확인
        const title = await page.title();
        console.log(`📋 페이지 제목: ${title}`);
        
        // 매물 테이블 확인
        await page.waitForSelector('table', { timeout: 10000 });
        
        // 테이블 행 개수 확인
        const rowCount = await page.locator('tbody tr').count();
        console.log(`🏠 테이블에 표시된 매물 개수: ${rowCount}개`);
        
        // 첫 번째 매물 정보 확인
        if (rowCount > 0) {
            console.log('\n📋 첫 번째 매물 정보:');
            
            const firstRow = page.locator('tbody tr').first();
            const cells = await firstRow.locator('td').allTextContents();
            
            if (cells.length > 0) {
                console.log(`  매물명: ${cells[0] || '없음'}`);
                console.log(`  주소: ${cells[1] || '없음'}`);
                console.log(`  가격: ${cells[2] || '없음'}`);
                console.log(`  담당자: ${cells[3] || '없음'}`);
            }
        }
        
        // 테이블 헤더 확인
        const headers = await page.$$eval('th', elements => 
            elements.map(el => el.textContent?.trim())
        );
        console.log(`\n📊 테이블 컬럼: ${headers.join(', ')}`);
        
        // 몇 개 더 샘플 확인
        if (rowCount >= 5) {
            console.log('\n📝 매물 샘플 5개:');
            for (let i = 0; i < 5; i++) {
                const row = page.locator('tbody tr').nth(i);
                const cells = await row.locator('td').allTextContents();
                console.log(`  ${i+1}. ${cells[0] || '매물명없음'} - ${cells[1] || '주소없음'}`);
            }
        }
        
        // 에러 메시지 확인
        const errorElements = await page.$$('.error, .alert-danger, .오류');
        if (errorElements.length > 0) {
            console.log('\n❌ 에러 메시지 발견:');
            for (const errorEl of errorElements) {
                const errorText = await errorEl.textContent();
                console.log(`  ${errorText}`);
            }
        }
        
        // 콘솔 로그 확인
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log(`🔴 콘솔 에러: ${msg.text()}`);
            }
        });
        
        // 스크린샷 저장
        await page.screenshot({ 
            path: 'screenshots/web-data-check.png', 
            fullPage: true 
        });
        console.log('\n📸 스크린샷 저장: screenshots/web-data-check.png');
        
        console.log('\n✅ 웹사이트 확인 완료');
        
    } catch (error) {
        console.error('❌ 웹사이트 확인 중 오류:', error);
    } finally {
        await browser.close();
    }
}

checkWebsite();