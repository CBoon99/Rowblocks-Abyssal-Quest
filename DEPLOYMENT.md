# 🚀 Deployment Guide - Netlify

## Quick Deploy Steps

### Option 1: Deploy via Netlify UI (Easiest!)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Rowblocks game"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Deploy on Netlify:**
   - Go to [netlify.com](https://netlify.com)
   - Sign up/login
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub
   - Select your repository
   - **Build settings:**
     - Build command: (leave empty)
     - Publish directory: `.` (current directory)
   - Click "Deploy site"

3. **Done!** Your game will be live at `your-site-name.netlify.app`

---

### Option 2: Deploy via Netlify CLI

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login:**
   ```bash
   netlify login
   ```

3. **Deploy:**
   ```bash
   netlify deploy --prod
   ```

---

## Important Notes

✅ **No build step needed** - Your game is pure HTML/CSS/JS
✅ **All files are ready** - Just push and deploy
✅ **netlify.toml is configured** - Handles routing automatically

---

## After Deployment

- Your game will be live immediately
- You can set a custom domain in Netlify settings
- Updates: Just push to GitHub, Netlify auto-deploys!

---

## Troubleshooting

**If you get 404 errors:**
- Make sure `netlify.toml` redirects are working
- Check that `index.html` is in the root directory

**If assets don't load:**
- Make sure all file paths are relative (not absolute)
- Check browser console for errors

---

## File Structure (for reference)

```
Rowblocks-Abyssal Quest/
├── index.html          ← Entry point
├── css/
│   ├── main.css
│   └── ui.css
├── js/
│   ├── main.js
│   ├── entities/
│   ├── effects/
│   └── ...
├── netlify.toml        ← Netlify config
└── .gitignore          ← Git ignore file
```

---

**That's it! Your game is ready to deploy!** 🎮✨
