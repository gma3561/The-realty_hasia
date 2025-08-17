const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csv = require('csv-parser');

// Supabase 설정
const SUPABASE_URL = 'https://gojajqzajzhqkhmubpql.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvamFqcXphanpocWtobXVicHFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MjMwODEsImV4cCI6MjA3MDk5OTA4MX0.JPlgJpdA-xVLogQHf1A0a_9qyES8qH3lK1aOLBxXe2A';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

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

// 날짜 변환 - YY-MM-DD 형식 처리 추가
function convertDate(dateStr) {
    if (!dateStr || dateStr === '') return null;
    
    try {
        // 문자열에서 날짜 부분만 추출 (첫 번째 날짜 형식만)
        let cleanDateStr = dateStr.split(' ')[0].trim();
        
        // YY-MM-DD 형식 처리 (23-12-09 -> 2023-12-09)
        if (cleanDateStr.match(/^\d{2}-\d{2}-\d{2}$/)) {
            const parts = cleanDateStr.split('-');
            let year = parseInt(parts[0]);
            let month = parseInt(parts[1]);
            let day = parseInt(parts[2]);
            
            // 00-99를 2000-2099로 변환 (90 이상은 1990년대로 처리)
            if (year >= 90) {
                year = 1900 + year;
            } else {
                year = 2000 + year;
            }
            
            // 잘못된 날짜 수정
            if (day > 31) day = 19; // 49일 같은 경우 19일로
            if (day === 0) day = 1;
            if (month > 12) month = 12;
            if (month === 0) month = 1;
            
            return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
        
        // YYYY-MM-DD 형식 처리 (잘못된 날짜 수정)
        if (cleanDateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const parts = cleanDateStr.split('-');
            let year = parseInt(parts[0]);
            let month = parseInt(parts[1]);
            let day = parseInt(parts[2]);
            
            // 잘못된 날짜 수정
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
                
                // 2자리 년도 처리
                if (year < 100) {
                    year = year >= 90 ? 1900 + year : 2000 + year;
                }
                
                // 잘못된 날짜 수정
                if (day > 31) day = 19;
                if (day === 0) day = 1;
                if (month > 12) month = 12;
                if (month === 0) month = 1;
                
                return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            }
        }
        
        // 기타 형식 시도
        const date = new Date(cleanDateStr);
        if (!isNaN(date)) {
            return date.toISOString().split('T')[0];
        }
    } catch (e) {
        console.warn('날짜 변환 실패, NULL 반환:', dateStr);
    }
    
    return null; // 변환 실패시 NULL
}

// CSV 데이터를 Supabase 형식으로 변환
function transformRow(row, index) {
    // 등록일 변환
    let registerDate = convertDate(row['등록일']);
    if (!registerDate) {
        registerDate = new Date().toISOString().split('T')[0];
    }
    
    // 공유여부 변환
    const shared = row['공유여부'] === 'TRUE' || row['공유여부'] === 'true' || row['공유여부'] === true;
    
    // 매물번호 생성 (없는 경우에만)
    const propertyNumber = row['매물번호'] || generatePropertyNumber(registerDate);
    
    return {
        // 매물번호 추가
        property_number: propertyNumber,
        
        // 기본 정보
        property_name: row['매물명'] || null,
        property_type: row['매물종류'] || null,
        trade_type: row['거래유형'] || null,
        status: mapStatus(row['매물상태']),
        
        // 위치 정보 - 길이 제한 없음
        address: row['소재지'] || null,
        dong: row['동'] || null,
        ho: row['호'] || null,
        
        // 거래 정보 - 길이 제한 없음
        price: row['금액'] || null,
        
        // 면적 정보 - 길이 제한 없음
        supply_area_sqm: row['공급/전용 (㎡)'] || null,
        supply_area_pyeong: row['공급/전용 (평)'] || null,
        floor_current: extractFloorCurrent(row['해당층/총층']),
        floor_total: extractFloorTotal(row['해당층/총층']),
        rooms: row['룸/욕실'] || null,
        direction: row['방향(거실기준)'] || null,
        
        // 추가 정보 - 길이 제한 없음
        management_fee: row['관리비'] || null,
        parking: row['주차'] || null,
        move_in_date: convertDate(row['입주가능일']),
        approval_date: convertDate(row['사용승인']),
        
        // 소유자 정보 - 길이 제한 없음
        owner_name: row['소유자'] || null,
        owner_id: row['주민(법인)등록번호'] || null,
        owner_contact: row['소유주 연락처'] || null,
        contact_relation: row['연락처 관계'] || null,
        
        // 거래 완료 정보
        completion_date: convertDate(row['거래완료날짜']),
        resident: row['거주자'] || null,
        rent_type: row['임차유형'] || null,
        rent_amount: row['임차금액'] || null,
        contract_period: row['계약기간'] || null,
        
        // 광고/공동중개 정보 - 길이 제한 없음
        has_photo: row['사진'] === 'TRUE' || row['사진'] === 'true' || row['사진'] === true,
        has_video: row['영상'] === 'TRUE' || row['영상'] === 'true' || row['영상'] === true,
        has_appearance: row['출연'] === 'TRUE' || row['출연'] === 'true' || row['출연'] === true,
        joint_brokerage: row['공동중개'] || null,
        joint_contact: row['공동연락처'] || null,
        ad_status: row['광고상태'] || null,
        ad_period: row['광고기간'] || null,
        registration_number: row['등록완료번호'] || null,
        
        // 메모 - TEXT 타입이므로 길이 제한 없음
        special_notes: row['특이사항'] || null,
        manager_memo: row['담당자MEMO'] || null,
        re_register_reason: row['재등록사유'] || null,
        
        // 시스템 정보
        manager: row['담당자'] || null,
        shared: shared,
        is_deleted: false,
        
        // 생성 정보
        register_date: registerDate
    };
}

async function uploadCSVToSupabase() {
    console.log('========================================');
    console.log('   전체 CSV 데이터 업로드 (수정 버전)');
    console.log('========================================\n');
    
    const results = [];
    const csvFile = './팀매물장_임시.csv';
    
    // CSV 파일 읽기
    return new Promise((resolve, reject) => {
        fs.createReadStream(csvFile)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                console.log(`${results.length}개의 행을 읽었습니다.`);
                
                // 먼저 기존 매물번호들을 가져와서 카운터 초기화
                const { data: existingProperties } = await supabase
                    .from('properties')
                    .select('property_number')
                    .order('property_number', { ascending: false });
                
                if (existingProperties) {
                    // 날짜별로 최대 번호 찾기
                    existingProperties.forEach(prop => {
                        if (prop.property_number) {
                            const dateKey = prop.property_number.substring(0, 8);
                            const num = parseInt(prop.property_number.substring(8));
                            if (!propertyCounter[dateKey] || propertyCounter[dateKey] < num) {
                                propertyCounter[dateKey] = num;
                            }
                        }
                    });
                    console.log('기존 매물번호 카운터 초기화 완료');
                }
                
                // 데이터 변환
                const transformedData = results.map((row, index) => transformRow(row, index));
                console.log('데이터 변환 완료');
                
                // 첫 번째 데이터 샘플 확인
                console.log('\n첫 번째 데이터 샘플:');
                console.log(JSON.stringify(transformedData[0], null, 2));
                
                // 배치로 나누어 업로드
                const batchSize = 10;
                let successCount = 0;
                let errorCount = 0;
                const errors = [];
                const failedRows = [];
                
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
                                        failedRows.push({ 
                                            row: i + j + 1, 
                                            error: singleError.message,
                                            data: batch[j]
                                        });
                                    } else {
                                        successCount++;
                                    }
                                } catch (e) {
                                    errorCount++;
                                    failedRows.push({ 
                                        row: i + j + 1, 
                                        error: e.message,
                                        data: batch[j]
                                    });
                                }
                            }
                        } else if (data) {
                            successCount += data.length;
                        }
                    } catch (err) {
                        errorCount += batch.length;
                        errors.push({ batch: batchNum, error: err });
                    }
                    
                    // API 제한 방지를 위한 대기
                    if (i + batchSize < transformedData.length) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                }
                
                console.log('\n\n=== 업로드 완료 ===');
                console.log(`✅ 성공: ${successCount}개`);
                console.log(`❌ 실패: ${errorCount}개`);
                console.log(`📊 전체: ${transformedData.length}개`);
                
                if (failedRows.length > 0) {
                    console.log('\n=== 실패한 행 상세 (처음 10개) ===');
                    failedRows.slice(0, 10).forEach(f => {
                        console.log(`행 ${f.row}: ${f.error}`);
                        console.log(`  매물명: ${f.data.property_name}`);
                        console.log(`  매물번호: ${f.data.property_number}`);
                    });
                    
                    // 실패한 데이터를 파일로 저장
                    fs.writeFileSync('failed-rows.json', JSON.stringify(failedRows, null, 2));
                    console.log('\n실패한 전체 데이터는 failed-rows.json 파일에 저장되었습니다.');
                }
                
                resolve({ successCount, errorCount, total: transformedData.length });
            })
            .on('error', (error) => {
                console.error('CSV 읽기 오류:', error);
                reject(error);
            });
    });
}

// 실행
uploadCSVToSupabase()
    .then(result => {
        if (result.successCount > 0) {
            console.log('\n🎉 업로드 성공!');
            console.log('브라우저에서 확인: https://gma3561.github.io/The-realty_hasia/');
        }
        
        if (result.errorCount > 0) {
            console.log('\n⚠️ 일부 데이터 업로드 실패');
            console.log('먼저 Supabase에서 다음 SQL을 실행하세요:');
            console.log('----------------------------------------');
            console.log(fs.readFileSync('update-schema-for-long-text.sql', 'utf8'));
            console.log('----------------------------------------');
        }
        
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ 업로드 실패:', error);
        process.exit(1);
    });