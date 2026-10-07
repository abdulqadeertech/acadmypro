import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import { Generated } from './pages/Generated.jsx';
import { Attendance, Timetable, Reports, Backup } from './pages/Special.jsx';
import Portal from './pages/Portal.jsx';
import SyncCenter from './pages/SyncCenter.jsx';
import ReportCards from './pages/ReportCards.jsx';
import SettingsPage from './pages/Settings.jsx';
import Students from './pages/Students.jsx';
import Parents from './pages/Parents.jsx';
import Teachers from './pages/Teachers.jsx';
import Classes from './pages/Classes.jsx';
import Subjects from './pages/Subjects.jsx';
import Admissions from './pages/Admissions.jsx';
import Fees from './pages/Fees.jsx';
import Expenses from './pages/Expenses.jsx';
import Exams from './pages/Exams.jsx';
import Notifications from './pages/Notifications.jsx';
import UsersPage from './pages/Users.jsx';
import Pricing from './pages/Pricing.jsx';
import Features from './pages/Features.jsx';
import Contact from './pages/Contact.jsx';
import Certificates from './pages/Certificates.jsx';
import SmsCommunication from './pages/SmsCommunication.jsx';
import FrontOffice from './pages/FrontOffice.jsx';
import StudentInformation from './pages/StudentInformation.jsx';
import PayrollManagement from './pages/PayrollManagement.jsx';
import TeacherSubjects from './pages/TeacherSubjects.jsx';

function Guard() {
  const { user } = useAuth();
  return user ? <Layout /> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
        <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Guard />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/teacher-attendance" element={<Attendance teacher />} />
          <Route path="/teacher-subjects" element={<TeacherSubjects />} />
          <Route path="/timetable" element={<Timetable />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/backup" element={<Backup />} />
          <Route path="/portal" element={<Portal />} />
          <Route path="/sync" element={<SyncCenter />} />
          <Route path="/report-cards" element={<ReportCards />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/features" element={<Features />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/certificates" element={<Certificates />} />
          <Route path="/sms-communication" element={<SmsCommunication />} />
          <Route path="/front-office" element={<FrontOffice />} />
          <Route path="/student-information" element={<StudentInformation />} />
          <Route path="/payroll-management" element={<PayrollManagement />} />
          <Route path="/teacher-salaries" element={<PayrollManagement />} />
          <Route path="/payroll" element={<PayrollManagement />} />
          <Route path="/assignments" element={<TeacherSubjects />} />

          {/* Dedicated CRUD pages (richer schemas) */}
          <Route path="/students" element={<Students />} />
          <Route path="/parents" element={<Parents />} />
          <Route path="/teachers" element={<Teachers />} />
          <Route path="/classes" element={<Classes />} />
          <Route path="/subjects" element={<Subjects />} />
          <Route path="/admissions" element={<Admissions />} />
          <Route path="/fees" element={<Fees />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/exams" element={<Exams />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/users" element={<UsersPage />} />

          {/* Generic CRUD pages */}
          {[
            'Payments', 'Branches', 'Rooms',
            'Fee Structures', 'Leave Requests',
            'Documents', 'Scholarships', 'Inventory', 'Events',
            'Messages', 'Audit Logs',
          ].map(n => (
            <Route
              key={n}
              path={'/' + n.toLowerCase().replaceAll(' ', '-').replaceAll('&', 'and')}
              element={<Generated name={n} />}
            />
          ))}
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default () => (
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
