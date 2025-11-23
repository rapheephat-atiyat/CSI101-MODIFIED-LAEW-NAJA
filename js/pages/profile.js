class ProfilePage {
    constructor() {
        this.auth = new AuthManager();
        this.userManger = UserManager;
        this.currentUser = null;
        this.init();
        if (window.lucide) window.lucide.createIcons();
    }
    async init() {
        try {
            const userProfile = await this.auth.protect();
            this.currentUser = userProfile.user;
            this.addresses = userProfile.addresses || [];
            this.renderProfileData();
            this.renderAddresses();
            this.bindEvents();
        } catch (error) { }
    }
    renderProfileData() {
        const user = this.currentUser;
        if (!user) return;
        document.getElementById('profile-image').src = user.image || 'https://via.placeholder.com/150?text=No+Image';
        document.getElementById('display-name').textContent = `${user.firstname || ''} ${user.lastname || ''}`;
        document.getElementById('display-email').textContent = user.email;
        document.getElementById('display-role').textContent = user.role;
        document.getElementById('firstname').value = user.firstname || '';
        document.getElementById('lastname').value = user.lastname || '';
        document.getElementById('email').value = user.email || '';
        document.getElementById('phone').value = user.phone || '';
        document.getElementById('birthdate').value = user.birthdate ? user.birthdate.split('T')[0] : '';
        const vendorLink = document.getElementById('vendor-register-link');
        if (user.role === 'CUSTOMER' && vendorLink) {
            vendorLink.classList.remove('hidden');
        } else if (user.role === 'VENDOR') {
            document.getElementById('vendor-profile-link').classList.remove('hidden');
        }
    }
    renderAddresses() {
        const container = document.getElementById('addresses-container');
        if (!container) return;
        if (this.addresses.length === 0) {
            container.innerHTML = `<div class="text-center py-10 text-gray-500 bg-gray-50 rounded-xl">ยังไม่มีที่อยู่สำหรับจัดส่ง</div>`;
            return;
        }
        const html = this.addresses.map(addr => `
            <div class="address-item bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <p class="font-bold text-gray-800">${addr.address1}</p>
                <p class="text-sm text-gray-600">${addr.address2 ? addr.address2 + ', ' : ''}${addr.city}, ${addr.province} ${addr.zipcode}</p>
                <p class="text-xs text-gray-400 mt-1">${addr.phone || 'ไม่ระบุเบอร์โทร'}</p>
                <div class="mt-3 space-x-2">
                    <button class="edit-address-btn px-3 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors" data-id="${addr.id}" data-addr='${JSON.stringify(addr)}'>แก้ไข</button>
                    <button class="delete-address-btn px-3 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors" data-id="${addr.id}">ลบ</button>
                </div>
            </div>
        `).join('');
        container.innerHTML = html;
        if (window.lucide) window.lucide.createIcons();
    }
    bindEvents() {
        document.getElementById('profileForm').addEventListener('submit', this.handleProfileUpdate.bind(this));
        document.getElementById('add-address-btn')?.addEventListener('click', () => this.showAddressModal());
        document.getElementById('addresses-container').addEventListener('click', (e) => {
            const editBtn = e.target.closest('.edit-address-btn');
            const deleteBtn = e.target.closest('.delete-address-btn');
            if (editBtn) {
                const addr = JSON.parse(editBtn.getAttribute('data-addr'));
                this.showAddressModal(addr);
            } else if (deleteBtn) {
                const id = deleteBtn.getAttribute('data-id');
                this.handleDeleteAddress(id);
            }
        });
    }
    async handleProfileUpdate(e) {
        e.preventDefault();
        const form = e.target;
        const payload = {
            firstname: form.firstname.value.trim(), lastname: form.lastname.value.trim(),
            phone: form.phone.value.trim(), birthdate: form.birthdate.value || null
        };
        try {
            Swal.fire({ title: 'กำลังบันทึก...', didOpen: () => Swal.showLoading() });
            await this.userManger.update(this.currentUser.id, payload);
            Swal.fire({
                icon: 'success', title: 'อัพเดทสำเร็จ!', text: 'ข้อมูลส่วนตัวถูกบันทึกเรียบร้อย',
                timer: 1500, showConfirmButton: false
            }).then(() => { this.init(); });
        } catch (error) {
            Swal.fire('อัพเดทไม่สำเร็จ', error.message, 'error');
        }
    }
    showAddressModal(address = null) {
        const isEdit = !!address;
        Swal.fire({
            title: isEdit ? 'แก้ไขที่อยู่จัดส่ง' : 'เพิ่มที่อยู่จัดส่งใหม่',
            html: `
                <form id="addressForm" class="space-y-4 text-left">
                    <input type="hidden" name="id" value="${address ? address.id : ''}">
                    <div><label class="form-label">ที่อยู่ (บรรทัด 1)*</label><input name="address1" type="text" class="form-input" value="${address ? address.address1 : ''}" required></div>
                    <div><label class="form-label">ที่อยู่ (บรรทัด 2, ซอย/หมู่บ้าน)</label><input name="address2" type="text" class="form-input" value="${address ? address.address2 || '' : ''}"></div>
                    <div class="grid grid-cols-2 gap-4">
                        <div><label class="form-label">จังหวัด*</label><input name="province" type="text" class="form-input" value="${address ? address.province : ''}" required></div>
                        <div><label class="form-label">เขต/อำเภอ*</label><input name="city" type="text" class="form-input" value="${address ? address.city : ''}" required></div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div><label class="form-label">รหัสไปรษณีย์*</label><input name="zipcode" type="text" class="form-input" value="${address ? address.zipcode : ''}" required></div>
                        <div><label class="form-label">เบอร์โทรศัพท์</label><input name="phone" type="tel" class="form-input" value="${address ? address.phone || '' : ''}"></div>
                    </div>
                </form>
            `,
            focusConfirm: false, showCancelButton: true, confirmButtonText: isEdit ? 'บันทึกการแก้ไข' : 'เพิ่มที่อยู่',
            cancelButtonText: 'ยกเลิก',
            preConfirm: () => {
                const form = document.getElementById('addressForm');
                const fields = ['address1', 'city', 'province', 'zipcode'];
                for (const field of fields) {
                    if (!form[field].value.trim()) {
                        Swal.showValidationMessage(`กรุณากรอก ${form[field].previousElementSibling.textContent.replace('*', '')}`);
                        return false;
                    }
                }
                return {
                    id: form.id.value, address1: form.address1.value.trim(), address2: form.address2.value.trim(),
                    city: form.city.value.trim(), province: form.province.value.trim(), zipcode: form.zipcode.value.trim(),
                    phone: form.phone.value.trim()
                };
            }
        }).then(async (result) => {
            if (result.isConfirmed) { await this.handleAddressUpdate(result.value); }
        });
    }
    async handleAddressUpdate(payload) {
        const id = payload.id; delete payload.id;
        try {
            Swal.fire({ title: 'กำลังบันทึก...', didOpen: () => Swal.showLoading() });
            if (id) { await this.userManger.updateAddress(id, payload); }
            else { throw new Error("ฟังก์ชันการเพิ่มที่อยู่ใหม่ยังไม่เปิดใช้งาน"); }
            Swal.fire({
                icon: 'success', title: 'บันทึกสำเร็จ!', text: 'ที่อยู่ถูกบันทึกเรียบร้อย',
                timer: 1500, showConfirmButton: false
            }).then(() => { this.init(); });
        } catch (error) {
            Swal.fire('บันทึกไม่สำเร็จ', error.message, 'error');
        }
    }
    async handleDeleteAddress(id) {
        const result = await Swal.fire({
            title: 'ยืนยันการลบที่อยู่?', text: "ที่อยู่สำหรับจัดส่งจะถูกลบอย่างถาวร", icon: 'warning', showCancelButton: true,
            confirmButtonColor: '#ef4444', cancelButtonColor: '#6b7280', confirmButtonText: 'ใช่, ลบเลย!'
        });
        if (result.isConfirmed) {
            try {
                Swal.fire({ title: 'กำลังลบ...', didOpen: () => Swal.showLoading() });
                await this.userManger.deleteAddress(id);
                Swal.fire('ลบสำเร็จ', 'ที่อยู่ถูกลบเรียบร้อย', 'success');
                this.init();
            } catch (error) {
                Swal.fire('ลบไม่สำเร็จ', error.message, 'error');
            }
        }
    }
}
document.addEventListener("DOMContentLoaded", () => {
    if (typeof AuthManager !== 'undefined' && typeof UserManager !== 'undefined') {
        window.profilePage = new ProfilePage();
    } else {
        console.error("Dependencies (AuthManager/UserManager) not loaded.");
    }
});