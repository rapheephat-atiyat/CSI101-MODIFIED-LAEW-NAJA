class DashboardPage {
    constructor() {
        this.auth = new AuthManager();
        this.currentUser = null;
        this.init();
        if (window.lucide) window.lucide.createIcons();
    }
    async init() {
        try {
            this.currentUser = await this.auth.protect(['ADMIN', 'VENDOR']);
            this.renderDashboard();
            this.loadData();
        } catch (error) { /* อย่ามาแหกเก๋อร์แถวนี้ไม่ชอบ 😏😏 */ }
    }
    renderDashboard() {
        document.getElementById('user-role').textContent = this.currentUser.role === 'ADMIN' ? 'ผู้ดูแลระบบ' : 'ผู้ขายสินค้า';
        document.getElementById('welcome-message').textContent = `ยินดีต้อนรับ, ${this.currentUser.firstname}`;
        const adminSection = document.getElementById('admin-section');
        const vendorSection = document.getElementById('vendor-section');
        if (this.currentUser.role === 'ADMIN') {
            adminSection.classList.remove('hidden');
            vendorSection.classList.add('hidden');
        } else if (this.currentUser.role === 'VENDOR') {
            adminSection.classList.add('hidden');
            vendorSection.classList.remove('hidden');
        }
    }
    async loadData() {
        if (this.currentUser.role === 'ADMIN') { await this.loadAdminData(); }
        else if (this.currentUser.role === 'VENDOR') { await this.loadVendorData(); }
        if (window.lucide) window.lucide.createIcons();
    }
    async loadAdminData() {
        await this.loadVendorRequests();
        await this.loadUserManagement();
    }
    async loadVendorRequests() {
        const container = document.getElementById('vendor-requests-list');
        container.innerHTML = this.getLoadingHTML('กำลังโหลดคำขอ...');
        try {
            const response = await AdminManager.getVendorRequests();
            if (response.data.length === 0) {
                container.innerHTML = `<p class="text-center text-gray-500 py-10">ไม่พบคำขอเป็นผู้ขาย</p>`;
                return;
            }
            const html = response.data.map(req => `
                <div class="flex items-center justify-between p-4 bg-white border-b border-gray-100 last:border-b-0">
                    <div>
                        <p class="font-semibold">${req.shopName}</p>
                        <p class="text-sm text-gray-600">${req.user.email} | ID: ${req.user.id}</p>
                        <p class="text-xs text-gray-400 mt-1">สมัครเมื่อ: ${window.formatDate(req.createdAt)}</p>
                    </div>
                    <div class="space-x-2 flex items-center">
                        <button class="approve-btn px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors" data-id="${req.id}" data-action="APPROVE">อนุมัติ</button>
                        <button class="reject-btn px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors" data-id="${req.id}" data-action="REJECT">ปฏิเสธ</button>
                    </div>
                </div>
            `).join('');
            container.innerHTML = html;
            this.bindAdminEvents();
        } catch (error) {
            container.innerHTML = `<p class="text-center text-red-500 py-10">เกิดข้อผิดพลาดในการโหลดคำขอ: ${error.message}</p>`;
        }
    }
    async loadUserManagement() {
        const container = document.getElementById('user-management-list');
        container.innerHTML = this.getLoadingHTML('กำลังโหลดรายชื่อผู้ใช้...');
        try {
            const response = await AdminManager.getUsers();
            if (response.data.length === 0) {
                container.innerHTML = `<p class="text-center text-gray-500 py-10">ไม่พบผู้ใช้ในระบบ</p>`;
                return;
            }
            const html = response.data.map(user => `
                <div class="flex items-center justify-between p-4 bg-white border-b border-gray-100 last:border-b-0">
                    <div>
                        <p class="font-semibold">${user.firstname} ${user.lastname}</p>
                        <p class="text-sm text-gray-600">${user.email}</p>
                        <p class="text-xs font-bold text-blue-600 mt-1">Role: ${user.role}</p>
                    </div>
                    <div class="space-x-2 flex items-center">
                        <select class="role-select px-3 py-2 border rounded-lg text-sm" data-id="${user.id}" data-current-role="${user.role}">
                            <option value="CUSTOMER" ${user.role === 'CUSTOMER' ? 'selected' : ''}>CUSTOMER</option>
                            <option value="VENDOR" ${user.role === 'VENDOR' ? 'selected' : ''}>VENDOR</option>
                            <option value="ADMIN" ${user.role === 'ADMIN' ? 'selected' : ''}>ADMIN</option>
                        </select>
                        <button class="delete-user-btn p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" data-id="${user.id}">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            `).join('');
            container.innerHTML = html;
            this.bindAdminEvents();
            if (window.lucide) window.lucide.createIcons();
        } catch (error) {
            container.innerHTML = `<p class="text-center text-red-500 py-10">เกิดข้อผิดพลาดในการโหลดผู้ใช้: ${error.message}</p>`;
        }
    }
    bindAdminEvents() {
        document.querySelectorAll('.approve-btn, .reject-btn').forEach(btn => {
            btn.addEventListener('click', this.handleVendorRequestAction.bind(this));
        });
        document.querySelectorAll('.role-select').forEach(select => {
            select.addEventListener('change', this.handleUpdateUserRole.bind(this));
        });
        document.querySelectorAll('.delete-user-btn').forEach(btn => {
            btn.addEventListener('click', this.handleDeleteUser.bind(this));
        });
    }
    async handleVendorRequestAction(e) {
        const id = e.target.getAttribute('data-id');
        const action = e.target.getAttribute('data-action');
        const actionText = action === 'APPROVE' ? 'อนุมัติ' : 'ปฏิเสธ';
        const result = await Swal.fire({
            title: `ยืนยันการ${actionText}?`, text: `ต้องการ${actionText}คำขอเป็นผู้ขาย ID: ${id} ใช่หรือไม่?`, icon: 'warning', showCancelButton: true,
            confirmButtonColor: action === 'APPROVE' ? '#10b981' : '#ef4444', cancelButtonColor: '#6b7280', confirmButtonText: `ใช่, ${actionText}`
        });
        if (result.isConfirmed) {
            try {
                Swal.fire({ title: `กำลังดำเนินการ...`, didOpen: () => Swal.showLoading() });
                await AdminManager.updateVendorRequestStatus(id, action);
                Swal.fire('สำเร็จ', `คำขอถูก${actionText}เรียบร้อย`, 'success');
                await this.loadVendorRequests();
            } catch (error) {
                Swal.fire('ไม่สำเร็จ', error.message, 'error');
            }
        }
    }
    async handleUpdateUserRole(e) {
        const id = e.target.getAttribute('data-id');
        const oldRole = e.target.getAttribute('data-current-role');
        const newRole = e.target.value;
        if (oldRole === newRole) return;
        const result = await Swal.fire({
            title: 'เปลี่ยนบทบาทผู้ใช้?', text: `ต้องการเปลี่ยนบทบาทของ ID: ${id} จาก ${oldRole} เป็น ${newRole} ใช่หรือไม่?`,
            icon: 'warning', showCancelButton: true, confirmButtonColor: '#2563eb', cancelButtonColor: '#6b7280', confirmButtonText: 'ใช่, เปลี่ยน!'
        });
        if (result.isConfirmed) {
            try {
                Swal.fire({ title: `กำลังดำเนินการ...`, didOpen: () => Swal.showLoading() });
                await AdminManager.updateUserRole(id, newRole);
                Swal.fire('สำเร็จ', 'เปลี่ยนบทบาทเรียบร้อย', 'success');
                e.target.setAttribute('data-current-role', newRole);
            } catch (error) {
                Swal.fire('ไม่สำเร็จ', error.message, 'error');
                e.target.value = oldRole;
            }
        } else {
            e.target.value = oldRole;
        }
    }
    async handleDeleteUser(e) {
        const id = e.target.closest('.delete-user-btn').getAttribute('data-id');
        const result = await Swal.fire({
            title: 'ยืนยันการลบผู้ใช้?', text: `ข้อมูลผู้ใช้ ID: ${id} จะถูกลบอย่างถาวร`, icon: 'error', showCancelButton: true,
            confirmButtonColor: '#ef4444', cancelButtonColor: '#6b7280', confirmButtonText: 'ใช่, ลบเลย!'
        });
        if (result.isConfirmed) {
            try {
                Swal.fire({ title: `กำลังลบ...`, didOpen: () => Swal.showLoading() });
                await AdminManager.deleteUser(id);
                Swal.fire('สำเร็จ', 'ผู้ใช้ถูกลบเรียบร้อย', 'success');
                await this.loadUserManagement();
            } catch (error) {
                Swal.fire('ไม่สำเร็จ', error.message, 'error');
            }
        }
    }
    async loadVendorData() {
        this.vendorId = this.currentUser.vendorProfile?.id;
        if (!this.vendorId) {
            document.getElementById('vendor-section').innerHTML = `<p class="text-center py-20 text-red-500">ไม่พบโปรไฟล์ร้านค้า กรุณาลงทะเบียนเป็นผู้ขายก่อน</p>`;
            return;
        }
        await this.loadVendorRequestsStatus();
        await this.loadVendorProducts();
        this.bindVendorEvents();
    }
    async loadVendorRequestsStatus() {
        const container = document.getElementById('vendor-status-box');
        try {
            const response = await VendorManager.getRequestStatus();
            let statusText = 'ยังไม่ลงทะเบียนเป็นผู้ขาย';
            let statusColor = 'bg-gray-200 text-gray-700';
            if (response.data.status === 'PENDING') { statusText = 'รอการอนุมัติ'; statusColor = 'bg-yellow-100 text-yellow-700'; }
            else if (response.data.status === 'APPROVED') { statusText = 'อนุมัติแล้ว (เป็นผู้ขาย)'; statusColor = 'bg-green-100 text-green-700'; }
            else if (response.data.status === 'REJECTED') { statusText = 'ถูกปฏิเสธ'; statusColor = 'bg-red-100 text-red-700'; }
            else if (response.data.status === 'NOT_APPLIED') { statusText = 'ยังไม่ได้ส่งคำขอ'; statusColor = 'bg-gray-100 text-gray-500'; }
            container.innerHTML = `สถานะการเป็นผู้ขาย: <span class="font-bold px-3 py-1 rounded-full ${statusColor}">${statusText}</span>`;
        } catch (error) {
            container.innerHTML = `สถานะการเป็นผู้ขาย: <span class="font-bold px-3 py-1 rounded-full bg-red-100 text-red-700">ข้อผิดพลาด</span>`;
        }
    }
    async loadVendorProducts() {
        const container = document.getElementById('vendor-products-list');
        container.innerHTML = this.getLoadingHTML('กำลังโหลดสินค้า...');
        try {
            const profileData = await VendorProfileManager.getShopProfile(this.vendorId);
            const products = profileData.products;
            if (products.length === 0) {
                container.innerHTML = `<p class="text-center text-gray-500 py-10">คุณยังไม่มีสินค้า</p>`;
                return;
            }
            const html = products.map(item => `
                <div class="flex items-center justify-between p-4 bg-white border-b border-gray-100 last:border-b-0">
                    <div>
                        <p class="font-semibold">${item.product.name}</p>
                        <p class="text-sm text-gray-600">ราคา: ${window.formatCurrency(item.price)} | สต็อก: ${item.stock}</p>
                    </div>
                    <div class="space-x-2 flex items-center">
                        <button class="edit-product-btn px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors" data-id="${item.productId}">แก้ไข</button>
                        <button class="delete-product-btn px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors" data-id="${item.productId}">ลบ</button>
                    </div>
                </div>
            `).join('');
            container.innerHTML = html;
            this.bindVendorEvents();
        } catch (error) {
            container.innerHTML = `<p class="text-center text-red-500 py-10">เกิดข้อผิดพลาดในการโหลดสินค้า: ${error.message}</p>`;
        }
    }
    bindVendorEvents() {
        document.getElementById('add-product-btn')?.addEventListener('click', this.handleAddProduct.bind(this));
        document.querySelectorAll('.edit-product-btn').forEach(btn => { btn.addEventListener('click', this.handleEditProduct.bind(this)); });
        document.querySelectorAll('.delete-product-btn').forEach(btn => { btn.addEventListener('click', this.handleDeleteProduct.bind(this)); });
        document.getElementById('view-shop-btn')?.addEventListener('click', () => { window.location.href = `/shop.html?id=${this.vendorId}`; });
        document.getElementById('view-requests-btn')?.addEventListener('click', this.handleViewRequests.bind(this));
    }
    handleAddProduct() { Swal.fire('เพิ่มสินค้า', 'ฟังก์ชันการเพิ่มสินค้ากำลังถูกพัฒนา', 'info'); }
    handleEditProduct(e) { const productId = e.target.getAttribute('data-id'); Swal.fire('แก้ไขสินค้า', `ฟังก์ชันการแก้ไขสินค้า ID: ${productId} กำลังถูกพัฒนา`, 'info'); }
    async handleDeleteProduct(e) {
        const productId = e.target.getAttribute('data-id');
        const result = await Swal.fire({
            title: 'ยืนยันการลบสินค้า?', text: `ต้องการลบสินค้า ID: ${productId} ใช่หรือไม่?`, icon: 'warning', showCancelButton: true,
            confirmButtonColor: '#ef4444', cancelButtonColor: '#6b7280', confirmButtonText: 'ใช่, ลบเลย!'
        });
        if (result.isConfirmed) {
            try {
                Swal.fire({ title: `กำลังลบ...`, didOpen: () => Swal.showLoading() });
                await ProductManager.deleteProduct(productId);
                Swal.fire('สำเร็จ', 'สินค้าถูกลบเรียบร้อย', 'success');
                await this.loadVendorProducts();
                document.querySelector('navbar-eiei')?.refreshCart();
            } catch (error) {
                Swal.fire('ไม่สำเร็จ', error.message, 'error');
            }
        }
    }
    handleViewRequests() { Swal.fire('คำขอจากลูกค้า', 'ฟังก์ชันการดูคำขอฝากหิ้วสินค้ากำลังถูกพัฒนา', 'info'); }
    getLoadingHTML(message) {
        return `<div class="text-center py-10 text-blue-600">
            <i data-lucide="loader-circle" class="w-8 h-8 mx-auto animate-spin"></i>
            <p class="mt-2">${message}</p>
        </div>`;
    }
}
document.addEventListener("DOMContentLoaded", () => {
    if (typeof AuthManager !== 'undefined' && typeof AdminManager !== 'undefined' && typeof VendorManager !== 'undefined') {
        window.dashboardPage = new DashboardPage();
    } else {
        console.error("Dependencies not loaded.");
    }
});