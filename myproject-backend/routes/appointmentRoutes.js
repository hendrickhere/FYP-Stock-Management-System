const express = require('express');
const router = express.Router();
const AppointmentController = require('../controller/appointmentController');

router.get("/allAppointments/:username", AppointmentController.getAllAppointment);

module.exports = router;