import { chromium } from 'playwright';

async function testLocalCRUD() {
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 500  // 각 동작을 천천히 실행
    });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log('=== 로컬 CRUD 테스트 시작 ===\n');
    
    try {
        // 1. 테스트 페이지 접속
        console.log('1. 테스트 페이지 접속...');
        await page.goto('http://localhost:8080/test-crud-local.html');
        await page.waitForLoadState('networkidle');
        console.log('✓ 페이지 로드 완료\n');
        
        // 2. 새 매물 등록
        console.log('2. 새 매물 등록 테스트...');
        
        const testPropertyName = `테스트매물_${Date.now()}`;
        
        await page.selectOption('#manager', '테스트');
        await page.fill('#propertyName', testPropertyName);
        await page.selectOption('#status', '거래가능');
        await page.selectOption('#propertyType', '아파트');
        await page.selectOption('#tradeType', '매매');
        await page.fill('#price', '75000');
        await page.fill('#address', '서울시 강남구 테스트동 123');
        await page.fill('#notes', '자동화 테스트로 생성된 매물');
        
        // 저장 버튼 클릭
        await page.click('button[type="submit"]');
        
        // alert 처리
        page.once('dialog', async dialog => {
            console.log(`  Alert: ${dialog.message()}`);
            await dialog.accept();
        });
        
        await page.waitForTimeout(1000);
        console.log('✓ 매물 등록 완료\n');
        
        // 3. 등록된 매물 확인
        console.log('3. 등록된 매물 확인...');
        const propertyCell = await page.locator(`td:has-text("${testPropertyName}")`);
        if (await propertyCell.isVisible()) {
            console.log(`✓ 매물 "${testPropertyName}" 확인됨\n`);
        } else {
            throw new Error('등록한 매물을 찾을 수 없습니다.');
        }
        
        // 4. 관리자 모드 활성화
        console.log('4. 관리자 모드 활성화...');
        // 관리자 모드 버튼은 폼 내부에 있음
        const adminButton = await page.locator('.actions button.btn-warning').first();
        await adminButton.click();
        await page.waitForTimeout(500);
        console.log('✓ 관리자 모드 활성화됨\n');
        
        // 5. 매물 수정
        console.log('5. 매물 수정 테스트...');
        
        // 수정 버튼 클릭
        const editButton = await page.locator('button:has-text("수정")').last();
        await editButton.click();
        await page.waitForTimeout(500);
        
        // 수정 내용 입력
        await page.fill('#propertyName', testPropertyName + '_수정됨');
        await page.selectOption('#status', '거래완료');
        await page.fill('#price', '80000');
        await page.fill('#notes', '수정 테스트 완료');
        
        // 저장
        await page.click('button[type="submit"]');
        
        // alert 처리
        page.once('dialog', async dialog => {
            console.log(`  Alert: ${dialog.message()}`);
            await dialog.accept();
        });
        
        await page.waitForTimeout(1000);
        console.log('✓ 매물 수정 완료\n');
        
        // 6. 수정된 내용 확인
        console.log('6. 수정된 매물 확인...');
        const modifiedCell = await page.locator(`td:has-text("${testPropertyName}_수정됨")`);
        const statusCell = await page.locator('.status-badge:has-text("거래완료")').last();
        
        if (await modifiedCell.isVisible() && await statusCell.isVisible()) {
            console.log('✓ 수정된 내용 확인됨\n');
        } else {
            throw new Error('수정된 내용을 확인할 수 없습니다.');
        }
        
        // 7. 매물 삭제
        console.log('7. 매물 삭제 테스트...');
        
        // 삭제 버튼 클릭
        const deleteButton = await page.locator('button:has-text("삭제")').last();
        await deleteButton.click();
        
        // 확인 다이얼로그 처리
        page.once('dialog', async dialog => {
            console.log(`  확인: ${dialog.message()}`);
            await dialog.accept();
        });
        
        await page.waitForTimeout(500);
        
        // 삭제 완료 alert 처리
        page.once('dialog', async dialog => {
            console.log(`  Alert: ${dialog.message()}`);
            await dialog.accept();
        });
        
        await page.waitForTimeout(1000);
        console.log('✓ 매물 삭제 완료\n');
        
        // 8. 삭제 확인
        console.log('8. 삭제 확인...');
        const deletedCell = await page.locator(`td:has-text("${testPropertyName}_수정됨")`);
        
        if (await deletedCell.isVisible()) {
            throw new Error('매물이 삭제되지 않았습니다.');
        } else {
            console.log('✓ 매물이 성공적으로 삭제됨\n');
        }
        
        console.log('=== 테스트 결과 ===');
        console.log('✅ 매물 등록: 성공');
        console.log('✅ 매물 조회: 성공');
        console.log('✅ 매물 수정: 성공');
        console.log('✅ 매물 삭제: 성공');
        console.log('\n🎉 모든 CRUD 테스트 통과!');
        
    } catch (error) {
        console.error('\n❌ 테스트 실패:', error.message);
        
        // 스크린샷 저장
        await page.screenshot({ path: 'test-local-error.png', fullPage: true });
        console.log('오류 스크린샷 저장: test-local-error.png');
        
        throw error;
    } finally {
        await page.waitForTimeout(2000);
        await browser.close();
    }
}

// 테스트 실행
console.log('테스트를 시작합니다...\n');
testLocalCRUD()
    .then(() => {
        console.log('\n✅ 테스트 완료!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ 테스트 실패:', error);
        process.exit(1);
    });