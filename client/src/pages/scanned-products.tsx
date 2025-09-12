import { useAuth } from "@/hooks/useAuth";

export default function ScannedProductsPage() {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Scanned Products</h1>
      <p className="mb-4 text-muted-foreground">
        {user?.role === "consumer"
          ? "Here are the products you have scanned as a consumer."
          : "This page is for consumers to see their scanned products."}
      </p>
      {/* TODO: Fetch and list scanned products for this user */}
      <div className="bg-muted p-4 rounded-lg text-center text-muted-foreground">
        Scanned product list coming soon...
      </div>
    </div>
  );
}