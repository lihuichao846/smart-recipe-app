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

const db = new Dexie('FridgeDatabase') as Dexie & {
  ingredients: EntityTable<
    Ingredient,
    'id' // primary key "id" (for the typings only)
  >;
};

// Schema declaration:
db.version(1).stores({
  ingredients: '++id, name, addDate, expiryDate, category' // primary key "id" (for the runtime!)
});

// Version 2: Add storage field
db.version(2).stores({
  ingredients: '++id, name, addDate, expiryDate, category, storage'
}).upgrade(tx => {
  return tx.table('ingredients').toCollection().modify(item => {
    item.storage = 'fridge';
  });
});

export { db };
