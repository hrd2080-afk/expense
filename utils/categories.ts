import type { MainCategory, SubCategory, TransactionType } from '@/types';
import { UNCLASSIFIED_SUB } from './defaultCategories';

export function getCategoriesByType(categories: MainCategory[], type: TransactionType): MainCategory[] {
  return categories.filter(c => c.type === type);
}

export function findMainCategory(categories: MainCategory[], id: string): MainCategory | undefined {
  return categories.find(c => c.id === id);
}

export function findSubCategory(mainCat: MainCategory, id: string): SubCategory | undefined {
  return mainCat.subCategories.find(s => s.id === id);
}

export function getSubCategories(categories: MainCategory[], mainCategoryId: string): SubCategory[] {
  const main = findMainCategory(categories, mainCategoryId);
  return main?.subCategories ?? [UNCLASSIFIED_SUB];
}

export function makeSubId(mainId: string, name: string): string {
  return `${mainId}-${Date.now()}-${name.substring(0, 4)}`;
}

export function makeMainId(name: string): string {
  return `custom-${Date.now()}-${name.substring(0, 4)}`;
}

export { UNCLASSIFIED_SUB };
