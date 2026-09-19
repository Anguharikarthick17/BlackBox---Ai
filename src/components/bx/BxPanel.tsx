import React from 'react';

interface BxPanelProps {
  title?: string;
  subtitle?: string;
  badge?: React.ReactNode;
  headerAction?: React.ReactNode;
  accentBorder?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const BxPanel: React.FC<BxPanelProps> = ({
  title,
  subtitle,
  badge,
  headerAction,
  accentBorder = false,
  className = '',
  children,
}) => {
  return (
    <div
      className={`bg-white border border-border rounded-lg shadow-card overflow-hidden ${
        accentBorder ? 'border-l-4 border-l-accent' : ''
      } ${className}`}
    >
      {(title || headerAction) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-ivory-50/50">
          <div>
            <div className="flex items-center gap-2.5">
              {title && (
                <h3 className="font-display text-lg font-bold uppercase tracking-tight text-graphite">
                  {title}
                </h3>
              )}
              {badge}
            </div>
            {subtitle && (
              <p className="text-xs text-graphite-400 font-sans mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}

      <div className="p-6">{children}</div>
    </div>
  );
};
