import { initializeApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';

export const firebaseConfig = {
  databaseURL: "https://quanlynguoidung-c5d10-default-rtdb.asia-southeast1.firebasedatabase.app"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

export { db };
