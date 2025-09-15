import React from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { Calendar } from "lucide-react";

interface DistributorProductFormProps {
  isVisible: boolean;
  onClose: () => void;
}

export const DistributorProductForm: React.FC<DistributorProductFormProps> = ({ isVisible, onClose }) => {
  if (!isVisible) return null;

  return (
    <div className="mt-8 bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Distributor Product Registration</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Product Information */}
        <div>
          <h3 className="font-semibold mb-2">Product Information</h3>

          <div className="space-y-4">
            <div>
              <Label>Product Name *</Label>
              <Input placeholder="e.g., Premium Packaged Grains" />
            </div>

            <div>
              <Label>Category *</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grains">Grains</SelectItem>
                  <SelectItem value="packaged-food">Packaged Food</SelectItem>
                  <SelectItem value="beverages">Beverages</SelectItem>
                  <SelectItem value="supplements">Supplements</SelectItem>
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
                <Label>Quantity *</Label>
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

        {/* Distribution Information */}
        <div>
          <h3 className="font-semibold mb-2">Distribution Information</h3>

          <div className="space-y-4">
            <div>
              <Label>Distributor Name *</Label>
              <Input placeholder="e.g., GreenField Distributors" />
            </div>

            <div>
              <Label>Warehouse Location *</Label>
              <Input placeholder="Search for a city or location..." />
            </div>

            <div>
              <Label>Dispatch Date *</Label>
              <Input type="date" />
            </div>

            <div>
              <Label>Certifications (Optional)</Label>
              <div className="flex gap-4 mt-2">
                <div>
                  <input type="checkbox" id="cert1" />
                  <label htmlFor="cert1" className="ml-2">Certified Distributor</label>
                </div>
                <div>
                  <input type="checkbox" id="cert2" />
                  <label htmlFor="cert2" className="ml-2">Temperature Controlled</label>
                </div>
                <div>
                  <input type="checkbox" id="cert3" />
                  <label htmlFor="cert3" className="ml-2">Eco-Friendly Packaging</label>
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
