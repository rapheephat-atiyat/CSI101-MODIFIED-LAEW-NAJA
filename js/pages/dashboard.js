class AdminDashboardManager {
    constructor() {
        this.ROLES = ['CUSTOMER', 'VENDOR', 'ADMIN'];
        this.currentUser = null;
        this.allVendorRequests = [];
        this.allUsers = [];

        this.elements = {
            pendingCount: document.getElementById('pending-count'),
            vendorTabContent: document.getElementById('vendor-tab'),
            userTabContent: document.getElementById('user-tab'),
            tabButtons: document.querySelectorAll('.tab-button'),
            
            requestsLoading: document.getElementById('requests-loading'),
            requestsList: document.getElementById('requests-list'),
            requestsEmpty: document.getElementById('requests-empty'),
            requestsTbody: document.getElementById('requests-tbody'),
            vendorSearch: document.getElementById('vendor-search'),
            vendorStatusFilter: document.getElementById('vendor-status-filter'),

            usersLoading: document.getElementById('users-loading'),
            usersList: document.getElementById('users-list'),
            usersEmpty: document.getElementById('users-empty'),
            usersTbody: document.getElementById('users-tbody'),
            userSearch: document.getElementById('user-search'),
            userRoleFilter: document.getElementById('user-role-filter'),
        };

        this.auth = new AuthManager(); 
    }

    async init() {
        if (typeof lucide !== 'undefined') { lucide.createIcons(); }

        this.currentUser = await this.checkAdminAccess();
        if (!this.currentUser) return;

        this.setupTabSwitching();
        this.setupFilterListeners();
        this.setupActionDelegation();
        
        await this.loadTabData('vendor');
    }

    async checkAdminAccess() {
        try {
            const user = await this.auth.protect();
            if (user.role !== 'ADMIN') {
                Swal.fire({
                    icon: 'error',
                    title: 'ไม่อนุญาต',
                    text: 'หน้านี้สำหรับผู้ดูแลระบบเท่านั้น',
                    confirmButtonText: 'กลับสู่หน้าหลัก'
                }).then(() => {
                    window.location.href = '/';
                });
                return null;
            }
            return user;
        } catch (e) {
            return null;
        }
    }

    setupTabSwitching() {
        this.elements.tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.setActiveTab(button.dataset.tab);
            });
        });
    }

    async loadTabData(tabName) {
        this.elements.vendorTabContent.classList.add('hidden');
        this.elements.userTabContent.classList.add('hidden');

        if (tabName === 'vendor') {
            this.elements.vendorTabContent.classList.remove('hidden');
            await this.fetchAndRenderVendorRequests();
        } else if (tabName === 'user') {
            this.elements.userTabContent.classList.remove('hidden');
            await this.fetchAndRenderUsers();
        }
    }

    setActiveTab(tabName) {
        this.elements.tabButtons.forEach(btn => {
            btn.classList.remove('border-red-500', 'text-red-600');
            btn.classList.add('border-transparent', 'text-gray-600', 'hover:border-gray-300');

            if (btn.dataset.tab === tabName) {
                btn.classList.add('border-red-500', 'text-red-600');
                btn.classList.remove('border-transparent', 'text-gray-600', 'hover:border-gray-300');
            }
        });
        this.loadTabData(tabName);
    }
    
    setupFilterListeners() {
        this.elements.vendorSearch.addEventListener('input', () => this.filterVendorRequests());
        this.elements.vendorStatusFilter.addEventListener('change', () => this.filterVendorRequests());

        this.elements.userSearch.addEventListener('input', () => this.filterUsers());
        this.elements.userRoleFilter.addEventListener('change', () => this.filterUsers());
    }

    setupActionDelegation() {
        this.elements.requestsTbody.addEventListener('click', (e) => this.handleVendorRequestActions(e));
        
        this.elements.usersTbody.addEventListener('click', (e) => this.handleUserActions(e));
        this.elements.usersTbody.addEventListener('change', (e) => this.handleUserRoleChange(e));
    }


    async fetchAndRenderVendorRequests() {
        this.elements.requestsLoading.classList.remove('hidden');
        this.elements.requestsList.classList.add('hidden');
        this.elements.requestsEmpty.classList.add('hidden');

        try {
            const response = await AdminManager.getVendorRequests();
            this.allVendorRequests = response.data || [];
            this.filterVendorRequests();
        } catch (error) {
            Swal.fire('ข้อผิดพลาด', error.message || 'ไม่สามารถโหลดข้อมูลคำขอได้', 'error');
            this.elements.requestsEmpty.classList.remove('hidden');
        } finally {
            this.elements.requestsLoading.classList.add('hidden');
        }
    }

    filterVendorRequests() {
        const searchTerm = this.elements.vendorSearch.value.toLowerCase();
        const statusFilter = this.elements.vendorStatusFilter.value;

        const filtered = this.allVendorRequests.filter(req => {
            const matchesSearch = req.shopName.toLowerCase().includes(searchTerm) ||
                req.user.email.toLowerCase().includes(searchTerm) ||
                (req.user.firstname && req.user.firstname.toLowerCase().includes(searchTerm)) ||
                (req.user.lastname && req.user.lastname.toLowerCase().includes(searchTerm));

            const matchesStatus = !statusFilter || req.status === statusFilter;

            return matchesSearch && matchesStatus;
        });

        this.renderVendorRequests(filtered);
    }

    renderVendorRequests(requests) {
        const tbody = this.elements.requestsTbody;
        tbody.innerHTML = '';

        if (requests.length === 0) {
            this.elements.requestsList.classList.add('hidden');
            this.elements.requestsEmpty.classList.remove('hidden');
            this.elements.pendingCount.textContent = '0 คำขอรอดำเนินการ';
            return;
        }

        let pendingCount = 0;

        requests.forEach(req => {
            const isPending = req.status === 'PENDING';
            if (isPending) pendingCount++;

            const statusClass = `py-1 px-3 inline-flex text-xs leading-5 rounded-full ${req.status === 'PENDING' ? 'bg-amber-50 text-amber-600' :
                    req.status === 'APPROVED' ? 'bg-green-50 text-green-600' :
                        'bg-red-50 text-red-600'
                } font-medium`;

            const name = req.user.firstname || req.user.lastname ?
                `${req.user.firstname || ''} ${req.user.lastname || ''}`.trim() :
                req.user.email;

            const date = new Date(req.createdAt).toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            const row = `
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3 text-sm font-medium text-gray-900">${req.shopName}</td>
                    <td class="px-4 py-3 text-sm text-gray-500">
                        <div>${name}</div>
                        <div class="text-xs text-gray-400">${req.user.email}</div>
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-500">${date}</td>
                    <td class="px-4 py-3">
                        <span class="${statusClass}">${req.status}</span>
                    </td>
                    <td class="px-4 py-3 text-sm font-medium">
                        <div class="flex items-center gap-2">
                            <button data-id="${req.id}" class="btn-view text-blue-600 hover:bg-blue-100 p-1.5 rounded-lg transition" title="ดูรายละเอียด">
                                <i data-lucide="eye" class="w-5 h-5"></i>
                            </button>
                            ${isPending ? `
                                <button data-id="${req.id}" data-action="approve" class="btn-action text-green-600 hover:bg-green-100 p-1.5 rounded-lg transition" title="อนุมัติ">
                                    <i data-lucide="check" class="w-5 h-5"></i>
                                </button>
                                <button data-id="${req.id}" data-action="reject" class="btn-action text-red-600 hover:bg-red-100 p-1.5 rounded-lg transition" title="ปฏิเสธ">
                                    <i data-lucide="x" class="w-5 h-5"></i>
                                </button>
                            ` : `
                                <button data-id="${req.id}" class="btn-edit-status text-purple-600 hover:bg-purple-100 p-1.5 rounded-lg transition" title="แก้ไขสถานะ">
                                    <i data-lucide="edit" class="w-5 h-5"></i>
                                </button>
                            `}
                        </div>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });

        this.elements.pendingCount.textContent = `${pendingCount} คำขอรอดำเนินการ`;
        this.elements.requestsList.classList.remove('hidden');
        this.elements.requestsEmpty.classList.add('hidden');
        if (typeof lucide !== 'undefined') { lucide.createIcons(); }
    }

    handleVendorRequestActions(e) {
        const viewBtn = e.target.closest('.btn-view');
        if (viewBtn) {
            this.showVendorRequestDetail(viewBtn.dataset.id);
            return;
        }

        const editStatusBtn = e.target.closest('.btn-edit-status');
        if (editStatusBtn) {
            this.showEditStatusModal(editStatusBtn.dataset.id);
            return;
        }

        const actionBtn = e.target.closest('.btn-action');
        if (actionBtn) {
            this.handleVendorRequestAction(actionBtn.dataset.id, actionBtn.dataset.action);
        }
    }

    async handleVendorRequestAction(requestId, action) {
        const statusText = action === 'approve' ? 'อนุมัติ' : 'ปฏิเสธ';
        const actionColor = action === 'approve' ? '#10b981' : '#ef4444';

        const result = await Swal.fire({
            title: `ยืนยันการ${statusText}?`,
            text: `คุณต้องการ${statusText}คำขอเป็นผู้หิ้วนี้หรือไม่?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: actionColor,
            confirmButtonText: `ใช่, ${statusText}เลย`,
            cancelButtonText: 'ยกเลิก'
        });

        if (result.isConfirmed) {
            try {
                Swal.fire({ title: 'กำลังดำเนินการ...', didOpen: () => Swal.showLoading() });
                await AdminManager.updateVendorRequestStatus(requestId, action);
                Swal.fire('สำเร็จ', `ดำเนินการ${statusText}คำขอเรียบร้อยแล้ว`, 'success')
                    .then(() => this.fetchAndRenderVendorRequests());
            } catch (error) {
                Swal.fire('ข้อผิดพลาด', error.message || `ไม่สามารถ${statusText}คำขอได้`, 'error');
            }
        }
    }

    showVendorRequestDetail(requestId) {
        const req = this.allVendorRequests.find(r => r.id === requestId);
        if (!req) return;

        const name = req.user.firstname || req.user.lastname ?
            `${req.user.firstname || ''} ${req.user.lastname || ''}`.trim() :
            'ไม่ระบุ';

        const statusBadge = req.status === 'PENDING' ?
            '<span class="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-medium">รอดำเนินการ</span>' :
            req.status === 'APPROVED' ?
                '<span class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">อนุมัติแล้ว</span>' :
                '<span class="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">ปฏิเสธแล้ว</span>';

        Swal.fire({
            title: 'รายละเอียดคำขอเป็นผู้หิ้ว',
            html: `
                <div class="text-left space-y-4">
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h3 class="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <i data-lucide="store" class="w-4 h-4"></i> ข้อมูลร้านค้า
                        </h3>
                        <p><span class="font-medium">ชื่อร้าน:</span> ${req.shopName}</p>
                        <p><span class="font-medium">รายละเอียด:</span> ${req.shopDetail || 'ไม่ระบุ'}</p>
                    </div>
                    
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h3 class="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <i data-lucide="user" class="w-4 h-4"></i> ข้อมูลผู้สมัคร
                        </h3>
                        <p><span class="font-medium">ชื่อ:</span> ${name}</p>
                        <p><span class="font-medium">อีเมล:</span> ${req.user.email}</p>
                        <p><span class="font-medium">Role ปัจจุบัน:</span> <span class="text-blue-600 font-medium">${req.user.role}</span></p>
                    </div>
                    
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h3 class="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <i data-lucide="info" class="w-4 h-4"></i> สถานะ
                        </h3>
                        <p class="mb-2">${statusBadge}</p>
                        <p class="text-sm text-gray-600">
                            <span class="font-medium">วันที่ขอ:</span> 
                            ${new Date(req.createdAt).toLocaleString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}
                        </p>
                        <p class="text-sm text-gray-600">
                            <span class="font-medium">อัปเดตล่าสุด:</span> 
                            ${new Date(req.updatedAt).toLocaleString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}
                        </p>
                    </div>
                </div>
            `,
            width: '600px',
            confirmButtonText: 'ปิด',
            confirmButtonColor: '#dc2626',
            didOpen: () => {
                if (typeof lucide !== 'undefined') { lucide.createIcons(); }
            }
        });
    }

    showEditStatusModal(requestId) {
        const req = this.allVendorRequests.find(r => r.id === requestId);
        if (!req) return;

        const statusOptions = {
            'PENDING': { text: 'รอดำเนินการ', color: '#f59e0b', action: 'pending' },
            'APPROVED': { text: 'อนุมัติแล้ว', color: '#10b981', action: 'approve' },
            'REJECTED': { text: 'ปฏิเสธแล้ว', color: '#ef4444', action: 'reject' }
        };

        const inputOptions = {};
        for (const [key, value] of Object.entries(statusOptions)) {
            inputOptions[value.action] = value.text;
        }

        Swal.fire({
            title: 'แก้ไขสถานะคำขอ',
            html: `
                <div class="text-left mb-4">
                    <p class="text-sm text-gray-600 mb-2">
                        <span class="font-medium">ร้านค้า:</span> ${req.shopName}
                    </p>
                    <p class="text-sm text-gray-600">
                        <span class="font-medium">สถานะปัจจุบัน:</span> 
                        <span class="font-semibold" style="color: ${statusOptions[req.status].color}">${statusOptions[req.status].text}</span>
                    </p>
                </div>
            `,
            input: 'select',
            inputOptions: inputOptions,
            inputPlaceholder: 'เลือกสถานะใหม่',
            showCancelButton: true,
            confirmButtonText: 'บันทึก',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#dc2626',
            inputValidator: (value) => {
                if (!value) {
                    return 'กรุณาเลือกสถานะ!';
                }
            }
        }).then(async (result) => {
            if (result.isConfirmed && result.value) {
                const action = result.value;
                const newStatus = action === 'approve' ? 'APPROVED' : action === 'reject' ? 'REJECTED' : 'PENDING';

                if (req.status === newStatus) {
                    Swal.fire('แจ้งเตือน', 'สถานะเดิมและใหม่เหมือนกัน ไม่มีการเปลี่ยนแปลง', 'info');
                    return;
                }

                try {
                    Swal.fire({ title: 'กำลังบันทึก...', didOpen: () => Swal.showLoading() });
                    await AdminManager.updateVendorRequestStatus(requestId, action);
                    Swal.fire('สำเร็จ', `เปลี่ยนสถานะเป็น ${statusOptions[newStatus].text} เรียบร้อยแล้ว`, 'success')
                        .then(() => this.fetchAndRenderVendorRequests());
                } catch (error) {
                    Swal.fire('ข้อผิดพลาด', error.message || 'ไม่สามารถเปลี่ยนสถานะได้', 'error');
                }
            }
        });
    }


    async fetchAndRenderUsers() {
        this.elements.usersLoading.classList.remove('hidden');
        this.elements.usersList.classList.add('hidden');
        this.elements.usersEmpty.classList.add('hidden');
        this.elements.pendingCount.textContent = 'จัดการผู้ใช้งาน';

        try {
            const response = await AdminManager.getUsers();
            this.allUsers = response.data || [];
            this.filterUsers();
        } catch (error) {
            Swal.fire('ข้อผิดพลาด', error.message || 'ไม่สามารถโหลดข้อมูลผู้ใช้งานได้', 'error');
            this.elements.usersEmpty.classList.remove('hidden');
        } finally {
            this.elements.usersLoading.classList.add('hidden');
        }
    }

    filterUsers() {
        const searchTerm = this.elements.userSearch.value.toLowerCase();
        const roleFilter = this.elements.userRoleFilter.value;

        const filtered = this.allUsers.filter(u => {
            const fullName = `${u.firstname || ''} ${u.lastname || ''}`.toLowerCase();
            const matchesSearch = fullName.includes(searchTerm) ||
                u.email.toLowerCase().includes(searchTerm) ||
                (u.personalData?.phone && u.personalData.phone.includes(searchTerm)) ||
                (u.personalData?.nationalId && u.personalData.nationalId.includes(searchTerm));

            const matchesRole = !roleFilter || u.role === roleFilter;

            return matchesSearch && matchesRole;
        });

        this.renderUsers(filtered);
    }

    renderUsers(users) {
        const tbody = this.elements.usersTbody;
        tbody.innerHTML = '';

        if (users.length === 0) {
            this.elements.usersList.classList.add('hidden');
            this.elements.usersEmpty.classList.remove('hidden');
            return;
        }

        const currentUserId = this.currentUser.id;

        users.forEach(u => {
            const fullName = u.firstname || u.lastname ?
                `${u.firstname || ''} ${u.lastname || ''}`.trim() :
                u.email;

            const contact = u.personalData ?
                `โทร: ${u.personalData.phone || '-'} <br> ปชช: ${u.personalData.nationalId || '-'}` :
                '<span class="text-gray-400">ไม่มีข้อมูล</span>';

            const date = new Date(u.createdAt).toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            const roleOptions = this.ROLES.map(role =>
                `<option value="${role}" ${u.role === role ? 'selected' : ''}>${role}</option>`
            ).join('');

            const isCurrentUser = u.id === currentUserId;
            const selectDisabled = isCurrentUser ? 'disabled' : '';
            const selectClasses = `role-select px-2 py-1 border rounded text-xs w-28 ${isCurrentUser ? 'bg-gray-100 cursor-not-allowed' :
                    'bg-white cursor-pointer hover:border-red-400 focus:ring focus:ring-red-100'
                }`;

            const roleBadgeClass = u.role === 'CUSTOMER' ? 'bg-blue-50 text-blue-700' :
                u.role === 'VENDOR' ? 'bg-purple-50 text-purple-700' :
                    'bg-red-100 text-red-700 font-bold';

            const row = `
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3 text-sm font-medium text-gray-900">
                        <div>${fullName}</div>
                        <div class="text-xs text-gray-400">${u.email}</div>
                    </td>
                    <td class="px-4 py-3 text-xs text-gray-500 leading-tight">${contact}</td>
                    <td class="px-4 py-3 text-sm text-gray-500">${date}</td>
                    <td class="px-4 py-3">
                        <span class="py-1 px-3 inline-flex text-xs leading-5 rounded-full ${roleBadgeClass}">${u.role}</span>
                    </td>
                    <td class="px-4 py-3 text-sm font-medium flex items-center gap-2">
                        <button data-id="${u.id}" class="btn-view-user text-blue-600 hover:bg-blue-100 p-1.5 rounded-lg transition" title="ดูรายละเอียด">
                            <i data-lucide="eye" class="w-5 h-5"></i>
                        </button>
                        <select data-id="${u.id}" class="${selectClasses}" ${selectDisabled}>
                            ${roleOptions}
                        </select>
                        <button data-id="${u.id}" 
                            class="delete-user-btn text-red-600 hover:bg-red-100 p-1.5 rounded-lg transition ${isCurrentUser ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}" 
                            title="ลบผู้ใช้" 
                            ${isCurrentUser ? 'disabled' : ''}>
                            <i data-lucide="trash-2" class="w-5 h-5"></i>
                        </button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });

        this.elements.usersList.classList.remove('hidden');
        this.elements.usersEmpty.classList.add('hidden');
        if (typeof lucide !== 'undefined') { lucide.createIcons(); }
    }

    handleUserActions(e) {
        const viewBtn = e.target.closest('.btn-view-user');
        if (viewBtn) {
            this.showUserDetail(viewBtn.dataset.id);
            return;
        }

        const deleteBtn = e.target.closest('.delete-user-btn');
        if (deleteBtn && !deleteBtn.disabled) {
            this.handleDeleteUser(deleteBtn.dataset.id);
        }
    }
    
    handleUserRoleChange(e) {
        const roleSelect = e.target.closest('.role-select');
        if (roleSelect && !roleSelect.disabled) {
            this.handleUpdateUserRole(roleSelect.dataset.id, roleSelect.value);
        }
    }

    showUserDetail(userId) {
        const user = this.allUsers.find(u => u.id === userId);
        if (!user) return;

        const fullName = user.firstname || user.lastname ?
            `${user.firstname || ''} ${user.lastname || ''}`.trim() :
            'ไม่ระบุ';

        const roleBadge = user.role === 'CUSTOMER' ?
            '<span class="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">Customer</span>' :
            user.role === 'VENDOR' ?
                '<span class="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">Vendor</span>' :
                '<span class="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">Admin</span>';

        const personalDataHtml = user.personalData ? `
            <div class="bg-gray-50 p-4 rounded-lg">
                <h3 class="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <i data-lucide="id-card" class="w-4 h-4"></i> ข้อมูลส่วนตัว
                </h3>
                <p><span class="font-medium">ชื่อ-นามสกุล:</span> ${user.personalData.firstname} ${user.personalData.lastname}</p>
                <p><span class="font-medium">เบอร์โทรศัพท์:</span> ${user.personalData.phone || '-'}</p>
                <p><span class="font-medium">เลขบัตรประชาชน:</span> ${user.personalData.nationalId || '-'}</p>
            </div>
        ` : '<p class="text-gray-500 text-sm">ยังไม่มีข้อมูลส่วนตัว</p>';

        const vendorProfileHtml = user.vendorProfile ? `
            <div class="bg-purple-50 p-4 rounded-lg">
                <h3 class="font-semibold text-purple-700 mb-2 flex items-center gap-2">
                    <i data-lucide="store" class="w-4 h-4"></i> ข้อมูลร้านค้า
                </h3>
                <p><span class="font-medium">ชื่อร้าน:</span> ${user.vendorProfile.shopName}</p>
                <p><span class="font-medium">รายละเอียด:</span> ${user.vendorProfile.shopDetail || 'ไม่ระบุ'}</p>
                <p><span class="font-medium">คะแนน:</span> ${user.vendorProfile.rating.toFixed(1)} ⭐</p>
                <p><span class="font-medium">ผู้ติดตาม:</span> ${user.vendorProfile.followers} คน</p>
                <p><span class="font-medium">สถานะ:</span> ${user.vendorProfile.isApproved ?
            '<span class="text-green-600 font-medium">✓ อนุมัติแล้ว</span>' :
            '<span class="text-amber-600 font-medium">รออนุมัติ</span>'}</p>
            </div>
        ` : '';

        Swal.fire({
            title: 'รายละเอียดผู้ใช้งาน',
            html: `
                <div class="text-left space-y-4">
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h3 class="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <i data-lucide="user" class="w-4 h-4"></i> ข้อมูลบัญชี
                        </h3>
                        <p><span class="font-medium">ชื่อผู้ใช้:</span> ${user.username || '-'}</p>
                        <p><span class="font-medium">ชื่อ:</span> ${fullName}</p>
                        <p><span class="font-medium">อีเมล:</span> ${user.email}</p>
                        <p><span class="font-medium">วันเกิด:</span> ${user.birthdate ?
                new Date(user.birthdate).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }) : '-'}</p>
                        <p><span class="font-medium">Role:</span> ${roleBadge}</p>
                    </div>
                    
                    ${personalDataHtml}
                    ${vendorProfileHtml}
                    
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h3 class="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <i data-lucide="calendar" class="w-4 h-4"></i> เวลา
                        </h3>
                        <p class="text-sm text-gray-600">
                            <span class="font-medium">สมัครเมื่อ:</span> 
                            ${new Date(user.createdAt).toLocaleString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}
                        </p>
                        <p class="text-sm text-gray-600">
                            <span class="font-medium">อัปเดตล่าสุด:</span> 
                            ${new Date(user.updatedAt).toLocaleString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}
                        </p>
                    </div>
                </div>
            `,
            width: '600px',
            confirmButtonText: 'ปิด',
            confirmButtonColor: '#dc2626',
            didOpen: () => {
                if (typeof lucide !== 'undefined') { lucide.createIcons(); }
            }
        });
    }

    async handleUpdateUserRole(userId, newRole) {
        try {
            Swal.fire({ title: `กำลังเปลี่ยน Role เป็น ${newRole}...`, didOpen: () => Swal.showLoading() });
            await AdminManager.updateUserRole(userId, newRole);
            Swal.fire('สำเร็จ', `เปลี่ยน Role ผู้ใช้เป็น ${newRole} สำเร็จ`, 'success')
                .then(() => this.fetchAndRenderUsers());
        } catch (error) {
            Swal.fire('ข้อผิดพลาด', error.message || 'ไม่สามารถอัปเดต Role ได้', 'error');
            this.fetchAndRenderUsers();
        }
    }

    async handleDeleteUser(userId) {
        const result = await Swal.fire({
            title: 'ยืนยันการลบ?',
            text: "การลบผู้ใช้เป็นการถาวรและไม่สามารถย้อนกลับได้ คุณแน่ใจหรือไม่?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'ใช่, ลบเลย',
            cancelButtonText: 'ยกเลิก'
        });

        if (result.isConfirmed) {
            try {
                Swal.fire({ title: 'กำลังดำเนินการ...', didOpen: () => Swal.showLoading() });
                await AdminManager.deleteUser(userId);
                Swal.fire('สำเร็จ', `ลบผู้ใช้สำเร็จ`, 'success')
                    .then(() => this.fetchAndRenderUsers());
            } catch (error) {
                Swal.fire('ข้อผิดพลาด', error.message || `ไม่สามารถลบผู้ใช้ได้`, 'error');
            }
        }
    }
}

const adminDashboardManager = new AdminDashboardManager();
window.adminDashboardManager = adminDashboardManager;

document.addEventListener("DOMContentLoaded", () => {
    adminDashboardManager.init();
});