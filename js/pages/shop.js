class ShopPage {
    constructor() {
        this.vendorId = this.getVendorIdFromUrl();
        this.auth = new AuthManager();
        this.init();
        if (window.lucide) window.lucide.createIcons();
    }
    getVendorIdFromUrl() {
        const searchParams = new URLSearchParams(window.location.search);
        return searchParams.get('id');
    }
    async init() {
        if (!this.vendorId) {
            document.getElementById('shop-profile-container').innerHTML = `<div class="text-center py-20 text-gray-500">กรุณาระบุ ID ร้านค้าที่ต้องการดู</div>`;
            return;
        }
        this.profileContainer = document.getElementById('shop-profile-container');
        this.productsContainer = document.getElementById('shop-products-container');
        await this.loadShopData();
        this.bindEvents();
    }
    bindEvents() {
        const requestProductBtn = document.getElementById('request-product-btn');
        if (requestProductBtn) {
            requestProductBtn.addEventListener('click', this.handleRequestProduct.bind(this));
        }
    }
    async loadShopData() {
        this.profileContainer.innerHTML = this.getLoadingHTML('กำลังโหลดข้อมูลร้านค้า...');
        this.productsContainer.innerHTML = this.getLoadingHTML('กำลังโหลดสินค้า...');
        try {
            const profileData = await VendorProfileManager.getShopProfile(this.vendorId);
            this.renderProfile(profileData.vendorProfile);
            this.renderProducts(profileData.products);
        } catch (error) {
            this.profileContainer.innerHTML = `<div class="p-6 bg-red-50 rounded-xl text-red-700">ไม่พบร้านค้า หรือ: ${error.message}</div>`;
            this.productsContainer.innerHTML = `<div class="text-center py-20 text-gray-500">ไม่พบรายการสินค้า</div>`;
        }
    }
    renderProfile(profile) {
        const user = this.auth.getDecodedToken();
        const isOwner = user?.role === 'VENDOR' && user?.vendorId === profile.id;
        const shopLink = `/shop.html?id=${profile.id}`;

        this.profileContainer.innerHTML = `
            <div class="relative bg-white p-6 md:p-10 rounded-2xl shadow-xl border border-gray-100">
                <div class="flex items-center space-x-6">
                    <div class="w-24 h-24 md:w-32 md:h-32 flex-shrink-0">
                        <img src="${profile.image || '/images/assets/default-shop.png'}" alt="${profile.shopName}" class="w-full h-full object-cover rounded-full ring-4 ring-white shadow-md">
                    </div>
                    <div class="flex-1 min-w-0">
                        <h1 class="text-3xl md:text-4xl font-extrabold text-gray-900">${profile.shopName}</h1>
                        <p class="text-md text-gray-500 mt-1 flex items-center gap-2">
                            <i data-lucide="map-pin" class="w-4 h-4"></i>
                            <span>${profile.location || 'ไม่ได้ระบุสถานที่'}</span>
                        </p>
                        <p class="text-gray-600 mt-3">${profile.description || 'ร้านค้านี้ยังไม่มีคำอธิบาย'}</p>
                    </div>
                </div>
                ${isOwner ? `
                    <div class="mt-6 border-t pt-4">
                        <a href="/dashboard.html" class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                            <i data-lucide="layout-dashboard" class="w-4 h-4 mr-2"></i>
                            จัดการร้านค้า
                        </a>
                    </div>
                ` : ''}
                <button id="request-product-btn" class="absolute top-5 right-5 inline-flex items-center gap-2 px-4 py-2 bg-pink-600 text-white text-sm font-medium rounded-full hover:bg-pink-700 transition-colors">
                    <i data-lucide="package-plus" class="w-4 h-4"></i>
                    ฝากหิ้วสินค้า
                </button>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
    }
    renderProducts(products) {
        if (products.length === 0) {
            this.productsContainer.innerHTML = `<div class="text-center py-20 text-gray-500 bg-white rounded-xl shadow-inner border border-gray-100">
                <i data-lucide="package-open" class="w-10 h-10 mx-auto mb-3"></i>
                <p class="text-lg font-medium">ร้านค้านี้ยังไม่มีสินค้า</p>
            </div>`;
            return;
        }
        const productCards = products.map(item => `
            <a href="/product.html?id=${item.productId}" class="group block bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
                <div class="relative overflow-hidden h-48">
                    <img src="${item.product.image || '/images/assets/default-product.png'}" alt="${item.product.name}" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105">
                    ${item.discountPercent ? `<span class="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">${item.discountPercent}% OFF</span>` : ''}
                </div>
                <div class="p-4">
                    <h3 class="text-base font-semibold text-gray-900 truncate">${item.product.name}</h3>
                    <p class="text-xs text-gray-500 mb-2 truncate">${item.product.category}</p>
                    <div class="flex items-center justify-between">
                        <span class="text-lg font-bold text-red-600">${window.formatCurrency(item.price)}</span>
                        ${item.originalPrice ? `<span class="text-sm text-gray-400 line-through">${window.formatCurrency(item.originalPrice)}</span>` : ''}
                    </div>
                </div>
            </a>
        `).join('');
        this.productsContainer.innerHTML = `
            <h2 class="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">สินค้าทั้งหมด</h2>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                ${productCards}
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
    }
    handleRequestProduct() {
        if (!this.auth.isLoggedIn()) {
            Swal.fire({
                icon: 'info', title: 'กรุณาเข้าสู่ระบบ',
                text: 'คุณต้องเข้าสู่ระบบก่อนจึงจะฝากหิ้วสินค้าได้',
                confirmButtonText: 'ไปหน้าเข้าสู่ระบบ'
            }).then(() => { window.location.href = "/signIn.html"; });
            return;
        }
        window.location.href = `/shop/product-request.html?vendorId=${this.vendorId}`;
    }
    getLoadingHTML(message) {
        return `<div class="text-center py-20 text-blue-600">
            <i data-lucide="loader-circle" class="w-10 h-10 mx-auto animate-spin"></i>
            <p class="mt-3 text-lg">${message}</p>
        </div>`;
    }
}
document.addEventListener("DOMContentLoaded", () => {
    if (typeof VendorProfileManager !== 'undefined' && typeof AuthManager !== 'undefined') {
        window.shopPage = new ShopPage();
    } else {
        console.error("Dependencies (VendorProfileManager/AuthManager) not loaded.");
    }
});