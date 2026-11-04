import type { Metadata } from 'next';
import { LegalPage } from '@/components/LegalPage';
import { legalBySlug } from '@/data/legal';

const doc = legalBySlug('terms')!;

export const metadata: Metadata = {
  title: doc.title,
  description: doc.description,
};

export default function Page() {
  return <LegalPage doc={doc} />;
}
