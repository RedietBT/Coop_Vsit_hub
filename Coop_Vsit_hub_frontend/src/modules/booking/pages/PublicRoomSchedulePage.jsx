import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  Coffee,
  RefreshCw,
  Tv,
  CheckCircle2,
  AlertCircle,
  Building,
  ChevronRight,
  ChevronLeft,
  Filter,
  Maximize2,
  Minimize2,
  LogIn,
  Search,
  Sparkles,
  Info,
  CalendarDays,
  DoorOpen,
  Briefcase,
  ShieldCheck,
  UserCheck,
  Sun,
  Moon,
  Smile
} from 'lucide-react';
import publicRoomScheduleApi from '../api/publicRoomScheduleApi';

// Format time to 12-hour AM/PM in Africa/Addis_Ababa timezone
const formatTime12Hr = (instantStr) => {
  if (!instantStr) return '—';
  try {
    const d = new Date(instantStr);
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Africa/Addis_Ababa',
    }).format(d);
  } catch {
    return '—';
  }
};

// Format date nicely e.g. "Monday, Nov 2, 2026"
const formatDateHeader = (dateStr) => {
  if (!dateStr) return '';
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(dateObj);
  } catch {
    return dateStr;
  }
};

// Get today's ISO date string in Addis Ababa timezone
const getTodayIsoStr = () => {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Addis_Ababa',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  } catch {
    return new Date().toISOString().split('T')[0];
  }
};

export const PublicRoomSchedulePage = () => {
  // Theme state: Bright Mode (Light) vs Dark Mode (TV display)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      return localStorage.getItem('coop_public_display_theme') !== 'light';
    } catch {
      return true;
    }
  });

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('coop_public_display_theme', next ? 'dark' : 'light');
      } catch (e) {
        console.warn('Failed to save theme in localStorage', e);
      }
      return next;
    });
  };

  const [rooms, setRooms] = useState([]);
  const [selectedRoomName, setSelectedRoomName] = useState('all');
  const [selectedDate, setSelectedDate] = useState(getTodayIsoStr);
  const [scheduleData, setScheduleData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Auto-refresh countdown (60 seconds)
  const REFRESH_INTERVAL_SEC = 60;
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL_SEC);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [lastUpdatedTime, setLastUpdatedTime] = useState(null);

  // Current live clock (Addis Ababa time)
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  // Search filter inside booking items
  const [searchTerm, setSearchTerm] = useState('');

  // Status filter for bookings (all, ongoing, upcoming, completed)
  const [statusFilter, setStatusFilter] = useState('all');

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  // Live clock tick
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const timeStr = new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: 'Africa/Addis_Ababa',
      }).format(now);
      setCurrentTimeStr(timeStr);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch active rooms on mount
  useEffect(() => {
    const loadRooms = async () => {
      try {
        const res = await publicRoomScheduleApi.getPublicRooms();
        setRooms(res || []);
      } catch (err) {
        console.error('Failed to load meeting rooms for public display', err);
      }
    };
    loadRooms();
  }, []);

  // Fetch schedule data
  const fetchSchedule = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const params = {
        date: selectedDate,
      };
      if (selectedRoomName && selectedRoomName !== 'all') {
        params.roomName = selectedRoomName;
      }
      const data = await publicRoomScheduleApi.getTodaySchedule(params);
      setScheduleData(data);
      if (data?.rooms && data.rooms.length > 0) {
        setRooms(data.rooms);
      }
      setError(null);
      setLastUpdatedTime(new Date());
    } catch (err) {
      console.error('Failed to load room schedule', err);
      setError('Unable to load schedule data from database. Please check your network or try again.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, selectedRoomName]);

  // Initial and param change trigger
  useEffect(() => {
    fetchSchedule(true);
    setCountdown(REFRESH_INTERVAL_SEC);
  }, [fetchSchedule]);

  // 60-Second Auto-refresh Timer
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchSchedule(false);
          return REFRESH_INTERVAL_SEC;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefreshEnabled, fetchSchedule]);

  // Manual refresh handler
  const handleManualRefresh = () => {
    fetchSchedule(true);
    setCountdown(REFRESH_INTERVAL_SEC);
  };

  // Date step helper (yesterday / tomorrow)
  const handleDateStep = (days) => {
    try {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      dt.setDate(dt.getDate() + days);
      const yyyy = dt.getFullYear();
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const dd = String(dt.getDate()).padStart(2, '0');
      setSelectedDate(`${yyyy}-${mm}-${dd}`);
    } catch {
      setSelectedDate(getTodayIsoStr());
    }
  };

  const handleResetToday = () => {
    setSelectedDate(getTodayIsoStr());
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Filtered bookings
  const bookings = scheduleData?.bookings || [];
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Room match if a specific room is selected
      if (selectedRoomName !== 'all') {
        const selLower = selectedRoomName.toLowerCase();
        const roomLower = (b.roomName || '').toLowerCase();
        if (!roomLower.includes(selLower) && !selLower.includes(roomLower)) {
          return false;
        }
      }

      // Status filter
      if (statusFilter === 'ongoing' && !b.isOngoing) return false;
      if (statusFilter === 'upcoming' && !b.isUpcoming) return false;
      if (statusFilter === 'completed' && !b.isCompleted) return false;

      // Text search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const titleMatch = (b.meetingTitle || '').toLowerCase().includes(q);
        const bookerMatch = (b.bookedByName || '').toLowerCase().includes(q);
        const deptMatch = (b.hostDepartment || '').toLowerCase().includes(q);
        const roomMatch = (b.roomName || '').toLowerCase().includes(q);
        const codeMatch = (b.bookingCode || '').toLowerCase().includes(q);
        if (!titleMatch && !bookerMatch && !deptMatch && !roomMatch && !codeMatch) {
          return false;
        }
      }
      return true;
    });
  }, [bookings, selectedRoomName, statusFilter, searchTerm]);

  // Selected Room Entity (when specific room is chosen)
  const currentRoomEntity = useMemo(() => {
    if (!selectedRoomName || selectedRoomName === 'all') return null;
    const lower = selectedRoomName.toLowerCase();
    return (
      rooms.find(
        (r) =>
          r.name?.toLowerCase() === lower ||
          r.name?.toLowerCase().includes(lower) ||
          lower.includes(r.name?.toLowerCase())
      ) || null
    );
  }, [rooms, selectedRoomName]);

  // Is today being viewed?
  const isViewingToday = selectedDate === getTodayIsoStr();

  // Rooms Occupancy Map for the "All Rooms" view
  const roomOccupancyMap = useMemo(() => {
    const map = new Map();
    // Default all active rooms to available
    rooms.forEach((r) => {
      map.set(r.name, {
        room: r,
        isOccupied: false,
        currentBooking: null,
        nextBooking: null,
        todayCount: 0,
      });
    });

    // Populate with real bookings from DB
    bookings.forEach((b) => {
      const foundRoom = rooms.find(
        (r) =>
          r.name?.toLowerCase() === (b.roomName || '').toLowerCase() ||
          r.name?.toLowerCase().includes((b.roomName || '').toLowerCase()) ||
          (b.roomName || '').toLowerCase().includes(r.name?.toLowerCase())
      );
      const roomKey = foundRoom ? foundRoom.name : b.roomName;
      if (!map.has(roomKey)) {
        map.set(roomKey, {
          room: foundRoom || { name: b.roomName },
          isOccupied: false,
          currentBooking: null,
          nextBooking: null,
          todayCount: 0,
        });
      }
      const entry = map.get(roomKey);
      entry.todayCount += 1;

      if (b.isOngoing) {
        entry.isOccupied = true;
        entry.currentBooking = b;
      } else if (b.isUpcoming && !entry.nextBooking) {
        entry.nextBooking = b;
      }
    });

    return Array.from(map.values());
  }, [rooms, bookings]);

  // Dynamic Theme Class Helpers
  const bgClass = isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800';
  const headerClass = isDarkMode
    ? 'bg-slate-900/95 border-slate-800 shadow-xl'
    : 'bg-white/95 border-slate-200 shadow-sm';
  const cardClass = isDarkMode
    ? 'bg-slate-900/80 border-slate-800 text-slate-100 shadow-lg'
    : 'bg-white border-slate-200 text-slate-800 shadow-sm';
  const barClass = isDarkMode
    ? 'bg-slate-900/90 border-slate-800 text-slate-200'
    : 'bg-white border-slate-200 text-slate-700 shadow-sm';
  const inputClass = isDarkMode
    ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500 focus:border-[#00adef]'
    : 'bg-slate-100 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#00adef]';
  const buttonSecondaryClass = isDarkMode
    ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white'
    : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700 hover:text-slate-900';
  const textMuted = isDarkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <div
      ref={containerRef}
      className={`min-h-screen flex flex-col font-sans selection:bg-[#00adef] selection:text-white transition-colors duration-200 ${bgClass}`}
    >
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. TOP LIVE HEADER & KIOSK STATUS BAR
      ───────────────────────────────────────────────────────────────────────────── */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b px-4 sm:px-8 py-3.5 transition-all ${headerClass}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo & Platform Title */}
          <div className="flex items-center gap-3.5 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00adef] to-sky-400 p-0.5 shadow-lg shadow-sky-500/20 flex items-center justify-center">
                <div className={`w-full h-full rounded-[10px] flex items-center justify-center ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
                  <Building className="w-5 h-5 text-[#00adef]" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className={`text-lg font-black tracking-tight flex items-center gap-1.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    CoopBank <span className="text-[#00adef]">VisitHub</span>
                  </h1>
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Live Schedule
                  </span>
                </div>
                <p className={`text-xs font-medium ${textMuted}`}>
                  Cooperative Bank of Oromia • Live Meeting Room Schedule (No Sign-In Required)
                </p>
              </div>
            </div>

            {/* Quick Staff Login Link (Mobile) */}
            <div className="md:hidden flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className={`p-2 rounded-xl border ${buttonSecondaryClass}`}
                title={isDarkMode ? 'Switch to Bright Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
              </button>
              <Link
                to="/login"
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-[#00adef] text-white hover:bg-sky-500 transition-colors flex items-center gap-1 shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Staff Login</span>
              </Link>
            </div>
          </div>

          {/* Center/Right: Live Clock, Auto-Refresh Status, Theme Toggle & Kiosk Controls */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            {/* Live Clock (EAT) */}
            <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-mono text-xs ${isDarkMode ? 'bg-slate-950/80 border-slate-800 text-sky-400' : 'bg-slate-100 border-slate-300 text-sky-700'}`}>
              <Clock className="w-3.5 h-3.5 text-[#00adef]" />
              <span className="font-bold text-sm tracking-wide">{currentTimeStr || '12:00:00 PM'}</span>
              <span className={`text-[10px] uppercase font-semibold ${textMuted}`}>EAT (UTC+3)</span>
            </div>

            {/* Auto-Refresh Counter Pill */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-100 border-slate-300'}`}>
              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={isLoading}
                className="text-slate-400 hover:text-[#00adef] transition-colors"
                title="Refresh Schedule Now"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#00adef]' : ''}`} />
              </button>
              <span className={textMuted}>
                {autoRefreshEnabled ? (
                  <>Syncs in <strong className={isDarkMode ? 'text-white' : 'text-slate-800'}>{countdown}s</strong></>
                ) : (
                  'Sync Paused'
                )}
              </span>
              <button
                type="button"
                onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                  autoRefreshEnabled
                    ? 'text-emerald-500 bg-emerald-500/10'
                    : 'text-amber-500 bg-amber-500/10'
                }`}
              >
                {autoRefreshEnabled ? 'Live' : 'Paused'}
              </button>
            </div>

            {/* Bright / Dark Mode Switch */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold ${
                isDarkMode
                  ? 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700'
                  : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
              }`}
              title={isDarkMode ? 'Switch to Bright Mode' : 'Switch to Dark TV Mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
              <span className="hidden sm:inline">{isDarkMode ? 'Bright Mode' : 'Dark Mode'}</span>
            </button>

            {/* Fullscreen / TV Mode Toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className={`p-2 rounded-xl border transition-all ${buttonSecondaryClass}`}
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter TV Display Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4 text-[#00adef]" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Staff Portal Login link (Desktop) */}
            <Link
              to="/login"
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-[#00adef] text-white hover:bg-sky-500 transition-all shadow-md shadow-sky-500/20"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Staff Login</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. FILTER & ROOM SELECTOR BAR
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className={`border-b px-4 sm:px-8 py-3 transition-colors ${barClass}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Room Selector Dropdown */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${textMuted}`}>
              <DoorOpen className="w-4 h-4 text-[#00adef]" />
              Select Room:
            </span>

            <div className="relative flex-1 sm:w-80">
              <select
                value={selectedRoomName}
                onChange={(e) => setSelectedRoomName(e.target.value)}
                className={`w-full appearance-none pl-3.5 pr-8 py-2 rounded-xl text-xs font-bold focus:outline-none transition-all cursor-pointer ${inputClass}`}
              >
                <option value="all">🏢 All Meeting Rooms ({rooms.length} facilities)</option>
                {rooms.map((r) => (
                  <option key={r.id || r.name} value={r.name}>
                    📍 {r.name} {r.capacity ? `(Cap: ${r.capacity})` : ''}
                  </option>
                ))}
              </select>
              <ChevronRight className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
            </div>
          </div>

          {/* Date Selector & Day Navigation */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              type="button"
              onClick={() => handleDateStep(-1)}
              className={`p-2 rounded-xl border transition-all ${buttonSecondaryClass}`}
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className={`px-4 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-bold relative ${
              isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
            }`}>
              <Calendar className="w-3.5 h-3.5 text-[#00adef]" />
              <span>{formatDateHeader(selectedDate)}</span>
              {isViewingToday && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-500 border border-emerald-500/20">
                  Today
                </span>
              )}
              {/* Native Date Picker trigger */}
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                id="hidden-date-picker"
                title="Choose Date"
              />
              <CalendarDays className="w-4 h-4 text-slate-400 hover:text-[#00adef] transition-colors ml-1" />
            </div>

            <button
              type="button"
              onClick={() => handleDateStep(1)}
              className={`p-2 rounded-xl border transition-all ${buttonSecondaryClass}`}
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {!isViewingToday && (
              <button
                type="button"
                onClick={handleResetToday}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-sky-500/10 text-sky-500 hover:bg-sky-500/20 border border-sky-500/20 transition-all"
              >
                Back to Today
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          3. MAIN CONTENT AREA
      ───────────────────────────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Error Banner */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center justify-between text-red-500 text-sm">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={handleManualRefresh}
              className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-xs font-bold text-red-500 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* ─── Summary Stat Cards (Live Operational Metrics) ─── */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1: Total Meetings Today */}
          <div className={`rounded-2xl p-4 border flex items-center gap-4 transition-all ${cardClass}`}>
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-[#00adef]">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${textMuted}`}>Bookings Today</p>
              <h3 className={`text-2xl font-black mt-0.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {scheduleData?.totalBookingsToday ?? filteredBookings.length}
              </h3>
            </div>
          </div>

          {/* Card 2: Rooms In Use Right Now */}
          <div className={`rounded-2xl p-4 border flex items-center gap-4 transition-all ${cardClass}`}>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 relative">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute top-2 right-2 animate-ping" />
              <DoorOpen className="w-6 h-6" />
            </div>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${textMuted}`}>Rooms in Use</p>
              <h3 className="text-2xl font-black text-emerald-500 mt-0.5">
                {scheduleData?.roomsInUse ?? 0}
              </h3>
            </div>
          </div>

          {/* Card 3: Rooms Free Now */}
          <div className={`rounded-2xl p-4 border flex items-center gap-4 transition-all ${cardClass}`}>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${textMuted}`}>Rooms Available</p>
              <h3 className={`text-2xl font-black mt-0.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {scheduleData?.roomsAvailable ?? rooms.length}
              </h3>
            </div>
          </div>

          {/* Card 4: Total Attendees Expected */}
          <div className={`rounded-2xl p-4 border flex items-center gap-4 transition-all ${cardClass}`}>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${textMuted}`}>Total Attendees</p>
              <h3 className={`text-2xl font-black mt-0.5 ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}`}>
                {scheduleData?.totalExpectedAttendees ?? 0}
              </h3>
            </div>
          </div>
        </section>

        {/* ─── SPECIFIC ROOM BANNER (when single room is chosen) ─── */}
        {currentRoomEntity && (
          <section className={`rounded-3xl p-6 border relative overflow-hidden transition-all ${
            isDarkMode
              ? 'bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900/70 border-slate-800 text-white'
              : 'bg-gradient-to-r from-white via-slate-50 to-sky-50/30 border-slate-200 text-slate-900 shadow-sm'
          }`}>
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#00adef]/10 to-transparent pointer-events-none" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  {currentRoomEntity.department && (
                    <span className="px-2.5 py-0.5 text-xs font-bold uppercase rounded-lg bg-sky-500/10 text-sky-500 border border-sky-500/20">
                      {currentRoomEntity.department}
                    </span>
                  )}
                  {currentRoomEntity.floorLocation && (
                    <span className={`text-xs flex items-center gap-1 ${textMuted}`}>
                      <MapPin className="w-3.5 h-3.5 text-[#00adef]" />
                      {currentRoomEntity.floorLocation}
                    </span>
                  )}
                </div>
                <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {currentRoomEntity.name}
                </h2>
                {currentRoomEntity.description && (
                  <p className={`text-sm max-w-2xl ${textMuted}`}>
                    {currentRoomEntity.description}
                  </p>
                )}
                {/* Supervisor / Custodian Info from DB */}
                {currentRoomEntity.assignedUserName && (
                  <div className={`flex items-center gap-2 text-xs pt-1 ${textMuted}`}>
                    <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Room Custodian / Supervisor: <strong className={isDarkMode ? 'text-slate-200' : 'text-slate-800'}>{currentRoomEntity.assignedUserName}</strong></span>
                    {currentRoomEntity.contactEmail && (
                      <span className="text-slate-400">({currentRoomEntity.contactEmail})</span>
                    )}
                  </div>
                )}
              </div>

              {/* Status & Amenities Pill */}
              <div className="flex flex-col sm:items-end gap-3">
                {/* Live Occupancy Status */}
                {filteredBookings.some((b) => b.isOngoing) ? (
                  <div className="px-4 py-2 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-2.5 shadow-sm">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-emerald-500">Current Status</p>
                      <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Occupied • Meeting in Progress</p>
                    </div>
                  </div>
                ) : (
                  <div className="px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2.5">
                    <span className="text-xl">😊</span>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-emerald-500">Current Status</p>
                      <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Nothing scheduled, it's free! 😊</p>
                    </div>
                  </div>
                )}

                {/* Refreshments info if in DB */}
                {currentRoomEntity.refreshmentsAvailable && (
                  <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-xl border ${
                    isDarkMode
                      ? 'text-amber-300 bg-amber-500/10 border-amber-500/20'
                      : 'text-amber-800 bg-amber-50 border-amber-200'
                  }`}>
                    <Coffee className="w-3.5 h-3.5" />
                    <span>Refreshments: {currentRoomEntity.refreshmentOptions || 'Available on request'}</span>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ─── ALL ROOMS STATUS GRID (when "All Meeting Rooms" is selected) ─── */}
        {selectedRoomName === 'all' && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${textMuted}`}>
                <DoorOpen className="w-4 h-4 text-[#00adef]" />
                Live Room Status Matrix
              </h3>
              <span className={`text-xs font-medium ${textMuted}`}>
                Click any room to filter its schedule
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {roomOccupancyMap.map(({ room, isOccupied, currentBooking, nextBooking, todayCount }) => (
                <div
                  key={room.id || room.name}
                  onClick={() => setSelectedRoomName(room.name)}
                  className={`group relative rounded-2xl p-4 border transition-all cursor-pointer ${
                    isOccupied
                      ? isDarkMode
                        ? 'bg-gradient-to-br from-emerald-950/40 to-slate-900/90 border-emerald-500/40 hover:border-emerald-400'
                        : 'bg-emerald-50/50 border-emerald-300 hover:border-emerald-500 shadow-sm'
                      : isDarkMode
                      ? 'bg-slate-900/70 border-slate-800 hover:border-sky-500/50 hover:bg-slate-900'
                      : 'bg-white border-slate-200 hover:border-sky-400 hover:shadow-md'
                  }`}
                >
                  {/* Status header */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs truncate max-w-[150px] ${textMuted}`}>
                      {room.floorLocation || room.department || 'Meeting Space'}
                    </span>
                    {isOccupied ? (
                      <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        In Use
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1">
                        <span>Free 😊</span>
                      </span>
                    )}
                  </div>

                  {/* Room Name */}
                  <h4 className={`text-base font-bold mt-1.5 group-hover:text-[#00adef] transition-colors truncate ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}>
                    {room.name}
                  </h4>

                  {/* Room Details / Booker Info from DB */}
                  <div className={`mt-3 pt-3 border-t space-y-1.5 text-xs ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                    {isOccupied && currentBooking ? (
                      <div>
                        <p className="text-[11px] text-emerald-500 font-semibold truncate">
                          Reserved by: <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>{currentBooking.bookedByName || currentBooking.bookedByEmail || 'Staff'}</strong>
                        </p>
                        <p className={`text-[11px] truncate ${textMuted}`}>
                          {currentBooking.meetingTitle} • until {formatTime12Hr(currentBooking.scheduledEndTime)}
                        </p>
                      </div>
                    ) : nextBooking ? (
                      <div>
                        <p className="text-[11px] text-sky-500 font-medium truncate">
                          Next: {formatTime12Hr(nextBooking.scheduledStartTime)} - {formatTime12Hr(nextBooking.scheduledEndTime)}
                        </p>
                        <p className={`text-[11px] truncate ${textMuted}`}>
                          By: {nextBooking.bookedByName || nextBooking.bookedByEmail || 'Staff'}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[11px] text-emerald-500 font-semibold">
                        <span>😊</span>
                        <span>Nothing scheduled, it's free!</span>
                      </div>
                    )}
                  </div>

                  {/* Footer details */}
                  <div className={`mt-3 flex items-center justify-between text-[11px] ${textMuted}`}>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-400" />
                      Cap: {room.capacity || '—'}
                    </span>
                    <span className="text-[#00adef] font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      View Schedule <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── DAILY BOOKING SCHEDULE & TIMELINE TABLE ─── */}
        <section className={`rounded-3xl p-6 border space-y-5 transition-all ${cardClass}`}>
          {/* Schedule Header & Search / Filters */}
          <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b ${
            isDarkMode ? 'border-slate-800' : 'border-slate-200'
          }`}>
            <div>
              <h3 className={`text-lg font-black flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                <Clock className="w-5 h-5 text-[#00adef]" />
                {selectedRoomName === 'all'
                  ? "Today's Schedule Across All Meeting Rooms"
                  : `Today's Schedule for ${selectedRoomName}`}
              </h3>
              <p className={`text-xs mt-0.5 ${textMuted}`}>
                Showing {filteredBookings.length} reservation(s) from database on {formatDateHeader(selectedDate)}
              </p>
            </div>

            {/* Filter Pills & Search */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search booker, title, room..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-8 pr-3 py-1.5 rounded-xl text-xs w-48 sm:w-60 focus:outline-none transition-all ${inputClass}`}
                />
              </div>

              {/* Status Filter Buttons */}
              <div className={`flex items-center p-0.5 rounded-xl border text-xs font-semibold ${
                isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-300'
              }`}>
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    statusFilter === 'all' ? 'bg-[#00adef] text-white shadow-sm' : textMuted
                  }`}
                >
                  All ({bookings.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('ongoing')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    statusFilter === 'ongoing' ? 'bg-emerald-600 text-white shadow-sm' : textMuted
                  }`}
                >
                  Ongoing ({bookings.filter((b) => b.isOngoing).length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('upcoming')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    statusFilter === 'upcoming' ? 'bg-sky-600 text-white shadow-sm' : textMuted
                  }`}
                >
                  Upcoming ({bookings.filter((b) => b.isUpcoming).length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('completed')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    statusFilter === 'completed' ? 'bg-slate-700 text-white shadow-sm' : textMuted
                  }`}
                >
                  Completed ({bookings.filter((b) => b.isCompleted).length})
                </button>
              </div>
            </div>
          </div>

          {/* Schedule List or Empty State */}
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-[#00adef] animate-spin mx-auto" />
              <p className={`text-sm font-medium ${textMuted}`}>Fetching live reservations from database...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            /* ─── Empty state: Nothing scheduled, it's free with a smiley face! ─── */
            <div className={`py-16 text-center space-y-4 rounded-3xl border border-dashed p-8 transition-all ${
              isDarkMode
                ? 'bg-slate-950/60 border-slate-800 text-white'
                : 'bg-emerald-50/40 border-emerald-200 text-slate-800'
            }`}>
              <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-4xl shadow-sm">
                😊
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                  <span>Nothing Scheduled</span>
                  <span>•</span>
                  <span>It's Free! 😊</span>
                </div>
                <h4 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {selectedRoomName !== 'all'
                    ? `${selectedRoomName} is Free Today! 😊`
                    : "Nothing scheduled today — It's completely free! 😊"}
                </h4>
                <p className={`text-xs ${textMuted}`}>
                  {selectedRoomName !== 'all'
                    ? `No reservations found in the database for ${selectedRoomName} on ${formatDateHeader(selectedDate)}. The room is completely free and available for use.`
                    : `No bookings found in the database for ${formatDateHeader(selectedDate)}. All meeting facilities are 100% free and ready for reservation.`}
                </p>
              </div>
              {selectedRoomName !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedRoomName('all')}
                  className={`px-4 py-2 text-xs font-bold rounded-xl border transition-colors ${buttonSecondaryClass}`}
                >
                  View All Meeting Rooms
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredBookings.map((b) => {
                const startTimeStr = formatTime12Hr(b.scheduledStartTime);
                const endTimeStr = formatTime12Hr(b.scheduledEndTime);

                return (
                  <div
                    key={b.id || b.bookingCode}
                    className={`relative rounded-2xl p-5 border transition-all ${
                      b.isOngoing
                        ? isDarkMode
                          ? 'bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900/90 border-emerald-500/50 shadow-emerald-500/10 shadow-lg'
                          : 'bg-emerald-50/80 border-emerald-300 shadow-sm'
                        : b.isUpcoming
                        ? isDarkMode
                          ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                        : isDarkMode
                        ? 'bg-slate-900/40 border-slate-800/60 opacity-80 hover:opacity-100'
                        : 'bg-slate-100/70 border-slate-200 opacity-80 hover:opacity-100'
                    }`}
                  >
                    {/* Main Row layout */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Time & Status Badge */}
                      <div className="flex items-center gap-4 min-w-[220px]">
                        <div className="text-left">
                          <div className={`text-sm font-black font-mono flex items-center gap-1.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            <Clock className="w-4 h-4 text-[#00adef]" />
                            <span>{startTimeStr} – {endTimeStr}</span>
                          </div>
                          <div className={`text-[11px] mt-0.5 ${textMuted}`}>
                            Ref: <span className="font-mono font-bold">{b.bookingCode || '—'}</span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        {b.isOngoing ? (
                          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-500 border border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            Happening Now
                          </span>
                        ) : b.isUpcoming ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-500/15 text-sky-500 border border-sky-500/30">
                            Upcoming
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wider bg-slate-500/15 text-slate-500 border border-slate-500/30">
                            Completed
                          </span>
                        )}
                      </div>

                      {/* Center: Meeting Details & Room */}
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1 ${
                            isDarkMode ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-900'
                          }`}>
                            <Building className="w-3.5 h-3.5 text-[#00adef]" />
                            {b.roomName}
                          </span>

                          {b.hostDepartment && (
                            <span className={`px-2 py-0.5 rounded-lg text-xs font-medium border ${
                              isDarkMode ? 'bg-slate-950/60 text-slate-300 border-slate-800' : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {b.hostDepartment}
                            </span>
                          )}

                          {b.engagementType && (
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase border ${
                              isDarkMode ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                              {b.engagementType}
                            </span>
                          )}
                        </div>

                        <h4 className={`text-base font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          {b.meetingTitle || 'Scheduled Meeting'}
                        </h4>

                        {b.meetingAgenda && (
                          <p className={`text-xs line-clamp-1 ${textMuted}`}>
                            {b.meetingAgenda}
                          </p>
                        )}
                      </div>

                      {/* Right: Reserver (Who Booked) & Refreshments */}
                      <div className="flex flex-col sm:flex-row sm:items-center lg:flex-col lg:items-end gap-3 text-right">
                        {/* Who Booked details from DB */}
                        <div className="text-left sm:text-right">
                          <p className={`text-xs font-medium ${textMuted}`}>Booked By</p>
                          <p className={`text-sm font-bold flex items-center sm:justify-end gap-1.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            <span className="w-2 h-2 rounded-full bg-[#00adef]" />
                            {b.bookedByName || b.bookedByEmail || '—'}
                          </p>
                          <div className={`text-[11px] space-x-2 ${textMuted}`}>
                            {b.bookedByEmail && <span>{b.bookedByEmail}</span>}
                            {b.bookedByPhone && <span>• {b.bookedByPhone}</span>}
                          </div>
                        </div>

                        {/* Extra pills: attendees & refreshments */}
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-xl text-xs border flex items-center gap-1 ${
                            isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                          }`}>
                            <Users className="w-3.5 h-3.5 text-amber-500" />
                            <span>{b.expectedAttendees || 1} Attendees</span>
                          </span>

                          {b.requestedItems && (
                            <span
                              className="px-2.5 py-1 rounded-xl text-xs bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-300 flex items-center gap-1 max-w-[200px] truncate"
                              title={b.requestedItems}
                            >
                              <Coffee className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                              <span className="truncate">{b.requestedItems}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* ─────────────────────────────────────────────────────────────────────────────
          4. FOOTER & COMPLIANCE BAR
      ───────────────────────────────────────────────────────────────────────────── */}
      <footer className={`mt-auto border-t px-4 sm:px-8 py-4 text-xs transition-colors ${
        isDarkMode ? 'border-slate-800 bg-slate-950 text-slate-500' : 'border-slate-200 bg-slate-100 text-slate-600'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <span>© {new Date().getFullYear()} Cooperative Bank of Oromia. All rights reserved.</span>
            <span>•</span>
            <span className={isDarkMode ? 'text-slate-400' : 'text-slate-700 font-medium'}>
              CoopBank Visit Hub Digital Experience
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[11px]">
              Last synced: {lastUpdatedTime ? lastUpdatedTime.toLocaleTimeString() : 'Just now'}
            </span>
            <span>•</span>
            <Link to="/login" className="text-[#00adef] hover:underline font-bold">
              Staff Portal Login →
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicRoomSchedulePage;
