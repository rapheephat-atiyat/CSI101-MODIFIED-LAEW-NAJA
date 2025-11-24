class CartPage {
    constructor() {
        this.auth = new AuthManager();
        this.init();
        if (window.lucide) window.lucide.createIcons();
    }

    async init() {
        if (!this.auth.isLoggedIn()) {
            window.location.href = "/signIn.html";
            return;
        }
        this.cartItemsContainer = document.getElementById('cart-items-container');
        this.checkoutBtn = document.getElementById('checkout-button');
        this.totalPriceElement = document.getElementById('total-price');
        this.subtotalPriceElement = document.getElementById('subtotal-price');
        this.freePriceElement = document.getElementById('fee-price');

        this.bindEvents();
        await this.loadCartData();
    }

    bindEvents() {
        this.cartItemsContainer.addEventListener('click', async (e) => {
            if (e.target.closest('.remove-item-btn')) {
                const button = e.target.closest('.remove-item-btn');
                const vendorProductId = button.getAttribute('data-product-id');
                await this.handleRemoveItem(vendorProductId);
            }
        });
        if (this.checkoutBtn) {
            this.checkoutBtn.addEventListener('click', this.handleCheckout.bind(this));
        }
    }

    async loadCartData() {
        this.cartItemsContainer.innerHTML = this.getLoadingHTML('กำลังโหลดตะกร้าสินค้า...');
        try {
            const response = await CartManager.getCart();
            this.renderCart(response.data);
        } catch (error) {
            this.cartItemsContainer.innerHTML = this.getErrorHTML(`ไม่สามารถโหลดตะกร้าสินค้าได้: ${error.message}`);
            this.updateTotalPrice(0);
        }
    }

    renderCart(items) {
        if (items.length === 0) {
            this.cartItemsContainer.innerHTML = `
                <div class="text-center py-20 bg-white rounded-xl shadow-inner text-gray-500">
                    <i data-lucide="shopping-cart" class="w-10 h-10 mx-auto mb-3"></i>
                    <p class="text-lg font-medium">ตะกร้าสินค้าว่างเปล่า</p>
                    <a href="/product.html" class="text-blue-600 hover:underline mt-2 inline-block">เริ่มต้นช้อปปิ้ง</a>
                </div>
            `;
            this.updateTotalPrice(0);
            if (this.checkoutBtn) this.checkoutBtn.disabled = true;
            if (window.lucide) window.lucide.createIcons();
            return;
        }

        let total = 0;
        const html = items.map(item => {
            const itemTotal = item.quantity * item.vendorProduct.price;
            total += itemTotal;
            return `
                <div class="flex items-center gap-4 py-4 border-b border-gray-100 last:border-b-0">
                    <img src="${item.vendorProduct.images[0] || '/images/assets/default-product.png'}" alt="${item.vendorProduct.name}" class="w-16 h-16 object-cover rounded-lg flex-shrink-0">
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-semibold truncate">${item.vendorProduct.title}</p>
                        <p class="text-xs text-gray-500">รหัส: ${item.vendorProduct.id}</p>
                    </div>
                    <div class="text-right flex-shrink-0">
                        <p class="text-sm font-medium text-gray-800">${window.formatCurrency(item.vendorProduct.price)} x ${item.quantity}</p>
                        <p class="text-xs font-bold text-blue-600 mt-0.5">${window.formatCurrency(itemTotal)}</p>
                    </div>
                    <button class="remove-item-btn p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors flex-shrink-0" data-product-id="${item.vendorProductId}">
                        <i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i>
                    </button>
                </div>
            `;
        }).join('');

        this.cartItemsContainer.innerHTML = html;
        this.updateTotalPrice(total);
        if (this.checkoutBtn) this.checkoutBtn.disabled = false;
        if (window.lucide) window.lucide.createIcons();
    }

    updateTotalPrice(total) {
        if (this.totalPriceElement && this.subtotalPriceElement) {
            this.subtotalPriceElement.textContent = window.formatCurrency(total);
            this.freePriceElement.textContent = window.formatCurrency(total * 0.05);
            this.totalPriceElement.textContent = window.formatCurrency(total * 1.05);
        }
    }

    async handleRemoveItem(vendorProductId) {
        const result = await Swal.fire({
            title: 'ยืนยันการลบสินค้า?', text: "คุณต้องการนำสินค้านี้ออกจากตะกร้าใช่หรือไม่", icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#6b7280', confirmButtonText: 'ใช่, ลบเลย!'
        });

        if (result.isConfirmed) {
            try {
                Swal.fire({ title: 'กำลังลบ...', didOpen: () => Swal.showLoading() });
                await CartManager.removeItem(vendorProductId);
                Swal.fire({ icon: 'success', title: 'ลบสำเร็จ!', text: 'สินค้านี้ถูกนำออกจากตะกร้าแล้ว', showConfirmButton: false, timer: 1000 });
                await this.loadCartData();
                document.querySelector('navbar-eiei')?.refreshCart();
            } catch (error) {
                Swal.fire('ลบไม่สำเร็จ', error.message, 'error');
            }
        }
    }

    handleCheckout() {
        Swal.fire({
            icon: 'info', title: 'ยังไม่พร้อมใช้งาน', text: 'ระบบชำระเงินกำลังอยู่ในระหว่างการพัฒนา', confirmButtonText: 'ตกลง'
        });
    }

    getLoadingHTML(message) {
        return `<div class="text-center py-10 text-gray-500">
            <i data-lucide="loader-circle" class="w-8 h-8 mx-auto animate-spin"></i>
            <p class="mt-2">${message}</p>
        </div>`;
    }

    getErrorHTML(message) {
        return `<div class="text-center py-10 text-red-500">
            <i data-lucide="x-octagon" class="w-8 h-8 mx-auto"></i>
            <p class="mt-2">${message}</p>
        </div>`;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if (typeof CartManager !== 'undefined' && typeof AuthManager !== 'undefined') {
        window.cartPage = new CartPage();
    } else {
        console.error("Dependencies (CartManager/AuthManager) not loaded.");
    }
});