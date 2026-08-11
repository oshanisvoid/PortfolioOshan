import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import { firebaseConfig } from "./firebase-config.js";

const $ = (id) => document.getElementById(id);

const configured =
  firebaseConfig &&
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId;

const signedOut = $("guest-signed-out");
const signedIn = $("guest-signed-in");
const loginButton = $("google-login");
const logoutButton = $("google-logout");
const authStatus = $("auth-status");
const form = $("guestbook-form");
const status = $("guestbook-status");
const list = $("guestbook-list");

let auth = null;
let db = null;
let currentUser = null;

function render(messages) {
  list.innerHTML = "";

  if (!messages.length) {
    list.innerHTML = `
      <p class="empty-state">
        No messages yet. Be the first to sign the guestbook.
      </p>
    `;
    return;
  }

  messages.forEach((item) => {
    const card = document.createElement("article");
    card.className = "guestbook-entry";

    const top = document.createElement("div");

    top.style.cssText =
      "display:flex;align-items:center;gap:12px;margin-bottom:12px;";

    if (item.photoURL) {
      const img = document.createElement("img");

      img.src = item.photoURL;
      img.alt = "";
      img.referrerPolicy = "no-referrer";

      img.style.cssText =
        "width:36px;height:36px;border-radius:50%;object-fit:cover;";

      top.appendChild(img);
    }

    const identity = document.createElement("div");

    const name = document.createElement("h3");
    name.textContent = item.displayName || "Anonymous";

    const time = document.createElement("time");

    time.dateTime = item.createdAt || "";

    time.textContent = item.createdAt
      ? new Date(item.createdAt).toLocaleString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit"
        })
      : "Just now";

    identity.append(name, time);
    top.appendChild(identity);

    const message = document.createElement("p");
    message.textContent = item.message;

    card.append(top, message);

    list.appendChild(card);
  });
}

async function loadMessages() {
  if (!db) return;

  try {
    const q = query(
      collection(db, "guestbook"),
      orderBy("createdAt", "desc"),
      limit(100)
    );

    const snap = await getDocs(q);

    const messages = snap.docs.map((doc) => {
      const data = doc.data();

      return {
        displayName: data.displayName || "Anonymous",
        photoURL: data.photoURL || "",
        message: data.message || "",
        createdAt:
          data.createdAt?.toDate?.()?.toISOString() || ""
      };
    });

    render(messages);
  } catch (error) {
    console.error("Firestore error:", error);

    list.innerHTML = `
      <p class="empty-state">
        Could not load guestbook messages.
      </p>
    `;
  }
}

function updateUser(user) {
  currentUser = user;

  signedOut.classList.toggle("hidden", !!user);
  signedIn.classList.toggle("hidden", !user);

  if (!user) {
    return;
  }

  const name = $("guest-user-name");
  const email = $("guest-user-email");
  const avatar = $("guest-avatar");

  name.textContent = user.displayName || "Google User";
  email.textContent = user.email || "";

  if (user.photoURL) {
    avatar.src = user.photoURL;
    avatar.alt = `${user.displayName || "User"} profile photo`;
    avatar.classList.remove("hidden");
  } else {
    avatar.classList.add("hidden");
  }
}

async function login() {
  if (!auth) {
    authStatus.className = "form-status error";
    authStatus.textContent =
      "Firebase Authentication is not configured.";
    return;
  }

  loginButton.disabled = true;

  authStatus.className = "form-status";
  authStatus.textContent = "Opening Google login...";

  try {
    const provider = new GoogleAuthProvider();

    provider.setCustomParameters({
      prompt: "select_account"
    });

    await signInWithPopup(auth, provider);

    authStatus.className = "form-status success";
    authStatus.textContent = "Signed in successfully.";
  } catch (error) {
    console.error("Google login error:", error);

    authStatus.className = "form-status error";

    if (error.code === "auth/popup-closed-by-user") {
      authStatus.textContent = "Google login was cancelled.";
    } else if (error.code === "auth/popup-blocked") {
      authStatus.textContent =
        "Your browser blocked the Google login popup. Please allow popups for this site.";
    } else if (error.code === "auth/unauthorized-domain") {
      authStatus.textContent =
        "This website domain is not authorized in Firebase.";
    } else {
      authStatus.textContent =
        `Google login failed: ${error.code || "Unknown error"}`;
    }
  } finally {
    loginButton.disabled = false;
  }
}

async function submitMessage(event) {
  event.preventDefault();

  if (!currentUser) {
    status.className = "form-status error";
    status.textContent =
      "Please sign in with Google first.";
    return;
  }

  const messageInput = $("guest-message");
  const message = messageInput.value.trim();

  if (message.length < 2 || message.length > 500) {
    status.className = "form-status error";
    status.textContent =
      "Message must be between 2 and 500 characters.";
    return;
  }

  const button = $("guestbook-submit");

  button.disabled = true;

  status.className = "form-status";
  status.textContent = "Publishing...";

  try {
    await addDoc(collection(db, "guestbook"), {
      uid: currentUser.uid,
      displayName: currentUser.displayName || "Anonymous",
      photoURL: currentUser.photoURL || "",
      message: message,
      createdAt: serverTimestamp()
    });

    form.reset();

    status.className = "form-status success";
    status.textContent =
      "Your message is now visible.";

    await loadMessages();
  } catch (error) {
    console.error("Guestbook publish error:", error);

    status.className = "form-status error";
    status.textContent =
      "Could not publish your message. Check Firestore permissions.";
  } finally {
    button.disabled = false;
  }
}


/* --------------------------------
   FIREBASE INITIALIZATION
-------------------------------- */

if (!configured) {
  authStatus.className = "form-status error";

  authStatus.textContent =
    "Firebase configuration is missing.";

  list.innerHTML = `
    <p class="empty-state">
      Firebase is not configured.
    </p>
  `;
} else {
  try {
    const app = initializeApp(firebaseConfig);

    auth = getAuth(app);
    db = getFirestore(app);

    onAuthStateChanged(auth, async (user) => {
      updateUser(user);
      await loadMessages();
    });

  } catch (error) {
    console.error("Firebase initialization error:", error);

    authStatus.className = "form-status error";

    authStatus.textContent =
      "Firebase could not be initialized.";

    list.innerHTML = `
      <p class="empty-state">
        Firebase initialization failed.
      </p>
    `;
  }
}


/* --------------------------------
   EVENTS
-------------------------------- */

loginButton?.addEventListener("click", login);

logoutButton?.addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout error:", error);
  }
});

form?.addEventListener("submit", submitMessage);