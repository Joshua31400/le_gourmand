const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');

router.post('/upload-image', upload.single('picture'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'No file uploaded'
        });
    }

    const folder = req.query.folder || 'profile';

    res.json({
        success: true,
        filename: req.file.filename,
        path: `/assets/${folder}/${req.file.filename}`
    });
});

module.exports = router;