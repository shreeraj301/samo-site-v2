import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Motion } from '@/components/Motion';
import { Pitch } from '@/components/Pitch';
import { Offline } from '@/components/Offline';
import { Consent } from '@/components/Consent';
import { site } from '@/data/site';
import './globals.css';
import './graphics.css';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: '%s | Samo' },
  description: site.description,
  alternates: { canonical: './' },
  openGraph: { type: 'website', siteName: 'Samo', title: site.title, description: site.description, images: [{ url: '/og.jpg', width: 1200, height: 630 }] },
  twitter: { card: 'summary_large_image', title: site.title, description: site.description, images: ['/og.jpg'] },
  // Opened from a phone's home screen: full screen, with its own name (see manifest.ts).
  appleWebApp: { capable: true, title: site.name, statusBarStyle: 'default' },
};

export const viewport: Viewport = { themeColor: '#f6f6f3' };

// Runs before first paint: hidden-until-revealed styles only apply when JS and motion are on.
// Pitch mode (Pitch.tsx) is decided here too: ?pitch, then this tab's choice, then opened from the home screen.
const flags = `var h=document.documentElement;h.classList.add('js');if(!matchMedia('(prefers-reduced-motion: reduce)').matches)h.classList.add('motion');try{var q=new URLSearchParams(location.search).get('pitch'),s=sessionStorage.getItem('samo-pitch'),on=q!==null?q!=='0':s!==null?s==='1':matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;if(q!==null)sessionStorage.setItem('samo-pitch',on?'1':'0');if(on){h.setAttribute('data-pitch','');if(location.pathname==='/')h.classList.add('is-pitch')}}catch(e){}`;

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Samo',
  legalName: site.legal,
  url: site.url,
  email: site.email,
  logo: `${site.url}/img/samo-logo.webp`,
  description: site.description,
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={GeistSans.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: flags }} />
      </head>
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        <div id="curtain" aria-hidden="true">
          {Array.from({ length: 6 }, (_, i) => <div key={i} className="curtain__row" />)}
        </div>
        <Header />
        <main id="main" tabIndex={-1}>{children}</main>
        <Footer />
        <Pitch />
        <Offline />
        <Consent />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
        <Motion />
      </body>
    </html>
  );
}
