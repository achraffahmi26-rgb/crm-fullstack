import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';

function SortableHeader({ children, columnKey, onSort, sortConfig, align = 'left' }) {
  const isActive = sortConfig?.key === columnKey;
  const Icon = isActive ? (sortConfig.direction === 'asc' ? ArrowUp : ArrowDown) : ChevronsUpDown;

  return (
    <th className={`font-semibold ${align === 'right' ? 'text-right' : ''}`}>
      <button
        aria-label={`Sort by ${children}`}
        className={`inline-flex w-full items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-crm-muted hover:text-crm-ink ${
          align === 'right' ? 'justify-end' : 'justify-start'
        }`}
        onClick={() => onSort(columnKey)}
        type="button"
      >
        {children}
        <Icon size={12} />
      </button>
    </th>
  );
}

export default SortableHeader;
