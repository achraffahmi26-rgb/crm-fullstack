import { AlertCircle, KeyRound, Pencil, Plus, RefreshCw, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { createUser, getUsers, resetUserPassword, updateUser } from '../api/userApi';
import { useAuth } from '../hooks/useAuth';

const ROLE_OPTIONS = [
  { id: 2, name: 'Employee' },
  { id: 1, name: 'Admin' },
];
const STATUS_OPTIONS = ['Active', 'Inactive'];
const initialForm = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  password: '',
  role_id: '2',
  status: 'Active',
};
const initialPasswordForm = {
  password: '',
  confirmPassword: '',
};

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
  return `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || `User #${user.id}`;
}

function getRoleName(user) {
  if (user.role_name) {
    return user.role_name;
  }

  if (Number(user.role_id) === 1) {
    return 'Admin';
  }

  if (Number(user.role_id) === 2) {
    return 'Employee';
  }

  return user.role_id ? `Role #${user.role_id}` : '-';
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateForm(form, isEditMode) {
  const errors = {};
  const roleIds = new Set(ROLE_OPTIONS.map((role) => String(role.id)));

  if (!form.first_name.trim()) {
    errors.first_name = 'First name is required';
  }
  if (!form.last_name.trim()) {
    errors.last_name = 'Last name is required';
  }
  if (!form.email.trim() || !isValidEmail(form.email.trim())) {
    errors.email = 'A valid email is required';
  }
  if (!isEditMode && (!form.password || form.password.length < 6)) {
    errors.password = 'Password must be at least 6 characters';
  }
  if (!roleIds.has(String(form.role_id))) {
    errors.role_id = 'Choose a valid role';
  }
  if (!STATUS_OPTIONS.includes(form.status)) {
    errors.status = 'Choose a valid status';
  }

  return errors;
}

function validatePasswordForm(form) {
  const errors = {};

  if (!form.password || form.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }
  if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return errors;
}

function toPayload(form, isEditMode, isSelfEdit) {
  const payload = {
    first_name: form.first_name.trim(),
    last_name: form.last_name.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
  };

  if (!isSelfEdit) {
    payload.role_id = Number(form.role_id);
    payload.status = form.status;
  }

  if (!isEditMode) {
    payload.password = form.password;
    payload.role_id = Number(form.role_id);
    payload.status = form.status;
  }

  return payload;
}

function toForm(user) {
  return {
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    email: user.email || '',
    phone: user.phone || '',
    password: '',
    role_id: user.role_id ? String(user.role_id) : '2',
    status: user.status || 'Active',
  };
}

function StatusBadge({ status }) {
  const isActive = status === 'Active';

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
      isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
    }`}
    >
      {status || '-'}
    </span>
  );
}

function FieldError({ children }) {
  if (!children) {
    return null;
  }

  return <p className="mt-1 text-xs font-medium text-red-600">{children}</p>;
}

function UserFormModal({ apiError, currentUser, errors, form, isEditMode, isOpen, isSaving, onClose, onFieldChange, onSubmit, user }) {
  if (!isOpen) {
    return null;
  }

  const isSelfEdit = isEditMode && Number(user?.id) === Number(currentUser?.id);

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
      <div className="flex max-h-screen w-full max-w-2xl flex-col rounded-t-lg border border-crm-line bg-white shadow-soft sm:max-h-[86vh] sm:rounded-lg">
        <div className="flex items-center justify-between border-b border-crm-line px-4 py-2.5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-crm-orange">Admin</p>
            <h2 className="mt-1 text-xl font-semibold text-crm-ink">{isEditMode ? 'Edit User' : 'Add User'}</h2>
          </div>
          <button
            aria-label="Close modal"
            className="rounded-md p-2 text-crm-muted hover:bg-crm-surface disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSaving}
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <form className="overflow-y-auto px-4 py-3.5" onSubmit={onSubmit}>
          {apiError ? (
            <div className="mb-4 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {apiError}
            </div>
          ) : null}

          {isSelfEdit ? (
            <div className="mb-4 rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Your own role and status are protected.
            </div>
          ) : null}

          <div className="grid gap-2.5 md:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-crm-ink">First name</span>
              <input
                className="h-9 w-full rounded-md border border-crm-line bg-white px-2.5 text-[13px] text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                name="first_name"
                onChange={onFieldChange}
                value={form.first_name}
              />
              <FieldError>{errors.first_name}</FieldError>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-crm-ink">Last name</span>
              <input
                className="h-9 w-full rounded-md border border-crm-line bg-white px-2.5 text-[13px] text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                name="last_name"
                onChange={onFieldChange}
                value={form.last_name}
              />
              <FieldError>{errors.last_name}</FieldError>
            </label>

            <label className="block md:col-span-2">
              <span className="mb-1.5 block text-[13px] font-medium text-crm-ink">Email</span>
              <input
                className="h-9 w-full rounded-md border border-crm-line bg-white px-2.5 text-[13px] text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                name="email"
                onChange={onFieldChange}
                type="email"
                value={form.email}
              />
              <FieldError>{errors.email}</FieldError>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-crm-ink">Phone</span>
              <input
                className="h-9 w-full rounded-md border border-crm-line bg-white px-2.5 text-[13px] text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                name="phone"
                onChange={onFieldChange}
                value={form.phone}
              />
            </label>

            {!isEditMode ? (
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium text-crm-ink">Password</span>
                <input
                  autoComplete="new-password"
                  className="h-9 w-full rounded-md border border-crm-line bg-white px-2.5 text-[13px] text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                  name="password"
                  onChange={onFieldChange}
                  type="password"
                  value={form.password}
                />
                <FieldError>{errors.password}</FieldError>
              </label>
            ) : null}

            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-crm-ink">Role</span>
              <select
                className="h-9 w-full rounded-md border border-crm-line bg-white px-2.5 text-[13px] text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-crm-surface disabled:text-crm-muted"
                disabled={isSelfEdit}
                name="role_id"
                onChange={onFieldChange}
                value={form.role_id}
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
              <FieldError>{errors.role_id}</FieldError>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-crm-ink">Status</span>
              <select
                className="h-9 w-full rounded-md border border-crm-line bg-white px-2.5 text-[13px] text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-crm-surface disabled:text-crm-muted"
                disabled={isSelfEdit}
                name="status"
                onChange={onFieldChange}
                value={form.status}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <FieldError>{errors.status}</FieldError>
            </label>
          </div>

          <div className="mt-4 flex flex-col-reverse gap-1.5 border-t border-crm-line pt-3 sm:flex-row sm:justify-end">
            <button
              className="h-9 rounded-md border border-crm-line bg-white px-3 text-[13px] font-semibold text-crm-muted hover:bg-crm-surface hover:text-crm-ink disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSaving}
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="h-9 rounded-md bg-crm-orange px-3 text-[13px] font-semibold text-white hover:bg-crm-orangeDark disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? 'Saving...' : isEditMode ? 'Save changes' : 'Create user'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ResetPasswordModal({ apiError, errors, form, isOpen, isSaving, onClose, onFieldChange, onSubmit, user }) {
  if (!isOpen) {
    return null;
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
      <div className="flex w-full max-w-lg flex-col rounded-t-lg border border-crm-line bg-white shadow-soft sm:rounded-lg">
        <div className="flex items-center justify-between border-b border-crm-line px-4 py-2.5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-crm-orange">Admin</p>
            <h2 className="mt-1 text-xl font-semibold text-crm-ink">Reset Password</h2>
            <p className="mt-1 text-[13px] text-crm-muted">{user ? getUserName(user) : ''}</p>
          </div>
          <button
            aria-label="Close modal"
            className="rounded-md p-2 text-crm-muted hover:bg-crm-surface disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSaving}
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <form className="px-4 py-3.5" onSubmit={onSubmit}>
          {apiError ? (
            <div className="mb-4 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {apiError}
            </div>
          ) : null}

          <div className="space-y-2.5">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-crm-ink">New password</span>
              <input
                autoComplete="new-password"
                className="h-9 w-full rounded-md border border-crm-line bg-white px-2.5 text-[13px] text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                name="password"
                onChange={onFieldChange}
                type="password"
                value={form.password}
              />
              <FieldError>{errors.password}</FieldError>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-crm-ink">Confirm password</span>
              <input
                autoComplete="new-password"
                className="h-9 w-full rounded-md border border-crm-line bg-white px-2.5 text-[13px] text-crm-ink outline-none focus:border-crm-orange focus:ring-2 focus:ring-orange-100"
                name="confirmPassword"
                onChange={onFieldChange}
                type="password"
                value={form.confirmPassword}
              />
              <FieldError>{errors.confirmPassword}</FieldError>
            </label>
          </div>

          <div className="mt-4 flex flex-col-reverse gap-1.5 border-t border-crm-line pt-3 sm:flex-row sm:justify-end">
            <button
              className="h-9 rounded-md border border-crm-line bg-white px-3 text-[13px] font-semibold text-crm-muted hover:bg-crm-surface hover:text-crm-ink disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSaving}
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="h-9 rounded-md bg-crm-orange px-3 text-[13px] font-semibold text-white hover:bg-crm-orangeDark disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? 'Resetting...' : 'Reset password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UsersPage() {
  const { user: currentUser } = useAuth();
  const [apiError, setApiError] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [passwordApiError, setPasswordApiError] = useState('');
  const [passwordForm, setPasswordForm] = useState(initialPasswordForm);
  const [passwordFormErrors, setPasswordFormErrors] = useState({});
  const [passwordUser, setPasswordUser] = useState(null);
  const [users, setUsers] = useState([]);

  async function loadUsers() {
    setError('');
    setIsLoading(true);

    try {
      const data = await getUsers();
      setUsers(data);
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Unable to load users';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function resetForm() {
    setForm(initialForm);
    setFormErrors({});
    setApiError('');
  }

  function resetPasswordForm() {
    setPasswordForm(initialPasswordForm);
    setPasswordFormErrors({});
    setPasswordApiError('');
  }

  function openAddModal() {
    setEditingUser(null);
    resetForm();
    setIsModalOpen(true);
  }

  function openEditModal(user) {
    setEditingUser(user);
    setForm(toForm(user));
    setFormErrors({});
    setApiError('');
    setIsModalOpen(true);
  }

  function openPasswordModal(user) {
    setPasswordUser(user);
    resetPasswordForm();
    setIsPasswordModalOpen(true);
  }

  function closeModal() {
    if (isSaving) {
      return;
    }

    setIsModalOpen(false);
    setEditingUser(null);
    resetForm();
  }

  function closePasswordModal() {
    if (isPasswordSaving) {
      return;
    }

    setIsPasswordModalOpen(false);
    setPasswordUser(null);
    resetPasswordForm();
  }

  function handleFieldChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFormErrors((current) => ({ ...current, [name]: undefined }));
    setApiError('');
  }

  function handlePasswordFieldChange(event) {
    const { name, value } = event.target;
    setPasswordForm((current) => ({ ...current, [name]: value }));
    setPasswordFormErrors((current) => ({ ...current, [name]: undefined }));
    setPasswordApiError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const isEditMode = Boolean(editingUser);
    const isSelfEdit = isEditMode && Number(editingUser.id) === Number(currentUser?.id);
    const nextErrors = validateForm(form, isEditMode);
    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return;
    }

    setIsSaving(true);
    setApiError('');

    try {
      if (isEditMode) {
        await updateUser(editingUser.id, toPayload(form, true, isSelfEdit));
        toast.success('User updated');
      } else {
        await createUser(toPayload(form, false, false));
        toast.success('User created');
      }

      setIsModalOpen(false);
      setEditingUser(null);
      resetForm();
      await loadUsers();
    } catch (requestError) {
      const fieldErrors = requestError.response?.data?.errors;
      const message = requestError.response?.data?.message || (isEditMode ? 'Unable to update user' : 'Unable to create user');

      if (fieldErrors) {
        setFormErrors(fieldErrors);
        setApiError(Object.values(fieldErrors).join(', '));
      } else {
        setApiError(message);
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();

    const nextErrors = validatePasswordForm(passwordForm);
    if (Object.keys(nextErrors).length > 0) {
      setPasswordFormErrors(nextErrors);
      return;
    }

    setIsPasswordSaving(true);
    setPasswordApiError('');

    try {
      await resetUserPassword(passwordUser.id, passwordForm);
      toast.success('Password reset');
      setIsPasswordModalOpen(false);
      setPasswordUser(null);
      resetPasswordForm();
    } catch (requestError) {
      const fieldErrors = requestError.response?.data?.errors;
      const message = requestError.response?.data?.message || 'Unable to reset password';

      if (fieldErrors) {
        setPasswordFormErrors(fieldErrors);
        setPasswordApiError(Object.values(fieldErrors).join(', '));
      } else {
        setPasswordApiError(message);
      }
    } finally {
      setIsPasswordSaving(false);
    }
  }

  return (
    <div className="crm-page-stack">
      <section className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-crm-orange">Admin</p>
          <h1 className="mt-1 text-xl font-semibold text-crm-ink md:text-2xl">User management</h1>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-5 text-crm-muted">
            View, create, edit, and reset passwords for internal CRM access.
          </p>
        </div>

        <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:justify-end">
          <button
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-crm-line bg-white px-3 text-[13px] font-semibold text-crm-muted hover:bg-crm-surface hover:text-crm-ink"
            onClick={loadUsers}
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
            Add User
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-crm-line bg-white shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-crm-line px-3.5 py-2.5">
          <div className="rounded-md bg-orange-50 p-1.5 text-crm-orange">
            <Users size={18} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-crm-ink">All users</h2>
            <p className="text-[13px] text-crm-muted">{users.length} application accounts</p>
          </div>
        </div>

        {isLoading ? (
          <div className="crm-table-loading">
            <div className="space-y-2.5">
              {[1, 2, 3, 4].map((item) => <div className="crm-skeleton-row" key={item} />)}
            </div>
          </div>
        ) : error ? (
          <div className="crm-table-error">
            <AlertCircle className="mx-auto text-red-500" size={32} />
            <p className="mt-3 text-sm font-semibold text-crm-ink">Could not load users</p>
            <p className="mt-1.5 text-[13px] text-crm-muted">{error}</p>
            <button
              className="mt-4 inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-crm-orange px-3 text-[13px] font-semibold text-white hover:bg-crm-orangeDark"
              onClick={loadUsers}
              type="button"
            >
              <RefreshCw size={15} />
              Try again
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="crm-table-empty">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-orange-50 text-crm-orange">
              <Users size={20} />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-crm-ink">No users found</h3>
            <p className="mt-1.5 text-[13px] text-crm-muted">Application users will appear here after they are created by an administrator.</p>
          </div>
        ) : (
          <div className="crm-table-shell">
            <table className="crm-table min-w-[980px] w-full text-left">
              <thead>
                <tr>
                  <th className="font-semibold">Name</th>
                  <th className="font-semibold">Email</th>
                  <th className="font-semibold">Role</th>
                  <th className="font-semibold">Status</th>
                  <th className="font-semibold">Created at</th>
                  <th className="text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <p className="font-semibold text-crm-ink">{getUserName(user)}</p>
                      <p className="text-xs text-crm-muted">ID #{user.id}</p>
                    </td>
                    <td className="text-crm-muted">{user.email || '-'}</td>
                    <td>
                      <span className="inline-flex rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-crm-orange">
                        {getRoleName(user)}
                      </span>
                    </td>
                    <td><StatusBadge status={user.status} /></td>
                    <td className="text-crm-muted">{formatDate(user.created_at)}</td>
                    <td>
                      <div className="flex flex-wrap justify-end gap-1">
                        <button
                          aria-label={`Edit ${getUserName(user)}`}
                          className="inline-flex items-center gap-2 rounded-md border border-crm-line px-2.5 py-1.5 text-xs font-semibold text-crm-muted hover:bg-white hover:text-crm-ink"
                          onClick={() => openEditModal(user)}
                          type="button"
                        >
                          <Pencil size={14} />
                          Edit
                        </button>
                        <button
                          aria-label={`Reset password for ${getUserName(user)}`}
                          className="inline-flex items-center gap-2 rounded-md border border-crm-line px-2.5 py-1.5 text-xs font-semibold text-crm-muted hover:bg-white hover:text-crm-ink"
                          onClick={() => openPasswordModal(user)}
                          type="button"
                        >
                          <KeyRound size={14} />
                          Reset Password
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <UserFormModal
        apiError={apiError}
        currentUser={currentUser}
        errors={formErrors}
        form={form}
        isEditMode={Boolean(editingUser)}
        isOpen={isModalOpen}
        isSaving={isSaving}
        onClose={closeModal}
        onFieldChange={handleFieldChange}
        onSubmit={handleSubmit}
        user={editingUser}
      />

      <ResetPasswordModal
        apiError={passwordApiError}
        errors={passwordFormErrors}
        form={passwordForm}
        isOpen={isPasswordModalOpen}
        isSaving={isPasswordSaving}
        onClose={closePasswordModal}
        onFieldChange={handlePasswordFieldChange}
        onSubmit={handlePasswordSubmit}
        user={passwordUser}
      />
    </div>
  );
}

export default UsersPage;
