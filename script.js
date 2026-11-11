const API_BASE_URL = "https://expense-tracker-backend-80ae.onrender.com/api";

const passwordToggles = document.querySelectorAll(".password-toggle");

passwordToggles.forEach((toggle) => {
    toggle.addEventListener("click", () => {
        const targetId = toggle.dataset.target;
        const passwordInput = document.getElementById(targetId);
        const toggleText = toggle.querySelector("span");

        if (!passwordInput) return;

        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            toggleText.textContent = "Hide";
            toggle.setAttribute("aria-label", "Hide password");
        } else {
            passwordInput.type = "password";
            toggleText.textContent = "Show";
            toggle.setAttribute("aria-label", "Show password");
        }
    });
});

function saveUserSession(data, rememberMe) {
    const storage = rememberMe ? localStorage : sessionStorage;

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    storage.setItem("token", data.token);
    storage.setItem("user", JSON.stringify(data.user));
}

function showFormMessage(element, message, type) {
    if (!element) return;

    element.textContent = message;
    element.className = "";
    element.classList.add(type);
}


async function getErrorMessage(response) {
    try {
        const data = await response.json();
        return data.message || "Something went wrong. Please try again.";
    } catch (error) {
        return "Unable to communicate with the server.";
    }
}
const signupForm = document.getElementById("signupForm");
const signupMessage = document.getElementById("signupMessage");

if (signupForm) {
    signupForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const name = document.getElementById("signupName").value.trim();
        const email = document.getElementById("signupEmail").value.trim();
        const password = document.getElementById("signupPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        signupMessage.textContent = "";
        signupMessage.className = "";

        if (password !== confirmPassword) {
            showFormMessage(
                signupMessage,
                "Passwords do not match.",
                "error"
            );
            return;
        }

        if (password.length < 8) {
            showFormMessage(
                signupMessage,
                "Password must contain at least 8 characters.",
                "error"
            );
            return;
        }

        const submitButton = signupForm.querySelector(
            'button[type="submit"]'
        );

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Creating Account...";
        }

        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    email,
                    password
                })
            });

            if (!response.ok) {
                const message = await getErrorMessage(response);

                showFormMessage(signupMessage, message, "error");
                return;
            }

            showFormMessage(
                signupMessage,
                "Account created successfully. Logging you in...",
                "success"
            );

            const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });

            if (!loginResponse.ok) {
                showFormMessage(
                    signupMessage,
                    "Your account was created. Please log in using your new account.",
                    "success"
                );
                return;
            }

            const loginData = await loginResponse.json();

            saveUserSession(loginData, true);

            window.location.href = "dashboard.html";

        } catch (error) {
            console.error("Signup error:", error);

            showFormMessage(
                signupMessage,
                "Unable to connect to the server. Check that your backend is running.",
                "error"
            );

        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "Create Account";
            }
        }
    });
}
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;
        const rememberMe = document.getElementById("rememberMe").checked;

        loginMessage.textContent = "";
        loginMessage.className = "";

        const submitButton = loginForm.querySelector(
            'button[type="submit"]'
        );

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Logging In...";
        }

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });

            if (!response.ok) {
                const message = await getErrorMessage(response);

                showFormMessage(loginMessage, message, "error");
                return;
            }

            const data = await response.json();

            saveUserSession(data, rememberMe);

            showFormMessage(
                loginMessage,
                "Login successful. Redirecting...",
                "success"
            );

            window.location.href = "dashboard.html";

        } catch (error) {
            console.error("Login error:", error);

            showFormMessage(
                loginMessage,
                "Unable to connect to the server. Check that your backend is running.",
                "error"
            );

        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "Login";
            }
        }
    });
}



const goToLogin = document.getElementById("goToLogin");

if (goToLogin) {
    goToLogin.addEventListener("click", (event) => {
        event.preventDefault();

        document.getElementById("login").scrollIntoView({
            behavior: "smooth"
        });
    });
}