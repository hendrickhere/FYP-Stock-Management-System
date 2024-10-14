import React, {useState, useEffect} from "react";
import './styles/appointments.css';
import Header from './header';
import Sidebar from './sidebar';
import axios from 'axios';

function Appointments() {
  const [showModal, setShowModal] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [currentData, setCurrentData] = useState(null);

  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:3002/api/appointments');
      setAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('http://localhost:3002/api/customers');
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers', error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchCustomers();
  }, []);

  return (
    <div className="appointments-container">
      <Header />
      <Sidebar />
      <MainContent view="appointment" data={appointments} customers={customers} fetchData={fetchData} />
    </div>
  );
}

function MainContent({ view, data, customers, fetchData }) {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [currentData, setCurrentData] = useState(null);

  const handleAdd = (type) => {
    setModalType(type);
    setCurrentData(null);
    setShowModal(true);
  };

  const handleEdit = (type, item) => {
    setModalType(type);
    setCurrentData(item);
    setShowModal(true);
  };

  return (
    <div className="main-content-appointments">
      <MainContentTop handleAdd={handleAdd} />
      <ViewTable view={view} data={data} fetchData={fetchData} handleEdit={handleEdit} />
      {showModal && (
        <AddModal
          type={modalType}
          setShowModal={setShowModal}
          fetchData={fetchData}
          currentData={currentData}
          customers={customers}
        />
      )}
    </div>
  );
}

function MainContentTop({ handleAdd }) {
  return (
    <div className="title-and-searchbox-div">
      <h2 className="appointments-title">Appointments</h2>
      <input type="text" placeholder="Search" className="search-appointments"></input>
      <button className="add-appointment-button" onClick={() => handleAdd('appointment')}>Add appointment</button>
    </div>
  );
}

function ViewTable({ view, data, fetchData, handleEdit }) {
  return (
    <div className="display-appointments-div">
      {view === 'appointment' && <AppointmentTable data={data} fetchData={fetchData} handleEdit={handleEdit} />}
    </div>
  );
}

function AppointmentTable({ data, fetchData, handleEdit }) {
  return (
    <div>
      <h3>List of appointments</h3>
      <table>
        <thead>
          <tr>
            <th>Appointment ID</th>
            <th>Customer Name</th>
            <th>Email</th>
            <th>Phone Number</th>
            <th>Service Type</th>
            <th>Appointment Date</th>
            <th>Time Slot</th>
            <th>Technician</th>
            <th>Location</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map(appointment => (
            <AppointmentTableRow key={appointment.appointment_id} appointment={appointment} fetchData={fetchData} handleEdit={handleEdit} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AppointmentTableRow({ appointment, fetchData, handleEdit }) {
  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:3002/api/appointments/${appointment.appointment_id}`);
      fetchData();
    } catch (error) {
      console.error("Error deleting appointment", error);
    }
  };

  return (
    <tr>
      <td>{appointment.appointment_id}</td>
      <td>{appointment.name}</td>
      <td>{appointment.email}</td>
      <td>{appointment.phone_number}</td>
      <td>{appointment.service_type}</td>
      <td>{appointment.appointment_date}</td>
      <td>{appointment.time_slot}</td>
      <td>{appointment.technician}</td>
      <td>{appointment.location}</td>
      <td>{appointment.status}</td>
      <td>
        <button onClick={() => handleEdit('appointment', appointment)}>Edit</button>
        <button onClick={handleDelete}>Delete</button>
      </td>
    </tr>
  );
}

function AddModal({ type, setShowModal, fetchData, currentData, customers }) {
  const [formData, setFormData] = useState(currentData || {});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentData) {
        await axios.put(`http://localhost:3002/api/appointments/${currentData.appointment_id}`, formData);
      } else {
        await axios.post('http://localhost:3002/api/appointments', formData);
      }
      fetchData();
      setShowModal(false);
    } catch (error) {
      console.error("Error submitting form", error);
    }
  };

  useEffect(() => {
    console.log('Current Data:', currentData);
  }, [currentData]);

  return (
    <div className="modal">
      <div className="modal-content">
        <span className="close" onClick={() => setShowModal(false)}>&times;</span>
        <h3>{currentData ? 'Edit' : 'Add'} Appointment</h3>
        <form onSubmit={handleSubmit}>
          <select name="customer_id" value={formData.customer_id || ''} onChange={handleChange} required>
            <option value="">Select Customer</option>
            {customers.map(customer => (
              <option key={customer.customer_id} value={customer.customer_id}>
                {customer.name}
              </option>
            ))}
          </select>
          <input type="text" name="service_type" placeholder="Service Type" value={formData.service_type || ''} onChange={handleChange} required />
          <input type="date" name="appointment_date" placeholder="Appointment Date" value={formData.appointment_date || ''} onChange={handleChange} required />
          <input type="text" name="time_slot" placeholder="Time Slot" value={formData.time_slot || ''} onChange={handleChange} required />
          <input type="text" name="technician" placeholder="Technician" value={formData.technician || ''} onChange={handleChange} required />
          <input type="text" name="location" placeholder="Location" value={formData.location || ''} onChange={handleChange} required />
          <input type="text" name="status" placeholder="Status" value={formData.status || ''} onChange={handleChange} required />
          <button type="submit">Submit</button>
        </form>
      </div>
    </div>
  );
}

export default Appointments;
