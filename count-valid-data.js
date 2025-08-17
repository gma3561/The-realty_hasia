import fs from 'fs';

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

async function countValidData() {
    console.log('📊 CSV 데이터 유효성 검사 시작...');
    
    const csvPath = '/Users/hasanghyeon/final_the_realty/팀매물장_임시.csv';
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');
    
    console.log(`📄 총 줄 수: ${lines.length}`);
    
    // 헤더 확인
    const headers = await parseCSVLine(lines[0]);
    console.log(`📋 헤더 컬럼 수: ${headers.length}`);
    
    let validCount = 0;
    let hasRegisterDateCount = 0;
    let hasPropertyNameCount = 0;
    let bothCount = 0;
    let emptyLineCount = 0;
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (!line) {
            emptyLineCount++;
            continue;
        }
        
        try {
            const values = await parseCSVLine(line);
            
            const registerDate = values[0] && values[0].trim();
            const propertyName = values[6] && values[6].trim();
            
            if (registerDate) hasRegisterDateCount++;
            if (propertyName) hasPropertyNameCount++;
            if (registerDate && propertyName) bothCount++;
            
            // 최소 조건: 등록일이나 매물명 중 하나라도 있으면 유효
            if (registerDate || propertyName) {
                validCount++;
            }
            
        } catch (error) {
            // 파싱 오류 무시
        }
    }
    
    console.log('\n=== 데이터 분석 결과 ===');
    console.log(`📊 빈 줄: ${emptyLineCount}개`);
    console.log(`📅 등록일 있음: ${hasRegisterDateCount}개`);
    console.log(`🏠 매물명 있음: ${hasPropertyNameCount}개`);
    console.log(`✅ 둘 다 있음: ${bothCount}개`);
    console.log(`📝 유효 데이터 (둘 중 하나라도): ${validCount}개`);
    console.log(`🗑️  무효 데이터: ${lines.length - 1 - validCount - emptyLineCount}개`);
}

countValidData();