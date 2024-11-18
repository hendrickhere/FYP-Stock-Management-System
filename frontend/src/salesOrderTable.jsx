import React, { useState, useEffect } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { ChevronDown, ChevronUp } from 'lucide-react';
import SalesOrderModal from './salesOrderInfoModal';

const SalesTable = ({ salesOrders }) => {
   const [selectedOrders, setSelectedOrders] = useState([]);
   const [selectedOrder, setSelectedOrder] = useState(null);
   
   // Debug effect for incoming data
   useEffect(() => {
       console.log('Raw salesOrders prop:', salesOrders);
       if (salesOrders?.salesOrders) {
           salesOrders.salesOrders.forEach((order, index) => {
               console.log(`Order ${index}:`, {
                   id: order.sales_order_uuid,
                   rawCustomer: order.customer,
                   customerName: order.customer?.customer_name
               });
           });
       }
   }, [salesOrders]);

   const orders = React.useMemo(() => {
       const orderArray = Array.isArray(salesOrders?.salesOrders) ? salesOrders.salesOrders : [];
       console.log('Processed orders:', orderArray);
       return orderArray;
   }, [salesOrders]);

   const handleRowClick = (order) => {
       console.log('Clicked order:', order);
       setSelectedOrder(order);
   };

   const toggleSelectOrder = (orderId) => {
       setSelectedOrders(prev => 
           prev.includes(orderId) 
               ? prev.filter(id => id !== orderId)
               : [...prev, orderId]
       );
   };

   const toggleSelectAll = () => {
       setSelectedOrders(
           selectedOrders.length === orders.length 
               ? [] 
               : orders.map(order => order.sales_order_uuid)
       );
   };

   const formatDate = (dateString) => {
       if (!dateString) return 'N/A';
       try {
           const parsedDate = parseISO(dateString);
           return isValid(parsedDate) 
               ? format(parsedDate, "MMM dd, yyyy hh:mm a")
               : 'N/A';
       } catch (error) {
           console.error('Date formatting error:', error);
           return 'N/A';
       }
   };

    const formatAddress = (customer, order) => {
        // First check if shipping is required based on order details
        if (!order.expected_shipment_date || order.delivery_method === 'N/A') {
            return 'No shipping required';
        }

        // Only proceed to show address if shipping is required
        if (!customer) return 'N/A';
        const address = customer.shipping_address;
        return address?.trim() || 'Address not provided';
    };

    const formatCustomerName = (customer) => {
        console.log('Formatting customer name for:', customer);
        if (!customer) {
            console.warn('No customer data provided for formatting');
            return 'N/A';
        }

        try {
            // Just use the customer name without designation
            const name = customer.customer_name || '';
            console.log('Formatted customer name:', name);
            return name || 'Unnamed Customer';
        } catch (error) {
            console.error('Error formatting customer name:', error);
            return 'Error displaying customer';
        }
    };

   const formatShipmentDate = (date, deliveryMethod) => {
       if (deliveryMethod === 'N/A') return 'No shipping required';
       return formatDate(date);
   };

   return (
       <div className="container mr-auto ml-0 p-4 flex flex-col">
           <div className="flex justify-between items-center mb-4">
               <h2 className="text-2xl font-bold">Sales List</h2>
               {selectedOrders.length > 0 && (
                   <span className="text-sm text-gray-600">
                       {selectedOrders.length} orders selected
                   </span>
               )}
           </div>
           <div className="overflow-x-auto">
               <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-md">
                   <thead>
                       <tr className="bg-gray-50">
                           <th className="px-4 py-2 text-left w-16">
                               <input
                                   type="checkbox"
                                   checked={selectedOrders.length === orders.length && orders.length > 0}
                                   onChange={toggleSelectAll}
                                   className="rounded border-gray-300"
                               />
                           </th>
                           <th className="px-4 py-2 text-left">Sales Order ID</th>
                           <th className="px-4 py-2 text-left">Order Date Time</th>
                           <th className="px-4 py-2 text-left">Expected Shipment Date</th>
                           <th className="px-4 py-2 text-left">Shipping Address</th>
                           <th className="px-4 py-2 text-right">Total</th>
                           <th className="px-4 py-2 text-left">Customer</th>
                       </tr>
                   </thead>
                   <tbody>
                       {orders.map((order) => {
                           console.log('Rendering order row:', order);
                           return (
                               <tr 
                                   key={order.sales_order_uuid}
                                   onClick={() => handleRowClick(order)}
                                   className="border-b hover:bg-gray-50 transition-colors cursor-pointer"
                               >
                                   <td className="px-4 py-2" onClick={e => e.stopPropagation()}>
                                       <input
                                           type="checkbox"
                                           checked={selectedOrders.includes(order.sales_order_uuid)}
                                           onChange={() => toggleSelectOrder(order.sales_order_uuid)}
                                           className="rounded border-gray-300"
                                       />
                                   </td>
                                   <td className="px-4 py-2 font-medium">{order.sales_order_uuid}</td>
                                   <td className="px-4 py-2">{formatDate(order.order_date_time)}</td>
                                   <td className="px-4 py-2">
                                       {formatShipmentDate(order.expected_shipment_date, order.delivery_method)}
                                   </td>
                                   <td className="px-4 py-2">{formatAddress(order.Customer, order)}</td>
                                   <td className="px-4 py-2 text-right">
                                       {typeof order.total_price === 'number' 
                                           ? order.total_price.toLocaleString('en-US', {
                                               style: 'currency',
                                               currency: 'MYR'
                                               })
                                           : 'N/A'
                                       }
                                   </td>
                                   <td className="px-4 py-2">{formatCustomerName(order.Customer)}</td>
                               </tr>
                           );
                       })}
                   </tbody>
               </table>
           </div>

           {selectedOrder && (
               <SalesOrderModal 
                   order={selectedOrder}
                   onClose={() => setSelectedOrder(null)}
               />
           )}
       </div>
   );
};

export default SalesTable;