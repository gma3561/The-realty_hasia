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
    '등록완료번호': 'registration_number',
    '소유자': 'owner_name',
    '주민(법인)등록번호': 'owner_id',
    '소유주 연락처': 'owner_contact',
    '연락처 관계': 'contact_relation'
};

// 데이터 정제 함수 - 매물상태는 그대로 저장
function cleanData(value, fieldName) {
    if (!value || value === '' || value === '-') return null;
    
    let text = String(value).trim();
    if (text === '' || text === '-') return null;
    
    // Boolean 필드 처리
    if (['shared', 'has_photo', 'has_video', 'has_appearance'].includes(fieldName)) {
        if (text === 'TRUE' || text === 'true' || text === '1' || text === 'yes') return true;
        if (text === 'FALSE' || text === 'false' || text === '0' || text === 'no') return false;
        return false;
    }
    
    // 날짜 필드들 처리 - 잘못된 형식이면 NULL 반환
    if (['register_date', 'move_in_date', 'approval_date', 'completion_date'].includes(fieldName)) {
        // YYYY-MM-DD 형식이 아니면 NULL 반환 (텍스트 데이터 무시)
        if (!text.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return null;
        }
    }
    
    // 매물상태는 필터링 없이 그대로 저장 (관리자가 수정)
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

// CSV 파싱 함수
async function parseCSVLine(line) {
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
    values.push(current);
    
    return values;
}

async function uploadAllDataWithoutFilter() {
    console.log('📂 매물상태 필터링 없이 모든 유효 데이터 업로드 시작...');
    
    try {
        // 기존 데이터 삭제
        console.log('🗑️  기존 데이터 삭제 중...');
        const { error: deleteError } = await supabase
            .from('properties')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (deleteError) {
            console.error('❌ 삭제 실패:', deleteError);
            return;
        }
        console.log('✅ 기존 데이터 삭제 완료');
        
        const csvPath = '/Users/hasanghyeon/final_the_realty/팀매물장_임시.csv';
        const csvContent = fs.readFileSync(csvPath, 'utf-8');
        const lines = csvContent.split('\n');
        
        console.log(`📊 총 ${lines.length}줄 발견`);
        
        // 헤더 파싱
        const headers = await parseCSVLine(lines[0]);
        console.log(`📋 헤더: ${headers.length}개 컬럼`);
        
        // 유효한 데이터만 선별 (매물명 있는 것만)
        const validData = [];
        let validCount = 0;
        let skippedCount = 0;
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) {
                skippedCount++;
                continue;
            }
            
            try {
                const values = await parseCSVLine(line);
                
                // 핵심 조건: 매물명이 있는 데이터만 처리
                const propertyName = values[6] && values[6].trim();
                if (!propertyName || propertyName === '' || propertyName === '-') {
                    skippedCount++;
                    continue;
                }
                
                const rowData = {};
                
                // 필드 매핑
                headers.forEach((header, index) => {
                    const supabaseField = fieldMapping[header.trim()];
                    if (supabaseField && index < values.length) {
                        rowData[supabaseField] = cleanData(values[index], supabaseField);
                    }
                });
                
                // 매물번호 생성
                rowData.property_number = generatePropertyNumber(validCount);
                
                // 필수 필드 기본값 설정
                if (!rowData.register_date) {
                    rowData.register_date = new Date().toISOString().split('T')[0];
                }
                // 매물상태는 그대로 저장 (관리자가 수정)
                if (!rowData.status) {
                    rowData.status = '거래가능'; // 빈 값만 기본값 설정
                }
                if (!rowData.property_name) {
                    rowData.property_name = propertyName;
                }
                
                // 삭제 플래그
                rowData.is_deleted = false;
                
                validData.push(rowData);
                validCount++;
                
            } catch (error) {
                console.warn(`⚠️  ${i}번째 행 처리 오류 (무시):`, error.message);
                skippedCount++;
            }
        }
        
        console.log(`✅ 유효한 데이터 선별 완료: ${validCount}개 (${skippedCount}개 스킵)`);
        
        // Supabase에 개별 업로드 (오류 방지)
        let uploadedCount = 0;
        let uploadErrorCount = 0;
        const failedRows = [];
        
        for (let i = 0; i < validData.length; i++) {
            const item = validData[i];
            
            if (i % 100 === 0) {
                console.log(`📤 업로드 진행: ${i + 1}/${validData.length} (성공: ${uploadedCount}, 실패: ${uploadErrorCount})`);
            }
            
            try {
                const { error } = await supabase
                    .from('properties')
                    .insert([item]);
                
                if (error) {
                    console.warn(`⚠️  업로드 실패 (${item.property_number}):`, error.message);
                    uploadErrorCount++;
                    failedRows.push({
                        index: i,
                        property_name: item.property_name,
                        status: item.status,
                        error: error.message
                    });
                } else {
                    uploadedCount++;
                }
            } catch (e) {
                console.warn(`⚠️  업로드 예외 (${item.property_number}):`, e.message);
                uploadErrorCount++;
                failedRows.push({
                    index: i,
                    property_name: item.property_name,
                    status: item.status,
                    error: e.message
                });
            }
            
            // API 부하 방지
            if (i % 50 === 0) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        console.log('\n🎉 업로드 완료!');
        console.log(`📊 선별된 데이터: ${validCount}개`);
        console.log(`📤 업로드된 데이터: ${uploadedCount}개`);
        console.log(`❌ 실패한 데이터: ${uploadErrorCount}개`);
        
        if (failedRows.length > 0) {
            console.log('\n=== 실패한 데이터 샘플 (처음 10개) ===');
            failedRows.slice(0, 10).forEach(row => {
                console.log(`${row.index}: ${row.property_name} (상태: ${row.status}) - ${row.error}`);
            });
            
            // 실패 데이터를 파일로 저장
            fs.writeFileSync('failed-rows-without-filter.json', JSON.stringify(failedRows, null, 2));
            console.log('전체 실패 데이터는 failed-rows-without-filter.json에 저장됨');
        }
        
    } catch (error) {
        console.error('❌ 업로드 중 오류:', error);
        process.exit(1);
    }
}

// 실행
uploadAllDataWithoutFilter();