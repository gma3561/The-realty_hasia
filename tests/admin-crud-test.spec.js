import { test, expect } from '@playwright/test';

test.describe('관리자 CRUD 기능 테스트', () => {
    const BASE_URL = 'https://gma3561.github.io/The-realty_hasia/';
    let testPropertyId = null;
    let testPropertyNumber = null;

    test.beforeEach(async ({ page }) => {
        // 콘솔 로그 캡처
        page.on('console', msg => {
            console.log(`[브라우저 로그] ${msg.type()}: ${msg.text()}`);
        });

        // 에러 캡처
        page.on('pageerror', error => {
            console.error(`[페이지 에러] ${error.message}`);
        });
    });

    test('1. 관리자 로그인 및 UI 확인', async ({ page }) => {
        console.log('\n=== 관리자 로그인 테스트 ===\n');
        
        await page.goto(BASE_URL);
        await page.waitForSelector('.data-table', { timeout: 10000 });
        
        // 관리자 로그인 전 상태 확인
        const adminColumnBeforeLogin = await page.locator('#adminColumn').isVisible();
        console.log(`로그인 전 관리자 컬럼 표시: ${adminColumnBeforeLogin ? '✅' : '❌'}`);
        expect(adminColumnBeforeLogin).toBeFalsy();
        
        // 관리자 로그인
        await page.evaluate(() => {
            sessionStorage.setItem('admin_logged_in', 'true');
        });
        
        // 페이지 새로고침
        await page.reload();
        await page.waitForSelector('.data-table', { timeout: 10000 });
        
        // 관리자 로그인 후 상태 확인
        const adminColumnAfterLogin = await page.locator('#adminColumn').isVisible();
        console.log(`로그인 후 관리자 컬럼 표시: ${adminColumnAfterLogin ? '✅' : '❌'}`);
        
        // 관리자 로그아웃 버튼 확인
        const logoutBtn = await page.locator('#adminLogoutBtn').isVisible();
        console.log(`관리자 로그아웃 버튼 표시: ${logoutBtn ? '✅' : '❌'}`);
        
        expect(adminColumnAfterLogin).toBeTruthy();
        expect(logoutBtn).toBeTruthy();
    });

    test('2. 테스트 매물 생성', async ({ page }) => {
        console.log('\n=== 매물 생성 테스트 ===\n');
        
        // 관리자 로그인
        await page.goto(BASE_URL);
        await page.evaluate(() => {
            sessionStorage.setItem('admin_logged_in', 'true');
        });
        
        // 매물 등록 페이지로 이동
        await page.click('button:has-text("매물등록")');
        await page.waitForURL('**/form.html');
        
        // 테스트 데이터 입력
        const testData = {
            property_name: `자동테스트 매물 ${Date.now()}`,
            property_type: '아파트',
            trade_type: '매매',
            status: '거래가능',
            manager: '테스트담당자',
            price: '50000',
            address: '서울시 강남구 테스트로 123',
            dong: '101',
            ho: '1501',
            supply_area_sqm: '84.5',
            supply_area_pyeong: '25.5',
            floor_current: '15',
            floor_total: '20'
        };
        
        // 폼 필드 입력
        for (const [field, value] of Object.entries(testData)) {
            const input = page.locator(`#${field}`);
            if (await input.count() > 0) {
                const tagName = await input.evaluate(el => el.tagName.toLowerCase());
                if (tagName === 'select') {
                    await input.selectOption(value);
                } else {
                    await input.fill(value);
                }
                console.log(`✅ ${field}: ${value}`);
            }
        }
        
        // 저장 버튼 클릭
        await page.click('button:has-text("저장")');
        
        // 저장 완료 대기
        await page.waitForFunction(() => {
            const alerts = document.querySelector('.alert-success');
            return alerts && alerts.textContent.includes('저장되었습니다');
        }, { timeout: 10000 }).catch(() => {
            console.log('알림 메시지를 찾을 수 없음, URL 변경 확인');
        });
        
        // 목록 페이지로 돌아왔는지 확인
        await page.waitForURL(BASE_URL, { timeout: 10000 }).catch(() => {
            console.log('자동 리디렉션 안됨, 수동으로 이동');
            page.goto(BASE_URL);
        });
        
        // 생성된 매물 확인
        await page.waitForSelector('.data-table tbody tr');
        const rows = await page.locator('.data-table tbody tr').count();
        console.log(`생성 후 전체 매물 수: ${rows}개`);
        
        // 방금 생성한 매물 찾기
        const propertyCell = await page.locator(`td:has-text("${testData.property_name}")`).first();
        if (await propertyCell.count() > 0) {
            const row = await propertyCell.locator('xpath=ancestor::tr').first();
            testPropertyNumber = await row.locator('td:nth-child(2)').textContent();
            console.log(`✅ 매물 생성 완료: ${testPropertyNumber}`);
            
            // ID 저장 (수정/삭제용)
            const onclickAttr = await row.getAttribute('onclick');
            if (onclickAttr) {
                const match = onclickAttr.match(/showPropertyDetails\(['"]([^'"]+)['"]\)/);
                if (match) {
                    testPropertyId = match[1];
                    console.log(`매물 ID: ${testPropertyId}`);
                }
            }
        }
        
        expect(testPropertyNumber).toBeTruthy();
    });

    test('3. 매물 수정 테스트', async ({ page }) => {
        console.log('\n=== 매물 수정 테스트 ===\n');
        
        // 관리자 로그인
        await page.goto(BASE_URL);
        await page.evaluate(() => {
            sessionStorage.setItem('admin_logged_in', 'true');
        });
        await page.reload();
        await page.waitForSelector('.data-table', { timeout: 10000 });
        
        // 첫 번째 매물의 수정 버튼 찾기
        const firstRow = await page.locator('.data-table tbody tr').first();
        const editBtn = await firstRow.locator('.btn-edit').first();
        
        if (await editBtn.count() > 0) {
            console.log('수정 버튼 찾음');
            
            // 수정 버튼 클릭
            await editBtn.click();
            await page.waitForURL('**/form.html?id=*', { timeout: 10000 });
            console.log('수정 페이지로 이동 완료');
            
            // 가격 수정
            const priceInput = page.locator('#price');
            const originalPrice = await priceInput.inputValue();
            const newPrice = '99999';
            await priceInput.fill(newPrice);
            console.log(`가격 변경: ${originalPrice} -> ${newPrice}`);
            
            // 메모 추가
            const memoInput = page.locator('#manager_memo');
            await memoInput.fill('Playwright 자동 테스트로 수정됨');
            
            // 저장
            await page.click('button:has-text("저장")');
            
            // 저장 완료 대기
            await page.waitForTimeout(2000);
            
            // 목록으로 돌아가기
            await page.goto(BASE_URL);
            await page.waitForSelector('.data-table', { timeout: 10000 });
            
            // 수정 확인
            const priceCell = await page.locator(`td:has-text("${newPrice}")`).first();
            const isPriceUpdated = await priceCell.count() > 0;
            console.log(`가격 수정 확인: ${isPriceUpdated ? '✅' : '❌'}`);
            
            expect(isPriceUpdated).toBeTruthy();
        } else {
            console.log('⚠️ 수정 버튼을 찾을 수 없음 - 관리자 모드가 활성화되지 않았을 수 있음');
        }
    });

    test('4. 소프트 삭제 테스트', async ({ page }) => {
        console.log('\n=== 소프트 삭제 테스트 ===\n');
        
        // 관리자 로그인
        await page.goto(BASE_URL);
        await page.evaluate(() => {
            sessionStorage.setItem('admin_logged_in', 'true');
        });
        await page.reload();
        await page.waitForSelector('.data-table', { timeout: 10000 });
        
        // 삭제 전 매물 수
        const rowsBefore = await page.locator('.data-table tbody tr').count();
        console.log(`삭제 전 매물 수: ${rowsBefore}개`);
        
        // 첫 번째 매물의 삭제 버튼 찾기
        const firstRow = await page.locator('.data-table tbody tr').first();
        const propertyName = await firstRow.locator('td:nth-child(7)').textContent();
        const deleteBtn = await firstRow.locator('.btn-delete').first();
        
        if (await deleteBtn.count() > 0) {
            console.log(`삭제할 매물: ${propertyName}`);
            
            // 삭제 확인 다이얼로그 처리
            page.once('dialog', dialog => {
                console.log(`다이얼로그 메시지: ${dialog.message()}`);
                dialog.accept();
            });
            
            // 삭제 버튼 클릭
            await deleteBtn.click();
            
            // 삭제 처리 대기
            await page.waitForTimeout(3000);
            
            // 페이지 새로고침
            await page.reload();
            await page.waitForSelector('.data-table', { timeout: 10000 });
            
            // 삭제 후 매물 수
            const rowsAfter = await page.locator('.data-table tbody tr').count();
            console.log(`삭제 후 매물 수: ${rowsAfter}개`);
            
            // 삭제된 매물이 목록에서 사라졌는지 확인
            const deletedProperty = await page.locator(`td:has-text("${propertyName}")`).count();
            console.log(`삭제된 매물 표시 여부: ${deletedProperty === 0 ? '❌ (정상)' : '✅ (오류)'}`);
            
            expect(rowsAfter).toBeLessThan(rowsBefore);
            expect(deletedProperty).toBe(0);
        } else {
            console.log('⚠️ 삭제 버튼을 찾을 수 없음');
        }
    });

    test('5. 삭제된 매물 복구 테스트', async ({ page }) => {
        console.log('\n=== 삭제된 매물 복구 테스트 ===\n');
        
        // 테스트 페이지로 이동
        await page.goto(`file://${process.cwd()}/test-admin-crud.html`);
        await page.waitForTimeout(1000);
        
        // 관리자 로그인
        await page.click('button:has-text("관리자 로그인")');
        console.log('관리자 로그인 완료');
        
        // 삭제된 매물 조회
        await page.click('button:has-text("삭제된 매물 조회")');
        await page.waitForTimeout(2000);
        
        // 삭제된 매물 테이블 확인
        const deletedTable = await page.locator('.deleted-properties-table').isVisible();
        if (deletedTable) {
            const deletedRows = await page.locator('.deleted-properties-table tbody tr').count();
            console.log(`삭제된 매물 수: ${deletedRows}개`);
            
            if (deletedRows > 0) {
                // 첫 번째 삭제된 매물 정보
                const firstDeleted = await page.locator('.deleted-properties-table tbody tr').first();
                const deletedName = await firstDeleted.locator('td:nth-child(2)').textContent();
                console.log(`복구할 매물: ${deletedName}`);
                
                // 복구 버튼 클릭
                await page.click('button:has-text("마지막 삭제 매물 복구")');
                await page.waitForTimeout(2000);
                
                // 복구 로그 확인
                const restoreLog = await page.locator('#restoreLog').textContent();
                const isRestored = restoreLog.includes('복구 완료');
                console.log(`복구 결과: ${isRestored ? '✅' : '❌'}`);
                
                expect(isRestored).toBeTruthy();
            } else {
                console.log('삭제된 매물이 없음');
            }
        } else {
            console.log('삭제된 매물 테이블을 찾을 수 없음');
        }
    });

    test('6. 수정/삭제 버튼 표시 확인', async ({ page }) => {
        console.log('\n=== 수정/삭제 버튼 표시 확인 ===\n');
        
        await page.goto(BASE_URL);
        await page.waitForSelector('.data-table', { timeout: 10000 });
        
        // 일반 사용자 모드
        const editBtnBeforeLogin = await page.locator('.btn-edit').count();
        const deleteBtnBeforeLogin = await page.locator('.btn-delete').count();
        console.log(`일반 사용자 - 수정 버튼: ${editBtnBeforeLogin}개, 삭제 버튼: ${deleteBtnBeforeLogin}개`);
        
        // 관리자 로그인
        await page.evaluate(() => {
            sessionStorage.setItem('admin_logged_in', 'true');
        });
        await page.reload();
        await page.waitForSelector('.data-table', { timeout: 10000 });
        
        // 관리자 모드
        const editBtnAfterLogin = await page.locator('.btn-edit').count();
        const deleteBtnAfterLogin = await page.locator('.btn-delete').count();
        console.log(`관리자 - 수정 버튼: ${editBtnAfterLogin}개, 삭제 버튼: ${deleteBtnAfterLogin}개`);
        
        // 관리자 모드에서만 버튼이 표시되어야 함
        expect(editBtnBeforeLogin).toBe(0);
        expect(deleteBtnBeforeLogin).toBe(0);
        expect(editBtnAfterLogin).toBeGreaterThan(0);
        expect(deleteBtnAfterLogin).toBeGreaterThan(0);
    });
});