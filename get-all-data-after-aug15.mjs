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

async function getAllDataAfterAug15() {
    console.log('🔍 2025년 8월 15일 이후 모든 데이터 조회\n');
    console.log('기준: created_at >= 2025-08-15 00:00:00');
    console.log('='.repeat(80));

    try {
        // created_at이 2025년 8월 15일 이후인 모든 데이터
        const { data: allData, error } = await supabase
            .from('properties')
            .select('id, property_name, address, register_date, created_at, status, manager')
            .gte('created_at', '2025-08-15T00:00:00')
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        if (!allData || allData.length === 0) {
            console.log('✅ 2025년 8월 15일 이후 데이터가 없습니다.');
            return;
        }

        console.log(`\n📊 총 ${allData.length}개의 데이터를 발견했습니다.\n`);

        // 날짜별로 그룹화
        const dataByDate = {};
        
        allData.forEach(item => {
            const createdDate = new Date(item.created_at).toLocaleDateString('ko-KR');
            if (!dataByDate[createdDate]) {
                dataByDate[createdDate] = [];
            }
            dataByDate[createdDate].push(item);
        });

        // 날짜별 출력
        Object.keys(dataByDate).sort().forEach(date => {
            console.log(`\n📅 ${date}: ${dataByDate[date].length}개`);
            console.log('-'.repeat(80));
            
            dataByDate[date].forEach((item, index) => {
                console.log(`${index + 1}. [${item.id}]`);
                console.log(`   매물명: ${item.property_name}`);
                console.log(`   주소: ${item.address || '주소 없음'}`);
                console.log(`   등록일자: ${item.register_date}`);
                console.log(`   담당자: ${item.manager}`);
                console.log(`   상태: ${item.status}`);
                if (index < dataByDate[date].length - 1) {
                    console.log('');
                }
            });
        });

        // 전체 ID 목록
        const allIds = allData.map(item => item.id);

        // 요약
        console.log('\n' + '='.repeat(80));
        console.log('📊 최종 삭제 대상 요약:');
        console.log('='.repeat(80));
        console.log(`총 삭제 대상: ${allData.length}개`);
        console.log('\n날짜별 분포:');
        Object.keys(dataByDate).sort().forEach(date => {
            console.log(`  ${date}: ${dataByDate[date].length}개`);
        });

        // 파일로 저장
        const deleteData = {
            date: new Date().toISOString(),
            criteria: 'created_at >= 2025-08-15T00:00:00',
            totalCount: allData.length,
            dateDistribution: Object.keys(dataByDate).reduce((acc, date) => {
                acc[date] = dataByDate[date].length;
                return acc;
            }, {}),
            ids: allIds,
            details: allData
        };

        fs.writeFileSync('all-data-after-aug15-to-delete.json', JSON.stringify(deleteData, null, 2));
        
        console.log('\n💾 삭제 대상 목록이 all-data-after-aug15-to-delete.json 파일에 저장되었습니다.');
        console.log(`\n⚠️ 주의: ${allData.length}개의 데이터가 삭제됩니다.`);

    } catch (error) {
        console.error('❌ 오류 발생:', error.message);
    }
}

// 실행
getAllDataAfterAug15();