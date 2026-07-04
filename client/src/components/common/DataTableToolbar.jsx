import { Search, X } from 'lucide-react';

function DataTableToolbar({
  filters = [],
  filterValues,
  onClear,
  onFilterChange,
  onSearchChange,
  searchPlaceholder,
  searchTerm,
}) {
  const hasActiveControls = Boolean(searchTerm) || filters.some((filter) => filterValues[filter.key]);

  return (
    <div className="flex w-full flex-col gap-1.5 lg:w-auto lg:flex-row lg:flex-wrap lg:items-center lg:justify-end">
      <label className="flex h-9 w-full items-center gap-2 rounded-md border border-crm-line bg-crm-surface px-2.5 text-[13px] text-crm-muted focus-within:border-crm-orange focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-100 lg:w-64 xl:w-72">
        <Search size={15} />
        <input
          aria-label={searchPlaceholder || 'Search records'}
          className="w-full border-0 bg-transparent text-[13px] text-crm-ink outline-none placeholder:text-slate-400"
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          type="search"
          value={searchTerm}
        />
      </label>

      {filters.map((filter) => (
        <select
          aria-label={filter.label}
          className="h-9 rounded-md border border-crm-line bg-white px-2.5 text-[13px] font-medium text-crm-muted outline-none hover:bg-crm-surface focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
          key={filter.key}
          onChange={(event) => onFilterChange(filter.key, event.target.value)}
          value={filterValues[filter.key] || ''}
        >
          <option value="">{filter.label}</option>
          {filter.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ))}

      {hasActiveControls ? (
        <button
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-crm-line bg-white px-2.5 text-[13px] font-semibold text-crm-muted hover:bg-crm-surface hover:text-crm-ink"
          onClick={onClear}
          type="button"
        >
          <X size={14} />
          Clear
        </button>
      ) : null}
    </div>
  );
}

export default DataTableToolbar;
