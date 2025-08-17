// 테스트 매물 삭제 스크립트 (20250817, 20250818 매물번호)
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function deleteTestData() {
    console.log('🗑️  테스트 매물 삭제 시작...');
    
    try {
        // 20250817로 시작하는 매물 확인
        const { data: data20250817, error: error1 } = await supabase
            .from('properties')
            .select('property_number, property_name')
            .like('property_number', '20250817%');
        
        if (error1) throw error1;
        
        // 20250818로 시작하는 매물 확인
        const { data: data20250818, error: error2 } = await supabase
            .from('properties')
            .select('property_number, property_name')
            .like('property_number', '20250818%');
        
        if (error2) throw error2;
        
        const totalTestData = (data20250817?.length || 0) + (data20250818?.length || 0);
        
        console.log(`📊 삭제 대상 데이터:`);
        console.log(`  20250817xxx: ${data20250817?.length || 0}개`);
        console.log(`  20250818xxx: ${data20250818?.length || 0}개`);
        console.log(`  총 ${totalTestData}개`);
        
        if (totalTestData === 0) {
            console.log('✅ 삭제할 테스트 데이터가 없습니다.');
            return;
        }
        
        // 확인 대기
        console.log('⏱️  5초 후 삭제를 시작합니다... (Ctrl+C로 중단 가능)');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        let deletedCount = 0;
        
        // 20250817 매물 삭제
        if (data20250817?.length > 0) {
            const { error: deleteError1 } = await supabase
                .from('properties')
                .delete()
                .like('property_number', '20250817%');
            
            if (deleteError1) {
                console.error('❌ 20250817 매물 삭제 오류:', deleteError1);
            } else {
                deletedCount += data20250817.length;
                console.log(`✅ 20250817 매물 ${data20250817.length}개 삭제 완료`);
            }
        }
        
        // 20250818 매물 삭제
        if (data20250818?.length > 0) {
            const { error: deleteError2 } = await supabase
                .from('properties')
                .delete()
                .like('property_number', '20250818%');
            
            if (deleteError2) {
                console.error('❌ 20250818 매물 삭제 오류:', deleteError2);
            } else {
                deletedCount += data20250818.length;
                console.log(`✅ 20250818 매물 ${data20250818.length}개 삭제 완료`);
            }
        }
        
        // 최종 확인
        const { count: remainingCount } = await supabase
            .from('properties')
            .select('*', { count: 'exact', head: true });
        
        console.log('🎉 테스트 매물 삭제 완료!');
        console.log(`📊 삭제된 매물: ${deletedCount}개`);
        console.log(`📊 남은 매물: ${remainingCount}개`);
        
    } catch (error) {
        console.error('❌ 테스트 매물 삭제 중 오류:', error);
        process.exit(1);
    }
}

deleteTestData();