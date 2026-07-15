import { Building2, ExternalLink, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { createCompany, deleteCompany, getCompanies, updateCompany } from '../api/companyApi';
import DataTableToolbar from '../components/common/DataTableToolbar';
import PaginationControls from '../components/common/PaginationControls';
import SortableHeader from '../components/common/SortableHeader';
import CompanyFormModal from '../components/companies/CompanyFormModal';
import { useDataTable } from '../utils/tableUtils';

function formatDate(value) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function getCompanyName(company) {
  return company.name || 'Unnamed company';
}

function Companies() {
  const [companies, setCompanies] = useState([]);
  const [editingCompany, setEditingCompany] = useState(null);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function loadCompanies() {
    setError('');
    setIsLoading(true);

    try {
      const data = await getCompanies();
      setCompanies(data);
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Unable to load companies';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCompanies();
  }, []);

  const industryOptions = useMemo(() => (
    [...new Set(companies.map((company) => company.industry).filter(Boolean))]
      .sort()
      .map((industry) => ({ label: industry, value: industry }))
  ), [companies]);

  const countryOptions = useMemo(() => (
    [...new Set(companies.map((company) => company.country).filter(Boolean))]
      .sort()
      .map((country) => ({ label: country, value: country }))
  ), [companies]);

  const table = useDataTable({
    data: companies,
    filterDefinitions: [
      { key: 'industry', getValue: (company) => company.industry },
      { key: 'country', getValue: (company) => company.country },
    ],
    initialSort: { key: 'created_at', direction: 'desc' },
    searchFields: (company) => [
      company.name,
      company.industry,
      company.email,
      company.phone,
      company.website,
      company.city,
      company.country,
      formatDate(company.created_at),
    ],
    sortAccessors: {
      name: (company) => company.name,
      industry: (company) => company.industry,
      email: (company) => company.email,
      phone: (company) => company.phone,
      website: (company) => company.website,
      city: (company) => company.city,
      country: (company) => company.country,
      created_at: (company) => company.created_at,
    },
  });

  function openAddModal() {
    setEditingCompany(null);
    setIsModalOpen(true);
  }

  function openEditModal(company) {
    setEditingCompany(company);
    setIsModalOpen(true);
  }

  function closeModal() {
    if (isSaving) {
      return;
    }

    setIsModalOpen(false);
    setEditingCompany(null);
  }

  async function handleSave(payload) {
    setIsSaving(true);

    try {
      if (editingCompany) {
        await updateCompany(editingCompany.id, payload);
        toast.success('Company updated');
      } else {
        await createCompany(payload);
        toast.success('Company created');
      }

      setIsModalOpen(false);
      setEditingCompany(null);
      await loadCompanies();
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Unable to save company';
      const fieldErrors = requestError.response?.data?.errors;

      if (fieldErrors) {
        toast.error(Object.values(fieldErrors).join(', '));
      } else {
        toast.error(message);
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(company) {
    const confirmed = window.confirm(`Delete ${getCompanyName(company)}?`);

    if (!confirmed) {
      return;
    }

    setIsDeleting(company.id);

    try {
      await deleteCompany(company.id);
      toast.success('Company deleted');
      await loadCompanies();
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Unable to delete company');
    } finally {
      setIsDeleting(null);
    }
  }

  return (
    <div className="crm-page-stack">
      <section className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-crm-orange">Companies</p>
          <h1 className="mt-1 text-xl font-semibold text-crm-ink md:text-2xl">Company directory</h1>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-5 text-crm-muted">
            Manage organizations, industries, and account contact details from one clean workspace.
          </p>
        </div>

        <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:justify-end">
          <button
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-crm-line bg-white px-3 text-[13px] font-semibold text-crm-muted hover:bg-crm-surface hover:text-crm-ink"
            onClick={loadCompanies}
            type="button"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
          <button
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-crm-orange px-3 text-[13px] font-semibold text-white hover:bg-crm-orangeDark"
            onClick={openAddModal}
            type="button"
          >
            <Plus size={15} />
            Add Company
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-crm-line bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-crm-line px-3.5 py-2.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="rounded-md bg-orange-50 p-1.5 text-crm-orange">
              <Building2 size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-crm-ink">All companies</h2>
              <p className="text-[13px] text-crm-muted">
                {table.filteredRows.length} of {companies.length} records
              </p>
            </div>
          </div>

          <DataTableToolbar
            filterValues={table.filterValues}
            filters={[
              { key: 'industry', label: 'All industries', options: industryOptions },
              { key: 'country', label: 'All countries', options: countryOptions },
            ]}
            onClear={table.clearFilters}
            onFilterChange={table.setFilterValue}
            onSearchChange={table.setSearchTerm}
            searchPlaceholder="Search name, industry, email, phone, city, country"
            searchTerm={table.searchTerm}
          />
        </div>

        {isLoading ? (
          <div className="crm-table-loading">
            <div className="space-y-2.5">
              {[1, 2, 3, 4].map((item) => (
                <div className="crm-skeleton-row" key={item} />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="crm-table-error">
            <p className="text-sm font-semibold text-crm-ink">Could not load companies</p>
            <p className="mt-1.5 text-[13px] text-crm-muted">{error}</p>
            <button
              className="mt-3 rounded-md bg-crm-orange px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-crm-orangeDark"
              onClick={loadCompanies}
              type="button"
            >
              Try again
            </button>
          </div>
        ) : table.filteredRows.length === 0 ? (
          <div className="crm-table-empty">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-orange-50 text-crm-orange">
              <Building2 size={20} />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-crm-ink">No companies found</h3>
            <p className="mt-1.5 text-[13px] text-crm-muted">
              {companies.length === 0 ? 'Add your first company to start organizing accounts.' : 'Adjust your search and try again.'}
            </p>
          </div>
        ) : (
          <div className="crm-table-shell">
            <table className="crm-table min-w-[1120px] w-full text-left">
              <thead>
                <tr>
                  <SortableHeader columnKey="name" onSort={table.toggleSort} sortConfig={table.sortConfig}>Name</SortableHeader>
                  <SortableHeader columnKey="industry" onSort={table.toggleSort} sortConfig={table.sortConfig}>Industry</SortableHeader>
                  <SortableHeader columnKey="email" onSort={table.toggleSort} sortConfig={table.sortConfig}>Email</SortableHeader>
                  <SortableHeader columnKey="phone" onSort={table.toggleSort} sortConfig={table.sortConfig}>Phone</SortableHeader>
                  <SortableHeader columnKey="website" onSort={table.toggleSort} sortConfig={table.sortConfig}>Website</SortableHeader>
                  <SortableHeader columnKey="city" onSort={table.toggleSort} sortConfig={table.sortConfig}>City</SortableHeader>
                  <SortableHeader columnKey="country" onSort={table.toggleSort} sortConfig={table.sortConfig}>Country</SortableHeader>
                  <SortableHeader columnKey="created_at" onSort={table.toggleSort} sortConfig={table.sortConfig}>Created at</SortableHeader>
                  <th className="text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {table.rows.map((company) => (
                  <tr key={company.id}>
                    <td>
                      <p className="font-semibold text-crm-ink">{getCompanyName(company)}</p>
                      <p className="text-xs text-crm-muted">ID #{company.id}</p>
                    </td>
                    <td className="text-crm-muted">{company.industry || '-'}</td>
                    <td className="text-crm-muted">{company.email || '-'}</td>
                    <td className="text-crm-muted">{company.phone || '-'}</td>
                    <td className="text-crm-muted">
                      {company.website ? (
                        <a
                          className="inline-flex items-center gap-1 text-crm-orange hover:underline"
                          href={company.website}
                          rel="noreferrer"
                          target="_blank"
                        >
                          Visit
                          <ExternalLink size={14} />
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="text-crm-muted">{company.city || '-'}</td>
                    <td className="text-crm-muted">{company.country || '-'}</td>
                    <td className="text-crm-muted">{formatDate(company.created_at)}</td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <button
                          aria-label={`Edit ${getCompanyName(company)}`}
                          className="rounded-md border border-crm-line p-1 text-crm-muted hover:bg-white hover:text-crm-ink"
                          onClick={() => openEditModal(company)}
                          type="button"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          aria-label={`Delete ${getCompanyName(company)}`}
                          className="rounded-md border border-red-100 p-1 text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={isDeleting === company.id}
                          onClick={() => handleDelete(company)}
                          type="button"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && !error && table.filteredRows.length > 0 ? (
          <PaginationControls
            onPageChange={table.setPage}
            onPageSizeChange={table.setPageSize}
            page={table.page}
            pageSize={table.pageSize}
            startIndex={table.startIndex}
            totalPages={table.totalPages}
            totalRows={table.filteredRows.length}
          />
        ) : null}
      </section>

      <CompanyFormModal
        company={editingCompany}
        isOpen={isModalOpen}
        isSaving={isSaving}
        onClose={closeModal}
        onSubmit={handleSave}
      />
    </div>
  );
}

export default Companies;
