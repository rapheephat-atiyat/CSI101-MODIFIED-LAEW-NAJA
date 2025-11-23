class CartManager {
    static BASE_API_URL = window.APP_CONFIG.BASE_URL;

    static _getHeaders(contentType = "application/json") {
        const token = localStorage.getItem("jwt");
        return {
            "Content-Type": contentType,
            "Authorization": `Bearer ${token}`
        };
    }

    static async _handleResponse(res) {
        const data = await res.json();
        if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
                window.location.href = "/signIn.html";
            }
            throw new Error(data.message || data.error || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
        }
        return data;
    }

    static async getCart() {
        const res = await fetch(`${this.BASE_API_URL}/api/cart`, {
            method: "GET",
            headers: this._getHeaders(),
        });
        return this._handleResponse(res);
    }

    static async addItemToCart(vendorProductId, quantity) {
        const payload = { vendorProductId, quantity };
        const res = await fetch(`${this.BASE_API_URL}/api/cart`, {
            method: "POST",
            headers: this._getHeaders(),
            body: JSON.stringify(payload)
        });
        return this._handleResponse(res);
    }

    static async removeItem(vendorProductId) {
        const headers = this._getHeaders();
        delete headers["Content-Type"];
        const res = await fetch(`${this.BASE_API_URL}/api/cart/${vendorProductId}`, {
            method: "DELETE",
            headers: headers
        });
        return this._handleResponse(res);
    }
}

window.CartManager = CartManager;