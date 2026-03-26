import { initAuth, loginUser, registerUser, loginWithGoogle, logoutUser, setupRecaptcha, sendPhoneCode, verifyPhoneCode, sendLinkPhoneCode, verifyAndLinkPhone, linkGoogleToAccount, unlinkProvider, updateUserDisplayName, getLinkedProviders, getCurrentUser } from "./auth.js";
import { storage, db } from "./firebase-config.js";
import { doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import { initEvents, loadUserEvents, createEvent, selectEvent, clearActiveEvent, getActiveEventId, getActiveEventData, filterEventsByQuery, updateEventPrivacy, listenToJoinRequests, respondToRequest, searchPublicEvents, listenToSentRequests, repairSentRequestDates, listenToCalendarEvents, deleteEvent, updateEvent, getOrCreateInviteToken, createNotification, listenToNotifications, markNotificationsRead, getEventStatus, fetchEventById, getGuestsPreview, getSentRequestStatus, requestToJoinEvent, listenToEventDoc, listenToEventGuests, listenToSentRequestDoc, checkEventChatAccess } from "./events.js";
import { initGuests, listenToGuests, stopListeningToGuests, addGuest, toggleCheckIn, repairGuestAvatars, removeGuest, updateGuestTag } from "./guests.js";
import { subscribeToStats, unsubscribeStats, animateCounter } from "./stats.js";
import { subscribeToProfile, unsubscribeProfile, updateDisplayName, uploadAvatar, getProviderLabel, getProviderIcon, searchUsers } from "./profile.js";
import { initParticles, attachInteraction } from "./particles.js";
import { sendFriendRequest, cancelFriendRequest, acceptFriendRequest, rejectFriendRequest, removeFriend, listenToFriends, listenToFriendRequests, getFriendStatus, repairFriendProfiles } from "./friends.js";
import { sendMessage, listenToChat, sendEventInvite, sendEventChatMessage, listenToEventChat, sendEventAnnouncement, toggleReaction, markDelivered, markSeen, updateTyping, clearTyping, listenToTyping } from "./chat.js";
import { startPresence, stopPresence, listenToUserPresence, fetchPresenceOnce } from "./presence.js";

// ── DOM cache ──
const $ = id => document.getElementById(id);

const landingView  = $("landing-view");
const authView     = $("auth-view");
const appView      = $("app-view");

const tabLogin     = $("tab-login");
const tabRegister  = $("tab-register");
const tabPhone     = $("tab-phone");
const loginForm    = $("login-form");
const registerForm = $("register-form");
const phoneForm    = $("phone-form");
const googleSection= $("google-section");

const loginEmailEl = $("login-email");
const loginPassEl  = $("login-password");
const loginBtn     = $("login-btn");
const loginErr     = $("login-error");

const regEmailEl   = $("register-email");
const regPassEl    = $("register-password");
const regBtn       = $("register-btn");
const regErr       = $("register-error");

const googleBtn    = $("google-btn");
const backLandBtn  = $("back-to-landing");

const phonePrefix  = $("phone-prefix");
const phoneNum     = $("phone-number");
const sendCodeBtn  = $("send-code-btn");
const phoneErr1    = $("phone-error-1");
const otpInput     = $("otp-input");
const verifyBtn    = $("verify-code-btn");
const resendBtn    = $("resend-code-btn");
const phoneErr2    = $("phone-error-2");
const phoneStep1   = $("phone-step-1");
const phoneStep2   = $("phone-step-2");

const logoutBtn    = $("logout-btn");
const userAvatarEl = $("user-avatar");
const userNameEl   = $("user-name");

const eventsListEl   = $("events-list");
const eventSearchInput = $("event-search-input");

const noEventEl      = $("no-event-placeholder");
const eventStatCard  = $("event-stat-card");
const eventNameEl    = $("event-header-name");
const eventDateEl    = $("event-header-date");
const statTotalEl    = $("stat-total");
const statCheckedEl  = $("stat-checked");

const addGuestBar    = $("add-guest-bar");
const guestNameInput = $("guest-name-input");
const guestTagSelect = $("guest-tag-select");
const addGuestBtn    = $("add-guest-btn");

const guestListCard  = $("guest-list-card");
const guestListEl    = $("guest-list");
const filterPills    = document.querySelectorAll(".filter-pill");
const userSearchDropdown = $("user-search-dropdown");

// ── Landing nav auth state ──
const lnavAnon    = $("lnav-anon");
const lnavAuthBar = $("lnav-auth-bar");
const lnavUserAv  = $("lnav-user-av");
const lnavUserName= $("lnav-user-name");
const navDashBtn  = $("nav-dashboard-btn");

// ── Explore panel ──
const exploreSearchInput = $("explore-search-input");
const exploreSearchBtn   = $("explore-search-btn");
const exploreResults     = $("explore-results");

// ── Friends panel ──
const friendsSearchInput   = $("friends-search-input");
const friendsSearchResults = $("friends-search-results");
const friendRequestsList   = $("friend-requests-list");
const friendsList          = $("friends-list");
const friendReqBadge       = $("friend-req-badge");
const chatNoSelection      = $("chat-no-selection");
const chatWindow           = $("chat-window");
const chatHeaderAv         = $("chat-header-av");
const chatHeaderName       = $("chat-header-name");
const chatMessages         = $("chat-messages");
const chatInput            = $("chat-input");
const sendMsgBtn           = $("send-msg-btn");
const replyPreviewEl       = $("reply-preview");
const replySenderEl        = $("reply-sender-name");
const replyTextEl          = $("reply-text-preview");
const replyCloseBtn        = $("reply-close-btn");

const joinRequestsPanel  = $("join-requests-panel");
const joinRequestsBadge  = $("join-requests-badge");
const joinRequestsListEl = $("join-requests-list");
const particleCanvas     = $("particle-canvas");

const profileAvatarEl    = $("profile-avatar-el");
const profileNameDisplay = $("profile-name-display");
const profileNameEdit    = $("profile-name-edit");
const profileNameInput   = $("profile-name-input");
const profileEmailDisplay= $("profile-email-display");
const profileUidDisplay  = $("profile-uid-display");
const editNameBtn        = $("edit-name-btn");
const saveNameBtn        = $("save-name-btn");
const cancelNameBtn      = $("cancel-name-btn");
const avatarFileInput    = $("avatar-file-input");
const providersListEl    = $("providers-list");
const linkPhoneForm      = $("link-phone-form");

const linkPhonePrefix  = $("link-phone-prefix");
const linkPhoneInput   = $("link-phone-input");
const linkSendCodeBtn  = $("link-send-code-btn");
const linkPhoneCancel  = $("link-phone-cancel-btn");
const linkPhoneStep1   = $("link-phone-step-1");
const linkPhoneStep2   = $("link-phone-step-2");
const linkOtpInput     = $("link-otp-input");
const linkVerifyBtn    = $("link-verify-btn");
const linkPhoneBack    = $("link-phone-back-btn");
const linkPhoneError   = $("link-phone-error");

// ── State ──
let currentUID   = null;
let currentGuests = [];
let activeFilter  = "all";
let statsLoaded   = false;
let allEvents     = [];
let eventSearchQuery = "";
let joinRequestsUnsub = null;
let selectedUser  = null;
let searchTimer   = null;
// friends/chat state
let friendsUnsub    = null;
let friendReqUnsub  = null;
let chatUnsub       = null;
let presenceUnsub   = null;
let activeChatFriend = null;
let myFriendsMap    = {};
let friendsSearchTimer = null;
let lastMsgCount    = 0;
let replyTarget     = null;
// activity panel state
let sentReqUnsub    = null;
let ownEventsUnsub  = null;
let activityLoaded  = false;
let calYear         = new Date().getFullYear();
let calMonth        = new Date().getMonth();
let calJoinedEvents = [];
let _actPendingReqs = []; // pending join requests shown in Joined Events tab
let ownCalEvents    = [];
let calSelectedDate = null;
// notifications state
let notifUnsub      = null;
let notifPanelOpen  = false;
let allNotifs       = [];
// event management state
let pendingDeleteId = null;
let editFlatpickr   = null;
let selectedInviteFriends = new Set();

const chatHeaderStatus = $("chat-header-status");

// ── Activity panel DOM ──
const activityReqList    = $("activity-requests-list");
const activityJoinedList = $("activity-joined-list");
const calGrid            = $("cal-grid");
const calMonthLabel      = $("cal-month-label");
const calEventPanel      = $("cal-events-panel");
const calUpcomingList    = $("cal-upcoming-list");

// ── New feature DOM refs ──
const notifBell      = $("notif-bell");
const notifBadge     = $("notif-badge");
const notifPanel     = $("notif-panel");
const notifList      = $("notif-list");
const notifMarkRead  = $("notif-mark-read");
const eventMetaRow   = $("event-meta-row");
const eventActions   = $("event-actions");

// ── Toast ──
function toast(msg, type = "info") {
  const stack = $("toast-stack");
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  const icons = { success: "✓", error: "✕", info: "◈" };
  el.innerHTML = `<span class="toast-icon">${icons[type] || "◈"}</span>${escHtml(msg)}`;
  stack.appendChild(el);
  setTimeout(() => {
    el.classList.add("hiding");
    el.addEventListener("animationend", () => el.remove(), { once: true });
  }, 3200);
}

// ── Loading state helper ──
function setLoading(btn, loading, label) {
  btn.disabled = loading;
  btn.innerHTML = loading ? `<span class="spinner"></span>` : (label || btn.dataset.label || btn.textContent);
}

// ── Auth error messages ──
function authErrMsg(code) {
  return ({
    "auth/user-not-found":         "No account found with this email.",
    "auth/wrong-password":         "Incorrect password.",
    "auth/invalid-credential":     "Invalid email or password.",
    "auth/email-already-in-use":   "An account already exists with this email.",
    "auth/invalid-email":          "Enter a valid email address.",
    "auth/too-many-requests":      "Too many attempts. Try again later.",
    "auth/weak-password":          "Password must be at least 6 characters.",
    "auth/invalid-phone-number":   "Invalid phone number format. Include country code.",
    "auth/invalid-verification-code": "Incorrect verification code.",
    "auth/popup-closed-by-user":   "Sign-in popup was closed.",
    "auth/cancelled-popup-request":"Sign-in was cancelled.",
    "auth/credential-already-in-use": "This account is already linked to another user.",
    "auth/provider-already-linked": "This provider is already linked to your account."
  })[code] || "Something went wrong. Please try again.";
}

// ═══════════════════════════════════════
// LANDING NAV AUTH STATE
// ═══════════════════════════════════════

function updateLandingNav(user) {
  if (!lnavAnon || !lnavAuthBar) return;
  if (user) {
    lnavAnon.classList.add("hidden");
    lnavAuthBar.classList.remove("hidden");
    const name = user.displayName || user.email || "User";
    const av   = name[0].toUpperCase();
    if (lnavUserAv) {
      if (user.photoURL) {
        lnavUserAv.innerHTML = `<img src="${user.photoURL}" alt=""/>`;
      } else {
        lnavUserAv.textContent = av;
      }
    }
    if (lnavUserName) lnavUserName.textContent = name.split(" ")[0];
  } else {
    lnavAnon.classList.remove("hidden");
    lnavAuthBar.classList.add("hidden");
  }
}

// ═══════════════════════════════════════
// SPA SECTION NAVIGATION (landing page)
// ═══════════════════════════════════════

let activeLandingSection = "home";

function showLandingSection(name) {
  activeLandingSection = name;
  document.querySelectorAll(".ls-section").forEach(s => {
    s.classList.toggle("ls-hidden", s.dataset.ls !== name);
  });
  document.querySelectorAll(".lnav-link").forEach(a => {
    a.classList.toggle("active", a.dataset.ls === name);
  });
  window.scrollTo(0, 0);
}

// ═══════════════════════════════════════
// VIEWS
// ═══════════════════════════════════════

function showLanding() {
  landingView.classList.remove("hidden");
  authView.classList.add("hidden");
  appView.classList.add("hidden");
  document.body.classList.remove("app-mode");
  if (particleCanvas) particleCanvas.classList.add("active");
  showLandingSection("home");
}

function showAuth(registerTab = false) {
  landingView.classList.add("hidden");
  authView.classList.remove("hidden");
  appView.classList.add("hidden");
  document.body.classList.remove("app-mode");
  if (particleCanvas) particleCanvas.classList.remove("active");
  if (registerTab) tabRegister.click(); else tabLogin.click();
}

function showApp(user) {
  currentUID = user.uid;
  landingView.classList.add("hidden");
  authView.classList.add("hidden");
  appView.classList.remove("hidden");
  document.body.classList.add("app-mode");
  if (particleCanvas) particleCanvas.classList.remove("active");
  updateLandingNav(user);

  const displayName = user.displayName || user.email || "User";
  const initial     = (user.displayName || user.email || "U")[0].toUpperCase();
  userNameEl.textContent = displayName;

  if (user.photoURL) {
    userAvatarEl.innerHTML = `<img src="${user.photoURL}" alt="avatar"/>`;
  } else {
    userAvatarEl.textContent = initial;
  }

  loadEvents();
  statsLoaded = false;
  startPresence(currentUID);
  startNotifications(currentUID);

  requestAnimationFrame(() => {
    initUX();
    // Handle ?eventId= deep links — auto-open event details on page load
    const params   = new URLSearchParams(window.location.search);
    const deepId   = params.get("eventId");
    if (deepId) {
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(async () => {
        try {
          const evData = await fetchEventById(deepId, null);
          if (evData) openEventDetails({ ...evData, id: evData.id, _userRelation: "none" });
          else toast("Event not found.", "error");
        } catch { toast("Event not found.", "error"); }
      }, 900);
    }
  });
}

function showAuthState() {
  currentUID = null;
  stopListeningToGuests();
  unsubscribeStats();
  unsubscribeProfile();
  clearActiveEvent();
  if (joinRequestsUnsub) { joinRequestsUnsub(); joinRequestsUnsub = null; }
  if (friendsUnsub)   { friendsUnsub();   friendsUnsub  = null; }
  if (friendReqUnsub) { friendReqUnsub(); friendReqUnsub= null; }
  if (chatUnsub)      { chatUnsub();      chatUnsub     = null; }
  if (presenceUnsub)  { presenceUnsub();  presenceUnsub = null; }
  if (sentReqUnsub)   { sentReqUnsub();   sentReqUnsub  = null; }
  if (ownEventsUnsub) { ownEventsUnsub(); ownEventsUnsub = null; }
  if (notifUnsub)     { notifUnsub();     notifUnsub    = null; }
  if (inviteModalUnsub) { inviteModalUnsub(); inviteModalUnsub = null; }
  stopPresence();
  activeChatFriend = null;
  activityLoaded   = false;
  calJoinedEvents  = [];
  ownCalEvents     = [];
  myFriendsMap = {};
  exploreLoaded = false;
  resetEventsContent();
  eventsListEl.innerHTML = `<p class="events-empty">No events yet.</p>`;
  currentGuests = [];
  allEvents = [];
  updateLandingNav(null);
  showLanding();
}

// ═══════════════════════════════════════
// PANEL NAVIGATION
// ═══════════════════════════════════════

function activatePanel(name) {
  const eventsParent = document.getElementById("nav-events-parent");
  const eventsRelated = ["events", "activity"];

  document.querySelectorAll(".nav-item").forEach(b => {
    const isEventsParent = b.id === "nav-events-parent";
    if (isEventsParent) {
      b.classList.toggle("active", eventsRelated.includes(name));
    } else {
      b.classList.toggle("active", b.dataset.panel === name);
    }
  });

  document.querySelectorAll(".nav-sub-item").forEach(b => {
    b.classList.toggle("active", b.dataset.subpanel === `events-${name}` ||
      (name === "events" && b.dataset.subpanel === "events-own"));
  });

  if (eventsRelated.includes(name) && eventsParent) {
    eventsParent.classList.add("expanded");
    document.getElementById("nav-events-sub")?.classList.add("open");
  }

  const nextPanel = document.getElementById(`panel-${name}`);
  const EXIT_MS   = 180; // slightly longer than CSS 0.16s for safety

  document.querySelectorAll(".app-panel").forEach(p => {
    if (p === nextPanel) return;
    if (p.classList.contains("hidden")) return;
    if (p.classList.contains("panel-exiting")) return;

    p.classList.add("panel-exiting");
    const done = () => { p.classList.remove("panel-exiting"); p.classList.add("hidden"); };
    p.addEventListener("animationend", done, { once: true });
    setTimeout(done, EXIT_MS); // fallback in case animationend misfires
  });

  if (nextPanel?.classList.contains("hidden")) {
    nextPanel.classList.remove("hidden");
    // Re-trigger enter animation
    nextPanel.style.animation = "none";
    nextPanel.offsetHeight;
    nextPanel.style.animation = "";
  }

  // Sync mobile bottom nav active state
  document.querySelectorAll(".mbn-item").forEach(b => {
    const match = b.dataset.panel === name ||
      (name === "activity" && b.dataset.panel === "events");
    b.classList.toggle("active", match);
  });
  moveMobileNavIndicator();

  if (name === "stats" && !statsLoaded && currentUID) {
    statsLoaded = true;
    subscribeToStats(currentUID, renderStats);
  }
  if (name === "profile" && currentUID) {
    loadProfilePanel();
  }
  if (name === "explore" && currentUID) {
    loadExplorePanel();
  }
  if (name === "friends" && currentUID) {
    loadFriendsPanel();
  }
  if (name === "activity" && currentUID) {
    loadActivityPanel();
  }
}

// Safety alias so any old switchView("x") calls don't throw
window.switchView = name => activatePanel(name);

document.querySelectorAll(".nav-item").forEach(btn => {
  btn.addEventListener("click", () => {
    if (btn.dataset.panel === "home") { showLanding(); return; }
    if (btn.id === "nav-events-parent") {
      const sub = document.getElementById("nav-events-sub");
      const isExpanded = btn.classList.contains("expanded");
      btn.classList.toggle("expanded", !isExpanded);
      sub?.classList.toggle("open", !isExpanded);
      return;
    }
    activatePanel(btn.dataset.panel);
  });
});

document.querySelectorAll(".nav-sub-item").forEach(btn => {
  btn.addEventListener("click", () => {
    if (btn.dataset.subpanel === "events-own")      activatePanel("events");
    if (btn.dataset.subpanel === "events-activity") activatePanel("activity");
  });
});

// ── Mobile bottom navigation ──────────────────────────────────
document.querySelectorAll(".mbn-item").forEach(btn => {
  btn.addEventListener("click", () => {
    const panel = btn.dataset.panel;
    if (!panel) return;
    if (panel === "home") { showLanding(); return; }
    activatePanel(panel);
  });
});

// ── Swipe-down to close modal (mobile) ────────────────────────
function addSwipeClose(overlayEl, closeFn) {
  if (!overlayEl) return;
  let startY = 0;
  overlayEl.addEventListener("touchstart", e => {
    startY = e.touches[0].clientY;
  }, { passive: true });
  overlayEl.addEventListener("touchend", e => {
    const dy = e.changedTouches[0].clientY - startY;
    if (dy > 90) closeFn();
  }, { passive: true });
}

// ═══════════════════════════════════════
// LANDING NAV (SPA — no scroll)
// ═══════════════════════════════════════

// Logo always goes back to home section
document.querySelector(".lnav-logo").addEventListener("click", e => {
  e.preventDefault();
  showLandingSection("home");
});

// Nav links switch sections (no scroll)
document.querySelectorAll(".lnav-link[data-ls]").forEach(a => {
  a.addEventListener("click", e => {
    e.preventDefault();
    showLandingSection(a.dataset.ls);
  });
});

// CTA / auth buttons
$("nav-login-btn") .addEventListener("click", () => showAuth(false));
$("nav-signup-btn").addEventListener("click", () => showAuth(true));
$("hero-cta-btn")  .addEventListener("click", () => showAuth(true));
$("hero-login-btn").addEventListener("click", () => showAuth(false));
$("cta-signup-btn").addEventListener("click", () => showAuth(true));
$("cta-login-btn") .addEventListener("click", () => showAuth(false));
backLandBtn        .addEventListener("click", showLanding);

// Dashboard button (when logged in, from landing page)
if (navDashBtn) {
  navDashBtn.addEventListener("click", () => {
    const user = getCurrentUser();
    if (user) {
      landingView.classList.add("hidden");
      appView.classList.remove("hidden");
      if (particleCanvas) particleCanvas.classList.remove("active");
    }
  });
}

// ═══════════════════════════════════════
// AUTH TABS
// ═══════════════════════════════════════

function setAuthTab(name) {
  const tabs = { login: loginForm, register: registerForm, phone: phoneForm };
  [tabLogin, tabRegister, tabPhone].forEach(t => t.classList.remove("active"));
  Object.values(tabs).forEach(f => f.classList.add("hidden"));

  if (name === "login")    { tabLogin.classList.add("active");    loginForm.classList.remove("hidden"); googleSection.classList.remove("hidden"); }
  if (name === "register") { tabRegister.classList.add("active"); registerForm.classList.remove("hidden"); googleSection.classList.remove("hidden"); }
  if (name === "phone")    { tabPhone.classList.add("active");    phoneForm.classList.remove("hidden");  googleSection.classList.add("hidden"); resetPhoneSteps(); }
}

tabLogin   .addEventListener("click", () => setAuthTab("login"));
tabRegister.addEventListener("click", () => setAuthTab("register"));
tabPhone   .addEventListener("click", () => setAuthTab("phone"));

// ═══════════════════════════════════════
// AUTH ACTIONS
// ═══════════════════════════════════════

googleBtn.addEventListener("click", async () => {
  setLoading(googleBtn, true, "Continue with Google");
  try { await loginWithGoogle(); }
  catch (e) { toast(authErrMsg(e.code), "error"); setLoading(googleBtn, false, `<svg width="17" height="17" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/></svg> Continue with Google`); }
});

loginBtn.addEventListener("click", async () => {
  const email = loginEmailEl.value.trim(), pass = loginPassEl.value;
  if (!email || !pass) return showErr(loginErr, "Fill in all fields.");
  setLoading(loginBtn, true);
  try { await loginUser(email, pass); loginErr.classList.remove("show"); }
  catch (e) { showErr(loginErr, authErrMsg(e.code)); }
  finally { setLoading(loginBtn, false); }
});
loginPassEl.addEventListener("keydown", e => { if (e.key === "Enter") loginBtn.click(); });

regBtn.addEventListener("click", async () => {
  const email = regEmailEl.value.trim(), pass = regPassEl.value;
  if (!email || !pass) return showErr(regErr, "Fill in all fields.");
  if (pass.length < 6) return showErr(regErr, "Password must be at least 6 characters.");
  setLoading(regBtn, true);
  try { await registerUser(email, pass); regErr.classList.remove("show"); }
  catch (e) { showErr(regErr, authErrMsg(e.code)); }
  finally { setLoading(regBtn, false); }
});
regPassEl.addEventListener("keydown", e => { if (e.key === "Enter") regBtn.click(); });

// Phone auth
function resetPhoneSteps() {
  phoneStep1.classList.remove("hidden");
  phoneStep2.classList.add("hidden");
  phoneErr1.classList.remove("show");
  phoneErr2.classList.remove("show");
  phoneNum.value = "";
  otpInput.value = "";
}

sendCodeBtn.addEventListener("click", async () => {
  const num = (phonePrefix.value + phoneNum.value.replace(/\s/g, "")).trim();
  if (!num || num.length < 7) return showErr(phoneErr1, "Enter a valid phone number.");
  setLoading(sendCodeBtn, true);
  try {
    setupRecaptcha("recaptcha-container");
    await sendPhoneCode(num);
    phoneStep1.classList.add("hidden");
    phoneStep2.classList.remove("hidden");
    otpInput.focus();
  } catch (e) {
    showErr(phoneErr1, authErrMsg(e.code));
  } finally {
    setLoading(sendCodeBtn, false);
  }
});

verifyBtn.addEventListener("click", async () => {
  const code = otpInput.value.trim();
  if (code.length !== 6) return showErr(phoneErr2, "Enter the 6-digit code.");
  setLoading(verifyBtn, true);
  try { await verifyPhoneCode(code); phoneErr2.classList.remove("show"); }
  catch (e) { showErr(phoneErr2, authErrMsg(e.code)); }
  finally { setLoading(verifyBtn, false); }
});

resendBtn.addEventListener("click", resetPhoneSteps);
otpInput.addEventListener("keydown", e => { if (e.key === "Enter") verifyBtn.click(); });

logoutBtn.addEventListener("click", async () => {
  stopListeningToGuests();
  unsubscribeStats();
  unsubscribeProfile();
  await logoutUser();
});

// ═══════════════════════════════════════
// EVENTS
// ═══════════════════════════════════════

function loadEvents() {
  loadUserEvents(currentUID, renderEventsList);
}

function renderEventsList(events) {
  allEvents = events;
  const filtered = filterEventsByQuery(events, eventSearchQuery);
  eventsListEl.innerHTML = "";
  if (!filtered.length) {
    eventsListEl.innerHTML = `<p class="events-empty">${events.length ? "No events match your search." : "No events yet. Create one!"}</p>`;
    return;
  }
  filtered.forEach(ev => {
    const item = document.createElement("div");
    item.className = `event-entry${getActiveEventId() === ev.id ? " active" : ""}`;
    item.dataset.id = ev.id;
    const status   = getEventStatus(ev.date);
    const pubBadge = ev.isPublic ? `<span style="font-size:9px;color:var(--accent);font-weight:700;opacity:0.8;margin-left:4px;">PUBLIC</span>` : "";
    const statusDot = status === "ongoing" ? `<span style="display:inline-block;width:5px;height:5px;border-radius:50%;background:var(--em);margin-left:4px;vertical-align:middle;box-shadow:0 0 4px var(--em);"></span>` : "";
    const thumbHtml = ev.photoURL
      ? `<img class="ev-entry-thumb" src="${escHtml(ev.photoURL)}" alt="" loading="lazy" onerror="this.classList.add('ev-entry-thumb-err')">`
      : `<div class="ev-entry-thumb ev-entry-thumb-fb">${(ev.name || "E")[0].toUpperCase()}</div>`;
    const descHtml = ev.description
      ? `<div class="event-entry-desc">${escHtml(ev.description.slice(0, 60))}${ev.description.length > 60 ? "…" : ""}</div>`
      : "";

    item.innerHTML = `
      <div class="event-entry-top">
        ${thumbHtml}
        <div class="event-entry-info">
          <div class="event-entry-name">${escHtml(ev.name)}${pubBadge}${statusDot}</div>
          ${descHtml}
          <div class="event-entry-meta">${ev.date ? fmtDate(ev.date) : "No date"}${ev.location ? " · " + escHtml(ev.location) : ""}</div>
        </div>
      </div>
      <div class="event-entry-actions">
        <button class="btn-ev-entry view" data-action="view" title="View Overview">◎</button>
        <button class="btn-ev-entry btn-ev-chat" data-action="chat" title="Event Chat">💬</button>
        <button class="btn-ev-entry" data-action="edit" title="Edit">✎</button>
        <button class="btn-ev-entry del" data-action="delete" title="Delete">✕</button>
      </div>`;

    item.querySelector("[data-action=view]").addEventListener("click", e => {
      e.stopPropagation();
      openEventDetails({ id: ev.id, name: ev.name, hostUid: currentUID, hostName: "You", date: ev.date, photoURL: ev.photoURL, description: ev.description, isPublic: ev.isPublic, _userRelation: "host" });
    });
    item.querySelector("[data-action=chat]").addEventListener("click", e => {
      e.stopPropagation();
      openEventChat(ev.id, ev.name, ev.hostUid || currentUID);
    });
    item.querySelector("[data-action=edit]").addEventListener("click", e => {
      e.stopPropagation();
      openEditModal(ev);
    });
    item.querySelector("[data-action=delete]").addEventListener("click", e => {
      e.stopPropagation();
      openDeleteModal(ev.id, ev.name);
    });

    item.addEventListener("click", () => {
      document.querySelectorAll(".event-entry").forEach(e => e.classList.remove("active"));
      item.classList.add("active");
      selectEvent(ev.id, ev);
    });
    eventsListEl.appendChild(item);
  });
}

// ── Create event button (sidebar + empty state) ──
$("btn-create-new-event")?.addEventListener("click", () => openEventModal(null));
$("btn-no-event-create")?.addEventListener("click", () => openEventModal(null));

if (eventSearchInput) {
  eventSearchInput.addEventListener("input", () => {
    eventSearchQuery = eventSearchInput.value;
    renderEventsList(allEvents);
  });
}

function onEventSelected(eventId, eventData) {
  stopListeningToGuests();
  currentGuests = [];
  activeFilter = "all";
  selectedUser = null;
  guestNameInput.value = "";
  guestNameInput.classList.remove("has-selection");
  userSearchDropdown.classList.add("hidden");
  filterPills.forEach(p => p.classList.toggle("active", p.dataset.filter === "all"));

  eventNameEl.textContent  = eventData.name;
  eventDateEl.textContent  = eventData.date ? fmtDate(eventData.date) : "";
  statTotalEl.textContent  = "0";
  statCheckedEl.textContent= "0";

  // Meta row: location, maxGuests, status badge
  if (eventMetaRow) {
    const parts = [];
    const status = getEventStatus(eventData.date);
    const statusLabels = { upcoming: "Upcoming", ongoing: "Live Now", completed: "Completed" };
    parts.push(`<span class="event-status-badge ${status}">${statusLabels[status]}</span>`);
    if (eventData.location) {
      parts.push(`<span class="event-meta-pill">📍 ${escHtml(eventData.location)}</span>`);
    }
    if (eventData.maxGuests) {
      parts.push(`<span class="event-meta-pill">👥 Max ${escHtml(String(eventData.maxGuests))}</span>`);
    }
    eventMetaRow.innerHTML = parts.join("");
  }

  // Show/hide event action buttons (only host can edit/delete)
  if (eventActions) {
    eventActions.style.display = "flex";
  }

  noEventEl.classList.add("hidden");
  eventStatCard.classList.remove("hidden");
  addGuestBar.classList.remove("hidden");
  guestListCard.classList.remove("hidden");

  if (joinRequestsUnsub) { joinRequestsUnsub(); joinRequestsUnsub = null; }

  if (eventData.isPublic) {
    joinRequestsPanel.classList.remove("hidden");
    joinRequestsUnsub = listenToJoinRequests(currentUID, eventId, renderJoinRequests);
  } else {
    joinRequestsPanel.classList.add("hidden");
    joinRequestsListEl.innerHTML = `<div class="join-requests-empty">No pending requests.</div>`;
    joinRequestsBadge.classList.add("hidden");
  }

  listenToGuests(currentUID, eventId);
}

function resetEventsContent() {
  noEventEl.classList.remove("hidden");
  eventStatCard.classList.add("hidden");
  addGuestBar.classList.add("hidden");
  guestListCard.classList.add("hidden");
  joinRequestsPanel.classList.add("hidden");
  guestListEl.innerHTML = "";
  if (joinRequestsUnsub) { joinRequestsUnsub(); joinRequestsUnsub = null; }
}

// ═══════════════════════════════════════
// JOIN REQUESTS
// ═══════════════════════════════════════

function renderJoinRequests(requests) {
  const count = requests.length;
  if (count > 0) {
    joinRequestsBadge.textContent = count;
    joinRequestsBadge.classList.remove("hidden");
  } else {
    joinRequestsBadge.classList.add("hidden");
  }

  if (!count) {
    joinRequestsListEl.innerHTML = `<div class="join-requests-empty">No pending requests.</div>`;
    return;
  }

  joinRequestsListEl.innerHTML = "";
  requests.forEach(req => {
    const row = document.createElement("div");
    row.className = "join-request-row";
    const initials = (req.displayName || "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
    const avatarInner = req.photoURL
      ? `<img src="${escHtml(req.photoURL)}" alt=""/>`
      : initials;
    row.innerHTML = `
      <div class="join-request-av">${avatarInner}</div>
      <div class="join-request-name">${escHtml(req.displayName || "Unknown")}</div>
      <div class="join-request-actions">
        <button class="btn-approve" data-id="${req.id}">Approve</button>
        <button class="btn-reject"  data-id="${req.id}">Reject</button>
      </div>`;

    row.querySelector(".btn-approve").addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      try {
        await respondToRequest(currentUID, getActiveEventId(), req.id, true);
        toast(`${escHtml(req.displayName || "User")} approved!`, "success");
      } catch { toast("Failed to approve request.", "error"); btn.disabled = false; }
    });

    row.querySelector(".btn-reject").addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      try {
        await respondToRequest(currentUID, getActiveEventId(), req.id, false);
        toast("Request rejected.", "info");
      } catch { toast("Failed to reject request.", "error"); btn.disabled = false; }
    });

    joinRequestsListEl.appendChild(row);
  });
}

// ═══════════════════════════════════════
// GUESTS
// ═══════════════════════════════════════

function onGuestsUpdate(guests) {
  currentGuests = guests;
  statTotalEl.textContent  = guests.length;
  statCheckedEl.textContent= guests.filter(g => g.checkedIn).length;
  renderGuests();
  if (currentUID && getActiveEventId()) {
    repairGuestAvatars(currentUID, getActiveEventId(), guests).catch(() => {});
  }
}

function renderGuests() {
  const isHost = true; // user is always host for their own events
  const list = currentGuests.filter(g => {
    if (activeFilter === "checked") return g.checkedIn;
    if (activeFilter === "pending") return !g.checkedIn;
    return true;
  });

  guestListEl.innerHTML = "";
  if (!list.length) {
    guestListEl.innerHTML = `<div class="guest-list-empty">${
      activeFilter === "all"     ? "No guests yet. Add the first one!" :
      activeFilter === "checked" ? "No checked-in guests." : "All guests are checked in!"
    }</div>`;
    return;
  }

  list.forEach(guest => {
    const row = document.createElement("div");
    row.className = `guest-row${guest.checkedIn ? " done" : ""}`;
    const initials = guest.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
    const avHtml   = guest.photoURL
      ? `<img src="${escHtml(guest.photoURL)}" alt=""/>`
      : initials;
    const timeStr  = guest.createdAt?.toDate ? fmtTime(guest.createdAt.toDate()) : "";
    const tag      = guest.tag || "Friend";

    row.innerHTML = `
      <div class="guest-av">${avHtml}</div>
      <div class="guest-info">
        <div class="guest-name">${escHtml(guest.name)}</div>
        ${timeStr ? `<div class="guest-time">Added ${timeStr}</div>` : ""}
      </div>
      <select class="guest-tag-inline ${tag}" data-gid="${guest.id}">
        <option${tag==="VIP"    ? " selected" : ""}>VIP</option>
        <option${tag==="Friend" ? " selected" : ""}>Friend</option>
        <option${tag==="Staff"  ? " selected" : ""}>Staff</option>
      </select>
      <button class="checkin-btn ${guest.checkedIn ? "in" : "wait"}" data-id="${guest.id}">
        ${guest.checkedIn ? "✓ Checked In" : "Check In"}
      </button>
      ${isHost ? `<button class="btn-remove-guest" data-gid="${guest.id}" title="Remove guest">✕</button>` : ""}`;

    // Inline tag change
    row.querySelector(".guest-tag-inline").addEventListener("change", async e => {
      const newTag = e.target.value;
      e.target.className = `guest-tag-inline ${newTag}`;
      try {
        await updateGuestTag(currentUID, getActiveEventId(), guest.id, newTag);
      } catch { toast("Could not update role.", "error"); }
    });

    if (!guest.checkedIn) {
      row.querySelector(".checkin-btn").addEventListener("click", async e => {
        const btn = e.currentTarget;
        btn.disabled = true;
        row.classList.add("checkin-flash");
        row.addEventListener("animationend", () => row.classList.remove("checkin-flash"), { once: true });
        try {
          await toggleCheckIn(currentUID, getActiveEventId(), guest.id, guest.checkedIn);
          toast(`${escHtml(guest.name)} checked in!`, "success");
        } catch { toast("Check-in failed.", "error"); btn.disabled = false; }
      });
    }

    if (isHost) {
      row.querySelector(".btn-remove-guest").addEventListener("click", async () => {
        try {
          await removeGuest(currentUID, getActiveEventId(), guest.id);
          toast(`${escHtml(guest.name)} removed.`, "success");
        } catch { toast("Could not remove guest.", "error"); }
      });
    }

    guestListEl.appendChild(row);
  });
}

addGuestBtn.addEventListener("click", async () => {
  const name = guestNameInput.value.trim();
  const tag  = guestTagSelect.value;
  if (!name) { toast("Guest name is required.", "error"); return; }
  if (!getActiveEventId()) { toast("Select an event first.", "error"); return; }
  setLoading(addGuestBtn, true);
  try {
    if (selectedUser) {
      await addGuest(currentUID, getActiveEventId(), selectedUser.displayName || name, tag, selectedUser.id, selectedUser.photoURL || null);
    } else {
      await addGuest(currentUID, getActiveEventId(), name, tag);
    }
    guestNameInput.value = "";
    guestTagSelect.value = "Friend";
    selectedUser = null;
    guestNameInput.classList.remove("has-selection");
    userSearchDropdown.classList.add("hidden");
    guestNameInput.focus();
    toast(`${name} added!`, "success");
  } catch { toast("Failed to add guest.", "error"); }
  finally { setLoading(addGuestBtn, false); }
});
guestNameInput.addEventListener("keydown", e => { if (e.key === "Enter") addGuestBtn.click(); });

// ═══════════════════════════════════════
// USER SEARCH (real-time Firestore)
// ═══════════════════════════════════════

function renderUserDropdown(users, rawQuery) {
  userSearchDropdown.innerHTML = "";

  if (users.length) {
    users.forEach(u => {
      const item = document.createElement("div");
      item.className = "user-search-result";
      const initials = (u.displayName || "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
      const avHtml   = u.photoURL
        ? `<img src="${escHtml(u.photoURL)}" alt=""/>`
        : initials;
      const meta = u.email || u.phoneNumber || "";
      item.innerHTML = `
        <div class="user-search-av">${avHtml}</div>
        <div class="user-search-info">
          <div class="user-search-name">${escHtml(u.displayName || "Unknown")}</div>
          ${meta ? `<div class="user-search-meta">${escHtml(meta)}</div>` : ""}
        </div>`;
      item.addEventListener("click", () => {
        selectedUser = u;
        guestNameInput.value = u.displayName || "Unknown";
        guestNameInput.classList.add("has-selection");
        userSearchDropdown.classList.add("hidden");
      });
      userSearchDropdown.appendChild(item);
    });
  } else {
    const empty = document.createElement("div");
    empty.className = "user-search-empty";
    empty.textContent = `No registered users match "${rawQuery}"`;
    userSearchDropdown.appendChild(empty);
  }

  const freetext = document.createElement("div");
  freetext.className = "user-search-freetext";
  freetext.innerHTML = `Add <strong>${escHtml(rawQuery)}</strong> as custom name`;
  freetext.addEventListener("click", () => {
    selectedUser = null;
    guestNameInput.value = rawQuery;
    guestNameInput.classList.remove("has-selection");
    userSearchDropdown.classList.add("hidden");
  });
  userSearchDropdown.appendChild(freetext);
}

guestNameInput.addEventListener("input", () => {
  const q = guestNameInput.value.trim();
  selectedUser = null;
  guestNameInput.classList.remove("has-selection");

  if (q.length < 2) {
    userSearchDropdown.classList.add("hidden");
    return;
  }

  userSearchDropdown.innerHTML = `<div class="user-search-loading">Searching</div>`;
  userSearchDropdown.classList.remove("hidden");

  clearTimeout(searchTimer);
  searchTimer = setTimeout(async () => {
    if (!currentUID) return;
    const results = await searchUsers(q, currentUID);
    renderUserDropdown(results, q);
  }, 280);
});

// Close dropdown when clicking outside
document.addEventListener("click", e => {
  if (!e.target.closest(".user-search-wrap")) {
    userSearchDropdown.classList.add("hidden");
  }
});

filterPills.forEach(pill => {
  pill.addEventListener("click", () => {
    filterPills.forEach(p => p.classList.remove("active"));
    pill.classList.add("active");
    activeFilter = pill.dataset.filter;
    renderGuests();
  });
});

// ═══════════════════════════════════════
// STATISTICS
// ═══════════════════════════════════════

function renderStats(s) {
  const animate = (id, val) => { const el = $(id); if (el) animateCounter(el, val); };
  animate("sc-events",  s.totalEvents);
  animate("sc-guests",  s.totalGuests);
  animate("sc-checkins",s.totalCheckedIn);

  const rateEl = $("sc-rate");
  if (rateEl) animateCounter(rateEl, s.checkInRate, 800);

  const avgEl = $("sc-avg");
  if (avgEl) avgEl.textContent = `Avg ${s.avgGuests.toFixed(1)} guests / event`;

  // Top event
  const topContent = $("top-event-content");
  if (topContent) {
    if (s.topEvent) {
      topContent.innerHTML = `
        <span class="top-event-trophy">🏆</span>
        <div class="top-event-name">${escHtml(s.topEvent.name)}</div>
        <div class="top-event-stats">
          <div class="top-event-stat"><strong>${s.topEvent.guestCount}</strong> guests</div>
          <div class="top-event-stat"><strong>${s.topEvent.checkedIn}</strong> checked in</div>
          <div class="top-event-stat"><strong>${s.topEvent.guestCount > 0 ? Math.round(s.topEvent.checkedIn/s.topEvent.guestCount*100) : 0}%</strong> rate</div>
        </div>`;
    } else {
      topContent.innerHTML = `<div class="stats-empty" style="padding:24px 0;font-size:12px;">No events yet.</div>`;
    }
  }

  // Breakdown bars
  const breakdownEl = $("breakdown-list");
  if (breakdownEl) {
    if (!s.eventDetails.length) {
      breakdownEl.innerHTML = `<div class="stats-empty" style="padding:12px 0;font-size:12px;">Create events to see the breakdown.</div>`;
      return;
    }
    const max = Math.max(...s.eventDetails.map(e => e.guestCount), 1);
    breakdownEl.innerHTML = s.eventDetails.slice(0, 6).map(ev => `
      <div class="breakdown-item">
        <div class="breakdown-item-top">
          <span class="breakdown-name">${escHtml(ev.name)}</span>
          <span class="breakdown-count">${ev.checkedIn}/${ev.guestCount}</span>
        </div>
        <div class="breakdown-track">
          <div class="breakdown-fill" style="width:${Math.round((ev.guestCount/max)*100)}%"></div>
        </div>
      </div>`).join("");
  }
}

// ═══════════════════════════════════════
// PROFILE
// ═══════════════════════════════════════

function loadProfilePanel() {
  const user = getCurrentUser();
  if (!user) return;

  profileNameDisplay.textContent  = user.displayName || "No name set";
  profileEmailDisplay.textContent = user.email || user.phoneNumber || "—";
  profileUidDisplay.textContent   = `UID: ${user.uid}`;

  if (user.photoURL) {
    profileAvatarEl.innerHTML = `<img src="${user.photoURL}" alt="avatar"/>`;
  } else {
    profileAvatarEl.textContent = (user.displayName || user.email || "U")[0].toUpperCase();
  }

  renderProviders();
}

function renderProviders() {
  const user = getCurrentUser();
  if (!user) return;
  const linked = getLinkedProviders();

  const allProviders = [
    { id: "google.com", label: "Google" },
    { id: "password",   label: "Email & Password" },
    { id: "phone",      label: "Phone" }
  ];

  providersListEl.innerHTML = allProviders.map(p => {
    const isLinked = linked.includes(p.id);
    const canUnlink = linked.length > 1;
    return `
      <div class="provider-row">
        <div class="provider-icon">${getProviderIcon(p.id)}</div>
        <div class="provider-info">
          <div class="provider-name">${p.label}</div>
          <div class="provider-status ${isLinked ? "linked" : ""}">${isLinked ? "Connected" : "Not connected"}</div>
        </div>
        ${isLinked && canUnlink && p.id !== "password"
          ? `<button class="btn btn-danger" data-unlink="${p.id}" style="font-size:11px;padding:5px 12px;">Unlink</button>`
          : !isLinked && p.id === "google.com"
            ? `<button class="btn btn-secondary" data-link="google" style="font-size:11px;padding:5px 12px;">Link</button>`
            : !isLinked && p.id === "phone"
              ? `<button class="btn btn-secondary" data-link="phone" style="font-size:11px;padding:5px 12px;">Link</button>`
              : ""}
      </div>`;
  }).join("");

  providersListEl.querySelectorAll("[data-unlink]").forEach(btn => {
    btn.addEventListener("click", async () => {
      setLoading(btn, true);
      try {
        await unlinkProvider(btn.dataset.unlink);
        toast("Provider unlinked.", "success");
        renderProviders();
      } catch (e) {
        toast(authErrMsg(e.code), "error");
        setLoading(btn, false);
      }
    });
  });

  providersListEl.querySelectorAll("[data-link]").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (btn.dataset.link === "google") {
        setLoading(btn, true);
        try {
          await linkGoogleToAccount();
          toast("Google account linked!", "success");
          renderProviders();
          loadProfilePanel();
        } catch (e) {
          toast(authErrMsg(e.code), "error");
          setLoading(btn, false);
        }
      } else if (btn.dataset.link === "phone") {
        linkPhoneForm.classList.remove("hidden");
        linkPhoneStep1.classList.remove("hidden");
        linkPhoneStep2.classList.add("hidden");
        linkPhoneError.classList.remove("show");
        linkPhoneInput.value = "";
        linkOtpInput.value   = "";
      }
    });
  });
}

// Edit name
editNameBtn.addEventListener("click", () => {
  const user = getCurrentUser();
  profileNameInput.value = user?.displayName || "";
  profileNameDisplay.parentElement.style.display = "none";
  profileNameEdit.classList.add("show");
  profileNameInput.focus();
});

cancelNameBtn.addEventListener("click", () => {
  profileNameEdit.classList.remove("show");
  profileNameDisplay.parentElement.style.display = "";
});

saveNameBtn.addEventListener("click", async () => {
  const name = profileNameInput.value.trim();
  if (!name) { toast("Name cannot be empty.", "error"); return; }
  setLoading(saveNameBtn, true);
  try {
    await updateDisplayName(currentUID, name);
    profileNameDisplay.textContent = name;
    userNameEl.textContent = name;
    userAvatarEl.textContent = name[0].toUpperCase();
    profileNameEdit.classList.remove("show");
    profileNameDisplay.parentElement.style.display = "";
    toast("Name updated!", "success");
  } catch { toast("Failed to update name.", "error"); }
  finally { setLoading(saveNameBtn, false); }
});
profileNameInput.addEventListener("keydown", e => { if (e.key === "Enter") saveNameBtn.click(); if (e.key === "Escape") cancelNameBtn.click(); });

// Avatar upload
avatarFileInput.addEventListener("change", async () => {
  const file = avatarFileInput.files[0];
  if (!file) return;
  if (file.size > 3 * 1024 * 1024) { toast("Image must be under 3MB.", "error"); return; }
  try {
    toast("Uploading photo...", "info");
    const url = await uploadAvatar(currentUID, file);
    profileAvatarEl.innerHTML = `<img src="${url}" alt="avatar"/>`;
    userAvatarEl.innerHTML = `<img src="${url}" alt="avatar"/>`;
    toast("Photo updated!", "success");
  } catch (e) {
    toast("Failed to upload photo. Ensure Firebase Storage is enabled.", "error");
  }
});

// Link phone flow
linkSendCodeBtn.addEventListener("click", async () => {
  const num = (linkPhonePrefix.value + linkPhoneInput.value.replace(/\s/g,"")).trim();
  if (!num || num.length < 7) { showErr(linkPhoneError, "Enter a valid phone number."); return; }
  setLoading(linkSendCodeBtn, true);
  try {
    setupRecaptcha("recaptcha-link-container");
    await sendLinkPhoneCode(num);
    linkPhoneStep1.classList.add("hidden");
    linkPhoneStep2.classList.remove("hidden");
    linkOtpInput.focus();
    linkPhoneError.classList.remove("show");
  } catch (e) {
    showErr(linkPhoneError, authErrMsg(e.code));
  } finally { setLoading(linkSendCodeBtn, false); }
});

linkVerifyBtn.addEventListener("click", async () => {
  const code = linkOtpInput.value.trim();
  if (code.length !== 6) { showErr(linkPhoneError, "Enter the 6-digit code."); return; }
  setLoading(linkVerifyBtn, true);
  try {
    await verifyAndLinkPhone(code);
    linkPhoneForm.classList.add("hidden");
    toast("Phone number linked!", "success");
    renderProviders();
  } catch (e) {
    showErr(linkPhoneError, authErrMsg(e.code));
  } finally { setLoading(linkVerifyBtn, false); }
});

linkPhoneCancel.addEventListener("click", () => { linkPhoneForm.classList.add("hidden"); });
linkPhoneBack.addEventListener("click", () => {
  linkPhoneStep2.classList.add("hidden");
  linkPhoneStep1.classList.remove("hidden");
  linkPhoneError.classList.remove("show");
});

// ═══════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════

function showErr(el, msg) { el.textContent = msg; el.classList.add("show"); }

function escHtml(str) {
  return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function fmtDate(val) {
  if (!val) return "No date";
  // Firebase Timestamp object
  if (typeof val === "object" && typeof val.seconds === "number") {
    return new Date(val.seconds * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  // Date instance
  if (val instanceof Date) {
    if (isNaN(val)) return "No date";
    return val.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  // String: "2024-01-15" or "2024-01-15 14:00" or ISO "2024-01-15T14:00:00"
  const s = String(val).trim();
  let d = new Date(s.includes("T") ? s : s.replace(" ", "T"));
  if (isNaN(d)) d = new Date(s + "T00:00:00");
  if (isNaN(d)) return "No date";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtTime(date) {
  return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

// ═══════════════════════════════════════
// INIT
// ═══════════════════════════════════════

initParticles("particle-canvas");

document.querySelectorAll(".btn-hero, .btn-hero-outline, .btn-lnav-cta").forEach(el => {
  attachInteraction(el);
});

// ── Flatpickr date+time picker ──
if (typeof flatpickr !== "undefined") {
  flatpickr("#new-event-date", {
    enableTime: true,
    dateFormat: "Y-m-d H:i",
    time_24hr:  true,
    theme:      "dark",
    disableMobile: true
  });
}

// ── Explore: search button + enter + debounced input ──
if (exploreSearchBtn) {
  exploreSearchBtn.addEventListener("click", () => {
    clearTimeout(exploreDebounce);
    runExploreSearch(exploreSearchInput?.value || "", false);
  });
}
if (exploreSearchInput) {
  exploreSearchInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      clearTimeout(exploreDebounce);
      runExploreSearch(exploreSearchInput.value, false);
    }
  });
  exploreSearchInput.addEventListener("input", () => {
    clearTimeout(exploreDebounce);
    exploreDebounce = setTimeout(() => {
      runExploreSearch(exploreSearchInput.value, false);
    }, 300);
  });
}

// ── Chat: send message ──
if (sendMsgBtn) {
  sendMsgBtn.addEventListener("click", () => sendChatMessage());
}
if (chatInput) {
  chatInput.addEventListener("keydown", e => { if (e.key === "Enter") sendChatMessage(); });
}
if (replyCloseBtn) {
  replyCloseBtn.addEventListener("click", () => setReply(null));
}

initEvents(onEventSelected);
initGuests(onGuestsUpdate);
initAuth(showApp, showAuthState);

// ═══════════════════════════════════════
// EXPLORE PANEL
// ═══════════════════════════════════════

let exploreLoaded     = false;
let exploreCursor     = null;
let exploreHasMore    = false;
let exploreIsLoading  = false;
let exploreDebounce   = null;

function setExploreBtnLoading(on) {
  if (!exploreSearchBtn) return;
  exploreSearchBtn.disabled = on;
  exploreSearchBtn.textContent = on ? "Loading…" : "Search";
}

async function loadExplorePanel() {
  if (exploreLoaded) return;
  exploreLoaded = true;
  await runExploreSearch("", false);
}

async function runExploreSearch(q, append = false) {
  if (exploreIsLoading) return;
  if (!exploreResults) return;

  const queryStr = q !== undefined ? q : (exploreSearchInput?.value || "");

  if (!append) {
    exploreCursor  = null;
    exploreHasMore = false;
    exploreResults.innerHTML = [1,2,3,4].map(() => `
      <div class="explore-card skeleton">
        <div class="skeleton-title"></div>
        <div class="skeleton-meta"></div>
        <div class="skeleton-foot"></div>
      </div>`).join("");
  } else {
    document.getElementById("btn-explore-load-more")?.remove();
  }

  exploreIsLoading = true;
  setExploreBtnLoading(true);

  try {
    const { events, hasMore, cursor } = await searchPublicEvents(queryStr, append ? exploreCursor : null);
    exploreCursor  = cursor;
    exploreHasMore = hasMore;
    appendExploreCards(events, append);
    if (hasMore) attachLoadMoreBtn(queryStr);
  } catch {
    if (!append) {
      exploreResults.innerHTML = `
        <div class="explore-empty-state">
          <div class="explore-empty-icon">⊘</div>
          <div class="explore-empty-msg">Failed to load events.</div>
          <button class="btn-retry" id="btn-explore-retry">Try again</button>
        </div>`;
      document.getElementById("btn-explore-retry")?.addEventListener("click", () => runExploreSearch(queryStr, false));
    } else {
      toast("Failed to load more events.", "error");
    }
  } finally {
    exploreIsLoading = false;
    setExploreBtnLoading(false);
  }
}

function appendExploreCards(events, append) {
  if (!exploreResults) return;
  if (!append) exploreResults.innerHTML = "";

  if (!events.length && !append) {
    exploreResults.innerHTML = `
      <div class="explore-empty-state">
        <div class="explore-empty-icon">◎</div>
        <div class="explore-empty-msg">No public events found.</div>
        <div class="explore-empty-sub">Be the first to create a public event!</div>
      </div>`;
    return;
  }

  // Shared IntersectionObserver — created once, reused across renders
  if (!window._exploreImgObserver) {
    window._exploreImgObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const c   = entry.target;
        const url = c.dataset.bg;
        if (url) {
          c.style.setProperty("--explore-bg", `url("${url}")`);
          requestAnimationFrame(() => c.style.setProperty("--img-ready", "1"));
        }
        window._exploreImgObserver.unobserve(c);
      });
    }, { threshold: 0.05, rootMargin: "100px" });
  }
  const imgObserver = window._exploreImgObserver;

  events.forEach(ev => {
    const isOwn  = ev.hostUid && ev.hostUid === currentUID;
    const hasImg = !!(ev.photoURL && ev.photoURL.startsWith("http"));
    const card   = document.createElement("div");
    card.className = `explore-card explore-card--clickable${isOwn ? " explore-card--own" : ""}${hasImg ? " has-image" : ""}`;
    card.style.cursor = "pointer";
    if (hasImg) {
      card.dataset.bg = ev.photoURL;
      imgObserver.observe(card);
      // Parallax: shift background-position on mousemove (GPU, no reflow)
      card.addEventListener("mousemove", e => {
        const r  = card.getBoundingClientRect();
        const mx = ((e.clientX - r.left) / r.width  - 0.5) * 10;
        const my = ((e.clientY - r.top)  / r.height - 0.5) * 10;
        card.style.setProperty("--bg-x", `${50 + mx}%`);
        card.style.setProperty("--bg-y", `${50 + my}%`);
      }, { passive: true });
      card.addEventListener("mouseleave", () => {
        card.style.setProperty("--bg-x", "50%");
        card.style.setProperty("--bg-y", "50%");
      });
    } else {
      card.style.background = "rgba(255,255,255,0.03)";
    }
    console.log("[Explore]", ev.name, "photoURL:", ev.photoURL || "(none)");
    const dateStr   = ev.date ? fmtDate(ev.date) : "No date";
    const host      = isOwn ? "You" : (ev.hostName || "Unknown host");
    const guests    = ev.guestCount || 0;
    const status    = getEventStatus(ev.date);
    const statusDot = status === "ongoing" ? `<span class="explore-live-dot"></span>Live ·` : "";
    card.innerHTML = `
      <div class="explore-card-content">
        <div class="explore-card-name">${escHtml(ev.name)}</div>
        <div class="explore-card-meta">
          <span>📅 ${escHtml(dateStr)}</span>
          <span>👤 ${escHtml(host)}</span>
          <span>◎ ${guests} guest${guests !== 1 ? "s" : ""}</span>
        </div>
        <div class="explore-card-foot">
          <span class="public-badge">PUBLIC</span>
          ${statusDot}
          ${isOwn
            ? `<span class="explore-host-badge">Your Event</span>`
            : `<span class="explore-card-hint">Tap to view →</span>`}
        </div>
      </div>`;

    card.addEventListener("click", () => openEventDetails({ ...ev, id: ev.id }));
    exploreResults.appendChild(card);
  });
}

function attachLoadMoreBtn(queryStr) {
  const btn = document.createElement("button");
  btn.className = "btn-load-more";
  btn.id = "btn-explore-load-more";
  btn.textContent = "Load more";
  btn.addEventListener("click", () => runExploreSearch(queryStr, true));
  exploreResults.appendChild(btn);
}

// ═══════════════════════════════════════
// FRIENDS PANEL
// ═══════════════════════════════════════

function loadFriendsPanel() {
  if (friendsUnsub && friendReqUnsub) return;

  if (!friendsUnsub) {
    friendsUnsub = listenToFriends(currentUID, renderFriendsList);
  }
  if (!friendReqUnsub) {
    friendReqUnsub = listenToFriendRequests(currentUID, renderFriendRequests);
  }

  if (friendsSearchInput) {
    friendsSearchInput.addEventListener("input", () => {
      const q = friendsSearchInput.value.trim();
      if (q.length < 2) {
        if (friendsSearchResults) friendsSearchResults.classList.add("hidden");
        return;
      }
      clearTimeout(friendsSearchTimer);
      friendsSearchTimer = setTimeout(async () => {
        const users = await searchUsers(q, currentUID);
        renderFriendSearchResults(users);
      }, 280);
    });
  }
}

async function renderFriendSearchResults(users) {
  if (!friendsSearchResults) return;
  if (!users.length) { friendsSearchResults.classList.add("hidden"); return; }
  friendsSearchResults.innerHTML = "";
  friendsSearchResults.classList.remove("hidden");

  for (const u of users) {
    const row = document.createElement("div");
    row.className = "friend-search-row";
    const initials = (u.displayName || "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
    const avHtml   = u.photoURL ? `<img src="${escHtml(u.photoURL)}" alt=""/>` : initials;
    let actionBtn  = "";
    const status   = await getFriendStatus(currentUID, u.id);
    if (status === "friends")         actionBtn = `<button class="btn-add-friend sent" disabled>Friends</button>`;
    else if (status === "request_sent") actionBtn = `<button class="btn-add-friend sent" disabled>Sent</button>`;
    else if (status === "request_received") actionBtn = `<button class="btn-add-friend" data-uid="${u.id}" data-action="accept">Accept</button>`;
    else actionBtn = `<button class="btn-add-friend" data-uid="${u.id}" data-action="add">+ Add</button>`;

    row.innerHTML = `
      <div class="friend-search-av">${avHtml}</div>
      <div class="friend-search-info">
        <div class="friend-search-name">${escHtml(u.displayName || "Unknown")}</div>
        ${u.email ? `<div class="friend-search-meta">${escHtml(u.email)}</div>` : ""}
      </div>
      ${actionBtn}`;

    row.querySelector(".btn-add-friend:not(.sent)")?.addEventListener("click", async btn => {
      const el  = btn.currentTarget;
      const uid = el.dataset.uid;
      el.disabled = true;
      try {
        if (el.dataset.action === "accept") {
          await acceptFriendRequest(currentUID, uid);
          toast("Friend request accepted!", "success");
        } else {
          await sendFriendRequest(currentUID, uid, getCurrentUser());
          el.textContent = "Sent";
          el.classList.add("sent");
          toast("Friend request sent!", "success");
        }
      } catch { toast("Action failed.", "error"); el.disabled = false; }
    });
    friendsSearchResults.appendChild(row);
  }
}

function renderFriendsList(friends) {
  myFriendsMap = {};
  friends.forEach(f => { myFriendsMap[f.id] = f; });
  repairFriendProfiles(currentUID, friends).catch(() => {});
  if (!friendsList) return;
  if (!friends.length) {
    friendsList.innerHTML = `<div class="friends-empty">No friends yet.</div>`;
    return;
  }
  friendsList.innerHTML = "";
  friends.forEach(f => {
    const item = document.createElement("div");
    item.className = `friend-item${activeChatFriend?.id === f.id ? " active" : ""}`;
    item.dataset.uid = f.id;
    const name = f.displayName || "User";
    const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
    const avHtml   = f.photoURL ? `<img src="${escHtml(f.photoURL)}" alt=""/>` : initials;
    item.innerHTML = `
      <div class="friend-av">${avHtml}</div>
      <div class="friend-info">
        <div class="friend-name">${escHtml(name)}</div>
        <div class="friend-status-txt" data-uid="${f.id}"></div>
      </div>
      <div class="friend-item-actions">
        <button class="btn-remove-friend" data-uid="${f.id}">Remove</button>
      </div>`;

    fetchPresenceOnce(f.id).then(label => {
      const el = item.querySelector(`.friend-status-txt[data-uid="${f.id}"]`);
      if (!el) return;
      if (label === "online") {
        el.innerHTML = `<span class="presence-dot"></span>Online`;
        el.className = "friend-status-txt presence-online";
      } else {
        el.textContent = label ? `Last seen ${label}` : "Offline";
        el.className = "friend-status-txt presence-offline";
      }
    }).catch(() => {});
    item.addEventListener("click", e => {
      if (e.target.classList.contains("btn-remove-friend")) return;
      openChat(f);
    });
    item.querySelector(".btn-remove-friend").addEventListener("click", async e => {
      e.stopPropagation();
      try {
        await removeFriend(currentUID, f.id);
        if (activeChatFriend?.id === f.id) closeChat();
        toast("Friend removed.", "info");
      } catch { toast("Failed to remove friend.", "error"); }
    });
    friendsList.appendChild(item);
  });
}

function renderFriendRequests(requests) {
  if (!friendRequestsList || !friendReqBadge) return;
  const pending = requests.filter(r => r.status === "pending");
  if (pending.length) {
    friendReqBadge.textContent = pending.length;
    friendReqBadge.classList.remove("hidden");
  } else {
    friendReqBadge.classList.add("hidden");
  }
  if (!pending.length) {
    friendRequestsList.innerHTML = `<div class="friends-empty">No pending requests.</div>`;
    return;
  }
  friendRequestsList.innerHTML = "";
  pending.forEach(req => {
    const item = document.createElement("div");
    item.className = "friend-item";
    const fromUid  = req.fromUid || req.id;
    const name     = req.displayName || fromUid.slice(0, 8);
    const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
    const avHtml   = req.photoURL ? `<img src="${escHtml(req.photoURL)}" alt=""/>` : initials;
    item.innerHTML = `
      <div class="friend-av">${avHtml}</div>
      <div class="friend-info">
        <div class="friend-name">${escHtml(name)}</div>
        <div class="friend-status-txt">Wants to connect</div>
      </div>
      <div class="friend-item-actions">
        <button class="btn-accept-req" data-uid="${fromUid}">✓</button>
        <button class="btn-reject-req" data-uid="${fromUid}">✕</button>
      </div>`;
    item.querySelector(".btn-accept-req").addEventListener("click", async e => {
      e.stopPropagation();
      try { await acceptFriendRequest(currentUID, fromUid); toast("Friend added!", "success"); }
      catch { toast("Failed to accept.", "error"); }
    });
    item.querySelector(".btn-reject-req").addEventListener("click", async e => {
      e.stopPropagation();
      try { await rejectFriendRequest(currentUID, fromUid); toast("Request rejected.", "info"); }
      catch { toast("Failed to reject.", "error"); }
    });
    friendRequestsList.appendChild(item);
  });
}

// ═══════════════════════════════════════
// CHAT
// ═══════════════════════════════════════

function openChat(friend) {
  activeChatFriend = friend;
  document.querySelectorAll(".friend-item").forEach(el => {
    el.classList.toggle("active", el.dataset.uid === friend.id);
  });
  if (chatNoSelection) {
    chatNoSelection.classList.add("hidden");
    chatNoSelection.style.display = "none";
  }
  if (chatWindow) {
    chatWindow.classList.remove("hidden");
    chatWindow.style.display = "flex";
  }

  // Mobile: slide chat area in from right
  if (window.innerWidth <= 768) {
    document.querySelector(".chat-area")?.classList.add("mobile-chat-open");
  }

  const name = friend.displayName || "Friend";
  const initials = name.split(" ").map(w => w[0]).slice(0,2).join("").toUpperCase();
  if (chatHeaderAv)   chatHeaderAv.innerHTML = friend.photoURL ? `<img src="${escHtml(friend.photoURL)}" alt=""/>` : initials;
  if (chatHeaderName) chatHeaderName.textContent = name;
  if (chatHeaderStatus) chatHeaderStatus.textContent = "";

  if (chatUnsub) { chatUnsub(); chatUnsub = null; }
  if (presenceUnsub) { presenceUnsub(); presenceUnsub = null; }
  lastMsgCount = 0;

  presenceUnsub = listenToUserPresence(friend.id, label => {
    if (!chatHeaderStatus) return;
    if (label === "online") {
      chatHeaderStatus.innerHTML = `<span class="presence-dot"></span>Online`;
      chatHeaderStatus.className = "chat-header-status presence-online";
    } else {
      chatHeaderStatus.textContent = label ? `Last seen ${label}` : "Offline";
      chatHeaderStatus.className = "chat-header-status presence-offline";
    }
  });

  chatUnsub = listenToChat(currentUID, friend.id, renderMessages);
  if (chatInput) setTimeout(() => chatInput.focus(), 100);
}

function closeChat() {
  activeChatFriend = null;
  if (chatUnsub)     { chatUnsub();     chatUnsub     = null; }
  if (presenceUnsub) { presenceUnsub(); presenceUnsub = null; }
  lastMsgCount = 0;
  if (chatWindow) {
    chatWindow.classList.add("hidden");
    chatWindow.style.display = "none";
  }
  if (chatNoSelection) {
    chatNoSelection.classList.remove("hidden");
    chatNoSelection.style.display = "";
  }
  if (chatHeaderStatus) chatHeaderStatus.textContent = "";
  document.querySelectorAll(".friend-item").forEach(el => el.classList.remove("active"));
  // Mobile: slide chat area back out
  document.querySelector(".chat-area")?.classList.remove("mobile-chat-open");
}

function renderMessages(messages) {
  if (!chatMessages) return;
  const prevCount = lastMsgCount;
  lastMsgCount = messages.length;
  chatMessages.innerHTML = "";
  messages.forEach((msg, i) => {
    const div  = document.createElement("div");
    const isNew = i >= prevCount;
    const isMine = msg.senderUid === currentUID;
    div.className = `chat-msg ${isMine ? "mine" : "theirs"}${isNew ? " msg-new" : ""}`;
    div.dataset.msgId   = msg.id;
    div.dataset.msgText = msg.text || "";
    div.dataset.msgSender = isMine
      ? "You"
      : (activeChatFriend?.displayName || "Friend");
    const ts   = msg.sentAt?.toDate ? msg.sentAt.toDate() : new Date();
    const time = ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const replyBlock = msg.replyTo
      ? `<div class="reply-block">
           <div class="reply-block-sender">${escHtml(msg.replyTo.sender || "")}</div>
           <div class="reply-block-text">${escHtml((msg.replyTo.text || "").slice(0, 80))}</div>
         </div>`
      : "";

    if (msg.type === "event_invite") {
      const isMineInvite = msg.senderUid === currentUID;
      div.innerHTML = `
        <div class="chat-msg-bubble chat-invite-bubble">
          ${replyBlock}
          <div class="chat-invite-icon">🎉</div>
          <div class="chat-invite-body">
            <div class="chat-invite-label">${isMineInvite ? "You sent an invite" : "Event Invite"}</div>
            <div class="chat-invite-name">${escHtml(msg.eventName || "Event")}</div>
          </div>
          ${!isMineInvite ? `<button class="btn-join-invite" data-eid="${escHtml(msg.eventId || "")}">View</button>` : ""}
        </div>
        <div class="chat-msg-time">${time}</div>`;
      if (!isMineInvite && msg.eventId) {
        div.querySelector(".btn-join-invite").addEventListener("click", () => {
          openEventDetails({ id: msg.eventId, name: msg.eventName || "Event", hostUid: "" });
        });
      }
    } else {
      div.innerHTML = `
        <div class="chat-msg-bubble">${replyBlock}${escHtml(msg.text)}</div>
        <div class="chat-msg-time">${time}</div>`;
    }
    chatMessages.appendChild(div);
  });
  chatMessages.scrollTop = chatMessages.scrollHeight;
  attachSwipeHandlers();
}

function setReply(target) {
  replyTarget = target;
  if (!replyPreviewEl || !replySenderEl || !replyTextEl) return;
  if (target) {
    replySenderEl.textContent = target.sender;
    replyTextEl.textContent   = target.text.slice(0, 80);
    replyPreviewEl.classList.remove("hidden");
    chatInput?.focus();
  } else {
    replyPreviewEl.classList.add("hidden");
    replySenderEl.textContent = "";
    replyTextEl.textContent   = "";
  }
}

function attachSwipeHandlers() {
  if (!chatMessages || !window.matchMedia("(max-width: 768px)").matches) return;
  chatMessages.querySelectorAll(".chat-msg").forEach(el => {
    if (el._swipeAttached) return;
    el._swipeAttached = true;
    let startX = 0, startY = 0, deltaX = 0, deltaY = 0, active = false;

    el.addEventListener("touchstart", e => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      deltaX = 0; deltaY = 0; active = true;
      el.style.transition = "";
    }, { passive: true });

    el.addEventListener("touchmove", e => {
      if (!active) return;
      deltaX = e.touches[0].clientX - startX;
      deltaY = e.touches[0].clientY - startY;
      if (Math.abs(deltaX) <= Math.abs(deltaY) || deltaX <= 0) return;
      e.preventDefault();
      const x = Math.min(80, deltaX);
      const bubble = el.querySelector(".chat-msg-bubble");
      if (bubble) bubble.style.transform = `translateX(${x}px)`;
      let icon = el.querySelector(".swipe-reply-icon");
      if (!icon) {
        icon = document.createElement("span");
        icon.className = "swipe-reply-icon";
        icon.textContent = "↩";
        el.appendChild(icon);
      }
      icon.style.opacity = Math.min(1, (x - 20) / 40).toString();
    }, { passive: false });

    el.addEventListener("touchend", () => {
      if (!active) return;
      active = false;
      const bubble = el.querySelector(".chat-msg-bubble");
      if (bubble) {
        bubble.style.transition = "transform 0.18s ease";
        bubble.style.transform  = "translateX(0)";
        setTimeout(() => { bubble.style.transition = ""; }, 200);
      }
      const icon = el.querySelector(".swipe-reply-icon");
      if (icon) { icon.style.opacity = "0"; }
      if (deltaX > 60 && Math.abs(deltaX) > Math.abs(deltaY)) {
        setReply({
          id:     el.dataset.msgId,
          text:   el.dataset.msgText,
          sender: el.dataset.msgSender
        });
      }
      deltaX = 0; deltaY = 0;
    }, { passive: true });
  });
}

async function sendChatMessage() {
  if (!activeChatFriend || !chatInput) return;
  const text = chatInput.value.trim();
  if (!text) return;
  chatInput.value = "";
  const reply = replyTarget ? { ...replyTarget } : null;
  setReply(null);
  try {
    await sendMessage(currentUID, activeChatFriend.id, text, reply);
  } catch { toast("Failed to send message.", "error"); }
}

// ═══════════════════════════════════════
// EVENT GROUP CHAT
// ═══════════════════════════════════════

let evcEventId        = null;
let evcEventName      = null;
let evcHostUid        = null;
let evcUnsub          = null;
let evcSending        = false;
let evcLastSender     = null;
let evcLastSenderTime = 0;
let evcLastSnapshotIds = "";
let evcSavedScroll    = 0;       // preserved scroll when switching away from chat
let evcNewMsgCount    = 0;       // unread new-message counter (user scrolled up)
let evcScrollAbort    = null;    // AbortController for the scroll listener

// ── New: reactions / status / typing state ───────────────────────────────────
let evcTypingUnsub    = null;    // unsubscribe typing listener
let evcTypingTimer    = null;    // debounce timer for typing updates
let evcTypingActive   = false;   // whether we've sent a typing signal recently
let evcSeenObserver   = null;    // IntersectionObserver for seen status
const evcDeliveredSet = new Set(); // msgIds already marked delivered this session
const evcSeenSet      = new Set(); // msgIds already marked seen this session
let   evcReactionMsgId = null;   // which message the picker is open for

// Session-level maps (persist across modal open/close)
const edTabMemory       = new Map(); // eventId → last active tab name
const edChatAccessCache = new Map(); // eventId → boolean (Firestore access result)

// ── Helpers ──────────────────────────────────────────────────────────────────
function evcIsNearBottom() {
  const c = $("evc-messages");
  if (!c) return true;
  return c.scrollHeight - c.scrollTop - c.clientHeight < 100;
}

function evcScrollToBottom() {
  const c = $("evc-messages");
  if (c) c.scrollTo({ top: c.scrollHeight, behavior: "smooth" });
}

function evcSetEmpty(html) {
  const el = $("evc-empty");
  if (!el) return;
  el.innerHTML = html;
  el.classList.remove("hidden");
  // Re-trigger animation
  el.style.animation = "none";
  void el.offsetWidth;
  el.style.animation = "";
}

function evcHideEmpty() {
  $("evc-empty")?.classList.add("hidden");
}

function evcResetDOM() {
  const c = $("evc-messages");
  if (c) c.querySelectorAll(".chat-msg").forEach(el => el.remove());
  evcLastSender     = null;
  evcLastSenderTime = 0;
  evcLastSnapshotIds = "";
  evcNewMsgCount    = 0;
  $("evc-new-msgs-btn")?.classList.add("hidden");
  const avStack = $("evc-avatars-stack");
  if (avStack) avStack.innerHTML = "";
  $("evc-send")?.classList.remove("has-text");
  evcDeliveredSet.clear();
  evcSeenSet.clear();
}

// ── Reaction helpers ──────────────────────────────────────────────────────────
function evcRenderReactions(msgEl, reactions) {
  if (!msgEl) return;
  const body = msgEl.querySelector(".evc-msg-body, .evc-msg-body-mine") || msgEl;
  let row = msgEl.querySelector(".evc-reactions-row");
  if (!row) {
    row = document.createElement("div");
    row.className = "evc-reactions-row";
    body.appendChild(row);
  }
  if (!reactions || Object.keys(reactions).length === 0) {
    row.innerHTML = "";
    return;
  }
  row.innerHTML = Object.entries(reactions)
    .filter(([, uids]) => Array.isArray(uids) && uids.length > 0)
    .map(([emoji, uids]) => {
      const iMine = uids.includes(currentUID);
      return `<button class="evc-reaction-badge${iMine ? " mine" : ""}"
                       data-emoji="${emoji}" title="${uids.length} reaction${uids.length > 1 ? "s" : ""}">
                <span class="evc-rb-emoji">${emoji}</span>
                <span class="evc-rb-count">${uids.length}</span>
              </button>`;
    }).join("");

  // Wire click → toggle reaction
  row.querySelectorAll(".evc-reaction-badge").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const msgId = msgEl.dataset.msgId;
      if (msgId && evcEventId) toggleReaction(evcEventId, msgId, currentUID, btn.dataset.emoji);
    });
  });
}

function evcRenderStatus(msgEl, deliveredTo, seenBy) {
  if (!msgEl || !msgEl.classList.contains("mine")) return;
  const meta = msgEl.querySelector(".msg-meta");
  if (!meta) return;
  let statusEl = meta.querySelector(".evc-msg-status");
  if (!statusEl) {
    statusEl = document.createElement("span");
    statusEl.className = "evc-msg-status";
    meta.appendChild(statusEl);
  }
  const others = arr => Array.isArray(arr) && arr.some(u => u !== currentUID);
  if (others(seenBy)) {
    statusEl.className = "evc-msg-status status-seen";
    statusEl.title     = "Seen";
    statusEl.innerHTML = `<svg width="15" height="9" viewBox="0 0 15 9" fill="none">
      <path d="M1 4.5L4.5 8L14 1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M5.5 4.5L9 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
    </svg>`;
  } else if (others(deliveredTo)) {
    statusEl.className = "evc-msg-status status-delivered";
    statusEl.title     = "Delivered";
    statusEl.innerHTML = `<svg width="15" height="9" viewBox="0 0 15 9" fill="none">
      <path d="M1 4.5L4.5 8L14 1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M5.5 4.5L9 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
    </svg>`;
  } else {
    statusEl.className = "evc-msg-status status-sent";
    statusEl.title     = "Sent";
    statusEl.innerHTML = `<svg width="9" height="9" viewBox="0 0 9 9" fill="none">
      <path d="M1 4.5L3.5 7L8 1.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }
}

// ── Typing indicator ──────────────────────────────────────────────────────────
function evcShowTyping(typists) {
  const bar  = $("evc-typing-bar");
  const text = $("evc-typing-text");
  if (!bar || !text) return;
  if (typists.length === 0) {
    bar.classList.add("hidden");
    return;
  }
  const names = typists.slice(0, 2).join(", ");
  text.textContent = typists.length === 1
    ? `${names} is typing`
    : typists.length === 2
      ? `${names} are typing`
      : `${typists[0]} and ${typists.length - 1} others are typing`;
  bar.classList.remove("hidden");
}

// ── Reaction picker ───────────────────────────────────────────────────────────
function evcOpenReactionPicker(msgEl) {
  const picker = $("evc-reaction-picker");
  if (!picker) return;
  evcReactionMsgId = msgEl.dataset.msgId;

  // Remove hidden first so offsetWidth is measurable
  picker.classList.remove("hidden", "evc-rp-in");

  const rect    = msgEl.getBoundingClientRect();
  const isMine  = msgEl.classList.contains("mine");
  const pW      = picker.offsetWidth || 300;   // fallback if not yet measured
  const top     = Math.max(8, rect.top - 60);
  const leftRaw = isMine ? rect.right - pW - 4 : rect.left + 4;
  picker.style.top  = `${top}px`;
  picker.style.left = `${Math.max(8, Math.min(leftRaw, window.innerWidth - pW - 8))}px`;

  requestAnimationFrame(() => picker.classList.add("evc-rp-in"));
}

function evcCloseReactionPicker() {
  const picker = $("evc-reaction-picker");
  if (picker) { picker.classList.add("hidden"); picker.classList.remove("evc-rp-in"); }
  evcReactionMsgId = null;
}

// Wire global reaction picker once
(function wireReactionPicker() {
  const picker = $("evc-reaction-picker");
  if (!picker) return;
  picker.querySelectorAll(".evc-rp-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      if (evcReactionMsgId && evcEventId) {
        toggleReaction(evcEventId, evcReactionMsgId, currentUID, btn.dataset.emoji);
      }
      evcCloseReactionPicker();
    });
  });
  // Close on outside click
  document.addEventListener("click", e => {
    if (!picker.classList.contains("hidden") && !picker.contains(e.target)) {
      evcCloseReactionPicker();
    }
  });
})();

// ── Seen observer ─────────────────────────────────────────────────────────────
function evcGetSeenObserver() {
  if (evcSeenObserver) return evcSeenObserver;
  evcSeenObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const msgEl  = entry.target;
      const msgId  = msgEl.dataset.msgId;
      const sender = msgEl.dataset.sender;
      if (msgId && sender && sender !== currentUID && !evcSeenSet.has(msgId) && evcEventId) {
        evcSeenSet.add(msgId);
        markSeen(evcEventId, msgId, currentUID);
        evcSeenObserver.unobserve(msgEl);
      }
    });
  }, { threshold: 0.6 });
  return evcSeenObserver;
}

// ── Open (called from outside the modal) ─────────────────────────────────────
function openEventChat(eventId, eventName, hostUid) {
  if (!currentUID || !eventId) return;
  // If EDM is already open for this event, just switch to the Chat tab
  if (edOpenEventId === eventId && edModal && !edModal.classList.contains("hidden")) {
    edSwitchTab("chat");
    return;
  }
  // Otherwise open the event details modal and go straight to Chat tab
  openEventDetails({ id: eventId, name: eventName || "Event", hostUid: hostUid || "" });
  setTimeout(() => edSwitchTab("chat"), 80);
}

// ── Close (noop — chat is now a tab; closing the whole modal is handled by closeEdModal) ──
function closeEventChat() {
  if (typeof edSwitchTab === "function") edSwitchTab("overview");
}

// ── Render (incremental + look-ahead timestamps) ─────────────────────────────
function renderEventChatMessages(messages) {
  const container = $("evc-messages");
  if (!container) return;

  const newIds = messages.map(m => m.id).join(",");
  const idsChanged    = newIds !== evcLastSnapshotIds;
  const wasNearBottom = evcIsNearBottom();
  const wasEmpty      = evcLastSnapshotIds === "";
  if (idsChanged) evcLastSnapshotIds = newIds;

  if (messages.length === 0) {
    evcSetEmpty(`<span class="evc-empty-icon">💬</span><span class="evc-empty-title">No messages yet</span><span class="evc-empty-sub">Start the conversation</span>`);
    return;
  }
  evcHideEmpty();

  // Build set of already-rendered IDs from DOM
  const renderedEls = container.querySelectorAll("[data-msg-id]");
  const renderedIds = new Set([...renderedEls].map(el => el.dataset.msgId));

  // Full re-render guard (Firestore 50-msg window scrolled past rendered msgs)
  if (renderedIds.size > messages.length) {
    container.querySelectorAll(".chat-msg").forEach(el => el.remove());
    renderedIds.clear();
    evcLastSender     = null;
    evcLastSenderTime = 0;
  }

  // ── Patch existing messages (reactions + status only) ────────────────────
  messages.forEach(msg => {
    if (!renderedIds.has(msg.id)) return;
    const el = container.querySelector(`[data-msg-id="${msg.id}"]`);
    if (el) {
      evcRenderReactions(el, msg.reactions);
      evcRenderStatus(el, msg.deliveredTo, msg.seenBy);
    }
  });

  const newMessages = messages.filter(m => !renderedIds.has(m.id));
  const newMsgCount = newMessages.length;

  if (newMessages.length === 0) {
    if (idsChanged && wasNearBottom) evcScrollToBottom();
    return;
  }

  const seenObs = evcGetSeenObserver();

  // ── Look-ahead: determine whether each new message shows its timestamp ────
  const minuteOf = msg => {
    const t = msg.sentAt?.toDate ? msg.sentAt.toDate() : new Date();
    return Math.floor(t.getTime() / 60000);
  };
  const showTimeArr = newMessages.map((msg, i) => {
    if (msg.type === "announcement") return true;
    const next = newMessages[i + 1];
    if (!next || next.type === "announcement") return true;
    if (msg.senderUid !== next.senderUid)       return true;
    return minuteOf(msg) !== minuteOf(next);
  });

  // Hide time on the last DOM message if the first new message continues it
  const firstNew = newMessages[0];
  if (firstNew && firstNew.type !== "announcement") {
    const prevDomMsgs = container.querySelectorAll(".chat-msg:not(.evc-sys-msg)");
    const lastDom     = prevDomMsgs.length ? prevDomMsgs[prevDomMsgs.length - 1] : null;
    if (lastDom &&
        lastDom.dataset.sender === firstNew.senderUid &&
        parseInt(lastDom.dataset.minute || "-1") === minuteOf(firstNew)) {
      lastDom.querySelector(".chat-msg-time")?.classList.add("msg-time-hidden");
    }
  }

  // ── Append new messages ───────────────────────────────────────────────────
  newMessages.forEach((msg, idx) => {
    const showTime  = showTimeArr[idx];
    const isMine    = msg.senderUid === currentUID;
    const ts        = msg.sentAt?.toDate ? msg.sentAt.toDate() : new Date();
    const timeStr   = ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const minute    = Math.floor(ts.getTime() / 60000);
    const timeDiff  = ts.getTime() - evcLastSenderTime;
    const isGrouped = msg.senderUid === evcLastSender && timeDiff < 5 * 60 * 1000;

    evcLastSender     = msg.senderUid;
    evcLastSenderTime = ts.getTime();

    const div = document.createElement("div");
    div.dataset.msgId = msg.id;

    // ── System announcement ───────────────────────────────────────────────
    if (msg.type === "announcement") {
      div.className = "chat-msg evc-sys-msg msg-new";
      div.innerHTML = `
        <div class="evc-sys-inner">
          <span class="evc-sys-label">📢 Host Announcement</span>
          <p class="evc-sys-text">${escHtml(msg.text)}</p>
          <span class="evc-sys-time">${timeStr}</span>
        </div>`;
      container.appendChild(div);
      evcLastSender = null;
      return;
    }

    div.dataset.sender = msg.senderUid;
    div.dataset.minute = minute;
    div.className = `chat-msg evc-msg msg-new ${isMine ? "mine" : "theirs"}${isGrouped ? " evc-grouped" : ""}`;

    if (!isMine) {
      // ── Theirs ───────────────────────────────────────────────────────────
      const name     = escHtml(msg.senderName || "User");
      const initials = (msg.senderName || "U")[0].toUpperCase();
      const avHtml   = msg.senderPhoto
        ? `<img src="${escHtml(msg.senderPhoto)}" alt=""/>`
        : initials;
      const timePart = showTime ? `<span class="chat-msg-time">${timeStr}</span>` : "";
      div.innerHTML = isGrouped
        ? `<div class="evc-msg-av-ghost"></div>
           <div class="evc-msg-body">
             <div class="chat-msg-bubble">${escHtml(msg.text)}</div>
             ${timePart}
           </div>`
        : `<div class="evc-msg-av">${avHtml}</div>
           <div class="evc-msg-body">
             <div class="evc-msg-sender">${name}</div>
             <div class="chat-msg-bubble">${escHtml(msg.text)}</div>
             ${timePart}
           </div>`;

      if (!evcDeliveredSet.has(msg.id)) {
        evcDeliveredSet.add(msg.id);
        markDelivered(evcEventId, msg.id, currentUID);
      }
      seenObs.observe(div);
    } else {
      // ── Mine: bubble + msg-meta row (time + status together) ─────────────
      const timeClass = showTime ? "" : " msg-time-hidden";
      div.innerHTML = `
        <div class="evc-msg-body-mine">
          <div class="chat-msg-bubble">${escHtml(msg.text)}</div>
          <div class="msg-meta">
            <span class="chat-msg-time${timeClass}">${timeStr}</span>
            <span class="evc-msg-status"></span>
          </div>
        </div>`;
    }

    evcRenderReactions(div, msg.reactions);
    evcRenderStatus(div, msg.deliveredTo, msg.seenBy);

    // Long-press / right-click → reaction picker
    let pressTimer = null;
    div.addEventListener("contextmenu", e => { e.preventDefault(); evcOpenReactionPicker(div); });
    div.addEventListener("pointerdown",  () => { pressTimer = setTimeout(() => evcOpenReactionPicker(div), 500); });
    div.addEventListener("pointerup",    () => clearTimeout(pressTimer));
    div.addEventListener("pointerleave", () => clearTimeout(pressTimer));

    container.appendChild(div);
  });

  // ── Scroll / badge logic ──────────────────────────────────────────────────
  if (idsChanged) {
    if (wasEmpty || wasNearBottom) {
      evcNewMsgCount = 0;
      evcScrollToBottom();
    } else if (newMsgCount > 0) {
      evcNewMsgCount += newMsgCount;
      const btn = $("evc-new-msgs-btn");
      if (btn) {
        const label = evcNewMsgCount === 1 ? "1 new message" : `${evcNewMsgCount} new messages`;
        btn.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg> ${label}`;
        btn.classList.remove("hidden");
        if (btn.classList.contains("evc-new-msgs-bump")) {
          btn.classList.remove("evc-new-msgs-bump");
          void btn.offsetWidth;
        }
        btn.classList.add("evc-new-msgs-bump");
      }
    }
  }
}

// ── Send ──────────────────────────────────────────────────────────────────────
async function sendEventChatMsg() {
  if (evcSending || !evcEventId) return;
  const input   = $("evc-input");
  const sendBtn = $("evc-send");
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  evcSending = true;
  if (sendBtn) { sendBtn.disabled = true; sendBtn.innerHTML = `<span class="spinner" style="width:12px;height:12px;border-width:2px"></span>`; }

  const sendIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;

  try {
    const user = getCurrentUser();
    await sendEventChatMessage(evcEventId, currentUID, user?.displayName, user?.photoURL, text);
    input.value = "";   // clear ONLY on success
    $("evc-send")?.classList.remove("has-text");
    input.focus();
    // Clear typing indicator when message is sent
    if (evcTypingActive && evcEventId) {
      evcTypingActive = false;
      clearTypingTimer();
      clearTyping(evcEventId, currentUID);
    }
  } catch (err) {
    console.error("[EVC send]", err);
    toast("Failed to send message.", "error");
    // Keep text in input on failure
  } finally {
    evcSending = false;
    if (sendBtn) { sendBtn.disabled = false; sendBtn.innerHTML = sendIcon; }
  }
}

// ── Typing: helper to clear the debounce timer ────────────────────────────────
function clearTypingTimer() {
  if (evcTypingTimer) { clearTimeout(evcTypingTimer); evcTypingTimer = null; }
}

// ── Wire send button + Enter key ─────────────────────────────────────────────
$("evc-send")?.addEventListener("click", sendEventChatMsg);
$("evc-input")?.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendEventChatMsg(); }
});

// ── Wire typing indicator on input ───────────────────────────────────────────
$("evc-input")?.addEventListener("input", () => {
  const hasText = $("evc-input")?.value.trim().length > 0;
  $("evc-send")?.classList.toggle("has-text", hasText);

  if (!evcEventId || !currentUID) return;
  const user = getCurrentUser();

  // Send typing signal + reset auto-clear timer
  clearTypingTimer();
  if (hasText) {
    if (!evcTypingActive) {
      evcTypingActive = true;
      updateTyping(evcEventId, currentUID, user?.displayName || "User");
    }
    // Auto-clear after 4 s of inactivity
    evcTypingTimer = setTimeout(() => {
      evcTypingActive = false;
      clearTyping(evcEventId, currentUID);
    }, 4000);
  } else {
    // Input cleared
    if (evcTypingActive) {
      evcTypingActive = false;
      clearTyping(evcEventId, currentUID);
    }
  }
});

// ── Wire new-messages indicator ───────────────────────────────────────────────
$("evc-new-msgs-btn")?.addEventListener("click", () => {
  evcNewMsgCount = 0;
  evcScrollToBottom();
  $("evc-new-msgs-btn")?.classList.add("hidden");
});
// ═══════════════════════════════════════
// ACTIVITY PANEL
// ═══════════════════════════════════════

function loadActivityPanel() {
  if (activityLoaded) return;
  activityLoaded = true;

  let safetyTimer = setTimeout(() => {
    if (activityJoinedList &&
        activityJoinedList.querySelector(".activity-loading")) {
      console.warn("[Activity] Safety timeout fired — clearing loader");
      renderJoinedEvents([]);
    }
  }, 5000);

  function mergeAndRender() {
    clearTimeout(safetyTimer);

    // Merge own events + approved joined events, deduplicate by eventId
    const seen = new Set();
    const merged = [];
    [...ownCalEvents, ...calJoinedEvents].forEach(ev => {
      const key = ev.eventId || ev.id;
      if (!seen.has(key)) { seen.add(key); merged.push(ev); }
    });
    calJoinedEvents = merged;

    // Only show genuinely joined (guest) events in the Joined tab
    const joinedOnly = merged.filter(ev => !ev._isOwn);
    console.log("[Activity] Joined events loaded:", joinedOnly.length,
      joinedOnly.map(e => e.eventName));

    console.log("[Calendar] Merged total:", merged.length,
      merged.map(e => ({ name: e.eventName, date: e.date, own: e._isOwn })));

    renderJoinedEvents(joinedOnly);
    renderCalendar();
    renderUpcomingEvents();
    if (calSelectedDate) {
      const map = buildEventDayMap(calJoinedEvents);
      renderCalDayEvents(calSelectedDate, map[calSelectedDate] || []);
    }
  }

  // Subscribe to own created events
  ownEventsUnsub = listenToCalendarEvents(currentUID, events => {
    ownCalEvents = events;
    mergeAndRender();
  });

  // Subscribe to approved join requests
  sentReqUnsub = listenToSentRequests(currentUID, async requests => {
    console.log("[Activity] sentRequests:", requests.length,
      "  approved:", requests.filter(r => r.status === "approved").length);

    const rawPending  = requests.filter(r => r.status === "pending");
    const rawApproved = requests.filter(r => r.status === "approved");

    // Repair both pending and approved (fetch missing date + photoURL from event sources)
    const [repairedPending, repaired] = await Promise.all([
      repairSentRequestDates(currentUID, rawPending),
      repairSentRequestDates(currentUID, rawApproved),
    ]);
    _actPendingReqs = repairedPending;

    console.log("[Activity] Repaired events:",
      repaired.map(r => ({ name: r.eventName, date: r.date, hasPhoto: !!r.photoURL })));

    calJoinedEvents = repaired;
    mergeAndRender();
    renderJoinedEvents(repaired);
  });

  renderCalendar();
  wireActivityTabs();
  wireCalNav();
}

function wireActivityTabs() {
  document.querySelectorAll(".activity-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".activity-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      const target = tab.dataset.tab;
      document.querySelectorAll(".activity-section").forEach(s => {
        s.classList.toggle("hidden", s.id !== `activity-section-${target}`);
      });
      if (target === "calendar") renderCalendar();
    });
  });
}

function renderSentRequests(requests) {
  if (!activityReqList) return;
  if (!requests.length) {
    activityReqList.innerHTML = `
      <div class="activity-empty-state">
        <div class="activity-empty-icon">◎</div>
        <div class="activity-empty-msg">No requests sent yet</div>
        <div class="activity-empty-sub">Join public events to see your requests here</div>
      </div>`;
    return;
  }
  activityReqList.innerHTML = "";
  requests.forEach(req => {
    const card = document.createElement("div");
    card.className = `request-card${req.status === "rejected" ? " rejected" : ""}`;
    const statusIcon = req.status === "approved" ? "🟢" : req.status === "rejected" ? "🔴" : "🟡";
    const statusLabel = req.status === "approved" ? "Approved" : req.status === "rejected" ? "Rejected" : "Pending";
    const viewBtn = req.status === "approved"
      ? `<button class="btn-view-event" data-eid="${req.eventId}">View Event</button>` : "";
    card.innerHTML = `
      <div class="request-card-icon">${statusIcon}</div>
      <div class="request-card-body">
        <div class="request-card-name">${escHtml(req.eventName || "Unknown Event")}</div>
        <div class="request-card-host">Hosted by ${escHtml(req.hostName || "Unknown")}</div>
      </div>
      <span class="request-status-badge ${req.status || "pending"}">${statusLabel}</span>
      ${viewBtn}`;
    card.querySelector(".btn-view-event")?.addEventListener("click", () => {
      openEventDetails({ ...req, id: req.eventId, name: req.eventName, _userRelation: "attending" });
    });
    activityReqList.appendChild(card);
  });
}

function renderJoinedEvents(approved) {
  if (!activityJoinedList) return;

  const pending  = _actPendingReqs;
  const hasData  = approved.length > 0 || pending.length > 0;

  if (!hasData) {
    activityJoinedList.innerHTML = `
      <div class="act-empty-state">
        <div class="act-empty-icon">🎉</div>
        <div class="act-empty-title">No events yet</div>
        <div class="act-empty-sub">Join or create your first event to see it here</div>
      </div>`;
    return;
  }

  activityJoinedList.innerHTML = "";

  // ── Pending section ─────────────────────────────────────────────
  if (pending.length > 0) {
    const sec = document.createElement("div");
    sec.className = "act-pending-section";
    sec.innerHTML = `
      <div class="act-section-header">
        <span class="act-section-title">⏳ Pending Requests</span>
        <span class="act-section-sub">Awaiting host approval</span>
      </div>
      <div class="act-event-grid" id="act-pending-grid"></div>`;
    activityJoinedList.appendChild(sec);

    const pendingGrid = sec.querySelector("#act-pending-grid");
    pending.forEach(req => {
      pendingGrid.appendChild(buildActivityCard({
        id:        req.eventId,
        name:      req.eventName || "Pending Event",
        hostName:  req.hostName  || "Unknown",
        hostUid:   req.hostUid,
        date:      req.date || null,
        photoURL:  req.photoURL  || null,
        status:    "pending",
      }, req));
    });
  }

  // ── Approved / Going section ─────────────────────────────────────
  if (approved.length > 0) {
    const sec = document.createElement("div");
    sec.className = "act-joined-section";
    if (pending.length > 0) {
      sec.innerHTML = `<div class="act-section-header">
        <span class="act-section-title">✅ Joined Events</span>
      </div>`;
    }
    const grid = document.createElement("div");
    grid.className = "act-event-grid";
    sec.appendChild(grid);
    activityJoinedList.appendChild(sec);

    approved.forEach(ev => {
      const today = new Date(); today.setHours(0,0,0,0);
      let evDate = null;
      if (ev.date) {
        if (ev.date.seconds) evDate = new Date(ev.date.seconds * 1000);
        else { evDate = new Date(String(ev.date).replace(" ", "T")); if (isNaN(evDate)) evDate = null; }
      }
      const isPast = evDate && evDate < today;
      grid.appendChild(buildActivityCard({
        id:       ev.eventId || ev.id,
        name:     ev.eventName || "Event",
        hostName: ev.hostName  || "Unknown",
        hostUid:  ev.hostUid,
        date:     ev.date,
        photoURL: ev.photoURL  || null,
        status:   isPast ? "past" : "going",
      }, null));
    });
  }
}

// ── Build a visual activity event card ───────────────────────────────────────
function buildActivityCard(ev, reqData) {
  const card = document.createElement("div");
  card.className = "act-event-card";

  const hasImg   = !!(ev.photoURL && ev.photoURL.startsWith("http"));
  const dateStr  = ev.date ? fmtDate(ev.date) : null;
  const statusBadge = {
    going:   `<span class="act-status-badge going">Going</span>`,
    pending: `<span class="act-status-badge pending">Pending</span>`,
    past:    `<span class="act-status-badge past">Past</span>`,
  }[ev.status] || "";

  // Background image layer
  const imgDiv = document.createElement("div");
  imgDiv.className = "act-card-img";
  if (hasImg) {
    imgDiv.style.backgroundImage = `url("${ev.photoURL}")`;
    card.classList.add("has-image");
  }
  card.appendChild(imgDiv);

  // Gradient overlay
  const overlay = document.createElement("div");
  overlay.className = "act-card-overlay";
  card.appendChild(overlay);

  // Content
  card.insertAdjacentHTML("beforeend", `
    <div class="act-card-body">
      <div class="act-card-top">${statusBadge}</div>
      <div class="act-card-name">${escHtml(ev.name)}</div>
      <div class="act-card-meta">
        <span>👤 ${escHtml(ev.hostName)}</span>
        ${dateStr ? `<span>📅 ${escHtml(dateStr)}</span>` : ""}
      </div>
      <div class="act-card-actions"></div>
    </div>`);

  const actions = card.querySelector(".act-card-actions");

  // View button
  const btnView = document.createElement("button");
  btnView.className = "btn btn-primary act-btn";
  btnView.textContent = "View Event";
  btnView.addEventListener("click", e => {
    e.stopPropagation();
    openEventDetails({ id: ev.id, name: ev.name, hostUid: ev.hostUid, hostName: ev.hostName, date: ev.date, photoURL: ev.photoURL, _userRelation: ev.status === "going" ? "attending" : "pending" });
  });
  actions.appendChild(btnView);

  // Cancel button (pending only)
  if (ev.status === "pending" && reqData) {
    const btnCancel = document.createElement("button");
    btnCancel.className = "btn btn-danger act-btn";
    btnCancel.textContent = "Cancel";
    btnCancel.addEventListener("click", async e => {
      e.stopPropagation();
      if (!confirm(`Cancel your request to join "${ev.name}"?`)) return;
      setLoading(btnCancel, true);
      try {
        await deleteDoc(doc(db, "users", currentUID, "sentRequests", ev.id));
        if (ev.hostUid) {
          await deleteDoc(doc(db, "users", ev.hostUid, "events", ev.id, "requests", currentUID));
        }
        toast("Request cancelled.", "success");
      } catch (err) {
        console.error("[Cancel req]", err);
        toast("Failed to cancel request.", "error");
        setLoading(btnCancel, false);
      }
    });
    actions.appendChild(btnCancel);
  }

  // Card click → open event details
  card.addEventListener("click", () => {
    openEventDetails({ id: ev.id, name: ev.name, hostUid: ev.hostUid, hostName: ev.hostName, date: ev.date, photoURL: ev.photoURL, _userRelation: ev.status });
  });

  return card;
}

// ── Calendar ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = ["January","February","March","April","May","June",
                     "July","August","September","October","November","December"];

/** Normalize any date value → "YYYY-MM-DD" string, or null if invalid. */
function normDate(val) {
  if (!val) return null;

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(val))) return String(val);

  let d;
  // Firestore Timestamp
  if (val && typeof val === "object" && typeof val.toDate === "function") {
    d = val.toDate();
  } else if (val && typeof val === "object" && typeof val.seconds === "number") {
    // Plain Firestore Timestamp-like object
    d = new Date(val.seconds * 1000);
  } else {
    d = new Date(val);
  }

  if (!d || isNaN(d.getTime())) {
    console.warn("[normDate] Invalid date value:", val);
    return null;
  }

  const result = d.toISOString().slice(0, 10);
  return result;
}

/** Build { "YYYY-MM-DD": [event, ...] } map. */
function buildEventDayMap(events) {
  const map = {};
  events.forEach(ev => {
    const key = normDate(ev.date);
    if (!key) {
      console.log("[Calendar] Event skipped (no valid date):", ev.eventName, "date value:", ev.date);
      return;
    }
    if (!map[key]) map[key] = [];
    map[key].push(ev);
  });
  console.log("[Calendar] eventDayMap keys:", Object.keys(map), "from", events.length, "events");
  return map;
}

function renderCalendar() {
  if (!calGrid || !calMonthLabel) return;
  calMonthLabel.textContent = `${MONTH_NAMES[calMonth]} ${calYear}`;
  calGrid.innerHTML = "";

  const firstDow    = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const today       = new Date();
  const eventDayMap = buildEventDayMap(calJoinedEvents);
  const mapKeys     = Object.keys(eventDayMap);

  console.log("[Calendar] Rendering", MONTH_NAMES[calMonth], calYear,
    "| eventMap keys:", mapKeys,
    "| calJoinedEvents:", calJoinedEvents.length);

  for (let i = 0; i < firstDow; i++) {
    const blank = document.createElement("div");
    blank.className = "cal-day empty";
    calGrid.appendChild(blank);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr  = `${calYear}-${String(calMonth + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const isToday  = today.getFullYear() === calYear && today.getMonth() === calMonth && today.getDate() === d;
    const hasEv    = Boolean(eventDayMap[dateStr]);
    const selected = calSelectedDate === dateStr;

    if (hasEv) {
      console.log("[Calendar] Day with event:", dateStr, "→", eventDayMap[dateStr].map(e => e.eventName));
    }

    const cell = document.createElement("div");
    cell.className = [
      "cal-day",
      isToday  ? "today"     : "",
      hasEv    ? "has-event" : "",
      hasEv && eventDayMap[dateStr].length > 1 ? "has-multi" : "",
      selected ? "selected"  : ""
    ].filter(Boolean).join(" ");
    cell.textContent = d;
    cell.dataset.date = dateStr;

    cell.addEventListener("click", () => {
      calSelectedDate = dateStr;
      renderCalendar();
      renderCalDayEvents(dateStr, eventDayMap[dateStr] || []);
      highlightUpcoming(dateStr);
    });
    calGrid.appendChild(cell);
  }
}

function renderCalDayEvents(dateStr, eventsForDay) {
  if (!calEventPanel) return;
  const label = new Date(dateStr + "T12:00:00").toLocaleDateString(undefined,
    { weekday: "long", month: "long", day: "numeric" });
  const todayStr = new Date().toISOString().slice(0, 10);

  // Trigger fade-in by toggling class
  calEventPanel.classList.remove("cal-panel-animate");
  void calEventPanel.offsetWidth;
  calEventPanel.classList.add("cal-panel-animate");

  if (!eventsForDay?.length) {
    calEventPanel.innerHTML = `
      <div class="cal-panel-date">${label}</div>
      <div class="cal-events-empty">📭 No events for this day</div>`;
    return;
  }
  calEventPanel.innerHTML = `<div class="cal-panel-date">${label}</div>`;
  eventsForDay.forEach((ev, idx) => {
    const evDateStr = normDate(ev.date);
    let statusClass = "upcoming", statusLabel = "Upcoming";
    if (evDateStr && evDateStr < todayStr)  { statusClass = "past";    statusLabel = "Past"; }
    else if (evDateStr === todayStr)        { statusClass = "today-ev"; statusLabel = "Today"; }

    let timeStr = "";
    if (ev.date && typeof ev.date === "string") {
      if (ev.date.includes(" ")) timeStr = ev.date.split(" ")[1];
      else if (ev.date.includes("T")) timeStr = ev.date.split("T")[1]?.slice(0, 5);
    }

    const item = document.createElement("div");
    item.className = "cal-event-item";
    item.style.animationDelay = `${idx * 0.04}s`;
    item.innerHTML = `
      <div class="cal-event-dot"></div>
      <div style="flex:1;min-width:0">
        <div class="cal-event-name">${escHtml(ev.eventName || "Unknown Event")}</div>
        <div style="display:flex;gap:8px;align-items:center;margin-top:2px;flex-wrap:wrap">
          ${timeStr ? `<span class="cal-event-time">🕐 ${escHtml(timeStr)}</span>` : ""}
          <span class="cal-event-host">${escHtml(ev.hostName || "")}</span>
        </div>
      </div>
      <span class="cal-ev-status ${statusClass}">${statusLabel}</span>`;
    item.addEventListener("click", () => {
      const rel = ev._isOwn ? "host" : "attending";
      openEventDetails({ id: ev.eventId || ev.id, name: ev.eventName, hostUid: ev.hostUid, hostName: ev.hostName, date: ev.date, _userRelation: rel });
    });
    calEventPanel.appendChild(item);
  });
}

function renderUpcomingEvents() {
  if (!calUpcomingList) return;

  const today    = new Date(); today.setHours(0,0,0,0);
  const todayStr = today.toISOString().slice(0,10);

  const withDates = calJoinedEvents
    .map(ev => ({ ...ev, _normDate: normDate(ev.date) }))
    .filter(ev => ev._normDate);

  withDates.sort((a, b) => a._normDate.localeCompare(b._normDate));

  const upcoming = withDates.filter(ev => ev._normDate >= todayStr);
  const past     = withDates.filter(ev => ev._normDate <  todayStr).reverse(); // most recent first
  const sorted   = [...upcoming, ...past];

  if (!sorted.length) {
    calUpcomingList.innerHTML = `
      <div class="activity-empty-state" style="padding:24px 16px">
        <div class="activity-empty-icon">📅</div>
        <div class="activity-empty-msg">No upcoming events</div>
        <div class="activity-empty-sub">Join public events to see them here</div>
      </div>`;
    return;
  }

  // Group events by label
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const weekEnd  = new Date(today); weekEnd.setDate(today.getDate() + 7);

  const groups = { Today: [], Tomorrow: [], "This Week": [], Later: [], Past: [] };
  sorted.forEach(ev => {
    const d = new Date(ev._normDate + "T12:00:00");
    if (ev._normDate === todayStr)                          groups["Today"].push(ev);
    else if (ev._normDate === tomorrow.toISOString().slice(0,10)) groups["Tomorrow"].push(ev);
    else if (d >= tomorrow && d <= weekEnd)                groups["This Week"].push(ev);
    else if (d > weekEnd)                                  groups["Later"].push(ev);
    else                                                   groups["Past"].push(ev);
  });

  calUpcomingList.innerHTML = "";

  const groupOrder = ["Today", "Tomorrow", "This Week", "Later", "Past"];
  groupOrder.forEach(groupName => {
    const evs = groups[groupName];
    if (!evs.length) return;

    const header = document.createElement("div");
    header.className = "cal-upcoming-group-header";
    header.textContent = groupName;
    calUpcomingList.appendChild(header);

    evs.forEach(ev => {
      const dateStr = ev._normDate;
      const isPast  = dateStr < todayStr;
      const item    = document.createElement("div");
      item.className = `cal-upcoming-item${calSelectedDate === dateStr ? " active" : ""}${isPast ? " past" : ""}`;
      item.dataset.date = dateStr;

      const d         = new Date(dateStr + "T12:00:00");
      const dateLabel = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });

      item.innerHTML = `
        <div class="cal-upcoming-left">
          <div class="cal-upcoming-dot${isPast ? " past" : ""}"></div>
        </div>
        <div class="cal-upcoming-body">
          <div class="cal-upcoming-name">${escHtml(ev.eventName || "Unknown Event")}</div>
          <div class="cal-upcoming-meta">
            <span>📅 ${escHtml(dateLabel)}</span>
            <span>👤 ${escHtml(ev.hostName || "Unknown")}</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0">
          <span class="cal-upcoming-badge${isPast ? " past" : ""}">${isPast ? "Past" : "Attending"}</span>
          <button class="btn-upcoming-view" title="View event details">View</button>
        </div>`;

      // Calendar sync on row click
      item.addEventListener("click", e => {
        if (e.target.classList.contains("btn-upcoming-view")) return; // handled separately
        const evDate = new Date(dateStr + "T12:00:00");
        calYear  = evDate.getFullYear();
        calMonth = evDate.getMonth();
        calSelectedDate = dateStr;
        renderCalendar();
        const map = buildEventDayMap(calJoinedEvents);
        renderCalDayEvents(dateStr, map[dateStr] || []);
        highlightUpcoming(dateStr);

        document.querySelectorAll(".activity-tab").forEach(t =>
          t.classList.toggle("active", t.dataset.tab === "calendar"));
        document.querySelectorAll(".activity-section").forEach(s =>
          s.classList.toggle("hidden", s.id !== "activity-section-calendar"));

        document.querySelector(".cal-wrap")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });

      // View button → open event details modal
      item.querySelector(".btn-upcoming-view").addEventListener("click", e => {
        e.stopPropagation();
        const rel = ev._isOwn ? "host" : "attending";
        openEventDetails({ id: ev.eventId || ev.id, name: ev.eventName, hostUid: ev.hostUid, hostName: ev.hostName, date: ev.date, _userRelation: rel });
      });

      calUpcomingList.appendChild(item);
    });
  });
}

function highlightUpcoming(dateStr) {
  if (!calUpcomingList) return;
  calUpcomingList.querySelectorAll(".cal-upcoming-item").forEach(el => {
    el.classList.toggle("active", el.dataset.date === dateStr);
  });
}

function wireCalNav() {
  $("cal-prev")?.addEventListener("click", () => {
    calMonth--;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    calSelectedDate = null;
    renderCalendar();
    if (calEventPanel) calEventPanel.innerHTML = `<div class="cal-events-empty">Select a day to see events</div>`;
    highlightUpcoming(null);
  });
  $("cal-next")?.addEventListener("click", () => {
    calMonth++;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    calSelectedDate = null;
    renderCalendar();
    if (calEventPanel) calEventPanel.innerHTML = `<div class="cal-events-empty">Select a day to see events</div>`;
    highlightUpcoming(null);
  });
  $("cal-today")?.addEventListener("click", () => {
    const now = new Date();
    calYear  = now.getFullYear();
    calMonth = now.getMonth();
    const todayStr = now.toISOString().slice(0, 10);
    calSelectedDate = todayStr;
    renderCalendar();
    const map = buildEventDayMap(calJoinedEvents);
    renderCalDayEvents(todayStr, map[todayStr] || []);
    highlightUpcoming(todayStr);
  });
}

// ═══════════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════════

function startNotifications(uid) {
  if (notifUnsub) { notifUnsub(); notifUnsub = null; }
  let prevUnread = -1; // -1 = initial load, suppress toast on first snapshot
  notifUnsub = listenToNotifications(uid, notifs => {
    allNotifs = notifs;
    const unread = notifs.filter(n => !n.read).length;
    if (notifBadge) {
      notifBadge.textContent = unread > 9 ? "9+" : unread;
      notifBadge.classList.toggle("hidden", unread === 0);
    }
    // Show toast + pulse bell only for genuinely new notifications (not on first load)
    if (prevUnread >= 0 && unread > prevUnread) {
      const newest = notifs.find(n => !n.read);
      if (newest) {
        toast(newest.text || "New notification", "info");
        notifBell?.classList.add("notif-bell-pulse");
        setTimeout(() => notifBell?.classList.remove("notif-bell-pulse"), 2200);
      }
    }
    prevUnread = unread;
    if (notifPanelOpen) renderNotifList(notifs);
  });
}

function renderNotifList(notifs) {
  if (!notifList) return;
  if (!notifs.length) {
    notifList.innerHTML = `<div class="notif-empty">No notifications yet</div>`;
    return;
  }
  notifList.innerHTML = "";
  notifs.forEach(n => {
    const item = document.createElement("div");
    item.className = `notif-item${n.read ? "" : " unread"}`;
    item.style.cursor = "pointer";

    const icons = {
      friend_request:   { icon: "👤", cls: "t-v"    },
      friend_accepted:  { icon: "✓",  cls: "t-em"   },
      request_approved: { icon: "✓",  cls: "t-em"   },
      request_rejected: { icon: "✕",  cls: "t-warn"  },
      event_invite:     { icon: "🎉", cls: "t-v"    },
      event_updated:    { icon: "✎",  cls: "t-warn"  },
      message:          { icon: "💬", cls: "t-v"    },
      checkin:          { icon: "✓",  cls: "t-em"   },
      announcement:     { icon: "📢", cls: "t-warn"  },
      join_request:     { icon: "👤", cls: "t-v"    },
    };
    const { icon, cls } = icons[n.type] || { icon: "🔔", cls: "" };

    const ts = n.createdAt?.toDate ? n.createdAt.toDate() : new Date();
    const timeAgo = (() => {
      const diff = Date.now() - ts.getTime();
      if (diff < 60000)   return "just now";
      if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
      return ts.toLocaleDateString();
    })();

    item.innerHTML = `
      <div class="notif-item-icon ${cls}">${icon}</div>
      <div class="notif-item-body">
        <div class="notif-item-text">${escHtml(n.text || n.type)}</div>
        <div class="notif-item-time">${timeAgo}</div>
      </div>
      ${!n.read ? '<div class="notif-unread-dot"></div>' : ""}`;

    item.addEventListener("click", async () => {
      if (!n.read) markNotificationsRead(currentUID, [n.id]).catch(() => {});
      notifPanelOpen = false;
      notifPanel?.classList.add("hidden");
      if (n.eventId) {
        try {
          const evData = await fetchEventById(n.eventId, n.fromUid || null);
          if (evData) openEventDetails({ ...evData, id: evData.id, _userRelation: "none" });
        } catch { toast("Event not found.", "error"); }
      }
    });

    notifList.appendChild(item);
  });
}

if (notifBell) {
  notifBell.addEventListener("click", e => {
    e.stopPropagation();
    notifPanelOpen = !notifPanelOpen;
    notifPanel?.classList.toggle("hidden", !notifPanelOpen);
    if (notifPanelOpen) renderNotifList(allNotifs);
  });
}
document.addEventListener("click", e => {
  if (notifPanelOpen && notifPanel && !notifPanel.contains(e.target) && e.target !== notifBell) {
    notifPanelOpen = false;
    notifPanel.classList.add("hidden");
  }
});
if (notifMarkRead) {
  notifMarkRead.addEventListener("click", async () => {
    const unreadIds = allNotifs.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length) await markNotificationsRead(currentUID, unreadIds);
  });
}

// ═══════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════
// EVENT DETAILS MODAL — real-time reactive component
// ═══════════════════════════════════════════════════════════

const edModal        = $("modal-event-details");
const edClose        = $("edc-close");
const edLoading      = $("edc-loading");
const edBadges       = $("edc-badges");
const edTitle        = $("edc-title");
const edDate         = $("edc-date");
const edHost         = $("edc-host");
const edDesc         = $("edc-desc");
const edMeta         = $("edc-meta");
const edGuestSec     = $("edc-guests-section");
const edGuestAvatars = $("edc-guest-avatars");
const edActions      = $("edc-actions");

// Wire tab bar via delegation
$("edc-tabs")?.addEventListener("click", e => {
  const btn = e.target.closest(".edc-tab");
  if (btn?.dataset.tab) edSwitchTab(btn.dataset.tab);
});

// Subscription handles
let edUnsubEvent   = null;
let edUnsubGuests  = null;
let edUnsubStatus  = null;

// Live state
let edCurrentEvent = null;   // latest full event doc
let edLiveGuests   = [];     // latest guest array
let edUserRelation = "none"; // "host"|"attending"|"pending"|"rejected"|"none"
let edOpenEventId  = null;   // guard against duplicate opens
let edActiveTab    = "overview"; // "overview" | "chat"

// ── Tab switching ─────────────────────────────────────────────────────────────
function edSwitchTab(tabName) {
  if (edActiveTab === tabName) return; // already on this tab

  // Save chat scroll before leaving
  if (edActiveTab === "chat") {
    evcSavedScroll = $("evc-messages")?.scrollTop ?? 0;
  }

  edActiveTab = tabName;

  // Expand / collapse modal for chat mode
  $("edc-card")?.classList.toggle("chat-mode", tabName === "chat");

  // Update tab button active class
  document.querySelectorAll("#edc-tabs .edc-tab").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });

  // Swap panels: remove active from outgoing, add to incoming via rAF (no layout jump)
  const overviewPanel = $("edc-panel-overview");
  const chatPanel     = $("edc-panel-chat");
  const show = tabName === "overview" ? overviewPanel : chatPanel;
  const hide = tabName === "overview" ? chatPanel     : overviewPanel;

  hide?.classList.remove("active");
  requestAnimationFrame(() => {
    show?.classList.add("active");
  });

  // Save memory for this event
  if (edOpenEventId) edTabMemory.set(edOpenEventId, tabName);

  if (tabName === "chat") {
    edActivateChatTab();
  }

  // Restore scroll position when returning to chat (after listener has rendered)
  if (tabName === "chat" && evcSavedScroll > 0) {
    setTimeout(() => {
      const c = $("evc-messages");
      if (c) c.scrollTop = evcSavedScroll;
    }, 20);
  }
}

// ── Avatar stack helper ───────────────────────────────────────────────────────
function renderChatAvatarStack(guests) {
  const el = $("evc-avatars-stack");
  if (!el) return;
  el.innerHTML = "";
  if (!guests?.length) return;
  const MAX = 5;
  guests.slice(0, MAX).forEach(g => {
    const initials = (g.displayName || g.name || "U")[0].toUpperCase();
    const div = document.createElement("div");
    div.className = "evc-av-item";
    div.title = g.displayName || g.name || "Guest";
    if (g.photoURL) {
      const img = document.createElement("img");
      img.src = g.photoURL;
      img.alt = "";
      img.loading = "lazy";
      img.onerror = () => { img.style.display = "none"; div.textContent = initials; };
      div.appendChild(img);
    } else {
      div.textContent = initials;
    }
    el.appendChild(div);
  });
  if (guests.length > MAX) {
    const more = document.createElement("div");
    more.className = "evc-av-item evc-av-more";
    more.textContent = `+${guests.length - MAX}`;
    el.appendChild(more);
  }
}

// ── Chat tab: access check + start listener ───────────────────────────────────
async function edActivateChatTab() {
  if (!edCurrentEvent?.id) return;

  // Already listening to the same event — just focus input
  if (evcEventId === edCurrentEvent.id && evcUnsub) {
    setTimeout(() => $("evc-input")?.focus({ preventScroll: true }), 60);
    return;
  }

  evcResetDOM();
  evcSavedScroll = 0;
  evcEventId  = edCurrentEvent.id;
  evcHostUid  = edCurrentEvent.hostUid || null;

  // Populate chat context header
  const titleEl = $("evc-chat-header-title");
  const metaEl  = $("evc-chat-header-meta");
  if (titleEl) titleEl.textContent = edCurrentEvent.name || "Group Chat";
  if (metaEl) {
    const parts = [];
    if (edCurrentEvent.date) parts.push(fmtDate(edCurrentEvent.date));
    const count = edLiveGuests?.length || edCurrentEvent.guestCount || 0;
    if (count) parts.push(`${count} attendee${count !== 1 ? "s" : ""}`);
    metaEl.textContent = parts.join(" · ");
  }

  evcSetEmpty(`<span class="evc-empty-icon">⏳</span><span class="evc-empty-sub">Checking access…</span>`);
  $("evc-input")?.setAttribute("disabled", "true");
  $("evc-send")?.setAttribute("disabled",  "true");

  // Fast path: relation already known
  let allowed = edUserRelation === "host" || edUserRelation === "attending";

  // Slow path: Firestore check (cached per eventId)
  if (!allowed) {
    const cached = edChatAccessCache.get(edCurrentEvent.id);
    if (cached !== undefined) {
      allowed = cached;
    } else if (evcHostUid) {
      allowed = await checkEventChatAccess(edCurrentEvent.id, evcHostUid, currentUID).catch(() => false);
      edChatAccessCache.set(edCurrentEvent.id, allowed);
    }
  }

  if (!allowed) {
    evcSetEmpty(`<span class="evc-empty-icon">🔒</span><span class="evc-empty-title">Access restricted</span><span class="evc-empty-sub">You need to be an approved attendee</span>`);
    return;
  }

  $("evc-input")?.removeAttribute("disabled");
  $("evc-send")?.removeAttribute("disabled");
  evcSetEmpty(`<span class="evc-empty-icon">💬</span><span class="evc-empty-title">No messages yet</span><span class="evc-empty-sub">Start the conversation</span>`);

  // Render participant avatar stack from current guests
  renderChatAvatarStack(edLiveGuests);

  // Scroll listener — uses AbortController so it can be cleaned up on modal close
  evcScrollAbort?.abort();
  evcScrollAbort = new AbortController();
  const msgsEl = $("evc-messages");
  if (msgsEl) {
    msgsEl.addEventListener("scroll", () => {
      if (evcIsNearBottom()) {
        evcNewMsgCount = 0;
        $("evc-new-msgs-btn")?.classList.add("hidden");
      }
    }, { passive: true, signal: evcScrollAbort.signal });
  }

  if (evcUnsub) { evcUnsub(); evcUnsub = null; }
  evcUnsub = listenToEventChat(edCurrentEvent.id, renderEventChatMessages);

  // Start real-time typing indicator listener
  if (evcTypingUnsub) { evcTypingUnsub(); evcTypingUnsub = null; }
  evcTypingUnsub = listenToTyping(edCurrentEvent.id, currentUID, evcShowTyping);

  setTimeout(() => $("evc-input")?.focus({ preventScroll: true }), 80);
}

// ── Normalize from any source ────────────────────────────────────────────────
function normalizeEventInput(raw) {
  return {
    id:           raw.id          || raw.eventId   || "",
    name:         raw.name        || raw.eventName  || "",
    hostUid:      raw.hostUid                       || "",
    hostName:     raw.hostName                      || "",
    date:         raw.date                          || "",
    description:  raw.description                   || "",
    isPublic:     raw.isPublic !== undefined ? raw.isPublic : true,
    guestCount:   raw.guestCount  || 0,
    location:     raw.location    || "",
    maxGuests:    raw.maxGuests   || null,
    inviteToken:  raw.inviteToken || null,
    photoURL:     raw.photoURL    || null,
    _userRelation: raw._userRelation || null,
  };
}

// ── Universal entry point ─────────────────────────────────────────────────────
function openEventDetails(rawData) {
  const partial = normalizeEventInput(rawData);
  if (!partial.id) { console.warn("[EDM] No eventId — aborting"); return; }

  // Reuse existing subscriptions if same event is already open
  if (edOpenEventId === partial.id) {
    edModal?.classList.remove("hidden");
    return;
  }

  edUnsubAll();
  edOpenEventId  = partial.id;
  edCurrentEvent = partial;
  edLiveGuests   = [];
  edUserRelation = partial._userRelation ?? (currentUID === partial.hostUid ? "host" : "none");

  // Restore last-used tab for this event (default to overview)
  const restoredTab = edTabMemory.get(partial.id) || "overview";
  edActiveTab = restoredTab;
  $("edc-panel-overview")?.classList.toggle("active", restoredTab === "overview");
  $("edc-panel-chat")?.classList.toggle("active",    restoredTab === "chat");
  $("edc-card")?.classList.toggle("chat-mode", restoredTab === "chat");
  document.querySelectorAll("#edc-tabs .edc-tab").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === restoredTab);
  });

  edModal?.classList.remove("hidden");
  // Wire swipe-down-to-close for mobile (idempotent — only adds once)
  if (edModal && !edModal._swipeWired) {
    edModal._swipeWired = true;
    addSwipeClose($("edc-card"), closeEdModal);
  }
  edLoading?.classList.remove("hidden");
  renderEdHeader(partial);
  renderEdGuestStrip([]);
  edActions && (edActions.innerHTML = "");

  // If restoring to chat tab, activate it after listeners are wired
  if (restoredTab === "chat") setTimeout(() => edActivateChatTab(), 60);

  // ── 1. Real-time event doc ──────────────────────────────────────────────
  edUnsubEvent = listenToEventDoc(partial.id, partial.hostUid, ev => {
    if (!ev) { edLoading?.classList.add("hidden"); return; }
    edCurrentEvent = ev;
    renderEdHeader(ev);
    renderEdDescMeta(ev);
    // Refresh action row in case guestCount changed
    renderEdActions(ev, edUserRelation);
    edLoading?.classList.add("hidden");
  });

  // ── 2. Real-time guests ─────────────────────────────────────────────────
  const hostUid = partial.hostUid || (edCurrentEvent && edCurrentEvent.hostUid);
  if (hostUid) {
    edUnsubGuests = listenToEventGuests(hostUid, partial.id, guests => {
      edLiveGuests = guests;
      renderEdGuestStrip(guests, edCurrentEvent?.guestCount);
      renderEdStats(guests);
      // Keep avatar stack fresh if chat tab is visible
      if (edActiveTab === "chat") renderChatAvatarStack(guests);
    });
  }

  // ── 3. Real-time request status (skip if already known or user is host) ──
  if (!partial._userRelation && currentUID && currentUID !== partial.hostUid) {
    edUnsubStatus = listenToSentRequestDoc(currentUID, partial.id, reqDoc => {
      const prev = edUserRelation;
      edUserRelation = !reqDoc          ? "none"
                     : reqDoc.status === "approved" ? "attending"
                     : reqDoc.status === "rejected" ? "rejected"
                     : "pending";
      // Only re-render actions if status actually changed
      if (edUserRelation !== prev && edCurrentEvent) {
        renderEdActions(edCurrentEvent, edUserRelation);
        // Animate relation change
        if (edUserRelation === "attending") {
          edBadges?.querySelectorAll(".edc-badge-attend").forEach(b => b.style.animation = "notifPop 0.35s cubic-bezier(0.34,1.56,0.64,1)");
          toast("Your request was approved!", "success");
        }
      }
    });
  }
}

// ── Unsubscribe everything ───────────────────────────────────────────────────
function edUnsubAll() {
  if (edUnsubEvent)  { edUnsubEvent();  edUnsubEvent  = null; }
  if (edUnsubGuests) { edUnsubGuests(); edUnsubGuests = null; }
  if (edUnsubStatus) { edUnsubStatus(); edUnsubStatus = null; }
  // Stop chat listener + typing listener + observers + clear own typing signal
  if (evcUnsub)        { evcUnsub();        evcUnsub        = null; }
  if (evcTypingUnsub)  { evcTypingUnsub();  evcTypingUnsub  = null; }
  if (evcSeenObserver) { evcSeenObserver.disconnect(); evcSeenObserver = null; }
  clearTypingTimer();
  if (evcTypingActive && evcEventId) {
    evcTypingActive = false;
    clearTyping(evcEventId, currentUID);
  }
  evcScrollAbort?.abort(); evcScrollAbort = null;
  evcEventId    = null;
  edOpenEventId = null;
}

// ── Header (title, date, host, badges) ──────────────────────────────────────
function renderEdHeader(ev) {
  if (edTitle) edTitle.textContent = ev.name || "Event";
  if (edDate)  edDate.textContent  = ev.date ? fmtDate(ev.date) : "Date TBD";

  if (edHost) {
    const init = (ev.hostName || "H")[0].toUpperCase();
    edHost.innerHTML = `<div class="edc-host-av">${init}</div><span>Hosted by ${escHtml(ev.hostName || "Unknown")}</span>`;
  }

  // Cover image layer
  const coverBg = $("edc-cover-bg");
  if (coverBg) {
    if (ev.photoURL) {
      coverBg.style.backgroundImage = `url(${ev.photoURL})`;
      coverBg.classList.remove("hidden");
      $("edc-header-strip")?.classList.add("has-cover");
    } else {
      coverBg.classList.add("hidden");
      $("edc-header-strip")?.classList.remove("has-cover");
    }
  }

  if (edBadges) {
    const status      = getEventStatus(ev.date);
    const statusLabel = { upcoming: "Upcoming", ongoing: "Live Now", completed: "Past" };
    let html = `<span class="edc-badge edc-badge-${status}">${statusLabel[status]}</span>`;
    html += ev.isPublic
      ? `<span class="edc-badge edc-badge-public">Public</span>`
      : `<span class="edc-badge edc-badge-private">Private</span>`;
    if (edUserRelation === "host")      html += `<span class="edc-badge edc-badge-own">Your Event</span>`;
    if (edUserRelation === "attending") html += `<span class="edc-badge edc-badge-attend">Attending ✓</span>`;
    if (edUserRelation === "pending")   html += `<span class="edc-badge edc-badge-pending">⏳ Pending</span>`;
    if (edUserRelation === "rejected")  html += `<span class="edc-badge edc-badge-reject">✕ Denied</span>`;
    edBadges.innerHTML = html;
  }
}

// ── Description + Meta ───────────────────────────────────────────────────────
function renderEdDescMeta(ev) {
  if (edDesc) {
    edDesc.textContent = ev.description || "";
    edDesc.classList.toggle("hidden", !ev.description);
  }

  if (edMeta) {
    const parts = [];
    if (ev.location)  parts.push(`<span class="edc-meta-pill">📍 ${escHtml(ev.location)}</span>`);
    if (ev.maxGuests) parts.push(`<span class="edc-meta-pill">👥 Max ${ev.maxGuests}</span>`);
    edMeta.innerHTML = parts.join("");
  }
}

// ── Guest avatar strip (live) ─────────────────────────────────────────────────
function renderEdGuestStrip(guests, totalCount) {
  if (!edGuestSec || !edGuestAvatars) return;

  const total   = totalCount ?? guests.length;
  const preview = guests.slice(0, 5);
  const extra   = Math.max(0, total - preview.length);

  if (!preview.length && !extra) {
    edGuestSec.classList.add("hidden");
    return;
  }

  edGuestSec.classList.remove("hidden");
  const prevHtml = edGuestAvatars.innerHTML;
  const nextHtml = preview.map(g => {
    const init = (g.name || "G")[0].toUpperCase();
    return g.photoURL
      ? `<div class="edc-guest-av" title="${escHtml(g.name || "")}" style="transition:transform 0.2s"><img src="${escHtml(g.photoURL)}" alt=""/></div>`
      : `<div class="edc-guest-av" title="${escHtml(g.name || "")}" style="transition:transform 0.2s">${init}</div>`;
  }).join("") + (extra > 0 ? `<div class="edc-guest-more">+${extra}</div>` : "");

  if (prevHtml !== nextHtml) {
    edGuestAvatars.innerHTML = nextHtml;
    // Pulse animation on newly added avatars
    edGuestAvatars.querySelectorAll(".edc-guest-av").forEach((el, i) => {
      if (i >= preview.length - 1) { // newest at end
        el.style.animation = "notifPop 0.3s cubic-bezier(0.34,1.56,0.64,1)";
      }
    });
  }
}

// ── Action buttons (relation-aware) ──────────────────────────────────────────
function renderEdActions(ev, relation) {
  if (!edActions) return;

  // Re-render header badges whenever relation updates
  renderEdHeader(ev);

  edActions.innerHTML = "";

  // Row 1 — always: Copy Link + Event Chat (for host or attending)
  const row1 = document.createElement("div");
  row1.className = "edc-actions-row";

  const btnCopy = document.createElement("button");
  btnCopy.className = "btn-edc";
  btnCopy.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> Copy Link`;
  btnCopy.addEventListener("click", async () => {
    setLoading(btnCopy, true);
    try {
      const link = `${location.origin}${location.pathname}?eventId=${ev.id}`;
      await navigator.clipboard.writeText(link);
      toast("Event link copied!", "success");
    } catch { toast("Could not copy link.", "error"); }
    finally { setLoading(btnCopy, false); }
  });
  row1.appendChild(btnCopy);

  // Event Chat tab — visible to host and attending guests
  if (relation === "attending" || relation === "host") {
    const btnChat = document.createElement("button");
    btnChat.className = "btn-edc btn-edc-chat";
    btnChat.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> Chat`;
    btnChat.addEventListener("click", () => edSwitchTab("chat"));
    row1.appendChild(btnChat);
  }

  if (relation === "host") {
    const btnView = document.createElement("button");
    btnView.className = "btn-edc";
    btnView.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> Manage Event`;
    btnView.addEventListener("click", () => {
      closeEdModal();
      activatePanel("events");
      selectEvent(ev.id, ev);
    });
    row1.appendChild(btnView);
  }

  edActions.appendChild(row1);

  // Row 2 — primary action
  const row2 = document.createElement("div");
  row2.className = "edc-actions-row";

  if (relation === "host") {
    const btnEdit = document.createElement("button");
    btnEdit.className = "btn-edc";
    btnEdit.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit`;
    btnEdit.addEventListener("click", () => { closeEdModal(); openEditModal(ev); });

    const btnInvite = document.createElement("button");
    btnInvite.className = "btn-edc btn-edc-invite";
    btnInvite.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg> Invite Friends`;
    btnInvite.addEventListener("click", () => { selectEvent(ev.id, ev); closeEdModal(); openInviteFriendsModal(); });

    const btnDel = document.createElement("button");
    btnDel.className = "btn-edc btn-edc-danger";
    btnDel.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg> Delete`;
    btnDel.addEventListener("click", () => { closeEdModal(); openDeleteModal(ev.id, ev.name); });

    row2.append(btnEdit, btnInvite, btnDel);

  } else if (relation === "attending") {
    const btnAtt = document.createElement("button");
    btnAtt.className = "btn-edc btn-edc-success";
    btnAtt.disabled  = true;
    btnAtt.innerHTML = `✓ Attending`;
    row2.appendChild(btnAtt);

  } else if (relation === "pending") {
    const btnPend = document.createElement("button");
    btnPend.className = "btn-edc btn-edc-muted";
    btnPend.disabled  = true;
    btnPend.innerHTML = `⏳ Request Sent`;
    row2.appendChild(btnPend);

  } else if (relation === "rejected") {
    const btnRej = document.createElement("button");
    btnRej.className = "btn-edc btn-edc-muted";
    btnRej.disabled  = true;
    btnRej.innerHTML = `✕ Request Rejected`;
    row2.appendChild(btnRej);

  } else {
    // "none" — show Join button
    const btnJoin = document.createElement("button");
    btnJoin.className = "btn-edc btn-edc-primary";
    btnJoin.dataset.label = "Send Join Request";
    btnJoin.textContent = "Send Join Request";
    btnJoin.addEventListener("click", async () => {
      // Guards — prevent duplicate requests
      if (edUserRelation === "attending") { toast("You're already attending this event.", "info"); return; }
      if (edUserRelation === "pending")   { toast("Request already sent.", "info"); return; }
      if (edUserRelation === "rejected")  { toast("Your request was denied by the host.", "error"); return; }

      setLoading(btnJoin, true);
      try {
        const user = await getCurrentUser();
        await requestToJoinEvent(ev.hostUid, ev.id, currentUID, user, {
          eventName: ev.name, hostName: ev.hostName, date: ev.date || null, photoURL: ev.photoURL || null
        });
        edUserRelation = "pending";
        renderEdActions(ev, "pending");
        renderEdHeader(ev);
        toast("Request sent!", "success");
        createNotification(ev.hostUid, "join_request", {
          text:    `${user?.displayName || "Someone"} wants to join "${ev.name}"`,
          eventId: ev.id, fromUid: currentUID
        }).catch(() => {});
      } catch (err) {
        console.error("[Join]", err);
        if (err.message === "ALREADY_GUEST") {
          edUserRelation = "attending";
          renderEdActions(ev, "attending");
          renderEdHeader(ev);
          toast("You're already attending this event.", "info");
        } else if (err.message === "ALREADY_REQUESTED") {
          edUserRelation = "pending";
          renderEdActions(ev, "pending");
          renderEdHeader(ev);
          toast("Request already sent — waiting for approval.", "info");
        } else {
          toast("Could not send request. Try again.", "error");
          setLoading(btnJoin, false);
        }
      }
    });
    row2.appendChild(btnJoin);
  }

  if (row2.children.length) edActions.appendChild(row2);

  // Toggle announcement bar — visible only to host
  const announceBar = $("ed-announce-bar");
  if (announceBar) announceBar.classList.toggle("hidden", relation !== "host");
}

// ── Live Event Stats ─────────────────────────────────────────────────────────
function renderEdStats(guests) {
  const bar = $("ed-stats-bar");
  if (!bar) return;
  const total     = guests.length;
  const checkedIn = guests.filter(g => g.checkedIn).length;
  const rate      = total > 0 ? Math.round((checkedIn / total) * 100) : 0;

  // Build persistent card skeleton once
  if (!bar.dataset.init) {
    bar.dataset.init = "1";
    bar.innerHTML = `
      <div class="ed-stat-card">
        <div class="ed-stat-val" id="ed-stat-total">0</div>
        <div class="ed-stat-lbl">Total Guests</div>
      </div>
      <div class="ed-stat-card ed-stat-em">
        <div class="ed-stat-val" id="ed-stat-checked">0</div>
        <div class="ed-stat-lbl">Checked In</div>
      </div>
      <div class="ed-stat-card">
        <div class="ed-stat-val" id="ed-stat-rate">0%</div>
        <div class="ed-stat-lbl">Attendance</div>
      </div>`;
  }

  animateStatCount($("ed-stat-total"),   total,    false);
  animateStatCount($("ed-stat-checked"), checkedIn, false);
  animateStatCount($("ed-stat-rate"),    rate,      true);
}

function animateStatCount(el, targetVal, isPercent) {
  if (!el) return;
  const suffix     = isPercent ? "%" : "";
  const currentVal = parseInt(el.textContent) || 0;
  if (currentVal === targetVal) return;

  const duration = 380;
  const startMs  = performance.now();

  function step(now) {
    const t     = Math.min((now - startMs) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
    el.textContent = Math.round(currentVal + (targetVal - currentVal) * eased) + suffix;
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ── Close ─────────────────────────────────────────────────────────────────────
function closeEdModal() {
  // Persist last-used tab so reopening the same event restores it
  if (edOpenEventId) edTabMemory.set(edOpenEventId, edActiveTab);
  // Save chat scroll so it can be restored if user returns
  if (edActiveTab === "chat") evcSavedScroll = $("evc-messages")?.scrollTop ?? 0;

  // Animate close (140ms), then truly hide
  const card = $("edc-card");
  card?.classList.add("edc-closing");

  setTimeout(() => {
    card?.classList.remove("edc-closing");
    edModal?.classList.add("hidden");
    card?.classList.remove("chat-mode");
    evcScrollAbort?.abort();
    evcScrollAbort = null;
    edUnsubAll();
    edCurrentEvent = null;
    edLiveGuests   = [];
    edUserRelation = "none";
    edActiveTab    = "overview";
    // Reset stats skeleton so next event starts fresh
    const statsBar = $("ed-stats-bar");
    if (statsBar) { statsBar.innerHTML = ""; delete statsBar.dataset.init; }
    // Reset cover
    $("edc-header-strip")?.classList.remove("has-cover");
    const coverBg = $("edc-cover-bg");
    if (coverBg) { coverBg.style.backgroundImage = ""; coverBg.classList.add("hidden"); }
    if (typeof evcResetDOM === "function") evcResetDOM();
  }, 140);
}

edClose?.addEventListener("click", closeEdModal);
edModal?.addEventListener("click", e => { if (e.target === edModal) closeEdModal(); });

// ── Announcement send button ──────────────────────────────────────────────────
async function sendAnnouncementMsg() {
  const input = $("ed-announce-input");
  const btn   = $("ed-announce-send");
  if (!input || !edCurrentEvent?.id) return;
  const text = input.value.trim();
  if (!text) return;
  if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }
  try {
    const me = getCurrentUser();
    await sendEventAnnouncement(
      edCurrentEvent.id,
      me.uid,
      me.displayName || me.email || "Host",
      me.photoURL    || null,
      text
    );
    input.value = "";
  } catch (err) {
    console.error("[Announce]", err);
    toast("Failed to send announcement.", "error");
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "Send to all"; }
  }
}
$("ed-announce-send")?.addEventListener("click", sendAnnouncementMsg);
$("ed-announce-input")?.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAnnouncementMsg(); }
});

// ═══════════════════════════════════════════════════════════
// DELETE EVENT MODAL
// ═══════════════════════════════════════════════════════════

const modalDeleteEvent  = $("modal-delete-event");
const modalDeleteCancel = $("modal-delete-cancel");
const modalDeleteConfirm= $("modal-delete-confirm");

function openDeleteModal(eventId, eventName) {
  pendingDeleteId = eventId;
  const body = $("modal-delete-event-body");
  if (body) body.textContent = `Delete "${eventName}"? This removes all guests and pending requests.`;
  modalDeleteEvent?.classList.remove("hidden");
}

modalDeleteCancel?.addEventListener("click", () => {
  pendingDeleteId = null;
  modalDeleteEvent?.classList.add("hidden");
});

modalDeleteConfirm?.addEventListener("click", async () => {
  if (!pendingDeleteId) return;
  const id = pendingDeleteId;
  pendingDeleteId = null;
  modalDeleteEvent?.classList.add("hidden");
  setLoading(modalDeleteConfirm, true);
  try {
    if (getActiveEventId() === id) clearActiveEvent();
    await deleteEvent(currentUID, id);
    toast("Event deleted.", "success");
  } catch { toast("Failed to delete event.", "error"); }
  finally { setLoading(modalDeleteConfirm, false); }
});

// ═══════════════════════════════════════════════════════════
// UNIFIED EVENT MODAL  (create + edit)
// ═══════════════════════════════════════════════════════════

const modalEditEvent  = $("modal-edit-event");
const modalEditCancel = $("modal-edit-cancel");
const modalEditSave   = $("modal-edit-save");
const editEventName   = $("edit-event-name");
const editEventDate   = $("edit-event-date");
const editEventLoc    = $("edit-event-location");
const editEventMax    = $("edit-event-max");
const editEventDesc   = $("edit-event-desc");
const editEventPhoto  = $("edit-event-photo");        // file input
const editPhotoPreview = $("edit-event-photo-preview"); // <img> preview
const imgUploadText   = $("img-upload-text");           // label span
const editEventPublic = $("edit-event-public");
const editPrivacyLbl  = $("edit-privacy-label");
const modalTitle      = modalEditEvent?.querySelector(".modal-title");

let editingEventId = null; // null = create mode
let _editPhotoURL  = null; // photoURL of current/saved event
let _editPhotoFile = null; // pending File object to upload

// openEventModal(null)  → create mode
// openEventModal(ev)    → edit mode
function openEventModal(ev) {
  editingEventId = ev ? ev.id : null;

  // Dynamic title + button label
  if (modalTitle)     modalTitle.textContent      = ev ? "Edit Event"    : "New Event";
  if (modalEditSave)  modalEditSave.textContent    = ev ? "Save Changes" : "Create Event";
  if (modalEditSave)  modalEditSave.dataset.label  = ev ? "Save Changes" : "Create Event";

  // Populate fields
  if (editEventName)   editEventName.value   = ev?.name        || "";
  if (editEventLoc)    editEventLoc.value    = ev?.location    || "";
  if (editEventMax)    editEventMax.value    = ev?.maxGuests   || "";
  if (editEventDesc)   editEventDesc.value   = ev?.description || "";
  _editPhotoURL  = ev?.photoURL || null;
  _editPhotoFile = null;
  if (editEventPhoto)  editEventPhoto.value  = "";
  if (editPhotoPreview) {
    if (_editPhotoURL) {
      editPhotoPreview.src = _editPhotoURL;
      editPhotoPreview.classList.remove("hidden");
      if (imgUploadText) imgUploadText.textContent = "Change image";
    } else {
      editPhotoPreview.classList.add("hidden");
      if (imgUploadText) imgUploadText.textContent = "Choose cover image";
    }
  }
  if (editEventPublic) {
    editEventPublic.checked = Boolean(ev?.isPublic);
    if (editPrivacyLbl) editPrivacyLbl.textContent = ev?.isPublic ? "Public" : "Private";
  }

  // Flatpickr
  if (editEventDate) {
    if (editFlatpickr) editFlatpickr.destroy();
    if (typeof flatpickr !== "undefined") {
      editFlatpickr = flatpickr("#edit-event-date", {
        enableTime: true,
        dateFormat: "Y-m-d H:i",
        time_24hr:  true,
        theme:      "dark",
        disableMobile: true,
        defaultDate: ev?.date || null
      });
    } else {
      editEventDate.value = ev?.date || "";
    }
  }

  modalEditEvent?.classList.remove("hidden");
  setTimeout(() => editEventName?.focus(), 60);
}

// Keep old name so existing callers (renderEventsList, btn-edit-event) still work
function openEditModal(ev) { openEventModal(ev); }

editEventPublic?.addEventListener("change", () => {
  if (editPrivacyLbl) editPrivacyLbl.textContent = editEventPublic.checked ? "Public" : "Private";
});

modalEditCancel?.addEventListener("click", () => {
  editingEventId = null;
  _editPhotoFile = null;
  _editPhotoURL  = null;
  modalEditEvent?.classList.add("hidden");
});

// Validate: enable Save only when name is non-empty
editEventName?.addEventListener("input", () => {
  if (modalEditSave) modalEditSave.disabled = !editEventName.value.trim();
});

// File input: show preview + store pending file
editEventPhoto?.addEventListener("change", () => {
  const file = editEventPhoto.files?.[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    toast("Image must be under 5 MB.", "error");
    editEventPhoto.value = "";
    return;
  }
  if (!file.type.startsWith("image/")) {
    toast("Please select an image file.", "error");
    editEventPhoto.value = "";
    return;
  }
  _editPhotoFile = file;
  const reader = new FileReader();
  reader.onload = e => {
    if (editPhotoPreview) {
      editPhotoPreview.src = e.target.result;
      editPhotoPreview.classList.remove("hidden");
    }
    if (imgUploadText) imgUploadText.textContent = "Change image";
  };
  reader.readAsDataURL(file);
});

modalEditSave?.addEventListener("click", async () => {
  const name = editEventName?.value.trim();
  if (!name) { toast("Event name is required.", "error"); return; }

  setLoading(modalEditSave, true);
  try {
    const date     = editEventDate?.value?.trim()    || null;
    const location = editEventLoc?.value?.trim()     || null;
    const maxG     = editEventMax?.value             ? Number(editEventMax.value) : null;
    const desc     = editEventDesc?.value?.trim()    || null;
    const isPublic = editEventPublic?.checked        || false;

    // Upload new image if file was selected
    let photo = _editPhotoURL;
    if (_editPhotoFile) {
      const ext  = _editPhotoFile.name.split(".").pop() || "jpg";
      const path = `events/${currentUID}_${Date.now()}.${ext}`;
      const snap = await uploadBytes(storageRef(storage, path), _editPhotoFile);
      photo = await getDownloadURL(snap.ref);
      _editPhotoURL  = photo;
      _editPhotoFile = null;
    }

    if (editingEventId) {
      // ── EDIT MODE ──
      const updates = { name, isPublic, photoURL: photo };
      if (date)     updates.date        = date;
      if (location) updates.location    = location;
      if (maxG)     updates.maxGuests   = maxG;
      if (desc)     updates.description = desc;

      await updateEvent(currentUID, editingEventId, updates);
      toast("Event updated!", "success");
    } else {
      // ── CREATE MODE ──
      const hostName = getCurrentUser()?.displayName || "";
      await createEvent(currentUID, name, date || "", desc || "", isPublic, hostName, location, maxG, photo);
      toast(`"${name}" created!`, "success");
    }

    modalEditEvent?.classList.add("hidden");
    editingEventId = null;
  } catch (e) {
    console.error("[Event modal]", e);
    toast(editingEventId ? "Failed to update event." : "Failed to create event.", "error");
  } finally {
    setLoading(modalEditSave, false);
  }
});

// Enter key in name field submits
editEventName?.addEventListener("keydown", e => { if (e.key === "Enter") modalEditSave?.click(); });

// Keyboard close for modals
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    closeEdModal();
    modalDeleteEvent?.classList.add("hidden");
    modalEditEvent?.classList.add("hidden");
    closeInviteModal();
    notifPanel?.classList.add("hidden");
    notifPanelOpen = false;
    pendingDeleteId = null;
    editingEventId  = null;
    _editPhotoFile  = null;
    _editPhotoURL   = null;
  }
});

// ═══════════════════════════════════════════════════════════
// EVENT HEADER BUTTONS (edit, delete, invite link, invite friends)
// ═══════════════════════════════════════════════════════════

$("btn-edit-event")?.addEventListener("click", () => {
  const ev = getActiveEventData();
  if (ev) openEditModal({ id: getActiveEventId(), ...ev });
  else toast("Select an event first.", "error");
});

$("btn-delete-event")?.addEventListener("click", () => {
  const id = getActiveEventId();
  const ev = getActiveEventData();
  if (id) openDeleteModal(id, ev?.name || "this event");
  else toast("Select an event first.", "error");
});

$("btn-open-chat")?.addEventListener("click", () => {
  const id = getActiveEventId();
  if (!id) { toast("Select an event first.", "error"); return; }
  const ev = getActiveEventData() ?? { id, name: $("event-header-name")?.textContent || "Event", hostUid: currentUID };
  openEventChat(ev.id, ev.name, ev.hostUid || currentUID);
});

$("btn-invite-link")?.addEventListener("click", async () => {
  const id = getActiveEventId();
  if (!id) { toast("Select an event first.", "error"); return; }
  const btn = $("btn-invite-link");
  setLoading(btn, true);
  try {
    const token = await getOrCreateInviteToken(currentUID, id);
    const link  = `${location.origin}${location.pathname}?invite=${id}&token=${token}`;
    await navigator.clipboard.writeText(link);
    toast("Invite link copied!", "success");
  } catch { toast("Could not generate invite link.", "error"); }
  finally { setLoading(btn, false); }
});

$("btn-invite-friends")?.addEventListener("click", () => {
  const id = getActiveEventId();
  if (!id) { toast("Select an event first.", "error"); return; }
  openInviteFriendsModal();
});

// ═══════════════════════════════════════════════════════════
// INVITE FRIENDS MODAL
// ═══════════════════════════════════════════════════════════

const modalInviteFriends = $("modal-invite-friends");
const inviteFriendsList  = $("invite-friends-list");
const inviteFriendSearch = $("invite-friend-search");
const modalInviteCancel  = $("modal-invite-cancel");
const modalInviteSend    = $("modal-invite-send");

let inviteModalUnsub    = null;   // Firestore listener for invite modal
let allFriendsForInvite = [];     // source of truth while modal is open

function openInviteFriendsModal() {
  // Reset state
  selectedInviteFriends.clear();
  allFriendsForInvite = [];
  if (inviteFriendSearch) inviteFriendSearch.value = "";
  if (inviteFriendsList)  inviteFriendsList.innerHTML = `<div class="friends-empty"><span class="spinner"></span> Loading…</div>`;
  modalInviteFriends?.classList.remove("hidden");

  // Cancel any previous listener
  if (inviteModalUnsub) { inviteModalUnsub(); inviteModalUnsub = null; }

  console.log("[Invite] UID:", currentUID);

  // Fresh real-time listener — fires immediately with current data
  inviteModalUnsub = listenToFriends(currentUID, friends => {
    console.log("[Invite] Loaded friends:", friends.length, friends.map(f => f.displayName));
    allFriendsForInvite = friends;
    // Re-apply current search filter so typing + data-arriving stay in sync
    const q = inviteFriendSearch?.value.toLowerCase().trim() || "";
    renderInviteFriendsList(q ? allFriendsForInvite.filter(f => (f.displayName || "").toLowerCase().includes(q)) : allFriendsForInvite);
  });
}

function renderInviteFriendsList(friends) {
  if (!inviteFriendsList) return;

  if (!friends.length) {
    inviteFriendsList.innerHTML = `<div class="friends-empty">${
      allFriendsForInvite.length === 0 ? "No friends yet. Add friends first." : "No friends match your search."
    }</div>`;
    return;
  }

  inviteFriendsList.innerHTML = "";
  friends.forEach(f => {
    const fid      = f.uid || f.id;
    const name     = f.displayName || "User";
    const initials = name[0].toUpperCase();
    const avHtml   = f.photoURL
      ? `<img src="${escHtml(f.photoURL)}" alt="${escHtml(initials)}"/>`
      : initials;
    const selected = selectedInviteFriends.has(fid);

    const item = document.createElement("div");
    item.className = `invite-friend-item${selected ? " selected" : ""}`;
    item.innerHTML = `
      <div class="invite-friend-av">${avHtml}</div>
      <div class="invite-friend-name">${escHtml(name)}</div>
      <div class="invite-friend-check">${selected ? "✓" : ""}</div>`;

    item.addEventListener("click", () => {
      if (selectedInviteFriends.has(fid)) selectedInviteFriends.delete(fid);
      else selectedInviteFriends.add(fid);
      // Re-render same slice so selection state updates without full reload
      const q = inviteFriendSearch?.value.toLowerCase().trim() || "";
      renderInviteFriendsList(q ? allFriendsForInvite.filter(f2 => (f2.displayName || "").toLowerCase().includes(q)) : allFriendsForInvite);
    });
    inviteFriendsList.appendChild(item);
  });
}

inviteFriendSearch?.addEventListener("input", () => {
  clearTimeout(friendsSearchTimer);
  friendsSearchTimer = setTimeout(() => {
    const q = inviteFriendSearch.value.toLowerCase().trim();
    const filtered = q
      ? allFriendsForInvite.filter(f => (f.displayName || "").toLowerCase().includes(q))
      : allFriendsForInvite;
    renderInviteFriendsList(filtered);
  }, 300);
});

function closeInviteModal() {
  selectedInviteFriends.clear();
  if (inviteModalUnsub) { inviteModalUnsub(); inviteModalUnsub = null; }
  allFriendsForInvite = [];
  modalInviteFriends?.classList.add("hidden");
}

modalInviteCancel?.addEventListener("click", closeInviteModal);

modalInviteSend?.addEventListener("click", async () => {
  const ids = [...selectedInviteFriends];
  if (!ids.length) { toast("Select at least one friend.", "error"); return; }
  const ev = getActiveEventData();
  if (!ev) { toast("Select an event first.", "error"); return; }

  setLoading(modalInviteSend, true);
  try {
    await Promise.all(ids.map(async fid => {
      await sendEventInvite(currentUID, fid, getActiveEventId(), ev.name);
      await createNotification(fid, "event_invite", {
        text:    `You were invited to "${ev.name}"`,
        eventId: getActiveEventId(),
        fromUid: currentUID
      });
    }));
    toast(`Invite sent to ${ids.length} friend${ids.length > 1 ? "s" : ""}!`, "success");
    closeInviteModal();
  } catch (err) {
    console.error("[Invite send]", err);
    toast("Failed to send invites.", "error");
  } finally {
    setLoading(modalInviteSend, false);
  }
});

// ═══════════════════════════════════════════════════════════════════
// UX ENHANCEMENTS — Drag scroll, Swipe navigation, Onboarding
// ═══════════════════════════════════════════════════════════════════

let _uxInitialized = false;

function initUX() {
  // Mobile back button: close chat and return to friends list
  $("chat-back-btn")?.addEventListener("click", () => closeChat());
  if (_uxInitialized) return;
  _uxInitialized = true;

  initDragScroll();
  initSwipeNav();
  initMobileNavTaps();
  // Set initial indicator position after layout has painted
  requestAnimationFrame(() => moveMobileNavIndicator());
  maybeStartOnboarding();
}

// ── Drag-to-scroll (horizontal lists) ──────────────────────────────
function makeDraggable(el) {
  if (!el || el._draggable) return;
  el._draggable = true;
  el.classList.add("drag-scroll");

  let isDown = false, startX = 0, scrollLeft = 0;

  el.addEventListener("mousedown", e => {
    isDown    = true;
    startX    = e.pageX - el.offsetLeft;
    scrollLeft = el.scrollLeft;
    el.classList.add("dragging");
  });
  el.addEventListener("mousemove", e => {
    if (!isDown) return;
    e.preventDefault();
    const walk = (e.pageX - el.offsetLeft - startX) * 1.4;
    el.scrollLeft = scrollLeft - walk;
  });
  const endDrag = () => { isDown = false; el.classList.remove("dragging"); };
  el.addEventListener("mouseup",    endDrag);
  el.addEventListener("mouseleave", endDrag);
}

function initDragScroll() {
  // Horizontal nav on mobile
  const nav = document.querySelector(".app-nav");
  if (nav) makeDraggable(nav);
  // Events sidebar list
  const evList = document.querySelector(".events-list");
  if (evList) makeDraggable(evList);
}

// ── Swipe navigation (touch, mobile) ────────────────────────────────
const PANEL_ORDER = ["events", "explore", "friends", "activity", "stats", "profile"];

// ── Mobile nav indicator position ────────────────────────────
function moveMobileNavIndicator() {
  if (window.innerWidth > 768) return;
  const indicator = document.getElementById("mbn-indicator");
  const activeBtn = document.querySelector(".mbn-item.active");
  if (!indicator || !activeBtn) return;

  const nav   = activeBtn.closest(".mobile-bottom-nav");
  const navRect = nav.getBoundingClientRect();
  const btnRect = activeBtn.getBoundingClientRect();

  const indicatorW = 28;
  const x = (btnRect.left - navRect.left) + (btnRect.width - indicatorW) / 2;
  indicator.style.transform = `translateX(${x}px)`;
  indicator.classList.add("visible");
}

// ── Swipe navigation (upgraded) ───────────────────────────────
function initSwipeNav() {
  if (window.innerWidth > 768) return;

  let touchStartX = 0, touchStartY = 0, touchStartTime = 0;
  const SWIPE_THRESHOLD = 85; // px
  const SWIPE_RATIO     = 1.4; // horizontal must dominate vertical by this ratio

  // Panel-level swipe for switching tabs and closing chat
  document.addEventListener("touchstart", e => {
    touchStartX    = e.touches[0].clientX;
    touchStartY    = e.touches[0].clientY;
    touchStartTime = Date.now();
  }, { passive: true });

  document.addEventListener("touchend", e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    const dt = Date.now() - touchStartTime;
    if (dt > 400) return; // too slow

    const absDx = Math.abs(dx), absDy = Math.abs(dy);
    if (absDx < SWIPE_THRESHOLD || absDx < absDy * SWIPE_RATIO) return;

    // Swipe right → close chat if open
    if (dx > 0 && document.querySelector(".chat-area.mobile-chat-open")) {
      closeChat();
      return;
    }

    // Swipe down → close active modal
    if (dy > 0 && absDy > SWIPE_THRESHOLD && absDy > absDx) {
      const edModalEl = document.getElementById("modal-event-details");
      if (edModalEl && !edModalEl.classList.contains("hidden")) { closeEdModal(); return; }
      return;
    }

    // Swipe left/right → switch panels (not when chat is open)
    if (document.querySelector(".chat-area.mobile-chat-open")) return;

    const activePanel = document.querySelector(".app-panel:not(.hidden):not(.panel-exiting)");
    if (!activePanel) return;
    const cur  = activePanel.id.replace("panel-", "");
    const idx  = PANEL_ORDER.indexOf(cur);
    if (idx === -1) return;

    const nextIdx = dx < 0 ? idx + 1 : idx - 1;
    if (nextIdx >= 0 && nextIdx < PANEL_ORDER.length) {
      activatePanel(PANEL_ORDER[nextIdx]);
    }
  }, { passive: true });
}

// ── Bottom nav tap animation ──────────────────────────────────
function initMobileNavTaps() {
  document.querySelectorAll(".mbn-item").forEach(btn => {
    btn.addEventListener("touchstart", () => {
      btn.classList.remove("tapping");
      void btn.offsetWidth; // reflow
      btn.classList.add("tapping");
    }, { passive: true });
    btn.addEventListener("animationend", () => btn.classList.remove("tapping"), { passive: true });
  });
}

// ── Onboarding (3-step modal) ────────────────────────────────────────
const ONBOARDING_KEY = "sgla_onboarding_v1";
const ONBOARD_STEPS  = [
  {
    emoji: "🎉",
    title: "Welcome to Smart Guest List!",
    body:  "Organize events, invite friends, and track your guests — all in one place.",
    btn:   "Get Started"
  },
  {
    emoji: "📅",
    title: "Create Your First Event",
    body:  "Tap \"+ New Event\" to create a party, meetup, or any gathering. Add a cover photo to make it stand out.",
    btn:   "Next"
  },
  {
    emoji: "💬",
    title: "Chat & Invite Friends",
    body:  "Every event has its own chat. Invite friends, track who's coming, and send announcements in real time.",
    btn:   "Let's go!"
  }
];

function maybeStartOnboarding() {
  if (localStorage.getItem(ONBOARDING_KEY)) return;
  // Slight delay so the app renders first
  setTimeout(startOnboarding, 600);
}

function startOnboarding() {
  let step = 0;

  const overlay = document.createElement("div");
  overlay.className = "onb-overlay";

  const card = document.createElement("div");
  card.className = "onb-card";
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  function render() {
    const s = ONBOARD_STEPS[step];
    const total = ONBOARD_STEPS.length;
    const pct   = ((step + 1) / total * 100).toFixed(1);
    const dots  = ONBOARD_STEPS.map((_, i) =>
      `<div class="onb-dot${i === step ? " active" : ""}"></div>`).join("");

    card.innerHTML = `
      <div class="onb-step-dots">${dots}</div>
      <div class="onb-emoji">${s.emoji}</div>
      <div class="onb-title">${s.title}</div>
      <div class="onb-body">${s.body}</div>
      <div class="onb-actions">
        ${step < total - 1
          ? `<button class="onb-btn-skip">Skip</button>`
          : ""}
        <button class="onb-btn-next">${s.btn}</button>
      </div>
      <div class="onb-progress" style="width:${pct}%"></div>`;

    card.querySelector(".onb-btn-next").addEventListener("click", () => {
      if (step < total - 1) {
        step++;
        // Re-trigger animation
        card.style.animation = "none";
        card.offsetHeight;
        card.style.animation = "";
        render();
      } else {
        finishOnboarding();
      }
    });

    card.querySelector(".onb-btn-skip")?.addEventListener("click", finishOnboarding);
  }

  function finishOnboarding() {
    localStorage.setItem(ONBOARDING_KEY, "true");
    overlay.style.transition = "opacity 0.25s ease";
    overlay.style.opacity    = "0";
    setTimeout(() => overlay.remove(), 260);
  }

  render();

  // ESC closes onboarding
  const onKey = e => {
    if (e.key === "Escape") { finishOnboarding(); document.removeEventListener("keydown", onKey); }
  };
  document.addEventListener("keydown", onKey);
}

/* ══════════════════════════════════════════════════════
   CHAT IMMERSIVE BACKGROUND
   Handles: scroll parallax, touch-move reaction,
            message glow pulse, orb burst on send.
══════════════════════════════════════════════════════ */

function getOrbs(messagesEl) {
  return Array.from(
    (messagesEl?.closest(".chat-area, [id='edc-panel-chat'], .edc-tab-panel")
      ?? messagesEl?.parentElement)
    ?.querySelectorAll(".chat-bg .chat-orb, .chat-bg .chat-blob") ?? []
  );
}

/* Scroll parallax — shifts orbs at different speeds */
function attachScrollParallax(messagesEl) {
  const orbs = getOrbs(messagesEl);
  if (!orbs.length) return;

  let ticking = false;
  messagesEl.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const sy = messagesEl.scrollTop;
      orbs.forEach((orb, i) => {
        const speed = 0.05 + i * 0.03;
        const dir   = i % 2 === 0 ? 1 : -1;
        orb.style.transform = `translateY(${sy * speed * dir}px)`;
      });
      ticking = false;
    });
  }, { passive: true });
}

/* Touch parallax — orbs drift with finger position */
function attachTouchParallax(containerEl, messagesEl) {
  const orbs = getOrbs(messagesEl);
  if (!orbs.length) return;

  let touching = false;
  containerEl.addEventListener("touchmove", (e) => {
    if (!touching) return;
    const x = e.touches[0].clientX;
    const y = e.touches[0].clientY;
    orbs.forEach((orb, i) => {
      const ox = (x - window.innerWidth  / 2) * 0.015 * (i + 1);
      const oy = (y - window.innerHeight / 2) * 0.020 * (i + 1);
      orb.style.transform = `translate(${ox}px, ${oy}px)`;
    });
  }, { passive: true });

  containerEl.addEventListener("touchstart", () => { touching = true;  }, { passive: true });
  containerEl.addEventListener("touchend",   () => { touching = false; }, { passive: true });
}

/* Glow pulse on a single bubble element */
function triggerMessageGlow(bubbleEl) {
  if (!bubbleEl) return;
  bubbleEl.classList.add("glow");
  setTimeout(() => bubbleEl.classList.remove("glow"), 650);
}

/* Orb burst: tiny scale pop when a message is sent */
function triggerOrbBurst(orbs) {
  orbs.forEach(orb => {
    orb.style.transition = "transform 0.25s cubic-bezier(0.22,1,0.36,1)";
    const cur = orb.style.transform || "";
    orb.style.transform = cur + " scale(1.06)";
    setTimeout(() => {
      orb.style.transform = cur;
      setTimeout(() => { orb.style.transition = ""; }, 260);
    }, 260);
  });
}

/* MutationObserver: auto-trigger glow + burst on new mine messages */
function watchNewMessages(messagesEl) {
  const orbs = getOrbs(messagesEl);
  const observer = new MutationObserver(mutations => {
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (!(node instanceof Element)) return;
        const isMine = node.classList.contains("mine") || !!node.closest(".mine");
        if (!isMine) return;
        const bubble = node.classList.contains("chat-msg-bubble")
          ? node
          : node.querySelector(".chat-msg-bubble");
        if (bubble) triggerMessageGlow(bubble);
        if (orbs.length) triggerOrbBurst(orbs);
      });
    });
  });
  observer.observe(messagesEl, { childList: true, subtree: true });
}

/* Wire everything to a messages container */
function initChatBackground(messagesEl, containerEl) {
  if (!messagesEl) return;
  const wrap = containerEl ?? messagesEl.closest(".chat-area, .edc-tab-panel") ?? messagesEl.parentElement;
  attachScrollParallax(messagesEl);
  attachTouchParallax(wrap ?? messagesEl, messagesEl);
  watchNewMessages(messagesEl);
}

/* Boot on DOM ready */
document.addEventListener("DOMContentLoaded", () => {
  const evcMessages  = document.getElementById("evc-messages");
  const chatMessages = document.getElementById("chat-messages");
  initChatBackground(evcMessages,  document.getElementById("edc-panel-chat"));
  initChatBackground(chatMessages, document.querySelector(".chat-area"));
});
// FIX CHAT VIEW SWITCH (FINAL)

function openChatUI() {
  const empty = document.getElementById('chat-no-selection');
  const chat = document.getElementById('chat-window');

  if (empty) empty.style.display = 'none';
  if (chat) chat.classList.remove('hidden');
}

function closeChatUI() {
  const empty = document.getElementById('chat-no-selection');
  const chat = document.getElementById('chat-window');

  if (empty) empty.style.display = 'flex';
  if (chat) chat.classList.add('hidden');
}