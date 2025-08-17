// 모든 CSV 데이터를 유연하게 업로드하는 스크립트
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gojajqzajzhqkhmubpql.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_ANON_KEY) {
    console.error('❌ SUPABASE_ANON_KEY가 필요합니다.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// CSV 필드 → Supabase 컬럼 매핑
const fieldMapping = {
    '등록일': 'register_date',
    '공유여부': 'shared',
    '담당자': 'manager', 
    '매물상태': 'status',
    '재등록사유': 're_register_reason',
    '매물종류': 'property_type',
    '매물명': 'property_name',
    '동': 'dong',
    '호': 'ho',
    '소재지': 'address',
    '거래유형': 'trade_type',
    '금액': 'price',
    '공급/전용 (㎡)': 'supply_area_sqm',
    '공급/전용 (평)': 'supply_area_pyeong',
    '해당층/총층': 'floor_current',
    '룸/욕실': 'rooms',
    '방향(거실기준)': 'direction',
    '관리비': 'management_fee',
    '주차': 'parking',
    '입주가능일': 'move_in_date',
    '사용승인': 'approval_date',
    '특이사항': 'special_notes',
    '담당자MEMO': 'manager_memo',
    '거래완료날짜': 'completion_date',
    '거주자': 'resident',
    '임차유형': 'rent_type',
    '임차금액': 'rent_amount',
    '계약기간': 'contract_period',
    '사진': 'has_photo',
    '영상': 'has_video',
    '출연': 'has_appearance',
    '공동중개': 'joint_brokerage',
    '공동연락처': 'joint_contact',
    '광고상태': 'ad_status',
    '광고기간': 'ad_period',
    // '임시매물번호': 'temp_property_number', // 스키마에 없는 컬럼 제거
    '등록완료번호': 'registration_number',
    '소유자': 'owner_name',
    '주민(법인)등록번호': 'owner_id',
    '소유주 연락처': 'owner_contact',
    '연락처 관계': 'contact_relation'
};

// 유연한 데이터 정제 - 최소한의 처리만
function cleanDataFlexible(value, fieldName) {
    if (!value || value === '') return null;
    
    let text = String(value).trim();
    if (text === '' || text === '-') return null;
    
    // Boolean 필드 처리
    if (['shared', 'has_photo', 'has_video', 'has_appearance'].includes(fieldName)) {
        if (text === 'TRUE' || text === 'true' || text === '1' || text === 'yes') return true;
        if (text === 'FALSE' || text === 'false' || text === '0' || text === 'no') return false;
        return false; // 기본값
    }
    
    // 날짜 필드들 처리 - 잘못된 형식이면 NULL 반환
    if (['register_date', 'move_in_date', 'approval_date', 'completion_date'].includes(fieldName)) {
        // YYYY-MM-DD 형식이 아니면 NULL 반환 (텍스트 데이터 무시)
        if (!text.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return null;
        }
    }
    
    // 나머지는 모두 텍스트로 그대로 저장
    return text;
}

// 매물번호 생성 (한국시간 기준)
function generatePropertyNumber(index) {
    const now = new Date();
    const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    
    const dateStr = koreaTime.getFullYear().toString() + 
                  (koreaTime.getMonth() + 1).toString().padStart(2, '0') + 
                  koreaTime.getDate().toString().padStart(2, '0');
    const sequence = (index + 1).toString().padStart(4, '0');
    
    return dateStr + sequence;
}

// 유연한 CSV 파싱
async function parseCSVLineFlexible(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current); // 마지막 값
    
    return values;
}

async function uploadAllCSVFlexible() {
    console.log('📂 모든 CSV 데이터 유연 업로드 시작...');
    
    try {
        const csvPath = '/Users/hasanghyeon/final_the_realty/팀매물장_임시.csv';
        const csvContent = fs.readFileSync(csvPath, 'utf-8');
        const lines = csvContent.split('\n');
        
        console.log(`📊 총 ${lines.length}줄 발견`);
        
        // 헤더 파싱
        const headers = await parseCSVLineFlexible(lines[0]);
        console.log(`📋 헤더: ${headers.length}개 컬럼`);
        
        // 데이터 변환 - 훨씬 유연하게
        const processedData = [];
        let processedCount = 0;
        let skippedCount = 0;
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) {
                skippedCount++;
                continue; // 빈 줄 스킵
            }
            
            try {
                const values = await parseCSVLineFlexible(line);
                
                // 최소 조건: 등록일이나 매물명 중 하나라도 있으면 처리
                const hasRegisterDate = values[0] && values[0].trim();
                const hasPropertyName = values[6] && values[6].trim();
                
                if (!hasRegisterDate && !hasPropertyName) {
                    skippedCount++;
                    continue;
                }
                
                const rowData = {};
                
                // 필드 매핑 - 유연하게
                headers.forEach((header, index) => {
                    const supabaseField = fieldMapping[header.trim()];
                    if (supabaseField && index < values.length) {
                        rowData[supabaseField] = cleanDataFlexible(values[index], supabaseField);
                    }
                });
                
                // 매물번호 생성
                rowData.property_number = generatePropertyNumber(processedCount);
                
                // 필수 필드 기본값 설정
                if (!rowData.register_date) {
                    rowData.register_date = new Date().toISOString().split('T')[0];
                }
                if (!rowData.status) {
                    rowData.status = '거래가능'; // 기본 상태
                }
                if (!rowData.property_name) {
                    rowData.property_name = '매물명 없음';
                }
                
                // 삭제 플래그
                rowData.is_deleted = false;
                
                processedData.push(rowData);
                processedCount++;
                
                // 진행률 표시
                if (processedCount % 500 === 0) {
                    console.log(`📈 처리 중: ${processedCount}개 완료`);
                }
                
            } catch (error) {
                console.warn(`⚠️  ${i}번째 행 처리 오류 (무시하고 계속):`, error.message);
                skippedCount++;
            }
        }
        
        console.log(`✅ 데이터 변환 완료: ${processedCount}개 처리, ${skippedCount}개 스킵`);
        
        // Supabase에 업로드 - 개별 처리
        let uploadedCount = 0;
        let uploadErrorCount = 0;
        
        for (let i = 0; i < processedData.length; i++) {
            const item = processedData[i];
            
            if (i % 100 === 0) {
                console.log(`📤 업로드 진행: ${i + 1}/${processedData.length} (성공: ${uploadedCount}, 실패: ${uploadErrorCount})`);
            }
            
            try {
                const { error } = await supabase
                    .from('properties')
                    .insert([item]);
                
                if (error) {
                    console.warn(`⚠️  업로드 실패 (${item.property_number}):`, error.message);
                    uploadErrorCount++;
                } else {
                    uploadedCount++;
                }
            } catch (e) {
                console.warn(`⚠️  업로드 예외 (${item.property_number}):`, e.message);
                uploadErrorCount++;
            }
            
            // API 부하 방지
            if (i % 50 === 0) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        console.log('\n🎉 유연 CSV 업로드 완료!');
        console.log(`📊 처리된 데이터: ${processedCount}개`);
        console.log(`📤 업로드된 데이터: ${uploadedCount}개`);
        console.log(`❌ 실패한 데이터: ${uploadErrorCount}개`);
        console.log(`⏭️  스킵된 행: ${skippedCount}개`);
        
    } catch (error) {
        console.error('❌ CSV 업로드 중 오류:', error);
        process.exit(1);
    }
}

// 실행
uploadAllCSVFlexible();