import { useState, useEffect } from "react";

function App() {
  const [transactions, setTransactions] = useState([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("expense");
  const [filter, setFilter] = useState("all");
  const [role, setRole] = useState("admin");
  const [search, setSearch] = useState("");

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("transactions");
    if (saved) setTransactions(JSON.parse(saved));
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("transactions", JSON.stringify(transactions));
  }, [transactions]);

  const addTransaction = () => {
    if (!title || !amount || !category) return;

    const newTransaction = {
      id: Date.now(),
      title,
      amount: Number(amount),
      category,
      type,
    };

    setTransactions([newTransaction, ...transactions]);

    setTitle("");
    setAmount("");
    setCategory("");
  };

  const deleteTransaction = (id) => {
    setTransactions(transactions.filter((t) => t.id !== id));
  };

  // Filtering + Search
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = t.title
      .toLowerCase()
      .includes(search.toLowerCase());

    if (filter === "income")
      return t.type === "income" && matchesSearch;
    if (filter === "expense")
      return t.type === "expense" && matchesSearch;

    return matchesSearch;
  });

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);

  return (
    <div
      style={{
        maxWidth: "500px",
        margin: "50px auto",
        padding: "25px",
        borderRadius: "12px",
        background: "#1e1e2f",
        color: "white",
        boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
        fontFamily: "Arial",
      }}
    >
      <h1 style={{
  textAlign: "center",
  marginBottom: "20px",
  lineHeight: "1.2"
}}>
  💰 Transaction Tracker
</h1>

      {/* ROLE */}
      <div style={{ marginBottom: "15px", textAlign: "center" }}>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="admin">Admin</option>
          <option value="viewer">Viewer</option>
        </select>
      </div>

      {/* INPUTS */}
      {role === "admin" && (
        <>
          <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ flex: 1, padding: "8px" }}
            />
            <input
              placeholder="Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{ flex: 1, padding: "8px" }}
            />
          </div>

          <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <input
              placeholder="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ flex: 1, padding: "8px" }}
            />

            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={{ padding: "8px" }}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>

            <button onClick={addTransaction}>Add</button>
          </div>
        </>
      )}

      {/* SEARCH */}
      <input
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
      />

      {/* FILTER */}
      <div style={{ textAlign: "center", marginBottom: "10px" }}>
        <button onClick={() => setFilter("all")}>All</button>
        <button onClick={() => setFilter("income")}>Income</button>
        <button onClick={() => setFilter("expense")}>Expense</button>
      </div>

      {/* INSIGHT */}
      <h3
        style={{
          textAlign: "center",
          background: "#111",
          padding: "10px",
          borderRadius: "8px",
        }}
      >
        Total Expense: ₹{totalExpense}
      </h3>

      {/* LIST */}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {filteredTransactions.length === 0 ? (
          <p style={{ textAlign: "center", opacity: 0.7 }}>
            No transactions yet 🚀
          </p>
        ) : (
          filteredTransactions.map((t) => (
            <li
              key={t.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "8px",
                padding: "8px",
                borderRadius: "6px",
                background:
                  t.type === "income" ? "#1b5e20" : "#7f1d1d",
              }}
            >
              <span>
                {t.title} - ₹{t.amount} ({t.category})
              </span>

              {role === "admin" && (
                <button onClick={() => deleteTransaction(t.id)}>
                  Delete
                </button>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default App;