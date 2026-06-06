import type { Transaction, MainCategory } from '@/types';
import { UNCLASSIFIED_SUB } from './defaultCategories';

const HEADERS = ['날짜', '대항목', '세부항목', '메모', '금액', '구분'];

function escapeCsv(value: string): string {
  const s = String(value);
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      result.push(current); current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

export function exportTransactionsToCsv(transactions: Transaction[]): void {
  const rows = [
    HEADERS.join(','),
    ...transactions.map(t =>
      [t.date, t.mainCategoryName, t.subCategoryName, t.memo,
       String(t.amount), t.type === 'income' ? '수입' : '지출']
        .map(escapeCsv).join(',')
    ),
  ];

  const blob = new Blob(['﻿' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const today = new Date().toISOString().slice(0, 10);

  const a = document.createElement('a');
  a.href = url;
  a.download = `household-backup-${today}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseCsvToTransactions(
  text: string,
  existingTransactions: Transaction[],
  categories: MainCategory[],
): { added: Omit<Transaction, 'id' | 'createdAt'>[]; skipped: number } {
  const clean = text.startsWith('﻿') ? text.slice(1) : text;
  const lines = clean.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  if (lines.length < 2) return { added: [], skipped: 0 };

  const existingKeys = new Set(
    existingTransactions.map(t => `${t.date}|${t.memo}|${t.amount}`)
  );

  const added: Omit<Transaction, 'id' | 'createdAt'>[] = [];
  const addedKeys = new Set<string>();
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = parseCsvLine(line).map(s => s.trim());
    if (cols.length < 6) continue;

    const [date, mainCatName, subCatName, memo, amountStr, typeStr] = cols;
    const amount = Number(amountStr);
    if (!date || isNaN(amount) || amount <= 0) continue;

    const key = `${date}|${memo}|${amount}`;
    if (existingKeys.has(key) || addedKeys.has(key)) { skipped++; continue; }

    const type: Transaction['type'] = typeStr === '수입' ? 'income' : 'expense';

    const mainCat = categories.find(c => c.name === mainCatName && c.type === type)
      ?? categories.find(c => c.type === type);

    const mainCategoryId   = mainCat?.id   ?? (type === 'income' ? 'side-income' : 'etc-expense');
    const mainCategoryName = mainCat?.name ?? mainCatName;

    const subCat = mainCat?.subCategories.find(s => s.name === subCatName);
    const subCategoryId   = subCat?.id   ?? UNCLASSIFIED_SUB.id;
    const subCategoryName = subCat?.name ?? (subCatName || UNCLASSIFIED_SUB.name);

    added.push({ type, amount, date, mainCategoryId, mainCategoryName, subCategoryId, subCategoryName, memo });
    addedKeys.add(key);
  }

  return { added, skipped };
}
