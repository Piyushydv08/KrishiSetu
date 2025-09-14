import { NavigationHeader } from "@/components/NavigationHeader";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { ProductSearch } from "@/components/ProductSearch";
import { Product } from "@shared/schema";

interface Owner {
  id: string;
  ownerId: string;
  username: string;
  role: string;
}

interface User {
  id: string;
  name: string;
  role: string;
  username: string;
}

export default function RequestProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [ownersMap, setOwnersMap] = useState<Record<string, Owner[]>>({});
  const [ownerDetails, setOwnerDetails] = useState<Record<string, User>>({});
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Helper to get auth headers
  const getAuthHeaders = () => ({
    "firebase-uid": user?.firebaseUid || "",
    "Content-Type": "application/json",
  });

  // Fetch all products except those owned by the current user
  useEffect(() => {
    const fetchAvailableProducts = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/products/available/search", {
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();
        setProducts(
          data.map((p: any) => ({
            ...p,
            harvestDate: p.harvestDate ? new Date(p.harvestDate) : undefined,
          }))
        );
      } catch (error) {
        console.error("Error fetching products:", error);
        setIsError(true);
        toast.error("Failed to load products");
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.role === "retailer" || user?.role === "distributor") {
      fetchAvailableProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Fetch owners for each product
  useEffect(() => {
    if (!products.length) return;
    const fetchOwners = async () => {
      const map: Record<string, Owner[]> = {};
      const details: Record<string, User> = {};

      for (const product of products) {
        try {
          const res = await fetch(`/api/products/${product.id}/owners`, {
            headers: getAuthHeaders(),
          });
          map[product.id] = await res.json();

          // Get owner details
          const ownerRes = await fetch(`/api/users/${product.ownerId}`, {
            headers: getAuthHeaders(),
          });
          if (ownerRes.ok) {
            details[product.ownerId] = await ownerRes.json();
          }
        } catch (error) {
          console.error(`Error fetching data for product ${product.id}:`, error);
          map[product.id] = [];
        }
      }
      setOwnersMap(map);
      setOwnerDetails(details);
    };
    fetchOwners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);

  // Handle ownership transfer request
  const handleRequestOwnership = async (productId: string) => {
    try {
      const product = products.find((p) => p.id === productId);
      if (!product) return;

      const res = await fetch("/api/ownership-transfers", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          productId,
          fromUserId: product.ownerId,
          toUserId: user?.id,
          transferType: "request",
          notes: `${user?.name} (${user?.role}) requested ownership of this product`,
        }),
      });

      if (!res.ok) throw new Error("Failed to request ownership");

      toast.success("Ownership request sent! The current owner will be notified.");
    } catch (error) {
      console.error("Error requesting ownership:", error);
      toast.error("Could not request ownership");
    }
  };

  // Filter products if a product is selected from search
  const filteredProducts =
    selectedProduct
      ? products.filter((p) => p.id === selectedProduct.id)
      : products;

  if (user?.role !== "retailer" && user?.role !== "distributor") {
    return (
      <>
        <NavigationHeader />
        <div className="max-w-4xl mx-auto py-8">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>This page is only available for retailers and distributors.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <NavigationHeader />
      <div className="max-w-4xl mx-auto py-8 flex flex-col items-center">
        {/* Centered Search and Info */}
        <div className="w-full flex flex-col items-center mb-8">
          <ProductSearch
            onProductSelect={setSelectedProduct}
            placeholder="Search products by name, category, farm, or batch ID..."
            selectedProduct={selectedProduct}
            onClearSelection={() => setSelectedProduct(null)}
            searchEndpoint="/api/products/available/search" 
            />
          <p className="mt-4 mb-2 text-muted-foreground text-center text-lg max-w-xl">
            Browse products available from all users and request ownership transfer.
          </p>
        </div>

        {isLoading && (
          <div className="text-center text-muted-foreground">
            Loading products...
          </div>
        )}

        {isError && (
          <div className="text-center text-red-500">
            Failed to load products.
          </div>
        )}

        {!isLoading && !isError && filteredProducts.length === 0 && (
          <div className="bg-muted p-4 rounded-lg text-center text-muted-foreground">
            No products available for request at this time.
          </div>
        )}

        <div className="space-y-6 w-full">
          {filteredProducts.map((product) => {
            const owners = ownersMap[product.id] || [];
            const currentOwner = ownerDetails[product.ownerId];

            return (
              <Card key={product.id}>
                <CardContent className="py-6">
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-semibold">
                          {product.name}
                        </span>
                        <Badge>{product.category}</Badge>
                        <Badge variant="outline">{product.status}</Badge>
                      </div>

                      <div className="text-sm text-muted-foreground mb-1">
                        <span className="font-medium">Quantity:</span>{" "}
                        {product.quantity} {product.unit}
                      </div>

                      <div className="text-sm text-muted-foreground mb-1">
                        <span className="font-medium">Farm:</span>{" "}
                        {product.farmName}
                      </div>

                      <div className="text-sm text-muted-foreground mb-1">
                        <span className="font-medium">Location:</span>{" "}
                        {product.location}
                      </div>

                      <div className="text-sm text-muted-foreground mb-1">
                        <span className="font-medium">Harvest Date:</span>{" "}
                        {product.harvestDate
                          ? new Date(product.harvestDate).toLocaleDateString()
                          : "N/A"}
                      </div>

                      {product.batchId && (
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">Batch ID:</span>{" "}
                          {product.batchId}
                        </div>
                      )}

                      {/* Current owner information */}
                      <div className="mt-4">
                        <span className="font-semibold text-sm">Current Owner:</span>
                        <div className="text-sm">
                          {currentOwner
                            ? `${currentOwner.name} (${currentOwner.role})`
                            : "Loading..."}
                        </div>
                      </div>

                      {/* Ownership history */}
                      {owners.length > 0 && (
                        <div className="mt-2">
                          <span className="font-semibold text-sm">Ownership History:</span>
                          <ul className="ml-4 list-disc text-xs">
                            {owners.map((owner) => (
                              <li key={owner.id}>
                                {owner.username} ({owner.role})
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                        onClick={() => handleRequestOwnership(product.id)}
                      >
                        Request Ownership
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}