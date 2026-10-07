import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Bell,
  CheckCheck,
  Calendar,
  ShieldAlert,
  Building2,
  Trash2,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useNotificationStore from '../store/notificationStore';
import Spinner from '@/shared/components/ui/Spinner';

export const NotificationDrawer = () => {
  const navigate = useNavigate();
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'unread' | 'requests' | 'status' | 'arrivals' | 'feedback' | 'bookings'

  const {
    notifications,
    unreadCount,
    isLoading,
    isDrawerOpen,
    closeDrawer,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    dismissNotification,
  } = useNotificationStore();

  useEffect(() => {
    if (isDrawerOpen) {
      fetchNotifications();
    }
  }, [isDrawerOpen, fetchNotifications]);

  const filteredNotifications = notifications.filter((n) => {
    const isRead = n.read ?? n.isRead ?? false;
    const type = String(n.notificationType || n.type || '').toUpperCase();

    if (filterTab === 'unread') return !isRead;
    if (filterTab === 'requests') return type.includes('REQUEST') || type.includes('SUBMIT');
    if (filterTab === 'status') return type.includes('APPROV') || type.includes('REJECT');
    if (filterTab === 'arrivals') return type.includes('CHECK') || type.includes('ARRIV');
    if (filterTab === 'feedback') return type.includes('FEEDBACK') || type.includes('SURVEY');
    if (filterTab === 'bookings') return type.includes('BOOKING') || type.includes('ROOM');
    return true;
  });

  const getNotificationConfig = (type) => {
    const t = String(type || '').toUpperCase();
    if (t.includes('REQUEST') || t.includes('SUBMIT')) {
      return {
        icon: Calendar,
        iconBg: 'bg-sky-50 text-[#00adef] border-sky-200',
        badgeText: 'Visit Request',
        badgeBg: 'bg-sky-50 text-[#00adef] border-sky-200',
      };
    }
    if (t.includes('APPROV')) {
      return {
        icon: Sparkles,
        iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
        badgeText: 'Approved',
        badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    }
    if (t.includes('CHECK') || t.includes('ARRIV')) {
      return {
        icon: Building2,
        iconBg: 'bg-orange-50 text-[#e38524] border-orange-200',
        badgeText: 'Arrival Check-In',
        badgeBg: 'bg-orange-50 text-[#e38524] border-orange-200',
      };
    }
    if (t.includes('FEEDBACK') || t.includes('SURVEY')) {
      return {
        icon: Sparkles,
        iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
        badgeText: 'Guest Survey',
        badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    }
    if (t.includes('REJECT') || t.includes('ALERT')) {
      return {
        icon: ShieldAlert,
        iconBg: 'bg-rose-50 text-rose-600 border-rose-200',
        badgeText: 'Notice / Alert',
        badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
      };
    }
    return {
      icon: Bell,
      iconBg: 'bg-slate-100 text-slate-700 border-slate-200',
      badgeText: 'Notification',
      badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
    };
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const handleNotificationClick = (item) => {
    const isRead = item.read ?? item.isRead ?? false;
    if (!isRead) {
      markAsRead(item.id);
    }
    closeDrawer();

    const type = String(item.notificationType || item.type || '').toUpperCase();
    if (type.includes('BOOKING') || type.includes('ROOM')) {
      navigate('/visits/calendar');
    } else {
      navigate('/my-tracking');
    }
  };

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
            className="fixed inset-0 bg-slate-950/30 backdrop-blur-xs transition-opacity"
          />

          {/* Floating Rounded Modern Drawer Panel */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
            <motion.div
              initial={{ x: '100%', opacity: 0.8 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0.8 }}
              transition={{ type: 'spring', damping: 26, stiffness: 260 }}
              className="w-screen max-w-md my-3 mr-3 h-[calc(100vh-24px)] bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/90 shadow-2xl shadow-slate-900/15 flex flex-col overflow-hidden"
            >
              {/* Header with subtle Brand Accent Gradient */}
              <div className="relative p-5 border-b border-slate-100 bg-linear-to-r from-sky-50/60 via-white to-orange-50/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative p-2.5 rounded-2xl bg-gradient-to-br from-[#00adef] to-[#0093cc] text-white shadow-md shadow-sky-500/25">
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#e38524] rounded-full border-2 border-white animate-pulse" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading font-black text-lg text-[#000000] tracking-tight">
                          Notifications
                        </h3>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 text-[11px] font-black rounded-full bg-[#e38524] text-white shadow-xs">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">Live bank staff alerts & activity stream</p>
                    </div>
                  </div>

                  <button
                    onClick={closeDrawer}
                    className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Filter Switcher & Mark All as Read */}
                <div className="mt-4 pt-3 border-t border-slate-100/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Filter Activity
                  </span>

                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="inline-flex items-center gap-1 font-bold text-xs text-[#00adef] hover:text-[#0093cc] hover:underline transition-colors cursor-pointer px-2 py-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>

                {/* Action Filter Pills */}
                <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                  {[
                    { key: 'all', label: `All (${notifications.length})` },
                    { key: 'unread', label: `Unread (${unreadCount})` },
                    { key: 'requests', label: 'Requests' },
                    { key: 'status', label: 'Approvals' },
                    { key: 'arrivals', label: 'Arrivals' },
                    { key: 'feedback', label: 'Surveys' },
                    { key: 'bookings', label: 'Bookings' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setFilterTab(tab.key)}
                      className={`px-2.5 py-1 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                        filterTab === tab.key
                          ? 'bg-[#00adef] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notification Stream Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {isLoading && notifications.length === 0 ? (
                  <div className="py-24 flex flex-col items-center justify-center space-y-3 text-slate-400">
                    <Spinner size="lg" color="navy" />
                    <p className="text-xs font-semibold">Updating activity stream...</p>
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="py-24 text-center space-y-3">
                    <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto shadow-inner">
                      <CheckCircle2 className="w-8 h-8 text-[#00adef]" />
                    </div>
                    <div>
                      <h4 className="font-heading font-black text-sm text-[#000000]">
                        All Caught Up!
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                        No pending alerts. Incoming visit requests, executive approvals, and VIP check-ins will appear here.
                      </p>
                    </div>
                  </div>
                ) : (
                  filteredNotifications.map((item) => {
                    const isRead = item.read ?? item.isRead ?? false;
                    const config = getNotificationConfig(item.notificationType || item.type);
                    const IconComp = config.icon;

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleNotificationClick(item)}
                        className={`group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer text-left ${
                          isRead
                            ? 'bg-white border-slate-200/70 hover:border-slate-300 hover:shadow-xs'
                            : 'bg-gradient-to-r from-sky-50/50 to-white border-[#00adef]/40 hover:border-[#00adef] shadow-sm'
                        }`}
                      >
                        {/* Top Metadata Row */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-black rounded-lg border uppercase tracking-wider ${config.badgeBg}`}
                          >
                            {config.badgeText}
                          </span>

                          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                            <Clock className="w-3 h-3" />
                            <span>{formatTimeAgo(item.createdAt)}</span>
                          </div>
                        </div>

                        {/* Title & Body */}
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-xl border shrink-0 mt-0.5 ${config.iconBg}`}>
                            <IconComp className="w-4 h-4" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4
                              className={`text-xs leading-snug truncate ${
                                isRead ? 'font-bold text-slate-800' : 'font-black text-[#000000]'
                              }`}
                            >
                              {item.title || 'System Notification'}
                            </h4>

                            <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                              {item.message}
                            </p>
                          </div>
                        </div>

                        {/* Footer Link & Action Buttons */}
                        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-[11px]">
                          {item.referenceId ? (
                            <span className="inline-flex items-center gap-1 font-bold text-[#00adef] hover:underline">
                              <span>View Visit Record</span>
                              <ExternalLink className="w-3 h-3" />
                            </span>
                          ) : (
                            <span />
                          )}

                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!isRead && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(item.id);
                                }}
                                className="text-slate-500 hover:text-[#00adef] text-xs font-bold transition-colors cursor-pointer"
                              >
                                Mark read
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                dismissNotification(item.id);
                              }}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Dismiss"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Unread Glowing Pill Dot */}
                        {!isRead && (
                          <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#00adef] ring-4 ring-sky-100 animate-pulse" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="p-3.5 border-t border-slate-100 bg-slate-50/90 flex items-center justify-between text-xs text-slate-500 px-5">
                <span className="font-semibold">CoopBank Live Feed</span>
                <button
                  onClick={closeDrawer}
                  className="font-bold text-slate-700 hover:text-[#000000] cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default NotificationDrawer;
