'use client';

import { useParams } from 'next/navigation';
import QCReportForm from '../_components/QCReportForm';

export default function NewQCReportPage() {
  const params = useParams();
  const projectId = Number(params.id);
  return <QCReportForm projectId={projectId} />;
}
