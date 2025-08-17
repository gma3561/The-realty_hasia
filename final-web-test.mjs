import { chromium } from 'playwright';

async function finalWebTest() {
    console.log('🎯 최종 웹사이트 데이터 검증 시작...');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        // 웹사이트 접속
        console.log('🌐 웹사이트 접속...');
        await page.goto('https://gma3561.github.io/The-realty_hasia/');
        
        // 데이터 로드 대기
        await page.waitForTimeout(8000);
        
        // 테이블 행 개수 확인
        const rowCount = await page.locator('tbody tr').count();
        console.log(`📊 현재 페이지 매물 개수: ${rowCount}개`);
        
        if (rowCount === 0) {
            console.log('❌ 데이터가 로드되지 않았습니다.');
            return;
        }
        
        // 첫 5개 매물 상세 정보 확인
        console.log('\n🏠 매물 데이터 샘플:');
        for (let i = 0; i < Math.min(5, rowCount); i++) {
            const row = page.locator('tbody tr').nth(i);
            const cells = await row.locator('td').allTextContents();
            
            if (cells.length >= 4) {
                console.log(`  ${i+1}. ${cells[6] || '매물명없음'} - ${cells[7] || '주소없음'} - ${cells[5] || '가격없음'}`);
            }
        }
        
        // 전체 데이터 개수 확인 (페이지 정보에서)
        const pageInfo = await page.locator('.pagination-info, .total-count').textContent().catch(() => '');
        if (pageInfo) {
            console.log(`\n📈 페이지 정보: ${pageInfo}`);
        }
        
        // 테이블 헤더 확인
        const headers = await page.$$eval('th', elements => 
            elements.map(el => el.textContent?.trim())
        );
        console.log(`\n📋 테이블 헤더: ${headers.slice(0, 8).join(', ')}...`);
        
        // 마지막 페이지로 이동해서 전체 데이터 개수 확인
        const lastPageButton = page.locator('.pagination button').last();
        const lastPageExists = await lastPageButton.count() > 0;
        
        if (lastPageExists) {
            await lastPageButton.click();
            await page.waitForTimeout(2000);
            
            const lastPageRows = await page.locator('tbody tr').count();
            console.log(`📄 마지막 페이지 매물 개수: ${lastPageRows}개`);
        }
        
        // 스크린샷 저장
        await page.screenshot({ 
            path: 'screenshots/final-success.png', 
            fullPage: true 
        });
        console.log('\n📸 최종 스크린샷 저장: screenshots/final-success.png');
        
        console.log('\n✅ 웹사이트 데이터 로드 성공 확인!');
        
    } catch (error) {
        console.error('❌ 테스트 중 오류:', error);
    } finally {
        await browser.close();
    }
}

finalWebTest();