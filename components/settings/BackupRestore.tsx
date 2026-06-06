'use client';

import { useRef, useState } from 'react';
import { Download, Upload, CheckCircle, Info, AlertCircle } from 'lucide-react';
import { useApp } from '@/components/providers/AppDataContext';
import { exportTransactionsToCsv, parseCsvToTransactions } from '@/utils/csv';

type StatusKind = 'success' | 'error' | 'info';
type Status = { kind: StatusKind; message: string } | null;

const STATUS_STYLE: Record<StatusKind, { bg: string; text: string; Icon: typeof CheckCircle }> = {
  success: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', Icon: CheckCircle },
  error:   { bg: 'bg-red-50 border-red-200',         text: 'text-red-600',     Icon: AlertCircle },
  info:    { bg: 'bg-blue-50 border-blue-200',        text: 'text-blue-600',   Icon: Info        },
};

export default function BackupRestore() {
  const app = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>(null);
  const [restoring, setRestoring] = useState(false);

  function handleBackup() {
    if (app.transactions.length === 0) {
      setStatus({ kind: 'info', message: '백업할 데이터가 없습니다.' });
      return;
    }
    exportTransactionsToCsv(app.transactions);
    setStatus({ kind: 'success', message: `${app.transactions.length}건의 데이터를 CSV로 내보냈습니다.` });
  }

  function handleRestoreClick() {
    setStatus(null);
    fileRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = '';
    if (!file) return;

    if (!confirm('기존 데이터에 추가됩니다. 계속할까요?')) return;

    setRestoring(true);
    try {
      const text = await file.text();
      const { added, skipped } = parseCsvToTransactions(
        text, app.transactions, app.categories
      );

      if (added.length === 0) {
        setStatus({
          kind: 'info',
          message: skipped > 0
            ? `모두 중복 데이터입니다. (${skipped}건 건너뜀)`
            : '복원할 데이터가 없습니다. CSV 형식을 확인해 주세요.',
        });
      } else {
        app.bulkAddTransactions(added);
        setStatus({
          kind: 'success',
          message: `${added.length}건 복원 완료${skipped > 0 ? ` (중복 ${skipped}건 건너뜀)` : ''}`,
        });
      }
    } catch {
      setStatus({ kind: 'error', message: '파일을 읽는 중 오류가 발생했습니다.' });
    } finally {
      setRestoring(false);
    }
  }

  const statusStyle = status ? STATUS_STYLE[status.kind] : null;

  return (
    <div className="space-y-3">
      {/* 백업 */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <Download size={16} className="text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">데이터 백업하기</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              수입·지출 내역을 CSV 파일로 저장합니다.<br />
              엑셀에서 바로 열 수 있어요.
            </p>
          </div>
        </div>
        <button
          onClick={handleBackup}
          className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
        >
          <Download size={15} />
          CSV로 백업하기
        </button>
      </div>

      {/* 복원 */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <Upload size={16} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">데이터 복원하기</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              백업한 CSV 파일을 불러옵니다.<br />
              중복 항목은 자동으로 건너뜁니다.
            </p>
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          onClick={handleRestoreClick}
          disabled={restoring}
          className="w-full py-3 bg-blue-500 hover:bg-blue-600 active:scale-[0.98] disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
        >
          <Upload size={15} />
          {restoring ? '복원 중...' : 'CSV 파일 선택하기'}
        </button>
      </div>

      {/* 상태 메시지 */}
      {status && statusStyle && (
        <div className={`flex items-start gap-2 p-3 rounded-xl border ${statusStyle.bg}`}>
          <statusStyle.Icon size={15} className={`shrink-0 mt-0.5 ${statusStyle.text}`} />
          <p className={`text-xs font-medium ${statusStyle.text}`}>{status.message}</p>
        </div>
      )}
    </div>
  );
}
