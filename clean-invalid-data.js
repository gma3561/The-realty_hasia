import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gojajqzajzhqkhmubpql.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function cleanInvalidData() {
    console.log('🧹 무효 데이터 정리 시작...');
    
    try {
        // 무효 데이터 삭제 (매물명이 없거나 "매물명 없음"인 것들)
        const { error, count } = await supabase
            .from('properties')
            .delete()
            .or('property_name.is.null,property_name.eq.매물명 없음');
        
        if (error) {
            console.error('❌ 삭제 실패:', error);
            return;
        }
        
        console.log(`✅ 무효 데이터 ${count}개 삭제 완료`);
        
        // 최종 확인
        const { count: finalCount } = await supabase
            .from('properties')
            .select('*', { count: 'exact', head: true });
        
        console.log(`📊 정리 후 총 매물 개수: ${finalCount}개`);
        
        // 샘플 확인
        const { data: samples } = await supabase
            .from('properties')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);
        
        console.log('\n최근 데이터 샘플:');
        samples.forEach((item, index) => {
            console.log(`[${index + 1}] ${item.property_name} - ${item.address} - ${item.price}`);
        });
        
    } catch (error) {
        console.error('❌ 정리 중 오류:', error);
    }
}

cleanInvalidData();