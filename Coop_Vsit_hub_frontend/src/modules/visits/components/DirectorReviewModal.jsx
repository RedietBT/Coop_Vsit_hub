import React, { useState, useEffect } from 'react';
import { Star, CheckCircle2, AlertCircle, Sparkles, Building2, Calendar, User, Clock, FileText } from 'lucide-react';
import { toast } from 'sonner';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';
import visitApi from '../api/visitApi';

const OUTCOME_OPTIONS = [
  { value: 'HIGHLY_SUCCESSFUL', label: 'Highly Successful / Strategic Win', color: 'emerald' },
  { value: 'SUCCESSFUL', label: 'Successful / Objectives Met', color: 'blue' },
  { value: 'FOLLOW_UP_REQUIRED', label: 'Action Items / Follow-up Required', color: 'amber' },
  { value: 'INCONCLUSIVE', label: 'Inconclusive / Discussions Ongoing', color: 'slate' },
  { value: 'UNSUCCESSFUL', label: 'Unsuccessful / No Further Action', color: 'rose' },
];

const RATING_LABELS = {
  1: '1 - Needs Urgent Improvement',
  2: '2 - Below Expectations',
  3: '3 - Met Expectations / Satisfactory',
  4: '4 - Very Good / Successful',
  5: '5 - Outstanding / Exceptional',
};

export const DirectorReviewModal = ({ isOpen, onClose, visit, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [outcome, setOutcome] = useState('SUCCESSFUL');
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visit) {
      setRating(visit.directorRating || 0);
      setHoverRating(0);
      setOutcome(visit.directorOutcome || 'SUCCESSFUL');
      setReviewNotes(visit.directorReviewNotes || '');
    }
  }, [visit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!visit?.id) return;

    if (!rating || rating < 1 || rating > 5) {
      toast.error('Please provide a rating between 1 and 5 stars.');
      return;
    }

    if (!outcome) {
      toast.error('Please select an executive meeting outcome.');
      return;
    }

    setIsSubmitting(true);
    try {
      await visitApi.submitDirectorReview(visit.id, {
        rating,
        outcome,
        reviewNotes: reviewNotes.trim() || undefined,
      });

      toast.success('Executive visit review submitted successfully!');
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to submit review.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeRatingDisplay = hoverRating || rating;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Executive Visit Review"
      subtitle={`Host / Director Assessment for Visit ${visit?.visitCode || ''}`}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-left">
        {/* Visit Context Card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-bold text-slate-900 text-sm">
                {visit?.guestDisplayName || 'Guest / Delegation'}
              </div>
              <div className="text-xs text-slate-500">{visit?.title || 'Executive Meeting'}</div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              {visit?.status || 'COMPLETED'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#00adef]" />
              <span className="truncate">{visit?.locationRoom || 'Executive Room'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#e38524]" />
              <span>
                {visit?.actualCheckOutTime
                  ? new Date(visit.actualCheckOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Completed'}
              </span>
            </div>
          </div>
        </div>

        {/* 5-Star Interactive Rating */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Executive Rating <span className="text-rose-500">*</span>
          </label>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 rounded-lg transition-transform hover:scale-110 focus:outline-none"
                  aria-label={`Rate ${star} star`}
                >
                  <Star
                    className={`w-7 h-7 transition-colors ${
                      star <= activeRatingDisplay
                        ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                        : 'text-slate-200 fill-slate-100'
                    }`}
                  />
                </button>
              ))}
            </div>

            <div className="text-xs font-semibold text-slate-600 text-center sm:text-right">
              {activeRatingDisplay > 0 ? (
                <span className="text-[#0284c7] font-bold">
                  {RATING_LABELS[activeRatingDisplay]}
                </span>
              ) : (
                <span className="text-slate-400 italic">Select 1 to 5 stars</span>
              )}
            </div>
          </div>
        </div>

        {/* Meeting Outcome Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Meeting Outcome Assessment <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {OUTCOME_OPTIONS.map((opt) => {
              const isSelected = outcome === opt.value;
              return (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setOutcome(opt.value)}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-medium text-left transition-all flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'border-[#00adef] bg-sky-50/70 text-[#0284c7] shadow-xs ring-1 ring-[#00adef]/30'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-[#00adef] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Executive Notes / Observations */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Executive Review Notes & Agreements <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <textarea
            rows={3}
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            placeholder="Key discussion points, agreed follow-up actions, strategic commitments..."
            className="w-full p-3 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00adef]/20 focus:border-[#00adef] text-slate-800 placeholder-slate-400 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting || rating === 0}
            className="bg-[#00adef] hover:bg-[#0092c9] text-white font-bold px-5"
          >
            {isSubmitting ? (
              'Submitting...'
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-1.5 text-amber-200" />
                {visit?.directorRating ? 'Update Review' : 'Submit Review'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default DirectorReviewModal;
