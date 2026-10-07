import { useEffect, useState } from 'react';
import { Camera, Download, Printer, Upload, X } from 'lucide-react';
import { get, put } from '../lib/api';
import { getPersonAvatar } from '../lib/defaultAvatars';
import { showToast } from './ui';

const labels = {
  student: [
    ['admission_no', 'Admission No.'], ['name', 'Student Name'], ['father_name', 'Father / Guardian'],
    ['gender', 'Gender'], ['dob', 'Date of Birth'], ['phone', 'Phone'], ['email', 'Email'],
    ['address', 'Address'], ['city', 'City'], ['cnic', 'CNIC'], ['admission_date', 'Admission Date'],
    ['monthly_fee', 'Monthly Fee'], ['status', 'Status'],
  ],
  teacher: [
    ['id', 'Employee ID'], ['name', 'Teacher Name'], ['email', 'Email'], ['phone', 'Phone'],
    ['branch_id', 'Branch ID'], ['status', 'Status'],
  ],
};

export function PersonIdCard({ person, type, onClose }) {
  const [printing, setPrinting] = useState(false);
  const [photo, setPhoto] = useState(person?.photo_url || '');
  const [branding, setBranding] = useState({ academy_name: 'AcademyPro', academy_address: '', academy_phone: '', id_card_logo: '', id_card_background: '' });
  const [editingBranding, setEditingBranding] = useState(false);
  const [savingBranding, setSavingBranding] = useState(false);

  useEffect(() => {
    get('/settings/academy').then(settings => {
      const values = Object.fromEntries((Array.isArray(settings) ? settings : []).map(item => [item.key, item.value]));
      setBranding(previous => ({ ...previous, ...values }));
    }).catch(() => {});
  }, []);

  if (!person) return null;
  const isStudent = type === 'student';
  const title = isStudent ? 'STUDENT ID CARD' : 'TEACHER ID CARD';

  const printCard = () => {
    setPrinting(true);
    window.setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 50);
  };

  const [savingPhoto, setSavingPhoto] = useState(false);

  const savePhoto = async () => {
    if (!photo) return;
    setSavingPhoto(true);
    try {
      const endpoint = isStudent ? `/students/${person.id}` : `/teachers/${person.id}`;
      await put(endpoint, { photo_url: photo });
      showToast('Profile photo saved successfully', 'success');
      if (person) person.photo_url = photo;
    } catch (e) {
      showToast(e.response?.data?.message || 'Could not save photo', 'error');
    } finally {
      setSavingPhoto(false);
    }
  };

  const choosePhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
  };

  const chooseBrandImage = (key, event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBranding(previous => ({ ...previous, [key]: reader.result }));
    reader.readAsDataURL(file);
  };

  const saveBranding = async () => {
    setSavingBranding(true);
    try {
      await put('/settings', { settings: branding });
      showToast('ID card branding saved');
      setEditingBranding(false);
    } catch (error) {
      showToast(error.response?.data?.message || 'Could not save card branding', 'error');
    } finally {
      setSavingBranding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-slate-950/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="no-print p-4 border-b flex items-center justify-between">
          <h2 className="font-bold">{title}</h2>
          <div className="flex gap-2">
            <button onClick={() => setEditingBranding(previous => !previous)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Edit Card</button>
            <button onClick={printCard} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-2"><Printer size={16} /> Print / PDF</button>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
          </div>
        </div>

        <div className={`print-card m-5 border-2 border-slate-900 rounded-2xl overflow-hidden shadow-lg ${printing ? 'printing' : ''}`}>
          <div className="relative bg-slate-950 text-white px-5 py-5 overflow-hidden" style={branding.id_card_background ? { backgroundImage: `linear-gradient(rgb(2 6 23 / 0.62), rgb(2 6 23 / 0.62)), url(${branding.id_card_background})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
            <div className="absolute -right-8 -top-12 h-32 w-32 rounded-full border-[18px] border-cyan-400/30" />
            <div className="absolute right-10 -bottom-10 h-24 w-24 rounded-full border-[10px] border-amber-300/25" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">{branding.id_card_logo && <img src={branding.id_card_logo} alt="Academy logo" className="h-12 w-12 rounded-lg bg-white object-contain p-1" />}<div><div className="font-black text-2xl tracking-tight">{branding.academy_name || 'AcademyPro'}</div><div className="text-[10px] font-semibold tracking-[0.12em] text-cyan-300">{branding.academy_address || 'LEARN • LEAD • SUCCEED'}</div><div className="text-[10px] text-slate-200">{branding.academy_phone}</div></div></div>
              <div className="text-[10px] font-black tracking-widest border border-amber-300 text-amber-200 rounded-full px-3 py-1.5">{isStudent ? 'STUDENT' : 'STAFF'}</div>
            </div>
          </div>
          <div className="h-1.5 bg-gradient-to-r from-cyan-400 via-blue-600 to-amber-300" />
          <div className="p-5 flex gap-5 bg-white">
            <div className="shrink-0 text-center">
              <div className="relative">
                <img src={photo || getPersonAvatar(person)} alt={person.name || 'Profile picture'} className="w-28 h-32 object-cover rounded-xl border-4 border-white ring-2 ring-cyan-400 shadow-md" />
                <label className="no-print absolute -bottom-2 -right-2 cursor-pointer rounded-full bg-amber-400 p-2 text-slate-950 shadow-md hover:bg-amber-300" title="Add student photo">
                  <Camera size={14} />
                  <input type="file" accept="image/*" onChange={choosePhoto} className="hidden" />
                </label>
              </div>
              <div className="no-print mt-2 flex flex-col gap-1 items-center">
                <span className="text-[10px] font-semibold text-slate-500">Change photo</span>
                {photo && photo !== person.photo_url && (
                  <button
                    onClick={savePhoto}
                    disabled={savingPhoto}
                    className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {savingPhoto ? 'Saving...' : 'Save to Profile'}
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-5 gap-y-2 text-sm flex-1">
              {labels[type].map(([key, label]) => <div key={key}><div className="text-[10px] uppercase font-bold tracking-wide text-cyan-700">{label}</div><div className="font-semibold text-slate-800 break-words">{person[key] ?? '-'}</div></div>)}
            </div>
          </div>
          <div className="bg-slate-950 px-5 py-3 text-[10px] text-cyan-100 flex justify-between"><span>Valid for {branding.academy_name || 'AcademyPro'} records</span><span className="font-bold text-amber-200">ID: {person.id || person.admission_no}</span></div>
        </div>
        {editingBranding && <div className="no-print border-t p-5 bg-slate-50">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-xs font-semibold text-slate-600">Academy Name<input value={branding.academy_name} onChange={event => setBranding({ ...branding, academy_name: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
            <label className="text-xs font-semibold text-slate-600">Phone<input value={branding.academy_phone} onChange={event => setBranding({ ...branding, academy_phone: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
            <label className="text-xs font-semibold text-slate-600 md:col-span-2">Address / tagline<input value={branding.academy_address} onChange={event => setBranding({ ...branding, academy_address: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
            <label className="text-xs font-semibold text-slate-600">Academy Logo<input type="file" accept="image/*" onChange={event => chooseBrandImage('id_card_logo', event)} className="mt-1 w-full text-sm" /></label>
            <label className="text-xs font-semibold text-slate-600">Card Background<input type="file" accept="image/*" onChange={event => chooseBrandImage('id_card_background', event)} className="mt-1 w-full text-sm" /></label>
          </div>
          <div className="mt-4 flex justify-end"><button onClick={saveBranding} disabled={savingBranding} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{savingBranding ? 'Saving...' : 'Save Card Design'}</button></div>
        </div>}
        <div className="no-print px-5 pb-5 text-xs text-slate-500 flex items-center gap-2"><Upload size={14} /> Add photo from the card or update it from the student form, then use Print / PDF.</div>
      </div>
    </div>
  );
}
