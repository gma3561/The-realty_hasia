#!/usr/bin/env python3
"""
PWA 아이콘 생성 스크립트
THE REAL ESTATE 로고 스타일로 아이콘 생성
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size):
    """주어진 크기의 아이콘 생성"""
    # 회색 배경의 정사각형 이미지 생성
    img = Image.new('RGB', (size, size), color='#4a4a4a')
    draw = ImageDraw.Draw(img)
    
    # 흰색 텍스트
    text_color = '#ffffff'
    
    # 폰트 크기 계산
    main_font_size = int(size * 0.25)  # THE 텍스트
    sub_font_size = int(size * 0.08)   # REAL ESTATE 텍스트
    
    # 기본 폰트 사용 (시스템 폰트)
    try:
        # macOS의 경우
        from PIL import ImageFont
        main_font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', main_font_size)
        sub_font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', sub_font_size)
    except:
        # 기본 폰트 사용
        main_font = ImageFont.load_default()
        sub_font = ImageFont.load_default()
    
    # THE 텍스트 그리기
    the_text = "THE"
    the_bbox = draw.textbbox((0, 0), the_text, font=main_font)
    the_width = the_bbox[2] - the_bbox[0]
    the_height = the_bbox[3] - the_bbox[1]
    the_x = (size - the_width) // 2
    the_y = size // 2 - the_height
    draw.text((the_x, the_y), the_text, fill=text_color, font=main_font)
    
    # REAL ESTATE 텍스트 그리기
    sub_text = "REAL ESTATE"
    sub_bbox = draw.textbbox((0, 0), sub_text, font=sub_font)
    sub_width = sub_bbox[2] - sub_bbox[0]
    sub_x = (size - sub_width) // 2
    sub_y = size // 2 + int(size * 0.05)
    draw.text((sub_x, sub_y), sub_text, fill=text_color, font=sub_font)
    
    # 장식용 다이아몬드 추가 (선택사항)
    if size >= 96:
        diamond_size = int(size * 0.03)
        diamond_y = the_y - int(size * 0.08)
        # 왼쪽 다이아몬드
        left_diamond_x = the_x + int(the_width * 0.2)
        draw.polygon([
            (left_diamond_x, diamond_y),
            (left_diamond_x - diamond_size, diamond_y + diamond_size),
            (left_diamond_x, diamond_y + diamond_size * 2),
            (left_diamond_x + diamond_size, diamond_y + diamond_size)
        ], fill=text_color)
        # 오른쪽 다이아몬드
        right_diamond_x = the_x + int(the_width * 0.8)
        draw.polygon([
            (right_diamond_x, diamond_y),
            (right_diamond_x - diamond_size, diamond_y + diamond_size),
            (right_diamond_x, diamond_y + diamond_size * 2),
            (right_diamond_x + diamond_size, diamond_y + diamond_size)
        ], fill=text_color)
    
    return img

# 아이콘 크기 목록
sizes = [48, 72, 96, 144, 192, 512]

# 각 크기별로 아이콘 생성 및 저장
for size in sizes:
    icon = create_icon(size)
    filename = f'icon-{size}.png'
    icon.save(filename, 'PNG')
    print(f'✅ {filename} 생성 완료')

print('\n모든 PWA 아이콘이 생성되었습니다!')
print('생성된 파일:')
for size in sizes:
    print(f'  - icon-{size}.png')