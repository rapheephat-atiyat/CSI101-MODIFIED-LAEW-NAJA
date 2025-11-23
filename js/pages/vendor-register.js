class VendorRegisterPage {
    constructor() {
        this.auth = new AuthManager();
        this.manager = VendorManager;
        this.init();
        if (window.lucide) window.lucide.createIcons();
    }
    async init() {
        const user = await this.auth.protect(['CUSTOMER']);
        document.getElementById('user-email-display').textContent = user.email;
        this.bindEvents();
    }
    bindEvents() {
        document.getElementById('vendorRegisterForm').addEventListener('submit', this.handleSubmit.bind(this));
    }
    async handleSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const payload = {
            shopName: form.shopName.value.trim(), phone: form.phone.value.trim(),
            location: form.location.value.trim(), description: form.description.value.trim(),
        };
        if (!payload.shopName || !payload.phone || !payload.location || !payload.description || form.idCard.files.length === 0) {
            return Swal.fire('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกข้อมูลและอัพโหลดเอกสารให้ครบถ้วน', 'warning');
        }
        try {
            Swal.fire({ title: 'กำลังส่งคำขอ...', text: 'กรุณารอสักครู่ การอัพโหลดเอกสารอาจใช้เวลา', didOpen: () => Swal.showLoading() });

            await this.manager.register(payload);

            Swal.fire({
                icon: 'success', title: 'ส่งคำขอสำเร็จ!',
                html: '<p>คำขอของคุณถูกส่งไปยังผู้ดูแลระบบเพื่อพิจารณาแล้ว</p><p class="text-sm text-gray-500 mt-2">คุณจะได้รับการแจ้งเตือนทางอีเมลเมื่อได้รับการอนุมัติ</p>',
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
    if (typeof AuthManager !== 'undefined' && typeof VendorManager !== 'undefined') {
        window.vendorRegisterPage = new VendorRegisterPage();
    } else {
        console.error("Dependencies (AuthManager/VendorManager) not loaded.");
    }
});