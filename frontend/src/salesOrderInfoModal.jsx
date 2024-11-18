import React, { useState, useEffect } from 'react';
import { X, Edit, Trash, Save, X as Close } from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, 
         AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, 
         AlertDialogAction } from './ui/alert-dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { toast } from './ui/use-toast';

// Utility Functions
const verifyManagerPassword = async (password) => {
  try {
    const response = await fetch('/api/verify-manager', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    });
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
};

// Section Components
const CustomerSection = ({ isEditing, order, editedOrder, handleEdit }) => {
  const customerContact = order.Customer?.customer_contact || 
                        order.customer?.customer_contact || 'N/A';
  
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-3">Customer Information</h3>
      <div className="grid grid-cols-2 gap-4">
        {isEditing ? (
          <>
            <div>
              <p className="text-sm text-gray-500">Customer Name</p>
              <Input
                value={editedOrder.Customer?.customer_name || ''}
                onChange={(e) => handleEdit('Customer', {
                  ...editedOrder.Customer,
                  customer_name: e.target.value
                })}
              />
            </div>
            <div>
              <p className="text-sm text-gray-500">Contact</p>
              <Input
                value={editedOrder.Customer?.customer_contact || ''}
                onChange={(e) => handleEdit('Customer', {
                  ...editedOrder.Customer,
                  customer_contact: e.target.value
                })}
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <p className="text-sm text-gray-500">Customer Name</p>
              <p className="font-medium">
                {order.Customer?.customer_name || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Contact</p>
              <p className="font-medium">{customerContact}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const PaymentSection = ({ isEditing, order, editedOrder, handleEdit }) => (
  <div className="bg-gray-50 p-4 rounded-lg">
    <h3 className="text-lg font-semibold mb-3">Payment Information</h3>
    <div className="grid grid-cols-2 gap-4">
      {isEditing ? (
        <>
          <div>
            <p className="text-sm text-gray-500">Payment Terms</p>
            <Input
              value={editedOrder.payment_terms || ''}
              onChange={(e) => handleEdit('payment_terms', e.target.value)}
            />
          </div>
          <div>
            <p className="text-sm text-gray-500">Delivery Method</p>
            <Input
              value={editedOrder.delivery_method || ''}
              onChange={(e) => handleEdit('delivery_method', e.target.value)}
            />
          </div>
        </>
      ) : (
        <>
          <div>
            <p className="text-sm text-gray-500">Payment Terms</p>
            <p className="font-medium">{order.payment_terms || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Delivery Method</p>
            <p className="font-medium">{order.delivery_method || 'N/A'}</p>
          </div>
        </>
      )}
    </div>
  </div>
);

const DatesSection = ({ order, formatDate }) => (
  <div className="bg-gray-50 p-4 rounded-lg">
    <h3 className="text-lg font-semibold mb-3">Order Details</h3>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-sm text-gray-500">Order Date</p>
        <p className="font-medium">{formatDate(order.order_date_time)}</p>
      </div>
      <div>
        <p className="text-sm text-gray-500">Expected Shipment</p>
        <p className="font-medium">{formatDate(order.expected_shipment_date)}</p>
      </div>
    </div>
  </div>
);

const ProductsSection = ({ isEditing, order, editedOrder, handleEdit, formatCurrency }) => {
    console.log('Full order data:', order);
    
    // Get products array and ensure it has SalesOrderInventory data
    const products = (order?.Products || []).map(product => {
        const quantity = product.SalesOrderInventory?.quantity || 0;
        const price = product.SalesOrderInventory?.price || 0;
        
        console.log('Processing product:', {
            name: product.product_name,
            quantity,
            price,
            raw: product
        });
        
        return {
            ...product,
            quantity,
            price
        };
    });

    console.log('Processed products:', products);

    return (
        <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Products</h3>
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {products.length > 0 ? (
                        products.map((product) => {
                            console.log('Rendering product row:', product);
                            const quantity = product.SalesOrderInventory?.quantity || product.quantity || 0;
                            const price = product.SalesOrderInventory?.price || product.price || 0;
                            
                            return (
                                <tr key={product.product_uuid}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <p className="font-medium">{product.product_name}</p>
                                        {product.sku_number && (
                                            <p className="text-sm text-gray-500">SKU: {product.sku_number}</p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {isEditing ? (
                                            <Input
                                                type="number"
                                                value={quantity}
                                                onChange={(e) => {
                                                    const newProducts = products.map(p => 
                                                        p.product_uuid === product.product_uuid
                                                            ? {
                                                                ...p,
                                                                SalesOrderInventory: {
                                                                    ...p.SalesOrderInventory,
                                                                    quantity: parseInt(e.target.value)
                                                                }
                                                            }
                                                            : p
                                                    );
                                                    handleEdit('Products', newProducts);
                                                }}
                                                className="w-20 text-right"
                                            />
                                        ) : (
                                            quantity
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {formatCurrency(price)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {formatCurrency(price * quantity)}
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                                No products found
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

const SalesOrderModal = ({ order, onClose, onUpdate, onDelete, userRole }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedOrder, setEditedOrder] = useState(order);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  console.log('Modal Customer Data:', {
  full: order.Customer,
  name: order.Customer?.customer_name,
  contact: order.Customer?.customer_contact
  });

  useEffect(() => {
    setEditedOrder(order);
  }, [order]);

    useEffect(() => {
    console.log('Full order data:', order);
    console.log('Customer data:', order.Customer);
    console.log('Products data:', order.products);
    setEditedOrder(order);
  }, [order]);

  useEffect(() => {
    console.log('Raw order data received:', order);
    if (order) {
        // Ensure products array exists and is properly structured
        const formattedOrder = {
            ...order,
            products: order.Products || order.products || []
        };
        console.log('Formatted order data:', formattedOrder);
        setEditedOrder(formattedOrder);
    }
}, [order]);

  const isManager = userRole === 'Manager';

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const parsedDate = parseISO(dateString);
      return isValid(parsedDate) 
        ? format(parsedDate, "PPP 'at' p")
        : 'N/A';
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'N/A';
    }
  };

  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return 'N/A';
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'MYR'
    });
  };

  const handleEdit = (field, value) => {
    setEditedOrder(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSensitiveEdit = () => {
    setPendingAction('edit');
    setShowPasswordDialog(true);
  };

  const handleDelete = () => {
    if (isManager) {
      setShowDeleteConfirm(true);
    } else {
      toast({
        title: "Permission Denied",
        description: "Only managers can delete sales orders.",
        variant: "destructive"
      });
    }
  };

  const handlePasswordVerification = async () => {
    try {
      const isValid = await verifyManagerPassword(adminPassword);
      if (!isValid) {
        throw new Error('Invalid manager password');
      }

      if (pendingAction === 'edit') {
        await onUpdate(editedOrder);
      } else if (pendingAction === 'delete') {
        await onDelete(order.sales_order_uuid);
      }
      
      setShowPasswordDialog(false);
      setAdminPassword('');
      setPendingAction(null);
      if (pendingAction === 'edit') {
        setIsEditing(false);
      }
      
      toast({
        title: "Success",
        description: `Sales order ${pendingAction === 'edit' ? 'updated' : 'deleted'} successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center overflow-y-auto">
        <div className="bg-white rounded-lg w-full max-w-4xl m-4 relative">
          {/* Header */}
          <div className="border-b p-4 flex justify-between items-center">
            <h2 className="text-xl font-bold">Order Details</h2>
            <div className="flex gap-2">
              {!isEditing && isManager && (
                <>
                  <Button 
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button 
                    onClick={handleDelete}
                    variant="destructive"
                    className="flex items-center gap-2"
                  >
                    <Trash className="w-4 h-4" />
                    Delete
                  </Button>
                </>
              )}
              {isEditing && (
                <>
                  <Button 
                    onClick={handleSensitiveEdit}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </Button>
                  <Button 
                    onClick={() => {
                      setIsEditing(false);
                      setEditedOrder(order);
                    }}
                    variant="ghost"
                    className="flex items-center gap-2"
                  >
                    <Close className="w-4 h-4" />
                    Cancel
                  </Button>
                </>
              )}
              <Button 
                onClick={onClose}
                variant="ghost"
                className="p-2"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            <CustomerSection 
              isEditing={isEditing}
              order={order}
              editedOrder={editedOrder}
              handleEdit={handleEdit}
            />
            
            <PaymentSection 
              isEditing={isEditing}
              order={order}
              editedOrder={editedOrder}
              handleEdit={handleEdit}
            />
            
            <DatesSection 
              order={order} 
              formatDate={formatDate}  // Pass the formatDate function as prop
            />

            {/* Products Section */}
            <ProductsSection 
              isEditing={isEditing}
              order={order}
              editedOrder={editedOrder}
              handleEdit={handleEdit}
              formatCurrency={formatCurrency}
            />
      </div>
      </div>
      </div>

      {/* Password Verification Dialog */}
      <AlertDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Manager Verification Required</AlertDialogTitle>
            <AlertDialogDescription>
              Please enter your manager password to continue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            placeholder="Enter manager password"
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowPasswordDialog(false);
              setAdminPassword('');
              setPendingAction(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handlePasswordVerification}>
              Verify
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this sales order? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setShowDeleteConfirm(false);
              setPendingAction('delete');
              setShowPasswordDialog(true);
            }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SalesOrderModal;