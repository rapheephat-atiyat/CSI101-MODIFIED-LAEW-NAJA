class ChatWidget extends HTMLElement {
    constructor() {
        super();
        this.auth = new AuthManager();
        this.isOpen = false;
        this.activeRoomId = null;
        this.pollInterval = null;
        this.currentUser = null;
        this.rooms = [];
    }

    async connectedCallback() {
        if (!this.auth.isLoggedIn()) {
            this.style.display = 'none';
            return;
        }

        const profile = await this.auth.getProfile();
        this.currentUser = profile?.user;

        this.render();
        this.setupEventListeners();
        this.startPolling();

        if (window.lucide) window.lucide.createIcons();
    }

    disconnectedCallback() {
        if (this.pollInterval) clearInterval(this.pollInterval);
    }

    startPolling() {
        this.pollInterval = setInterval(async () => {
            if (this.isOpen) {
                if (this.activeRoomId) {
                    await this.loadMessages(this.activeRoomId, true);
                } else {
                    await this.loadRooms(true);
                }
            }
        }, 3000);
    }

    render() {
        this.innerHTML = `
            <div id="chat-widget-container" class="fixed bottom-5 right-5 z-[9999] font-['Prompt',sans-serif] flex flex-col items-end gap-3">
                
                <div id="chat-window" class="hidden w-[360px] h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right transform scale-95 opacity-0">
                    
                    <div class="bg-blue-600 text-white p-4 flex items-center justify-between shadow-sm z-10 shrink-0">
                        <div class="flex items-center gap-3">
                            <button id="chat-back-btn" class="hidden p-1 hover:bg-blue-700 rounded-full transition">
                                <i data-lucide="arrow-left" class="w-5 h-5"></i>
                            </button>
                            <div id="chat-header-title" class="font-bold text-lg">ข้อความ</div>
                        </div>
                        <button id="chat-close-btn" class="p-1 hover:bg-blue-700 rounded-full transition">
                            <i data-lucide="x" class="w-5 h-5"></i>
                        </button>
                    </div>

                    <div id="chat-room-list" class="flex-1 overflow-y-auto bg-gray-50">
                        <div class="p-10 text-center text-gray-400 text-sm flex flex-col items-center">
                            <i data-lucide="loader-circle" class="w-8 h-8 animate-spin mb-2"></i>
                            กำลังโหลด...
                        </div>
                    </div>

                    <div id="chat-message-view" class="hidden flex-1 flex flex-col bg-[#f0f2f5] overflow-hidden">
                        <div id="chat-messages" class="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
                            </div>
                        
                        <form id="chat-form" class="p-3 bg-white border-t border-gray-100 flex gap-2 shrink-0">
                            <input type="text" id="chat-input" class="flex-1 bg-gray-100 border-0 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="พิมพ์ข้อความ..." autocomplete="off">
                            <button type="submit" class="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition shadow-sm flex-shrink-0">
                                <i data-lucide="send" class="w-4 h-4 ml-0.5"></i>
                            </button>
                        </form>
                    </div>

                </div>

                <button id="chat-launcher" class="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 group">
                    <i data-lucide="message-circle" class="w-7 h-7 transition-transform group-hover:rotate-12"></i>
                </button>

            </div>
        `;
    }

    setupEventListeners() {
        const launcher = this.querySelector('#chat-launcher');
        const windowEl = this.querySelector('#chat-window');
        const closeBtn = this.querySelector('#chat-close-btn');
        const backBtn = this.querySelector('#chat-back-btn');
        const form = this.querySelector('#chat-form');

        const toggleChat = () => {
            this.isOpen = !this.isOpen;
            if (this.isOpen) {
                windowEl.classList.remove('hidden');
                setTimeout(() => {
                    windowEl.classList.remove('scale-95', 'opacity-0');
                }, 10);

                if (!this.activeRoomId) {
                    this.loadRooms();
                }
            } else {
                windowEl.classList.add('scale-95', 'opacity-0');
                setTimeout(() => {
                    windowEl.classList.add('hidden');
                }, 300);
            }
        };

        launcher.addEventListener('click', toggleChat);
        closeBtn.addEventListener('click', toggleChat);

        backBtn.addEventListener('click', () => {
            this.activeRoomId = null;
            this.showRoomList();
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const input = this.querySelector('#chat-input');
            const content = input.value.trim();

            if (content && this.activeRoomId) {
                input.value = '';
                try {
                    await ChatManager.sendMessage(this.activeRoomId, content);
                    await this.loadMessages(this.activeRoomId, true);
                    this.scrollToBottom();
                } catch (err) {
                    console.error(err);
                }
            }
        });
    }

    showRoomList() {
        this.querySelector('#chat-room-list').classList.remove('hidden');
        this.querySelector('#chat-message-view').classList.add('hidden');
        this.querySelector('#chat-back-btn').classList.add('hidden');
        this.querySelector('#chat-header-title').textContent = 'ข้อความ';
        this.loadRooms();
    }

    showChatRoom(roomName) {
        this.querySelector('#chat-room-list').classList.add('hidden');
        this.querySelector('#chat-message-view').classList.remove('hidden');
        this.querySelector('#chat-back-btn').classList.remove('hidden');
        this.querySelector('#chat-header-title').textContent = roomName;
        this.scrollToBottom();

        setTimeout(() => this.querySelector('#chat-input').focus(), 300);
    }

    async loadRooms(silent = false) {
        const listContainer = this.querySelector('#chat-room-list');
        try {
            const res = await ChatManager.getMyRooms();
            this.rooms = res.data || [];

            if (this.rooms.length === 0) {
                listContainer.innerHTML = `
                    <div class="h-full flex flex-col items-center justify-center text-gray-400 p-6">
                        <i data-lucide="message-square-off" class="w-12 h-12 mb-2 opacity-50"></i>
                        <span>ยังไม่มีการสนทนา</span>
                    </div>
                `;
                if (window.lucide) window.lucide.createIcons();
                return;
            }

            listContainer.innerHTML = this.rooms.map(room => {
                const other = room.otherMember;
                const name = other.vendorProfile?.shopName || `${other.firstname} ${other.lastname}`;
                const avatar = other.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=64`;
                const lastMsg = room.lastMessage ? room.lastMessage.content : 'เริ่มการสนทนา';
                const time = room.lastMessage ? this.formatTimeShort(room.lastMessage.createdAt) : '';

                return `
                    <div class="room-item p-3 border-b border-gray-100 hover:bg-white cursor-pointer transition-colors flex gap-3 items-center" data-id="${room.id}" data-name="${name}">
                        <img src="${avatar}" class="w-12 h-12 rounded-full object-cover bg-gray-200 border border-gray-100 shadow-sm shrink-0">
                        <div class="flex-1 min-w-0">
                            <div class="flex justify-between items-baseline">
                                <h4 class="font-semibold text-gray-800 text-sm truncate">${name}</h4>
                                <span class="text-[10px] text-gray-400 whitespace-nowrap ml-2">${time}</span>
                            </div>
                            <p class="text-xs text-gray-500 truncate mt-0.5">${lastMsg}</p>
                        </div>
                    </div>
                `;
            }).join('');

            listContainer.querySelectorAll('.room-item').forEach(item => {
                item.addEventListener('click', () => {
                    this.activeRoomId = item.dataset.id;
                    const roomName = item.dataset.name;
                    this.showChatRoom(roomName);
                    this.loadMessages(this.activeRoomId);
                });
            });

        } catch (error) {
            if (!silent) console.error(error);
        }
    }

    async loadMessages(roomId, silent = false) {
        const container = this.querySelector('#chat-messages');
        if (!silent) container.innerHTML = `<div class="flex justify-center pt-10"><i data-lucide="loader-circle" class="w-6 h-6 animate-spin text-gray-400"></i></div>`;
        if (window.lucide) window.lucide.createIcons();

        try {
            const res = await ChatManager.getMessages(roomId);
            const messages = res.data || [];

            container.innerHTML = messages.map(msg => {
                const isMe = msg.senderId === this.currentUser.id;
                return `
                    <div class="flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in-up">
                        <div class="max-w-[75%] ${isMe ? 'bg-blue-600 text-white rounded-l-2xl rounded-tr-2xl' : 'bg-white text-gray-800 border border-gray-200 rounded-r-2xl rounded-tl-2xl'} px-3 py-2 shadow-sm text-sm relative group">
                            <p class="leading-relaxed">${msg.content}</p>
                            <div class="text-[9px] ${isMe ? 'text-blue-200' : 'text-gray-400'} text-right mt-1 opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-4 right-0 w-full pr-1">
                                ${this.formatTimeFull(msg.createdAt)}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            if (!silent) this.scrollToBottom();

        } catch (error) {
            console.error(error);
        }
    }

    scrollToBottom() {
        const container = this.querySelector('#chat-messages');
        container.scrollTop = container.scrollHeight;
    }

    formatTimeShort(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
    }

    formatTimeFull(dateString) {
        return new Date(dateString).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    }

    async openChatWith(targetUserId) {
        if (!this.isOpen) this.querySelector('#chat-launcher').click();

        this.querySelector('#chat-room-list').innerHTML = `<div class="p-10 text-center text-gray-500"><i data-lucide="loader-circle" class="w-8 h-8 animate-spin mx-auto"></i> กำลังสร้างห้องแชท...</div>`;
        if (window.lucide) window.lucide.createIcons();

        try {
            const res = await ChatManager.initiateChat(targetUserId);
            const room = res.data;

            this.activeRoomId = room.id;
            const other = room.members.find(m => m.userId !== this.currentUser.id)?.user;
            const name = other?.vendorProfile?.shopName || `${other?.firstname} ${other?.lastname}`;

            this.showChatRoom(name);
            this.loadMessages(room.id);

        } catch (error) {
            console.error("Init chat failed", error);
            Swal.fire('ข้อผิดพลาด', 'ไม่สามารถเริ่มการสนทนาได้', 'error');
        }
    }
}

customElements.define('chat-widget', ChatWidget);