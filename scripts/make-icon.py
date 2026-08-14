# 生成 PaceOn 桌面应用图标 desktop/build/icon.ico（含 16/32/48/256 多尺寸）
# 需要 Pillow：pip install pillow
import os
import struct
from PIL import Image, ImageDraw

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "desktop", "build", "icon.ico")
os.makedirs(os.path.dirname(OUT), exist_ok=True)


def draw_icon(size):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # 圆角渐变底
    r = size * 0.22
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=r, fill=(16, 185, 129, 255))
    # 顶部高光
    d.rounded_rectangle([0, 0, size - 1, int(size * 0.5)], radius=r, fill=(52, 211, 153, 120))
    # 跑道圆形（白色）
    cx, cy, rad = size * 0.5, size * 0.54, size * 0.26
    d.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], outline=(255, 255, 255, 255), width=max(2, int(size * 0.045)))
    # 三颗星表示配速
    for i, (ox, oy, sr) in enumerate([(0, -0.07, 0.06), (0, 0.02, 0.04), (0, 0.11, 0.025)]):
        d.ellipse([cx - size * sr, cy + size * oy - size * sr, cx + size * sr, cy + size * oy + size * sr],
                  fill=(255, 255, 255, 255))
    return img


def main():
    # 以最大尺寸绘制，Pillow 会根据 sizes 自动生成各尺寸帧
    img = draw_icon(256)
    img.save(OUT, format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    print("icon written:", OUT, os.path.getsize(OUT), "bytes")


if __name__ == "__main__":
    main()
