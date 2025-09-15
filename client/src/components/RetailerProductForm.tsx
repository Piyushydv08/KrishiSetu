import React from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";

interface RetailerProductFormProps {
  isVisible: boolean;
  onClose: () => void;
}

export const RetailerProductForm: React.FC<RetailerProductFormProps> = ({ isVisible, onClose }) => {
  if (!isVisible) return null;

  return (
    <div className="mt-8 bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Retailer Product Registration</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Product Details */}
        <div>
          <h3 className="font-semibold mb-2">Product Details</h3>

          <div className="space-y-4">
            <div>
              <Label>Product Name *</Label>
              <Input placeholder="e.g., Fresh Organic Fruits" />
            </div>

            <div>
              <Label>Category *</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fruits">Fruits</SelectItem>
                  <SelectItem value="vegetables">Vegetables</SelectItem>
                  <SelectItem value="dairy">Dairy</SelectItem>
                  <SelectItem value="snacks">Snacks</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Description (Optional)</Label>
              <textarea
                placeholder="Brief description of the product..."
                className="w-full rounded-md border border-gray-300 p-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Available Quantity *</Label>
                <Input placeholder="Amount" />
              </div>
              <div>
                <Label>Unit *</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="ltr">ltr</SelectItem>
                    <SelectItem value="pack">pack</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Retail Info */}
        <div>
          <h3 className="font-semibold mb-2">Retail Information</h3>

          <div className="space-y-4">
            <div>
              <Label>Store Name *</Label>
              <Input placeholder="e.g., FreshMart Retailers" />
            </div>

            <div>
              <Label>Store Location *</Label>
              <Input placeholder="Search for a city or location..." />
            </div>

            <div>
              <Label>Restock Date *</Label>
              <Input type="date" />
            </div>

            <div>
              <Label>Certifications (Optional)</Label>
              <div className="flex gap-4 mt-2">
                <div>
                  <input type="checkbox" id="cert1" />
                  <label htmlFor="cert1" className="ml-2">Customer Satisfaction Certified</label>
                </div>
                <div>
                  <input type="checkbox" id="cert2" />
                  <label htmlFor="cert2" className="ml-2">Freshness Guarantee</label>
                </div>
                <div>
                  <input type="checkbox" id="cert3" />
                  <label htmlFor="cert3" className="ml-2">Local Sourcing</label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 mt-6">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={onClose}>Register & Generate QR Code</Button>
      </div>
    </div>
  );
};
