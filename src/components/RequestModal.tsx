import React, { useState } from 'react';
import { X, Send, PlusCircle, CheckCircle, Clock } from 'lucide-react';
import { AnimeRequest, User } from '../types.js';

interface RequestModalProps {
  currentUser: User | null;
  userRequests: AnimeRequest[];
  onClose: () => void;
  onSubmitRequest: (title: string, preferredSeason?: string, notes?: string) => Promise<boolean>;
  onOpenAuth: () => void;
}

export const RequestModal: React.FC<RequestModalProps> = ({
  currentUser,
  userRequests,
  onClose,
  onSubmitRequest,
  onOpenAuth,
}) => {
  const [title, setTitle] = useState('');
  const [preferredSeason, setPreferredSeason] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (!currentUser) {
      onOpenAuth();
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await onSubmitRequest(title.trim(), preferredSeason.trim(), notes.trim());
      if (ok) {
        setTitle('');
        setPreferredSeason('');
        setNotes('');
        setSuccessMsg(true);
        setTimeout(() => setSuccessMsg(false), 4000);
      }
    } catch (err: any) {
      alert('Error submitting request: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-[#0B0E14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 bg-[#141A23] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FF3B30]/20 text-[#FF3B30] flex items-center justify-center">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Request an Anime</h2>
              <p className="text-xs text-slate-400">
                Submit an anime you'd like added to this VPS server. Only the admin can review requests.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {!currentUser ? (
            <div className="p-6 rounded-xl bg-[#141A23] border border-white/8 text-center space-y-3">
              <Clock className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-white">Sign In Required</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Please create a viewer account or sign in to submit anime requests and track their status.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="px-5 py-2 bg-[#FF3B30] hover:bg-[#E50914] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Sign In / Register
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Anime Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jujutsu Kaisen, Vinland Saga, Solo Leveling"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#141A23] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF3B30]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Preferred Season / Version (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Season 2, Movie, English Dub, 1080p"
                  value={preferredSeason}
                  onChange={(e) => setPreferredSeason(e.target.value)}
                  className="w-full bg-[#141A23] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF3B30]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Additional Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Any specific release details or message for the admin..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#141A23] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF3B30]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className="w-full py-2.5 bg-[#FF3B30] hover:bg-[#E50914] disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-500/20"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Sending Request...' : 'Submit Request'}</span>
              </button>

              {successMsg && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>Request received! The admin will review it in the storage control panel.</span>
                </div>
              )}
            </form>
          )}

          {/* User's Previous Requests */}
          {currentUser && userRequests.length > 0 && (
            <div className="pt-4 border-t border-white/8 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Your Recent Requests ({userRequests.length})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {userRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 rounded-lg bg-[#141A23] border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-white block">{req.title}</span>
                      {req.preferredSeason && (
                        <span className="text-[11px] text-slate-400">{req.preferredSeason}</span>
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded font-mono ${
                        req.status === 'added'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : req.status === 'in_review'
                          ? 'bg-amber-500/20 text-amber-300'
                          : req.status === 'declined'
                          ? 'bg-red-500/20 text-red-300'
                          : 'bg-white/10 text-slate-300'
                      }`}
                    >
                      {req.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
