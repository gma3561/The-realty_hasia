import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkWrongDateData() {
    console.log('🔍 잘못된 날짜 데이터 확인 (2025-08-17, 2025-08-18, 2028-08-18)\n');
    console.log('오늘 날짜: 2025년 8월 18일');
    console.log('확인 기준: register_date가 2025-08-17, 2025-08-18, 2028-08-18인 데이터\n');
    console.log('='.repeat(80));

    try {
        // 1. register_date가 2025-08-17인 데이터
        const { data: data20250817, error: error1 } = await supabase
            .from('properties')
            .select('*')
            .eq('register_date', '2025-08-17')
            .order('created_at', { ascending: false });

        // 2. register_date가 2025-08-18인 데이터
        const { data: data20250818, error: error2 } = await supabase
            .from('properties')
            .select('*')
            .eq('register_date', '2025-08-18')
            .order('created_at', { ascending: false });

        // 3. register_date가 2028-08-18인 데이터 (오타 가능성)
        const { data: data20280818, error: error3 } = await supabase
            .from('properties')
            .select('*')
            .eq('register_date', '2028-08-18')
            .order('created_at', { ascending: false });

        // 4. 2025년 8월 15일 이후 created_at 데이터도 함께 확인
        const { data: recentCreated, error: error4 } = await supabase
            .from('properties')
            .select('*')
            .gte('created_at', '2025-08-15T00:00:00')
            .order('created_at', { ascending: false });

        if (error1 || error2 || error3 || error4) {
            throw error1 || error2 || error3 || error4;
        }

        // 결과 집계
        const allWrongData = [];
        const dataByDate = {};

        // 2025-08-17 데이터
        if (data20250817 && data20250817.length > 0) {
            console.log(`\n📅 2025-08-17 데이터: ${data20250817.length}개`);
            console.log('='.repeat(80));
            dataByDate['2025-08-17'] = data20250817;
            allWrongData.push(...data20250817);
            
            // 처음 5개만 샘플 출력
            const sampleSize = Math.min(5, data20250817.length);
            for (let i = 0; i < sampleSize; i++) {
                const item = data20250817[i];
                console.log(`${i + 1}. ID: ${item.id}`);
                console.log(`   매물명: ${item.property_name}`);
                console.log(`   주소: ${item.address}`);
                console.log(`   created_at: ${new Date(item.created_at).toLocaleString('ko-KR')}`);
            }
            if (data20250817.length > 5) {
                console.log(`   ... 외 ${data20250817.length - 5}개`);
            }
        }

        // 2025-08-18 데이터
        if (data20250818 && data20250818.length > 0) {
            console.log(`\n📅 2025-08-18 데이터: ${data20250818.length}개`);
            console.log('='.repeat(80));
            dataByDate['2025-08-18'] = data20250818;
            allWrongData.push(...data20250818);
            
            // 처음 5개만 샘플 출력
            const sampleSize = Math.min(5, data20250818.length);
            for (let i = 0; i < sampleSize; i++) {
                const item = data20250818[i];
                console.log(`${i + 1}. ID: ${item.id}`);
                console.log(`   매물명: ${item.property_name}`);
                console.log(`   주소: ${item.address}`);
                console.log(`   created_at: ${new Date(item.created_at).toLocaleString('ko-KR')}`);
            }
            if (data20250818.length > 5) {
                console.log(`   ... 외 ${data20250818.length - 5}개`);
            }
        }

        // 2028-08-18 데이터
        if (data20280818 && data20280818.length > 0) {
            console.log(`\n📅 2028-08-18 데이터 (미래 날짜!): ${data20280818.length}개`);
            console.log('='.repeat(80));
            dataByDate['2028-08-18'] = data20280818;
            allWrongData.push(...data20280818);
            
            // 처음 5개만 샘플 출력
            const sampleSize = Math.min(5, data20280818.length);
            for (let i = 0; i < sampleSize; i++) {
                const item = data20280818[i];
                console.log(`${i + 1}. ID: ${item.id}`);
                console.log(`   매물명: ${item.property_name}`);
                console.log(`   주소: ${item.address}`);
                console.log(`   created_at: ${new Date(item.created_at).toLocaleString('ko-KR')}`);
            }
            if (data20280818.length > 5) {
                console.log(`   ... 외 ${data20280818.length - 5}개`);
            }
        }

        // created_at 기준 최근 데이터 분석
        console.log(`\n📊 2025-08-15 이후 created_at 데이터 분석:`);
        console.log('='.repeat(80));
        if (recentCreated && recentCreated.length > 0) {
            console.log(`총 ${recentCreated.length}개의 최근 생성 데이터`);
            
            // 테스트 패턴 확인
            const testPatterns = recentCreated.filter(item => {
                const name = item.property_name || '';
                const address = item.address || '';
                return /테스트|test|필터|검수|자동|통합|부하|슬랙/i.test(name) || 
                       /테스트동|필터동|검수동|자동화동|슬랙구|부하구|통합구/i.test(address) ||
                       (name.includes('_') && /\d{10,}/.test(name));
            });
            
            if (testPatterns.length > 0) {
                console.log(`\n⚠️ 테스트 패턴이 감지된 최근 데이터: ${testPatterns.length}개`);
                testPatterns.forEach((item, index) => {
                    if (index < 10) { // 처음 10개만 표시
                        console.log(`${index + 1}. ${item.property_name} (ID: ${item.id})`);
                        console.log(`   주소: ${item.address}`);
                        console.log(`   register_date: ${item.register_date}`);
                        console.log(`   created_at: ${new Date(item.created_at).toLocaleString('ko-KR')}`);
                    }
                });
                if (testPatterns.length > 10) {
                    console.log(`   ... 외 ${testPatterns.length - 10}개`);
                }
            }
        }

        // 요약
        console.log('\n' + '='.repeat(80));
        console.log('📊 전체 요약:');
        console.log('='.repeat(80));
        console.log(`2025-08-17 날짜 데이터: ${data20250817?.length || 0}개`);
        console.log(`2025-08-18 날짜 데이터: ${data20250818?.length || 0}개`);
        console.log(`2028-08-18 날짜 데이터 (미래): ${data20280818?.length || 0}개`);
        console.log(`\n총 잘못된 날짜 데이터: ${allWrongData.length}개`);
        
        // 중복 제거
        const uniqueIds = [...new Set(allWrongData.map(item => item.id))];
        console.log(`중복 제거 후: ${uniqueIds.length}개`);

        // 삭제 대상 목록 저장
        if (uniqueIds.length > 0) {
            const deleteData = {
                date: new Date().toISOString(),
                summary: {
                    '2025-08-17': data20250817?.length || 0,
                    '2025-08-18': data20250818?.length || 0,
                    '2028-08-18': data20280818?.length || 0,
                    'total': uniqueIds.length
                },
                ids: uniqueIds,
                details: allWrongData.map(item => ({
                    id: item.id,
                    property_name: item.property_name,
                    register_date: item.register_date,
                    created_at: item.created_at,
                    address: item.address
                }))
            };

            fs.writeFileSync('wrong-date-data-to-delete.json', JSON.stringify(deleteData, null, 2));
            
            console.log('\n💾 삭제 대상 목록이 wrong-date-data-to-delete.json 파일에 저장되었습니다.');
            console.log('\n⚠️ 주의: 이 데이터들은 날짜가 없어서 임의로 입력한 데이터들입니다.');
            console.log('삭제 전 반드시 확인이 필요합니다.');
        }

    } catch (error) {
        console.error('❌ 오류 발생:', error.message);
    }
}

// 실행
checkWrongDateData();