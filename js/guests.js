import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let guestsUnsubscribe = null;
let onGuestsUpdateCallback = null;

export function initGuests(onGuestsUpdate) {
  onGuestsUpdateCallback = onGuestsUpdate;
}

export function listenToGuests(uid, eventId) {
  if (guestsUnsubscribe) {
    guestsUnsubscribe();
    guestsUnsubscribe = null;
  }

  if (!uid || !eventId) return;

  const guestsRef = collection(db, "users", uid, "events", eventId, "guests");
  const q = query(guestsRef, orderBy("createdAt", "asc"));

  guestsUnsubscribe = onSnapshot(q, (snapshot) => {
    const guests = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    if (onGuestsUpdateCallback) onGuestsUpdateCallback(guests);
  });
}

export function stopListeningToGuests() {
  if (guestsUnsubscribe) {
    guestsUnsubscribe();
    guestsUnsubscribe = null;
  }
}

export async function addGuest(uid, eventId, name, tag, guestUid = null, photoURL = null) {
  const guestsRef = collection(db, "users", uid, "events", eventId, "guests");
  const payload = {
    name:      name.trim(),
    tag,
    checkedIn: false,
    createdAt: serverTimestamp()
  };
  if (guestUid)  payload.uid      = guestUid;
  if (photoURL)  payload.photoURL = photoURL;
  await addDoc(guestsRef, payload);
}

export async function toggleCheckIn(uid, eventId, guestId, currentState) {
  const guestRef = doc(db, "users", uid, "events", eventId, "guests", guestId);
  await updateDoc(guestRef, { checkedIn: !currentState });
}

export async function repairGuestAvatars(ownerUid, eventId, guests) {
  const toFix = guests.filter(g => g.uid && !g.photoURL);
  if (!toFix.length) return;
  await Promise.all(toFix.map(async g => {
    try {
      const snap = await getDoc(doc(db, "users", g.uid));
      if (!snap.exists()) return;
      const { photoURL } = snap.data();
      if (!photoURL) return;
      await updateDoc(doc(db, "users", ownerUid, "events", eventId, "guests", g.id), { photoURL });
    } catch { /* silent */ }
  }));
}

export async function removeGuest(uid, eventId, guestId) {
  await deleteDoc(doc(db, "users", uid, "events", eventId, "guests", guestId));
}

export async function updateGuestTag(uid, eventId, guestId, tag) {
  await updateDoc(doc(db, "users", uid, "events", eventId, "guests", guestId), { tag });
}
