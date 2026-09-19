import React from 'react';

interface BxSectionLabelProps {
  eyebrow?: string;
  title: string;
  description?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const BxSectionLabel: React.FC<BxSectionLabelProps> = ({
  eyebrow,
  title,
  description,
  badge,
  action,
  className = '',
}) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-4 mb-6 ${className}`}>
      <div>
        {eyebrow && (
          <div className="bx-eyebrow mb-1">
            {eyebrow}
          </div>
        )}
        <div className="flex items-center gap-3">
          <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-tight text-graphite">
            {title}
          </h2>
          {badge}
        </div>
        {description && (
          <p className="text-sm text-graphite-400 mt-1 max-w-2xl">
            {description}
          </p>
        )}
      </div>

      {action && (
        <div className="shrink-0 flex items-center gap-2">
          {action}
        </div>
      )}
    </div>
  );
};
