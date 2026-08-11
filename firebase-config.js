// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDRHmvYcFb6jzPAWrtK6udMZ8mCc8y39w0",
  authDomain: "myselfoshan.firebaseapp.com",
  projectId: "myselfoshan",
  storageBucket: "myselfoshan.firebasestorage.app",
  messagingSenderId: "808907746677",
  appId: "1:808907746677:web:228643fd7924f51d20f73c",
  measurementId: "G-DG6CLVCW1R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);