class SignUpPage {
    constructor() {
        this.manager = new AuthManager();
        if (this.manager.isLoggedIn()) {
            window.location.href = "/";
        }
        this.bindEvents();
        if (window.lucide) window.lucide.createIcons();
    }

    togglePass(btn) {
        const input = btn.parentElement.querySelector("input");
        const icon = btn.querySelector("svg");
        const type = input.type === "password" ? "text" : "password";
        const iconName = type === "password" ? "eye" : "eye-off";

        input.type = type;
        icon.setAttribute("data-lucide", iconName);
        if (window.lucide) window.lucide.createIcons();
    }

    validatePasswords() {
        const password = document.getElementById("password").value;
        const cpassword = document.getElementById("cpassword").value;
        const passFeedback = document.getElementById("password-feedback");
        const cpassFeedback = document.getElementById("cpassword-feedback");

        passFeedback.textContent = (password.length > 0 && password.length < 8) ? "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" : "";
        cpassFeedback.textContent = (cpassword.length > 0 && password !== cpassword) ? "รหัสผ่านไม่ตรงกัน" : "";
    }

    bindEvents() {
        document.querySelectorAll(".toggle-password").forEach(btn => {
            btn.addEventListener("click", () => this.togglePass(btn));
        });

        document.getElementById("password").addEventListener("input", this.validatePasswords.bind(this));
        document.getElementById("cpassword").addEventListener("input", this.validatePasswords.bind(this));

        document.getElementById("signupForm").addEventListener("submit", this.handleSignUp.bind(this));
        document.getElementById("google-button").addEventListener("click", this.handleGoogleSignUp.bind(this));
    }

    async handleSignUp(e) {
        e.preventDefault();
        this.validatePasswords();

        const password = document.getElementById("password").value;
        const cpassword = document.getElementById("cpassword").value;

        if (password.length < 8 || password !== cpassword) {
            return Swal.fire('ข้อมูลไม่ถูกต้อง', 'กรุณาตรวจสอบรหัสผ่าน', 'warning');
        }

        const firstname = document.getElementById("firstname").value.trim();
        const lastname = document.getElementById("lastname").value.trim();
        const email = document.getElementById("email").value.trim();

        try {
            Swal.fire({ title: 'กำลังสร้างบัญชี...', didOpen: () => Swal.showLoading() });

            await this.manager.register(firstname, lastname, email, password);

            Swal.fire({
                title: "สำเร็จ!",
                text: "สมัครสมาชิกเรียบร้อยแล้ว",
                icon: "success",
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                window.location.href = "/signIn.html";
            });

        } catch (err) {
            Swal.fire({
                title: "ไม่สำเร็จ",
                text: err.message || "เกิดข้อผิดพลาดในการสมัคร",
                icon: "error",
                confirmButtonText: 'ลองใหม่'
            });
        }
    }

    handleGoogleSignUp(e) {
        e.preventDefault();
        this.manager.loginWithGoogle();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    window.signUpPage = new SignUpPage();
});