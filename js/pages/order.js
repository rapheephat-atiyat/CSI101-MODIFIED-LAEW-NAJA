const orderData = JSON.parse(localStorage.getItem("checkout_data"));
const cartData = JSON.parse(localStorage.getItem("cart_items")); // รายการสินค้าในตะกร้า

// อ้างอิง element
const orderSummaryEl = document.getElementById("order-summary");
const orderItemsEl = document.getElementById("order-items");

// ฟังก์ชันฟอร์แมทเงิน
function formatCurrency(num) {
    return "฿" + num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,");
}

// แสดงสรุปคำสั่งซื้อ
if (orderData) {
    orderSummaryEl.innerHTML = `
        <p class="text-lg"><strong>ยอดรวมสินค้า:</strong> ${formatCurrency(orderData.subtotal)}</p>
        <p class="text-lg"><strong>ค่าธรรมเนียม:</strong> ${formatCurrency(orderData.fee)}</p>
        <p class="text-xl font-bold mt-2"><strong>ยอดสุทธิ:</strong> ${formatCurrency(orderData.total)}</p>
    `;
} else {
    orderSummaryEl.innerHTML = `<p class="text-red-500 text-center">ไม่พบข้อมูลคำสั่งซื้อ</p>`;
}

// แสดงรายการสินค้า
if (cartData && cartData.length > 0) {
    cartData.forEach(item => {
        const div = document.createElement("div");
        div.className = "p-4 bg-white rounded-xl shadow";

        div.innerHTML = `
            <div class="flex items-center gap-4">
                <img src="${item.image}" alt="product" class="w-20 h-20 object-cover rounded-lg border" />
                
                <div>
                    <p class="font-semibold text-lg">${item.name}</p>
                    <p class="text-gray-700">ราคา: ${formatCurrency(item.price)}</p>
                    <p class="text-gray-700">จำนวน: ${item.quantity}</p>
                    <p class="text-blue-600 font-semibold">รวม: ${formatCurrency(item.price * item.quantity)}</p>
                </div>
            </div>
        `;

        orderItemsEl.appendChild(div);
    });
} else {
    orderItemsEl.innerHTML = `
        <p class="text-red-500">ไม่พบสินค้าที่สั่งซื้อ</p>
    `;
}
