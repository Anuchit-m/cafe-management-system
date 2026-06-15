const express  = require('express');
const router   = express.Router();
const Order    = require('../models/Order');
const Table    = require('../models/Table');
const { buildReceipt } = require('../utils/receipt'); // ✅ ใช้ shared util

// ─── Static routes ก่อน /:orderId เสมอ ───────────────────────────────

// GET /payment/unpaid — completed แต่ยังไม่ชำระ
router.get('/unpaid', async (req, res) => {
    try {
        const orders = await Order.find({ status: 'completed', paidAt: null })
            .sort({ createdAt: 1 })
            .select('orderNumber tableNumber customerName totalAmount createdAt source');
        res.json({ orders, count: orders.length });
    } catch (err) {
        console.error('Error fetching unpaid:', err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// GET /payment/unprinted — ชำระแล้วแต่ยังไม่พิมพ์ใบเสร็จ
router.get('/unprinted', async (req, res) => {
    try {
        const orders = await Order.find({ paidAt: { $ne: null }, receiptPrinted: false })
            .sort({ paidAt: -1 })
            .select('orderNumber tableNumber customerName totalAmount paymentMethod paidAt source');
        res.json({ orders, count: orders.length });
    } catch (err) {
        console.error('Error fetching unprinted:', err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// ─── POST /payment/:orderId — ประมวลผลการชำระเงิน (staff เท่านั้น) ──
router.post('/:orderId', async (req, res) => {
    try {
        const { paymentMethod, receivedAmount } = req.body;

        if (!['cash', 'qr', 'card'].includes(paymentMethod)) {
            return res.status(400).json({ message: 'วิธีชำระเงินไม่ถูกต้อง (cash / qr / card)' });
        }

        const order = await Order.findById(req.params.orderId).populate('items.menu');
        if (!order)         return res.status(404).json({ message: 'ไม่พบออเดอร์' });
        if (order.paidAt)   return res.status(400).json({ message: 'ออเดอร์นี้ชำระเงินแล้ว' });
        if (order.status === 'cancelled') {
            return res.status(400).json({ message: 'ไม่สามารถชำระเงินออเดอร์ที่ยกเลิกแล้วได้' });
        }

        let received     = null;
        let changeAmount = null;
        if (paymentMethod === 'cash') {
            received = parseFloat(receivedAmount);
            if (isNaN(received) || received < order.totalAmount) {
                return res.status(400).json({
                    message: `จำนวนเงินไม่เพียงพอ ยอดที่ต้องชำระ ฿${order.totalAmount.toLocaleString()}`
                });
            }
            changeAmount = parseFloat((received - order.totalAmount).toFixed(2));
        }

        order.paymentMethod  = paymentMethod;
        order.paidAt         = new Date();
        order.receivedAmount = received;
        order.change         = changeAmount;

        if (order.status !== 'completed') {
            order.status = 'completed';
            if (order.table) {
                await Table.findByIdAndUpdate(order.table, {
                    status: 'free', currentOrder: null, reservedBy: null, reservedAt: null
                });
            }
        }
        await order.save();

        res.json({ message: 'ชำระเงินสำเร็จ', receipt: buildReceipt(order) });
    } catch (err) {
        console.error('Error processing payment:', err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการชำระเงิน' });
    }
});

// GET /payment/:orderId/receipt — ดึงข้อมูลใบเสร็จ (พิมพ์ย้อนหลังได้)
router.get('/:orderId/receipt', async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId).populate('items.menu');
        if (!order)       return res.status(404).json({ message: 'ไม่พบออเดอร์' });
        if (!order.paidAt) return res.status(400).json({ message: 'ยังไม่ได้ชำระเงิน' });
        res.json({ receipt: buildReceipt(order) });
    } catch (err) {
        console.error('Error fetching receipt:', err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// POST /payment/:orderId/print — บันทึกว่าพิมพ์ใบเสร็จแล้ว
router.post('/:orderId/print', async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);
        if (!order)        return res.status(404).json({ message: 'ไม่พบออเดอร์' });
        if (!order.paidAt) return res.status(400).json({ message: 'ยังไม่ได้ชำระเงิน' });

        order.receiptPrinted   = true;
        order.receiptPrintedAt = new Date();
        await order.save();

        res.json({ message: 'บันทึกการพิมพ์สำเร็จ', receiptPrintedAt: order.receiptPrintedAt });
    } catch (err) {
        console.error('Error marking printed:', err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

module.exports = router;