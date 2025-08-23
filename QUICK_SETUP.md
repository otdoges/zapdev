# 🚀 Quick Setup Guide - Fix AI Issues NOW

## 🎯 The Problem
Your AI isn't working because the `.env.local` file has placeholder values instead of real API keys.

## ⚡ Quick Fix (5 minutes)

### 1. Get Your Groq API Key (FREE - Required for AI)
1. Visit [https://console.groq.com](https://console.groq.com)
2. Sign up with your email (it's free!)
3. Go to **API Keys** section
4. Click **"Create API Key"**
5. Copy the key (starts with `gsk_`)

### 2. Get Your E2B API Key (FREE - Required for code execution)
1. Visit [https://e2b.dev](https://e2b.dev)
2. Sign up with your email (free 100 hours/month!)
3. Go to **Dashboard** → **API Keys**
4. Create a new API key
5. Copy the key (starts with `e2b_`)

### 3. Update Your .env.local File
Open `.env.local` and replace the placeholder values:

```env
# Replace this line:
VITE_GROQ_API_KEY=

# With your actual key:
VITE_GROQ_API_KEY=gsk_your_actual_key_here

# Replace this line:
VITE_E2B_API_KEY=e2b_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# With your actual key:
VITE_E2B_API_KEY=e2b_your_actual_key_here
```

### 4. Restart Your Server
In your terminal, press `Ctrl+C` to stop the server, then run:
```bash
bun run dev
```

## ✅ Test It Works
1. Open your app in the browser
2. Start a new chat
3. Ask: "Write a JavaScript function to calculate fibonacci numbers"
4. The AI should respond with code
5. Click the "Run" button to execute the code

## 🆘 Still Having Issues?
Run the diagnostic script:
```bash
bun run scripts/setup-env.js
```

This will test your API keys and help debug any remaining issues.

## 🎉 What's Fixed
- ✅ AI responses will work
- ✅ Code generation will work  
- ✅ Code execution will work
- ✅ All chat features enabled

## ⏰ Time Investment
- Groq signup: 2 minutes
- E2B signup: 2 minutes  
- Updating .env.local: 1 minute
- **Total: 5 minutes**

## 💰 Cost
- **Groq**: FREE (generous free tier)
- **E2B**: FREE (100 hours/month)
- **Total: $0**

Get your keys now and enjoy amazing AI-powered development! 🚀