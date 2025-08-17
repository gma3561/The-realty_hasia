// 잘못된 유니코드 문자 정리 스크립트

// 잘못된 서로게이트 페어와 특수문자를 정리하는 함수
function cleanInvalidUnicode(str) {
    if (!str || typeof str !== 'string') return str;
    
    try {
        // 1. 잘못된 서로게이트 페어 제거
        // High surrogate (0xD800-0xDBFF) 뒤에 low surrogate (0xDC00-0xDFFF)가 없는 경우
        str = str.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, '');
        
        // Low surrogate가 high surrogate 없이 단독으로 있는 경우
        str = str.replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '');
        
        // 2. 제어 문자 제거 (탭, 줄바꿈 제외)
        str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
        
        // 3. 유효한 UTF-8로 인코딩/디코딩하여 정리
        const encoder = new TextEncoder();
        const decoder = new TextDecoder('utf-8', { fatal: false });
        const encoded = encoder.encode(str);
        str = decoder.decode(encoded);
        
        return str;
    } catch (error) {
        console.error('문자열 정리 중 오류:', error);
        // 오류 시 기본 ASCII만 남기기
        return str.replace(/[^\x20-\x7E\n\r\t가-힣ㄱ-ㅎㅏ-ㅣ]/g, '');
    }
}

// 객체의 모든 문자열 필드를 정리
function cleanObjectStrings(obj) {
    if (!obj) return obj;
    
    if (typeof obj === 'string') {
        return cleanInvalidUnicode(obj);
    }
    
    if (Array.isArray(obj)) {
        return obj.map(item => cleanObjectStrings(item));
    }
    
    if (typeof obj === 'object') {
        const cleaned = {};
        for (const [key, value] of Object.entries(obj)) {
            cleaned[key] = cleanObjectStrings(value);
        }
        return cleaned;
    }
    
    return obj;
}

// 데이터 정리 테스트
async function testDataCleaning() {
    console.log('데이터 정리 테스트 시작...');
    
    // 문제가 될 수 있는 테스트 문자열들
    const testStrings = [
        '정상 문자열',
        '이모지 포함 😀 문자열',
        '깨진 서로게이트 \uD800 문자',  // High surrogate alone
        '또 다른 깨진 \uDC00 문자',      // Low surrogate alone
        '제어문자 \x00\x01\x02 포함',
        '한글 가나다 ABC 123',
        '특수문자 !@#$%^&*()',
    ];
    
    console.log('\n=== 테스트 결과 ===');
    testStrings.forEach((str, index) => {
        const cleaned = cleanInvalidUnicode(str);
        console.log(`${index + 1}. 원본: "${str}"`);
        console.log(`   정리: "${cleaned}"`);
        console.log(`   변경: ${str !== cleaned ? '예' : '아니오'}\n`);
    });
    
    // Supabase 데이터 정리 예제
    if (window.supabaseClient) {
        console.log('\n=== Supabase 데이터 검사 ===');
        try {
            // 샘플 데이터 조회
            const { data, error } = await window.supabaseClient
                .from('properties')
                .select('id, property_name, special_notes, manager_memo')
                .limit(10);
            
            if (error) {
                console.error('데이터 조회 오류:', error);
                return;
            }
            
            // 문제가 있는 레코드 찾기
            let problemCount = 0;
            data.forEach(record => {
                const original = JSON.stringify(record);
                const cleaned = JSON.stringify(cleanObjectStrings(record));
                
                if (original !== cleaned) {
                    problemCount++;
                    console.log(`문제 발견 - ID: ${record.id}`);
                    console.log('  원본:', original.substring(0, 100) + '...');
                    console.log('  정리:', cleaned.substring(0, 100) + '...');
                }
            });
            
            if (problemCount === 0) {
                console.log('✅ 검사한 10개 레코드에서 문제 없음');
            } else {
                console.log(`⚠️ ${problemCount}개 레코드에서 문제 발견`);
            }
            
        } catch (err) {
            console.error('검사 중 오류:', err);
        }
    }
}

// 전역 함수로 노출
window.cleanInvalidUnicode = cleanInvalidUnicode;
window.cleanObjectStrings = cleanObjectStrings;
window.testDataCleaning = testDataCleaning;

console.log('문자 정리 유틸리티 로드 완료');
console.log('사용법: testDataCleaning() 실행하여 데이터 검사');