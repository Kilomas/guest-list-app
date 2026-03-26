import { db } from "./firebase-config.js";
import {
  collection, onSnapshot, query, orderBy, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let eventsUnsubStats = null;

export function subscribeToStats(uid, onUpdate) {
  if (eventsUnsubStats) eventsUnsubStats();

  const eventsRef = collection(db, "users", uid, "events");
  const q = query(eventsRef, orderBy("createdAt", "desc"));

  eventsUnsubStats = onSnapshot(q, async (snapshot) => {
    const events = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    const stats = await aggregateStats(uid, events);
    onUpdate(stats);
  });
}

export function unsubscribeStats() {
  if (eventsUnsubStats) { eventsUnsubStats(); eventsUnsubStats = null; }
}

async function aggregateStats(uid, events) {
  let totalGuests = 0;
  let totalCheckedIn = 0;
  let topEvent = null;
  let topEventCount = 0;
  const eventDetails = [];

  await Promise.all(events.map(async (ev) => {
    const guestsRef = collection(db, "users", uid, "events", ev.id, "guests");
    const snap = await getDocs(guestsRef);
    const count = snap.size;
    const checkedCount = snap.docs.filter(d => d.data().checkedIn).length;
    totalGuests += count;
    totalCheckedIn += checkedCount;
    if (count > topEventCount) {
      topEventCount = count;
      topEvent = { ...ev, guestCount: count, checkedIn: checkedCount };
    }
    eventDetails.push({ id: ev.id, name: ev.name, date: ev.date || "", guestCount: count, checkedIn: checkedCount });
  }));

  const totalEvents = events.length;
  const avgGuests = totalEvents > 0 ? (totalGuests / totalEvents) : 0;
  const checkInRate = totalGuests > 0 ? Math.round((totalCheckedIn / totalGuests) * 100) : 0;

  eventDetails.sort((a, b) => b.guestCount - a.guestCount);

  return { totalEvents, totalGuests, totalCheckedIn, avgGuests, checkInRate, topEvent, eventDetails };
}

export function animateCounter(el, target, duration = 700) {
  const start = performance.now();
  const from = parseInt(el.textContent) || 0;

  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(from + (target - from) * eased);
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
