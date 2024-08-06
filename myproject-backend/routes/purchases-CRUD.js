const express = require('express');
const router = express.Router();
const pool = require('../database');

// Add new purchase order
router.post('/', async (req, res) => {
  try {
    const { vendor_name, order_date, itemsOrdered, total_amount, status, delivered_date } = req.body;

    if (!itemsOrdered || !Array.isArray(itemsOrdered)) {
      throw new Error("Invalid or missing 'itemsOrdered' array");
    }

    const client = await pool.connect();

    const result = await client.query(
      'INSERT INTO purchase_order (vendor_name, order_date, total_amount, status, delivered_date) VALUES ($1, $2, $3, $4, $5) RETURNING po_no',
      [vendor_name, order_date, total_amount, status, delivered_date]
    );

    const po_no = result.rows[0].po_no;

    const itemsQueries = itemsOrdered.map(item => {
      return client.query(
        'INSERT INTO purchase_order_item (purchase_order_id, product_id, quantity, unit_price, tax, discount, unit_of_measure, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [po_no, item.product_id, item.quantity, item.unit_price, item.tax, item.discount, item.unit_of_measure, item.notes]
      );
    });

    await Promise.all(itemsQueries);

    client.release();
    res.status(201).json({ po_no });
  } catch (error) {
    console.error('Error creating purchase order:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// Fetch all purchase orders with their items
router.get('/', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM purchase_order');
    const purchaseOrders = result.rows;

    const ordersWithItems = await Promise.all(purchaseOrders.map(async (order) => {
      const itemsResult = await client.query(
        'SELECT * FROM purchase_order_item WHERE purchase_order_id = $1',
        [order.po_no]
      );
      return { ...order, itemsOrdered: itemsResult.rows };
    }));

    client.release();
    res.status(200).json(ordersWithItems);
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// Endpoint to delete a purchase order
router.delete('/:id', async (req, res) => {
  try {
    const po_no = req.params.id;
    await pool.query('DELETE FROM purchase_order_item WHERE purchase_order_id = $1', [po_no]);
    await pool.query('DELETE FROM purchase_order WHERE po_no = $1', [po_no]);
    res.status(200).json({ message: 'Purchase order deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// Update purchase order and items together
router.put('/:id', async (req, res) => {
  const po_no = req.params.id;
  const { vendor_name, order_date, total_amount, status, delivered_date, itemsOrdered } = req.body;

  try {
    const client = await pool.connect();

    // Begin transaction
    await client.query('BEGIN');

    // Update purchase order
    await client.query(
      'UPDATE purchase_order SET vendor_name = $1, order_date = $2, total_amount = $3, status = $4, delivered_date = $5 WHERE po_no = $6',
      [vendor_name, order_date, total_amount, status, delivered_date, po_no]
    );

    // Delete existing items for the given purchase order
    await client.query('DELETE FROM purchase_order_item WHERE purchase_order_id = $1', [po_no]);

    // Insert updated items
    for (let item of itemsOrdered) {
      const { product_id, quantity, unit_price, tax, discount, unit_of_measure, total_price, notes } = item;
      await client.query(
        'INSERT INTO purchase_order_item (purchase_order_id, product_id, quantity, unit_price, tax, discount, unit_of_measure, total_price, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [po_no, product_id, quantity, unit_price, tax, discount, unit_of_measure, total_price, notes]
      );
    }

    // Commit transaction
    await client.query('COMMIT');
    client.release();

    res.status(200).json({ message: 'Purchase order and items updated successfully' });
  } catch (err) {
    // Rollback transaction in case of error
    await pool.query('ROLLBACK');
    console.error('Error updating purchase order and items:', err.message);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});

module.exports = router;
