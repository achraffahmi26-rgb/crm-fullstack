import { Pencil, Plus, RefreshCw, Target, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { createLead, deleteLead, getLeadFormOptions, getLeads, updateLead } from '../api/leadApi';
import DataTableToolbar from '../components/common/DataTableToolbar';
import PaginationControls from '../components/common/PaginationControls';
import SortableHeader from '../components/common/SortableHeader';
import LeadFormModal from '../components/leads/LeadFormModal';
import { useAuth } from '../hooks/useAuth';
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

function formatMoney(value) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  return `${new Intl.NumberFormat('en-US').format(Number(value))} MAD`;
}

function getLeadName(lead) {
  return `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unnamed lead';
}

function userIsAdmin(user) {
  return user?.role_name === 'Admin' || Number(user?.role_id) === 1;
}

function StatusBadge({ status }) {
  const colorMap = {
    New: 'bg-sky-50 text-sky-700',
    Contacted: 'bg-indigo-50 text-indigo-700',
    Qualified: 'bg-emerald-50 text-emerald-700',
    Proposal: 'bg-amber-50 text-amber-700',
    Won: 'bg-green-50 text-green-700',
    Lost: 'bg-red-50 text-red-700',
  };

  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${colorMap[status] || 'bg-slate-100 text-slate-600'}`}>
      {status || 'Unknown'}
    </span>
  );
}

function Leads() {
  const { user } = useAuth();
  const canAssignUsers = userIsAdmin(user);
  const [companies, setCompanies] = useState([]);
  const [editingLead, setEditingLead] = useState(null);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);

  async function loadLeads() {
    setError('');
    setIsLoading(true);

    try {
      const data = await getLeads();
      setLeads(data);
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Unable to load leads';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadFormOptions() {
    try {
      const data = await getLeadFormOptions();
      setCompanies(data.companies);
      setUsers(data.users);
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Unable to load form options');
    }
  }

  useEffect(() => {
    loadLeads();
    loadFormOptions();
  }, []);

  const companyById = useMemo(
    () => new Map(companies.map((company) => [Number(company.id), company])),
    [companies],
  );

  const userById = useMemo(
    () => new Map(users.map((user) => [Number(user.id), user])),
    [users],
  );

  const getCompanyLabel = useCallback((companyId) => {
    const company = companyById.get(Number(companyId));
    return company?.name || (companyId ? `Company #${companyId}` : '-');
  }, [companyById]);

  const getUserLabel = useCallback((userId) => {
    const user = userById.get(Number(userId));
    const name = `${user?.first_name || ''} ${user?.last_name || ''}`.trim();
    return name || user?.email || (userId ? `User #${userId}` : '-');
  }, [userById]);

  const statusOptions = useMemo(() => (
    [...new Set(leads.map((lead) => lead.status).filter(Boolean))]
      .sort()
      .map((status) => ({ label: status, value: status }))
  ), [leads]);

  const companyOptions = useMemo(() => (
    companies.map((company) => ({ label: company.name, value: String(company.id) }))
  ), [companies]);

  const userOptions = useMemo(() => (
    users.map((user) => ({ label: getUserLabel(user.id), value: String(user.id) }))
  ), [getUserLabel, users]);

  const toolbarFilters = useMemo(() => {
    const filters = [
      { key: 'status', label: 'All statuses', options: statusOptions },
      { key: 'company', label: 'All companies', options: companyOptions },
    ];

    if (canAssignUsers) {
      filters.push({ key: 'user', label: 'All users', options: userOptions });
    }

    return filters;
  }, [canAssignUsers, companyOptions, statusOptions, userOptions]);

  const table = useDataTable({
    data: leads,
    filterDefinitions: [
      { key: 'status', getValue: (lead) => lead.status },
      { key: 'company', getValue: (lead) => lead.company_id },
      { key: 'user', getValue: (lead) => lead.assigned_to },
    ],
    initialSort: { key: 'created_at', direction: 'desc' },
    searchFields: (lead) => [
      getLeadName(lead),
      lead.email,
      lead.phone,
      getCompanyLabel(lead.company_id),
      getUserLabel(lead.assigned_to),
      lead.source,
      lead.status,
      lead.estimated_value,
      formatMoney(lead.estimated_value),
      formatDate(lead.created_at),
    ],
    sortAccessors: {
      name: getLeadName,
      email: (lead) => lead.email,
      phone: (lead) => lead.phone,
      company: (lead) => getCompanyLabel(lead.company_id),
      user: (lead) => getUserLabel(lead.assigned_to),
      source: (lead) => lead.source,
      status: (lead) => lead.status,
      estimated_value: (lead) => lead.estimated_value,
      created_at: (lead) => lead.created_at,
    },
  });

  function openAddModal() {
    setEditingLead(null);
    setIsModalOpen(true);
  }

  function openEditModal(lead) {
    setEditingLead(lead);
    setIsModalOpen(true);
  }

  function closeModal() {
    if (isSaving) {
      return;
    }

    setIsModalOpen(false);
    setEditingLead(null);
  }

  async function handleSave(payload) {
    setIsSaving(true);

    try {
      if (editingLead) {
        await updateLead(editingLead.id, payload);
        toast.success('Lead updated');
      } else {
        await createLead(payload);
        toast.success('Lead created');
      }

      setIsModalOpen(false);
      setEditingLead(null);
      await loadLeads();
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Unable to save lead';
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

  async function handleDelete(lead) {
    const confirmed = window.confirm(`Delete ${getLeadName(lead)}?`);

    if (!confirmed) {
      return;
    }

    setIsDeleting(lead.id);

    try {
      await deleteLead(lead.id);
      toast.success('Lead deleted');
      await loadLeads();
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Unable to delete lead');
    } finally {
      setIsDeleting(null);
    }
  }

  return (
    <div className="crm-page-stack">
      <section className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-crm-orange">Leads</p>
          <h1 className="mt-1 text-xl font-semibold text-crm-ink md:text-2xl">Lead pipeline</h1>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-5 text-crm-muted">
            Track prospects from first touch through qualified opportunities and won deals.
          </p>
        </div>

        <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:justify-end">
          <button
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-crm-line bg-white px-3 text-[13px] font-semibold text-crm-muted hover:bg-crm-surface hover:text-crm-ink"
            onClick={loadLeads}
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
            Add Lead
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-crm-line bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-crm-line px-3.5 py-2.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="rounded-md bg-orange-50 p-1.5 text-crm-orange">
              <Target size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-crm-ink">All leads</h2>
              <p className="text-[13px] text-crm-muted">
                {table.filteredRows.length} of {leads.length} records
              </p>
            </div>
          </div>

          <DataTableToolbar
            filterValues={table.filterValues}
            filters={toolbarFilters}
            onClear={table.clearFilters}
            onFilterChange={table.setFilterValue}
            onSearchChange={table.setSearchTerm}
            searchPlaceholder="Search name, email, phone, source, status"
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
            <p className="text-sm font-semibold text-crm-ink">Could not load leads</p>
            <p className="mt-1.5 text-[13px] text-crm-muted">{error}</p>
            <button
              className="mt-3 rounded-md bg-crm-orange px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-crm-orangeDark"
              onClick={loadLeads}
              type="button"
            >
              Try again
            </button>
          </div>
        ) : table.filteredRows.length === 0 ? (
          <div className="crm-table-empty">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-orange-50 text-crm-orange">
              <Target size={20} />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-crm-ink">No leads found</h3>
            <p className="mt-1.5 text-[13px] text-crm-muted">
              {leads.length === 0 ? 'Add your first lead to start building the pipeline.' : 'Adjust your search and try again.'}
            </p>
          </div>
        ) : (
          <div className="crm-table-shell">
            <table className="crm-table min-w-[1280px] w-full text-left">
              <thead>
                <tr>
                  <SortableHeader columnKey="name" onSort={table.toggleSort} sortConfig={table.sortConfig}>Name</SortableHeader>
                  <SortableHeader columnKey="email" onSort={table.toggleSort} sortConfig={table.sortConfig}>Email</SortableHeader>
                  <SortableHeader columnKey="phone" onSort={table.toggleSort} sortConfig={table.sortConfig}>Phone</SortableHeader>
                  <SortableHeader columnKey="company" onSort={table.toggleSort} sortConfig={table.sortConfig}>Company</SortableHeader>
                  <SortableHeader columnKey="user" onSort={table.toggleSort} sortConfig={table.sortConfig}>Assigned To</SortableHeader>
                  <SortableHeader columnKey="source" onSort={table.toggleSort} sortConfig={table.sortConfig}>Source</SortableHeader>
                  <SortableHeader columnKey="status" onSort={table.toggleSort} sortConfig={table.sortConfig}>Status</SortableHeader>
                  <SortableHeader columnKey="estimated_value" onSort={table.toggleSort} sortConfig={table.sortConfig}>Estimated Value</SortableHeader>
                  <SortableHeader columnKey="created_at" onSort={table.toggleSort} sortConfig={table.sortConfig}>Created at</SortableHeader>
                  <th className="text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {table.rows.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <p className="font-semibold text-crm-ink">{getLeadName(lead)}</p>
                      <p className="text-xs text-crm-muted">ID #{lead.id}</p>
                    </td>
                    <td className="text-crm-muted">{lead.email || '-'}</td>
                    <td className="text-crm-muted">{lead.phone || '-'}</td>
                    <td className="text-crm-muted">{getCompanyLabel(lead.company_id)}</td>
                    <td className="text-crm-muted">{getUserLabel(lead.assigned_to)}</td>
                    <td className="text-crm-muted">{lead.source || '-'}</td>
                    <td>
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="text-crm-muted">{formatMoney(lead.estimated_value)}</td>
                    <td className="text-crm-muted">{formatDate(lead.created_at)}</td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <button
                          aria-label={`Edit ${getLeadName(lead)}`}
                          className="rounded-md border border-crm-line p-1 text-crm-muted hover:bg-white hover:text-crm-ink"
                          onClick={() => openEditModal(lead)}
                          type="button"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          aria-label={`Delete ${getLeadName(lead)}`}
                          className="rounded-md border border-red-100 p-1 text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={isDeleting === lead.id}
                          onClick={() => handleDelete(lead)}
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

      <LeadFormModal
        canAssignUsers={canAssignUsers}
        companies={companies}
        isOpen={isModalOpen}
        isSaving={isSaving}
        lead={editingLead}
        onClose={closeModal}
        onSubmit={handleSave}
        users={users}
      />
    </div>
  );
}

export default Leads;
