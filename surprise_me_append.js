
/* -----------------------------------------------------
    SURPRISE ME - SMART RECOMMENDATION FUNCTIONALITY
----------------------------------------------------- */

// Overwrite existing function with smarter version
window.getRandomMovie = async function () {
    try {
        showToast('🎲 Finding a surprise for you...');

        // Get user's watch history for personalized recommendations
        const watchedItems = JSON.parse(localStorage.getItem('ourshow_watched') || '{}');
        const watchlistItems = JSON.parse(localStorage.getItem('ourshow_watchlist') || '{}');

        let endpoint = '/trending/all/day';
        let recommendationType = 'trending';

        // If user has watch history, use personalized recommendations
        if (Object.keys(watchedItems).length > 0) {
            // Analyze user preferences
            const genres = {};
            const ratings = [];

            Object.values(watchedItems).forEach(item => {
                if (item.genres) {
                    item.genres.forEach(g => {
                        const genreName = typeof g === 'string' ? g : g.name;
                        genres[genreName] = (genres[genreName] || 0) + 1;
                    });
                }
                if (item.rating) ratings.push(item.rating);
            });

            // Find favorite genre
            const favoriteGenre = Object.keys(genres).sort((a, b) => genres[b] - genres[a])[0];

            // 40% chance: Recommend based on favorite genre
            if (favoriteGenre && Math.random() < 0.4) {
                const genreId = getGenreId(favoriteGenre);
                if (genreId) {
                    endpoint = `/discover/movie?with_genres=${genreId}&sort_by=vote_average.desc&vote_count.gte=500`;
                    recommendationType = `${favoriteGenre} movies`;
                }
            }
            // 30% chance: Highly rated content
            else if (Math.random() < 0.3) {
                endpoint = '/discover/movie?sort_by=vote_average.desc&vote_count.gte=1000&vote_average.gte=7.5';
                recommendationType = 'highly rated';
            }
            // 30% chance: Trending content
        }

        // Fetch recommendations
        const data = await tmdbFetch(endpoint);

        if (!data || !data.results || data.results.length === 0) {
            showToast('❌ No recommendations available');
            return;
        }

        // Filter out already watched items
        let availableItems = data.results.filter(item =>
            !watchedItems[item.id] && !watchlistItems[item.id]
        );

        // If all items are watched, use all results
        if (availableItems.length === 0) {
            availableItems = data.results;
        }

        // Pick a random item
        const randomIndex = Math.floor(Math.random() * availableItems.length);
        const item = availableItems[randomIndex];

        // Determine type
        const type = item.media_type || (item.first_air_date ? 'tv' : 'movie');

        // Show the detail modal
        showToast(`🎬 Surprise! Here's a ${recommendationType} pick for you!`);
        // Use showDetail if available, otherwise openModal
        if (typeof showDetail === 'function') {
            await showDetail(item.id, type);
        } else if (typeof openModal === 'function') {
            openModal(item.id, type);
        }
    } catch (error) {
        console.error('Error getting random recommendation:', error);
        showToast('❌ Failed to get surprise recommendation');
    }
};

// Helper function to get genre ID from name
function getGenreId(genreName) {
    const genreMap = {
        'Action': 28,
        'Adventure': 12,
        'Animation': 16,
        'Comedy': 35,
        'Crime': 80,
        'Documentary': 99,
        'Drama': 18,
        'Family': 10751,
        'Fantasy': 14,
        'History': 36,
        'Horror': 27,
        'Music': 10402,
        'Mystery': 9648,
        'Romance': 10749,
        'Science Fiction': 878,
        'TV Movie': 10770,
        'Thriller': 53,
        'War': 10752,
        'Western': 37
    };
    return genreMap[genreName] || null;
}

function setupSurpriseButtons() {
    console.log('🎲 Setting up surprise buttons...');
    // Mobile menu surprise button
    const mobileSurpriseBtn = document.getElementById('mobile-surprise-btn');
    if (mobileSurpriseBtn) {
        mobileSurpriseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.getRandomMovie();
            // Close mobile menu
            const mobileMenu = document.getElementById('mobile-menu');
            if (mobileMenu) mobileMenu.classList.add('hidden');
        });
        console.log('✅ Mobile menu surprise button connected');
    }

    // Mobile header surprise button
    const mobileHeaderSurpriseBtn = document.getElementById('mobile-surprise-btn-header');
    if (mobileHeaderSurpriseBtn) {
        mobileHeaderSurpriseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.getRandomMovie();
        });
        console.log('✅ Mobile header surprise button connected');
    }
}

// Initialize immediately
setupSurpriseButtons();
// Also try again on load just in case
window.addEventListener('DOMContentLoaded', setupSurpriseButtons);
