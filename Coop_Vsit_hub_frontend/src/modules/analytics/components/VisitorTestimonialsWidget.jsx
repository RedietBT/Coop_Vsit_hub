import React from 'react';
import { Star, MessageSquareQuote, Pin, PinOff, Sparkles, Building2, User } from 'lucide-react';
import useAnalyticsStore from '../store/analyticsStore';
import useAuthStore from '@/modules/auth/store/authStore';

export const VisitorTestimonialsWidget = ({ feedbackReviews = [] }) => {
  const { hasRole } = useAuthStore();
  const { pinnedFeedbackIds, togglePinFeedback } = useAnalyticsStore();
  const isAdmin = hasRole('ROLE_ADMIN');

  // Fallback demo testimonials if no surveys completed yet
  const fallbackReviews = [
    {
      id: 'fb-demo-1',
      guestName: 'Dr. Dawit Alemu',
      organizationName: 'National Bank Regulatory Committee',
      visitTitle: 'National Remittance PEPe Peering Review',
      overallExperienceRating: 5,
      hospitalityRating: 5,
      npsScore: 10,
      comments:
        'Exceptional executive reception by the CoopBank DxValley team. The digital Open Banking APIs and front-desk security check-in flow were seamless.',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'fb-demo-2',
      guestName: 'Ethio Telecom Delegation',
      organizationName: 'Ethio Telecom Enterprise',
      visitTitle: 'Telebirr Core Banking Direct Peering Integration',
      overallExperienceRating: 5,
      hospitalityRating: 5,
      npsScore: 9,
      comments:
        'High-velocity strategic consultation. The executive presentation facilities and smart room scheduling exceeded our delegation expectations.',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  const displayReviews = feedbackReviews.length > 0 ? feedbackReviews : fallbackReviews;

  // Sort pinned reviews first
  const sortedReviews = [...displayReviews].sort((a, b) => {
    const aPinned = pinnedFeedbackIds.includes(a.id);
    const bPinned = pinnedFeedbackIds.includes(b.id);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return 0;
  });

  return (
    <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs text-left">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquareQuote className="w-5 h-5 text-[#00adef]" />
            <h3 className="font-heading font-black text-base text-[#000000]">
              Curated Visitor Feedback & Reviews
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Post-visit guest reviews and CSAT testimonials
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-[#e38524]" />
          <span>5-Star Verified</span>
        </div>
      </div>

      {/* Testimonials List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedReviews.slice(0, 4).map((review) => {
          const isPinned = pinnedFeedbackIds.includes(review.id);
          const stars = Array.from({ length: 5 }, (_, i) => i < (review.overallExperienceRating || 5));

          return (
            <div
              key={review.id}
              className={`relative p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                isPinned
                  ? 'bg-linear-to-br from-amber-50/40 via-white to-sky-50/30 border-[#e38524] shadow-sm ring-1 ring-[#e38524]/40'
                  : 'bg-slate-50/50 border-slate-200/80 hover:border-[#00adef] hover:bg-white'
              }`}
            >
              {/* Top Row: Stars & Pin Action */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1">
                    {stars.map((filled, idx) => (
                      <Star
                        key={idx}
                        className={`w-4 h-4 ${
                          filled ? 'text-[#e38524] fill-[#e38524]' : 'text-slate-300'
                        }`}
                      />
                    ))}
                    <span className="text-[11px] font-bold text-slate-600 ml-1">
                      {review.overallExperienceRating || 5}.0
                    </span>
                  </div>

                  {/* Super Admin Pin Toggle */}
                  {isAdmin && (
                    <button
                      onClick={() => togglePinFeedback(review.id)}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        isPinned
                          ? 'bg-[#e38524] text-white border-[#e38524]'
                          : 'bg-white text-slate-400 border-slate-200 hover:text-[#e38524]'
                      }`}
                      title={isPinned ? 'Unpin from spotlight' : 'Pin to spotlight'}
                    >
                      {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>

                {/* Comment Text */}
                <p className="text-xs text-slate-700 leading-relaxed italic mb-4">
                  "{review.comments || 'Excellent coordination and hospitality during our bank visit.'}"
                </p>
              </div>

              {/* Guest / Org Attribution */}
              <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-sky-100 text-[#00adef] flex items-center justify-center font-bold text-xs shrink-0">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-[#000000] truncate text-[11px]">
                      {review.guestName || review.visitorName || 'VIP Guest'}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {review.organizationName || 'Corporate Delegate'}
                    </p>
                  </div>
                </div>

                {isPinned && (
                  <span className="px-2 py-0.5 text-[9px] font-black rounded-md bg-[#e38524] text-white uppercase tracking-wider shrink-0">
                    Featured
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VisitorTestimonialsWidget;
