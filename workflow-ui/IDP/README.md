# ⚡ Quick Start Guide

Get the Document Processing Queue up and running in 5 minutes!

## 🎯 Prerequisites Check

```bash
# Check Node.js (need v18+)
node --version

# Check npm (need v9+)
npm --version
```

Don't have Node.js? Download it from [nodejs.org](https://nodejs.org/)

## 🚀 Quick Setup

### Step 1: Install Dependencies
```bash
npm install
```

**Expected output:**
```
added XXX packages in XXs
```

### Step 2: Start Development Server
```bash
npm run dev
```

**Expected output:**
```
  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Step 3: Open in Browser
```
http://localhost:5173
```

## ✅ You Should See

1. **Dashboard Header**: "Document Processing Queue"
2. **Two Tabs**: 
   - Open Queue Window
   - My Queue Window
3. **Data Tables**: With sample data loaded from JSON files

## 📦 What's Included

### Components Ready to Use
- ✅ **OpenQueue** - 12 sample documents with filters
- ✅ **MyQueue** - 12 sample submissions with navigation
- ✅ **DocumentUploaded** - 7 sample documents with actions

### Sample Data
- `/public/data/openQueueData.json`
- `/public/data/myQueueData.json`
- `/public/data/documentUploadedData.json`

## 🎨 Test the Features

### Test Search
1. Go to Open Queue tab
2. Type in search box: "Acme"
3. See filtered results

### Test Filters
1. Click "Status" dropdown
2. Select "Pending Review"
3. See filtered data

### Test Pagination
1. Click page numbers at bottom
2. Navigate between pages
3. Try Previous/Next buttons

### Test Navigation
1. Go to My Queue tab
2. Click any Submission ID (blue link)
3. Navigate to Document Upload page

## 🔧 Common Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Check for linting errors
npm run lint
```

## 🚢 Quick Deploy

### Deploy to Vercel (Easiest)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

Follow the prompts, and you're live in ~2 minutes!

### Deploy to Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

## 🎯 Next Steps

### 1. Connect to Your API
Replace JSON imports with API calls:

```typescript
// Before
import openQueueData from './data/openQueueData.json';

// After
const fetchData = async () => {
  const response = await fetch('https://your-api.com/queue/open');
  return await response.json();
};
```

### 2. Add Authentication
Update `routePaths.ts` and add login component:
```typescript
export const ROUTE_PATHS = {
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  // ... other routes
}
```

### 3. Customize Styling
Edit Tailwind classes in components:
```tsx
// Change primary color from blue to your brand color
className="bg-blue-600" → className="bg-purple-600"
```

### 4. Add More Features
- Export to CSV/Excel
- Bulk actions
- Real-time updates
- Notifications

## 🐛 Troubleshooting

### Problem: Port 5173 is already in use
```bash
# Solution: Use different port
npm run dev -- --port 3000
```

### Problem: Module not found
```bash
# Solution: Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Problem: White screen on load
```bash
# Solution: Clear cache and rebuild
rm -rf node_modules/.vite
npm run dev
```

### Problem: TypeScript errors
```bash
# Solution: TypeScript is set to non-strict mode
# No action needed unless you want strict checking
```

## 📚 Learn More

- [Full README](./README.md) - Complete documentation
- [Routing Guide](./ROUTING_GUIDE.md) - Navigation setup
- [Component Docs](./components/) - Individual component docs

## 💡 Pro Tips

1. **Hot Reload**: Edit any component and see changes instantly
2. **Browser DevTools**: React DevTools extension is recommended
3. **VS Code Extensions**: 
   - ESLint
   - Prettier
   - Tailwind CSS IntelliSense
4. **Data Files**: Edit JSON files in `/public/data/` to change sample data

## 🎉 You're All Set!

Your document processing queue is running. Happy coding! 🚀

---

Need help? Check the [full documentation](./README.md) or open an issue.