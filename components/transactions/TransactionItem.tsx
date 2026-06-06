'use client';

import { Trash2, Pencil } from 'lucide-react';
import type { Transaction } from '@/types';
import { useApp } from '@/components/providers/AppDataContext';
import { formatAmount } from '@/utils/formatters';

interface Props {
  transaction: Transaction;
  onDelete: (id: string) => void;
  onEdit: (t: Transaction) => void;
}

export default function TransactionItem({ transaction: t, onDelete, onEdit }: Props) {
  const { categories } = useApp();
  const mainCat = categories.find(c => c.id === t.mainCategoryId);
  const color   = mainCat?.color ?? '#94a3b8';
  const isIncome = t.type === 'income';

  function handleDelete() {
    if (confirm(`"${t.mainCategoryName} > ${t.subCategoryName}" 내역을 삭제할까요?`)) {
      onDelete(t.id);
    }
  }

  return (
    <div className="flex items-center gap-3 py-3 px-4 hover:bg-gray-50 rounded-xl transition-colors group">
      {/* 카테고리 아이콘 */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-extrabold"
        style={{ backgroundColor: color + '1a', color }}
      >
        {t.mainCategoryName[0]}
      </div>

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        {/* 대항목 > 세부항목 */}
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-xs font-semibold" style={{ color }}>
            {t.mainCategoryName}
          </span>
          <span className="text-gray-300 text-xs">›</span>
          <span className="text-xs text-gray-500">{t.subCategoryName}</span>
        </div>
        {/* 메모 */}
        {t.memo ? (
          <p className="text-sm font-medium text-gray-800 truncate">{t.memo}</p>
        ) : (
          <p className="text-sm text-gray-400 truncate">{t.subCategoryName}</p>
        )}
      </div>

      {/* 금액 + 액션 */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className={`text-sm font-bold ${isIncome ? 'text-blue-600' : 'text-red-500'}`}>
          {isIncome ? '+' : '-'}{formatAmount(t.amount)}원
        </span>
        <div className="hidden group-hover:flex items-center gap-1 ml-1">
          <button
            onClick={() => onEdit(t)}
            className="p-1.5 rounded-lg text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-colors"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
