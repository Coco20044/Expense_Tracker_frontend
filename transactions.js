document.addEventListener("DOMContentLoaded", async () => {


    const API_BASE_URL = "https://expense-tracker-backend-80ae.onrender.com/api";

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

    async function apiRequest(endpoint, options = {}) {

        const token = getToken();

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
                ...options.headers
            }
        });

        const data = await response.json();

        if (response.status === 401) {
            clearSession();
            window.location.href = "index.html";
            throw new Error("Your session has expired. Please log in again.");
        }

        if (!response.ok) {
            throw new Error(data.message || "Something went wrong.");
        }

        return data;
    }

    if (!getToken()) {
        window.location.href = "index.html";
        return;
    }
    const transactionsTable = document.getElementById("transactionsTable");

    const totalTransactions = document.getElementById("totalTransactions");
    const totalIncome = document.getElementById("totalIncome");
    const totalExpenses = document.getElementById("totalExpenses");

    const searchInput = document.getElementById("searchTransaction");
    const typeFilter = document.getElementById("typeFilter");
    const categoryFilter = document.getElementById("categoryFilter");
    const dateFilter = document.getElementById("dateFilter");
    const clearFilters = document.getElementById("clearFilters");

    const modal = document.getElementById("transactionModal");
    const addButton = document.getElementById("addTransactionButton");
    const emptyAddButton = document.getElementById("emptyAddButton");
    const closeModal = document.getElementById("closeModal");
    const cancelButton = document.getElementById("cancelTransaction");

    const transactionForm = document.getElementById("transactionForm");

    const tableContainer = document.getElementById("tableContainer");
    const emptyState = document.getElementById("emptyState");

    const logoutButton = document.getElementById("logoutButton");

    const transactionDate = document.getElementById("transactionDate");

    const userNameElement = document.getElementById("userName");
    const userAvatar = document.getElementById("userAvatar");

    async function loadUser() {

        try {
            const data = await apiRequest("/auth/me");
            const user = data.user;

            localStorage.setItem("user", JSON.stringify(user));

            if (userNameElement) {
                userNameElement.textContent = user.name;
            }

            if (userAvatar) {
                userAvatar.textContent = user.name.charAt(0).toUpperCase();
            }

        } catch (error) {
            console.error("Could not load user:", error.message);
        }
    }
    let transactions = [];

    function formatCurrency(amount) {

        return new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
            minimumFractionDigits: 2
        }).format(amount);
    }

    function getDateOnly(date) {

        if (!date) return "";

        if (date instanceof Date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");

            return `${year}-${month}-${day}`;
        }

        return String(date).slice(0, 10);
    }


    function formatDate(date) {

        const dateOnly = getDateOnly(date);

        if (!dateOnly) return "—";

        const parsedDate = new Date(`${dateOnly}T00:00:00`);

        return parsedDate.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    }
    function updateSummary() {

        const income = transactions
            .filter(transaction => transaction.type === "income")
            .reduce((total, transaction) => total + Number(transaction.amount), 0);

        const expenses = transactions
            .filter(transaction => transaction.type === "expense")
            .reduce((total, transaction) => total + Number(transaction.amount), 0);

        if (totalTransactions) {
            totalTransactions.textContent = transactions.length;
        }

        if (totalIncome) {
            totalIncome.textContent = formatCurrency(income);
        }

        if (totalExpenses) {
            totalExpenses.textContent = formatCurrency(expenses);
        }
    }

    function displayTransactions(list = transactions) {

        transactionsTable.innerHTML = "";

        if (list.length === 0) {
            tableContainer.hidden = true;
            emptyState.hidden = false;
            return;
        }

        tableContainer.hidden = false;
        emptyState.hidden = true;

        list.forEach(transaction => {

            const row = document.createElement("tr");

            const isIncome = transaction.type === "income";

            const descriptionCell = document.createElement("td");
            descriptionCell.className = "transaction-description";
            descriptionCell.textContent = transaction.description || "—";

            const categoryCell = document.createElement("td");
            categoryCell.className = "transaction-category";
            categoryCell.textContent = transaction.category;

            const dateCell = document.createElement("td");
            dateCell.textContent = formatDate(transaction.transaction_date);

            const typeCell = document.createElement("td");
            const typeBadge = document.createElement("span");

            typeBadge.className = `transaction-type ${isIncome ? "type-income" : "type-expense"}`;
            typeBadge.textContent = isIncome ? "Income" : "Expense";

            typeCell.appendChild(typeBadge);

            const amountCell = document.createElement("td");
            amountCell.className = isIncome ? "income-amount" : "expense-amount";

            amountCell.textContent =
                `${isIncome ? "+" : "-"}${formatCurrency(Number(transaction.amount))}`;

            const actionCell = document.createElement("td");

            const deleteButton = document.createElement("button");
            deleteButton.className = "delete-button";
            deleteButton.textContent = "Delete";
            deleteButton.dataset.id = transaction.id;

            actionCell.appendChild(deleteButton);

            row.append(
                descriptionCell,
                categoryCell,
                dateCell,
                typeCell,
                amountCell,
                actionCell
            );

            transactionsTable.appendChild(row);
        });
    }

    function filterTransactions() {

        const searchValue = searchInput.value.toLowerCase().trim();
        const selectedType = typeFilter.value;
        const selectedCategory = categoryFilter.value;
        const selectedDate = dateFilter.value;

        const filteredTransactions = transactions.filter(transaction => {

            const description = (transaction.description || "").toLowerCase();
            const category = (transaction.category || "").toLowerCase();

            const matchesSearch =
                description.includes(searchValue) ||
                category.includes(searchValue);

            const matchesType =
                selectedType === "all" ||
                transaction.type === selectedType;

            const matchesCategory =
                selectedCategory === "all" ||
                transaction.category === selectedCategory;

            const matchesDate =
                !selectedDate ||
                getDateOnly(transaction.transaction_date) === selectedDate;

            return (
                matchesSearch &&
                matchesType &&
                matchesCategory &&
                matchesDate
            );
        });

        displayTransactions(filteredTransactions);
    }


    searchInput.addEventListener("input", filterTransactions);
    typeFilter.addEventListener("change", filterTransactions);
    categoryFilter.addEventListener("change", filterTransactions);
    dateFilter.addEventListener("change", filterTransactions);
    clearFilters.addEventListener("click", () => {

        searchInput.value = "";
        typeFilter.value = "all";
        categoryFilter.value = "all";
        dateFilter.value = "";

        displayTransactions();
    });

    function openTransactionModal() {
        modal.hidden = false;
    }

    function closeTransactionModal() {
        modal.hidden = true;
        transactionForm.reset();
        transactionDate.value = getLocalDate();
    }

    addButton.addEventListener("click", openTransactionModal);
    emptyAddButton.addEventListener("click", openTransactionModal);

    closeModal.addEventListener("click", closeTransactionModal);
    cancelButton.addEventListener("click", closeTransactionModal);

    modal.addEventListener("click", (event) => {

        if (event.target === modal) {
            closeTransactionModal();
        }

    });
    function getLocalDate() {

        const today = new Date();

        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    transactionDate.value = getLocalDate();
    async function loadTransactions() {

        try {
            const data = await apiRequest("/transactions");

            transactions = data.transactions || [];

            updateSummary();
            filterTransactions();

        } catch (error) {
            console.error("Could not load transactions:", error.message);
            alert(error.message);
        }
    }

    transactionForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const type = document.getElementById("transactionType").value;

        const description = document
            .getElementById("transactionDescription")
            .value.trim();

        const amount = Number(
            document.getElementById("transactionAmount").value
        );

        const category = document.getElementById("transactionCategory").value;

        const date = transactionDate.value;

        if (
            !description ||
            !type ||
            !category ||
            !date ||
            !Number.isFinite(amount) ||
            amount <= 0
        ) {
            alert("Please enter valid transaction details.");
            return;
        }

        const newTransaction = {
            type,
            amount,
            category,
            description,
            transaction_date: date
        };

        try {

            await apiRequest("/transactions", {
                method: "POST",
                body: JSON.stringify(newTransaction)
            });

            await loadTransactions();

            closeTransactionModal();

            alert("Transaction added successfully!");

        } catch (error) {
            console.error("Adding transaction failed:", error.message);
            alert(error.message);
        }

    });

    transactionsTable.addEventListener("click", async (event) => {

        if (event.target.classList.contains("delete-button")) {

            const transactionId = event.target.dataset.id;

            const confirmed = confirm(
                "Are you sure you want to delete this transaction?"
            );

            if (!confirmed) return;

            try {

                await apiRequest(`/transactions/${transactionId}`, {
                    method: "DELETE"
                });

                await loadTransactions();

                alert("Transaction deleted successfully!");

            } catch (error) {
                console.error("Deleting transaction failed:", error.message);
                alert(error.message);
            }
        }

    });

    logoutButton.addEventListener("click", () => {

        const confirmed = confirm("Are you sure you want to log out?");

        if (confirmed) {
            clearSession();
            window.location.href = "index.html";
        }

    });
    await loadUser();
    await loadTransactions();

});