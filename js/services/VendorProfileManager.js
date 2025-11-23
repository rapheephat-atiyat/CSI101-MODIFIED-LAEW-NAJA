class VendorProfileManager {
    static BASE_API_URL = window.APP_CONFIG.BASE_URL;

    static async _handleResponse(res) {
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.message || data.error || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
        }
        return data;
    }

    static async getShopProfile(vendorId) {
        const res = await fetch(`${this.BASE_API_URL}/api/shop/${vendorId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });
        return this._handleResponse(res);
    }
}

window.VendorProfileManager = VendorProfileManager;