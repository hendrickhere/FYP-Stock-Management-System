import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog } from "@headlessui/react";
import { FaTimes, FaTrash } from 'react-icons/fa';
import { Shield } from 'lucide-react';
import { Alert, AlertDescription } from "../ui/alert";
import { Pencil, FileText } from 'lucide-react';
import { Tab } from "@headlessui/react";
import axiosInstance from '../axiosConfig';
import toast, { Toaster } from "react-hot-toast";
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

const formatWarrantyDate = (dateString, formatStr = 'MMM dd, yyyy HH:mm') => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateString);
      return 'N/A';
    }
    return format(date, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
};

const WarrantyDetailModal = ({
  isOpen,
  onClose,
  warranty,
  onWarrantyUpdate,
  onDelete,
  username
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentWarranty, setCurrentWarranty] = useState(warranty);
  
  const [formData, setFormData] = useState({
    warranty_number: "",
    duration: 12,
    terms: "",
    description: ""
  });

  const [errors, setErrors] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setCurrentWarranty(warranty);
  }, [warranty]);

  useEffect(() => {
    if (warranty) {
      console.log('Warranty data in modal:', warranty);
    }
  }, [warranty]);

  useEffect(() => {
    if (warranty) {
      setFormData({
        warranty_number: warranty.warranty_number || "",
        duration: warranty.duration || 12,
        terms: warranty.terms || "",
        description: warranty.description || ""
      });
    }
    setIsEditing(false);
    setHasChanges(false);
    setErrors({});
  }, [warranty]);

  // Validation function
  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case "warranty_number":
        if (!value?.trim()) {
          newErrors[name] = "Warranty number is required";
        } else if (value.length > 50) {
          newErrors[name] = "Warranty number cannot exceed 50 characters";
        }
        break;
      case "duration":
        const durationValue = parseInt(value);
        if (isNaN(durationValue) || durationValue < 0) {
          newErrors[name] = "Duration must be a positive number";
        }
        break;
      case "terms":
        if (value?.length > 255) {
          newErrors[name] = "Terms cannot exceed 255 characters";
        }
        break;
      default:
        delete newErrors[name];
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    validateField(name, value);
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setHasChanges(true);
  };

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const isValid = Object.keys(errors).length === 0;
      if (!isValid) {
        toast.error("Please correct all errors before saving"); 
        setIsSaving(false);
        return;
      }
  
      const response = await axiosInstance.put(
        `/warranties/${warranty.warranty_id}`,
        {
          ...formData,
          username
        }
      );
  
      console.log('Update response:', response.data);
  
      if (response.data.success) { 
        toast.success("Warranty has been updated successfully");
  
        setHasChanges(false);
        setIsEditing(false);
        
        const updatedWarranty = {
          ...warranty, 
          ...response.data.warranty, 
          created_at: response.data.warranty.created_at || warranty.created_at,
          updated_at: response.data.warranty.updated_at || new Date().toISOString(),
          creator: response.data.warranty.creator || warranty.creator,
          modifier: {
            username: username,
            ...response.data.warranty.modifier
          },
          product: {
            ...warranty.product,
            ...(response.data.warranty.product || {})
          }
        };
        
        if (onWarrantyUpdate) {
          onWarrantyUpdate(updatedWarranty);
        }
        
        setCurrentWarranty(updatedWarranty);
  
        if (formData.duration !== warranty.duration) {
          setTimeout(() => {
            toast.success(`Warranty duration changed to ${formData.duration} months`);
          }, 100);
        }
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error(error.response?.data?.message || "An error occurred while updating the warranty"); 
  
      if (error.response?.data?.details) {
        setTimeout(() => {
          toast.error(`Details: ${error.response.data.details}`);  
        }, 100);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Delete warranty
  const handleDelete = async () => {
    try {
      const response = await axiosInstance.delete(
        `/warranties/${warranty.warranty_id}?username=${username}`
      );
      
      if (response.data.success) {
        toast.success("Warranty deleted successfully");
        if (onDelete) {
          onDelete(); 
        } else {
          onClose(); 
        }
      }
    } catch (error) {
      console.error('Error deleting warranty:', error);
      
      if (error.response?.status === 403) {
        toast.error("You don't have permission to delete this warranty");
      } else if (error.response?.status === 409) {
        toast.error("Cannot delete warranty with active claims");
      } else {
        toast.error(error.response?.data?.message || "Failed to delete warranty");
      }
    } finally {
      setShowDeleteDialog(false);
    }
  };

  return (
    <AnimatePresence>
    {isOpen && (
      <Dialog
        static
        open={isOpen}
        onClose={() => {
          if (hasChanges) {
            if (window.confirm("You have unsaved changes. Are you sure you want to close?")) {
              onClose();
            }
          } else {
            onClose();
          }
        }}
        className="fixed inset-0 z-50 overflow-hidden"
      >
        <Toaster position="bottom-right" />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30"
            onClick={() => {
              if (!hasChanges) onClose();
            }}
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30 }}
            className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                <h2 className="text-xl font-bold">
                  {warranty?.warranty_type === 1 ? "Consumer" : "Manufacturer"} Warranty
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <FaTimes />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto h-[calc(100vh-8rem)] custom-scrollbar">
              <Tab.Group>
                <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1 mb-6">
                  <Tab
                    className={({ selected }) =>
                      `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                      ${
                        selected
                          ? "bg-white text-blue-700 shadow"
                          : "text-gray-700 hover:bg-white/[0.12] hover:text-blue-600"
                      }`
                    }
                  >
                    Warranty Details
                  </Tab>
                </Tab.List>

                <Tab.Panels>
                  <Tab.Panel className="space-y-6">
                    {/* Product Information (Non-editable) */}
                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <Shield className="h-5 w-5 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-blue-900">Product Information</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-blue-600 font-medium mb-1">Product Name</p>
                          <p className="text-base text-blue-900">{warranty?.product?.product_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-blue-600 font-medium mb-1">SKU Number</p>
                          <p className="text-base text-blue-900">{warranty?.product?.sku_number}</p>
                        </div>
                      </div>
                    </div>

                    {/* Audit Information (Non-editable) */}
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mt-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-gray-100 rounded-full">
                          <FileText className="h-5 w-5 text-gray-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Audit Information</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 font-medium mb-1">Created</p>
                          <div className="flex flex-col">
                          <p className="text-base text-gray-900">{formatWarrantyDate(currentWarranty?.created_at)}</p>
                          {currentWarranty?.creator && (
                            <p className="text-sm text-gray-500 mt-1">
                              by {currentWarranty.creator.username}
                            </p>
                          )}
                          </div>
                        </div>
                        {warranty?.last_modified_by && (
                          <div>
                            <p className="text-sm text-gray-600 font-medium mb-1">Last Modified</p>
                            <div className="flex flex-col">
                            {currentWarranty?.last_modified_by && (
                              <div>
                                <p className="text-base text-gray-900">
                                  {formatWarrantyDate(currentWarranty.updated_at)}
                                </p>
                                {currentWarranty?.modifier && (
                                  <p className="text-sm text-gray-500 mt-1">
                                    by {currentWarranty.modifier.username}
                                  </p>
                                )}
                              </div>
                            )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Add expiry calculation */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600 font-medium mb-2">Warranty Status</p>
                        <div className="flex items-center gap-2">
                          {(() => {
                            const currentDate = new Date();
                            const startDate = warranty?.created_at 
                              ? new Date(warranty.created_at)
                              : new Date();
                            const endDate = new Date(startDate);
                            endDate.setMonth(endDate.getMonth() + (warranty?.duration || 0));
                            
                            const daysRemaining = Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24));
                            const isExpired = currentDate > endDate;
                            
                            const statusColor = isExpired 
                              ? 'text-red-600' 
                              : daysRemaining <= 30 
                                ? 'text-yellow-600' 
                                : 'text-green-600';
                            
                            return (
                              <span className={`font-medium ${statusColor}`}>
                                {isExpired 
                                  ? 'Expired' 
                                  : daysRemaining <= 30 
                                    ? `Expiring in ${daysRemaining} days`
                                    : `Active - ${daysRemaining} days remaining`}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Editable Fields */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Warranty Number
                        </label>
                        <input
                          type="text"
                          name="warranty_number"
                          value={formData.warranty_number}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          placeholder="Enter warranty identification number"
                          className={`mt-1 block w-full px-4 py-3 rounded-lg border ${
                            errors.warranty_number ? 'border-red-500' : 'border-gray-300'
                          } ${!isEditing ? 'bg-gray-50' : 'focus:border-blue-500 focus:ring-1 focus:ring-blue-500'} 
                          placeholder-gray-400 transition-all duration-200
                          ${isEditing ? 'hover:border-blue-400' : ''}
                          text-gray-900`}
                        />
                        {errors.warranty_number && (
                          <p className="text-red-500 text-xs mt-1">{errors.warranty_number}</p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Duration (months)
                        </label>
                        <input
                          type="number"
                          name="duration"
                          value={formData.duration}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          placeholder="Enter warranty duration in months"
                          className={`mt-1 block w-full px-4 py-3 rounded-lg border ${
                            errors.duration ? 'border-red-500' : 'border-gray-300'
                          } ${!isEditing ? 'bg-gray-50' : 'focus:border-blue-500 focus:ring-1 focus:ring-blue-500'} 
                          placeholder-gray-400 transition-all duration-200
                          ${isEditing ? 'hover:border-blue-400' : ''}
                          text-gray-900`}
                        />
                        {errors.duration && (
                          <p className="text-red-500 text-xs mt-1">{errors.duration}</p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Terms & Conditions
                        </label>
                        <textarea
                          name="terms"
                          value={formData.terms}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          rows={4}
                          placeholder="Enter warranty terms and conditions - be specific about coverage, limitations, and requirements"
                          className={`mt-1 block w-full px-4 py-3 rounded-lg border ${
                            errors.terms ? 'border-red-500' : 'border-gray-300'
                          } ${!isEditing ? 'bg-gray-50' : 'focus:border-blue-500 focus:ring-1 focus:ring-blue-500'} 
                          placeholder-gray-400 transition-all duration-200
                          ${isEditing ? 'hover:border-blue-400' : ''}
                          text-gray-900 resize-none`}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Description
                        </label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          rows={3}
                          placeholder="Add any additional notes or special considerations for this warranty"
                          className={`mt-1 block w-full px-4 py-3 rounded-lg border ${
                            errors.description ? 'border-red-500' : 'border-gray-300'
                          } ${!isEditing ? 'bg-gray-50' : 'focus:border-blue-500 focus:ring-1 focus:ring-blue-500'} 
                          placeholder-gray-400 transition-all duration-200
                          ${isEditing ? 'hover:border-blue-400' : ''}
                          text-gray-900 resize-none`}
                        />
                      </div>
                    </div>
                  </Tab.Panel>
                </Tab.Panels>
              </Tab.Group>

              {/* Delete Confirmation */}
              <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent className="bg-white">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Warranty</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this warranty? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete Warranty
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {/* Footer Actions */}
            <div className="absolute bottom-0 left-0 right-0">
              {/* Desktop View */}
              <div className="hidden sm:block border-t bg-white px-6 py-4">
                <div className="flex justify-between items-center max-w-[1400px] mx-auto">
                  <button
                    onClick={() => setShowDeleteDialog(true)}
                    className="inline-flex items-center justify-center gap-2 h-10 px-4 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                  >
                    <FaTrash className="w-4 h-4" />
                    <span className="font-medium">Delete Warranty</span>
                  </button>

                  <div className="flex gap-3">
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="inline-flex items-center justify-center h-10 px-6 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors duration-200"
                      >
                        Edit
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            setFormData({
                              warranty_number: warranty.warranty_number || "",
                              duration: warranty.duration || 0,
                              terms: warranty.terms || "",
                              description: warranty.description || ""
                            });
                            setHasChanges(false);
                            setErrors({});
                          }}
                          className="inline-flex items-center justify-center h-10 px-6 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors duration-200"
                          disabled={isSaving}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={isSaving || Object.keys(errors).length > 0}
                          className="inline-flex items-center justify-center h-10 px-6 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors duration-200"
                        >
                          {isSaving ? "Saving..." : "Save Changes"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Mobile View - Bottom Bar */}
              <div className="sm:hidden fixed bottom-0 left-0 right-0 border-t bg-white px-4 py-3">
                <div className="flex items-center gap-2">
                {!isEditing ? (
                    <>
                    <button
                        onClick={() => setShowDeleteDialog(true)}
                        className="h-10 aspect-square rounded-lg flex items-center justify-center text-red-600 hover:bg-red-50 transition-colors duration-200"
                    >
                        <FaTrash className="w-4 h-4" />
                    </button>

                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex-1 h-10 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center justify-center"
                    >
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                    </button>
                    </>
                ) : (
                    <>
                    <button
                        onClick={() => {
                        setIsEditing(false);
                        setFormData({
                            warranty_number: warranty.warranty_number || "",
                            duration: warranty.duration || 0,
                            terms: warranty.terms || "",
                            description: warranty.description || ""
                        });
                        setHasChanges(false);
                        setErrors({});
                        }}
                        className="flex-1 h-10 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center"
                        disabled={isSaving}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || Object.keys(errors).length > 0}
                        className="flex-1 h-10 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors duration-200 flex items-center justify-center"
                    >
                        {isSaving ? "Saving..." : "Save"}
                    </button>
                    </>
                )}
                </div>
            </div>
            </div>
          </motion.div>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default WarrantyDetailModal;