const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const SUPABASE_URL = 'https://gojajqzajzhqkhmubpql.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvamFqcXphanpocWtobXVicHFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MjMwODEsImV4cCI6MjA3MDk5OTA4MX0.JPlgJpdA-xVLogQHf1A0a_9qyES8qH3lK1aOLBxXe2A';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkData() {
    console.log('=== Supabase 데이터 확인 ===\n');
    
    // 1. 전체 개수 확인
    const { count } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true });
    
    console.log(`전체 매물 개수: ${count}개\n`);
    
    // 2. 처음 5개 데이터 샘플 확인
    const { data: samples } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
    
    console.log('최근 등록된 5개 매물 샘플:');
    samples.forEach((item, index) => {
        console.log(`\n[${index + 1}] 매물번호: ${item.property_number || '없음'}`);
        console.log(`   매물명: ${item.property_name || '없음'}`);
        console.log(`   등록일: ${item.register_date || '없음'}`);
        console.log(`   주소: ${item.address || '없음'}`);
        console.log(`   가격: ${item.price || '없음'}`);
        console.log(`   담당자: ${item.manager || '없음'}`);
    });
    
    // 3. 매물번호가 없는 데이터 개수
    const { count: noNumberCount } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .is('property_number', null);
    
    console.log(`\n매물번호 없는 데이터: ${noNumberCount}개`);
    
    // 4. register_date 분포 확인
    const { data: dates } = await supabase
        .from('properties')
        .select('register_date')
        .not('register_date', 'is', null)
        .order('register_date', { ascending: false })
        .limit(10);
    
    console.log('\n등록일 분포 (최근 10개):');
    const uniqueDates = [...new Set(dates.map(d => d.register_date))];
    uniqueDates.forEach(date => {
        const count = dates.filter(d => d.register_date === date).length;
        console.log(`  ${date}: ${count}개`);
    });
}

checkData().then(() => {
    console.log('\n확인 완료!');
    process.exit(0);
}).catch(error => {
    console.error('오류:', error);
    process.exit(1);
});