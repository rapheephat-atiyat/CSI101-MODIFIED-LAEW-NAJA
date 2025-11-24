class Navbar extends HTMLElement {
    constructor() {
        super();
        this.auth = null;
        this.profile = null;
        this.cartItemCount = 0;
        this.notificationCount = 0;
        this.notifications = [];
        this.pollInterval = null;
    }

    async connectedCallback() {
        await this.loadDependencies();

        if (typeof AuthManager !== 'undefined') {
            this.auth = new AuthManager();
        }

        this.handleTokenFromURL();
        await this.loadProfile();

        if (this.auth && this.auth.isLoggedIn()) {
            await this.fetchCartCount();
            await this.fetchNotificationCount();
            this.startPolling(); // เริ่มเช็คข้อมูลอัตโนมัติ
        }

        this.render();
        this.bindEvents();
        this.updateAuthUI();

        if (window.lucide) window.lucide.createIcons();
    }

    disconnectedCallback() {
        this.stopPolling();
    }

    startPolling() {
        this.stopPolling();
        this.pollInterval = setInterval(() => {
            this.refreshUI(true);
        }, 5000); // เช็คทุก 5 วินาที
    }

    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }

    async loadProfile() {
        if (this.auth && this.auth.isLoggedIn()) {
            try {
                this.profile = await this.auth.getProfile();
            } catch (error) {
                console.error("Failed to load profile:", error);
            }
        }
    }

    handleTokenFromURL() {
        const params = new URLSearchParams(window.location.search);
        if (params.has("token")) {
            const token = params.get("token");
            if (this.auth) {
                this.auth.saveToken(token);
                const cleanUrl = window.location.origin + window.location.pathname;
                window.history.replaceState({}, document.title, cleanUrl);
            }
        }
    }

    async fetchCartCount() {
        if (this.auth && this.auth.isLoggedIn() && typeof CartManager !== 'undefined') {
            try {
                const cartResponse = await CartManager.getCart();
                this.cartItemCount = cartResponse.data.length;
            } catch (e) {
                this.cartItemCount = 0;
            }
        }
    }

    async fetchNotificationCount() {
        if (this.auth && this.auth.isLoggedIn() && typeof NotificationManager !== 'undefined') {
            try {
                const countResponse = await NotificationManager.getUnreadCount();
                this.notificationCount = countResponse.count || 0;
            } catch (e) {
                this.notificationCount = 0;
            }
        }
    }

    async loadNotifications() {
        if (typeof NotificationManager === 'undefined') return;

        const listContainer = this.querySelector('#notification-list');
        if (!listContainer) return;

        listContainer.innerHTML = `<div class="px-4 py-4 text-center text-gray-500"><i data-lucide="loader-circle" class="w-5 h-5 animate-spin mx-auto"></i></div>`;
        if (window.lucide) window.lucide.createIcons();

        try {
            const res = await NotificationManager.getNotifications();
            this.notifications = res.data ? res.data.slice(0, 5) : [];
            this.renderNotificationsDropdown();
        } catch (error) {
            listContainer.innerHTML = `<div class="px-4 py-3 text-sm text-red-500 text-center">โหลดข้อมูลไม่สำเร็จ</div>`;
        }
    }

    renderNotificationsDropdown() {
        const listContainer = this.querySelector('#notification-list');
        if (!listContainer) return;

        if (this.notifications.length === 0) {
            listContainer.innerHTML = `<div class="px-4 py-8 text-sm text-gray-500 text-center flex flex-col items-center"><i data-lucide="bell-off" class="w-8 h-8 mb-2 opacity-50"></i>ไม่มีรายการแจ้งเตือน</div>`;
        } else {
            listContainer.innerHTML = this.notifications.map(n => {
                const isUnread = n.status === 'UNREAD';
                const icon = this.getNotificationIcon(n.type);
                const title = this.getNotificationTitle(n.type);

                return `
                <div class="notification-item px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${isUnread ? 'bg-blue-50/50' : ''}" 
                     data-id="${n.id}" 
                     data-status="${n.status}">
                    <div class="flex gap-3">
                        <div class="flex-shrink-0 mt-1">
                            <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                <i data-lucide="${icon}" class="w-4 h-4"></i>
                            </div>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex justify-between items-start">
                                <p class="text-sm font-semibold text-gray-900 truncate">${title}</p>
                                ${isUnread ? '<span class="w-2 h-2 bg-red-500 rounded-full mt-1.5"></span>' : ''}
                            </div>
                            <p class="text-xs text-gray-600 line-clamp-2 mt-0.5">${n.content?.message || '-'}</p>
                            <p class="text-[10px] text-gray-400 mt-1">${this.formatDate(n.createdAt)}</p>
                        </div>
                    </div>
                </div>
                `;
            }).join('');

            listContainer.querySelectorAll('.notification-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    this.handleNotificationClick(item.dataset.id, item.dataset.status);
                });
            });
        }
        if (window.lucide) window.lucide.createIcons();
    }

    getNotificationIcon(type) {
        switch (type) {
            case 'ORDER_STATUS_UPDATE': return 'package';
            case 'NEW_ORDER': return 'shopping-bag';
            case 'REQUEST_APPROVED': return 'check-circle';
            case 'REQUEST_REJECTED': return 'x-circle';
            case 'ADMIN_ALERT': return 'shield-alert';
            default: return 'bell';
        }
    }

    getNotificationTitle(type) {
        const titles = {
            'ORDER_STATUS_UPDATE': 'อัปเดตสถานะคำสั่งซื้อ',
            'NEW_ORDER': 'มีคำสั่งซื้อใหม่',
            'REQUEST_APPROVED': 'คำขอสินค้าได้รับการอนุมัติ',
            'REQUEST_REJECTED': 'คำขอสินค้าถูกปฏิเสธ',
            'ADMIN_ALERT': 'ข้อความจากผู้ดูแลระบบ'
        };
        return titles[type] || 'การแจ้งเตือน';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        if (diff < 86400000) {
            return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
    }

    async handleNotificationClick(id, status) {
        if (status === 'UNREAD') {
            try {
                await NotificationManager.markAsRead(id);
                if (this.notificationCount > 0) {
                    this.notificationCount--;
                    this.updateBadges();
                }
            } catch (e) {
                console.error("Failed to mark as read", e);
            }
        }
        window.location.href = '/notifications.html';
    }

    async refreshUI(isPolling = false) {
        const prevNotifCount = this.notificationCount;
        const prevCartCount = this.cartItemCount;

        await this.fetchCartCount();
        await this.fetchNotificationCount();

        if (prevNotifCount !== this.notificationCount || prevCartCount !== this.cartItemCount) {
            this.updateBadges();
        }

        if (!isPolling) {
            this.updateAuthUI();
        }
    }

    updateBadges() {
        const cartBadges = this.querySelectorAll('#cart-btn span, #mobile-cart-btn span');
        cartBadges.forEach(badge => {
            badge.textContent = this.cartItemCount;
            badge.style.display = this.cartItemCount > 0 ? 'flex' : 'none';
        });

        const notifBadges = this.querySelectorAll('#notifications-btn span, #mobile-notifications-btn span');
        notifBadges.forEach(badge => {
            badge.textContent = this.notificationCount;
            badge.style.display = this.notificationCount > 0 ? 'flex' : 'none';
        });
    }

    render() {
        const user = this.profile?.user;
        const firstname = user?.firstname || 'ผู้ใช้';
        const lastname = user?.lastname || '';
        const email = user?.email || '';
        const image = user?.image && user.image !== 'null' && user.image !== 'undefined' ? user.image : null;
        const initial = firstname.charAt(0).toUpperCase();

        const cartCount = this.cartItemCount;
        const notificationCount = this.notificationCount;

        let shopLink = "/shop.html";
        if (user && user.role === 'VENDOR' && user.vendorProfile?.id) {
            shopLink = `/shop.html?id=${user.vendorProfile.id}`;
        }

        const dropdownItemClasses = "flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors";
        const navLinkClasses = "flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-500 rounded-lg transition-colors hover:bg-gray-100 hover:text-gray-900";
        const mobileNavLinkClasses = "flex items-center gap-3 px-4 py-3 text-base text-gray-700 rounded-lg transition-colors hover:bg-gray-50 w-full";

        let adminDashboardLink = user?.role === 'ADMIN' ?
            `<a href="/dashboard.html" class="${dropdownItemClasses}">
                <i data-lucide="shield" class="w-4 h-4 text-red-500"></i>
                <span>Admin Dashboard</span>
             </a>` : '';

        const showNotificationBadge = notificationCount > 0;

        this.innerHTML = `
        <nav class="bg-white/80 backdrop-blur-md sticky top-0 z-[100] border-b border-gray-100">
            <div class="max-w-7xl mx-auto px-6">
                <div class="flex items-center justify-between h-16">
                    <a href="/" id="navbar-logo-link" class="flex items-center gap-2.5 group">
                        <div class="w-20 flex-shrink-0">
                            <img src="./public/images/logo.png" alt="Logo" class="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-200">
                        </div>
                    </a>

                    <div id="desktop-nav-menu" class="hidden lg:flex items-center gap-1">
                        <a href="/" class="${navLinkClasses}">
                            <i data-lucide="home" class="w-4 h-4"></i>
                            <span>หน้าแรก</span>
                        </a>
                        <a href="/product.html" class="${navLinkClasses}">
                            <i data-lucide="shopping-bag" class="w-4 h-4"></i>
                            <span>สินค้า</span>
                        </a>
                         <a href="${shopLink}" class="${navLinkClasses}">
                            <i data-lucide="store" class="w-4 h-4"></i>
                            <span>ร้านค้า</span>
                        </a>
                        <a href="/aboutme.html" class="${navLinkClasses}">
                            <i data-lucide="info" class="w-4 h-4"></i>
                            <span>เกี่ยวกับเรา</span>
                        </a>
                    </div>

                    <div class="flex items-center gap-3">
                        <div id="desktop-search-bar" class="hidden md:block">
                            <div class="relative">
                                <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none"></i>
                                <input type="text" placeholder="ค้นหา..." 
                                    class="w-56 lg:w-72 pl-9 pr-4 py-2 text-sm bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:border-gray-200 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200" />
                            </div>
                        </div>

                        <a href='./cart.html' id="cart-btn" class="hidden md:flex relative p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors">
                            <i data-lucide="shopping-cart" class="w-5 h-5"></i>
                            <span class="absolute -top-0.5 -right-0.5 w-4 h-4 bg-blue-600 text-white text-[10px] rounded-full flex items-center justify-center font-semibold" style="${cartCount > 0 ? '' : 'display: none;'}">${cartCount}</span>
                        </a>

                        <div id="desktop-notification-menu" class="hidden md:block relative">
                            <button id="notifications-btn" class="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors">
                                <i data-lucide="bell" class="w-5 h-5"></i>
                                <span class="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-600 text-white text-[10px] rounded-full flex items-center justify-center font-semibold" style="${showNotificationBadge ? '' : 'display: none;'}">${notificationCount}</span>
                            </button>
                            
                            <div id="notification-dropdown" class="hidden absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 py-1 overflow-hidden z-[1000]">
                                <div class="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                                    <h4 class="font-bold text-gray-900 text-sm">การแจ้งเตือน (${notificationCount})</h4>
                                    <a href="/notifications.html" class="text-xs text-blue-600 hover:underline">ดูทั้งหมด</a>
                                </div>
                                <div id="notification-list" class="max-h-96 overflow-y-auto scrollbar-thin">
                                    </div>
                            </div>
                        </div>

                        <a href="/signin.html" id="desktop-login-btn" class="hidden lg:flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
                            <span>เข้าสู่ระบบ</span>
                        </a>

                        <div id="desktop-user-menu" class="hidden lg:block relative">
                            <button id="desktop-user-menu-btn" class="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors duration-500 ease-in">
                                ${image
                ? `<img src="${image}" alt="Profile" class="w-8 h-8 rounded-full object-cover ring-2 ring-gray-100" />`
                : `<div class="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white font-medium text-sm">${initial}</div>`
            }
                                <span class="font-medium text-sm text-gray-900 max-w-[100px] truncate">${firstname}</span>
                                <i data-lucide="chevron-down" id="desktop-dropdown-icon" class="w-4 h-4 text-gray-400 transition-transform"></i>
                            </button>
                            
                            <div id="desktop-user-dropdown" class="hidden absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-lg border border-gray-100 py-1 overflow-hidden z-[1000]">
                                <div class="px-4 py-3 border-b border-gray-50">
                                    <p class="font-medium text-sm text-gray-900">${firstname} ${lastname}</p>
                                    <p class="text-xs text-gray-500 truncate mt-0.5">${email}</p>
                                </div>
                                <div class="py-1">
                                    ${adminDashboardLink}
                                    <a href="/profile.html" class="${dropdownItemClasses}">
                                        <i data-lucide="user" class="w-4 h-4 text-gray-400"></i>
                                        <span>บัญชีของฉัน</span>
                                    </a>
                                    <a href="/orders.html" class="${dropdownItemClasses}">
                                        <i data-lucide="shopping-bag" class="w-4 h-4 text-gray-400"></i>
                                        <span>คำสั่งซื้อ</span>
                                    </a>
                                    <a href="/favorite.html" class="${dropdownItemClasses}">
                                        <i data-lucide="heart" class="w-4 h-4 text-gray-400"></i>
                                        <span>รายการโปรด</span>
                                    </a>
                                </div>
                                <div class="border-t border-gray-50 py-1">
                                    <button id="desktop-logout-btn" class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                                        <i data-lucide="log-out" class="w-4 h-4"></i>
                                        <span>ออกจากระบบ</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button id="mobile-menu-toggle" class="lg:hidden p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                            <i data-lucide="menu" class="w-5 h-5"></i>
                        </button>
                    </div>
                </div>
            </div>

            <div id="mobile-menu" class="hidden lg:hidden border-t border-gray-100 bg-white z-50">
                <div class="max-w-7xl mx-auto px-6 py-4">
                    <div class="mb-4">
                        <div class="relative">
                            <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none"></i>
                            <input type="text" placeholder="ค้นหา..." 
                                class="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:border-gray-200 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
                        </div>
                    </div>

                    <div class="space-y-1 mb-4">
                        <a href="/" class="${mobileNavLinkClasses}">
                            <i data-lucide="home" class="w-5 h-5"></i>
                            <span>หน้าแรก</span>
                        </a>
                        <a href="/product.html" class="${mobileNavLinkClasses}">
                            <i data-lucide="shopping-bag" class="w-5 h-5"></i>
                            <span>สินค้า</span>
                        </a>
                        <a href="${shopLink}" class="${mobileNavLinkClasses}">
                            <i data-lucide="store" class="w-5 h-5"></i>
                            <span>ร้านค้า</span>
                        </a>
                        <a href="/aboutme.html" class="${mobileNavLinkClasses}">
                            <i data-lucide="info" class="w-5 h-5"></i>
                            <span>เกี่ยวกับเรา</span>
                        </a>
                    </div>

                    <div class="grid grid-cols-2 gap-2 mb-4">
                        <a href='./cart.html' id="mobile-cart-btn" class="flex items-center justify-center gap-2 p-3 text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors relative">
                            <i data-lucide="shopping-cart" class="w-5 h-5"></i>
                            <span class="text-sm font-medium">ตะกร้า</span>
                            <span class="absolute -top-1 -right-1 px-1.5 py-0.5 bg-blue-600 text-white text-[10px] rounded-full font-semibold" style="${cartCount > 0 ? '' : 'display: none;'}">${cartCount}</span>
                        </a>
                        <a href="/notifications.html" id="mobile-notifications-btn" class="flex items-center justify-center gap-2 p-3 text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors relative">
                            <i data-lucide="bell" class="w-5 h-5"></i>
                            <span class="text-sm font-medium">แจ้งเตือน</span>
                            <span class="absolute -top-1 -right-1 px-1.5 py-0.5 bg-red-600 text-white text-[10px] rounded-full font-semibold" style="${showNotificationBadge ? '' : 'display: none;'}">${notificationCount}</span>
                        </a>
                    </div>
                    
                    <a href="/signIn.html" id="mobile-login-btn" class="flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
                        <span>เข้าสู่ระบบ</span>
                    </a>
                    
                    <div id="mobile-user-menu">
                        <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-3">
                            ${image
                ? `<img src="${image}" alt="Profile" class="w-12 h-12 rounded-full object-cover ring-2 ring-white" />`
                : `<div class="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center text-white font-medium text-lg">${initial}</div>`
            }
                            <div class="flex-1 min-w-0">
                                <p class="font-medium text-sm text-gray-900 truncate">${firstname} ${lastname}</p>
                                <p class="text-xs text-gray-500 truncate">${email}</p>
                            </div>
                        </div>
                        
                        <div class="space-y-1 mb-3">
                            ${adminDashboardLink ? `<a href="/dashboard.html" class="${mobileNavLinkClasses} text-red-500 hover:bg-red-50"><i data-lucide="shield" class="w-5 h-5"></i><span>Admin Dashboard</span></a>` : ''}
                            <a href="/profile.html" class="${mobileNavLinkClasses}">
                                <i data-lucide="user" class="w-5 h-5"></i>
                                <span>บัญชีของฉัน</span>
                            </a>
                            <a href="/orders.html" class="${mobileNavLinkClasses}">
                                <i data-lucide="shopping-bag" class="w-5 h-5"></i>
                                <span>คำสั่งซื้อ</span>
                            </a>
                            <a href="/favorite.html" class="${mobileNavLinkClasses}">
                                <i data-lucide="heart" class="w-5 h-5"></i>
                                <span>รายการโปรด</span>
                            </a>
                        </div>

                        <button id="mobile-logout-btn" class="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors">
                            <i data-lucide="log-out" class="w-5 h-5"></i>
                            <span>ออกจากระบบ</span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
        `;
    }

    updateAuthUI() {
        const loggedIn = this.auth ? this.auth.isLoggedIn() : false;

        const desktopLoginBtn = this.querySelector("#desktop-login-btn");
        const desktopUserMenu = this.querySelector("#desktop-user-menu");

        const mobileLoginBtn = this.querySelector("#mobile-login-btn");
        const mobileUserMenu = this.querySelector("#mobile-user-menu");

        if (desktopLoginBtn) desktopLoginBtn.style.display = loggedIn ? "none" : "flex";
        if (desktopUserMenu) desktopUserMenu.style.display = loggedIn ? "block" : "none";

        if (mobileLoginBtn) mobileLoginBtn.style.display = loggedIn ? "none" : "flex";
        if (mobileUserMenu) mobileUserMenu.style.display = loggedIn ? "block" : "none";
    }

    loadDependencies() {
        return new Promise((resolve) => {
            const load = (src) =>
                new Promise((res) => {
                    if (document.querySelector(`script[src="${src}"]`)) {
                        res();
                        return;
                    }
                    const script = document.createElement("script");
                    script.src = src;
                    script.onload = res;
                    script.onerror = res;
                    document.head.appendChild(script);
                });

            Promise.all([
                !window.lucide && load("https://unpkg.com/lucide@latest"),
                !document.getElementById("tw") && load("https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4")
            ]).then(resolve);
        });
    }

    bindEvents() {
        const mobileMenuToggle = this.querySelector("#mobile-menu-toggle");
        const mobileMenu = this.querySelector("#mobile-menu");

        if (mobileMenuToggle && mobileMenu) {
            mobileMenuToggle.addEventListener("click", (e) => {
                e.preventDefault();
                mobileMenu.classList.toggle("hidden");
                const iconContainer = mobileMenuToggle;
                const iconEl = iconContainer.querySelector('[data-lucide]') || iconContainer.querySelector('svg');
                if (iconEl) {
                    const currentIcon = iconEl.getAttribute("data-lucide");
                    const targetEl = iconEl.tagName === 'SVG' ? iconEl : iconContainer.querySelector('i');
                    if (targetEl) {
                        const newIcon = currentIcon === "menu" ? "x" : "menu";
                        targetEl.setAttribute("data-lucide", newIcon);
                    }
                }
                if (window.lucide) window.lucide.createIcons();
            });
        }

        const desktopUserMenuBtn = this.querySelector("#desktop-user-menu-btn");
        const desktopUserDropdown = this.querySelector("#desktop-user-dropdown");

        if (desktopUserMenuBtn && desktopUserDropdown) {
            const getRotatableIcon = () => desktopUserMenuBtn.querySelector('[data-lucide="chevron-down"]') || desktopUserMenuBtn.querySelector('svg[data-lucide="chevron-down"]');

            desktopUserMenuBtn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();

                const isHidden = desktopUserDropdown.classList.contains("hidden");
                const iconEl = getRotatableIcon();

                const notificationDropdown = this.querySelector("#notification-dropdown");
                if (notificationDropdown && !notificationDropdown.classList.contains("hidden")) {
                    notificationDropdown.classList.add("hidden");
                }

                if (isHidden) {
                    desktopUserDropdown.classList.remove("hidden");
                    if (iconEl) iconEl.classList.add("rotate-180");
                } else {
                    desktopUserDropdown.classList.add("hidden");
                    if (iconEl) iconEl.classList.remove("rotate-180");
                }
                if (window.lucide) window.lucide.createIcons();
            });

            document.addEventListener("click", (e) => {
                const iconEl = getRotatableIcon();
                if (!this.contains(e.target) && !desktopUserDropdown.classList.contains("hidden")) {
                    desktopUserDropdown.classList.add("hidden");
                    if (iconEl) iconEl.classList.remove("rotate-180");
                }
            });
        }

        const notificationsBtn = this.querySelector("#notifications-btn");
        const notificationDropdown = this.querySelector("#notification-dropdown");

        if (notificationsBtn && notificationDropdown) {
            notificationsBtn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();

                const desktopUserDropdown = this.querySelector("#desktop-user-dropdown");
                if (desktopUserDropdown && !desktopUserDropdown.classList.contains("hidden")) {
                    desktopUserDropdown.classList.add("hidden");
                    const iconEl = this.querySelector('[data-lucide="chevron-down"]') || this.querySelector('svg[data-lucide="chevron-down"]');
                    if (iconEl) iconEl.classList.remove("rotate-180");
                }

                const isHidden = notificationDropdown.classList.contains("hidden");
                notificationDropdown.classList.toggle("hidden");

                if (isHidden) {
                    this.loadNotifications();
                }

                if (window.lucide) window.lucide.createIcons();
            });

            document.addEventListener("click", (e) => {
                if (!this.contains(e.target) && !notificationDropdown.classList.contains("hidden")) {
                    notificationDropdown.classList.add("hidden");
                }
            });
        }

        const handleLogout = (e) => {
            e.preventDefault();
            if (this.auth) {
                this.auth.logout();
            }
        };

        const desktopLogoutBtn = this.querySelector("#desktop-logout-btn");
        if (desktopLogoutBtn) desktopLogoutBtn.addEventListener("click", handleLogout);

        const mobileLogoutBtn = this.querySelector("#mobile-logout-btn");
        if (mobileLogoutBtn) mobileLogoutBtn.addEventListener("click", handleLogout);
    }
}

customElements.define("navbar-eiei", Navbar);