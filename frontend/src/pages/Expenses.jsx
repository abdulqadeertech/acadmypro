import CrudPage from './CrudPage';
export default function Expenses(){return <CrudPage resource="expenses" title="Expenses" subtitle="Salaries, rent, electricity, internet, stationery, maintenance and other costs."
 columns={[{key:'category',label:'Category'},{key:'amount',label:'Amount',render:v=>`Rs ${Number(v).toLocaleString()}`},{key:'date',label:'Date'},{key:'description',label:'Description'},{key:'reference',label:'Reference'}]}
 fields={[{name:'category',label:'Category',required:true},{name:'amount',label:'Amount',type:'number',required:true},{name:'date',label:'Date',type:'date',required:true},{name:'description',label:'Description'},{name:'reference',label:'Reference'}]}/>}
