import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GlobalContext } from "../globalContext";
import instance from "../axiosConfig";
import { Card } from "../ui/card";
import { Alert, AlertDescription } from "../ui/alert";
import { Shield, Clock, FileText, Edit2, Trash2, AlertCircle, Search, Plus, Download } from 'lucide-react';
import { format } from 'date-fns';
import Header from "../header";
import { motion } from 'framer-motion';
import { useScrollDirection } from "../useScrollDirection";
import Sidebar from "../sidebar";
import { Button } from "../ui/button";
import WarrantySearch from './warranty_search'; 
import WarrantyDetailModal from "./warranty_detail_modal";
import toast, { Toaster } from "react-hot-toast";
import WarrantyClaimModal from "./claim_modal";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { ChevronDown } from 'lucide-react';

const syncedTransition = {
  type: "spring",
  stiffness: 300, 
  damping: 30,
  delay: 0,       
  duration: 0.3,  
};

const formatWarrantyDate = (dateString, formatStr = 'MMM dd, yyyy') => {
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

export const MainContent = ({ isMobile, scrollDirection, isAtTop }) => {
  const { username, organizationId } = useContext(GlobalContext);
  const [warranties, setWarranties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [selectedWarranty, setSelectedWarranty] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [warrantyToDelete, setWarrantyToDelete] = useState(null);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

  const [searchConfig, setSearchConfig] = useState({
    term: '',
    activeFilters: ['id', 'product', 'type', 'duration', 'status']
  });

  const fetchWarranties = async () => {
    try {
      setIsLoading(true);
      const response = await instance.get(`/warranties/active?username=${username}`);
      setWarranties(response.data.warranties);
    } catch (err) {
      setError('Failed to load warranties');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWarranties();
  }, [username]); 

  const handleSearchFilter = (config) => {
    setSearchConfig(config);
  };

  const handleWarrantyUpdate = (updatedWarranty) => {
    console.log('Received updated warranty:', updatedWarranty);
    
    setWarranties(prevWarranties => 
      prevWarranties.map(warranty =>
        warranty.warranty_id === updatedWarranty.warranty_id 
          ? {
              ...warranty,
              ...updatedWarranty, 
              created_at: updatedWarranty.created_at || warranty.created_at,
              updated_at: updatedWarranty.updated_at || new Date().toISOString(),
              creator: updatedWarranty.creator || warranty.creator,
              modifier: updatedWarranty.modifier || {
                username: username
              },
              product: {
                ...warranty.product,
                ...(updatedWarranty.product || {})
              },
              warranty_type: updatedWarranty.warranty_type || warranty.warranty_type,
              status: updatedWarranty.status || warranty.status
            }
          : warranty
      )
    );
    
    // If the modal is open with the current warranty, update its state
    if (selectedWarranty?.warranty_id === updatedWarranty.warranty_id) {
      setSelectedWarranty(prev => ({
        ...prev,
        ...updatedWarranty,
        created_at: updatedWarranty.created_at || prev.created_at,
        updated_at: updatedWarranty.updated_at || new Date().toISOString(),
        creator: updatedWarranty.creator || prev.creator,
        modifier: updatedWarranty.modifier || {
          username: username
        },
        product: {
          ...prev.product,
          ...(updatedWarranty.product || {})
        }
      }));
    }
  };

  useEffect(() => {
    const fetchWarranties = async () => {
      try {
        setIsLoading(true);
        const response = await instance.get(`/warranties/active?username=${username}`);
        if (response.data.warranties) {
          const processedWarranties = response.data.warranties.map(warranty => ({
            ...warranty,
            created_at: warranty.created_at || new Date().toISOString(),
            updated_at: warranty.updated_at || warranty.created_at || new Date().toISOString(),
            creator: warranty.creator || { username: 'System' },
            modifier: warranty.modifier || null
          }));
          setWarranties(processedWarranties);
        }
      } catch (err) {
        console.error('Error fetching warranties:', err);
        setError('Failed to load warranties');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWarranties();
  }, [username]);

  const handleDelete = async (warranty) => {
    setWarrantyToDelete(warranty);
    setShowDeleteDialog(true);
  };
  
  const confirmDelete = async () => {
    try {
      if (!warrantyToDelete) return;

      const response = await instance.delete(`/warranties/${warrantyToDelete.warranty_id}?username=${username}`);
      
      if (response.data.success) {
        setWarranties(prevWarranties => 
          prevWarranties.filter(w => w.warranty_id !== warrantyToDelete.warranty_id)
        );
        
        // Show success message
        toast.success("Warranty deleted successfully");
        
        if (isModalOpen) {
          setIsModalOpen(false);
          setSelectedWarranty(null);
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
      // Clean up by clearing the warranty to delete and closing the dialog
      setShowDeleteDialog(false);
      setWarrantyToDelete(null);
    }
  };

  const filteredWarranties = React.useMemo(() => {
    if (!warranties) return [];
    if (!searchConfig?.term) return warranties;
    
    const searchTerm = searchConfig.term.toLowerCase().trim();
    
    return warranties.filter(warranty => {
      // Search in ID
      const matchesId = warranty.warranty_id?.toString().toLowerCase().includes(searchTerm);
      
      // Search in product name
      const matchesProduct = warranty.product?.product_name?.toLowerCase().includes(searchTerm);
      
      // Search in warranty type
      const warrantyType = warranty.warranty_type === 1 ? 'consumer' : 'manufacturer';
      const matchesType = warrantyType.includes(searchTerm);
      
      const matchesDuration = warranty.duration?.toString().toLowerCase().includes(searchTerm);
      
      const matchesStatus = warranty.status?.toLowerCase().includes(searchTerm);
      
      return (
        (searchConfig.activeFilters.includes('id') && matchesId) ||
        (searchConfig.activeFilters.includes('product') && matchesProduct) ||
        (searchConfig.activeFilters.includes('type') && matchesType) ||
        (searchConfig.activeFilters.includes('duration') && matchesDuration) ||
        (searchConfig.activeFilters.includes('status') && matchesStatus)
      );
    });
  }, [warranties, searchConfig]);

  return (
    <main className="flex-1">
      <div
        className={`scroll-container h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar ${
          isMobile ? "w-full" : ""
        }`}
      >
        <motion.div
          className="p-6"
          animate={{
            marginLeft: isMobile
              ? "0"
              : scrollDirection === "down" && !isAtTop
              ? "4rem"
              : "13rem",
            marginTop: scrollDirection === "down" && !isAtTop ? "0" : "0",
          }}
          transition={syncedTransition}
        >
          {/* Title and Search Section */}
          <div className="mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <h1 className="text-xl font-medium">Warranty Management</h1>
              <div className="lg:w-auto lg:ml-20 flex-1">
                <WarrantySearch
                  onFilterChange={handleSearchFilter}
                  initialFilters={{
                    id: true,
                    product: true,
                    type: true,
                    duration: true,
                    status: true
                  }}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mb-6">
            <div className="hidden md:flex flex-row gap-4 flex-1">
              <Button
                variant="default"
                className="flex items-center space-x-2 px-4 py-2 bg-white text-green-700 font-medium rounded-lg shadow hover:bg-green-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75 flex-1 justify-center max-w-[160px]"
                onClick={() => navigate('/warranty/add_warranty')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Warranty
              </Button>
              <Button
                variant="default"
                className="flex items-center space-x-2 px-4 py-2 bg-white text-green-700 font-medium rounded-lg shadow hover:bg-green-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75 flex-1 justify-center max-w-[220px]"
                onClick={() => setIsClaimModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Warranty Claim
              </Button>
              <Button
                variant="default"
                className="flex items-center space-x-2 px-4 py-2 bg-white text-green-700 font-medium rounded-lg shadow hover:bg-green-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75 flex-1 justify-center max-w-[220px]"
                onClick={() => navigate("/warranty/warranty_claim")}
              >
                <FileText className="w-4 h-4 mr-2" />
                View Warranty Claim
              </Button>
              <Button
                variant="outline"
                className="flex items-center space-x-2 whitespace-nowrap flex-1 justify-center max-w-[130px]"
                onClick={() => {/* Implement export functionality */}}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>

            {/* Mobile Dropdown Menu */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="default"
                    className="w-full flex items-center justify-between px-4 py-2 bg-white text-green-700 font-medium rounded-lg shadow hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75 transition-colors duration-200"
                  >
                    <span className="flex items-center">
                      <Plus className="w-4 h-4 mr-2" />
                      Warranty Actions
                    </span>
                    <ChevronDown className="w-4 h-4 ml-2 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  className="w-[calc(100vw-3rem)] mx-2 p-2 bg-white rounded-lg shadow-lg"
                  sideOffset={5}
                >
                  <DropdownMenuItem 
                    className="flex items-center px-4 py-2.5 hover:bg-green-50 rounded-md cursor-pointer transition-colors duration-200"
                    onClick={() => navigate('/warranty/add_warranty')}
                  >
                    <Plus className="w-4 h-4 mr-2 text-green-600" />
                    <span className="text-gray-700">Add Warranty</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="flex items-center px-4 py-2.5 hover:bg-green-50 rounded-md cursor-pointer transition-colors duration-200"
                    onClick={() => setIsClaimModalOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2 text-green-600" />
                    <span className="text-gray-700">Create Warranty Claim</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="flex items-center px-4 py-2.5 hover:bg-green-50 rounded-md cursor-pointer transition-colors duration-200"
                    onClick={() => navigate("/warranty/warranty_claim")}
                  >
                    <Plus className="w-4 h-4 mr-2 text-green-600" />
                    <span className="text-gray-700">View Warranty Claim</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="flex items-center px-4 py-2.5 hover:bg-green-50 rounded-md cursor-pointer transition-colors duration-200"
                    onClick={() => {/* Implement export functionality */}}
                  >
                    <Download className="w-4 h-4 mr-2 text-green-600" />
                    <span className="text-gray-700">Export</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Warranty Grid with Loading and Error States */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <WarrantyClaimModal
            isOpen={isClaimModalOpen}
            onClose={() => setIsClaimModalOpen(false)}
            username={username}
            organizationId={organizationId}
          />

          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : warranties.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No warranties found
            </div>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:px-0">
            {filteredWarranties.map((warranty) => {
              // Calculate warranty status
              const currentDate = new Date();
              const startDate = new Date(warranty.created_at);
              const endDate = new Date(startDate.setMonth(startDate.getMonth() + warranty.duration));
              const isActive = currentDate <= endDate;
              const daysRemaining = Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24));
              
              // Determine status styles
              const getStatusStyles = () => {
                try {
                  const currentDate = new Date();
                  const startDate = warranty.created_at 
                    ? new Date(warranty.created_at)
                    : new Date();
                  
                  if (isNaN(startDate.getTime())) {
                    throw new Error('Invalid start date');
                  }
                  
                  const endDate = new Date(startDate);
                  endDate.setMonth(endDate.getMonth() + (warranty.duration || 0));
                  
                  const isActive = currentDate <= endDate;
                  const daysRemaining = Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24));
              
                  if (!isActive) {
                    return {
                      className: "bg-red-50 text-red-700 border-red-200",
                      label: "Expired"
                    };
                  }
                  if (daysRemaining <= 30) {
                    return {
                      className: "bg-yellow-50 text-yellow-700 border-yellow-200",
                      label: "Expiring Soon"
                    };
                  }
                  return {
                    className: "bg-green-50 text-green-700 border-green-200",
                    label: "Active"
                  };
                } catch (error) {
                  console.error('Error calculating warranty status:', error);
                  return {
                    className: "bg-gray-50 text-gray-700 border-gray-200",
                    label: "Unknown"
                  };
                }
              };

              const status = getStatusStyles();

              return (
                <motion.div
                  key={warranty.warranty_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 flex flex-col min-h-[280px] w-full"
                >
                  {/* Header Section */}
                  <div className="p-3 border-b border-gray-100">
                    <div className="flex flex-wrap justify-between items-start mb-2 gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Shield 
                          className={`h-4 w-4 ${
                            warranty.warranty_type === 1 ? "text-blue-500" : "text-purple-500"
                          }`}
                        />
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 whitespace-nowrap">
                          {warranty.warranty_type === 1 ? "Consumer" : "Manufacturer"}
                        </span>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.className} whitespace-nowrap`}>
                        {status.label}
                      </span>
                    </div>
                    
                    <h3 className="text-sm font-semibold text-gray-900 mb-1 break-words">
                      {warranty.product?.product_name}
                    </h3>
                    
                    <div className="flex items-center gap-1 text-xs text-gray-500 flex-wrap">
                      <span className="font-medium">SKU:</span>
                      <span className="break-all">{warranty.product?.sku_number}</span>
                    </div>
                  </div>
          
                  {/* Content Section */}
                  <div className="flex-1 p-3 flex flex-col">
                    <div className="grid grid-cols-2 gap-3 mb-2">
                      <div>
                        <div className="text-xs text-gray-500 font-medium mb-1">Duration</div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-sm text-gray-700">{warranty.duration} months</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 font-medium mb-1">Created</div>
                        <div className="flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-sm text-gray-700 truncate">
                            {formatWarrantyDate(warranty.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
          
                    {/* Last Modified */}
                    <div className="mt-auto pt-2 border-t border-gray-100">
                      <div className="text-xs text-gray-500 font-medium mb-1">Last Modified</div>
                      <div className="flex items-center gap-1">
                        <Edit2 className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-sm text-gray-700">
                          {warranty.last_modified_by 
                            ? formatWarrantyDate(warranty.updated_at)
                            : 'Never modified'}
                        </span>
                      </div>
                    </div>
                  </div>
          
                  {/* Actions Section */}
                  <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 rounded-b-xl">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedWarranty(null);  
                          setSelectedWarranty(warranty);  
                          setIsModalOpen(true);
                        }}
                        className="inline-flex items-center justify-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-200"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(warranty)}
                        className="inline-flex items-center justify-center gap-1 px-2 py-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors duration-200"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          )}

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogContent className="bg-white">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Warranty</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this warranty? This action cannot be undone.
                    {warrantyToDelete && (
                      <div className="mt-2 text-sm">
                        <span className="font-medium">Product: </span>
                        {warrantyToDelete.product?.product_name}
                      </div>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => {
                    setShowDeleteDialog(false);
                    setWarrantyToDelete(null);
                  }}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={confirmDelete}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete Warranty
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {selectedWarranty && (
              <WarrantyDetailModal
                isOpen={isModalOpen}
                onClose={() => {
                  setIsModalOpen(false);
                  setSelectedWarranty(null);
                }}
                warranty={selectedWarranty}
                onWarrantyUpdate={handleWarrantyUpdate}
                onDelete={() => {
                  // Refresh the warranties list after deletion
                  fetchWarranties();
                  setIsModalOpen(false);
                  setSelectedWarranty(null);
                }}
                username={username}
              />
            )}
        </motion.div>
      </div>
    </main>
  );
};

// Main WarrantyMain component
const WarrantyMain = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const { scrollDirection, isAtTop } = useScrollDirection();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex flex-col h-screen w-full">
      <Header scrollDirection={scrollDirection} isAtTop={isAtTop} />
      <div className="flex flex-row flex-grow">
        <Sidebar scrollDirection={scrollDirection} isAtTop={isAtTop} />
        <MainContent
          isMobile={isMobile}
          scrollDirection={scrollDirection}
          isAtTop={isAtTop}
        />
      </div>
    </div>
  );
};

export default WarrantyMain;