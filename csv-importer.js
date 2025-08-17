// CSV 데이터 Supabase 임포트 스크립트

// CSV 파일 읽기 함수
async function loadCSVFile() {
    try {
        const response = await fetch('./팀매물장_임시.csv');
        const csvText = await response.text();
        return parseCSV(csvText);
    } catch (error) {
        console.error('CSV 파일 로드 오류:', error);
        return null;
    }
}

// CSV 파싱 함수
function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',');
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue;
        
        // CSV 라인 파싱 (따옴표 처리 포함)
        const values = parseCSVLine(lines[i]);
        if (values.length === headers.length) {
            const row = {};
            headers.forEach((header, index) => {
                row[header.trim()] = values[index] ? values[index].trim() : '';
            });
            data.push(row);
        }
    }
    
    return data;
}

// CSV 라인 파싱 (따옴표와 쉼표 처리)
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current);
    return result;
}

// CSV 데이터를 Supabase 형식으로 변환
function transformCSVToSupabase(csvData) {
    return csvData.map((row, index) => {
        // 등록일 변환
        let registerDate = null;
        if (row['등록일']) {
            try {
                const dateStr = row['등록일'];
                // YYYY-MM-DD 형식으로 변환
                if (dateStr.includes('-')) {
                    registerDate = dateStr;
                } else {
                    // 다른 형식이면 변환 시도
                    const date = new Date(dateStr);
                    if (!isNaN(date)) {
                        registerDate = date.toISOString().split('T')[0];
                    }
                }
            } catch (e) {
                console.warn('날짜 변환 실패:', row['등록일']);
            }
        }
        
        // 공유여부 변환
        const shared = row['공유여부'] === 'TRUE' || row['공유여부'] === true;
        
        // 매물번호는 자동 생성되므로 제외
        
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
            has_photo: row['사진'] === 'TRUE' || row['사진'] === true,
            has_video: row['영상'] === 'TRUE' || row['영상'] === true,
            has_appearance: row['출연'] === 'TRUE' || row['출연'] === true,
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
            register_date: registerDate || new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
    });
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
    if (!dateStr) return null;
    
    try {
        // YYYY.MM.DD 형식 처리
        if (dateStr.includes('.')) {
            const parts = dateStr.split('.');
            if (parts.length === 3) {
                return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
            }
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

// Supabase에 데이터 일괄 삽입
async function importDataToSupabase(transformedData) {
    if (!window.supabaseClient) {
        alert('Supabase 연결이 필요합니다.');
        return false;
    }
    
    console.log(`${transformedData.length}개 매물 데이터 임포트 시작...`);
    
    try {
        // 기존 데이터 확인
        const { count: existingCount } = await window.supabaseClient
            .from('properties')
            .select('*', { count: 'exact', head: true });
        
        if (existingCount > 0) {
            const proceed = confirm(`기존에 ${existingCount}개의 매물이 있습니다. 계속 진행하시겠습니까?`);
            if (!proceed) return false;
        }
        
        // 배치 단위로 삽입 (한번에 너무 많이 하면 실패할 수 있음)
        const batchSize = 50;
        const batches = [];
        
        for (let i = 0; i < transformedData.length; i += batchSize) {
            batches.push(transformedData.slice(i, i + batchSize));
        }
        
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            console.log(`배치 ${i + 1}/${batches.length} 처리 중... (${batch.length}개)`);
            
            try {
                const { data, error } = await window.supabaseClient
                    .from('properties')
                    .insert(batch)
                    .select();
                
                if (error) {
                    console.error(`배치 ${i + 1} 오류:`, error);
                    errorCount += batch.length;
                } else {
                    console.log(`배치 ${i + 1} 성공: ${data.length}개 삽입`);
                    successCount += data.length;
                }
            } catch (batchError) {
                console.error(`배치 ${i + 1} 예외:`, batchError);
                errorCount += batch.length;
            }
            
            // 배치 간 잠시 대기 (API 제한 방지)
            if (i < batches.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        console.log(`임포트 완료: 성공 ${successCount}개, 실패 ${errorCount}개`);
        alert(`임포트 완료!\n성공: ${successCount}개\n실패: ${errorCount}개`);
        
        return successCount > 0;
        
    } catch (error) {
        console.error('임포트 오류:', error);
        alert('임포트 중 오류가 발생했습니다: ' + error.message);
        return false;
    }
}

// 메인 임포트 함수
async function startCSVImport() {
    console.log('CSV 임포트 시작...');
    
    // 1. CSV 파일 로드
    const csvData = await loadCSVFile();
    if (!csvData) {
        alert('CSV 파일을 로드할 수 없습니다.');
        return;
    }
    
    console.log(`CSV 데이터 로드 완료: ${csvData.length}개 행`);
    
    // 2. 데이터 변환
    const transformedData = transformCSVToSupabase(csvData);
    console.log(`데이터 변환 완료: ${transformedData.length}개 매물`);
    
    // 3. 미리보기 (첫 3개 항목)
    console.log('변환된 데이터 미리보기:');
    console.table(transformedData.slice(0, 3));
    
    // 4. 확인 후 임포트
    const proceed = confirm(`${transformedData.length}개의 매물을 Supabase에 임포트하시겠습니까?`);
    if (!proceed) return;
    
    // 5. Supabase에 임포트
    const success = await importDataToSupabase(transformedData);
    
    if (success) {
        // 6. 페이지 새로고침하여 새 데이터 표시
        setTimeout(() => {
            location.reload();
        }, 2000);
    }
}

// 전역 함수로 노출
window.startCSVImport = startCSVImport;

// 페이지에 임포트 버튼 추가
document.addEventListener('DOMContentLoaded', function() {
    // 기존 필터바에 임포트 버튼 추가
    const filterRight = document.querySelector('.filter-right');
    if (filterRight) {
        const importBtn = document.createElement('button');
        importBtn.className = 'btn-secondary';
        importBtn.textContent = 'CSV 임포트';
        importBtn.onclick = startCSVImport;
        importBtn.style.marginRight = '8px';
        
        // 매물등록 버튼 앞에 추가
        const addBtn = filterRight.querySelector('.btn-primary');
        if (addBtn) {
            filterRight.insertBefore(importBtn, addBtn);
        } else {
            filterRight.appendChild(importBtn);
        }
    }
});

console.log('CSV 임포터 로드 완료 - startCSVImport() 함수 사용 가능');