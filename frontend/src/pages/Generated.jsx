import CrudPage from '../components/CrudPage';

const cfg = {
  Students: ['students', [
    ['name', 'Name'], ['father_name', 'Father Name'], ['gender', 'Gender'], ['dob', 'Date of Birth'],
    ['phone', 'Phone'], ['email', 'Email'], ['address', 'Address'], ['city', 'City'],
    ['admission_date', 'Admission Date'], ['monthly_fee', 'Monthly Fee'], ['discount', 'Discount'],
    ['status', 'Status'], ['notes', 'Notes'],
  ]],
  Parents: ['parents', [
    ['name', 'Name'], ['relation', 'Relation'], ['phone', 'Phone'], ['whatsapp', 'WhatsApp'],
    ['email', 'Email'], ['address', 'Address'], ['occupation', 'Occupation'], ['cnic', 'CNIC'],
  ]],
  Teachers: ['teachers', [
    ['name', 'Name'], ['email', 'Email'], ['phone', 'Phone'],
    ['status', 'Status'], ['branch_id', 'Branch ID'],
  ]],
  Classes: ['classes', [
    ['name', 'Name'], ['code', 'Code'], ['level', 'Level'],
    ['status', 'Status'], ['description', 'Description'],
  ]],
  Batches: ['batches', [
    ['class_id', 'Class ID'], ['name', 'Name'], ['shift', 'Shift'],
    ['room', 'Room'], ['capacity', 'Capacity'], ['fee', 'Fee'],
    ['start_date', 'Start Date'], ['end_date', 'End Date'], ['status', 'Status'],
  ]],
  Subjects: ['subjects', [
    ['class_id', 'Class ID'], ['name', 'Name'], ['code', 'Code'],
    ['max_marks', 'Max Marks'], ['passing_marks', 'Passing Marks'], ['coefficient', 'Coefficient'],
  ]],
  Admissions: ['admissions', [
    ['student_name', 'Student Name'], ['father_name', 'Father Name'], ['phone', 'Phone'],
    ['previous_school', 'Previous School'], ['previous_class', 'Previous Class'],
    ['applied_class', 'Applied Class'], ['admission_date', 'Admission Date'],
    ['initial_fee', 'Initial Fee'], ['discount', 'Discount'], ['status', 'Status'], ['remarks', 'Remarks'],
  ]],
  Fees: ['fees', []],
  Payments: ['payments', [
    ['student_id', 'Student ID'], ['invoice_id', 'Invoice ID'], ['amount', 'Amount'],
    ['method', 'Method'], ['paid_at', 'Date'], ['note', 'Note'],
  ]],
  Expenses: ['expenses', [
    ['category', 'Category'], ['amount', 'Amount'], ['date', 'Date'],
    ['description', 'Description'], ['reference', 'Reference'], ['payment_method', 'Payment Method'],
  ]],
  Exams: ['exams', [
    ['name', 'Name'], ['session', 'Session'], ['type', 'Type'],
    ['class_id', 'Class ID'], ['batch_id', 'Batch ID'],
    ['start_date', 'Start Date'], ['end_date', 'End Date'],
    ['start_time', 'Start Time'], ['end_time', 'End Time'], ['status', 'Status'],
  ]],
  Users: ['admin/users', [
    ['name', 'Name'], ['email', 'Email'], ['password', 'Password'],
    ['role', 'Role'], ['phone', 'Phone'], ['status', 'Status'], ['branch_id', 'Branch ID'],
  ]],
  Branches: ['branches', [
    ['name', 'Name'], ['code', 'Code'], ['address', 'Address'],
    ['phone', 'Phone'], ['email', 'Email'], ['status', 'Status'],
  ]],
  Rooms: ['rooms', [
    ['name', 'Name'], ['capacity', 'Capacity'], ['type', 'Type'], ['status', 'Status'],
  ]],
  'Fee Structures': ['fee-structures', [
    ['name', 'Name'], ['class_id', 'Class ID'], ['admission_fee', 'Admission Fee'],
    ['monthly_fee', 'Monthly Fee'], ['exam_fee', 'Exam Fee'], ['transport_fee', 'Transport Fee'],
    ['other_fee', 'Other Fee'], ['discount', 'Discount'], ['status', 'Status'],
  ]],
  'Leave Requests': ['leave-requests', [
    ['person_type', 'Person Type'], ['person_id', 'Person ID'],
    ['start_date', 'Start Date'], ['end_date', 'End Date'], ['reason', 'Reason'], ['status', 'Status'],
  ]],
  Payroll: ['payroll', [
    ['teacher_id', 'Teacher ID'], ['month', 'Month'], ['basic_salary', 'Basic Salary'],
    ['allowance', 'Allowance'], ['deduction', 'Deduction'], ['advance', 'Advance'],
    ['bonus', 'Bonus'], ['status', 'Status'], ['paid_at', 'Paid Date'],
  ]],
  Documents: ['documents', [
    ['entity_type', 'Entity Type'], ['entity_id', 'Entity ID'], ['title', 'Title'],
    ['file_url', 'File URL'], ['document_type', 'Document Type'],
  ]],
  Scholarships: ['scholarships', [
    ['student_id', 'Student ID'], ['name', 'Name'], ['type', 'Type'],
    ['amount', 'Amount'], ['percent', 'Percent'], ['start_date', 'Start Date'],
    ['end_date', 'End Date'], ['status', 'Status'],
  ]],
  Inventory: ['inventory', [
    ['item_name', 'Item Name'], ['category', 'Category'], ['quantity', 'Quantity'],
    ['unit', 'Unit'], ['unit_cost', 'Unit Cost'], ['reorder_level', 'Reorder Level'],
    ['supplier', 'Supplier'], ['status', 'Status'],
  ]],
  Events: ['events', [
    ['title', 'Title'], ['event_date', 'Event Date'], ['start_time', 'Start Time'],
    ['end_time', 'End Time'], ['location', 'Location'], ['description', 'Description'],
    ['type', 'Type'], ['status', 'Status'],
  ]],
  Messages: ['messages', [
    ['recipient_type', 'Recipient Type'], ['recipient_id', 'Recipient ID'],
    ['subject', 'Subject'], ['message', 'Message'],
  ]],
  Notifications: ['notifications', [
    ['title', 'Title'], ['message', 'Message'], ['type', 'Type'],
    ['audience', 'Audience'], ['scheduled_at', 'Scheduled'], ['status', 'Status'],
  ]],
  Assignments: ['admin/assignments', [
    ['teacher_name', 'Teacher'], ['batch_name', 'Batch'], ['subject_name', 'Subject'],
  ]],
  'Audit Logs': ['audit-logs', [
    ['created_at', 'Time'], ['user_name', 'User'], ['action', 'Action'],
    ['entity', 'Entity'], ['details', 'Details'],
  ]],
};

export function Generated({ name }) {
  const [resource, fields] = cfg[name] || [name.toLowerCase().replace(/ /g, '-'), []];
  const readOnly = name === 'Audit Logs';
  return (
    <CrudPage
      title={name}
      resource={resource}
      fields={fields.map(f => f[0])}
      columns={fields.length ? fields : undefined}
      description={`Manage ${name.toLowerCase()} records`}
      canDelete={!readOnly}
      canEdit={!readOnly}
      hideAdd={readOnly}
      enableExport={!readOnly}
      enableSearch
    />
  );
}
