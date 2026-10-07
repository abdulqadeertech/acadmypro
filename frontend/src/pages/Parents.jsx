import CrudPage from './CrudPage';
export default function Parents(){return <CrudPage resource="parents" title="Parents & Guardians" subtitle="One guardian can be associated with multiple children."
 columns={[{key:'name',label:'Name'},{key:'phone',label:'Phone'},{key:'email',label:'Email'},{key:'occupation',label:'Occupation'}]}
 fields={[{name:'name',label:'Name',required:true},{name:'phone',label:'Phone'},{name:'email',label:'Email',type:'email'},{name:'address',label:'Address'},{name:'occupation',label:'Occupation'}]}/>}
