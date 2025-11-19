// collection.js - Collection management page
import { waitForFirebase } from './firebase-config.js';

const COLLECTIONS_KEY = 'ourshow_collections';
let collections = [];
let currentCollectionId = null;
let currentUser = null;

const container = document.getElementById('collections-container');
const createModal = document.getElementById('create-modal');
const detailModal = document.getElementById('collection-detail-modal');

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

// Initialize
async function init() {
  try {
    await waitForFirebase();
    const { onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js');
    const auth = window.authMod;
    
    onAuthStateChanged(auth, (user) => {
      currentUser = user;
      loadCollections();
    });
    
    if (!auth.currentUser) {
      loadCollections();
    }
  } catch (error) {
    console.error('Firebase init error:', error);
    loadCollections();
  }
  
  setupEventListeners();
}

// Load collections from localStorage
function loadCollections() {
  const raw = JSON.parse(localStorage.getItem(COLLECTIONS_KEY) || '[]');
  collections = Array.isArray(raw) ? raw : Object.values(raw);
  renderCollections();
}

// Save collections to localStorage
function saveCollections() {
  localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
}

// Render collections grid
function renderCollections() {
  if (!container) return;
  
  if (!collections.length) {
    container.innerHTML = `
      <div class="col-span-full text-center py-12">
        <p class="text-gray-400 text-lg mb-4">No collections yet</p>
        <p class="text-gray-500 text-sm mb-6">Create your first collection to organize your favorite movies and shows!</p>
        <button onclick="document.getElementById('create-collection-btn').click()" 
                class="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold">
          Create Collection
        </button>
      </div>
    `;
    return;
  }
  
  container.innerHTML = collections.map(collection => `
    <div class="collection-card bg-gray-800 rounded-xl p-6 border border-gray-700 cursor-pointer" 
         onclick="openCollectionDetail('${collection.id}')">
      <div class="flex items-start justify-between mb-3">
        <h3 class="text-xl font-bold text-white">${esc(collection.name)}</h3>
        <span class="text-xs uppercase px-2 py-1 rounded bg-gray-700 text-gray-400">${esc(collection.visibility)}</span>
      </div>
      <p class="text-gray-400 text-sm mb-4 line-clamp-2">${esc(collection.description || 'No description')}</p>
      <div class="flex items-center justify-between">
        <span class="text-sm text-gray-500">${collection.items?.length || 0} items</span>
        <button onclick="event.stopPropagation(); shareCollection('${collection.id}')" 
                class="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded">
          Share
        </button>
      </div>
    </div>
  `).join('');
}

// Setup event listeners
function setupEventListeners() {
  // Create collection button
  document.getElementById('create-collection-btn')?.addEventListener('click', () => {
    createModal.classList.remove('hidden');
  });
  
  // Cancel create
  document.getElementById('cancel-create')?.addEventListener('click', () => {
    createModal.classList.add('hidden');
    document.getElementById('new-collection-name').value = '';
    document.getElementById('new-collection-desc').value = '';
  });
  
  // Confirm create
  document.getElementById('confirm-create')?.addEventListener('click', createCollection);
  
  // Close detail modal
  document.getElementById('close-detail-modal')?.addEventListener('click', () => {
    detailModal.classList.add('hidden');
  });
  
  // Share collection
  document.getElementById('share-collection-btn')?.addEventListener('click', () => {
    if (currentCollectionId) shareCollection(currentCollectionId);
  });
  
  // Share in post
  document.getElementById('share-in-post-btn')?.addEventListener('click', () => {
    if (currentCollectionId) shareCollectionInPost(currentCollectionId);
  });
  
  // Edit collection
  document.getElementById('edit-collection-btn')?.addEventListener('click', () => {
    if (currentCollectionId) editCollection(currentCollectionId);
  });
  
  // Delete collection
  document.getElementById('delete-collection-btn')?.addEventListener('click', () => {
    if (currentCollectionId) deleteCollection(currentCollectionId);
  });
  
  // Close modals on outside click
  createModal?.addEventListener('click', (e) => {
    if (e.target === createModal) createModal.classList.add('hidden');
  });
  
  detailModal?.addEventListener('click', (e) => {
    if (e.target === detailModal) detailModal.classList.add('hidden');
  });
}

// Create new collection
function createCollection() {
  const name = document.getElementById('new-collection-name')?.value.trim();
  const description = document.getElementById('new-collection-desc')?.value.trim();
  const visibility = document.getElementById('new-collection-visibility')?.value || 'private';
  
  if (!name) {
    alert('Please enter a collection name');
    return;
  }
  
  const newCollection = {
    id: `col_${Date.now()}`,
    name,
    description,
    visibility,
    owner: currentUser?.uid || 'guest',
    ownerName: currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Guest',
    items: [],
    createdAt: Date.now()
  };
  
  collections.push(newCollection);
  saveCollections();
  renderCollections();
  
  createModal.classList.add('hidden');
  document.getElementById('new-collection-name').value = '';
  document.getElementById('new-collection-desc').value = '';
  
  showToast(`✅ Collection "${name}" created!`);
}

// Open collection detail
window.openCollectionDetail = function(collectionId) {
  const collection = collections.find(c => c.id === collectionId);
  if (!collection) return;
  
  currentCollectionId = collectionId;
  
  document.getElementById('detail-collection-name').textContent = collection.name;
  document.getElementById('detail-collection-desc').textContent = collection.description || 'No description';
  
  renderCollectionItems(collection);
  detailModal.classList.remove('hidden');
};

// Render collection items
function renderCollectionItems(collection) {
  const grid = document.getElementById('collection-items-grid');
  if (!grid) return;
  
  if (!collection.items || collection.items.length === 0) {
    grid.innerHTML = '<p class="col-span-full text-center text-gray-400 py-8">No items in this collection yet.</p>';
    return;
  }
  
  grid.innerHTML = collection.items.map(item => `
    <div class="movie-item bg-gray-700 rounded-lg overflow-hidden cursor-pointer" 
         onclick="openItem('${item.id}', '${item.type || 'movie'}')">
      <div class="aspect-[2/3] bg-gray-600 flex items-center justify-center">
        <span class="text-4xl">🎬</span>
      </div>
      <div class="p-2">
        <h4 class="text-sm font-semibold truncate">${esc(item.title)}</h4>
        <p class="text-xs text-gray-400">${esc(item.type === 'tv' ? 'TV Show' : 'Movie')}</p>
      </div>
    </div>
  `).join('');
}

// Open item (redirect to main page)
window.openItem = function(id, type) {
  window.location.href = `index.html#${type}/${id}`;
};

// Share collection
window.shareCollection = function(collectionId) {
  const collection = collections.find(c => c.id === collectionId);
  if (!collection) return;
  
  const url = `${window.location.origin}/collection.html?id=${collectionId}`;
  const text = `🎬 Check out my "${collection.name}" collection on OurShow!\n${collection.description || ''}\n${url}`;
  
  if (navigator.share) {
    navigator.share({ title: collection.name, text, url })
      .catch(() => copyToClipboard(url));
  } else {
    copyToClipboard(url);
    showToast('Collection link copied!');
  }
};

// Share collection in post
function shareCollectionInPost(collectionId) {
  const collection = collections.find(c => c.id === collectionId);
  if (!collection) return;
  
  // Store collection data for post
  const collectionData = {
    id: collection.id,
    name: collection.name,
    description: collection.description,
    itemCount: collection.items?.length || 0,
    items: collection.items || []
  };
  
  // Store in sessionStorage to pass to post page
  sessionStorage.setItem('shareCollection', JSON.stringify(collectionData));
  
  // Redirect to post page
  window.location.href = 'post.html?shareCollection=true';
}

// Edit collection
function editCollection(collectionId) {
  const collection = collections.find(c => c.id === collectionId);
  if (!collection) return;
  
  const newName = prompt('Collection name:', collection.name);
  if (!newName || newName.trim() === '') return;
  
  const newDesc = prompt('Description:', collection.description || '');
  const newVisibility = prompt('Visibility (private/friends/public):', collection.visibility);
  
  if (newVisibility && ['private', 'friends', 'public'].includes(newVisibility.toLowerCase())) {
    collection.visibility = newVisibility.toLowerCase();
  }
  
  collection.name = newName.trim();
  collection.description = newDesc ? newDesc.trim() : '';
  
  saveCollections();
  renderCollections();
  renderCollectionItems(collection);
  
  showToast('✅ Collection updated!');
}

// Delete collection
function deleteCollection(collectionId) {
  if (!confirm('Are you sure you want to delete this collection? This cannot be undone.')) {
    return;
  }
  
  collections = collections.filter(c => c.id !== collectionId);
  saveCollections();
  renderCollections();
  detailModal.classList.add('hidden');
  
  showToast('✅ Collection deleted');
}

// Copy to clipboard
function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Link copied!');
    }).catch(() => {
      fallbackCopy(text);
    });
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
    showToast('Link copied!');
  } catch (e) {
    alert('Failed to copy link');
  }
  document.body.removeChild(textarea);
}

// Show toast notification
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-2xl z-50';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Check for shared collection in URL
function checkSharedCollection() {
  const urlParams = new URLSearchParams(window.location.search);
  const collectionId = urlParams.get('id');
  
  if (collectionId) {
    const collection = collections.find(c => c.id === collectionId);
    if (collection) {
      openCollectionDetail(collectionId);
    }
  }
}

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    init();
    setTimeout(checkSharedCollection, 500);
  });
} else {
  init();
  setTimeout(checkSharedCollection, 500);
}

