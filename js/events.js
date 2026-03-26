import { db } from "./firebase-config.js";
import {
  collection, addDoc, onSnapshot, query, orderBy,
  serverTimestamp, getDocs, doc, setDoc, updateDoc,
  where, limit, getDoc, deleteDoc, startAfter, writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let activeEventId   = null;
let activeEventData = null;
let eventsUnsubscribe = null;
let onEventSelectedCallback = null;

export function getActiveEventId()   { return activeEventId; }
export function getActiveEventData() { return activeEventData; }

export function initEvents(onEventSelected) {
  onEventSelectedCallback = onEventSelected;
}

// ── Load user's own events (real-time) ──────────────────────────────────────
export function loadUserEvents(uid, renderCallback) {
  if (eventsUnsubscribe) eventsUnsubscribe();

  const eventsRef = collection(db, "users", uid, "events");
  const q = query(eventsRef, orderBy("createdAt", "desc"));

  eventsUnsubscribe = onSnapshot(q, (snapshot) => {
    const events = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    renderCallback(events);
  });

  return () => { if (eventsUnsubscribe) eventsUnsubscribe(); };
}

// ── Create event (with privacy) ─────────────────────────────────────────────
export async function createEvent(uid, name, date, description, isPublic = false, hostName = "", location = null, maxGuests = null, photoURL = null) {
  const eventsRef = collection(db, "users", uid, "events");
  const payload = {
    name:        name.trim(),
    nameLower:   name.trim().toLowerCase(),
    date:        date || "",
    description: (description || "").trim(),
    isPublic,
    hostUid:     uid,
    hostName:    hostName || "",
    guestCount:  0,
    createdAt:   serverTimestamp()
  };
  if (location)   payload.location  = location.trim();
  if (maxGuests)  payload.maxGuests = Number(maxGuests);
  if (photoURL)   payload.photoURL  = photoURL.trim();

  const docRef = await addDoc(eventsRef, payload);

  if (isPublic) {
    await setDoc(doc(db, "public-events", docRef.id), {
      ...payload,
      eventId: docRef.id
    });
  }

  return docRef.id;
}

// ── Toggle event privacy ─────────────────────────────────────────────────────
export async function updateEventPrivacy(uid, eventId, isPublic, eventData) {
  const eventRef = doc(db, "users", uid, "events", eventId);
  await updateDoc(eventRef, { isPublic });

  if (isPublic) {
    await setDoc(doc(db, "public-events", eventId), {
      ...eventData,
      isPublic: true,
      hostId: uid,
      eventId
    });
  } else {
    try { await deleteDoc(doc(db, "public-events", eventId)); } catch (_) {}
  }
}

// ── Guest counts helper ──────────────────────────────────────────────────────
export async function getEventGuestCounts(uid, eventId) {
  const guestsRef = collection(db, "users", uid, "events", eventId, "guests");
  const snapshot  = await getDocs(guestsRef);
  const total     = snapshot.size;
  const checkedIn = snapshot.docs.filter(d => d.data().checkedIn).length;
  return { total, checkedIn };
}

// ── Select active event ──────────────────────────────────────────────────────
export function selectEvent(eventId, eventData) {
  activeEventId   = eventId;
  activeEventData = eventData;
  if (onEventSelectedCallback) onEventSelectedCallback(eventId, eventData);
}

export function clearActiveEvent() {
  activeEventId   = null;
  activeEventData = null;
}

// ── Client-side event search ─────────────────────────────────────────────────
export function filterEventsByQuery(events, q) {
  if (!q) return events;
  const lq = q.toLowerCase().trim();
  return events.filter(ev =>
    ev.name.toLowerCase().includes(lq) ||
    (ev.description && ev.description.toLowerCase().includes(lq))
  );
}


// ── Join requests ────────────────────────────────────────────────────────────
export async function requestJoinEvent(hostId, eventId, user) {
  const ref = doc(db, "users", hostId, "events", eventId, "requests", user.uid);
  await setDoc(ref, {
    uid:         user.uid,
    displayName: user.displayName || user.email || "Anonymous",
    photoURL:    user.photoURL    || null,
    status:      "pending",
    requestedAt: serverTimestamp()
  });
}

export async function getMyRequestStatus(hostId, eventId, uid) {
  const ref  = doc(db, "users", hostId, "events", eventId, "requests", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data().status : null;
}

export function listenToJoinRequests(uid, eventId, callback) {
  const ref = collection(db, "users", uid, "events", eventId, "requests");
  const q   = query(ref, orderBy("requestedAt", "desc"));
  return onSnapshot(q, snap => {
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    console.log("[Requests] total docs:", all.length, "pending:", all.filter(r => r.status === "pending").length);
    callback(all.filter(r => r.status === "pending"));
  }, err => {
    console.warn("[Requests] ordered query failed, falling back:", err.message);
    const fallbackQ = collection(db, "users", uid, "events", eventId, "requests");
    return onSnapshot(fallbackQ, snap2 => {
      const all2 = snap2.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(all2.filter(r => r.status === "pending"));
    });
  });
}

export async function respondToRequest(uid, eventId, requestId, approved) {
  const reqRef = doc(db, "users", uid, "events", eventId, "requests", requestId);
  await updateDoc(reqRef, {
    status:      approved ? "approved" : "rejected",
    respondedAt: serverTimestamp()
  });

  try {
    const sentRef = doc(db, "users", requestId, "sentRequests", eventId);
    const sentSnap = await getDoc(sentRef);
    await updateDoc(sentRef, {
      status:      approved ? "approved" : "rejected",
      respondedAt: serverTimestamp(),
      ...(sentSnap.exists() && !sentSnap.data().date ? { date: null } : {})
    });
  } catch { /* silently skip if sentRequests doc doesn't exist (old requests) */ }

  if (approved) {
    const snap = await getDoc(reqRef);
    if (snap.exists()) {
      const data    = snap.data();
      const guestRef = collection(db, "users", uid, "events", eventId, "guests");
      await addDoc(guestRef, {
        name:      data.displayName,
        photoURL: data.photoURL || null,
        tag:       "Friend",
        checkedIn: false,
        uid:       requestId,
        createdAt: serverTimestamp()
      });
    }
  }
}

// ── Global public event search (Firestore "public-events" collection) ────────
const EXPLORE_PAGE = 12;

export async function searchPublicEvents(queryStr = "", cursor = null) {
  const lq = queryStr.toLowerCase().trim();

  const buildQ = (withCursor) => {
    const base = collection(db, "public-events");
    if (lq.length >= 2) {
      // When filtering, fetch a larger page and do client-side filter
      return query(base, orderBy("createdAt", "desc"), limit(50));
    }
    return withCursor && cursor
      ? query(base, orderBy("createdAt", "desc"), startAfter(cursor), limit(EXPLORE_PAGE + 1))
      : query(base, orderBy("createdAt", "desc"), limit(EXPLORE_PAGE + 1));
  };

  const processSnap = (snap) => {
    const docs = snap.docs;
    if (lq.length >= 2) {
      const filtered = docs
        .map(d => ({ id: d.id, ...d.data(), _snap: d }))
        .filter(ev => (ev.nameLower || (ev.name || "").toLowerCase()).includes(lq));
      console.log("[Explore] search filter:", filtered.length, "of", docs.length);
      return { events: filtered, hasMore: false, cursor: null };
    }
    const hasMore  = docs.length > EXPLORE_PAGE;
    const pageDocs = docs.slice(0, EXPLORE_PAGE);
    const items    = pageDocs.map(d => ({ id: d.id, ...d.data(), _snap: d }));
    console.log("[Explore] page:", items.length, "hasMore:", hasMore);
    return { events: items, hasMore, cursor: hasMore ? pageDocs[pageDocs.length - 1] : null };
  };

  try {
    return processSnap(await getDocs(buildQ(true)));
  } catch (e) {
    console.warn("[Explore] ordered query failed, trying fallback:", e.message);
    try {
      const snap = await getDocs(query(collection(db, "public-events"), limit(50)));
      const all  = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      console.log("[Explore] fallback fetched", all.length);
      const filtered = lq.length >= 2
        ? all.filter(ev => (ev.nameLower || (ev.name || "").toLowerCase()).includes(lq))
        : all;
      return { events: filtered, hasMore: false, cursor: null };
    } catch (e2) {
      console.error("[Explore] fallback failed:", e2.message);
      return { events: [], hasMore: false, cursor: null };
    }
  }
}

// ── Request to join a public event ───────────────────────────────────────────
export async function requestToJoinEvent(hostUid, eventId, myUid, user, eventMeta = {}) {
  if (!hostUid || !eventId || !myUid) throw new Error("Missing params");

  // Guard 1: already in guests collection → cannot re-join
  const guestRef = doc(db, "users", hostUid, "events", eventId, "guests", myUid);
  const guestSnap = await getDoc(guestRef);
  if (guestSnap.exists()) throw new Error("ALREADY_GUEST");

  // Guard 2: sentRequest already pending or approved → block duplicate
  const sentRef = doc(db, "users", myUid, "sentRequests", eventId);
  const sentSnap = await getDoc(sentRef);
  if (sentSnap.exists()) {
    const existingStatus = sentSnap.data().status;
    if (existingStatus === "pending" || existingStatus === "approved") {
      throw new Error("ALREADY_REQUESTED");
    }
  }

  // Write request to host's sub-collection (uid as doc ID prevents duplicates at DB level)
  const reqRef = doc(db, "users", hostUid, "events", eventId, "requests", myUid);
  await setDoc(reqRef, {
    status:      "pending",
    uid:         myUid,
    displayName: user?.displayName || "Unknown",
    photoURL:    user?.photoURL    || null,
    requestedAt: serverTimestamp()
  }, { merge: true });

  // Mirror to user's own sentRequests
  await setDoc(sentRef, {
    eventId,
    eventName:  eventMeta.eventName  || "Unknown Event",
    hostUid,
    hostName:   eventMeta.hostName   || "Unknown Host",
    date:       eventMeta.date       || null,
    photoURL:   eventMeta.photoURL   || null,
    status:     "pending",
    createdAt:  serverTimestamp()
  }, { merge: true });
}

export function listenToSentRequests(uid, callback) {
  const q = query(collection(db, "users", uid, "sentRequests"), orderBy("createdAt", "desc"));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, () => {
    return onSnapshot(collection(db, "users", uid, "sentRequests"), snap2 => {
      callback(snap2.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  });
}

/**
 * Subscribe to the user's own created events, mapped to calendar format.
 * Returns unsubscribe function.
 */
export function listenToCalendarEvents(uid, callback) {
  const q = query(collection(db, "users", uid, "events"), orderBy("createdAt", "desc"));
  return onSnapshot(q, snap => {
    const mapped = snap.docs.map(d => ({
      id:        d.id,
      eventId:   d.id,
      eventName: d.data().name  || "Untitled Event",
      hostUid:   uid,
      hostName:  "You",
      date:      d.data().date  || null,
      _isOwn:    true
    }));
    console.log("[Calendar] own events snapshot:", mapped.length,
      mapped.map(e => ({ name: e.eventName, date: e.date })));
    callback(mapped);
  }, err => {
    console.warn("[Calendar] Own events snapshot error:", err.message);
    callback([]);
  });
}

/**
 * For each sentRequest missing date or photoURL, fetch from all three sources:
 *   1. public-events/{eventId}
 *   2. users/{hostUid}/events/{eventId}
 *   3. users/{uid}/events/{eventId}  (user may also be host)
 */
export async function repairSentRequestDates(uid, requests) {
  const results = await Promise.all(requests.map(async r => {
    // Skip if both fields already present
    if (r.date && r.photoURL) return r;

    const patch = {};

    const applySource = (data) => {
      if (!data) return;
      if (!r.date && !patch.date && data.date) patch.date = data.date;
      if (!r.photoURL && !patch.photoURL && data.photoURL) patch.photoURL = data.photoURL;
    };

    const needsMore = () => !(r.date || patch.date) || !(r.photoURL || patch.photoURL);

    // Source 1: public-events
    try {
      const s1 = await getDoc(doc(db, "public-events", r.eventId));
      if (s1.exists()) applySource(s1.data());
    } catch (e1) {
      console.warn("[Repair] public-events fetch error:", e1.message);
    }

    // Source 2: users/{hostUid}/events
    if (needsMore() && r.hostUid) {
      try {
        const s2 = await getDoc(doc(db, "users", r.hostUid, "events", r.eventId));
        if (s2.exists()) applySource(s2.data());
      } catch (e2) {
        console.warn("[Repair] host events fetch error:", e2.message);
      }
    }

    // Source 3: users/{uid}/events (current user may also be host)
    if (needsMore()) {
      try {
        const s3 = await getDoc(doc(db, "users", uid, "events", r.eventId));
        if (s3.exists()) applySource(s3.data());
      } catch (e3) {
        console.warn("[Repair] own events fetch error:", e3.message);
      }
    }

    if (Object.keys(patch).length) {
      updateDoc(doc(db, "users", uid, "sentRequests", r.eventId), patch).catch(() => {});
      return { ...r, ...patch };
    }

    return r;
  }));
  return results;
}

// ── Fetch single event (public-events → host's events) ──────────────────────
export async function fetchEventById(eventId, hostUid) {
  try {
    const pubSnap = await getDoc(doc(db, "public-events", eventId));
    if (pubSnap.exists()) return { id: pubSnap.id, ...pubSnap.data() };
  } catch { /* ignore — may lack read permission */ }

  if (hostUid) {
    try {
      const hostSnap = await getDoc(doc(db, "users", hostUid, "events", eventId));
      if (hostSnap.exists()) return { id: hostSnap.id, ...hostSnap.data() };
    } catch { /* ignore */ }
  }
  return null;
}

// ── Guest preview (first N docs) ────────────────────────────────────────────
export async function getGuestsPreview(hostUid, eventId, previewCount = 6) {
  try {
    const q    = query(collection(db, "users", hostUid, "events", eventId, "guests"), limit(previewCount));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch { return []; }
}

// ── Read user's sentRequest status for one event ─────────────────────────────
export async function getSentRequestStatus(uid, eventId) {
  try {
    const snap = await getDoc(doc(db, "users", uid, "sentRequests", eventId));
    return snap.exists() ? (snap.data().status || "pending") : null;
  } catch { return null; }
}

// ── Real-time: listen to event doc (public-events → user events fallback) ────
export function listenToEventDoc(eventId, hostUid, callback) {
  let unsubPriv = null;

  const startPriv = () => {
    if (unsubPriv || !hostUid) return;
    const privRef = doc(db, "users", hostUid, "events", eventId);
    unsubPriv = onSnapshot(privRef,
      s => callback(s.exists() ? { id: s.id, ...s.data() } : null),
      () => callback(null)
    );
  };

  const unsubPub = onSnapshot(doc(db, "public-events", eventId), snap => {
    if (snap.exists()) {
      if (unsubPriv) { unsubPriv(); unsubPriv = null; }
      callback({ id: snap.id, ...snap.data() });
    } else {
      startPriv();
    }
  }, () => startPriv());

  return () => {
    unsubPub();
    if (unsubPriv) { unsubPriv(); unsubPriv = null; }
  };
}

// ── Real-time: listen to guests subcollection ─────────────────────────────────
export function listenToEventGuests(hostUid, eventId, callback) {
  if (!hostUid || !eventId) { callback([]); return () => {}; }
  const q = query(
    collection(db, "users", hostUid, "events", eventId, "guests"),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, err => {
    console.warn("[listenToEventGuests]", err.message);
    callback([]);
  });
}

// ── Real-time: listen to one sentRequest doc ──────────────────────────────────
export function listenToSentRequestDoc(uid, eventId, callback) {
  if (!uid || !eventId) { callback(null); return () => {}; }
  return onSnapshot(doc(db, "users", uid, "sentRequests", eventId), snap => {
    callback(snap.exists() ? snap.data() : null);
  }, () => callback(null));
}

// ── Event chat access check ───────────────────────────────────────────────────
export async function checkEventChatAccess(eventId, hostUid, uid) {
  if (!uid || !eventId) return false;
  if (uid === hostUid) return true;
  try {
    const guestSnap = await getDoc(doc(db, "users", hostUid, "events", eventId, "guests", uid));
    if (guestSnap.exists()) return true;
  } catch {}
  try {
    const reqSnap = await getDoc(doc(db, "users", uid, "sentRequests", eventId));
    if (reqSnap.exists() && reqSnap.data().status === "approved") return true;
  } catch {}
  return false;
}

// ── Delete event (cascade) ───────────────────────────────────────────────────
export async function deleteEvent(uid, eventId) {
  const batch = writeBatch(db);

  // Delete subcollection docs (guests + requests) — batched
  const subCols = ["guests", "requests"];
  for (const sub of subCols) {
    const snap = await getDocs(collection(db, "users", uid, "events", eventId, sub));
    snap.docs.forEach(d => batch.delete(d.ref));
  }

  // Delete event doc
  batch.delete(doc(db, "users", uid, "events", eventId));

  // Remove from public-events if it exists
  try {
    const pubSnap = await getDoc(doc(db, "public-events", eventId));
    if (pubSnap.exists()) batch.delete(doc(db, "public-events", eventId));
  } catch { /* ignore */ }

  await batch.commit();
}

// ── Update event ─────────────────────────────────────────────────────────────
export async function updateEvent(uid, eventId, updates) {
  const eventRef = doc(db, "users", uid, "events", eventId);
  const payload  = { ...updates };
  if (updates.name) payload.nameLower = updates.name.toLowerCase();

  await updateDoc(eventRef, payload);

  // Sync to public-events if this event is or becomes public
  const snap = await getDoc(eventRef);
  if (snap.exists() && snap.data().isPublic) {
    await updateDoc(doc(db, "public-events", eventId), payload);
  }
  // If visibility changed to private, remove from public-events
  if (updates.isPublic === false) {
    try { await deleteDoc(doc(db, "public-events", eventId)); } catch { /* ignore */ }
  }
}

// ── Invite token ─────────────────────────────────────────────────────────────
export async function getOrCreateInviteToken(uid, eventId) {
  const eventRef = doc(db, "users", uid, "events", eventId);
  const snap     = await getDoc(eventRef);
  if (!snap.exists()) throw new Error("Event not found");

  const existing = snap.data().inviteToken;
  if (existing) return existing;

  // Generate a simple random token
  const token = Array.from(crypto.getRandomValues(new Uint8Array(12)))
    .map(b => b.toString(16).padStart(2, "0")).join("");

  await updateDoc(eventRef, { inviteToken: token });
  // Also sync to public-events
  if (snap.data().isPublic) {
    try { await updateDoc(doc(db, "public-events", eventId), { inviteToken: token }); } catch { /* ignore */ }
  }
  return token;
}

// ── Validate invite ─────────────────────────────────────────────────────────
export async function validateInviteToken(hostUid, eventId, token) {
  const snap = await getDoc(doc(db, "users", hostUid, "events", eventId));
  if (!snap.exists()) return null;
  const data = snap.data();
  if (data.inviteToken !== token) return null;
  return { id: eventId, ...data };
}

// ── Notifications ────────────────────────────────────────────────────────────
export async function createNotification(toUid, type, payload) {
  await addDoc(collection(db, "users", toUid, "notifications"), {
    type,
    ...payload,
    read:      false,
    createdAt: serverTimestamp()
  });
}

export function listenToNotifications(uid, callback) {
  const q = query(
    collection(db, "users", uid, "notifications"),
    orderBy("createdAt", "desc"),
    limit(30)
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, err => {
    console.warn("[Notifs] listener error:", err.message);
    callback([]);
  });
}

export async function markNotificationsRead(uid, ids) {
  await Promise.all(ids.map(id =>
    updateDoc(doc(db, "users", uid, "notifications", id), { read: true }).catch(() => {})
  ));
}

// ── Event status helper ──────────────────────────────────────────────────────
export function getEventStatus(dateStr) {
  if (!dateStr) return "upcoming";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "upcoming";
  const now   = new Date();
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const end   = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
  if (now < start) return "upcoming";
  if (now >= start && now < end) return "ongoing";
  return "completed";
}
