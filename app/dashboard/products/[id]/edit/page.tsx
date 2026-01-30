'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import BarcodeScanner from '@/components/features/products/BarcodeScanner';

interface Product {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  barcode: string | null;
  default_unit: string | null;
  image_url: string | null;
}

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [barcode, setBarcode] = useState('');
  const [unit, setUnit] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Load product data
  useEffect(() => {
    loadProduct();
  }, [params.id]);

  async function loadProduct() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) throw error;

      setProduct(data);
      setName(data.name || '');
      setBrand(data.brand || '');
      setCategory(data.category || '');
      setBarcode(data.barcode || '');
      setUnit(data.default_unit || '');
      setImageUrl(data.image_url || '');
    } catch (err) {
      console.error('Error loading product:', err);
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  }

  // Save product
  async function handleSave() {
    if (!name.trim()) {
      alert('Product name is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('products')
        .update({
          name: name.trim(),
          brand: brand.trim() || null,
          category: category.trim() || null,
          barcode: barcode.trim() || null,
          default_unit: unit.trim() || null,
          image_url: imageUrl.trim() || null,
        })
        .eq('id', params.id)
        .select();

      console.log('Update result:', { data, error });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      alert('Product updated successfully!');
      router.refresh();
      router.push(`/dashboard/products/${params.id}`);
    } catch (err: any) {
      console.error('Error saving product:', err);
      setError(err.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-red-600 hover:text-red-800"
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-800 mb-4"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Barcode Scanner */}
      {showScanner && (
        <div className="mb-6">
          <BarcodeScanner
            onProductScanned={(productData) => {
              if (productData.barcode) setBarcode(productData.barcode);
              if (productData.name) setName(productData.name);
              if (productData.brand) setBrand(productData.brand);
              if (productData.category) setCategory(productData.category);
              if (productData.default_unit) setUnit(productData.default_unit);
              if (productData.image_url) setImageUrl(productData.image_url);
              setShowScanner(false);
            }}
            onClose={() => setShowScanner(false)}
          />
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        {/* Barcode field with scan button */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Barcode
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
              placeholder="Scan or enter barcode"
            />
            <button
              onClick={() => setShowScanner(!showScanner)}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
            >
              📷 Scan
            </button>
          </div>
        </div>

        {/* Product Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="e.g., Pasta Penne"
            required
          />
        </div>

        {/* Brand */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Brand
          </label>
          <input
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="e.g., Divella"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="e.g., Pasta & Rice"
          />
        </div>

        {/* Unit */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Unit / Size
          </label>
          <input
            type="text"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="e.g., 500g"
          />
        </div>

        {/* Image URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Image URL
          </label>
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="https://..."
          />
          {imageUrl && (
            <div className="mt-2">
              <img
                src={imageUrl}
                alt="Product preview"
                className="h-32 w-32 object-contain border border-gray-200 rounded"
              />
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={() => router.back()}
            disabled={saving}
            className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Quick Tips</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Scan the barcode to auto-fill product details from Open Food Facts</li>
          <li>• You can manually edit any field if the data isn't quite right</li>
          <li>• Product name is required, other fields are optional</li>
        </ul>
      </div>
    </div>
  );
}