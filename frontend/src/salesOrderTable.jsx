import React, { useState } from 'react';
import { FaTrashAlt, FaEdit, FaEllipsisV } from 'react-icons/fa';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import './salesTable.css'


const SalesTable = (props) => {
    const {salesOrders} = props;
    const [expandedRows, setExpandedRows] = useState({});

  const toggleRow = (salesOrderId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [salesOrderId]: !prev[salesOrderId],
    }));
  };
  return (
    <div className="container mx-auto p-4 flex flex-col">
      <h2 className="text-2xl font-bold mb-4">Sales Orders</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-md">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-2 text-left">View Products</th>
              <th className="px-4 py-2 text-left"></th>
              <th className="px-4 py-2 text-left">Sales Order ID</th>
              <th className="px-4 py-2 text-left">Order Date Time</th>
              <th className="px-4 py-2 text-left">Expected Shipment Date</th>
              <th className="px-4 py-2 text-left">Shipping Address</th>
              <th className="px-4 py-2 text-left">Total</th>
              <th className="px-4 py-2 text-left">Customer</th>
              <th className="px-4 py-2 text-left"> </th>
            </tr>
          </thead>
          <tbody>
            {salesOrders.salesOrders.map((salesOrder, _) => (
              <React.Fragment key={salesOrder.sales_order_id}>
                <tr key={salesOrder.id} className="border-b hover:bg-gray-100">
                  <td className="px-4 py-2">
                    <button
                      className="flex justify-center item-center content-center bg-[#DC2626] hover:text-[#DC2626] w-20 h-12"
                      onClick={() => toggleRow(salesOrder.sales_order_id)}
                    >
                      <span>
                        {expandedRows[salesOrder.sales_order_id] ? "▲" : "▼"}
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-2">
                    <input type="radio" name="selectedProduct" />
                  </td>
                  <td className="px-4 py-2">{salesOrder.sales_order_uuid}</td>
                  <td className="px-4 py-2">{salesOrder.order_date_time}</td>
                  <td className="px-4 py-2">
                    {salesOrder.expected_shipment_date}
                  </td>
                  <td className="px-4 py-2">
                    {salesOrder.customer.shipping_address}
                  </td>
                  <td className="px-4 py-2">{salesOrder.total_price}</td>
                  <td className="px-4 py-2">
                    {salesOrder.customer.customer_designation +
                      " " +
                      salesOrder.customer.customer_name}
                  </td>
                </tr>
                <TransitionGroup component={null}> 
                  {expandedRows[salesOrder.sales_order_id] && (
                  <CSSTransition
                  key={salesOrder.sales_order_id}
                  timeout={300}
                  classNames="dropdown">
                 
                
                  <tr>
                    <td colSpan="6" className="px-4 py-2">
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <h3 className="text-lg font-bold mb-2">
                          Products in Order
                        </h3>
                        <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-md">
                          <thead>
                            <tr className="border-b">
                              <th className="px-4 py-2 text-left">
                                Product ID
                              </th>
                              <th className="px-4 py-2 text-left">
                                Product Name
                              </th>
                              <th className="px-4 py-2 text-left">Quantity</th>
                              <th className="px-4 py-2 text-left">Price</th>
                              <th className="px-4 py-2 text-left">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {salesOrder.inventories.map((product) => (
                              <tr
                                key={product.inventory_id}
                                className="border-b hover:bg-gray-100"
                              >
                                <td className="px-4 py-2">
                                  {product.inventory_id}
                                </td>
                                <td className="px-4 py-2">
                                  {product.inventory_name}
                                </td>
                                <td className="px-4 py-2">
                                  {product.sales_order_inventory.quantity}
                                </td>
                                <td className="px-4 py-2">
                                  {product.sales_order_inventory.price}
                                </td>
                                <td className="px-4 py-2">
                                  {product.sales_order_inventory.price * product.sales_order_inventory.quantity}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                  </CSSTransition>
                )}</TransitionGroup>
                
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalesTable;
