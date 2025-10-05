
// Mengimpor instance auth dan db dari firebase.js
import { auth, db } from './firebase.js';
import {
    onAuthStateChanged,
    signOut,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendEmailVerification, // Import
    updateProfile
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    // --- Element References ---
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loginContainer = document.getElementById('loginContainer');
    const profileContainer = document.getElementById('profileContainer');
    const emailLoginForm = document.getElementById('emailLoginForm');
    const emailRegisterForm = document.getElementById('emailRegisterForm');
    
    // Toggle Links
    const showRegisterLink = document.getElementById('showRegister');
    const showLoginLink = document.getElementById('showLogin');

    // Profile Display
    const profilePic = document.getElementById('profilePic');
    const usernameDisplay = document.getElementById('usernameDisplay');
    const userRole = document.getElementById('userRole');
    const userId = document.getElementById('userId');
    const loginAt = document.getElementById('loginAt');
    const userLevel = document.getElementById('userLevel');
    const expBar = document.getElementById('expBar');
    const expText = document.getElementById('expText');
    const logoutBtn = document.getElementById('logoutBtn');

    // Profile Editing
    const usernameInput = document.getElementById('usernameInput');
    const updateUsernameBtn = document.getElementById('updateUsernameBtn');
    const profilePicInput = document.getElementById('profilePicInput');

    const CACHE_KEY = 'userProfileCache';

    // --- Main Functions ---

    function displayUserProfile(userData, metadata) {
        if (!userData) return;
        profilePic.src = userData.photoURL || 'https://via.placeholder.com/96';
        usernameDisplay.textContent = userData.displayName || 'Pengguna Baru';
        userRole.textContent = userData.role || 'user';
        userId.textContent = userData.uid;
        userLevel.textContent = `Lv. ${userData.level || 1}`;
        const exp = userData.exp || 0;
        const expPercentage = exp >= 100 ? 100 : exp;
        expBar.style.width = `${expPercentage}%`;
        expText.textContent = `${Math.floor(exp)} / 100 EXP`;
        if (metadata && metadata.lastSignInTime) {
            loginAt.textContent = new Date(metadata.lastSignInTime).toLocaleString('id-ID');
        } else {
            loginAt.textContent = 'Memuat...';
        }
    }

    function loadProfileFromCache() {
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
            const { userData, metadata } = JSON.parse(cachedData);
            displayUserProfile(userData, metadata);
            loginContainer.style.display = 'none';
            profileContainer.style.display = 'block';
            profileContainer.classList.add('show');
        }
    }

    function updateCache(newData) {
        const cachedData = localStorage.getItem(CACHE_KEY);
        let fullCache = { userData: {}, metadata: {} };
        if (cachedData) {
            fullCache = JSON.parse(cachedData);
        }
        fullCache.userData = { ...fullCache.userData, ...newData };
        localStorage.setItem(CACHE_KEY, JSON.stringify(fullCache));
    }

    // --- Initial Load ---
    loadProfileFromCache();

    // --- Firebase Auth Listener (Single Source of Truth) ---
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // Silent gatekeeper: jika user belum verifikasi, langsung sign out.
            // Pesan error akan dihandle oleh event listener (login/register)
            if (!user.emailVerified) {
                signOut(auth); 
                return; 
            }

            // --- User terverifikasi, lanjutkan seperti biasa ---
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);
            let userData;

            if (userDoc.exists()) {
                userData = userDoc.data();
            } else {
                userData = {
                    displayName: user.displayName || 'Pengguna Baru',
                    email: user.email,
                    role: 'user',
                    level: 1,
                    exp: 0,
                    photoURL: user.photoURL || 'https://via.placeholder.com/96',
                    createdAt: new Date().toISOString()
                };
                await setDoc(userDocRef, userData);
            }
            userData.uid = user.uid;

            const fullCache = { userData, metadata: user.metadata };
            localStorage.setItem(CACHE_KEY, JSON.stringify(fullCache));

            displayUserProfile(userData, user.metadata);
            
            loginContainer.style.display = 'none';
            profileContainer.style.display = 'block';
            profileContainer.classList.add('show');

            // Check for Admin and show button if matched
            const adminBtn = document.getElementById('admin-panel-btn');
            if (user.email === 'yansptra82@gmail.com') {
                adminBtn.style.display = 'block';
            } else {
                adminBtn.style.display = 'none';
            }


            // Sembunyikan loading overlay setelah semuanya siap
            loadingOverlay.style.display = 'none';

        } else {
            // User logged out atau belum login
            localStorage.removeItem(CACHE_KEY);
            profileContainer.style.display = 'none';
            profileContainer.classList.remove('show');
            loginContainer.style.display = 'block';
            
            // Sembunyikan loading overlay
            loadingOverlay.style.display = 'none';
        }
    });

    // --- Event Listeners ---

    // Toggle between Login and Register forms
    showRegisterLink.addEventListener('click', () => {
        emailLoginForm.style.display = 'none';
        emailRegisterForm.style.display = 'block';
    });

    showLoginLink.addEventListener('click', () => {
        emailRegisterForm.style.display = 'none';
        emailLoginForm.style.display = 'block';
    });

    // Email/Password Authentication
    const loginBtn = document.getElementById('loginBtn');
    loginBtn.addEventListener('click', () => {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        if (!email || !password) {
            showToast('Email dan password harus diisi', 'error');
            return;
        }

        // Start loading animation
        loginBtn.classList.add('loading');
        loginBtn.disabled = true;

        signInWithEmailAndPassword(auth, email, password)
            .then(userCredential => {
                // onAuthStateChanged will handle the UI switch.
                // We just need to handle the specific error case here.
                if (!userCredential.user.emailVerified) {
                    showToast('Silahkan verif email anda dulu, mohon cek di halaman utama, dan folder spam di email anda', 'error');
                }
            })
            .catch(error => {
                showToast(getAuthErrorMessage(error.code), 'error');
            })
            .finally(() => {
                // Stop loading animation regardless of outcome
                loginBtn.classList.remove('loading');
                loginBtn.disabled = false;
            });
    });

    const registerBtn = document.getElementById('registerBtn');
    registerBtn.addEventListener('click', async () => {
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        if (!username || !email || !password) {
            showToast('Username, email, dan password harus diisi', 'error');
            return;
        }
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, { displayName: username });
            
            // Kirim email verifikasi
            await sendEmailVerification(userCredential.user);
            showToast('pendaftaran berhasil silahkan cek email anda (termasuk folder spam) untuk verfikasi', 'success');
            
            // Langsung sign out agar user harus verifikasi dulu
            signOut(auth);

            // Arahkan kembali ke form login
            emailRegisterForm.style.display = 'none';
            emailLoginForm.style.display = 'block';

        } catch (error) {
            showToast(getAuthErrorMessage(error.code), 'error');
        }
    });

    logoutBtn.addEventListener('click', () => {
        signOut(auth).catch((error) => showToast(`Error: ${error.message}`, 'error'));
    });

    // Profile Updates (unchanged)
    profilePicInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        const user = auth.currentUser;
        if (!file || !user) return;
        showToast('Mengunggah gambar...', 'info');
        try {
            const arrayBuffer = await file.arrayBuffer();
            const response = await fetch('https://api-upload-cyan.vercel.app/api/upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'x-filename': `${user.uid}_${Date.now()}_${file.name}`
                },
                body: arrayBuffer
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();
            const newPhotoURL = result.data.url;
            if (!newPhotoURL) throw new Error('URL gambar tidak ditemukan di respons API.');
            await updateProfile(user, { photoURL: newPhotoURL });
            await setDoc(doc(db, "users", user.uid), { photoURL: newPhotoURL }, { merge: true });
            profilePic.src = newPhotoURL;
            updateCache({ photoURL: newPhotoURL });
            showToast('Foto profil berhasil diperbarui!', 'success');
        } catch (error) {
            console.error("Error uploading profile picture:", error);
            showToast(`Gagal mengunggah: ${error.message}`, 'error');
        }
    });

    updateUsernameBtn.addEventListener('click', async () => {
        const newUsername = usernameInput.value.trim();
        const user = auth.currentUser;
        if (!newUsername || !user) return;
        try {
            await updateProfile(user, { displayName: newUsername });
            await setDoc(doc(db, "users", user.uid), { displayName: newUsername }, { merge: true });
            usernameDisplay.textContent = newUsername;
            updateCache({ displayName: newUsername });
            usernameInput.value = '';
            showToast('Username berhasil diperbarui!', 'success');
        } catch (error) {
            console.error("Error updating username:", error);
            showToast(`Error: ${error.message}`, 'error');
        }
    });
});

// --- Utility Functions ---
function getAuthErrorMessage(errorCode) {
    switch (errorCode) {
        case 'auth/invalid-email':
            return 'Format email tidak valid.';
        case 'auth/user-not-found':
            return 'Akun dengan email ini tidak ditemukan.';
        case 'auth/wrong-password':
            return 'Password salah. Silakan coba lagi.';
        case 'auth/email-already-in-use':
            return 'Email ini sudah terdaftar. Silakan login.';
        case 'auth/weak-password':
            return 'Password terlalu lemah. Gunakan minimal 6 karakter.';
        default:
            return 'Terjadi kesalahan. Silakan coba lagi.';
    }
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = 'show';
    toast.classList.add(type);
    setTimeout(() => {
        toast.className = toast.className.replace('show', '');
    }, 3000);
}
