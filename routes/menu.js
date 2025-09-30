const express = require('express');
const router = express.Router();
const Menu = require('../models/Menu');
const multer = require('multer');
const path = require('path');

// Set up multer for image upload
const storage = multer.diskStorage({
  destination: './public/images/menu',
  filename: function(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 }, // 1MB limit
  fileFilter: function(req, file, cb) {
    checkFileType(file, cb);
  }
});

// Check file type
function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('อนุญาตเฉพาะไฟล์รูปภาพ (jpg, jpeg, png, gif) เท่านั้น'));
  }
}

// Get all menus
router.get('/', async (req, res) => {
  try {
    const menus = await Menu.find().sort({ category: 1, name: 1 });
    res.render('pages/menu/index', { 
      menus,
      title: 'จัดการเมนู',
      layout: 'layouts/main'  // ระบุ layout ที่จะใช้
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new menu
router.post('/', (req, res) => {
  upload.single('image')(req, res, async function(err) {
    try {
      // จัดการ error จาก multer
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.render('pages/menu/index', {
            error: 'ขนาดไฟล์ต้องไม่เกิน 1MB',
            menus: await Menu.find().sort({ category: 1, name: 1 }),
            title: 'จัดการเมนู',
            layout: 'layouts/main'
          });
        }
      } else if (err) {
        return res.render('pages/menu/index', {
          error: err.message,
          menus: await Menu.find().sort({ category: 1, name: 1 }),
          title: 'จัดการเมนู',
          layout: 'layouts/main'
        });
      }

      const { name, category, price, description, status } = req.body;
      const menu = new Menu({
        name,
        category,
        price,
        description,
        status,
        image: req.file ? `/images/menu/${req.file.filename}` : null
      });
      await menu.save();
      res.redirect('/menu');
    } catch (error) {
      res.render('pages/menu/index', {
        error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง',
        menus: await Menu.find().sort({ category: 1, name: 1 }),
        title: 'จัดการเมนู',
        layout: 'layouts/main'
      });
    }
  });
});

// Update menu
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { name, category, price, status } = req.body;
    const updateData = {
      name,
      category,
      price,
      status
    };

    // ถ้ามี description ให้เพิ่มเข้าไป
    if (req.body.description) {
      updateData.description = req.body.description;
    }

    // ถ้ามีการอัพโหลดรูปภาพใหม่
    if (req.file) {
      updateData.image = `/images/menu/${req.file.filename}`;
    }

    console.log('Updating menu with data:', updateData);

    const updatedMenu = await Menu.findByIdAndUpdate(
      req.params.id, 
      updateData,
      { new: true }
    );

    if (!updatedMenu) {
      return res.status(404).json({ message: 'ไม่พบเมนูที่ต้องการแก้ไข' });
    }

    // เปลี่ยนจาก redirect เป็น json response
    return res.status(200).json({ 
      success: true,
      message: 'อัพเดทเมนูสำเร็จ'
    });

  } catch (error) {
    console.error('Error updating menu:', error);
    return res.status(500).json({ 
      success: false,
      message: 'เกิดข้อผิดพลาดในการแก้ไขเมนู'
    });
  }
});

// Delete menu
router.delete('/:id', async (req, res) => {
  try {
    await Menu.findByIdAndDelete(req.params.id);
    res.json({ message: 'Menu deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 