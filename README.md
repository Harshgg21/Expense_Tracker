# 💰 CashFlow – Expense Tracker Dashboard

A modern, responsive Expense Tracker web application built using **HTML, CSS, and Vanilla JavaScript**. This project helps users efficiently manage their finances by tracking income and expenses, viewing real-time balance summaries, and storing transaction data locally in the browser.

> **Built by team Na$h_Code** ♥

---

## 🚀 Features

- ➕ Add Income and Expense Transactions
- ✏️ Edit Existing Transactions
- 🗑️ Delete Transactions (with Confirmation Modal)
- 📊 Real-Time Financial Summary
  - Total Income
  - Total Expenses
  - Net Balance
- 💾 Local Storage Persistence (data survives page refresh)
- 🔍 Search Transactions by description
- 🎯 Filter by Transaction Type (All / Income / Expense)
- ↕️ Sort Transactions (Newest, Oldest, Highest, Lowest)
- 📈 Analytics Dashboard
  - Transaction Count
  - Largest Income
  - Largest Expense
  - Spending Ratio
- 🔔 Toast Notifications (success & error)
- ⚠️ Delete Confirmation Modal (native `<dialog>`)
- 📱 Fully Responsive Design
- 🌙 Modern Dark Fintech UI

---

## 🛠️ Technologies Used

| Technology | Purpose |
|-----------|---------|
| HTML5 | Page structure and semantic elements |
| CSS3 | Styling, animations, dark theme, responsive design |
| JavaScript (ES6+) | Logic, DOM manipulation, localStorage |
| Local Storage API | Persistent data storage in the browser |
| Google Fonts | Outfit (headings) + Inter (body text) |

---

## 🎨 Design Highlights

- Premium Dark Theme (`#0D0D14` background)
- Glassmorphism-Inspired Cards with backdrop blur
- Smooth Hover Lift Effects with glow shadows
- Animated Hero Section with pulsing glow
- Color-Coded Transactions (green for income, red for expense)
- Income/Expense Toggle with color-coded active states
- Interactive Dashboard Layout
- Mobile-First Responsive Design
- Custom Scrollbar for transaction list
- Fade-Up Scroll Animations using IntersectionObserver

---

## 📂 Project Structure

```
Expense-Tracker/
│
├── index.html      ← Main HTML page (semantic structure)
├── style.css       ← Complete stylesheet (dark theme, animations)
├── script.js       ← JavaScript logic (CRUD, localStorage, DOM)
└── README.md       ← Project documentation (this file)
```

---

## 🔧 How It Works

### Step-by-Step Working

```
1. User Opens the Page
   └── init() runs on DOMContentLoaded
       ├── loadTransactions() → reads data from localStorage
       ├── computeSummary() → calculates income, expense, balance
       ├── renderTransactions() → displays the transaction list
       └── setupScrollAnimations() → enables fade-up effects

2. User Adds a Transaction
   └── Fills the form (description, amount, type)
       └── Clicks "Add Transaction"
           └── addTransaction() runs
               ├── Creates object with crypto.randomUUID()
               ├── Pushes to transactions array
               ├── saveTransactions() → saves to localStorage
               ├── computeSummary() → updates summary cards
               ├── renderTransactions() → refreshes the list
               └── showToast("success") → shows notification

3. User Edits a Transaction
   └── Clicks the ✏️ edit button on a transaction
       └── editTransaction(id) runs
           ├── find() → locates the transaction by ID
           ├── Populates form with existing values
           ├── Changes button text to "Update Transaction"
           └── Scrolls form into view
       └── User modifies values and clicks "Update Transaction"
           └── findIndex() → finds position in array
               ├── Updates the object at that index
               ├── Saves, recomputes, re-renders
               └── Shows success toast

4. User Deletes a Transaction
   └── Clicks the 🗑️ delete button
       └── openDeleteModal(id) → shows confirmation dialog
           └── User clicks "Delete"
               └── deleteTransaction(id) runs
                   ├── filter() → creates new array without that item
                   ├── Saves, recomputes, re-renders
                   └── Shows delete toast

5. User Searches / Filters / Sorts
   └── Search: filters by description (case-insensitive)
   └── Filter: shows All / Income only / Expense only
   └── Sort: Newest, Oldest, Highest Amount, Lowest Amount
       └── renderTransactions() re-runs with current settings
```

### Data Flow Diagram

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  User Input  │ ──→ │  JavaScript  │ ──→ │  localStorage   │
│  (Form/Btn)  │     │  (script.js) │     │  (JSON string)  │
└─────────────┘     └──────┬───────┘     └─────────────────┘
                           │
                    ┌──────▼───────┐
                    │  DOM Update  │
                    │  (HTML page) │
                    └──────────────┘
```

### Transaction Object Structure

```javascript
{
  id: "a1b2c3d4-...",                    // crypto.randomUUID()
  description: "Grocery Shopping",        // User input
  amount: 2500,                           // parseFloat(input)
  type: "expense",                        // "income" or "expense"
  date: "15/6/2026",                      // toLocaleDateString("en-IN")
  _ts: 1718444400000                      // Date.now() for sorting
}
```

### localStorage Usage

```javascript
// SAVE: Convert array → JSON string → store in browser
localStorage.setItem("expense_tracker_v1", JSON.stringify(transactions));

// LOAD: Read string from browser → convert back to array
var data = localStorage.getItem("expense_tracker_v1");
var transactions = JSON.parse(data);
```

---

## 🧠 JavaScript Concepts Demonstrated

| Concept | Where Used | Example |
|---------|-----------|---------|
| DOM Manipulation | Getting/updating elements | `document.getElementById("total-income")` |
| Event Handling | Form submit, button clicks | `form.addEventListener("submit", ...)` |
| Event Delegation | Transaction list edit/delete | `e.target.closest("[data-action]")` |
| Local Storage | Save/load transactions | `localStorage.setItem()` / `getItem()` |
| CRUD Operations | Add, Read, Update, Delete | Full transaction lifecycle |
| `filter()` | Delete, type filtering, search | `transactions.filter(t => t.id !== id)` |
| `reduce()` | Sum income/expense totals | `.reduce((sum, t) => sum + t.amount, 0)` |
| `map()` | Render transaction HTML | `filtered.map(function(t) { ... })` |
| `find()` | Locate transaction for editing | `transactions.find(t => t.id === id)` |
| `findIndex()` | Update transaction in-place | `transactions.findIndex(t => t.id === id)` |
| `sort()` | Sort by date/amount | `sorted.sort((a, b) => b.amount - a.amount)` |
| `forEach()` | Iterate filter buttons | `filterButtons.forEach(function(btn) {...})` |
| Form Validation | Check empty/invalid inputs | `validateForm()` |
| Template Literals | Build HTML strings | `"<div class='" + type + "'>"` |
| IntersectionObserver | Scroll animations | Fade-up effect on sections |

---

## 📈 Summary Calculation Logic

```javascript
// Income: filter only income → sum amounts
var income = transactions
  .filter(function(t) { return t.type === "income"; })
  .reduce(function(sum, t) { return sum + t.amount; }, 0);

// Expense: filter only expense → sum amounts
var expense = transactions
  .filter(function(t) { return t.type === "expense"; })
  .reduce(function(sum, t) { return sum + t.amount; }, 0);

// Balance
var balance = income - expense;
```

---

## 🌿 Git Flow Guide

### Initial Setup

```bash
# Step 1: Navigate to project folder
cd "Expense-Tracker"

# Step 2: Initialize Git repository
git init

# Step 3: Add all files to staging
git add .

# Step 4: Create the first commit
git commit -m "Initial commit: Expense Tracker with HTML, CSS, JS"
```

### Push to GitHub

```bash
# Step 5: Create a new repository on GitHub (via github.com)
#         Name it: expense-tracker-dashboard

# Step 6: Connect local repo to GitHub
git remote add origin https://github.com/YOUR_USERNAME/expense-tracker-dashboard.git

# Step 7: Push to GitHub
git branch -M main
git push -u origin main
```

### Daily Workflow (Making Changes)

```bash
# Check what files have changed
git status

# Add changes to staging
git add .

# Commit with a descriptive message
git commit -m "feat: add search and filter functionality"

# Push to GitHub
git push origin main
```

### Git Commit Message Convention

Use clear, descriptive commit messages:

```bash
# Feature additions
git commit -m "feat: add transaction form with validation"
git commit -m "feat: add search and filter functionality"
git commit -m "feat: add analytics dashboard section"

# Bug fixes
git commit -m "fix: correct balance calculation for negative values"
git commit -m "fix: resolve edit mode not resetting properly"

# Styling changes
git commit -m "style: add hover effects to summary cards"
git commit -m "style: improve mobile responsive layout"

# Documentation
git commit -m "docs: add README with project documentation"
```

### Branching (For Team Collaboration)

```bash
# Create a new feature branch
git checkout -b feature/search-filter

# Make your changes, then commit
git add .
git commit -m "feat: add search and filter for transactions"

# Push the branch to GitHub
git push origin feature/search-filter

# After review, merge into main
git checkout main
git merge feature/search-filter

# Delete the branch after merging
git branch -d feature/search-filter
```

### Useful Git Commands

```bash
git status          # Check current state of files
git log --oneline   # View commit history (short format)
git diff            # See what changed before staging
git stash           # Temporarily save uncommitted changes
git stash pop       # Restore stashed changes
git pull            # Download latest changes from GitHub
```

---

## 🎯 Learning Outcomes

This project demonstrates practical frontend development skills, including:

- ✅ Building dynamic user interfaces with DOM manipulation
- ✅ Managing application state with arrays and localStorage
- ✅ Implementing complete CRUD functionality
- ✅ Performing financial calculations using JavaScript array methods
- ✅ Creating responsive and accessible web applications
- ✅ Using modern CSS features (custom properties, grid, flexbox, animations)
- ✅ Following clean code practices with proper function organization
- ✅ Using native browser APIs (`<dialog>`, IntersectionObserver, crypto.randomUUID)

---

## 📸 Preview

A modern finance dashboard designed to provide a clean and intuitive expense tracking experience with a premium dark fintech UI.

---

## 📄 License

This project was developed by **team Na$h_Code** as a frontend capstone project for learning and educational purposes.

---

*Built with ♥ using Vanilla JavaScript — No frameworks, no backend, no database.*
