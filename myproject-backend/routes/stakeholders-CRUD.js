const express = require('express');
const router = express.Router();
const pool = require('../database');

// Create a new vendor
router.post('/vendors', async (req, res) => {
    try {
        const { name, contact_person, phone_number, address, status } = req.body;
        const newVendor = await pool.query(
            "INSERT INTO vendor (vendor_id, name, contact_person, phone_number, address, status) VALUES('V' || LPAD(NEXTVAL('vendor_id_seq')::TEXT, 3, '0'), $1, $2, $3, $4, $5) RETURNING *",
            [name, contact_person, phone_number, address, status]
        );
        res.json(newVendor.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

// Fetch all vendors
router.get('/vendors', async (req, res) => {
    try {
        const allVendors = await pool.query("SELECT * FROM vendor");
        res.json(allVendors.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

// Fetch a single vendor by ID
router.get('/vendors/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const vendor = await pool.query("SELECT * FROM vendor WHERE vendor_id = $1", [id]);
        res.json(vendor.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

// Update a vendor
router.put('/vendors/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, contact_person, phone_number, address, status } = req.body;
        await pool.query(
            "UPDATE vendor SET name = $1, contact_person = $2, phone_number = $3, address = $4, status = $5 WHERE vendor_id = $6",
            [name, contact_person, phone_number, address, status, id]
        );
        res.json("Vendor updated successfully");
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

// Delete a vendor
router.delete('/vendors/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM vendor WHERE vendor_id = $1", [id]);
        res.json("Vendor deleted successfully");
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

// Create a new customer
router.post('/customers', async (req, res) => {
    try {
        const { name, email, phone_number, address, registration_date, status } = req.body;
        const newCustomer = await pool.query(
            "INSERT INTO customer (customer_id, name, email, phone_number, address, registration_date, status) VALUES('CU' || LPAD(NEXTVAL('customer_id_seq')::TEXT, 3, '0'), $1, $2, $3, $4, $5, $6) RETURNING *",
            [name, email, phone_number, address, registration_date, status]
        );
        res.json(newCustomer.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Fetch customers
router.get('/customers', async (req, res) => {
    try {
        const allCustomers = await pool.query("SELECT * FROM customer");
        res.json(allCustomers.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Update a customer
router.put('/customers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone_number, address, registration_date, status } = req.body;
        await pool.query(
            "UPDATE customer SET name = $1, email = $2, phone_number = $3, address = $4, registration_date = $5, status = $6 WHERE customer_id = $7",
            [name, email, phone_number, address, registration_date, status, id]
        );
        res.json("Customer updated successfully");
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

// Delete a customer
router.delete('/staffs/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM customer WHERE customer_id = $1", [id]);
        res.json("Customer deleted successfully");
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

// Create a new staff
router.post('/staffs', async (req, res) => {
    try {
        const { name, position, phone_number, address, hire_date, status } = req.body;
        const newStaff = await pool.query(
            "INSERT INTO staff (staff_id, name, position, phone_number, address, hire_date, status) VALUES('S' || LPAD(NEXTVAL('customer_id_seq')::TEXT, 3, '0'), $1, $2, $3, $4, $5, $6) RETURNING *",
            [name, position, phone_number, address, hire_date, status]
        );
        res.json(newStaff.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Fetch staffs
router.get('/staffs', async (req, res) => {
    try {
        const allStaffs = await pool.query("SELECT * FROM staff");
        res.json(allStaffs.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Update a staff
router.put('/staffs/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, position, phone_number, address, hire_date, status } = req.body;
        await pool.query(
            "UPDATE staff SET name = $1, position = $2, phone_number = $3, address = $4, hire_date = $5, status = $6 WHERE staff_id = $7",
            [name, position, phone_number, address, hire_date, status, id]
        );
        res.json("Staff updated successfully");
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

// Delete a staff
router.delete('/staffs/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM staff WHERE staff_id = $1", [id]);
        res.json("Staff deleted successfully");
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

module.exports = router;
