document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = "https://www.sankavollerei.com/anime";
    const scheduleContainer = document.getElementById('scheduleContainer');

    async function loadScheduleAnime() {
        let skeletonHtml = '';
        for (let i = 0; i < 3; i++) { // Show skeleton for 3 days
            skeletonHtml += `
                <div class="day-block mb-6 p-4">
                    <div class="skeleton h-8 w-1/3 mb-4"></div>
                    <div class="anime-grid">
            `;
            for (let j = 0; j < 3; j++) { // 3 cards per day
                skeletonHtml += `<div class="skeleton-latest-anime-card"><div class="skeleton skeleton-img"></div><div class="p-2"><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-text"></div></div></div>`;
            }
            skeletonHtml += `
                    </div>
                </div>
            `;
        }
        scheduleContainer.innerHTML = skeletonHtml;

        try {
            const res = await axios.get(`${API_BASE_URL}/schedule`);
            const scheduleDays = res.data.data;

            if (!Array.isArray(scheduleDays) || scheduleDays.length === 0) {
                throw new Error("Jadwal tidak ditemukan atau format salah");
            }
            
            scheduleContainer.innerHTML = ""; // Clear skeletons
            scheduleDays.forEach(day => {
                const dayCard = document.createElement('div');
                dayCard.className = 'day-block mb-6';
                const animeCount = day.anime_list.length;
                dayCard.innerHTML = `
                    <h2 class="text-xl font-bold mb-4"><i class="fa fa-calendar-day mr-2"></i> ${day.day} (${animeCount} anime)</h2>
                    <div class="anime-grid">
                      ${day.anime_list.map(anime => `
                        <a href="info.html?slug=${anime.slug}" class="anime-card">
                          <img src="${anime.poster || 'https://via.placeholder.com/150'}" alt="${anime.anime_name}" loading="lazy">
                          <div class="title-overlay">
                            <h3>${anime.anime_name}</h3>
                          </div>
                        </a>
                      `).join("")}
                    </div>
                `;
                scheduleContainer.appendChild(dayCard);
            });

        } catch (err) {
            console.error("❌ Gagal memuat jadwal anime:", err);
            scheduleContainer.innerHTML = `<p class="col-span-full text-center text-red-500">Gagal memuat jadwal anime.</p>`;
        }
    }

    loadScheduleAnime();
});
