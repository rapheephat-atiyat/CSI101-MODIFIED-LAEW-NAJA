// js/pages/profile.js

class ProfilePage {
    constructor() {
        this.auth = new AuthManager();
        this.userManger = UserManager;
        this.currentUser = null;
        this.addresses = [];
        this.thaiHierarchy = {}; 
        this.editingAddressId = null; 
        
        document.addEventListener("DOMContentLoaded", () => this.init());
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
    
    // --- Render Methods (Omitted for brevity) ---
    renderProfileData() {
        const u = this.currentUser;
        if (!u) return;
        
        const profileImage = u.image || `https://ui-avatars.com/api/?name=${u.firstname || 'User'}`;

        document.getElementById('profile-img').src = profileImage;
        document.getElementById('display-name').textContent = u.firstname || u.username || 'User';
        document.getElementById('display-email').textContent = u.email;

        const roleBadge = document.getElementById('role-badge');
        // Tailwind class management
        roleBadge.className = "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold";
        if (u.role === 'VENDOR') roleBadge.classList.add("bg-purple-100", "text-purple-700");
        else if (u.role === 'ADMIN') roleBadge.classList.add("bg-red-100", "text-red-700");
        else roleBadge.classList.add("bg-gray-100", "text-gray-600");

        
        if (u.createdAt) document.getElementById('created-at').textContent = new Date(u.createdAt).toLocaleDateString('th-TH');
        if (u.updatedAt) document.getElementById('updated-at').textContent = new Date(u.updatedAt).toLocaleDateString('th-TH');
        
        // Populate Form
        document.getElementById('firstname').value = u.firstname || '';
        document.getElementById('lastname').value = u.lastname || '';
        document.getElementById('username').value = u.username || '';
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

    // --- Data and Event Handlers (Omitted for brevity) ---
    async loadThailandData() { 
        try {
            const res = await fetch('https://raw.githubusercontent.com/kongvut/thai-province-data/refs/heads/master/api/latest/sub_district_with_district_and_province.json');
            const flatData = await res.json();
            this.processDataToHierarchy(flatData);

            const provinceSelect = document.getElementById('addr-province');
            if (provinceSelect) {
                provinceSelect.innerHTML = '<option value="">เลือกจังหวัด</option>'; 
                Object.keys(this.thaiHierarchy).sort((a, b) => a.localeCompare(b, 'th')).forEach(p => {
                    const option = document.createElement('option');
                    option.value = p; option.textContent = p;
                    provinceSelect.appendChild(option);
                });
            }
        } catch (e) { console.error("Failed to load address data", e); }
    }

    processDataToHierarchy(data) {
        data.forEach(item => {
            const p = item.district.province.name_th;
            const d = item.district.name_th;
            const s = item.name_th;
            const z = item.zip_code;
            if (!this.thaiHierarchy[p]) this.thaiHierarchy[p] = {};
            if (!this.thaiHierarchy[p][d]) this.thaiHierarchy[p][d] = [];
            this.thaiHierarchy[p][d].push({ name: s, zip: z });
        });
    }

    async updateVendorActionButton() {
        const actionArea = document.getElementById('vendor-action-area');
        const button = document.getElementById('vendor-action-btn');
        const user = this.currentUser;

        if (!actionArea || !button || !user) return;

        const getShopLink = (u) => u.vendorProfile?.id ? `/shop.html?id=${u.vendorProfile.id}` : '/shop.html';

        if (user.role === 'VENDOR') {
            actionArea.classList.remove('hidden');
            button.removeAttribute('onclick');
            button.setAttribute('href', getShopLink(user));
            button.className = 'flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 font-medium';
            button.innerHTML = '<i data-lucide="package" class="w-5 h-5"></i> เยี่ยมชมร้านค้าของคุณ';
        } else if (user.role === 'CUSTOMER') {
            actionArea.classList.remove('hidden');
            button.setAttribute('href', '#'); 
            try {
                const statusData = await VendorManager.getRequestStatus();
                const status = statusData.status;

                if (status === 'PENDING') {
                    button.removeAttribute('onclick');
                    button.className = 'flex items-center gap-2 bg-amber-500 text-white px-5 py-2.5 rounded-xl shadow-md cursor-not-allowed font-medium';
                    button.innerHTML = '<i data-lucide="clock" class="w-5 h-5"></i> รอการอนุมัติ';
                } else { 
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


    // --- Event Handlers (Omitted for brevity) ---
    bindEvents() {
        document.getElementById('profile-form')?.addEventListener('submit', this.handleProfileUpdate.bind(this));
        document.getElementById('preview-btn')?.addEventListener('click', this.handlePreviewImage.bind(this));
        
        // Thai address dropdown change handlers
        document.getElementById('addr-province')?.addEventListener('change', this.handleProvinceChange.bind(this));
        document.getElementById('addr-district')?.addEventListener('change', this.handleDistrictChange.bind(this));
        document.getElementById('addr-subdistrict')?.addEventListener('change', this.handleSubdistrictChange.bind(this));
        
        // Global functions mapped to instance methods
        window.openAddressModal = (addr = null) => this.showAddressModal(addr);
        window.closeAddressModal = () => this.closeAddressModal();
        window.saveAddress = () => this.handleSaveAddressModal();
        window.deleteAddress = (id) => this.handleDeleteAddress(id);
        window.checkVendorRequirements = (e) => this.checkVendorRequirements(e);
    }
    
    handleProvinceChange() {
        const selProvince = document.getElementById('addr-province');
        const selDistrict = document.getElementById('addr-district');
        const selSubdistrict = document.getElementById('addr-subdistrict');
        const inpZipcode = document.getElementById('addr-zipcode');

        if (!selProvince || !selDistrict || !selSubdistrict || !inpZipcode) return;

        selDistrict.innerHTML = '<option value="">เลือกอำเภอ</option>'; selDistrict.disabled = true;
        selSubdistrict.innerHTML = '<option value="">เลือกตำบล</option>'; selSubdistrict.disabled = true;
        inpZipcode.value = '';

        if (selProvince.value && this.thaiHierarchy[selProvince.value]) {
            selDistrict.disabled = false;
            Object.keys(this.thaiHierarchy[selProvince.value]).sort((a, b) => a.localeCompare(b, 'th')).forEach(d => {
                selDistrict.innerHTML += `<option value="${d}">${d}</option>`;
            });
        }
    }

    handleDistrictChange() {
        const selProvince = document.getElementById('addr-province');
        const selDistrict = document.getElementById('addr-district');
        const selSubdistrict = document.getElementById('addr-subdistrict');
        const inpZipcode = document.getElementById('addr-zipcode');

        if (!selProvince || !selDistrict || !selSubdistrict || !inpZipcode) return;

        selSubdistrict.innerHTML = '<option value="">เลือกตำบล</option>'; selSubdistrict.disabled = true;
        inpZipcode.value = '';

        if (selDistrict.value && this.thaiHierarchy[selProvince.value] && this.thaiHierarchy[selProvince.value][selDistrict.value]) {
            selSubdistrict.disabled = false;
            const subs = this.thaiHierarchy[selProvince.value][selDistrict.value].sort((a, b) => a.name.localeCompare(b.name, 'th'));
            subs.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.name; opt.textContent = s.name; opt.dataset.zip = s.zip;
                selSubdistrict.appendChild(opt);
            });
        }
    }

    handleSubdistrictChange() {
        const selSubdistrict = document.getElementById('addr-subdistrict');
        const inpZipcode = document.getElementById('addr-zipcode');
        
        if (!selSubdistrict || !inpZipcode) return;

        const opt = selSubdistrict.options[selSubdistrict.selectedIndex];
        inpZipcode.value = opt.value ? opt.dataset.zip : '';
    }

    handlePreviewImage() {
        const url = document.getElementById('image-url')?.value;
        if (url) document.getElementById('profile-img').src = url;
    }

    async handleProfileUpdate(e) {
        e.preventDefault();
        
        const phoneEl = document.getElementById('phone');
        const nationalIdEl = document.getElementById('nationalId');
        const firstnameEl = document.getElementById('firstname');
        const lastnameEl = document.getElementById('lastname');
        const imageUrlEl = document.getElementById('image-url');
        const birthdateEl = document.getElementById('birthdate');

        if (!phoneEl || !nationalIdEl || !firstnameEl || !lastnameEl || !imageUrlEl || !birthdateEl) {
             Swal.fire('ข้อผิดพลาด', 'ไม่พบองค์ประกอบฟอร์มทั้งหมด', 'error');
             return;
        }

        const personalDataToSave = {
            // Include first/last name, as these are mandatory for creation/update in PersonalData model
            firstname: firstnameEl.value.trim(), 
            lastname: lastnameEl.value.trim(),
            phone: phoneEl.value.trim(),
            nationalId: nationalIdEl.value.trim(),
        };

        // 1. Determine the correct nested write operation (create or update) for personalData
        const personalDataPayload = this.currentUser.personalData 
            ? { update: personalDataToSave } // Record exists, so update it.
            : { create: personalDataToSave }; // Record is missing, so create it.

        // 2. Ensure the mandatory singular 'address' field on the User model is handled.
        let addressPayload = undefined;
        if (this.addresses.length > 0) {
            // Use 'connect' to satisfy the required singular relationship field by linking the first address
            const primaryAddressId = this.addresses[0].id;
            addressPayload = {
                connect: { id: primaryAddressId } 
            };
        } else {
             // If addresses are required but missing, the backend will likely fail anyway, 
             // but we must not send 'connect' if addresses is empty.
             addressPayload = undefined;
        }


        const payload = {
            firstname: firstnameEl.value.trim(),
            lastname: lastnameEl.value.trim(),
            image: imageUrlEl.value.trim() || null,
            birthdate: birthdateEl.value ? new Date(birthdateEl.value).toISOString() : null,
            personalData: personalDataPayload,
            // Pass the primary address connection to the top-level User update if an address exists.
            address: addressPayload
        };
        
        try {
            Swal.fire({ title: 'กำลังบันทึก...', didOpen: () => Swal.showLoading() });
            // Assume userManager is global and has an update method
            await this.userManger.update(this.currentUser.id, payload); 
            
            Swal.fire('สำเร็จ', 'บันทึกข้อมูลเรียบร้อย', 'success').then(() => location.reload());
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        }
    }
    
    checkVendorRequirements(e) {
        e.preventDefault();
        const u = this.currentUser;
        
        if (!u.firstname || !u.lastname || !u.personalData?.phone || !u.personalData?.nationalId || !this.addresses?.length) {
            Swal.fire('ข้อมูลไม่ครบ', 'กรุณากรอกชื่อ, นามสกุล, เบอร์โทร, เลขบัตร และที่อยู่ให้ครบถ้วนก่อนสมัคร', 'warning');
        } else {
            window.location.href = '/vendor-register.html';
        }
    }
    
    showAddressModal(addr = null) {
        const modal = document.getElementById('address-modal');
        if (!modal) return;
        
        modal.classList.remove('hidden'); 
        
        const isEdit = !!addr;
        
        // Reset form controls and populate data
        document.getElementById('modal-title').innerText = isEdit ? "แก้ไขที่อยู่" : "เพิ่มที่อยู่ใหม่";
        document.getElementById('addr-id').value = addr?.id || "";
        document.getElementById('addr-title').value = addr?.title || "";
        document.getElementById('addr-home').value = addr?.homeNumero || "";
        document.getElementById('addr-province').value = addr?.city || "";
        
        // Trigger change events to populate dropdowns if editing
        if (isEdit) {
            document.getElementById('addr-district').value = addr?.district || "";
            document.getElementById('addr-subdistrict').value = addr?.subdistrict || "";
            document.getElementById('addr-zipcode').value = addr?.zipcode || ""; 

            document.getElementById('addr-province').dispatchEvent(new Event('change'));
            
            setTimeout(() => {
                document.getElementById('addr-district').value = addr?.district || ""; 
                document.getElementById('addr-district').dispatchEvent(new Event('change'));
                
                setTimeout(() => {
                    document.getElementById('addr-subdistrict').value = addr?.subdistrict || ""; 
                }, 50);
            }, 50);

        } else {
            document.getElementById('addr-district').innerHTML = '<option value="">เลือกอำเภอ</option>';
            document.getElementById('addr-district').disabled = true;
            document.getElementById('addr-subdistrict').innerHTML = '<option value="">เลือกตำบล</option>';
            document.getElementById('addr-subdistrict').disabled = true;
            document.getElementById('addr-zipcode').value = '';
            document.getElementById('addr-province').dispatchEvent(new Event('change'));
        }

        if (window.lucide) window.lucide.createIcons();
    }

    closeAddressModal() {
        document.getElementById('address-modal')?.classList.add('hidden'); 
    }

    async handleSaveAddressModal() {
        const id = document.getElementById('addr-id').value;
        const payload = {
            title: document.getElementById('addr-title').value || "ที่อยู่",
            homeNumero: document.getElementById('addr-home').value,
            city: document.getElementById('addr-province').value,
            district: document.getElementById('addr-district').value,
            subdistrict: document.getElementById('addr-subdistrict').value,
            zipcode: document.getElementById('addr-zipcode').value
        };

        if (!payload.homeNumero || !payload.city || !payload.district || !payload.subdistrict) {
            return Swal.fire('ข้อมูลไม่ครบ', 'กรุณากรอกข้อมูลที่อยู่ให้ครบถ้วน', 'error');
        }

        try {
            Swal.fire({ title: 'กำลังบันทึก...', didOpen: () => Swal.showLoading() });

            if (id) { 
                await this.userManger.updateAddress(id, payload); 
            } else {
                if (typeof this.userManger.createAddress !== 'function') {
                    throw new Error("ฟังก์ชัน this.userManger.createAddress (สำหรับเพิ่มที่อยู่) ไม่ได้ถูกกำหนดไว้ใน UserManager.js");
                }
                await this.userManger.createAddress(this.currentUser.id, payload); 
            }

            this.closeAddressModal();
            Swal.fire({ icon: 'success', title: 'สำเร็จ', text: 'บันทึกข้อมูลเรียบร้อยแล้ว', timer: 1500, showConfirmButton: false })
                .then(() => this.init());
        } catch (err) {
            Swal.fire('Error', err.message, 'error');
        }
    }

    async handleDeleteAddress(id) {
        const result = await Swal.fire({
            title: 'ลบที่อยู่?', text: "คุณต้องการลบที่อยู่นี้ใช่หรือไม่", icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'ลบเลย', cancelButtonText: 'ยกเลิก'
        });

        if (result.isConfirmed) {
            try {
                await this.userManger.deleteAddress(id);
                Swal.fire('ลบสำเร็จ', 'ที่อยู่ถูกลบเรียบร้อยแล้ว', 'success').then(() => this.init());
            } catch (err) {
                Swal.fire('Error', err.message, 'error');
            }
        }
    }
}

// Global binding
const profilePage = new ProfilePage();
window.profilePage = profilePage;