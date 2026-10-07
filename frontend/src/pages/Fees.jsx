import { useEffect, useState, useMemo } from 'react';
import { get, post } from '../lib/api';
import { Button, Card, PageHeader, Badge, showToast } from '../components/ui';
import { Search, Plus, CreditCard, Printer, CheckCircle, RefreshCw, X, Loader2, DollarSign, Wallet, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const num = v => Number(v || 0);

export default function Fees() {
  const [rows, setRows] = useState([]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  // Payment modal state
  const [paymentModal, setPaymentModal] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'cash',
    paid_at: new Date().toISOString().slice(0, 10),
    note: '',
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Receipt modal state
  const [receiptData, setReceiptData] = useState(null);

  const { t } = useLanguage();

  const load = () => {
    setLoading(true);
    setError('');
    get('/fees')
      .then(r => setRows(Array.isArray(r) ? r : (r?.data || [])))
      .catch(e => setError(e.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  async function generate() {
    setGenerating(true);
    try {
      const r = await post('/fees/generate', { billing_month: month });
      showToast(r?.message || `Invoices generated for ${month}`, 'success');
      await load();
    } catch (e) {
      showToast(e.response?.data?.message || 'Fee generation failed', 'error');
    } finally {
      setGenerating(false);
    }
  }

  const openPaymentModal = (invoice) => {
    const balance = num(invoice.balance);
    setPaymentModal(invoice);
    setPaymentForm({
      amount: balance > 0 ? balance : invoice.amount,
      method: 'cash',
      paid_at: new Date().toISOString().slice(0, 10),
      note: `Fee for ${invoice.billing_month}`,
    });
  };

  const submitPayment = async (e) => {
    e.preventDefault();
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }
    setSubmittingPayment(true);
    try {
      const res = await post('/payments', {
        student_id: paymentModal.student_id,
        invoice_id: paymentModal.id,
        amount: Number(paymentForm.amount),
        method: paymentForm.method,
        paid_at: paymentForm.paid_at,
        note: paymentForm.note,
      });
      showToast('Payment recorded successfully', 'success');
      setPaymentModal(null);
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Payment recording failed', 'error');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const printReceipt = (invoice) => {
    setReceiptData(invoice);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Filtered rows
  const filtered = useMemo(() => {
    return rows.filter(r => {
      const matchesSearch = !query ||
        `${r.student_name || ''} ${r.admission_no || ''} ${r.invoice_no || ''}`.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = !statusFilter || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [rows, query, statusFilter]);

  // Aggregated totals
  const stats = useMemo(() => {
    const totalInvoiced = rows.reduce((s, r) => s + num(r.amount) + num(r.previous_due) + num(r.fine) - num(r.discount) - num(r.scholarship_discount), 0);
    const totalPaid = rows.reduce((s, r) => s + num(r.paid), 0);
    const totalDue = rows.reduce((s, r) => s + Math.max(0, num(r.balance)), 0);
    const paidCount = rows.filter(r => r.status === 'paid').length;
    const pendingCount = rows.filter(r => r.status !== 'paid').length;
    return { totalInvoiced, totalPaid, totalDue, paidCount, pendingCount };
  }, [rows]);

  return (
    <div className="max-w-[1400px] mx-auto space-y-5">
      <PageHeader
        title={t("Fee Invoices")}
        subtitle="Manage student fee structures, billings, dues, and payment receipts."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="month"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-200"
              value={month}
              onChange={e => setMonth(e.target.value)}
            />
            <Button onClick={generate} loading={generating} icon={Plus}>
              Generate Monthly Fees
            </Button>
          </div>
        }
      />

      {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {/* Summary Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Invoiced</p>
            <p className="text-2xl font-black mt-1 text-slate-900">Rs {stats.totalInvoiced.toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-0.5">{rows.length} total invoices</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 grid place-items-center">
            <DollarSign size={20} />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Collected</p>
            <p className="text-2xl font-black mt-1 text-emerald-600">Rs {stats.totalPaid.toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-0.5">{stats.paidCount} cleared invoices</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center">
            <CheckCircle size={20} />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Dues</p>
            <p className="text-2xl font-black mt-1 text-red-600">Rs {stats.totalDue.toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-0.5">{stats.pendingCount} pending payment</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 grid place-items-center">
            <AlertCircle size={20} />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Collection Rate</p>
            <p className="text-2xl font-black mt-1 text-indigo-600">
              {stats.totalInvoiced > 0 ? Math.round((stats.totalPaid / stats.totalInvoiced) * 100) : 0}%
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Paid vs Total Invoiced</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 grid place-items-center">
            <Wallet size={20} />
          </div>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="overflow-hidden">
        {/* Search & Filters */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-1 items-center gap-3 min-w-[280px] max-w-md">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search student, admission no, or invoice..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">All Statuses</option>
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
            </select>

            <button
              onClick={load}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600"
              title="Refresh"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Invoice No</th>
                <th className="px-4 py-3 text-left font-semibold">Student</th>
                <th className="px-4 py-3 text-left font-semibold">Month</th>
                <th className="px-4 py-3 text-right font-semibold">Amount</th>
                <th className="px-4 py-3 text-right font-semibold">Discount</th>
                <th className="px-4 py-3 text-right font-semibold">Prev Due</th>
                <th className="px-4 py-3 text-right font-semibold">Paid</th>
                <th className="px-4 py-3 text-right font-semibold">Balance</th>
                <th className="px-4 py-3 text-center font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="10" className="p-10 text-center text-slate-400">
                    <Loader2 size={24} className="animate-spin mx-auto" />
                    <p className="mt-2">Loading fee records...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="10" className="p-10 text-center text-slate-400">
                    {query ? 'No invoices match your search.' : 'No fee records found. Click "Generate Monthly Fees" to bill students.'}
                  </td>
                </tr>
              ) : (
                filtered.map(row => {
                  const balance = num(row.balance);
                  return (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-medium text-slate-800 text-xs">
                        {row.invoice_no}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{row.student_name}</div>
                        <div className="text-xs text-slate-400">{row.admission_no}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-medium">
                        {row.billing_month}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700">
                        Rs {num(row.amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500">
                        {num(row.discount) + num(row.scholarship_discount) > 0 ? (
                          <span className="text-emerald-600">
                            Rs {(num(row.discount) + num(row.scholarship_discount)).toLocaleString()}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500">
                        {num(row.previous_due) > 0 ? `Rs ${num(row.previous_due).toLocaleString()}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-600 font-medium">
                        Rs {num(row.paid).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-bold">
                        <span className={balance > 0 ? 'text-red-600' : 'text-emerald-600'}>
                          Rs {balance.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={row.status === 'paid' ? 'success' : row.status === 'partial' ? 'warning' : 'danger'}>
                          {row.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          {row.status !== 'paid' && (
                            <button
                              onClick={() => openPaymentModal(row)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 transition"
                              title="Collect payment"
                            >
                              <CreditCard size={13} /> Collect
                            </button>
                          )}
                          <button
                            onClick={() => printReceipt(row)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                            title="Print invoice / voucher"
                          >
                            <Printer size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-100 text-xs text-slate-500 flex justify-between items-center">
          <span>Showing {filtered.length} of {rows.length} invoices</span>
        </div>
      </Card>

      {/* Collect Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onClick={() => !submittingPayment && setPaymentModal(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Record Fee Payment</h3>
                <p className="text-xs text-slate-500">Invoice #{paymentModal.invoice_no}</p>
              </div>
              <button onClick={() => setPaymentModal(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitPayment} className="p-5 space-y-4">
              <div className="rounded-xl bg-slate-50 p-3 flex justify-between text-sm">
                <div>
                  <div className="text-xs text-slate-500 font-semibold uppercase">Student</div>
                  <div className="font-bold text-slate-900">{paymentModal.student_name}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500 font-semibold uppercase">Due Balance</div>
                  <div className="font-bold text-red-600">Rs {num(paymentModal.balance).toLocaleString()}</div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Payment Amount (PKR) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={num(paymentModal.balance) > 0 ? num(paymentModal.balance) : undefined}
                  value={paymentForm.amount}
                  onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentForm.method}
                    onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank transfer">Bank Transfer</option>
                    <option value="easypaisa">EasyPaisa</option>
                    <option value="jazzcash">JazzCash</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Date Paid
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentForm.paid_at}
                    onChange={e => setPaymentForm({ ...paymentForm, paid_at: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Note / Reference
                </label>
                <input
                  type="text"
                  placeholder="Optional payment notes"
                  value={paymentForm.note}
                  onChange={e => setPaymentForm({ ...paymentForm, note: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" type="button" onClick={() => setPaymentModal(null)}>
                  Cancel
                </Button>
                <Button type="submit" loading={submittingPayment} variant="success">
                  Save Payment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hidden printable fee voucher / receipt */}
      {receiptData && (
        <div className="print-card hidden print:block bg-white p-8 max-w-2xl mx-auto border-2 border-slate-800">
          <div className="text-center pb-4 border-b-2 border-slate-800">
            <h1 className="text-2xl font-black">ACADEMYPRO ACADEMY</h1>
            <p className="text-xs text-slate-600">Official Student Fee Voucher / Receipt</p>
          </div>

          <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 text-sm">
            <div>
              <p><strong>Invoice No:</strong> {receiptData.invoice_no}</p>
              <p><strong>Student:</strong> {receiptData.student_name}</p>
              <p><strong>Admission No:</strong> {receiptData.admission_no}</p>
            </div>
            <div className="text-right">
              <p><strong>Month:</strong> {receiptData.billing_month}</p>
              <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
              <p><strong>Status:</strong> {receiptData.status.toUpperCase()}</p>
            </div>
          </div>

          <table className="w-full text-sm my-4 border-collapse">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="py-2 text-left">Description</th>
                <th className="py-2 text-right">Amount (PKR)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2">Tuition Fee ({receiptData.billing_month})</td>
                <td className="py-2 text-right">{num(receiptData.amount).toLocaleString()}</td>
              </tr>
              {num(receiptData.previous_due) > 0 && (
                <tr>
                  <td className="py-2">Previous Due</td>
                  <td className="py-2 text-right">{num(receiptData.previous_due).toLocaleString()}</td>
                </tr>
              )}
              {num(receiptData.discount) > 0 && (
                <tr>
                  <td className="py-2 text-emerald-600">Discount</td>
                  <td className="py-2 text-right text-emerald-600">-{num(receiptData.discount).toLocaleString()}</td>
                </tr>
              )}
              {num(receiptData.scholarship_discount) > 0 && (
                <tr>
                  <td className="py-2 text-emerald-600">Scholarship Discount</td>
                  <td className="py-2 text-right text-emerald-600">-{num(receiptData.scholarship_discount).toLocaleString()}</td>
                </tr>
              )}
              <tr className="border-t font-bold">
                <td className="py-2">Total Paid</td>
                <td className="py-2 text-right text-emerald-600">{num(receiptData.paid).toLocaleString()}</td>
              </tr>
              <tr className="border-t font-black text-base">
                <td className="py-2">Balance Remaining</td>
                <td className="py-2 text-right">{num(receiptData.balance).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <div className="flex justify-between items-end pt-12 mt-8 text-xs text-slate-500 border-t">
            <div>Officer Signature</div>
            <div>Principal Signature</div>
          </div>
        </div>
      )}
    </div>
  );
}
