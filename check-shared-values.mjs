import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSharedValues() {
    console.log('🔍 공유여부 필드 값 확인\n');
    console.log('='.repeat(80));

    try {
        // 모든 데이터의 shared 필드 확인
        const { data, error } = await supabase
            .from('properties')
            .select('id, property_name, shared, manager')
            .limit(100);

        if (error) {
            throw error;
        }

        // 통계 계산
        let sharedTrue = 0;
        let sharedFalse = 0;
        let sharedNull = 0;
        let sharedOther = 0;

        console.log('샘플 데이터 (처음 10개):');
        console.log('-'.repeat(80));
        
        data.forEach((item, index) => {
            if (index < 10) {
                console.log(`${index + 1}. ${item.property_name}`);
                console.log(`   shared 값: ${item.shared === null ? 'null' : item.shared === undefined ? 'undefined' : item.shared}`);
                console.log(`   타입: ${typeof item.shared}`);
                console.log('');
            }

            if (item.shared === true) {
                sharedTrue++;
            } else if (item.shared === false) {
                sharedFalse++;
            } else if (item.shared === null || item.shared === undefined) {
                sharedNull++;
            } else {
                sharedOther++;
                console.log(`특이값 발견: ${item.property_name} - shared: ${item.shared} (${typeof item.shared})`);
            }
        });

        console.log('='.repeat(80));
        console.log('📊 통계 (총 ' + data.length + '개):');
        console.log('='.repeat(80));
        console.log(`✅ true (공유): ${sharedTrue}개 (${(sharedTrue/data.length*100).toFixed(1)}%)`);
        console.log(`❌ false (비공유): ${sharedFalse}개 (${(sharedFalse/data.length*100).toFixed(1)}%)`);
        console.log(`⚪ null/undefined: ${sharedNull}개 (${(sharedNull/data.length*100).toFixed(1)}%)`);
        console.log(`❓ 기타 값: ${sharedOther}개`);

        if (sharedNull === data.length) {
            console.log('\n⚠️ 모든 데이터의 shared 필드가 null입니다!');
            console.log('원인:');
            console.log('1. CSV 업로드 시 "공유여부" 필드가 "shared" 필드로 매핑되지 않음');
            console.log('2. CSV의 TRUE/FALSE 값이 boolean으로 변환되지 않음');
            console.log('3. 데이터베이스 컬럼 타입 문제');
        }

        // 최근 등록된 데이터 확인
        console.log('\n최근 생성된 데이터 5개:');
        console.log('-'.repeat(80));
        
        const { data: recentData } = await supabase
            .from('properties')
            .select('property_name, shared, created_at')
            .order('created_at', { ascending: false })
            .limit(5);

        recentData?.forEach((item, index) => {
            console.log(`${index + 1}. ${item.property_name}`);
            console.log(`   shared: ${item.shared}`);
            console.log(`   created_at: ${new Date(item.created_at).toLocaleString('ko-KR')}`);
        });

    } catch (error) {
        console.error('❌ 오류 발생:', error.message);
    }
}

// 실행
checkSharedValues();