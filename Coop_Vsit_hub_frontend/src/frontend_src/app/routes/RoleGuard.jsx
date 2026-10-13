import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuthStore from '@/modules/auth/store/authStore';
import Button from '@/shared/components/ui/Button';

export const RoleGuard = ({ allowedRoles = [], children }) => {
  const { user, hasAnyRole } = useAuthStore();

  const isAuthorized = allowedRoles.length === 0 || hasAnyRole(allowedRoles);

  if (!isAuthorized) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 text-center">
        <div className="max-w-md p-8 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-9 h-9" />
          </div>

          <h3 className="font-heading font-black text-2xl text-[#000000]">
            Access Restricted
          </h3>

          <p className="text-sm text-slate-500 leading-relaxed">
            You do not have the required role permissions ({allowedRoles.join(', ')}) to view this section.
          </p>

          <div className="pt-2">
            <Link to="/dashboard">
              <Button variant="orange" icon={ArrowLeft}>
                Return to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default RoleGuard;
