class NotificationManager {
    static BASE_API_URL = window.APP_CONFIG.API_BASE_URL;

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

    static async getNotifications() {
        const headers = this._getHeaders();
        delete headers["Content-Type"];

        const res = await fetch(`${this.BASE_API_URL}/notifications`, {
            method: "GET",
            headers: headers,
        });
        return this._handleResponse(res);
    }

    static async getUnreadCount() {
        const headers = this._getHeaders();
        delete headers["Content-Type"];

        const res = await fetch(`${this.BASE_API_URL}/notifications/count`, {
            method: "GET",
            headers: headers,
        });
        return this._handleResponse(res);
    }

    static async markAsRead(notificationId) {
        const headers = this._getHeaders();
        delete headers["Content-Type"];

        const res = await fetch(`${this.BASE_API_URL}/notifications/${notificationId}/read`, {
            method: "PATCH",
            headers: headers,
        });
        return this._handleResponse(res);
    }

    static async sendNotification(userId, type, content) {
        const payload = { userId, type, content };
        const res = await fetch(`${this.BASE_API_URL}/notifications`, {
            method: "POST",
            headers: this._getHeaders(),
            body: JSON.stringify(payload)
        });
        return this._handleResponse(res);
    }
}

window.NotificationManager = NotificationManager;