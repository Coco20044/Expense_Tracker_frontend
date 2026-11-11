document.addEventListener("DOMContentLoaded", () => {
   const API_BASE_URL = "https://expense-tracker-backend-80ae.onrender.com/api";
    const reportIncome = document.getElementById("reportIncome");
    const reportExpenses = document.getElementById("reportExpenses");
    const reportBalance = document.getElementById("reportBalance");
    const reportTransactions = document.getElementById("reportTransactions");

    const reportPeriod = document.getElementById("reportPeriod");
    const reportDateLabel = document.getElementById("reportDateLabel");

    const incomeExpenseChart = document.getElementById("incomeExpenseChart");
    const spendingDonut = document.getElementById("spendingDonut");
    const donutTotal = document.getElementById("donutTotal");
    const categoryLegend = document.getElementById("categoryLegend");
    const monthlyChart = document.getElementById("monthlyChart");

    const recentActivityTable = document.getElementById("recentActivityTable");
    const activityTableContainer = document.getElementById("activityTableContainer");
    const reportEmptyState = document.getElementById("reportEmptyState");

    const downloadReport = document.getElementById("downloadReport");
    const logoutButton = document.getElementById("logoutButton");

    const userNameElement = document.getElementById("userName");
    const userAvatar = document.getElementById("userAvatar");

    const categoryColors = [
        "#6659d9",
        "#f29b72",
        "#36a879",
        "#e6b34c",
        "#4d9bd4",
        "#d76b9b",
        "#8c79c8",
        "#8b929f"
    ];

    let transactions = [];

    function getToken() {
        return localStorage.getItem("token") ||
            sessionStorage.getItem("token");
    }

    function clearSession() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("userName");

        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("userName");
    }

    function formatCurrency(amount) {
        return new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
            minimumFractionDigits: 2
        }).format(Number(amount) || 0);
    }

    function formatShortCurrency(amount) {
        amount = Number(amount) || 0;

        if (amount >= 1000000) {
            return "₦" + (amount / 1000000).toFixed(1) + "m";
        }

        if (amount >= 1000) {
            return "₦" + (amount / 1000).toFixed(1) + "k";
        }

        return "₦" + amount.toFixed(0);
    }

    function getTransactionDate(transaction) {
        return String(transaction.transaction_date || "").slice(0, 10);
    }

    function formatDate(date) {
        if (!date) return "—";

        const [year, month, day] = date.split("-").map(Number);

        return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    }

    function getLocalDate() {
        const today = new Date();

        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    function getMonthKey(date) {
        return date.slice(0, 7);
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

            if (userNameElement) {
                userNameElement.textContent = user.name;
            }

            if (userAvatar) {
                userAvatar.textContent = user.name
                    ? user.name.charAt(0).toUpperCase()
                    : "";
            }
        }

        return true;
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

    function getFilteredTransactions() {
        const period = reportPeriod?.value || "all";

        const now = new Date();

        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        let startDate = null;
        let endDate = getLocalDate();

        if (period === "thisMonth") {
            startDate = new Date(currentYear, currentMonth, 1);
        } else if (period === "lastMonth") {
            startDate = new Date(currentYear, currentMonth - 1, 1);
            endDate = new Date(currentYear, currentMonth, 0);
        } else if (period === "last3Months") {
            startDate = new Date(currentYear, currentMonth - 2, 1);
        } else if (period === "thisYear") {
            startDate = new Date(currentYear, 0, 1);
        }

        if (!startDate) {
            return transactions;
        }

        const start = [
            startDate.getFullYear(),
            String(startDate.getMonth() + 1).padStart(2, "0"),
            String(startDate.getDate()).padStart(2, "0")
        ].join("-");

        if (endDate instanceof Date) {
            endDate = [
                endDate.getFullYear(),
                String(endDate.getMonth() + 1).padStart(2, "0"),
                String(endDate.getDate()).padStart(2, "0")
            ].join("-");
        }

        return transactions.filter(transaction => {
            const date = getTransactionDate(transaction);

            return date >= start && date <= endDate;
        });
    }

    function updateDateLabel() {
        if (!reportDateLabel) return;

        const period = reportPeriod?.value || "all";

        const labels = {
            all: "Showing all transactions",
            thisMonth: "Showing transactions for this month",
            lastMonth: "Showing transactions for last month",
            last3Months: "Showing transactions for the last 3 months",
            thisYear: "Showing transactions for this year"
        };

        reportDateLabel.textContent = labels[period] || labels.all;
    }

    function updateSummary(filteredTransactions) {
        const income = filteredTransactions
            .filter(transaction => transaction.type === "income")
            .reduce((total, transaction) => {
                return total + Number(transaction.amount || 0);
            }, 0);

        const expenses = filteredTransactions
            .filter(transaction => transaction.type === "expense")
            .reduce((total, transaction) => {
                return total + Number(transaction.amount || 0);
            }, 0);

        const balance = income - expenses;

        if (reportIncome) {
            reportIncome.textContent = formatCurrency(income);
        }

        if (reportExpenses) {
            reportExpenses.textContent = formatCurrency(expenses);
        }

        if (reportBalance) {
            reportBalance.textContent = formatCurrency(balance);
            reportBalance.style.color = balance < 0 ? "#cf4949" : "#23945a";
        }

        if (reportTransactions) {
            reportTransactions.textContent = filteredTransactions.length;
        }
    }

    function renderIncomeExpenseChart(filteredTransactions) {
        if (!incomeExpenseChart) return;

        incomeExpenseChart.innerHTML = "";

        const income = filteredTransactions
            .filter(transaction => transaction.type === "income")
            .reduce((total, transaction) => {
                return total + Number(transaction.amount || 0);
            }, 0);

        const expenses = filteredTransactions
            .filter(transaction => transaction.type === "expense")
            .reduce((total, transaction) => {
                return total + Number(transaction.amount || 0);
            }, 0);

        const maximum = Math.max(income, expenses, 1);

        const groups = [
            {
                label: "Income",
                amount: income,
                height: (income / maximum) * 160,
                className: "income-bar"
            },
            {
                label: "Expenses",
                amount: expenses,
                height: (expenses / maximum) * 160,
                className: "expense-bar"
            }
        ];

        groups.forEach(group => {
            const barGroup = document.createElement("div");
            barGroup.className = "bar-group";

            const value = document.createElement("small");
            value.textContent = formatShortCurrency(group.amount);
            value.style.color = "#73798a";
            value.style.fontSize = "11px";

            const barValues = document.createElement("div");
            barValues.className = "bar-values";

            const bar = document.createElement("div");
            bar.className = `chart-bar ${group.className}`;
            bar.style.height = `${group.height}px`;

            barValues.appendChild(bar);

            const label = document.createElement("span");
            label.className = "bar-label";
            label.textContent = group.label;

            barGroup.append(value, barValues, label);

            incomeExpenseChart.appendChild(barGroup);
        });
    }

    function renderSpendingBreakdown(filteredTransactions) {
        if (!spendingDonut || !categoryLegend || !donutTotal) return;

        const expenses = filteredTransactions.filter(
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
            .sort((a, b) => b[1] - a[1]);

        const totalSpent = expenses.reduce((total, transaction) => {
            return total + Number(transaction.amount || 0);
        }, 0);

        donutTotal.textContent = formatShortCurrency(totalSpent);

        categoryLegend.innerHTML = "";

        if (categories.length === 0 || totalSpent === 0) {
            spendingDonut.style.background =
                "conic-gradient(#e9eaf0 0deg 360deg)";

            const message = document.createElement("p");
            message.textContent = "No spending data available.";
            message.style.color = "#9298a8";
            message.style.fontSize = "12px";

            categoryLegend.appendChild(message);

            return;
        }

        let currentAngle = 0;

        const gradientParts = [];

        categories.forEach(([category, amount], index) => {
            const percentage = (amount / totalSpent) * 100;
            const angle = (amount / totalSpent) * 360;
            const color = categoryColors[index % categoryColors.length];

            gradientParts.push(
                `${color} ${currentAngle}deg ${currentAngle + angle}deg`
            );

            currentAngle += angle;

            const categoryItem = document.createElement("div");
            categoryItem.className = "category-item";

            const categoryName = document.createElement("div");
            categoryName.className = "category-name";

            const colorDot = document.createElement("span");
            colorDot.className = "category-color";
            colorDot.style.background = color;

            const name = document.createElement("span");
            name.textContent = `${category} (${percentage.toFixed(1)}%)`;

            const amountElement = document.createElement("span");
            amountElement.className = "category-amount";
            amountElement.textContent = formatCurrency(amount);

            categoryName.append(colorDot, name);
            categoryItem.append(categoryName, amountElement);

            categoryLegend.appendChild(categoryItem);
        });

        spendingDonut.style.background =
            `conic-gradient(${gradientParts.join(", ")})`;
    }

    function renderMonthlyTrends(filteredTransactions) {
        if (!monthlyChart) return;

        monthlyChart.innerHTML = "";

        const monthlyData = {};

        filteredTransactions.forEach(transaction => {
            const date = getTransactionDate(transaction);

            if (!date) return;

            const monthKey = getMonthKey(date);

            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = {
                    income: 0,
                    expenses: 0
                };
            }

            if (transaction.type === "income") {
                monthlyData[monthKey].income += Number(transaction.amount || 0);
            } else {
                monthlyData[monthKey].expenses += Number(transaction.amount || 0);
            }
        });

        const months = Object.keys(monthlyData).sort();

        if (months.length === 0) {
            const message = document.createElement("p");
            message.textContent = "No monthly data available.";
            message.style.color = "#9298a8";
            message.style.fontSize = "13px";

            monthlyChart.appendChild(message);

            return;
        }

        const maximum = Math.max(
            ...months.map(month => Math.max(
                monthlyData[month].income,
                monthlyData[month].expenses
            )),
            1
        );

        months.forEach(month => {
            const data = monthlyData[month];

            const monthGroup = document.createElement("div");
            monthGroup.className = "month-group";

            const monthBars = document.createElement("div");
            monthBars.className = "month-bars";

            const incomeBar = document.createElement("div");
            incomeBar.className = "month-bar income-bar";
            incomeBar.style.height =
                `${Math.max((data.income / maximum) * 160, data.income > 0 ? 3 : 0)}px`;
            incomeBar.title = `Income: ${formatCurrency(data.income)}`;

            const expenseBar = document.createElement("div");
            expenseBar.className = "month-bar expense-bar";
            expenseBar.style.height =
                `${Math.max((data.expenses / maximum) * 160, data.expenses > 0 ? 3 : 0)}px`;
            expenseBar.title = `Expenses: ${formatCurrency(data.expenses)}`;

            monthBars.append(incomeBar, expenseBar);

            const monthLabel = document.createElement("span");
            monthLabel.className = "month-label";

            const [year, monthNumber] = month.split("-");

            const monthDate = new Date(
                Number(year),
                Number(monthNumber) - 1,
                1
            );

            monthLabel.textContent = monthDate.toLocaleDateString("en-US", {
                month: "short",
                year: "2-digit"
            });

            monthGroup.append(monthBars, monthLabel);

            monthlyChart.appendChild(monthGroup);
        });
    }

    function renderRecentActivity(filteredTransactions) {
        if (!recentActivityTable) return;

        recentActivityTable.innerHTML = "";

        const recentTransactions = [...filteredTransactions]
            .sort((a, b) => {
                return getTransactionDate(b).localeCompare(
                    getTransactionDate(a)
                );
            })
            .slice(0, 5);

        if (recentTransactions.length === 0) {
            if (activityTableContainer) {
                activityTableContainer.hidden = true;
            }

            if (reportEmptyState) {
                reportEmptyState.hidden = false;
            }

            return;
        }

        if (activityTableContainer) {
            activityTableContainer.hidden = false;
        }

        if (reportEmptyState) {
            reportEmptyState.hidden = true;
        }

        recentTransactions.forEach(transaction => {
            const row = document.createElement("tr");

            const isIncome = transaction.type === "income";

            const descriptionCell = document.createElement("td");
            descriptionCell.textContent =
                transaction.description || "Untitled transaction";

            const categoryCell = document.createElement("td");
            categoryCell.textContent = transaction.category || "Other";

            const dateCell = document.createElement("td");
            dateCell.textContent = formatDate(
                getTransactionDate(transaction)
            );

            const typeCell = document.createElement("td");

            const typeBadge = document.createElement("span");
            typeBadge.className =
                `activity-type ${isIncome ? "activity-income" : "activity-expense"}`;
            typeBadge.textContent = isIncome ? "Income" : "Expense";

            typeCell.appendChild(typeBadge);

            const amountCell = document.createElement("td");
            amountCell.className = isIncome
                ? "activity-income-amount"
                : "activity-expense-amount";

            amountCell.textContent =
                `${isIncome ? "+" : "-"}${formatCurrency(transaction.amount)}`;

            row.append(
                descriptionCell,
                categoryCell,
                dateCell,
                typeCell,
                amountCell
            );

            recentActivityTable.appendChild(row);
        });
    }

    function updateReport() {
        const filteredTransactions = getFilteredTransactions();

        updateDateLabel();
        updateSummary(filteredTransactions);
        renderIncomeExpenseChart(filteredTransactions);
        renderSpendingBreakdown(filteredTransactions);
        renderMonthlyTrends(filteredTransactions);
        renderRecentActivity(filteredTransactions);
    }

    if (reportPeriod) {
        reportPeriod.addEventListener("change", updateReport);
    }

    function downloadCSV() {
        const filteredTransactions = getFilteredTransactions();

        if (filteredTransactions.length === 0) {
            alert("There are no transactions to download for this period.");
            return;
        }

        const headers = [
            "Description",
            "Category",
            "Date",
            "Type",
            "Amount"
        ];

        const rows = filteredTransactions.map(transaction => [
            `"${String(transaction.description || "").replace(/"/g, '""')}"`,
            `"${String(transaction.category || "").replace(/"/g, '""')}"`,
            getTransactionDate(transaction),
            transaction.type,
            Number(transaction.amount)
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;"
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "expense-report.csv";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    }

    if (downloadReport) {
        downloadReport.addEventListener("click", downloadCSV);
    }

    if (logoutButton) {
        logoutButton.addEventListener("click", event => {
            event.preventDefault();

            const confirmed = confirm("Are you sure you want to log out?");

            if (confirmed) {
                clearSession();
                window.location.href = "index.html";
            }
        });
    }

    async function initializeReports() {
        if (!getToken()) {
            window.location.href = "index.html";
            return;
        }

        try {
            const userAuthenticated = await fetchUser();

            if (!userAuthenticated) return;

            const transactionsLoaded = await fetchTransactions();

            if (!transactionsLoaded) return;

            updateReport();

        } catch (error) {
            console.error("Reports loading error:", error);

            if (reportEmptyState) {
                reportEmptyState.hidden = false;
                reportEmptyState.textContent =
                    "Unable to load your reports. Please refresh the page.";
            }
        }
    }

    initializeReports();
});