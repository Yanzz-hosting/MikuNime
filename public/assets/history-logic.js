import { auth, db } from "./firebase.js";
import { doc, getDoc, setDoc, deleteDoc, collection, query, orderBy, limit, getDocs, writeBatch } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

let currentUserId = null;
let authInitialized = false;

const authPromise = new Promise(resolve => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUserId = user.uid;
        } else {
            currentUserId = null;
        }
        authInitialized = true;
        resolve(currentUserId);
    });
});

async function waitForAuth() {
    if (!authInitialized) {
        await authPromise;
    }
    return currentUserId;
}

const MAX_HISTORY_SIZE = 50;

async function getWatchedAnimeHistory() {
    const userId = await waitForAuth();
    if (!userId) return [];
    try {
        const historyCollectionRef = collection(db, `users/${userId}/history`);
        const q = query(historyCollectionRef, orderBy("timestamp", "desc"), limit(MAX_HISTORY_SIZE));
        const querySnapshot = await getDocs(q);
        const history = [];
        querySnapshot.forEach((doc) => {
            history.push(doc.data());
        });
        return history;
    } catch (e) {
        console.error("Error reading watch history:", e);
        return [];
    }
}

async function addAnimeToHistory(animeSlug) {
    const userId = await waitForAuth();
    if (!userId || !animeSlug) return false;
    try {
        const historyDocRef = doc(db, `users/${userId}/history`, animeSlug);
        await setDoc(historyDocRef, { slug: animeSlug, timestamp: new Date().toISOString() });
        return true;
    } catch (e) {
        console.error("Error adding to history:", e);
        return false;
    }
}

async function removeAnimeFromHistory(animeSlug) {
    const userId = await waitForAuth();
    if (!userId || !animeSlug) return false;
    try {
        const historyDocRef = doc(db, `users/${userId}/history`, animeSlug);
        await deleteDoc(historyDocRef);
        return true;
    } catch (e) {
        console.error("Error removing from history:", e);
        return false;
    }
}

async function clearAllHistory() {
    const userId = await waitForAuth();
    if (!userId) {
        showToast('Anda harus login untuk menghapus riwayat.', 'error');
        return false;
    }

    if (!confirm('Apakah Anda yakin ingin menghapus semua riwayat tontonan? Tindakan ini tidak dapat diurungkan.')) {
        return false;
    }

    try {
        const historyCollectionRef = collection(db, `users/${userId}/history`);
        const querySnapshot = await getDocs(historyCollectionRef);
        
        if (querySnapshot.empty) {
            showToast('Riwayat sudah kosong.', 'success');
            return true;
        }

        const batch = writeBatch(db);
        querySnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        
        const container = document.getElementById("historyContainer");
        const emptyMessage = document.getElementById("empty-message");
        if (container) container.innerHTML = '';
        if (container) container.style.display = 'none';
        if (emptyMessage) emptyMessage.style.display = 'block';

        showToast('Semua riwayat berhasil dihapus.', 'success');
        return true;
    } catch (e) {
        console.error("Error clearing history:", e);
        showToast('Gagal menghapus riwayat.', 'error');
        return false;
    }
}

async function isAnimeInHistory(animeSlug) {
    const userId = await waitForAuth();
    if (!userId || !animeSlug) return false;
    try {
        const historyDocRef = doc(db, `users/${userId}/history`, animeSlug);
        const docSnap = await getDoc(historyDocRef);
        return docSnap.exists();
    } catch (e) {
        console.error("Error checking history:", e);
        return false;
    }
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    const icon = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
    toast.innerHTML = `<i class="${icon}"></i> ${message}`;
    toast.className = `show ${type}`;

    setTimeout(() => {
        toast.className = '';
    }, 3000);
}

function showSkeletonLoader() {
    const container = document.getElementById("historyContainer");
    const emptyMessage = document.getElementById("empty-message");
    if (!container || !emptyMessage) return;

    let skeletonHtml = '';
    for (let i = 0; i < 8; i++) {
        skeletonHtml += `
            <div class="skeleton-card">
                <div class="skeleton skeleton-img"></div>
                <div class="p-4">
                    <div class="skeleton skeleton-title"></div>
                    <div class="skeleton skeleton-text"></div>
                </div>
            </div>
        `;
    }
    container.innerHTML = skeletonHtml;
    container.style.display = 'grid';
    emptyMessage.style.display = 'none';
}

async function displayHistory() {
    const container = document.getElementById("historyContainer");
    const emptyMessage = document.getElementById("empty-message");
    if (!container || !emptyMessage) return;

    showSkeletonLoader();

    try {
        const watchedAnimeHistory = await getWatchedAnimeHistory();

        if (watchedAnimeHistory.length === 0) {
            container.innerHTML = '';
            container.style.display = 'none';
            emptyMessage.style.display = 'block';
            return;
        }

        const animeDetailsPromises = watchedAnimeHistory.map(item => 
            axios.get(`https://apis.yanzkageno.biz.id/api/animeindo/detail/${item.slug}`)
                .then(response => {
                    const animeData = response.data;
                    return {
                        ...animeData,
                        poster: animeData.image, // Remap image to poster for compatibility
                        slug: item.slug, // Ensure original slug is preserved
                        historyTimestamp: item.timestamp
                    };
                })
                .catch(error => {
                    console.error(`Failed to fetch details for ${item.slug}`, error);
                    return null; // Return null for failed requests
                })
        );

        const animeDetailsResults = await Promise.all(animeDetailsPromises);
        const animeDetails = animeDetailsResults.filter(detail => detail !== null); // Filter out failed requests

        container.innerHTML = ''; // Clear skeletons

        if (animeDetails.length === 0) {
            container.style.display = 'none';
            emptyMessage.style.display = 'block';
            return;
        }

        animeDetails.forEach(anime => {
            const card = document.createElement('div');
            card.className = 'anime-card';
            const displayTitle = anime.title || 'Judul Tidak Tersedia';
            const displayPoster = anime.poster || 'https://via.placeholder.com/150';
            const watchedDate = new Date(anime.historyTimestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

            card.innerHTML = `
                <img src="${displayPoster}" alt="${displayTitle}" loading="lazy">
                <div class="p-2">
                    <h3 title="${displayTitle}">${displayTitle}</h3>
                    <p class="text-xs text-gray-400 text-center mt-1">Ditonton: ${watchedDate}</p>
                </div>
                <button class="remove-history-btn" data-slug="${anime.slug}" title="Hapus dari riwayat">&times;</button>
            `;

            card.addEventListener('click', () => {
                window.location.href = `info.html?slug=${anime.slug}`;
            });

            card.querySelector('.remove-history-btn').addEventListener('click', async (e) => {
                e.stopPropagation();
                const success = await removeAnimeFromHistory(anime.slug);
                if (success) {
                    showToast('Dihapus dari Riwayat', 'error');
                    card.remove();
                    // Check if history is now empty
                    const remainingHistory = await getWatchedAnimeHistory();
                    if (remainingHistory.length === 0) {
                        container.style.display = 'none';
                        emptyMessage.style.display = 'block';
                    }
                } else {
                    showToast('Gagal menghapus', 'error');
                }
            });

            container.appendChild(card);
        });

        container.style.display = 'grid';
        emptyMessage.style.display = 'none';

    } catch (error) {
        console.error("Error displaying history:", error);
        container.innerHTML = '<p class="col-span-full text-center text-red-500">Gagal memuat riwayat tontonan.</p>';
        emptyMessage.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    displayHistory();
    const clearBtn = document.getElementById('clearHistoryBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearAllHistory);
    }
});

export { getWatchedAnimeHistory, addAnimeToHistory, removeAnimeFromHistory, isAnimeInHistory, showToast, waitForAuth, clearAllHistory };
