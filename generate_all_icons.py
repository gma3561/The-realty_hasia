#!/usr/bin/env python3
from PIL import Image
import os

# 아이콘 크기 정의
icon_sizes = [16, 32, 48, 72, 96, 128, 144, 152, 167, 180, 192, 256, 384, 512, 1024]

# icons 디렉토리 생성
os.makedirs("icons", exist_ok=True)

print("🎨 더부동산중개법인 아이콘 생성 시작...")

# 1. 흰색 배경 아이콘 (라이트 모드)
print("\n📱 라이트 모드 아이콘 생성 중...")
base_logo_light = Image.open("logo_square_white_bg.png")

for size in icon_sizes:
    resized = base_logo_light.resize((size, size), Image.Resampling.LANCZOS)
    filename = f"icons/icon-{size}x{size}.png"
    resized.save(filename, "PNG", optimize=True, quality=95)
    print(f"  ✓ {filename} ({size}x{size}px)")

# favicon 특별 크기들
favicon_sizes = [16, 32]
for size in favicon_sizes:
    resized = base_logo_light.resize((size, size), Image.Resampling.LANCZOS)
    filename = f"icons/favicon-{size}x{size}.png"
    resized.save(filename, "PNG", optimize=True, quality=95)
    print(f"  ✓ {filename} (favicon)")

# 2. 검정 배경 아이콘 (다크 모드)
print("\n🌙 다크 모드 아이콘 생성 중...")
base_logo_dark = Image.open("logo_square_black_bg.png")

for size in icon_sizes:
    resized = base_logo_dark.resize((size, size), Image.Resampling.LANCZOS)
    filename = f"icons/icon-{size}x{size}-dark.png"
    resized.save(filename, "PNG", optimize=True, quality=95)
    print(f"  ✓ {filename} ({size}x{size}px - dark)")

# 3. Apple Touch Icon (특별 처리)
print("\n🍎 Apple Touch Icons 생성 중...")
apple_sizes = [120, 180, 152, 167]
for size in apple_sizes:
    resized = base_logo_light.resize((size, size), Image.Resampling.LANCZOS)
    filename = f"icons/apple-touch-icon-{size}x{size}.png"
    resized.save(filename, "PNG", optimize=True, quality=95)
    print(f"  ✓ {filename}")

# 기본 apple-touch-icon (180x180)
default_apple = base_logo_light.resize((180, 180), Image.Resampling.LANCZOS)
default_apple.save("icons/apple-touch-icon.png", "PNG", optimize=True, quality=95)
print(f"  ✓ icons/apple-touch-icon.png (기본)")

# 4. 파일 크기 통계
print("\n📊 생성 완료 통계:")
total_size = 0
file_count = 0
for filename in os.listdir("icons"):
    if filename.endswith(".png"):
        filepath = os.path.join("icons", filename)
        size = os.path.getsize(filepath)
        total_size += size
        file_count += 1

print(f"  - 총 생성 파일: {file_count}개")
print(f"  - 총 용량: {total_size / 1024:.1f} KB")
print(f"  - 평균 파일 크기: {(total_size / file_count) / 1024:.1f} KB")

print("\n✅ 모든 아이콘 생성 완료!")