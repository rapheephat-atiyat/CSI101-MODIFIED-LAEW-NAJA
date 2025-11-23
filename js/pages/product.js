class ProductDetailManager {
    constructor() {
        this.DEFAULT_IMAGE = 'https://dummyimage.com/600x600.png';
        this.BASE_FRONTEND_URL = window.location.origin;
        this.productData = null;
        this.auth = new AuthManager();
        this.navbarEl = document.querySelector('navbar-eiei');

        this.elements = {
            loadingState: document.getElementById('loading-state'),
            errorState: document.getElementById('error-state'),
            mainGrid: document.getElementById('main-product-grid'),
            fallbackArea: document.getElementById('fallback-list-area'),
            errorMessage: document.getElementById('error-message'),
            toast: document.getElementById('toast'),
        };
    }

    async init() {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');

        if (!productId) {
            await this.fetchFallbackData();
            return;
        }

        await this.fetchProductData(productId);
    }

    async fetchProductData(productId) {
        this.toggleDisplay('loading');

        try {
            const response = await ProductManager.getProduct(productId);
            const fetchedProductData = response.data;

            if (!fetchedProductData) {
                throw new Error("ไม่พบสินค้าที่ระบุ");
            }

            this.productData = fetchedProductData;
            this.renderProductDetail(fetchedProductData);
            this.toggleDisplay('main');

        } catch (error) {
            this.showError(error.message || 'ไม่สามารถโหลดข้อมูลสินค้าได้');
            console.error("Product Load Error:", error);
        }
    }

    async fetchFallbackData() {
        this.toggleDisplay('loading');

        try {
            const response = await ProductManager.getLatestProducts();
            const latestProducts = response.data || [];
            const vendorData = this.groupProductsByVendor(latestProducts);

            this.renderFallbackPage(vendorData);
            this.toggleDisplay('fallback');
            document.getElementById('page-title').textContent = 'สำรวจสินค้าล่าสุด - HiewHub';

        } catch (error) {
            this.showError(error.message || 'ไม่สามารถโหลดข้อมูลล่าสุดจากร้านค้าได้');
            console.error("Fallback Load Error:", error);
        }
    }

    renderProductDetail(product) {
        const isDiscount = product.discountPrice && product.discountPrice < product.price;
        const displayPrice = this.formatPrice(isDiscount ? product.discountPrice : product.price);
        const oldPrice = isDiscount ? this.formatPrice(product.price) : null;
        const imageArray = this.parseImages(product.images);
        const validImageArray = Array.isArray(imageArray) && imageArray.length > 0 ? imageArray.filter(url => url && url.length > 0) : [];
        const primaryImage = validImageArray.length > 0 ? validImageArray[0] : this.DEFAULT_IMAGE;
        const primaryIsVideo = this.isVideoUrl(primaryImage);

        const mockVendorName = "Hiew Hub Official Shop";
        const mockSku = product.id;
        const mockTags = product.hashtag && Array.isArray(product.hashtag) ? product.hashtag : ["#สินค้าใหม่", `#${product.category || 'ทั่วไป'}`];
        const mockRating = 4.5;
        const mockReviewsCount = 32;
        const productUrl = `${this.BASE_FRONTEND_URL}/product.html?id=${product.id}`;
        const creationDate = this.formatDate(product.createdAt);

        this.elements.mainGrid.innerHTML = `
            <section class="bg-white rounded-[14px] p-[22px] shadow-[0_8px_28px_rgba(18,30,45,0.06)]" aria-labelledby="product-gallery">
                <div class="w-full h-[600px] bg-white rounded-xl flex items-center justify-center overflow-hidden relative" id="hero">
                    ${primaryIsVideo
                        ? `<video id="mainImg" src="${primaryImage}" autoplay muted loop class="w-full h-full object-cover block transition-transform duration-300"></video>`
                        : `<img id="mainImg" src="${primaryImage}" alt="${product.title}" class="w-full h-full object-cover block transition-transform duration-300">`}
                </div>

                <div class="flex gap-3 mt-[18px] items-center flex-wrap" aria-hidden="false">
                    <div class="bg-red-50 text-red-700 py-2 px-[14px] font-bold text-[15px] rounded-[12px] flex gap-2 items-center">⭐️ ${mockRating} | ${mockReviewsCount} รีวิว</div>
                    <div class="bg-white p-2.5 px-[14px] rounded-[12px] shadow-[0_6px_18px_rgba(18,30,45,0.04)] font-bold flex gap-2 items-center text-sm">ขายแล้ว ${this.formatNumber(product.orderCount || 0)} ชิ้น</div>
                </div>

                <div class="flex gap-2.5 mt-4 overflow-x-auto pb-1.5" id="thumbs" aria-label="รูปสินค้าเพิ่มเติม">
                    ${validImageArray.slice(0, 5).map((url, i) => {
                    const isThumbVideo = this.isVideoUrl(url);
                    return `
                                <button aria-label="รูปที่ ${i + 1}" class="image-thumbnail ${i === 0 ? 'active border-red-600' : 'border-transparent'} border-2 rounded-xl cursor-pointer flex-shrink-0 p-0 transition-colors" data-url="${url}">
                                    <div class="relative w-[84px] h-[64px]">
                                        <img src="${isThumbVideo ? this.DEFAULT_IMAGE : url}" alt="thumb ${i + 1}" class="w-full h-full object-cover rounded-lg ${isThumbVideo ? 'brightness-75' : ''}">
                                        ${isThumbVideo ? '<i data-lucide="play-circle" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white w-6 h-6"></i>' : ''}
                                    </div>
                                </button>
                            `;
                }).join('')}
                </div>

                <hr class="border-none h-[1px] bg-[#f1f5f8] -mx-[22px] my-[14px]">
                <div class="text-[#7b8894] font-semibold text-sm pt-0 pb-2.5">
                    <i data-lucide="calendar" class="w-4 h-4 inline mr-1.5"></i>
                    สินค้าเริ่มวางจำหน่ายเมื่อ: ${creationDate}
                </div>
                
                <hr class="border-none h-[1px] bg-[#f1f5f8] -mx-[22px] my-[18px]">
                <div class="product-description-in-card">
                    <h2 class="text-xl font-bold mb-3 border-l-4 border-red-700 pl-2.5">รายละเอียดสินค้าโดยละเอียด</h2>
                    <pre class="whitespace-pre-wrap font-sans text-[15px] text-gray-600 leading-relaxed p-4 bg-[#f8fafc] rounded-xl shadow-sm">${product.detail || 'สินค้านี้ไม่มีรายละเอียดเพิ่มเติม'}</pre>
                </div>
            </section>

            <aside class="bg-white rounded-[14px] p-[22px] shadow-[0_8px_28px_rgba(18,30,45,0.06)] relative" aria-labelledby="product-title">
                <span class="inline-block bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-bold text-sm">มีสินค้า</span>
                <h1 id="product-title" class="m-2.5 mt-2 mb-2 text-2xl leading-snug font-extrabold">${product.title}</h1>
                <div class="text-[#7b8894] text-[13px] mb-3 flex gap-4 items-center">
                    <span class="shop-name">ร้านค้า: <a href="/shop.html?id=${product.vendorId}" class="text-blue-600 no-underline hover:underline">${mockVendorName}</a></span>
                    &middot; 
                    <span class="sales">รหัสสินค้า: ${mockSku}</span>
                </div>
                
                <div class="bg-[#fdf3f3] p-4 md:px-5 md:py-4 rounded-xl flex items-baseline gap-4 -mx-[22px] mb-[22px] mt-[18px]">
                    <div class="flex items-baseline gap-2.5">
                        <div class="text-[36px] font-extrabold text-[#d71928]">฿${displayPrice}</div>
                        ${oldPrice ? `<div class="text-[#7b8894] line-through font-semibold text-lg">฿${oldPrice}</div>` : ''}
                    </div>
                </div>

                <div class="flex gap-3 mt-3 items-center flex-wrap">
                    <button id="wishlist-btn" class="bg-white border border-gray-300 p-3 px-[18px] rounded-lg cursor-pointer font-bold text-red-700 flex items-center gap-1.5 hover:bg-gray-50 transition" title="เพิ่มในรายการโปรด" onclick="productManager.toggleWishlist('${product.id}')">
                        <i data-lucide="heart" class="w-5 h-5"></i> ถูกใจ
                    </button>
                    <div class="flex items-center gap-2.5 bg-white rounded-lg p-1.5 border border-gray-200" aria-label="จำนวนสินค้า">
                        <button id="qty-decr" aria-label="ลด" class="w-9 h-9 rounded-lg border border-gray-200 bg-white cursor-pointer font-extrabold text-lg flex items-center justify-center hover:bg-gray-50">−</button>
                        <span id="qty" class="min-w-9 text-center font-bold text-[15px]">1</span>
                        <button id="qty-incr" aria-label="เพิ่ม" class="w-9 h-9 rounded-lg border border-gray-200 bg-white cursor-pointer font-extrabold text-lg flex items-center justify-center hover:bg-gray-50">+</button>
                    </div>
                </div>
                <div class="flex gap-3 mt-2.5">
                    <button id="addCart" class="bg-white border border-gray-300 p-3 px-[18px] rounded-lg cursor-pointer font-bold flex-1 hover:bg-gray-50 transition" title="เพิ่มในตะกร้า">เพิ่มในตะกร้า</button>
                    <button id="buyNow" class="bg-red-700 text-white p-3 px-[18px] rounded-lg border-none cursor-pointer font-extrabold min-w-[140px] hover:bg-red-800 transition">ซื้อเลย</button>
                </div>

                <hr class="border-none h-[1px] bg-[#f1f5f8] -mx-[22px] my-[22px] mb-[14px]">
                <div class="flex items-center gap-3">
                    <span class="text-[#7b8894] font-semibold">แชร์สินค้านี้:</span>
                    <button class="bg-white border border-gray-300 p-3 rounded-lg cursor-pointer font-bold flex items-center justify-center hover:bg-gray-50 transition" onclick="productManager.shareToFacebook('${productUrl}', '${product.title}')">
                        <i data-lucide="facebook" class="w-5 h-5 text-[#1877F2]"></i>
                    </button>
                    <button class="bg-white border border-gray-300 p-3 rounded-lg cursor-pointer font-bold flex items-center justify-center hover:bg-gray-50 transition" onclick="productManager.shareToTwitter('${productUrl}', '${product.title}')">
                        <i data-lucide="twitter" class="w-5 h-5 text-[#1DA1F2]"></i>
                    </button>
                    <button class="bg-white border border-gray-300 p-3 rounded-lg cursor-pointer font-bold flex items-center justify-center hover:bg-gray-50 transition" onclick="productManager.copyLink('${productUrl}')">
                        <i data-lucide="link" class="w-5 h-5 text-gray-700"></i>
                    </button>
                </div>
                <hr class="border-none h-[1px] bg-[#f1f5f8] -mx-[22px] my-[18px]">

                <div class="flex gap-2 mt-[18px] flex-wrap pt-2.5" id="product-tags">
                    ${mockTags.map(tag => `<div class="bg-white border border-red-200 text-red-600 p-2 px-3 rounded-full font-bold text-[13px]">${tag}</div>`).join('')}
                </div>

                <div class="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-3 mt-[22px]" id="detail-features">
                    <div class="bg-[#f8fafc] p-3.5 rounded-lg font-bold text-sm">Category: ${product.category || 'N/A'}</div>
                </div>
            </aside>
            
                 <div class="bg-white rounded-[14px] p-[22px] shadow-[0_8px_28px_rgba(18,30,45,0.06)] mt-7 col-span-full">
                    <h2 class="text-xl font-bold mb-3 border-l-4 border-blue-600 pl-2.5">สินค้าที่คุณอาจสนใจ</h2>
                    <div id="related-products-container">
                </div>
            </div>
        `;

        this.setupEventListeners(product.id);
        this.fetchAndRenderRelatedProducts(product.id);

        document.getElementById('page-title').textContent = `${product.title} - HiewHub`;
        if (typeof lucide !== 'undefined') { lucide.createIcons(); }
    }

    renderFallbackPage(vendorData) {
        const container = document.getElementById('vendor-product-list');
        let html = '';

        if (vendorData.length === 0) {
            html = `<div class="bg-white rounded-[14px] shadow-sm p-4 flex flex-col gap-4"><div class="text-gray-600"><i data-lucide="package-x" class="w-5 h-5 inline mr-1"></i> ไม่พบสินค้าล่าสุดจากร้านค้าใดๆ</div></div>`;
        } else {
            vendorData.forEach(vendor => {
                html += `
                    <div class="bg-white rounded-[14px] shadow-sm p-4 flex flex-col gap-4 mb-5">
                        <a href="/shop.html?id=${vendor.vendorId}" class="no-underline text-inherit flex items-center gap-2">
                            <i data-lucide="store" class="w-6 h-6 text-blue-600"></i>
                            <h3 class="text-lg font-extrabold m-0">${vendor.shopName}</h3>
                        </a>
                        <div class="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3 mt-0">
                            ${vendor.products.map(p => {
                    const displayPrice = this.formatPrice(p.discountPrice || p.price);
                    const imageArray = this.parseImages(p.images);
                    const image = Array.isArray(imageArray) && imageArray.length > 0 ? imageArray[0] : this.DEFAULT_IMAGE;
                    const isVideo = this.isVideoUrl(image);
                    return `
                                            <a href="/product.html?id=${p.id}" class="bg-white rounded-xl shadow-sm overflow-hidden transition-transform duration-200 hover:shadow-lg hover:-translate-y-[2px] flex flex-col h-full no-underline text-inherit">
                                                <div class="w-full aspect-square relative overflow-hidden rounded-t-xl">
                                                    ${isVideo ? `<video src="${image}" preload="metadata" muted loop class="w-full h-full object-cover block" onmouseenter="this.play()" onmouseleave="this.pause()"></video>` : `<img src="${image}" class="w-full h-full object-cover block"/>`}
                                                    ${isVideo ? `<div class="absolute top-2 right-2 bg-red-700/90 text-white px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 leading-none"><i data-lucide="video" class="w-4 h-4"></i> VIDEO</div>` : ''}
                                                </div>
                                                <div class="p-2.5 flex flex-col gap-1 flex-grow">
                                                    <span class="text-sm font-semibold text-gray-800 min-h-8 leading-snug overflow-hidden text-ellipsis block line-clamp-2">${p.title}</span>
                                                    <span class="text-red-700 font-extrabold text-base mt-auto">฿${this.formatNumber(displayPrice)}</span>
                                                </div>
                                            </a>
                                        `;
                }).join('')}
                        </div>
                    </div>
                `;
            });
        }
        container.innerHTML = html;
        if (typeof lucide !== 'undefined') { lucide.createIcons(); }
    }

    setupEventListeners(productId) {
        document.querySelectorAll('.image-thumbnail').forEach(button => {
            button.addEventListener('click', () => {
                this.handleImageChange(button.dataset.url, button);
            });
        });

        this.setupQuantityControls();
        this.setupCartActions();
    }

    setupQuantityControls() {
        const qtyEl = document.getElementById("qty");
        const incrBtn = document.getElementById("qty-incr");
        const decrBtn = document.getElementById("qty-decr");

        if (qtyEl && incrBtn && decrBtn) {
            incrBtn.addEventListener("click", () => {
                let qty = parseInt(qtyEl.textContent) + 1;
                qtyEl.textContent = qty;
            });
            decrBtn.addEventListener("click", () => {
                let qty = parseInt(qtyEl.textContent);
                if (qty > 1) {
                    qty--;
                }
                qtyEl.textContent = qty;
            });
        }
    }

    setupCartActions() {
        const addCartBtn = document.getElementById("addCart");
        const buyNowBtn = document.getElementById("buyNow");

        if (addCartBtn) {
            addCartBtn.addEventListener("click", () => this.handleAddToCart());
        }

        if (buyNowBtn) {
            buyNowBtn.addEventListener("click", () => this.handleBuyNow());
        }
    }

    handleImageChange(url, element) {
        const heroContainer = document.getElementById('hero');
        const isVideo = this.isVideoUrl(url);

        if (heroContainer) {
            heroContainer.innerHTML = '';
            if (isVideo) {
                heroContainer.innerHTML = `<video id="mainImg" src="${url}" autoplay muted loop class="w-full h-full object-cover block transition-transform duration-300"></video>`;
            } else {
                heroContainer.innerHTML = `<img id="mainImg" src="${url}" alt="Product Image" class="w-full h-full object-cover block transition-transform duration-300">`;
            }
        }

        document.querySelectorAll('.image-thumbnail').forEach(b => b.classList.remove('active', 'border-red-600'));
        if (element) {
            element.classList.add('active', 'border-red-600');
        }
        if (typeof lucide !== 'undefined') { lucide.createIcons(); }
    }

    async handleAddToCart() {
        if (!this.auth.isLoggedIn()) {
            Swal.fire({
                icon: 'warning',
                title: 'เข้าสู่ระบบก่อน',
                text: 'กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ',
            }).then(() => {
                window.location.href = "/signIn.html";
            });
            return;
        }

        if (typeof CartManager === 'undefined' || !this.productData || !this.productData.id) {
            Swal.fire({
                icon: "error",
                title: "ระบบตะกร้าไม่พร้อมใช้งาน",
                text: "ไม่สามารถโหลดข้อมูลผู้จัดการตะกร้าสินค้าได้ กรุณาตรวจสอบการเชื่อมต่อ"
            });
            return;
        }

        const productId = this.productData.id;
        const qtyEl = document.getElementById("qty");
        const currentQty = parseInt(qtyEl ? qtyEl.textContent : 1);

        try {
            const result = await CartManager.addItemToCart(productId, currentQty);

            this.showToast(`✅ เพิ่ม "${result.data.vendorProduct.title}" (x${result.data.quantity}) ลงตะกร้าแล้ว`);

            if (qtyEl) {
                qtyEl.textContent = 1;
            }

            if (this.navbarEl && this.navbarEl.refreshCart) {
                this.navbarEl.refreshCart();
            }

        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "เพิ่มสินค้าไม่สำเร็จ",
                text: error.message
            });
        }
    }

    handleBuyNow() {
        this.showToast("ดำเนินการไปยังหน้าชำระเงิน (ตัวอย่าง)");
    }

    toggleDisplay(state) {
        this.elements.loadingState.classList.add('hidden');
        this.elements.mainGrid.classList.add('hidden');
        this.elements.fallbackArea.classList.add('hidden');
        this.elements.errorState.classList.add('hidden');

        switch (state) {
            case 'loading':
                this.elements.loadingState.classList.remove('hidden');
                break;
            case 'main':
                this.elements.mainGrid.classList.remove('hidden');
                break;
            case 'fallback':
                this.elements.fallbackArea.classList.remove('hidden');
                break;
            case 'error':
                this.elements.errorState.classList.remove('hidden');
                break;
        }
    }

    showError(message) {
        this.elements.errorMessage.textContent = message;
        this.toggleDisplay('error');
    }

    showToast(msg) {
        const toast = this.elements.toast;
        if (toast) {
            toast.textContent = msg;
            toast.classList.remove("hidden");
            toast.style.opacity = "1";
            setTimeout(() => {
                toast.style.opacity = "0";
                setTimeout(() => toast.classList.add("hidden"), 250);
            }, 1400);
        }
    }

    toggleWishlist(productId) {
        const btn = document.getElementById('wishlist-btn');
        if (btn) {
            btn.classList.toggle('active');
        }

        if (typeof lucide !== 'undefined') { lucide.createIcons(); }

        Swal.fire({
            title: 'รายการโปรด',
            text: btn && btn.classList.contains('active') ? 'เพิ่มสินค้าลงในรายการโปรดแล้ว' : 'นำสินค้าออกจากรายการโปรดแล้ว',
            icon: 'success',
            toast: true,
            position: 'bottom-end',
            showConfirmButton: false,
            timer: 1500
        });
    }

    isVideoUrl(url) {
        if (!url) return false;
        url = url.toLowerCase();
        return url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.mov') || url.includes('video');
    }

    parseImages(images) {
        if (typeof images === 'string') {
            try {
                return JSON.parse(images);
            } catch (e) {
                return null;
            }
        }
        return images;
    }

    groupProductsByVendor(products) {
        const groupedByVendor = {};
        const productCount = {};

        products.forEach(product => {
            const vendorId = product.vendorId;
            const vendorName = product.vendor ? product.vendor.shopName : 'ร้านค้าไม่ระบุชื่อ';

            if (!groupedByVendor[vendorId]) {
                groupedByVendor[vendorId] = {
                    shopName: vendorName,
                    vendorId: vendorId,
                    products: [],
                };
                productCount[vendorId] = 0;
            }

            if (productCount[vendorId] < 5) {
                groupedByVendor[vendorId].products.push(product);
                productCount[vendorId]++;
            }
        });

        return Object.values(groupedByVendor);
    }

    formatNumber(num) {
        if (num >= 1000) {
            return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
        }
        return num;
    }

    formatPrice(price) {
        return parseFloat(price).toLocaleString('th-TH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        try {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('th-TH', options).format(date);
        } catch (e) {
            return new Date(dateString).toLocaleDateString('th-TH');
        }
    }

    shareToFacebook(url, title) {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title)}`, '_blank', 'width=600,height=400');
    }

    shareToTwitter(url, title) {
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank', 'width=600,height=400');
    }

    async copyLink(url) {
        try {
            await navigator.clipboard.writeText(url);
            this.showToast("คัดลอกลิงก์สำเร็จ!");
        } catch (err) {
            this.showToast("ไม่สามารถคัดลอกลิงก์ได้");
        }
    }

    async fetchAndRenderRelatedProducts(productId) {
        const container = document.getElementById('related-products-container');

        container.innerHTML = `<div class="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-3 mt-5">
            <div class="bg-[#f8fafc] p-3 rounded-lg font-bold text-sm col-span-full text-blue-600">
                <i data-lucide="refresh-cw" class="w-5 h-5 inline animate-spin"></i> กำลังค้นหาสินค้าที่เกี่ยวข้อง...
            </div>
        </div>`;
        if (typeof lucide !== 'undefined') { lucide.createIcons(); }

        try {
            const response = await ProductManager.getRelatedProducts(productId);
            const relatedProducts = response.data || [];

            let content;
            if (relatedProducts.length === 0) {
                content = `<div class="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-3 mt-5">
                            <div class="bg-[#f8fafc] p-3 rounded-lg font-bold text-sm col-span-full text-gray-600">
                                <i data-lucide="package-x" class="w-5 h-5 inline"></i> ไม่พบสินค้าใกล้เคียงในหมวดหมู่เดียวกัน
                            </div>
                        </div>
                    `;

            } else {
                content = `
                    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-5">
                        ${relatedProducts.map(p => {
                                const displayPrice = this.formatPrice(p.discountPrice || p.price);
                                const imageArray = this.parseImages(p.images);
                                const image = Array.isArray(imageArray) && imageArray.length > 0 ? imageArray[0] : this.DEFAULT_IMAGE;
                                const isVideo = this.isVideoUrl(image);
                                return `
                                    <a href="/product.html?id=${p.id}" class="bg-white rounded-xl shadow-sm overflow-hidden transition-transform duration-200 hover:shadow-lg hover:-translate-y-0.5 flex flex-col h-full no-underline text-inherit">
                                        <div class="w-full aspect-square relative overflow-hidden rounded-t-xl">
                                            ${isVideo ? `<video src="${image}" preload="metadata" muted loop class="w-full h-full object-cover block" onmouseenter="this.play()" onmouseleave="this.pause()"></video>` : `<img src="${image}" class="w-full h-full object-cover block"/>`}
                                            ${isVideo ? `<div class="absolute top-2 right-2 bg-red-700/90 text-white px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 leading-none"><i data-lucide="video" class="w-4 h-4"></i> VIDEO</div>` : ''}
                                        </div>
                                        <div class="p-2.5 flex flex-col gap-1 flex-grow">
                                            <span class="text-sm font-semibold text-gray-800 min-h-8 leading-snug overflow-hidden text-ellipsis block line-clamp-2">${p.title}</span>
                                            <span class="text-red-700 font-extrabold text-base mt-auto">฿${this.formatPrice(displayPrice)}</span>
                                        </div>
                                    </a>
                                `;
                        }).join('')}
                    </div>
                `;
            }
            container.innerHTML = content;

        } catch (error) {
            console.error("Error fetching related products:", error);
            container.innerHTML = `<div class="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-3 mt-5">
                <div class="bg-[#f8fafc] p-3 rounded-lg font-bold text-sm col-span-full text-red-700">
                    <i data-lucide="alert-triangle" class="w-5 h-5 inline"></i>
                    เกิดข้อผิดพลาดในการโหลดสินค้าที่เกี่ยวข้อง
                </div>
               </div>`;
        }
        if (typeof lucide !== 'undefined') { lucide.createIcons(); }
    }
}

const productManager = new ProductDetailManager();
window.productManager = productManager;

document.addEventListener("DOMContentLoaded", () => {
    productManager.init();
});