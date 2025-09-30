const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Menu = require('../models/Menu');

router.get('/', async (req, res) => {
    try {
        // ดึงข้อมูลวันที่เริ่มต้นและสิ้นสุด (ถ้าไม่มีให้ใช้วันนี้)
        const today = new Date();
        const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(today.setHours(0, 0, 0, 0));
        const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date(today.setHours(23, 59, 59, 999));

        // ดึงข้อมูลออเดอร์ตามช่วงเวลา
        const orders = await Order.find({
            createdAt: {
                $gte: startDate,
                $lte: endDate
            },
            status: 'completed'
        }).populate('items.menu');

        // คำนวณสรุปข้อมูล
        const summary = {
            totalOrders: orders.length,
            totalSales: orders.reduce((sum, order) => sum + order.totalAmount, 0),
            averageOrderValue: orders.length > 0 ? 
                orders.reduce((sum, order) => sum + order.totalAmount, 0) / orders.length : 0
        };

        // สรุปยอดขายตามเมนู
        const menuSales = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                const menuName = item.menu.name;
                if (!menuSales[menuName]) {
                    menuSales[menuName] = {
                        quantity: 0,
                        revenue: 0
                    };
                }
                menuSales[menuName].quantity += item.quantity;
                menuSales[menuName].revenue += item.price * item.quantity;
            });
        });

        // เรียงลำดับเมนูตามยอดขาย
        const topMenus = Object.entries(menuSales)
            .map(([name, data]) => ({
                name,
                quantity: data.quantity,
                revenue: data.revenue
            }))
            .sort((a, b) => b.revenue - a.revenue);

        res.render('pages/reports/index', {
            title: 'รายงาน',
            layout: 'layouts/main',
            summary,
            topMenus,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            orders
        });
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).send('เกิดข้อผิดพลาดในการสร้างรายงาน');
    }
});

module.exports = router; 