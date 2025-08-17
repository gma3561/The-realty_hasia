const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csv = require('csv-parser');

// Supabase 설정
const SUPABASE_URL = 'https://gojajqzajzhqkhmubpql.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvamFqcXphanpocWtobXVicHFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MjMwODEsImV4cCI6MjA3MDk5OTA4MX0.JPlgJpdA-xVLogQHf1A0a_9qyES8qH3lK1aOLBxXe2A';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 매물번호 생성 함수
let propertyCounter = {};
function generatePropertyNumber(registerDate) {
    const date = new Date(registerDate);
    const dateKey = date.toISOString().split('T')[0].replace(/-/g, '');
    
    if (!propertyCounter[dateKey]) {
        propertyCounter[dateKey] = 1;
    } else {
        propertyCounter[dateKey]++;
    }
    
    return `${dateKey}${String(propertyCounter[dateKey]).padStart(3, '0')}`;
}

// 매물상태 매핑
function mapStatus(status) {
    if (!status) return '거래가능';
    
    const statusMap = {
        '확인필요': '거래가능',
        '매물철회': '거래철회',
        '거래완료': '거래완료',
        '거래보류': '거래보류'
    };
    
    return statusMap[status] || '거래가능';
}

// 층수 정보 추출
function extractFloorCurrent(floorInfo) {
    if (!floorInfo) return null;
    const match = floorInfo.match(/^(\d+)/);
    return match ? match[1] : null;
}

function extractFloorTotal(floorInfo) {
    if (!floorInfo) return null;
    const match = floorInfo.match(/\/(\d+)/);
    return match ? match[1] : null;
}

// 날짜 변환
function convertDate(dateStr) {
    if (!dateStr || dateStr === '') return null;
    
    try {
        let cleanDateStr = dateStr.split(' ')[0].trim();
        
        // YY-MM-DD 형식 처리
        if (cleanDateStr.match(/^\d{2}-\d{2}-\d{2}$/)) {
            const parts = cleanDateStr.split('-');
            let year = parseInt(parts[0]);
            let month = parseInt(parts[1]);
            let day = parseInt(parts[2]);
            
            if (year >= 90) {
                year = 1900 + year;
            } else {
                year = 2000 + year;
            }
            
            if (day > 31) day = 19;
            if (day === 0) day = 1;
            if (month > 12) month = 12;
            if (month === 0) month = 1;
            
            return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
        
        // YYYY-MM-DD 형식 처리
        if (cleanDateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const parts = cleanDateStr.split('-');
            let year = parseInt(parts[0]);
            let month = parseInt(parts[1]);
            let day = parseInt(parts[2]);
            
            if (day > 31) day = 19;
            if (day === 0) day = 1;
            if (month > 12) month = 12;
            if (month === 0) month = 1;
            
            return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
        
        // YYYY.MM.DD 형식 처리
        if (cleanDateStr.includes('.')) {
            const parts = cleanDateStr.split('.');
            if (parts.length === 3) {
                let year = parseInt(parts[0]);
                let month = parseInt(parts[1]);
                let day = parseInt(parts[2]);
                
                if (year < 100) {
                    year = year >= 90 ? 1900 + year : 2000 + year;
                }
                
                if (day > 31) day = 19;
                if (day === 0) day = 1;
                if (month > 12) month = 12;
                if (month === 0) month = 1;
                
                return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            }
        }
        
        const date = new Date(cleanDateStr);
        if (!isNaN(date)) {
            return date.toISOString().split('T')[0];
        }
    } catch (e) {
        console.warn('날짜 변환 실패, NULL 반환:', dateStr);
    }
    
    return null;
}

// CSV 데이터를 Supabase 형식으로 변환
function transformRow(row, index) {
    let registerDate = convertDate(row['등록일']);
    if (!registerDate) {
        registerDate = new Date().toISOString().split('T')[0];
    }
    
    const shared = row['공유여부'] === 'TRUE' || row['공유여부'] === 'true' || row['공유여부'] === true;
    const propertyNumber = row['매물번호'] || generatePropertyNumber(registerDate);
    
    return {
        property_number: propertyNumber,
        property_name: row['매물명'] || null,
        property_type: row['매물종류'] || null,
        trade_type: row['거래유형'] || null,
        status: mapStatus(row['매물상태']),
        address: row['소재지'] || null,
        dong: row['동'] || null,
        ho: row['호'] || null,
        price: row['금액'] || null,
        supply_area_sqm: row['공급/전용 (㎡)'] || null,
        supply_area_pyeong: row['공급/전용 (평)'] || null,
        floor_current: extractFloorCurrent(row['해당층/총층']),
        floor_total: extractFloorTotal(row['해당층/총층']),
        rooms: row['룸/욕실'] || null,
        direction: row['방향(거실기준)'] || null,
        management_fee: row['관리비'] || null,
        parking: row['주차'] || null,
        move_in_date: convertDate(row['입주가능일']),
        approval_date: convertDate(row['사용승인']),
        owner_name: row['소유자'] || null,
        owner_id: row['주민(법인)등록번호'] || null,
        owner_contact: row['소유주 연락처'] || null,
        contact_relation: row['연락처 관계'] || null,
        completion_date: convertDate(row['거래완료날짜']),
        resident: row['거주자'] || null,
        rent_type: row['임차유형'] || null,
        rent_amount: row['임차금액'] || null,
        contract_period: row['계약기간'] || null,
        has_photo: row['사진'] === 'TRUE' || row['사진'] === 'true' || row['사진'] === true,
        has_video: row['영상'] === 'TRUE' || row['영상'] === 'true' || row['영상'] === true,
        has_appearance: row['출연'] === 'TRUE' || row['출연'] === 'true' || row['출연'] === true,
        joint_brokerage: row['공동중개'] || null,
        joint_contact: row['공동연락처'] || null,
        ad_status: row['광고상태'] || null,
        ad_period: row['광고기간'] || null,
        registration_number: row['등록완료번호'] || null,
        special_notes: row['특이사항'] || null,
        manager_memo: row['담당자MEMO'] || null,
        re_register_reason: row['재등록사유'] || null,
        manager: row['담당자'] || null,
        shared: shared,
        is_deleted: false,
        register_date: registerDate
    };
}

async function deleteAllAndReupload() {
    console.log('========================================');
    console.log('   기존 데이터 삭제 후 재업로드');
    console.log('========================================\n');
    
    // 1. 기존 데이터 모두 삭제
    console.log('1단계: 기존 데이터 삭제 중...');
    try {
        // 먼저 개수 확인
        const { count: existingCount } = await supabase
            .from('properties')
            .select('*', { count: 'exact', head: true });
        
        console.log(`기존 데이터: ${existingCount}개`);
        
        if (existingCount > 0) {
            // 모든 데이터 삭제 (물리적 삭제)
            const { error: deleteError } = await supabase
                .from('properties')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // 모든 데이터
            
            if (deleteError) {
                console.error('삭제 오류:', deleteError);
                return;
            }
            
            console.log('✅ 기존 데이터 모두 삭제 완료\n');
        }
    } catch (err) {
        console.error('삭제 중 오류:', err);
        return;
    }
    
    // 2. CSV 파일 읽기
    console.log('2단계: CSV 파일 읽기...');
    const results = [];
    const csvFile = './팀매물장_임시.csv';
    
    return new Promise((resolve, reject) => {
        fs.createReadStream(csvFile)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                console.log(`CSV에서 ${results.length}개의 행을 읽었습니다.\n`);
                
                // 3. 데이터 변환
                console.log('3단계: 데이터 변환 중...');
                const transformedData = results.map((row, index) => transformRow(row, index));
                console.log(`변환 완료: ${transformedData.length}개\n`);
                
                // 4. 배치로 나누어 업로드
                console.log('4단계: Supabase에 업로드 중...');
                const batchSize = 50;
                let successCount = 0;
                let errorCount = 0;
                const errors = [];
                
                for (let i = 0; i < transformedData.length; i += batchSize) {
                    const batch = transformedData.slice(i, i + batchSize);
                    const batchNum = Math.floor(i/batchSize) + 1;
                    const totalBatches = Math.ceil(transformedData.length/batchSize);
                    
                    process.stdout.write(`\r배치 ${batchNum}/${totalBatches} 업로드 중... (${successCount}개 성공)`);
                    
                    try {
                        const { data, error } = await supabase
                            .from('properties')
                            .insert(batch)
                            .select();
                        
                        if (error) {
                            // 오류 발생시 개별 처리
                            for (let j = 0; j < batch.length; j++) {
                                try {
                                    const { data: singleData, error: singleError } = await supabase
                                        .from('properties')
                                        .insert([batch[j]])
                                        .select();
                                    
                                    if (singleError) {
                                        errorCount++;
                                        if (errors.length < 5) {
                                            errors.push({
                                                row: i + j + 1,
                                                error: singleError.message
                                            });
                                        }
                                    } else {
                                        successCount++;
                                    }
                                } catch (e) {
                                    errorCount++;
                                }
                            }
                        } else if (data) {
                            successCount += data.length;
                        }
                    } catch (err) {
                        errorCount += batch.length;
                    }
                    
                    // API 제한 방지
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                
                console.log('\n\n========================================');
                console.log('         업로드 완료!');
                console.log('========================================');
                console.log(`✅ 성공: ${successCount}개`);
                console.log(`❌ 실패: ${errorCount}개`);
                console.log(`📊 전체: ${transformedData.length}개`);
                
                if (errors.length > 0) {
                    console.log('\n실패한 데이터 예시:');
                    errors.forEach(e => {
                        console.log(`  행 ${e.row}: ${e.error}`);
                    });
                }
                
                // 5. 최종 확인
                const { count: finalCount } = await supabase
                    .from('properties')
                    .select('*', { count: 'exact', head: true });
                
                console.log(`\n최종 Supabase 매물 개수: ${finalCount}개`);
                
                resolve({ successCount, errorCount, total: transformedData.length });
            })
            .on('error', (error) => {
                console.error('CSV 읽기 오류:', error);
                reject(error);
            });
    });
}

// 실행
deleteAllAndReupload()
    .then(result => {
        console.log('\n✅ 작업 완료!');
        console.log('브라우저에서 확인: https://gma3561.github.io/The-realty_hasia/');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ 작업 실패:', error);
        process.exit(1);
    });