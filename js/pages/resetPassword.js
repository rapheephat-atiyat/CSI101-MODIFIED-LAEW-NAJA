class ResetPasswordPage {
    constructor() {
        this.auth = new AuthManager();
        this.token = this.getTokenFromUrl();
        this.initialize();
        this.bindEvents();
    }

    getTokenFromUrl() {
        const searchParams = new URLSearchParams(window.location.search);
        return searchParams.get('token');
    }

    togglePass(inputId, btnElement) {
        const input = document.getElementById(inputId);
        const icon = btnElement.querySelector('i');
        const type = input.type === 'password' ? 'text' : 'password';
        const iconName = type === 'password' ? 'eye' : 'eye-off';

        input.type = type;
        icon.setAttribute('data-lucide', iconName);
        if (window.lucide) window.lucide.createIcons();
    }

    initialize() {
        // ตรวจสอบว่ามี Token ใน URL หรือไม่
        if (!this.token) {
            Swal.fire({
                icon: 'error', title: 'ไม่พบ Token', text: 'ลิงก์ไม่ถูกต้องหรือหมดอายุ',
                confirmButtonText: 'กลับไปหน้าหลัก', allowOutsideClick: false
            }).then(() => { window.location.href = '/signIn.html'; });
        }
        if (window.lucide) window.lucide.createIcons();
    }

    bindEvents() {
        document.getElementById("resetForm").addEventListener("submit", this.handleResetPassword.bind(this));

        // ผูก Event Listener สำหรับปุ่มสลับการแสดงรหัสผ่าน
        document.querySelectorAll('button[data-toggle-pass]').forEach(btn => {
            const inputId = btn.getAttribute('data-toggle-pass');
            btn.onclick = (e) => { e.preventDefault(); this.togglePass(inputId, btn); };
        });
    }

    async handleResetPassword(e) {
        e.preventDefault();
        const newPassword = document.getElementById("newPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (newPassword !== confirmPassword) {
            return Swal.fire({
                icon: 'warning', title: 'รหัสผ่านไม่ตรงกัน',
                text: 'กรุณากรอกรหัสผ่านให้ตรงกันทั้งสองช่อง',
                confirmButtonColor: '#f59e0b'
            });
        }

        if (!this.token) return Swal.fire("Error", "Token missing", "error");

        try {
            Swal.fire({
                title: 'กำลังบันทึก...', text: 'กรุณารอสักครู่',
                allowOutsideClick: false, didOpen: () => Swal.showLoading()
            });

            await this.auth.confirmResetPassword(this.token, newPassword);

            Swal.fire({
                icon: 'success', title: 'เปลี่ยนรหัสผ่านสำเร็จ!',
                text: 'คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที',
                confirmButtonText: 'ไปหน้าเข้าสู่ระบบ', confirmButtonColor: '#10b981',
                allowOutsideClick: false
            }).then(() => {
                window.location.href = '/signIn.html';
            });
        } catch (err) {
            Swal.fire({
                icon: 'error', title: 'เกิดข้อผิดพลาด',
                text: err.message || 'ไม่สามารถตั้งรหัสผ่านใหม่ได้ ลองตรวจสอบลิงก์อีกครั้ง',
                confirmButtonText: 'ตกลง'
            });
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    window.resetPasswordPage = new ResetPasswordPage();
});