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

async function deleteAug17Aug18Data() {
    console.log('🗑️ 2025-08-17, 2025-08-18 등록일 데이터 삭제 시작\n');
    console.log('='.repeat(80));

    try {
        // 삭제할 ID 목록 읽기
        const deleteList = JSON.parse(fs.readFileSync('aug17-aug18-delete-list.json', 'utf8'));
        const idsToDelete = deleteList.ids;
        
        console.log(`삭제 대상: ${idsToDelete.length}개`);
        console.log(`- 2025-08-17: ${deleteList.summary['2025-08-17']}개`);
        console.log(`- 2025-08-18: ${deleteList.summary['2025-08-18']}개`);
        console.log('\n삭제를 시작합니다...\n');

        let successCount = 0;
        let failCount = 0;
        const errors = [];

        // 각 ID 삭제
        for (const id of idsToDelete) {
            const { error } = await supabase
                .from('properties')
                .delete()
                .eq('id', id);

            if (error) {
                failCount++;
                errors.push({ id, error: error.message });
                console.log(`❌ 삭제 실패: ${id} - ${error.message}`);
            } else {
                successCount++;
                console.log(`✅ 삭제 성공: ${id}`);
            }
        }

        // 결과 요약
        console.log('\n' + '='.repeat(80));
        console.log('📊 삭제 작업 완료');
        console.log('='.repeat(80));
        console.log(`✅ 성공: ${successCount}개`);
        console.log(`❌ 실패: ${failCount}개`);
        console.log(`📋 전체: ${idsToDelete.length}개`);

        if (errors.length > 0) {
            console.log('\n❌ 삭제 실패 목록:');
            errors.forEach(e => {
                console.log(`  - ${e.id}: ${e.error}`);
            });
        }

        // 삭제 결과 저장
        const result = {
            date: new Date().toISOString(),
            attempted: idsToDelete.length,
            success: successCount,
            failed: failCount,
            errors: errors
        };

        fs.writeFileSync('delete-result.json', JSON.stringify(result, null, 2));
        console.log('\n💾 삭제 결과가 delete-result.json 파일에 저장되었습니다.');

    } catch (error) {
        console.error('❌ 오류 발생:', error.message);
    }
}

// 실행
deleteAug17Aug18Data();