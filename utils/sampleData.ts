import type { Transaction, AppState } from '@/types';
import { DEFAULT_CATEGORIES } from './defaultCategories';
import { getCurrentYearMonth } from './formatters';

let seq = 0;
const uid = () => `sample-${++seq}-${Math.random().toString(36).slice(2, 6)}`;

type TxRow = [
  type: 'income' | 'expense',
  day: number,
  amount: number,
  mainId: string, mainName: string,
  subId: string,  subName: string,
  memo: string,
];

export function generateSampleData(): AppState {
  seq = 0;
  const ym        = getCurrentYearMonth();
  const [y, m]    = ym.split('-');
  const daysInMonth = new Date(parseInt(y), parseInt(m), 0).getDate();
  const clamp = (d: number) => Math.min(d, daysInMonth);
  const d = (day: number) => `${y}-${m}-${String(clamp(day)).padStart(2, '0')}`;
  const now = new Date().toISOString();

  const rows: TxRow[] = [
    // ── 수입 ──────────────────────────────────────────────────
    ['income',  1, 3800000, 'salary',     '근로소득',  'salary-monthly',        '월급',        '6월 급여'],
    ['income', 15,  650000, 'biz-income', '사업소득',  'biz-income-cleaning',   '청소업 매출', '병원 정기청소 입금'],
    ['income', 20,  120000, 'side-income','부수입',    'side-used',             '중고거래',    '중고 노트북 판매'],
    ['income', 28,  300000, 'biz-income', '사업소득',  'biz-income-cleaning',   '청소업 매출', '오피스 청소 추가 작업'],

    // ── 주거/고정비 ────────────────────────────────────────────
    ['expense',  1, 750000, 'housing',    '주거/고정비', 'housing-rent',        '월세/관리비', '월세'],
    ['expense',  5,  89000, 'housing',    '주거/고정비', 'housing-electric',    '전기요금',    '전기요금'],
    ['expense',  5,  31000, 'housing',    '주거/고정비', 'housing-gas',         '가스요금',    '가스요금'],
    ['expense', 10,  55000, 'housing',    '주거/고정비', 'housing-internet',    '인터넷/통신비','통신비'],
    ['expense', 10,  18000, 'housing',    '주거/고정비', 'housing-water',       '수도요금',    '수도요금'],

    // ── 사업비 ────────────────────────────────────────────────
    ['expense',  3, 850000, 'biz-expense','사업비',    'biz-salary',           '인건비',      '알바 급여'],
    ['expense',  7,  95000, 'biz-expense','사업비',    'biz-equipment',        '장비/소모품', '청소 용품 구입'],
    ['expense', 12, 120000, 'biz-expense','사업비',    'biz-ads',              '광고비',      '네이버 광고'],
    ['expense', 18,  45000, 'biz-expense','사업비',    'biz-tax',              '세금/수수료', '사업자 통장 수수료'],
    ['expense', 25, 850000, 'biz-expense','사업비',    'biz-salary',           '인건비',      '알바 급여 (2회)'],
    ['expense', 27,  38000, 'biz-expense','사업비',    'biz-equipment',        '장비/소모품', '걸레·수세미 보충'],

    // ── 식비 (배달) ────────────────────────────────────────────
    ['expense',  2, 23000, 'food', '식비', 'food-delivery', '배달', '치킨 주문'],
    ['expense',  6, 18500, 'food', '식비', 'food-delivery', '배달', '짜장면·탕수육'],
    ['expense',  9, 31000, 'food', '식비', 'food-delivery', '배달', '버거 세트'],
    ['expense', 14, 26500, 'food', '식비', 'food-delivery', '배달', '피자 1판'],
    ['expense', 16, 19800, 'food', '식비', 'food-delivery', '배달', '족발 주문'],
    ['expense', 21, 24000, 'food', '식비', 'food-delivery', '배달', '삼겹살 배달'],
    ['expense', 26, 22000, 'food', '식비', 'food-delivery', '배달', '치킨 재주문'],

    // ── 식비 (외식) ────────────────────────────────────────────
    ['expense',  4, 68000, 'food', '식비', 'food-dining', '외식', '가족 외식 (횟집)'],
    ['expense', 11, 42000, 'food', '식비', 'food-dining', '외식', '친구 점심 더치페이'],
    ['expense', 13, 55000, 'food', '식비', 'food-dining', '외식', '부모님 저녁 식사'],
    ['expense', 22, 38000, 'food', '식비', 'food-dining', '외식', '팀 회식'],
    ['expense', 29, 44000, 'food', '식비', 'food-dining', '외식', '기념일 외식'],

    // ── 식비 (장보기·카페) ────────────────────────────────────
    ['expense',  6,  92000, 'food', '식비', 'food-grocery', '장보기', '이마트 주간 장보기'],
    ['expense', 13,  78000, 'food', '식비', 'food-grocery', '장보기', '마트 장보기'],
    ['expense', 20,  85000, 'food', '식비', 'food-grocery', '장보기', '주말 대형마트'],
    ['expense', 27,  71000, 'food', '식비', 'food-grocery', '장보기', '온라인 마트 주문'],
    ['expense',  3,   5500, 'food', '식비', 'food-cafe',    '카페/간식', '아메리카노'],
    ['expense',  7,  12000, 'food', '식비', 'food-cafe',    '카페/간식', '카페 음료 2잔'],
    ['expense', 10,   4800, 'food', '식비', 'food-cafe',    '카페/간식', '편의점 간식'],
    ['expense', 17,   9500, 'food', '식비', 'food-cafe',    '카페/간식', '스무디킹'],
    ['expense', 24,   7200, 'food', '식비', 'food-cafe',    '카페/간식', '카페 아이스크림'],

    // ── 교통/차량 ─────────────────────────────────────────────
    ['expense',  2,  8500, 'transport', '교통/차량', 'transport-public',      '대중교통', '지하철 교통카드'],
    ['expense',  9, 12000, 'transport', '교통/차량', 'transport-taxi',        '택시',     '야간 귀가 택시'],
    ['expense', 11, 65000, 'transport', '교통/차량', 'transport-gas',         '주유',     '주유소'],
    ['expense', 15,  8500, 'transport', '교통/차량', 'transport-public',      '대중교통', '지하철'],
    ['expense', 18, 15000, 'transport', '교통/차량', 'transport-parking',     '주차',     '백화점 주차'],
    ['expense', 23, 65000, 'transport', '교통/차량', 'transport-gas',         '주유',     '주유'],
    ['expense', 28,  9500, 'transport', '교통/차량', 'transport-taxi',        '택시',     '비 오는 날 택시'],

    // ── 쇼핑 ─────────────────────────────────────────────────
    ['expense',  8, 135000, 'shopping', '쇼핑', 'shopping-clothes',     '의류',        '반팔 티셔츠 2장'],
    ['expense', 12,  48000, 'shopping', '쇼핑', 'shopping-online',      '온라인쇼핑',  '쿠팡 생활용품'],
    ['expense', 19,  89000, 'shopping', '쇼핑', 'shopping-online',      '온라인쇼핑',  '네이버쇼핑 주문'],
    ['expense', 23, 215000, 'shopping', '쇼핑', 'shopping-electronics', '가전/전자기기','블루투스 이어폰'],
    ['expense', 26,  32000, 'shopping', '쇼핑', 'shopping-daily',       '생활용품',    '다이소 생필품'],

    // ── 건강/의료 ─────────────────────────────────────────────
    ['expense', 11,  25000, 'health', '건강/의료', 'health-hospital',  '병원',     '내과 진료비'],
    ['expense', 14,  13500, 'health', '건강/의료', 'health-pharmacy',  '약국',     '약국 처방약'],
    ['expense', 20,  65000, 'health', '건강/의료', 'health-gym',       '운동/헬스', '헬스장 월회비'],

    // ── 여가/문화 ─────────────────────────────────────────────
    ['expense', 13,  22000, 'leisure', '여가/문화', 'leisure-entertainment', '영화/공연', '영화 2인'],
    ['expense', 21,  13900, 'leisure', '여가/문화', 'leisure-subscription',  '구독서비스', '넷플릭스'],
    ['expense', 21,   8690, 'leisure', '여가/문화', 'leisure-subscription',  '구독서비스', '유튜브 프리미엄'],
  ];

  const transactions: Transaction[] = rows.map(
    ([type, day, amount, mainCategoryId, mainCategoryName, subCategoryId, subCategoryName, memo]) => ({
      id: uid(),
      type,
      amount,
      date: d(day as number),
      mainCategoryId, mainCategoryName,
      subCategoryId,  subCategoryName,
      memo: memo as string,
      createdAt: now,
    }),
  );

  return {
    transactions,
    categories: DEFAULT_CATEGORIES,
    budgets: {
      [ym]: { month: ym, amount: 3000000 },
    },
  };
}
