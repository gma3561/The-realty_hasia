// CSV 데이터를 Supabase에 업로드하는 스크립트
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

// 환경 변수 로드
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gojajqzajzhqkhmubpql.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_ANON_KEY) {
    console.error('❌ SUPABASE_ANON_KEY가 필요합니다.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// CSV 필드 → Supabase 컬럼 매핑 (실제 스키마에 맞게 수정)
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
    '해당층/총층': 'floor_current', // floor_info → floor_current로 변경
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
    '등록완료번호': 'registration_number',
    '소유자': 'owner_name',
    '주민(법인)등록번호': 'owner_id',
    '소유주 연락처': 'owner_contact',
    '연락처 관계': 'contact_relation'
};

// 데이터 정리 함수
function cleanData(value, fieldName) {
    if (!value || value === '' || value === '-') return null;
    
    // Boolean 변환
    if (['shared', 'has_photo', 'has_video', 'has_appearance'].includes(fieldName)) {
        return value === 'TRUE' || value === true || value === '1';
    }
    
    // 날짜 변환
    if (['register_date', 'move_in_date', 'approval_date', 'completion_date'].includes(fieldName)) {
        if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
            return value.split(' ')[0]; // 시간 부분 제거
        }
        return null;
    }
    
    // 텍스트 길이 제한 (VARCHAR 제한 대응)
    let text = String(value).trim();
    
    // 길이 제한을 대폭 늘림 (긴 데이터 처리용)
    const lengthLimits = {
        'property_type': 100,
        'trade_type': 100,
        'status': 50,
        'dong': 100,
        'ho': 100,
        'manager': 200,
        'floor_current': 50,
        'rooms': 100,
        'direction': 100,
        'contact_relation': 100,
        'rent_type': 100,
        'ad_status': 50,
        'property_name': 500,
        'address': 1000,
        'price': 1000,
        'supply_area_sqm': 500,
        'supply_area_pyeong': 1000,
        'management_fee': 500,
        'parking': 500,
        'owner_name': 200,
        'owner_id': 100,
        'owner_contact': 200,
        'rent_amount': 500,
        'contract_period': 200,
        'joint_brokerage': 1000,
        'joint_contact': 200,
        'ad_period': 200,
        'registration_number': 200
    };
    
    // 길이 제한 완전 해제 - 모든 데이터를 그대로 업로드
    // if (lengthLimits[fieldName] && text.length > lengthLimits[fieldName]) {
    //     text = text.substring(0, lengthLimits[fieldName]);
    //     console.warn(`⚠️  ${fieldName} 필드 길이 제한으로 잘림: ${text}`);
    // }
    
    return text;
}

// 매물번호 생성 (한국시간 기준)
function generatePropertyNumber(index) {
    // 한국시간 (UTC+9) 기준으로 날짜 생성
    const now = new Date();
    const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    
    const dateStr = koreaTime.getFullYear().toString() + 
                  (koreaTime.getMonth() + 1).toString().padStart(2, '0') + 
                  koreaTime.getDate().toString().padStart(2, '0');
    const sequence = (index + 1).toString().padStart(4, '0');
    
    console.log(`🕐 한국시간 기준 매물번호 생성: ${dateStr}${sequence} (${koreaTime.toLocaleString('ko-KR')})`);
    return dateStr + sequence;
}

async function parseCSVLine(line, index) {
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

async function uploadCSVData() {
    console.log('📂 CSV 파일 읽기 시작...');
    
    try {
        // CSV 파일 읽기
        const csvPath = '/Users/hasanghyeon/final_the_realty/팀매물장_임시.csv';
        const csvContent = fs.readFileSync(csvPath, 'utf-8');
        const lines = csvContent.split('\n');
        
        console.log(`📊 총 ${lines.length}줄 발견`);
        
        // 헤더 파싱
        const headers = await parseCSVLine(lines[0]);
        console.log(`📋 헤더: ${headers.length}개 컬럼`);
        
        // 데이터 변환
        const processedData = [];
        let processedCount = 0;
        let errorCount = 0;
        
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue; // 빈 줄 스킵
            
            try {
                const values = await parseCSVLine(lines[i], i);
                if (values.length < headers.length) continue; // 불완전한 행 스킵
                
                const rowData = {};
                
                // 필드 매핑
                headers.forEach((header, index) => {
                    const supabaseField = fieldMapping[header.trim()];
                    if (supabaseField) {
                        rowData[supabaseField] = cleanData(values[index], supabaseField);
                    }
                });
                
                // 매물번호 생성
                rowData.property_number = generatePropertyNumber(processedCount);
                
                // 필수 필드 확인
                if (!rowData.register_date) {
                    rowData.register_date = new Date().toISOString().split('T')[0];
                }
                
                processedData.push(rowData);
                processedCount++;
                
                // 진행률 표시
                if (processedCount % 1000 === 0) {
                    console.log(`📈 처리 중: ${processedCount}개 완료`);
                }
                
            } catch (error) {
                console.warn(`⚠️  ${i}번째 행 처리 오류:`, error.message);
                errorCount++;
            }
        }
        
        console.log(`✅ 데이터 변환 완료: ${processedCount}개, 오류: ${errorCount}개`);
        
        // Supabase에 업로드 (개별 처리로 변경)
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
            if (i % 10 === 0) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }
        
        console.log('🎉 CSV 업로드 완료!');
        console.log(`📊 처리된 데이터: ${processedCount}개`);
        console.log(`📤 업로드된 데이터: ${uploadedCount}개`);
        console.log(`❌ 실패한 데이터: ${uploadErrorCount}개`);
        
    } catch (error) {
        console.error('❌ CSV 업로드 중 오류:', error);
        process.exit(1);
    }
}

// 실행
uploadCSVData();