import { chromium } from 'playwright';

async function debugWebsite() {
    console.log('🔍 웹사이트 디버깅 시작...');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // 콘솔 메시지 모니터링
    const consoleMessages = [];
    page.on('console', msg => {
        const message = `[${msg.type()}] ${msg.text()}`;
        consoleMessages.push(message);
        console.log(`🔍 콘솔: ${message}`);
    });
    
    // 네트워크 요청 모니터링
    const networkRequests = [];
    page.on('request', request => {
        networkRequests.push({
            url: request.url(),
            method: request.method(),
            type: request.resourceType()
        });
        if (request.url().includes('supabase') || request.url().includes('api')) {
            console.log(`🌐 API 요청: ${request.method()} ${request.url()}`);
        }
    });
    
    page.on('response', response => {
        if (response.url().includes('supabase') || response.url().includes('api')) {
            console.log(`📡 API 응답: ${response.status()} ${response.url()}`);
        }
    });
    
    try {
        // 웹사이트 접속
        console.log('📱 웹사이트 접속 중...');
        await page.goto('https://gma3561.github.io/The-realty_hasia/');
        
        // 긴 대기 시간으로 모든 스크립트 로드 기다리기
        await page.waitForTimeout(10000);
        
        // DOM 요소 확인
        const tableExists = await page.locator('table').count() > 0;
        console.log(`📋 테이블 존재: ${tableExists}`);
        
        if (tableExists) {
            const tbodyExists = await page.locator('tbody').count() > 0;
            console.log(`📊 tbody 존재: ${tbodyExists}`);
            
            if (tbodyExists) {
                const rowCount = await page.locator('tbody tr').count();
                console.log(`🏠 tbody 행 개수: ${rowCount}`);
                
                // tbody 내용 확인
                const tbodyHTML = await page.locator('tbody').innerHTML();
                console.log(`📝 tbody 내용 길이: ${tbodyHTML.length} characters`);
                if (tbodyHTML.length < 100) {
                    console.log(`📝 tbody 내용: ${tbodyHTML}`);
                }
            }
        }
        
        // 스크립트 파일들이 로드되었는지 확인
        const scripts = await page.$$eval('script', elements => 
            elements.map(el => el.src).filter(src => src)
        );
        console.log('\n📜 로드된 스크립트:');
        scripts.forEach(script => console.log(`  ${script}`));
        
        // JavaScript 전역 변수 확인
        const supabaseConnected = await page.evaluate(() => {
            return typeof window.supabase !== 'undefined';
        });
        console.log(`🔌 Supabase 연결: ${supabaseConnected}`);
        
        // 페이지에서 loadProperties 함수 실행해보기
        const loadPropertiesExists = await page.evaluate(() => {
            return typeof window.loadProperties === 'function';
        });
        console.log(`⚙️ loadProperties 함수 존재: ${loadPropertiesExists}`);
        
        if (loadPropertiesExists) {
            console.log('🔄 loadProperties 함수 수동 실행...');
            await page.evaluate(() => {
                window.loadProperties();
            });
            
            // 실행 후 다시 확인
            await page.waitForTimeout(5000);
            const rowCountAfter = await page.locator('tbody tr').count();
            console.log(`🏠 수동 실행 후 행 개수: ${rowCountAfter}`);
        }
        
        console.log('\n📝 수집된 콘솔 메시지:');
        consoleMessages.forEach(msg => console.log(`  ${msg}`));
        
        console.log('\n🌐 네트워크 요청 (API 관련):');
        networkRequests
            .filter(req => req.url.includes('supabase') || req.url.includes('api'))
            .forEach(req => console.log(`  ${req.method} ${req.url}`));
        
    } catch (error) {
        console.error('❌ 디버깅 중 오류:', error);
    } finally {
        await browser.close();
    }
}

debugWebsite();