# 🛒 ShukList - The Waze of Shopping

**Community-powered grocery price comparison platform for saving money on local shopping.**

ShukList helps you compare real supermarket prices in your area, discover the best deals, and save money on groceries with community-powered price tracking.

---

## 🎯 Features (Week 1 - MVP Foundation)

### ✅ Completed
- **User Authentication** - Email/password + Google OAuth
- **Smart Town Selection** - Auto-select nearby towns for notifications
- **Barcode Scanning** - Scan products with your phone camera
- **Open Food Facts Integration** - Auto-fill product data from barcode
- **Store Management** - View stores by town, add new stores
- **Orange Theme** - Claude-inspired branding (#CC785C)
- **Mobile-First Design** - Optimized for in-store use
- **Dashboard** - Quick stats and actions

### 🚧 Coming Next (Week 2-5)
- Price entry and management
- Shopping lists with price comparison
- Push notifications for promotions
- Admin panel
- Price verification system
- €/kg auto-conversion
- Split shopping recommendations

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- GitHub account
- Supabase account (free tier)
- Vercel account (free tier, optional for deployment)

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd shuklist
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to initialize (~2 minutes)
3. Go to **SQL Editor** in Supabase dashboard
4. Copy the contents of `supabase/schema.sql`
5. Paste and run the SQL to create all tables, indexes, and initial data

### 4. Get Supabase Credentials

1. In Supabase dashboard, go to **Settings > API**
2. Copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

### 5. Configure Environment Variables

```bash
# Copy the example file
cp .env.local.example .env.local

# Edit .env.local and add your Supabase credentials
```

Your `.env.local` should look like:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 6. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 7. Test the App

1. **Sign Up** - Create an account with your name, email, and town
2. **Scan a Product** - Click "Scan Product" and test barcode scanning
3. **Add a Store** - Go to Stores and try adding a new store

---

## 📱 Testing Barcode Scanner

The barcode scanner works in modern browsers:

- ✅ **Chrome/Edge** (Android, Desktop, iOS Safari)
- ✅ **Firefox** (Android, Desktop)
- ✅ **Safari** (iOS 14.3+, macOS)

**To test:**
1. Open the app on your phone
2. Sign in
3. Go to Dashboard → "Scan Product"
4. Point camera at any product barcode
5. Product info should auto-fill

**Note:** Camera access requires HTTPS (works on localhost for testing).

---

## 🚀 Deploy to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit - ShukList MVP"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **New Project**
3. Import your GitHub repository
4. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click **Deploy**

Your app will be live at `https://shuklist.vercel.app` (or similar)!

---

## 📊 Database Schema

### Tables
- **users** - User profiles with town and notification preferences
- **stores** - Supermarkets with name and town
- **products** - Products with barcode, name, brand, category
- **prices** - Prices per product/store with promotion tracking
- **shopping_lists** - User shopping lists
- **shopping_list_items** - Items in shopping lists
- **notifications** - User notifications
- **price_flags** - Report incorrect prices

### Initial Stores (Pre-loaded)
- PAM - Grottaminarda
- Eurospin - Grottaminarda
- MD - Grottaminarda
- Conad - Grottaminarda
- GranRisparmio - Villanova del Battista

---

## 🎨 Tech Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Barcode Scanning:** @zxing/library + Open Food Facts API
- **Hosting:** Vercel (free tier)
- **Notifications:** Web Push API (coming in Week 3)

---

## 📁 Project Structure

```
shuklist/
├── app/                      # Next.js app directory
│   ├── auth/                 # Authentication pages
│   ├── dashboard/            # Main app (protected)
│   └── api/                  # API routes
├── components/
│   ├── ui/                   # Reusable UI components
│   └── features/             # Feature-specific components
│       ├── products/         # Product management
│       ├── prices/           # Price management
│       ├── stores/           # Store management
│       ├── shopping-lists/   # Shopping lists
│       └── notifications/    # Notifications
├── lib/
│   ├── supabase/             # Supabase clients
│   └── utils/                # Utility functions
├── types/                    # TypeScript types
└── supabase/                 # Database schema
```

---

## 🛠️ Development

### Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Adding Your First Admin User

After signing up, make yourself an admin:

1. Go to Supabase dashboard
2. Open **Table Editor** → **users**
3. Find your user record
4. Change `role` from `user` to `admin`
5. Refresh the app - you'll now have admin features

---

## 🗺️ Roadmap

### Week 1 (Current) ✅
- Authentication system
- Barcode scanning
- Store management
- Dashboard foundation

### Week 2 📍
- Price entry and management
- Product management
- Photo upload
- Manual product entry

### Week 3 📍
- Shopping lists
- Price comparison algorithm
- "Best store" recommendations
- Split shopping suggestions

### Week 4 📍
- Push notifications
- In-app notification center
- Admin dashboard
- Price verification

### Week 5 📍
- Testing and refinement
- Data collection tools
- Mobile UX polish
- Beta launch

---

## 🤝 Contributing

This is a community-powered project! Ways to contribute:

1. **Add prices** - Visit stores and log real prices
2. **Report incorrect prices** - Flag outdated or wrong data
3. **Add stores** - Add new supermarkets in your area
4. **Spread the word** - Invite friends and family

---

## 📞 Support

Questions or issues? 
- Check the Issues tab on GitHub
- Email: [your-email@example.com]

---

## 📄 License

MIT License - Feel free to use and modify for your own grocery savings project!

---

## 🎉 Acknowledgments

- Built with inspiration from Waze's community-driven model
- Powered by Open Food Facts (open database of food products)
- Orange theme inspired by Claude AI

---

**Happy Shopping & Saving! 🛒💰**
