class AdminManager {
    static BASE_API_URL = window.APP_CONFIG.API_BASE_URL;

    static _getHeaders() {
        const token = localStorage.getItem("jwt");
        return {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        };
    }

    static async _handleResponse(res) {
        const data = await res.json();

        if (!res.ok) {
            if (res.status === 401) {
                window.location.href = "/signIn.html";
            }
            throw new Error(data.message || data.error || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
        }
        return data;
    }

    static async getVendorRequests() {
        const res = await fetch(`${this.BASE_API_URL}/admin/vendor-requests`, {
            method: "GET",
            headers: this._getHeaders(),
        });
        return this._handleResponse(res);
    }

    static async updateVendorRequestStatus(id, action) {
        const res = await fetch(`${this.BASE_API_URL}/admin/vendor-requests/${id}/status`, {
            method: "POST",
            headers: this._getHeaders(),
            body: JSON.stringify({ action })
        });
        return this._handleResponse(res);
    }

    static async getUsers() {
        const res = await fetch(`${this.BASE_API_URL}/admin/users`, {
            method: "GET",
            headers: this._getHeaders(),
        });
        return this._handleResponse(res);
    }

    static async updateUserRole(id, newRole) {
        const res = await fetch(`${this.BASE_API_URL}/admin/users/${id}/role`, {
            method: "PATCH",
            headers: this._getHeaders(),
            body: JSON.stringify({ role: newRole })
        });
        return this._handleResponse(res);
    }

    static async deleteUser(id) {
        const res = await fetch(`${this.BASE_API_URL}/admin/users/${id}`, {
            method: "DELETE",
            headers: this._getHeaders(),
        });
        return this._handleResponse(res);
    }
}
window.AdminManager = AdminManager;