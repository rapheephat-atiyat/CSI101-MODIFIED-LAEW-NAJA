class VendorRegisterPage {
    constructor() {
        this.currentUser = null;

        // Assume services are available globally
        this.auth = typeof AuthManager !== 'undefined' ? new AuthManager() : null;
        this.vendorManager = typeof VendorManager !== 'undefined' ? VendorManager : null;

        this.elements = {
            vendorForm: document.getElementById("vendorForm"),
            vFirstname: document.getElementById('v-firstname'),
            vLastname: document.getElementById('v-lastname'),
            vNationalId: document.getElementById('v-nationalId'),
            vPhone: document.getElementById('v-phone'),
            vHome: document.getElementById('v-home'),
            vCity: document.getElementById('v-city'),
            vDistrict: document.getElementById('v-district'),
            vSubdistrict: document.getElementById('v-subdistrict'),
        };

        document.addEventListener("DOMContentLoaded", () => this.init());
    }

    async init() {
        if (typeof lucide !== 'undefined') { lucide.createIcons(); }
        await this.checkAccessAndPopulate();

        // Note: The submit event is handled via inline HTML: onsubmit="vendorRegisterPage.handleRegistration(event)"
    }

    async checkAccessAndPopulate() {
        if (!this.auth || !this.vendorManager) {
            this.showError("ไม่สามารถโหลดไฟล์บริการหลักได้ (AuthManager/VendorManager missing).");
            return;
        }

        try {
            const user = await this.auth.protect();
            this.currentUser = user;

            // 1. Check existing vendor status
            const statusResult = await this.vendorManager.getRequestStatus();
            const status = statusResult.data.status;

            if (status === 'PENDING') {
                Swal.fire({
                    icon: 'warning',
                    title: 'คำขออยู่ระหว่างดำเนินการ',
                    text: 'คุณมีคำขอเป็นผู้หิ้วที่กำลังรอการอนุมัติอยู่แล้ว กรุณาตรวจสอบสถานะในหน้าโปรไฟล์',
                    confirmButtonText: 'ไปหน้าโปรไฟล์',
                    confirmButtonColor: '#9333ea'
                }).then(() => {
                    window.location.href = '/profile.html';
                });
                return;
            } else if (status === 'APPROVED') {
                Swal.fire({
                    icon: 'info',
                    title: 'คุณเป็นผู้หิ้วแล้ว',
                    text: 'ระบบตรวจพบว่าคุณมีสถานะผู้หิ้วเรียบร้อยแล้ว กำลังพาคุณไปยังหน้าโปรไฟล์...',
                    confirmButtonText: 'ไปหน้าโปรไฟล์',
                    confirmButtonColor: '#9333ea'
                }).then(() => {
                    window.location.href = '/profile.html';
                });
                return;
            }

            // 2. Populate user profile data (read-only fields)
            this.elements.vFirstname.value = user.firstname || '';
            this.elements.vLastname.value = user.lastname || '';
            this.elements.vNationalId.value = user.personalData?.nationalId || '';
            this.elements.vPhone.value = user.personalData?.phone || '';

            // 3. Populate address data (editable fields, assumes first address)
            if (user.addresses && user.addresses.length > 0) {
                const addr = user.addresses[0];
                this.elements.vHome.value = addr.homeNumero || '';
                this.elements.vCity.value = addr.city || '';
                this.elements.vDistrict.value = addr.district || '';
                this.elements.vSubdistrict.value = addr.subdistrict || '';
            }

        } catch (e) {
            // Error when protecting route (not logged in) or API failure
            console.error("Vendor registration access failed:", e);
        }
    }

    async handleRegistration(e) {
        e.preventDefault();

        if (!this.currentUser || !this.vendorManager) {
            Swal.fire('ข้อผิดพลาด', 'ข้อมูลผู้ใช้ไม่พร้อมใช้งาน', 'error');
            return;
        }

        const formData = new FormData(e.target);

        const payload = {
            shopName: formData.get("shopName"),
            shopDetail: formData.get("shopDetail"),

            // Personal data copied from profile (read-only inputs)
            firstname: this.elements.vFirstname.value,
            lastname: this.elements.vLastname.value,
            nationalId: this.elements.vNationalId.value,
            phone: this.elements.vPhone.value,

            // Address data from form
            address: {
                homeNumero: formData.get("homeNumero"),
                city: formData.get("city"),
                district: formData.get("district"),
                subdistrict: formData.get("subdistrict")
            }
        };

        try {
            Swal.fire({
                title: 'กำลังส่งใบสมัคร...',
                text: 'กรุณารอสักครู่',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });

            await this.vendorManager.register(payload);

            Swal.fire({
                icon: 'success',
                title: 'ส่งคำขอสำเร็จ!',
                text: 'ระบบได้รับข้อมูลเรียบร้อยแล้ว โปรดรอการตรวจสอบสถานะ',
                confirmButtonText: 'กลับไปหน้าโปรไฟล์',
                confirmButtonColor: '#9333ea'
            }).then(() => {
                window.location.href = '/profile.html';
            });
        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "ส่งข้อมูลไม่สำเร็จ",
                text: err.message
            });
        }
    }

    showError(message) {
        Swal.fire({
            icon: 'error',
            title: 'ข้อผิดพลาด',
            text: message,
            confirmButtonText: 'ตกลง'
        });
    }
}

const vendorRegisterPage = new VendorRegisterPage();
window.vendorRegisterPage = vendorRegisterPage;