document.addEventListener("DOMContentLoaded", () => {
    const themeSelect = document.getElementById("themeSelect");
    const currencySelect = document.getElementById("currencySelect");

    const transactionNotifications = document.getElementById("transactionNotifications");
    const budgetNotifications = document.getElementById("budgetNotifications");
    const hideBalance = document.getElementById("hideBalance");

    const saveSettingsButton = document.getElementById("saveSettings");
    const settingsMessage = document.getElementById("settingsMessage");

    const userNameElement = document.getElementById("userName");
    const userAvatar = document.getElementById("userAvatar");

    const logoutButton = document.getElementById("logoutButton");
    const settingsLogout = document.getElementById("settingsLogout");

    const defaultSettings = {
        theme: "light",
        currency: "NGN",
        transactionNotifications: false,
        budgetNotifications: false,
        hideBalance: false
    };

    function getSettings() {
        try {
            const savedSettings = JSON.parse(
                localStorage.getItem("appSettings") || "{}"
            );

            return {
                ...defaultSettings,
                ...savedSettings
            };
        } catch (error) {
            return { ...defaultSettings };
        }
    }

    function applyTheme(theme) {
    document.documentElement.classList.toggle(
        "dark-theme",
        theme === "dark"
    );

    document.body.classList.toggle(
        "dark-theme",
        theme === "dark"
    );

    localStorage.setItem("appTheme", theme);
}
    function applyHideBalance(hidden) {
        document.body.classList.toggle(
            "balance-hidden",
            hidden
        );
    }

    function applySettings(settings) {
        applyTheme(settings.theme);
        applyHideBalance(settings.hideBalance);

        document.dispatchEvent(
            new CustomEvent("appSettingsChanged", {
                detail: settings
            })
        );
    }

    function loadSettings() {
        const settings = getSettings();

        if (themeSelect) {
            themeSelect.value = settings.theme;
        }

        if (currencySelect) {
            currencySelect.value = settings.currency;
        }

        if (transactionNotifications) {
            transactionNotifications.checked =
                settings.transactionNotifications;
        }

        if (budgetNotifications) {
            budgetNotifications.checked =
                settings.budgetNotifications;
        }

        if (hideBalance) {
            hideBalance.checked = settings.hideBalance;
        }

        applySettings(settings);
    }

    function saveSettings() {
        const settings = {
            theme: themeSelect
                ? themeSelect.value
                : defaultSettings.theme,

            currency: currencySelect
                ? currencySelect.value
                : defaultSettings.currency,

            transactionNotifications: transactionNotifications
                ? transactionNotifications.checked
                : false,

            budgetNotifications: budgetNotifications
                ? budgetNotifications.checked
                : false,

            hideBalance: hideBalance
                ? hideBalance.checked
                : false
        };

        localStorage.setItem(
            "appSettings",
            JSON.stringify(settings)
        );

        applySettings(settings);

        if (settingsMessage) {
            settingsMessage.textContent =
                "Your settings have been saved successfully!";

            settingsMessage.style.color = "#16a36a";

            setTimeout(() => {
                settingsMessage.textContent = "";
            }, 3000);
        }
    }

    if (themeSelect) {
        themeSelect.addEventListener("change", () => {
            applyTheme(themeSelect.value);

            const settings = getSettings();
            settings.theme = themeSelect.value;

            localStorage.setItem(
                "appSettings",
                JSON.stringify(settings)
            );

            document.dispatchEvent(
                new CustomEvent("appSettingsChanged", {
                    detail: settings
                })
            );
        });
    }

    if (saveSettingsButton) {
        saveSettingsButton.addEventListener(
            "click",
            saveSettings
        );
    }

    function displayUser() {
        const storedUser = JSON.parse(
            localStorage.getItem("user") ||
            sessionStorage.getItem("user") ||
            "{}"
        );

        const savedName =
            localStorage.getItem("userName") ||
            sessionStorage.getItem("userName") ||
            storedUser.name ||
            "User";

        if (userNameElement) {
            userNameElement.textContent = savedName;
        }

        if (userAvatar) {
            const initials = savedName
                .trim()
                .split(/\s+/)
                .map(name => name.charAt(0))
                .join("")
                .substring(0, 2)
                .toUpperCase();

            userAvatar.textContent = initials || "U";
        }
    }

    function logout() {
        const confirmed = confirm(
            "Are you sure you want to log out?"
        );

        if (!confirmed) return;

        localStorage.removeItem("userName");
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        sessionStorage.removeItem("userName");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");

        window.location.href = "index.html";
    }

    if (logoutButton) {
        logoutButton.addEventListener("click", event => {
            event.preventDefault();
            logout();
        });
    }

    if (settingsLogout) {
        settingsLogout.addEventListener("click", event => {
            event.preventDefault();
            logout();
        });
    }

    loadSettings();
    displayUser();
});