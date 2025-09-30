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
        
        const items = Array.isArray(menuItems) ? menuItems : [menuItems];
        
        const orderItems = await Promise.all(items.filter(item => item.quantity > 0).map(async (item) => {
            const menu = await Menu.findById(item.menuId);
            return {
                menu: menu._id,
                quantity: parseInt(item.quantity),
                price: menu.price
            };
        }));

        const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        const order = new Order({
            orderNumber: `ORD${Date.now()}`,
            items: orderItems,
            customerName,
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
        await Order.findByIdAndUpdate(req.params.id, { status });
        res.json({ message: 'Order status updated successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router; 