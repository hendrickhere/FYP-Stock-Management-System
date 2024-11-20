const { username } = require('../config/env');
const {Appointment, User, Customer, Organization} = require('../models');
const { v4: uuidv4 } = require('uuid');
const StakeholderService = require("../service/stakeholderService");

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
  const { customerUUID, serviceType, appointmentDate, timeSlot, status, username } = requestBody;
  const customers = await StakeholderService.getCustomer(customerUUID, username)

  try {
    const result = await Appointment.create({
      appointment_sn: uuidv4(),
      customer_id: customers.customer_id,
      service_type: serviceType,
      appointment_date: appointmentDate,
      time_slot: timeSlot,
      status: status,
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

  try {
    const user = await User.findOne({
      where: { username },
      attributes: ['organization_id'],
    });

    if (!user) {
      throw new Error('User not found');
    }

    const appointments = await Appointment.findAll({
      include: [
        {
          model: Customer,
          required: true, 
          include: [
            {
              model: User,
              where: {
                organization_id: user.organization_id,
              },
              required: true,
              attributes: []
            }
          ],
          attributes: ['customer_id', 'customer_name', 'customer_email', 'customer_contact']
        }
      ],
      attributes: [
        'appointment_id',
        'appointment_sn',
        'service_type',
        'appointment_date',
        'time_slot',
        'status'
      ],
      limit: pageSize,
      offset: offset,
      order: [['appointment_id', 'DESC']]
    });

    return appointments;
  } catch (error) {
    console.error('Error fetching appointments:', error);
    throw error;
  }
};

exports.updateAppointment = async (appointmentId, requestBody) => {
  const {
    customer_id,
    service_type,
    appointment_date,
    time_slot,
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
        appointment_id: appointmentId, 
      },
    });

    if (result === 0) { 
      return false;
    }
    return true;
  } catch (err) {
    throw err;
  }
};