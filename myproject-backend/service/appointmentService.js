const { username } = require('../env');
const {Appointments, User, Customer, Organization} = require('../models/association');

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