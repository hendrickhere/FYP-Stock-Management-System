import React, {useState, useEffect} from "react";
import './styles/stakeholders.css';
import Header from './header';
import Sidebar from './sidebar';
import axios from 'axios';

function Stakeholders() {
  const [view, setView] = useState('vendor');
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchData();
  }, [view]);

  const fetchData = async () => {
    try {
      const response = await axios.get(`http://localhost:3002/api/stakeholders/${view}s`);
      setData(response.data);
    } catch (error) {
      console.error("Error fetching data", error);
    }
  };

  return (
    <div className="stakeholders-container">
      <Header />
      <Sidebar />
      <MainContent view={view} setView={setView} data={data} fetchData={fetchData} />
    </div>
  )
}

function MainContent({ view, setView, data, fetchData }) {
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
    <div className="main-content-stakeholders">
      <MainContentTop />
      <MainContentAddButtons handleAdd={handleAdd} />
      <MainContentViewButtons setView={setView} />
      <ViewTable view={view} data={data} fetchData={fetchData} handleEdit={handleEdit} />
      {showModal && (
        <AddModal 
          type={modalType} 
          setShowModal={setShowModal} 
          fetchData={fetchData} 
          currentData={currentData} 
        />
      )}
    </div>
  )
}

function MainContentTop() {
  return (
    <div className="title-and-searchbox-div">
      <h2 className="stakeholders-title">Stakeholders</h2>
      <input type="text" placeholder="Search" className="search-stakeholders"></input>
    </div>
  )
}

function MainContentAddButtons({ handleAdd }) {
  return (
    <div className="add-stakeholders-buttons">
      <button className="add-vendor-button" onClick={() => handleAdd('vendor')}>Add vendor</button>
      <button className="add-customer-button" onClick={() => handleAdd('customer')}>Add customer</button>
      <button className="add-staff-button" onClick={() => handleAdd('staff')}>Add staff</button>
    </div>
  )
}

function MainContentViewButtons({ setView }) {
  return (
    <div className="view-stakeholders-buttons">
      <button className="view-vendor-button" onClick={() => setView('vendor')}>Vendor</button>
      <button className="view-customer-button" onClick={() => setView('customer')}>Customer</button>
      <button className="view-staff-button" onClick={() => setView('staff')}>Staff</button>
    </div>
  )
}

function ViewTable({ view, data, fetchData, handleEdit }) {
  return (
    <div className="display-stakeholders-div">
      {view === 'vendor' && <VendorTable data={data} fetchData={fetchData} handleEdit={handleEdit} />}
      {view === 'customer' && <CustomerTable data={data} fetchData={fetchData} handleEdit={handleEdit} />}
      {view === 'staff' && <StaffTable data={data} fetchData={fetchData} handleEdit={handleEdit} />}
    </div>
  )
}

function VendorTable({ data, fetchData, handleEdit }) {
  return (
    <div>
      <h3>Vendors</h3>
      <table>
        <thead>
          <tr>
            <th>Vendor ID</th>
            <th>Name</th>
            <th>Contact Person</th>
            <th>Phone Number</th>
            <th>Address</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map(vendor => (
            <VendorTableRow key={vendor.vendor_id} vendor={vendor} fetchData={fetchData} handleEdit={handleEdit} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CustomerTable({ data, fetchData, handleEdit }) {
  return (
    <div>
      <h3>Customers</h3>
      <table>
        <thead>
          <tr>
            <th>Customer ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Phone Number</th>
            <th>Address</th>
            <th>Registration Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map(customer => (
            <CustomerTableRow key={customer.customer_id} customer={customer} fetchData={fetchData} handleEdit={handleEdit} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StaffTable({ data, fetchData, handleEdit }) {
  return (
    <div>
      <h3>Staffs</h3>
      <table>
        <thead>
          <tr>
            <th>Staff ID</th>
            <th>Name</th>
            <th>Position</th>
            <th>Phone Number</th>
            <th>Address</th>
            <th>Hire Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map(staff => (
            <StaffTableRow key={staff.staff_id} staff={staff} fetchData={fetchData} handleEdit={handleEdit} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function VendorTableRow({ vendor, fetchData, handleEdit }) {
  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:3002/api/stakeholders/vendors/${vendor.vendor_id}`);
      fetchData();
    } catch (error) {
      console.error("Error deleting vendor", error);
    }
  };

  return (
    <tr>
      <td>{vendor.vendor_id}</td>
      <td>{vendor.name}</td>
      <td>{vendor.contact_person}</td>
      <td>{vendor.phone_number}</td>
      <td>{vendor.address}</td>
      <td>{vendor.status}</td>
      <td>
        <button onClick={() => handleEdit('vendor', vendor)}>Edit</button>
        <button onClick={handleDelete}>Delete</button>
      </td>
    </tr>
  )
}

function CustomerTableRow({ customer, fetchData, handleEdit }) {
  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:3002/api/stakeholders/customers/${customer.customer_id}`);
      fetchData();
    } catch (error) {
      console.error("Error deleting customer", error);
    }
  };

  return (
    <tr>
      <td>{customer.customer_id}</td>
      <td>{customer.name}</td>
      <td>{customer.email}</td>
      <td>{customer.phone_number}</td>
      <td>{customer.address}</td>
      <td>{customer.registration_date}</td>
      <td>{customer.status}</td>
      <td>
        <button onClick={() => handleEdit('customer', customer)}>Edit</button>
        <button onClick={handleDelete}>Delete</button>
      </td>
    </tr>
  )
}

function StaffTableRow({ staff, fetchData, handleEdit }) {
  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:3002/api/stakeholders/staffs/${staff.staff_id}`);
      fetchData();
    } catch (error) {
      console.error("Error deleting staff", error);
    }
  };

  return (
    <tr>
      <td>{staff.staff_id}</td>
      <td>{staff.name}</td>
      <td>{staff.position}</td>
      <td>{staff.phone_number}</td>
      <td>{staff.address}</td>
      <td>{staff.hire_date}</td>
      <td>{staff.status}</td>
      <td>
        <button onClick={() => handleEdit('staff', staff)}>Edit</button>
        <button onClick={handleDelete}>Delete</button>
      </td>
    </tr>
  )
}

function AddModal({ type, setShowModal, fetchData, currentData }) {
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
        await axios.put(`http://localhost:3002/api/stakeholders/${type}s/${currentData[`${type}_id`]}`, formData);
      } else {
        await axios.post(`http://localhost:3002/api/stakeholders/${type}s`, formData);
      }
      fetchData();
      setShowModal(false);
    } catch (error) {
      console.error("Error adding data", error);
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <span className="close" onClick={() => setShowModal(false)}>&times;</span>
        <h2>{currentData ? `Edit ${type}` : `Add ${type}`}</h2>
        <form onSubmit={handleSubmit}>
          {type === 'vendor' && (
            <>
              <input type="text" name="name" placeholder="Name" value={formData.name || ''} onChange={handleChange} required />
              <input type="text" name="contact_person" placeholder="Contact Person" value={formData.contact_person || ''} onChange={handleChange} required />
              <input type="text" name="phone_number" placeholder="Phone Number" value={formData.phone_number || ''} onChange={handleChange} required />
              <input type="text" name="address" placeholder="Address" value={formData.address || ''} onChange={handleChange} required />
              <select name="status" value={formData.status || ''} onChange={handleChange} required>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              </select>
            </>
          )}
          {type === 'customer' && (
            <>
              <input type="text" name="name" placeholder="Name" value={formData.name || ''} onChange={handleChange} required />
              <input type="email" name="email" placeholder="Email" value={formData.email || ''} onChange={handleChange} required />
              <input type="text" name="phone_number" placeholder="Phone Number" value={formData.phone_number || ''} onChange={handleChange} required />
              <input type="text" name="address" placeholder="Address" value={formData.address || ''} onChange={handleChange} required />
              <input type="date" name="registration_date" placeholder="Registration Date" value={formData.registration_date || ''} onChange={handleChange} required />
              <select name="status" value={formData.status || ''} onChange={handleChange} required>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              </select>
            </>
          )}
          {type === 'staff' && (
            <>
              <input type="text" name="name" placeholder="Name" value={formData.name || ''} onChange={handleChange} required />
              <input type="text" name="position" placeholder="Position" value={formData.position || ''} onChange={handleChange} required />
              <input type="text" name="phone_number" placeholder="Phone Number" value={formData.phone_number || ''} onChange={handleChange} required />
              <input type="text" name="address" placeholder="Address" value={formData.address || ''} onChange={handleChange} required />
              <input type="date" name="hire_date" placeholder="Hire Date" value={formData.hire_date || ''} onChange={handleChange} required />
              <select name="status" value={formData.status || ''} onChange={handleChange} required>
              <option value="Employed">Employed</option>
              <option value="Unemployed">Unemployed</option>
              </select>
            </>
          )}
          <button type="submit">Submit</button>
        </form>
      </div>
    </div>
  )
}

export default Stakeholders;
