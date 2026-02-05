# Expense Manager App

A modern, full-featured expense management web application built with React and Tailwind CSS.

## Features

### Core Features
- ✅ **Google Sign-In only** (Supabase Auth)
- ✅ Add, edit, delete expenses
- ✅ Expense categories (Food, Transport, Rent, Utilities, Shopping, Others)
- ✅ Monthly and yearly expense summaries
- ✅ Dashboard with key financial insights
- ✅ Expense filtering (by date, category, amount)
- ✅ Search expenses by title or note
- ✅ Responsive design (desktop, tablet, mobile)

### Advanced Features
- ✅ Budget setting per category
- ✅ Visual indicators when budgets are exceeded
- ✅ Interactive charts (monthly trends, category breakdown)
- ✅ Export expenses (CSV)
- ✅ Dark mode toggle
- ✅ Data persistence with **Supabase** (Postgres, RLS, sync across devices)

## Tech Stack

- **React 18** - UI library
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **date-fns** - Date utilities
- **Vite** - Build tool

## Getting Started

### 1. Supabase & Google Login

The app uses **Supabase** for auth (Google only) and for storing expenses and budgets.

1. **Create a Supabase project** at [supabase.com/dashboard](https://supabase.com/dashboard) (or use an existing one).

2. **Enable Google provider**
   - In the dashboard: **Authentication → Providers → Google**. Enable it and add your Google OAuth Client ID and Secret (from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)).
   - In **Authentication → URL Configuration**, set:
     - **Site URL**: `http://localhost:5173` (for dev) or your production URL.
     - **Redirect URLs**: add `http://localhost:5173/**` and your production URL with `/**`.

3. **Create a `.env` file** in the project root:
   ```env
   VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
   Get **Project URL** and **anon public** key from Supabase: **Project Settings → API**.

4. **Database**: The app expects `expenses` and `budgets` tables with RLS. If you created a new project, run the SQL from `supabase/migrations/20260131000000_create_expenses_and_budgets.sql` in the Supabase SQL Editor (Dashboard → SQL Editor → New query → paste and run).

### 2. Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser at `http://localhost:5173` and sign in with Google.

### Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout/         # Layout components (Sidebar, TopBar)
│   └── UI/             # Generic UI components (Button, etc.)
├── contexts/            # React contexts (Auth, Data)
├── pages/               # Page components
└── main.jsx            # Application entry point
```

## Data Storage

- **Auth & data**: Supabase (Postgres). Expenses and budgets are stored per user; Row Level Security (RLS) restricts access to the signed-in user.
- **Local storage** is only used for: `darkMode` preference.

## Design System

- **Font**: Inter (400, 500, 600, 700)
- **Color Palette**: Slate/Indigo based with muted accents
- **Design Style**: Flat, clean, minimal with modern fintech-inspired UI

## Future Enhancements

- Backend API integration
- Data synchronization across devices
- Recurring expenses
- Expense attachments/receipts
- Multi-currency support
- Advanced reporting and analytics
