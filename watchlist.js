// watchlist.js - Firebase-powered watchlist manager
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js';
import { getDatabase, ref, get, remove, set } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js';

const auth = window.authMod || getAuth();
const db = window.dbMod || getDatabase();
const container = document.getElementById('watchlist-container');
const clearBtn = document.getElementById('clear-all-btn');
const itemModal = document.getElementById('item-modal');

// Escape HTML helper
function esc(str) {
  return String(str || '').replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m]));
}

// Load watchlist from Firebase or localStorage
async function loadWatchlist(user) {
  if (!user) {
    container.innerHTML = '<p class="text-center text-gray-400 py-8">Please <a href="login.html" class="text-red-500 underline">log in</a> to view your watchlist</p>';
    clearBtn.classList.add('hidden');
    return;
  }

  try {
    // Try Firebase first
    if (db) {
      const watchlistRef = ref(db, `ourshow/users/${user.uid}/watchlist`);
      const snapshot = await get(watchlistRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        const items = Object.entries(data).map(([key, value]) => ({
          ...value,
          key: key
        }));
        displayWatchlist(items, user.uid);
      } else {
        // Check localStorage as fallback
        const localData = JSON.parse(localStorage.getItem('ourshow_watchlist') || '{}');
        if (Object.keys(localData).length > 0) {
          // Migrate localStorage to Firebase
          await migrateToFirebase(user.uid, localData, 'watchlist');
          const items = Object.entries(localData).map(([key, value]) => ({
            ...value,
            key: key
          }));
          displayWatchlist(items, user.uid);
        } else {
          displayEmptyState();
        }
      }
    } else {
      // Fallback to localStorage only
      const localData = JSON.parse(localStorage.getItem('ourshow_watchlist') || '{}');
      const items = Object.entries(localData).map(([key, value]) => ({
        ...value,
        key: key
      }));
      displayWatchlist(items, user.uid);
    }
  } catch (error) {
    console.error('Error loading watchlist:', error);
    container.innerHTML = '<p class="text-center text-red-400 py-8">Error loading watchlist. Please try refreshing.</p>';
  }
}

// Migrate localStorage data to Firebase
async function migrateToFirebase(userId, data, type) {
  if (!db) return;
  
  try {
    for (const [key, value] of Object.entries(data)) {
      const itemRef = ref(db, `ourshow/users/${userId}/${type}/${key}`);
      await set(itemRef, value);
    }
    console.log(`✅ Migrated ${type} to Firebase`);
  } catch (error) {
    console.error(`❌ Migration failed for ${type}:`, error);
  }
}

// Display empty state
function displayEmptyState() {
  container.innerHTML = '<p class="text-center text-gray-400 py-8">Your watchlist is empty. <a href="index.html" class="text-red-500 underline">Browse and add items</a></p>';
  clearBtn.classList.add('hidden');
}

// Display watchlist items
function displayWatchlist(items, userId) {
  if (!items || items.length === 0) {
    displayEmptyState();
    return;
  }

  clearBtn.classList.remove('hidden');

  container.innerHTML = items.map((item, idx) => `
    <div class="bg-gray-800 rounded-lg p-4 flex gap-4 hover:bg-gray-750 transition" data-index="${idx}">
      <img src="${item.posterUrl || 'https://placehold.co/100x150?text=No+Image'}" 
           alt="${esc(item.title)}" 
           class="w-24 h-32 object-cover rounded cursor-pointer hover:opacity-80 transition" 
           onclick="openItemModal(${idx})">
      
      <div class="flex-1">
        <h3 class="text-xl font-semibold mb-1 cursor-pointer hover:text-red-500 transition" 
            onclick="openItemModal(${idx})">${esc(item.title)}</h3>
        <p class="text-gray-400 mb-2">📅 ${esc(item.year || 'N/A')}</p>
        <p class="text-sm text-gray-400 mb-3 line-clamp-2">${esc(item.overview || item.description || 'No description')}</p>
        <div class="text-xs text-gray-500 mb-3 space-y-1">
          ${item.rating ? `<p>⭐ Rating: ${item.rating.toFixed(1)}</p>` : ''}
          ${item.popularity ? `<p>📊 Popularity: ${item.popularity.toFixed(0)}</p>` : ''}
        </div>
        <div class="flex gap-2">
          <button class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition" 
                  onclick="moveToWatchLater('${item.key}', ${idx})">Move to Watch Later</button>
          <button class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition" 
                  onclick="removeItem('${item.key}')">Remove</button>
        </div>
      </div>
    </div>
  `).join('');

  // Store items globally for modal access
  window.watchlistItems = items;
}

// Open item details modal
window.openItemModal = function(index) {
  const item = window.watchlistItems[index];
  if (!item) return;

  itemModal.innerHTML = `
    <div class="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto relative p-4 text-white">
      <button onclick="closeModal()" 
              class="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white p-2 rounded z-50 transition">✕</button>
      
      <div class="flex gap-6 mt-8">
        <img src="${item.posterUrl || 'https://placehold.co/150x225?text=No+Image'}" 
             alt="${esc(item.title)}" 
             class="w-32 h-48 object-cover rounded flex-shrink-0">
        
        <div class="flex-1">
          <h2 class="text-2xl font-bold text-white mb-2">${esc(item.title)}</h2>
          <p class="text-gray-300 mb-4">📅 ${esc(item.year || 'N/A')}</p>
          
          <p class="text-gray-400 mb-4">${esc(item.overview || item.description || 'No description available')}</p>
          
          <div class="text-sm text-gray-300 space-y-2 mb-4">
            ${item.rating ? `<p><strong>Rating:</strong> ⭐ ${item.rating.toFixed(1)}</p>` : ''}
            ${item.popularity ? `<p><strong>Popularity:</strong> 📊 ${item.popularity.toFixed(0)}</p>` : ''}
            ${item.type ? `<p><strong>Type:</strong> ${esc(item.type === 'tv' ? 'TV Show' : 'Movie')}</p>` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
  itemModal.classList.remove('hidden');
};

// Close modal
window.closeModal = function() {
  itemModal.classList.add('hidden');
};

// Remove item from watchlist
window.removeItem = async function(key) {
  if (!confirm('Remove from watchlist?')) return;
  
  const user = auth.currentUser;
  if (!user) return;

  try {
    if (db) {
      const itemRef = ref(db, `ourshow/users/${user.uid}/watchlist/${key}`);
      await remove(itemRef);
    }
    
    // Also remove from localStorage
    const localData = JSON.parse(localStorage.getItem('ourshow_watchlist') || '{}');
    delete localData[key];
    localStorage.setItem('ourshow_watchlist', JSON.stringify(localData));
    
    // Reload page
    location.reload();
  } catch (error) {
    console.error('Error removing item:', error);
    alert('Failed to remove item. Please try again.');
  }
};

// Move item to watch later
window.moveToWatchLater = async function(key, index) {
  const item = window.watchlistItems[index];
  if (!item) return;
  
  const user = auth.currentUser;
  if (!user) return;

  try {
    if (db) {
      // Add to watch later
      const watchLaterRef = ref(db, `ourshow/users/${user.uid}/watchlater/${key}`);
      await set(watchLaterRef, item);
      
      // Remove from watchlist
      const watchlistRef = ref(db, `ourshow/users/${user.uid}/watchlist/${key}`);
      await remove(watchlistRef);
    }
    
    // Update localStorage
    const watchlist = JSON.parse(localStorage.getItem('ourshow_watchlist') || '{}');
    const watchlater = JSON.parse(localStorage.getItem('ourshow_watchlater') || '{}');
    
    watchlater[key] = item;
    delete watchlist[key];
    
    localStorage.setItem('ourshow_watchlist', JSON.stringify(watchlist));
    localStorage.setItem('ourshow_watchlater', JSON.stringify(watchlater));
    
    alert('✅ Moved to Watch Later!');
    location.reload();
  } catch (error) {
    console.error('Error moving item:', error);
    alert('Failed to move item. Please try again.');
  }
};

// Clear all watchlist items
clearBtn.addEventListener('click', async () => {
  if (!confirm('Clear entire watchlist? This cannot be undone.')) return;
  
  const user = auth.currentUser;
  if (!user) return;

  try {
    if (db) {
      const watchlistRef = ref(db, `ourshow/users/${user.uid}/watchlist`);
      await remove(watchlistRef);
    }
    
    localStorage.removeItem('ourshow_watchlist');
    alert('✅ Watchlist cleared');
    location.reload();
  } catch (error) {
    console.error('Error clearing watchlist:', error);
    alert('Failed to clear watchlist. Please try again.');
  }
});

// Close modal when clicking outside
itemModal.addEventListener('click', (e) => {
  if (e.target === itemModal) {
    closeModal();
  }
});

// Initialize on auth state change
onAuthStateChanged(auth, (user) => {
  loadWatchlist(user);
});