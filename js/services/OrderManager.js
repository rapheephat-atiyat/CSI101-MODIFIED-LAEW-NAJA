class OrderManager {
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

    static async createOrder(orderData) {
        const res = await fetch(`${this.BASE_API_URL}/api/orders`, {
            method: "POST",
            headers: this._getHeaders(),
            body: JSON.stringify(orderData)
        });
        return this._handleResponse(res);
    }

    static async getMyOrders() {
        const res = await fetch(`${this.BASE_API_URL}/api/orders/my-orders`, {
            method: "GET",
            headers: this._getHeaders()
        });
        return this._handleResponse(res);
    }

    static async getVendorOrders() {
        const res = await fetch(`${this.BASE_API_URL}/api/vendor/orders`, {
            method: "GET",
            headers: this._getHeaders()
        });
        return this._handleResponse(res);
    }

    static async updateStatus(orderId, status) {
        const res = await fetch(`${this.BASE_API_URL}/api/vendor/orders/${orderId}/status`, {
            method: "PATCH",
            headers: this._getHeaders(),
            body: JSON.stringify({ status })
        });
        return this._handleResponse(res);
    }

    static async deleteOrder(orderId) {
        const headers = this._getHeaders();
        delete headers["Content-Type"];
        const res = await fetch(`${this.BASE_API_URL}/api/orders/${orderId}`, {
            method: "DELETE",
            headers: headers
        });
        return this._handleResponse(res);
    }
}

window.OrderManager = OrderManager;