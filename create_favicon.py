#!/usr/bin/env python3
from PIL import Image
import os

# favicon.ico 생성 (여러 크기를 하나의 ico 파일에 포함)
print("🔧 favicon.ico 생성 중...")

base_logo = Image.open("logo_square_white_bg.png")

# favicon.ico에 포함될 크기들
favicon_sizes = [(16, 16), (32, 32), (48, 48)]
favicon_images = []

for size in favicon_sizes:
    resized = base_logo.resize(size, Image.Resampling.LANCZOS)
    favicon_images.append(resized)

# favicon.ico 저장
favicon_images[0].save(
    "favicon.ico",
    format="ICO",
    sizes=favicon_sizes,
    append_images=favicon_images[1:]
)

print("✅ favicon.ico 생성 완료!")

# 파일 크기 확인
size = os.path.getsize("favicon.ico")
print(f"📊 파일 크기: {size / 1024:.1f} KB")