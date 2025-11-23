class ForgotPasswordPage {
    constructor() {
        this.auth = new AuthManager();
        this.bindEvents();
        if (window.lucide) window.lucide.createIcons();
    }

    bindEvents() {
        document.getElementById("forgotForm").addEventListener("submit", this.handleForgotPassword.bind(this));
    }

    async handleForgotPassword(e) {
        e.preventDefault();
        const email = document.getElementById("email").value;

        try {
            Swal.fire({
                title: 'กำลังส่งอีเมล...', text: 'กรุณารอสักครู่',
                allowOutsideClick: false, didOpen: () => Swal.showLoading()
            });

            await this.auth.requestPasswordReset(email);

            Swal.fire({
                icon: 'success', title: 'ส่งอีเมลสำเร็จ!',
                html: `<p class="text-sm text-gray-600">เราได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปที่ <b>${email}</b> แล้ว</p>
                       <p class="text-xs text-gray-400 mt-2">(กรุณาตรวจสอบกล่องจดหมาย รวมถึง Junk/Spam)</p>`,
                confirmButtonText: 'ตกลง', confirmButtonColor: '#2563eb'
            });
        } catch (err) {
            Swal.fire({
                icon: 'error', title: 'เกิดข้อผิดพลาด',
                text: err.message || 'ไม่สามารถส่งอีเมลได้', confirmButtonText: 'ลองใหม่'
            });
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    window.forgotPasswordPage = new ForgotPasswordPage();
});