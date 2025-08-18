const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTestData() {
    console.log('🔍 2025년 8월 15일 이후 등록된 테스트 데이터 확인\n');
    console.log('오늘 날짜: 2025년 8월 18일');
    console.log('확인 기준: 2025-08-15 00:00:00 이후 데이터\n');
    console.log('='.repeat(80));

    try {
        // 2025년 8월 15일 이후 데이터 조회
        const { data: testData, error } = await supabase
            .from('properties')
            .select('*')
            .gte('created_at', '2025-08-15T00:00:00')
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        if (!testData || testData.length === 0) {
            console.log('✅ 2025년 8월 15일 이후 등록된 데이터가 없습니다.');
            return;
        }

        console.log(`📊 총 ${testData.length}개의 데이터를 발견했습니다.\n`);

        // 테스트 데이터 패턴 분석
        const testPatterns = [
            { pattern: /테스트/i, name: '테스트' },
            { pattern: /test/i, name: 'test' },
            { pattern: /자동테스트/i, name: '자동테스트' },
            { pattern: /필터테스트/i, name: '필터테스트' },
            { pattern: /슬랙테스트/i, name: '슬랙테스트' },
            { pattern: /상태변경테스트/i, name: '상태변경테스트' },
            { pattern: /통합테스트/i, name: '통합테스트' },
            { pattern: /부하테스트/i, name: '부하테스트' },
            { pattern: /유효성테스트/i, name: '유효성테스트' },
            { pattern: /검수/i, name: '검수' },
            { pattern: /\d{13}/, name: '타임스탬프 포함' } // 13자리 타임스탬프
        ];

        const categorizedData = {
            testData: [],
            suspiciousData: [],
            normalData: []
        };

        // 데이터 분류
        for (const item of testData) {
            const propertyName = item.property_name || '';
            const address = item.address || '';
            const specialNotes = item.special_notes || '';
            const manager = item.manager || '';
            
            let isTestData = false;
            let matchedPatterns = [];

            // 패턴 매칭
            for (const { pattern, name } of testPatterns) {
                if (pattern.test(propertyName) || 
                    pattern.test(address) || 
                    pattern.test(specialNotes)) {
                    isTestData = true;
                    matchedPatterns.push(name);
                }
            }

            // 추가 조건: 타임스탬프가 포함된 매물명
            if (propertyName.includes('_') && /\d{10,}/.test(propertyName)) {
                isTestData = true;
                matchedPatterns.push('타임스탬프 포함');
            }

            // 분류
            if (isTestData) {
                categorizedData.testData.push({
                    ...item,
                    matchedPatterns
                });
            } else if (address.includes('테스트동') || address.includes('필터동')) {
                categorizedData.suspiciousData.push(item);
            } else {
                categorizedData.normalData.push(item);
            }
        }

        // 결과 출력
        console.log('\n📝 테스트 데이터로 확인된 항목:');
        console.log('='.repeat(80));
        
        if (categorizedData.testData.length > 0) {
            console.log(`\n삭제 대상: ${categorizedData.testData.length}개\n`);
            
            categorizedData.testData.forEach((item, index) => {
                console.log(`${index + 1}. ID: ${item.id}`);
                console.log(`   매물명: ${item.property_name}`);
                console.log(`   주소: ${item.address}`);
                console.log(`   담당자: ${item.manager}`);
                console.log(`   등록일: ${new Date(item.created_at).toLocaleString('ko-KR')}`);
                console.log(`   패턴: ${item.matchedPatterns.join(', ')}`);
                console.log(`   상태: ${item.status || 'N/A'}`);
                console.log('');
            });
        } else {
            console.log('없음');
        }

        console.log('\n⚠️ 의심스러운 데이터 (추가 확인 필요):');
        console.log('='.repeat(80));
        
        if (categorizedData.suspiciousData.length > 0) {
            console.log(`\n확인 필요: ${categorizedData.suspiciousData.length}개\n`);
            
            categorizedData.suspiciousData.forEach((item, index) => {
                console.log(`${index + 1}. ID: ${item.id}`);
                console.log(`   매물명: ${item.property_name}`);
                console.log(`   주소: ${item.address}`);
                console.log(`   담당자: ${item.manager}`);
                console.log(`   등록일: ${new Date(item.created_at).toLocaleString('ko-KR')}`);
                console.log('');
            });
        } else {
            console.log('없음');
        }

        console.log('\n✅ 정상 데이터:');
        console.log('='.repeat(80));
        console.log(`유지할 데이터: ${categorizedData.normalData.length}개`);
        
        if (categorizedData.normalData.length > 0 && categorizedData.normalData.length <= 10) {
            console.log('\n정상 데이터 목록:');
            categorizedData.normalData.forEach((item, index) => {
                console.log(`${index + 1}. ${item.property_name} (ID: ${item.id})`);
            });
        }

        // 요약
        console.log('\n' + '='.repeat(80));
        console.log('📊 요약:');
        console.log('='.repeat(80));
        console.log(`총 검토 데이터: ${testData.length}개`);
        console.log(`삭제 대상 (테스트): ${categorizedData.testData.length}개`);
        console.log(`추가 확인 필요: ${categorizedData.suspiciousData.length}개`);
        console.log(`유지할 정상 데이터: ${categorizedData.normalData.length}개`);
        
        // 삭제할 ID 목록 저장
        if (categorizedData.testData.length > 0) {
            const idsToDelete = categorizedData.testData.map(item => item.id);
            console.log('\n📌 삭제할 ID 목록:');
            console.log(JSON.stringify(idsToDelete, null, 2));
            
            // 파일로 저장
            const fs = require('fs');
            fs.writeFileSync('test-data-to-delete.json', JSON.stringify({
                date: new Date().toISOString(),
                totalCount: categorizedData.testData.length,
                ids: idsToDelete,
                details: categorizedData.testData.map(item => ({
                    id: item.id,
                    property_name: item.property_name,
                    created_at: item.created_at
                }))
            }, null, 2));
            
            console.log('\n💾 삭제 대상 목록이 test-data-to-delete.json 파일에 저장되었습니다.');
        }

    } catch (error) {
        console.error('❌ 오류 발생:', error.message);
    }
}

// 실행
checkTestData();