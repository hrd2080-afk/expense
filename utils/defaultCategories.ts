import type { MainCategory } from '@/types';

const sub = (id: string, name: string, excludeFromBudget?: true) =>
  excludeFromBudget ? { id, name, excludeFromBudget } : { id, name };

export const DEFAULT_CATEGORIES: MainCategory[] = [
  // ─── 지출 ───
  {
    id: 'food', name: '식비', type: 'expense', color: '#f97316',
    subCategories: [
      sub('food-delivery', '배달'),
      sub('food-dining',   '외식'),
      sub('food-homemeal', '집밥'),
      sub('food-grocery',  '장보기'),
      sub('food-cafe',     '카페/간식'),
    ],
  },
  {
    id: 'shopping', name: '쇼핑', type: 'expense', color: '#ec4899',
    subCategories: [
      sub('shopping-online',       '온라인쇼핑'),
      sub('shopping-offline',      '오프라인쇼핑'),
      sub('shopping-clothes',      '의류'),
      sub('shopping-daily',        '생활용품'),
      sub('shopping-electronics',  '가전/전자기기'),
    ],
  },
  {
    id: 'transport', name: '교통/차량', type: 'expense', color: '#3b82f6',
    subCategories: [
      sub('transport-gas',         '주유'),
      sub('transport-parking',     '주차'),
      sub('transport-public',      '대중교통'),
      sub('transport-taxi',        '택시'),
      sub('transport-maintenance', '차량정비'),
    ],
  },
  {
    id: 'housing', name: '주거/고정비', type: 'expense', color: '#64748b',
    subCategories: [
      sub('housing-rent',     '월세/관리비'),
      sub('housing-electric', '전기요금'),
      sub('housing-gas',      '가스요금'),
      sub('housing-water',    '수도요금'),
      sub('housing-internet', '인터넷/통신비'),
    ],
  },
  {
    id: 'family', name: '가족/자녀', type: 'expense', color: '#8b5cf6',
    subCategories: [
      sub('family-academy',   '학원비'),
      sub('family-school',    '학교비'),
      sub('family-supplies',  '준비물'),
      sub('family-toys',      '장난감'),
      sub('family-allowance', '용돈'),
    ],
  },
  {
    id: 'health', name: '건강/의료', type: 'expense', color: '#ef4444',
    subCategories: [
      sub('health-hospital',  '병원'),
      sub('health-pharmacy',  '약국'),
      sub('health-gym',       '운동/헬스'),
      sub('health-food',      '건강식품'),
    ],
  },
  {
    id: 'leisure', name: '여가/문화', type: 'expense', color: '#10b981',
    subCategories: [
      sub('leisure-entertainment', '영화/공연'),
      sub('leisure-travel',        '여행'),
      sub('leisure-hobby',         '취미'),
      sub('leisure-subscription',  '구독서비스'),
    ],
  },
  {
    id: 'biz-expense', name: '사업비', type: 'expense', color: '#14b8a6',
    subCategories: [
      sub('biz-salary',    '인건비', true),
      sub('biz-ads',       '광고비'),
      sub('biz-equipment', '장비/소모품'),
      sub('biz-vehicle',   '차량비'),
      sub('biz-education', '교육비'),
      sub('biz-tax',       '세금/수수료'),
    ],
  },
  {
    id: 'etc-expense', name: '기타', type: 'expense', color: '#94a3b8',
    subCategories: [sub('etc-expense-unclassified', '미분류')],
  },

  // ─── 수입 ───
  {
    id: 'biz-income', name: '사업소득', type: 'income', color: '#7c3aed',
    subCategories: [
      sub('biz-income-cleaning', '청소업 매출'),
      sub('biz-income-other',    '기타 매출'),
    ],
  },
  {
    id: 'salary', name: '근로소득', type: 'income', color: '#2563eb',
    subCategories: [
      sub('salary-monthly', '월급'),
      sub('salary-bonus',   '상여금'),
    ],
  },
  {
    id: 'side-income', name: '부수입', type: 'income', color: '#059669',
    subCategories: [
      sub('side-used',    '중고거래'),
      sub('side-support', '지원금'),
      sub('side-other',   '기타수입'),
    ],
  },
];

export const UNCLASSIFIED_SUB = { id: 'unclassified', name: '미분류' };
