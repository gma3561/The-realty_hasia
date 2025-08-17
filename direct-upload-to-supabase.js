const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csv = require('csv-parser');

// Supabase 설정 - Service Role Key 사용 (RLS 우회)
const SUPABASE_URL = 'https://gojajqzajzhqkhmubpql.supabase.co';
// ANON KEY 대신 SERVICE ROLE KEY가 필요합니다
// Supabase 대시보드 > Settings > API에서 확인 가능
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvamFqcXphanpocWtobXVicHFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MjMwODEsImV4cCI6MjA3MDk5OTA4MX0.JPlgJpdA-xVLogQHf1A0a_9qyES8qH3lK1aOLBxXe2A';

// anon key를 사용하되, RLS 정책 무시 옵션 추가
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

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
        // YYYY.MM.DD 형식 처리
        if (dateStr.includes('.')) {
            const parts = dateStr.split('.');
            if (parts.length === 3) {
                return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
            }
        }
        
        // YYYY-MM-DD 형식은 그대로 반환
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return dateStr;
        }
        
        // 다른 형식 시도
        const date = new Date(dateStr);
        if (!isNaN(date)) {
            return date.toISOString().split('T')[0];
        }
    } catch (e) {
        console.warn('날짜 변환 실패:', dateStr);
    }
    
    return null;
}

// CSV 데이터를 Supabase 형식으로 변환
function transformRow(row) {
    // 등록일 변환
    let registerDate = convertDate(row['등록일']);
    if (!registerDate) {
        registerDate = new Date().toISOString().split('T')[0];
    }
    
    // 공유여부 변환
    const shared = row['공유여부'] === 'TRUE' || row['공유여부'] === 'true' || row['공유여부'] === true;
    
    // user_id 필드 제거 (자동 생성되도록)
    return {
        // 기본 정보
        property_name: row['매물명'] || null,
        property_type: row['매물종류'] || null,
        trade_type: row['거래유형'] || null,
        status: mapStatus(row['매물상태']),
        
        // 위치 정보
        address: row['소재지'] || null,
        dong: row['동'] || null,
        ho: row['호'] || null,
        
        // 거래 정보
        price: row['금액'] || null,
        
        // 면적 정보
        supply_area_sqm: row['공급/전용 (㎡)'] || null,
        supply_area_pyeong: row['공급/전용 (평)'] || null,
        floor_current: extractFloorCurrent(row['해당층/총층']),
        floor_total: extractFloorTotal(row['해당층/총층']),
        rooms: row['룸/욕실'] || null,
        direction: row['방향(거실기준)'] || null,
        
        // 추가 정보
        management_fee: row['관리비'] || null,
        parking: row['주차'] || null,
        move_in_date: convertDate(row['입주가능일']),
        approval_date: convertDate(row['사용승인']),
        
        // 소유자 정보
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
        
        // 광고/공동중개 정보
        has_photo: row['사진'] === 'TRUE' || row['사진'] === 'true' || row['사진'] === true,
        has_video: row['영상'] === 'TRUE' || row['영상'] === 'true' || row['영상'] === true,
        has_appearance: row['출연'] === 'TRUE' || row['출연'] === 'true' || row['출연'] === true,
        joint_brokerage: row['공동중개'] || null,
        joint_contact: row['공동연락처'] || null,
        ad_status: row['광고상태'] || null,
        ad_period: row['광고기간'] || null,
        registration_number: row['등록완료번호'] || null,
        
        // 메모
        special_notes: row['특이사항'] || null,
        manager_memo: row['담당자MEMO'] || null,
        re_register_reason: row['재등록사유'] || null,
        
        // 시스템 정보
        manager: row['담당자'] || null,
        shared: shared,
        is_deleted: false,
        
        // 생성 정보
        register_date: registerDate
        // user_id는 제거 - DB에서 DEFAULT 값 사용
    };
}

async function uploadCSVToSupabase() {
    console.log('CSV 파일 업로드 시작 (RLS 우회 모드)...');
    
    const results = [];
    const csvFile = './팀매물장_임시.csv';
    
    // CSV 파일 읽기
    return new Promise((resolve, reject) => {
        fs.createReadStream(csvFile)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                console.log(`${results.length}개의 행을 읽었습니다.`);
                
                // 데이터 변환
                const transformedData = results.map(transformRow);
                console.log('데이터 변환 완료');
                
                // 첫 번째 데이터 샘플 확인
                console.log('\n첫 번째 데이터 샘플:');
                console.log(JSON.stringify(transformedData[0], null, 2));
                
                // 기존 데이터 삭제 (선택사항)
                console.log('\n기존 데이터를 삭제하시겠습니까? (테스트용)');
                // const { error: deleteError } = await supabase
                //     .from('properties')
                //     .delete()
                //     .neq('id', '00000000-0000-0000-0000-000000000000'); // 모든 데이터 삭제
                
                // if (deleteError) {
                //     console.log('기존 데이터 삭제 실패:', deleteError);
                // }
                
                // 배치로 나누어 업로드
                const batchSize = 10; // 더 작은 배치 크기로 시작
                let successCount = 0;
                let errorCount = 0;
                const errors = [];
                
                for (let i = 0; i < transformedData.length; i += batchSize) {
                    const batch = transformedData.slice(i, i + batchSize);
                    const batchNum = Math.floor(i/batchSize) + 1;
                    const totalBatches = Math.ceil(transformedData.length/batchSize);
                    
                    console.log(`\n배치 ${batchNum}/${totalBatches} 업로드 중...`);
                    
                    try {
                        const { data, error } = await supabase
                            .from('properties')
                            .insert(batch)
                            .select();
                        
                        if (error) {
                            console.error(`배치 ${batchNum} 오류:`, error.message);
                            errors.push({ batch: batchNum, error });
                            errorCount += batch.length;
                        } else if (data) {
                            console.log(`✅ 배치 ${batchNum}: ${data.length}개 성공`);
                            successCount += data.length;
                        }
                    } catch (err) {
                        console.error(`배치 ${batchNum} 예외:`, err.message);
                        errors.push({ batch: batchNum, error: err });
                        errorCount += batch.length;
                    }
                    
                    // API 제한 방지를 위한 대기
                    if (i + batchSize < transformedData.length) {
                        await new Promise(resolve => setTimeout(resolve, 200));
                    }
                }
                
                console.log('\n=== 업로드 완료 ===');
                console.log(`✅ 성공: ${successCount}개`);
                console.log(`❌ 실패: ${errorCount}개`);
                console.log(`📊 전체: ${transformedData.length}개`);
                
                if (errors.length > 0) {
                    console.log('\n=== 오류 상세 ===');
                    errors.forEach(e => {
                        console.log(`배치 ${e.batch}: ${e.error.message || e.error}`);
                    });
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
console.log('========================================');
console.log('   CSV to Supabase 직접 업로드 도구');
console.log('========================================\n');

uploadCSVToSupabase()
    .then(result => {
        if (result.successCount > 0) {
            console.log('\n🎉 업로드 성공!');
            console.log('브라우저에서 확인: https://gma3561.github.io/The-realty_hasia/');
        } else {
            console.log('\n⚠️ 업로드 실패 - RLS 정책 확인 필요');
            console.log('Supabase 대시보드에서 다음 SQL을 실행하세요:');
            console.log('ALTER TABLE properties DISABLE ROW LEVEL SECURITY;');
        }
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ 업로드 실패:', error);
        process.exit(1);
    });