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
    <div className="space-y-5">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-crm-orange">Companies</p>
          <h1 className="mt-2 text-2xl font-semibold text-crm-ink md:text-3xl">Company directory</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-crm-muted">
            Manage organizations, industries, and account contact details from one clean workspace.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-crm-line bg-white px-4 text-sm font-semibold text-crm-muted hover:bg-crm-surface hover:text-crm-ink"
            onClick={loadCompanies}
            type="button"
          >
            <RefreshCw size={17} />
            Refresh
          </button>
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-crm-orange px-4 text-sm font-semibold text-white hover:bg-crm-orangeDark"
            onClick={openAddModal}
            type="button"
          >
            <Plus size={17} />
            Add Company
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-crm-line bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-crm-line p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-orange-50 p-2 text-crm-orange">
              <Building2 size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-crm-ink">All companies</h2>
              <p className="text-sm text-crm-muted">
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
          <div className="p-8">
            <div className="space-y-3">
              {[1, 2, 3, 4].map((item) => (
                <div className="h-12 animate-pulse rounded-md bg-crm-surface" key={item} />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-sm font-semibold text-crm-ink">Could not load companies</p>
            <p className="mt-2 text-sm text-crm-muted">{error}</p>
            <button
              className="mt-4 rounded-md bg-crm-orange px-4 py-2 text-sm font-semibold text-white hover:bg-crm-orangeDark"
              onClick={loadCompanies}
              type="button"
            >
              Try again
            </button>
          </div>
        ) : table.filteredRows.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-orange-50 text-crm-orange">
              <Building2 size={22} />
            </div>
            <h3 className="mt-4 text-base font-semibold text-crm-ink">No companies found</h3>
            <p className="mt-2 text-sm text-crm-muted">
              {companies.length === 0 ? 'Add your first company to start organizing accounts.' : 'Adjust your search and try again.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1120px] w-full text-left">
              <thead className="bg-crm-surface text-xs uppercase tracking-wide text-crm-muted">
                <tr>
                  <SortableHeader columnKey="name" onSort={table.toggleSort} sortConfig={table.sortConfig}>Name</SortableHeader>
                  <SortableHeader columnKey="industry" onSort={table.toggleSort} sortConfig={table.sortConfig}>Industry</SortableHeader>
                  <SortableHeader columnKey="email" onSort={table.toggleSort} sortConfig={table.sortConfig}>Email</SortableHeader>
                  <SortableHeader columnKey="phone" onSort={table.toggleSort} sortConfig={table.sortConfig}>Phone</SortableHeader>
                  <SortableHeader columnKey="website" onSort={table.toggleSort} sortConfig={table.sortConfig}>Website</SortableHeader>
                  <SortableHeader columnKey="city" onSort={table.toggleSort} sortConfig={table.sortConfig}>City</SortableHeader>
                  <SortableHeader columnKey="country" onSort={table.toggleSort} sortConfig={table.sortConfig}>Country</SortableHeader>
                  <SortableHeader columnKey="created_at" onSort={table.toggleSort} sortConfig={table.sortConfig}>Created At</SortableHeader>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-crm-line text-sm">
                {table.rows.map((company) => (
                  <tr className="bg-white hover:bg-crm-surface/70" key={company.id}>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-crm-ink">{getCompanyName(company)}</p>
                      <p className="text-xs text-crm-muted">ID #{company.id}</p>
                    </td>
                    <td className="px-4 py-4 text-crm-muted">{company.industry || '-'}</td>
                    <td className="px-4 py-4 text-crm-muted">{company.email || '-'}</td>
                    <td className="px-4 py-4 text-crm-muted">{company.phone || '-'}</td>
                    <td className="px-4 py-4 text-crm-muted">
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
                    <td className="px-4 py-4 text-crm-muted">{company.city || '-'}</td>
                    <td className="px-4 py-4 text-crm-muted">{company.country || '-'}</td>
                    <td className="px-4 py-4 text-crm-muted">{formatDate(company.created_at)}</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          aria-label={`Edit ${getCompanyName(company)}`}
                          className="rounded-md border border-crm-line p-2 text-crm-muted hover:bg-white hover:text-crm-ink"
                          onClick={() => openEditModal(company)}
                          type="button"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          aria-label={`Delete ${getCompanyName(company)}`}
                          className="rounded-md border border-red-100 p-2 text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={isDeleting === company.id}
                          onClick={() => handleDelete(company)}
                          type="button"
                        >
                          <Trash2 size={16} />
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
