class ChatManager {
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
            throw new Error(data.message || "Error");
        }
        return res.json();
    }

    static async initiateChat(targetUserId) {
        const res = await fetch(`${this.BASE_API_URL}/api/chats/initiate`, {
            method: "POST",
            headers: this._getHeaders(),
            body: JSON.stringify({ targetUserId })
        });
        return this._handleResponse(res);
    }

    static async getMyRooms() {
        const res = await fetch(`${this.BASE_API_URL}/api/chats`, {
            method: "GET",
            headers: this._getHeaders()
        });
        return this._handleResponse(res);
    }

    static async getMessages(roomId) {
        const res = await fetch(`${this.BASE_API_URL}/api/chats/${roomId}/messages`, {
            method: "GET",
            headers: this._getHeaders()
        });
        return this._handleResponse(res);
    }

    static async sendMessage(roomId, content, images = []) {
        const res = await fetch(`${this.BASE_API_URL}/api/chats/${roomId}/messages`, {
            method: "POST",
            headers: this._getHeaders(),
            body: JSON.stringify({ content, images })
        });
        return this._handleResponse(res);
    }
}

window.ChatManager = ChatManager;