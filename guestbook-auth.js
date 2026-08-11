import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const $ = id => document.getElementById(id);
const configured = !Object.values(firebaseConfig).some(v => String(v).startsWith("YOUR_"));

const signedOut = $("guest-signed-out");
const signedIn = $("guest-signed-in");
const loginButton = $("google-login");
const logoutButton = $("google-logout");
const authStatus = $("auth-status");
const form = $("guestbook-form");
const status = $("guestbook-status");
const list = $("guestbook-list");

let auth, db, currentUser = null;

function render(messages) {
  list.innerHTML = "";
  if (!messages.length) {
    list.innerHTML = '<p class="empty-state">No messages yet. Be the first to sign the guestbook.</p>';
    return;
  }
  messages.forEach(item => {
    const card = document.createElement("article");
    card.className = "guestbook-entry";

    const top = document.createElement("div");
    top.style.cssText = "display:flex;align-items:center;gap:12px";

    if (item.photoURL) {
      const img = document.createElement("img");
      img.src = item.photoURL;
      img.alt = "";
      img.referrerPolicy = "no-referrer";
      img.style.cssText = "width:36px;height:36px;border-radius:50%;object-fit:cover";
      top.appendChild(img);
    }

    const identity = document.createElement("div");
    const name = document.createElement("h3");
    name.textContent = item.displayName || "Anonymous";
    const time = document.createElement("time");
    time.dateTime = item.createdAt || "";
    time.textContent = item.createdAt
      ? new Date(item.createdAt).toLocaleString(undefined, {year:"numeric",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})
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
    const q = query(collection(db, "guestbook"), orderBy("createdAt", "desc"), limit(100));
    const snap = await getDocs(q);
    render(snap.docs.map(d => {
      const x = d.data();
      return {
        displayName: x.displayName,
        photoURL: x.photoURL,
        message: x.message,
        createdAt: x.createdAt?.toDate?.()?.toISOString() || ""
      };
    }));
  } catch (e) {
    console.error(e);
    list.innerHTML = '<p class="empty-state">Could not load messages. Check your Firestore rules/setup.</p>';
  }
}

function updateUser(user) {
  currentUser = user;
  signedOut.classList.toggle("hidden", !!user);
  signedIn.classList.toggle("hidden", !user);
  if (user) {
    $("guest-user-name").textContent = user.displayName || "Google user";
    $("guest-user-email").textContent = user.email || "";
    const avatar = $("guest-avatar");
    if (user.photoURL) {
      avatar.src = user.photoURL;
      avatar.alt = `${user.displayName || "User"} profile photo`;
      avatar.classList.remove("hidden");
    } else {
      avatar.classList.add("hidden");
    }
  }
}

async function login() {
  if (!configured) {
    authStatus.className = "form-status error";
    authStatus.textContent = "Add your Firebase Web App config to firebase-config.js first.";
    return;
  }
  loginButton.disabled = true;
  authStatus.textContent = "Opening Google login...";
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({prompt:"select_account"});
    await signInWithPopup(auth, provider);
    authStatus.textContent = "";
  } catch (e) {
    console.error(e);
    authStatus.className = "form-status error";
    authStatus.textContent = e.code === "auth/popup-closed-by-user"
      ? "Google login was cancelled."
      : "Google login failed. Check Firebase Authentication.";
  } finally {
    loginButton.disabled = false;
  }
}

async function submitMessage(event) {
  event.preventDefault();
  if (!currentUser) {
    status.className = "form-status error";
    status.textContent = "Please sign in with Google first.";
    return;
  }

  const message = $("guest-message").value.trim();
  if (message.length < 2 || message.length > 500) {
    status.className = "form-status error";
    status.textContent = "Message must be between 2 and 500 characters.";
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
      message,
      createdAt: serverTimestamp()
    });
    form.reset();
    status.className = "form-status success";
    status.textContent = "Your message is now visible.";
    await loadMessages();
  } catch (e) {
    console.error(e);
    status.className = "form-status error";
    status.textContent = "Could not publish. Check Firestore rules.";
  } finally {
    button.disabled = false;
  }
}

if (!configured) {
  authStatus.className = "form-status error";
  authStatus.textContent = "Google login needs Firebase configuration.";
  list.innerHTML = '<p class="empty-state">Configure Firebase to enable the shared guestbook.</p>';
} else {
  try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    onAuthStateChanged(auth, async user => {
      updateUser(user);
      await loadMessages();
    });
  } catch (e) {
    console.error(e);
    authStatus.className = "form-status error";
    authStatus.textContent = "Firebase could not be initialized.";
  }
}

loginButton?.addEventListener("click", login);
logoutButton?.addEventListener("click", () => signOut(auth));
form?.addEventListener("submit", submitMessage);
