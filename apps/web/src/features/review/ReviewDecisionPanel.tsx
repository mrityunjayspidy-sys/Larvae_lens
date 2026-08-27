import React, { useState } from 'react';
import { CheckSquare, XCircle, HelpCircle, Send, Check } from 'lucide-react';
import { ReviewDecision } from '../../types';
import { apiClient } from '../../api/client';
import { useAuth } from '../auth/AuthContext';

interface ReviewDecisionPanelProps {
  scanId: string;
  onReviewSubmitted: () => void;
}

export const ReviewDecisionPanel: React.FC<ReviewDecisionPanelProps> = ({
  scanId,
  onReviewSubmitted,
}) => {
  const { token } = useAuth();
  const [decision, setDecision] = useState<ReviewDecision>('confirmed');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await apiClient.submitReview(scanId, decision, notes, token);
      setSuccess(true);
      setTimeout(() => {
        onReviewSubmitted();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to submit review decision.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card space-y-4 border-2 border-primary/20 bg-surface">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-base font-bold text-navy flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-primary" />
          Public Health Review Decision
        </h3>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-primary-light text-primary">
          Auditor Action
        </span>
      </div>

      <p className="text-xs text-slate-600">
        Review the candidate evidence crops, debris verifier probabilities, and motion track persistence before submitting an official audit determination.
      </p>

      {success ? (
        <div className="p-4 rounded-control bg-healthGreen-light text-healthGreen border border-healthGreen/30 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>Audit decision recorded successfully! Updating review record...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-control bg-healthRed-light text-healthRed border border-healthRed/30 text-xs">
              {error}
            </div>
          )}

          {/* Decision Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-navy">Audit Classification</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setDecision('confirmed')}
                className={`p-3 rounded-control border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  decision === 'confirmed'
                    ? 'bg-healthGreen text-white border-healthGreen shadow-sm'
                    : 'bg-canvas text-navy-light border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Check className="w-4 h-4" />
                Confirm Larvae
              </button>

              <button
                type="button"
                onClick={() => setDecision('rejected')}
                className={`p-3 rounded-control border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  decision === 'rejected'
                    ? 'bg-healthRed text-white border-healthRed shadow-sm'
                    : 'bg-canvas text-navy-light border-slate-200 hover:bg-slate-100'
                }`}
              >
                <XCircle className="w-4 h-4" />
                Reject (Debris)
              </button>

              <button
                type="button"
                onClick={() => setDecision('inconclusive')}
                className={`p-3 rounded-control border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  decision === 'inconclusive'
                    ? 'bg-healthAmber text-white border-healthAmber shadow-sm'
                    : 'bg-canvas text-navy-light border-slate-200 hover:bg-slate-100'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                Inconclusive / Retake
              </button>
            </div>
          </div>

          {/* Audit Notes */}
          <div className="space-y-1.5">
            <label htmlFor="reviewNotes" className="text-xs font-bold text-navy">
              Audit Notes & Entomological Observations
            </label>
            <textarea
              id="reviewNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Verified siphon motion matches Culex morphology; candidate track #2 confirmed as larva."
              rows={3}
              maxLength={2000}
              className="w-full text-xs p-3 rounded-control border border-slate-200 focus:ring-2 focus:ring-primary focus:outline-none bg-canvas/40 text-navy"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full text-xs py-2.5"
          >
            <Send className="w-3.5 h-3.5" />
            {submitting ? 'Submitting Audit Decision...' : 'Save Audit Decision'}
          </button>
        </form>
      )}
    </div>
  );
};
