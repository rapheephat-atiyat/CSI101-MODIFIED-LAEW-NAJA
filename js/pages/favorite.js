document.addEventListener('DOMContentLoaded', async () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();

    const container = document.getElementById('favorites-container');
    const loading = document.getElementById('loading-state');
    const empty = document.getElementById('empty-state');
    const auth = new AuthManager();

    if (!auth.isLoggedIn()) {
        Swal.fire({
            icon: 'warning',
            title: 'กรุณาเข้าสู่ระบบ',
            text: 'คุณต้องเข้าสู่ระบบเพื่อดูรายการโปรด',
            confirmButtonText: 'ไปหน้าเข้าสู่ระบบ'
        }).then(() => window.location.href = '/signIn.html');
        return;
    }

    try {
        const res = await FavoriteManager.getMyFavorites();
        const favorites = res.data;

        loading.style.display = 'none';

        if (!favorites || favorites.length === 0) {
            empty.classList.remove('hidden');
            return;
        }

        container.innerHTML = favorites.map(item => {
            const p = item.vendorProduct;

            // Parse images
            let imageArray = p.images;
            if (typeof p.images === 'string') {
                try { imageArray = JSON.parse(p.images); } catch { imageArray = []; }
            }
            const imgUrl = (Array.isArray(imageArray) && imageArray.length > 0) ? imageArray[0] : 'https://via.placeholder.com/300';

            // Price logic
            const isDiscount = p.discountPrice && p.discountPrice < p.price;
            const displayPrice = isDiscount ? p.discountPrice : p.price;
            const oldPriceHtml = isDiscount ? `<span class="text-xs text-gray-400 line-through">฿${p.price.toLocaleString()}</span>` : '';

            return `
                <div class="bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 overflow-hidden group relative flex flex-col transition-all duration-300 hover:-translate-y-1">
                    <a href="/product.html?id=${p.id}" class="block">
                        <div class="aspect-square w-full bg-gray-50 relative overflow-hidden">
                            <img src="${imgUrl}" alt="${p.title}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
                        </div>
                    </a>
                    
                    <button onclick="removeFavorite('${p.id}', this)" 
                        class="absolute top-2 right-2 bg-white/90 p-2 rounded-full shadow hover:bg-red-50 text-red-500 transition z-10"
                        title="ลบออกจากรายการโปรด">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>

                    <div class="p-3 flex flex-col flex-grow">
                        <div class="mb-1">
                            <a href="/shop.html?id=${p.vendorId}" class="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1 mb-1">
                                <i data-lucide="store" class="w-3 h-3"></i> ${p.vendor.shopName}
                            </a>
                            <a href="/product.html?id=${p.id}" class="block">
                                <h3 class="text-sm font-medium text-gray-800 line-clamp-2 h-10 leading-tight">${p.title}</h3>
                            </a>
                        </div>
                        
                        <div class="mt-auto pt-2 flex items-end justify-between">
                            <div>
                                <div class="text-lg font-bold text-blue-600 leading-none">฿${displayPrice.toLocaleString()}</div>
                                ${oldPriceHtml}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        if (typeof lucide !== 'undefined') lucide.createIcons();

    } catch (error) {
        console.error(error);
        loading.innerHTML = `<p class="text-red-500">เกิดข้อผิดพลาด: ${error.message}</p>`;
    }
});

window.removeFavorite = async (productId, btnElement) => {
    const result = await Swal.fire({
        title: 'ลบรายการ?',
        text: "คุณต้องการลบสินค้านี้ออกจากรายการโปรดใช่ไหม",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'ลบเลย',
        cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
        try {
            await FavoriteManager.removeFavorite(productId);

            const card = btnElement.closest('.group');
            card.style.transition = 'all 0.3s ease';
            card.style.opacity = '0';
            card.style.transform = 'scale(0.9)';

            setTimeout(() => {
                card.remove();
                const container = document.getElementById('favorites-container');
                if (container.children.length === 0) {
                    document.getElementById('empty-state').classList.remove('hidden');
                }
            }, 300);

            const Toast = Swal.mixin({
                toast: true, position: 'top-end', showConfirmButton: false, timer: 2000
            });
            Toast.fire({ icon: 'success', title: 'ลบเรียบร้อย' });

        } catch (error) {
            Swal.fire('ผิดพลาด', error.message, 'error');
        }
    }
};