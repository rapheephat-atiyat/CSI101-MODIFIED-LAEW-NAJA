class Navbar extends HTMLElement {
    constructor() {
        super();
        this.auth = null;
        this.profile = null;
        this.cartItemCount = 0;
    }

    async connectedCallback() {
        await this.loadDependencies();

        if (typeof AuthManager !== 'undefined') {
            this.auth = new AuthManager();
        }

        this.handleTokenFromURL();
        await this.loadProfile();
        await this.fetchCartCount();

        this.render();
        this.bindEvents();
        this.updateAuthUI();

        if (window.lucide) window.lucide.createIcons();
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
        } else {
            this.cartItemCount = 0;
        }
    }

    async refreshCart() {
        await this.fetchCartCount();
        this.render();
        this.bindEvents();
        this.updateAuthUI();
        if (window.lucide) window.lucide.createIcons();
    }

    render() {
        const user = this.profile?.user;
        const firstname = user?.firstname || 'ผู้ใช้';
        const lastname = user?.lastname || '';
        const email = user?.email || '';

        const image = user?.image && user.image !== 'null' && user.image !== 'undefined' ? user.image : null;

        const initial = firstname.charAt(0).toUpperCase();
        const cartCount = this.cartItemCount;

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


        this.innerHTML = `
        <nav class="bg-white/80 backdrop-blur-md sticky top-0 z-[100] border-b border-gray-100">
            <div class="max-w-7xl mx-auto px-6">
                <div class="flex items-center justify-between h-16">
                    <a href="/" id="navbar-logo-link" class="flex items-center gap-2.5 group">
                        <div class="w-20 flex-shrink-0">
                            <img src="http://localhost:5500/public/images/logo.png" alt="Logo" class="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-200">
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
                        <a href="#" class="${navLinkClasses}">
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

                        <button id="notifications-btn" class="hidden md:flex relative p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors">
                            <i data-lucide="bell" class="w-5 h-5"></i>
                            <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full"></span>
                        </button>

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
                                    <a href="#" class="${dropdownItemClasses}">
                                        <i data-lucide="shopping-bag" class="w-4 h-4 text-gray-400"></i>
                                        <span>คำสั่งซื้อ</span>
                                    </a>
                                    <a href="#" class="${dropdownItemClasses}">
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

            <div id="mobile-menu" class="hidden lg:hidden border-t border-gray-100 bg-white">
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
                        <a href="#" class="${mobileNavLinkClasses}">
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
                        <button id="mobile-notifications-btn" class="flex items-center justify-center gap-2 p-3 text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors relative">
                            <i data-lucide="bell" class="w-5 h-5"></i>
                            <span class="text-sm font-medium">แจ้งเตือน</span>
                            <span class="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full"></span>
                        </button>
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
                            <a href="#" class="${mobileNavLinkClasses}">
                                <i data-lucide="shopping-bag" class="w-5 h-5"></i>
                                <span>คำสั่งซื้อ</span>
                            </a>
                            <a href="#" class="${mobileNavLinkClasses}">
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
        if (mobileUserMenu) mobileUserMenu.style.display = loggedIn ? "none" : "block";
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
        const mobileMenuIcon = mobileMenuToggle?.querySelector("i");

        if (mobileMenuToggle && mobileMenu) {
            mobileMenuToggle.addEventListener("click", () => {
                mobileMenu.classList.toggle("hidden");

                if (mobileMenuIcon) {
                    const iconEl = mobileMenuToggle.querySelector('[data-lucide]') || mobileMenuToggle.querySelector('svg');

                    if (iconEl) {
                        const currentIcon = iconEl.getAttribute("data-lucide");
                        iconEl.setAttribute("data-lucide", currentIcon === "menu" ? "x" : "menu");
                    }
                }
                if (window.lucide) window.lucide.createIcons();
            });
        }

        const desktopUserMenuBtn = this.querySelector("#desktop-user-menu-btn");
        const desktopUserDropdown = this.querySelector("#desktop-user-dropdown");
        const desktopDropdownIcon = this.querySelector("#desktop-dropdown-icon");

        if (desktopUserMenuBtn && desktopUserDropdown) {

            const getRotatableIcon = () => desktopUserMenuBtn.querySelector('[data-lucide="chevron-down"]') || desktopUserMenuBtn.querySelector('svg[data-lucide="chevron-down"]');

            desktopUserMenuBtn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();

                const isHidden = desktopUserDropdown.classList.contains("hidden");
                const iconEl = getRotatableIcon();

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

            desktopUserDropdown.addEventListener("click", (e) => {
                e.stopPropagation();
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