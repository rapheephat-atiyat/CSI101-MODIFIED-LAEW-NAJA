// js/pages/profile.js

class ProfilePage {
    constructor() {
        // NOTE: AuthManager, UserManager, and VendorManager must be loaded
        this.auth = new AuthManager();
        this.userManger = UserManager;
        this.currentUser = null;
        this.addresses = [];
        this.thaiHierarchy = {}; // สำหรับข้อมูลจังหวัด/อำเภอ
        this.editingAddressId = null; 
        
        this.init();
        if (window.lucide) window.lucide.createIcons();
    }

    async init() {
        try {
            const profileResponse = await this.auth.getProfile(); 
            
            this.currentUser = profileResponse.user; 
            this.addresses = profileResponse.addresses || [];

            this.renderProfileData();
            this.renderAddresses();
            await this.loadThailandData(); 
            this.bindEvents();
            this.updateVendorActionButton(); 

        } catch (error) { 
             console.error("Profile initialization failed:", error);
        }
    }
    
    // --- Render Methods ---
    renderProfileData() {
        const u = this.currentUser;
        if (!u) return;
        
        // จัดการภาพ Profile 
        const profileImage = u.image || `https://ui-avatars.com/api/?name=${u.firstname || 'User'}`;

        document.getElementById('profile-img').src = profileImage;
        document.getElementById('display-name').textContent = u.firstname || u.username || 'User';
        document.getElementById('display-email').textContent = u.email;

        // Role Badge
        const roleBadge = document.getElementById('role-badge');
        roleBadge.textContent = u.role;
        if (u.role === 'VENDOR') roleBadge.className = "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700";
        if (u.role === 'ADMIN') roleBadge.className = "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700";
        
        // Metadata
        if (u.createdAt) document.getElementById('created-at').textContent = new Date(u.createdAt).toLocaleDateString('th-TH');
        if (u.updatedAt) document.getElementById('updated-at').textContent = new Date(u.updatedAt).toLocaleDateString('th-TH');
        
        // Populate Form
        document.getElementById('firstname').value = u.firstname || '';
        document.getElementById('lastname').value = u.lastname || '';
        document.getElementById('username').value = u.username || '-';
        document.getElementById('email').value = u.email || '';
        document.getElementById('image-url').value = u.image || '';
        if (u.birthdate) document.getElementById('birthdate').value = u.birthdate.split('T')[0];
        
        if (u.personalData) {
            document.getElementById('phone').value = u.personalData.phone || '';
            document.getElementById('nationalId').value = u.personalData.nationalId || '';
        }
    }

    renderAddresses() {
        const container = document.getElementById('address-list');
        if (!container) return;
        
        container.innerHTML = '';

        if (this.addresses.length === 0) {
            container.innerHTML = `<div class="col-span-full py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200 flex flex-col items-center gap-2 text-gray-400"><i data-lucide="map" class="w-10 h-10 opacity-50"></i><span>ยังไม่มีที่อยู่จัดส่ง</span></div>`;
        } else {
            this.addresses.forEach(addr => {
                const icon = addr.title?.includes('งาน') ? 'briefcase' : 'home';

                const card = document.createElement('div');
                card.className = "bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-sm transition-all group relative";
                card.innerHTML = `
                    <div class="flex items-start gap-3">
                        <div class="p-2.5 bg-gray-50 text-gray-500 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors"><i data-lucide="${icon}" class="w-5 h-5"></i></div>
                        <div class="flex-1">
                            <h4 class="font-semibold text-gray-900 text-sm mb-1">${addr.title || 'ที่อยู่'}</h4>
                            <p class="text-sm text-gray-500 leading-relaxed line-clamp-2">
                                ${addr.homeNumero} ${addr.subdistrict ? addr.subdistrict : ''} ${addr.district ? addr.district : ''} ${addr.city ? addr.city : ''}
                            </p>
                        </div>
                        <div class="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button class="edit-btn p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="แก้ไข" data-addr-data='${JSON.stringify(addr)}'><i data-lucide="pencil" class="w-4 h-4"></i></button>
                            <button class="delete-btn p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="ลบ" data-id="${addr.id}"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                        </div>
                    </div>
                `;
                
                card.querySelector('.edit-btn').addEventListener('click', (e) => this.showAddressModal(JSON.parse(e.currentTarget.getAttribute('data-addr-data'))));
                card.querySelector('.delete-btn').addEventListener('click', (e) => this.handleDeleteAddress(e.currentTarget.getAttribute('data-id')));

                container.appendChild(card);
            });
        }
        if (window.lucide) window.lucide.createIcons();
    }

    // --- Data and Event Handlers (Partial implementations for brevity) ---

    async loadThailandData() { 
        // NOTE: Logic for loading Thai address hierarchy is assumed to be fully defined here
    }

    processDataToHierarchy(data) {
        // NOTE: Logic for processing Thai address hierarchy is assumed to be fully defined here
    }

    async updateVendorActionButton() {
        const actionArea = document.getElementById('vendor-action-area');
        const button = document.getElementById('vendor-action-btn');
        const user = this.currentUser;

        const getShopLink = (u) => u.vendorProfile?.id ? `/shop.html?id=${u.vendorProfile.id}` : '/shop.html';

        if (user.role === 'VENDOR') {
            actionArea.classList.remove('hidden');
            button.setAttribute('href', getShopLink(user));
            button.className = 'flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 font-medium';
            button.innerHTML = '<i data-lucide="package" class="w-5 h-5"></i> เยี่ยมชมร้านค้าของคุณ';
        } else if (user.role === 'CUSTOMER') {
            actionArea.classList.remove('hidden');
            try {
                const statusData = await VendorManager.getRequestStatus();
                const status = statusData.status;

                if (status === 'PENDING') {
                    button.className = 'flex items-center gap-2 bg-amber-500 text-white px-5 py-2.5 rounded-xl shadow-md cursor-not-allowed font-medium';
                    button.innerHTML = '<i data-lucide="clock" class="w-5 h-5"></i> รอการอนุมัติ';
                } else { // NOT_APPLIED / REJECTED / No data
                    button.className = 'flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 font-medium';
                    button.setAttribute('onclick', 'window.profilePage.checkVendorRequirements(event)');
                    button.innerHTML = '<i data-lucide="store" class="w-5 h-5"></i> สมัครเป็นผู้หิ้ว';
                }
            } catch (e) {
                button.className = 'flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 font-medium';
                button.setAttribute('onclick', 'window.profilePage.checkVendorRequirements(event)');
                button.innerHTML = '<i data-lucide="store" class="w-5 h-5"></i> สมัครเป็นผู้หิ้ว';
            }
        }
        if (window.lucide) window.lucide.createIcons();
    }


    bindEvents() {
        document.getElementById('profile-form').addEventListener('submit', this.handleProfileUpdate.bind(this));
        document.getElementById('preview-btn').addEventListener('click', this.handlePreviewImage.bind(this));
        
        // Map original global functions to instance methods
        window.openAddressModal = (addr = null) => this.showAddressModal(addr);
        window.closeAddressModal = () => document.getElementById('address-modal').classList.remove('active');
        window.saveAddress = this.handleSaveAddressModal.bind(this);
        window.deleteAddress = this.handleDeleteAddress.bind(this); 
        window.checkVendorRequirements = this.checkVendorRequirements.bind(this);
    }
    
    // NOTE: Implementations for all handlers are required for full functionality but omitted here for brevity.
    handleProfileUpdate(e) { /* ... */ }
    handlePreviewImage() { /* ... */ }
    handleProvinceChange() { /* ... */ }
    handleDistrictChange() { /* ... */ }
    handleSubdistrictChange() { /* ... */ }
    checkVendorRequirements(e) { /* ... */ }
    showAddressModal(addr = null) { /* ... */ }
    handleSaveAddressModal() { /* ... */ }
    handleDeleteAddress(id) { /* ... */ }

}

document.addEventListener("DOMContentLoaded", () => { 
    // NOTE: This assumes that all necessary Manager classes (AuthManager, UserManager, VendorManager) are loaded via HTML <script> tags
    if (typeof AuthManager !== 'undefined' && typeof UserManager !== 'undefined') {
        window.profilePage = new ProfilePage(); 
    } else {
        console.error("Dependencies (AuthManager/UserManager) not loaded.");
    }
});