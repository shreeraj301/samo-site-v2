import { Line } from '@/components/Line';
import { Reel } from '@/components/Reel';
import { Results } from '@/components/Results';
import { WholeLine } from '@/components/WholeLine';
import { WeeklyReport } from '@/components/WeeklyReport';
import { StackFlow } from '@/components/StackFlow';
import { outcome } from '@/data/site';
import { preload } from 'react-dom';
import { ATLAS, ATLAS_HD, HERO } from '@/wall/files';

export default function Home() {
  // The opening waits for the wall's pictures: start fetching them with the page instead of after
  // the scripts have run. Phones use the small atlas and the opening card's own photo; wider
  // screens the sharp atlas and hero photo (Line.tsx, wall.ts). Nobody who asks for reduced motion
  // fetches any of them.
  const motion = '(prefers-reduced-motion: no-preference)';
  const wide = `${motion} and (min-width: 768px)`;
  preload(ATLAS, { as: 'image', media: `${motion} and (max-width: 767px)` });
  preload(ATLAS_HD, { as: 'image', media: wide });
  preload(HERO, { as: 'image', media: wide });
  return (
    <>
      <Line />
      <Reel />
      <Results />
      <WholeLine />
      <StackFlow />
      {/* The close: the weekly report lands (on a phone, on wide screens), then the call to action. */}
      <section className="outcome wrap" aria-labelledby="outcome-title">
        <h2 id="outcome-title" className="outcome__statement" data-split="lines" data-beat>{outcome.statement}</h2>
        <div className="outcome__phone" data-inview>
          <div className="outcome__screen">
            <WeeklyReport />
          </div>
        </div>
      </section>
    </>
  );
}
