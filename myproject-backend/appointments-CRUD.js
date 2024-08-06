const express = require('express');
const pool = require('./database');
const router = express.Router();

// Get all appointments
router.get('/appointments', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                a.appointment_id, 
                a.customer_id, 
                c.name, 
                c.email, 
                c.phone_number,
                a.service_type, 
                a.appointment_date, 
                a.time_slot, 
                a.technician, 
                a.status, 
                a.location
            FROM 
                appointment a
            JOIN 
                customer c ON a.customer_id = c.customer_id
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching appointments:', err);
        res.status(500).json({ error: 'Error fetching appointments' });
    }
});

// Create a new appointment
router.post('/appointments', async (req, res) => {
    const { customer_id, service_type, appointment_date, time_slot, technician, status, location } = req.body;
    try {
        const result = await pool.query(`
            INSERT INTO appointment (customer_id, service_type, appointment_date, time_slot, technician, status, location)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [customer_id, service_type, appointment_date, time_slot, technician, status, location]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating appointment:', err);
        res.status(500).json({ error: 'Error creating appointment' });
    }
});

// Get all customers
router.get('/customers', async (req, res) => {
    try {
        const result = await pool.query(`SELECT customer_id, name FROM customer`);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching customers', error);
        res.status(500).send('Error fetching customers');
    }
});

// Update an appointment
router.put('/appointments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { customer_id, service_type, appointment_date, time_slot, technician, status, location } = req.body;
        const result = await pool.query(
            `UPDATE appointment SET customer_id = $1, service_type = $2, appointment_date = $3, time_slot = $4, technician = $5, status = $6, location = $7
            WHERE appointment_id = $8 RETURNING *`,
            [customer_id, service_type, appointment_date, time_slot, technician, status, location, id]
        );
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error updating appointment', error);
        res.status(500).send('Error updating appointment');
    }
});

// Delete an appointment
router.delete('/appointments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query(`DELETE FROM appointment WHERE appointment_id = $1`, [id]);
        res.status(200).send('Appointment deleted');
    } catch (error) {
        console.error('Error deleting appointment', error);
        res.status(500).send('Error deleting appointment');
    }
});

module.exports = router;
