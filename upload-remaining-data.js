import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gojajqzajzhqkhmubpql.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function uploadRemainingData() {
    console.log('🚀 나머지 247개 데이터 강제 업로드 시작...');
    
    try {
        // 실패한 데이터 파일 읽기
        const failedData = JSON.parse(fs.readFileSync('failed-rows-without-filter.json', 'utf-8'));
        console.log(`📊 실패 데이터 ${failedData.length}개 발견`);
        
        // CSV 다시 읽어서 실패한 인덱스의 원본 데이터 추출
        const csvPath = '/Users/hasanghyeon/final_the_realty/팀매물장_임시.csv';
        const csvContent = fs.readFileSync(csvPath, 'utf-8');
        const lines = csvContent.split('\n');
        
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        let uploadedCount = 0;
        let stillFailedCount = 0;
        
        for (let i = 0; i < failedData.length; i++) {
            const failedRow = failedData[i];
            const lineIndex = failedRow.index + 1; // CSV 행 번호 (헤더 제외)
            
            if (lineIndex >= lines.length) continue;
            
            const line = lines[lineIndex];
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            
            // 간단한 데이터 구조로 강제 입력
            const rowData = {
                property_number: `202508180${String(3000 + i).padStart(4, '0')}`,
                property_name: values[6] || '매물명 없음',
                property_type: values[5] || null,
                trade_type: values[10] || null,
                status: '거래가능', // 강제로 거래가능 설정
                address: values[9] || null,
                dong: values[7] || null,
                ho: values[8] || null,
                price: values[11] || null,
                supply_area_sqm: values[12] || null,
                supply_area_pyeong: values[13] || null,
                floor_current: values[14] || null,
                rooms: values[15] || null,
                direction: values[16] || null,
                management_fee: values[17] || null,
                parking: values[18] || null,
                owner_name: values[37] || null,
                owner_contact: values[39] || null,
                manager: values[2] || null,
                shared: values[1] === 'TRUE',
                has_photo: values[28] === 'TRUE',
                has_video: values[29] === 'TRUE',
                has_appearance: values[30] === 'TRUE',
                is_deleted: false,
                register_date: new Date().toISOString().split('T')[0]
            };
            
            try {
                const { error } = await supabase
                    .from('properties')
                    .insert([rowData]);
                
                if (error) {
                    console.warn(`❌ ${i + 1}: ${rowData.property_name} - ${error.message}`);
                    stillFailedCount++;
                } else {
                    uploadedCount++;
                    if (uploadedCount % 50 === 0) {
                        console.log(`✅ 진행: ${uploadedCount}/${failedData.length}`);
                    }
                }
            } catch (e) {
                console.warn(`❌ ${i + 1}: ${rowData.property_name} - ${e.message}`);
                stillFailedCount++;
            }
            
            // 속도 향상을 위해 대기 시간 단축
            if (i % 10 === 0) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }
        
        console.log('\n🎉 나머지 데이터 업로드 완료!');
        console.log(`✅ 추가 업로드: ${uploadedCount}개`);
        console.log(`❌ 여전히 실패: ${stillFailedCount}개`);
        
        // 최종 확인
        const { count: totalCount } = await supabase
            .from('properties')
            .select('*', { count: 'exact', head: true });
        
        console.log(`📊 최종 총 매물 개수: ${totalCount}개`);
        
    } catch (error) {
        console.error('❌ 업로드 중 오류:', error);
    }
}

uploadRemainingData();