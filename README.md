[README.md](https://github.com/user-attachments/files/26258977/README.md)
![Preview](https://github.com/user-attachments/assets/ffead8e9-8dc8-4286-bf9f-08f95ef141e4)

# 🚀 Smart Guest List — Real-Time Event Management Platform

A production-style, real-time web application for managing events, guests, and social interactions — built with a modular architecture and Firebase backend.

👉 **Live Demo:** https://guest-list-app-bba28.web.app

---

## 🧠 Overview

Smart Guest List is a scalable, real-time web application optimized for both **desktop and mobile devices**, allowing users to:

* Create and manage events
* Handle guest lists with real-time check-in tracking
* Communicate via live chat
* Manage friendships and invitations
* Monitor live activity and presence

This project demonstrates strong fundamentals in **frontend architecture**, **real-time systems**, and **full-stack integration using Firebase**.

---

## ✨ Core Features

### 🔐 Authentication System

* Email & Password
* Google OAuth
* Phone authentication (OTP + reCAPTCHA)
* Account linking (multi-provider)

### 📅 Event Management

* Create / edit / delete events
* Public & private events
* Join request system
* Event invitations

### 👥 Guest System

* Add and manage guests
* Tagging system (VIP, Staff, Friend)
* Real-time check-in tracking

### 💬 Real-Time Chat

* 1-on-1 messaging
* Event group chat
* Message status (delivered / seen)
* Typing indicators

### 🤝 Social Features

* Friend system
* Friend requests
* User search

### 🔔 Notifications

* Real-time updates
* Event invitations
* Friend requests

### 🟢 Presence System

* Online/offline detection
* Last seen tracking

### 📊 Analytics Dashboard

* Event statistics
* Guest metrics
* Check-in rate

---

## 📱 Mobile Experience

* Fully responsive UI optimized for mobile devices
* Touch-friendly interactions and navigation
* Adaptive layouts for smaller screens
* Seamless experience across desktop and mobile

The application is designed to feel like a lightweight mobile app when used on smartphones.

---

## 🏗 Architecture

The application follows a **modular, scalable architecture** with clear separation of concerns:

```
/js
  auth.js        # Authentication logic
  events.js      # Event management
  guests.js      # Guest system
  chat.js        # Messaging system
  profile.js     # User profiles
  stats.js       # Analytics
  presence.js    # Online tracking
```

### Key Design Decisions

* 🔹 Real-time data flow using Firestore listeners
* 🔹 Decoupled modules for scalability
* 🔹 State-driven UI updates
* 🔹 SPA architecture (no heavy frameworks)

---

## ⚡ Tech Stack

### Frontend

* Vanilla JavaScript (ES Modules)
* HTML5 / CSS3

### Backend (BaaS)

* Firebase Authentication
* Firestore (real-time database)
* Firebase Storage

### Other

* Flatpickr (date picker)
* Custom UI system

---

## 🔄 Real-Time Architecture

This project is built around **event-driven updates**:

* Firestore `onSnapshot()` listeners
* Live synchronization across users
* Presence heartbeat system (interval-based updates)

---

## 🧪 Challenges & Solutions

### 🔥 Real-Time Consistency

**Challenge:** Keeping UI synced across multiple users
**Solution:** Firestore listeners + optimistic UI updates

### 🔐 Multi-Provider Auth

**Challenge:** Linking multiple auth providers
**Solution:** Firebase account linking APIs

### 💬 Chat System Design

**Challenge:** Scalable chat architecture
**Solution:**

* Deterministic chat IDs
* Subcollections for messages
* Metadata-based message previews

---

## 📸 Screenshots

<img width="2560" src="https://github.com/user-attachments/assets/86c6d6ea-a03e-4c2a-8e2e-da5a34daf9fb" />
<img width="2560" src="https://github.com/user-attachments/assets/50404a9a-c93d-4873-b352-38d4f76e2ad6" />
<img width="2560" src="https://github.com/user-attachments/assets/9cad8a95-b01f-48af-b1ed-bfc3418d72d2" />
<img width="2560" src="https://github.com/user-attachments/assets/5773e3fb-a8eb-4d86-98db-94896b56a486" />
<img width="2560" src="https://github.com/user-attachments/assets/d0ef9c41-00e8-47c1-a92a-c6856e2780c7" />

---

## ⚙️ Local Setup

```bash
git clone https://github.com/your-username/guest-list-app.git
cd guest-list-app
npx serve .
```

---

## 🚀 Future Improvements

* Mobile app (Flutter)
* Backend migration (Node.js / FastAPI)
* Role-based permissions
* QR-based guest check-in
* Offline support

---

## 👨‍💻 Author

**Valentyn**

* Full-stack oriented developer
* Focused on real-time systems & modern UX

---

## 📌 Why This Project Matters

This project demonstrates:

* Real-time application architecture
* Modular and scalable frontend design
* Multi-provider authentication flows
* Cross-device UX (desktop + mobile)
* Production-level thinking

---

⭐ If you like this project, feel free to star the repo!
