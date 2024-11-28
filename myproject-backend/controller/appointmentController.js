const AppointmentService = require("../service/appointmentService");

exports.getAllAppointment = async (req, res) => {
  try {
    const username = req.params.username;
    const pageNumber = parseInt(req.query.pageNumber) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    const appointmentsWithCustomers = await AppointmentService.getAllAppointmentWithUsername(
      username,
      pageNumber,
      pageSize
    );

    console.log('Appointments retrieved:', JSON.stringify(appointmentsWithCustomers, null, 2));

    res.status(200).send({
      appointmentDetails: appointmentsWithCustomers,
      message: "Appointments retrieved successfully."
    });
  } catch (err) {
    console.error('Error in getAllAppointment:', err);
    res.status(500).json({ error: err.message });
  }
};
exports.getAppointmentCount = async (req, res) => {
  try {
    const {username} = req.query;

    if(!username){
      return res.status(400).json({message: "Username cannot be empty!"});
    }

    const totalCount = await AppointmentService.getAppointmentCount(username);

    res.status(200).json({message: "Appointment count retrieved successfully", data: totalCount});
  } catch(err) {
    
  }
}
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
