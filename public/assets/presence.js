import { auth, db } from './firebase.js';
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

function initializePresence(pageName) {
    auth.onAuthStateChanged((user) => {
        if (user) {
            const userDocRef = doc(db, "users", user.uid);

            // Set initial presence immediately
            setDoc(userDocRef, { 
                lastSeen: new Date(),
                viewing: pageName
            }, { merge: true });

            // Update presence every minute
            // We create a single interval per user session
            if (!window.presenceInterval) {
                window.presenceInterval = setInterval(() => {
                    if (auth.currentUser) { // Check again inside interval
                         setDoc(doc(db, "users", auth.currentUser.uid), { 
                            lastSeen: new Date(),
                            viewing: pageName // This will be the page where it was first initialized
                        }, { merge: true });
                    }
                }, 60000);
            }
        }
    });
}

export { initializePresence };
