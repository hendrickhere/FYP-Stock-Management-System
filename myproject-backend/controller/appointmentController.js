const UserService = require("../service/userService");
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
