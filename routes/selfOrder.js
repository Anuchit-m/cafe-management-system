const express   = require('express');
const router    = express.Router();
const mongoose  = require('mongoose');
const Order     = require('../models/Order');
const Menu      = require('../models/Menu');
const Table     = require('../models/Table');
const { buildReceipt } = require('../utils/receipt');

// ─── ป้ายกำกับสถานะภาษาไทย ───────────────────────────────────────────
const STATUS_LABEL = {
    pending:   'รอดำเนินการ',
    preparing: 'กำลังทำ',
    completed: 'เสร็จสิ้น',
    cancelled: 'ยกเลิกแล้ว'
};

// ─── Helper: ตรวจ MongoDB ObjectId ───────────────────────────────────
function isValidId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

// ─────────────────────────────────────────────────────────────────────
// GET /self-order/view/:tableId
// หน้า Frontend สำหรับแท็บเล็ตประจำโต๊ะ
// ─────────────────────────────────────────────────────────────────────
router.get('/view/:tableId', async (req, res) => {
    try {
        if (!isValidId(req.params.tableId)) {
            return res.status(400).send('QR Code ไม่ถูกต้อง');
        }
        const table = await Table.findById(req.params.tableId);
        if (!table) {
            return res.status(404).send('ไม่พบโต๊ะนี้');
        }
        res.render('pages/self-order/index', {
            layout: 'layouts/tablet',
            title: `Self-Order - ${table.name || 'โต๊ะ ' + table.tableNumber}`,
            tableId: req.params.tableId,
            table: table
        });
    } catch (err) {
        console.error('Self-order render error:', err);
        res.status(500).send('เกิดข้อผิดพลาด');
    }
});

// ─────────────────────────────────────────────────────────────────────
// GET /self-order/table/:tableId
// ดึงข้อมูลโต๊ะ + เมนูพร้อมบริการ (จัดกลุ่มตาม category)
// ใช้เมื่อลูกค้าสแกน QR แล้ว browser โหลดหน้าเมนู
// ─────────────────────────────────────────────────────────────────────
router.get('/table/:tableId', async (req, res) => {
    try {
        if (!isValidId(req.params.tableId)) {
            return res.status(400).json({ message: 'QR Code ไม่ถูกต้อง' });
        }

        const table = await Table.findById(req.params.tableId);
        if (!table) {
            return res.status(404).json({ message: 'ไม่พบโต๊ะนี้' });
        }

        const menus = await Menu.find({ status: 'available' })
            .sort({ category: 1, name: 1 })
            .select('name price category image');

        // จัดกลุ่มเมนูตาม category
        const categoryMap = {};
        menus.forEach(menu => {
            if (!categoryMap[menu.category]) {
                categoryMap[menu.category] = [];
            }
            categoryMap[menu.category].push({
                _id:   menu._id,
                name:  menu.name,
                price: menu.price,
                image: menu.image
            });
        });
        const categories = Object.entries(categoryMap).map(([name, items]) => ({
            name,
            items
        }));

        // ดึงออเดอร์ทั้งหมดของโต๊ะที่ยังไม่จ่ายเงิน
        const unpaidOrders = await Order.find({ table: table._id, paidAt: null })
            .select('orderNumber status totalAmount paidAt items')
            .populate('items.menu');

        let aggregatedOrder = null;
        if (unpaidOrders.length > 0) {
            let total = 0;
            let statuses = unpaidOrders.map(o => o.status);
            // สถานะรวม: ถ้ารอทำ/กำลังทำ ให้ถือว่าภาพรวมยังไม่เสร็จ
            let overallStatus = 'completed';
            if (statuses.includes('pending')) overallStatus = 'pending';
            else if (statuses.includes('preparing')) overallStatus = 'preparing';

            aggregatedOrder = {
                status: overallStatus,
                statusLabel: STATUS_LABEL[overallStatus] || overallStatus,
                totalAmount: unpaidOrders.reduce((sum, o) => sum + o.totalAmount, 0),
                isPaid: false
            };
        }

        res.json({
            table: {
                tableNumber: table.tableNumber,
                name:        table.name || `โต๊ะ ${table.tableNumber}`,
                capacity:    table.capacity,
                status:      table.status
            },
            categories,
            currentOrder: aggregatedOrder // ส่ง status รวมไปให้เช็คเบื้องต้น
        });
    } catch (err) {
        console.error('Self-order get table error:', err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
    }
});

// ─────────────────────────────────────────────────────────────────────
// POST /self-order/table/:tableId/order
// ลูกค้าส่งออเดอร์จาก browser
// Body: { customerName?, items: [{ menuId, quantity }] }
// ─────────────────────────────────────────────────────────────────────
router.post('/table/:tableId/order', async (req, res) => {
    try {
        if (!isValidId(req.params.tableId)) {
            return res.status(400).json({ message: 'QR Code ไม่ถูกต้อง' });
        }

        const table = await Table.findById(req.params.tableId);
        if (!table) {
            return res.status(404).json({ message: 'ไม่พบโต๊ะนี้' });
        }

        const { customerName, items } = req.body;

        // Validate items
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'กรุณาเลือกรายการอาหารอย่างน้อย 1 รายการ' });
        }

        const validItems = items.filter(i => isValidId(i.menuId) && parseInt(i.quantity) > 0);
        if (validItems.length === 0) {
            return res.status(400).json({ message: 'ข้อมูลรายการอาหารไม่ถูกต้อง' });
        }

        // ตรวจ menu แต่ละรายการ
        const orderItems = [];
        for (const item of validItems) {
            const menu = await Menu.findById(item.menuId);
            if (!menu) {
                return res.status(400).json({ message: `ไม่พบเมนูในระบบ` });
            }
            if (menu.status !== 'available') {
                return res.status(400).json({
                    message: `"${menu.name}" ไม่พร้อมให้บริการในขณะนี้`
                });
            }
            orderItems.push({
                menu:     menu._id,
                quantity: parseInt(item.quantity),
                price:    menu.price
            });
        }

        const totalAmount = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

        // สร้าง Order ใหม่ทุกครั้งที่สั่ง เพื่อให้ครัวเห็นแยกบิล
        const order = new Order({
            orderNumber:  `ORD${Date.now()}`,
            items:        orderItems,
            customerName: customerName?.trim() || 'ลูกค้าทั่วไป',
            tableNumber:  String(table.tableNumber),
            table:        table._id,
            totalAmount,
            status:       'pending',
            source:       'self-order'
        });
        await order.save();

        // อัปเดตสถานะโต๊ะให้เป็น occupied เสมอ
        await Table.findByIdAndUpdate(table._id, {
            status:       'occupied',
            currentOrder: order._id,
            reservedBy:   null,
            reservedAt:   null
        });

        res.status(201).json({
            message:     'ส่งออเดอร์สำเร็จ กรุณารอสักครู่',
            totalAmount: order.totalAmount
        });
    } catch (err) {
        console.error('Self-order post order error:', err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
    }
});

// ─────────────────────────────────────────────────────────────────────
// GET /self-order/table/:tableId/status
// ลูกค้าตรวจสอบสถานะออเดอร์รวมของโต๊ะ (polling ได้ทุก 10-15 วิ)
// ─────────────────────────────────────────────────────────────────────
router.get('/table/:tableId/status', async (req, res) => {
    try {
        if (!isValidId(req.params.tableId)) {
            return res.status(400).json({ message: 'หมายเลขโต๊ะไม่ถูกต้อง' });
        }

        const unpaidOrders = await Order.find({ table: req.params.tableId, paidAt: null })
            .populate('items.menu')
            .sort('createdAt');

        if (unpaidOrders.length === 0) {
            return res.json({ order: { isPaid: true } }); // โต๊ะว่างหรือจ่ายหมดแล้ว
        }

        let allItems = [];
        let totalAmount = 0;
        let statuses = [];
        let source = 'self-order';

        unpaidOrders.forEach(order => {
            totalAmount += order.totalAmount;
            statuses.push(order.status);
            source = order.source;
            order.items.forEach(item => {
                allItems.push({
                    name:     item.menu?.name || '(เมนูที่ลบแล้ว)',
                    quantity: item.quantity,
                    price:    item.price,
                    subtotal: item.price * item.quantity
                });
            });
        });

        // สถานะรวม
        let overallStatus = 'completed';
        if (statuses.includes('pending')) overallStatus = 'pending';
        else if (statuses.includes('preparing')) overallStatus = 'preparing';

        res.json({
            order: {
                isPaid: false,
                status: overallStatus,
                statusLabel: STATUS_LABEL[overallStatus] || overallStatus,
                totalAmount: totalAmount,
                items: allItems,
                source: source,
                orderNumber: `รวม ${unpaidOrders.length} ออเดอร์`
            }
        });
    } catch (err) {
        console.error('Self-order get status error:', err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// ─────────────────────────────────────────────────────────────────────
// POST /self-order/table/:tableId/pay
// ลูกค้าชำระเงินรวบยอดทุกออเดอร์ที่ยังไม่จ่ายที่โต๊ะ
// Body: { paymentMethod: 'qr' | 'card' }
// ─────────────────────────────────────────────────────────────────────
router.post('/table/:tableId/pay', async (req, res) => {
    try {
        if (!isValidId(req.params.tableId)) {
            return res.status(400).json({ message: 'หมายเลขโต๊ะไม่ถูกต้อง' });
        }

        const { paymentMethod } = req.body;

        if (!['qr', 'card'].includes(paymentMethod)) {
            return res.status(400).json({ message: 'รองรับเฉพาะ QR Code และบัตรเท่านั้น' });
        }

        const unpaidOrders = await Order.find({ table: req.params.tableId, paidAt: null });
        
        if (unpaidOrders.length === 0) {
            return res.status(400).json({ message: 'ไม่มีออเดอร์ค้างชำระ' });
        }

        for (const order of unpaidOrders) {
            order.paymentMethod  = paymentMethod;
            order.paidAt         = new Date();
            order.receivedAmount = null;
            order.change         = null;
            if (order.status !== 'completed') {
                order.status = 'completed';
            }
            await order.save();
        }

        // คืนโต๊ะกลับเป็นว่าง
        await Table.findByIdAndUpdate(req.params.tableId, {
            status:       'available',
            currentOrder: null,
            reservedBy:   null,
            reservedAt:   null
        });

        // ส่งตัวแทน receipt (ใช้แค่ข้อมูลออเดอร์แรกในการโชว์บิลรวมคร่าวๆ หรือไม่โชว์ก็ได้ เพราะเป็น self-order)
        res.json({
            message: 'ชำระเงินสำเร็จ ขอบคุณที่ใช้บริการ',
            receipt: buildReceipt(unpaidOrders[0]) // just a mock for now
        });
    } catch (err) {
        console.error('Self-order pay error:', err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
    }
});

module.exports = router;