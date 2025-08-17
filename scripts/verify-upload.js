// 업로드 결과 확인 스크립트
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifyUpload() {
    console.log('📊 업로드 결과 확인 중...');
    
    try {
        // 전체 데이터 수 확인
        const { count: totalCount } = await supabase
            .from('properties')
            .select('*', { count: 'exact', head: true });
        
        console.log(`📈 총 매물 수: ${totalCount}개`);
        
        // 매물 종류별 분포 확인
        const { data: propertyTypes } = await supabase
            .from('properties')
            .select('property_type')
            .not('property_type', 'is', null);
        
        const typeCount = {};
        propertyTypes.forEach(item => {
            const type = item.property_type || 'null';
            typeCount[type] = (typeCount[type] || 0) + 1;
        });
        
        console.log('\n🏠 매물 종류별 분포:');
        Object.entries(typeCount)
            .sort((a, b) => b[1] - a[1])
            .forEach(([type, count]) => {
                console.log(`  ${type}: ${count}개`);
            });
        
        // null 값 확인
        const { count: nullCount } = await supabase
            .from('properties')
            .select('*', { count: 'exact', head: true })
            .is('property_type', null);
        
        console.log(`\n❓ 매물 종류가 null인 데이터: ${nullCount}개`);
        
        // 최근 등록된 데이터 샘플 확인
        const { data: recentData } = await supabase
            .from('properties')
            .select('property_number, property_name, property_type, manager, register_date')
            .order('created_at', { ascending: false })
            .limit(5);
        
        console.log('\n📋 최근 등록된 데이터 (5개):');
        recentData.forEach(item => {
            console.log(`  ${item.property_number}: ${item.property_name || '미등록'} (${item.property_type || 'null'}) - ${item.manager || '미지정'}`);
        });
        
        // 성공률 계산
        const successRate = ((totalCount / 889) * 100).toFixed(1);
        console.log(`\n✅ 업로드 성공률: ${successRate}%`);
        
    } catch (error) {
        console.error('❌ 확인 중 오류:', error);
    }
}

verifyUpload();