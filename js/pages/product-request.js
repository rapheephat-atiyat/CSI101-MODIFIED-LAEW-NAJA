class ProductRequestManagerPage {
    constructor() {
        this.shopId = new URLSearchParams(window.location.search).get('id');

        this.elements = {
            loadingState: document.getElementById('loading-state'),
            errorState: document.getElementById('error-state'),
            requestListContainer: document.getElementById('request-list-container'),
            errorMessage: document.getElementById('error-message'),
            vendorInfoDisplay: document.getElementById('vendor-info-display'),
            requestList: document.getElementById('request-list'),
            requestsEmpty: document.getElementById('requests-empty'),
        };

        this.auth = typeof AuthManager !== 'undefined' ? new AuthManager() : null; 
        
        document.addEventListener("DOMContentLoaded", () => this.init());
    }

    async init() {
        if (typeof lucide !== 'undefined') { lucide.createIcons(); }
        
        if (!this.shopId) {
            this.showErrorState("ไม่พบ ID ร้านค้าที่ต้องการตรวจสอบ (URL parameter 'id' หายไป)");
            document.getElementById('page-title').textContent = 'Error';
            return;
        }

        await this.fetchRequests();
    }

    async fetchRequests() {
        this.toggleDisplay('loading');

        try {
            if (typeof ProductRequestManager === 'undefined' || !this.auth) {
                 throw new Error("ไม่สามารถโหลดไฟล์บริการหลัก (Service Manager files missing).");
            }
            
            const user = await this.auth.protect(); 

            const response = await ProductRequestManager.getRequestsByVendorId(this.shopId);

            this.elements.vendorInfoDisplay.textContent = `รายการคำขอทั้งหมดที่ส่งมายังร้านค้าของคุณ (ID: ${this.shopId})`;

            this.renderRequests(response.data);

        } catch (error) {
            document.getElementById('page-title').textContent = 'Error';
            this.showErrorState(error.message || 'ไม่สามารถเชื่อมต่อกับระบบจัดการคำขอได้');
        }
    }
    
    renderRequests(requests) {
        const container = this.elements.requestList;
        if (!container) return;
        
        container.innerHTML = '';

        if (!requests || requests.length === 0) {
            this.elements.requestsEmpty.classList.remove('hidden');
            this.toggleDisplay('list');
            return;
        }

        this.elements.requestsEmpty.classList.add('hidden');

        requests.forEach(req => {
            const statusColor = this.getStatusColor(req.status);
            const statusText = this.getStatusText(req.status);
            
            // Get necessary IDs for action buttons
            const userId = req.user?.id;
            const productId = req.approvedProductId || 'MOCK_PRODUCT_ID_XYZ'; 

            const requesterName = req.user ? `${req.user.firstname} ${req.user.lastname}` : 'ผู้ใช้ไม่ระบุชื่อ';
            const createdAtDate = new Date(req.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

            const card = document.createElement('div');
            card.className = `bg-white rounded-xl shadow-lg p-5 border border-gray-100 transition border-l-[5px] border-blue-600`;

            card.innerHTML = `
                <div class="flex justify-between items-start mb-3">
                    <h2 class="text-xl font-bold text-gray-800">${req.title}</h2>
                    <span class="status-pill ${statusColor}">${statusText}</span>
                </div>

                <div class="space-y-2 text-sm text-gray-600 mb-4">
                    <p><strong>รายละเอียด:</strong> ${req.details || '-'}</p>
                    <p><strong>งบประมาณ:</strong> ${req.budget ? this.formatCurrency(req.budget) : 'ไม่ระบุ'}</p>
                    <p><strong>ผู้ส่งคำขอ:</strong> ${requesterName} (<span class="text-xs text-gray-500">${req.user?.email || 'N/A'}</span>)</p>
                    <p><strong>วันที่ส่ง:</strong> ${createdAtDate}</p>
                    ${req.productLink ? `<p><strong>ลิงก์อ้างอิง:</strong> <a href="${req.productLink}" target="_blank" class="text-blue-500 hover:underline">คลิกเพื่อดู</a></p>` : ''}
                    
                    ${req.images && req.images.length > 0 ?
                    `<div class="mt-3">
                            <strong>รูปภาพอ้างอิง:</strong>
                            <div class="flex gap-2 mt-1">
                                ${req.images.map(imgUrl => `<img src="${imgUrl}" alt="Reference" class="w-16 h-16 object-cover rounded-md border border-gray-200 cursor-pointer" onclick="window.open('${imgUrl}', '_blank')">`).join('')}
                            </div>
                        </div>`
                    : ''}
                </div>

                <div class="flex justify-end gap-3 border-t pt-3">
                    <button data-status="PROCESSING" data-id="${req.id}" data-user-id="${userId}" data-product-id="${productId}" class="status-update-btn px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition">กำลังพิจารณา</button>
                    <button data-status="APPROVED" data-id="${req.id}" data-user-id="${userId}" data-product-id="${productId}" class="status-update-btn px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition">อนุมัติ/ตกลงรับ</button>
                    <button data-status="REJECTED" data-id="${req.id}" data-user-id="${userId}" data-product-id="${productId}" class="status-update-btn px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition">ปฏิเสธ</button>
                </div>
            `;
            container.appendChild(card);
        });

        container.querySelectorAll('.status-update-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleStatusUpdate(e.currentTarget.dataset.id, e.currentTarget.dataset.status));
        });

        this.toggleDisplay('list');
    }

    async handleStatusUpdate(requestId, status) {
        const statusDisplayName = this.getStatusText(status);

        const result = await Swal.fire({
            title: `เปลี่ยนสถานะเป็น ${statusDisplayName}?`,
            text: `คุณต้องการเปลี่ยนสถานะคำขอ ID ${requestId} เป็น ${statusDisplayName} หรือไม่?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: status === 'REJECTED' ? '#ef4444' : '#3b82f6',
            confirmButtonText: 'ยืนยัน'
        });

        if (result.isConfirmed) {
            if (typeof ProductRequestManager === 'undefined') {
                Swal.fire('ข้อผิดพลาด', 'ProductRequestManager is not loaded.', 'error');
                return;
            }

            Swal.fire({ title: 'กำลังดำเนินการ...', didOpen: () => Swal.showLoading() });

            try {
                let successMessage = `จำลองการอัปเดตสถานะ ${statusDisplayName} เสร็จสิ้น`;

                if (status === 'APPROVED') {
                    const btn = document.querySelector(`.status-update-btn[data-id="${requestId}"][data-status="APPROVED"]`);
                    const requesterId = btn.dataset.userId;
                    const finalProductId = btn.dataset.productId;
                    
                    if (typeof ProductRequestManager.approveRequestAndAddToCart !== 'function') {
                         throw new Error(`ฟังก์ชัน ProductRequestManager.approveRequestAndAddToCart() ที่จำเป็นสำหรับการเพิ่มสินค้าเข้าตะกร้าโดย Admin ยังไม่ได้ถูกกำหนดไว้`);
                    }
                    
                    const response = await ProductRequestManager.approveRequestAndAddToCart(requestId, requesterId, finalProductId);
                    
                    successMessage = `สถานะ APPROVED สำเร็จ! (เพิ่มสินค้าเข้าตะกร้าผู้ขอแล้ว)`;

                } else {
                    if (typeof ProductRequestManager.updateRequestStatus === 'function') {
                        await ProductRequestManager.updateRequestStatus(requestId, status);
                    } else {
                        console.warn("ProductRequestManager.updateRequestStatus is missing, simulating update.");
                    }
                }

                Swal.fire('สำเร็จ', successMessage, 'success');
                this.fetchRequests();
            } catch (error) {
                Swal.fire('ข้อผิดพลาด', error.message || 'ไม่สามารถอัปเดตสถานะได้', 'error');
            }
        }
    }


    toggleDisplay(showElement) {
        this.elements.loadingState?.classList.add('hidden');
        this.elements.errorState?.classList.add('hidden');
        this.elements.requestListContainer?.classList.add('hidden');

        if (showElement === 'loading') {
            this.elements.loadingState?.classList.remove('hidden');
        } else if (showElement === 'list') {
            this.elements.requestListContainer?.classList.remove('hidden');
        } else if (showElement === 'error') {
            this.elements.errorState?.classList.remove('hidden');
        }
        if (window.lucide) window.lucide.createIcons();
    }

    showErrorState(message) {
        this.elements.errorMessage.textContent = message;
        this.toggleDisplay('error');
    }

    formatCurrency(price) {
        return `฿${parseFloat(price).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    getStatusText(status) {
        const statusText = {
            'SUBMITTED': 'รอดำเนินการ',
            'PROCESSING': 'กำลังพิจารณา',
            'APPROVED': 'อนุมัติ/ดำเนินการแล้ว',
            'REJECTED': 'ปฏิเสธ'
        };
        return statusText[status] || status;
    }

    getStatusColor(status) {
        const statusClass = {
            'SUBMITTED': 'bg-amber-100 text-amber-700',
            'PROCESSING': 'bg-teal-100 text-teal-600',
            'APPROVED': 'bg-green-100 text-green-600',
            'REJECTED': 'bg-red-100 text-red-500'
        };
        return `inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${statusClass[status] || 'bg-gray-100 text-gray-600'}`;
    }
}

const productRequestManagerPage = new ProductRequestManagerPage();
window.productRequestManagerPage = productRequestManagerPage;