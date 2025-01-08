import React, { useState, useEffect } from 'react';
import { Search, X, Loader2, ArrowLeft } from 'lucide-react';
import instance from '../axiosConfig';

const WarrantyClaimModal = ({ isOpen, onClose, username, organizationId }) => {
    const [currentStep, setCurrentStep] = useState(1);

    
    // Product search states
    const [productQuery, setProductQuery] = useState('');
    const [isProductSearching, setIsProductSearching] = useState(false);
    const [productSearchError, setProductSearchError] = useState(null);
    const [debouncedProductQuery, setDebouncedProductQuery] = useState('');
    const [productSearchResults, setProductSearchResults] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showProductResults, setShowProductResults] = useState(false);

    // Unit search states with autocomplete
    const [unitSearchQuery, setUnitSearchQuery] = useState('');
    const [isUnitSearching, setIsUnitSearching] = useState(false);
    const [debouncedUnitQuery, setDebouncedUnitQuery] = useState('');
    const [unitSearchError, setUnitSearchError] = useState(null);
    const [unitSearchResults, setUnitSearchResults] = useState([]);
    const [showUnitResults, setShowUnitResults] = useState(false);
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [isSelectingProduct, setIsSelectingProduct] = useState(false);
    const [isSelectingUnit, setIsSelectingUnit] = useState(false);

    //User search states with autocomplete 
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [isUserSearching, setIsUserSearching] = useState(false);
    const [debouncedUserQuery, setDebouncedUserQuery] = useState('');
    const [userSearchError, setUserSearchError] = useState(null);
    const [userSearchResults, setUserSearchResults] = useState([]);
    const [showUserResults, setShowUserResults] = useState(false);
    const [isSelectingUser, setIsSelectingUser] = useState(false);

    // Form states  
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState(null);
    const [claimData, setClaimData] = useState({
        resolution_details: '',
        claim_type: '1',
        priority: '1',
        assigned_to: 0
    });

    const resetFormData = () => {
        // Reset all search states
        setProductQuery('');
        setDebouncedProductQuery('');
        setIsProductSearching(false);
        setProductSearchError(null);
        setProductSearchResults([]);
        setSelectedProduct(null);
        setShowProductResults(false);

        // Reset unit search states
        setUnitSearchQuery('');
        setDebouncedUnitQuery('');
        setIsUnitSearching(false);
        setUnitSearchError(null);
        setUnitSearchResults([]);
        setShowUnitResults(false);
        setSelectedUnit(null);

        setUserSearchQuery('');
        setDebouncedUserQuery('');
        setIsUserSearching(false);
        setUserSearchError(null);
        setUserSearchResults([]);
        setShowUserResults(false);
        setIsSelectingUser(false);

        // Reset selection states
        setIsSelectingProduct(false);
        setIsSelectingUnit(false);

        // Reset form states
        setCurrentStep(1);
        setIsSubmitting(false);
        setFormError(null);
        setClaimData({
            customer_id: '',
            resolution_details: '',
            claim_type: '1',
            priority: '1',
            assigned_to: 0
        });
    };

    const handleClose = () => {
        resetFormData();
        onClose();
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedProductQuery(productQuery);
        }, 500); // 500ms delay

        return () => clearTimeout(timer);
    }, [productQuery]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedUnitQuery(unitSearchQuery);
        }, 500); // 500ms delay

        return () => clearTimeout(timer);
    }, [unitSearchQuery]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedUserQuery(userSearchQuery);
        }, 500); // 500ms delay

        return () => clearTimeout(timer);
    }, [userSearchQuery]);

    useEffect(() => {

        const searchProducts = async () => {
            if (!debouncedProductQuery.trim() || isSelectingProduct) {
                setProductSearchResults([]);
                setShowProductResults(false);
                return;
            }

            setIsProductSearching(true);
            setProductSearchError(null);
            setShowProductResults(true);

            try {
                const response = await instance.get(`user/${username}/inventories?searchTerm=${debouncedProductQuery}`);
                if (response.data) {
                    setProductSearchResults(Array.isArray(response.data.inventories) ? response.data.inventories : [response.data.inven]);
                }
            } catch (err) {
                setProductSearchError(err.response?.data?.message || 'Failed to find products');
            } finally {
                setIsProductSearching(false);
            }
        };

        searchProducts();
    }, [debouncedProductQuery, username]);

    useEffect(() => {
        const searchUsers = async () => {
            if (!debouncedUserQuery.trim() || isSelectingUser) {
                setUserSearchResults([]);
                setShowUserResults(false);
                return;
            }

            setIsUserSearching(true);
            setUserSearchError(null);
            setShowUserResults(true);

            try {
                const response = await instance.get(`/user/all/${organizationId}?searchTerm=${userSearchQuery}`);
                if (response.data) {
                    setUserSearchResults(Array.isArray(response.data.data) ? response.data.data : [response.data.data]);
                }
            } catch (err) {
                setUserSearchError(err.response?.data?.message || 'Failed to find users');
            } finally {
                setIsUserSearching(false);
            }
        };

        searchUsers();
    }, [debouncedUserQuery]);

    useEffect(() => {
        const searchUnits = async () => {
            if (!debouncedUnitQuery.trim() || !selectedProduct || isSelectingUnit) {
                setUnitSearchResults([]);
                setShowUnitResults(false);
                return;
            }

            setIsUnitSearching(true);
            setUnitSearchError(null);
            setShowUnitResults(true);

            try {
                const response = await instance.get(
                    `/products/unit/warranty?serialNumber=${debouncedUnitQuery}&productId=${selectedProduct.product_id}`
                );
                if (response.data && response.data.data) {
                    setUnitSearchResults(response.data.data);
                }
            } catch (err) {
                setUnitSearchError(err.response?.data?.message || 'Failed to find product units');
            } finally {
                setIsUnitSearching(false);
            }
        };

        searchUnits();
    }, [debouncedUnitQuery, selectedProduct]);
    if (!isOpen) return null;

    const handleUserSelect = (user) => {
        setIsSelectingUser(true);
        setClaimData(prev => ({
            ...prev,
            assigned_to: user.user_id
        }));
        setUserSearchQuery(user.username);
        setShowUserResults(false);
        setTimeout(() => setIsSelectingUser(false), 1000);
    };
    const handleUserInputChange = (e) => {
        const value = e.target.value;
        setUserSearchQuery(value);
        setClaimData(prev => ({
            ...prev,
            assigned_to: value
        }));
        if (!value.trim()) {
            setShowUserResults(false);
        }
    };
    const goToNextStep = () => {
        if (!selectedUnit?.WarrantyUnits.some(unit => unit.Warranty.warranty_type === 1 && unit.status === 'ACTIVE')) {
            setFormError('Cannot proceed: No active consumer warranty found');
            return;
        }
        setCurrentStep(2);
        setFormError(null);
    };

    const goToPreviousStep = () => {
        setCurrentStep(1);
        setFormError(null);
    };

    const handleProductSelect = (product) => {
        setIsSelectingProduct(true);
        setSelectedProduct(product);
        setProductQuery(product.product_name);
        setShowProductResults(false);
        // Clear unit search when product changes
        setUnitSearchQuery('');
        setSelectedUnit(null);
        setUnitSearchResults([]);
        setTimeout(() => setIsSelectingProduct(false), 1000);
    };

    const handleProductInputChange = (e) => {
        const value = e.target.value;
        setProductQuery(value);
        if (!value.trim()) {
            setShowProductResults(false);
        }
    };

    const handleUnitInputChange = (e) => {
        const value = e.target.value;
        setUnitSearchQuery(value);
        if (!value.trim()) {
            setShowUnitResults(false);
        }
    };
    // New unit search with autocomplete


    const handleUnitSelect = (unit) => {
        setIsSelectingUnit(true);
        setSelectedUnit(unit);
        setUnitSearchQuery(unit.serial_number);
        setShowUnitResults(false);
        setTimeout(() => setIsSelectingUnit(false), 1000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedUnit) return;

        const activeWarranty = selectedUnit.WarrantyUnits.find(
            unit => unit.Warranty.warranty_type === 1 && unit.status === 'ACTIVE'
        );

        if (!activeWarranty) {
            setFormError('Cannot create claim: No active consumer warranty found');
            return;
        }

        setIsSubmitting(true);
        setFormError(null);

        console.log(claimData);
        try {
            const response = await instance.post('/warranty-claims/create', {
                warranty_id: activeWarranty.warranty_id,
                product_unit_id: selectedUnit.product_unit_id,
                product_id: selectedProduct.product_id,
                ...claimData,
                created_by: username
            });

            if (response.data) {
                onClose();
            }
        } catch (err) {
            setFormError(err.response?.data?.message || 'Failed to create warranty claim');
        } finally {
            setIsSubmitting(false);
        }
        setIsSubmitting(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setClaimData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50">
            <div className="min-h-screen px-4 flex items-center justify-center">
                <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b">
                        <h2 className="text-lg font-semibold">Create Warranty Claim</h2>
                        <button onClick={handleClose} className="p-1 hover:bg-gray-100 rounded">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="p-4">
                        {currentStep === 1 ? (
                            <div className="mb-6 relative">
                                {/* Product Search Section */}
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Search Product
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={productQuery}
                                        onChange={handleProductInputChange}
                                        placeholder="Enter product name..."
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                    {isProductSearching && (
                                        <div className="absolute right-3 top-2">
                                            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                        </div>
                                    )}
                                </div>

                                {/* Product Search Results */}
                                {showProductResults && (productSearchResults.length > 0 || isProductSearching) && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg">
                                        {isProductSearching ? (
                                            <div className="p-4 text-center text-gray-500">Searching...</div>
                                        ) : (
                                            <ul className="max-h-60 overflow-y-auto">
                                                {productSearchResults.map((product) => (
                                                    <li
                                                        key={product.product_id}
                                                        onClick={() => handleProductSelect(product)}
                                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                                    >
                                                        <div className="font-medium">{product.product_name}</div>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )}


                                {productSearchError && (
                                    <div className="mt-2 p-2 bg-red-50 text-red-700 text-sm rounded-lg">
                                        {productSearchError}
                                    </div>
                                )}

                                {/* Selected Product Display */}
                                {selectedProduct && !showProductResults && (
                                    <div className="mt-4">
                                        <div className="p-4 bg-gray-200 rounded-lg">
                                            <h3 className="font-medium mb-2">Selected Product</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <span className="text-sm text-gray-600">Product ID</span>
                                                    <p className="font-medium">{selectedProduct.product_id}</p>
                                                </div>
                                                <div>
                                                    <span className="text-sm text-gray-600">Product Name</span>
                                                    <p className="font-medium">{selectedProduct.product_name}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Unit Search Section */}
                                {selectedProduct && (
                                    <div className="relative mt-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Search Product Unit
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={unitSearchQuery}
                                                onChange={handleUnitInputChange}
                                                placeholder="Enter serial number..."
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                            {isUnitSearching && (
                                                <div className="absolute right-3 top-2">
                                                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Unit Search Results */}
                                        {showUnitResults && (unitSearchResults.length > 0 || isUnitSearching) && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg">
                                                {isUnitSearching ? (
                                                    <div className="p-4 text-center text-gray-500">Searching...</div>
                                                ) : (
                                                    <ul className="max-h-60 overflow-y-auto">
                                                        {unitSearchResults.map((unit) => (
                                                            <li
                                                                key={unit.product_unit_id}
                                                                onClick={() => handleUnitSelect(unit)}
                                                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                                            >
                                                                <div className="font-medium">{unit.serial_number}</div>
                                                                <div className="text-sm text-gray-500">
                                                                    ID: {unit.product_unit_id}
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        )}


                                        {unitSearchError && (
                                            <div className="mt-2 p-2 bg-red-50 text-red-700 text-sm rounded-lg">
                                                {unitSearchError}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Selected Unit Display */}
                                {selectedUnit && (
                                    <div className="mt-4 space-y-4">
                                        {/* Product Unit Info */}
                                        <div className="p-4 bg-gray-200 rounded-lg">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <span className="text-sm text-gray-600">Product Unit ID</span>
                                                    <p className="font-medium">{selectedUnit.product_unit_id}</p>
                                                </div>
                                                <div>
                                                    <span className="text-sm text-gray-600">Serial Number</span>
                                                    <p className="font-medium">{selectedUnit.serial_number}</p>
                                                </div>
                                                <div>
                                                    <span className="text-sm text-gray-600">Date of Purchase</span>
                                                    <p className="font-medium">{selectedUnit.date_of_purchase}</p>
                                                </div>
                                                <div>
                                                    <span className="text-sm text-gray-600">Date of Sales</span>
                                                    <p className="font-medium">{selectedUnit.date_of_sale}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Warranty Status */}
                                        {selectedUnit.WarrantyUnits.map((unit) => {
                                            if (unit.Warranty.warranty_type === 2) return null;
                                            return (
                                                <div key={unit.warranty_id} className="border rounded-lg">
                                                    <div className="px-4 py-3 bg-gray-200 border-b">
                                                        <h3 className="font-medium">Warranty Status</h3>
                                                    </div>
                                                    <div className="p-4">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <span className="text-sm text-gray-500">Status</span>
                                                                <p className={`font-medium ${unit.status === 'ACTIVE'
                                                                    ? 'text-green-600'
                                                                    : 'text-red-600'
                                                                    }`}>
                                                                    {unit.status}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <span className="text-sm text-gray-500">Type</span>
                                                                <p className="font-medium">
                                                                    {unit.Warranty.warranty_type === 1 ? 'Consumer' : 'Manufacturer'}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <span className="text-sm text-gray-500">Start Date</span>
                                                                <p className="font-medium">
                                                                    {new Date(unit.warranty_start).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <span className="text-sm text-gray-500">End Date</span>
                                                                <p className="font-medium">
                                                                    {new Date(unit.warranty_end).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <span className="text-sm text-gray-500">Duration</span>
                                                                <p className="font-medium">{unit.Warranty.duration} months</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {unit.status !== 'ACTIVE' && (
                                                        <div className="px-4 py-3 bg-red-50 text-red-700 text-sm border-t">
                                                            Warning: This warranty is not active. New claims cannot be created.
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        <div className="flex justify-end mt-4">
                                            <button
                                                onClick={goToNextStep}
                                                disabled={formError}
                                                className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700   ${formError
                                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300'
                                                    : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                                                    }`}
                                            >
                                                Next Step
                                            </button>
                                        </div>
                                        {formError && (
                                            <div className="p-2 bg-red-50 text-red-700 text-sm rounded-lg">
                                                {formError}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div>
                                <button
                                    onClick={goToPreviousStep}
                                    className="mb-4 flex items-center text-gray-600 hover:text-gray-900"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-1" />
                                    Back to Search
                                </button>

                                {selectedUnit?.WarrantyUnits.some(unit => unit.Warranty.warranty_type === 1 && unit.status === 'ACTIVE') && (
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Claim Type
                                            </label>
                                            <select
                                                name="claim_type"
                                                value={claimData.claim_type}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="1">Repair</option>
                                                <option value="2">Replacement</option>
                                                <option value="3">Refund</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Priority
                                            </label>
                                            <select
                                                name="priority"
                                                value={claimData.priority}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="1">Low</option>
                                                <option value="2">Medium</option>
                                                <option value="3">High</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Resolution Details
                                            </label>
                                            <textarea
                                                name="resolution_details"
                                                value={claimData.resolution_details}
                                                onChange={handleInputChange}
                                                required
                                                rows="3"
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Assign To
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={userSearchQuery}
                                                    onChange={handleUserInputChange}
                                                    placeholder="Search for user..."
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                />
                                                {isUserSearching && (
                                                    <div className="absolute right-3 top-2">
                                                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                                    </div>
                                                )}

                                                {/* User Search Results Dropdown */}
                                                {showUserResults && (userSearchResults.length > 0 || isUserSearching) && (
                                                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg">
                                                        {isUserSearching ? (
                                                            <div className="p-4 text-center text-gray-500">Searching...</div>
                                                        ) : (
                                                            <ul className="max-h-60 overflow-y-auto">
                                                                {userSearchResults.map((user) => (
                                                                    <li
                                                                        key={user.id}
                                                                        onClick={() => handleUserSelect(user)}
                                                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                                                    >
                                                                        <div className="font-medium">{user.username}</div>
                                                                        <div className="text-sm text-gray-500">
                                                                            {user.email || 'No email'}
                                                                        </div>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            {userSearchError && (
                                                <div className="mt-2 p-2 bg-red-50 text-red-700 text-sm rounded-lg">
                                                    {userSearchError}
                                                </div>
                                            )}
                                        </div>

                                        {formError && (
                                            <div className="p-2 bg-red-50 text-red-700 text-sm rounded-lg">
                                                {formError}
                                            </div>
                                        )}

                                        <div className="flex justify-end gap-2 pt-4">
                                            <button
                                                type="button"
                                                onClick={handleClose}
                                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                            >
                                                {isSubmitting ? (
                                                    <span className="flex items-center">
                                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                                        Creating...
                                                    </span>
                                                ) : (
                                                    'Create Claim'
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WarrantyClaimModal;