"""Asset prep for the catalog wall (run once: python3 scripts/build_assets.py <src_dir>).
Crops the two 3x3 product sheets into single products, whitens the background,
pads each to a square, and packs an 8x4 atlas (2048x1024, power of two for mipmaps) of 256px slots for the WebGL wall.
Also writes the hero kurta texture and DOM fallbacks. All products are AI-generated
demo photos for a fictional brand ("yourbrand"); replace with real catalog shots any time."""
import sys, json
import numpy as np
from PIL import Image

src = sys.argv[1]
out = 'public/img'
SLOT = 256

def whiten(im):
    a = np.asarray(im.convert('RGB')).astype(np.float32)
    # levels: anything at or above 246 becomes paper white, keep the soft shadows
    a = np.clip((a - 0) * (255.0 / 246.0), 0, 255)
    return Image.fromarray(a.astype(np.uint8))

def crop_product(cell):
    a = np.asarray(cell.convert('L'))
    mask = a < 240
    ys, xs = np.where(mask)
    if len(xs) == 0:
        return cell
    pad = 6
    x0, x1 = max(xs.min() - pad, 0), min(xs.max() + pad, cell.width)
    y0, y1 = max(ys.min() - pad, 0), min(ys.max() + pad, cell.height)
    return cell.crop((x0, y0, x1, y1))

def square(im, size, fill=0.80):
    """Fit the product into a square so its longest side is `fill` of the slot."""
    w, h = im.size
    s = (size * fill) / max(w, h)
    im = im.resize((max(1, round(w * s)), max(1, round(h * s))), Image.LANCZOS)
    canvas = Image.new('RGB', (size, size), (255, 255, 255))
    canvas.paste(im, ((size - im.width) // 2, (size - im.height) // 2))
    return canvas

names_a = ['wrap-dress', 'court-sneaker', 'gold-hoops', 'canvas-tote', 'oxford-shirt', 'kolhapuri-sandals', 'denim-jacket', 'cable-knit', 'sunglasses']
names_b = ['mustard-dupatta', 'khaki-chinos', 'silk-saree', 'crossbody-bag', 'leather-watch', 'linen-shirt', 'silver-jhumkas', 'block-print-palazzo', 'canvas-sneakers']

products = []
kurta = whiten(Image.open(f'{src}/hero-kurta.png'))
products.append(('block-print-kurta', square(crop_product(kurta), SLOT * 2)))
for sheet, names in (('sheet-a', names_a), ('sheet-b', names_b)):
    im = whiten(Image.open(f'{src}/{sheet}.png'))
    cw, ch = im.width / 3, im.height / 3
    for i, n in enumerate(names):
        r, c = divmod(i, 3)
        cell = im.crop((round(c * cw), round(r * ch), round((c + 1) * cw), round((r + 1) * ch)))
        products.append((n, square(crop_product(cell), SLOT * 2)))

cols, rows = 8, 4
atlas = Image.new('RGB', (cols * SLOT, rows * SLOT), (255, 255, 255))
manifest = []
for i, (n, im) in enumerate(products):
    r, c = divmod(i, cols)
    atlas.paste(im.resize((SLOT, SLOT), Image.LANCZOS), (c * SLOT, r * SLOT))
    im.save(f'{out}/p-{n}.webp', quality=82)
    # The same shot on the designed ad's sand ground (multiplied), so HTML cards need no blend mode.
    sand = (np.asarray(im.convert('RGB'), dtype=np.float32) * (np.array([239, 232, 221]) / 255.0)).round().astype(np.uint8)
    Image.fromarray(sand).save(f'{out}/p-{n}-sand.webp', quality=82, method=6)
    # Small versions for thumbnails (the report, the cards riding the wires).
    im.convert('RGB').resize((160, 160), Image.LANCZOS).save(f'{out}/p-{n}-t.webp', quality=80, method=6)
    Image.fromarray(sand).resize((160, 160), Image.LANCZOS).save(f'{out}/p-{n}-sand-t.webp', quality=80, method=6)
    manifest.append(n)
atlas.save(f'{out}/atlas.webp', quality=86)
# Sharp version for close-ups (the hero frame), swapped in once it has loaded.
hd = Image.new('RGB', (cols * SLOT * 2, rows * SLOT * 2), (255, 255, 255))
for i, (n, im) in enumerate(products):
    r, c = divmod(i, cols)
    hd.paste(im, (c * SLOT * 2, r * SLOT * 2))
hd.save(f'{out}/atlas-hd.webp', quality=80)

# Hero texture: the kurta as a catalog photo, 4:5, product on white
hero = square(crop_product(kurta), 1024, fill=0.86)
hero.save(f'{out}/hero-kurta.webp', quality=84)
json.dump({'cols': cols, 'rows': rows, 'slot': SLOT, 'products': manifest}, open('src/wall/atlas.json', 'w'), indent=1)
print('products', len(products), manifest)
