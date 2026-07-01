import {
  BarChart3,
  Bell,
  Building2,
  CreditCard,
  CheckSquare,
  LayoutDashboard,
  Menu,
  Package,
  Receipt,
  Search,
  ShoppingCart,
  Target,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import {
  deleteNotification,
  getNotifications,
  getUnreadNotificationsCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../api/notificationApi';
import BrandLogo from '../components/common/BrandLogo';
import { useAuth } from '../hooks/useAuth';

const navItems = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Customers', to: '/customers', icon: Users },
  { label: 'Companies', to: '/companies', icon: Building2 },
  { label: 'Leads', to: '/leads', icon: Target },
  { label: 'Products', to: '/products', icon: Package },
  { label: 'Orders', to: '/orders', icon: ShoppingCart },
  { label: 'Invoices', to: '/invoices', icon: Receipt },
  { label: 'Payments', to: '/payments', icon: CreditCard },
  { label: 'Tasks', to: '/tasks', icon: CheckSquare },
  { label: 'Reports', to: '/reports', icon: BarChart3 },
];

function safeString(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
}

function getPersonName(record) {
  return `${record.first_name || ''} ${record.last_name || ''}`.trim();
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  return `${new Intl.NumberFormat('en-US').format(Number(value))} MAD`;
}

function formatDate(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return safeString(value);
  }

  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function createResult(module, record, title, subtitle, keywords = []) {
  return {
    id: `${module.responseKey}-${record.id || title}`,
    keywords: [...keywords, ...Object.values(record)],
    module: module.label,
    path: module.path,
    subtitle,
    title,
  };
}

const searchModules = [
  {
    endpoint: '/companies',
    icon: Building2,
    label: 'Companies',
    path: '/companies',
    responseKey: 'companies',
    toResult: (record, module) => createResult(
      module,
      record,
      record.name || `Company #${record.id}`,
      [record.industry, record.city, record.country].filter(Boolean).join(' · ') || 'Company record',
      [record.name, record.industry, record.email, record.phone, record.website, record.city, record.country, formatDate(record.created_at)],
    ),
  },
  {
    endpoint: '/customers',
    icon: Users,
    label: 'Customers',
    path: '/customers',
    responseKey: 'customers',
    toResult: (record, module) => {
      const name = getPersonName(record) || record.email || `Customer #${record.id}`;

      return createResult(
        module,
        record,
        name,
        [record.email, record.phone, record.status].filter(Boolean).join(' · ') || 'Customer record',
        [
          name,
          record.email,
          record.phone,
          record.status,
          record.company_name,
          record.assigned_user_name,
          record.company_id,
          record.assigned_to,
          formatDate(record.created_at),
        ],
      );
    },
  },
  {
    endpoint: '/leads',
    icon: Target,
    label: 'Leads',
    path: '/leads',
    responseKey: 'leads',
    toResult: (record, module) => {
      const name = getPersonName(record) || record.email || `Lead #${record.id}`;

      return createResult(
        module,
        record,
        name,
        [record.company_name || record.company, record.status, record.source].filter(Boolean).join(' · ') || 'Lead record',
        [
          name,
          record.email,
          record.phone,
          record.company_name,
          record.company,
          record.assigned_user_name,
          record.source,
          record.status,
          record.estimated_value,
          formatCurrency(record.estimated_value),
          formatDate(record.created_at),
        ],
      );
    },
  },
  {
    endpoint: '/products',
    icon: Package,
    label: 'Products',
    path: '/products',
    responseKey: 'products',
    toResult: (record, module) => createResult(
      module,
      record,
      record.name || `Product #${record.id}`,
      [record.sku, record.category_name || record.category, record.status].filter(Boolean).join(' · ') || 'Product record',
      [
        record.name,
        record.sku,
        record.barcode,
        record.category_name,
        record.category,
        record.purchase_price,
        record.selling_price,
        formatCurrency(record.purchase_price),
        formatCurrency(record.selling_price),
        record.status,
        formatDate(record.created_at),
      ],
    ),
  },
  {
    endpoint: '/orders',
    icon: ShoppingCart,
    label: 'Orders',
    path: '/orders',
    responseKey: 'orders',
    toResult: (record, module) => createResult(
      module,
      record,
      record.order_number || `Order #${record.id}`,
      [record.customer_name, formatCurrency(record.total_amount), record.status].filter(Boolean).join(' · ') || 'Order record',
      [
        record.order_number,
        record.customer_name,
        record.customer_id,
        formatDate(record.order_date),
        record.total_amount,
        formatCurrency(record.total_amount),
        record.status,
        formatDate(record.created_at),
      ],
    ),
  },
  {
    endpoint: '/invoices',
    icon: Receipt,
    label: 'Invoices',
    path: '/invoices',
    responseKey: 'invoices',
    toResult: (record, module) => createResult(
      module,
      record,
      record.invoice_number || `Invoice #${record.id}`,
      [record.order_number || (record.order_id ? `Order #${record.order_id}` : ''), record.payment_status].filter(Boolean).join(' · ') || 'Invoice record',
      [
        record.invoice_number,
        record.order_number,
        record.order_id,
        formatDate(record.invoice_date),
        formatDate(record.due_date),
        record.total_amount,
        formatCurrency(record.total_amount),
        record.payment_status,
        formatDate(record.created_at),
      ],
    ),
  },
  {
    endpoint: '/payments',
    icon: CreditCard,
    label: 'Payments',
    path: '/payments',
    responseKey: 'payments',
    toResult: (record, module) => createResult(
      module,
      record,
      record.invoice_number || record.reference || `Payment #${record.id}`,
      [formatCurrency(record.amount), record.payment_method, record.status].filter(Boolean).join(' · ') || 'Payment record',
      [
        record.invoice_number,
        record.invoice_id,
        record.amount,
        formatCurrency(record.amount),
        record.payment_method,
        record.status,
        formatDate(record.payment_date),
        record.reference,
        record.transaction_id,
        formatDate(record.created_at),
      ],
    ),
  },
  {
    endpoint: '/tasks',
    icon: CheckSquare,
    label: 'Tasks',
    path: '/tasks',
    responseKey: 'tasks',
    toResult: (record, module) => createResult(
      module,
      record,
      record.title || `Task #${record.id}`,
      [record.assigned_user_name, record.priority, record.status].filter(Boolean).join(' · ') || 'Task record',
      [
        record.title,
        record.description,
        record.assigned_user_name,
        record.assigned_to,
        record.priority,
        record.status,
        formatDate(record.due_date),
        formatDate(record.created_at),
      ],
    ),
  },
];

function resultMatchesQuery(result, query) {
  const normalizedQuery = query.toLowerCase();

  return [result.title, result.subtitle, result.module, ...result.keywords]
    .some((value) => safeString(value).toLowerCase().includes(normalizedQuery));
}

function getRecordsFromResponse(data, responseKey) {
  const records = data?.[responseKey];

  return Array.isArray(records) ? records : [];
}

function NotificationBell() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef(null);

  async function loadUnreadCount() {
    try {
      const count = await getUnreadNotificationsCount();
      setUnreadCount(count);
    } catch {
      setUnreadCount(0);
    }
  }

  async function loadNotifications() {
    setError('');
    setIsLoading(true);

    try {
      const data = await getNotifications();
      setNotifications(data);
      setUnreadCount(data.filter((notification) => !notification.is_read).length);
    } catch (requestError) {
      setNotifications([]);
      setError(requestError.response?.data?.message || 'Unable to load notifications');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadUnreadCount();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleToggle() {
    const nextIsOpen = !isOpen;
    setIsOpen(nextIsOpen);

    if (nextIsOpen) {
      await loadNotifications();
    }
  }

  async function handleMarkAsRead(notificationId) {
    try {
      const updatedNotification = await markNotificationAsRead(notificationId);
      setNotifications((currentNotifications) => currentNotifications.map((notification) => (
        notification.id === notificationId ? updatedNotification : notification
      )));
      setUnreadCount((currentCount) => Math.max(currentCount - 1, 0));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to mark notification as read');
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await markAllNotificationsAsRead();
      setNotifications((currentNotifications) => currentNotifications.map((notification) => ({
        ...notification,
        is_read: 1,
      })));
      setUnreadCount(0);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to mark notifications as read');
    }
  }

  async function handleDelete(notificationId) {
    try {
      const deletedNotification = notifications.find((notification) => notification.id === notificationId);
      await deleteNotification(notificationId);
      setNotifications((currentNotifications) => currentNotifications.filter((notification) => notification.id !== notificationId));

      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount((currentCount) => Math.max(currentCount - 1, 0));
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete notification');
    }
  }

  const latestNotifications = notifications.slice(0, 8);

  return (
    <div className="relative" ref={notificationRef}>
      <button
        aria-label="Notifications"
        className="relative inline-flex rounded-md border border-crm-line bg-white p-2 text-crm-muted hover:bg-crm-surface hover:text-crm-ink"
        onClick={handleToggle}
        type="button"
      >
        <Bell size={18} />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-crm-orange px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-lg border border-crm-line bg-white shadow-xl">
          <div className="flex items-center justify-between gap-3 border-b border-crm-line px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-crm-ink">Notifications</p>
              <p className="text-xs text-crm-muted">{unreadCount} unread</p>
            </div>
            <button
              className="rounded-md px-2 py-1 text-xs font-semibold text-crm-orange hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={unreadCount === 0 || isLoading}
              onClick={handleMarkAllAsRead}
              type="button"
            >
              Mark all read
            </button>
          </div>

          {isLoading ? (
            <div className="p-4">
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div className="h-14 animate-pulse rounded-md bg-crm-surface" key={item} />
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="p-4 text-sm">
              <p className="font-semibold text-crm-ink">Could not load notifications</p>
              <p className="mt-1 text-crm-muted">{error}</p>
              <button
                className="mt-3 rounded-md bg-crm-orange px-3 py-2 text-xs font-semibold text-white hover:bg-crm-orangeDark"
                onClick={loadNotifications}
                type="button"
              >
                Try again
              </button>
            </div>
          ) : latestNotifications.length === 0 ? (
            <div className="p-6 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-orange-50 text-crm-orange">
                <Bell size={18} />
              </div>
              <p className="mt-3 text-sm font-semibold text-crm-ink">No notifications</p>
              <p className="mt-1 text-xs text-crm-muted">You are all caught up.</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {latestNotifications.map((notification) => {
                const isUnread = !notification.is_read;

                return (
                  <div className="border-b border-crm-line p-3 last:border-b-0" key={notification.id}>
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                          isUnread ? 'bg-crm-orange' : 'bg-slate-200'
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-crm-ink">{notification.title}</p>
                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-crm-muted">{notification.message}</p>
                          </div>
                          <button
                            aria-label="Delete notification"
                            className="shrink-0 rounded-md p-1 text-crm-muted hover:bg-red-50 hover:text-red-600"
                            onClick={() => handleDelete(notification.id)}
                            type="button"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs text-crm-muted">{formatDate(notification.created_at) || 'Just now'}</span>
                          {isUnread ? (
                            <button
                              className="rounded-md px-2 py-1 text-xs font-semibold text-crm-orange hover:bg-orange-50"
                              onClick={() => handleMarkAsRead(notification.id)}
                              type="button"
                            >
                              Mark read
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!debouncedQuery) {
      setGroups([]);
      setError('');
      setIsLoading(false);
      return undefined;
    }

    let isCurrent = true;

    async function searchRecords() {
      setIsLoading(true);
      setError('');
      setIsOpen(true);

      try {
        const responses = await Promise.all(
          searchModules.map((module) => axiosClient.get(module.endpoint)),
        );

        if (!isCurrent) {
          return;
        }

        const nextGroups = searchModules
          .map((module, index) => {
            const records = getRecordsFromResponse(responses[index].data, module.responseKey);
            const results = records
              .map((record) => module.toResult(record, module))
              .filter((result) => resultMatchesQuery(result, debouncedQuery))
              .slice(0, 5);

            return {
              icon: module.icon,
              label: module.label,
              path: module.path,
              results,
            };
          })
          .filter((group) => group.results.length > 0);

        setGroups(nextGroups);
      } catch (requestError) {
        if (isCurrent) {
          setGroups([]);
          setError(requestError.response?.data?.message || 'Unable to search CRM records');
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    searchRecords();

    return () => {
      isCurrent = false;
    };
  }, [debouncedQuery]);

  function handleResultClick(path) {
    navigate(path);
    setQuery('');
    setDebouncedQuery('');
    setGroups([]);
    setIsOpen(false);
  }

  const hasQuery = query.trim().length > 0;
  const hasResults = groups.length > 0;

  return (
    <div className="relative hidden w-64 md:block xl:w-80" ref={searchRef}>
      <div className="flex h-10 items-center gap-2 rounded-md border border-crm-line bg-crm-surface px-3 text-sm text-crm-muted focus-within:border-crm-orange focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-100">
        <Search className="shrink-0" size={17} />
        <input
          aria-label="Search CRM records"
          className="min-w-0 flex-1 bg-transparent text-sm text-crm-ink outline-none placeholder:text-crm-muted"
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (hasQuery) {
              setIsOpen(true);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setIsOpen(false);
            }
          }}
          placeholder="Search CRM records"
          type="search"
          value={query}
        />
      </div>

      {isOpen && hasQuery ? (
        <div className="absolute left-0 top-full z-50 mt-2 max-h-[70vh] w-[min(28rem,calc(100vw-2rem))] overflow-y-auto rounded-lg border border-crm-line bg-white shadow-xl">
          {isLoading ? (
            <div className="p-4">
              <div className="h-3 w-28 animate-pulse rounded bg-crm-surface" />
              <div className="mt-3 space-y-2">
                {[1, 2, 3].map((item) => (
                  <div className="h-10 animate-pulse rounded-md bg-crm-surface" key={item} />
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="p-4 text-sm">
              <p className="font-semibold text-crm-ink">Search unavailable</p>
              <p className="mt-1 text-crm-muted">{error}</p>
            </div>
          ) : hasResults ? (
            <div className="py-2">
              {groups.map((group) => {
                const Icon = group.icon;

                return (
                  <div className="border-b border-crm-line last:border-b-0" key={group.label}>
                    <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-crm-muted">
                      <Icon size={14} />
                      {group.label}
                    </div>
                    <div className="pb-2">
                      {group.results.map((result) => (
                        <button
                          className="flex w-full min-w-0 items-start gap-3 px-3 py-2 text-left transition hover:bg-crm-surface"
                          key={result.id}
                          onClick={() => handleResultClick(result.path)}
                          type="button"
                        >
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-crm-orange" />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-crm-ink">{result.title}</span>
                            <span className="block truncate text-xs text-crm-muted">{result.subtitle}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 text-sm">
              <p className="font-semibold text-crm-ink">No matching records</p>
              <p className="mt-1 text-crm-muted">Try another customer, invoice, task, or order keyword.</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function Sidebar({ isOpen, onClose }) {
  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-crm-ink/30 transition-opacity lg:hidden ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 max-w-[85vw] flex-col overflow-y-auto border-r border-crm-line bg-white transition-transform lg:fixed lg:h-screen lg:max-w-none lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-crm-line px-5">
          <BrandLogo className="h-9 w-9" />
          <button className="rounded-md p-2 text-crm-muted hover:bg-crm-surface lg:hidden" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-orange-50 text-crm-orange'
                      : 'text-crm-muted hover:bg-crm-surface hover:text-crm-ink'
                  }`
                }
                key={item.label}
                onClick={onClose}
                end={item.to === '/dashboard'}
                to={item.to}
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { logout, user } = useAuth();

  return (
    <div className="min-h-screen overflow-x-hidden bg-crm-surface text-crm-ink">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="min-w-0 lg:ml-72">
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-3 border-b border-crm-line bg-white/95 px-3 py-3 backdrop-blur sm:px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              className="rounded-md border border-crm-line bg-white p-2 text-crm-muted hover:bg-crm-surface lg:hidden"
              onClick={() => setIsSidebarOpen(true)}
              type="button"
            >
              <Menu size={20} />
            </button>
            <GlobalSearch />
          </div>

          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <NotificationBell />
            <div className="hidden min-w-0 text-right sm:block">
              <p className="truncate text-sm font-semibold">{user?.first_name || 'User'} {user?.last_name || ''}</p>
              <p className="max-w-44 truncate text-xs text-crm-muted">{user?.email}</p>
            </div>
            <button
              className="shrink-0 rounded-md border border-crm-line bg-white px-3 py-2 text-sm font-medium text-crm-muted hover:bg-crm-surface hover:text-crm-ink"
              onClick={logout}
              type="button"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="min-w-0 p-3 sm:p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
