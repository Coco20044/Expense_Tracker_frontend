const API_BASE_URL = "https://expense-tracker-backend-80ae.onrender.com/api";

function getToken() {
    return localStorage.getItem("token") ||
        sessionStorage.getItem("token");
}

function getSavedUser() {
    const savedUser = localStorage.getItem("user") ||
        sessionStorage.getItem("user");

    if (!savedUser) return null;

    try {
        return JSON.parse(savedUser);
    } catch {
        return null;
    }
}

function clearSession() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userName");

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("userName");
}

function logout() {
    const confirmLogout = confirm("Are you sure you want to log out?");

    if (!confirmLogout) return;

    clearSession();
    window.location.href = "index.html";
}

const logoutButton = document.getElementById("logoutButton");

if (logoutButton) {
    logoutButton.addEventListener("click", event => {
        event.preventDefault();
        logout();
    });
}

const totalBalance = document.getElementById("totalBalance");
const totalIncome = document.getElementById("totalIncome");
const totalExpenses = document.getElementById("totalExpenses");

const spendingPeriod = document.getElementById("spendingPeriod");
const totalSpent = document.getElementById("totalSpent");

const chart = document.querySelector(".chart");
const legendItems = document.querySelectorAll(".key-item");
const transactionList = document.querySelector(".transaction-list");

const welcomeHeading = document.querySelector(".welcome h1");
const userAvatar = document.querySelector(".avatar");

let transactions = [];

function formatMoney(amount) {
    return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        minimumFractionDigits: 2
    }).format(Number(amount) || 0);
}

function getDateParts(dateString) {
    const dateOnly = String(dateString).split("T")[0];
    const [year, month, day] = dateOnly.split("-").map(Number);

    return { year, month, day };
}

function formatDate(dateString) {
    if (!dateString) return "Date unavailable";

    const { year, month, day } = getDateParts(dateString);

    return new Date(year, month - 1, day).toLocaleDateString(
        "en-NG",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );
}

async function fetchTransactions() {
    const token = getToken();

    const response = await fetch(`${API_BASE_URL}/transactions`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });

    if (response.status === 401) {
        clearSession();
        window.location.href = "index.html";
        return false;
    }

    if (!response.ok) {
        throw new Error("Unable to retrieve transactions.");
    }

    const data = await response.json();

    transactions = data.transactions || [];

    return true;
}

async function fetchUser() {
    const token = getToken();

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });

    if (response.status === 401) {
        clearSession();
        window.location.href = "index.html";
        return false;
    }

    if (!response.ok) {
        throw new Error("Unable to retrieve user information.");
    }

    const data = await response.json();
    const user = data.user;

    if (user) {
        const storage = localStorage.getItem("token")
            ? localStorage
            : sessionStorage;

        storage.setItem("user", JSON.stringify(user));
        updateWelcomeName(user);
    }

    return true;
}

function updateWelcomeName(user = getSavedUser()) {
    if (!welcomeHeading) return;

    const name = user?.name;

    welcomeHeading.textContent = name
        ? `Welcome back, ${name}!`
        : "Welcome back!";

    if (userAvatar) {
        userAvatar.textContent = name
            ? name.charAt(0).toUpperCase()
            : "";
    }
}

function isSameMonth(dateString, year, month) {
    if (!dateString) return false;

    const date = getDateParts(dateString);

    return date.year === year && date.month === month;
}

function getTransactionsForPeriod(transactions, period) {
    const now = new Date();

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    return transactions.filter(transaction => {
        const dateString = transaction.transaction_date;

        if (!dateString) return false;

        const date = getDateParts(dateString);

        switch (period) {
            case "thisMonth":
                return isSameMonth(dateString, currentYear, currentMonth);

            case "lastMonth": {
                const lastMonthDate = new Date(
                    currentYear,
                    currentMonth - 2,
                    1
                );

                return isSameMonth(
                    dateString,
                    lastMonthDate.getFullYear(),
                    lastMonthDate.getMonth() + 1
                );
            }

            case "thisYear":
                return date.year === currentYear;

            default:
                return true;
        }
    });
}

function updateDashboardTotals() {
    const income = transactions
        .filter(transaction => transaction.type === "income")
        .reduce((total, transaction) => {
            return total + Number(transaction.amount || 0);
        }, 0);

    const expenses = transactions
        .filter(transaction => transaction.type === "expense")
        .reduce((total, transaction) => {
            return total + Number(transaction.amount || 0);
        }, 0);

    if (totalBalance) {
        totalBalance.textContent = formatMoney(income - expenses);
    }

    if (totalIncome) {
        totalIncome.textContent = formatMoney(income);
    }

    if (totalExpenses) {
        totalExpenses.textContent = formatMoney(expenses);
    }
}

function updateSpendingChart(period) {
    const periodTransactions = getTransactionsForPeriod(
        transactions,
        period
    );

    const expenses = periodTransactions.filter(
        transaction => transaction.type === "expense"
    );

    const categoryTotals = {};

    expenses.forEach(transaction => {
        const category = transaction.category || "Other";

        categoryTotals[category] =
            (categoryTotals[category] || 0) +
            Number(transaction.amount || 0);
    });

    const categories = Object.entries(categoryTotals)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount);

    const total = categories.reduce(
        (sum, category) => sum + category.amount,
        0
    );

    if (totalSpent) {
        totalSpent.textContent = formatMoney(total);
    }

    const colors = [
        "#1759e8",
        "#16a36a",
        "#f5a623",
        "#dce1e9",
        "#8957e5",
        "#e86f51",
        "#1596a8",
        "#a0a7b4"
    ];

    if (chart) {
        if (total === 0) {
            chart.style.background = "#e9edf3";
        } else {
            let currentPosition = 0;

            const chartParts = categories.map((category, index) => {
                const percentage = (category.amount / total) * 100;

                const start = currentPosition;
                currentPosition += percentage;

                return `${colors[index % colors.length]} ${start}% ${currentPosition}%`;
            });

            chart.style.background =
                `conic-gradient(${chartParts.join(", ")})`;
        }
    }

    legendItems.forEach((item, index) => {
        const category = categories[index];

        const nameElement = item.querySelector(".legend-name");
        const percentageElement = item.querySelector(".legend-percentage");
        const dotElement = item.querySelector(".legend-dot");

        if (!category) {
            item.style.display = "none";
            return;
        }

        item.style.display = "";

        const percentage = ((category.amount / total) * 100).toFixed(1);

        if (nameElement) {
            nameElement.textContent = category.name;
        }

        if (percentageElement) {
            percentageElement.textContent = `${percentage}%`;
        }

        if (dotElement) {
            dotElement.style.background = colors[index % colors.length];
        }
    });
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return entities[character];
    });
}

function getCategoryIcon(category, type) {
    if (type === "income") return "↗";

    const icons = {
        food: "",
        transport: "",
        shopping: "",
        bills: "",
        entertainment: "",
        salary: "",
        business: "",
        other: ""
    };

    return icons[String(category || "").toLowerCase()] || "";
}

function updateRecentTransactions() {
    if (!transactionList) return;

    const recentTransactions = [...transactions]
        .sort((a, b) => {
            return new Date(b.transaction_date) -
                new Date(a.transaction_date);
        })
        .slice(0, 5);

    if (recentTransactions.length === 0) {
        transactionList.innerHTML = `
            <div class="empty-transactions">
                <p>No transactions yet.</p>
                <span>Your recent transactions will appear here.</span>
            </div>
        `;

        return;
    }

    transactionList.innerHTML = recentTransactions.map(transaction => {
        const isIncome = transaction.type === "income";
        const amount = Number(transaction.amount) || 0;

        const description = escapeHTML(
            transaction.description || "Untitled transaction"
        );

        const category = escapeHTML(
            transaction.category || "Other"
        );

        return `
            <div class="transaction">
                <div class="transaction-icon">
                    ${getCategoryIcon(transaction.category, transaction.type)}
                </div>

                <div class="transaction-info">
                    <h4>${description}</h4>
                    <p>${category} • ${formatDate(transaction.transaction_date)}</p>
                </div>

                <div class="transaction-amount ${
                    isIncome ? "income-amount" : "expense-amount"
                }">
                    ${isIncome ? "+" : "-"}${formatMoney(amount)}
                </div>
            </div>
        `;
    }).join("");
}

function updateDashboard() {
    updateDashboardTotals();

    updateSpendingChart(
        spendingPeriod ? spendingPeriod.value : "thisMonth"
    );

    updateRecentTransactions();
}

if (spendingPeriod) {
    spendingPeriod.addEventListener("change", () => {
        updateSpendingChart(spendingPeriod.value);
    });
}

async function initializeDashboard() {
    const token = getToken();

    if (!token) {
        window.location.href = "index.html";
        return;
    }

    try {
        const userAuthenticated = await fetchUser();

        if (!userAuthenticated) return;

        const transactionsLoaded = await fetchTransactions();

        if (!transactionsLoaded) return;

        updateDashboard();

    } catch (error) {
        console.error("Dashboard loading error:", error);

        if (transactionList) {
            transactionList.innerHTML = `
                <div class="empty-transactions">
                    <p>Unable to load your transactions.</p>
                    <span>Please refresh the page and try again.</span>
                </div>
            `;
        }
    }
}

initializeDashboard();