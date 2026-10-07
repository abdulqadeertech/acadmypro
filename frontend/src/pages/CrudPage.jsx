
export { default } from '../components/CrudPage';

/* Legacy CRUD implementation retained below for reference. */
/*
export default function CrudPage({resource,title,subtitle,columns=[],fields=[],canCreate=true}){
 const [rows,setRows]=useState([]),[form,setForm]=useState({}),[editing,setEditing]=useState(null);
 const [show,setShow]=useState(false),[loading,setLoading]=useState(true),[query,setQuery]=useState(''),[page,setPage]=useState(1),[error,setError]=useState('');
 const size=10;
 async function load(){setLoading(true);setError('');try{const r=await api.get(`/${resource}`);setRows(Array.isArray(r.data)?r.data:(r.data?.rows||[]))}catch(e){setError(e.response?.data?.message||'Unable to load data.')}finally{setLoading(false)}}
 useEffect(()=>{load()},[resource]);
 const filtered=useMemo(()=>{const q=query.trim().toLowerCase();return q?rows.filter(r=>Object.values(r||{}).some(v=>String(v??'').toLowerCase().includes(q))):rows},[rows,query]);
 const pages=Math.max(1,Math.ceil(filtered.length/size)),visible=filtered.slice((page-1)*size,page*size);
 function create(){setEditing(null);setForm({});setError('');setShow(true)}
 function edit(r){setEditing(r.id);setForm({...r});setError('');setShow(true)}
 async function save(e){e.preventDefault();setError('');try{const payload={...form};delete payload.id;delete payload.created_at;delete payload.updated_at;if(editing)await api.put(`/${resource}/${editing}`,payload);else await api.post(`/${resource}`,payload);setShow(false);await load()}catch(e){setError(e.response?.data?.message||'Save failed.')}}
 async function del(id){if(!confirm('Delete this record?'))return;try{await api.delete(`/${resource}/${id}`);await load()}catch(e){setError(e.response?.data?.message||'Delete failed.')}}
 const actionCol={key:'_actions',label:'Actions',render:(_,r)=>(
  <div className="flex gap-2">
   <button className="rounded-lg border px-3 py-1 text-xs hover:bg-slate-50" onClick={()=>edit(r)}>Edit</button>
   <button className="rounded-lg border px-3 py-1 text-xs text-red-600 hover:bg-red-50" onClick={()=>del(r.id)}>Delete</button>
  </div>
 )};
 return <div><PageHeader title={title} subtitle={subtitle} action={canCreate&&<Button onClick={create}>+ Add New</Button>}/>
 <Card className="mb-4 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><input value={query} onChange={e=>{setQuery(e.target.value);setPage(1)}} placeholder={`Search ${title.toLowerCase()}...`} className="w-full rounded-xl border p-3 sm:max-w-md"/><span className="text-sm text-slate-500">{filtered.length} records</span></div></Card>
 {error&&<div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
 <Card>{loading?<div className="p-8 text-slate-500">Loading...</div>:<><Table columns={[...columns,actionCol]} rows={visible}/><div className="flex items-center justify-between border-t p-4 text-sm"><span>Page {page} of {pages}</span><div className="flex gap-2"><button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="rounded-lg border px-3 py-1 disabled:opacity-40">Previous</button><button disabled={page===pages} onClick={()=>setPage(p=>p+1)} className="rounded-lg border px-3 py-1 disabled:opacity-40">Next</button></div></div></>}</Card>
 {show&&<div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4"><Card className="max-h-[90vh] w-full max-w-3xl overflow-auto p-6"><div className="mb-5 flex justify-between"><h2 className="text-xl font-bold">{editing?'Edit':'Add'} {title}</h2><button onClick={()=>setShow(false)}>✕</button></div><form onSubmit={save} className="grid gap-4 sm:grid-cols-2">{fields.map(f=><label key={f.name} className="text-sm font-medium">{f.label}{f.type==='select'?<select required={f.required} className="mt-1 w-full rounded-xl border p-3" value={form[f.name]??''} onChange={e=>setForm({...form,[f.name]:e.target.value})}><option value="">Select</option>{(f.options||[]).map(o=><option key={o} value={o}>{o}</option>)}</select>:<input required={f.required} type={f.type||'text'} className="mt-1 w-full rounded-xl border p-3" value={form[f.name]??''} onChange={e=>setForm({...form,[f.name]:e.target.value})}/>}</label>)}{error&&<div className="sm:col-span-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}<div className="flex justify-end gap-2 sm:col-span-2"><Button type="button" className="bg-slate-100 text-slate-800" onClick={()=>setShow(false)}>Cancel</Button><Button>{editing?'Update':'Save'}</Button></div></form></Card></div>}</div>
}
*/
