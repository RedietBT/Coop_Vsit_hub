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
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useNotificationStore from '../store/notificationStore';
import Button from '@/shared/components/ui/Button';
import Badge from '@/shared/components/ui/Badge';
import Spinner from '@/shared/components/ui/Spinner';

export const NotificationDrawer = () => {
  const navigate = useNavigate();
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'unread'

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
    if (filterTab === 'unread') return !isRead;
    return true;
  });

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'VISIT_REQUEST':
      case 'VISIT_SUBMITTED':
        return { icon: Calendar, color: 'text-[#00adef] bg-sky-50 border-sky-200' };
      case 'VISIT_APPROVED':
        return { icon: Sparkles, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
      case 'VIP_CHECK_IN':
      case 'CHECK_IN':
        return { icon: Building2, color: 'text-[#e38524] bg-orange-50 border-orange-200' };
      case 'SECURITY_ALERT':
      case 'VISIT_REJECTED':
        return { icon: ShieldAlert, color: 'text-rose-600 bg-rose-50 border-rose-200' };
      default:
        return { icon: Bell, color: 'text-slate-600 bg-slate-100 border-slate-200' };
    }
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
    if (!item.isRead) {
      markAsRead(item.id);
    }
    if (item.referenceId) {
      closeDrawer();
      navigate(`/visits/${item.referenceId}`);
    }
  };

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
          />

          {/* Slide-out Drawer Panel */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-screen max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#00adef]/15 text-[#00adef]">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading font-black text-lg text-[#000000]">
                        Notifications
                      </h3>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 text-xs font-black rounded-full bg-[#e38524] text-white">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">Live bank staff alerts & activity</p>
                  </div>
                </div>

                <button
                  onClick={closeDrawer}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs & Mark All Actions */}
              <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between bg-white text-xs">
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                  <button
                    onClick={() => setFilterTab('all')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      filterTab === 'all'
                        ? 'bg-white text-[#000000] shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    All ({notifications.length})
                  </button>
                  <button
                    onClick={() => setFilterTab('unread')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      filterTab === 'unread'
                        ? 'bg-white text-[#000000] shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Unread ({unreadCount})
                  </button>
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-1 font-bold text-[#00adef] hover:text-[#0093cc] transition-colors cursor-pointer"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              {/* Notification Items List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {isLoading && notifications.length === 0 ? (
                  <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
                    <Spinner size="lg" color="navy" />
                    <p className="text-xs font-semibold">Loading notification stream...</p>
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="py-24 text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <Bell className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-sm text-[#000000]">
                        No Notifications
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                        You are all caught up! New visits, approvals, and front desk arrivals will appear here.
                      </p>
                    </div>
                  </div>
                ) : (
                  filteredNotifications.map((item) => {
                    const isRead = item.read ?? item.isRead ?? false;
                    const { icon: ItemIcon, color: iconStyle } = getNotificationIcon(item.notificationType || item.type);
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleNotificationClick(item)}
                        className={`group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                          isRead
                            ? 'bg-white border-slate-200/80 hover:border-slate-300'
                            : 'bg-sky-50/40 border-[#00adef]/30 hover:border-[#00adef] shadow-xs'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Type Icon */}
                          <div className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${iconStyle}`}>
                            <ItemIcon className="w-4 h-4" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center justify-between gap-2">
                              <h4
                                className={`text-xs truncate ${
                                  isRead ? 'font-semibold text-slate-800' : 'font-black text-[#000000]'
                                }`}
                              >
                                {item.title || 'System Notification'}
                              </h4>
                              <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                                {formatTimeAgo(item.createdAt)}
                              </span>
                            </div>

                            <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                              {item.message}
                            </p>

                            {/* Reference Link & Dismiss Action */}
                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-[11px]">
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
                                    className="text-slate-500 hover:text-[#00adef] text-xs font-semibold"
                                  >
                                    Mark read
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    dismissNotification(item.id);
                                  }}
                                  className="text-slate-400 hover:text-rose-600 p-1 rounded-lg"
                                  title="Dismiss"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Unread indicator bar */}
                        {!isRead && (
                          <div className="absolute left-0 top-3 bottom-3 w-1 bg-[#00adef] rounded-r-full" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
                <span>CoopBank Alert Dispatcher</span>
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
