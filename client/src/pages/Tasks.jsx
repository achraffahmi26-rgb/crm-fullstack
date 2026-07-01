import { CheckSquare, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { createTask, deleteTask, getTasks, getUsers, updateTask } from '../api/taskApi';
import DataTableToolbar from '../components/common/DataTableToolbar';
import PaginationControls from '../components/common/PaginationControls';
import SortableHeader from '../components/common/SortableHeader';
import TaskFormModal from '../components/tasks/TaskFormModal';
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

function getUserName(user) {
  return `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.email || '';
}

function PriorityBadge({ priority }) {
  const colorMap = {
    Low: 'bg-slate-100 text-slate-600',
    Medium: 'bg-amber-50 text-amber-700',
    High: 'bg-red-50 text-red-700',
  };

  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${colorMap[priority] || 'bg-slate-100 text-slate-600'}`}>
      {priority || 'Unknown'}
    </span>
  );
}

function StatusBadge({ status }) {
  const colorMap = {
    Pending: 'bg-amber-50 text-amber-700',
    'In Progress': 'bg-sky-50 text-sky-700',
    Completed: 'bg-emerald-50 text-emerald-700',
  };

  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${colorMap[status] || 'bg-slate-100 text-slate-600'}`}>
      {status || 'Unknown'}
    </span>
  );
}

function Tasks() {
  const [editingTask, setEditingTask] = useState(null);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);

  async function loadTasks() {
    setError('');
    setIsLoading(true);

    try {
      const data = await getTasks();
      setTasks(data);
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Unable to load tasks';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadUsers() {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Unable to load task form options');
    }
  }

  useEffect(() => {
    loadTasks();
    loadUsers();
  }, []);

  const userById = useMemo(
    () => new Map(users.map((user) => [Number(user.id), user])),
    [users],
  );

  const getUserLabel = useCallback((userId) => {
    const user = userById.get(Number(userId));
    return getUserName(user) || (userId ? `User #${userId}` : '-');
  }, [userById]);

  const priorityOptions = useMemo(() => (
    [...new Set(tasks.map((task) => task.priority).filter(Boolean))]
      .sort()
      .map((priority) => ({ label: priority, value: priority }))
  ), [tasks]);

  const statusOptions = useMemo(() => (
    [...new Set(tasks.map((task) => task.status).filter(Boolean))]
      .sort()
      .map((status) => ({ label: status, value: status }))
  ), [tasks]);

  const userOptions = useMemo(() => (
    users.map((user) => ({ label: getUserLabel(user.id), value: String(user.id) }))
  ), [getUserLabel, users]);

  const table = useDataTable({
    data: tasks,
    filterDefinitions: [
      { key: 'priority', getValue: (task) => task.priority },
      { key: 'status', getValue: (task) => task.status },
      { key: 'user', getValue: (task) => task.assigned_to },
    ],
    initialSort: { key: 'created_at', direction: 'desc' },
    searchFields: (task) => [
      task.title,
      getUserLabel(task.assigned_to),
      task.priority,
      task.status,
      formatDate(task.due_date),
      formatDate(task.created_at),
    ],
    sortAccessors: {
      title: (task) => task.title,
      user: (task) => getUserLabel(task.assigned_to),
      priority: (task) => task.priority,
      status: (task) => task.status,
      due_date: (task) => task.due_date,
      created_at: (task) => task.created_at,
    },
  });

  function openAddModal() {
    setEditingTask(null);
    setIsModalOpen(true);
  }

  function openEditModal(task) {
    setEditingTask(task);
    setIsModalOpen(true);
  }

  function closeModal() {
    if (isSaving) {
      return;
    }

    setIsModalOpen(false);
    setEditingTask(null);
  }

  async function handleSave(payload) {
    setIsSaving(true);

    try {
      if (editingTask) {
        await updateTask(editingTask.id, payload);
        toast.success('Task updated');
      } else {
        await createTask(payload);
        toast.success('Task created');
      }

      setIsModalOpen(false);
      setEditingTask(null);
      await loadTasks();
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Unable to save task';
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

  async function handleDelete(task) {
    const confirmed = window.confirm(`Delete task "${task.title}"?`);

    if (!confirmed) {
      return;
    }

    setIsDeleting(task.id);

    try {
      await deleteTask(task.id);
      toast.success('Task deleted');
      await loadTasks();
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Unable to delete task');
    } finally {
      setIsDeleting(null);
    }
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-crm-orange">Tasks</p>
          <h1 className="mt-2 text-2xl font-semibold text-crm-ink md:text-3xl">Team tasks</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-crm-muted">
            Assign follow-ups, track work status, and keep customer operations moving.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-crm-line bg-white px-4 text-sm font-semibold text-crm-muted hover:bg-crm-surface hover:text-crm-ink"
            onClick={loadTasks}
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
            Add Task
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-crm-line bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-crm-line p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-orange-50 p-2 text-crm-orange">
              <CheckSquare size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-crm-ink">All tasks</h2>
              <p className="text-sm text-crm-muted">
                {table.filteredRows.length} of {tasks.length} records
              </p>
            </div>
          </div>

          <DataTableToolbar
            filterValues={table.filterValues}
            filters={[
              { key: 'priority', label: 'All priorities', options: priorityOptions },
              { key: 'status', label: 'All statuses', options: statusOptions },
              { key: 'user', label: 'All users', options: userOptions },
            ]}
            onClear={table.clearFilters}
            onFilterChange={table.setFilterValue}
            onSearchChange={table.setSearchTerm}
            searchPlaceholder="Search title, user, priority, status"
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
            <p className="text-sm font-semibold text-crm-ink">Could not load tasks</p>
            <p className="mt-2 text-sm text-crm-muted">{error}</p>
            <button
              className="mt-4 rounded-md bg-crm-orange px-4 py-2 text-sm font-semibold text-white hover:bg-crm-orangeDark"
              onClick={loadTasks}
              type="button"
            >
              Try again
            </button>
          </div>
        ) : table.filteredRows.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-orange-50 text-crm-orange">
              <CheckSquare size={22} />
            </div>
            <h3 className="mt-4 text-base font-semibold text-crm-ink">No tasks found</h3>
            <p className="mt-2 text-sm text-crm-muted">
              {tasks.length === 0 ? 'Add the first task to start tracking team follow-ups.' : 'Adjust your search and try again.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full text-left">
              <thead className="bg-crm-surface text-xs uppercase tracking-wide text-crm-muted">
                <tr>
                  <SortableHeader columnKey="title" onSort={table.toggleSort} sortConfig={table.sortConfig}>Title</SortableHeader>
                  <SortableHeader columnKey="user" onSort={table.toggleSort} sortConfig={table.sortConfig}>Assigned To</SortableHeader>
                  <SortableHeader columnKey="priority" onSort={table.toggleSort} sortConfig={table.sortConfig}>Priority</SortableHeader>
                  <SortableHeader columnKey="status" onSort={table.toggleSort} sortConfig={table.sortConfig}>Status</SortableHeader>
                  <SortableHeader columnKey="due_date" onSort={table.toggleSort} sortConfig={table.sortConfig}>Due Date</SortableHeader>
                  <SortableHeader columnKey="created_at" onSort={table.toggleSort} sortConfig={table.sortConfig}>Created At</SortableHeader>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-crm-line text-sm">
                {table.rows.map((task) => (
                  <tr className="bg-white hover:bg-crm-surface/70" key={task.id}>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-crm-ink">{task.title}</p>
                      <p className="line-clamp-1 text-xs text-crm-muted">{task.description || 'No description'}</p>
                    </td>
                    <td className="px-4 py-4 text-crm-muted">{getUserLabel(task.assigned_to)}</td>
                    <td className="px-4 py-4">
                      <PriorityBadge priority={task.priority} />
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="px-4 py-4 text-crm-muted">{formatDate(task.due_date)}</td>
                    <td className="px-4 py-4 text-crm-muted">{formatDate(task.created_at)}</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          aria-label={`Edit ${task.title}`}
                          className="rounded-md border border-crm-line p-2 text-crm-muted hover:bg-white hover:text-crm-ink"
                          onClick={() => openEditModal(task)}
                          type="button"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          aria-label={`Delete ${task.title}`}
                          className="rounded-md border border-red-100 p-2 text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={isDeleting === task.id}
                          onClick={() => handleDelete(task)}
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

      <TaskFormModal
        isOpen={isModalOpen}
        isSaving={isSaving}
        onClose={closeModal}
        onSubmit={handleSave}
        task={editingTask}
        users={users}
      />
    </div>
  );
}

export default Tasks;
