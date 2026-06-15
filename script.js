/* ═══════════════════════════════════════════════
   CashFlow – Premium Expense Tracker
   Vanilla JavaScript (ES6+)
   ═══════════════════════════════════════════════ */

// ─────────────────────────────────────
// STORAGE KEY (used to save data in browser)
// ─────────────────────────────────────
var STORAGE_KEY = "expense_tracker_v1";

// ─────────────────────────────────────
// APP STATE (variables that track the current state)
// ─────────────────────────────────────
var transactions = [];       // Array to hold all transactions
var editingId = null;         // ID of transaction being edited (null if not editing)
var pendingDeleteId = null;   // ID of transaction waiting to be deleted
var currentFilter = "all";    // Current filter: "all", "income", or "expense"
var currentSort = "newest";   // Current sort: "newest", "oldest", "highest", "lowest"
var currentSearch = "";       // Current search text

// ─────────────────────────────────────
// DOM ELEMENTS (getting elements from the HTML page)
// ─────────────────────────────────────

// Form elements
var transactionForm = document.getElementById("transaction-form");
var descInput = document.getElementById("tx-desc");
var amountInput = document.getElementById("tx-amount");
var descError = document.getElementById("desc-error");
var amountError = document.getElementById("amount-error");
var submitBtn = document.getElementById("submit-btn");
var submitBtnText = document.getElementById("submit-btn-text");
var cancelEditBtn = document.getElementById("cancel-edit-btn");
var formTitleText = document.getElementById("form-title-text");
var formSection = document.getElementById("form-section");

// Type toggle buttons
var toggleIncomeBtn = document.getElementById("toggle-income");
var toggleExpenseBtn = document.getElementById("toggle-expense");

// Transaction list elements
var transactionsList = document.getElementById("transactions-list");
var emptyState = document.getElementById("empty-state");
var txCountBadge = document.getElementById("tx-count");

// Summary card elements
var totalIncomeEl = document.getElementById("total-income");
var totalExpenseEl = document.getElementById("total-expense");
var netBalanceEl = document.getElementById("net-balance");

// Search, filter, sort elements
var searchInput = document.getElementById("search-input");
var sortSelect = document.getElementById("sort-select");
var filterButtons = document.querySelectorAll(".controls__filter-btn");

// Analytics elements
var analyticsCount = document.getElementById("analytics-count");
var analyticsMaxIncome = document.getElementById("analytics-max-income");
var analyticsMaxExpense = document.getElementById("analytics-max-expense");
var analyticsRatioBar = document.getElementById("analytics-ratio-bar");
var analyticsRatioText = document.getElementById("analytics-ratio-text");

// Modal elements
var deleteModal = document.getElementById("delete-modal");
var modalCancelBtn = document.getElementById("modal-cancel-btn");
var modalConfirmBtn = document.getElementById("modal-confirm-btn");

// Toast container
var toastContainer = document.getElementById("toast-container");


// ═══════════════════════════════════════════════
// LOCAL STORAGE FUNCTIONS
// ═══════════════════════════════════════════════

// Load transactions from the browser's localStorage
function loadTransactions() {
  var data = localStorage.getItem(STORAGE_KEY);

  // If data exists, convert from JSON string to array
  if (data) {
    return JSON.parse(data);
  }

  // If no data exists, return an empty array
  return [];
}

// Save the transactions array to localStorage
function saveTransactions(arr) {
  // Convert the array to a JSON string and save it
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}


// ═══════════════════════════════════════════════
// FORMAT CURRENCY
// ═══════════════════════════════════════════════

// Convert a number to Indian Rupee format (e.g., 50000 → ₹50,000.00)
function formatCurrency(num) {
  return "₹" + num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}


// ═══════════════════════════════════════════════
// ESCAPE HTML (prevents XSS attacks)
// ═══════════════════════════════════════════════

// Makes sure user input is safe to display as HTML
function escapeHTML(str) {
  var div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}


// ═══════════════════════════════════════════════
// SUMMARY CALCULATION
// ═══════════════════════════════════════════════

// Calculate totals and update the summary cards + analytics
function computeSummary() {

  // ── Step 1: Calculate Total Income ──
  // filter() → keeps only income transactions
  // reduce() → adds up all their amounts
  var income = transactions
    .filter(function (t) { return t.type === "income"; })
    .reduce(function (sum, t) { return sum + t.amount; }, 0);

  // ── Step 2: Calculate Total Expense ──
  var expense = transactions
    .filter(function (t) { return t.type === "expense"; })
    .reduce(function (sum, t) { return sum + t.amount; }, 0);

  // ── Step 3: Calculate Balance ──
  var balance = income - expense;

  // ── Step 4: Update the Summary Cards ──
  totalIncomeEl.textContent = formatCurrency(income);
  totalExpenseEl.textContent = formatCurrency(expense);
  netBalanceEl.textContent = formatCurrency(balance);

  // ── Step 5: Change balance color based on positive/negative ──
  netBalanceEl.classList.remove("balance-positive", "balance-negative");
  if (balance > 0) {
    netBalanceEl.classList.add("balance-positive");  // Green
  } else if (balance < 0) {
    netBalanceEl.classList.add("balance-negative");  // Red
  }

  // ── Step 6: Update Analytics Section ──
  analyticsCount.textContent = transactions.length;

  // Get income and expense transaction arrays separately
  var incomeTxns = transactions.filter(function (t) { return t.type === "income"; });
  var expenseTxns = transactions.filter(function (t) { return t.type === "expense"; });

  // Find the largest income
  var maxIncome = 0;
  if (incomeTxns.length > 0) {
    maxIncome = Math.max.apply(null, incomeTxns.map(function (t) { return t.amount; }));
  }

  // Find the largest expense
  var maxExpense = 0;
  if (expenseTxns.length > 0) {
    maxExpense = Math.max.apply(null, expenseTxns.map(function (t) { return t.amount; }));
  }

  analyticsMaxIncome.textContent = formatCurrency(maxIncome);
  analyticsMaxExpense.textContent = formatCurrency(maxExpense);

  // Calculate spending ratio (what % of income is spent)
  var ratio = 0;
  if (income > 0) {
    ratio = Math.min((expense / income) * 100, 100);
  }
  analyticsRatioBar.style.setProperty("--ratio", ratio + "%");
  analyticsRatioText.textContent = ratio.toFixed(1) + "%";
}


// ═══════════════════════════════════════════════
// SORT TRANSACTIONS
// ═══════════════════════════════════════════════

// Sort an array of transactions based on the selected sort type
function sortTransactions(arr, sortType) {
  // Create a copy so we don't change the original array
  var sorted = arr.slice();

  if (sortType === "newest") {
    sorted.sort(function (a, b) { return (b._ts || 0) - (a._ts || 0); });
  } else if (sortType === "oldest") {
    sorted.sort(function (a, b) { return (a._ts || 0) - (b._ts || 0); });
  } else if (sortType === "highest") {
    sorted.sort(function (a, b) { return b.amount - a.amount; });
  } else if (sortType === "lowest") {
    sorted.sort(function (a, b) { return a.amount - b.amount; });
  }

  return sorted;
}


// ═══════════════════════════════════════════════
// RENDER TRANSACTIONS (display the list on screen)
// ═══════════════════════════════════════════════

function renderTransactions() {

  // ── Step 1: Start with all transactions ──
  var filtered = transactions.slice(); // make a copy

  // ── Step 2: Apply type filter ──
  if (currentFilter !== "all") {
    filtered = filtered.filter(function (t) {
      return t.type === currentFilter;
    });
  }

  // ── Step 3: Apply search filter ──
  if (currentSearch.trim() !== "") {
    var query = currentSearch.toLowerCase().trim();
    filtered = filtered.filter(function (t) {
      return t.description.toLowerCase().includes(query);
    });
  }

  // ── Step 4: Apply sorting ──
  filtered = sortTransactions(filtered, currentSort);

  // ── Step 5: Update the count badge ──
  txCountBadge.textContent = filtered.length;

  // ── Step 6: Show empty state or transaction list ──
  if (filtered.length === 0) {
    transactionsList.innerHTML = "";
    emptyState.classList.remove("hidden");
  } else {
    emptyState.classList.add("hidden");

    // Build HTML for each transaction using map()
    var htmlArray = filtered.map(function (t, i) {
      // Decide the sign (+/−) and color class
      var sign = t.type === "income" ? "+" : "−";

      // Build the HTML string for one transaction card
      var html = '<div class="txn-item" role="listitem" style="animation-delay: ' + (i * 0.04) + 's" data-id="' + t.id + '">'
        + '  <div class="txn-item__indicator txn-item__indicator--' + t.type + '"></div>'
        + '  <div class="txn-item__details">'
        + '    <div class="txn-item__desc" title="' + escapeHTML(t.description) + '">' + escapeHTML(t.description) + '</div>'
        + '    <div class="txn-item__date">' + t.date + '</div>'
        + '  </div>'
        + '  <span class="txn-item__amount txn-item__amount--' + t.type + '">'
        + '    ' + sign + formatCurrency(t.amount)
        + '  </span>'
        + '  <div class="txn-item__actions">'
        + '    <button class="btn btn--edit" aria-label="Edit ' + escapeHTML(t.description) + '" data-action="edit" data-id="' + t.id + '">'
        + '      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        + '    </button>'
        + '    <button class="btn btn--delete" aria-label="Delete ' + escapeHTML(t.description) + '" data-action="delete" data-id="' + t.id + '">'
        + '      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        + '    </button>'
        + '  </div>'
        + '</div>';

      return html;
    });

    // Join all HTML strings and put them in the list container
    transactionsList.innerHTML = htmlArray.join("");
  }
}


// ═══════════════════════════════════════════════
// ADD TRANSACTION
// ═══════════════════════════════════════════════

function addTransaction(desc, amount, type) {
  // Create a new transaction object
  var transaction = {
    id: crypto.randomUUID(),                          // Unique ID
    description: desc,                                 // What is this transaction for
    amount: parseFloat(amount),                        // How much money
    type: type,                                        // "income" or "expense"
    date: new Date().toLocaleDateString("en-IN"),      // Today's date in Indian format
    _ts: Date.now()                                    // Timestamp for sorting
  };

  // Add to the array
  transactions.push(transaction);

  // Save to localStorage
  saveTransactions(transactions);

  // Update the UI
  computeSummary();
  renderTransactions();

  // Show success message
  showToast("success", "Transaction added successfully!");
}


// ═══════════════════════════════════════════════
// DELETE TRANSACTION
// ═══════════════════════════════════════════════

// Delete a transaction by its ID using filter()
function deleteTransaction(id) {
  // filter() creates a new array WITHOUT the deleted transaction
  transactions = transactions.filter(function (t) {
    return t.id !== id;  // Keep all transactions whose ID does NOT match
  });

  // Save updated list
  saveTransactions(transactions);

  // Update the UI
  computeSummary();
  renderTransactions();

  // Show delete message
  showToast("error", "Transaction deleted.");
}


// ═══════════════════════════════════════════════
// EDIT TRANSACTION
// ═══════════════════════════════════════════════

// Start editing a transaction using find()
function editTransaction(id) {
  // find() returns the FIRST transaction that matches the ID
  var txn = transactions.find(function (t) {
    return t.id === id;
  });

  // Safety check: if not found, stop
  if (!txn) return;

  // Store the ID so we know we're in edit mode
  editingId = id;

  // Populate the form with existing values
  descInput.value = txn.description;
  amountInput.value = txn.amount;

  // Set the type toggle to match the transaction type
  setActiveType(txn.type);

  // Change button text to "Update Transaction"
  submitBtnText.textContent = "Update Transaction";
  formTitleText.textContent = "Edit Transaction";

  // Show the cancel button
  cancelEditBtn.classList.remove("hidden");

  // Scroll form into view so user can see it
  formSection.scrollIntoView({ behavior: "smooth", block: "center" });

  // Focus the description field
  descInput.focus();
}

// Cancel editing and reset the form
function cancelEdit() {
  editingId = null;
  transactionForm.reset();
  clearErrors();
  setActiveType("income");
  submitBtnText.textContent = "Add Transaction";
  formTitleText.textContent = "Add Transaction";
  cancelEditBtn.classList.add("hidden");
}


// ═══════════════════════════════════════════════
// TYPE TOGGLE (Income / Expense buttons)
// ═══════════════════════════════════════════════

// Get the currently selected type
function getSelectedType() {
  if (toggleIncomeBtn.classList.contains("active")) {
    return "income";
  } else {
    return "expense";
  }
}

// Set which type button is active
function setActiveType(type) {
  if (type === "income") {
    toggleIncomeBtn.classList.add("active");
    toggleIncomeBtn.setAttribute("aria-checked", "true");
    toggleExpenseBtn.classList.remove("active");
    toggleExpenseBtn.setAttribute("aria-checked", "false");
  } else {
    toggleExpenseBtn.classList.add("active");
    toggleExpenseBtn.setAttribute("aria-checked", "true");
    toggleIncomeBtn.classList.remove("active");
    toggleIncomeBtn.setAttribute("aria-checked", "false");
  }
}


// ═══════════════════════════════════════════════
// FORM VALIDATION
// ═══════════════════════════════════════════════

// Check if the form inputs are valid
function validateForm() {
  var isValid = true;
  var desc = descInput.value.trim();
  var amount = amountInput.value.trim();

  // Clear any previous errors first
  clearErrors();

  // Check description
  if (desc === "") {
    showError(descInput, descError, "Please enter a description");
    isValid = false;
  }

  // Check amount
  if (amount === "" || parseFloat(amount) <= 0 || isNaN(parseFloat(amount))) {
    showError(amountInput, amountError, "Please enter a valid amount greater than 0");
    isValid = false;
  }

  return isValid;
}

// Show an error message on a specific input field
function showError(inputElement, errorElement, message) {
  inputElement.classList.add("input-error");
  errorElement.textContent = message;
  errorElement.classList.add("visible");
}

// Clear all error messages
function clearErrors() {
  descInput.classList.remove("input-error");
  amountInput.classList.remove("input-error");
  descError.classList.remove("visible");
  amountError.classList.remove("visible");
  descError.textContent = "";
  amountError.textContent = "";
}


// ═══════════════════════════════════════════════
// TOAST NOTIFICATIONS (success/error messages)
// ═══════════════════════════════════════════════

function showToast(type, message) {
  // Create a new toast element
  var toast = document.createElement("div");
  toast.className = "toast toast--" + type;

  // Set the icon based on type
  var icon = type === "success" ? "✅" : "🗑️";

  toast.innerHTML = '<span class="toast__icon">' + icon + '</span>'
    + '<span>' + escapeHTML(message) + '</span>';

  // Add toast to the container
  toastContainer.appendChild(toast);

  // Remove toast after 3 seconds
  setTimeout(function () {
    toast.classList.add("toast--removing");
    toast.addEventListener("animationend", function () {
      toast.remove();
    });
  }, 3000);
}


// ═══════════════════════════════════════════════
// DELETE CONFIRMATION MODAL
// ═══════════════════════════════════════════════

// Open the delete confirmation popup
function openDeleteModal(id) {
  pendingDeleteId = id;
  deleteModal.showModal();
}

// Close the delete confirmation popup
function closeDeleteModal() {
  pendingDeleteId = null;
  deleteModal.close();
}


// ═══════════════════════════════════════════════
// EVENT LISTENERS (connecting buttons/inputs to functions)
// ═══════════════════════════════════════════════

// ── Form Submit ──
transactionForm.addEventListener("submit", function (e) {
  // Prevent the page from refreshing
  e.preventDefault();

  // Validate the form first
  if (!validateForm()) return;

  // Get the values from the form
  var desc = descInput.value.trim();
  var amount = parseFloat(amountInput.value);
  var type = getSelectedType();

  // Check if we are editing or adding
  if (editingId !== null) {
    // ── UPDATE MODE ──
    // findIndex() returns the position of the transaction in the array
    var index = transactions.findIndex(function (t) {
      return t.id === editingId;
    });

    // If found, update it
    if (index !== -1) {
      transactions[index].description = desc;
      transactions[index].amount = amount;
      transactions[index].type = type;

      saveTransactions(transactions);
      computeSummary();
      renderTransactions();
      showToast("success", "Transaction updated successfully!");
    }

    // Exit edit mode
    cancelEdit();
  } else {
    // ── ADD MODE ──
    addTransaction(desc, amount, type);

    // Reset the form for next entry
    transactionForm.reset();
    clearErrors();
    setActiveType("income");
  }
});

// ── Type Toggle Buttons ──
toggleIncomeBtn.addEventListener("click", function () {
  setActiveType("income");
});

toggleExpenseBtn.addEventListener("click", function () {
  setActiveType("expense");
});

// ── Cancel Edit Button ──
cancelEditBtn.addEventListener("click", function () {
  cancelEdit();
});

// ── Transaction List: Edit & Delete (Event Delegation) ──
// Instead of adding a listener to every button, we add ONE listener
// to the parent container and check which button was clicked
transactionsList.addEventListener("click", function (e) {
  // Find the closest button with a data-action attribute
  var button = e.target.closest("[data-action]");
  if (!button) return;  // If no button was clicked, stop

  // Get the action and transaction ID from the button
  var action = button.dataset.action;
  var id = button.dataset.id;

  if (action === "edit") {
    editTransaction(id);
  } else if (action === "delete") {
    openDeleteModal(id);
  }
});

// ── Delete Modal Buttons ──
modalCancelBtn.addEventListener("click", function () {
  closeDeleteModal();
});

modalConfirmBtn.addEventListener("click", function () {
  if (pendingDeleteId !== null) {
    deleteTransaction(pendingDeleteId);
    closeDeleteModal();
  }
});

// Close modal when clicking outside the content (on the backdrop)
deleteModal.addEventListener("click", function (e) {
  if (e.target === deleteModal) {
    closeDeleteModal();
  }
});

// ── Search Input ──
searchInput.addEventListener("input", function (e) {
  currentSearch = e.target.value;
  renderTransactions();
});

// ── Filter Buttons (All / Income / Expense) ──
document.querySelector(".controls__filters").addEventListener("click", function (e) {
  var button = e.target.closest(".controls__filter-btn");
  if (!button) return;

  // Remove "active" from all filter buttons using forEach()
  filterButtons.forEach(function (btn) {
    btn.classList.remove("active");
    btn.setAttribute("aria-checked", "false");
  });

  // Add "active" to the clicked button
  button.classList.add("active");
  button.setAttribute("aria-checked", "true");

  // Update the current filter and re-render
  currentFilter = button.dataset.filter;
  renderTransactions();
});

// ── Sort Dropdown ──
sortSelect.addEventListener("change", function (e) {
  currentSort = e.target.value;
  renderTransactions();
});

// ── Clear Errors When User Starts Typing ──
descInput.addEventListener("input", function () {
  descInput.classList.remove("input-error");
  descError.classList.remove("visible");
});

amountInput.addEventListener("input", function () {
  amountInput.classList.remove("input-error");
  amountError.classList.remove("visible");
});


// ═══════════════════════════════════════════════
// SCROLL ANIMATIONS (Fade-Up Effect)
// ═══════════════════════════════════════════════

function setupScrollAnimations() {
  // IntersectionObserver watches elements and tells us when they appear on screen
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");    // Add the visible class to trigger animation
        observer.unobserve(entry.target);          // Stop watching after it's visible
      }
    });
  }, { threshold: 0.1 });

  // Find all elements with the "fade-up" class and observe them
  var fadeElements = document.querySelectorAll(".fade-up");
  fadeElements.forEach(function (el) {
    observer.observe(el);
  });
}


// ═══════════════════════════════════════════════
// INITIALIZATION (runs when the page loads)
// ═══════════════════════════════════════════════

function init() {
  // Step 1: Load saved transactions from localStorage
  transactions = loadTransactions();

  // Step 2: Calculate and display totals
  computeSummary();

  // Step 3: Display the transaction list
  renderTransactions();

  // Step 4: Setup scroll animations
  setupScrollAnimations();
}

// Run init() when the page finishes loading
document.addEventListener("DOMContentLoaded", init);
