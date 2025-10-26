import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface PageHeaderProps {
  icon?: LucideIcon | string;
  title: string;
  subtitle?: string;
  badge?: string | number;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  icon: Icon,
  title,
  subtitle,
  badge,
  actions,
  className = '',
}: PageHeaderProps) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 ${className}`}>
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          {Icon && (
            typeof Icon === 'string' ? (
              <span className="text-2xl" aria-hidden="true">{Icon}</span>
            ) : (
              <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                <Icon className="h-5 w-5 text-white" />
              </div>
            )
          )}
          <div className="flex items-baseline gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {title}
            </h1>
            {badge !== undefined && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {badge}
              </span>
            )}
          </div>
        </div>
        {subtitle && (
          <p className="text-sm sm:text-base text-gray-600 max-w-3xl">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}

