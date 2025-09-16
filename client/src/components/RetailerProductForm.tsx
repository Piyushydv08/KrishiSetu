// src/components/RetailerProductForm.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface RetailerProductFormProps {
  isVisible: boolean;
  transferId?: string;
  productId?: string;
  onClose: (result?: { submitted?: boolean; productId?: string }) => void;
}

export const RetailerProductForm: React.FC<RetailerProductFormProps> = ({ isVisible, onClose, transferId, productId }) => {
  if (!isVisible) return null;

  const { firebaseUser } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [storeName, setStoreName] = useState("");
  const [storeLocation, setStoreLocation] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
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
    if (!storeName.trim()) return "Store name is required";
    if (!storeLocation.trim()) return "Store location is required";
    if (!arrivalDate) return "Arrival date is required";
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

      // In RetailerProductForm.tsx, check the payload:
      const payload = {
        productData: {
          name,
          category,
          description,
          quantity,
          unit,
          storeName, // This should be sent
          storeLocation, // This should be sent
          arrivalDate,
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
        const body = await res.json().catch(() => null);
        const msg = body?.message || `${res.status} ${res.statusText}`;
        toast?.({ title: "Failed", description: msg, variant: "destructive" });
        throw new Error(msg);
      }

      const data = await res.json();
      toast?.({ title: "Success", description: "Product registered and ownership accepted." });
      onClose({ submitted: true, productId: productId ?? data.productId });
    } catch (e: any) {
      console.error("Error submitting retailer registration:", e);
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
        <h2 className="text-2xl font-bold mb-4">Retailer Product Registration</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Information */}
          <div>
            <h3 className="font-semibold mb-2">Product Information</h3>
            <div className="space-y-4">
              <div>
                <Label>Product Name *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Packaged Grains - Retail Pack" />
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
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Description (Optional)</Label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description..." className="w-full rounded-md border border-gray-300 p-2" />
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

          {/* Retailer Information */}
          <div>
            <h3 className="font-semibold mb-2">Retailer Information</h3>
            <div className="space-y-4">
              <div>
                <Label>Store Name *</Label>
                <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="e.g., Local Mart" />
              </div>

              <div>
                <Label>Store Location *</Label>
                <Input value={storeLocation} onChange={(e) => setStoreLocation(e.target.value)} placeholder="City, area..." />
              </div>

              <div>
                <Label>Arrival Date *</Label>
                <Input type="date" value={arrivalDate} onChange={(e) => setArrivalDate(e.target.value)} />
              </div>

              <div>
                <Label>Certifications (Optional)</Label>
                <div className="flex gap-4 mt-2">
                  <div>
                    <input type="checkbox" id="rcert1" checked={certifications.includes("Retail Certified")} onChange={() => toggleCertification("Retail Certified")} />
                    <label htmlFor="rcert1" className="ml-2">Retail Certified</label>
                  </div>
                  <div>
                    <input type="checkbox" id="rcert2" checked={certifications.includes("Cold Storage")} onChange={() => toggleCertification("Cold Storage")} />
                    <label htmlFor="rcert2" className="ml-2">Cold Storage</label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Button variant="outline" onClick={() => onClose({ submitted: false })} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Registering..." : "Register & Accept Ownership"}
          </Button>
        </div>
      </div>
    </div>
  );
};
