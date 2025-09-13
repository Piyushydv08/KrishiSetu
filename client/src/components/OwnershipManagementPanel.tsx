import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProducts } from '@/hooks/useProducts';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Shield, Users, AlertCircle } from 'lucide-react';

const transferFormSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  toUserId: z.string().min(1, 'New owner is required'),
  transferType: z.string().min(1, 'Transfer type is required'),
  notes: z.string().optional()
});

export function OwnershipManagementPanel() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const { data: products } = useProducts(user?.id);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(transferFormSchema),
    defaultValues: {
      productId: '',
      toUserId: '',
      transferType: 'transfer',
      notes: ''
    }
  });

  const fetchUsers = async () => {
    try {
      // In a real app, you'd likely want to paginate this or filter to relevant users
      const response = await fetch('/api/users', {
        headers: {
          'firebase-uid': user?.firebaseUid || ''
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.filter((u: any) => u.id !== user?.id)); // Filter out current user
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const openTransferDialog = () => {
    fetchUsers();
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: z.infer<typeof transferFormSchema>) => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/ownership-transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'firebase-uid': user.firebaseUid
        },
        body: JSON.stringify({
          ...data,
          fromUserId: user.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to transfer ownership');
      }

      const result = await response.json();
      
      toast({
        title: 'Ownership Transfer Successful',
        description: `Transfer registered on the blockchain. Block #${result.ownershipBlock.blockNumber}`,
        variant: 'default'
      });
      
      setIsDialogOpen(false);
      form.reset();
      
    } catch (error: any) {
      toast({
        title: 'Transfer Failed',
        description: error.message || 'Something went wrong',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProductName = form.watch('productId') ? 
    products?.find(p => p.id === form.watch('productId'))?.name : '';

  return (
    <>
      <Card className="shadow-sm border border-border overflow-hidden">
        <CardHeader className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5 text-accent" />
            Ownership Management
          </h3>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="bg-muted rounded-lg p-8 text-center relative">
            <div className="relative z-10">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Manage product ownership and transfer products securely on the blockchain
              </p>
              <Button 
                className="bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={openTransferDialog}
                disabled={!products || products.length === 0}
              >
                Transfer Ownership
              </Button>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Each transfer is secured and verified on our blockchain-style ledger
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Transfer Ownership Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Transfer Product Ownership</DialogTitle>
            <DialogDescription>
              Transfer ownership of your product to another user. This action will be recorded on the blockchain.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="productId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {products?.map(product => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
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
                name="toUserId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Owner</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select new owner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.map(user => (
                          <SelectItem key={user._id} value={user._id}>
                            {user.name} ({user.username})
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
                name="transferType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transfer Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select transfer type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="transfer">Standard Transfer</SelectItem>
                        <SelectItem value="sale">Sale</SelectItem>
                        <SelectItem value="distribution">Distribution</SelectItem>
                        <SelectItem value="return">Return</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Add notes about this transfer" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Processing...' : 'Transfer Ownership'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}