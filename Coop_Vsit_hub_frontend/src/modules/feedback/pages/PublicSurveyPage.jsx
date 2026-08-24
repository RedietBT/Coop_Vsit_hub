import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  Star,
  CheckCircle2,
  Building2,
  Calendar,
  Send,
  AlertCircle,
  Sparkles,
  Heart,
  Award,
} from 'lucide-react';
import CoopLogo from '@/core/assets/CoopLogo';
import Button from '@/shared/components/ui/Button';
import Spinner from '@/shared/components/ui/Spinner';
import feedbackApi from '../api/feedbackApi';
import soundPlayer from '@/core/utils/soundPlayer';

const STAR_LABELS = {
  1: 'Needs Improvement',
  2: 'Fair Experience',
  3: 'Good / Standard',
  4: 'Very Good',
  5: 'Exceptional / World-Class',
};

const StarRating = ({ value, onChange, label, subtitle }) => {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2 text-left">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-heading font-bold text-sm text-[#000000]">{label}</h4>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
        <span className="text-xs font-bold text-[#e38524]">
          {STAR_LABELS[hovered || value] || 'Select Rating'}
        </span>
      </div>

      <div className="flex items-center gap-2 pt-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const active = star <= (hovered || value);
          return (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => onChange(star)}
              className="p-1 transition-transform hover:scale-115 focus:outline-none cursor-pointer"
            >
              <Star
                className={`w-7 h-7 transition-colors ${
                  active
                    ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                    : 'text-slate-300 hover:text-slate-400'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const PublicSurveyPage = () => {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const rawToken = params.token || searchParams.get('token') || '';

  const [isLoading, setIsLoading] = useState(true);
  const [verifyData, setVerifyData] = useState(null);
  const [tokenError, setTokenError] = useState(null);

  // Form states
  const [hospitalityRating, setHospitalityRating] = useState(5);
  const [facilityRating, setFacilityRating] = useState(5);
  const [objectiveRating, setObjectiveRating] = useState(5);
  const [npsScore, setNpsScore] = useState(10);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    const verify = async () => {
      if (!rawToken) {
        setTokenError('No survey token provided in the URL.');
        setIsLoading(false);
        return;
      }

      try {
        const res = await feedbackApi.verifyToken(rawToken);
        setVerifyData(res);
        if (!res.valid) {
          setTokenError(res.message || 'This feedback survey link is invalid or has expired.');
        }
      } catch (err) {
        setTokenError(
          err.response?.data?.message || 'Unable to verify survey token. Please check your invitation email.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    verify();
  }, [rawToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await feedbackApi.submitFeedback({
        token: rawToken,
        hospitalityRating,
        facilityRating,
        objectiveRating,
        npsScore,
        comments,
      });

      soundPlayer.playNotificationChime();
      setIsSuccess(true);
    } catch (err) {
      setSubmitError(
        err.response?.data?.message ||
          'Failed to submit feedback survey. Please check your internet connection.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Spinner size="lg" color="navy" />
          <p className="text-xs font-bold text-slate-500">Verifying guest survey invitation...</p>
        </div>
      </div>
    );
  }

  if (tokenError || !verifyData?.valid) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center space-y-4 animate-fadeIn">
          <div className="w-14 h-14 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="font-heading font-black text-xl text-[#000000]">
            Survey Link Expired or Completed
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {tokenError || 'This guest satisfaction survey has already been submitted or the link is no longer valid.'}
          </p>
          <div className="pt-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00adef] hover:text-[#e38524] transition-colors"
            >
              <span>Return to CoopBank Portal</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-10 px-4 selection:bg-[#00adef]/20">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden animate-fadeIn text-left">
        {/* Brand Banner Header */}
        <div className="p-6 sm:p-8 bg-linear-to-r from-[#00adef] to-[#0093cc] text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white text-[#00adef] flex items-center justify-center font-bold shadow-md">
                🏛️
              </div>
              <div>
                <h1 className="font-heading font-black text-xl sm:text-2xl text-white tracking-tight">
                  Cooperative Bank of Oromia
                </h1>
                <p className="text-xs text-sky-100 font-semibold">DxValley Innovation & Executive Hub</p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 text-xs space-y-1">
            <p className="font-bold text-white text-sm">
              {verifyData.visitTitle || 'Executive Delegation Visit'}
            </p>
            <p className="text-sky-100">
              Visitor: <span className="font-bold text-white">{verifyData.guestDisplayName || 'Honored Guest'}</span> • Ref:{' '}
              <span className="font-mono font-bold text-white">{verifyData.visitCode || 'VIS-2026'}</span>
            </p>
          </div>
        </div>

        {/* Content Body */}
        {isSuccess ? (
          <div className="p-8 sm:p-12 text-center space-y-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <h2 className="font-heading font-black text-2xl text-[#000000]">
              Thank You for Your Feedback!
            </h2>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              Your valuable ratings and insights have been recorded. Cooperative Bank of Oromia DxValley is dedicated to continuous partnership excellence.
            </p>

            <div className="pt-4">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-2xl bg-[#00adef] text-white font-bold text-xs hover:bg-[#0093cc] shadow-md transition-colors"
              >
                <span>Visit CoopBank Portal</span>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {submitError && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="space-y-4">
              <StarRating
                value={hospitalityRating}
                onChange={setHospitalityRating}
                label="1. Reception & Hospitality Satisfaction"
                subtitle="Front desk reception, escort, host courtesy, and refreshments."
              />

              <StarRating
                value={facilityRating}
                onChange={setFacilityRating}
                label="2. DxValley Facility & Environment"
                subtitle="Presentation room technology, climate comfort, and audio/video equipment."
              />

              <StarRating
                value={objectiveRating}
                onChange={setObjectiveRating}
                label="3. Objective Alignment & Meeting Value"
                subtitle="Fulfillment of delegation agenda, commercial discussion, and next steps."
              />

              {/* NPS 0-10 Scale */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-heading font-bold text-sm text-[#000000]">
                      4. Net Promoter Score (NPS)
                    </h4>
                    <p className="text-xs text-slate-500">
                      How likely are you to recommend partnering with CoopBank DxValley?
                    </p>
                  </div>
                  <span className="font-heading font-black text-lg text-[#00adef]">
                    {npsScore} / 10
                  </span>
                </div>

                <div className="grid grid-cols-11 gap-1 pt-1">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
                    const isSelected = npsScore === score;
                    let colorClasses = 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200';
                    if (isSelected) {
                      if (score >= 9) {
                        colorClasses = 'bg-emerald-500 border-emerald-600 text-white font-black shadow-md';
                      } else if (score >= 7) {
                        colorClasses = 'bg-[#00adef] border-[#00adef] text-white font-black shadow-md';
                      } else {
                        colorClasses = 'bg-[#e38524] border-[#e38524] text-white font-black shadow-md';
                      }
                    }

                    return (
                      <button
                        key={score}
                        type="button"
                        onClick={() => setNpsScore(score)}
                        className={`h-10 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${colorClasses}`}
                      >
                        {score}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold pt-1">
                  <span>0 - Not Likely</span>
                  <span>5 - Neutral</span>
                  <span>10 - Extremely Likely</span>
                </div>
              </div>

              {/* Written Comments */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
                <label className="block font-heading font-bold text-sm text-[#000000]">
                  5. Additional Comments & Partnership Suggestions
                </label>
                <textarea
                  rows="3"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Share highlights from your delegation visit, compliments, or areas where we can improve..."
                  className="w-full text-xs rounded-xl border border-slate-300 p-3 text-slate-900 focus:outline-none focus:border-[#00adef]"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="orange"
                size="lg"
                className="w-full"
                icon={Send}
                isLoading={isSubmitting}
              >
                Submit Satisfaction Survey
              </Button>
            </div>
          </form>
        )}
      </div>

      <div className="text-center mt-6 text-slate-400 text-xs">
        <p>© 2026 Cooperative Bank of Oromia • DxValley Executive Hub</p>
      </div>
    </div>
  );
};

export default PublicSurveyPage;
