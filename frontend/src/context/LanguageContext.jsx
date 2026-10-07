import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const translations = {
  Dashboard: 'ڈیش بورڈ',
  Students: 'طلبہ',
  'Student Information': 'طلبہ کی معلومات',
  Parents: 'والدین',
  Teachers: 'اساتذہ',
  Classes: 'کلاسز',
  Subjects: 'مضامین',
  Admissions: 'داخلے',
  'Front Office': 'فرنٹ آفس',
  Attendance: 'حاضری',
  'Teacher Attendance': 'اساتذہ کی حاضری',
  Timetable: 'ٹائم ٹیبل',
  Exams: 'امتحانات',
  'Report Cards': 'رزلٹ کارڈز',
  Certificates: 'سرٹیفکیٹس',
  'Fee Invoices': 'فیس انوائسز',
  Payments: 'ادائیگیاں',
  Expenses: 'اخراجات',
  'Fee Structures': 'فیس اسٹرکچر',
  Payroll: 'پے رول',
  'Online Payroll': 'آن لائن پے رول',
  'Teacher Salaries': 'اساتذہ کی تنخواہیں',
  Scholarships: 'اسکالرشپس',
  Rooms: 'کمرے',
  'Leave Requests': 'چھٹی کی درخواستیں',
  Events: 'تقریبات',
  Inventory: 'انوینٹری',
  Notifications: 'اطلاعات',
  'SMS Communication': 'ایس ایم ایس رابطہ',
  Messages: 'پیغامات',
  Documents: 'دستاویزات',
  'My Portal': 'میرا پورٹل',
  'Sync Center': 'سنک سینٹر',
  Reports: 'رپورٹس',
  'Users & Roles': 'صارفین اور کردار',
  Branches: 'برانچز',
  Assignments: 'اسائنمنٹس',
  'Teacher Subjects': 'اساتذہ کے مضامین',
  'Backup & Restore': 'بیک اپ اور بحالی',
  'Audit Logs': 'آڈٹ لاگز',
  Settings: 'ترتیبات',
  'Pricing Plans': 'قیمت کے پلانز',
  'Awesome Features': 'شاندار خصوصیات',
  Contact: 'رابطہ',
  MAIN: 'اہم',
  ACADEMICS: 'تعلیمی امور',
  FINANCE: 'مالیات',
  OPERATIONS: 'آپریشنز',
  'MY ACCOUNT': 'میرا اکاؤنٹ',
  ADMIN: 'انتظامیہ',
  Online: 'آن لائن',
  Offline: 'آف لائن',
  Logout: 'لاگ آؤٹ',
  'Print this section or save as PDF': 'اس حصے کو پرنٹ کریں یا PDF محفوظ کریں',
  'Welcome Back': 'خوش آمدید',
  'Email Address': 'ای میل ایڈریس',
  Password: 'پاس ورڈ',
  'Sign In': 'سائن اِن',
  'Signing in...': 'سائن اِن ہو رہا ہے...',
  'Demo Credentials:': 'ڈیمو لاگ اِن:',
  'Login failed. Please check your credentials.': 'لاگ اِن ناکام۔ براہ کرم اپنی معلومات چیک کریں۔',
  'Loading dashboard...': 'ڈیش بورڈ لوڈ ہو رہا ہے...',
  'Failed to load dashboard': 'ڈیش بورڈ لوڈ نہیں ہو سکا',
  'Add New': 'نیا شامل کریں', Export: 'ایکسپورٹ', Actions: 'کارروائیاں',
  Refresh: 'تازہ کریں', Search: 'تلاش', Loading: 'لوڈ ہو رہا ہے...',
  'No records match your search': 'آپ کی تلاش سے کوئی ریکارڈ نہیں ملا',
  'No records found': 'کوئی ریکارڈ نہیں ملا', Edit: 'ترمیم', Delete: 'حذف کریں',
  Cancel: 'منسوخ کریں', Add: 'شامل کریں', Save: 'محفوظ کریں',
  'Select...': 'منتخب کریں...', Page: 'صفحہ', of: 'از',
  'record(s) total': 'کل ریکارڈز',
  'Are you sure you want to delete this record?': 'کیا آپ واقعی یہ ریکارڈ حذف کرنا چاہتے ہیں؟',
  'Record deleted': 'ریکارڈ حذف کر دیا گیا', 'Delete failed': 'حذف ناکام ہو گیا',
  'CSV exported': 'CSV ایکسپورٹ ہو گئی',
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem('academypro_language') || 'en');
  const isUrdu = language === 'ur';

  useEffect(() => {
    localStorage.setItem('academypro_language', language);
    document.documentElement.lang = language;
    document.documentElement.dir = isUrdu ? 'rtl' : 'ltr';
  }, [language, isUrdu]);

  const value = useMemo(() => ({
    language,
    isUrdu,
    setLanguage,
    t: (text) => isUrdu ? (translations[text] || text) : text,
  }), [language, isUrdu]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);
