import React from 'react';
import { Star, MessageSquareQuote, Pin, PinOff, Sparkles, User, Inbox } from 'lucide-react';
import useAnalyticsStore from '../store/analyticsStore';
import useAuthStore from '@/modules/auth/store/authStore';

export const VisitorTestimonialsWidget = ({ feedbackReviews = [] }) => {
  const { hasRole } = useAuthStore();
  const { pinnedFeedbackIds, togglePinFeedback } = useAnalyticsStore();
  const isAdmin = hasRole('ROLE_ADMIN');

  // Filter only reviews that have been explicitly pinned by an admin
  const pinnedReviews = feedbackReviews.filter(
    (review) => review.pinned || pinnedFeedbackIds.includes(review.id)
  );

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
            Admin-pinned guest reviews and executive CSAT testimonials
          </p>
        </div>

        {pinnedReviews.length > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-[#e38524]" />
            <span>{pinnedReviews.length} Pinned Testimonial{pinnedReviews.length > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Empty State when no reviews pinned yet */}
      {pinnedReviews.length === 0 ? (
        <div className="py-10 px-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-amber-50 text-[#e38524] flex items-center justify-center mb-2">
            <Pin className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-slate-700">No Pinned Feedback on Executive Cockpit</p>
          <p className="text-[11px] text-slate-400 max-w-sm mt-0.5">
            System Administrators can pin customer reviews from the Visit, Individual Guest, or Organization drawers to feature them here.
          </p>
        </div>
      ) : (
        /* Pinned Testimonials Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pinnedReviews.slice(0, 4).map((review) => {
            const isPinned = true;
            const starVal = review.overallRating || review.overallExperienceRating || 5.0;
            const stars = Array.from({ length: 5 }, (_, i) => i < Math.floor(starVal));

            return (
              <div
                key={review.id}
                className={`relative p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                  isPinned
                    ? 'bg-linear-to-br from-amber-50/40 via-white to-sky-50/30 border-[#e38524] shadow-sm ring-1 ring-[#e38524]/40'
                    : 'bg-slate-50/50 border-slate-200/80 hover:border-[#00adef] hover:bg-white'
                }`}
              >
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

                  <p className="text-xs text-slate-700 leading-relaxed italic mb-4">
                    "{review.comments || 'Excellent coordination and hospitality during our bank visit.'}"
                  </p>
                </div>

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
      )}
    </div>
  );
};

export default VisitorTestimonialsWidget;
