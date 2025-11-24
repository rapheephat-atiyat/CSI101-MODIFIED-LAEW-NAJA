class NotificationPage {
    constructor() {
        this.auth = typeof AuthManager !== 'undefined' ? new AuthManager() : null;
        this.allNotifications = [];

        this.elements = {
            loading: document.getElementById('loading-state'),
            error: document.getElementById('error-state'),
            notificationList: document.getElementById('notification-list'),
            markAllBtn: document.getElementById('mark-all-btn'),
            tabAll: document.getElementById('tab-all'),
            tabUnread: document.getElementById('tab-unread'),
            unreadCountBadge: document.getElementById('unread-count-badge'),
            mainContent: document.getElementById('main-content'),
            // FIX: Ensure errorMessage element is collected
            errorMessage: document.getElementById('error-message') 
        };
        this.currentFilter = 'ALL';

        document.addEventListener("DOMContentLoaded", () => this.init());
    }

    async init() {
        if (typeof lucide !== 'undefined') { lucide.createIcons(); }

        if (!this.auth || !this.auth.isLoggedIn()) {
            this.showAccessDenied();
            return;
        }
        
        this.setupTabs();
        this.setupMarkAllButton();
        await this.fetchAndRenderNotifications();
        this.updateTabStyles(); 
    }

    showAccessDenied() {
        Swal.fire({
            icon: 'error',
            title: 'ไม่อนุญาต',
            text: 'กรุณาเข้าสู่ระบบเพื่อดูการแจ้งเตือน',
            confirmButtonText: 'เข้าสู่ระบบ'
        }).then(() => {
            window.location.href = "/signIn.html";
        });
    }

    setupTabs() {
        this.elements.tabAll?.addEventListener('click', () => this.setFilter('ALL'));
        this.elements.tabUnread?.addEventListener('click', () => this.setFilter('UNREAD'));
    }

    setFilter(filter) {
        this.currentFilter = filter;
        this.updateTabStyles();
        this.renderNotificationList();
    }
    
    updateTabStyles() {
        [this.elements.tabAll, this.elements.tabUnread].forEach(tab => {
            if (!tab) return;
            const isActive = tab.dataset.filter === this.currentFilter;
            tab.classList.remove('border-blue-500', 'text-blue-600', 'border-gray-200', 'text-gray-600', 'font-semibold', 'font-medium');
            
            if (isActive) {
                tab.classList.add('border-blue-500', 'text-blue-600', 'font-semibold');
            } else {
                tab.classList.add('border-transparent', 'text-gray-600', 'font-medium', 'hover:border-gray-300');
            }
        });
    }
    
    setupMarkAllButton() {
        this.elements.markAllBtn?.addEventListener('click', () => this.handleMarkAllAsRead());
    }

    async fetchAndRenderNotifications() {
        this.toggleDisplay('loading');
        try {
            // NOTE: The API call here is likely failing with 404 (Route Not Found)
            const response = await NotificationManager.getNotifications();
            this.allNotifications = response.data || [];
            
            this.renderNotificationList();
            this.toggleDisplay('list');
            
        } catch (error) {
            this.showError(error.message || 'ไม่สามารถโหลดรายการแจ้งเตือนได้');
        }
    }

    renderNotificationList() {
        const container = this.elements.notificationList;
        if (!container) return;
        
        let filtered = this.allNotifications;
        if (this.currentFilter === 'UNREAD') {
            filtered = this.allNotifications.filter(n => n.status === 'UNREAD');
        }

        const unreadCount = this.allNotifications.filter(n => n.status === 'UNREAD').length;
        this.elements.unreadCountBadge.textContent = unreadCount > 0 ? `(${unreadCount})` : '';

        container.innerHTML = '';

        if (filtered.length === 0) {
            container.innerHTML = this.renderEmptyState();
            if (window.lucide) window.lucide.createIcons();
            return;
        }

        filtered.forEach(n => {
            const isUnread = n.status === 'UNREAD';
            const icon = this.getNotificationIcon(n.type);

            const card = document.createElement('div');
            card.className = `p-4 flex gap-4 rounded-xl transition-colors border border-gray-100 cursor-pointer ${isUnread ? 'bg-blue-50 hover:bg-blue-100 border-blue-200' : 'bg-white hover:bg-gray-50'}`;
            
            card.innerHTML = `
                <div class="flex-shrink-0 p-3 rounded-full ${isUnread ? 'bg-blue-200 text-blue-800' : 'bg-gray-100 text-gray-500'}">
                    <i data-lucide="${icon}" class="w-5 h-5"></i>
                </div>
                <div class="flex-1">
                    <p class="font-semibold text-gray-800 text-sm mb-1">${this.getNotificationTitle(n.type)}</p>
                    <p class="text-sm text-gray-700">${n.content?.message || n.type}</p>
                    <p class="text-xs text-gray-500 mt-1">${this.formatDate(n.createdAt)}</p>
                </div>
                ${isUnread ? 
                    `<button class="mark-read-btn flex-shrink-0 text-blue-600 hover:text-blue-800" data-id="${n.id}" title="ทำเครื่องหมายว่าอ่านแล้ว">
                        <i data-lucide="check-circle" class="w-5 h-5"></i>
                    </button>` 
                    : `<div class="flex-shrink-0 w-5 h-5"></div>` 
                }
            `;
            container.appendChild(card);
        });
        
        container.querySelectorAll('.mark-read-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleMarkAsRead(e.currentTarget.dataset.id));
        });

        if (window.lucide) window.lucide.createIcons();
    }
    
    renderEmptyState() {
        const isUnread = this.currentFilter === 'UNREAD';
        const message = isUnread ? 'ไม่มีการแจ้งเตือนที่ยังไม่ได้อ่าน' : 'ไม่พบรายการแจ้งเตือนทั้งหมด';
        const icon = isUnread ? 'inbox-off' : 'bell-off';

        return `
            <div class="text-center py-20 text-gray-500">
                <i data-lucide="${icon}" class="w-12 h-12 mx-auto mb-3"></i>
                <p class="text-xl font-medium">${message}</p>
            </div>
        `;
    }

    // --- Action Handlers (Omitted for brevity) ---
    async handleMarkAsRead(notificationId) {
        try {
            await NotificationManager.markAsRead(notificationId);
            const item = this.allNotifications.find(n => n.id === notificationId);
            if (item) item.status = 'READ';
            this.renderNotificationList(); 
            if (window.navbar && window.navbar.refreshUI) window.navbar.refreshUI(); 
            
        } catch (e) {
            Swal.fire('ข้อผิดพลาด', 'ไม่สามารถทำเครื่องหมายว่าอ่านแล้ว', 'error');
        }
    }
    
    async handleMarkAllAsRead() {
        const unreadIds = this.allNotifications.filter(n => n.status === 'UNREAD').map(n => n.id);

        if (unreadIds.length === 0) {
            Swal.fire('แจ้งเตือน', 'ไม่มีรายการที่ยังไม่ได้อ่าน', 'info');
            return;
        }
        
        Swal.fire({ title: 'กำลังดำเนินการ...', didOpen: () => Swal.showLoading() });
        
        try {
            await Promise.all(unreadIds.map(id => NotificationManager.markAsRead(id)));
            
            this.allNotifications.forEach(n => n.status = 'READ');
            this.renderNotificationList();
            
            Swal.fire('สำเร็จ', 'ทำเครื่องหมายทั้งหมดว่าอ่านแล้ว', 'success');
            if (window.navbar && window.navbar.refreshUI) window.navbar.refreshUI();
        } catch (e) {
            Swal.fire('ข้อผิดพลาด', 'ไม่สามารถทำเครื่องหมายทั้งหมดว่าอ่านแล้ว', 'error');
        }
    }

    // --- Utility Methods ---

    toggleDisplay(state) {
        [this.elements.loading, this.elements.error, this.elements.mainContent].forEach(el => el?.classList.add('hidden'));

        if (state === 'loading') this.elements.loading?.classList.remove('hidden');
        else if (state === 'error') this.elements.error?.classList.remove('hidden');
        else if (state === 'list' || state === 'empty') this.elements.mainContent?.classList.remove('hidden');
        
        if (window.lucide) window.lucide.createIcons();
    }
    
    showError(message) {
        // FIX: Safely access errorMessage element
        if (this.elements.errorMessage) {
            this.elements.errorMessage.textContent = message;
        }
        this.toggleDisplay('error');
    }

    getNotificationIcon(type) {
        switch (type) {
            case 'ORDER_STATUS_UPDATE':
            case 'NEW_ORDER': return 'shopping-bag';
            case 'REQUEST_APPROVED':
            case 'REQUEST_REJECTED': return 'clipboard-check';
            case 'NEW_MESSAGE': return 'message-square';
            case 'ADMIN_ALERT': return 'alert-triangle';
            default: return 'bell';
        }
    }
    
    getNotificationTitle(type) {
        const titles = {
            'ORDER_STATUS_UPDATE': 'อัปเดตสถานะคำสั่งซื้อ',
            'NEW_ORDER': 'คำสั่งซื้อใหม่เข้า',
            'REQUEST_APPROVED': 'คำขอสินค้าได้รับการอนุมัติ',
            'REQUEST_REJECTED': 'คำขอสินค้าถูกปฏิเสธ',
            'NEW_MESSAGE': 'ข้อความใหม่',
            'ADMIN_ALERT': 'แจ้งเตือนจากผู้ดูแลระบบ',
        };
        return titles[type] || 'การแจ้งเตือนทั่วไป';
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
}

window.notificationPage = new NotificationPage();