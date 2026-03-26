import { auth, db } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  linkWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  linkWithPhoneNumber,
  unlink,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let onLoginCallback = null;
let onLogoutCallback = null;
let recaptchaVerifier = null;
let phoneConfirmationResult = null;

export function initAuth(onLogin, onLogout) {
  onLoginCallback = onLogin;
  onLogoutCallback = onLogout;
  onAuthStateChanged(auth, (user) => {
    if (user) onLoginCallback(user);
    else onLogoutCallback();
  });
}

export async function createOrUpdateProfile(user) {
  const ref = doc(db, "users", user.uid);
  await setDoc(ref, {
    uid:              user.uid,
    email:            user.email            || null,
    displayName:      user.displayName      || null,
    displayNameLower: (user.displayName || "").toLowerCase() || null,
    photoURL:         user.photoURL         || null,
    phoneNumber:      user.phoneNumber      || null,
    lastSeen:         serverTimestamp()
  }, { merge: true });
}

export async function loginUser(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await createOrUpdateProfile(cred.user);
  return cred.user;
}

export async function registerUser(email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await createOrUpdateProfile(cred.user);
  return cred.user;
}

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  await createOrUpdateProfile(cred.user);
  return cred.user;
}

export function setupRecaptcha(containerId) {
  if (recaptchaVerifier) {
    try { recaptchaVerifier.clear(); } catch (_) {}
    recaptchaVerifier = null;
  }
  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, { size: "invisible" });
  return recaptchaVerifier;
}

export async function sendPhoneCode(phoneNumber) {
  if (!recaptchaVerifier) setupRecaptcha("recaptcha-container");
  phoneConfirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
  return phoneConfirmationResult;
}

export async function verifyPhoneCode(code) {
  if (!phoneConfirmationResult) throw new Error("No confirmation result. Send code first.");
  const cred = await phoneConfirmationResult.confirm(code);
  await createOrUpdateProfile(cred.user);
  return cred.user;
}

export async function linkGoogleToAccount() {
  const provider = new GoogleAuthProvider();
  const cred = await linkWithPopup(auth.currentUser, provider);
  await createOrUpdateProfile(cred.user);
  return cred.user;
}

export async function sendLinkPhoneCode(phoneNumber) {
  if (!recaptchaVerifier) setupRecaptcha("recaptcha-link-container");
  phoneConfirmationResult = await linkWithPhoneNumber(auth.currentUser, phoneNumber, recaptchaVerifier);
  return phoneConfirmationResult;
}

export async function verifyAndLinkPhone(code) {
  if (!phoneConfirmationResult) throw new Error("No confirmation result.");
  const cred = await phoneConfirmationResult.confirm(code);
  return cred.user;
}

export async function unlinkProvider(providerId) {
  await unlink(auth.currentUser, providerId);
}

export async function updateUserDisplayName(name) {
  await updateProfile(auth.currentUser, { displayName: name });
  await createOrUpdateProfile(auth.currentUser);
}

export async function logoutUser() {
  await signOut(auth);
}

export function getCurrentUser() {
  return auth.currentUser;
}

export function getLinkedProviders() {
  const user = auth.currentUser;
  if (!user) return [];
  return user.providerData.map(p => p.providerId);
}
