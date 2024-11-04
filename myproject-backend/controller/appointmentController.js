const AppointmentService = require("../service/appointmentService");

exports.getAllAppointment = async (req, res) => {
  try {
    const username = req.params.username;
    const pageNumber = req.query.pageNumber;
    const pageSize = req.query.pageSize;

    const appointmentsWithCustomers =
      await AppointmentService.getAllAppointmentWithUsername(
        username,
        pageNumber,
        pageSize
      );
    res.status(200).send({
      appointmentDetails: appointmentsWithCustomers,
      message: "Appointment retrieved successfully.",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.insertAppointment = async (req, res) => {
  try {
    const result = await AppointmentService.insertAppointment(req.body);

    if (result === true) {
      res.status(200).json({ message: "Appointment created successfully" });
    }
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
};

exports.updateAppointment = async (req, res) => {
  const appointmentId = req.params.id;

  try {
    const result = await AppointmentService.updateAppointment(
      appointmentId,
      req.body
    );

    if (result !== null) {
      res.status(200).json({ message: "Appointment updated successfully" });
    } else {
      res.status(404).json({ message: "No appointments record found" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteAppointment = async (req, res) => {
  const id = req.params.id;

  try {
    const result = await AppointmentService.deleteAppointment(id);

    if (result === true) {
      res.status(200).json({ message: "Appointment deleted successfully" });
    } else {
      res.status(404).json({ message: "No appointments found" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
