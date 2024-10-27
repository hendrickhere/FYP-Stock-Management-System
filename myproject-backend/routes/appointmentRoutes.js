const express = require('express');
const router = express.Router();
const AppointmentController = require('../controller/appointmentController');

router.get("/appointments/:username", AppointmentController.getAllAppointment);
router.post("/appointments/add", AppointmentController.insertAppointment);
router.put("/appointments/:id/", AppointmentController.updateAppointment);
router.delete("/appointment/:id", AppointmentController.deleteAppointment);

module.exports = router;