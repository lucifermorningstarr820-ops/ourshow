import { waitForFirebase } from './firebase-config.js';

const displayNameInput = document.getElementById('display-name');
const emailInput = document.getElementById('email');
const profilePic = document.getElementById('profile-pic');
const fileInput = document.getElementById('pic-upload');
const statusMsg = document.getElementById('status-msg');
const statWatchlist = document.getElementById('stat-watchlist');
const statReviews = document.getElementById('stat-reviews');
const saveBtn = document.getElementById('save-profile');

const state = {
  auth: null,
  db: null,
  storage: null,
  storageRef: null,
  uploadBytes: null,
  getDownloadURL: null,
  ref: null,
  get: null,
  update: null,
  pendingFile: null,
  currentUser: null,
  updateProfileFn: null
};

function updateStatus(message, tone = 'info') {
  if (!statusMsg) return;
  const toneClasses = {
    info: 'text-gray-400',
    success: 'text-green-400',
    error: 'text-red-400'
  };
  statusMsg.classList.remove('text-gray-400', 'text-green-400', 'text-red-400');
  statusMsg.classList.add(toneClasses[tone] || 'text-gray-400');
  statusMsg.textContent = message;
  if (tone !== 'error') {
    setTimeout(() => {
      if (statusMsg.textContent === message) statusMsg.textContent = '';
    }, 3000);
  }
}

function hydrateFromLocalFallback() {
  const saved = JSON.parse(localStorage.getItem('ourshow_user') || 'null');
  if (!saved) return;
  displayNameInput.value = saved.name || '';
  emailInput.value = saved.email || '';
  profilePic.src = saved.photo || 'https://via.placeholder.com/100';
}

function bindFileInput() {
  if (!fileInput) return;
  fileInput.addEventListener('change', (evt) => {
    const file = evt.target.files?.[0];
    if (!file) return;
    state.pendingFile = file;
    const preview = new FileReader();
    preview.onload = (event) => {
      profilePic.src = event.target?.result || profilePic.src;
    };
    preview.readAsDataURL(file);
  });
}

async function saveProfile() {
  if (!saveBtn) return;
  if (saveBtn.dataset.loading === 'true') return;
  saveBtn.dataset.loading = 'true';
  saveBtn.textContent = 'Saving...';

  const newName = displayNameInput.value.trim();
  let newPhoto = profilePic.src;

  try {
    if (state.currentUser) {
      if (state.pendingFile && state.storage && state.storageRef && state.uploadBytes && state.getDownloadURL) {
        const avatarRef = state.storageRef(state.storage, `avatars/${state.currentUser.uid}/${Date.now()}_${state.pendingFile.name}`);
        const snap = await state.uploadBytes(avatarRef, state.pendingFile);
        newPhoto = await state.getDownloadURL(snap.ref);
        state.pendingFile = null;
      }

      if (state.updateProfileFn) {
        await state.updateProfileFn(state.currentUser, {
        displayName: newName || state.currentUser.displayName,
        photoURL: newPhoto || state.currentUser.photoURL
        });
      }

      const profileRecord = {
        uid: state.currentUser.uid,
        name: newName || state.currentUser.displayName || state.currentUser.email,
        email: state.currentUser.email,
        photo: newPhoto || state.currentUser.photoURL || ''
      };

      localStorage.setItem('ourshow_user', JSON.stringify(profileRecord));
      localStorage.setItem('ourshow_uid', profileRecord.uid);
      localStorage.setItem('ourshow_username', profileRecord.name);

      if (state.db && state.update && state.ref) {
        await state.update(state.ref(state.db, `ourshow/users/${state.currentUser.uid}`), {
          name: profileRecord.name,
          email: profileRecord.email,
          photo: profileRecord.photo,
          lastUpdated: Date.now()
        });
      }

      updateStatus('✅ Profile updated successfully!', 'success');
    } else {
      const guestProfile = {
        uid: 'guest',
        name: newName || 'Guest',
        email: emailInput.value || '',
        photo: newPhoto || 'https://via.placeholder.com/100'
      };
      localStorage.setItem('ourshow_user', JSON.stringify(guestProfile));
      localStorage.setItem('ourshow_username', guestProfile.name);
      updateStatus('✅ Profile saved locally.', 'success');
    }
  } catch (error) {
    console.error('Profile save failed:', error);
    updateStatus('❌ Unable to save profile. Please try again.', 'error');
  } finally {
    saveBtn.dataset.loading = 'false';
    saveBtn.textContent = 'Save Changes';
  }
}

async function loadStats(uid) {
  if (!uid || !state.db || !state.get || !state.ref) return;
  try {
    const watchlistSnap = await state.get(state.ref(state.db, `ourshow/users/${uid}/watchlist`));
    const watchCount = watchlistSnap.exists() ? Object.keys(watchlistSnap.val()).length : 0;
    statWatchlist.textContent = watchCount;

    const reviewsSnap = await state.get(state.ref(state.db, `ourshow/reviews`));
    let reviewCount = 0;
    if (reviewsSnap.exists()) {
      reviewsSnap.forEach((movieNode) => {
        movieNode.forEach((reviewNode) => {
          if (reviewNode.val().userId === uid) reviewCount++;
        });
      });
    }
    statReviews.textContent = reviewCount;
  } catch (error) {
    console.error('Stats error:', error);
  }
}

function bindSaveButton() {
  saveBtn?.addEventListener('click', saveProfile);
}

function exposeLogout(signOutFn) {
  window.logout = async function logout() {
    try {
      await signOutFn(state.auth);
    } catch (error) {
      console.warn('Primary sign out failed, falling back to local clear.', error);
    } finally {
      localStorage.removeItem('ourshow_user');
      localStorage.removeItem('ourshow_username');
      localStorage.removeItem('ourshow_uid');
      window.location.href = 'login.html';
    }
  };
}

async function initProfilePage() {
  updateStatus('Loading profile...', 'info');
  try {
    await waitForFirebase();
  } catch (error) {
    console.error('Firebase bootstrap failed:', error);
    updateStatus('⚠️ Limited mode: offline profile only.', 'error');
  }

  const [authModule, dbModule, storageModule] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js'),
    import('https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js'),
    import('https://www.gstatic.com/firebasejs/12.6.0/firebase-storage.js')
  ]);

  state.auth = window.authMod || authModule.getAuth();
  state.db = window.dbMod || dbModule.getDatabase();
  state.storage = storageModule.getStorage();
  state.storageRef = storageModule.ref;
  state.uploadBytes = storageModule.uploadBytes;
  state.getDownloadURL = storageModule.getDownloadURL;
  state.ref = dbModule.ref;
  state.get = dbModule.get;
  state.update = dbModule.update;
  state.updateProfileFn = authModule.updateProfile;

  try {
    await authModule.setPersistence(state.auth, authModule.browserLocalPersistence);
  } catch (error) {
    console.warn('Persistence setup skipped:', error);
  }

  bindFileInput();
  bindSaveButton();
  exposeLogout(authModule.signOut);

  authModule.onAuthStateChanged(state.auth, (user) => {
    state.currentUser = user;
    if (user) {
      displayNameInput.value = user.displayName || '';
      emailInput.value = user.email || '';
      profilePic.src = user.photoURL || 'https://via.placeholder.com/100';
      const profileRecord = {
        uid: user.uid,
        name: user.displayName || user.email,
        email: user.email,
        photo: user.photoURL || ''
      };
      localStorage.setItem('ourshow_user', JSON.stringify(profileRecord));
      localStorage.setItem('ourshow_uid', profileRecord.uid);
      localStorage.setItem('ourshow_username', profileRecord.name);
      if (state.db && state.update && state.ref) {
        state.update(state.ref(state.db, `ourshow/users/${user.uid}`), {
          name: profileRecord.name,
          email: profileRecord.email,
          photo: profileRecord.photo,
          lastSeen: Date.now()
        }).catch(() => {});
      }
      loadStats(user.uid);
      updateStatus('Signed in ✓', 'success');
    } else {
      hydrateFromLocalFallback();
      updateStatus('Editing in guest mode. Sign in to sync changes.', 'info');
    }
  });
}

document.addEventListener('DOMContentLoaded', initProfilePage);

