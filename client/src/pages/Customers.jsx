import { Pencil, Plus, RefreshCw, Trash2, Users } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { createCustomer, deleteCustomer, getCustomerFormOptions, getCustomers, updateCustomer } from '../api/customerApi';
import DataTableToolbar from '../components/common/DataTableToolbar';
import PaginationControls from '../components/common/PaginationControls';
import SortableHeader from '../components/common/SortableHeader';
import CustomerFormModal from '../components/customers/CustomerFormModal';
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

function getCustomerName(customer) {
  return `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unnamed customer';
}

function StatusBadge({ status }) {
  const normalizedStatus = status || 'Unknown';
  const colorMap = {
    Active: 'bg-emerald-50 text-emerald-700',
    Inactive: 'bg-slate-100 text-slate-600',
    Blocked: 'bg-red-50 text-red-700',
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${colorMap[normalizedStatus] || 'bg-slate-100 text-slate-600'}`}
    >
      {normalizedStatus}
    </span>
  );
}

function Customers() {
  const [companies, setCompanies] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [users, setUsers] = useState([]);

  async function loadCustomers() {
    setError('');
    setIsLoading(true);

    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Unable to load customers';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadFormOptions() {
    try {
      const data = await getCustomerFormOptions();
      setCompanies(data.companies);
      setUsers(data.users);
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Unable to load form options');
    }
  }

  useEffect(() => {
    loadCustomers();
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
    [...new Set(customers.map((customer) => customer.status).filter(Boolean))]
      .sort()
      .map((status) => ({ label: status, value: status }))
  ), [customers]);

  const companyOptions = useMemo(() => (
    companies.map((company) => ({ label: company.name, value: String(company.id) }))
  ), [companies]);

  const userOptions = useMemo(() => (
    users.map((user) => ({ label: getUserLabel(user.id), value: String(user.id) }))
  ), [getUserLabel, users]);

  const table = useDataTable({
    data: customers,
    filterDefinitions: [
      { key: 'status', getValue: (customer) => customer.status },
      { key: 'company', getValue: (customer) => customer.company_id },
      { key: 'user', getValue: (customer) => customer.assigned_to },
    ],
    initialSort: { key: 'created_at', direction: 'desc' },
    searchFields: (customer) => [
      getCustomerName(customer),
      customer.email,
      customer.phone,
      customer.status,
      getCompanyLabel(customer.company_id),
      getUserLabel(customer.assigned_to),
      formatDate(customer.created_at),
    ],
    sortAccessors: {
      name: getCustomerName,
      email: (customer) => customer.email,
      phone: (customer) => customer.phone,
      status: (customer) => customer.status,
      company: (customer) => getCompanyLabel(customer.company_id),
      user: (customer) => getUserLabel(customer.assigned_to),
      created_at: (customer) => customer.created_at,
    },
  });

  async function handleDelete(customer) {
    const confirmed = window.confirm(`Delete ${getCustomerName(customer)}?`);

    if (!confirmed) {
      return;
    }

    setIsDeleting(customer.id);

    try {
      await deleteCustomer(customer.id);
      toast.success('Customer deleted');
      await loadCustomers();
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Unable to delete customer');
    } finally {
      setIsDeleting(null);
    }
  }

  function openAddModal() {
    setEditingCustomer(null);
    setIsModalOpen(true);
  }

  function openEditModal(customer) {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  }

  function closeModal() {
    if (isSaving) {
      return;
    }

    setIsModalOpen(false);
    setEditingCustomer(null);
  }

  async function handleSave(payload) {
    setIsSaving(true);

    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, payload);
        toast.success('Customer updated');
      } else {
        await createCustomer(payload);
        toast.success('Customer created');
      }

      setIsModalOpen(false);
      setEditingCustomer(null);
      await loadCustomers();
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Unable to save customer';
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

  return (
    <div className="space-y-5">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-crm-orange">Customers</p>
          <h1 className="mt-2 text-2xl font-semibold text-crm-ink md:text-3xl">Customer directory</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-crm-muted">
            Browse customer records, check account ownership, and keep the customer list fresh.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-crm-line bg-white px-4 text-sm font-semibold text-crm-muted hover:bg-crm-surface hover:text-crm-ink"
            onClick={loadCustomers}
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
            Add Customer
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-crm-line bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-crm-line p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-orange-50 p-2 text-crm-orange">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-crm-ink">All customers</h2>
              <p className="text-sm text-crm-muted">
                {table.filteredRows.length} of {customers.length} records
              </p>
            </div>
          </div>

          <DataTableToolbar
            filterValues={table.filterValues}
            filters={[
              { key: 'status', label: 'All statuses', options: statusOptions },
              { key: 'company', label: 'All companies', options: companyOptions },
              { key: 'user', label: 'All users', options: userOptions },
            ]}
            onClear={table.clearFilters}
            onFilterChange={table.setFilterValue}
            onSearchChange={table.setSearchTerm}
            searchPlaceholder="Search name, email, phone, status"
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
            <p className="text-sm font-semibold text-crm-ink">Could not load customers</p>
            <p className="mt-2 text-sm text-crm-muted">{error}</p>
            <button
              className="mt-4 rounded-md bg-crm-orange px-4 py-2 text-sm font-semibold text-white hover:bg-crm-orangeDark"
              onClick={loadCustomers}
              type="button"
            >
              Try again
            </button>
          </div>
        ) : table.filteredRows.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-orange-50 text-crm-orange">
              <Users size={22} />
            </div>
            <h3 className="mt-4 text-base font-semibold text-crm-ink">No customers found</h3>
            <p className="mt-2 text-sm text-crm-muted">
              {customers.length === 0 ? 'Add your first customer to start building your CRM.' : 'Adjust your search and try again.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full text-left">
              <thead className="bg-crm-surface text-xs uppercase tracking-wide text-crm-muted">
                <tr>
                  <SortableHeader columnKey="name" onSort={table.toggleSort} sortConfig={table.sortConfig}>Name</SortableHeader>
                  <SortableHeader columnKey="email" onSort={table.toggleSort} sortConfig={table.sortConfig}>Email</SortableHeader>
                  <SortableHeader columnKey="phone" onSort={table.toggleSort} sortConfig={table.sortConfig}>Phone</SortableHeader>
                  <SortableHeader columnKey="status" onSort={table.toggleSort} sortConfig={table.sortConfig}>Status</SortableHeader>
                  <SortableHeader columnKey="company" onSort={table.toggleSort} sortConfig={table.sortConfig}>Company</SortableHeader>
                  <SortableHeader columnKey="user" onSort={table.toggleSort} sortConfig={table.sortConfig}>Assigned To</SortableHeader>
                  <SortableHeader columnKey="created_at" onSort={table.toggleSort} sortConfig={table.sortConfig}>Created At</SortableHeader>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-crm-line text-sm">
                {table.rows.map((customer) => (
                  <tr className="bg-white hover:bg-crm-surface/70" key={customer.id}>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-crm-ink">{getCustomerName(customer)}</p>
                      <p className="text-xs text-crm-muted">ID #{customer.id}</p>
                    </td>
                    <td className="px-4 py-4 text-crm-muted">{customer.email || '-'}</td>
                    <td className="px-4 py-4 text-crm-muted">{customer.phone || '-'}</td>
                    <td className="px-4 py-4">
                      <StatusBadge status={customer.status} />
                    </td>
                    <td className="px-4 py-4 text-crm-muted">{getCompanyLabel(customer.company_id)}</td>
                    <td className="px-4 py-4 text-crm-muted">{getUserLabel(customer.assigned_to)}</td>
                    <td className="px-4 py-4 text-crm-muted">{formatDate(customer.created_at)}</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          aria-label={`Edit ${getCustomerName(customer)}`}
                          className="rounded-md border border-crm-line p-2 text-crm-muted hover:bg-white hover:text-crm-ink"
                          onClick={() => openEditModal(customer)}
                          type="button"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          aria-label={`Delete ${getCustomerName(customer)}`}
                          className="rounded-md border border-red-100 p-2 text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={isDeleting === customer.id}
                          onClick={() => handleDelete(customer)}
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

      <CustomerFormModal
        companies={companies}
        customer={editingCustomer}
        isOpen={isModalOpen}
        isSaving={isSaving}
        onClose={closeModal}
        onSubmit={handleSave}
        users={users}
      />
    </div>
  );
}

export default Customers;
