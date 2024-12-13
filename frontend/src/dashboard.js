import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import Header from './header';
import Sidebar from './sidebar';
import { BarChart3, Users, Package, Calendar, TrendingUp, DollarSign, ShoppingCart, AlertTriangle, ChevronDown, ZoomIn } from 'lucide-react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Scatter,
  AreaChart,
  Area,
} from 'recharts';
import { GlobalContext } from './globalContext';
import { RefreshCcw } from 'lucide-react';
import instance from './axiosConfig';

const useStockReport = (username, timeRange = 30) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
      const fetchStockReport = async () => {
          try {
              setLoading(true);
              setError(null);

              if (!username) {
                  throw new Error('Username is required');
              }

              // Note the correct path structure
              const response = await instance.get(`/user/${encodeURIComponent(username)}/stock-report`, {
                  params: { timeRange }
              });

              console.log('Stock report response:', response);

              if (response.data?.success) {
                  setData(response.data.data);
              } else {
                  throw new Error(response.data?.error?.message || 'Failed to fetch stock report');
              }
          } catch (error) {
              console.error('Stock report fetch error:', {
                  error: error.message,
                  response: error.response?.data,
                  status: error.response?.status
              });
              setError(error);
          } finally {
              setLoading(false);
          }
      };

        fetchStockReport();
    }, [username, timeRange]);

    return { data, loading, error };
};

const Dashboard = ({ userRole = 'manager', onLogout}) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex flex-col h-screen w-full">
      <Header onLogout={onLogout}/>
      <div className="flex flex-row flex-grow">
        <Sidebar onLogout={onLogout} />
        <MainContent userRole={userRole} isMobile={isMobile} />
      </div>
    </div>
  );
};

const MainContent = ({ userRole }) => {
  const isManager = userRole === 'manager';
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [totalSales, setTotalSales] = useState(0); 
  const [timeRange, setTimeRange] = useState(86400000); 
  const {username} = useContext(GlobalContext);
  const [customerCount, setCustomerCount] = useState({
    totalCount: 0, 
    newToday: 0
  }); 
  const [productCount, setProductCount] = useState({
    totalCount: 0,
    newToday: 0
  });
  const [appointmentCount, setAppointmentCount] = useState({
    totalCount: 0,
    newToday: 0
  });

  const [userData, setUserData] = useState(() => {
  const storedData = sessionStorage.getItem('userData');
    return storedData ? JSON.parse(storedData) : { username: '', role: '' };
  });

  const fetchTotalSalesWithTimeRange = async (timeRange) => {
    try{
      const total = await instance.get(`/sales/${username}/salesOrderTotal?range=${timeRange}`)

      if(total) {
        setTotalSales(total.data.data.totalSales);
      }
    } catch (err) {
      console.error(err);
    }
  }

  const fetchTotalCustomerCount = async (username) => {
    try{
      const total = await instance.get(`/stakeholders/customers/count?username=${username}`);
      setCustomerCount(total.data.data); 
    } catch (err) {
      console.error(err);
    }
  }

  const fetchAppointmentCount = async (username) => {
    try {
      const total = await instance.get(
        `/appointment/count?username=${username}`
      );
      setAppointmentCount(total.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTotalProductCount = async (username) => {
    try {
      const total = await instance.get(`/user/inventory/count?username=${username}`);
      setProductCount(total.data.data);
    } catch(err) {
      console.error(err);
    }
  }
  useEffect(() => {
    fetchTotalSalesWithTimeRange(timeRange);
    fetchTotalCustomerCount(username);
    fetchTotalProductCount(username);
    fetchAppointmentCount(username);
  }, [timeRange]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <main className="flex-1">
      <div
        className={`h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar ${
          isMobile ? "w-full" : "ml-[13rem]"
        }`}
      >
        <div className="p-6">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {userData.role}
            </h1>
            <p className="text-gray-600 mt-1">  
              {userData.role === 'Manager' 
                ? "Here's your management overview for today"
                : "Here's your overview for today"}
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {isManager && (
              <QuickStatCard
                title="Today's Sale"
                value={`RM${totalSales}`}
                trend="+10%"
                icon={<DollarSign className="w-6 h-6" />}
                trendUp={true}
              />
            )}
            <QuickStatCard
              title="Registered Customers"
              value={customerCount.total}
              trend={`+${customerCount.newToday}`}
              icon={<Users className="w-6 h-6" />}
              trendUp={true}
            />
            <QuickStatCard
              title="Total Products"
              value={productCount.total}
              trend={`+${productCount.newToday}`}
              icon={<Package className="w-6 h-6" />}
              trendUp={true}
            />
            <QuickStatCard
              title="Daily Appointments"
              value={appointmentCount.newToday}
              //trend="+2"
              icon={<Calendar className="w-6 h-6" />}
              //trendUp={true}
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stock Report - Takes up 2 columns when manager */}
            {isManager && (
              <div className="lg:col-span-2">
                <StockReport />
              </div>
            )}

            {/* Right Side Content */}
            <div className={`${isManager ? "lg:col-span-1" : "lg:col-span-3"}`}>
              <div className="space-y-6">
                <LowStockAlert />
                <FastMovingItems />
              </div>
            </div>

            {/* Sales Order Table - Full width */}
            {/* <div className="lg:col-span-3">
              <SalesOrderTable />
            </div> */}
          </div>
        </div>
      </div>
    </main>
  );
};

const QuickStatCard = ({ title, value, trend, icon, trendUp, visible = true }) => {
  if (!visible) return null;
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg">
          {icon}
        </div>
        <span className={`text-sm font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
          {trend}
        </span>
      </div>
      <h3 className="mt-4 text-2xl font-semibold text-gray-900">{value}</h3>
      <p className="text-gray-600 text-sm">{title}</p>
    </div>
  );
};

const StockReport = () => {
  const [timeRange, setTimeRange] = useState(30);
  const { username } = useContext(GlobalContext);
  
  const useStockReport = (username, timeRange = 30) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
      const fetchStockReport = async () => {
        try {
          setLoading(true);
          setError(null);

          if (!username) {
            throw new Error('Username is required');
          }

          const response = await instance.get(`/user/${encodeURIComponent(username)}/stock-report`, {
            params: { timeRange }
          });

          if (response.data?.success) {
            setData(response.data.data);
          } else {
            throw new Error(response.data?.error?.message || 'Failed to fetch stock report');
          }
        } catch (error) {
          console.error('Stock report error details:', {
            error: error.message,
            response: error.response?.data,
            request: error.config
          });
          
          setError({
            message: error.message,
            details: error.response?.data
          });
        } finally {
          setLoading(false);
        }
      };

      if (username) {
        fetchStockReport();
      }
    }, [username, timeRange]);

    return { data, loading, error };
  };

  const { data, loading, error } = useStockReport(username, timeRange);

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col items-center justify-center h-80">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-4" />
          <p className="text-gray-500">Loading stock report...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center text-red-600 mb-4">
          <AlertTriangle className="w-5 h-5 mr-2" />
          <h3 className="font-semibold">Error Loading Stock Report</h3>
        </div>
        <div className="bg-red-50 rounded-lg p-4 text-sm text-red-700">
          <p className="mb-2">We encountered an error while loading your stock report:</p>
          <p className="font-mono bg-white p-2 rounded">
            {error.message || 'Unknown error occurred'}
          </p>
        </div>
      </div>
    );
  }

  // No user state
  if (!username) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-amber-600">
          No user information available. Please try logging in again.
        </div>
      </div>
    );
  }

  const transformDataForChart = (reportData) => {
    if (!reportData || typeof reportData !== 'object') {
      console.warn('No data available for chart transformation');
      return [];
    }

    // Transform historical data
    const historical = (reportData.historicalData || []).map(item => {
      if (!item || !item.date) {
        console.warn('Invalid historical data item:', item);
        return null;
      }

      return {
        date: new Date(item.date).toLocaleDateString('default', { 
          month: 'short', 
          day: 'numeric' 
        }),
        stockOut: item.total_quantity || 0,
        orderCount: item.order_count || 0
      };
    }).filter(item => item !== null);

    // Transform forecasts
    const forecasts = reportData.forecasts ? Object.entries(reportData.forecasts).map(([productId, periods]) => {
      if (!periods || !periods[7]) {
        console.warn('Invalid forecast data for product:', productId);
        return null;
      }

      return {
        date: `Next ${periods[7].expected_demand || 0} days`,
        forecastedDemand: periods[7].expected_demand || 0,
        confidenceUpper: periods[7].upper_bound || 0,
        confidenceLower: periods[7].lower_bound || 0
      };
    }).filter(item => item !== null) : [];

    return [...historical, ...forecasts];
  };

  const chartData = transformDataForChart(data);

  if (!chartData.length) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <p className="text-gray-500 text-center">No data available for the selected time range</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Stock Movement Analysis</h2>
          <p className="text-sm text-gray-500">Historical stock movement and demand forecasting</p>
        </div>
        <select 
          className="text-sm border rounded-lg px-3 py-2"
          value={timeRange}
          onChange={(e) => setTimeRange(parseInt(e.target.value))}
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>

      {/* Main Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" name="Stock Movement" />
            <YAxis yAxisId="right" orientation="right" name="Forecast" />
            <Tooltip />
            <Legend />
            <Bar 
              yAxisId="left" 
              dataKey="stockOut" 
              fill="#82ca9d" 
              name="Stock Movement" 
              barSize={20}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="forecastedDemand"
              stroke="#8884d8"
              name="Forecasted Demand"
              strokeWidth={2}
              dot={false}
            />
            <Area
              yAxisId="right"
              dataKey="confidenceUpper"
              stroke="none"
              fill="#8884d8"
              fillOpacity={0.1}
              name="Confidence Interval"
            />
            <Area
              yAxisId="right"
              dataKey="confidenceLower"
              stroke="none"
              fill="#8884d8"
              fillOpacity={0.1}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const LowStockAlert = () => {
  const [lowStockItems, setLowStockItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { username } = useContext(GlobalContext);

  useEffect(() => {
    const fetchLowStockItems = async () => {
      try {
        // Get all inventory items
        const response = await instance.get(`/user/${username}/inventories`);
        
        const items = response.data.inventories.filter(item => 

          item.product_stock < 10
        ).map(item => ({
          name: item.product_name,
          stock: item.product_stock,
          threshold: 10, 
          sku: item.sku_number
        })).slice(0, 5); // Show top 5 low stock items

        setLowStockItems(items);
      } catch (error) {
        console.error('Error fetching low stock items:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLowStockItems();
  }, [username]);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Low Stock Alert</h2>
        <AlertTriangle className="text-amber-500 w-5 h-5" />
      </div>
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <span className="text-sm text-gray-500">Loading...</span>
          </div>
        ) : lowStockItems.length > 0 ? (
          lowStockItems.map((item) => (
            <div key={item.sku} className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm text-gray-600">{item.name}</span>
                <span className="text-xs text-gray-400">SKU: {item.sku}</span>
              </div>
              <span className={`text-sm font-medium ${
                item.stock <= item.threshold/2 ? 'text-red-600' : 'text-amber-600'
              }`}>
                {item.stock} left
              </span>
            </div>
          ))
        ) : (
          <div className="text-center py-4">
            <span className="text-sm text-gray-500">All stock levels are healthy</span>
          </div>
        )}
      </div>
    </div>
  );
};

const FastMovingItems = () => {
  const [fastMovingData, setFastMovingData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);
  const { username } = useContext(GlobalContext);

  useEffect(() => {
    const fetchFastMovingItems = async () => {
      try {
        setIsLoading(true);
        const response = await instance.get('/sales/analytics/fast-moving', {
          params: {
            username,  
            timeRange,
            limit: 3
          }
        });

        if (response.data?.success && response.data?.data) {
          setFastMovingData(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching fast-moving items:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFastMovingItems();
  }, [timeRange, username]);

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Fast Moving Items</h2>
          <p className="text-sm text-gray-500">Top selling products by volume</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(Number(e.target.value))}
          className="text-sm border rounded-lg px-3 py-2 bg-white hover:bg-gray-50"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Products List Section */}
      <div className="mt-6 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600" />
          </div>
        ) : fastMovingData?.fastMovingItems?.length > 0 ? (
          fastMovingData.fastMovingItems.map((item, index) => (
            <div key={index} className="border rounded-lg p-4">
              {/* Product Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-sm font-medium">{item.productName || 'Unknown Product'}</h3>
                  <p className="text-xs text-gray-500">SKU: {item.skuNumber || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-semibold">{item.totalQuantity || 0}</span>
                  <p className="text-xs text-gray-500">units sold</p>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-xs text-gray-500">Daily Average Sales</p>
                  <p className="text-sm font-medium">{(item.dailyVelocity || 0).toFixed(1)} units</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Current Stock</p>
                  <p className="text-sm font-medium">{item.currentStock || 0} units</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6">
            <Package className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">No fast-moving items found</p>
          </div>
        )}
      </div>
    </div>
  );
};

const SalesOrderTable = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Sales Orders</h2>
        <select className="text-sm border rounded-lg px-3 py-2">
          <option>Last 7 Days</option>
          <option>Last 30 Days</option>
          <option>Last 90 Days</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-3">Channel</th>
              <th className="px-6 py-3">Draft</th>
              <th className="px-6 py-3">Confirmed</th>
              <th className="px-6 py-3">Packed</th>
              <th className="px-6 py-3">Shipped</th>
              <th className="px-6 py-3">Invoiced</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4">Direct Sales</td>
              <td className="px-6 py-4">2</td>
              <td className="px-6 py-4">32</td>
              <td className="px-6 py-4">42</td>
              <td className="px-6 py-4">23</td>
              <td className="px-6 py-4">7</td>
            </tr>
            {/* Add more rows as needed */}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;