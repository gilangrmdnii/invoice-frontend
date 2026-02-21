'use client';

import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useGetProjectQuery } from '@/lib/api/projectApi';
import { useAppSelector } from '@/lib/hooks';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import OverviewTab from './_components/OverviewTab';
import InvoiceTab from './_components/InvoiceTab';
import ExpenseTab from './_components/ExpenseTab';
import BudgetRequestTab from './_components/BudgetRequestTab';
import clsx from 'clsx';
import { FolderKanban, FileText, Receipt, Wallet } from 'lucide-react';

const TABS = [
  { key: 'overview', label: 'Overview', icon: FolderKanban },
  { key: 'invoice', label: 'Invoice', icon: FileText },
  { key: 'expenses', label: 'Pengeluaran', icon: Receipt },
  { key: 'budget-requests', label: 'Budget Request', icon: Wallet },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function ProjectDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = Number(params.id);
  const user = useAppSelector((s) => s.auth.user);
  const { data, isLoading } = useGetProjectQuery(id);

  const tabParam = searchParams.get('tab') as TabKey | null;
  const activeTab: TabKey = TABS.some((t) => t.key === tabParam) ? tabParam! : 'overview';

  const project = data?.data;

  const setTab = (tab: TabKey) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'overview') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    const qs = params.toString();
    router.replace(`/projects/${id}${qs ? `?${qs}` : ''}`, { scroll: false });
  };

  // Filter tabs: hide invoice tab for non-FINANCE/OWNER roles
  const visibleTabs = TABS.filter((t) => {
    if (t.key === 'invoice' && user?.role !== 'FINANCE' && user?.role !== 'OWNER') {
      return false;
    }
    return true;
  });

  if (isLoading) return <LoadingSpinner />;
  if (!project) return <div className="text-center text-slate-500 py-20">Proyek tidak ditemukan</div>;

  return (
    <div className="space-y-6">
      {/* Project name header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-1 -mb-px overflow-x-auto">
          {visibleTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setTab(tab.key)}
              className={clsx(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap',
                activeTab === tab.key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              )}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab projectId={id} />}
      {activeTab === 'invoice' && <InvoiceTab projectId={id} />}
      {activeTab === 'expenses' && <ExpenseTab projectId={id} />}
      {activeTab === 'budget-requests' && <BudgetRequestTab projectId={id} />}
    </div>
  );
}
