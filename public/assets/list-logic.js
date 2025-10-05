document.addEventListener('DOMContentLoaded', () => {
    const animeListContainer = document.getElementById('animeListContainer');
    const loadingContainer = document.getElementById('loadingContainer');
    const mainContent = document.getElementById('mainContent');

    if (!animeListContainer || !loadingContainer || !mainContent) {
        console.error('Element-elemen penting tidak ditemukan!');
        return;
    }

    // --- START SKELETON LOADER ---
    let skeletonHtml = '';
    // Generate skeleton headers and grids for a few letters to show loading
    ['#', 'A', 'B', 'C', 'D'].forEach(letter => {
        skeletonHtml += `<h2 class="text-xl font-bold my-4 p-2 bg-gray-200 dark:bg-gray-700 rounded skeleton" style="height: 40px; width: 50px;"></h2>`;
        skeletonHtml += '<div class="anime-grid">';
        for (let i = 0; i < 5; i++) { // 5 skeleton cards per letter
            skeletonHtml += `
                <div class="anime-card">
                    <div class="anime-card-title skeleton" style="height: 60px;"></div>
                </div>
            `;
        }
        skeletonHtml += '</div>';
    });
    
    animeListContainer.innerHTML = skeletonHtml;
    loadingContainer.style.display = 'none';
    mainContent.style.display = 'block';
    // --- END SKELETON LOADER ---

    fetch('https://apis.yanzkageno.biz.id/api/animeindo/anime-list')
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            const animeListObject = data?.anime_list;

            if (!animeListObject || typeof animeListObject !== 'object') {
                throw new Error('Struktur data anime_list tidak valid.');
            }

            animeListContainer.innerHTML = ''; 
            const fragment = document.createDocumentFragment();
            let totalAnime = 0;

            const sortedKeys = Object.keys(animeListObject).sort();

            sortedKeys.forEach(letter => {
                const animeList = animeListObject[letter];
                if (animeList && Array.isArray(animeList) && animeList.length > 0) {
                    const header = document.createElement('h2');
                    header.className = 'text-xl font-bold my-4 p-2 bg-gray-200 dark:bg-gray-700 rounded';
                    header.textContent = letter;
                    fragment.appendChild(header);

                    const grid = document.createElement('div');
                    grid.className = 'anime-grid';

                    animeList.forEach(anime => {
                        if (anime.title && anime.slug) {
                            totalAnime++;
                            const card = document.createElement('div');
                            card.className = 'anime-card';

                            const a = document.createElement('a');
                            a.href = `info.html?slug=${anime.slug}`;

                            const title = document.createElement('div');
                            title.className = 'anime-card-title';
                            title.textContent = anime.title;

                            a.appendChild(title);
                            card.appendChild(a);
                            grid.appendChild(card);
                        }
                    });
                    fragment.appendChild(grid);
                }
            });

            if (totalAnime === 0) {
                animeListContainer.innerHTML = '<div class="p-4 text-center text-gray-500">Tidak ada anime yang ditemukan.</div>';
            } else {
                animeListContainer.appendChild(fragment);
            }
            
        })
        .catch(error => {
            console.error('Gagal memuat daftar anime:', error);
            animeListContainer.innerHTML = `<div class="p-4 text-center text-red-500">Gagal memuat data. ${error.message}</div>`;
        });
});
