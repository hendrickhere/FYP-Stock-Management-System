const express = require('express');
const router = express.Router();
const AppointmentController = require('../controller/appointmentController');

router.get("/count", AppointmentController.getAppointmentCount);
router.get("/:username", AppointmentController.getAllAppointment);
router.post("/add", AppointmentController.insertAppointment);
router.put("/appointments/:id/", AppointmentController.updateAppointment);
router.delete("/:id", AppointmentController.deleteAppointment);

module.exports = router;