class ProductDetailPage {
    constructor() {
        this.auth = new AuthManager();
        this.productId = this.getProductIdFromUrl();
        this.vendorProductId = null;
        this.productData = null;
        this.init();
        if (window.lucide) window.lucide.createIcons();
    }
    getProductIdFromUrl() {
        const searchParams = new URLSearchParams(window.location.search);
        return searchParams.get('id');
    }
    async init() {
        if (!this.productId) {
            document.getElementById('product-detail').innerHTML = `<div class="text-center py-20 text-red-500">ไม่พบ ID สินค้า</div>`;
            return;
        }
        await this.loadProductDetails();
        await this.loadRelatedProducts();
        this.bindEvents();
    }
    async loadProductDetails() {
        try {
            document.getElementById('product-detail').innerHTML = this.getLoadingHTML('กำลังโหลดรายละเอียดสินค้า...');
            this.productData = await ProductManager.getProduct(this.productId);
            this.vendorProductId = this.productData.vendorProduct.id;
            this.renderProduct(this.productData);
        } catch (error) {
            document.getElementById('product-detail').innerHTML = `<div class="text-center py-20 text-red-500">
                <i data-lucide="frown" class="w-12 h-12 mx-auto mb-3"></i>
                <p class="text-lg">ไม่พบสินค้า: ${error.message}</p>
            </div>`;
        }
    }
    async loadRelatedProducts() {
        try {
            const response = await ProductManager.getRelatedProducts(this.productId);
            this.renderRelatedProducts(response.data);
        } catch (error) {
            console.error("Failed to load related products:", error);
            this.renderRelatedProducts([]);
        }
    }
    renderProduct(data) {
        const { product, vendorProduct, vendor } = data;
        const detailHTML = `
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div class="lg:sticky top-20">
                    <img src="${product.image || '/images/assets/default-product.png'}" alt="${product.name}" class="w-full h-auto object-cover rounded-2xl shadow-lg border border-gray-100">
                </div>
                <div class="space-y-6">
                    <span class="inline-block bg-blue-100 text-blue-600 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">${product.category}</span>
                    <h1 class="text-4xl font-extrabold text-gray-900">${product.name}</h1>
                    <div class="flex items-center gap-3">
                        <div class="text-3xl font-bold text-red-600">${window.formatCurrency(vendorProduct.price)}</div>
                        <span class="text-gray-500 text-sm line-through">฿${vendorProduct.originalPrice ? window.formatCurrency(vendorProduct.originalPrice) : ''}</span>
                        ${vendorProduct.discountPercent ? `<span class="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">${vendorProduct.discountPercent}% OFF</span>` : ''}
                    </div>
                    <p class="text-gray-700 leading-relaxed whitespace-pre-wrap">${product.description || 'ไม่มีคำอธิบายสำหรับสินค้านี้'}</p>
                    <div class="border-t border-b border-gray-100 py-4 space-y-3">
                        <div class="flex justify-between items-center text-sm">
                            <span class="font-medium text-gray-600">สถานะ:</span>
                            <span class="font-semibold text-green-600">${vendorProduct.stock > 0 ? 'มีสินค้าพร้อมส่ง' : 'สินค้าหมด'}</span>
                        </div>
                        <div class="flex justify-between items-center text-sm">
                            <span class="font-medium text-gray-600">จำนวนที่เหลือ:</span>
                            <span class="font-semibold text-gray-800">${vendorProduct.stock} ชิ้น</span>
                        </div>
                        <div class="flex justify-between items-center text-sm">
                            <span class="font-medium text-gray-600">จัดจำหน่ายโดย:</span>
                            <a href="/shop.html?id=${vendor.id}" class="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors">${vendor.shopName}</a>
                        </div>
                    </div>
                    <div class="flex items-center gap-4 pt-4">
                        <div class="flex items-center border border-gray-300 rounded-xl overflow-hidden">
                            <button id="decrement-qty" class="p-3 hover:bg-gray-100 transition-colors" type="button"><i data-lucide="minus" class="w-4 h-4"></i></button>
                            <input type="number" id="quantity-input" value="1" min="1" max="${vendorProduct.stock}" class="w-16 text-center border-x border-gray-200 p-2.5 text-lg font-bold outline-none" readonly>
                            <button id="increment-qty" class="p-3 hover:bg-gray-100 transition-colors" type="button"><i data-lucide="plus" class="w-4 h-4"></i></button>
                        </div>
                        <button id="add-to-cart-btn" 
                            class="flex-1 py-3.5 px-6 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700 transition-all duration-200 disabled:bg-gray-400 disabled:shadow-none"
                            ${vendorProduct.stock === 0 ? 'disabled' : ''}>
                            <i data-lucide="shopping-cart" class="w-5 h-5 mr-2 inline-block"></i>
                            เพิ่มลงตะกร้า
                        </button>
                    </div>
                    <p id="error-message" class="text-red-500 text-sm hidden"></p>
                </div>
            </div>
        `;
        document.getElementById('product-detail').innerHTML = detailHTML;
        if (window.lucide) window.lucide.createIcons();
    }
    renderRelatedProducts(products) {
        const container = document.getElementById('related-products-container');
        if (!container) return;
        if (products.length === 0) {
            container.innerHTML = `<p class="text-center text-gray-500 py-10">ไม่พบสินค้าที่เกี่ยวข้อง</p>`;
            return;
        }
        const productCards = products.map(item => `
            <a href="/product.html?id=${item.id}" class="group block bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
                <div class="relative overflow-hidden h-48">
                    <img src="${item.image || '/images/assets/default-product.png'}" alt="${item.name}" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105">
                </div>
                <div class="p-4">
                    <h3 class="text-base font-semibold text-gray-900 truncate">${item.name}</h3>
                    <p class="text-xs text-gray-500 mb-2 truncate">${item.category}</p>
                    <div class="flex items-center justify-between">
                        <span class="text-lg font-bold text-red-600">${window.formatCurrency(item.price)}</span>
                        <span class="text-sm text-gray-500">${item.vendor.shopName}</span>
                    </div>
                </div>
            </a>
        `).join('');
        container.innerHTML = `
            <h2 class="text-2xl font-bold text-gray-900 mb-6">สินค้าอื่นที่น่าสนใจ</h2>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                ${productCards}
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
    }
    bindEvents() {
        const input = document.getElementById('quantity-input');
        const incrementBtn = document.getElementById('increment-qty');
        const decrementBtn = document.getElementById('decrement-qty');
        const cartBtn = document.getElementById('add-to-cart-btn');
        if (input && incrementBtn && decrementBtn) {
            const maxStock = parseInt(input.getAttribute('max')) || Infinity;
            incrementBtn.addEventListener('click', () => {
                let currentQty = parseInt(input.value);
                if (currentQty < maxStock) {
                    input.value = currentQty + 1;
                }
            });
            decrementBtn.addEventListener('click', () => {
                let currentQty = parseInt(input.value);
                if (currentQty > 1) {
                    input.value = currentQty - 1;
                }
            });
        }
        if (cartBtn) {
            cartBtn.addEventListener('click', this.handleAddToCart.bind(this));
        }
    }
    getLoadingHTML(message) {
        return `<div class="text-center py-20 text-blue-600">
            <i data-lucide="loader-circle" class="w-10 h-10 mx-auto animate-spin"></i>
            <p class="mt-3 text-lg">${message}</p>
        </div>`;
    }
    async handleAddToCart() {
        if (!this.auth.isLoggedIn()) {
            await Swal.fire({
                icon: 'info', title: 'กรุณาเข้าสู่ระบบ',
                text: 'คุณต้องเข้าสู่ระบบก่อนจึงจะเพิ่มสินค้าลงตะกร้าได้',
                showCancelButton: true, confirmButtonText: 'ไปหน้าเข้าสู่ระบบ'
            }).then((result) => {
                if (result.isConfirmed) { window.location.href = "/signIn.html"; }
            });
            return;
        }
        const quantity = parseInt(document.getElementById('quantity-input').value);
        if (quantity < 1 || quantity > this.productData.vendorProduct.stock) {
            Swal.fire('ข้อผิดพลาด', 'จำนวนสินค้าไม่ถูกต้อง', 'warning');
            return;
        }
        try {
            Swal.fire({ title: 'กำลังเพิ่มสินค้า...', didOpen: () => Swal.showLoading() });
            await CartManager.addItemToCart(this.vendorProductId, quantity);
            Swal.fire({
                icon: 'success', title: 'เพิ่มลงตะกร้าสำเร็จ!',
                text: `${quantity} ชิ้นของ ${this.productData.product.name} ถูกเพิ่มแล้ว`,
                showConfirmButton: true, confirmButtonText: 'ไปที่ตะกร้าสินค้า',
                showCancelButton: true, cancelButtonText: 'ช้อปต่อ'
            }).then((result) => {
                if (result.isConfirmed) { window.location.href = "/cart.html"; }
            });
            document.querySelector('navbar-eiei')?.refreshCart();
        } catch (error) {
            Swal.fire('เพิ่มไม่สำเร็จ', error.message, 'error');
        }
    }
}
document.addEventListener("DOMContentLoaded", () => {
    if (typeof ProductManager !== 'undefined' && typeof CartManager !== 'undefined') {
        window.productPage = new ProductDetailPage();
    } else {
        console.error("Dependencies (ProductManager/CartManager) not loaded.");
    }
});