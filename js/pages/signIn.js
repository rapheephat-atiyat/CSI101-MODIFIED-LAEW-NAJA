class SignInPage {
    constructor(authManager) {
        this.manager = authManager;
        this.bindEvents();
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

async function initSignInPage() {
    const manager = new AuthManager();
    const signinContainer = document.getElementById('signin-container');

    if (manager.isLoggedIn()) {
        try {
            await manager.getProfile();
            window.location.href = "/";
            return;
        } catch (e) { }
    }

    window.signInPage = new SignInPage(manager);

    if (signinContainer) {
        signinContainer.classList.remove('hidden');
    }

    if (window.lucide) window.lucide.createIcons();
}

document.addEventListener("DOMContentLoaded", initSignInPage);