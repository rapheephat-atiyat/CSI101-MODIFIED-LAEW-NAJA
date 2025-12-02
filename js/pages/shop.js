class ShopManager {
    constructor() {
        this.shopId = new URLSearchParams(window.location.search).get('id');
        this.currentUserId = null;
        this.isShopOwner = false;
        this.shopData = null;

        this.auth = typeof AuthManager !== 'undefined' ? new AuthManager() : null;
        this.navbarEl = document.querySelector('navbar-eiei');

        this.elements = {
            loadingState: document.getElementById('loading-state'),
            errorState: document.getElementById('error-state'),
            shopContainer: document.getElementById('shop-container'),
            errorMessage: document.getElementById('error-message'),

            followBtn: document.getElementById('follow-btn'),
            addProductBtn: document.getElementById('add-product-btn'),
            wishlistRequestBtn: document.getElementById('wishlist-request-btn'),
            viewWishlistRequestsBtn: document.getElementById('view-wishlist-requests-btn'),
            viewOrdersBtn: document.getElementById('view-orders-btn'),
            chatBtn: document.getElementById('chat-btn'),

            addProductModal: document.getElementById('add-product-modal'),
            addProductForm: document.getElementById('add-product-form'),
            modalTitle: document.getElementById('modal-title'),
            modalSubmitBtn: document.getElementById('modal-submit-btn'),
            productIdToEdit: document.getElementById('product-id-to-edit'),

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
            document.addEventListener("DOMContentLoaded", () => this.showError('Shop ID not found'));
            return;
        }

        document.addEventListener("DOMContentLoaded", () => this.init());
    }

    async init() {
        if (typeof lucide !== 'undefined') { lucide.createIcons(); }
        this.setupGeneralEventListeners();
        await this.fetchShopData();
    }

    async fetchShopData() {
        this.toggleDisplay('loading');

        try {
            if (typeof VendorProfileManager === 'undefined' || !this.auth) {
                throw new Error("Service Manager files missing.");
            }

            const [shopResponse, userResponse] = await Promise.all([
                VendorProfileManager.getShopProfile(this.shopId),
                this.auth.getProfile().catch(() => ({ user: { id: null, role: null } }))
            ]);

            const shopData = shopResponse.data;
            this.shopData = shopData; // เก็บข้อมูลร้านค้าไว้ใช้
            this.currentUserId = userResponse?.user?.id;
            this.isShopOwner = (userResponse?.user?.role === 'VENDOR') && (this.currentUserId === shopData.userId);

            this.renderShopProfile(shopData);
            this.renderProducts(shopData.vendorProduct);
            await this.updateUIBasedOnUserRole(shopData);

            this.toggleDisplay('shop');
            document.getElementById('page-title').textContent = shopData.shopName + ' - HiewHub';

        } catch (error) {
            this.showError(error.message || 'Failed to connect to shop');
            console.error("Shop Load Error:", error);
        }
    }

    setupGeneralEventListeners() {
        if (this.elements.chatBtn) {
            this.elements.chatBtn.addEventListener('click', () => this.handleChatClick());
        }
    }

    _setLucideIcon(btn, newIcon) {
        if (!btn) return;
        const iconEl = btn.querySelector('[data-lucide]') || btn.querySelector('svg') || btn.querySelector('i');
        if (iconEl) {
            iconEl.setAttribute('data-lucide', newIcon);
        }
    }

    async updateUIBasedOnUserRole(shopData) {
        const getEl = (key) => this.elements[key];

        if (this.isShopOwner) {
            getEl('addProductBtn')?.classList.remove('hidden');
            getEl('viewWishlistRequestsBtn')?.classList.remove('hidden');
            getEl('viewOrdersBtn')?.classList.remove('hidden');

            getEl('followBtn')?.classList.add('hidden');
            getEl('chatBtn')?.classList.add('hidden');
            getEl('wishlistRequestBtn')?.classList.add('hidden');

            await this.updateWishlistRequestCount();
        } else {
            getEl('addProductBtn')?.classList.add('hidden');
            getEl('viewWishlistRequestsBtn')?.classList.add('hidden');
            getEl('viewOrdersBtn')?.classList.add('hidden');

            getEl('followBtn')?.classList.remove('hidden');
            getEl('chatBtn')?.classList.remove('hidden');
            getEl('wishlistRequestBtn')?.classList.remove('hidden');
        }
        if (typeof lucide !== 'undefined') { lucide.createIcons(); }
    }

    async updateWishlistRequestCount() {
        const btn = this.elements.viewWishlistRequestsBtn;
        if (!btn || typeof ProductRequestManager === 'undefined' || !ProductRequestManager.getRequestsByVendorId) return;

        try {
            const requestsResponse = await ProductRequestManager.getRequestsByVendorId(this.shopId);
            const count = requestsResponse.data?.length || 0;
            btn.innerHTML = `<i data-lucide="list-checks" class="w-5 h-5"></i> Requests (${count})`;
        } catch (e) {
            console.warn("Failed to fetch request count:", e);
            btn.innerHTML = `<i data-lucide="list-checks" class="w-5 h-5"></i> Requests (Error)`;
        }
        if (typeof lucide !== 'undefined') { lucide.createIcons(); }
    }

    renderShopProfile(data) {
        const user = data.user || {};
        const avatarUrl = user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.shopName)}&background=3b82f6&color=fff&size=256`;

        this.elements.shopAvatar.src = avatarUrl;
        this.elements.shopName.innerHTML = `<i data-lucide="store" class="w-8 h-8 text-blue-600"></i> ${data.shopName}`;
        this.elements.shopDetail.textContent = data.shopDetail || 'Welcome to our shop';
        this.elements.shopRating.textContent = (data.rating || 0).toFixed(1);
        this.elements.shopFollowers.textContent = this.formatNumber(data.followers || 0);
        this.elements.shopProductsCount.textContent = this.formatNumber(data.vendorProduct?.length || 0);

        if (typeof lucide !== 'undefined') { lucide.createIcons(); }
    }

    renderProducts(products) {
        const grid = this.elements.productsGrid;
        if (!grid) return;

        grid.innerHTML = '';

        const publicProducts = (products || []).filter(p => p.isPublic !== false);

        if (publicProducts.length === 0) {
            this.elements.productsEmpty?.classList.remove('hidden');
            return;
        }

        this.elements.productsEmpty?.classList.add('hidden');

        publicProducts.forEach(p => {
            const isDiscount = p.discountPrice && p.discountPrice < p.price;
            const displayPrice = isDiscount ? p.discountPrice : p.price;
            const oldPrice = isDiscount ? p.price : null;
            const discountPercent = isDiscount ? Math.round((1 - p.discountPrice / p.price) * 100) : 0;

            let imageArray = p.images;
            if (typeof p.images === 'string') {
                try { imageArray = JSON.parse(p.images); } catch (e) { imageArray = null; }
            }

            const primaryImage = Array.isArray(imageArray) && imageArray.length > 0
                ? imageArray[0]
                : 'https://dummyimage.com/400x400/e5e7eb/9ca3af.png&text=No+Image';

            const card = document.createElement('div');
            card.className = 'bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 overflow-hidden group cursor-pointer transition-all duration-300 hover:-translate-y-1 flex flex-col';

            let managementButtons = '';
            if (this.isShopOwner) {
                managementButtons = `
                    <div class="flex gap-2 p-3 pt-0 mt-auto border-t border-gray-100">
                        <button onclick="shopManager.openEditProductModal('${p.id}')" class="flex-1 flex items-center justify-center gap-1.5 bg-blue-100 text-blue-700 py-2 rounded-lg text-sm font-semibold hover:bg-blue-200 transition"><i data-lucide="square-pen" class="w-4 h-4"></i> Edit</button>
                        <button onclick="shopManager.deleteProduct('${p.id}', '${p.title}')" class="flex-1 flex items-center justify-center gap-1.5 bg-red-100 text-red-700 py-2 rounded-lg text-sm font-semibold hover:bg-red-200 transition"><i data-lucide="trash-2" class="w-4 h-4"></i> Delete</button>
                    </div>`;
            } else {
                managementButtons = `<div class="p-3 pt-0"></div>`;
            }

            card.innerHTML = `
                <a href="/product.html?id=${p.id}" class="block flex-grow">
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
                            <span class="text-lg font-bold text-blue-600">฿${this.formatPrice(displayPrice)}</span>
                            ${isDiscount ? `<span class="text-sm text-gray-400 line-through">฿${this.formatPrice(oldPrice)}</span>` : ''}
                        </div>
                        <div class="flex items-center justify-between text-xs text-gray-500">
                            <span class="flex items-center gap-1"><i data-lucide="shopping-cart" class="w-3 h-3"></i> ${this.formatNumber(p.orderCount)} sold</span>
                        </div>
                    </div>
                </a>
                ${managementButtons}
            `;

            grid.appendChild(card);
        });

        if (typeof lucide !== 'undefined') { lucide.createIcons(); }
    }

    openAddProductModal() {
        this.closeAddProductModal();
        this.elements.addProductModal?.classList.remove('hidden');
        if (typeof lucide !== 'undefined') { lucide.createIcons(); }
    }

    async openEditProductModal(productId) {
        const form = this.elements.addProductForm;

        try {
            const response = await ProductManager.getProduct(productId);
            const product = response.data;

            this.elements.modalTitle.innerHTML = `<i data-lucide="square-pen" class="w-6 h-6 text-blue-600"></i> Edit Product: ${product.title}`;
            this.elements.modalSubmitBtn.textContent = 'Save Changes';
            this.elements.modalSubmitBtn.classList.remove('bg-green-600', 'hover:bg-green-700', 'shadow-green-600/30');
            this.elements.modalSubmitBtn.classList.add('bg-blue-600', 'hover:bg-blue-700', 'shadow-blue-600/30');

            this.elements.productIdToEdit.value = product.id;

            form.elements['title'].value = product.title || '';
            form.elements['detail'].value = product.detail || '';
            form.elements['notes'].value = product.notes || '';
            form.elements['price'].value = parseFloat(product.price).toFixed(2);
            form.elements['discountPrice'].value = product.discountPrice ? parseFloat(product.discountPrice).toFixed(2) : '';
            form.elements['category'].value = product.category || '';

            const hashtagArray = Array.isArray(product.hashtag) ? product.hashtag : (product.hashtag ? [product.hashtag] : []);
            form.elements['hashtag'].value = hashtagArray.join('\n');

            const imagesArray = this.parseImages(product.images) || [];
            form.elements['images'].value = imagesArray.join('\n');

            this.elements.addProductModal?.classList.remove('hidden');
            if (typeof lucide !== 'undefined') { lucide.createIcons(); }

        } catch (error) {
            Swal.fire('Error', error.message || 'Failed to fetch product data', 'error');
        }
    }

    closeAddProductModal() {
        this.elements.addProductForm?.reset();
        this.elements.productIdToEdit.value = '';

        this.elements.modalTitle.innerHTML = `<i data-lucide="plus-circle" class="w-6 h-6 text-green-600"></i> Add New Product`;
        this.elements.modalSubmitBtn.textContent = 'Save Product';
        this.elements.modalSubmitBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700', 'shadow-blue-600/30');
        this.elements.modalSubmitBtn.classList.add('bg-green-600', 'hover:bg-green-700', 'shadow-green-600/30');

        this.elements.addProductModal?.classList.add('hidden');
    }

    async addProductOrUpdate(event) {
        event.preventDefault();

        const form = this.elements.addProductForm;
        const productId = form.elements['productId'].value;
        const isEditMode = !!productId;

        const formData = new FormData(form);
        const imagesString = formData.get('images');
        const hashtagString = formData.get('hashtag');

        const imagesPayload = imagesString ? imagesString.split('\n').map(url => url.trim()).filter(url => url.length > 0) : undefined;
        const hashtagPayload = hashtagString ? hashtagString.split('\n').map(tag => tag.trim().replace(/^#/, '')).filter(tag => tag.length > 0) : undefined;

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
            Swal.fire('Error', 'Please enter valid title and price', 'warning');
            return;
        }

        if (payload.discountPrice && payload.discountPrice >= payload.price) {
            Swal.fire('Invalid', 'Discount price must be less than regular price', 'warning');
            return;
        }

        Swal.fire({
            title: isEditMode ? 'Saving changes...' : 'Saving new product...',
            text: 'Please wait',
            icon: 'info',
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => { Swal.showLoading(); }
        });

        try {
            if (typeof ProductManager === 'undefined') throw new Error("ProductManager is not loaded.");

            if (isEditMode) {
                await ProductManager.updateProduct(productId, payload);
                Swal.fire('Success!', `Product "${payload.title}" updated`, 'success');
            } else {
                await ProductManager.addProduct(payload);
                Swal.fire('Success!', `New product "${payload.title}" added`, 'success');
            }

            this.closeAddProductModal();
            this.fetchShopData();

        } catch (error) {
            console.error("Product Save Error:", error);
            Swal.fire('Error', error.message || 'Failed to save product', 'error');
        }
    }

    async deleteProduct(productId, productTitle) {
        const result = await Swal.fire({
            title: 'Confirm Delete',
            text: `Are you sure you want to delete "${productTitle}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            Swal.fire({
                title: 'Deleting...',
                text: 'Please wait',
                icon: 'info',
                allowOutsideClick: false,
                showConfirmButton: false,
                didOpen: () => { Swal.showLoading(); }
            });

            try {
                if (typeof ProductManager === 'undefined') throw new Error("ProductManager is not loaded.");
                await ProductManager.deleteProduct(productId);

                Swal.fire('Deleted!', 'Product has been deleted', 'success');
                this.fetchShopData();
            } catch (error) {
                console.error("Delete Product Error:", error);
                Swal.fire('Error', error.message || 'Failed to delete product', 'error');
            }
        }
    }

    toggleFollow() {
        const btn = this.elements.followBtn;
        if (!btn) return;

        btn.classList.toggle('following');

        const isFollowing = btn.classList.contains('following');

        if (isFollowing) {
            btn.classList.remove('bg-blue-600', 'text-white', 'border-blue-600');
            btn.classList.add('bg-gray-100', 'text-gray-600', 'border-gray-300', 'border-2');
            btn.querySelector('.follow-text').textContent = 'Following';

            this._setLucideIcon(btn, 'user-check');
        } else {
            btn.classList.add('bg-blue-600', 'text-white', 'border-blue-600');
            btn.classList.remove('bg-gray-100', 'text-gray-600', 'border-gray-300', 'border-2');
            btn.querySelector('.follow-text').textContent = 'Follow';

            this._setLucideIcon(btn, 'user-plus');
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

    viewWishlistRequests() {
        window.location.href = `/shop/product-request.html?id=${this.shopId}`;
    }

    viewOrders() {
        window.location.href = "/vendor-orders.html";
    }

    async handleChatClick() {
        if (!this.auth.isLoggedIn()) {
            window.location.href = "/signIn.html";
            return;
        }

        if (!this.shopData && !this.shopId) return;

        if (this.shopData && this.shopData.userId) {
            try {
                const res = await ChatManager.initiateChat(this.shopData.userId);
                const room = res.data;
                window.location.href = `/chat.html?roomId=${room.id}`;
            } catch (error) {
                console.error("Chat Error", error);
                Swal.fire('Error', 'Failed to start chat', 'error');
            }
        } else {
            Swal.fire('Error', 'Invalid shop data', 'error');
        }
    }

    async openWishlistRequestModal() {
        if (!this.auth?.isLoggedIn()) {
            Swal.fire({
                icon: 'warning',
                title: 'Login Required',
                text: 'Please login to make a request',
            }).then(() => {
                window.location.href = "/signIn.html";
            });
            return;
        }

        const formInputStyles = "w-full p-2.5 rounded-lg border border-gray-300 text-[0.95rem] outline-none bg-white transition focus:border-blue-600 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.15)]";
        const formLabelStyles = "block text-sm font-medium text-gray-700 mb-1";

        const { value: formValues } = await Swal.fire({
            title: 'Request a Product',
            html: `
                <div class="text-left p-2.5">
                    <p class="text-xs text-red-500 mb-3">Please fill in details</p>
                    <label for="swal-title" class="${formLabelStyles}">Title (Required)</label>
                    <input id="swal-title" class="${formInputStyles} mb-3" placeholder="e.g. Seiko Watch">
                    
                    <label for="swal-details" class="${formLabelStyles}">Details</label>
                    <textarea id="swal-details" class="${formInputStyles} mb-3" rows="3" placeholder="Color, size, model..."></textarea>

                    <label for="swal-budget" class="${formLabelStyles}">Budget (THB)</label>
                    <input id="swal-budget" type="number" step="0.01" min="0" class="${formInputStyles} mb-3" placeholder="e.g. 15000">

                    <label for="swal-link" class="${formLabelStyles}">Reference Link</label>
                    <input id="swal-link" class="${formInputStyles} mb-3" placeholder="URL">

                    <label for="swal-images" class="${formLabelStyles}">Image URLs (One per line)</label>
                    <textarea id="swal-images" class="${formInputStyles}" rows="2" placeholder="URL1\nURL2"></textarea>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Submit Request',
            showLoaderOnConfirm: true,
            preConfirm: () => {
                const title = document.getElementById('swal-title').value;
                const details = document.getElementById('swal-details').value;
                const budget = document.getElementById('swal-budget').value;
                const productLink = document.getElementById('swal-link').value;
                const images = document.getElementById('swal-images').value;

                if (!title.trim()) {
                    Swal.showValidationMessage('Title is required');
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
                title: 'Sending request...',
                icon: 'info',
                allowOutsideClick: false,
                showConfirmButton: false,
                didOpen: () => Swal.showLoading()
            });

            try {
                if (typeof ProductRequestManager === 'undefined' || !window.ProductRequestManager.createRequest) {
                    throw new Error("ProductRequestManager is not loaded.");
                }

                await ProductRequestManager.createRequest(formValues);

                Swal.fire({
                    icon: 'success',
                    title: 'Sent!',
                    text: 'Your request has been sent',
                    timer: 2500
                });

            } catch (error) {
                console.error("Wishlist Request Error:", error);
                Swal.fire('Error', error.message || 'Failed to send request', 'error');
            }
        }
        if (typeof lucide !== 'undefined') { lucide.createIcons(); }
    }


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

    formatPrice(price) {
        return parseFloat(price).toLocaleString('th-TH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    parseImages(images) {
        if (typeof images === 'string') {
            try {
                return JSON.parse(images);
            } catch (e) {
                return null;
            }
        }
        return images;
    }
}

const shopManager = new ShopManager();
window.shopManager = shopManager;