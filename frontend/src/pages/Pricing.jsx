import { useState } from 'react';
import { Check, Crown, HelpCircle, MessageCircle, ShieldCheck, Sparkles, Users, X } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    eyebrow: 'For small academies',
    monthly: 1499,
    yearly: 14990,
    accent: 'cyan',
    description: 'The essential tools for one campus getting organized.',
    limits: ['Up to 100 students', '1 campus', '3 staff accounts', '5 GB document storage'],
    features: ['Student profiles and ID cards', 'Admissions and parent records', 'Attendance and class timetable', 'Fee invoices and payment tracking', 'Basic reports and CSV export', 'Email support'],
  },
  {
    name: 'Growth',
    eyebrow: 'Best value for schools',
    monthly: 2999,
    yearly: 29990,
    accent: 'blue',
    recommended: true,
    description: 'A complete daily operating system for a growing school.',
    limits: ['Up to 500 students', '2 campuses', '15 staff accounts', '25 GB document storage'],
    features: ['Everything in Starter', 'Exams, report cards and grade rules', 'Teacher attendance and payroll', 'Expenses, inventory and scholarships', 'Parent portal and notifications', 'Priority WhatsApp support'],
  },
  {
    name: 'Academy',
    eyebrow: 'For multi-campus teams',
    monthly: 5999,
    yearly: 59990,
    accent: 'amber',
    description: 'Advanced control for established academies and school groups.',
    limits: ['Unlimited students', 'Unlimited campuses', 'Unlimited staff accounts', '100 GB document storage'],
    features: ['Everything in Growth', 'Multi-branch dashboards and permissions', 'Advanced finance and performance reports', 'Automated backups and audit logs', 'Custom academy branding', 'Dedicated onboarding support'],
  },
];

const comparison = [
  ['Student and parent management', '100', '500', 'Unlimited'],
  ['Campuses', '1', '2', 'Unlimited'],
  ['Staff accounts', '3', '15', 'Unlimited'],
  ['Attendance, timetable and admissions', true, true, true],
  ['Fees, expenses and payments', 'Basic', true, true],
  ['Exams and report cards', false, true, true],
  ['Reports and exports', 'Basic', 'Advanced', 'Advanced'],
  ['Support', 'Email', 'WhatsApp priority', 'Dedicated onboarding'],
];

function formatPrice(value) {
  return new Intl.NumberFormat('en-PK').format(value);
}

export default function Pricing() {
  const [billing, setBilling] = useState('monthly');
  const yearly = billing === 'yearly';

  return (
    <section className="max-w-7xl mx-auto pb-8">
      <div className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-10 text-white md:px-10">
        <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full border-[32px] border-cyan-400/15" />
        <div className="absolute -bottom-28 left-1/3 h-64 w-64 rounded-full border-[24px] border-amber-300/10" />
        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-cyan-300"><Sparkles size={16} /> Simple school pricing</div>
            <h1 className="text-3xl font-black tracking-tight md:text-5xl">Everything your school needs, without the enterprise price.</h1>
            <p className="mt-4 max-w-xl text-slate-300">Start small, upgrade when your academy grows. All plans include secure access, regular improvements and no setup fee.</p>
          </div>
          <div className="flex shrink-0 items-center rounded-2xl border border-white/15 bg-white/10 p-1">
            <button onClick={() => setBilling('monthly')} className={`rounded-xl px-4 py-2.5 text-sm font-bold ${!yearly ? 'bg-white text-slate-950' : 'text-slate-300'}`}>Monthly</button>
            <button onClick={() => setBilling('yearly')} className={`rounded-xl px-4 py-2.5 text-sm font-bold ${yearly ? 'bg-amber-300 text-slate-950' : 'text-slate-300'}`}>Yearly <span className="ml-1 text-xs">Save 17%</span></button>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {plans.map(plan => {
          const price = yearly ? Math.round(plan.yearly / 12) : plan.monthly;
          return (
            <article key={plan.name} className={`relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm ${plan.recommended ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'}`}>
              {plan.recommended && <div className="bg-blue-600 px-5 py-2 text-center text-xs font-black uppercase tracking-widest text-white">Most popular</div>}
              <div className="flex-1 p-6">
                <div className="flex items-start justify-between gap-3">
                  <div><p className={`text-xs font-black uppercase tracking-widest ${plan.accent === 'amber' ? 'text-amber-600' : plan.accent === 'blue' ? 'text-blue-600' : 'text-cyan-600'}`}>{plan.eyebrow}</p><h2 className="mt-2 text-2xl font-black text-slate-900">{plan.name}</h2></div>
                  {plan.recommended ? <Crown className="text-amber-500" size={25} /> : <Users className="text-slate-300" size={23} />}
                </div>
                <p className="mt-3 min-h-12 text-sm leading-6 text-slate-500">{plan.description}</p>
                <div className="mt-5 flex items-end gap-2"><span className="text-4xl font-black text-slate-950">Rs {formatPrice(price)}</span><span className="pb-1 text-sm text-slate-500">/ month</span></div>
                <p className="mt-1 text-xs text-slate-400">{yearly ? `Billed Rs ${formatPrice(plan.yearly)} yearly` : 'Billed monthly · cancel anytime'}</p>
                <div className="my-6 h-px bg-slate-100" />
                <div className="space-y-3">{plan.limits.map(limit => <div key={limit} className="flex items-center gap-2 text-sm font-semibold text-slate-700"><Check size={16} className="shrink-0 text-emerald-500" />{limit}</div>)}</div>
                <div className="my-6 h-px bg-slate-100" />
                <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">Included features</p>
                <div className="space-y-3">{plan.features.map(feature => <div key={feature} className="flex gap-2 text-sm text-slate-600"><Check size={16} className="mt-0.5 shrink-0 text-emerald-500" />{feature}</div>)}</div>
              </div>
              <button className={`mx-6 mb-6 rounded-xl px-4 py-3 text-sm font-bold transition ${plan.recommended ? 'bg-blue-600 text-white hover:bg-blue-700' : 'border border-slate-200 text-slate-700 hover:bg-slate-50'}`}>Choose {plan.name}</button>
            </article>
          );
        })}
      </div>

      <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6"><h2 className="text-xl font-black text-slate-900">Compare plans in detail</h2><p className="mt-1 text-sm text-slate-500">Pick the right level of support as your academy grows.</p></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="px-6 py-4 text-left font-bold">Capability</th>{plans.map(plan => <th key={plan.name} className="px-4 py-4 text-center font-bold">{plan.name}</th>)}</tr></thead><tbody>{comparison.map(([label, ...values]) => <tr key={label} className="border-t border-slate-100"><td className="px-6 py-4 font-semibold text-slate-700">{label}</td>{values.map((value, index) => <td key={`${label}-${index}`} className="px-4 py-4 text-center text-slate-500">{value === true ? <Check className="mx-auto text-emerald-500" size={18} /> : value === false ? <X className="mx-auto text-slate-300" size={18} /> : value}</td>)}</tr>)}</tbody></table></div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[[ShieldCheck, 'Secure by default', 'Role-based access, audit logs and routine backups keep school data protected.'], [HelpCircle, 'No hidden charges', 'No setup fee, no per-parent charges and transparent student limits.'], [MessageCircle, 'Help when needed', 'Get practical support during setup and whenever your team needs guidance.']].map(([Icon, title, text]) => <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5"><Icon className="text-blue-600" size={22} /><h3 className="mt-3 font-bold text-slate-900">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-500">{text}</p></div>)}
      </div>
    </section>
  );
}