import { Line } from '@/components/Line';
import { Reel } from '@/components/Reel';
import { Results } from '@/components/Results';
import { WholeLine } from '@/components/WholeLine';
import { WeeklyReport } from '@/components/WeeklyReport';
import { StackFlow } from '@/components/StackFlow';
import { outcome } from '@/data/site';

export default function Home() {
  return (
    <>
      <Line />
      <Reel />
      <Results />
      <WholeLine />
      <section className="outcome wrap" aria-labelledby="outcome-title">
        <h2 id="outcome-title" className="outcome__statement" data-split="lines">{outcome.statement}</h2>
        <WeeklyReport />
      </section>
      <StackFlow />
    </>
  );
}
