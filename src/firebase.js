// src/firebase.js
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, setDoc, query, where, onSnapshot } from 'firebase/firestore'

// Jouw echte Firebase configuratie
const firebaseConfig = {
  apiKey: "AIzaSyATlVSEqN4v53ELnFvNAJ-xRVg-utMA2Zo",
  authDomain: "slm-weekplanner.firebaseapp.com",
  projectId: "slm-weekplanner",
  storageBucket: "slm-weekplanner.firebasestorage.app",
  messagingSenderId: "1032972021118",
  appId: "1:1032972021118:web:15c0f4eb6be7c7aa37572f"
};

let db = null
try {
  const app = initializeApp(firebaseConfig)
  db = getFirestore(app)
} catch (e) {
  console.error("Firebase initialisatie fout:", e)
}

export const getDb = () => db
export const getTools = () => ({ collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, setDoc, query, where, onSnapshot })

// 1. Activiteiten toevoegen
export const addActivityToFirebase = async (activityData) => {
  if (!db) {
    throw new Error("Firebase database is niet gekoppeld!")
  }
  return await addDoc(collection(db, 'activities'), {
    name: activityData.name,
    color: activityData.color,
    category: activityData.category,
    maxSlots: Number(activityData.maxSlots) || 1,
    maxHours: Number(activityData.maxHours) || 2,
    prerequisiteId: activityData.prerequisiteId || '',
    description: activityData.description || '',
    week: activityData.week || 'Alle weken'
  })
}

// 2. Activiteiten bijwerken
export const updateActivityInFirebase = async (activityData) => {
  if (!db || !activityData.id) throw new Error("Firebase database niet beschikbaar of geen ID.")
  const docRef = doc(db, 'activities', activityData.id)
  return await updateDoc(docRef, {
    name: activityData.name,
    color: activityData.color,
    category: activityData.category,
    maxSlots: Number(activityData.maxSlots) || 1,
    maxHours: Number(activityData.maxHours) || 2,
    prerequisiteId: activityData.prerequisiteId || '',
    description: activityData.description || '',
    week: activityData.week || 'Alle weken'
  })
}

export const deleteActivityFromFirebase = async (id) => {
  if (!db) throw new Error("Firebase database niet beschikbaar.")
  return await deleteDoc(doc(db, 'activities', id))
}

export const registerUserInFirebase = async (userData) => {
  if (!db) throw new Error("Firebase database niet beschikbaar.")
  const userRef = doc(db, 'users', userData.email.toLowerCase().trim())
  await setDoc(userRef, userData, { merge: true })
  return userData
}

export const fetchUserByEmail = async (email) => {
  if (!db) return null
  const userRef = doc(db, 'users', email.toLowerCase().trim())
  const snap = await getDoc(userRef)
  return snap.exists() ? snap.data() : null
}

export const updateUserInFirebase = async (userData) => {
  if (!db || !userData.email) return
  const userRef = doc(db, 'users', userData.email.toLowerCase().trim())
  return await setDoc(userRef, userData, { merge: true })
}

export const deleteUserFromFirebase = async (email) => {
  if (!db) return
  return await deleteDoc(doc(db, 'users', email.toLowerCase().trim()))
}

export const toggleSlotInFirebase = async ({ userEmail, userName, week, day, slotLabel, activityId, isExisting }) => {
  if (!db) return
  const resRef = collection(db, 'reservations')
  if (isExisting) {
    const q = query(resRef, where('userEmail', '==', userEmail), where('week', '==', week), where('day', '==', day), where('slot', '==', slotLabel))
    const snap = await getDocs(q)
    snap.forEach(async (d) => await deleteDoc(d.ref))
  } else {
    await addDoc(resRef, { userEmail, userName, week, day, slot: slotLabel, activityId, createdAt: new Date().toISOString() })
  }
}

export const deleteReservationFromFirebase = async (id) => {
  if (!db) return
  return await deleteDoc(doc(db, 'reservations', id))
}

export const saveMandatoryBlock = async ({ week, day, slot, activityId, targetLevelGroup }) => {
  if (!db) return
  const mandRef = collection(db, 'mandatory')
  const q = query(mandRef, where('week', '==', week), where('day', '==', day), where('slot', '==', slot))
  const snap = await getDocs(q)
  if (!snap.empty) {
    const docId = snap.docs[0].id
    return await updateDoc(doc(db, 'mandatory', docId), { activityId, targetLevelGroup })
  } else {
    return await addDoc(mandRef, { week, day, slot, activityId, targetLevelGroup })
  }
}

export const removeMandatoryBlock = async ({ week, day, slot }) => {
  if (!db) return
  const mandRef = collection(db, 'mandatory')
  const q = query(mandRef, where('week', '==', week), where('day', '==', day), where('slot', '==', slot))
  const snap = await getDocs(q)
  snap.forEach(async (d) => await deleteDoc(d.ref))
}