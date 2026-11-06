"""Asset prep for the catalog wall (run once: python3 scripts/build_assets.py <src_dir>).
Cuts the six 3x3 product sheets into single products, whitens the background, pads each to a
square, and packs them in 8x8 atlases (powers of two, for mipmaps) for the WebGL wall: the hero
kurta and 54 more products, 55 slots used. atlas.webp has 128px slots (1024x1024): the phone
opening and the far walls. atlas-m.webp has 256px slots (2048x2048): phones swap it in once the
opening has played. atlas-hd.webp has 512px slots (4096x4096) for the close-ups on wider screens. Also writes the hero kurta
texture, the DOM card images and a contact sheet (scripts/out/contact.png) to check every cut.
All products are AI-generated demo photos for a fictional brand ("yourbrand"); replace them
with real catalog shots any time."""
import os, sys, json, hashlib
import numpy as np
from PIL import Image

src = sys.argv[1]
out = 'public/img'
SLOT = 128  # the small atlas; the sharp one is 4x
HD = 512
COLS, ROWS = 8, 8

# Each sheet's products, row by row, left to right. The slugs match src/data/products.ts.
SHEETS = {
    'sheet-a': ['wrap-dress', 'court-sneaker', 'gold-hoops', 'canvas-tote', 'oxford-shirt', 'kolhapuri-sandals', 'denim-jacket', 'cable-knit', 'sunglasses'],
    'sheet-b': ['mustard-dupatta', 'khaki-chinos', 'silk-saree', 'crossbody-bag', 'leather-watch', 'linen-shirt', 'silver-jhumkas', 'block-print-palazzo', 'canvas-sneakers'],
    'sheet-c': ['chikankari-kurta', 'anarkali-kurta', 'nehru-jacket', 'bandhani-dupatta', 'ikat-kurta', 'mirror-lehenga', 'cotton-saree', 'gota-sharara', 'puff-sleeve-blouse'],
    'sheet-d': ['breton-top', 'fleece-hoodie', 'pleated-skirt', 'wide-leg-jeans', 'cargo-trousers', 'knit-polo', 'wool-blazer', 'shirt-dress', 'floral-slip-dress'],
    'sheet-e': ['penny-loafers', 'chelsea-boots', 'running-shoes', 'block-heels', 'embroidered-juttis', 'ballet-flats', 'leather-backpack', 'straw-tote', 'velvet-potli'],
    'sheet-f': ['pearl-necklace', 'gold-bangles', 'silver-payal', 'signet-ring', 'leather-belt', 'paisley-scarf', 'bucket-hat', 'gold-aviators', 'bifold-wallet'],
}

def whiten(im):
    a = np.asarray(im.convert('RGB')).astype(np.float32)
    # levels: anything at or above 246 becomes paper white, keep the soft shadows
    a = np.clip((a - 0) * (255.0 / 246.0), 0, 255)
    return Image.fromarray(a.astype(np.uint8))

def runs(free):
    """Start and end of each run of True."""
    found, start = [], None
    for i, f in enumerate(free):
        if f and start is None: start = i
        if not f and start is not None: found.append((start, i)); start = None
    if start is not None: found.append((start, len(free)))
    return found

def splits(free, n):
    """The two cuts nearest n/3 and 2n/3, each inside a white gap (the exact third if none is near)."""
    cuts, ok = [], True
    for t in (n / 3, 2 * n / 3):
        best = None
        for a, b in runs(free):
            if b - a < 3: continue
            c = min(max(t, a + 1), b - 1) if a <= t < b else (a + b) / 2
            d = abs(c - t)
            if d <= n * 0.12 and (best is None or d < best[0]): best = (d, round(c))
        cuts.append(best[1] if best else round(t)); ok = ok and best is not None
    return cuts, ok

def cut_sheet(im, name, pad=6):
    """Cut a 3x3 sheet along the white gaps between products, not at exact thirds, so a product
    that crosses a third line stays whole and no neighbour's edge leaks into the crop. Columns
    first (a white line from top to bottom), then rows inside each column."""
    mask = np.asarray(im.convert('L')) < 240
    h, w = mask.shape
    (x1, x2), ok = splits(~mask.any(axis=0), w)
    cells = {}
    for ci, (c0, c1) in enumerate([(0, x1), (x1, x2), (x2, w)]):
        (y1, y2), ok_r = splits(~mask[:, c0:c1].any(axis=1), h)
        ok = ok and ok_r
        for ri, (r0, r1) in enumerate([(0, y1), (y1, y2), (y2, h)]):
            m = mask[r0:r1, c0:c1]
            ys, xs = np.where(m)
            cells[ri * 3 + ci] = im.crop((max(c0 + xs.min() - pad, c0), max(r0 + ys.min() - pad, r0),
                                          min(c0 + xs.max() + 1 + pad, c1), min(r0 + ys.max() + 1 + pad, r1)))
    if not ok: print(f'warning: {name} has a cut with no white gap near it; check the contact sheet')
    return [cells[i] for i in range(9)]

def crop_product(im):
    a = np.asarray(im.convert('L'))
    ys, xs = np.where(a < 240)
    if len(xs) == 0: return im
    pad = 6
    return im.crop((max(xs.min() - pad, 0), max(ys.min() - pad, 0), min(xs.max() + pad, im.width), min(ys.max() + pad, im.height)))

def square(im, size, fill=0.80):
    """Fit the product into a square so its longest side is `fill` of the slot."""
    w, h = im.size
    s = (size * fill) / max(w, h)
    im = im.resize((max(1, round(w * s)), max(1, round(h * s))), Image.LANCZOS)
    canvas = Image.new('RGB', (size, size), (255, 255, 255))
    canvas.paste(im, ((size - im.width) // 2, (size - im.height) // 2))
    return canvas

products = []
kurta = whiten(Image.open(f'{src}/hero-kurta.png'))
products.append(('block-print-kurta', square(crop_product(kurta), HD)))
for sheet, names in SHEETS.items():
    for n, crop in zip(names, cut_sheet(whiten(Image.open(f'{src}/{sheet}.png')), sheet)):
        products.append((n, square(crop, HD)))
assert len(products) <= COLS * ROWS

atlas = Image.new('RGB', (COLS * SLOT, ROWS * SLOT), (255, 255, 255))
hd = Image.new('RGB', (COLS * HD, ROWS * HD), (255, 255, 255))
manifest = []
for i, (n, im) in enumerate(products):
    r, c = divmod(i, COLS)
    atlas.paste(im.resize((SLOT, SLOT), Image.LANCZOS), (c * SLOT, r * SLOT))
    hd.paste(im, (c * HD, r * HD))
    im.save(f'{out}/p-{n}.webp', quality=82)
    # The same shot on the designed ad's sand ground (multiplied), so HTML cards need no blend mode.
    sand = (np.asarray(im.convert('RGB'), dtype=np.float32) * (np.array([239, 232, 221]) / 255.0)).round().astype(np.uint8)
    Image.fromarray(sand).save(f'{out}/p-{n}-sand.webp', quality=82, method=6)
    # Small versions for thumbnails (the report, the cards riding the wires).
    im.convert('RGB').resize((160, 160), Image.LANCZOS).save(f'{out}/p-{n}-t.webp', quality=80, method=6)
    Image.fromarray(sand).resize((160, 160), Image.LANCZOS).save(f'{out}/p-{n}-sand-t.webp', quality=80, method=6)
    manifest.append(n)
atlas.save(f'{out}/atlas.webp', quality=86, method=6)
# 256px slots (2048x2048): phones swap it in once the opening has played, sharp at 2x.
mid = Image.new('RGB', (COLS * SLOT * 2, ROWS * SLOT * 2), (255, 255, 255))
for i, (n, im) in enumerate(products):
    r, c = divmod(i, COLS)
    mid.paste(im.resize((SLOT * 2, SLOT * 2), Image.LANCZOS), (c * SLOT * 2, r * SLOT * 2))
mid.save(f'{out}/atlas-m.webp', quality=80, method=6)
# Sharp version for close-ups (the hero frame), swapped in once it has loaded.
hd.save(f'{out}/atlas-hd.webp', quality=72, method=6)

# Hero texture: the kurta as a catalog photo, 4:5, product on white
hero = square(crop_product(kurta), 1024, fill=0.86)
hero.save(f'{out}/hero-kurta.webp', quality=84)
# The same shot at 512 px: the HTML opening card (first paint) and the hero tile on phones.
hero.resize((512, 512), Image.LANCZOS).save(f'{out}/hero-kurta-s.webp', quality=82, method=6)
# The atlases' fingerprint: their URLs carry it (src/wall/files.ts), so no cache serves an old one.
v = hashlib.sha1(b''.join(open(f'{out}/{n}', 'rb').read() for n in ('atlas.webp', 'atlas-m.webp', 'atlas-hd.webp'))).hexdigest()[:8]
json.dump({'cols': COLS, 'rows': ROWS, 'slot': SLOT, 'v': v, 'products': manifest}, open('src/wall/atlas.json', 'w'), indent=1)

# Contact sheet: every product as the wall cuts it, to check the crops by eye.
os.makedirs('scripts/out', exist_ok=True)
S = 160
contact = Image.new('RGB', (11 * S, -(-len(products) // 11) * S), (255, 255, 255))
for i, (n, im) in enumerate(products):
    contact.paste(im.resize((S, S), Image.LANCZOS), ((i % 11) * S, (i // 11) * S))
contact.save('scripts/out/contact.png')
print('products', len(products))
