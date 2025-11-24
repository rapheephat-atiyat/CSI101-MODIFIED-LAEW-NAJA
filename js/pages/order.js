document.addEventListener("DOMContentLoaded", () => {

    const orderSummaryBox = document.getElementById("order-summary");
    const orderItemsBox = document.getElementById("order-items");

    // โหลดข้อมูลจาก localStorage
    const summary = JSON.parse(localStorage.getItem("checkout_data"));
    const items = JSON.parse(localStorage.getItem("order_items")) || [];

    // --------------------------
    // แสดงสรุปยอดสั่งซื้อ
    // --------------------------
    if (summary) {
        orderSummaryBox.innerHTML = `
            <div class="flex justify-between py-1">
                <span>ราคาสินค้า:</span>
                <strong>${summary.subtotal.toLocaleString()} บาท</strong>
            </div>
            <div class="flex justify-between py-1">
                <span>ค่าธรรมเนียม:</span>
                <strong>${summary.fee.toLocaleString()} บาท</strong>
            </div>
            <div class="flex justify-between py-1 text-xl border-t mt-2 pt-3 font-bold">
                <span>รวมทั้งหมด:</span>
                <span class="text-blue-600">${summary.total.toLocaleString()} บาท</span>
            </div>
        `;
    }

    // --------------------------
    // แสดงรายการสินค้า
    // --------------------------
    if (items.length === 0) {
        orderItemsBox.innerHTML = `
            <div class="text-center text-gray-500 py-8">ไม่มีรายการสินค้า</div>
        `;
        return;
    }

    orderItemsBox.innerHTML = items.map(item => `
        <div class="flex items-center gap-4 p-4 bg-gray-50 rounded-xl shadow">
            <img src="${item.vendorProduct.images[0]}" class="w-16 h-16 rounded object-cover">
            <div class="flex-1">
                <p class="font-semibold">${item.vendorProduct.title}</p>
                <p class="text-sm text-gray-500">จำนวน: ${item.quantity}</p>
            </div>
            <p class="font-bold text-blue-600">
                ${(item.vendorProduct.price * item.quantity).toLocaleString()} บาท
            </p>
        </div>
    `).join("");
});
