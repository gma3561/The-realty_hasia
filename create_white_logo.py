from PIL import Image
import numpy as np

# 원본 검정 로고 읽기
img = Image.open('logo_black@2x.png').convert('RGBA')
data = np.array(img)

# 투명한 부분은 그대로 두고, 검정색 부분을 흰색으로 변경
# 검정색 픽셀 (RGB가 모두 낮은 값)을 찾아서 흰색으로 변경
for i in range(data.shape[0]):
    for j in range(data.shape[1]):
        # 알파값이 0이 아닌 (투명하지 않은) 픽셀만 처리
        if data[i, j, 3] > 0:
            # 검정색에 가까운 픽셀을 흰색으로 변경
            if data[i, j, 0] < 128 and data[i, j, 1] < 128 and data[i, j, 2] < 128:
                data[i, j, 0] = 255  # R
                data[i, j, 1] = 255  # G
                data[i, j, 2] = 255  # B

# 새 이미지 생성 및 저장
white_logo = Image.fromarray(data, 'RGBA')
white_logo.save('logo_white@2x.png', 'PNG')

print("✅ 흰색 누끼 로고가 생성되었습니다: logo_white@2x.png")