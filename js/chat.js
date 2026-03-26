import { db } from "./firebase-config.js";
import {
  collection, doc, addDoc, setDoc, updateDoc, deleteDoc, getDoc, onSnapshot,
  query, orderBy, limit, serverTimestamp, where, arrayUnion, arrayRemove
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

function chatId(uid1, uid2) {
  return [uid1, uid2].sort().join("__");
}

export async function sendMessage(myUid, friendUid, text, replyTo = null) {
  const id  = chatId(myUid, friendUid);
  const ref = doc(db, "chats", id);
  await setDoc(ref, {
    participants:  [myUid, friendUid],
    lastMessage:   text.trim(),
    lastMessageAt: serverTimestamp(),
    lastSenderUid: myUid
  }, { merge: true });
  const msgData = {
    senderUid: myUid,
    text:      text.trim(),
    sentAt:    serverTimestamp()
  };
  if (replyTo) msgData.replyTo = replyTo;
  await addDoc(collection(db, "chats", id, "messages"), msgData);
}

export async function sendEventInvite(myUid, friendUid, eventId, eventName) {
  const id  = chatId(myUid, friendUid);
  const ref = doc(db, "chats", id);
  const preview = `You were invited to "${eventName}"`;
  await setDoc(ref, {
    participants:  [myUid, friendUid],
    lastMessage:   preview,
    lastMessageAt: serverTimestamp(),
    lastSenderUid: myUid
  }, { merge: true });
  await addDoc(collection(db, "chats", id, "messages"), {
    senderUid: myUid,
    text:      preview,
    type:      "event_invite",
    eventId,
    eventName,
    sentAt:    serverTimestamp()
  });
}

export function listenToChat(myUid, friendUid, callback) {
  const id = chatId(myUid, friendUid);
  const q  = query(
    collection(db, "chats", id, "messages"),
    orderBy("sentAt"),
    limit(100)
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export function listenToInbox(uid, callback) {
  const q = query(
    collection(db, "chats"),
    where("participants", "array-contains", uid)
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// ── Event group chat ──────────────────────────────────────────────────────────
// Collection: eventChats/{eventId}/messages/{messageId}

export async function sendEventChatMessage(eventId, uid, displayName, photoURL, text) {
  await addDoc(collection(db, "eventChats", eventId, "messages"), {
    senderUid:   uid,
    senderName:  displayName || "User",
    senderPhoto: photoURL    || null,
    text:        text.trim(),
    sentAt:      serverTimestamp()
  });
}

export function listenToEventChat(eventId, callback) {
  if (!eventId) { callback([]); return () => {}; }
  const q = query(
    collection(db, "eventChats", eventId, "messages"),
    orderBy("sentAt", "desc"),
    limit(50)
  );
  return onSnapshot(q, snap => {
    // Reverse so display order is chronological (oldest → newest)
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })).reverse());
  }, err => {
    console.warn("[EventChat]", err.message);
    callback([]);
  });
}

export async function sendEventAnnouncement(eventId, uid, displayName, photoURL, text) {
  if (!eventId || !text?.trim()) throw new Error("Missing eventId or text");
  await addDoc(collection(db, "eventChats", eventId, "messages"), {
    senderUid:   uid,
    senderName:  displayName || "Host",
    senderPhoto: photoURL    || null,
    text:        text.trim(),
    type:        "announcement",
    sentAt:      serverTimestamp()
  });
}

// ── Reactions ──────────────────────────────────────────────────────────────────
// reactions field: { "🔥": ["uid1"], "👍": ["uid2", "uid3"] }
export async function toggleReaction(eventId, messageId, uid, emoji) {
  if (!eventId || !messageId || !uid || !emoji) return;
  const msgRef  = doc(db, "eventChats", eventId, "messages", messageId);
  const snap    = await getDoc(msgRef);
  if (!snap.exists()) return;
  const current = snap.data().reactions?.[emoji] || [];
  const alreadyReacted = current.includes(uid);
  await updateDoc(msgRef, {
    [`reactions.${emoji}`]: alreadyReacted ? arrayRemove(uid) : arrayUnion(uid)
  });
}

// ── Message delivery / seen status ────────────────────────────────────────────
export async function markDelivered(eventId, messageId, uid) {
  if (!eventId || !messageId || !uid) return;
  try {
    await updateDoc(doc(db, "eventChats", eventId, "messages", messageId), {
      deliveredTo: arrayUnion(uid)
    });
  } catch { /* silent — message may not exist yet */ }
}

export async function markSeen(eventId, messageId, uid) {
  if (!eventId || !messageId || !uid) return;
  try {
    await updateDoc(doc(db, "eventChats", eventId, "messages", messageId), {
      seenBy:      arrayUnion(uid),
      deliveredTo: arrayUnion(uid)
    });
  } catch { /* silent */ }
}

// ── Typing indicator ───────────────────────────────────────────────────────────
// Path: eventChats/{eventId}/typing/{uid}
export async function updateTyping(eventId, uid, displayName) {
  if (!eventId || !uid) return;
  try {
    await setDoc(doc(db, "eventChats", eventId, "typing", uid), {
      displayName: displayName || "User",
      updatedAt:   serverTimestamp()
    });
  } catch { /* silent */ }
}

export async function clearTyping(eventId, uid) {
  if (!eventId || !uid) return;
  try {
    await deleteDoc(doc(db, "eventChats", eventId, "typing", uid));
  } catch { /* silent */ }
}

export function listenToTyping(eventId, selfUid, callback) {
  if (!eventId) { callback([]); return () => {}; }
  return onSnapshot(
    collection(db, "eventChats", eventId, "typing"),
    snap => {
      const now     = Date.now();
      const typists = snap.docs
        .filter(d => d.id !== selfUid)
        .filter(d => {
          const ts = d.data().updatedAt?.toMillis?.() || 0;
          return now - ts < 6000; // stale after 6 s
        })
        .map(d => d.data().displayName || "User");
      callback(typists);
    },
    () => callback([])
  );
}
