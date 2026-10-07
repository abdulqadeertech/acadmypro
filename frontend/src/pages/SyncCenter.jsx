import { useEffect, useState } from 'react';
import { Card, PageHeader, Button, Badge } from '../components/ui';
import { getQueue, flushQueue, queueCount, getLastSyncTime, isOnline } from '../lib/offline';
import { showToast } from '../components/ui';
import { Wifi, WifiOff, RefreshCw, Clock, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function SyncCenter() {
  const [queue, setQueue] = useState([]);
  const [online, setOnline] = useState(isOnline());
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(getLastSyncTime());
  const [result, setResult] = useState(null);

  const refresh = () => {
    setQueue(getQueue());
    setLastSync(getLastSyncTime());
  };

  useEffect(() => {
    refresh();
    const on = () => { setOnline(true); refresh(); };
    const off = () => { setOnline(false); };
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const sync = async () => {
    if (!online) {
      showToast('Cannot sync while offline', 'error');
      return;
    }
    setSyncing(true);
    try {
      const res = await flushQueue();
      setResult(res);
      refresh();
      if (res.synced > 0) showToast(`Synced ${res.synced} operation(s)`, 'success');
      if (res.failed > 0) showToast(`${res.failed} operation(s) failed after retries`, 'error');
      if (res.synced === 0 && res.failed === 0) showToast('Nothing to sync', 'info');
    } catch (e) {
      showToast('Sync failed', 'error');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Offline Sync Center"
        subtitle="Manage offline queue and synchronization status"
        action={
          <Button onClick={sync} loading={syncing} icon={RefreshCw}>
            Sync Now
          </Button>
        }
      />

      {/* Status Cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-5">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl grid place-items-center ${online ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
              {online ? <Wifi size={22} /> : <WifiOff size={22} />}
            </div>
            <div>
              <div className="text-sm text-slate-500">Connection</div>
              <div className="text-2xl font-bold">{online ? 'Online' : 'Offline'}</div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 grid place-items-center">
              <RefreshCw size={22} />
            </div>
            <div>
              <div className="text-sm text-slate-500">Queued Operations</div>
              <div className="text-2xl font-bold">{queue.length}</div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 grid place-items-center">
              <Clock size={22} />
            </div>
            <div>
              <div className="text-sm text-slate-500">Last Synced</div>
              <div className="text-lg font-bold">{lastSync ? new Date(lastSync).toLocaleString() : 'Never'}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Sync Result */}
      {result && (
        <Card className="p-5 mb-5">
          <h3 className="font-bold mb-3">Last Sync Result</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-emerald-600">{result.synced}</div>
              <div className="text-xs text-slate-500">Synced</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{result.failed}</div>
              <div className="text-xs text-slate-500">Failed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-600">{result.pending}</div>
              <div className="text-xs text-slate-500">Pending</div>
            </div>
          </div>
        </Card>
      )}

      {/* Queue List */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-bold">Sync Queue</h3>
          <Badge>{queue.length} pending</Badge>
        </div>
        {queue.length === 0 ? (
          <div className="p-10 text-center">
            <CheckCircle size={48} className="mx-auto text-emerald-400 mb-3" />
            <h4 className="text-lg font-semibold text-slate-700">All Clear</h4>
            <p className="text-sm text-slate-500">No pending operations to sync.</p>
          </div>
        ) : (
          <div className="overflow-auto max-h-[400px]">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left">Operation</th>
                  <th className="px-4 py-3 text-left">Entity</th>
                  <th className="px-4 py-3 text-left">Time</th>
                  <th className="px-4 py-3 text-center">Attempts</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {queue.map(op => (
                  <tr key={op.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium">{op.method || 'POST'} {op.url}</td>
                    <td className="px-4 py-3">{op.entity || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{op.created_at ? new Date(op.created_at).toLocaleString() : '—'}</td>
                    <td className="px-4 py-3 text-center">{op.attempts || 0}</td>
                    <td className="px-4 py-3">
                      <Badge variant={op.last_error ? 'danger' : 'warning'}>
                        {op.last_error || 'pending'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* How it works */}
      <Card className="p-5 mt-5">
        <h3 className="font-bold mb-3">How Offline Sync Works</h3>
        <div className="grid sm:grid-cols-2 gap-4 text-sm text-slate-600">
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 grid place-items-center text-xs font-bold shrink-0">1</span>
              <span>While offline, create/update operations are queued locally.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 grid place-items-center text-xs font-bold shrink-0">2</span>
              <span>When connection returns, click "Sync Now" to process the queue.</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 grid place-items-center text-xs font-bold shrink-0">3</span>
              <span>Failed operations are retried up to 3 times automatically.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 grid place-items-center text-xs font-bold shrink-0">4</span>
              <span>After 3 failures, operations are flagged for manual review.</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
