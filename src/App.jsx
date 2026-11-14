
import { useEffect, useState } from "react";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import "./App.css";

const API_URL = "http://127.0.0.1:8000";

function App() {
  // =====================================================
  // TRANSACTION DATA
  // =====================================================

  const [transactions, setTransactions] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState("");

  // =====================================================
  // FORM DATA
  // =====================================================

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("expense");

  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [description, setDescription] = useState("");

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
  // DATA CONVERSION
  // =====================================================

  // Backend uses Income / Expense.
  // Frontend uses income / expense.

  const normalizeTransaction = (transaction) => ({
    ...transaction,
    type: transaction.type.toLowerCase(),
  });

  const prepareTransaction = (transaction) => ({
    ...transaction,
    type:
      transaction.type.charAt(0).toUpperCase() +
      transaction.type.slice(1).toLowerCase(),
  });

  // =====================================================
  // LOAD TRANSACTIONS FROM FASTAPI
  // =====================================================

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setIsLoading(true);
        setApiError("");

        const response = await fetch(
          `${API_URL}/transactions`
        );

        if (!response.ok) {
          throw new Error("Unable to load transactions");
        }

        const data = await response.json();

        setTransactions(data.map(normalizeTransaction));
      } catch (error) {
        console.error("Loading Error:", error);

        setApiError(
          "Could not connect to the backend. Please make sure FastAPI is running."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, []);

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
  // ADD / UPDATE TRANSACTION
  // =====================================================

  const addTransaction = async () => {
    if (role !== "admin") {
      return;
    }

    // Validation

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

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      alert("Amount must be greater than 0.");
      return;
    }

    const transactionData = prepareTransaction({
      title: title.trim(),
      amount: numericAmount,
      category: category.trim(),
      type: type,
      date: date,
      description: description.trim(),
    });

    try {
      setIsSaving(true);
      setApiError("");

      let response;

      // UPDATE EXISTING TRANSACTION

      if (editingId !== null) {
        response = await fetch(
          `${API_URL}/transactions/${editingId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(transactionData),
          }
        );
      } else {
        // CREATE NEW TRANSACTION

        response = await fetch(
          `${API_URL}/transactions`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(transactionData),
          }
        );
      }

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(
          errorData.detail || "Failed to save transaction"
        );
      }

      const savedTransaction = normalizeTransaction(
        await response.json()
      );

      // Update frontend only after API success

      if (editingId !== null) {
        setTransactions((currentTransactions) =>
          currentTransactions.map((transaction) =>
            transaction.id === editingId
              ? savedTransaction
              : transaction
          )
        );

        alert("Transaction updated successfully!");
      } else {
        setTransactions((currentTransactions) => [
          savedTransaction,
          ...currentTransactions,
        ]);

        alert("Transaction added successfully!");
      }

      clearForm();

    } catch (error) {
      console.error("Save Error:", error);

      setApiError(error.message);

      alert(
        "Could not save transaction. Please check the backend."
      );
    } finally {
      setIsSaving(false);
    }
  };

  // =====================================================
  // START EDITING A TRANSACTION
  // =====================================================

  const editTransaction = (transaction) => {
    if (role !== "admin") {
      return;
    }

    setTitle(transaction.title);
    setAmount(transaction.amount.toString());
    setCategory(transaction.category);
    setType(transaction.type);

    setDate(
      transaction.date
        ? transaction.date.split("T")[0]
        : new Date().toISOString().split("T")[0]
    );

    setDescription(transaction.description || "");

    setEditingId(transaction.id);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =====================================================
  // DELETE TRANSACTION
  // =====================================================

  const deleteTransaction = async (id) => {
    if (role !== "admin") {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this transaction?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setApiError("");

      const response = await fetch(
        `${API_URL}/transactions/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(
          errorData.detail || "Failed to delete transaction"
        );
      }

      setTransactions((currentTransactions) =>
        currentTransactions.filter(
          (transaction) => transaction.id !== id
        )
      );

      if (editingId === id) {
        clearForm();
      }

      alert("Transaction deleted successfully!");

    } catch (error) {
      console.error("Delete Error:", error);

      setApiError(error.message);

      alert(
        "Could not delete transaction. Please try again."
      );
    }
  };

  // =====================================================
  // CALCULATE TOTAL INCOME
  // =====================================================

  const totalIncome = transactions
    .filter(
      (transaction) => transaction.type === "income"
    )
    .reduce(
      (total, transaction) => total + transaction.amount,
      0
    );

  // =====================================================
  // CALCULATE TOTAL EXPENSE
  // =====================================================

  const totalExpense = transactions
    .filter(
      (transaction) => transaction.type === "expense"
    )
    .reduce(
      (total, transaction) => total + transaction.amount,
      0
    );

  // =====================================================
  // CALCULATE BALANCE
  // =====================================================

  const balance = totalIncome - totalExpense;

  // =====================================================
  // SEARCH + FILTER
  // =====================================================

  const filteredTransactions = transactions.filter(
    (transaction) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        transaction.title.toLowerCase().includes(searchText) ||
        transaction.category.toLowerCase().includes(searchText) ||
        (transaction.description || "")
          .toLowerCase()
          .includes(searchText);

      const matchesFilter =
        filter === "all" ||
        transaction.type === filter;

      return matchesSearch && matchesFilter;
    }
  );

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

    return new Date(dateValue).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // =====================================================
  // ANALYTICS DATA
  // =====================================================

  // Expenses grouped by category

  const categoryData = Object.values(
    transactions
      .filter(
        (transaction) => transaction.type === "expense"
      )
      .reduce((categories, transaction) => {
        const category = transaction.category;

        if (!categories[category]) {
          categories[category] = {
            name: category,
            amount: 0,
          };
        }

        categories[category].amount += transaction.amount;

        return categories;
      }, {})
  );

  // Income versus Expense

  const incomeExpenseData = [
    {
      name: "Income",
      amount: totalIncome,
    },
    {
      name: "Expenses",
      amount: totalExpense,
    },
  ];

  const chartColors = [
    "#6366f1",
    "#22c55e",
    "#f59e0b",
    "#ef4444",
    "#06b6d4",
    "#a855f7",
  ];

  // =====================================================
  // USER INTERFACE
  // =====================================================

  return (
    <div className="app">

      {/* HEADER */}

      <header className="header">
        <div>
          <h1>💰 Transaction Tracker</h1>
          <p>Personal Finance Dashboard</p>
        </div>

        <select
          className="role-select"
          value={role}
          onChange={(event) => {
            setRole(event.target.value);
            clearForm();
          }}
        >
          <option value="admin">Admin</option>
          <option value="viewer">Viewer</option>
        </select>
      </header>

      {/* API ERROR */}

      {apiError && (
        <div
          style={{
            background: "#fee2e2",
            color: "#991b1b",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          {apiError}
        </div>
      )}

      {/* DASHBOARD CARDS */}

      <section className="dashboard">

        <div className="dashboard-card balance-card">
          <span className="card-label">Balance</span>
          <h2>{formatCurrency(balance)}</h2>
          <span>Income - Expenses</span>
        </div>

        <div className="dashboard-card income-card">
          <span className="card-label">Total Income</span>
          <h2>{formatCurrency(totalIncome)}</h2>
          <span>Money received</span>
        </div>

        <div className="dashboard-card expense-card">
          <span className="card-label">Total Expenses</span>
          <h2>{formatCurrency(totalExpense)}</h2>
          <span>Money spent</span>
        </div>

        <div className="dashboard-card count-card">
          <span className="card-label">Transactions</span>
          <h2>{transactions.length}</h2>
          <span>Total records</span>
        </div>

      </section>

      {/* ADD / EDIT FORM */}

      {role === "admin" && (
        <section className="form-section">

          <h2>
            {editingId !== null
              ? "Edit Transaction"
              : "Add Transaction"}
          </h2>

          <div className="transaction-form">

            <input
              placeholder="Transaction title"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
            />

            <input
              placeholder="Amount"
              type="number"
              min="0"
              value={amount}
              onChange={(event) =>
                setAmount(event.target.value)
              }
            />

            <input
              placeholder="Category"
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
            />

            <select
              value={type}
              onChange={(event) =>
                setType(event.target.value)
              }
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>

            <input
              type="date"
              value={date}
              onChange={(event) =>
                setDate(event.target.value)
              }
            />

            <input
              placeholder="Description (optional)"
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
            />

            <button
              className="add-button"
              onClick={addTransaction}
              disabled={isSaving}
            >
              {isSaving
                ? "Saving..."
                : editingId !== null
                ? "Update Transaction"
                : "+ Add Transaction"}
            </button>

            {editingId !== null && (
              <button
                className="cancel-button"
                onClick={clearForm}
                disabled={isSaving}
              >
                Cancel
              </button>
            )}

          </div>
        </section>
      )}

      {/* ANALYTICS CHARTS */}

      <section
        className="chart-section"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "20px",
          margin: "25px 0",
        }}
      >

        {/* EXPENSE CATEGORY PIE CHART */}

        <div
          className="chart-card"
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            minWidth: 0,
          }}
        >
          <h2>Expenses by Category</h2>

          {categoryData.length === 0 ? (
            <p>No expense data available yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="amount"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  label
                >
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        chartColors[index % chartColors.length]
                      }
                    />
                  ))}
                </Pie>

                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* INCOME VS EXPENSE BAR CHART */}

        <div
          className="chart-card"
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            minWidth: 0,
          }}
        >
          <h2>Income vs Expenses</h2>

          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={incomeExpenseData}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="name" />

              <YAxis />

              <Tooltip
                formatter={(value) => formatCurrency(value)}
              />

              <Legend />

              <Bar
                dataKey="amount"
                name="Amount"
                fill="#6366f1"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </section>

      {/* SEARCH */}

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

      {/* FILTER BUTTONS */}

      <div className="filters">

        <button
          className={
            filter === "all"
              ? "filter-button active"
              : "filter-button"
          }
          onClick={() => setFilter("all")}
        >
          All
        </button>

        <button
          className={
            filter === "income"
              ? "filter-button active"
              : "filter-button"
          }
          onClick={() => setFilter("income")}
        >
          Income
        </button>

        <button
          className={
            filter === "expense"
              ? "filter-button active"
              : "filter-button"
          }
          onClick={() => setFilter("expense")}
        >
          Expense
        </button>

      </div>

      {/* TRANSACTION LIST */}

      <section className="transactions-section">

        <div className="section-header">
          <div>
            <h2>Recent Transactions</h2>
            <p>
              {filteredTransactions.length} record(s)
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="empty-state">
            <h3>Loading transactions...</h3>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💸</div>

            <h3>No transactions found</h3>

            <p>
              Add a transaction to start tracking your finances.
            </p>
          </div>
        ) : (
          <div className="transaction-list">

            {filteredTransactions.map((transaction) => (

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
                    {transaction.type === "income"
                      ? "↗"
                      : "↘"}
                  </div>

                  <div>
                    <h3>{transaction.title}</h3>

                    <p>{transaction.category}</p>

                    {transaction.description && (
                      <p>{transaction.description}</p>
                    )}

                    <small>
                      {formatDate(transaction.date)}
                    </small>
                  </div>

                </div>

                {/* RIGHT SIDE */}

                <div className="transaction-right">

                  <strong>
                    {transaction.type === "income"
                      ? "+"
                      : "-"}

                    {formatCurrency(transaction.amount)}
                  </strong>

                  {role === "admin" && (
                    <div className="action-buttons">

                      <button
                        className="edit-button"
                        onClick={() =>
                          editTransaction(transaction)
                        }
                      >
                        Edit
                      </button>

                      <button
                        className="delete-button"
                        onClick={() =>
                          deleteTransaction(transaction.id)
                        }
                      >
                        Delete
                      </button>

                    </div>
                  )}

                </div>

              </div>

            ))}

          </div>
        )}

      </section>

    </div>
  );
}

export default App;
