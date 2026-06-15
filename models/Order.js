const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        required: true,
        unique: true
    },
    items: [{
        menu: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Menu',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
            type: Number,
            required: true
        }
    }],
    customerName: String,
    tableNumber: String,

    table:{ 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Table',
        default: null
    },
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'preparing', 'completed', 'cancelled'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'qr', 'card'],
        default: null
    },
    source:{
        type: String,
        enum: ['staff', 'self-order'],
        default: 'staff'
    },
    paymentMetod : {type: String, enum: ['cash', 'qr', 'card'], default: null},
    paidAt: {type: Date, default: null},
    receivedAmount: {type: Number, default: null},
    change: {type: Number, default: null},
    receiptPrinted: {type: Boolean, default: false},
    receiptPrintedAt: {type: Date, default: null}

}, {
    timestamps: true
});

module.exports = mongoose.model('Order', orderSchema); 