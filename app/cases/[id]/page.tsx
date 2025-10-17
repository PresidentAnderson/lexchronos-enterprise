import CaseDetailPageClient from '@/components/cases/CaseDetailPageClient';

export function generateStaticParams() {
  return [{ id: 'demo-case' }];
}

interface CaseDetailPageProps {
  params: {
    id: string;
  };
}

export default function CaseDetailPage({ params }: CaseDetailPageProps) {
  return <CaseDetailPageClient caseId={params.id ?? 'demo-case'} />;
}
