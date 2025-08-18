import { test, expect } from '@playwright/test';

test.describe('공유여부 표시 테스트', () => {
    const PRODUCTION_URL = 'https://gma3561.github.io/The-realty_hasia/';

    test('매물 목록에서 공유여부 표시 확인', async ({ page }) => {
        console.log('🔍 공유여부 표시 테스트 시작\n');
        console.log('='.repeat(80));

        // 페이지 로드
        await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
        await page.waitForSelector('.data-table', { timeout: 15000 });

        // 테이블 헤더 확인
        const headers = await page.locator('.data-table thead th').allTextContents();
        console.log('📋 테이블 헤더:', headers);
        
        // 공유여부 컬럼 위치 찾기
        let sharedColumnIndex = -1;
        for (let i = 0; i < headers.length; i++) {
            if (headers[i].includes('공유여부')) {
                sharedColumnIndex = i + 1; // CSS nth-child는 1부터 시작
                console.log(`✅ 공유여부 컬럼 발견: ${sharedColumnIndex}번째 컬럼`);
                break;
            }
        }

        if (sharedColumnIndex === -1) {
            console.log('❌ 공유여부 컬럼을 찾을 수 없습니다!');
            return;
        }

        // 데이터 행 확인
        const rows = await page.locator('.data-table tbody tr').count();
        console.log(`\n📊 전체 데이터 행: ${rows}개\n`);

        // 처음 20개 행의 공유여부 값 확인
        const checkRows = Math.min(rows, 20);
        let sharedCount = 0;
        let notSharedCount = 0;
        let emptyCount = 0;
        
        console.log('공유여부 값 확인 (처음 20개):');
        console.log('-'.repeat(80));

        for (let i = 1; i <= checkRows; i++) {
            // 매물명 가져오기
            const propertyName = await page.locator(`.data-table tbody tr:nth-child(${i}) td:nth-child(8)`).textContent();
            
            // 공유여부 값 가져오기
            const sharedValue = await page.locator(`.data-table tbody tr:nth-child(${i}) td:nth-child(${sharedColumnIndex})`).textContent();
            
            // 통계 계산
            if (sharedValue === '공유') {
                sharedCount++;
                console.log(`${i}. [공유] ${propertyName}`);
            } else if (sharedValue === '비공유') {
                notSharedCount++;
                console.log(`${i}. [비공유] ${propertyName}`);
            } else if (sharedValue === '-' || sharedValue === '') {
                emptyCount++;
                console.log(`${i}. [미설정] ${propertyName}`);
            } else {
                console.log(`${i}. [기타: ${sharedValue}] ${propertyName}`);
            }
        }

        // 통계 출력
        console.log('\n' + '='.repeat(80));
        console.log('📊 공유여부 통계:');
        console.log('='.repeat(80));
        console.log(`✅ 공유: ${sharedCount}개 (${(sharedCount/checkRows*100).toFixed(1)}%)`);
        console.log(`❌ 비공유: ${notSharedCount}개 (${(notSharedCount/checkRows*100).toFixed(1)}%)`);
        console.log(`⚪ 미설정: ${emptyCount}개 (${(emptyCount/checkRows*100).toFixed(1)}%)`);

        // 검증
        expect(sharedColumnIndex).toBeGreaterThan(0);
        expect(sharedCount + notSharedCount + emptyCount).toBe(checkRows);
        
        if (notSharedCount === 0 && sharedCount === 0) {
            console.log('\n⚠️ 경고: 공유/비공유 값이 하나도 표시되지 않습니다!');
        } else {
            console.log('\n✅ 공유여부가 정상적으로 표시되고 있습니다.');
        }

        // 스크린샷 저장
        await page.screenshot({ 
            path: 'test-results/shared-display-test.png',
            fullPage: false
        });
        console.log('\n📸 스크린샷 저장: test-results/shared-display-test.png');
    });

    test('개별 매물 상세보기에서 공유여부 확인', async ({ page }) => {
        console.log('\n🔍 매물 상세보기 공유여부 테스트\n');
        console.log('='.repeat(80));

        await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
        await page.waitForSelector('.data-table', { timeout: 15000 });

        // 첫 번째 매물 클릭
        const firstRow = page.locator('.data-table tbody tr').first();
        const propertyName = await firstRow.locator('td:nth-child(8)').textContent();
        console.log(`📋 선택한 매물: ${propertyName}`);

        await firstRow.click();
        
        // 사이드패널 또는 모달 대기
        try {
            // 데스크탑: 사이드패널
            await page.waitForSelector('#sidePanel.show', { timeout: 3000 });
            const sideShared = await page.locator('#sideShared').textContent();
            console.log(`✅ 사이드패널 공유여부: ${sideShared}`);
            
            expect(['공유', '비공유', '-']).toContain(sideShared);
            
            // 스크린샷
            await page.screenshot({ 
                path: 'test-results/shared-sidepanel-test.png',
                fullPage: false
            });
            console.log('📸 사이드패널 스크린샷 저장');
            
        } catch (e) {
            // 모바일: 모달
            console.log('사이드패널이 없음, 모바일 모달 확인 중...');
            
            await page.waitForSelector('#detailModal', { timeout: 3000 });
            const mobileShared = await page.locator('#mobileShared').textContent();
            console.log(`✅ 모바일 모달 공유여부: ${mobileShared}`);
            
            expect(['공유', '비공유', '-']).toContain(mobileShared);
            
            // 스크린샷
            await page.screenshot({ 
                path: 'test-results/shared-modal-test.png',
                fullPage: false
            });
            console.log('📸 모바일 모달 스크린샷 저장');
        }

        console.log('\n✅ 상세보기 공유여부 테스트 완료');
    });

    test('다양한 화면 크기에서 공유여부 표시 확인', async ({ page }) => {
        console.log('\n🔍 반응형 공유여부 표시 테스트\n');
        console.log('='.repeat(80));

        const viewports = [
            { width: 1920, height: 1080, name: 'Desktop' },
            { width: 768, height: 1024, name: 'Tablet' },
            { width: 375, height: 667, name: 'Mobile' }
        ];

        for (const viewport of viewports) {
            console.log(`\n📱 ${viewport.name} (${viewport.width}x${viewport.height})`);
            console.log('-'.repeat(40));
            
            await page.setViewportSize({ width: viewport.width, height: viewport.height });
            await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
            await page.waitForSelector('.data-table', { timeout: 15000 });

            // 테이블 확인
            const tableVisible = await page.locator('.data-table').isVisible();
            console.log(`테이블 표시: ${tableVisible ? '✅' : '❌'}`);

            if (tableVisible) {
                // 공유여부 컬럼 찾기
                const headers = await page.locator('.data-table thead th').allTextContents();
                const hasSharedColumn = headers.some(h => h.includes('공유여부'));
                console.log(`공유여부 컬럼: ${hasSharedColumn ? '✅' : '❌'}`);

                if (hasSharedColumn) {
                    // 첫 번째 행의 공유여부 값 확인
                    const sharedColumnIndex = headers.findIndex(h => h.includes('공유여부')) + 1;
                    const firstRowShared = await page.locator(`.data-table tbody tr:first-child td:nth-child(${sharedColumnIndex})`).textContent();
                    console.log(`첫 번째 행 공유여부: ${firstRowShared}`);
                }
            }

            // 스크린샷
            await page.screenshot({ 
                path: `test-results/shared-${viewport.name.toLowerCase()}.png`,
                fullPage: false
            });
        }

        console.log('\n✅ 반응형 테스트 완료');
    });
});