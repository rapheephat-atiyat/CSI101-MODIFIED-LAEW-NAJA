/**
 * ไม่รู้จะเขียนทำไมสุดท้ายมันก็ไม่รู้ แต่เขียนไว้ก่อน 55555
 * @typedef {Object} UserData
 * @property {string} id
 * @property {string} email
 * @property {string} [username]
 * @property {string} [firstname]
 * @property {string} [lastname]
 * @property {string} [birthdate]
 * @property {string} [image]
 * @property {"CUSTOMER" | "VENDOR" | "ADMIN"} role
 * @property {string} createdAt
 * @property {string} updatedAt
 */

class UserManager {
    static API_URL = window.APP_CONFIG.API_BASE_URL;

    static _getHeaders() {
        const token = localStorage.getItem("jwt");
        return {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        };
    }

    static async _handleResponse(res) {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || data.error || "Error");
        return data;
    }

    static async update(id, data) {
        const res = await fetch(`${this.API_URL}/users/${id}`, {
            method: "PATCH",
            headers: this._getHeaders(),
            body: JSON.stringify(data)
        });
        return this._handleResponse(res);
    }

    static async updateAddress(id, data) {
        const res = await fetch(`${this.API_URL}/addresses/${id}`, {
            method: "PATCH",
            headers: this._getHeaders(),
            body: JSON.stringify(data)
        });
        return this._handleResponse(res);
    }

    static async deleteAddress(id) {
        const headers = this._getHeaders();
        delete headers["Content-Type"];

        const res = await fetch(`${this.API_URL}/addresses/${id}`, {
            method: "DELETE",
            headers: headers
        });
        return this._handleResponse(res);
    }
}

window.UserManager = UserManager;