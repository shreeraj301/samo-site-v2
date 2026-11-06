// The wall's picture files. The atlases carry their build's fingerprint (scripts/build_assets.py),
// so a browser or the offline kit holding an older atlas never pairs it with a newer layout.
import atlas from './atlas.json';

export const ATLAS = `/img/atlas.webp?v=${atlas.v}`;
export const ATLAS_HD = `/img/atlas-hd.webp?v=${atlas.v}`;
/** 256 px slots: phones swap it in once the opening has played (Wall.sharpen). */
export const ATLAS_MID = `/img/atlas-m.webp?v=${atlas.v}`;
export const HERO = '/img/hero-kurta.webp';
export const HERO_S = '/img/hero-kurta-s.webp';
