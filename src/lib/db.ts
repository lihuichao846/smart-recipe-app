import Dexie, { type EntityTable } from 'dexie';

export interface Ingredient {
  id: number;
  name: string;
  quantity: string;
  unit?: string;
  addDate: Date;
  expiryDate?: Date;
  category?: string;
  imageUrl?: string;
  storage?: 'fridge' | 'freezer'; // 'fridge' (default) or 'freezer'
}

export interface CalorieLog {
  id: number;
  date: Date;
  recipeName: string;
  calories: number;
  protein?: number; // g
  carbs?: number; // g
  fat?: number; // g
  mealType?: string; // e.g., 'breakfast', 'lunch', 'dinner', 'snack'
}

const db = new Dexie('FridgeDatabase') as Dexie & {
  ingredients: EntityTable<
    Ingredient,
    'id'
  >;
  calorieLogs: EntityTable<
    CalorieLog,
    'id'
  >;
};

// Schema declaration:
db.version(1).stores({
  ingredients: '++id, name, addDate, expiryDate, category'
});

// Version 2: Add storage field
db.version(2).stores({
  ingredients: '++id, name, addDate, expiryDate, category, storage'
}).upgrade(tx => {
  return tx.table('ingredients').toCollection().modify(item => {
    item.storage = 'fridge';
  });
});

// Version 3: Add calorieLogs table
db.version(3).stores({
  ingredients: '++id, name, addDate, expiryDate, category, storage',
  calorieLogs: '++id, date, recipeName'
});

// Version 4: Add macros to calorieLogs
db.version(4).stores({
  calorieLogs: '++id, date, recipeName, mealType' // update index if needed, but usually just adding fields doesn't require schema change if not indexed
});

export { db };
