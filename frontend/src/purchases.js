import React, {useState, useEffect} from "react";
import './styles/purchases.css';
import Header from './header';
import Sidebar from './sidebar';

function Purchases() {
  const [orders, setOrders] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [newOrder, setNewOrder] = useState({
    vendor_name: '',
    order_date: '',
    itemsOrdered: [{ product_id: '', quantity: 1, unit_price: 0, tax: 0, discount: 0, unit_of_measure: '', total_price: 0, notes: '' }],
    total_amount: '',
    status: 'Pending',
    delivered_date: ''
  });
  const [editMode, setEditMode] = useState(false);
  const [currentPoNo, setCurrentPoNo] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3002/api/products')
      .then(response => response.json())
      .then(data => setProducts(data))
      .catch(error => {
        console.error('Error fetching products:', error);
        setProducts([]);
      });

    fetch('http://localhost:3002/api/stakeholders/vendors')
      .then(response => response.json())
      .then(data => setVendors(data))
      .catch(error => {
        console.error('Error fetching vendors:', error);
        setVendors([]);
      });

    fetch('http://localhost:3002/api/purchases')
      .then(response => response.json())
      .then(data => {
        setOrders(data);
      })
      .catch(error => {
        console.error('Error fetching orders:', error);
        setOrders([]);
      });
  }, []);

  const handleAddOrder = () => {
    setIsModalOpen(true);
    setEditMode(false);
    setNewOrder({
      vendor_name: '',
      order_date: '',
      itemsOrdered: [{ product_id: '', quantity: 1, unit_price: 0, tax: 0, discount: 0, unit_of_measure: '', total_price: 0, notes: '' }],
      total_amount: '',
      status: 'Pending',
      delivered_date: ''
    });
  };

  const handleEdit = (order) => {
    const formattedOrder = {
      ...order,
      order_date: formatDate(order.order_date),
      delivered_date: formatDate(order.delivered_date),
    };
    setNewOrder(formattedOrder);
    setCurrentPoNo(order.po_no);
    setIsModalOpen(true);
    setEditMode(true);
  };

  const handleDelete = async (po_no) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await fetch(`http://localhost:3002/api/purchases/${po_no}`, { method: 'DELETE' });
        setOrders(orders.filter(order => order.po_no !== po_no));
        alert("Order deleted successfully")
      } catch (error) {
        console.error('Error deleting order:', error);
        alert("Error occurred")
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewOrder({ ...newOrder, [name]: value });
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const itemsOrdered = [...newOrder.itemsOrdered];
    itemsOrdered[index][name] = value;
    itemsOrdered[index].total_price = calculateTotalPrice(itemsOrdered[index]);
    setNewOrder({ ...newOrder, itemsOrdered });
  };

  const calculateTotalPrice = (item) => {
    return ((item.unit_price * item.quantity) + (item.tax) - (item.discount)).toFixed(2);
  };

  const handleAddItem = () => {
    setNewOrder({ ...newOrder, itemsOrdered: [...newOrder.itemsOrdered, { product_id: '', quantity: 1, unit_price: 0, tax: 0, discount: 0, unit_of_measure: '', total_price: 0, notes: '' }] });
  };

  const handleRemoveItem = (index) => {
    const itemsOrdered = [...newOrder.itemsOrdered];
    itemsOrdered.splice(index, 1);
    setNewOrder({ ...newOrder, itemsOrdered });
  };

  const handleConfirmOrder = () => {
    const totalAmount = newOrder.itemsOrdered.reduce((total, item) => total + parseFloat(item.total_price), 0).toFixed(2);
    const orderData = { ...newOrder, total_amount: totalAmount };

    const url = editMode ? `http://localhost:3002/api/purchases/${currentPoNo}` : 'http://localhost:3002/api/purchases';
    const method = editMode ? 'PUT' : 'POST';

    fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    })
    .then(response => response.json())
    .then(createdOrder => {
      const po_no = createdOrder.po_no || currentPoNo;
      const itemsData = newOrder.itemsOrdered.map(item => ({ ...item, purchase_order_id: po_no }));

      return fetch(`http://localhost:3002/api/purchase-items/${po_no}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemsOrdered: itemsData }),
      });
    })
    .then(response => response.json())
    .then(() => {
      if (editMode) {
        setOrders(orders.map(order => (order.po_no === currentPoNo ? { ...newOrder, po_no: currentPoNo, itemsOrdered: newOrder.itemsOrdered } : order)));
      } else {
        setOrders([...orders, { ...newOrder, po_no: orderData.po_no, itemsOrdered: newOrder.itemsOrdered }]);
      }
      setNotification({ message: `Purchase order successfully ${editMode ? 'updated' : 'placed'}!`, type: 'success' });
      setNewOrder({
        vendor_name: '',
        order_date: '',
        itemsOrdered: [{ product_id: '', quantity: 1, unit_price: 0, tax: 0, discount: 0, unit_of_measure: '', total_price: 0, notes: '' }],
        total_amount: '',
        status: 'Pending',
        delivered_date: ''
      });
      setIsModalOpen(false);
      setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    })
    .catch(error => {
      console.error('Error adding purchase:', error);
      setNotification({ message: 'Failed to place purchase order.', type: 'error' });
      setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (`0${date.getMonth() + 1}`).slice(-2);
    const day = (`0${date.getDate()}`).slice(-2);
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="purchases-container">
      <Header />
      <Sidebar />
      <MainContent 
        orders={orders} 
        handleAddOrder={handleAddOrder} 
        handleEdit={handleEdit}
        handleDelete={handleDelete}
        isModalOpen={isModalOpen} 
        handleCloseModal={handleCloseModal} 
        handleInputChange={handleInputChange} 
        handleConfirmOrder={handleConfirmOrder} 
        newOrder={newOrder} 
        handleItemChange={handleItemChange}
        handleAddItem={handleAddItem}
        handleRemoveItem={handleRemoveItem}
        products={products}
        vendors={vendors}
        notification={notification}
        formatDate={formatDate}
      />
    </div>
  );
}

function MainContent({ orders, handleAddOrder, handleEdit, handleDelete, isModalOpen, handleCloseModal, handleInputChange, handleConfirmOrder, newOrder, handleItemChange, handleAddItem, handleRemoveItem, products, vendors, notification, formatDate }) {
  return (
    <div className="main-content-purchases">
      <MainContentTop />
      <MainContentMiddle handleAddOrder={handleAddOrder} />
      <MainContentBottom orders={orders} products={products} formatDate={formatDate} handleEdit={handleEdit} handleDelete={handleDelete} />
      {isModalOpen && 
        <OrderModal 
          handleCloseModal={handleCloseModal} 
          handleInputChange={handleInputChange} 
          handleConfirmOrder={handleConfirmOrder} 
          newOrder={newOrder} 
          handleItemChange={handleItemChange}
          handleAddItem={handleAddItem}
          handleRemoveItem={handleRemoveItem}
          products={products}
          vendors={vendors}
        />
      }
      {notification.message && <Notification message={notification.message} type={notification.type} />}
    </div>
  );
}

function MainContentTop() {
  return(
    <div className="title-and-searchbox-div">
      <h2 className="purchases-title">Purchases</h2>
      <input type="text" placeholder="Search" className="search-purchases"></input>
    </div>
  )
}

function MainContentMiddle({ handleAddOrder }) {
  return(
    <div className="action-buttons-div">
      <button className="add-purchases" onClick={handleAddOrder}>Add order</button>
    </div>
  )
}

function MainContentBottom({ orders, products, formatDate, handleEdit, handleDelete }) {
  return(
    <div className="display-purchases-div">
      <h3>Purchase Orders</h3>
      <table className="purchases-display-table">
        <TableHeader />
        <TableBody orders={orders} products={products} formatDate={formatDate} handleEdit={handleEdit} handleDelete={handleDelete} />
      </table>
    </div>
  )
}

function TableHeader() {
  return (
    <thead>
      <tr>
        <th>PO no.</th>
        <th>Vendor Name</th>
        <th>Order Date</th>
        <th>Items ordered</th>
        <th>Total Amount(RM)</th>
        <th>Status</th>
        <th>Delivered Date</th>
        <th>Actions</th>
      </tr>
    </thead>
  );
}

function TableRow({ order, products, formatDate, handleEdit, handleDelete }) {
  const itemsOrdered = order.itemsOrdered.map(item => {
    const product = products.find(p => p.product_id === item.product_id);
    return product ? `${item.quantity} ${product.name}` : `${item.quantity} Item`;
  }).join(', ');

  return (
    <tr>
      <td>{order.po_no}</td>
      <td>{order.vendor_name}</td>
      <td>{formatDate(order.order_date)}</td>
      <td>{itemsOrdered}</td>
      <td>{order.total_amount}</td>
      <td>{order.status}</td>
      <td>{formatDate(order.delivered_date)}</td>
      <td>
        <button onClick={() => handleEdit(order)}>Edit</button>
        <button onClick={() => handleDelete(order.po_no)}>Delete</button>
      </td>
    </tr>
  );
}

function TableBody({ orders, products, formatDate, handleEdit, handleDelete }) {
  return (
    <tbody>
      {orders.map(order => (
        <TableRow 
          key={order.po_no} 
          order={order} 
          products={products}
          formatDate={formatDate}
          handleEdit={handleEdit} 
          handleDelete={handleDelete} 
        />
      ))}
    </tbody>
  );
}

function OrderModal({ handleCloseModal, handleConfirmOrder, newOrder, handleInputChange, handleAddItem, handleItemChange, handleRemoveItem, vendors, products }) {
  return (
    <div className="modal">
      <div className="modal-content">
        <h2>{newOrder.po_no ? 'Edit Order' : 'Add New Order'}</h2>
        <label>Vendor</label>
        <select name="vendor_name" value={newOrder.vendor_name} onChange={handleInputChange}>
          <option value="">Select Vendor</option>
          {vendors.map(vendor => (
            <option key={vendor.vendor_id} value={vendor.name}>
              {vendor.name}
            </option>
          ))}
        </select>
        <label>Order Date</label>
        <input type="date" name="order_date" value={newOrder.order_date} onChange={handleInputChange} />
        <label>Status</label>
        <select name="status" value={newOrder.status} onChange={handleInputChange}>
          <option value="Pending">Pending</option>
          <option value="Received">Received</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <label>Delivered Date</label>
        <input type="date" name="delivered_date" value={newOrder.delivered_date} onChange={handleInputChange} />
        <label>Items Ordered</label>
        {newOrder.itemsOrdered.map((item, index) => (
          <div key={index}>
            <select name="product_id" value={item.product_id} onChange={(e) => handleItemChange(index, e)}>
              <option value="">Select Product</option>
              {products.map(product => (
                <option key={product.product_id} value={product.product_id}>
                  {product.name}
                </option>
              ))}
            </select>
            <label>Quantity</label>
            <input type="number" name="quantity" value={item.quantity} onChange={(e) => handleItemChange(index, e)} />
            <label>Unit Price</label>
            <input type="number" name="unit_price" value={item.unit_price} onChange={(e) => handleItemChange(index, e)} />
            <label>Tax</label>
            <input type="number" name="tax" value={item.tax} onChange={(e) => handleItemChange(index, e)} />
            <label>Discount</label>
            <input type="number" name="discount" value={item.discount} onChange={(e) => handleItemChange(index, e)} />
            <label>Unit of Measure</label>
            <input type="text" name="unit_of_measure" value={item.unit_of_measure} onChange={(e) => handleItemChange(index, e)} />
            <label>Total Price</label>
            <input type="number" name="total_price" value={item.total_price} readOnly />
            <label>Notes</label>
            <textarea name="notes" value={item.notes} onChange={(e) => handleItemChange(index, e)}></textarea>
            <button onClick={() => handleRemoveItem(index)}>Remove</button>
          </div>
        ))}
        <button onClick={handleAddItem}>Add Item</button>
        <button onClick={handleCloseModal}>Cancel</button>
        <button onClick={handleConfirmOrder}>Confirm</button>
      </div>
    </div>
  );
}

function Notification({ message, type }) {
  return (
    <div className={`notification ${type}`}>
      {message}
    </div>
  );
}

export default Purchases;
