/**
 * The admin dashboard, at /admin.
 *
 * Everything behind GitHub sign-in: the jobs from the designer with their
 * drawings and a fitting sheet, the quote-form enquiries, the website photos,
 * Cloudflare traffic and deployments, and the Google Business Profile. Part of
 * the website build; the server side is admin-worker/.
 */

import { useEffect } from 'react';
import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { BarChart3, ExternalLink, FileText, Images, Inbox, LayoutDashboard, LogOut, MapPin, Wrench } from 'lucide-react';
import logo from '@/assets/Custom Showers Main1.png';
import { Button } from '@/components/ui/button';
import { AdminProvider, AuthCallback, useAdmin } from './auth';
import { SheetsProvider, useSheets } from './sheets';
import { ErrorNote, Loading } from './ui';
import { Overview } from './pages/Overview';
import { Jobs } from './pages/Jobs';
import { JobDetailPage } from './pages/JobDetail';
import { FittingSheetPage } from './pages/FittingSheet';
import { Quotes } from './pages/Quotes';
import { JobEditor, PhotosHome, SlotEditor } from './pages/Photos';
import { Site } from './pages/Site';
import { Google } from './pages/Google';

const CRM_URL = 'https://customshowers-portal.vcwvk4sm9m.workers.dev';

const NAV = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/jobs', label: 'Jobs', icon: Wrench },
  { to: '/admin/quotes', label: 'Quote forms', icon: Inbox },
  { to: '/admin/photos', label: 'Photos', icon: Images },
  { to: '/admin/site', label: 'Site', icon: BarChart3 },
  { to: '/admin/google', label: 'Google profile', icon: MapPin },
];

export default function AdminApp() {
  useEffect(() => {
    const previous = document.title;
    document.title = 'Custom Showers · Admin';
    let robots = document.head.querySelector('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement('meta');
      robots.setAttribute('name', 'robots');
      document.head.appendChild(robots);
    }
    const previousRobots = robots.getAttribute('content');
    robots.setAttribute('content', 'noindex, nofollow');
    return () => {
      document.title = previous;
      if (previousRobots) robots.setAttribute('content', previousRobots);
    };
  }, []);
  return (
    <AdminProvider>
      <SheetsProvider>
        <Routes>
          <Route path="auth" element={<AuthCallback />} />
          <Route path="*" element={<Gate />} />
        </Routes>
      </SheetsProvider>
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

function GitHubMark() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-5 w-5">
      <path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.4-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5z" />
    </svg>
  );
}

function SignIn({ error }: { error: string | null }) {
  const { signIn } = useAdmin();
  const location = useLocation();
  const back = location.pathname === '/admin/auth' ? '/admin' : location.pathname;
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[640px] flex-col justify-center px-4 py-8 min-h-[100dvh]">
      <img src={logo} alt="Custom Showers" className="mb-10 h-16 w-auto self-start" />
      <h1 className="text-[28px] font-bold leading-tight tracking-tight">Website admin</h1>
      <p className="mt-2 max-w-[36ch] text-muted-foreground">
        Jobs from the designer, quote enquiries, the website photos, traffic and your Google profile.
      </p>
      {error && (
        <div className="mt-5">
          <ErrorNote message={error} />
        </div>
      )}
      <Button className="mt-7 h-[52px] w-full text-base" onClick={() => signIn(back)}>
        <GitHubMark />
        Sign in with GitHub
      </Button>
      <p className="mt-5 text-sm text-muted-foreground">You only need to do this once on each phone. Only accounts on the dashboard's list get in.</p>
    </main>
  );
}

function Avatar({ className = '' }: { className?: string }) {
  const { user } = useAdmin();
  if (user?.avatarUrl) return <img src={user.avatarUrl} alt="" className={`rounded-full bg-muted ${className}`} />;
  return (
    <span className={`flex items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground ${className}`}>
      {(user?.login || '?').slice(0, 1).toUpperCase()}
    </span>
  );
}

function Shell() {
  const { user, signOut, mock } = useAdmin();
  const sheets = useSheets();
  const location = useLocation();
  const printing = location.pathname.endsWith('/fitting');

  const askSignOut = async () => {
    const yes = await sheets.confirm({
      title: 'Sign out?',
      text: 'You’ll need to sign in again to use the dashboard on this device.',
      action: 'Sign out',
    });
    if (yes) await signOut();
  };

  if (printing) {
    // The fitting sheet is a document, not a screen: no navigation around it.
    return (
      <Routes>
        <Route path="jobs/:id/fitting" element={<FittingSheetPage />} />
      </Routes>
    );
  }

  const section = NAV.find((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)))?.label || 'Overview';

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[14rem_minmax(0,1fr)]">
      <aside className="sticky top-0 z-30 border-b bg-background lg:static lg:border-b-0 lg:border-r lg:bg-muted/30">
        <div className="flex min-h-[60px] items-center gap-3 px-4 lg:block lg:px-5 lg:py-5">
          <img src={logo} alt="Custom Showers" className="h-8 w-auto lg:h-10" />
          <span className="flex-1 truncate text-[17px] font-semibold lg:hidden">{section}</span>
          <div className="hidden lg:mt-3 lg:block">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Custom Showers</div>
            <div className="font-bold">Admin</div>
          </div>
          {mock && (
            <span className="rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200 lg:mt-2 lg:inline-block">
              Sample data
            </span>
          )}
          <button
            type="button"
            onClick={askSignOut}
            aria-label={`Signed in as ${user?.login || ''}. Sign out`}
            className="flex h-11 w-11 items-center justify-center lg:hidden"
          >
            <Avatar className="h-8 w-8" />
          </button>
        </div>
        <nav aria-label="Dashboard" className="flex gap-1 overflow-x-auto px-2 pb-2 [scrollbar-width:none] lg:flex-col lg:px-3 lg:pb-0">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-2 rounded px-3 py-2 text-sm transition-colors duration-150 ${
                  isActive ? 'bg-muted font-semibold lg:bg-background lg:shadow-sm' : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground lg:hover:bg-background/70'
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
            className="flex shrink-0 items-center gap-2 rounded px-3 py-2 text-sm text-muted-foreground transition-colors duration-150 hover:bg-muted/70 hover:text-foreground lg:hover:bg-background/70"
          >
            <FileText className="h-4 w-4" />
            CRM portal
            <ExternalLink className="ml-auto h-3 w-3" />
          </a>
        </nav>
        <div className="hidden px-5 py-5 lg:block">
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7" />
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{user?.name || user?.login}</div>
              <div className="truncate text-xs text-muted-foreground">@{user?.login}</div>
            </div>
          </div>
          <button type="button" onClick={askSignOut} className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
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
            <Route path="photos" element={<PhotosHome />} />
            <Route path="photos/new" element={<JobEditor />} />
            <Route path="photos/page/:slot" element={<SlotEditor />} />
            <Route path="photos/page/:slot/:index" element={<SlotEditor />} />
            <Route path="photos/:type/:index" element={<JobEditor />} />
            <Route path="pictures" element={<Navigate to="/admin/photos" replace />} />
            <Route path="site" element={<Site />} />
            <Route path="google" element={<Google />} />
            <Route path="*" element={<Overview />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
