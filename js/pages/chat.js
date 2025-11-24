class ChatPage {
    constructor() {
        this.auth = new AuthManager();
        this.activeRoomId = null;
        this.pollInterval = null;
        this.rooms = [];
        this.currentUser = null;

        this.elements = {
            roomList: document.getElementById('room-list'),
            chatWindow: document.getElementById('chat-window'),
            chatSidebar: document.getElementById('chat-sidebar'),
            chatHeader: document.getElementById('chat-header'),
            chatAvatar: document.getElementById('chat-avatar'),
            chatName: document.getElementById('chat-name'),
            messagesContainer: document.getElementById('messages-container'),
            inputArea: document.getElementById('input-area'),
            chatForm: document.getElementById('chat-form'),
            messageInput: document.getElementById('message-input'),
            backBtn: document.getElementById('back-btn')
        };

        document.addEventListener("DOMContentLoaded", () => this.init());
    }

    async init() {
        if (typeof lucide !== 'undefined') lucide.createIcons();

        if (!this.auth.isLoggedIn()) {
            window.location.href = "/signIn.html";
            return;
        }

        const profile = await this.auth.getProfile();
        this.currentUser = profile.user;

        this.setupEventListeners();
        await this.loadRooms();

        const params = new URLSearchParams(window.location.search);
        const roomIdParam = params.get('roomId');
        if (roomIdParam) {
            this.selectRoom(roomIdParam);
        }

        this.startPolling();
    }

    startPolling() {
        this.pollInterval = setInterval(async () => {
            await this.loadRooms(true); // Silent reload
            if (this.activeRoomId) {
                await this.loadMessages(this.activeRoomId, true);
            }
        }, 3000);
    }

    setupEventListeners() {
        this.elements.chatForm.addEventListener('submit', (e) => this.handleSendMessage(e));
        this.elements.backBtn.addEventListener('click', () => this.showSidebar());
    }

    showSidebar() {
        this.elements.chatSidebar.classList.remove('hidden');
        this.elements.chatWindow.classList.add('hidden');
        this.elements.chatWindow.classList.remove('flex');
        this.activeRoomId = null;
        window.history.pushState({}, '', '/chat.html');
    }

    showChatWindow() {
        if (window.innerWidth < 768) {
            this.elements.chatSidebar.classList.add('hidden');
        }
        this.elements.chatWindow.classList.remove('hidden');
        this.elements.chatWindow.classList.add('flex');
    }

    async loadRooms(silent = false) {
        try {
            const res = await ChatManager.getMyRooms();
            this.rooms = res.data || [];
            this.renderRoomList();
        } catch (error) {
            if (!silent) this.elements.roomList.innerHTML = `<div class="p-4 text-center text-red-500">Failed to load chats</div>`;
        }
    }

    renderRoomList() {
        if (this.rooms.length === 0) {
            this.elements.roomList.innerHTML = `<div class="p-10 text-center text-gray-400 text-sm">ไม่มีประวัติการแชท</div>`;
            return;
        }

        this.elements.roomList.innerHTML = this.rooms.map(room => {
            const other = room.otherMember;
            const name = other.vendorProfile?.shopName || `${other.firstname} ${other.lastname}`;
            const avatar = other.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
            const lastMsg = room.lastMessage ? room.lastMessage.content : 'เริ่มการสนทนา';
            const time = room.lastMessage ? this.formatTime(room.lastMessage.createdAt) : '';
            const isActive = room.id === this.activeRoomId ? 'bg-blue-50 border-l-4 border-blue-600' : 'hover:bg-gray-50 border-l-4 border-transparent';

            return `
                <div class="room-item p-4 border-b border-gray-50 cursor-pointer transition-all ${isActive}" data-id="${room.id}">
                    <div class="flex gap-3">
                        <img src="${avatar}" class="w-12 h-12 rounded-full object-cover bg-gray-100 flex-shrink-0">
                        <div class="flex-1 min-w-0">
                            <div class="flex justify-between items-baseline">
                                <h3 class="font-semibold text-gray-900 text-sm truncate">${name}</h3>
                                <span class="text-[10px] text-gray-400">${time}</span>
                            </div>
                            <p class="text-xs text-gray-500 truncate mt-1">${lastMsg}</p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        this.elements.roomList.querySelectorAll('.room-item').forEach(item => {
            item.addEventListener('click', () => this.selectRoom(item.dataset.id));
        });
    }

    async selectRoom(roomId) {
        this.activeRoomId = roomId;
        const room = this.rooms.find(r => r.id === roomId);

        if (room) {
            const other = room.otherMember;
            const name = other.vendorProfile?.shopName || `${other.firstname} ${other.lastname}`;
            const avatar = other.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;

            this.elements.chatName.textContent = name;
            this.elements.chatAvatar.src = avatar;
        }

        this.showChatWindow();
        this.elements.inputArea.classList.remove('hidden');
        this.renderRoomList();

        const newUrl = new URL(window.location);
        newUrl.searchParams.set('roomId', roomId);
        window.history.pushState({}, '', newUrl);

        await this.loadMessages(roomId);
    }

    async loadMessages(roomId, silent = false) {
        if (!silent) {
            this.elements.messagesContainer.innerHTML = `<div class="flex justify-center pt-10"><i data-lucide="loader-circle" class="w-8 h-8 animate-spin text-gray-400"></i></div>`;
            if (window.lucide) lucide.createIcons();
        }

        try {
            const res = await ChatManager.getMessages(roomId);
            const messages = res.data;
            this.renderMessages(messages);
        } catch (error) {
            console.error(error);
        }
    }

    renderMessages(messages) {
        const container = this.elements.messagesContainer;
        const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;

        if (messages.length === 0) {
            container.innerHTML = `<div class="text-center text-gray-400 text-xs mt-10">เริ่มต้นการสนทนา</div>`;
            return;
        }

        container.innerHTML = messages.map(msg => {
            const isMe = msg.senderId === this.currentUser.id;
            const align = isMe ? 'justify-end' : 'justify-start';
            const bubble = isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none';
            const time = this.formatTime(msg.createdAt);

            return `
                <div class="flex ${align} mb-2">
                    <div class="max-w-[75%] ${bubble} px-4 py-2.5 rounded-2xl shadow-sm">
                        <p class="text-sm leading-relaxed">${msg.content}</p>
                        <p class="text-[10px] ${isMe ? 'text-blue-100' : 'text-gray-400'} text-right mt-1">${time}</p>
                    </div>
                </div>
            `;
        }).join('');

        if (isAtBottom) {
            container.scrollTop = container.scrollHeight;
        }
    }

    async handleSendMessage(e) {
        e.preventDefault();
        const content = this.elements.messageInput.value.trim();
        if (!content || !this.activeRoomId) return;

        this.elements.messageInput.value = '';

        try {
            await ChatManager.sendMessage(this.activeRoomId, content);
            await this.loadMessages(this.activeRoomId, true);
            await this.loadRooms(true);
        } catch (error) {
            console.error("Failed to send", error);
        }
    }

    formatTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    }
}

window.chatPage = new ChatPage();