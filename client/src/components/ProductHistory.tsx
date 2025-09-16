// Update your ProductHistory component
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Calendar, Package, DollarSign, MapPin, Truck } from "lucide-react";

interface RegistrationEvent {
  id: string;
  eventType: string;
  message: string;
  userId: string;
  userName?: string;
  userRole?: string;
  createdAt: string;
  extra?: any;
}

interface ProductHistoryProps {
  productId: string;
}

const FIELD_LABELS: Record<string, string> = {
  name: "Product Name",
  category: "Category",
  description: "Description",
  quantity: "Quantity",
  unit: "Unit",
  distributorName: "Distributor Name",
  warehouseLocation: "Warehouse Location",
  dispatchDate: "Dispatch Date",
  certifications: "Certifications",
  price: "Purchase Price",
  paymentProofUrl: "Payment Proof",
  storeName: "Store Name",
  storeLocation: "Store Location",
  arrivalDate: "Arrival Date",
};

const FIELD_ICONS: Record<string, React.ReactNode> = {
  name: <Package className="w-3 h-3 mr-1" />,
  category: <Package className="w-3 h-3 mr-1" />,
  description: <Package className="w-3 h-3 mr-1" />,
  quantity: <Package className="w-3 h-3 mr-1" />,
  unit: <Package className="w-3 h-3 mr-1" />,
  distributorName: <User className="w-3 h-3 mr-1" />,
  warehouseLocation: <MapPin className="w-3 h-3 mr-1" />,
  dispatchDate: <Calendar className="w-3 h-3 mr-1" />,
  certifications: <Package className="w-3 h-3 mr-1" />,
  price: <DollarSign className="w-3 h-3 mr-1" />,
  paymentProofUrl: <Package className="w-3 h-3 mr-1" />,
  storeName: <User className="w-3 h-3 mr-1" />,
  storeLocation: <MapPin className="w-3 h-3 mr-1" />,
  arrivalDate: <Calendar className="w-3 h-3 mr-1" />,
};

export function ProductHistory({ productId }: ProductHistoryProps) {
  const [events, setEvents] = useState<RegistrationEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRegistrationEvents() {
      try {
        const res = await fetch(`/api/products/${productId}/events`);
        if (res.ok) {
          const data = await res.json();
          // Filter for registration events only
          const registrationEvents = data.filter((event: RegistrationEvent) => 
            event.eventType === "ownership_registration"
          );
          setEvents(registrationEvents);
        }
      } catch (error) {
        console.error('Error fetching registration events:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchRegistrationEvents();
  }, [productId]);

  const formatFieldValue = (field: string, value: any) => {
    if (field === "paymentProofUrl" && value) {
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline text-xs"
        >
          View Payment Proof
        </a>
      );
    }
    
    if (Array.isArray(value)) {
      return value.join(", ");
    }
    
    if (field === "price" && value) {
      return `$${value}`;
    }
    
    if (field === "dispatchDate" || field === "arrivalDate") {
      return new Date(value).toLocaleDateString();
    }
    
    return String(value || "");
  };

  if (loading) return <div>Loading Product history...</div>;

  return (
    <Card className="shadow-sm border border-border">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          Product Registration & Ownership History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-muted-foreground">No registration events found.</div>
        ) : (
          <ol className="space-y-6">
            {events.map((event) => {
              // Get user info from event data or extra fields
              // Use username from extra data if available, otherwise fall back to name
              const userName = event.extra?.userName || event.userName || "Unknown User";
              const userRole = event.extra?.userRole || event.userRole || "Unknown Role";
              const previousOwnerName = event.extra?.previousOwnerName || "Unknown";
              const previousOwnerRole = event.extra?.previousOwnerRole || "Unknown";
              
              return (
                <li key={event.id} className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <User className="w-4 h-4 text-accent mt-1" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground flex flex-col gap-1 mb-2">
                      <div>
                        <span className="font-semibold">From:</span>{" "}
                        {previousOwnerName} ({previousOwnerRole})
                      </div>
                      <div>
                        <span className="font-semibold">To:</span>{" "}
                        {userName} ({userRole})
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(event.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    {/* Show all filled form fields with values */}
                    {event.extra && event.extra.registeredFields && event.extra.registeredFields.length > 0 && (
                      <div className="mt-3 bg-muted/50 rounded p-3 text-xs">
                        <div className="font-semibold mb-2">Fields filled in this registration:</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {event.extra.registeredFields.map((field: string) => (
                            <div key={field} className="flex items-start">
                              <div className="flex items-center text-foreground font-medium mr-2" style={{ minWidth: 120 }}>
                                {FIELD_ICONS[field] || <Package className="w-3 h-3 mr-1" />}
                                {FIELD_LABELS[field] || field}:
                              </div>
                              <div className="text-muted-foreground break-words">
                                {formatFieldValue(field, event.extra[field])}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}