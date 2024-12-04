import React, { useState, useEffect, useCallback, useContext } from 'react';
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
import instance from './axiosConfig';
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
        className={`h-[calc(100vh-4rem)] overflow-y-auto ${
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
            <div className="lg:col-span-3">
              <SalesOrderTable />
            </div>
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
  const [timeRange, setTimeRange] = useState('12');
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const data = [
    { 
      month: 'Jan', 
      stockIn: 12000,
      stockOut: 3000,
      averageStock: 9000,
      turnoverRate: 0.25,
      reorderPoint: 5000,
      stockValue: 150000,
      forecastedDemand: 3500,
      seasonalityIndex: 0.9,
      stockoutRisk: 0.05
    },
    { 
      month: 'Feb', 
      stockIn: 9000,
      stockOut: 4000,
      averageStock: 14000,
      turnoverRate: 0.29,
      reorderPoint: 5000,
      stockValue: 175000,
      forecastedDemand: 4200,
      seasonalityIndex: 1.1,
      stockoutRisk: 0.08
    },
    { 
      month: 'Mar', 
      stockIn: 10000,
      stockOut: 8000,
      averageStock: 16000,
      turnoverRate: 0.50,
      reorderPoint: 5000,
      stockValue: 200000,
      forecastedDemand: 8500,
      seasonalityIndex: 1.4,
      stockoutRisk: 0.15
    }
  ];

  const calculateForecast = useCallback((historicalData, periods = 3) => {
    const alpha = 0.3; // Level smoothing
    const beta = 0.1;  // Trend smoothing
    const gamma = 0.2; // Seasonal smoothing
    
    let level = historicalData[0].stockOut;
    let trend = historicalData[1].stockOut - historicalData[0].stockOut;
    const seasonalIndices = historicalData.map(d => d.stockOut / level);
    
    return Array.from({ length: periods }, (_, i) => {
      const forecast = (level + trend) * seasonalIndices[i % seasonalIndices.length];
      const interval = forecast * 0.1;
      
      return {
        month: `${new Date(2024, i + 3, 1).toLocaleString('default', { month: 'short' })} (Forecast)`,
        forecastedDemand: Math.round(forecast),
        confidenceUpper: Math.round(forecast + interval),
        confidenceLower: Math.round(forecast - interval),
        seasonalityIndex: seasonalIndices[i % seasonalIndices.length]
      };
    });
  }, []);

  const forecastData = calculateForecast(data);

  // Seasonal patterns analysis
  const seasonalPatterns = {
    Q1: { avgDemand: 8500, trend: '+5%', peak: 'March' },
    Q2: { avgDemand: 7500, trend: '-2%', peak: 'None' },
    Q3: { avgDemand: 9500, trend: '+12%', peak: 'August' },
    Q4: { avgDemand: 12000, trend: '+25%', peak: 'December' }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="mt-2">
              <p style={{ color: entry.color }} className="text-sm font-medium">
                {entry.name}: {entry.value.toLocaleString()}
              </p>
              {entry.payload.seasonalityIndex && (
                <p className="text-xs text-gray-600">
                  Seasonality Index: {entry.payload.seasonalityIndex.toFixed(2)}
                </p>
              )}
              {entry.payload.stockoutRisk && (
                <p className="text-xs text-gray-600">
                  Stockout Risk: {(entry.payload.stockoutRisk * 100).toFixed(1)}%
                </p>
              )}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Simple date picker component
  const DatePicker = () => (
    <div className="flex items-center gap-4">
      <select 
        className="text-sm border rounded-lg px-3 py-2"
        value={timeRange}
        onChange={(e) => setTimeRange(e.target.value)}
      >
        <option value="3">Last 3 Months</option>
        <option value="6">Last 6 Months</option>
        <option value="12">Last 12 Months</option>
      </select>
      <button 
        onClick={() => setShowDatePicker(!showDatePicker)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50"
      >
        <Calendar className="w-4 h-4" />
        Custom Range
      </button>
      {showDatePicker && (
        <div className="absolute right-0 mt-2 bg-white border rounded-lg shadow-lg p-4">
          <div className="grid grid-cols-2 gap-4">
            <input 
              type="date" 
              className="border rounded px-2 py-1"
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            />
            <input 
              type="date" 
              className="border rounded px-2 py-1"
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button 
              onClick={() => setShowDatePicker(false)}
              className="px-3 py-1 text-sm text-gray-600 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                // Handle date range application
                setShowDatePicker(false);
              }}
              className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Stock Report</h2>
          <p className="text-sm text-gray-500">Advanced inventory analytics with forecasting</p>
        </div>
        <DatePicker />
      </div>

      {/* Seasonal Analysis Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {Object.entries(seasonalPatterns).map(([quarter, data]) => (
          <div key={quarter} className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <p className="text-sm font-medium text-gray-900">{quarter}</p>
              <TrendingUp className={`w-4 h-4 ${data.trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`} />
            </div>
            <p className="text-xl font-semibold mt-2">{data.avgDemand.toLocaleString()}</p>
            <p className="text-xs text-gray-600 mt-1">Peak: {data.peak}</p>
            <p className="text-xs text-gray-600">{data.trend} YoY</p>
          </div>
        ))}
      </div>

      {/* Main Chart */}
      <div className="h-80 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={[...data, ...forecastData]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar yAxisId="left" dataKey="stockIn" fill="#8884d8" name="Stock In" />
            <Bar yAxisId="left" dataKey="stockOut" fill="#82ca9d" name="Stock Out" />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="averageStock"
              stroke="#ff7300"
              name="Average Stock"
              strokeWidth={2}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="forecastedDemand"
              stroke="#ff0000"
              name="Forecasted Demand"
              strokeDasharray="5 5"
            />
            <ReferenceLine 
              y={5000} 
              yAxisId="left" 
              label="Reorder Point" 
              stroke="red" 
              strokeDasharray="3 3" 
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Forecast Confidence Chart */}
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={forecastData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="confidenceUpper"
              stroke="none"
              fill="#8884d8"
              fillOpacity={0.2}
            />
            <Area
              type="monotone"
              dataKey="confidenceLower"
              stroke="none"
              fill="#8884d8"
              fillOpacity={0.2}
            />
            <Line
              type="monotone"
              dataKey="forecastedDemand"
              stroke="#8884d8"
              strokeWidth={2}
              name="Forecast"
            />
          </AreaChart>
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
  const [sortBy, setSortBy] = useState('velocity');
  const { username } = useContext(GlobalContext);

  useEffect(() => {
    const fetchFastMovingItems = async () => {
      try {
        setIsLoading(true);
        const response = await instance.get('/sales/analytics/fast-moving', {
          params: {
            username,  
            timeRange,
            sortBy,
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
  }, [timeRange, sortBy, username]);

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      {/* Header Section - Stacked on mobile */}
      <div className="flex flex-col space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Fast Moving Items</h2>
          <p className="text-sm text-gray-500">Top selling products by volume</p>
        </div>
        
        {/* Controls - Full width on mobile, flex on desktop */}
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 sm:items-center">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="w-full sm:w-auto text-sm border rounded-lg px-3 py-2 bg-white hover:bg-gray-50"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full sm:w-auto text-sm border rounded-lg px-3 py-2 bg-white hover:bg-gray-50"
          >
            <option value="velocity">By Velocity</option>
            <option value="quantity">By Quantity</option>
            <option value="turnover">By Turnover</option>
          </select>
        </div>
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

              {/* Metrics - Grid layout that stacks on smaller screens */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <p className="text-xs text-gray-500">Daily Sales</p>
                  <p className="text-sm font-medium">{(item.dailyVelocity || 0).toFixed(1)} units</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Turnover</p>
                  <p className="text-sm font-medium">{(item.turnoverRate || 0).toFixed(2)}x</p>
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