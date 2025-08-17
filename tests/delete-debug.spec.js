const { test, expect } = require('@playwright/test');

test.describe('삭제 기능 디버깅', () => {
  const LOCAL_URL = 'http://localhost:8888/';
  
  test('삭제 기능 상세 디버깅', async ({ page }) => {
    console.log('📌 삭제 기능 상세 디버깅 시작');
    
    // 콘솔 메시지 모니터링
    page.on('console', msg => {
      const text = msg.text();
      console.log(`[${msg.type()}]`, text);
    });
    
    // 네트워크 에러 모니터링
    page.on('requestfailed', request => {
      console.log('❌ 네트워크 요청 실패:', request.url());
      console.log('  실패 이유:', request.failure());
    });
    
    // 1. 관리자 로그인
    await page.goto(`${LOCAL_URL}admin-login.html`);
    await page.fill('#username', 'jenny');
    await page.fill('#password', 'happyday');
    
    page.on('dialog', async dialog => {
      console.log('📢 Alert/Dialog:', dialog.message());
      await dialog.accept();
    });
    
    await page.click('.login-btn');
    await page.waitForTimeout(2000);
    
    // 2. 메인 페이지로 이동
    await page.goto(LOCAL_URL);
    await page.waitForTimeout(5000);
    
    // 3. Supabase 연결 상태 확인
    const connectionStatus = await page.evaluate(() => {
      return {
        supabaseClient: !!window.supabaseClient,
        deleteProperty: typeof window.deleteProperty,
        supabaseUrl: window.SUPABASE_URL || 'undefined',
        testConnection: typeof window.testConnection
      };
    });
    console.log('🔍 Supabase 연결 상태:', connectionStatus);
    
    // 4. 테스트 연결 시도
    if (connectionStatus.testConnection === 'function') {
      const testResult = await page.evaluate(async () => {
        try {
          const result = await window.testConnection();
          return { success: true, result };
        } catch (err) {
          return { success: false, error: err.message };
        }
      });
      console.log('🔍 연결 테스트 결과:', testResult);
    }
    
    // 5. 첫 번째 매물 찾기
    const firstRow = page.locator('.data-table tbody tr').first();
    
    if (await firstRow.count() > 0) {
      const dataId = await firstRow.getAttribute('data-id');
      console.log('✅ 첫 번째 매물 ID:', dataId);
      
      // 6. 삭제 버튼 클릭
      const deleteButton = firstRow.locator('.btn-delete');
      
      if (await deleteButton.count() > 0) {
        console.log('🔍 삭제 버튼 클릭 전 매물 수:', await page.locator('.data-table tbody tr').count());
        
        await deleteButton.click();
        await page.waitForTimeout(1000);
        
        // 7. 확인 모달 처리
        const modal = page.locator('#deleteConfirmModal');
        if (await modal.isVisible()) {
          console.log('✅ 삭제 확인 모달 표시됨');
          
          // deleteProperty 함수 직접 호출 테스트
          const deleteResult = await page.evaluate(async (id) => {
            console.log('직접 deleteProperty 호출, ID:', id);
            
            if (typeof window.deleteProperty === 'function') {
              try {
                const result = await window.deleteProperty(id);
                console.log('deleteProperty 결과:', result);
                return result;
              } catch (err) {
                console.error('deleteProperty 에러:', err);
                return { success: false, error: err.message };
              }
            } else {
              return { success: false, error: 'deleteProperty 함수가 없음' };
            }
          }, dataId);
          
          console.log('🔍 직접 삭제 결과:', deleteResult);
          
          // 모달의 삭제 버튼 클릭
          const confirmButton = modal.locator('button:has-text("삭제")');
          await confirmButton.click();
          await page.waitForTimeout(3000);
        }
        
        console.log('🔍 삭제 버튼 클릭 후 매물 수:', await page.locator('.data-table tbody tr').count());
      }
    }
  });
  
  test('Supabase 직접 연결 테스트', async ({ page }) => {
    console.log('📌 Supabase 직접 연결 테스트');
    
    await page.goto(LOCAL_URL);
    await page.waitForTimeout(5000);
    
    // Supabase 직접 테스트
    const supabaseTest = await page.evaluate(async () => {
      // Supabase 클라이언트 확인
      if (!window.supabaseClient) {
        return { error: 'Supabase 클라이언트가 없음' };
      }
      
      try {
        // 간단한 select 쿼리 테스트
        const { data, error } = await window.supabaseClient
          .from('properties')
          .select('id')
          .limit(1);
        
        if (error) {
          return { error: error.message, details: error };
        }
        
        return { success: true, data: data };
      } catch (err) {
        return { error: err.message, stack: err.stack };
      }
    });
    
    console.log('🔍 Supabase 직접 테스트 결과:', JSON.stringify(supabaseTest, null, 2));
  });
});