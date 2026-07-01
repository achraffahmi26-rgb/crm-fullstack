import { useEffect, useMemo, useState } from 'react';

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function normalizeValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).toLowerCase();
}

function compareValues(left, right) {
  const leftNumber = Number(left);
  const rightNumber = Number(right);
  const leftIsNumber = left !== null && left !== '' && !Number.isNaN(leftNumber);
  const rightIsNumber = right !== null && right !== '' && !Number.isNaN(rightNumber);

  if (leftIsNumber && rightIsNumber) {
    return leftNumber - rightNumber;
  }

  const leftDate = Date.parse(left);
  const rightDate = Date.parse(right);
  const leftIsDate = !Number.isNaN(leftDate);
  const rightIsDate = !Number.isNaN(rightDate);

  if (leftIsDate && rightIsDate) {
    return leftDate - rightDate;
  }

  return String(left ?? '').localeCompare(String(right ?? ''), undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

export function useDataTable({
  data,
  searchFields,
  filterDefinitions = [],
  sortAccessors,
  initialSort,
  initialPageSize = 10,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValues, setFilterValues] = useState(() => (
    Object.fromEntries(filterDefinitions.map((filter) => [filter.key, '']))
  ));
  const [sortConfig, setSortConfig] = useState(initialSort || null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterValues, pageSize]);

  const filteredRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return data.filter((row) => {
      const matchesSearch = !term || searchFields(row).some((value) => normalizeValue(value).includes(term));
      const matchesFilters = filterDefinitions.every((filter) => {
        const selectedValue = filterValues[filter.key];

        if (!selectedValue) {
          return true;
        }

        return String(filter.getValue(row) ?? '') === String(selectedValue);
      });

      return matchesSearch && matchesFilters;
    });
  }, [data, filterDefinitions, filterValues, searchFields, searchTerm]);

  const sortedRows = useMemo(() => {
    if (!sortConfig || !sortAccessors[sortConfig.key]) {
      return filteredRows;
    }

    const accessor = sortAccessors[sortConfig.key];
    const direction = sortConfig.direction === 'desc' ? -1 : 1;

    return [...filteredRows].sort((left, right) => compareValues(accessor(left), accessor(right)) * direction);
  }, [filteredRows, sortAccessors, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const rows = sortedRows.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    if (page !== safePage) {
      setPage(safePage);
    }
  }, [page, safePage]);

  function setFilterValue(key, value) {
    setFilterValues((current) => ({ ...current, [key]: value }));
  }

  function clearFilters() {
    setSearchTerm('');
    setFilterValues(Object.fromEntries(filterDefinitions.map((filter) => [filter.key, ''])));
  }

  function toggleSort(key) {
    setSortConfig((current) => {
      if (!current || current.key !== key) {
        return { key, direction: 'asc' };
      }

      if (current.direction === 'asc') {
        return { key, direction: 'desc' };
      }

      return null;
    });
  }

  return {
    clearFilters,
    filterValues,
    filteredRows,
    page: safePage,
    pageSize,
    rows,
    searchTerm,
    setFilterValue,
    setPage,
    setPageSize,
    setSearchTerm,
    sortConfig,
    sortedRows,
    startIndex,
    toggleSort,
    totalPages,
  };
}
