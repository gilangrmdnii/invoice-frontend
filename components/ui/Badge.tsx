import { getStatusColor } from '@/lib/utils';
import clsx from 'clsx';

interface BadgeProps {
  status: string;
  className?: string;
}

export default function Badge({ status, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
        getStatusColor(status),
        className
      )}
    >
      {status}
    </span>
  );
}
