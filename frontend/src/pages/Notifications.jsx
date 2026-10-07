import CrudPage from './CrudPage';
export default function Notifications(){return <CrudPage resource="notifications" title="Notifications & Announcements" subtitle="Fee reminders, attendance alerts, exam results, holidays and general announcements."
 columns={[{key:'title',label:'Title'},{key:'message',label:'Message'},{key:'type',label:'Type'},{key:'audience',label:'Audience'},{key:'status',label:'Status'},{key:'scheduled_at',label:'Scheduled'}]}
 fields={[
  {name:'title',label:'Title',required:true},
  {name:'message',label:'Message',required:true},
  {name:'type',label:'Type',type:'select',options:['fee','attendance','exam','holiday','general']},
  {name:'audience',label:'Audience',type:'select',options:['all','students','parents','teachers','staff']},
  {name:'scheduled_at',label:'Scheduled At',type:'datetime-local'},
  {name:'status',label:'Status',type:'select',options:['draft','scheduled','sent']},
 ]}/>}
