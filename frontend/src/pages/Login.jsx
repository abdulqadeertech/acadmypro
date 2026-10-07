import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Loader2, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('admin@academypro.local');
  const [password, setPassword] = useState('Admin@123');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const { language, isUrdu, setLanguage, t } = useLanguage();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      nav('/');
    } catch (x) {
      setErr(x.response?.data?.message || t('Login failed. Please check your credentials.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-slate-950 p-4 sm:p-6">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
      <div className="hidden bg-slate-900 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <div className="mb-8 flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-lg bg-indigo-600 text-xl font-bold">A</div><div><div className="text-xl font-bold">AcademyPro</div><div className="text-[10px] tracking-[0.18em] text-slate-400">ACADEMY MANAGEMENT</div></div></div>
          <h2 className="max-w-sm text-3xl font-bold leading-tight">Run every part of your academy with clarity.</h2>
          <p className="mt-4 max-w-sm text-sm leading-6 text-slate-400">Students, academics, attendance and finance in one focused workspace.</p>
        </div>
        <div className="text-xs text-slate-500">Secure local academy operations</div>
      </div>
      <form onSubmit={submit} className="bg-white p-6 sm:p-10">
        <div className="flex justify-end mb-4">
          <div className="flex items-center rounded-lg border border-slate-200 p-0.5 text-xs font-semibold">
            <button type="button" onClick={() => setLanguage('en')} className={`px-2.5 py-1.5 rounded-md ${language === 'en' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>EN</button>
            <button type="button" onClick={() => setLanguage('ur')} className={`px-2.5 py-1.5 rounded-md ${isUrdu ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>اردو</button>
          </div>
        </div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-14 h-14 rounded-lg bg-indigo-600 text-white grid place-items-center font-black text-2xl">A</div>
          <div>
            <h1 className="text-2xl font-black">{t('Welcome Back')}</h1>
            <p className="text-slate-500 text-sm">AcademyPro Management System</p>
          </div>
        </div>

        {err && (
          <div className="p-3 bg-red-50 text-red-700 rounded-xl mb-4 text-sm">{err}</div>
        )}

        <label className="block mb-4">
          <span className="text-sm font-semibold text-slate-700">{t('Email Address')}</span>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="mt-1 w-full border border-slate-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-200"
            required
          />
        </label>

        <label className="block mb-6">
          <span className="text-sm font-semibold text-slate-700">{t('Password')}</span>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="mt-1 w-full border border-slate-200 rounded-lg px-4 py-3 pr-10 outline-none focus:ring-2 focus:ring-indigo-200"
              required
            />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-[calc(50%+6px)] -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {loading ? <><Loader2 size={18} className="animate-spin" /> {t('Signing in...')}</> : t('Sign In')}
        </button>

        <div className="mt-6 p-4 bg-slate-50 rounded-xl text-xs text-slate-500">
          <div className="font-semibold mb-1">{t('Demo Credentials:')}</div>
          <div>Email: <code className="bg-slate-100 px-1 rounded">admin@academypro.local</code></div>
          <div>Password: <code className="bg-slate-100 px-1 rounded">Admin@123</code></div>
        </div>
      </form>
      </div>
    </div>
  );
}
