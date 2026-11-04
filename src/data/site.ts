// All visible copy lives here, so the team can edit words without touching markup.
//
// Facts come from the live heysamo.com and from the Samo team. Items marked
// `placeholder: true` are assumptions that must be checked or replaced before launch:
//   - results.source: the live site has no test details yet
//   - audit.checks: taken from what the privacy policy says Samo checks; confirm with the team
//   - links.call: no calendar link exists yet, so it opens an email like the live site
//   - the wall: ~4,800 demo SKUs with invented profit classes (an illustration, not data)
//   - product photos: AI-generated demo products for a fictional "yourbrand"

const email = 'hello@heysamo.com';

export const site = {
  name: 'Samo',
  legal: 'Acuai Labs Pvt Ltd',
  url: 'https://heysamo.com',
  email,
  title: 'Samo: catalog ads that put spend on your best SKUs',
  description:
    'Samo runs catalog ads for brands with thousands of products: a clean feed, an ad and a video for every SKU, profit per SKU, and spend on what sells.',
};

export const links = {
  call: {
    href: `mailto:${email}?subject=${encodeURIComponent('Call with the founder')}`,
    placeholder: true,
  },
  audit: '/audit',
  privacy: '/privacy',
  terms: '/terms',
  dataDeletion: '/data-deletion',
};

export const hero = {
  title: 'Put your ad spend on the SKUs that make you money.',
  primary: 'Set up a call with the founder',
  secondary: 'Get a free feed audit',
  sku: { name: 'Block-print kurta', price: '₹1,799' },
};

// Samo's five steps. Each chapter is a headline and a count: no body copy, the wall shows the rest.
// `key`: the count shown above each chapter, read from the catalog the wall draws
// (src/wall/data.ts catalogStats). `swatch` ties the number to the colour it has on the wall.
export type Chapter = {
  id: string;
  name: string;
  title: string;
  alt: string;
  key: { stat: 'total' | 'missing' | 'wasters' | 'winners'; label: string; swatch?: 'grey' | 'blue' | 'red'; extra?: 'soldOut' | 'skipped' };
};

export const chapters: Chapter[] = [
  {
    id: 'ch-connect',
    name: 'Connect',
    title: 'Connect Shopify and GA4. Your whole catalog comes in.',
    alt: 'Catalog cards stream in from the store and fill the wall, some with missing titles.',
    key: { stat: 'total', label: 'SKUs connected' },
  },
  {
    id: 'ch-enrich',
    name: 'Enrich',
    title: 'Titles, sizes and colours, filled in for Meta, Google and ChatGPT.',
    alt: 'Missing titles and attributes on the catalog cards are filled in.',
    key: { stat: 'missing', label: 'titles and attributes filled in', swatch: 'red' },
  },
  {
    id: 'ch-design',
    name: 'Design',
    title: 'An ad and a video for every SKU, from the photos you have.',
    alt: 'The catalog cards turn into designed ads with sale, bestseller and new-in labels, many of them playing as videos.',
    key: { stat: 'total', label: 'SKUs with an ad and a video' },
  },
  {
    id: 'ch-measure',
    name: 'Measure',
    title: 'Profit per SKU, not per campaign.',
    alt: 'The whole catalog seen at once: products that spend without selling turn grey, sold-out sizes leave gaps.',
    key: { stat: 'wasters', label: 'SKUs spending without selling', swatch: 'grey', extra: 'soldOut' },
  },
  {
    id: 'ch-optimise',
    name: 'Optimise',
    title: 'Spend goes to the SKUs that sell. The rest get skipped.',
    alt: 'The catalog re-sorted by profit: the best products sit in a blue band at the top and get the spend.',
    key: { stat: 'winners', label: 'SKUs get the spend first', swatch: 'blue', extra: 'skipped' },
  },
];

// The Samo line reel: products cross the scan line and come out as finished ads.
export const reel = {
  title: 'Every SKU goes through the same line.',
};

// One SKU after each step, with the kinds of tools that stop at one or two of them.
export const wholeLine = {
  title: 'Other tools do a step. Samo runs the whole line.',
  sku: 'block-print-kurta',
  steps: ['Connect', 'Enrich', 'Design', 'Measure', 'Optimise'],
  spans: [
    { label: 'Feed tools', from: 1, to: 2 },
    { label: 'Creative tools', from: 3, to: 3 },
    { label: 'Reporting tools', from: 4, to: 4 },
  ],
  samo: 'Samo',
  numbers: { spend: '₹2,140', profit: '₹6,980' },
};

export const results = {
  title: 'What changed for a brand on Samo.',
  stats: [
    { value: '43%', label: 'better return on ad spend' },
    { value: '13%', label: 'higher click-through rate' },
    { value: '32%', label: 'better cost per purchase' },
  ],
  // The before and after of the live wall in this section.
  before: 'Before Samo',
  after: 'With Samo',
  alt: 'A catalog of product ads with spend, in blue, scattered across all of it, then the same catalog sorted by profit with the spend on the top rows.',
};

export const outcome = {
  statement: 'We run your catalog every week. On the performance plan, you only pay if ROAS goes up.',
  report: {
    title: 'SKU report',
    when: 'This week',
    groups: [
      { key: 'push', name: 'Push', count: 12, note: 'selling, with room to grow', skus: ['block-print-kurta', 'wrap-dress', 'kolhapuri-sandals'] },
      { key: 'fix', name: 'Fix', count: 8, note: 'with feed errors', skus: ['oxford-shirt', 'cable-knit', 'canvas-tote'] },
      { key: 'remove', name: 'Remove', count: 5, note: 'spending without orders', skus: ['sunglasses', 'leather-watch', 'khaki-chinos'] },
    ],
    // Where the report lands and where you can ask about it (logos in the card's footer).
    channels: ['slack', 'whatsapp', 'claude', 'chatgpt'],
  },
};

export const stack = {
  title: 'Works with the tools you already use.',
  sku: 'block-print-kurta',
  groups: [
    { name: 'Data in', tools: [{ name: 'Shopify', logo: 'shopify' }, { name: 'Google Analytics 4', logo: 'ga4' }] },
    { name: 'Ads out', tools: [{ name: 'Meta', logo: 'meta' }, { name: 'Google Merchant Center', logo: 'gmc' }, { name: 'ChatGPT', logo: 'chatgpt' }] },
    { name: 'Reports', tools: [{ name: 'Slack', logo: 'slack' }, { name: 'WhatsApp', logo: 'whatsapp' }, { name: 'Claude', logo: 'claude' }] },
  ],
} as const;

export const finale = {
  cta: 'Set up a call with the founder',
  alt: 'Get a free feed audit',
};

export const audit = {
  title: 'A free feed audit, back in 48 hours.',
  checksTitle: 'What we check',
  // From what Samo's privacy policy says it does with a store's data (heysamo.com/privacy).
  checks: [
    'Errors and missing data in your product feed',
    'Out-of-stock SKUs still in your ads',
    'SKUs that spend money but do not sell',
  ],
  form: {
    store: { label: 'Store URL' },
    size: {
      label: 'Catalog size (optional)',
      options: ['Under 1,000 SKUs', '1,000 to 5,000 SKUs', '5,000 to 10,000 SKUs', 'More than 10,000 SKUs'],
    },
    submit: 'Email us your store',
    sent: 'Your email app has opened with your store filled in. Press send and the audit report comes back within 48 hours. If it did not open, write to',
  },
};

export const notFound = {
  title: 'This page is sold out.',
  home: 'Back to the homepage',
};
