import { db } from "./firebase-config.js";
import {
  doc, setDoc, getDoc, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let presenceTimer = null;
let visibilityHandler = null;

export function startPresence(uid) {
  const touch = () =>
    setDoc(doc(db, "users", uid), { lastSeen: serverTimestamp() }, { merge: true }).catch(() => {});

  touch();
  if (presenceTimer) clearInterval(presenceTimer);
  presenceTimer = setInterval(touch, 30_000);

  if (visibilityHandler) document.removeEventListener("visibilitychange", visibilityHandler);
  visibilityHandler = () => { if (!document.hidden) touch(); };
  document.addEventListener("visibilitychange", visibilityHandler);
}

export function stopPresence() {
  if (presenceTimer) { clearInterval(presenceTimer); presenceTimer = null; }
  if (visibilityHandler) { document.removeEventListener("visibilitychange", visibilityHandler); visibilityHandler = null; }
}

export function getPresenceLabel(lastSeen) {
  if (!lastSeen) return null;
  const ms = Date.now() - (lastSeen.toDate ? lastSeen.toDate() : new Date(lastSeen)).getTime();
  if (ms < 90_000) return "online";
  const min = Math.floor(ms / 60_000);
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export async function fetchPresenceOnce(uid) {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? getPresenceLabel(snap.data().lastSeen || null) : null;
  } catch {
    return null;
  }
}

export function listenToUserPresence(uid, callback) {
  return onSnapshot(doc(db, "users", uid), snap => {
    callback(snap.exists() ? getPresenceLabel(snap.data().lastSeen || null) : null);
  }, () => callback(null));
}
