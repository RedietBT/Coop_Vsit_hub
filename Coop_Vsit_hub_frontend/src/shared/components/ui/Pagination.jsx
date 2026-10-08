import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export const Pagination = ({
  currentPage = 0,
  totalPages = 1,
  totalElements,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 25, 50],
  onPageChange,
  itemName = 'records',
  className = '',
}) => {
  const safeTotalPages = Math.max(1, totalPages || 1);
  const safeCurrentPage = Math.min(Math.max(0, currentPage), safeTotalPages - 1);

  // Generate a compact list of page numbers around safeCurrentPage
  const getPageNumbers = () => {
    if (safeTotalPages <= 5) {
      return Array.from({ length: safeTotalPages }, (_, i) => i);
    }
    const pages = [0];
    const start = Math.max(1, safeCurrentPage - 1);
    const end = Math.min(safeTotalPages - 2, safeCurrentPage + 1);

    if (start > 1) pages.push('ellipsis-start');
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (end < safeTotalPages - 2) pages.push('ellipsis-end');
    pages.push(safeTotalPages - 1);
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div
      className={`p-4 border-t border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 ${className}`}
    >
      <div className="flex items-center gap-3">
        <span>
          Showing page <span className="font-bold text-slate-900">{safeCurrentPage + 1}</span> of{' '}
          <span className="font-bold text-slate-900">{safeTotalPages}</span>
          {typeof totalElements === 'number' && (
            <span> ({totalElements} {itemName})</span>
          )}
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-slate-400 text-[11px]">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                if (onPageChange) onPageChange(0);
              }}
              className="py-1 px-2 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#00adef]"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {/* First page button for quick navigation when many pages exist */}
        {safeTotalPages > 4 && (
          <button
            type="button"
            onClick={() => onPageChange && onPageChange(0)}
            disabled={safeCurrentPage === 0}
            title="First Page"
            className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Previous page */}
        <button
          type="button"
          onClick={() => onPageChange && onPageChange(safeCurrentPage - 1)}
          disabled={safeCurrentPage === 0}
          title="Previous Page"
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Numbered Pills (if more than 1 page) */}
        {safeTotalPages > 1 && (
          <div className="hidden sm:flex items-center gap-1">
            {pageNumbers.map((p, idx) => {
              if (typeof p === 'string') {
                return (
                  <span key={`${p}-${idx}`} className="px-1 text-slate-400 font-bold">
                    …
                  </span>
                );
              }
              const isActive = p === safeCurrentPage;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPageChange && onPageChange(p)}
                  className={`w-7 h-7 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center ${
                    isActive
                      ? 'bg-[#00adef] text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {p + 1}
                </button>
              );
            })}
          </div>
        )}

        {/* Next page */}
        <button
          type="button"
          onClick={() => onPageChange && onPageChange(safeCurrentPage + 1)}
          disabled={safeCurrentPage >= safeTotalPages - 1}
          title="Next Page"
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last page button */}
        {safeTotalPages > 4 && (
          <button
            type="button"
            onClick={() => onPageChange && onPageChange(safeTotalPages - 1)}
            disabled={safeCurrentPage >= safeTotalPages - 1}
            title="Last Page"
            className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Pagination;
