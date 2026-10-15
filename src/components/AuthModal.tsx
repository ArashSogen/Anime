import React, { useState } from 'react';
import { X, LogIn, UserPlus, Key, ShieldCheck, Film } from 'lucide-react';
import { User } from '../types.js';

interface AuthModalProps {
  onClose: () => void;
  onLogin: (usernameOrEmail: string, adminKey?: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  onRegister: (username: string, email: string, adminKey?: string) => Promise<{ success: boolean; user?: User; error?: string }>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  onClose,
  onLogin,
  onRegister,
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (isRegister) {
        if (!username.trim() || !email.trim()) {
          setErrorMsg('Please provide both username and email.');
          setLoading(false);
          return;
        }
        const res = await onRegister(username.trim(), email.trim(), adminKey.trim() || undefined);
        if (!res.success) {
          setErrorMsg(res.error || 'Registration failed');
        } else {
          onClose();
        }
      } else {
        if (!username.trim()) {
          setErrorMsg('Please enter your username or email.');
          setLoading(false);
          return;
        }
        const res = await onLogin(username.trim(), adminKey.trim() || undefined);
        if (!res.success) {
          setErrorMsg(res.error || 'Login failed');
        } else {
          onClose();
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const fillAdminDemo = () => {
    setUsername('admin');
    setEmail('admin@anistream.local');
    setAdminKey('admin123');
    setIsRegister(false);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-[#0B0E14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 pb-4 border-b border-white/8 bg-[#141A23] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FF3B30] flex items-center justify-center text-white">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isRegister ? 'Create Viewer Account' : 'Sign In to AniStream'}
              </h2>
              <p className="text-xs text-slate-400">
                {isRegister ? 'Instant access to all anime on your VPS' : 'Welcome back to your streaming hub'}
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

        {/* Tab switch */}
        <div className="flex border-b border-white/8 bg-[#0E131C]">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setErrorMsg(null);
            }}
            className={`flex-1 py-3 text-xs font-semibold text-center transition-all cursor-pointer border-b-2 ${
              !isRegister ? 'border-[#FF3B30] text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setErrorMsg(null);
            }}
            className={`flex-1 py-3 text-xs font-semibold text-center transition-all cursor-pointer border-b-2 ${
              isRegister ? 'border-[#FF3B30] text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              {isRegister ? 'Username *' : 'Username or Email *'}
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={isRegister ? 'e.g. AnimeLover99' : 'admin or username'}
              className="w-full bg-[#141A23] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF3B30]"
            />
          </div>

          {isRegister && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full bg-[#141A23] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF3B30]"
              />
            </div>
          )}

          {/* Optional Admin Key */}
          <div className="space-y-1.5 p-3 rounded-xl bg-black/40 border border-white/5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin Passphrase (Optional)</span>
              </label>
              <span className="text-[10px] text-slate-500">Only for VPS owner</span>
            </div>
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Leave empty for regular viewer account"
              className="w-full bg-[#141A23] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#FF3B30] hover:bg-[#E50914] disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-500/20"
          >
            {isRegister ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            <span>{loading ? 'Processing...' : isRegister ? 'Create Viewer Account' : 'Sign In'}</span>
          </button>

          {/* Demo Admin Quick-Fill Pill */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={fillAdminDemo}
              className="text-[11px] text-amber-400/80 hover:text-amber-300 underline cursor-pointer inline-flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Fill Admin Demo Credentials (admin / admin123)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
