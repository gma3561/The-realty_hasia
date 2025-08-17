const fs = require('fs');

// SVG 템플릿으로 아이콘 생성
function createSVGIcon(size) {
    const fontSize = size * 0.25;
    const subFontSize = size * 0.08;
    const letterSpacing = size * 0.015;
    
    // 다이아몬드 크기와 위치 계산
    const diamondSize = size * 0.03;
    const diamondY = size * 0.25;
    const leftDiamondX = size * 0.35;
    const rightDiamondX = size * 0.65;
    
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <!-- 배경 -->
    <rect width="${size}" height="${size}" fill="#4a4a4a"/>
    
    <!-- 다이아몬드 장식 (큰 사이즈에서만) -->
    ${size >= 96 ? `
    <path d="M ${leftDiamondX} ${diamondY} L ${leftDiamondX - diamondSize} ${diamondY + diamondSize} L ${leftDiamondX} ${diamondY + diamondSize * 2} L ${leftDiamondX + diamondSize} ${diamondY + diamondSize} Z" fill="white"/>
    <path d="M ${rightDiamondX} ${diamondY} L ${rightDiamondX - diamondSize} ${diamondY + diamondSize} L ${rightDiamondX} ${diamondY + diamondSize * 2} L ${rightDiamondX + diamondSize} ${diamondY + diamondSize} Z" fill="white"/>
    ` : ''}
    
    <!-- THE 텍스트 -->
    <text x="${size/2}" y="${size * 0.45}" font-family="Helvetica, Arial, sans-serif" font-size="${fontSize}" font-weight="300" fill="white" text-anchor="middle" letter-spacing="${letterSpacing}">THE</text>
    
    <!-- REAL ESTATE 텍스트 -->
    <text x="${size/2}" y="${size * 0.65}" font-family="Helvetica, Arial, sans-serif" font-size="${subFontSize}" font-weight="300" fill="white" text-anchor="middle" letter-spacing="${letterSpacing * 2}">REAL ESTATE</text>
</svg>`;
    
    return svg;
}

// PNG 변환을 위한 간단한 방법 (canvas 사용 불가 시 SVG로 대체)
const sizes = [48, 72, 96, 144, 192, 512];

console.log('SVG 아이콘 생성 중...\n');

sizes.forEach(size => {
    const svg = createSVGIcon(size);
    const filename = `icon-${size}.svg`;
    fs.writeFileSync(filename, svg);
    console.log(`✅ ${filename} 생성 완료`);
});

console.log('\n모든 아이콘이 SVG 형식으로 생성되었습니다!');
console.log('브라우저에서 SVG를 PNG로 변환할 수 있습니다.');

// HTML 변환 페이지 생성
const converterHTML = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>SVG to PNG 변환기</title>
    <style>
        body {
            font-family: -apple-system, sans-serif;
            padding: 40px;
            background: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { text-align: center; color: #333; }
        .icon-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 30px;
            margin-top: 30px;
        }
        .icon-item {
            text-align: center;
            padding: 20px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
        }
        canvas {
            border: 1px solid #ddd;
            border-radius: 8px;
            margin: 10px 0;
        }
        button {
            background: #000;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            margin: 5px;
        }
        button:hover { background: #333; }
        .download-all {
            text-align: center;
            margin-top: 30px;
        }
        .download-all button {
            font-size: 18px;
            padding: 12px 30px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>SVG → PNG 변환기</h1>
        <div class="icon-grid">
            ${sizes.map(size => `
            <div class="icon-item">
                <h3>${size}x${size}</h3>
                <canvas id="canvas-${size}" width="${size}" height="${size}"></canvas>
                <br>
                <button onclick="downloadPNG(${size})">PNG 다운로드</button>
            </div>
            `).join('')}
        </div>
        <div class="download-all">
            <button onclick="downloadAll()">모든 PNG 다운로드</button>
        </div>
    </div>

    <script>
        const sizes = [${sizes.join(', ')}];
        
        // 각 캔버스에 SVG 로드 및 렌더링
        sizes.forEach(size => {
            const canvas = document.getElementById(\`canvas-\${size}\`);
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = function() {
                ctx.drawImage(img, 0, 0, size, size);
            };
            
            // SVG 파일 로드
            img.src = \`icon-\${size}.svg\`;
        });
        
        function downloadPNG(size) {
            const canvas = document.getElementById(\`canvas-\${size}\`);
            canvas.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = \`icon-\${size}.png\`;
                a.click();
                URL.revokeObjectURL(url);
            });
        }
        
        function downloadAll() {
            sizes.forEach((size, index) => {
                setTimeout(() => downloadPNG(size), index * 100);
            });
        }
    </script>
</body>
</html>`;

fs.writeFileSync('convert-svg-to-png.html', converterHTML);
console.log('\n✅ convert-svg-to-png.html 파일이 생성되었습니다.');
console.log('이 파일을 브라우저에서 열어 PNG로 변환하세요.');