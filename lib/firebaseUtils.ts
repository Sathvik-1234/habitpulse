import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const updatePlayerStats = async (uid: string, newData: any) => {
  if (!uid) return;
  const docRef = doc(db, 'users', uid);
  try {
    await updateDoc(docRef, newData);
  } catch (error) {
    console.error("Error updating player stats in Firestore:", error);
  }
};
