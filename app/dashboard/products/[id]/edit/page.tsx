'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import BarcodeScanner from '@/components/features/products/BarcodeScanner';
import CameraCapture from '@/components/features/products/CameraCapture';
import { Camera, X } from 'lucide-react';

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
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  
  // Form fields
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [barcode, setBarcode] = useState('');
  const [unit, setUnit] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Load product data
  useEffect(() => {
    async function loadProduct() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', params.id)
          .single();

        if (error) throw error;

        if (data) {
          setName(data.name || '');
          setBrand(data.brand || '');
          setCategory(data.category || '');
          setBarcode(data.barcode || '');
          setUnit(data.default_unit || '');
          setImageUrl(data.image_url || '');
        }
      } catch (err: any) {
        console.error('Error loading product:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [params.id, supabase]);

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
      window.location.href = `/dashboard/products/${params.id}`;
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
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Edit Product</h1>
          <p className="text-gray-600">Update product information or scan barcode to auto-fill</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* Barcode Field with Scanner */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Barcode
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="e.g., 8005121000818"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <button
                onClick={() => setShowScanner(true)}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
              >
                📷 Scan
              </button>
            </div>
          </div>

          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Divella Ditali N.49"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Brand */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brand
            </label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g., Divella"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Pasta & Rice"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Unit/Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unit/Size
            </label>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="e.g., 500g"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Image URL with Camera */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Image
            </label>
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Image URL or use camera to take photo"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <button
                  onClick={() => setShowCamera(true)}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  Take Photo
                </button>
              </div>
              
              {/* Image Preview */}
              {imageUrl && (
                <div className="relative inline-block">
                  <img
                    src={imageUrl}
                    alt="Product preview"
                    className="h-32 w-32 object-contain border border-gray-200 rounded"
                  />
                  <button
                    onClick={() => setImageUrl('')}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Tip:</strong> Scan the barcode to auto-fill product details from our database,
              or take a photo of the product to add a custom image.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={() => router.back()}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      {showScanner && (
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
      )}

      {/* Camera Capture Modal */}
      {showCamera && (
        <CameraCapture
          onImageCaptured={(url) => {
            setImageUrl(url);
            setShowCamera(false);
          }}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}
