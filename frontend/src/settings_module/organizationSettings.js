import React, { useState, useEffect, useContext } from 'react';
import { Pencil, Save } from 'lucide-react';
import instance from '../axiosConfig';
import { GlobalContext } from '../globalContext';
import toast, { Toaster } from 'react-hot-toast';
import Sidebar from '../sidebar';
import Header from "../header";
import { TbBuilding } from "react-icons/tb";

const OrganizationSettings = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    return (
        <div className="flex flex-col h-screen w-full overflow-hidden">
            <Header />
            <div className="flex flex-row flex-grow overflow-hidden">
                <Sidebar />
                <MainContent isMobile={isMobile} />
            </div>
        </div>
    );
};

const MainContent = ({ isMobile }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [organization, setOrganization] = useState({
        organization_name: '',
        organization_email: '',
        organization_contact: '',
        organization_address: '',
        organization_bank: '',
        organization_account_number: '',
        organization_routing_number: ''
    });
    const [originalData, setOriginalData] = useState({});
    const { organizationId } = useContext(GlobalContext);
    useEffect(() => {
        fetchOrganizationData();
    }, []);

    const fetchOrganizationData = async () => {
        try {
            const response = await instance.get(`/organization?organizationId=${organizationId}`);
            setOrganization(response.data.data);
            setOriginalData(response.data.data);
        } catch (error) {
            console.error('Error fetching organization data:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setOrganization(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleToggleEdit = async () => {
        if (isEditing) {
            try {
                console.log('Request body:', {
                    organizationId: organization.organization_id,
                    ...organization
                });
                const response = await instance.put('/organization', organization, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (response.status === 200) {
                    const updatedData = response.data;
                    toast.success("Organization updated successfully");
                    setOrganization(updatedData.data);
                    setOriginalData(updatedData.data);
                    setIsEditing(false);
                }
            } catch (error) {
                console.error('Error saving organization data:', error);
                if (error.response?.data?.errors) {
                    error.response.data.errors.forEach(err => {
                        toast.error(err.message);
                    });
                } else {
                    // Fallback for unexpected error format
                    toast.error('An error occurred while saving organization data');
                }
            }
        } else {
            setIsEditing(true);
        }
    };

    const handleCancel = () => {
        setOrganization(originalData);
        setIsEditing(false);
    };

    return (

        <div className="w-full max-w-5xl mx-auto p-4 lg:p-6 space-y-6">
            <Toaster position="bottom-right" />
            <div className="space-y-2">
                <h1 className="text-xl lg:text-2xl font-semibold flex items-center gap-2">
                    <TbBuilding className="w-6 h-6 text-gray-500" /> Organization Settings
                </h1>
                <p className="text-sm lg:text-base text-muted-foreground">Configure organization information</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4 lg:p-6 space-y-6 lg:space-y-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-2">
                    <h2 className="text-lg font-medium">Organization Information</h2>
                    <div className="flex gap-2 w-full sm:w-auto">
                        {isEditing && (
                            <button
                                onClick={handleCancel}
                                className="px-3 lg:px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 flex-1 sm:flex-auto"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            onClick={handleToggleEdit}
                            className="flex items-center justify-center gap-2 px-3 lg:px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 flex-1 sm:flex-auto"
                        >
                            {isEditing ? (
                                <Save className="w-4 h-4" />
                            ) : (
                                <Pencil className="w-4 h-4" />
                            )}
                            {isEditing ? (
                                <span>Save Changes</span>
                            ) : (
                                <span>Edit Settings</span>
                            )}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                    <div className="space-y-1 lg:space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                            Organization Name
                        </label>
                        <input
                            type="text"
                            name="organization_name"
                            value={organization.organization_name}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        />
                    </div>

                    <div className="space-y-1 lg:space-y-2">
                        <label className="text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            name="organization_email"
                            value={organization.organization_email}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        />
                    </div>

                    <div className="space-y-1 lg:space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                            Contact Number
                        </label>
                        <input
                            type="text"
                            name="organization_contact"
                            value={organization.organization_contact}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        />
                    </div>

                    <div className="space-y-1 lg:space-y-2">
                        <label className="text-sm font-medium text-gray-700">Address</label>
                        <input
                            type="text"
                            name="organization_address"
                            value={organization.organization_address}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        />
                    </div>

                    <div className="space-y-1 lg:space-y-2">
                        <label className="text-sm font-medium text-gray-700">Bank Name</label>
                        <input
                            type="text"
                            name="organization_bank"
                            value={organization.organization_bank}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        />
                    </div>

                    <div className="space-y-1 lg:space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                            Account Number
                        </label>
                        <input
                            type="text"
                            name="organization_account_number"
                            value={organization.organization_account_number}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        />
                    </div>

                    <div className="space-y-1 lg:space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                            Routing Number
                        </label>
                        <input
                            type="text"
                            name="organization_routing_number"
                            value={organization.organization_routing_number}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default OrganizationSettings;