#!/usr/bin/env python3
from PIL import Image
import os

# 로고 파일 경로
logo_path = "logo_black@2x.png"
output_dir = os.path.dirname(os.path.abspath(__file__))

# 정사각형 크기 설정 (고해상도)
square_size = 1024

# 검정 로고 이미지 열기
logo_black = Image.open(logo_path).convert("RGBA")

# 로고 크기 가져오기
logo_width, logo_height = logo_black.size

# 패딩 설정 (정사각형의 15%)
padding = int(square_size * 0.15)
max_size = square_size - (padding * 2)

# 로고 비율 유지하면서 크기 조정
ratio = min(max_size / logo_width, max_size / logo_height)
new_width = int(logo_width * ratio)
new_height = int(logo_height * ratio)

# 로고 리사이즈
logo_black_resized = logo_black.resize((new_width, new_height), Image.Resampling.LANCZOS)

# 1. 흰색 배경 + 검정 로고
white_bg = Image.new("RGBA", (square_size, square_size), (255, 255, 255, 255))
# 중앙 정렬 위치 계산
x = (square_size - new_width) // 2
y = (square_size - new_height) // 2
white_bg.paste(logo_black_resized, (x, y), logo_black_resized)

# PNG로 저장
white_bg_path = os.path.join(output_dir, "logo_square_white_bg.png")
white_bg.save(white_bg_path, "PNG", quality=100)
print(f"✅ 흰색 배경 로고 생성 완료: {white_bg_path}")

# 2. 검정 배경 + 흰색 로고
# 검정 로고를 흰색으로 변환
logo_white = Image.new("RGBA", logo_black.size, (255, 255, 255, 0))
pixels_black = logo_black.load()
pixels_white = logo_white.load()

for i in range(logo_black.width):
    for j in range(logo_black.height):
        r, g, b, a = pixels_black[i, j]
        # 검정색 픽셀을 흰색으로 변환 (알파 채널 유지)
        if a > 0:  # 투명하지 않은 부분만
            # 색상 반전 (검정 -> 흰색)
            pixels_white[i, j] = (255, 255, 255, a)

# 흰색 로고 리사이즈
logo_white_resized = logo_white.resize((new_width, new_height), Image.Resampling.LANCZOS)

# 검정 배경 생성
black_bg = Image.new("RGBA", (square_size, square_size), (0, 0, 0, 255))
black_bg.paste(logo_white_resized, (x, y), logo_white_resized)

# PNG로 저장
black_bg_path = os.path.join(output_dir, "logo_square_black_bg.png")
black_bg.save(black_bg_path, "PNG", quality=100)
print(f"✅ 검정 배경 로고 생성 완료: {black_bg_path}")

# 파일 크기 정보 출력
white_size = os.path.getsize(white_bg_path) / 1024
black_size = os.path.getsize(black_bg_path) / 1024
print(f"\n📊 생성된 파일 정보:")
print(f"  - 크기: {square_size} x {square_size} px")
print(f"  - 흰색 배경: {white_size:.1f} KB")
print(f"  - 검정 배경: {black_size:.1f} KB")