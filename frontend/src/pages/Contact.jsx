import { useState } from 'react';
import { ArrowRight, CheckCircle2, Clock3, Mail, MapPin, MessageCircle, Phone, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { showToast } from '../components/ui';

const contactItems = [
  { icon: MapPin, label: 'Office Address', value: 'EduSuite, 15-C2 Sharjah City, Sialkot Road Gujranwala, Pakistan', accent: 'text-cyan-600 bg-cyan-50' },
  { icon: Phone, label: 'Phone', value: '0337 3029707', href: 'tel:+923373029707', accent: 'text-emerald-600 bg-emerald-50' },
  { icon: MessageCircle, label: 'WhatsApp', value: '0327 3726496', href: 'https://wa.me/923273726496', target: '_blank', accent: 'text-green-600 bg-green-50' },
  { icon: Mail, label: 'Email', value: 'hello@edusuite.pk', href: 'mailto:hello@edusuite.pk', accent: 'text-amber-600 bg-amber-50' },
];

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const update = event => setForm({ ...form, [event.target.name]: event.target.value });
  const submit = event => {
    event.preventDefault();
    showToast('Thanks! Your message is ready for the EduSuite team.', 'success');
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <section className="mx-auto max-w-7xl pb-8">
      <div className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-10 text-white md:px-10 md:py-14">
        <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full border-[32px] border-cyan-400/15" />
        <div className="absolute bottom-[-110px] left-1/3 h-64 w-64 rounded-full border-[25px] border-amber-300/10" />
        <div className="relative max-w-3xl">
          <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-300"><Mail size={16} /> Contact EduSuite</div>
          <h1 className="text-3xl font-black tracking-tight md:text-5xl">Let’s make school management simpler.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">EduSuite offers easy-to-navigate, cost and time efficient, error-free, web-based school management solutions for students, parents, teachers and institute faculty.</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Reach our team</p>
            <h2 className="mt-2 text-2xl font-black text-slate-900">We’re here to help your academy move forward.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">Ask about onboarding, features, pricing or the best setup for your school. Our team can help you find a practical path forward.</p>
            <div className="mt-6 space-y-3">{contactItems.map(({ icon: Icon, label, value, href, target, accent }) => {
              const content = <><div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${accent}`}><Icon size={20} /></div><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-sm font-semibold leading-6 text-slate-800">{value}</p></div></>;
              return href ? <a key={label} href={href} target={target} rel={target ? 'noreferrer' : undefined} className="flex items-start gap-3 rounded-xl p-2 transition hover:bg-slate-50">{content}</a> : <div key={label} className="flex items-start gap-3 rounded-xl p-2">{content}</div>;
            })}</div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5"><Clock3 className="text-blue-600" size={21} /><h3 className="mt-3 font-bold text-slate-900">Quick response</h3><p className="mt-1 text-sm leading-6 text-slate-500">Send your question and we’ll help you choose the right next step.</p></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5"><CheckCircle2 className="text-emerald-600" size={21} /><h3 className="mt-3 font-bold text-slate-900">Practical guidance</h3><p className="mt-1 text-sm leading-6 text-slate-500">Clear advice for your school, without unnecessary complexity.</p></div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6"><p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-600">Send a message</p><h2 className="mt-2 text-2xl font-black text-slate-900">Tell us what you need.</h2><p className="mt-2 text-sm text-slate-500">Our team will review your message and get back to you.</p></div>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2"><label className="block"><span className="text-sm font-semibold text-slate-700">Your name</span><input name="name" value={form.name} onChange={update} required placeholder="Your full name" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200" /></label><label className="block"><span className="text-sm font-semibold text-slate-700">Email address</span><input name="email" type="email" value={form.email} onChange={update} required placeholder="you@example.com" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200" /></label></div>
            <label className="block"><span className="text-sm font-semibold text-slate-700">Subject</span><input name="subject" value={form.subject} onChange={update} required placeholder="How can we help?" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200" /></label>
            <label className="block"><span className="text-sm font-semibold text-slate-700">Message</span><textarea name="message" value={form.message} onChange={update} required rows="6" placeholder="Tell us about your academy..." className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200" /></label>
            <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-blue-700"><Send size={17} /> Send message</button>
          </form>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-6 md:flex-row md:items-center md:justify-between"><div><p className="text-xs font-black uppercase tracking-widest text-blue-600">Explore before you talk</p><h2 className="mt-1 text-xl font-black text-slate-900">See what AcademyPro can do for your school.</h2></div><Link to="/features" className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700">Explore features <ArrowRight size={17} /></Link></div>
    </section>
  );
}