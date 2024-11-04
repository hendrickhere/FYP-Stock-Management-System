import React, { useState, useEffect } from "react";
import Header from './header';
import Sidebar from './sidebar';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from './axiosConfig';
import AppointmentTable from './appointmentTable';

function Appointments() {
  return (
    <div className="flex flex-col h-screen w-full">
      <Header/> 
      <div className="flex flex-row flex-grow">
        <Sidebar />
        <MainContent />
      </div>
    </div>
  );
}

function MainContent() {
  const navigation = useNavigate();
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('http://localhost:3002/api/appointments');
      setAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteData = async (index) => {
    const confirm = window.confirm(
      "Are you sure you want to delete this appointment?"
    );
    if (confirm) {
      try {
        await axiosInstance.delete(`http://localhost:3002/api/appointments/${appointments[index].appointment_id}`);
        window.alert("Appointment successfully deleted");
        fetchData();
      } catch (error) {
        console.error('Error deleting appointment:', error);
      }
    }
  };

  const handleEditData = (index) => {
    navigation('/appointments/add_appointment', {
      state: { 
        appointmentId: appointments[index].appointment_id,
        isAdd: false,
        data: appointments[index]
      }
    });
  };

  const handleFilterChange = (event) => {
    setFilter(event.target.value);
  };

  const navigateToAddAppointmentPage = () => {
    navigation('/appointments/add_appointment', {
      state: { isAdd: true }
    });
  };

  return (
    <div className="flex-auto ml-52 p-4">
      <div className="flex flex-row">
        <h1 className="text-2xl font-bold">Appointments</h1>
        <input
          className="ml-32 mb-2 h-8 w-80 border-2 me-4 border-border-grey ps-2 rounded-lg"
          type="text"
          placeholder="Search"
          value={filter}
          onChange={handleFilterChange}
        />
      </div>
      
      <div className="flex flex-column">
        <div className="flex flex-row my-3">
          <button
            className="flex items-center mt-3 space-x-2 px-4 py-2 bg-white text-green-700 font-medium rounded-lg shadow hover:bg-green-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
            onClick={navigateToAddAppointmentPage}
          >
            <Plus className="h-5 w-5" />
            <span>Add Appointment</span>
          </button>
        </div>
      </div>

      <div className="flex-1 mt-[20px]">
        {loading && <p>Loading...</p>}
        {!loading && (
          <AppointmentTable
            appointments={appointments}
            handleDeleteData={handleDeleteData}
            handleEditData={handleEditData}
          />
        )}
      </div>
    </div>
  );
}

export default Appointments;