const { username } = require('../env');
const {Appointment, User, Customer, Organization} = require('../models/association');

exports.getAllAppointmentWithCustomersId = async (customerId) => {
    const appointments = await Appointments.findAll(
        {
            where: {
                customer_id: customerId
            }
        }
    );

    return appointments; 
}

exports.insertAppointment = async (requestBody) => {
  const { customer_id, service_type, appointment_date, time_slot, technician, status, location } = requestBody;
  try {
    const result = await Appointment.create({
      customer_id: customer_id,
      service_type: service_type,
      appointment_date: appointment_date,
      time_slot: time_slot,
      technician: technician,
      status: status,
      location: location,
    });
    const message = "Appointment created: " + result.toJSON();
    console.log(message);
    return true; 
  } catch (err) {
    console.error("Error creating appointment:", err);
    throw new err; 
  }
}

exports.getAllAppointmentWithUsername = async (username, pageNumber, pageSize) => {
    const offset = (pageNumber - 1) * pageSize;

    const user = await User.findOne({
        where: { username },
        attributes: ['organization_id'],
      });
    
      if (!user) {
        throw new Error('User not found');
      }

      const appointments = await Appointments.findAll({
        include: [
          {
            model: Customer,
            include: [
              {
                model: User,
                where: {
                  organization_id: user.organization_id,  
                },
                attributes: [],  
              },
            ],
            attributes: ['customer_id', 'customer_name'],  
          },
        ],
        limit: pageSize,
        offset: offset,
      });
    
      return appointments;
}

exports.updateAppointment = async (appointmentId, requestBody) => {
  const {
    customer_id,
    service_type,
    appointment_date,
    time_slot,
    technician,
    status,
    location,
  } = requestBody;

  try {
    const [affectedRows, updatedAppointments] = await Appointment.update(
      {
        customer_id: customer_id,
        service_type: service_type,
        appointment_date: appointment_date,
        time_slot: time_slot,
        technician: technician,
        status: status,
        location: location,
      },
      {
        where: {
          appointment_id: appointmentId,
        },
        returning: true,
      }
    );

    if (affectedRows === 0) {
      return null;
    }

    return updatedAppointments[0];
  } catch (err) {
    console.error("Error updating appointment:", error);
    throw err;
  }
};

exports.deleteAppointment = async (appointmentId) => {
  try {
    const result = await Appointment.destroy({
      where: {
        appointmentId: appointmentId,
      },
    });

    if (deletedCount === 0) {
      return false;
    }
    return true;
  } catch (err) {
    throw err;
  }
};