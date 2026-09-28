import { useEffect, useState } from "react";
import "./App.css";

function App() {
  // =====================================================
  // TRANSACTION DATA
  // =====================================================

  const [transactions, setTransactions] = useState([]);

  // =====================================================
  // FORM DATA
  // =====================================================

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("expense");

  // NEW: Transaction date
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // NEW: Transaction description
  const [description, setDescription] = useState("");

  // NEW: Stores the ID of the transaction being edited
  //
  // null = we are adding a new transaction
  // number = we are editing an existing transaction
  const [editingId, setEditingId] = useState(null);

  // =====================================================
  // SEARCH / FILTER
  // =====================================================

  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  // =====================================================
  // ROLE
  // =====================================================

  const [role, setRole] = useState("admin");

  // =====================================================
  // LOAD TRANSACTIONS FROM LOCAL STORAGE
  // =====================================================

  useEffect(() => {
    const savedTransactions =
      localStorage.getItem("transactions");

    if (savedTransactions) {
      setTransactions(JSON.parse(savedTransactions));
    }
  }, []);

  // =====================================================
  // SAVE TRANSACTIONS TO LOCAL STORAGE
  // =====================================================

  useEffect(() => {
    localStorage.setItem(
      "transactions",
      JSON.stringify(transactions)
    );
  }, [transactions]);

  // =====================================================
  // ADD / UPDATE TRANSACTION
  // =====================================================

  const addTransaction = () => {
    // ---------------------------------------------
    // VALIDATION
    // ---------------------------------------------

    if (
      !title.trim() ||
      !amount ||
      !category.trim() ||
      !date
    ) {
      alert(
        "Please fill in title, amount, category, and date."
      );

      return;
    }

    const numericAmount = Number(amount);

    // Amount must be greater than zero
    if (numericAmount <= 0) {
      alert("Amount must be greater than 0.");

      return;
    }

    // =================================================
    // UPDATE EXISTING TRANSACTION
    // =================================================

    if (editingId !== null) {
      setTransactions((currentTransactions) =>
        currentTransactions.map((transaction) => {
          // If this is the transaction we are editing,
          // create an updated version.
          if (transaction.id === editingId) {
            return {
              ...transaction,

              title: title.trim(),

              amount: numericAmount,

              category: category.trim(),

              type: type,

              date: date,

              description: description.trim(),
            };
          }

          // Keep all other transactions unchanged.
          return transaction;
        })
      );

      // Exit edit mode
      setEditingId(null);

      // Clear form
      clearForm();

      return;
    }

    // =================================================
    // CREATE NEW TRANSACTION
    // =================================================

    const newTransaction = {
      id: Date.now(),

      title: title.trim(),

      amount: numericAmount,

      category: category.trim(),

      type: type,

      date: date,

      description: description.trim(),
    };

    // Add the new transaction to the beginning
    // of the transaction array.
    setTransactions((currentTransactions) => [
      newTransaction,
      ...currentTransactions,
    ]);

    // Clear form after adding
    clearForm();
  };

  // =====================================================
  // CLEAR FORM
  // =====================================================

  const clearForm = () => {
    setTitle("");

    setAmount("");

    setCategory("");

    setType("expense");

    setDate(
      new Date().toISOString().split("T")[0]
    );

    setDescription("");

    setEditingId(null);
  };

  // =====================================================
  // START EDITING A TRANSACTION
  // =====================================================

  const editTransaction = (transaction) => {
    // Put the selected transaction's values
    // into the form.

    setTitle(transaction.title);

    setAmount(transaction.amount.toString());

    setCategory(transaction.category);

    setType(transaction.type);

    // Older transactions may not have a date.
    // Use today's date if date is missing.
    setDate(
      transaction.date
        ? transaction.date.split("T")[0]
        : new Date().toISOString().split("T")[0]
    );

    // Older transactions may not have description.
    setDescription(transaction.description || "");

    // IMPORTANT:
    // Store the ID so we know which transaction
    // should be updated when the user clicks Update.
    setEditingId(transaction.id);

    // Scroll to the form.
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =====================================================
  // DELETE TRANSACTION
  // =====================================================

  const deleteTransaction = (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this transaction?"
    );

    if (!confirmed) {
      return;
    }

    setTransactions((currentTransactions) =>
      currentTransactions.filter(
        (transaction) => transaction.id !== id
      )
    );
  };

  // =====================================================
  // CALCULATE TOTAL INCOME
  // =====================================================

  const totalIncome = transactions
    .filter(
      (transaction) =>
        transaction.type === "income"
    )
    .reduce(
      (total, transaction) =>
        total + transaction.amount,
      0
    );

  // =====================================================
  // CALCULATE TOTAL EXPENSE
  // =====================================================

  const totalExpense = transactions
    .filter(
      (transaction) =>
        transaction.type === "expense"
    )
    .reduce(
      (total, transaction) =>
        total + transaction.amount,
      0
    );

  // =====================================================
  // CALCULATE BALANCE
  // =====================================================

  const balance =
    totalIncome - totalExpense;

  // =====================================================
  // SEARCH + FILTER
  // =====================================================

  const filteredTransactions =
    transactions.filter((transaction) => {
      const searchText =
        search.toLowerCase();

      const matchesSearch =
        transaction.title
          .toLowerCase()
          .includes(searchText) ||

        transaction.category
          .toLowerCase()
          .includes(searchText) ||

        (transaction.description || "")
          .toLowerCase()
          .includes(searchText);

      const matchesFilter =
        filter === "all" ||
        transaction.type === filter;

      return (
        matchesSearch &&
        matchesFilter
      );
    });

  // =====================================================
  // FORMAT CURRENCY
  // =====================================================

  const formatCurrency = (value) => {
    return `₹${value.toLocaleString("en-IN")}`;
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "No date";
    }

    return new Date(
      dateValue
    ).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // =====================================================
  // USER INTERFACE
  // =====================================================

  return (
    <div className="app">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="header">

        <div>
          <h1>
            💰 Transaction Tracker
          </h1>

          <p>
            Personal Finance Dashboard
          </p>
        </div>

        <select
          className="role-select"
          value={role}
          onChange={(event) =>
            setRole(event.target.value)
          }
        >
          <option value="admin">
            Admin
          </option>

          <option value="viewer">
            Viewer
          </option>
        </select>

      </header>

      {/* =================================================
          DASHBOARD CARDS
      ================================================= */}

      <section className="dashboard">

        {/* BALANCE */}

        <div className="dashboard-card balance-card">

          <span className="card-label">
            Balance
          </span>

          <h2>
            {formatCurrency(balance)}
          </h2>

          <span>
            Income - Expenses
          </span>

        </div>

        {/* INCOME */}

        <div className="dashboard-card income-card">

          <span className="card-label">
            Total Income
          </span>

          <h2>
            {formatCurrency(totalIncome)}
          </h2>

          <span>
            Money received
          </span>

        </div>

        {/* EXPENSE */}

        <div className="dashboard-card expense-card">

          <span className="card-label">
            Total Expenses
          </span>

          <h2>
            {formatCurrency(totalExpense)}
          </h2>

          <span>
            Money spent
          </span>

        </div>

        {/* TRANSACTION COUNT */}

        <div className="dashboard-card count-card">

          <span className="card-label">
            Transactions
          </span>

          <h2>
            {transactions.length}
          </h2>

          <span>
            Total records
          </span>

        </div>

      </section>

      {/* =================================================
          ADD / EDIT TRANSACTION FORM
      ================================================= */}

      {role === "admin" && (

        <section className="form-section">

          <h2>
            {editingId !== null
              ? "Edit Transaction"
              : "Add Transaction"}
          </h2>

          <div className="transaction-form">

            {/* TITLE */}

            <input
              placeholder="Transaction title"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
            />

            {/* AMOUNT */}

            <input
              placeholder="Amount"
              type="number"
              min="0"
              value={amount}
              onChange={(event) =>
                setAmount(event.target.value)
              }
            />

            {/* CATEGORY */}

            <input
              placeholder="Category"
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
            />

            {/* TYPE */}

            <select
              value={type}
              onChange={(event) =>
                setType(event.target.value)
              }
            >

              <option value="expense">
                Expense
              </option>

              <option value="income">
                Income
              </option>

            </select>

            {/* DATE */}

            <input
              type="date"
              value={date}
              onChange={(event) =>
                setDate(event.target.value)
              }
            />

            {/* DESCRIPTION */}

            <input
              placeholder="Description (optional)"
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
            />

            {/* ADD / UPDATE BUTTON */}

            <button
              className="add-button"
              onClick={addTransaction}
            >
              {editingId !== null
                ? "Update Transaction"
                : "+ Add Transaction"}
            </button>

            {/* CANCEL EDIT */}

            {editingId !== null && (

              <button
                className="cancel-button"
                onClick={clearForm}
              >
                Cancel
              </button>

            )}

          </div>

        </section>

      )}

      {/* =================================================
          SEARCH
      ================================================= */}

      <section className="search-section">

        <input
          className="search-input"
          placeholder="🔍 Search transactions..."
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
        />

      </section>

      {/* =================================================
          FILTER BUTTONS
      ================================================= */}

      <div className="filters">

        <button
          className={
            filter === "all"
              ? "filter-button active"
              : "filter-button"
          }
          onClick={() =>
            setFilter("all")
          }
        >
          All
        </button>

        <button
          className={
            filter === "income"
              ? "filter-button active"
              : "filter-button"
          }
          onClick={() =>
            setFilter("income")
          }
        >
          Income
        </button>

        <button
          className={
            filter === "expense"
              ? "filter-button active"
              : "filter-button"
          }
          onClick={() =>
            setFilter("expense")
          }
        >
          Expense
        </button>

      </div>

      {/* =================================================
          TRANSACTION LIST
      ================================================= */}

      <section className="transactions-section">

        <div className="section-header">

          <div>

            <h2>
              Recent Transactions
            </h2>

            <p>
              {filteredTransactions.length} record(s)
            </p>

          </div>

        </div>

        {filteredTransactions.length === 0 ? (

          <div className="empty-state">

            <div className="empty-icon">
              💸
            </div>

            <h3>
              No transactions found
            </h3>

            <p>
              Add a transaction to start
              tracking your finances.
            </p>

          </div>

        ) : (

          <div className="transaction-list">

            {filteredTransactions.map(
              (transaction) => (

                <div
                  className={
                    transaction.type === "income"
                      ? "transaction income"
                      : "transaction expense"
                  }
                  key={transaction.id}
                >

                  {/* LEFT SIDE */}

                  <div className="transaction-info">

                    <div className="transaction-icon">

                      {transaction.type ===
                      "income"
                        ? "↗"
                        : "↘"}

                    </div>

                    <div>

                      <h3>
                        {transaction.title}
                      </h3>

                      <p>
                        {transaction.category}
                      </p>

                      {transaction.description && (

                        <p>
                          {transaction.description}
                        </p>

                      )}

                      <small>
                        {formatDate(
                          transaction.date
                        )}
                      </small>

                    </div>

                  </div>

                  {/* RIGHT SIDE */}

                  <div className="transaction-right">

                    <strong>

                      {transaction.type ===
                      "income"
                        ? "+"
                        : "-"}

                      {formatCurrency(
                        transaction.amount
                      )}

                    </strong>

                    {role === "admin" && (

                      <div className="action-buttons">

                        {/* EDIT */}

                        <button
                          className="edit-button"
                          onClick={() =>
                            editTransaction(
                              transaction
                            )
                          }
                        >
                          Edit
                        </button>

                        {/* DELETE */}

                        <button
                          className="delete-button"
                          onClick={() =>
                            deleteTransaction(
                              transaction.id
                            )
                          }
                        >
                          Delete
                        </button>

                      </div>

                    )}

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </section>

    </div>
  );
}

export default App;