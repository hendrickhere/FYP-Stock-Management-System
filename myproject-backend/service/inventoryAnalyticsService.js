const { Op, Sequelize, literal } = require('sequelize');
const db = require('../models');
const { Product, SalesOrderInventory, SalesOrder } = db;

class InventoryAnalyticsService {
  static async getStockReport(organizationId, timeRange = 30) {
      if (!organizationId) {
          throw new Error('Organization ID is required');
      }

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - timeRange);

      try {
          // First get sales order data with organization filter
          const salesData = await db.SalesOrder.findAll({
              where: {
                  organization_id: organizationId,
                  order_date_time: {
                      [Op.between]: [startDate, endDate]
                  }
              },
              include: [{
                  model: db.SalesOrderInventory,
                  as: 'items',
                  include: [{
                      model: db.Product,
                      as: 'Product',
                      attributes: [
                          'product_id',
                          'product_name',
                          'sku_number',
                          'product_stock',
                          'manufacturer'
                      ]
                  }]
              }],
              attributes: [
                  'sales_order_id',
                  'order_date_time'
              ],
              raw: false,
              nest: true
          });

          // Process the data to get the metrics we need
          const stockMovements = salesData.reduce((acc, order) => {
              order.items.forEach(item => {
                  if (!acc[item.product_id]) {
                      acc[item.product_id] = {
                          product: item.Product,
                          total_quantity: 0,
                          order_count: 0,
                          dates: new Set()
                      };
                  }
                  acc[item.product_id].total_quantity += item.quantity;
                  acc[item.product_id].dates.add(order.order_date_time.toISOString().split('T')[0]);
                  acc[item.product_id].order_count += 1;
              });
              return acc;
          }, {});

          // Transform the data for our response
          const metrics = Object.entries(stockMovements).map(([productId, data]) => ({
              product_id: productId,
              product_name: data.product.product_name,
              sku_number: data.product.sku_number,
              current_stock: data.product.product_stock,
              manufacturer: data.product.manufacturer,
              total_quantity: data.total_quantity,
              order_count: data.order_count,
              turnover_rate: ((data.total_quantity / timeRange) * 7).toFixed(2), // Weekly turnover
              velocity: (data.total_quantity / timeRange).toFixed(2),
              stock_days: data.product.product_stock / ((data.total_quantity / timeRange) || 1)
          }));

          const historicalData = Array.from(
              new Set(salesData.map(order => order.order_date_time.toISOString().split('T')[0]))
          ).sort().map(date => ({
              date,
              total_quantity: salesData
                  .filter(order => order.order_date_time.toISOString().split('T')[0] === date)
                  .reduce((sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0),
              order_count: salesData
                  .filter(order => order.order_date_time.toISOString().split('T')[0] === date)
                  .length
          }));

          const insights = this.generateInsights(metrics);

          return {
              currentPeriod: {
                  startDate,
                  endDate,
                  metrics
              },
              historicalData,
              insights
          };

      } catch (error) {
          console.error('Error in stock report generation:', {
              error: error.message,
              stack: error.stack,
              organizationId,
              timeRange
          });
          throw new Error(`Failed to generate stock report: ${error.message}`);
      }
  }

  static calculateMetrics(products, salesData, timeRange) {
      return products.map(product => {
          const productSales = salesData.filter(sale => sale.product_id === product.product_id);
          const totalQuantity = productSales.reduce((sum, sale) => sum + parseInt(sale.total_quantity || 0), 0);
          const orderCount = productSales.reduce((sum, sale) => sum + parseInt(sale.order_count || 0), 0);
          
          return {
              product_id: product.product_id,
              product_name: product.product_name,
              sku_number: product.sku_number,
              current_stock: product.product_stock,
              manufacturer: product.manufacturer,
              total_quantity: totalQuantity,
              order_count: orderCount,
              turnover_rate: ((totalQuantity / timeRange) * 7).toFixed(2), // Weekly turnover
              velocity: (totalQuantity / timeRange).toFixed(2),
              stock_days: product.product_stock / ((totalQuantity / timeRange) || 1),
              reorder_point: this.calculateReorderPoint(totalQuantity, timeRange, product.product_stock)
          };
      });
  }

  static calculateReorderPoint(item, timeRange) {
    const dailyVelocity = item.total_quantity / timeRange;
    const leadTime = 7; // 7 days lead time
    const safetyStock = Math.ceil(dailyVelocity * 3); // 3 days safety stock
    return Math.ceil(dailyVelocity * leadTime + safetyStock);
  }

  static generateForecasts(stockMovements, metrics, timeRange) {
    const forecastPeriods = [7, 14, 30]; // 1 week, 2 weeks, 1 month
    const forecasts = {};

    metrics.forEach(item => {
      const dailyVelocity = parseFloat(item.velocity);
      const variability = this.calculateVariability(item.daily_sales);

      forecasts[item.product_id] = forecastPeriods.reduce((acc, period) => {
        const forecast = this.calculateForecast(dailyVelocity, variability, period);
        acc[period] = {
          expected_demand: Math.round(forecast.expected),
          upper_bound: Math.round(forecast.upper),
          lower_bound: Math.round(forecast.lower),
          confidence: forecast.confidence
        };
        return acc;
      }, {});
    });

    return forecasts;
  }

  static calculateVariability(dailySales) {
    if (!dailySales.length) return 0;
    const mean = dailySales.reduce((sum, sale) => sum + sale.quantity, 0) / dailySales.length;
    const variance = dailySales.reduce((sum, sale) => sum + Math.pow(sale.quantity - mean, 2), 0) / dailySales.length;
    return Math.sqrt(variance);
  }

  static calculateForecast(dailyVelocity, variability, period) {
    const expected = dailyVelocity * period;
    const standardError = variability * Math.sqrt(period);
    const confidenceInterval = 1.96 * standardError; // 95% confidence interval

    return {
      expected,
      upper: expected + confidenceInterval,
      lower: Math.max(0, expected - confidenceInterval),
      confidence: 0.95
    };
  }

  static aggregateHistoricalData(stockMovements) {
    const dailyAggregation = stockMovements.reduce((acc, movement) => {
      const date = movement.date;
      if (!acc[date]) {
        acc[date] = {
          date,
          total_quantity: 0,
          order_count: 0
        };
      }
      acc[date].total_quantity += parseInt(movement.total_quantity);
      acc[date].order_count += parseInt(movement.order_count);
      return acc;
    }, {});

    return Object.values(dailyAggregation).sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  static generateInsights(metrics, forecasts) {
    return {
      low_stock_alerts: metrics.filter(item => 
        item.current_stock <= item.reorder_point
      ).map(item => ({
        product_name: item.product_name,
        current_stock: item.current_stock,
        reorder_point: item.reorder_point,
        days_remaining: Math.ceil(item.stock_days)
      })),
      high_turnover_items: metrics
        .sort((a, b) => b.turnover_rate - a.turnover_rate)
        .slice(0, 5)
        .map(item => ({
          product_name: item.product_name,
          turnover_rate: item.turnover_rate,
          velocity: item.velocity
        })),
      stock_health_summary: {
        total_products: metrics.length,
        low_stock_count: metrics.filter(item => item.current_stock <= item.reorder_point).length,
        healthy_stock_count: metrics.filter(item => item.current_stock > item.reorder_point).length,
        average_turnover: metrics.reduce((sum, item) => sum + parseFloat(item.turnover_rate), 0) / metrics.length
      }
    };
  }
}

module.exports = InventoryAnalyticsService;