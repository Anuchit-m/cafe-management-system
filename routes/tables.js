const express   = require('express');
const router    = express.Router();
const mongoose  = require('mongoose');
const Table     = require('../models/Table');
const { isAdmin } = require('../middleware/auth');

// ─── GET / — แผนผังโต๊ะทั้งหมด ───────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const tables = await Table.find()
            .sort({ tableNumber: 1 })
            .populate('currentOrder');

        res.render('pages/tables/index', {
            title:  'แผนผังร้าน',
            layout: 'layouts/main',
            tables
        });
    } catch (error) {
        console.error('Error fetching tables:', error);
        res.status(500).render('pages/error', {
            title: 'เกิดข้อผิดพลาด', layout: 'layouts/main',
            statusCode: 500, message: 'ไม่สามารถโหลดข้อมูลโต๊ะได้'
        });
    }
});

// ─── GET /:tableId/qr — ดึง QR code URL สำหรับ self-order (admin) ───
router.get('/:tableId/qr', isAdmin, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.tableId)) {
            return res.status(400).json({ message: 'รหัสโต๊ะไม่ถูกต้อง' });
        }

        const table = await Table.findById(req.params.tableId);
        if (!table) {
            return res.status(404).json({ message: 'ไม่พบโต๊ะ' });
        }

        // URL ที่ลูกค้าจะถูกพาไปหลังสแกน QR
        const baseUrl      = process.env.BASE_URL || 'http://localhost:3000';
        const selfOrderUrl = `${baseUrl}/self-order/table/${table._id}`;

        // [DEMO] ใช้ free public API — ไม่ต้องติดตั้ง library เพิ่ม
        const qrImageUrl   = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(selfOrderUrl)}`;

        res.json({
            tableNumber:  table.tableNumber,
            tableName:    table.name || `โต๊ะ ${table.tableNumber}`,
            selfOrderUrl,
            qrImageUrl    // นำไป <img src="..."> หรือพิมพ์ได้เลย
        });
    } catch (err) {
        console.error('Error generating QR:', err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้าง QR Code' });
    }
});

// ─── POST / — เพิ่มโต๊ะใหม่ (admin) ─────────────────────────────────
router.post('/', isAdmin, async (req, res) => {
    try {
        const { tableNumber, name, capacity, notes } = req.body;
        if (!tableNumber || !capacity) {
            return res.status(400).json({ message: 'กรุณากรอกหมายเลขโต๊ะและจำนวนที่นั่ง' });
        }
        const existing = await Table.findOne({ tableNumber: parseInt(tableNumber) });
        if (existing) {
            return res.status(400).json({ message: `โต๊ะ ${tableNumber} มีอยู่ในระบบแล้ว` });
        }
        const table = new Table({
            tableNumber: parseInt(tableNumber),
            name:        name || `โต๊ะ ${tableNumber}`,
            capacity:    parseInt(capacity),
            notes:       notes || ''
        });
        await table.save();
        res.redirect('/tables');
    } catch (error) {
        console.error('Error creating table:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มโต๊ะ' });
    }
});

// ─── PUT /:id/status — อัปเดตสถานะโต๊ะ ─────────────────────────────
router.put('/:id/status', async (req, res) => {
    try {
        const { status, reservedBy } = req.body;
        if (!['free', 'occupied', 'reserved'].includes(status)) {
            return res.status(400).json({ message: 'สถานะไม่ถูกต้อง' });
        }
        const table = await Table.findById(req.params.id);
        if (!table) {
            return res.status(404).json({ message: 'ไม่พบโต๊ะนี้' });
        }
        table.status = status;
        if (status === 'reserved') {
            table.reservedBy = reservedBy || 'ลูกค้า';
            table.reservedAt = new Date();
        }
        if (status === 'free') {
            table.reservedBy   = null;
            table.reservedAt   = null;
            table.currentOrder = null;
        }
        await table.save();
        res.json({ message: 'อัปเดตสถานะสำเร็จ', status: table.status });
    } catch (error) {
        console.error('Error updating table status:', error);
        res.status(400).json({ message: error.message });
    }
});

// ─── DELETE /:id — ลบโต๊ะ (admin) ───────────────────────────────────
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        const table = await Table.findById(req.params.id);
        if (!table) {
            return res.status(404).json({ message: 'ไม่พบโต๊ะนี้' });
        }
        if (table.status === 'occupied') {
            return res.status(400).json({ message: 'ไม่สามารถลบโต๊ะที่กำลังใช้งานอยู่ได้' });
        }
        await Table.findByIdAndDelete(req.params.id);
        res.json({ message: 'ลบโต๊ะสำเร็จ' });
    } catch (error) {
        console.error('Error deleting table:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบโต๊ะ' });
    }
});

module.exports = router;