import React from 'react';
import { Bot, AlertCircle, Package, Calendar, TrendingUp, DollarSign } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

const BotMessage = ({ text, data, isError }) => {
  const renderInventoryInsights = (data) => {
    if (!data || Object.keys(data).length === 0) return null;

    return (
      <div className="mt-4 space-y-4">
        {/* Low Stock Alerts - Only show if lowStockItems exists and has items */}
        {data.lowStockItems?.length > 0 && (
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="text-red-800">Low Stock Alert</AlertTitle>
            <AlertDescription>
              <div className="mt-2 space-y-1">
                {data.lowStockItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-red-600">{item.stock} units left</span>
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Expiring Items - Only show if expiringItems exists and has items */}
        {data.expiringItems?.length > 0 && (
          <Alert className="bg-amber-50 border-amber-200">
            <Calendar className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Expiring Products</AlertTitle>
            <AlertDescription>
              <div className="mt-2 space-y-1">
                {data.expiringItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-amber-600">
                      {item.daysRemaining} days remaining
                    </span>
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Inventory Summary - Only show if totalValue exists */}
        {typeof data.totalValue === 'number' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Alert className="bg-blue-50 border-blue-200">
              <Package className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">Total Products</AlertTitle>
              <AlertDescription>
                <span className="text-2xl font-semibold text-blue-600">
                  {data.productCount}
                </span>
                <span className="text-sm text-blue-600 ml-2">items in stock</span>
              </AlertDescription>
            </Alert>

            <Alert className="bg-green-50 border-green-200">
              <DollarSign className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Total Value</AlertTitle>
              <AlertDescription>
                <span className="text-2xl font-semibold text-green-600">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'MYR'
                  }).format(data.totalValue)}
                </span>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Manufacturer Distribution - Only show if categories exists */}
        {Object.keys(data.categories || {}).length > 0 && (
          <Alert className="bg-purple-50 border-purple-200">
            <TrendingUp className="h-4 w-4 text-purple-600" />
            <AlertTitle className="text-purple-800">Stock Distribution</AlertTitle>
            <AlertDescription>
              <div className="mt-2 space-y-2">
                {Object.entries(data.categories).map(([manufacturer, info]) => (
                  <div key={manufacturer} className="flex justify-between items-center text-sm">
                    <span className="font-medium">{manufacturer}</span>
                    <div className="text-right">
                      <div className="text-purple-600">{info.count} products</div>
                      <div className="text-sm text-purple-500">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'MYR'
                        }).format(info.totalValue)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  return (
    <div className="flex items-start gap-3 transition-opacity duration-300 ease-in-out animate-fade-in">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
        <Bot className="w-5 h-5 text-purple-600" />
      </div>
      
      <div className="flex-1">
        <div className={`px-4 py-3 rounded-2xl rounded-tl-none 
          ${isError ? 'bg-red-50 text-red-600' : 'bg-gray-100'}
        `}>
          <div className="text-sm whitespace-pre-wrap">{text}</div>
        </div>
        {renderInventoryInsights(data)}
      </div>
    </div>
  );
};

export default BotMessage;