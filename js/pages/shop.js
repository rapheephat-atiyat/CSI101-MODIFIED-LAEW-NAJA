class ShopManager {
    constructor() {
        this.shopId = new URLSearchParams(window.location.search).get('id');
        this.currentUserId = null;
        this.isShopOwner = false;
        
        // Ensure Services exist before instantiating
        this.auth = typeof AuthManager !== 'undefined' ? new AuthManager() : null; 
        this.navbarEl = document.querySelector('navbar-eiei');

        this.elements = {
            loadingState: document.getElementById('loading-state'),
            errorState: document.getElementById('error-state'),
            shopContainer: document.getElementById('shop-container'),
            errorMessage: document.getElementById('error-message'),
            
            // Buttons/Controls
            followBtn: document.getElementById('follow-btn'),
            addProductBtn: document.getElementById('add-product-btn'),
            wishlistRequestBtn: document.getElementById('wishlist-request-btn'),
            viewWishlistRequestsBtn: document.getElementById('view-wishlist-requests-btn'),
            chatBtn: document.getElementById('chat-btn'),
            addProductModal: document.getElementById('add-product-modal'),
            addProductForm: document.getElementById('add-product-form'),

            // Display Elements
            shopAvatar: document.getElementById('shop-avatar'),
            shopName: document.getElementById('shop-name'),
            shopDetail: document.getElementById('shop-detail'),
            shopRating: document.getElementById('shop-rating'),
            shopFollowers: document.getElementById('shop-followers'),
            shopProductsCount: document.getElementById('shop-products-count'),
            productsGrid: document.getElementById('products-grid'),
            productsEmpty: document.getElementById('products-empty'),
        };

        if (!this.shopId) {
            document.addEventListener("DOMContentLoaded", () => this.showError('ไม่พบ ID ร้านค้า'));
            return;
        }

        document.addEventListener("DOMContentLoaded", () => this.init());
    }

    // --- Core Initialization & Data Fetching ---

    async init() {
        if (typeof lucide !== 'undefined') { lucide.createIcons(); }
        this.setupGeneralEventListeners();
        await this.fetchShopData();
    }

    async fetchShopData() {
        this.toggleDisplay('loading');

        try {
            if (typeof VendorProfileManager === 'undefined' || !this.auth) {
                 throw new Error("ไม่สามารถโหลดไฟล์บริการหลัก (Service Manager files missing).");
            }
            
            const [shopResponse, userResponse] = await Promise.all([
                VendorProfileManager.getShopProfile(this.shopId),
                this.auth.getProfile().catch(() => ({ user: { id: null } }))
            ]);

            const shopData = shopResponse.data;
            this.currentUserId = userResponse?.user?.id;
            this.isShopOwner = this.currentUserId && this.currentUserId === shopData.userId;

            this.renderShopProfile(shopData);
            this.renderProducts(shopData.vendorProduct);
            await this.updateUIBasedOnUserRole(shopData);

            this.toggleDisplay('shop'); // SUCCESS: Show shop page
            document.getElementById('page-title').textContent = shopData.shopName + ' - HiewHub';

            if (this.navbarEl && this.navbarEl.refreshCart) {
                this.navbarEl.refreshCart();
            }

        } catch (error) {
            this.showError(error.message || 'ไม่สามารถเชื่อมต่อกับร้านค้าได้');
            console.error("Shop Load Error:", error);
        }
    }

    // --- UI Logic & Event Setup ---

    setupGeneralEventListeners() {
        // No explicit DOM binding needed here as HTML uses inline `onclick="shopManager.methodName()"`
    }

    async updateUIBasedOnUserRole(shopData) {
        const getEl = (key) => this.elements[key];
        
        if (this.isShopOwner) {
            getEl('addProductBtn')?.classList.remove('hidden');
            getEl('viewWishlistRequestsBtn')?.classList.remove('hidden');

            getEl('followBtn')?.classList.add('hidden');
            getEl('chatBtn')?.classList.add('hidden');
            getEl('wishlistRequestBtn')?.classList.add('hidden');

            await this.updateWishlistRequestCount();
        } else {
            // Customer/Guest view
            getEl('addProductBtn')?.classList.add('hidden');
            getEl('viewWishlistRequestsBtn')?.classList.add('hidden');

            const followBtn = getEl('followBtn');
            const chatBtn = getEl('chatBtn');
            const wishlistRequestBtn = getEl('wishlistRequestBtn');

            followBtn?.classList.remove('hidden');
            chatBtn?.classList.remove('hidden');
            wishlistRequestBtn?.classList.remove('hidden');
            
            if (followBtn) {
                followBtn.classList.remove('following');
                
                followBtn.classList.add('bg-blue-600', 'text-white', 'border-blue-600');
                followBtn.classList.remove('bg-gray-100', 'text-gray-600', 'border-gray-300', 'border-2');
                
                // FIX: Safely update the icon by searching for the element with the data-lucide attribute (either <i> or <svg>)
                const iconEl = followBtn.querySelector('[data-lucide]') || followBtn.querySelector('svg');
                followBtn.querySelector('.follow-text').textContent = 'ติดตาม';
                if (iconEl) {
                    iconEl.setAttribute('data-lucide', 'user-plus');
                }
            }
        }
        if (typeof lucide !== 'undefined') { lucide.createIcons(); }
    }

    async updateWishlistRequestCount() {
        const btn = this.elements.viewWishlistRequestsBtn;
        if (!btn || typeof ProductRequestManager === 'undefined') return;
        
        if (ProductRequestManager.getRequestsByVendorId) {
            try {
                const requestsResponse = await ProductRequestManager.getRequestsByVendorId(this.shopId);
                const count = requestsResponse.data.length || 0;
                btn.innerHTML = `<i data-lucide="list-checks" class="w-5 h-5"></i> คำขอสินค้า (${count})`;
            } catch (e) {
                console.warn("Failed to fetch request count:", e);
                btn.innerHTML = `<i data-lucide="list-checks" class="w-5 h-5"></i> คำขอสินค้า (Error)`;
            }
        } else {
            btn.innerHTML = `<i data-lucide="list-checks" class="w-5 h-5"></i> คำขอสินค้า (Loading...)`;
        }
        if (typeof lucide !== 'undefined') { lucide.createIcons(); }
    }

    // --- Rendering Methods ---

    renderShopProfile(data) {
        const user = data.user || {};
        const avatarUrl = user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.shopName)}&background=3b82f6&color=fff&size=256`;

        this.elements.shopAvatar.src = avatarUrl;
        this.elements.shopName.textContent = data.shopName;
        this.elements.shopDetail.textContent = data.shopDetail || 'ยินดีต้อนรับสู่ร้านของเราค่ะ/ครับ';
        this.elements.shopRating.textContent = (data.rating || 0).toFixed(1);
        this.elements.shopFollowers.textContent = this.formatNumber(data.followers || 0);
        this.elements.shopProductsCount.textContent = this.formatNumber(data.vendorProduct?.length || 0);

        if (typeof lucide !== 'undefined') { lucide.createIcons(); }
    }

    renderProducts(products) {
        const grid = this.elements.productsGrid;
        if (!grid) return; 

        grid.innerHTML = '';

        if (!products || products.length === 0) {
            this.elements.productsEmpty?.classList.remove('hidden');
            return;
        }

        this.elements.productsEmpty?.classList.add('hidden');

        products.forEach(p => {
            const isDiscount = p.discountPrice && p.discountPrice < p.price;
            const displayPrice = isDiscount ? p.discountPrice : p.price;
            const oldPrice = isDiscount ? p.price : null;
            const discountPercent = isDiscount ? Math.round((1 - p.discountPrice / p.price) * 100) : 0;

            let imageArray = p.images;
            if (typeof p.images === 'string') {
                try {
                    imageArray = JSON.parse(p.images);
                } catch (e) {
                    imageArray = null;
                }
            }

            const primaryImage = Array.isArray(imageArray) && imageArray.length > 0
                ? imageArray[0]
                : 'https://dummyimage.com/400x400/e5e7eb/9ca3af.png&text=No+Image';
            
            const card = document.createElement('div');
            card.className = 'bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 overflow-hidden group cursor-pointer transition-all duration-300 hover:-translate-y-1';

            card.innerHTML = `
                <a href="/product.html?id=${p.id}" class="block">
                    <div class="aspect-square w-full relative overflow-hidden bg-gray-50">
                        <img src="${primaryImage}" alt="${p.title}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
                        <button class="wishlist-btn absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md hover:shadow-lg opacity-0 group-hover:opacity-100 transition-all" onclick="shopManager.toggleWishlist(event, '${p.id}')">
                            <i data-lucide="heart" class="w-4 h-4 text-gray-600"></i>
                        </button>
                        ${isDiscount ? `<div class="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">-${discountPercent}%</div>` : ''}
                    </div>
                    <div class="p-4">
                        <h3 class="text-sm font-medium line-clamp-2 min-h-[2.5rem] text-gray-800 mb-2">${p.title}</h3>
                        <div class="flex items-baseline gap-2 mb-2">
                            <span class="text-lg font-bold text-blue-600">฿${displayPrice.toFixed(2)}</span>
                            ${isDiscount ? `<span class="text-sm text-gray-400 line-through">฿${oldPrice.toFixed(2)}</span>` : ''}
                        </div>
                        <div class="flex items-center justify-between text-xs text-gray-500">
                            <span class="flex items-center gap-1">
                                <i data-lucide="shopping-cart" class="w-3 h-3"></i>
                                ${this.formatNumber(p.orderCount)} ขายแล้ว
                            </span>
                        </div>
                    </div>
                </a>
            `;

            grid.appendChild(card);
        });

        if (typeof lucide !== 'undefined') { lucide.createIcons(); }
    }

    // --- Action Handlers ---

    toggleFollow() {
        const btn = this.elements.followBtn;
        if (!btn) return;
        
        btn.classList.toggle('following');

        const isFollowing = btn.classList.contains('following');

        if (isFollowing) {
            btn.classList.remove('bg-blue-600', 'text-white', 'border-blue-600');
            btn.classList.add('bg-gray-100', 'text-gray-600', 'border-gray-300', 'border-2');
            btn.querySelector('.follow-text').textContent = 'กำลังติดตาม';
            
            const iconEl = btn.querySelector('[data-lucide="user-plus"]') || btn.querySelector('[data-lucide="user-check"]');
            if (iconEl) iconEl.setAttribute('data-lucide', 'user-check');
        } else {
            btn.classList.add('bg-blue-600', 'text-white', 'border-blue-600');
            btn.classList.remove('bg-gray-100', 'text-gray-600', 'border-gray-300', 'border-2');
            btn.querySelector('.follow-text').textContent = 'ติดตาม';
            
            const iconEl = btn.querySelector('[data-lucide="user-plus"]') || btn.querySelector('[data-lucide="user-check"]');
            if (iconEl) iconEl.setAttribute('data-lucide', 'user-plus');
        }

        if (typeof lucide !== 'undefined') { lucide.createIcons(); }
    }

    toggleWishlist(event, productId) {
        event.preventDefault();
        event.stopPropagation();

        const btn = event.currentTarget;
        btn.classList.toggle('active');

        if (typeof lucide !== 'undefined') { lucide.createIcons(); }
    }

    openAddProductModal() {
        this.elements.addProductModal?.classList.remove('hidden');
        this.elements.addProductForm?.reset();
        if (typeof lucide !== 'undefined') { lucide.createIcons(); }
    }

    closeAddProductModal() {
        this.elements.addProductModal?.classList.add('hidden');
    }

    viewWishlistRequests() {
        window.location.href = `/shop/product-request.html?id=${this.shopId}`;
    }

    async openWishlistRequestModal() {
        if (!this.auth?.isLoggedIn()) {
            Swal.fire({
                icon: 'warning',
                title: 'เข้าสู่ระบบก่อน',
                text: 'กรุณาเข้าสู่ระบบเพื่อเสนอสินค้า',
            }).then(() => {
                window.location.href = "/signIn.html";
            });
            return;
        }
        
        const formInputStyles = "w-full p-2.5 rounded-lg border border-gray-300 text-[0.95rem] outline-none bg-white transition focus:border-blue-600 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.15)]";
        const formLabelStyles = "block text-sm font-medium text-gray-700 mb-1";

        const { value: formValues } = await Swal.fire({
            title: 'เสนอสินค้าที่คุณอยากได้',
            html: `
                <div class="text-left p-2.5">
                    <p class="text-xs text-red-500 mb-3">กรุณากรอกข้อมูลให้ละเอียดที่สุด</p>
                    <label for="swal-title" class="${formLabelStyles}">หัวข้อ/ชื่อสินค้า (Required)</label>
                    <input id="swal-title" class="${formInputStyles} mb-3" placeholder="เช่น นาฬิกา Seiko รุ่น Turtle">
                    
                    <label for="swal-details" class="${formLabelStyles}">รายละเอียด/คุณสมบัติ</label>
                    <textarea id="swal-details" class="${formInputStyles} mb-3" rows="3" placeholder="สี, ขนาด, รุ่น, หรือเหตุผลที่ต้องการ..."></textarea>

                    <label for="swal-budget" class="${formLabelStyles}">งบประมาณที่ตั้งไว้ (฿)</label>
                    <input id="swal-budget" type="number" step="0.01" min="0" class="${formInputStyles} mb-3" placeholder="เช่น 15000">

                    <label for="swal-link" class="${formLabelStyles}">ลิงก์อ้างอิง (URL)</label>
                    <input id="swal-link" class="${formInputStyles} mb-3" placeholder="URL จากร้านค้าอื่น ๆ">

                    <label for="swal-images" class="${formLabelStyles}">รูปภาพอ้างอิง (URL - แยกบรรทัด)</label>
                    <textarea id="swal-images" class="${formInputStyles}" rows="2" placeholder="ใส่ URL รูปภาพแยกกันคนละบรรทัด"></textarea>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'ส่งคำขอเสนอสินค้า',
            showLoaderOnConfirm: true,
            preConfirm: () => {
                const title = document.getElementById('swal-title').value;
                const details = document.getElementById('swal-details').value;
                const budget = document.getElementById('swal-budget').value;
                const productLink = document.getElementById('swal-link').value;
                const images = document.getElementById('swal-images').value;

                if (!title.trim()) {
                    Swal.showValidationMessage('กรุณากรอกหัวข้อ/ชื่อสินค้า');
                    return false;
                }

                let imagesArray = [];
                if (images) {
                    imagesArray = images.split('\n').map(url => url.trim()).filter(url => url.length > 0);
                }

                return {
                    vendorId: this.shopId,
                    title: title.trim(),
                    details: details.trim() || undefined,
                    budget: budget ? parseFloat(budget) : undefined,
                    productLink: productLink.trim() || undefined,
                    images: imagesArray.length > 0 ? imagesArray : undefined
                };
            }
        });

        if (formValues) {
            Swal.fire({
                title: 'กำลังส่งคำขอ...',
                icon: 'info',
                allowOutsideClick: false,
                showConfirmButton: false,
                didOpen: () => Swal.showLoading()
            });

            try {
                if (typeof ProductRequestManager === 'undefined' || !window.ProductRequestManager.createRequest) {
                    throw new Error("ProductRequestManager is not loaded or missing method.");
                }
                ProductRequestManager.createRequest(formValues);

                Swal.fire({
                    icon: 'success',
                    title: 'ส่งคำขอสำเร็จ!',
                    text: 'คำขอของคุณถูกส่งไปยังร้านค้าเรียบร้อยแล้ว',
                    timer: 2500
                });

            } catch (error) {
                console.error("Wishlist Request Error:", error);
                Swal.fire('เกิดข้อผิดพลาด', error.message || 'ไม่สามารถส่งคำขอได้', 'error');
            }
        }
        if (typeof lucide !== 'undefined') { lucide.createIcons(); }
    }

    async addProduct(event) {
        event.preventDefault();

        const form = this.elements.addProductForm;
        const formData = new FormData(form);

        let imagesPayload = null;
        const imagesString = formData.get('images');
        let hashtagPayload = null;
        const hashtagString = formData.get('hashtag');

        if (imagesString) {
            imagesPayload = imagesString.split('\n').map(url => url.trim()).filter(url => url.length > 0);
        }

        if (hashtagString) {
            hashtagPayload = hashtagString.split('\n').map(tag => tag.trim().replace(/^#/, '')).filter(tag => tag.length > 0);
        }

        const payload = {
            title: formData.get('title'),
            detail: formData.get('detail'),
            notes: formData.get('notes'),
            category: formData.get('category'),
            price: parseFloat(formData.get('price')),
            discountPrice: formData.get('discountPrice') ? parseFloat(formData.get('discountPrice')) : undefined,
            images: imagesPayload,
            hashtag: hashtagPayload,
        };

        if (!payload.title || isNaN(payload.price) || payload.price <= 0) {
            Swal.fire('ข้อผิดพลาด', 'กรุณากรอกชื่อสินค้าและราคาปกติให้ถูกต้อง', 'warning');
            return;
        }

        Swal.fire({
            title: 'กำลังบันทึกสินค้า...',
            text: 'กรุณารอสักครู่',
            icon: 'info',
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            if (typeof ProductManager === 'undefined') throw new Error("ProductManager is not loaded.");
            await ProductManager.addProduct(payload);

            Swal.fire({
                title: 'สำเร็จ!',
                text: `สินค้า "${payload.title}" ถูกเพิ่มเรียบร้อยแล้ว`,
                icon: 'success',
                confirmButtonText: 'ตกลง'
            }).then(() => {
                this.closeAddProductModal();
                this.fetchShopData();

                if (this.navbarEl && this.navbarEl.refreshCart) {
                    this.navbarEl.refreshCart();
                }
            });

        } catch (error) {
            console.error("Add Product Error:", error);
            Swal.fire('เกิดข้อผิดพลาด', error.message || 'ไม่สามารถเพิ่มสินค้าได้', 'error');
        }
    }

    // --- Utility Methods ---

    toggleDisplay(state) {
        this.elements.loadingState?.classList.add('hidden');
        this.elements.shopContainer?.classList.add('hidden');
        this.elements.errorState?.classList.add('hidden');

        if (state === 'loading') {
            this.elements.loadingState?.classList.remove('hidden');
        } else if (state === 'shop') {
            this.elements.shopContainer?.classList.remove('hidden');
        } else if (state === 'error') {
            this.elements.errorState?.classList.remove('hidden');
        }
    }

    showError(message) {
        this.elements.errorMessage.textContent = message;
        this.toggleDisplay('error');
    }

    formatNumber(num) {
        if (num >= 1000) {
            return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
        }
        return num;
    }
}

// Global binding and initialization
const shopManager = new ShopManager();
window.shopManager = shopManager;