import { useState } from 'react';
import { ArrowUpRight, BellRing, Building2, Check, ChevronRight, CreditCard, FileBadge, LayoutDashboard, ShieldCheck, UsersRound, WalletCards, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';

const features = [
  {
    title: 'Admin Portal',
    category: 'Central command',
    description: 'Monitor every department from one calm, focused dashboard. Control access by module, track activity and keep the whole academy moving together.',
    image: 'https://edusuitepk.b-cdn.net/wp-content/uploads/2019/12/Admin.png',
    icon: LayoutDashboard,
    color: 'blue',
    link: '/',
    benefits: ['Department-wide overview', 'Module-level permissions', 'Notifications and activity tracking'],
  },
  {
    title: 'Multi Campus',
    category: 'Grow without losing control',
    description: 'Keep campus data separate while giving leadership a clear view of the complete school group.',
    image: 'https://edusuitepk.b-cdn.net/wp-content/uploads/2019/12/Campus.png',
    icon: Building2,
    color: 'cyan',
    link: '/branches',
    benefits: ['Separate campus records', 'Branch-level reporting', 'Central administration'],
  },
  {
    title: 'User Management',
    category: 'Secure collaboration',
    description: 'Give every administrator, teacher and finance user exactly the access they need, with complete control in one place.',
    image: 'https://edusuitepk.b-cdn.net/wp-content/uploads/2019/12/User.png',
    icon: UsersRound,
    color: 'violet',
    link: '/users',
    benefits: ['Role-based access', 'Permission control', 'Audit-ready user activity'],
  },
  {
    title: 'Fee Management',
    category: 'Clearer collections',
    description: 'Track fee records, identify defaulters, create class fee structures and apply admission fees or instant discounts.',
    image: 'https://edusuitepk.b-cdn.net/wp-content/uploads/2019/12/Fee-Management.png',
    icon: CreditCard,
    color: 'amber',
    link: '/fees',
    benefits: ['Defaulter visibility', 'Flexible fee structures', 'Fast discounts and receipts'],
  },
  {
    title: 'Finance Solution',
    category: 'Finance with focus',
    description: 'Keep finance work organized with limited access, invoices, common transactions and expense visibility.',
    image: 'https://edusuitepk.b-cdn.net/wp-content/uploads/2019/12/Finance.png',
    icon: WalletCards,
    color: 'emerald',
    link: '/expenses',
    benefits: ['Finance-only access', 'Invoice management', 'Expense and payroll tracking'],
  },
  {
    title: 'Certificate Management',
    category: 'Records that last',
    description: 'Generate polished certificates, keep previous records searchable and maintain a consistent academy identity.',
    image: 'https://edusuitepk.b-cdn.net/wp-content/uploads/2019/12/Certificate.png',
    icon: FileBadge,
    color: 'rose',
    link: '/documents',
    benefits: ['Generate certificates', 'Previous record history', 'Print-ready documents'],
  },
  {
    title: 'Parent Management',
    category: 'Families stay informed',
    description: 'Give parents a clear view of attendance, progress, events, exam alerts and results through a connected portal.',
    image: 'https://edusuitepk.b-cdn.net/wp-content/uploads/2019/12/Parent.png',
    icon: BellRing,
    color: 'orange',
    link: '/parents',
    benefits: ['Child progress visibility', 'Event and exam alerts', 'Connected parent records'],
  },
  {
    title: 'Teacher Portal',
    category: 'Teachers do their best work',
    description: 'Connect teachers with classes and families while making attendance, subjects and schedules easy to manage.',
    image: 'https://edusuitepk.b-cdn.net/wp-content/uploads/2019/12/Teacher.png',
    icon: GraduationCap,
    color: 'indigo',
    link: '/teachers',
    benefits: ['Teacher attendance', 'Class activity tracking', 'Subject and schedule view'],
  },
];

const accents = {
  blue: 'from-blue-600 to-indigo-700', cyan: 'from-cyan-500 to-blue-600', violet: 'from-violet-600 to-fuchsia-600',
  amber: 'from-amber-400 to-orange-500', emerald: 'from-emerald-500 to-teal-600', rose: 'from-rose-500 to-pink-600',
  orange: 'from-orange-500 to-red-500', indigo: 'from-indigo-600 to-blue-700',
};

export default function Features() {
  const [active, setActive] = useState('All features');
  const categories = ['All features', 'Administration', 'Finance', 'People & portals'];
  const filtered = features.filter(feature => active === 'All features' || (active === 'Administration' && ['Admin Portal', 'Multi Campus', 'User Management', 'Certificate Management'].includes(feature.title)) || (active === 'Finance' && ['Fee Management', 'Finance Solution'].includes(feature.title)) || (active === 'People & portals' && ['Parent Management', 'Teacher Portal'].includes(feature.title)));

  return (
    <section className="mx-auto max-w-7xl pb-8">
      <div className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-10 text-white md:px-10 md:py-14">
        <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full border-[32px] border-cyan-400/15" />
        <div className="absolute bottom-[-110px] left-1/3 h-64 w-64 rounded-full border-[25px] border-amber-300/10" />
        <div className="relative max-w-3xl">
          <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-300"><ShieldCheck size={16} /> AcademyPro capabilities</div>
          <h1 className="text-3xl font-black tracking-tight md:text-5xl">One powerful system for every part of your school.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">From the admin desk to the parent portal, AcademyPro brings people, departments and decisions into one beautifully organized workspace.</p>
          <div className="mt-7 flex flex-wrap gap-3 text-sm font-semibold text-slate-200"><span className="rounded-full border border-white/15 bg-white/10 px-4 py-2">Role-based access</span><span className="rounded-full border border-white/15 bg-white/10 px-4 py-2">Multi-campus ready</span><span className="rounded-full border border-white/15 bg-white/10 px-4 py-2">Parent and teacher portals</span></div>
        </div>
      </div>

      <div className="my-8 flex gap-2 overflow-x-auto border-b border-slate-200 pb-2">
        {categories.map(category => <button key={category} onClick={() => setActive(category)} className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition ${active === category ? 'bg-slate-950 text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}>{category}</button>)}
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map(feature => {
          const Icon = feature.icon;
          return <article key={feature.title} className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
            <div className="relative h-48 overflow-hidden bg-slate-100">
              <img src={feature.image} alt={feature.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
              <div className={`absolute inset-0 bg-gradient-to-t ${accents[feature.color]} opacity-35`} />
              <div className="absolute bottom-4 left-5 grid h-11 w-11 place-items-center rounded-xl bg-white text-slate-900 shadow-lg"><Icon size={21} /></div>
            </div>
            <div className="flex flex-1 flex-col p-6">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{feature.category}</p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">{feature.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">{feature.description}</p>
              <div className="my-5 space-y-2.5 border-t border-slate-100 pt-5">{feature.benefits.map(benefit => <div key={benefit} className="flex items-center gap-2 text-sm font-semibold text-slate-700"><Check size={16} className="shrink-0 text-emerald-500" />{benefit}</div>)}</div>
              <Link to={feature.link} className="mt-auto flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">Open module <ArrowUpRight size={17} /></Link>
            </div>
          </article>;
        })}
      </div>

      <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-6 md:flex-row md:items-center md:justify-between"><div><p className="text-xs font-black uppercase tracking-widest text-blue-600">Ready to simplify your academy?</p><h2 className="mt-1 text-xl font-black text-slate-900">Explore the plans built for every school size.</h2></div><Link to="/pricing" className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700">View pricing <ChevronRight size={17} /></Link></div>
    </section>
  );
}