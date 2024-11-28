import React from 'react';
import { Alert, AlertTitle, AlertDescription } from "../ui/alert";
import { AlertCircle, Package, Calendar, TrendingUp, DollarSign } from 'lucide-react';

const InventoryInsights = ({ data }) => {
  if (!data || Object.keys(data).length === 0) return null;

  return (
    <div className="mt-4 space-y-4">
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

export { InventoryInsights };