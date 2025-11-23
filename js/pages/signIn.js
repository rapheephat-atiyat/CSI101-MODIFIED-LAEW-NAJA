// js/pages/signIn.js (Final Refined Logic)

class SignInPage {
    constructor(authManager) {
        this.manager = authManager;
        this.bindEvents();
        if (window.lucide) window.lucide.createIcons();
    }

    togglePass() {
        const input = document.getElementById('password');
        const icon = document.getElementById('eye-icon');
        if (input.type === "password") {
            input.type = "text";
            icon.setAttribute("data-lucide", "eye-off");
        } else {
            input.type = "password";
            icon.setAttribute("data-lucide", "eye");
        }
        if (window.lucide) window.lucide.createIcons();
    }

    bindEvents() {
        document.getElementById("signinForm").addEventListener("submit", this.handleSignIn.bind(this));
        document.querySelector(".google-button").addEventListener("click", this.handleGoogleSignIn.bind(this));

        const passButton = document.querySelector('.toggle-password-btn');
        if (passButton) passButton.addEventListener('click', this.togglePass.bind(this));
    }

    async handleSignIn(e) {
        e.preventDefault();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        try {
            Swal.fire({ title: 'กำลังเข้าสู่ระบบ...', didOpen: () => Swal.showLoading() });
            await this.manager.login(email, password);
            Swal.fire({
                title: "สำเร็จ!", text: "เข้าสู่ระบบเรียบร้อยแล้ว", icon: "success",
                timer: 1500, showConfirmButton: false
            }).then(() => {
                window.location.href = "/";
            });

        } catch (err) {
            console.error(err);
            Swal.fire({
                title: "เข้าสู่ระบบไม่สำเร็จ",
                text: err.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
                icon: "error",
                confirmButtonText: 'ลองใหม่'
            });
        }
    }

    handleGoogleSignIn(e) {
        e.preventDefault();
        this.manager.loginWithGoogle();
    }
}

// 🎯 โครงสร้าง Asynchronous หลัก: รอการตรวจสอบสิทธิ์ก่อนแสดงผล
async function initSignInPage() {
    const manager = new AuthManager();
    const signinContainer = document.getElementById('signin-container');

    // 1. ตรวจสอบสถานะการ Login อย่างเข้มงวด
    if (manager.isLoggedIn()) {
        try {
            // หาก Token ใช้ได้จริง: Redirect ทันที (Browser จะไม่เรนเดอร์ส่วนที่ถูกซ่อน)
            await manager.getProfile();
            window.location.href = "/";
            return; // หยุดการทำงาน
        } catch (e) {
            // หาก Token เสีย/หมดอายุ: ล้าง Token ออก
            manager.clearToken();
        }
    }

    // 2. Token ไม่มี / ถูกล้างแล้ว: โหลด UI และผูก Event Handlers
    window.signInPage = new SignInPage(manager);

    // 3. 🎯 แสดงฟอร์มเมื่อแน่ใจว่าจะไม่ Redirect แล้ว (แก้ปัญหาการกระพริบ)
    if (signinContainer) {
        signinContainer.classList.remove('hidden');
    }
}

document.addEventListener("DOMContentLoaded", initSignInPage);