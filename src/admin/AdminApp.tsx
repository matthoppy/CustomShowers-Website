/**
 * The admin dashboard, at /admin.
 *
 * Everything behind GitHub sign-in: the jobs from the designer with their
 * drawings and a fitting sheet, the quote-form enquiries, the site's
 * pictures, Cloudflare traffic and deployments, and the Google Business
 * Profile. Part of the website build; the server side is admin-worker/.
 */

import { useEffect } from 'react';
import { NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { BarChart3, ExternalLink, FileText, Images, Inbox, LayoutDashboard, LogOut, MapPin, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminProvider, AuthCallback, useAdmin } from './auth';
import { ErrorNote, Loading } from './ui';
import { Overview } from './pages/Overview';
import { Jobs } from './pages/Jobs';
import { JobDetailPage } from './pages/JobDetail';
import { FittingSheetPage } from './pages/FittingSheet';
import { Quotes } from './pages/Quotes';
import { Pictures } from './pages/Pictures';
import { Site } from './pages/Site';
import { Google } from './pages/Google';

const CRM_URL = 'https://customshowers-portal.vcwvk4sm9m.workers.dev';

const NAV = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/jobs', label: 'Jobs', icon: Wrench },
  { to: '/admin/quotes', label: 'Quote forms', icon: Inbox },
  { to: '/admin/pictures', label: 'Pictures', icon: Images },
  { to: '/admin/site', label: 'Site', icon: BarChart3 },
  { to: '/admin/google', label: 'Google profile', icon: MapPin },
];

export default function AdminApp() {
  useEffect(() => {
    const previous = document.title;
    document.title = 'Custom Showers · Admin';
    return () => {
      document.title = previous;
    };
  }, []);
  return (
    <AdminProvider>
      <Routes>
        <Route path="auth" element={<AuthCallback />} />
        <Route path="*" element={<Gate />} />
      </Routes>
    </AdminProvider>
  );
}

function Gate() {
  const { user, loading, error } = useAdmin();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loading what="Checking your sign-in" />
      </div>
    );
  }
  if (!user) return <SignIn error={error} />;
  return <Shell />;
}

function SignIn({ error }: { error: string | null }) {
  const { signIn } = useAdmin();
  const location = useLocation();
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-6">
      <div className="w-full max-w-sm rounded-lg border bg-card p-8 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Custom Showers</div>
        <h1 className="mt-1 text-2xl font-bold">Admin dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Jobs from the designer, quote enquiries, the site's pictures, traffic and your Google profile. Sign in with the GitHub
          account that owns the website.
        </p>
        {error && (
          <div className="mt-4">
            <ErrorNote message={error} />
          </div>
        )}
        <Button className="mt-6 w-full" onClick={() => signIn(location.pathname === '/admin/auth' ? '/admin' : location.pathname)}>
          Sign in with GitHub
        </Button>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Only accounts on the dashboard's allow-list can get in.
        </p>
      </div>
    </div>
  );
}

function Shell() {
  const { user, signOut, mock } = useAdmin();
  const location = useLocation();
  const printing = location.pathname.endsWith('/fitting');

  if (printing) {
    // The fitting sheet is a document, not a screen: no navigation around it.
    return (
      <Routes>
        <Route path="jobs/:id/fitting" element={<FittingSheetPage />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[14rem_minmax(0,1fr)]">
      <aside className="border-b bg-muted/30 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-3 px-4 py-3 lg:block lg:px-5 lg:py-5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Custom Showers</div>
            <div className="font-bold">Admin</div>
          </div>
          {mock && (
            <span className="rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200 lg:mt-2 lg:inline-block">
              Sample data
            </span>
          )}
        </div>
        <nav aria-label="Dashboard" className="flex gap-1 overflow-x-auto px-2 pb-2 lg:flex-col lg:px-3 lg:pb-0">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-2 rounded px-3 py-2 text-sm transition-colors duration-150 ${
                  isActive ? 'bg-background font-semibold shadow-sm' : 'text-muted-foreground hover:bg-background/70 hover:text-foreground'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
          <a
            href={CRM_URL}
            target="_blank"
            rel="noreferrer"
            className="flex shrink-0 items-center gap-2 rounded px-3 py-2 text-sm text-muted-foreground transition-colors duration-150 hover:bg-background/70 hover:text-foreground"
          >
            <FileText className="h-4 w-4" />
            CRM portal
            <ExternalLink className="ml-auto h-3 w-3" />
          </a>
        </nav>
        <div className="hidden px-5 py-5 lg:block">
          <div className="flex items-center gap-2">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-7 w-7 rounded-full" />
            ) : (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {(user?.login || '?').slice(0, 1).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{user?.name || user?.login}</div>
              <div className="truncate text-xs text-muted-foreground">@{user?.login}</div>
            </div>
          </div>
          <button type="button" onClick={signOut} className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-6xl">
          <Routes>
            <Route index element={<Overview />} />
            <Route path="jobs" element={<Jobs />} />
            <Route path="jobs/:id" element={<JobDetailPage />} />
            <Route path="quotes" element={<Quotes />} />
            <Route path="pictures" element={<Pictures />} />
            <Route path="site" element={<Site />} />
            <Route path="google" element={<Google />} />
            <Route path="*" element={<Overview />} />
          </Routes>
        </div>
        <div className="mx-auto mt-10 max-w-6xl border-t pt-4 text-xs text-muted-foreground lg:hidden">
          Signed in as @{user?.login}.{' '}
          <button type="button" onClick={signOut} className="underline underline-offset-2">
            Sign out
          </button>
        </div>
      </main>
    </div>
  );
}
