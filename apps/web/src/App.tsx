import { type FormEvent, type ReactNode, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';

type User = {
  id: string;
  email: string;
  name: string | null;
};

type Enquiry = {
  id: string;
  name: string;
  email: string;
  message: string | null;
  status: string;
  preferredContactMethod: string | null;
  receivedAt: string;
  clientId: string | null;
};

type Client = {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  preferredContactMethod: string | null;
  createdAt: string;
};

type Booking = {
  id: string;
  clientId: string;
  enquiryId: string | null;
  startsAt: string;
  endsAt: string;
  status: string;
  location: string | null;
  notes: string | null;
  client: Client;
};

type AuditEvent = {
  id: string;
  action: string;
  details: string | null;
  entityType: string;
  entityId: string;
  createdAt: string;
};

type Notification = {
  id: string;
  type: string;
  status: string;
  recipientEmail: string;
  subject: string;
  createdAt: string;
};

type DashboardStats = {
  openEnquiries: number;
  upcomingSessions: number;
  alerts: number;
};

const API_BASE = 'http://localhost:4000';

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error((payload as { message?: string }).message ?? 'Request failed');
  }

  return payload as T;
}

function MarketingPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    message: '',
    preferredContactMethod: 'EMAIL',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await api<{ ok: true }>('/api/enquiries', {
        method: 'POST',
        body: JSON.stringify(form),
      });

      setSuccessMessage('Thanks for your message. Mike will be in touch soon.');
      setForm({ name: '', email: '', message: '', preferredContactMethod: 'EMAIL' });
    } catch (submissionError) {
      setErrorMessage(submissionError instanceof Error ? submissionError.message : 'Unable to send your enquiry right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-stone-50 text-slate-800">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16">
        <span className="mb-4 inline-flex w-fit rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
          Counselling practice
        </span>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 md:text-6xl">
          Calm, professional support for life’s difficult moments.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
          This public-facing website is being scaffolded for Mike&apos;s counselling practice. The first milestone establishes a responsive marketing site, a secure admin login and a production-minded data model.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <a
            href="#contact"
            className="rounded-full bg-brand-700 px-6 py-3 text-sm font-medium text-white shadow-soft transition hover:bg-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
          >
            Get in touch
          </a>
          <a
            href="#about"
            className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700"
          >
            Learn more
          </a>
          <a
            href="/admin/login"
            className="rounded-full border border-brand-200 bg-brand-50 px-6 py-3 text-sm font-medium text-brand-800 transition hover:bg-brand-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
          >
            Admin login
          </a>
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Contact</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">Ask a question or request a first appointment</h2>
          </div>

          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-slate-700 md:col-span-1">
              Name
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 outline-none transition focus:border-brand-600 focus:bg-white focus:ring-2 focus:ring-brand-100"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                required
              />
            </label>

            <label className="block text-sm font-medium text-slate-700 md:col-span-1">
              Email
              <input
                type="email"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 outline-none transition focus:border-brand-600 focus:bg-white focus:ring-2 focus:ring-brand-100"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                required
              />
            </label>

            <label className="block text-sm font-medium text-slate-700 md:col-span-2">
              Preferred contact method
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 outline-none transition focus:border-brand-600 focus:bg-white focus:ring-2 focus:ring-brand-100"
                value={form.preferredContactMethod}
                onChange={(event) => setForm((current) => ({ ...current, preferredContactMethod: event.target.value }))}
              >
                <option value="EMAIL">Email</option>
                <option value="PHONE">Phone</option>
              </select>
            </label>

            <label className="block text-sm font-medium text-slate-700 md:col-span-2">
              Message
              <textarea
                rows={5}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 outline-none transition focus:border-brand-600 focus:bg-white focus:ring-2 focus:ring-brand-100"
                value={form.message}
                onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                required
              />
            </label>

            {successMessage ? <p className="text-sm text-emerald-600 md:col-span-2">{successMessage}</p> : null}
            {errorMessage ? <p className="text-sm text-red-600 md:col-span-2">{errorMessage}</p> : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-70 md:col-span-2"
            >
              {isSubmitting ? 'Sending…' : 'Send enquiry'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('ChangeMeStronglyBeforeUse123!');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await api<{ user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      navigate('/admin');
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Unable to log in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Admin access</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Sign in</h1>
        <p className="mt-2 text-sm text-slate-600">Use the secure administrative login for Mike&apos;s practice dashboard.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 outline-none transition focus:border-brand-600 focus:bg-white focus:ring-2 focus:ring-brand-100"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Password
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 outline-none transition focus:border-brand-600 focus:bg-white focus:ring-2 focus:ring-brand-100"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  );
}

function ProtectedAdminRoute({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    api<{ user: User }>('/api/admin/me')
      .then((response) => {
        if (!isMounted) {
          return;
        }

        if (response.user) {
          setIsAuthenticated(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsAuthenticated(false);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-700">Checking your session…</main>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}

function AdminDashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats>({ openEnquiries: 0, upcomingSessions: 0, alerts: 0 });
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activity, setActivity] = useState<{ auditEvents: AuditEvent[]; notifications: Notification[] }>({
    auditEvents: [],
    notifications: [],
  });
  const [bookingForm, setBookingForm] = useState({
    clientId: '',
    enquiryId: '',
    startsAt: new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16),
    endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
    location: '',
    notes: '',
  });

  const loadDashboard = async () => {
    const [dashboardResponse, enquiryResponse, clientResponse, bookingResponse, activityResponse] = await Promise.all([
      api<{ stats: DashboardStats }>('/api/admin/dashboard'),
      api<{ enquiries: Enquiry[] }>('/api/admin/enquiries'),
      api<{ clients: Client[] }>('/api/admin/clients'),
      api<{ bookings: Booking[] }>('/api/admin/bookings'),
      api<{ auditEvents: AuditEvent[]; notifications: Notification[] }>('/api/admin/activity'),
    ]);

    setStats(dashboardResponse.stats);
    setEnquiries(enquiryResponse.enquiries);
    setClients(clientResponse.clients);
    setBookings(bookingResponse.bookings);
    setActivity({
      auditEvents: activityResponse.auditEvents,
      notifications: activityResponse.notifications,
    });
  };

  useEffect(() => {
    api<{ user: User }>('/api/admin/me')
      .then((response) => setUser(response.user))
      .catch(() => navigate('/admin/login'));

    loadDashboard().catch(() => navigate('/admin/login'));
  }, [navigate]);

  const handleLogout = async () => {
    await api('/api/auth/logout', { method: 'POST' });
    navigate('/admin/login');
  };

  const handleStatusChange = async (enquiryId: string, nextStatus: string) => {
    await api(`/api/admin/enquiries/${enquiryId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: nextStatus }),
    });

    await loadDashboard();
  };

  const handleConvertToClient = async (enquiryId: string) => {
    await api(`/api/admin/enquiries/${enquiryId}/convert-to-client`, {
      method: 'POST',
    });

    await loadDashboard();
  };

  const handleAcknowledgeEnquiry = async (enquiryId: string) => {
    await api(`/api/admin/enquiries/${enquiryId}/acknowledge`, {
      method: 'POST',
    });

    await loadDashboard();
  };

  const handleCreateBooking = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!bookingForm.clientId) {
      return;
    }

    await api('/api/admin/bookings', {
      method: 'POST',
      body: JSON.stringify({
        ...bookingForm,
        enquiryId: bookingForm.enquiryId || null,
      }),
    });

    setBookingForm((current) => ({
      ...current,
      enquiryId: '',
      location: '',
      notes: '',
    }));

    await loadDashboard();
  };

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-800">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Admin dashboard</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Welcome{user ? `, ${user.name ?? user.email}` : ''}</h1>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            Log out
          </button>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <p className="text-sm text-slate-500">Open enquiries</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{stats.openEnquiries}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <p className="text-sm text-slate-500">Upcoming sessions</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{stats.upcomingSessions}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <p className="text-sm text-slate-500">Alerts</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{stats.alerts}</p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Inbox</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">Recent enquiries</h2>
            </div>
          </div>

          <div className="space-y-3">
            {enquiries.length === 0 ? (
              <p className="text-sm text-slate-500">No enquiries yet.</p>
            ) : (
              enquiries.map((enquiry) => (
                <div key={enquiry.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{enquiry.name}</p>
                      <p className="text-sm text-slate-500">{enquiry.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-800">{enquiry.status}</span>
                      <select
                        className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700"
                        value={enquiry.status}
                        onChange={(event) => handleStatusChange(enquiry.id, event.target.value)}
                      >
                        <option value="NEW">NEW</option>
                        <option value="CONTACTED">CONTACTED</option>
                        <option value="AWAITING_RESPONSE">AWAITING_RESPONSE</option>
                        <option value="CONVERTED_TO_CLIENT">CONVERTED_TO_CLIENT</option>
                        <option value="CLOSED">CLOSED</option>
                        <option value="SPAM">SPAM</option>
                      </select>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">{enquiry.message ?? 'No message provided.'}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-slate-500">Received {new Date(enquiry.receivedAt).toLocaleString()}</p>
                    <div className="flex items-center gap-2">
                      {!enquiry.clientId ? (
                        <button
                          type="button"
                          onClick={() => handleConvertToClient(enquiry.id)}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700"
                        >
                          Convert to client
                        </button>
                      ) : (
                        <span className="text-xs font-medium text-emerald-700">Client created</span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleAcknowledgeEnquiry(enquiry.id)}
                        className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-800 transition hover:bg-brand-100"
                      >
                        Queue acknowledgement
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Clients</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">Active client list</h2>

            <div className="mt-4 space-y-3">
              {clients.length === 0 ? (
                <p className="text-sm text-slate-500">No clients yet.</p>
              ) : (
                clients.map((client) => (
                  <div key={client.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="font-medium text-slate-900">{client.firstName} {client.lastName ?? ''}</p>
                    <p className="text-sm text-slate-500">{client.email ?? 'No email provided'}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <form onSubmit={handleCreateBooking} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Scheduling</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">Create booking</h2>

            <div className="mt-4 space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Client
                <select
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 outline-none transition focus:border-brand-600 focus:bg-white focus:ring-2 focus:ring-brand-100"
                  value={bookingForm.clientId}
                  onChange={(event) => setBookingForm((current) => ({ ...current, clientId: event.target.value }))}
                >
                  <option value="">Select client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.firstName} {client.lastName ?? ''}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Related enquiry
                <select
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 outline-none transition focus:border-brand-600 focus:bg-white focus:ring-2 focus:ring-brand-100"
                  value={bookingForm.enquiryId}
                  onChange={(event) => setBookingForm((current) => ({ ...current, enquiryId: event.target.value }))}
                >
                  <option value="">No specific enquiry</option>
                  {enquiries.map((enquiry) => (
                    <option key={enquiry.id} value={enquiry.id}>
                      {enquiry.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Start
                  <input
                    type="datetime-local"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 outline-none transition focus:border-brand-600 focus:bg-white focus:ring-2 focus:ring-brand-100"
                    value={bookingForm.startsAt}
                    onChange={(event) => setBookingForm((current) => ({ ...current, startsAt: event.target.value }))}
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  End
                  <input
                    type="datetime-local"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 outline-none transition focus:border-brand-600 focus:bg-white focus:ring-2 focus:ring-brand-100"
                    value={bookingForm.endsAt}
                    onChange={(event) => setBookingForm((current) => ({ ...current, endsAt: event.target.value }))}
                  />
                </label>
              </div>

              <label className="block text-sm font-medium text-slate-700">
                Location
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 outline-none transition focus:border-brand-600 focus:bg-white focus:ring-2 focus:ring-brand-100"
                  value={bookingForm.location}
                  onChange={(event) => setBookingForm((current) => ({ ...current, location: event.target.value }))}
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Notes
                <textarea
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 outline-none transition focus:border-brand-600 focus:bg-white focus:ring-2 focus:ring-brand-100"
                  value={bookingForm.notes}
                  onChange={(event) => setBookingForm((current) => ({ ...current, notes: event.target.value }))}
                />
              </label>

              <button
                type="submit"
                className="w-full rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-800"
              >
                Create booking
              </button>
            </div>
          </form>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Schedule</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">Upcoming bookings</h2>

          <div className="mt-4 space-y-3">
            {bookings.length === 0 ? (
              <p className="text-sm text-slate-500">No bookings scheduled.</p>
            ) : (
              bookings.map((booking) => (
                <div key={booking.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="font-medium text-slate-900">{booking.client.firstName} {booking.client.lastName ?? ''}</p>
                  <p className="text-sm text-slate-500">
                    {new Date(booking.startsAt).toLocaleString()} to {new Date(booking.endsAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Audit trail</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">Recent admin activity</h2>

            <div className="mt-4 space-y-3">
              {activity.auditEvents.length === 0 ? (
                <p className="text-sm text-slate-500">No recent actions.</p>
              ) : (
                activity.auditEvents.map((event) => (
                  <div key={event.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="font-medium text-slate-900">{event.action}</p>
                    <p className="text-sm text-slate-500">{event.details ?? 'No details provided.'}</p>
                    <p className="mt-1 text-xs text-slate-400">{new Date(event.createdAt).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Email queue</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">Queued notifications</h2>

            <div className="mt-4 space-y-3">
              {activity.notifications.length === 0 ? (
                <p className="text-sm text-slate-500">No queued notifications.</p>
              ) : (
                activity.notifications.map((notification) => (
                  <div key={notification.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-slate-900">{notification.subject}</p>
                      <span className="rounded-full bg-brand-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-800">{notification.status}</span>
                    </div>
                    <p className="text-sm text-slate-500">{notification.recipientEmail}</p>
                    <p className="mt-1 text-xs text-slate-400">{new Date(notification.createdAt).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<MarketingPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin"
        element={
          <ProtectedAdminRoute>
            <AdminDashboardPage />
          </ProtectedAdminRoute>
        }
      />
    </Routes>
  );
}

export default App;
