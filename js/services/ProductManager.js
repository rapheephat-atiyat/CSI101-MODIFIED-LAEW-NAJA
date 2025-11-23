class ProductManager {
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

    static async getProduct(productId) {
        const res = await fetch(`${this.BASE_API_URL}/api/products/${productId}`, {
            method: "GET"
        });
        return this._handleResponse(res);
    }

    static async getLatestProducts() {
        const res = await fetch(`${this.BASE_API_URL}/api/products/latest`, {
            method: "GET"
        });

        if (res.status === 204 || res.status === 404) {
            return { data: [] };
        }

        // NOTE: This endpoint behaves inconsistently (sometimes requires _handleResponse, sometimes returns plain JSON/empty array)
        // Sticking to original logic for now:
        return res.json();
    }

    static async getRelatedProducts(productId) {
        const res = await fetch(`${this.BASE_API_URL}/api/products/related/${productId}`, {
            method: "GET"
        });

        if (!res.ok) {
            if (res.status !== 404) {
                const data = await res.json();
                throw new Error(data.message || data.error || "ไม่สามารถดึงสินค้าที่เกี่ยวข้องได้");
            }
            return { data: [] };
        }

        return res.json();
    }

    static async addProduct(payload) {
        const res = await fetch(`${this.BASE_API_URL}/api/products`, {
            method: "POST",
            headers: this._getHeaders(),
            body: JSON.stringify(payload)
        });
        return this._handleResponse(res);
    }

    static async updateProduct(productId, payload) {
        const res = await fetch(`${this.BASE_API_URL}/api/products/${productId}`, {
            method: "PATCH",
            headers: this._getHeaders(),
            body: JSON.stringify(payload)
        });
        return this._handleResponse(res);
    }

    static async deleteProduct(productId) {
        const res = await fetch(`${this.BASE_API_URL}/api/products/${productId}`, {
            method: "DELETE",
            headers: this._getHeaders(),
        });
        return this._handleResponse(res);
    }
}
window.ProductManager = ProductManager;