import { X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const PRIORITY_OPTIONS = ['Low', 'Medium', 'High'];
const STATUS_OPTIONS = ['Pending', 'In Progress', 'Completed'];

const emptyForm = {
  assigned_to: '',
  title: '',
  description: '',
  priority: 'Medium',
  status: 'Pending',
  due_date: '',
};

function toDateInputValue(value) {
  if (!value) {
    return '';
  }

  return String(value).slice(0, 10);
}

function userLabel(user) {
  const name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  return name ? `${name}${user.email ? ` (${user.email})` : ''}` : user.email || `User #${user.id}`;
}

function validateForm(form, users) {
  const errors = {};
  const userIds = new Set(users.map((user) => String(user.id)));

  if (!form.title.trim()) {
    errors.title = 'Title is required';
  }

  if (!PRIORITY_OPTIONS.includes(form.priority)) {
    errors.priority = 'Choose a valid priority';
  }

  if (!STATUS_OPTIONS.includes(form.status)) {
    errors.status = 'Choose a valid status';
  }

  if (form.assigned_to && !userIds.has(form.assigned_to)) {
    errors.assigned_to = 'Choose a valid user';
  }

  return errors;
}

function toPayload(form) {
  const payload = {
    title: form.title.trim(),
    description: form.description.trim() || null,
    priority: form.priority,
    status: form.status,
    due_date: form.due_date || null,
  };

  if (form.assigned_to) {
    payload.assigned_to = Number(form.assigned_to);
  }

  return payload;
}

function FieldError({ children }) {
  if (!children) {
    return null;
  }

  return <p className="mt-1 text-xs font-medium text-red-600">{children}</p>;
}

function TaskFormModal({ isOpen, isSaving, onClose, onSubmit, task, users }) {
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState(emptyForm);

  const isEditMode = Boolean(task);
  const title = isEditMode ? 'Edit task' : 'Add task';

  const userOptions = useMemo(
    () => users.map((user) => ({ label: userLabel(user), value: String(user.id) })),
    [users],
  );

  useEffect(() => {
    if (!isOpen) {
      setForm(emptyForm);
      setErrors({});
      return;
    }

    if (task) {
      setForm({
        assigned_to: task.assigned_to ? String(task.assigned_to) : '',
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'Medium',
        status: task.status || 'Pending',
        due_date: toDateInputValue(task.due_date),
      });
      setErrors({});
      return;
    }

    setForm(emptyForm);
    setErrors({});
  }, [isOpen, task]);

  if (!isOpen) {
    return null;
  }

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validateForm(form, users);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    await onSubmit(toPayload(form));
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-crm-ink/40 p-0 sm:items-center sm:px-4 sm:py-6"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && !isSaving) {
          onClose();
        }
      }}
      role="dialog"
      tabIndex={-1}
    >
      <div className="flex max-h-screen w-full max-w-3xl flex-col rounded-t-lg border border-crm-line bg-white shadow-soft sm:max-h-[92vh] sm:rounded-lg">
        <div className="flex items-center justify-between border-b border-crm-line px-5 py-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-crm-orange">Task</p>
            <h2 className="mt-1 text-xl font-semibold text-crm-ink">{title}</h2>
          </div>
          <button
            aria-label="Close modal"
            className="rounded-md p-2 text-crm-muted hover:bg-crm-surface disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSaving}
            onClick={onClose}
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <form className="overflow-y-auto px-5 py-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-crm-ink">Title</span>
              <input
                className="h-11 w-full rounded-md border border-crm-line bg-white px-3 text-sm text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                name="title"
                onChange={(event) => updateField(event.target.name, event.target.value)}
                value={form.title}
              />
              <FieldError>{errors.title}</FieldError>
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-crm-ink">Assigned To</span>
              <select
                className="h-11 w-full rounded-md border border-crm-line bg-white px-3 text-sm text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                name="assigned_to"
                onChange={(event) => updateField(event.target.name, event.target.value)}
                value={form.assigned_to}
              >
                <option value="">Default to current user</option>
                {userOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <FieldError>{errors.assigned_to}</FieldError>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-crm-ink">Priority</span>
              <select
                className="h-11 w-full rounded-md border border-crm-line bg-white px-3 text-sm text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                name="priority"
                onChange={(event) => updateField(event.target.name, event.target.value)}
                value={form.priority}
              >
                {PRIORITY_OPTIONS.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
              <FieldError>{errors.priority}</FieldError>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-crm-ink">Status</span>
              <select
                className="h-11 w-full rounded-md border border-crm-line bg-white px-3 text-sm text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                name="status"
                onChange={(event) => updateField(event.target.name, event.target.value)}
                value={form.status}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <FieldError>{errors.status}</FieldError>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-crm-ink">Due Date</span>
              <input
                className="h-11 w-full rounded-md border border-crm-line bg-white px-3 text-sm text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                name="due_date"
                onChange={(event) => updateField(event.target.name, event.target.value)}
                type="date"
                value={form.due_date}
              />
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-crm-ink">Description</span>
              <textarea
                className="min-h-28 w-full rounded-md border border-crm-line bg-white px-3 py-2 text-sm text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                name="description"
                onChange={(event) => updateField(event.target.name, event.target.value)}
                value={form.description}
              />
            </label>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 border-t border-crm-line pt-4 sm:flex-row sm:justify-end">
            <button
              className="h-10 rounded-md border border-crm-line bg-white px-4 text-sm font-semibold text-crm-muted hover:bg-crm-surface hover:text-crm-ink disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSaving}
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="h-10 rounded-md bg-crm-orange px-4 text-sm font-semibold text-white hover:bg-crm-orangeDark disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? 'Saving...' : isEditMode ? 'Save changes' : 'Create task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TaskFormModal;
