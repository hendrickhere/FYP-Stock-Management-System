import React, { useState, useEffect, useContext } from 'react';
import instance from '../axiosConfig';
import { GlobalContext } from '../globalContext';
import { useScrollDirection } from '../useScrollDirection';
import Header from '../header';
import Sidebar from '../sidebar';
import toast, { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';

const WarrantyClaimsMain = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const { scrollDirection, isAtTop } = useScrollDirection();
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="flex flex-col h-screen w-full">
            <Header scrollDirection={scrollDirection} isAtTop={isAtTop} />
            <div className="flex flex-row flex-grow">
                <Sidebar scrollDirection={scrollDirection} isAtTop={isAtTop} />
                <WarrantyClaimsView
                    isMobile={isMobile}
                    scrollDirection={scrollDirection}
                    isAtTop={isAtTop}
                />
            </div>
        </div>
    );
}
const WarrantyClaimsView = ({ isMobile, scrollDirection, isAtTop }) => {
    const syncedTransition = {
        type: "spring",
        stiffness: 300,
        damping: 30,
        delay: 0,
        duration: 0.3,
    };
    const claimTypeLabels = {
        "1": "Repair",
        "2": "Replacement",
        "3": "Refund"
    };
    const [claims, setClaims] = useState([]);
    const { organizationId, username } = useContext(GlobalContext);
    const [selectedAssignee, setSelectedAssignee] = useState("0");
    const [selectedStatus, setSelectedStatus] = useState("1");
    const [users, setUsers] = useState([]);
    const [userError, setUserError] = useState("");
    const statusOptions = [
        { value: "1", label: "Pending" },
        { value: "2", label: "In Progress" },
        { value: "3", label: "Resolved" },
        { value: "4", label: "Closed" }
    ];

    const priorityLabels = {
        "1": "High",
        "2": "Medium",
        "3": "Low"
    };

    const fetchClaims = async (assigneeId, status) => {
        try {
            // Replace with your actual API endpoint
            const response = await instance.get(`/warranty-claims?assignee=${assigneeId}&status=${status}&organizationId=${organizationId}`);
            setClaims(response.data.data);
        } catch (error) {
            console.error('Error fetching claims:', error);
        }
    };

    const fetchAllUsers = async () => {
        try {
            const response = await instance.get(`/user/all/${organizationId}?searchTerm=`);
            if (response.data) {
                setUsers(Array.isArray(response.data.data) ? response.data.data : [response.data.data]);
            }
        } catch (err) {
            setUserError(err.response?.data?.message || 'Failed to find users');
        }
    }

    useEffect(() => {
        fetchClaims(selectedAssignee, selectedStatus);
    }, [selectedAssignee, selectedStatus]);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <main className="flex-1 w-full">
            <div className={`scroll-container h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar w-full`}>
                <motion.div
                    className="p-4 md:p-6"
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
                    <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 w-full max-w-[100vw] overflow-hidden">
                        <div className="mb-6">
                            <h2 className="text-xl md:text-2xl font-bold mb-4">Warranty Claims</h2>
                            <div className="flex flex-col md:flex-row gap-4 mb-4">  {/* Changed to stack on mobile */}
                                <div className="w-full md:w-64">  {/* Full width on mobile */}
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Assignee
                                    </label>
                                    <select
                                        value={selectedAssignee}
                                        onChange={(e) => setSelectedAssignee(e.target.value)}
                                        onClick={fetchAllUsers}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="0">All Assignees</option>
                                        {users.map((user) => (
                                            <option key={user.user_id} value={user.user_id.toString()}>
                                                {user.username}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="w-full md:w-64">  {/* Full width on mobile */}
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Status
                                    </label>
                                    <select
                                        value={selectedStatus}
                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        {statusOptions.map((status) => (
                                            <option key={status.value} value={status.value}>
                                                {status.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto -mx-4 md:mx-0 pb-4"> {/* Added padding bottom */}
                            <div className="inline-block min-w-full align-middle">
                                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50 sticky top-0">
                                            <tr>
                                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:pl-6">Date</th>
                                                <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                                <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                                                <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Number</th>
                                                <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                                <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                                                <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creator</th>
                                                <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
                                                <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resolution Details</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {claims.map((claim, index) => (
                                                <tr key={claim.claim_id || index} className="hover:bg-gray-50">
                                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-xs sm:text-sm text-gray-900 sm:pl-6">{formatDate(claim.date_of_claim)}</td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-xs sm:text-sm text-gray-900">{claim.WarrantyUnit?.ProductUnit?.Product?.product_name || 'N/A'}</td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-xs sm:text-sm text-gray-900">{claim.WarrantyUnit?.ProductUnit?.Product?.sku_number || 'N/A'}</td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-xs sm:text-sm text-gray-900">{claim.WarrantyUnit?.ProductUnit?.serial_number || 'N/A'}</td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-xs sm:text-sm text-gray-900">{claimTypeLabels[claim.claim_type] || `Type ${claim.claim_type}`}</td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-xs sm:text-sm text-gray-900">{priorityLabels[claim.priority]}</td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-xs sm:text-sm text-gray-900">{statusOptions.find(s => s.value === claim.claim_status.toString())?.label}</td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-xs sm:text-sm text-gray-900">{claim.creator?.username || 'N/A'}</td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-xs sm:text-sm text-gray-900">{claim.assignee?.username || 'N/A'}</td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-xs sm:text-sm text-gray-900">{claim.resolution_details}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </main>

    );
};

export default WarrantyClaimsMain;