import { db } from "./firebase-config.js";
import {
  collection, doc, setDoc, deleteDoc, onSnapshot,
  query, orderBy, serverTimestamp, getDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function sendFriendRequest(fromUid, toUid, senderProfile = {}) {
  await setDoc(doc(db, "users", toUid, "friendRequests", fromUid), {
    fromUid,
    displayName: senderProfile.displayName || null,
    photoURL:    senderProfile.photoURL    || null,
    status:      "pending",
    sentAt:      serverTimestamp()
  });
}

export async function cancelFriendRequest(fromUid, toUid) {
  await deleteDoc(doc(db, "users", toUid, "friendRequests", fromUid));
}

export async function acceptFriendRequest(myUid, fromUid) {
  const [mySnap, fromSnap] = await Promise.all([
    getDoc(doc(db, "users", myUid)),
    getDoc(doc(db, "users", fromUid))
  ]);
  const myData   = mySnap.exists()   ? mySnap.data()   : {};
  const fromData = fromSnap.exists() ? fromSnap.data() : {};

  await Promise.all([
    setDoc(doc(db, "users", myUid, "friends", fromUid), {
      uid:         fromUid,
      displayName: fromData.displayName || null,
      photoURL:    fromData.photoURL    || null,
      addedAt:     serverTimestamp()
    }),
    setDoc(doc(db, "users", fromUid, "friends", myUid), {
      uid:         myUid,
      displayName: myData.displayName || null,
      photoURL:    myData.photoURL    || null,
      addedAt:     serverTimestamp()
    }),
    deleteDoc(doc(db, "users", myUid, "friendRequests", fromUid))
  ]);
}

export async function rejectFriendRequest(myUid, fromUid) {
  await deleteDoc(doc(db, "users", myUid, "friendRequests", fromUid));
}

export async function removeFriend(myUid, friendUid) {
  await Promise.all([
    deleteDoc(doc(db, "users", myUid,     "friends", friendUid)),
    deleteDoc(doc(db, "users", friendUid, "friends", myUid))
  ]);
}

export function listenToFriends(uid, callback) {
  return onSnapshot(
    query(collection(db, "users", uid, "friends"), orderBy("addedAt", "desc")),
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
}

export function listenToFriendRequests(uid, callback) {
  return onSnapshot(
    collection(db, "users", uid, "friendRequests"),
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
}

export async function getFriendStatus(myUid, targetUid) {
  const [friendSnap, receivedSnap, sentSnap] = await Promise.all([
    getDoc(doc(db, "users", myUid,     "friends",       targetUid)),
    getDoc(doc(db, "users", myUid,     "friendRequests", targetUid)),
    getDoc(doc(db, "users", targetUid, "friendRequests", myUid))
  ]);
  if (friendSnap.exists())   return "friends";
  if (receivedSnap.exists()) return "request_received";
  if (sentSnap.exists())     return "request_sent";
  return "none";
}

export async function repairFriendProfiles(myUid, friends) {
  const toRepair = friends.filter(f => !f.displayName || !f.photoURL);
  if (!toRepair.length) return;
  await Promise.all(toRepair.map(async f => {
    const fid = f.uid || f.id;
    if (!fid) return;
    const snap = await getDoc(doc(db, "users", fid));
    if (!snap.exists()) return;
    const d = snap.data();
    const patch = {};
    if (!f.displayName && d.displayName) patch.displayName = d.displayName;
    if (!f.photoURL    && d.photoURL)    patch.photoURL    = d.photoURL;
    if (Object.keys(patch).length) {
      await updateDoc(doc(db, "users", myUid, "friends", fid), patch);
    }
  }));
}
