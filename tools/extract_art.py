"""Build UI art from the Type C theme package.

Crops the FRONT view of each character turnaround into a full-figure portrait
and a bust, and turns the arena concepts into soft backdrops. These are UI
placeholders until real portraits are produced; the 3D board units stay 3D.

Usage: python3 tools/extract_art.py <path/to/Type_C_Theme_Package> src/assets
Requires Pillow.
"""
import glob
import os
import sys

from PIL import Image, ImageFilter

# Asset IDs in the package -> unit ids in src/sim/data.ts
UNIT_IDS = {
    'bastion_warden': 'warden', 'lumen_archer': 'lumen', 'dawnblade_duelist': 'dawnblade',
    'choir_priestess': 'priestess', 'radiant_colossus': 'colossus',
    'barnacle_brute': 'brute', 'harpoon_deadeye': 'deadeye', 'riptide_corsair': 'corsair',
    'abyssal_siren': 'siren', 'drowned_admiral': 'admiral',
    'mossback_guardian': 'mossback', 'thornfang_stalker': 'thornfang', 'antlered_huntress': 'huntress',
    'sporecaller_shaman': 'shaman', 'elder_heartwood': 'heartwood',
}
BOARDS = {'sunlit_sanctum': 'sanctum', 'drowned_reef': 'reef', 'heartwood_hollow': 'heartwood'}


def background(im):
    """Average colour of the four corner patches."""
    w, h = im.size
    px = []
    for x0, y0 in [(0, 0), (w - 20, 0), (0, h - 20), (w - 20, h - 20)]:
        px += list(im.crop((x0, y0, x0 + 20, y0 + 20)).get_flattened_data())
    return tuple(sum(p[i] for p in px) // len(px) for i in range(3))


def _bands(counts, min_count):
    """Contiguous runs of indices whose count is at least `min_count`, allowing tiny gaps."""
    bands, start, gap = [], None, 0
    for i, c in enumerate(counts + [0] * 12):
        if c >= min_count:
            if start is None:
                start = i
            gap, end = 0, i
        elif start is not None:
            gap += 1
            if gap > 10:
                bands.append((start, end + 1))
                start = None
    return bands


def front_bbox(im):
    """Bounding box of the left-most figure. Picks the heaviest contiguous band of rows so the
    view label under the figure and the title rules above it are left out."""
    w, h = im.size
    x1, y0, y1 = int(w * 0.345), int(h * 0.09), int(h * 0.905)
    region = im.crop((0, y0, x1, y1))
    bg = background(im)
    rw, rh = region.size
    data = region.load()
    mask = [[sum(abs(data[x, y][i] - bg[i]) for i in range(3)) > 60 for x in range(rw)] for y in range(rh)]
    row_counts = [sum(r) for r in mask]
    ry0, ry1 = max(_bands(row_counts, rw * 0.04), key=lambda b: sum(row_counts[b[0]:b[1]]))
    col_counts = [sum(mask[y][x] for y in range(ry0, ry1)) for x in range(rw)]
    cx0, cx1 = max(_bands(col_counts, (ry1 - ry0) * 0.03), key=lambda b: sum(col_counts[b[0]:b[1]]))
    return (cx0, y0 + ry0, cx1, y0 + ry1), bg


def pad_to(im, box, aspect, bg, pad=0.06, margin=10):
    """Place the pixels inside `box` on a clean background canvas of width/height = aspect,
    feathering the edges so the sheet's vignette never shows as a hard rectangle."""
    x0, y0, x1, y1 = box
    x0, y0 = max(0, x0 - margin), max(0, y0 - margin)
    x1, y1 = min(im.width, x1 + margin), min(im.height, y1 + margin)
    bw, bh = x1 - x0, y1 - y0
    ch = bh * (1 + pad * 2)
    cw = max(bw * (1 + pad * 2), ch * aspect)
    ch = max(ch, cw / aspect)
    out = Image.new('RGB', (int(cw), int(ch)), bg)
    feather = Image.new('L', (bw, bh), 0)
    feather.paste(255, (margin, margin, bw - margin, bh - margin))
    feather = feather.filter(ImageFilter.GaussianBlur(margin / 2))
    out.paste(im.crop((x0, y0, x1, y1)), (int((cw - bw) / 2), int((ch - bh) / 2)), feather)
    return out


def main(pkg, out):
    os.makedirs(f'{out}/portraits', exist_ok=True)
    os.makedirs(f'{out}/boards', exist_ok=True)
    for path in sorted(glob.glob(f'{pkg}/02_Characters/*/*_turnaround.png')):
        asset = os.path.basename(path).replace('_turnaround.png', '')
        uid = UNIT_IDS[asset]
        im = Image.open(path).convert('RGB')
        box, bg = front_bbox(im)
        full = pad_to(im, box, 3 / 4, bg).resize((360, 480), Image.LANCZOS)
        full.save(f'{out}/portraits/{uid}.webp', quality=82, method=6)
        x0, y0, x1, y1 = box
        # Bust: a square from the top of the figure, narrowed to the middle for wide poses.
        side = min(x1 - x0, int((y1 - y0) * 0.62))
        cx = (x0 + x1) // 2
        bust = pad_to(im, (cx - side // 2, y0, cx + side // 2, y0 + side), 1, bg, pad=0.02, margin=6).resize((256, 256), Image.LANCZOS)
        bust.save(f'{out}/portraits/{uid}_bust.webp', quality=82, method=6)
        print(uid, box, bg)
    for path in sorted(glob.glob(f'{pkg}/03_Boards/*_concept.png')):
        bid = BOARDS[os.path.basename(path).replace('_concept.png', '')]
        im = Image.open(path).convert('RGB')
        # Drop the painted title band at the top of each concept.
        im = im.crop((0, int(im.height * 0.11), im.width, im.height)).resize((720, 640), Image.LANCZOS)
        im.filter(ImageFilter.GaussianBlur(3)).save(f'{out}/boards/{bid}.webp', quality=70, method=6)
        print('board', bid)
    ref = Image.open(f'{pkg}/01_Reference/Type_C_Selected_Reference.png').convert('RGB')
    # The Mossback Guardian panel of the approved reference is the Home screen hero.
    ref.crop((0, 690, 627, 1254)).resize((540, 486), Image.LANCZOS).save(f'{out}/hero_mossback.webp', quality=82, method=6)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
