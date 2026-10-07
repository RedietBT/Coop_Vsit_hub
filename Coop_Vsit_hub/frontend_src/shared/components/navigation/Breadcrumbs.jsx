import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const ROUTE_LABELS = {
  dashboard: 'Executive Analytics',
  visits: 'Visits Management',
  calendar: 'Booking Calendar',
  'security-desk': 'Security Front Desk',
  organizations: 'Partner Organizations',
  guests: 'Individual Guests',
  'feedback-analytics': 'Customer Feedback',
  users: 'Staff User Management',
  notifications: 'Notification Center',
};

export const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) return null;

  return (
    <nav className="flex items-center gap-2 text-xs text-slate-500 mb-4 select-none" aria-label="Breadcrumb">
      <Link
        to="/dashboard"
        className="flex items-center gap-1 hover:text-[#00adef] transition-colors font-medium"
      >
        <Home className="w-3.5 h-3.5" />
        <span>Home</span>
      </Link>

      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const label = ROUTE_LABELS[value] || value;

        return (
          <React.Fragment key={to}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {isLast ? (
              <span className="font-bold text-[#000000] truncate max-w-xs">{label}</span>
            ) : (
              <Link to={to} className="hover:text-[#00adef] transition-colors font-medium">
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
