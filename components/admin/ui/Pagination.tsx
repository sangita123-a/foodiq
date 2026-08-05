import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export default function Pagination({ page, totalPages, total, limit, onPageChange, className = "" }: PaginationProps) {
  if (total <= 0) return null;

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-t border-border ${className}`}>
      <p className="text-xs text-gray-text">
        Showing <span className="font-bold text-foreground">{(page - 1) * limit + 1}</span>–
        <span className="font-bold text-foreground">{Math.min(page * limit, total)}</span> of{" "}
        <span className="font-bold text-foreground">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-border hover:bg-section disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs font-bold text-foreground px-1">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-border hover:bg-section disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
