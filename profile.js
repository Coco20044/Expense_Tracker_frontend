document.addEventListener("DOMContentLoaded", () => {
    const profileForm = document.getElementById("profileForm");

    const firstNameInput = document.getElementById("firstName");
    const lastNameInput = document.getElementById("lastName");
    const emailInput = document.getElementById("email");
    const phoneInput = document.getElementById("phone");
    const bioInput = document.getElementById("bio");

    const profileDisplayName = document.getElementById("profileDisplayName");
    const profileDisplayEmail = document.getElementById("profileDisplayEmail");
    const profileAvatar = document.getElementById("profileAvatar");

    const accountEmail = document.getElementById("accountEmail");

    const userName = document.getElementById("userName");
    const userAvatar = document.getElementById("userAvatar");

    const profileMessage = document.getElementById("profileMessage");
    const logoutButton = document.getElementById("logoutButton");

    const API_BASE_URL = "https://expense-tracker-backend-80ae.onrender.com/api";

    const token =
        localStorage.getItem("token") ||
        sessionStorage.getItem("token");

    let originalProfile = {};

    if (!token) {
        window.location.href = "index.html";
        return;
    }

    function showMessage(message, color) {
        profileMessage.textContent = message;
        profileMessage.style.color = color;
    }

    function updateProfileDisplay() {
        const firstName = firstNameInput.value.trim();
        const lastName = lastNameInput.value.trim();
        const email = emailInput.value.trim();

        const fullName = `${firstName} ${lastName}`.trim();
        const displayName = fullName || "User";
        const avatarLetter = firstName
            ? firstName.charAt(0).toUpperCase()
            : "U";

        profileDisplayName.textContent = displayName;
        profileDisplayEmail.textContent = email || "No email added";
        profileAvatar.textContent = avatarLetter;

        accountEmail.textContent = email || "No email added";

        userName.textContent = displayName;
        userAvatar.textContent = avatarLetter;
    }

    function populateProfile(user) {
        const nameParts = (user.name || "").trim().split(/\s+/);

        firstNameInput.value = nameParts.shift() || "";
        lastNameInput.value = nameParts.join(" ");
        emailInput.value = user.email || "";
        phoneInput.value = user.phone || "";
        bioInput.value = user.bio || "";

        originalProfile = {
            firstName: firstNameInput.value,
            lastName: lastNameInput.value,
            email: emailInput.value,
            phone: phoneInput.value,
            bio: bioInput.value
        };

        localStorage.setItem("userName", user.name || "");

        const storedUser = JSON.parse(
            localStorage.getItem("user") || "{}"
        );

        localStorage.setItem(
            "user",
            JSON.stringify({
                ...storedUser,
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                bio: user.bio
            })
        );

        updateProfileDisplay();
    }

    async function loadProfile() {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/me`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.status === 401) {
                localStorage.removeItem("token");
                sessionStorage.removeItem("token");
                localStorage.removeItem("user");
                sessionStorage.removeItem("user");
                localStorage.removeItem("userName");
                sessionStorage.removeItem("userName");

                window.location.href = "index.html";
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to load profile.");
            }

            populateProfile(data.user);

        } catch (error) {
            showMessage(error.message, "var(--red)");
        }
    }

    profileForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const firstName = firstNameInput.value.trim();
        const lastName = lastNameInput.value.trim();
        const email = emailInput.value.trim();
        const phone = phoneInput.value.trim();
        const bio = bioInput.value.trim();

        if (!firstName || !lastName || !email) {
            showMessage(
                "Please fill in all required fields.",
                "var(--red)"
            );
            return;
        }

        const submitButton = profileForm.querySelector(
            'button[type="submit"]'
        );

        if (submitButton) {
            submitButton.disabled = true;
        }

        showMessage("Saving your profile...", "var(--text-muted)");

        try {
            const response = await fetch(`${API_BASE_URL}/auth/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: `${firstName} ${lastName}`.trim(),
                    email,
                    phone,
                    bio
                })
            });

            if (response.status === 401) {
                localStorage.removeItem("token");
                sessionStorage.removeItem("token");
                localStorage.removeItem("user");
                sessionStorage.removeItem("user");
                localStorage.removeItem("userName");
                sessionStorage.removeItem("userName");

                window.location.href = "index.html";
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to update profile.");
            }

            populateProfile(data.user);

            showMessage(
                "Your profile has been updated successfully!",
                "var(--green)"
            );

        } catch (error) {
            showMessage(error.message, "var(--red)");
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
            }
        }
    });

    profileForm.addEventListener("reset", () => {
        setTimeout(() => {
            firstNameInput.value = originalProfile.firstName || "";
            lastNameInput.value = originalProfile.lastName || "";
            emailInput.value = originalProfile.email || "";
            phoneInput.value = originalProfile.phone || "";
            bioInput.value = originalProfile.bio || "";

            profileMessage.textContent = "";
            updateProfileDisplay();
        }, 0);
    });

    logoutButton.addEventListener("click", () => {
        const confirmed = confirm("Are you sure you want to log out?");

        if (confirmed) {
            localStorage.removeItem("userName");
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            sessionStorage.removeItem("userName");
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("user");

            window.location.href = "index.html";
        }
    });

    loadProfile();
});