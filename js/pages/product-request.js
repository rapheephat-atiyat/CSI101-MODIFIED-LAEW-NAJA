class ProductRequestPage {
    constructor() {
        this.auth = new AuthManager();
        this.vendorId = this.getVendorIdFromUrl();
        this.init();
        if (window.lucide) window.lucide.createIcons();
    }
    getVendorIdFromUrl() {
        const searchParams = new URLSearchParams(window.location.search);
        return searchParams.get('vendorId');
    }
    async init() {
        const user = await this.auth.protect();
        if (!this.vendorId) {
            Swal.fire({
                icon: 'error', title: 'ข้อผิดพลาด', text: 'ไม่พบ ID ร้านค้าเป้าหมาย',
                confirmButtonText: 'กลับหน้าหลัก'
            }).then(() => { window.location.href = '/'; });
            return;
        }
        await this.loadVendorInfo();
        this.bindEvents();
    }
    async loadVendorInfo() {
        try {
            const profile = await VendorProfileManager.getShopProfile(this.vendorId);
            document.getElementById('vendor-name').textContent = profile.vendorProfile.shopName;
        } catch (error) {
            document.getElementById('vendor-name').textContent = 'ร้านค้า (ไม่พบข้อมูล)';
            Swal.fire('ข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลร้านค้าได้', 'error');
        }
    }
    bindEvents() {
        document.getElementById('productRequestForm').addEventListener('submit', this.handleSubmit.bind(this));
    }
    async handleSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const payload = {
            vendorId: this.vendorId,
            productName: form.productName.value.trim(),
            productLink: form.productLink.value.trim(),
            description: form.description.value.trim(),
            quantity: parseInt(form.quantity.value),
            targetPrice: parseFloat(form.targetPrice.value)
        };
        if (!payload.productName || !payload.quantity || !payload.targetPrice) {
            return Swal.fire('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกชื่อสินค้า จำนวน และราคาเป้าหมาย', 'warning');
        }
        try {
            Swal.fire({ title: 'กำลังส่งคำขอ...', didOpen: () => Swal.showLoading() });
            await ProductRequestManager.createRequest(payload);
            Swal.fire({
                icon: 'success', title: 'ส่งคำขอสำเร็จ!',
                text: 'ร้านค้าจะได้รับการแจ้งเตือนและติดต่อกลับไปในเร็วๆ นี้',
                confirmButtonText: 'กลับไปหน้าหลัก'
            }).then(() => {
                window.location.href = '/';
            });
        } catch (error) {
            Swal.fire('ส่งคำขอไม่สำเร็จ', error.message, 'error');
        }
    }
}
document.addEventListener("DOMContentLoaded", () => {
    if (typeof ProductRequestManager !== 'undefined' && typeof AuthManager !== 'undefined' && typeof VendorProfileManager !== 'undefined') {
        window.productRequestPage = new ProductRequestPage();
    } else {
        console.error("Dependencies (ProductRequestManager/AuthManager/VendorProfileManager) not loaded.");
    }
});