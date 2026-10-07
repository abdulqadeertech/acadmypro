import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Button, Card, PageHeader, Table } from '../components/ui';
export default function Users(){
 const [rows,setRows]=useState([]); const [open,setOpen]=useState(false); const [f,setF]=useState({role:'staff'}); const [error,setError]=useState('');
 const load=()=>{setError('');api.get('/admin/users').then(r=>setRows(Array.isArray(r.data)?r.data:[])).catch(e=>setError(e.response?.data?.message||e.message));}; useEffect(load,[]);
 async function save(e){e.preventDefault();setError('');try{await api.post('/admin/users',f);setOpen(false);setF({role:'staff'});load();}catch(x){setError(x.response?.data?.message||'Failed to create user');}}
 return <div><PageHeader title="Users & Roles" subtitle="RBAC: Super Admin, Academy Admin, Accountant, Teacher, Receptionist, Parent."
 action={<Button onClick={()=>setOpen(true)}>+ Add User</Button>}/>
 {error&&<div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
 <Card><Table columns={[{key:'name',label:'Name'},{key:'email',label:'Email'},{key:'role',label:'Role',render:v=><span className="capitalize">{(v||'').replace('_',' ')}</span>},{key:'phone',label:'Phone'},{key:'status',label:'Status'}]} rows={rows}/></Card>
 {open&&<div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><Card className="w-full max-w-lg p-6"><h2 className="mb-4 text-xl font-bold">Create User</h2><form onSubmit={save} className="space-y-3">
 {['name','email','password','phone'].map(k=><input key={k} placeholder={k} type={k==='password'?'password':k==='email'?'email':'text'} className="w-full rounded-xl border p-3" value={f[k]||''} onChange={e=>setF({...f,[k]:e.target.value})} required={['name','email','password'].includes(k)}/>)}
 <select className="w-full rounded-xl border p-3" value={f.role} onChange={e=>setF({...f,role:e.target.value})}>{['super_admin','academy_admin','accountant','teacher','receptionist','parent','staff'].map(r=><option key={r}>{r}</option>)}</select>
 <div className="flex justify-end gap-2"><Button type="button" className="bg-slate-100 text-slate-800" onClick={()=>setOpen(false)}>Cancel</Button><Button>Create</Button></div>
 </form></Card></div>}</div>
}
