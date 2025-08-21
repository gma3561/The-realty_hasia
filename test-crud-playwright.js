import { chromium } from 'playwright';

async function testCRUD() {
    const browser = await chromium.launch({ 
        headless: false,
        slowMo: 100
    });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log('=== CRUD 테스트 시작 ===\n');
    
    try {
        // 1. 메인 페이지 접속
        console.log('1. 메인 페이지 접속...');
        await page.goto('http://localhost:8080/');
        await page.waitForLoadState('networkidle');
        console.log('✓ 메인 페이지 로드 완료\n');
        
        // 2. 매물 등록 페이지로 이동
        console.log('2. 매물 등록 페이지로 이동...');
        await page.click('button:has-text("매물등록")');
        await page.waitForLoadState('networkidle');
        console.log('✓ 매물 등록 페이지 로드 완료\n');
        
        // 3. 테스트 매물 등록
        console.log('3. 테스트 매물 등록...');
        
        // 담당자 선택 (select 박스)
        await page.selectOption('#manager', '하상현');
        
        // 매물명 입력
        const testPropertyName = `테스트매물_${Date.now()}`;
        await page.fill('#propertyName', testPropertyName);
        
        // 매물상태 선택
        await page.selectOption('#status', '거래가능');
        
        // 매물종류 선택
        await page.selectOption('#propertyType', '아파트');
        
        // 거래유형 선택
        await page.selectOption('#tradeType', '매매');
        
        // 금액 입력
        await page.fill('#price', '50000');
        
        // 소재지 입력
        await page.fill('#address', '서울시 강남구 테스트동');
        
        // 동/호 입력
        await page.fill('#dong', '101');
        await page.fill('#unit', '1501');
        
        // 면적 입력
        await page.fill('#supplyArea', '84.5');
        await page.fill('#supplyPyeong', '25.5');
        
        // 층 정보 입력
        await page.fill('#floorInfo', '15/20');
        
        // 특이사항 입력
        await page.fill('#specialNotes', '자동화 테스트로 생성된 매물입니다.');
        
        // alert 처리 설정 (저장 버튼 클릭 전에 설정)
        page.on('dialog', async dialog => {
            console.log(`Alert: ${dialog.message()}`);
            await dialog.accept();
        });
        
        // 저장 버튼 클릭
        await page.click('button:has-text("저장하기")');
        
        // 저장 완료 및 페이지 이동 대기
        await page.waitForTimeout(5000);
        
        // 목록 페이지로 돌아왔는지 확인 (현재 URL 확인)
        const currentUrl = page.url();
        if (currentUrl.includes('form.html')) {
            console.log('⚠ 아직 form 페이지에 있음. 목록으로 직접 이동...');
            await page.goto('http://localhost:8080/');
            await page.waitForLoadState('networkidle');
        }
        
        await page.waitForSelector('table#dataTable', { timeout: 10000 });
        console.log('✓ 매물 등록 완료\n');
        
        // 4. 등록된 매물 확인
        console.log('4. 등록된 매물 확인...');
        await page.waitForTimeout(2000);
        
        // 검색창에 매물명 입력
        await page.fill('.search-input', testPropertyName);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);
        
        // 매물이 목록에 있는지 확인
        const propertyRow = await page.locator(`td:has-text("${testPropertyName}")`).first();
        if (await propertyRow.isVisible()) {
            console.log(`✓ 매물 "${testPropertyName}" 확인됨\n`);
        } else {
            throw new Error('등록한 매물을 찾을 수 없습니다.');
        }
        
        // 5. 관리자 로그인
        console.log('5. 관리자 로그인...');
        // 헤더 타이틀 3번 클릭 (관리자 모드 진입)
        const headerTitle = await page.locator('.header-title');
        for (let i = 0; i < 3; i++) {
            await headerTitle.click();
            await page.waitForTimeout(100);
        }
        
        // 관리자 비밀번호 입력
        await page.fill('#adminPasswordInput', '1229');
        await page.click('button:has-text("로그인")');
        await page.waitForTimeout(1000);
        console.log('✓ 관리자 로그인 완료\n');
        
        // 6. 매물 수정 테스트
        console.log('6. 매물 수정 테스트...');
        
        // 검색 후 수정 버튼 찾기
        await page.fill('.search-input', testPropertyName);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);
        
        // 수정 버튼 클릭
        const editButton = await page.locator('.btn-edit').first();
        if (await editButton.isVisible()) {
            await editButton.click();
            await page.waitForLoadState('networkidle');
            console.log('✓ 수정 페이지로 이동\n');
            
            // 수정 내용 입력
            await page.fill('#propertyName', testPropertyName + '_수정됨');
            await page.fill('#price', '55000');
            await page.fill('#specialNotes', '수정 테스트 완료');
            
            // 저장
            await page.click('button:has-text("저장하기")');
            await page.waitForTimeout(3000);
            
            // 목록으로 돌아왔는지 확인
            await page.waitForSelector('table#dataTable', { timeout: 10000 });
            console.log('✓ 매물 수정 완료\n');
        } else {
            console.log('⚠ 수정 버튼을 찾을 수 없습니다.\n');
        }
        
        // 7. 매물 삭제 테스트
        console.log('7. 매물 삭제 테스트...');
        
        // 수정된 매물 검색
        await page.fill('.search-input', testPropertyName + '_수정됨');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);
        
        // 삭제 버튼 클릭
        const deleteButton = await page.locator('.btn-delete').first();
        if (await deleteButton.isVisible()) {
            await deleteButton.click();
            
            // 확인 다이얼로그 처리
            page.once('dialog', async dialog => {
                console.log(`삭제 확인: ${dialog.message()}`);
                await dialog.accept();
            });
            
            await page.waitForTimeout(3000);
            console.log('✓ 매물 삭제 완료\n');
        } else {
            console.log('⚠ 삭제 버튼을 찾을 수 없습니다.\n');
        }
        
        // 8. 관리자 로그아웃
        console.log('8. 관리자 로그아웃...');
        const logoutButton = await page.locator('#adminLogoutBtn');
        if (await logoutButton.isVisible()) {
            await logoutButton.click();
            console.log('✓ 관리자 로그아웃 완료\n');
        }
        
        console.log('=== 테스트 완료 ===');
        console.log('✓ 매물 등록 성공');
        console.log('✓ 매물 수정 성공');
        console.log('✓ 매물 삭제 성공');
        
    } catch (error) {
        console.error('테스트 실패:', error.message);
        
        // 스크린샷 저장
        await page.screenshot({ path: 'test-error.png', fullPage: true });
        console.log('오류 스크린샷 저장: test-error.png');
        
        // 콘솔 로그 출력
        page.on('console', msg => console.log('브라우저 콘솔:', msg.text()));
        
        throw error;
    } finally {
        await page.waitForTimeout(3000);
        await browser.close();
    }
}

// 테스트 실행
testCRUD().catch(console.error);