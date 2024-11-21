import React, { useState, useEffect, useCallback } from 'react';
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

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <main className="flex-1">
      <div className={`h-[calc(100vh-4rem)] overflow-y-auto ${isMobile ? 'w-full' : 'ml-[13rem]'}`}>
        <div className="p-6">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {userRole === 'manager' ? 'Manager' : 'Staff'}
              </h1>
            <p className="text-gray-600 mt-1">Here's what's happening with your store today.</p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {isManager && (
              <QuickStatCard
                title="Today's Sale"
                value="RM10,000"
                trend="+10%"
                icon={<DollarSign className="w-6 h-6" />}
                trendUp={true}
              />
            )}
            <QuickStatCard
              title="Registered Customers"
              value="2,000"
              trend="+5"
              icon={<Users className="w-6 h-6" />}
              trendUp={true}
            />
            <QuickStatCard
              title="Total Products"
              value="498"
              trend="-3"
              icon={<Package className="w-6 h-6" />}
              trendUp={false}
            />
            <QuickStatCard
              title="Daily Appointments"
              value="15"
              trend="+2"
              icon={<Calendar className="w-6 h-6" />}
              trendUp={true}
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
            <div className={`${isManager ? 'lg:col-span-1' : 'lg:col-span-3'}`}>
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
  
  // Enhanced sample data with more metrics and forecasting
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

  // Calculate forecasts using Triple Exponential Smoothing
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
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Low Stock Alert</h2>
        <AlertTriangle className="text-amber-500 w-5 h-5" />
      </div>
      <div className="space-y-4">
        {[
          { name: 'Battery Type A', stock: 5, threshold: 10 },
          { name: 'Battery Type B', stock: 3, threshold: 10 },
          { name: 'Battery Type C', stock: 4, threshold: 10 },
        ].map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{item.name}</span>
            <span className="text-sm font-medium text-amber-600">
              {item.stock} left
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const FastMovingItems = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Fast Moving Items</h2>
        <TrendingUp className="text-green-500 w-5 h-5" />
      </div>
      <div className="space-y-4">
        {[
          { name: 'Battery 1', sales: 150 },
          { name: 'Battery 2', sales: 120 },
          { name: 'Battery 3', sales: 100 },
        ].map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{item.name}</span>
            <span className="text-sm font-medium text-green-600">
              {item.sales} units
            </span>
          </div>
        ))}
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