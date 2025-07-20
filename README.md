# Firebase Chat Application

A modern, real-time chat application built with vanilla HTML, CSS, and JavaScript, designed to be hosted on GitHub Pages.

## Features

- 🔐 **Authentication**: Email/password login and signup
- 💬 **Real-time Chat**: Instant messaging between users
- 👥 **User Management**: See online/offline status and user lists
- 📱 **Responsive Design**: Works on mobile and desktop
- 🎨 **Modern UI**: Clean, professional design with animations
- ⚡ **Fast & Lightweight**: No frameworks, just vanilla JavaScript

## Live Demo

Visit the live application: [Your GitHub Pages URL]

## Setup Instructions

### 1. Fork/Clone this repository

```bash
git clone https://github.com/yourusername/firebase-chat-app.git
cd firebase-chat-app
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Enable Authentication with Email/Password
4. Create a Firestore database
5. Get your Firebase configuration

### 3. Update Firebase Configuration

Edit `app.js` and replace the Firebase configuration:

```javascript
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};
```

### 4. Deploy to GitHub Pages

1. Push your code to GitHub
2. Go to repository Settings > Pages
3. Select source branch (usually `main`)
4. Your app will be available at `https://yourusername.github.io/firebase-chat-app`

## Firestore Security Rules

Add these security rules to your Firestore database:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null;
    }
    
    // Chat messages
    match /chats/{chatId}/messages/{messageId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## File Structure

```
├── index.html          # Main HTML file
├── styles.css          # All CSS styles
├── app.js             # Main JavaScript application
└── README.md          # This file
```

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for personal or commercial purposes.