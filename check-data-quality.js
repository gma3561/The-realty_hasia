import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gojajqzajzhqkhmubpql.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkDataQuality() {
    console.log('📊 데이터 품질 확인...');
    
    // 정상 데이터 확인 (매물명이 있는 것)
    const { data: validData, count: validCount } = await supabase
        .from('properties')
        .select('*', { count: 'exact' })
        .not('property_name', 'is', null)
        .neq('property_name', '매물명 없음')
        .order('created_at', { ascending: false })
        .limit(10);
    
    console.log(`✅ 유효한 데이터: ${validCount}개`);
    console.log('최근 유효 데이터 샘플:');
    validData.forEach((item, index) => {
        console.log(`[${index + 1}] ${item.property_name} - ${item.address} - ${item.price}`);
    });
    
    // 무효 데이터 확인 (매물명이 없는 것)
    const { count: invalidCount } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .or('property_name.is.null,property_name.eq.매물명 없음');
    
    console.log(`\n❌ 무효한 데이터: ${invalidCount}개`);
    
    // 전체 총계
    const { count: totalCount } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true });
    
    console.log(`📊 총 데이터: ${totalCount}개`);
    console.log(`📈 유효 비율: ${((validCount/totalCount)*100).toFixed(1)}%`);
}

checkDataQuality();