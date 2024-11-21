import { BsDatabaseFillAdd } from "react-icons/bs";
import { Card, CardContent } from "../ui/card";

function SalesSummary({taxAmount, discountAmount, subTotal, grandTotal, discounts, taxes}) {
  return (
    <Card className="w-96">
      <CardContent className="p-6 bg-white rounded-lg">
        <div className="space-y-4">
          {/* Calculations */}
          <div className="space-y-2 pt-4 border-t">
            <div className="flex justify-between text-m font-medium">
              <span className="text-gray-600">Subtotal:</span>
              <span>
                MYR{" "}
                {subTotal}
              </span>
            </div>
            {discounts.map((discount, index) => {
              return (<div className="flex justify-between text-sm">
                <span className="text-red-500">{discount.discount_name} - {discount.discount_rate * 100}%</span>
                <span className="text-red-500">
                  - MYR {discount.discount_amount}
                </span>
              </div>)
            })}
            <div className="flex justify-between text-m font-medium">
              <span className="text-gray-600">Total Discount:</span>
              <span className="text-gray-500">
                - MYR {discountAmount}
              </span>
            </div>
            <div className="flex justify-between text-m font-medium">
              <span className="text-gray-600">Amount After Discount:</span>
              <span className="text-gray-600">
                MYR {subTotal - discountAmount}
              </span>
            </div>
            {taxes.map((tax, index) => {
              return (<div className="flex justify-between text-sm">
                <span className="text-green-600">{tax.tax_name} - {tax.tax_rate * 100}%</span>
                <span className="text-green-500">
                  + MYR {tax.tax_amount}
                </span>
              </div>)
            })}
            <div className="flex justify-between text-m font-medium">
              <span className="text-gray-600">Total Tax:</span>
              <span>MYR {taxAmount}</span>
            </div>
            <div className="flex justify-between text-base font-bold pt-2 border-t">
              <span>Grand Total:</span>
              <span>MYR {grandTotal}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default SalesSummary