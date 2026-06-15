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
        const pendingOrders = await Order.countDocuments({ status: { $in: ['pending', 'preparing'] } });

        // ออเดอร์ล่าสุด 10 รายการ
        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('items.menu');

        // ออเดอร์ทั้งหมดวันนี้
        const todayOrdersAll = await Order.find({
            createdAt: {
                $gte: today,
                $lt: tomorrow
            }
        }).populate('items.menu');

        const hourlyMap = {};
        for (let hour = 8; hour <= 20; hour++) {
            hourlyMap[hour] = 0;
        }
        todayOrdersAll.forEach(order => {
            const hour = order.createdAt.getHours();
            if (hourlyMap[hour] !== undefined) {
                hourlyMap[hour] += 1;
            }
        });

        const hourlyOrders = Object.entries(hourlyMap).map(([hour, count]) => ({
            hour: `${hour}:00`,
            count
        }));

        const menuMap = {};
        todayOrdersAll.forEach(order => {
            order.items.forEach(item => {
                const name = item.menu?.name || 'เมนูทั่วไป';
                if (!menuMap[name]) {
                    menuMap[name] = { quantity: 0, revenue: 0 };
                }
                menuMap[name].quantity += item.quantity;
                menuMap[name].revenue += item.price * item.quantity;
            });
        });

        const topMenus = Object.entries(menuMap)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        const popularMenu = topMenus[0] || null;

        const pendingOrdersList = await Order.find({
            status: { $in: ['pending', 'preparing'] }
        })
            .sort({ createdAt: 1 })
            .limit(5)
            .populate('items.menu');

        res.render('pages/dashboard', {
            title: 'แดชบอร์ด',
            layout: 'layouts/main',
            todaySales,
            todayOrderCount,
            totalMenus,
            pendingOrders,
            recentOrders,
            hourlyOrders,
            topMenus,
            popularMenu,
            pendingOrdersList
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