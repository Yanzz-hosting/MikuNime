import { auth, db } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { collection, getDocs, query, where, updateDoc, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const ADMIN_EMAIL = 'yansptra82@gmail.com';

const authGate = document.getElementById('auth-gate');
const adminPanel = document.getElementById('admin-panel');

onAuthStateChanged(auth, (user) => {
    if (user && user.email === ADMIN_EMAIL) {
        authGate.style.display = 'none';
        adminPanel.style.display = 'block';
        initializeApp();
    } else {
        authGate.innerHTML = '<p class="text-red-500 text-center text-2xl">ACCESS DENIED</p>';
        adminPanel.style.display = 'none';
        setTimeout(() => {
            if (window.location.pathname !== '/public/home.html') {
               // window.location.href = 'home.html';
            }
        }, 3000);
    }
});

async function fetchAndDisplayUsers() {
    const totalUsersStat = document.getElementById('total-users-stat');
    const allUsersGrid = document.getElementById('all-users-grid'); // Changed to grid
    if (!totalUsersStat || !allUsersGrid) return;

    try {
        const usersCollection = collection(db, "users");
        const querySnapshot = await getDocs(usersCollection);
        totalUsersStat.textContent = querySnapshot.size;

        let userCards = ''; // Changed variable name
        if (querySnapshot.empty) {
            userCards = '<p class="text-center p-4 col-span-full">No users found.</p>';
        } else {
            querySnapshot.forEach(doc => {
                const userData = doc.data();
                userCards += `
                    <div class="user-card">
                        <p><strong>Email:</strong> ${userData.email || 'N/A'}</p>
                        <p><strong>Username:</strong> ${userData.displayName || 'N/A'}</p>
                        <p><strong>Level:</strong> ${userData.level || 1}</p>
                        <p class="user-uid"><strong>UID:</strong> ${doc.id}</p>
                    </div>
                `;
            });
        }
        allUsersGrid.innerHTML = userCards; // Update the new grid element
    } catch (error) {
        console.error("Error fetching users:", error);
        totalUsersStat.textContent = 'Error';
        allUsersGrid.innerHTML = '<p class="text-center text-red-500 p-4 col-span-full">Failed to load users.</p>';
    }
}

async function updateUserLevel() {
    const emailInput = document.getElementById('edit-user-email');
    const levelInput = document.getElementById('edit-user-level');
    const email = emailInput.value.trim();
    const level = parseInt(levelInput.value, 10);

    if (!email || isNaN(level)) {
        alert('Please enter a valid email and level.');
        return;
    }

    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            alert(`User with email ${email} not found.`);
            return;
        }

        const userDoc = querySnapshot.docs[0];
        const userDocRef = doc(db, "users", userDoc.id);
        await updateDoc(userDocRef, { level: level });

        alert(`Successfully updated level for ${email} to ${level}.`);
        emailInput.value = '';
        levelInput.value = '';
        fetchAndDisplayUsers();
    } catch (error) {
        console.error("Error updating user level:", error);
        alert(`Failed to update user level. See console for details. IMPORTANT: Have you set the Firebase Security Rules to allow this action?`);
    }
}

async function updateRealtimeStats() {
    const onlineUsersStat = document.getElementById('online-users-stat');
    const activityList = document.getElementById('activity-breakdown-list');
    if (!onlineUsersStat || !activityList) return;

    try {
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("lastSeen", ">", twoMinutesAgo));
        
        onSnapshot(q, (snapshot) => {
            // Update total online users
            onlineUsersStat.textContent = snapshot.size;

            // Process activity breakdown
            const activity = {};
            snapshot.forEach(doc => {
                const userData = doc.data();
                const page = userData.viewing || 'Unknown';
                if (activity[page]) {
                    activity[page]++;
                } else {
                    activity[page] = 1;
                }
            });

            // Display breakdown
            activityList.innerHTML = ''; // Clear old list
            if (Object.keys(activity).length === 0) {
                activityList.innerHTML = '<li>No user activity detected.</li>';
            } else {
                // Sort activity by count, descending
                const sortedActivity = Object.entries(activity).sort(([,a],[,b]) => b-a);

                for (const [page, count] of sortedActivity) {
                    const listItem = document.createElement('li');
                    listItem.innerHTML = `<strong>${page}:</strong> ${count} user(s)`;
                    activityList.appendChild(listItem);
                }
            }

        }, (error) => {
            console.error("Error with realtime stats listener:", error);
            onlineUsersStat.textContent = 'Error';
            activityList.innerHTML = '<li>Error loading activity.</li>';
        });

    } catch (error) {
        console.error("Error setting up realtime stats listener:", error);
        onlineUsersStat.textContent = 'Error';
    }
}

function setupHamburgerNavigation() {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const sideNav = document.getElementById('side-nav');
    const menuOverlay = document.createElement('div'); // Create overlay dynamically
    menuOverlay.id = 'menu-overlay';
    document.body.appendChild(menuOverlay);

    hamburgerBtn.addEventListener('click', () => {
        sideNav.classList.toggle('open');
        menuOverlay.style.display = sideNav.classList.contains('open') ? 'block' : 'none';
    });

    menuOverlay.addEventListener('click', () => {
        sideNav.classList.remove('open');
        menuOverlay.style.display = 'none';
    });

    const sideNavButtons = document.querySelectorAll('.side-nav-button');
    const adminViews = document.querySelectorAll('.admin-view');

    sideNavButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            sideNavButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');

            // Hide all views
            adminViews.forEach(view => view.style.display = 'none');
            // Show target view
            const targetId = button.dataset.target;
            document.getElementById(targetId).style.display = 'block';

            // Close side nav on mobile after selection
            sideNav.classList.remove('open');
            menuOverlay.style.display = 'none';
        });
    });

    // Initial view setup
    document.getElementById('stats-view').style.display = 'block';
    document.getElementById('edit-level-view').style.display = 'none';
    document.getElementById('all-users-view').style.display = 'none';
}

function initializeApp() {
    console.log("Admin Panel Initialized");
    fetchAndDisplayUsers();
    updateRealtimeStats();
    setupHamburgerNavigation(); // Call this new function

    const updateLevelBtn = document.getElementById('update-level-btn');
    updateLevelBtn.addEventListener('click', updateUserLevel);
}