import React from 'react';
import { ExternalLink, Globe, Calendar, ShieldCheck } from 'lucide-react';
import type { WebSourceCitation } from '../../services/ai/types';

interface SourceListProps {
  sources: WebSourceCitation[];
}

export const SourceList: React.FC<SourceListProps> = ({ sources }) => {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-4 pt-3 border-t border-[#E5E0D8]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider text-[#6E6B65] font-semibold flex items-center gap-1.5 font-mono">
          <Globe className="w-3 h-3 text-[#B40023]" />
          Verified External Web Sources ({sources.length})
        </span>
        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono flex items-center gap-1">
          <ShieldCheck className="w-2.5 h-2.5" />
          Data-Isolated
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {sources.map((src, i) => (
          <a
            key={i}
            href={src.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block p-2.5 rounded border border-[#E5E0D8] bg-white hover:border-[#B40023] hover:shadow-sm transition-all text-left"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="inline-block text-[9px] font-mono uppercase tracking-wider text-[#8C887B] bg-[#F4F1EA] px-1.5 py-0.5 rounded mb-1">
                  {src.domain}
                </span>
                <p className="text-xs font-semibold text-[#1A1917] group-hover:text-[#B40023] line-clamp-1">
                  {src.title}
                </p>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-[#8C887B] group-hover:text-[#B40023] shrink-0 mt-0.5" />
            </div>

            {src.snippet && (
              <p className="text-[11px] text-[#6E6B65] mt-1.5 line-clamp-2 leading-relaxed">
                {src.snippet}
              </p>
            )}

            {src.publishedDate && (
              <div className="flex items-center gap-1 mt-1.5 text-[9px] font-mono text-[#8C887B]">
                <Calendar className="w-2.5 h-2.5" />
                <span>{src.publishedDate}</span>
              </div>
            )}
          </a>
        ))}
      </div>
    </div>
  );
};
