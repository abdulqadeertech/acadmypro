import CrudPage from './CrudPage';
import { useState } from 'react';
import { IdCard } from 'lucide-react';
import { PersonIdCard } from '../components/PersonIdCard';
export default function Teachers(){
 const [card, setCard] = useState(null);
 return <>
 <CrudPage resource="teachers" title="Teachers" subtitle="Teaching staff and role-aware accounts."
 columns={[{key:'name',label:'Name'},{key:'email',label:'Email'},{key:'phone',label:'Phone'},{key:'status',label:'Status'}]}
 fields={[
  {name:'name',label:'Name',required:true},
  {name:'email',label:'Email',type:'email',required:true},
  {name:'password',label:'Password (default: Teacher@123)'},
  {name:'phone',label:'Phone'},
  {name:'status',label:'Status',type:'select',options:['active','inactive']},
    {name:'photo_url',label:'Teacher Photo',type:'file'},
 ]}
 customActions={row => <button onClick={() => setCard(row)} className="p-2 border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-50" title="Print ID card"><IdCard size={14}/></button>}
 />
 {card && <PersonIdCard person={card} type="teacher" onClose={() => setCard(null)} />}
 </>
}
