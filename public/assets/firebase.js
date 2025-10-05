// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDTcbRUWzRKTl6LKyTg0_j2XJcX4e06Am8",
  authDomain: "komen-1ee45.firebaseapp.com",
  databaseURL: "https://komen-1ee45-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "komen-1ee45",
  storageBucket: "komen-1ee45.appspot.com",
  messagingSenderId: "953509129047",
  appId: "1:953509129047:web:90be3e4d88be1782a52c12",
  measurementId: "G-JY2VYJQLJ8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
