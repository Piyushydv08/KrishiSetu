// src/components/DistributorProductForm.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface DistributorProductFormProps {
  isVisible: boolean;
  transferId?: string; // id of ownership transfer that we will accept after registration
  productId?: string; // optional product id
  onClose: (result?: { submitted?: boolean; productId?: string }) => void;
}

export const DistributorProductForm: React.FC<DistributorProductFormProps> = ({ isVisible, onClose, transferId, productId }) => {
  if (!isVisible) return null;

  const { firebaseUser } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [distributorName, setDistributorName] = useState("");
  const [warehouseLocation, setWarehouseLocation] = useState("");
  const [dispatchDate, setDispatchDate] = useState("");
  const [certifications, setCertifications] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const toggleCertification = (cert: string) => {
    setCertifications((prev) => (prev.includes(cert) ? prev.filter((c) => c !== cert) : [...prev, cert]));
  };

  const validate = () => {
    if (!name.trim()) return "Product name is required";
    if (!category) return "Category is required";
    if (!quantity.trim()) return "Quantity is required";
    if (!unit) return "Unit is required";
    if (!distributorName.trim()) return "Distributor name is required";
    if (!warehouseLocation.trim()) return "Warehouse location is required";
    if (!dispatchDate) return "Dispatch date is required";
    if (!transferId) return "Missing transfer id";
    return null;
  };

  const handleSubmit = async () => {
    // const err = validate();
    // if (err) {
    //   toast?.({ title: "Validation error", description: err, variant: "destructive" });
    //   return;
    // }

    if (!firebaseUser) {
      toast?.({ title: "Not authenticated", description: "Please sign in and try again.", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    try {
      const idToken = await firebaseUser.getIdToken();

      const payload = {
        productData: {
          name,
          category,
          description,
          quantity,
          unit,
          distributorName,
          warehouseLocation, // This will be used as the distributor location
          dispatchDate,
          certifications,
        },
        productId,
      };

      const res = await fetch(`/api/ownership-transfers/${transferId}/accept`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "firebase-uid": firebaseUser.uid,
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // try to parse error body
        const body = await res.json().catch(() => null);
        const msg = body?.message || `${res.status} ${res.statusText}`;
        if (res.status === 401 || res.status === 403) {
          toast?.({ title: "Unauthorized", description: msg, variant: "destructive" });
        } else {
          toast?.({ title: "Failed", description: msg, variant: "destructive" });
        }
        throw new Error(msg);
      }

      const data = await res.json();

      toast?.({ title: "Success", description: "Product registered and ownership accepted." });

      // success: close modal and tell header to redirect to product page
      onClose({ submitted: true, productId: productId ?? data.productId });
    } catch (e: any) {
      console.error("Error submitting distributor registration:", e);
      // if toast above already fired, this is extra safety
      if (!e?.message) {
        toast?.({ title: "Error", description: "Failed to register product. Try again.", variant: "destructive" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
      <div className="mt-12 bg-white p-6 rounded-lg shadow-md max-w-4xl w-full">
        <h2 className="text-2xl font-bold mb-4">Distributor Product Registration</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Information */}
          <div>
            <h3 className="font-semibold mb-2">Product Information</h3>
            <div className="space-y-4">
              <div>
                <Label>Product Name *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Premium Packaged Grains" />
              </div>

              <div>
                <Label>Category *</Label>
                <Select value={category} onValueChange={(v) => setCategory(v)}>
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
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of the product..." className="w-full rounded-md border border-gray-300 p-2" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Quantity *</Label>
                  <Input value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Amount" />
                </div>
                <div>
                  <Label>Unit *</Label>
                  <Select value={unit} onValueChange={(v) => setUnit(v)}>
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
                <Input value={distributorName} onChange={(e) => setDistributorName(e.target.value)} placeholder="e.g., GreenField Distributors" />
              </div>

              <div>
                <Label>Warehouse Location *</Label>
                <Input value={warehouseLocation} onChange={(e) => setWarehouseLocation(e.target.value)} placeholder="Search for a city or location..." />
              </div>

              <div>
                <Label>Dispatch Date *</Label>
                <Input type="date" value={dispatchDate} onChange={(e) => setDispatchDate(e.target.value)} />
              </div>

              <div>
                <Label>Certifications (Optional)</Label>
                <div className="flex gap-4 mt-2">
                  <div>
                    <input type="checkbox" id="cert1" checked={certifications.includes("Certified Distributor")} onChange={() => toggleCertification("Certified Distributor")} />
                    <label htmlFor="cert1" className="ml-2">Certified Distributor</label>
                  </div>
                  <div>
                    <input type="checkbox" id="cert2" checked={certifications.includes("Temperature Controlled")} onChange={() => toggleCertification("Temperature Controlled")} />
                    <label htmlFor="cert2" className="ml-2">Temperature Controlled</label>
                  </div>
                  <div>
                    <input type="checkbox" id="cert3" checked={certifications.includes("Eco-Friendly Packaging")} onChange={() => toggleCertification("Eco-Friendly Packaging")} />
                    <label htmlFor="cert3" className="ml-2">Eco-Friendly Packaging</label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Button variant="outline" onClick={() => onClose({ submitted: false })} disabled={submitting}>Cancel</Button>
          {/* Submit: will call backend to accept transfer + update product */}
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Registering..." : "Register & Accept Ownership"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DistributorProductForm;