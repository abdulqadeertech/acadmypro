import CrudPage from './CrudPage';
export default function Subjects(){return <CrudPage resource="subjects" title="Subjects" subtitle="Subjects, codes and total marks."
 columns={[{key:'name',label:'Subject'},{key:'code',label:'Code'},{key:'max_marks',label:'Max Marks'}]}
 fields={[{name:'name',label:'Subject Name',required:true},{name:'code',label:'Code'},{name:'max_marks',label:'Max Marks',type:'number'}]}/>}
