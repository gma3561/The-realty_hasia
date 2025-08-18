import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getAug17Aug18Data() {
    console.log('🔍 2025-08-17, 2025-08-18 등록일 데이터만 조회\n');
    console.log('='.repeat(80));

    try {
        // 2025-08-17 데이터
        const { data: aug17Data, error: error1 } = await supabase
            .from('properties')
            .select('id, property_name, address, register_date, manager, status')
            .eq('register_date', '2025-08-17')
            .order('property_name');

        // 2025-08-18 데이터
        const { data: aug18Data, error: error2 } = await supabase
            .from('properties')
            .select('id, property_name, address, register_date, manager, status')
            .eq('register_date', '2025-08-18')
            .order('property_name');

        if (error1 || error2) {
            throw error1 || error2;
        }

        console.log('📅 2025-08-17 등록 데이터: ' + (aug17Data?.length || 0) + '개');
        console.log('='.repeat(80));
        if (aug17Data && aug17Data.length > 0) {
            aug17Data.forEach((item, index) => {
                console.log(`${index + 1}. ${item.property_name}`);
                console.log(`   ID: ${item.id}`);
                console.log(`   주소: ${item.address || '주소 없음'}`);
                console.log(`   담당자: ${item.manager || '담당자 없음'}`);
                console.log('');
            });
        }

        console.log('\n📅 2025-08-18 등록 데이터: ' + (aug18Data?.length || 0) + '개');
        console.log('='.repeat(80));
        if (aug18Data && aug18Data.length > 0) {
            aug18Data.forEach((item, index) => {
                console.log(`${index + 1}. ${item.property_name}`);
                console.log(`   ID: ${item.id}`);
                console.log(`   주소: ${item.address || '주소 없음'}`);
                console.log(`   담당자: ${item.manager || '담당자 없음'}`);
                console.log('');
            });
        }

        // 전체 리스트
        const allData = [...(aug17Data || []), ...(aug18Data || [])];
        const allIds = allData.map(item => item.id);

        console.log('\n' + '='.repeat(80));
        console.log('📊 삭제 대상 전체 요약');
        console.log('='.repeat(80));
        console.log(`2025-08-17: ${aug17Data?.length || 0}개`);
        console.log(`2025-08-18: ${aug18Data?.length || 0}개`);
        console.log(`총 합계: ${allData.length}개`);

        // 파일 저장
        const deleteData = {
            date: new Date().toISOString(),
            summary: {
                '2025-08-17': aug17Data?.length || 0,
                '2025-08-18': aug18Data?.length || 0,
                total: allData.length
            },
            ids: allIds,
            data_20250817: aug17Data || [],
            data_20250818: aug18Data || []
        };

        fs.writeFileSync('aug17-aug18-delete-list.json', JSON.stringify(deleteData, null, 2));
        console.log('\n💾 삭제 대상이 aug17-aug18-delete-list.json 파일에 저장되었습니다.');

    } catch (error) {
        console.error('❌ 오류 발생:', error.message);
    }
}

// 실행
getAug17Aug18Data();