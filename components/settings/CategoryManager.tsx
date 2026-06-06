'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X, ChevronDown, ChevronRight, MinusCircle } from 'lucide-react';
import { useApp } from '@/components/providers/AppDataContext';
import type { MainCategory, TransactionType } from '@/types';
import { getCategoriesByType } from '@/utils/categories';

const PALETTE = [
  '#f97316','#ec4899','#3b82f6','#64748b','#8b5cf6',
  '#ef4444','#10b981','#14b8a6','#d97706','#06b6d4',
  '#2563eb','#7c3aed','#059669','#f43f5e','#84cc16',
];

export default function CategoryManager() {
  const {
    categories, transactions,
    addMainCategory, updateMainCategory, deleteMainCategory,
    addSubCategory, updateSubCategory, deleteSubCategory,
    toggleSubBudgetExclusion,
  } = useApp();

  const [tab, setTab]             = useState<TransactionType>('expense');
  const [expanded, setExpanded]   = useState<Set<string>>(new Set());

  // 대항목 추가 state
  const [addingMain, setAddingMain]       = useState(false);
  const [newMainName, setNewMainName]     = useState('');
  const [newMainColor, setNewMainColor]   = useState(PALETTE[0]);

  // 대항목 편집 state
  const [editMainId, setEditMainId]       = useState<string | null>(null);
  const [editMainName, setEditMainName]   = useState('');
  const [editMainColor, setEditMainColor] = useState('');

  // 세부항목 추가 state
  const [addingSubFor, setAddingSubFor]   = useState<string | null>(null);
  const [newSubName, setNewSubName]       = useState('');

  // 세부항목 편집 state
  const [editSubKey, setEditSubKey]       = useState<string | null>(null); // "mainId:subId"
  const [editSubName, setEditSubName]     = useState('');

  const visibleCats = getCategoriesByType(categories, tab);

  // 해당 카테고리가 거래에 사용되는 횟수
  function countMainUsage(mainId: string) {
    return transactions.filter(t => t.mainCategoryId === mainId).length;
  }
  function countSubUsage(subId: string) {
    return transactions.filter(t => t.subCategoryId === subId).length;
  }

  // ── 대항목 ───────────────────────────────────────────────
  function handleAddMain() {
    if (!newMainName.trim()) return;
    addMainCategory(newMainName.trim(), tab, newMainColor);
    setNewMainName('');
    setNewMainColor(PALETTE[0]);
    setAddingMain(false);
  }

  function startEditMain(cat: MainCategory) {
    setEditMainId(cat.id);
    setEditMainName(cat.name);
    setEditMainColor(cat.color);
  }

  function handleSaveMain() {
    if (!editMainId || !editMainName.trim()) return;
    updateMainCategory(editMainId, { name: editMainName.trim(), color: editMainColor });
    setEditMainId(null);
  }

  function handleDeleteMain(cat: MainCategory) {
    const count = countMainUsage(cat.id);
    const msg = count > 0
      ? `"${cat.name}"에 거래내역 ${count}건이 있습니다.\n삭제하면 해당 내역이 "기타"로 변경됩니다.\n계속할까요?`
      : `"${cat.name}" 대항목을 삭제할까요?`;
    if (confirm(msg)) deleteMainCategory(cat.id);
  }

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  // ── 세부항목 ─────────────────────────────────────────────
  function handleAddSub(mainId: string) {
    if (!newSubName.trim()) return;
    addSubCategory(mainId, newSubName.trim());
    setNewSubName('');
    setAddingSubFor(null);
  }

  function startEditSub(mainId: string, subId: string, name: string) {
    setEditSubKey(`${mainId}:${subId}`);
    setEditSubName(name);
  }

  function handleSaveSub() {
    if (!editSubKey || !editSubName.trim()) return;
    const [mainId, subId] = editSubKey.split(':');
    updateSubCategory(mainId, subId, editSubName.trim());
    setEditSubKey(null);
  }

  function handleDeleteSub(mainId: string, subId: string, subName: string) {
    const count = countSubUsage(subId);
    const msg = count > 0
      ? `"${subName}" 항목에 거래내역 ${count}건이 있습니다.\n삭제하면 "미분류"로 변경됩니다.\n계속할까요?`
      : `"${subName}" 세부항목을 삭제할까요?`;
    if (confirm(msg)) deleteSubCategory(mainId, subId);
  }

  return (
    <div className="space-y-4">
      {/* 탭 */}
      <div className="flex rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">
        {(['expense', 'income'] as TransactionType[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-sm font-semibold transition-colors rounded-xl ${
              tab === t
                ? t === 'expense'
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-400'
            }`}
          >
            {t === 'expense' ? '지출 항목' : '수입 항목'}
          </button>
        ))}
      </div>

      {/* 대항목 목록 */}
      <div className="space-y-2">
        {visibleCats.map(cat => {
          const isExpanded = expanded.has(cat.id);
          const isEditingMain = editMainId === cat.id;

          return (
            <div key={cat.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* 대항목 헤더 */}
              <div className="flex items-center gap-3 px-4 py-3">
                <button
                  onClick={() => toggleExpand(cat.id)}
                  className="flex items-center gap-2.5 flex-1 min-w-0"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold shrink-0"
                    style={{ backgroundColor: isEditingMain ? editMainColor + '20' : cat.color + '1a',
                             color: isEditingMain ? editMainColor : cat.color }}
                  >
                    {(isEditingMain ? editMainName[0] : cat.name[0]) || cat.name[0]}
                  </div>

                  {isEditingMain ? (
                    <input
                      type="text"
                      value={editMainName}
                      onChange={e => setEditMainName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSaveMain(); if (e.key === 'Escape') setEditMainId(null); }}
                      onClick={e => e.stopPropagation()}
                      autoFocus
                      className="flex-1 text-sm font-semibold border-b-2 border-blue-500 focus:outline-none bg-transparent"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-gray-900 flex-1 text-left">
                      {cat.name}
                      <span className="ml-1.5 text-xs text-gray-400 font-normal">
                        {cat.subCategories.length}개 항목
                      </span>
                    </span>
                  )}

                  {isExpanded ? <ChevronDown size={16} className="text-gray-400 shrink-0" /> : <ChevronRight size={16} className="text-gray-400 shrink-0" />}
                </button>

                {/* 색상 선택 (편집 중) */}
                {isEditingMain && (
                  <div className="flex gap-1">
                    {PALETTE.slice(0, 8).map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={e => { e.stopPropagation(); setEditMainColor(c); }}
                        className={`w-5 h-5 rounded-full border-2 transition-transform ${editMainColor === c ? 'border-gray-700 scale-125' : 'border-transparent'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                )}

                {/* 편집/삭제 버튼 */}
                {isEditingMain ? (
                  <div className="flex gap-1">
                    <button onClick={handleSaveMain}
                      className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center">
                      <Check size={13} strokeWidth={3} />
                    </button>
                    <button onClick={() => setEditMainId(null)}
                      className="w-7 h-7 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center">
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-1">
                    <button
                      onClick={e => { e.stopPropagation(); startEditMain(cat); if (!isExpanded) toggleExpand(cat.id); }}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); handleDeleteMain(cat); }}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* 세부항목 목록 (펼침 시) */}
              {isExpanded && (
                <div className="border-t border-gray-50 px-4 py-3 space-y-1.5">
                  {cat.subCategories.map(sub => {
                    const key = `${cat.id}:${sub.id}`;
                    const isEditingSub = editSubKey === key;

                    return (
                      <div key={sub.id} className="flex items-center gap-2 py-1 group/sub">
                        <div
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />

                        {isEditingSub ? (
                          <>
                            <input
                              type="text"
                              value={editSubName}
                              onChange={e => setEditSubName(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') handleSaveSub(); if (e.key === 'Escape') setEditSubKey(null); }}
                              autoFocus
                              className="flex-1 text-sm border-b border-blue-400 focus:outline-none bg-transparent py-0.5"
                            />
                            <button onClick={handleSaveSub}
                              className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0">
                              <Check size={11} strokeWidth={3} />
                            </button>
                            <button onClick={() => setEditSubKey(null)}
                              className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center shrink-0">
                              <X size={11} />
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="flex-1 text-sm text-gray-700">{sub.name}</span>
                            {/* 예산 제외 배지 */}
                            {sub.excludeFromBudget && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full shrink-0 border border-slate-200">
                                예산 제외
                              </span>
                            )}
                            <div className="hidden group-hover/sub:flex items-center gap-1">
                              {/* 예산 제외 토글 */}
                              <button
                                onClick={() => toggleSubBudgetExclusion(cat.id, sub.id, !sub.excludeFromBudget)}
                                title={sub.excludeFromBudget ? '예산에 포함하기' : '예산에서 제외하기'}
                                className={`p-1 rounded text-xs transition-colors ${
                                  sub.excludeFromBudget
                                    ? 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                                    : 'text-gray-300 hover:text-slate-500 hover:bg-slate-50'
                                }`}
                              >
                                <MinusCircle size={12} />
                              </button>
                              <button
                                onClick={() => startEditSub(cat.id, sub.id, sub.name)}
                                className="p-1 rounded text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                              >
                                <Pencil size={12} />
                              </button>
                              <button
                                onClick={() => handleDeleteSub(cat.id, sub.id, sub.name)}
                                className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}

                  {/* 세부항목 추가 */}
                  {addingSubFor === cat.id ? (
                    <div className="flex items-center gap-2 pt-1">
                      <div
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <input
                        type="text"
                        value={newSubName}
                        onChange={e => setNewSubName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleAddSub(cat.id); if (e.key === 'Escape') setAddingSubFor(null); }}
                        placeholder="세부항목 이름"
                        autoFocus
                        maxLength={15}
                        className="flex-1 text-sm border-b border-blue-400 focus:outline-none bg-transparent py-0.5"
                      />
                      <button onClick={() => handleAddSub(cat.id)}
                        className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0">
                        <Check size={11} strokeWidth={3} />
                      </button>
                      <button onClick={() => { setAddingSubFor(null); setNewSubName(''); }}
                        className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center shrink-0">
                        <X size={11} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setAddingSubFor(cat.id); setNewSubName(''); }}
                      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-500 transition-colors mt-1 pt-1 w-full"
                    >
                      <Plus size={12} />
                      세부항목 추가
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* 대항목 추가 */}
        {addingMain ? (
          <div className="bg-white rounded-2xl border-2 border-blue-200 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold shrink-0"
                style={{ backgroundColor: newMainColor + '20', color: newMainColor }}
              >
                {newMainName[0] || '+'}
              </div>
              <input
                type="text"
                value={newMainName}
                onChange={e => setNewMainName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddMain(); if (e.key === 'Escape') setAddingMain(false); }}
                placeholder="대항목 이름"
                autoFocus
                maxLength={12}
                className="flex-1 text-sm font-semibold border-b-2 border-blue-400 focus:outline-none py-1 bg-transparent"
              />
            </div>
            {/* 색상 팔레트 */}
            <div className="flex flex-wrap gap-2">
              {PALETTE.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewMainColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${newMainColor === c ? 'border-gray-700 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddMain}
                disabled={!newMainName.trim()}
                className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:bg-gray-200 disabled:text-gray-400"
              >
                추가
              </button>
              <button
                onClick={() => { setAddingMain(false); setNewMainName(''); }}
                className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => { setAddingMain(true); setNewMainName(''); setNewMainColor(PALETTE[0]); }}
            className="w-full flex items-center justify-center gap-2 py-3.5 border-2 border-dashed border-gray-200 rounded-2xl text-sm font-medium text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors"
          >
            <Plus size={16} />
            대항목 추가
          </button>
        )}
      </div>
    </div>
  );
}
