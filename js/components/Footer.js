class Footer extends HTMLElement {
    constructor() {
        super();
        this.members = [
            { id: "68067518", name: "นายกิตติพงษ์ ดอกไม้ทอง" },
            { id: "68008937", name: "นายธีรภัทร เครื่องพาที" },
            { id: "68065809", name: "นายชวภณ นิมิตรดีสม" },
            { id: "68042173", name: "นายพศวีร์ ชาดวง" },
            { id: "68058348", name: "นายอัครพล ประทุมมา" },
            { id: "68000639", name: "นายรพีภัทร เอติยัติ" },
            { id: "68050153", name: "นายวิทวัส พิทักษ์นอก" },
            { id: "68067330", name: "ภูบดินทร์ ราชพิบูลย์" },
            { id: "68019001", name: "ภัทรพงศ์ สมแสง" },
            { id: "68067056", name: "ธารินทร์ บุพลับ" },
        ];
    }

    connectedCallback() {
        this.render();
        if (window.lucide) window.lucide.createIcons();
    }

    render() {
        const membersList = this.members.map(member => `
            <li class="flex items-start gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
                <i data-lucide="user" class="w-4 h-4 mt-0.5 text-gray-400 shrink-0"></i>
                <span><span class="font-mono text-xs text-gray-400 mr-1">${member.id}</span> ${member.name}</span>
            </li>
        `).join('');

        this.innerHTML = `
        <footer class="bg-white border-t border-gray-100 pt-12 pb-8 mt-auto">
            <div class="max-w-7xl mx-auto px-6">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 mb-12">
                    
                    <div class="lg:col-span-3 space-y-4">
                        <div class="flex items-center gap-2.5 group">
                            <div class="w-20">
                               <img src="http://localhost:5500/public/images/logo.png" alt="Logo" class="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-200">
                            </div>
                            <span class="text-xl font-semibold text-gray-900 tracking-tight">HiewHub</span>
                        </div>
                        <p class="text-gray-500 text-sm leading-relaxed">
                            แหล่งรวมสินค้าคุณภาพที่คุณไว้วางใจ บริการรวดเร็วทันใจ พร้อมดูแลคุณตลอด 24 ชั่วโมง
                        </p>
                        <div class="flex gap-4 pt-2">
                            <a href="#" class="p-2 bg-gray-50 text-gray-600 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-all">
                                <i data-lucide="facebook" class="w-4 h-4"></i>
                            </a>
                            <a href="#" class="p-2 bg-gray-50 text-gray-600 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-all">
                                <i data-lucide="twitter" class="w-4 h-4"></i>
                            </a>
                            <a href="#" class="p-2 bg-gray-50 text-gray-600 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-all">
                                <i data-lucide="instagram" class="w-4 h-4"></i>
                            </a>
                        </div>
                    </div>


                    <div class="lg:col-span-6 bg-gray-50 rounded-2xl p-6 border border-gray-100">
                        <h3 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <i data-lucide="users" class="w-5 h-5 text-blue-600"></i>
                            สมาชิกผู้จัดทำ (Group Members)
                        </h3>
                        <ul class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                            ${membersList}
                        </ul>
                    </div>

                    <div class="lg:col-span-2">
                        <h3 class="font-semibold text-gray-900 mb-4">ติดต่อเรา</h3>
                        <ul class="space-y-3">
                            <li class="flex gap-3 text-sm text-gray-500">
                                <i data-lucide="map-pin" class="w-5 h-5 text-gray-400 shrink-0"></i>
                                <span>123 ถ.พหลโยธิน จตุจักร กรุงเทพฯ 10900</span>
                            </li>
                            <li class="flex gap-3 text-sm text-gray-500">
                                <i data-lucide="mail" class="w-5 h-5 text-gray-400 shrink-0"></i>
                                <span>hiewhub.officialmail@gmail.com</span>
                            </li>
                            <li class="flex gap-3 text-sm text-gray-500">
                                <i data-lucide="phone" class="w-5 h-5 text-gray-400 shrink-0"></i>
                                <span>0x-xxx-xxxx</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div class="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p class="text-sm text-gray-400">
                        &copy; ${new Date().getFullYear()} HiewHub Group Project. All rights reserved.
                    </p>
                    <div class="flex gap-6">
                        <a href="#" class="text-sm text-gray-400 hover:text-gray-900">Privacy Policy</a>
                        <a href="#" class="text-sm text-gray-400 hover:text-gray-900">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
        `;
    }
}

customElements.define("footer-eiei", Footer);