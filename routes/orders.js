const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Menu = require('../models/Menu');

// Get all orders
router.get('/', async (req, res) => {
    try {
        const orders = await Order.find()
            .sort({ createdAt: -1 })
            .populate('items.menu');
        
        const menus = await Menu.find({ status: 'available' }).sort({ category: 1, name: 1 });
        
        res.render('pages/orders/index', {
            title: 'จัดการออเดอร์',
            layout: 'layouts/main',
            orders,
            menus
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create new order
router.post('/', async (req, res) => {
    try {
        const { customerName, tableNumber, menuItems } = req.body;
        
        // validate menu Item
        if(!menuItems){
            return res.status(400).json({message: 'กรุณาเลือกรายการอาหารอย่างน้อย 1 รายการ'})
        }
        
        const items = Array.isArray(menuItems) ? menuItems : [menuItems];

        const validItems = items.filter(item => item && parseInt(item.quantity)>0)

        if (validItems.length === 0) {
            return res.status(400).json({message: 'กรุณาเลือกรายการอาหารอย่างน้อย 1 รายการ'});
        }
        
        //validate nullcheck
        const orderItems = [];
        for (const item of validItems){
            const menu = await Menu.findById(item.menuId);

            if (!menu){
                return res.status(400).json({
                    message: `ไม่พบเมนู ID: ${item.menuId} อาจถูกลบไปแล้ว`
                });
            }
            if (menu.status !== 'available') {
                return res.status(400).json({
                    message: `เมนู "${menu.name}" ไม่พร้อมให้บริการขณะนี้`
                });
            }
            orderItems.push({
                menu: menu._id,
                quantity: parseInt(item.quantity),
                price: menu.price
            });
        }

        const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        const order = new Order({
            orderNumber: `ORD${Date.now()}`,
            items: orderItems,
            customerName: customerName || 'ลูกค้าทั่วไป',
            tableNumber,
            totalAmount,
            status: 'pending'
        });

        await order.save();
        res.redirect('/orders');
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(400).json({ message: error.message });
    }
});

// Update order status
router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        
        const allowedStatuses = ['pending','preparing','completed','cancelled'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({message: 'สถานะไม่ถูกต้อง'});
        }
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            {status},
            {new:true}
        );
        if(!order){
            return res.status(404).json({message: 'ไม่พบออเดอร์นี้ '});
        }
        res.json({message: 'อัปเดตสถานะออเดอร์สำเร็จ'})
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router; 