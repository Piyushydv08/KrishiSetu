import { useRef, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateProduct } from "@/hooks/useProducts";
import { useAuth } from "@/hooks/useAuth";
import { insertProductSchema } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { LoadingStates } from "./LoadingStates";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, X, Plus } from "lucide-react";

const formSchema = insertProductSchema.extend({
  harvestDate: z.string().min(1, "Harvest date is required"),
  quantity: z.string().min(1, "Quantity is required"),
  certifications: z.array(z.string()).default([]),
});

type FormData = z.infer<typeof formSchema>;

const categories = ["vegetables", "fruits", "grains", "dairy", "meat"];

const certificationOptions = [
  "Organic",
  "Non-GMO",
  "Fair Trade",
  "Sustainable",
];

const units = ["kg", "lbs", "units", "boxes"];

interface ProductRegistrationFormProps {
  isVisible: boolean;
  onClose: () => void;
}

export function ProductRegistrationForm({
  isVisible,
  onClose,
}: ProductRegistrationFormProps) {
  const { user } = useAuth();
  const { mutate: createProduct, isPending } = useCreateProduct();
  const { toast } = useToast();

  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [isVisible]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: "",
      description: "",
      quantity: "",
      unit: "kg",
      farmName: "",
      location: "",
      harvestDate: "",
      certifications: [],
      status: "registered",
      ownerId: user?.id || "",
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to register products",
        variant: "destructive",
      });
      return;
    }

    try {
      const productData = {
        ...data,
        quantity: data.quantity,
        harvestDate: new Date(data.harvestDate),
        ownerId: user.id,
      };

      createProduct(productData, {
        onSuccess: (product) => {
          toast({
            title: "Success!",
            description: `Product successfully registered with Batch ID: ${product.batchId}`,
          });
          form.reset();
          onClose();
        },
        onError: (error) => {
          toast({
            title: "Registration Failed",
            description:
              error.message || "Failed to register product. Please try again.",
            variant: "destructive",
          });
        },
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  if (!isVisible) return null;

  return (
    <>
      <div className="mt-8" id="product-registration-section" ref={formRef}>
        <Card className="shadow-sm border border-border overflow-hidden">
          <CardHeader className="px-6 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-primary" />
                Register New Product Batch
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                data-testid="button-close-registration"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Product Information */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-foreground">
                      Product Information
                    </h4>

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Organic Cherry Tomatoes"
                              {...field}
                              data-testid="input-product-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-category">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category.charAt(0).toUpperCase() +
                                    category.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Brief description of the product..."
                              className="min-h-20"
                              {...field}
                              value={field.value || ""}
                              data-testid="textarea-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Amount"
                                {...field}
                                data-testid="input-quantity"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="unit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger data-testid="select-unit">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {units.map((unit) => (
                                  <SelectItem key={unit} value={unit}>
                                    {unit}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Origin & Location */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-foreground">
                      Origin Information
                    </h4>

                    <FormField
                      control={form.control}
                      name="farmName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Farm/Producer Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Sunny Acres Organic Farm"
                              {...field}
                              data-testid="input-farm-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="City, State"
                              {...field}
                              data-testid="input-location"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="harvestDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Harvest/Production Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              data-testid="input-harvest-date"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Certifications */}
                <FormField
                  control={form.control}
                  name="certifications"
                  render={() => (
                    <FormItem>
                      <FormLabel className="text-base">
                        Certifications
                      </FormLabel>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {certificationOptions.map((certification) => (
                          <FormField
                            key={certification}
                            control={form.control}
                            name="certifications"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={certification}
                                  className="flex flex-row items-center space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(
                                        certification
                                      )}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([
                                              ...field.value,
                                              certification,
                                            ])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) =>
                                                  value !== certification
                                              )
                                            );
                                      }}
                                      data-testid={`checkbox-${certification
                                        .toLowerCase()
                                        .replace(" ", "-")}`}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">
                                    {certification}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isPending}
                    data-testid="button-cancel-registration"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="flex items-center gap-2"
                    data-testid="button-submit-registration"
                  >
                    <Plus className="w-4 h-4" />
                    Register & Generate QR Code
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Loading Overlay */}
      {isPending && <LoadingStates />}
    </>
  );
}
