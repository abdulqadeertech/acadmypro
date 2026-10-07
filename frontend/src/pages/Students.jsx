import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CrudPage from './CrudPage';
import { IdCard, Award, UserCheck, Eye } from 'lucide-react';
import { PersonIdCard } from '../components/PersonIdCard';
import { Badge } from '../components/ui';

export default function Students() {
  const [card, setCard] = useState(null);
  const navigate = useNavigate();

  return (
    <>
      <CrudPage
        resource="students"
        title="Students Management"
        subtitle="Profiles, admissions, academic records and financial identity."
        columns={[
          { key: 'admission_no', label: 'Admission No.' },
          { key: 'name', label: 'Student' },
          { key: 'father_name', label: 'Father / Guardian' },
          { key: 'phone', label: 'Phone' },
          {
            key: 'monthly_fee',
            label: 'Monthly Fee',
            render: v => `Rs ${Number(v || 0).toLocaleString()}`,
          },
          {
            key: 'status',
            label: 'Status',
            render: v => (
              <Badge variant={v === 'active' ? 'success' : 'default'}>
                {v || 'active'}
              </Badge>
            ),
          },
        ]}
        fields={[
          { name: 'name', label: 'Student Name', required: true },
          { name: 'father_name', label: 'Father / Guardian' },
          { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
          { name: 'dob', label: 'Date of Birth', type: 'date' },
          { name: 'phone', label: 'Phone' },
          { name: 'whatsapp', label: 'WhatsApp' },
          { name: 'email', label: 'Email', type: 'email' },
          { name: 'address', label: 'Address' },
          { name: 'city', label: 'City' },
          { name: 'cnic', label: 'CNIC / B-Form' },
          { name: 'admission_date', label: 'Admission Date', type: 'date' },
          { name: 'monthly_fee', label: 'Monthly Fee', type: 'number' },
          { name: 'discount', label: 'Discount', type: 'number' },
          { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'graduated', 'left'] },
          { name: 'notes', label: 'Notes' },
          { name: 'photo_url', label: 'Student Photo', type: 'file' },
        ]}
        customActions={row => (
          <>
            <button
              onClick={() => setCard(row)}
              className="p-2 border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-50 transition"
              title="Print Student ID Card"
            >
              <IdCard size={14} />
            </button>
            <button
              onClick={() => navigate(`/report-cards?student=${encodeURIComponent(row.admission_no || row.id)}`)}
              className="p-2 border border-amber-200 rounded-lg text-amber-600 hover:bg-amber-50 transition"
              title="View Report Card"
            >
              <Award size={14} />
            </button>
          </>
        )}
      />
      {card && <PersonIdCard person={card} type="student" onClose={() => setCard(null)} />}
    </>
  );
}
