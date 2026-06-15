const PAYMENT_LABEL = {
    cash: 'เงินสด',
    qr:   'QR Code',
    card: 'บัตรเครดิต/เดบิต'
};

/**
 * สร้าง receipt object จาก order ที่ populate items.menu แล้ว
 * @param {Object} order - Mongoose Order document (populated)
 * @returns {Object} receipt data พร้อมส่งไป frontend
 */
function buildReceipt(order) {
    const paidDate = new Date(order.paidAt);
    const dateStr  = paidDate.toLocaleDateString('th-TH', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
    const timeStr  = paidDate.toLocaleTimeString('th-TH', {
        hour: '2-digit', minute: '2-digit'
    });

    // [DEMO] QR payment — ใช้ free public API สร้าง QR image
    let qrImageUrl = null;
    if (order.paymentMethod === 'qr') {
        const qrData = `PROMPTPAY|THB ${order.totalAmount}|REF:${order.orderNumber}`;
        qrImageUrl   = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(qrData)}`;
    }

    return {
        orderNumber:         order.orderNumber,
        tableNumber:         order.tableNumber  || '-',
        customerName:        order.customerName || 'ลูกค้าทั่วไป',
        source:              order.source       || 'staff',
        items: order.items.map(item => ({
            name:     item.menu ? item.menu.name : '(เมนูที่ลบแล้ว)',
            quantity: item.quantity,
            price:    item.price,
            subtotal: item.price * item.quantity
        })),
        totalAmount:         order.totalAmount,
        paymentMethod:       order.paymentMethod,
        paymentMethodLabel:  PAYMENT_LABEL[order.paymentMethod] || '-',
        receivedAmount:      order.receivedAmount,
        change:              order.change,
        paidAt:              order.paidAt,
        paidAtFormatted:     `${dateStr} เวลา ${timeStr} น.`,
        receiptPrinted:      order.receiptPrinted,
        receiptPrintedAt:    order.receiptPrintedAt,
        qrImageUrl
    };
}

module.exports = { buildReceipt, PAYMENT_LABEL };