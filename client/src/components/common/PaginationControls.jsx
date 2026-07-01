import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PAGE_SIZE_OPTIONS } from '../../utils/tableUtils';

function getPageNumbers(page, totalPages) {
  const pages = new Set([1, totalPages]);

  for (let current = page - 1; current <= page + 1; current += 1) {
    if (current >= 1 && current <= totalPages) {
      pages.add(current);
    }
  }

  return [...pages].sort((left, right) => left - right);
}

function PaginationControls({
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  startIndex,
  totalPages,
  totalRows,
}) {
  const endIndex = totalRows === 0 ? 0 : Math.min(startIndex + pageSize, totalRows);
  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <div className="flex flex-col gap-3 border-t border-crm-line px-4 py-3 text-sm text-crm-muted lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <span>
          Showing {totalRows === 0 ? 0 : startIndex + 1}-{endIndex} of {totalRows}
        </span>
        <label className="flex items-center gap-2">
          <span>Rows</span>
          <select
            className="h-9 rounded-md border border-crm-line bg-white px-2 text-sm font-medium text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            value={pageSize}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          aria-label="Go to previous page"
          className="inline-flex h-9 items-center gap-1 rounded-md border border-crm-line bg-white px-3 font-semibold hover:-translate-y-0.5 hover:bg-crm-surface hover:text-crm-ink disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          type="button"
        >
          <ChevronLeft size={16} />
          Previous
        </button>

        {pageNumbers.map((pageNumber, index) => {
          const previousPage = pageNumbers[index - 1];
          const showGap = previousPage && pageNumber - previousPage > 1;

          return (
            <span className="flex items-center gap-2" key={pageNumber}>
              {showGap ? <span className="px-1">...</span> : null}
              <button
                aria-current={pageNumber === page ? 'page' : undefined}
                aria-label={`Go to page ${pageNumber}`}
                className={`h-9 min-w-9 rounded-md border px-3 font-semibold ${
                  pageNumber === page
                    ? 'border-crm-orange bg-crm-orange text-white'
                    : 'border-crm-line bg-white text-crm-muted hover:-translate-y-0.5 hover:bg-crm-surface hover:text-crm-ink'
                }`}
                onClick={() => onPageChange(pageNumber)}
                type="button"
              >
                {pageNumber}
              </button>
            </span>
          );
        })}

        <button
          aria-label="Go to next page"
          className="inline-flex h-9 items-center gap-1 rounded-md border border-crm-line bg-white px-3 font-semibold hover:-translate-y-0.5 hover:bg-crm-surface hover:text-crm-ink disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          type="button"
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export default PaginationControls;
