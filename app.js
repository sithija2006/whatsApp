// Firebase imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
    getFirestore,
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    doc,
    setDoc,
    getDoc,
    where,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBP-3uuExD9_zmOHyBdamjCNOaxXkhQKNo",
  authDomain: "whatsapp-8a128.firebaseapp.com",
  projectId: "whatsapp-8a128",
  storageBucket: "whatsapp-8a128.firebasestorage.app",
  messagingSenderId: "276452175533",
  appId: "1:276452175533:web:3c93881ca04fd19504e024",
  measurementId: "G-JXFZ6H435V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Global state
let currentUser = null;
let selectedUser = null;
let usersUnsubscribe = null;
let messagesUnsubscribe = null;
let isSignupMode = false;

// DOM elements
const loadingScreen = document.getElementById('loading');
const loginScreen = document.getElementById('loginScreen');
const chatScreen = document.getElementById('chatScreen');
const authForm = document.getElementById('authForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const authButton = document.getElementById('authButton');
const authButtonText = document.getElementById('authButtonText');
const authButtonSpinner = document.getElementById('authButtonSpinner');
const switchAuth = document.getElementById('switchAuth');
const loginTitle = document.getElementById('loginTitle');
const loginSubtitle = document.getElementById('loginSubtitle');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const currentUserEmail = document.getElementById('currentUserEmail');
const logoutButton = document.getElementById('logoutButton');
const usersList = document.getElementById('usersList');
const userCount = document.getElementById('userCount');
const welcomeMessage = document.getElementById('welcomeMessage');
const chatWindow = document.getElementById('chatWindow');
const chatUserName = document.getElementById('chatUserName');
const chatUserStatus = document.getElementById('chatUserStatus');
const messagesContainer = document.getElementById('messagesContainer');
const messagesLoading = document.getElementById('messagesLoading');
const messagesList = document.getElementById('messagesList');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const backButton = document.getElementById('backButton');
const sidebar = document.getElementById('sidebar');
const mobileOverlay = document.getElementById('mobileOverlay');

// Utility functions
function showScreen(screenElement) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    loadingScreen.classList.add('hidden');
    screenElement.classList.remove('hidden');
}

function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
}

function hideError() {
    errorMessage.classList.add('hidden');
}

function setLoading(isLoading) {
    authButton.disabled = isLoading;
    if (isLoading) {
        authButtonText.classList.add('hidden');
        authButtonSpinner.classList.remove('hidden');
    } else {
        authButtonText.classList.remove('hidden');
        authButtonSpinner.classList.add('hidden');
    }
}

function toggleAuthMode() {
    isSignupMode = !isSignupMode;
    if (isSignupMode) {
        loginTitle.textContent = 'Create Account';
        loginSubtitle.textContent = 'Sign up to start chatting';
        authButtonText.textContent = 'Create Account';
        switchAuth.textContent = 'Already have an account? Sign in';
    } else {
        loginTitle.textContent = 'Welcome Back';
        loginSubtitle.textContent = 'Sign in to your account';
        authButtonText.textContent = 'Sign In';
        switchAuth.textContent = "Don't have an account? Sign up";
    }
    hideError();
}

function getChatRoomId(uid1, uid2) {
    return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
}

function formatTime(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatLastSeen(timestamp) {
    if (!timestamp) return 'Never';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function closeMobileSidebar() {
    sidebar.classList.remove('mobile-open');
    mobileOverlay.classList.add('hidden');
}

function openMobileSidebar() {
    sidebar.classList.add('mobile-open');
    mobileOverlay.classList.remove('hidden');
}

// Authentication functions
async function handleAuth(email, password) {
    try {
        setLoading(true);
        hideError();

        if (isSignupMode) {
            await createUserWithEmailAndPassword(auth, email, password);
        } else {
            await signInWithEmailAndPassword(auth, email, password);
        }
    } catch (error) {
        console.error('Auth error:', error);
        let errorMsg = 'An error occurred. Please try again.';
        
        switch (error.code) {
            case 'auth/user-not-found':
                errorMsg = 'No account found with this email.';
                break;
            case 'auth/wrong-password':
                errorMsg = 'Incorrect password.';
                break;
            case 'auth/email-already-in-use':
                errorMsg = 'An account with this email already exists.';
                break;
            case 'auth/weak-password':
                errorMsg = 'Password should be at least 6 characters.';
                break;
            case 'auth/invalid-email':
                errorMsg = 'Please enter a valid email address.';
                break;
            case 'auth/too-many-requests':
                errorMsg = 'Too many failed attempts. Please try again later.';
                break;
        }
        
        showError(errorMsg);
    } finally {
        setLoading(false);
    }
}

async function handleLogout() {
    try {
        if (currentUser) {
            // Set user offline
            const userRef = doc(db, 'users', currentUser.uid);
            await setDoc(userRef, {
                online: false,
                lastSeen: serverTimestamp()
            }, { merge: true });
        }
        
        // Clean up listeners
        if (usersUnsubscribe) usersUnsubscribe();
        if (messagesUnsubscribe) messagesUnsubscribe();
        
        await signOut(auth);
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// User management functions
async function saveUserToFirestore(user) {
    try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        const userData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email.split('@')[0],
            online: true,
            lastSeen: serverTimestamp()
        };

        if (!userSnap.exists()) {
            await setDoc(userRef, userData);
        } else {
            await setDoc(userRef, {
                online: true,
                lastSeen: serverTimestamp()
            }, { merge: true });
        }
    } catch (error) {
        console.error('Error saving user:', error);
    }
}

function loadUsers() {
    if (!currentUser) return;

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('uid', '!=', currentUser.uid));

    usersUnsubscribe = onSnapshot(q, (snapshot) => {
        const users = [];
        snapshot.forEach((doc) => {
            users.push({ id: doc.id, ...doc.data() });
        });

        renderUsers(users);
    }, (error) => {
        console.error('Error loading users:', error);
        renderUsersError();
    });
}

function renderUsers(users) {
    userCount.textContent = users.length;

    if (users.length === 0) {
        usersList.innerHTML = `
            <div class="no-users">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <h4>No users found</h4>
                <p>Invite friends to start chatting!</p>
            </div>
        `;
        return;
    }

    usersList.innerHTML = users.map(user => `
        <div class="user-item ${selectedUser?.uid === user.uid ? 'active' : ''}" 
             data-user-id="${user.uid}" 
             data-user-name="${user.displayName}" 
             data-user-email="${user.email}"
             data-user-online="${user.online}"
             data-user-last-seen="${user.lastSeen?.seconds || 0}">
            <div class="user-item-avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                </svg>
                <div class="user-status-indicator ${user.online ? 'online' : 'offline'}"></div>
            </div>
            <div class="user-item-info">
                <h4>${user.displayName}</h4>
                <p>${user.online ? 'Online' : `Last seen ${formatLastSeen(user.lastSeen)}`}</p>
            </div>
        </div>
    `).join('');

    // Add click listeners
    document.querySelectorAll('.user-item').forEach(item => {
        item.addEventListener('click', () => {
            const userData = {
                uid: item.dataset.userId,
                displayName: item.dataset.userName,
                email: item.dataset.userEmail,
                online: item.dataset.userOnline === 'true',
                lastSeen: new Date(parseInt(item.dataset.userLastSeen) * 1000)
            };
            selectUser(userData);
        });
    });
}

function renderUsersError() {
    usersList.innerHTML = `
        <div class="no-users">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <h4>Error loading users</h4>
            <p>Please check your connection and try again.</p>
        </div>
    `;
}

function selectUser(user) {
    selectedUser = user;
    
    // Update UI
    document.querySelectorAll('.user-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-user-id="${user.uid}"]`)?.classList.add('active');
    
    // Show chat window
    welcomeMessage.classList.add('hidden');
    chatWindow.classList.remove('hidden');
    
    // Update chat header
    chatUserName.textContent = user.displayName;
    chatUserStatus.textContent = user.online ? 'Online' : `Last seen ${formatLastSeen(user.lastSeen)}`;
    
    // Load messages
    loadMessages();
    
    // Close mobile sidebar
    closeMobileSidebar();
}

// Message functions
function loadMessages() {
    if (!currentUser || !selectedUser) return;

    // Clean up previous listener
    if (messagesUnsubscribe) messagesUnsubscribe();

    const chatRoomId = getChatRoomId(currentUser.uid, selectedUser.uid);
    const messagesRef = collection(db, 'chats', chatRoomId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    messagesLoading.classList.remove('hidden');
    messagesList.innerHTML = '';

    messagesUnsubscribe = onSnapshot(q, (snapshot) => {
        messagesLoading.classList.add('hidden');
        
        const messages = [];
        snapshot.forEach((doc) => {
            messages.push({ id: doc.id, ...doc.data() });
        });

        renderMessages(messages);
    }, (error) => {
        console.error('Error loading messages:', error);
        messagesLoading.classList.add('hidden');
        renderMessagesError();
    });
}

function renderMessages(messages) {
    if (messages.length === 0) {
        messagesList.innerHTML = `
            <div class="no-messages">
                <h4>No messages yet</h4>
                <p>Start the conversation!</p>
            </div>
        `;
        return;
    }

    messagesList.innerHTML = messages.map(message => {
        const isSent = message.uid === currentUser.uid;
        return `
            <div class="message ${isSent ? 'sent' : 'received'}">
                <div class="message-text">${escapeHtml(message.text)}</div>
                <div class="message-time">${formatTime(message.timestamp)}</div>
            </div>
        `;
    }).join('');

    setTimeout(scrollToBottom, 100);
}

function renderMessagesError() {
    messagesList.innerHTML = `
        <div class="no-messages">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <h4>Error loading messages</h4>
            <p>Please check your connection and try again.</p>
        </div>
    `;
}

async function sendMessage(text) {
    if (!currentUser || !selectedUser || !text.trim()) return;

    try {
        const chatRoomId = getChatRoomId(currentUser.uid, selectedUser.uid);
        const messagesRef = collection(db, 'chats', chatRoomId, 'messages');

        await addDoc(messagesRef, {
            text: text.trim(),
            uid: currentUser.uid,
            senderEmail: currentUser.email,
            timestamp: serverTimestamp()
        });

        messageInput.value = '';
    } catch (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message. Please try again.');
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Event listeners
authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (email && password) {
        handleAuth(email, password);
    }
});

switchAuth.addEventListener('click', toggleAuthMode);

logoutButton.addEventListener('click', handleLogout);

messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (text) {
        sendMessage(text);
    }
});

backButton.addEventListener('click', () => {
    welcomeMessage.classList.remove('hidden');
    chatWindow.classList.add('hidden');
    selectedUser = null;
    
    // Update user list active state
    document.querySelectorAll('.user-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Clean up messages listener
    if (messagesUnsubscribe) messagesUnsubscribe();
});

mobileOverlay.addEventListener('click', closeMobileSidebar);

// Auth state listener
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        currentUserEmail.textContent = user.email;
        
        // Save user to Firestore
        await saveUserToFirestore(user);
        
        // Load users
        loadUsers();
        
        // Show chat screen
        showScreen(chatScreen);
    } else {
        currentUser = null;
        selectedUser = null;
        
        // Clean up listeners
        if (usersUnsubscribe) usersUnsubscribe();
        if (messagesUnsubscribe) messagesUnsubscribe();
        
        // Show login screen
        showScreen(loginScreen);
    }
});

// Handle page visibility for online status
document.addEventListener('visibilitychange', async () => {
    if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        if (document.hidden) {
            // User is leaving/minimizing
            await setDoc(userRef, {
                online: false,
                lastSeen: serverTimestamp()
            }, { merge: true });
        } else {
            // User is back
            await setDoc(userRef, {
                online: true,
                lastSeen: serverTimestamp()
            }, { merge: true });
        }
    }
});

// Handle beforeunload for cleanup
window.addEventListener('beforeunload', async () => {
    if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        await setDoc(userRef, {
            online: false,
            lastSeen: serverTimestamp()
        }, { merge: true });
    }
});

// Initialize app
console.log('Firebase Chat App initialized');
setTimeout(() => {
    if (loadingScreen && !loadingScreen.classList.contains('hidden')) {
        showScreen(loginScreen);
    }
}, 2000);
