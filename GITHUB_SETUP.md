# GitHub Repository Setup Instructions

## Step 1: Install Git

If Git is not installed, download and install it from:
- **Download**: https://git-scm.com/download/win
- Choose the default options during installation
- **Restart your terminal/PowerShell** after installation

## Step 2: Initialize Git Repository

After installing Git, run these commands in your terminal:

```bash
# Navigate to your project directory first, then:
cd path/to/your/ExpenseTracker

# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Expense Manager App with React, Tailwind CSS, and full features"
```

## Step 3: Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository:
   - Repository name: `expense-manager-app` (or your preferred name)
   - Description: "Modern Expense Manager web application built with React and Tailwind CSS"
   - Choose **Public** or **Private**
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
3. Click "Create repository"

## Step 4: Connect and Push to GitHub

After creating the repository, GitHub will show you commands. Use these:

```bash
# Add remote repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/expense-manager-app.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

## Alternative: Using GitHub CLI (if installed)

If you have GitHub CLI installed, you can create the repository directly:

```bash
gh repo create expense-manager-app --public --source=. --remote=origin --push
```

## What's Included

- ✅ Complete React application with Vite
- ✅ Tailwind CSS configuration
- ✅ All source code and components
- ✅ Package.json with all dependencies
- ✅ .gitignore file (node_modules excluded)
- ✅ README.md with project documentation

## Notes

- The `node_modules` folder is excluded via .gitignore
- Users will need to run `npm install` after cloning
- The dev server runs on `http://localhost:5173`
