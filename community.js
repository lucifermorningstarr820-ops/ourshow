// Import Firebase modules dynamically
let dbMod, authMod;
let firebaseReady = false;
let currentUser = null;
let typingTimeout = null;

// Wait for Firebase to be initialized
async function initFirebase() {
    try {
        // Wait for firebase-config.js to load
        await new Promise(resolve => {
            const checkFirebase = setInterval(() => {
                if (window.dbMod && window.authMod) {
                    clearInterval(checkFirebase);
                    resolve();
                }
            }, 100);
            // Timeout after 5 seconds
            setTimeout(() => {
                clearInterval(checkFirebase);
                resolve();
            }, 5000);
        });

        if (window.dbMod && window.authMod) {
            dbMod = window.dbMod;
            authMod = window.authMod;
            firebaseReady = true;
            console.log('✅ Firebase initialized for community chat');
            
            // Get current user
            const { onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
            onAuthStateChanged(authMod, (user) => {
                currentUser = user;
                updateOnlineCount();
            });
        } else {
            throw new Error('Firebase not available');
        }
    } catch (error) {
        console.warn('⚠️ Firebase unavailable, using localStorage fallback:', error);
        firebaseReady = false;
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Format timestamp
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    
    return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
}

// Get or prompt for username
function getUsername() {
    let username = localStorage.getItem('ourshow_chat_username');
    
    if (!username) {
        showUsernameModal();
        return null;
    }
    
    return username;
}

// Show username modal
function showUsernameModal() {
    const modal = document.getElementById('name-modal');
    const input = document.getElementById('username-input');
    const saveBtn = document.getElementById('save-username');
    
    modal.classList.remove('hidden');
    input.focus();
    
    const saveUsername = () => {
        const name = input.value.trim();
        if (name && name.length >= 2) {
            localStorage.setItem('ourshow_chat_username', name);
            modal.classList.add('hidden');
            initializeChat();
        } else {
            input.classList.add('border-red-500');
            setTimeout(() => input.classList.remove('border-red-500'), 500);
        }
    };
    
    saveBtn.onclick = saveUsername;
    input.onkeypress = (e) => {
        if (e.key === 'Enter') saveUsername();
    };
}

// Create message HTML
function createMessageHtml(message, isOwn = false) {
    const avatar = message.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.username)}&background=6366f1&color=fff`;
    
    return `
        <div class="message-bubble flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}">
            <img src="${avatar}" alt="${escapeHtml(message.username)}" 
                 class="w-10 h-10 rounded-full flex-shrink-0 border-2 border-indigo-500/30"
                 onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(message.username)}&background=6366f1&color=fff'">
            <div class="flex-1 ${isOwn ? 'text-right' : ''}">
                <div class="flex items-baseline gap-2 mb-1 ${isOwn ? 'justify-end' : ''}">
                    <span class="font-semibold text-sm ${isOwn ? 'text-indigo-400' : 'text-purple-400'}">
                        ${escapeHtml(message.username)}
                    </span>
                    <span class="text-xs text-gray-500">
                        ${formatTime(message.timestamp)}
                    </span>
                </div>
                <div class="inline-block px-4 py-2 rounded-2xl ${
                    isOwn 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-gray-800 text-gray-100'
                } max-w-md break-words">
                    ${escapeHtml(message.text)}
                </div>
            </div>
        </div>
    `;
}

// Display message
function displayMessage(message, isOwn = false) {
    const chatDisplay = document.getElementById('chat-display');
    
    // Remove welcome message if exists
    const welcome = chatDisplay.querySelector('.text-center');
    if (welcome) welcome.remove();
    
    const msgDiv = document.createElement('div');
    msgDiv.innerHTML = createMessageHtml(message, isOwn);
    chatDisplay.appendChild(msgDiv);
    
    // Auto-scroll to bottom
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
}

// Send message to Firebase
async function sendMessage(text) {
    const username = getUsername();
    if (!username || !text.trim()) return false;
    
    const message = {
        username: username,
        text: text.trim(),
        timestamp: Date.now(),
        userId: currentUser?.uid || 'anonymous',
        photoURL: currentUser?.photoURL || null
    };
    
    if (firebaseReady) {
        try {
            const { ref, push } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js');
            const messagesRef = ref(dbMod, 'globalChat');
            await push(messagesRef, message);
            return true;
        } catch (error) {
            console.error('❌ Error sending message:', error);
            // Fallback to localStorage
            saveToLocalStorage(message);
            displayMessage(message, true);
            return true;
        }
    } else {
        // localStorage fallback
        saveToLocalStorage(message);
        displayMessage(message, true);
        return true;
    }
}

// Save to localStorage fallback
function saveToLocalStorage(message) {
    try {
        const messages = JSON.parse(localStorage.getItem('ourshow_chat_messages') || '[]');
        messages.push(message);
        // Keep only last 50 messages
        if (messages.length > 50) messages.shift();
        localStorage.setItem('ourshow_chat_messages', JSON.stringify(messages));
    } catch (error) {
        console.error('❌ localStorage error:', error);
    }
}

// Load messages from localStorage
function loadFromLocalStorage() {
    try {
        const messages = JSON.parse(localStorage.getItem('ourshow_chat_messages') || '[]');
        const username = getUsername();
        messages.forEach(msg => {
            displayMessage(msg, msg.username === username);
        });
    } catch (error) {
        console.error('❌ Error loading from localStorage:', error);
    }
}

// Listen to Firebase messages
async function listenToMessages() {
    if (!firebaseReady) {
        loadFromLocalStorage();
        return;
    }
    
    try {
        const { ref, onChildAdded, query, limitToLast } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js');
        const messagesRef = query(ref(dbMod, 'globalChat'), limitToLast(50));
        const username = getUsername();
        
        let isInitialLoad = true;
        const displayedMessages = new Set();
        
        onChildAdded(messagesRef, (snapshot) => {
            const message = snapshot.val();
            const messageKey = snapshot.key;
            
            if (message && !displayedMessages.has(messageKey)) {
                displayedMessages.add(messageKey);
                const isOwn = message.username === username;
                displayMessage(message, isOwn);
                
                // Auto-scroll only on new messages (not initial load)
                if (!isInitialLoad) {
                    const chatDisplay = document.getElementById('chat-display');
                    chatDisplay.scrollTop = chatDisplay.scrollHeight;
                }
            }
        });
        
        // After initial messages loaded, enable auto-scroll
        setTimeout(() => {
            isInitialLoad = false;
        }, 1000);
        
    } catch (error) {
        console.error('❌ Error listening to messages:', error);
        loadFromLocalStorage();
    }
}

// Handle typing indicator
async function handleTyping() {
    const username = getUsername();
    if (!username || !firebaseReady) return;
    
    try {
        const { ref, set, remove, onDisconnect } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js');
        const typingRef = ref(dbMod, `typing/${username}`);
        
        // Clear previous timeout
        if (typingTimeout) clearTimeout(typingTimeout);
        
        // Set typing indicator
        await set(typingRef, true);
        onDisconnect(typingRef).remove();
        
        // Remove after 2 seconds of inactivity
        typingTimeout = setTimeout(async () => {
            await remove(typingRef);
        }, 2000);
    } catch (error) {
        console.error('❌ Error handling typing:', error);
    }
}

// Listen to typing indicators
async function listenToTyping() {
    if (!firebaseReady) return;
    
    try {
        const { ref, onValue } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js');
        const typingRef = ref(dbMod, 'typing');
        const username = getUsername();
        
        onValue(typingRef, (snapshot) => {
            const typing = snapshot.val();
            const typingStatus = document.getElementById('typing-status');
            
            if (!typing) {
                typingStatus.innerHTML = '';
                return;
            }
            
            const typingUsers = Object.keys(typing).filter(u => u !== username);
            
            if (typingUsers.length === 0) {
                typingStatus.innerHTML = '';
            } else if (typingUsers.length === 1) {
                typingStatus.innerHTML = `
                    <span class="flex items-center gap-2">
                        ${escapeHtml(typingUsers[0])} is typing
                        <span class="typing-indicator">
                            <span class="typing-dot"></span>
                            <span class="typing-dot"></span>
                            <span class="typing-dot"></span>
                        </span>
                    </span>
                `;
            } else {
                typingStatus.innerHTML = `
                    <span class="flex items-center gap-2">
                        ${typingUsers.length} people are typing
                        <span class="typing-indicator">
                            <span class="typing-dot"></span>
                            <span class="typing-dot"></span>
                            <span class="typing-dot"></span>
                        </span>
                    </span>
                `;
            }
        });
    } catch (error) {
        console.error('❌ Error listening to typing:', error);
    }
}

// Update online count (mock for now)
function updateOnlineCount() {
    const count = document.getElementById('online-count');
    // Simple mock - in production, use Firebase presence
    const randomCount = Math.floor(Math.random() * 20) + 5;
    count.textContent = randomCount;
}

// Initialize chat
async function initializeChat() {
    const username = getUsername();
    if (!username) return;
    
    // Load messages
    await listenToMessages();
    
    // Listen to typing
    await listenToTyping();
    
    // Update online count periodically
    updateOnlineCount();
    setInterval(updateOnlineCount, 30000);
}

// Setup UI event listeners
function setupEventListeners() {
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const charCount = document.getElementById('char-count');
    
    // Character counter
    messageInput.addEventListener('input', () => {
        const length = messageInput.value.length;
        charCount.textContent = `${length}/500`;
        handleTyping();
    });
    
    // Send message
    const sendMessageHandler = async () => {
        const text = messageInput.value.trim();
        if (!text) return;
        
        sendBtn.disabled = true;
        const success = await sendMessage(text);
        
        if (success) {
            messageInput.value = '';
            charCount.textContent = '0/500';
        }
        
        sendBtn.disabled = false;
        messageInput.focus();
    };
    
    sendBtn.addEventListener('click', sendMessageHandler);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessageHandler();
        }
    });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', async () => {
    await initFirebase();
    setupEventListeners();
    
    const username = getUsername();
    if (username) {
        await initializeChat();
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', async () => {
    if (firebaseReady) {
        try {
            const username = getUsername();
            if (username) {
                const { ref, remove } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js');
                const typingRef = ref(dbMod, `typing/${username}`);
                await remove(typingRef);
            }
        } catch (error) {
            console.error('❌ Error on cleanup:', error);
        }
    }
});