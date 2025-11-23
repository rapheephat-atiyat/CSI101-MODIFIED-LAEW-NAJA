/**
 * @typedef {Object} Profile
 * @property {string} id
 * @property {string} email
 * @property {string} firstname
 * @property {string} lastname
 * @property {string} role
 * @property {string} image
 */

class AuthManager {
    BASE_URL = window.APP_CONFIG.BASE_URL;
    API_BASE_URL = window.APP_CONFIG.API_BASE_URL;

    constructor() {
        this.tokenKey = "jwt";
    }

    get token() {
        return localStorage.getItem(this.tokenKey);
    }

    saveToken(token) {
        localStorage.setItem(this.tokenKey, token);
    }

    clearToken() {
        localStorage.removeItem(this.tokenKey);
    }

    isLoggedIn() {
        return !!this.token;
    }

    getDecodedToken() {
        if (!this.token) return null;
        try {
            return JSON.parse(atob(this.token.split(".")[1]));
        } catch { return null; }
    }

    async login(email, password) {
        const res = await fetch(`${this.BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Login failed");

        this.saveToken(data.token);
        return data;
    }

    async register(firstname, lastname, email, password) {
        const res = await fetch(`${this.BASE_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ firstname, lastname, email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Register failed");
        return data;
    }

    loginWithGoogle() {
        window.location.href = `${this.BASE_URL}/auth/google/login`;
    }

    logout() {
        this.clearToken();
        window.location.href = "/signIn.html";
    }

    async getProfile() {
        if (!this.isLoggedIn()) return null;
        try {
            const res = await fetch(`${this.API_BASE_URL}/api/profile`, {
                headers: { "Authorization": `Bearer ${this.token}` }
            });
            if (res.ok) return await res.json();
        } catch (e) {
            console.error(e);
        }
        const payload = this.getDecodedToken();
        return payload ? { user: payload } : null;
    }

    async requestPasswordReset(email) {
        const res = await fetch(`${this.API_BASE_URL}/api/users/forgot-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to send reset email");
        return data;
    }

    async confirmResetPassword(token, newPassword) {
        const res = await fetch(`${this.API_BASE_URL}/api/users/reset-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, newPassword })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to reset password");
        return data;
    }


    /**
     * * @param {string[]} allowedRoles
     */
    async protect(allowedRoles = []) {
        if (!this.token) {
            window.location.href = "/signIn.html";
            throw new Error("No token");
        }

        try {
            const res = await fetch(`${this.API_BASE_URL}/api/profile`, {
                headers: { "Authorization": `Bearer ${this.token}` }
            });

            if (!res.ok) {
                this.logout();
                throw new Error("Unauthorized");
            }

            const data = await res.json();
            const user = data.user;

            if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
                await Swal.fire({
                    icon: 'error',
                    title: 'ไม่มีสิทธิ์เข้าถึง',
                    text: 'คุณไม่มีสิทธิ์ใช้งานหน้านี้',
                    confirmButtonText: 'กลับหน้าหลัก'
                });
                window.location.href = "/";
                throw new Error("Forbidden");
            }

            return user;

        } catch (err) {
            if (err.message !== "Forbidden" && err.message !== "No token") {
                this.logout();
            }
            throw err;
        }
    }
}

window.AuthManager = AuthManager;