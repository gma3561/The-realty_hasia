// Supabase 데이터 전체 삭제 스크립트
// ⚠️ 주의: 이 스크립트는 모든 매물 데이터를 삭제합니다!

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 환경 변수 로드
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gojajqzajzhqkhmubpql.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY; // anon 키 사용

if (!SUPABASE_ANON_KEY) {
    console.error('❌ SUPABASE_ANON_KEY가 필요합니다. anon 키를 .env 파일에 추가하세요.');
    process.exit(1);
}

// Supabase 클라이언트 초기화 (anon 키 사용)
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function clearAllData() {
    console.log('🚨 Supabase 매물 데이터 전체 삭제를 시작합니다...');
    console.log('⚠️  이 작업은 되돌릴 수 없습니다!');
    
    try {
        // 현재 데이터 개수 확인
        const { count } = await supabase
            .from('properties')
            .select('*', { count: 'exact', head: true });
        
        console.log(`📊 현재 매물 데이터: ${count}개`);
        
        if (count === 0) {
            console.log('✅ 이미 데이터가 없습니다.');
            return;
        }
        
        // 확인 메시지
        console.log('⏱️  5초 후 삭제를 시작합니다... (Ctrl+C로 중단 가능)');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // 모든 데이터 삭제
        const { error } = await supabase
            .from('properties')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // 모든 행 삭제
        
        if (error) {
            throw error;
        }
        
        // 삭제 확인
        const { count: remainingCount } = await supabase
            .from('properties')
            .select('*', { count: 'exact', head: true });
        
        console.log('✅ 데이터 삭제 완료!');
        console.log(`📊 남은 데이터: ${remainingCount}개`);
        
    } catch (error) {
        console.error('❌ 데이터 삭제 중 오류 발생:', error);
        process.exit(1);
    }
}

// 실행
clearAllData();