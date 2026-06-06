'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { FilterState } from '@/types';
import { useApp } from '@/components/providers/AppDataContext';
import { getCategoriesByType } from '@/utils/categories';
import { formatMonth, getCurrentYearMonth } from '@/utils/formatters';

interface Props {
  filter: FilterState;
  onChange: (f: FilterState) => void;
}

export default function FilterBar({ filter, onChange }: Props) {
  const { categories } = useApp();

  function shiftMonth(delta: number) {
    const [y, m] = filter.month.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    onChange({
      ...filter,
      month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
    });
  }

  function setType(type: FilterState['type']) {
    onChange({ ...filter, type, mainCategoryId: 'all', subCategoryId: 'all' });
  }

  function setMainCat(id: string) {
    onChange({ ...filter, mainCategoryId: id, subCategoryId: 'all' });
  }

  function setSubCat(id: string) {
    onChange({ ...filter, subCategoryId: id });
  }

  const isCurrent = filter.month === getCurrentYearMonth();

  // 대항목 목록 (type에 따라 필터)
  const mainCats =
    filter.type === 'all'
      ? categories
      : getCategoriesByType(categories, filter.type);

  // 선택된 대항목의 세부항목
  const selectedMain = categories.find(c => c.id === filter.mainCategoryId);
  const subCats = selectedMain?.subCategories ?? [];

  return (
    <div className="bg-white border-b border-gray-100 space-y-3 pb-3">
      {/* 월 선택 */}
      <div className="flex items-center justify-between px-4 pt-3">
        <button onClick={() => shiftMonth(-1)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100">
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => onChange({ ...filter, month: getCurrentYearMonth() })}
          className={`text-sm font-semibold px-3 py-1 rounded-full transition-colors ${
            isCurrent ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          {formatMonth(filter.month)}
        </button>
        <button onClick={() => shiftMonth(1)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* 수입/지출 필터 */}
      <div className="flex gap-2 px-4">
        {[
          { value: 'all',     label: '전체' },
          { value: 'expense', label: '지출' },
          { value: 'income',  label: '수입' },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setType(value as FilterState['type'])}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filter.type === value
                ? value === 'expense'
                  ? 'bg-red-500 text-white'
                  : value === 'income'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 대항목 필터 */}
      <div className="flex gap-2 px-4 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setMainCat('all')}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            filter.mainCategoryId === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          전체
        </button>
        {mainCats.map(cat => (
          <button
            key={cat.id}
            onClick={() => setMainCat(cat.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter.mainCategoryId === cat.id ? 'text-white' : 'bg-gray-100 text-gray-500'
            }`}
            style={filter.mainCategoryId === cat.id ? { backgroundColor: cat.color } : {}}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* 세부항목 필터 (대항목 선택 시만 표시) */}
      {selectedMain && subCats.length > 0 && (
        <div className="flex gap-2 px-4 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setSubCat('all')}
            className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${
              filter.subCategoryId === 'all' ? 'text-white' : 'bg-gray-50 text-gray-400'
            }`}
            style={filter.subCategoryId === 'all' ? { backgroundColor: selectedMain.color } : {}}
          >
            전체
          </button>
          {subCats.map(sub => (
            <button
              key={sub.id}
              onClick={() => setSubCat(sub.id)}
              className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-medium transition-colors border ${
                filter.subCategoryId === sub.id
                  ? 'text-white border-transparent'
                  : 'bg-white text-gray-500 border-gray-200'
              }`}
              style={filter.subCategoryId === sub.id ? { backgroundColor: selectedMain.color + 'cc' } : {}}
            >
              {sub.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
