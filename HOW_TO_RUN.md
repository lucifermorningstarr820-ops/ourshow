# How to Run OurShow Locally

## ✅ Quick Start (Recommended)

### Option 1: Using Python (Easiest)
```bash
# Navigate to project directory
cd d:\ourshow

# Python 3
python -m http.server 8000

# Then open: http://localhost:8000
```

### Option 2: Using Node.js
```bash
# Install http-server globally (one time only)
npm install -g http-server

# Run server
cd d:\ourshow
http-server -p 8000

# Then open: http://localhost:8000
```

### Option 3: Using VS Code Live Server
1. Install "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"
4. Site will open automatically at `http://127.0.0.1:5500`

## ⚠️ Why You Need a Local Server

Opening `index.html` directly (as `file:///`) causes these issues:
- ❌ **CORS Errors** - Firebase won't work
- ❌ **PWA Features Disabled** - Can't install as app
- ❌ **Module Loading Issues** - ES6 imports fail
- ❌ **API Calls Blocked** - TMDB and Gemini APIs won't work

## 🚀 Recommended Development Setup

1. **Install VS Code** (if not already installed)
2. **Install Live Server Extension**
3. **Open project folder** in VS Code
4. **Right-click index.html** → "Open with Live Server"

This provides:
- ✅ Auto-reload on file changes
- ✅ Proper CORS handling
- ✅ Full Firebase support
- ✅ All API calls working

## 📱 Testing PWA Features

After running with a local server:
1. Open DevTools (F12)
2. Go to "Application" tab
3. Check "Service Workers" - should register
4. Check "Manifest" - should show app details
5. Try "Add to Home Screen" in browser menu

## 🔥 Firebase Configuration

Make sure you have:
1. `firebase-config.js` with your Firebase credentials
2. `config.js` with TMDB and Gemini API keys
3. Internet connection for API calls

## 🎬 First Time Setup

1. **Start local server** (see options above)
2. **Open** `http://localhost:8000` (or your server URL)
3. **Sign in or continue as guest**
4. **Browse movies and series!**

## 🐛 Troubleshooting

### "Firebase not loading"
- Make sure you're using `http://localhost`, not `file:///`
- Check `firebase-config.js` exists and has valid credentials

### "No movies showing"
- Check browser console (F12) for errors
- Verify `config.js` has valid TMDB API key
- Check internet connection

### "Page loads but looks broken"
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+F5)
- Check if Tailwind CSS is loading from CDN

## 📝 Notes

- **Guest Mode**: Works without Firebase account
- **Full Features**: Require Firebase authentication
- **API Keys**: Required for TMDB (movies) and Gemini (AI)
- **Internet**: Required for CDN resources and APIs

---

**Need Help?** Check the console (F12) for error messages!
