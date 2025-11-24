class FavoriteManager {
    static BASE_API_URL = window.APP_CONFIG.BASE_URL;

    static _getHeaders() {
        const token = localStorage.getItem("jwt");
        return {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        };
    }

    static async _handleResponse(res) {
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message || "Connection error");
        }
        return res.json();
    }

    static async getMyFavorites() {
        const headers = this._getHeaders();
        delete headers["Content-Type"];
        const res = await fetch(`${this.BASE_API_URL}/api/favorites`, {
            method: "GET",
            headers: headers
        });
        return this._handleResponse(res);
    }

    static async addFavorite(productId) {
        const res = await fetch(`${this.BASE_API_URL}/api/favorites`, {
            method: "POST",
            headers: this._getHeaders(),
            body: JSON.stringify({ productId })
        });
        return this._handleResponse(res);
    }

    static async removeFavorite(productId) {
        const headers = this._getHeaders();
        delete headers["Content-Type"];
        const res = await fetch(`${this.BASE_API_URL}/api/favorites/${productId}`, {
            method: "DELETE",
            headers: headers
        });
        return this._handleResponse(res);
    }

    static async checkIsFavorite(productId) {
        const headers = this._getHeaders();
        delete headers["Content-Type"];
        const res = await fetch(`${this.BASE_API_URL}/api/favorites/${productId}/check`, {
            method: "GET",
            headers: headers
        });
        return this._handleResponse(res);
    }
}

window.FavoriteManager = FavoriteManager;