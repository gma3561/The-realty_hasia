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

async function checkStatusValues() {
    console.log('📊 CSV 데이터의 매물상태 값 확인...');
    
    const csvPath = '/Users/hasanghyeon/final_the_realty/팀매물장_임시.csv';
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');
    
    const headers = await parseCSVLine(lines[0]);
    console.log(`📋 헤더: ${headers.join(', ')}`);
    
    const statusValues = new Set();
    const statusIndex = 3; // '매물상태' 컬럼 인덱스
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        try {
            const values = await parseCSVLine(line);
            
            // 매물명이 있는 행만 체크
            const propertyName = values[6] && values[6].trim();
            if (!propertyName) continue;
            
            const status = values[statusIndex] && values[statusIndex].trim();
            if (status && status !== '') {
                statusValues.add(status);
            }
        } catch (error) {
            // 파싱 오류 무시
        }
    }
    
    console.log('\n=== 발견된 매물상태 값들 ===');
    const sortedStatuses = Array.from(statusValues).sort();
    sortedStatuses.forEach((status, index) => {
        console.log(`${index + 1}. "${status}"`);
    });
    
    console.log(`\n총 ${sortedStatuses.length}개의 서로 다른 매물상태 값 발견`);
}

checkStatusValues();