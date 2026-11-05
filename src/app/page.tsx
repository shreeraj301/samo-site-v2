import { Line } from '@/components/Line';
import { Reel } from '@/components/Reel';
import { Results } from '@/components/Results';
import { WholeLine } from '@/components/WholeLine';
import { WeeklyReport } from '@/components/WeeklyReport';
import { StackFlow } from '@/components/StackFlow';
import { outcome } from '@/data/site';
import { preload } from 'react-dom';

export default function Home() {
  // The opening waits for the wall's pictures: start fetching them with the page instead of after
  // the scripts have run. Phones use the small atlas and the opening card's own photo; wider
  // screens the sharp atlas and hero photo (Line.tsx, wall.ts). Nobody who asks for reduced motion
  // fetches any of them.
  const motion = '(prefers-reduced-motion: no-preference)';
  const wide = `${motion} and (min-width: 768px)`;
  preload('/img/atlas.webp', { as: 'image', media: `${motion} and (max-width: 767px)` });
  preload('/img/atlas-hd.webp', { as: 'image', media: wide });
  preload('/img/hero-kurta.webp', { as: 'image', media: wide });
  return (
    <>
      <Line />
      <Reel />
      <Results />
      <WholeLine />
      <section className="outcome wrap" aria-labelledby="outcome-title">
        <h2 id="outcome-title" className="outcome__statement" data-split="lines" data-beat>{outcome.statement}</h2>
        <WeeklyReport />
      </section>
      <StackFlow />
    </>
  );
}
