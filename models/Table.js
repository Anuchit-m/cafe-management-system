const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
    tableNumber: { type: Number, required: true, unique: true },
    name: { type: String },
    capacity: { type: Number, required: true, default: 2 },
    status: { type: String, enum: ['available', 'occupied', 'reserved'], default: 'available' 
},
currentOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null 
},
reservedAt: { type: Date, default: null },
reservedBy: { type: String, default: null },
notes: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Table', tableSchema);
