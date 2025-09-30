const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const Order = require('../models/Order');
const Menu = require('../models/Menu');

// หน้าแรก
router.get('/', (req, res) => {
    if (req.session.user) {
        res.redirect('/dashboard');
    } else {
        res.render('pages/login', { 
            title: 'เข้าสู่ระบบ',
            layout: 'layouts/main'
        });
    }
});

// หน้าแดชบอร์ด (ต้องล็อกอินก่อน)
router.get('/dashboard', isAuthenticated, async (req, res) => {
    try {
        // ดึงข้อมูลวันนี้
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // ยอดขายวันนี้
        const todayOrders = await Order.find({
            createdAt: {
                $gte: today,
                $lt: tomorrow
            },
            status: 'completed'
        });
        const todaySales = todayOrders.reduce((sum, order) => sum + order.totalAmount, 0);

        // จำนวนออเดอร์วันนี้
        const todayOrderCount = await Order.countDocuments({
            createdAt: {
                $gte: today,
                $lt: tomorrow
            }
        });

        // จำนวนเมนูทั้งหมด
        const totalMenus = await Menu.countDocuments();

        // จำนวนออเดอร์ที่รอดำเนินการ
        const pendingOrders = await Order.countDocuments({ status: 'pending' });

        // ออเดอร์ล่าสุด 10 รายการ
        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('items.menu');

        res.render('pages/dashboard', {
            title: 'แดชบอร์ด',
            layout: 'layouts/main',
            todaySales,
            todayOrders: todayOrderCount,
            totalMenus,
            pendingOrders,
            recentOrders
        });
    } catch (error) {
        console.error('Dashboard Error:', error);
        res.status(500).render('pages/dashboard', {
            title: 'แดชบอร์ด',
            layout: 'layouts/main',
            error: 'เกิดข้อผิดพลาดในการโหลดข้อมูล'
        });
    }
});

// หน้าลงทะเบียน
router.get('/register', (req, res) => {
    if (req.session.user) {
        res.redirect('/dashboard');
    } else {
        res.render('pages/register', {
            title: 'สมัครสมาชิก',
            layout: 'layouts/main'
        });
    }
});

module.exports = router; 