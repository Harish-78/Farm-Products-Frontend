import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ChevronDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useOrdersStore, type CreateOrderPayload } from '@/stores/useOrdersStore';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Numeric fields kept as strings so leading zeros ("043") are preserved while typing.
// They are converted to numbers only at submit time.
type FormState = Omit<CreateOrderPayload, 'total_amount' | 'quantity' | 'unit_price'> & {
  quantity: string;
  unit_price: string;
};

type FormErrors = Partial<Record<keyof FormState | 'total_amount', string>>;

function emptyForm(): FormState {
  return {
    order_number: '',
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    product_name: '',
    category: 'General',
    quantity: '1',
    unit_price: '0',
    payment_status: 'PENDING',
    order_status: 'PROCESSING',
    shipping_address: '',
  };
}

function generateOrderNumber() {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${Date.now().toString().slice(-6)}-${rand}`;
}

function makeFreshForm(): FormState {
  return { ...emptyForm(), order_number: generateOrderNumber() };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+]?[\d\s\-()]{7,20}$/;

export function OrderFormDialog({ open, onOpenChange }: Props) {
  const createOrder = useOrdersStore((s) => s.createOrder);

  const [form, setForm] = useState<FormState>(makeFreshForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  const totalAmount = useMemo(() => {
    const qty = Number(form.quantity || 0);
    const price = Number(form.unit_price || 0);
    if (!Number.isFinite(qty) || !Number.isFinite(price)) return 0;
    return qty * price;
  }, [form.quantity, form.unit_price]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    if (saving) return;
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (saving) return;
    if (!nextOpen) {
      setForm(makeFreshForm());
      setErrors({});
      setSaving(false);
    }
    onOpenChange(nextOpen);
  };

  const validate = (): FormErrors => {
    const next: FormErrors = {};

    if (!form.order_number.trim()) {
      next.order_number = 'Order number is required';
    }
    if (!form.customer_name.trim()) {
      next.customer_name = 'Customer name is required';
    } else if (form.customer_name.trim().length < 2) {
      next.customer_name = 'Customer name is too short';
    }
    if (form.customer_email.trim() && !EMAIL_RE.test(form.customer_email.trim())) {
      next.customer_email = 'Enter a valid email address';
    }
    if (form.customer_phone.trim() && !PHONE_RE.test(form.customer_phone.trim())) {
      next.customer_phone = 'Enter a valid phone number';
    }
    if (!form.product_name.trim()) {
      next.product_name = 'Product name is required';
    }

    const qty = Number(form.quantity);
    if (form.quantity.trim() === '' || !Number.isFinite(qty) || qty < 1) {
      next.quantity = 'Quantity must be at least 1';
    }

    const price = Number(form.unit_price);
    if (form.unit_price.trim() === '' || !Number.isFinite(price) || price < 0) {
      next.unit_price = 'Unit price cannot be negative';
    }

    if (totalAmount <= 0) {
      next.total_amount = 'Total amount must be greater than zero';
    }
    if (!form.shipping_address.trim()) {
      next.shipping_address = 'Shipping address is required';
    }

    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast.error('Please fix the highlighted fields');
      return;
    }

    setErrors({});
    setSaving(true);
    try {
      const payload: CreateOrderPayload = {
        order_number: form.order_number,
        customer_name: form.customer_name,
        customer_email: form.customer_email,
        customer_phone: form.customer_phone,
        product_name: form.product_name,
        category: form.category,
        quantity: Number(form.quantity),
        unit_price: Number(form.unit_price),
        total_amount: totalAmount,
        payment_status: form.payment_status,
        order_status: form.order_status,
        shipping_address: form.shipping_address,
      };
      await createOrder(payload);
      toast.success('Order created successfully');
      setForm(makeFreshForm());
      setErrors({});
      setSaving(false);
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Create failed';
      toast.error(message);
      setSaving(false);
    }
  };

  const fieldClass = (key: keyof FormState | 'total_amount') =>
    errors[key] ? 'border-destructive focus:ring-destructive' : '';

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen, eventDetails) => {
        if (saving && !nextOpen) {
          eventDetails.cancel();
          return;
        }
        handleOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
          <DialogDescription>
            Fill in the order details below. Fields marked * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <fieldset disabled={saving} className="space-y-4 disabled:opacity-70">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Order Number */}
              <div className="space-y-1.5">
                <Label htmlFor="order_number">Order Number *</Label>
                <Input
                  id="order_number"
                  value={form.order_number}
                  onChange={(e) => update('order_number', e.target.value)}
                  placeholder="Order number"
                  aria-invalid={!!errors.order_number}
                  className={fieldClass('order_number')}
                />
                {errors.order_number && (
                  <p className="text-[11px] text-destructive">{errors.order_number}</p>
                )}
              </div>

              {/* Customer Name */}
              <div className="space-y-1.5">
                <Label htmlFor="customer_name">Customer Name *</Label>
                <Input
                  id="customer_name"
                  value={form.customer_name}
                  onChange={(e) => update('customer_name', e.target.value)}
                  placeholder="Customer name"
                  aria-invalid={!!errors.customer_name}
                  className={fieldClass('customer_name')}
                />
                {errors.customer_name && (
                  <p className="text-[11px] text-destructive">{errors.customer_name}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="customer_email">Email</Label>
                <Input
                  id="customer_email"
                  type="email"
                  value={form.customer_email}
                  onChange={(e) => update('customer_email', e.target.value)}
                  placeholder="Email address"
                  aria-invalid={!!errors.customer_email}
                  className={fieldClass('customer_email')}
                />
                {errors.customer_email && (
                  <p className="text-[11px] text-destructive">{errors.customer_email}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label htmlFor="customer_phone">Phone</Label>
                <Input
                  id="customer_phone"
                  value={form.customer_phone}
                  onChange={(e) => update('customer_phone', e.target.value)}
                  placeholder="Phone number"
                  aria-invalid={!!errors.customer_phone}
                  className={fieldClass('customer_phone')}
                />
                {errors.customer_phone && (
                  <p className="text-[11px] text-destructive">{errors.customer_phone}</p>
                )}
              </div>

              {/* Product Name */}
              <div className="space-y-1.5">
                <Label htmlFor="product_name">Product Name *</Label>
                <Input
                  id="product_name"
                  value={form.product_name}
                  onChange={(e) => update('product_name', e.target.value)}
                  placeholder="Product name"
                  aria-invalid={!!errors.product_name}
                  className={fieldClass('product_name')}
                />
                {errors.product_name && (
                  <p className="text-[11px] text-destructive">{errors.product_name}</p>
                )}
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={form.category}
                  onChange={(e) => update('category', e.target.value)}
                  placeholder="Category"
                />
              </div>

              {/* Quantity */}
              <div className="space-y-1.5">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="text"
                  inputMode="numeric"
                  value={form.quantity}
                  onChange={(e) => {
                    // allow only digits (empty string permitted while editing)
                    const v = e.target.value;
                    if (v === '' || /^\d+$/.test(v)) update('quantity', v);
                  }}
                  placeholder="Quantity"
                  aria-invalid={!!errors.quantity}
                  className={fieldClass('quantity')}
                />
                {errors.quantity && (
                  <p className="text-[11px] text-destructive">{errors.quantity}</p>
                )}
              </div>

              {/* Unit Price */}
              <div className="space-y-1.5">
                <Label htmlFor="unit_price">Unit Price (₹)</Label>
                <Input
                  id="unit_price"
                  type="text"
                  inputMode="decimal"
                  value={form.unit_price}
                  onChange={(e) => {
                    // allow digits, optional single decimal point
                    const v = e.target.value;
                    if (v === '' || /^\d*\.?\d*$/.test(v)) update('unit_price', v);
                  }}
                  placeholder="Unit price"
                  aria-invalid={!!errors.unit_price}
                  className={fieldClass('unit_price')}
                />
                {errors.unit_price && (
                  <p className="text-[11px] text-destructive">{errors.unit_price}</p>
                )}
              </div>

              {/* Total Amount (read-only, derived) */}
              <div className="space-y-1.5">
                <Label htmlFor="total_amount">Total Amount (₹)</Label>
                <Input
                  id="total_amount"
                  type="text"
                  value={totalAmount}
                  readOnly
                  tabIndex={-1}
                  className={`bg-muted cursor-not-allowed ${fieldClass('total_amount')}`}
                />
                {errors.total_amount && (
                  <p className="text-[11px] text-destructive">{errors.total_amount}</p>
                )}
              </div>

              {/* Payment Status */}
              <div className="space-y-1.5">
                <Label htmlFor="payment_status">Payment Status</Label>
                <div className="relative">
                  <select
                    id="payment_status"
                    value={form.payment_status}
                    onChange={(e) =>
                      update(
                        'payment_status',
                        e.target.value as FormState['payment_status']
                      )
                    }
                    className="w-full h-9 text-sm bg-card border border-border rounded px-2 pr-8 appearance-none outline-none focus:ring-1 focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="PAID">PAID</option>
                    <option value="FAILED">FAILED</option>
                    <option value="REFUNDED">REFUNDED</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              {/* Order Status */}
              <div className="space-y-1.5">
                <Label htmlFor="order_status">Order Status</Label>
                <div className="relative">
                  <select
                    id="order_status"
                    value={form.order_status}
                    onChange={(e) =>
                      update(
                        'order_status',
                        e.target.value as FormState['order_status']
                      )
                    }
                    className="w-full h-9 text-sm bg-card border border-border rounded px-2 pr-8 appearance-none outline-none focus:ring-1 focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                  >
                    <option value="PROCESSING">PROCESSING</option>
                    <option value="SHIPPED">SHIPPED</option>
                    <option value="DELIVERED">DELIVERED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="space-y-1.5">
              <Label htmlFor="shipping_address">Shipping Address *</Label>
              <textarea
                id="shipping_address"
                value={form.shipping_address}
                onChange={(e) => update('shipping_address', e.target.value)}
                rows={3}
                placeholder="Shipping address"
                aria-invalid={!!errors.shipping_address}
                className={`w-full text-sm bg-card border border-border rounded px-2 py-1.5 outline-none focus:ring-1 focus:ring-primary resize-none ${fieldClass(
                  'shipping_address'
                )}`}
              />
              {errors.shipping_address && (
                <p className="text-[11px] text-destructive">
                  {errors.shipping_address}
                </p>
              )}
            </div>
          </fieldset>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="gap-2 min-w-[120px]">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Creating...' : 'Create Order'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}