import { useState } from 'react';
import { NavigationHeader } from '@/components/NavigationHeader';
import { ProductRegistrationForm } from '@/components/ProductRegistrationForm';

export default function ProductRegistration() {
  const [showForm] = useState(true);

  return (
    <div className="min-h-screen bg-background font-sans">
      <NavigationHeader />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground">Product Registration</h2>
          <p className="text-muted-foreground mt-1">Register a new product batch and generate QR codes for tracking</p>
        </div>

        <ProductRegistrationForm 
          isVisible={showForm}
          onClose={() => window.history.back()}
        />
      </main>
    </div>
  );
}
