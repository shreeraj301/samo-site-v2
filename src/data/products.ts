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
];

export const bySlug = (slug: string) => PRODUCTS.find((p) => p.slug === slug) ?? PRODUCTS[0];
export const NAMES: Record<string, string> = Object.fromEntries(PRODUCTS.map((p) => [p.slug, p.name]));

export type AdLabel = 'sale' | 'bestseller' | 'new' | null;
export const LABEL_TEXT: Record<Exclude<AdLabel, null>, string> = {
  sale: 'Sale 30% off',
  bestseller: 'Bestseller',
  new: 'New in',
};
