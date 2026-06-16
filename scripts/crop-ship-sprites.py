"""从 ships-sheet.png 裁剪 6 个飞机贴图，去黑底，并按编号输出到 public/sprites/。"""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "assets" / "source" / "ships-sheet.png"
OUT_DIR = ROOT / "public" / "sprites"

# 编号 1-6：从左到右、从上到下（由图像非透明区域自动检测）
SPRITE_BOXES: dict[int, tuple[int, int, int, int]] = {
    1: (40, 115, 244, 282),
    2: (277, 125, 416, 282),
    3: (447, 115, 632, 288),
    4: (106, 330, 310, 469),
    5: (392, 320, 581, 468),
    6: (38, 504, 648, 820),
}

# 敌机 1/2/4/5 与 Boss 6 需旋转 180°；3 为自机保持朝上
ROTATE_180 = {1, 2, 4, 5, 6}


def remove_black_background(img: Image.Image, threshold: int = 28) -> Image.Image:
    """将近黑背景转为透明。"""
    rgba = img.convert("RGBA")
    pixels = rgba.load()
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            if r <= threshold and g <= threshold and b <= threshold:
                pixels[x, y] = (0, 0, 0, 0)
    return rgba


def crop_sprite(sheet: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    return sheet.crop(box)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    sheet = Image.open(SOURCE).convert("RGBA")

    for index, box in SPRITE_BOXES.items():
        sprite = crop_sprite(sheet, box)
        sprite = remove_black_background(sprite)
        if index in ROTATE_180:
            sprite = sprite.rotate(180, expand=True, resample=Image.Resampling.BICUBIC)
        out_path = OUT_DIR / f"ship-{index}.png"
        sprite.save(out_path, optimize=True)
        print(f"saved {out_path.name} ({sprite.size[0]}x{sprite.size[1]})")


if __name__ == "__main__":
    main()
