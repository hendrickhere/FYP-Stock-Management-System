const express = require('express');
const pool = require('../database'); 

const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM product');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error.message);
    res.status(500).send({ message: 'Server error', error: error.message });
  }
});

module.exports = router;