'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PRODUCT_CATEGORIES } from '@/types';
import BarcodeScanner from '@/components/features/products/BarcodeScanner';
import { Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Product, Store } from '@/types';

export default function AddProductPage() {
  const router = useRouter();
  const [showScanner, setShowScanner] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: 'Pasta & Rice',
    barcode: '',
    default_unit: '',
    image_url: '',
    store_id: '',
    price: '',
    unit: '',
    is_promotion: false,
    promotion_end_date: '',
    notes: '',
  });

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('town', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setStores(data || []);
    } catch (error: any) {
      console.error('Error fetching stores:', error);
      toast.error('Failed to load stores');
    }
  };

  const handleProductScanned = (scannedProduct: Partial<Product>) => {
    setFormData({
      ...formData,
      name: scannedProduct.name || '',
      brand: scannedProduct.brand || '',
      category: scannedProduct.category || 'Pasta & Rice',
      barcode: scannedProduct.barcode || '',
      default_unit: scannedProduct.default_unit || '',
      image_url: scannedProduct.image_url || '',
    });
    setShowScanner(false);
    toast.success('Product info loaded from barcode!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isSubmitting) {
      return;
    }
    
    if (!formData.name || !formData.category || !formData.default_unit) {
      toast.error('Please fill in product name, category, and unit');
      return;
    }

    if (!formData.store_id || !formData.price) {
      toast.error('Please select a store and enter a price');
      return;
    }

    setLoading(true);
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let productId = null;
      
      if (formData.barcode) {
        const { data: existing } = await supabase
          .from('products')
          .select('id')
          .eq('barcode', formData.barcode)
          .single();
        
        productId = existing?.id;
      }

      if (!productId) {
        const { data: newProduct, error: productError } = await supabase
          .from('products')
          .insert({
            name: formData.name,
            brand: formData.brand || null,
            category: formData.category,
            barcode: formData.barcode || null,
            default_unit: formData.default_unit,
            image_url: formData.image_url || null,
            created_by: user.id,
          })
          .select()
          .single();

        if (productError) throw productError;
        productId = newProduct.id;
      }

      const { error: priceError } = await supabase
        .from('prices')
        .insert({
          product_id: productId,
          store_id: formData.store_id,
          price: parseFloat(formData.price),
          unit: formData.unit || formData.default_unit,
          is_promotion: formData.is_promotion,
          promotion_end_date: formData.promotion_end_date || null,
          date_recorded: new Date().toISOString().split('T')[0],
          notes: formData.notes || null,
          created_by: user.id,
        });

      if (priceError) throw priceError;

      toast.success('Product and price added successfully! 🎉');
      router.push('/dashboard/products');
    } catch (error: any) {
      console.error('Error adding product:', error);
      toast.error(error.message || 'Failed to add product');
      setIsSubmitting(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Add Product</h1>
      </div>

      {showScanner && (
        <BarcodeScanner
          onProductScanned={handleProductScanned}
          onClose={() => setShowScanner(false)}
        />
      )}

      <div className="card max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-center py-4 bg-surface rounded-lg">
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              disabled={isSubmitting}
              className="btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera className="w-5 h-5" />
              Scan Barcode
            </button>
            <p className="text-sm text-gray-500 mt-2">or enter details manually below</p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Product Information</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                required
                disabled={isSubmitting}
                className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="e.g., Penne Rigate"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brand
              </label>
              <input
                type="text"
                disabled={isSubmitting}
                className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="e.g., Barilla"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                required
                disabled={isSubmitting}
                className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit *
              </label>
              <input
                type="text"
                required
                disabled={isSubmitting}
                className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="e.g., 500g, 1L, 1 unit"
                value={formData.default_unit}
                onChange={(e) => setFormData({ ...formData, default_unit: e.target.value })}
              />
            </div>

            {formData.barcode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Barcode
                </label>
                <input
                  type="text"
                  className="input-field bg-gray-50"
                  value={formData.barcode}
                  readOnly
                />
              </div>
            )}
          </div>

          <div className="space-y-4 pt-6 border-t">
            <h3 className="text-lg font-semibold text-gray-900">Price Information</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Store *
              </label>
              <select
                required
                disabled={isSubmitting}
                className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
                value={formData.store_id}
                onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
              >
                <option value="">Select store...</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name} - {store.town}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (€) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                disabled={isSubmitting}
                className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="e.g., 0.89"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={isSubmitting}
                  checked={formData.is_promotion}
                  onChange={(e) => setFormData({ ...formData, is_promotion: e.target.checked })}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className="text-sm font-medium text-gray-700">On Promotion</span>
              </label>
            </div>

            {formData.is_promotion && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Promotion Valid Until
                </label>
                <input
                  type="date"
                  disabled={isSubmitting}
                  className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
                  value={formData.promotion_end_date}
                  onChange={(e) => setFormData({ ...formData, promotion_end_date: e.target.value })}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                disabled={isSubmitting}
                className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
                rows={3}
                placeholder="e.g., Better quality than store brand"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="btn-secondary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding...' : 'Add Product & Price'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}