/* -----------------------------------------------------
    SURPRISE ME FUNCTIONALITY
    Add this code to main.js before the "KEYBOARD SHORTCUTS" section
    (around line 2947)
----------------------------------------------------- */

async function getRandomMovie() {
    try {
        // Fetch trending items
        const endpoint = '/trending/all/day';
        const data = await tmdbFetch(endpoint);

        if (!data || !data.results || data.results.length === 0) {
            showToast('❌ No items available for surprise');
            return;
        }

        // Pick a random item
        const randomIndex = Math.floor(Math.random() * data.results.length);
        const item = data.results[randomIndex];

        // Determine type
        const type = item.media_type || (item.first_air_date ? 'tv' : 'movie');

        // Show the detail modal
        showToast('🎲 Surprise! Here\'s something for you...');
        await showDetail(item.id, type);
    } catch (error) {
        console.error('Error getting random movie:', error);
        showToast('❌ Failed to get surprise item');
    }
}

function setupSurpriseButtons() {
    // Mobile menu surprise button
    const mobileSurpriseBtn = document.getElementById('mobile-surprise-btn');
    if (mobileSurpriseBtn) {
        mobileSurpriseBtn.addEventListener('click', () => {
            getRandomMovie();
            // Close mobile menu
            const mobileMenu = document.getElementById('mobile-menu');
            if (mobileMenu) mobileMenu.classList.add('hidden');
        });
    }

    // Mobile header surprise button
    const mobileHeaderSurpriseBtn = document.getElementById('mobile-surprise-btn-header');
    if (mobileHeaderSurpriseBtn) {
        mobileHeaderSurpriseBtn.addEventListener('click', () => {
            getRandomMovie();
        });
    }
}
