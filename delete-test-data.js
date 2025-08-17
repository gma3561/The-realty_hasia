const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const SUPABASE_URL = 'https://gojajqzajzhqkhmubpql.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvamFqcXphanpocWtobXVicHFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MjMwODEsImV4cCI6MjA3MDk5OTA4MX0.JPlgJpdA-xVLogQHf1A0a_9qyES8qH3lK1aOLBxXe2A';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function deleteTestData() {
    console.log('========================================');
    console.log('   2025년 8월 17일 테스트 데이터 삭제');
    console.log('========================================\n');
    
    try {
        // 1. 먼저 해당 날짜 데이터 확인
        console.log('1단계: 2025-08-17 데이터 확인 중...');
        
        const { data: testData, count } = await supabase
            .from('properties')
            .select('*', { count: 'exact' })
            .gte('register_date', '2025-08-17')
            .lt('register_date', '2025-08-18');
        
        console.log(`찾은 테스트 데이터: ${count}개\n`);
        
        if (count > 0) {
            // 샘플 데이터 표시
            console.log('삭제할 데이터 샘플 (처음 5개):');
            testData.slice(0, 5).forEach((item, index) => {
                console.log(`[${index + 1}] 매물번호: ${item.property_number || '없음'}`);
                console.log(`   매물명: ${item.property_name || '없음'}`);
                console.log(`   등록일: ${item.register_date}`);
                console.log(`   담당자: ${item.manager || '없음'}\n`);
            });
            
            // 2. 데이터 삭제
            console.log('2단계: 데이터 삭제 중...');
            
            const { error: deleteError } = await supabase
                .from('properties')
                .delete()
                .gte('register_date', '2025-08-17')
                .lt('register_date', '2025-08-18');
            
            if (deleteError) {
                console.error('삭제 오류:', deleteError);
                return;
            }
            
            console.log(`✅ ${count}개의 테스트 데이터를 삭제했습니다.\n`);
        } else {
            console.log('삭제할 테스트 데이터가 없습니다.\n');
        }
        
        // 3. 최종 확인
        console.log('3단계: 최종 데이터 확인...');
        
        const { count: finalCount } = await supabase
            .from('properties')
            .select('*', { count: 'exact', head: true });
        
        console.log(`최종 매물 개수: ${finalCount}개`);
        
        // 날짜별 분포 확인
        const { data: recentData } = await supabase
            .from('properties')
            .select('register_date')
            .order('register_date', { ascending: false })
            .limit(10);
        
        console.log('\n최근 등록일 분포:');
        const dates = {};
        recentData.forEach(item => {
            const date = item.register_date.split('T')[0];
            dates[date] = (dates[date] || 0) + 1;
        });
        
        Object.entries(dates).forEach(([date, count]) => {
            console.log(`  ${date}: ${count}개`);
        });
        
    } catch (error) {
        console.error('작업 중 오류:', error);
    }
}

deleteTestData().then(() => {
    console.log('\n✅ 작업 완료!');
    console.log('브라우저에서 확인: https://gma3561.github.io/The-realty_hasia/');
    process.exit(0);
}).catch(error => {
    console.error('오류:', error);
    process.exit(1);
});