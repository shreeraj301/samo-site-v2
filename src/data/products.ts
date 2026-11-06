// The catalog the site shows: one source for the WebGL wall's text and the HTML cards.
// Photos live in public/img/p-<slug>.webp (512 px, product on white).
export type Product = { slug: string; name: string; price: string; meta: string };

export const PRODUCTS: Product[] = [
  { slug: 'block-print-kurta', name: 'Block-print kurta', price: '₹1,799', meta: 'Women, rust, XS to XL' },
  { slug: 'wrap-dress', name: 'Linen wrap dress', price: '₹2,499', meta: 'Women, cobalt, S to L' },
  { slug: 'court-sneaker', name: 'Court sneaker', price: '₹2,899', meta: 'Unisex, white, 5 to 11' },
  { slug: 'gold-hoops', name: 'Gold hoops', price: '₹999', meta: 'Women, gold, one size' },
  { slug: 'canvas-tote', name: 'Canvas tote', price: '₹1,199', meta: 'Unisex, natural' },
  { slug: 'oxford-shirt', name: 'Oxford shirt', price: '₹1,599', meta: 'Men, sky blue, S to XXL' },
  { slug: 'kolhapuri-sandals', name: 'Kolhapuri sandals', price: '₹1,399', meta: 'Women, tan, 4 to 9' },
  { slug: 'denim-jacket', name: 'Denim jacket', price: '₹3,499', meta: 'Unisex, mid wash, S to XL' },
  { slug: 'cable-knit', name: 'Cable-knit jumper', price: '₹2,899', meta: 'Men, olive, M to XXL' },
  { slug: 'sunglasses', name: 'Tortoise sunglasses', price: '₹1,199', meta: 'Unisex, tortoise' },
  { slug: 'mustard-dupatta', name: 'Mustard dupatta', price: '₹999', meta: 'Women, mustard, cotton' },
  { slug: 'khaki-chinos', name: 'Khaki chinos', price: '₹1,799', meta: 'Men, khaki, 28 to 38' },
  { slug: 'silk-saree', name: 'Silk saree', price: '₹3,499', meta: 'Women, maroon, zari border' },
  { slug: 'crossbody-bag', name: 'Crossbody bag', price: '₹2,499', meta: 'Women, black leather' },
  { slug: 'leather-watch', name: 'Leather strap watch', price: '₹2,899', meta: 'Men, brown strap' },
  { slug: 'linen-shirt', name: 'Linen shirt', price: '₹1,599', meta: 'Men, sage, S to XL' },
  { slug: 'silver-jhumkas', name: 'Silver jhumkas', price: '₹1,399', meta: 'Women, oxidised silver' },
  { slug: 'block-print-palazzo', name: 'Block-print palazzo', price: '₹1,399', meta: 'Women, indigo, S to XL' },
  { slug: 'canvas-sneakers', name: 'Canvas sneakers', price: '₹999', meta: 'Unisex, white, 5 to 11' },
  { slug: 'chikankari-kurta', name: 'Chikankari kurta', price: '₹2,499', meta: 'Women, ivory, XS to XXL' },
  { slug: 'anarkali-kurta', name: 'Anarkali kurta', price: '₹3,499', meta: 'Women, teal, S to XL' },
  { slug: 'nehru-jacket', name: 'Nehru jacket', price: '₹2,899', meta: 'Men, charcoal, S to XXL' },
  { slug: 'bandhani-dupatta', name: 'Bandhani dupatta', price: '₹1,399', meta: 'Women, red, cotton silk' },
  { slug: 'ikat-kurta', name: 'Ikat short kurta', price: '₹1,799', meta: 'Men, black and ivory, S to XXL' },
  { slug: 'mirror-lehenga', name: 'Mirror-work lehenga', price: '₹3,499', meta: 'Women, dusty rose, S to L' },
  { slug: 'cotton-saree', name: 'Cotton saree', price: '₹2,499', meta: 'Women, lavender, silver border' },
  { slug: 'gota-sharara', name: 'Gota sharara', price: '₹1,799', meta: 'Women, peach, XS to XL' },
  { slug: 'puff-sleeve-blouse', name: 'Puff-sleeve blouse', price: '₹1,399', meta: 'Women, fuchsia silk, 32 to 40' },
  { slug: 'breton-top', name: 'Breton top', price: '₹1,199', meta: 'Women, navy stripe, XS to XL' },
  { slug: 'fleece-hoodie', name: 'Fleece hoodie', price: '₹1,799', meta: 'Unisex, grey marl, S to XXL' },
  { slug: 'pleated-skirt', name: 'Pleated midi skirt', price: '₹1,599', meta: 'Women, camel, XS to L' },
  { slug: 'wide-leg-jeans', name: 'Wide-leg jeans', price: '₹2,499', meta: 'Women, light wash, 24 to 34' },
  { slug: 'cargo-trousers', name: 'Cargo trousers', price: '₹1,799', meta: 'Men, black, 28 to 38' },
  { slug: 'knit-polo', name: 'Knit polo', price: '₹1,599', meta: 'Men, cream, S to XL' },
  { slug: 'wool-blazer', name: 'Wool-blend blazer', price: '₹3,499', meta: 'Women, chocolate, XS to L' },
  { slug: 'shirt-dress', name: 'Belted shirt dress', price: '₹2,499', meta: 'Women, terracotta, XS to XL' },
  { slug: 'floral-slip-dress', name: 'Floral slip dress', price: '₹1,799', meta: 'Women, butter yellow, XS to L' },
  { slug: 'penny-loafers', name: 'Penny loafers', price: '₹3,499', meta: 'Men, oxblood, 6 to 11' },
  { slug: 'chelsea-boots', name: 'Suede Chelsea boots', price: '₹3,499', meta: 'Men, tan, 6 to 11' },
  { slug: 'running-shoes', name: 'Knit running shoes', price: '₹2,899', meta: 'Unisex, grey, 5 to 11' },
  { slug: 'block-heels', name: 'Block-heel sandals', price: '₹1,799', meta: 'Women, blush, 3 to 8' },
  { slug: 'embroidered-juttis', name: 'Embroidered juttis', price: '₹1,399', meta: 'Women, gold, 3 to 8' },
  { slug: 'ballet-flats', name: 'Ballet flats', price: '₹1,599', meta: 'Women, red, 3 to 8' },
  { slug: 'leather-backpack', name: 'Leather backpack', price: '₹3,499', meta: 'Unisex, camel' },
  { slug: 'straw-tote', name: 'Straw tote', price: '₹1,199', meta: 'Women, natural' },
  { slug: 'velvet-potli', name: 'Velvet potli', price: '₹999', meta: 'Women, plum, zari work' },
  { slug: 'pearl-necklace', name: 'Pearl necklace', price: '₹1,599', meta: 'Women, ivory pearls' },
  { slug: 'gold-bangles', name: 'Gold bangle set', price: '₹1,199', meta: 'Women, set of six' },
  { slug: 'silver-payal', name: 'Silver payal', price: '₹999', meta: 'Women, pair, with bells' },
  { slug: 'signet-ring', name: 'Signet ring', price: '₹1,399', meta: 'Unisex, gold, 6 to 12' },
  { slug: 'leather-belt', name: 'Leather belt', price: '₹1,199', meta: 'Men, brown, 30 to 40' },
  { slug: 'paisley-scarf', name: 'Paisley silk scarf', price: '₹1,399', meta: 'Women, rust and teal' },
  { slug: 'bucket-hat', name: 'Bucket hat', price: '₹999', meta: 'Unisex, beige, one size' },
  { slug: 'gold-aviators', name: 'Gold aviators', price: '₹1,799', meta: 'Unisex, brown lens' },
  { slug: 'bifold-wallet', name: 'Bifold wallet', price: '₹1,199', meta: 'Men, black leather' },
];

export const bySlug = (slug: string) => PRODUCTS.find((p) => p.slug === slug) ?? PRODUCTS[0];
export const NAMES: Record<string, string> = Object.fromEntries(PRODUCTS.map((p) => [p.slug, p.name]));

// The treatment labels on the ads, grouped by colour (graphics.css, shaders.ts): offers in red,
// proof in ink, fresh in white, stock in marigold and forest. The wall numbers them in this order.
export const LABEL_KEYS = ['sale', 'bestseller', 'new', 'flat', 'bundle', 'trending', 'low', 'restock'] as const;
export type AdLabel = (typeof LABEL_KEYS)[number] | null;
export const LABEL_TEXT: Record<Exclude<AdLabel, null>, string> = {
  sale: 'Sale 30% off',
  bestseller: 'Bestseller',
  new: 'New in',
  flat: 'Flat 40% off',
  bundle: 'Buy 2, get 1',
  trending: 'Trending',
  low: 'Only 3 left',
  restock: 'Back in stock',
};
