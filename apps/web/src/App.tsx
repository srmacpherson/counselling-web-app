import { type FormEvent, type ReactNode, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';

type User = {
  id: string;
  email: string;
  name: string | null;
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

  useEffect(() => {
    api<{ user: User }>('/api/admin/me')
      .then((response) => setUser(response.user))
      .catch(() => navigate('/admin/login'));
  }, [navigate]);

  const handleLogout = async () => {
    await api('/api/auth/logout', { method: 'POST' });
    navigate('/admin/login');
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
            <p className="text-sm text-slate-500">New enquiries</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">0</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <p className="text-sm text-slate-500">Upcoming sessions</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">0</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <p className="text-sm text-slate-500">Alerts</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">0</p>
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
