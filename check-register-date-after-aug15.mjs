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

async function checkRegisterDateAfterAug15() {
    console.log('🔍 register_date가 2025년 8월 15일 이후인 데이터 조회\n');
    console.log('기준: register_date >= 2025-08-15');
    console.log('='.repeat(80));

    try {
        // register_date가 2025년 8월 15일 이후인 데이터
        const { data: afterAug15, error } = await supabase
            .from('properties')
            .select('id, property_name, address, register_date, created_at, status, manager')
            .gte('register_date', '2025-08-15')
            .order('register_date', { ascending: false });

        if (error) {
            throw error;
        }

        if (!afterAug15 || afterAug15.length === 0) {
            console.log('✅ register_date가 2025년 8월 15일 이후인 데이터가 없습니다.');
            return;
        }

        console.log(`\n📊 총 ${afterAug15.length}개의 데이터를 발견했습니다.\n`);

        // register_date별로 그룹화
        const dataByRegisterDate = {};
        
        afterAug15.forEach(item => {
            const registerDate = item.register_date ? item.register_date.split('T')[0] : 'null';
            if (!dataByRegisterDate[registerDate]) {
                dataByRegisterDate[registerDate] = [];
            }
            dataByRegisterDate[registerDate].push(item);
        });

        // 날짜별 출력
        Object.keys(dataByRegisterDate).sort().reverse().forEach(date => {
            console.log(`\n📅 register_date: ${date} - ${dataByRegisterDate[date].length}개`);
            console.log('-'.repeat(80));
            
            // 처음 10개만 표시
            const displayCount = Math.min(10, dataByRegisterDate[date].length);
            for (let i = 0; i < displayCount; i++) {
                const item = dataByRegisterDate[date][i];
                console.log(`${i + 1}. [${item.id}]`);
                console.log(`   매물명: ${item.property_name}`);
                console.log(`   주소: ${item.address || '주소 없음'}`);
                console.log(`   담당자: ${item.manager}`);
                console.log(`   상태: ${item.status}`);
                console.log(`   created_at: ${new Date(item.created_at).toLocaleString('ko-KR')}`);
                if (i < displayCount - 1) console.log('');
            }
            
            if (dataByRegisterDate[date].length > 10) {
                console.log(`\n   ... 외 ${dataByRegisterDate[date].length - 10}개`);
            }
        });

        // ID 목록
        const allIds = afterAug15.map(item => item.id);

        // 요약
        console.log('\n' + '='.repeat(80));
        console.log('📊 최종 삭제 대상 요약:');
        console.log('='.repeat(80));
        console.log(`총 삭제 대상: ${afterAug15.length}개\n`);
        console.log('register_date별 분포:');
        Object.keys(dataByRegisterDate).sort().reverse().forEach(date => {
            console.log(`  ${date}: ${dataByRegisterDate[date].length}개`);
        });

        // 파일로 저장
        const deleteData = {
            date: new Date().toISOString(),
            criteria: 'register_date >= 2025-08-15',
            totalCount: afterAug15.length,
            dateDistribution: dataByRegisterDate,
            ids: allIds,
            summary: Object.keys(dataByRegisterDate).reduce((acc, date) => {
                acc[date] = dataByRegisterDate[date].length;
                return acc;
            }, {})
        };

        fs.writeFileSync('register-date-after-aug15-to-delete.json', JSON.stringify(deleteData, null, 2));
        
        console.log('\n💾 삭제 대상 목록이 register-date-after-aug15-to-delete.json 파일에 저장되었습니다.');
        console.log(`\n⚠️ 주의: register_date가 2025-08-15 이후인 ${afterAug15.length}개의 데이터가 삭제 대상입니다.`);

    } catch (error) {
        console.error('❌ 오류 발생:', error.message);
    }
}

// 실행
checkRegisterDateAfterAug15();