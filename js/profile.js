import { auth, db, storage } from "./firebase-config.js";
import {
  doc, onSnapshot, setDoc, serverTimestamp,
  collection, query, orderBy, where, getDocs, limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  ref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import {
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

let profileUnsubscribe = null;

export function subscribeToProfile(uid, onUpdate) {
  if (profileUnsubscribe) profileUnsubscribe();
  const docRef = doc(db, "users", uid);
  profileUnsubscribe = onSnapshot(docRef, (snap) => {
    if (snap.exists()) onUpdate(snap.data());
    else onUpdate(null);
  });
}

export function unsubscribeProfile() {
  if (profileUnsubscribe) { profileUnsubscribe(); profileUnsubscribe = null; }
}

export async function saveProfileField(uid, field, value) {
  const docRef = doc(db, "users", uid);
  await setDoc(docRef, { [field]: value, updatedAt: serverTimestamp() }, { merge: true });
}

export async function updateDisplayName(uid, name) {
  await updateProfile(auth.currentUser, { displayName: name });
  await saveProfileField(uid, "displayName", name);
}

export async function uploadAvatar(uid, file) {
  const storageRef = ref(storage, `avatars/${uid}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  await updateProfile(auth.currentUser, { photoURL: url });
  await saveProfileField(uid, "photoURL", url);
  return url;
}

export function getProviderLabel(providerId) {
  const map = {
    "google.com": "Google",
    "phone": "Phone",
    "password": "Email & Password"
  };
  return map[providerId] || providerId;
}

export function getProviderIcon(providerId) {
  const icons = {
    "google.com": `<svg width="16" height="16" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/></svg>`,
    "phone": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>`,
    "password": `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`
  };
  return icons[providerId] || `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>`;
}

// ── User search (for guest add-bar) ─────────────────────────────────────────
export async function searchUsers(queryStr, excludeUid) {
  const lq = queryStr.toLowerCase().trim();
  if (lq.length < 2) return [];

  const usersRef = collection(db, "users");
  const results  = new Map();

  // Prefix-match on displayNameLower (requires Firestore composite index)
  try {
    const nameQ = query(
      usersRef,
      orderBy("displayNameLower"),
      where("displayNameLower", ">=", lq),
      where("displayNameLower", "<=", lq + "\uf8ff"),
      limit(8)
    );
    const snap = await getDocs(nameQ);
    snap.docs.forEach(d => {
      if (d.id !== excludeUid) results.set(d.id, { id: d.id, ...d.data() });
    });
  } catch (_) {}

  // Phone number prefix / exact match
  const trimmed = queryStr.trim();
  if (/^[+\d][\d\s()-]{3,}$/.test(trimmed)) {
    try {
      const phoneQ = query(usersRef, where("phoneNumber", "==", trimmed), limit(3));
      const phoneSnap = await getDocs(phoneQ);
      phoneSnap.docs.forEach(d => {
        if (d.id !== excludeUid) results.set(d.id, { id: d.id, ...d.data() });
      });
    } catch (_) {}
  }

  return [...results.values()].slice(0, 8);
}
