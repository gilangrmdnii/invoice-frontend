'use client';

import { useParams } from 'next/navigation';
import { useGetQCReportQuery } from '@/lib/api/qcReportApi';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import QCReportForm from '../../_components/QCReportForm';

export default function EditQCReportPage() {
  const params = useParams();
  const projectId = Number(params.id);
  const reportId = Number(params.reportId);
  const { data, isLoading, isError } = useGetQCReportQuery(reportId);

  if (isLoading) return <LoadingSpinner />;
  if (isError || !data?.data)
    return <EmptyState title="Laporan tidak ditemukan" description="" />;

  return <QCReportForm projectId={projectId} initial={data.data} />;
}
