'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ArrowLeft, Edit2, Plus, Store, Trash2, Tag, Calendar, X } from 'lucide-react';

type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  barcode?: string;
};

type StoreData = {
  id: string;
  name: string;
  town: string;
};

type PriceData = {
  id: string;
  product_id: string;
  store_id: string;
  price: number;
  is_promotion: boolean;
  promotion_price?: number;
  promotion_start?: string;
  promotion_end?: string;
  store?: StoreData;
};

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params?.id as string;
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [product, setProduct] = useState<Product | null>(null);
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit price modal state
  const [showEditPrice, setShowEditPrice] = useState(false);
  const [editingPrice, setEditingPrice] = useState<PriceData | null>(null);
  const [editRegularPrice, setEditRegularPrice] = useState('');
  const [editPromoPrice, setEditPromoPrice] = useState('');
  const [isPromotion, setIsPromotion] = useState(false);
  const [promoStart, setPromoStart] = useState('');
  const [promoEnd, setPromoEnd] = useState('');
  const [saving, setSaving] = useState(false);

  // Add price modal state
  const [showAddPrice, setShowAddPrice] = useState(false);
  const [selectedStore, setSelectedStore] = useState('');
  const [newRegularPrice, setNewRegularPrice] = useState('');
  const [newPromoPrice, setNewPromoPrice] = useState('');
  const [newIsPromo, setNewIsPromo] = useState(false);
  const [newPromoStart, setNewPromoStart] = useState('');
  const [newPromoEnd, setNewPromoEnd] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (productId) {
      fetchProductData();
    }
  }, [productId]);

  const fetchProductData = async () => {
    try {
      // Get product details
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (productError) throw productError;
      setProduct(productData);

      // Get prices with store details
      const { data: pricesData, error: pricesError } = await supabase
        .from('prices')
        .select(`
          *,
          stores (
            id,
            name,
            town
          )
        `)
        .eq('product_id', productId);

      if (pricesError) throw pricesError;

      const transformedPrices = pricesData?.map(price => ({
        id: price.id,
        product_id: price.product_id,
        store_id: price.store_id,
        price: price.price,
        is_promotion: price.is_promotion,
        promotion_price: price.promotion_price,
        promotion_start: price.promotion_start,
        promotion_end: price.promotion_end,
        store: price.stores as unknown as StoreData
      })) || [];

      setPrices(transformedPrices);

      // Get all stores for add price dropdown
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('*')
        .order('name');

      if (storesError) throw storesError;
      setStores(storesData || []);
    } catch (error) {
      console.error('Error fetching product:', error);
      alert('Failed to load product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openEditPrice = (price: PriceData) => {
    setEditingPrice(price);
    setEditRegularPrice(price.price.toString());
    setEditPromoPrice(price.promotion_price?.toString() || '');
    setIsPromotion(price.is_promotion);
    setPromoStart(price.promotion_start || '');
    setPromoEnd(price.promotion_end || '');
    setShowEditPrice(true);
  };

  const handleSavePrice = async () => {
    if (!editingPrice || saving) return;

    const regularPrice = parseFloat(editRegularPrice);
    if (isNaN(regularPrice) || regularPrice <= 0) {
      alert('Please enter a valid regular price');
      return;
    }

    if (isPromotion) {
      const promoPrice = parseFloat(editPromoPrice);
      if (isNaN(promoPrice) || promoPrice <= 0) {
        alert('Please enter a valid promotional price');
        return;
      }
      if (promoPrice >= regularPrice) {
        alert('Promotional price must be less than regular price');
        return;
      }
      if (!promoStart || !promoEnd) {
        alert('Please enter both start and end dates for the promotion');
        return;
      }
      if (new Date(promoStart) >= new Date(promoEnd)) {
        alert('End date must be after start date');
        return;
      }
    }

    setSaving(true);
    try {
      const updateData: any = {
        price: regularPrice,
        is_promotion: isPromotion,
        promotion_price: isPromotion ? parseFloat(editPromoPrice) : null,
        promotion_start: isPromotion ? promoStart : null,
        promotion_end: isPromotion ? promoEnd : null
      };

      const { error } = await supabase
        .from('prices')
        .update(updateData)
        .eq('id', editingPrice.id);

      if (error) throw error;

      // Refresh data
      await fetchProductData();

      // Close modal
      setShowEditPrice(false);
      setEditingPrice(null);
    } catch (error) {
      console.error('Error updating price:', error);
      alert('Failed to update price. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const openAddPrice = () => {
    // Reset form
    setSelectedStore('');
    setNewRegularPrice('');
    setNewPromoPrice('');
    setNewIsPromo(false);
    setNewPromoStart('');
    setNewPromoEnd('');
    setShowAddPrice(true);
  };

  const handleAddPrice = async () => {
    if (!selectedStore || adding) return;

    const regularPrice = parseFloat(newRegularPrice);
    if (isNaN(regularPrice) || regularPrice <= 0) {
      alert('Please enter a valid regular price');
      return;
    }

    if (newIsPromo) {
      const promoPrice = parseFloat(newPromoPrice);
      if (isNaN(promoPrice) || promoPrice <= 0) {
        alert('Please enter a valid promotional price');
        return;
      }
      if (promoPrice >= regularPrice) {
        alert('Promotional price must be less than regular price');
        return;
      }
      if (!newPromoStart || !newPromoEnd) {
        alert('Please enter both start and end dates for the promotion');
        return;
      }
      if (new Date(newPromoStart) >= new Date(newPromoEnd)) {
        alert('End date must be after start date');
        return;
      }
    }

    // Check if price already exists for this store
    if (prices.some(p => p.store_id === selectedStore)) {
      alert('A price already exists for this store. Use Edit to update it.');
      return;
    }

    setAdding(true);
    try {
      const insertData: any = {
        product_id: productId,
        store_id: selectedStore,
        price: regularPrice,
        is_promotion: newIsPromo,
        promotion_price: newIsPromo ? parseFloat(newPromoPrice) : null,
        promotion_start: newIsPromo ? newPromoStart : null,
        promotion_end: newIsPromo ? newPromoEnd : null
      };

      const { error } = await supabase
        .from('prices')
        .insert(insertData);

      if (error) throw error;

      // Refresh data
      await fetchProductData();

      // Close modal
      setShowAddPrice(false);
    } catch (error) {
      console.error('Error adding price:', error);
      alert('Failed to add price. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  const handleDeletePrice = async (priceId: string) => {
    if (!confirm('Are you sure you want to delete this price?')) return;

    try {
      const { error } = await supabase
        .from('prices')
        .delete()
        .eq('id', priceId);

      if (error) throw error;

      // Refresh data
      await fetchProductData();
    } catch (error) {
      console.error('Error deleting price:', error);
      alert('Failed to delete price. Please try again.');
    }
  };

  const handleDeleteProduct = async () => {
    if (!confirm(`Are you sure you want to delete "${product?.name}"? This will also delete all prices for this product.`)) return;

    try {
      // Delete all prices first (due to foreign key constraint)
      const { error: pricesError } = await supabase
        .from('prices')
        .delete()
        .eq('product_id', productId);

      if (pricesError) throw pricesError;

      // Delete shopping list items (due to foreign key constraint)
      const { error: listItemsError } = await supabase
        .from('shopping_list_items')
        .delete()
        .eq('product_id', productId);

      if (listItemsError) throw listItemsError;

      // Delete product
      const { error: productError } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (productError) throw productError;

      // Redirect to products page
      router.push('/dashboard/products');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product. Please try again.');
    }
  };
  const isPromotionActive = (price: PriceData) => {
    if (!price.is_promotion || !price.promotion_start || !price.promotion_end) {
      return false;
    }

    const now = new Date();
    const start = new Date(price.promotion_start);
    const end = new Date(price.promotion_end);

    return now >= start && now <= end;
  };

  const getEffectivePrice = (price: PriceData) => {
    if (isPromotionActive(price) && price.promotion_price) {
      return price.promotion_price;
    }
    return price.price;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get available stores (stores that don't have a price yet)
  const availableStores = stores.filter(store => 
    !prices.some(p => p.store_id === store.id)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-500">Loading product...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-500">Product not found</p>
            <button
              onClick={() => router.push('/dashboard/products')}
              className="mt-4 btn-secondary"
            >
              Back to Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard/products')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Products</span>
          </button>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                <div className="flex items-center gap-3 text-gray-600">
                  <span className="font-medium">{product.brand}</span>
                  <span>•</span>
                  <span>{product.category}</span>
                  {product.barcode && (
                    <>
                      <span>•</span>
                      <span className="text-sm">Barcode: {product.barcode}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard/products/${productId}/edit`}
                  className="px-4 py-2 bg-orange-600 text-white hover:bg-orange-700 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Product
                </Link>
                <button
                  onClick={handleDeleteProduct}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Product
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Prices Section */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Prices at Stores</h2>
            {availableStores.length > 0 && (
              <button
                onClick={openAddPrice}
                className="btn-primary text-sm py-2 px-4 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Price
              </button>
            )}
          </div>

          {prices.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No prices added yet</p>
              <button
                onClick={openAddPrice}
                className="btn-primary text-sm inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Your First Price
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {prices.map((price) => {
                const isActive = isPromotionActive(price);
                const effectivePrice = getEffectivePrice(price);
                
                return (
                  <div
                    key={price.id}
                    className={`p-4 rounded-lg border-2 ${
                      isActive
                        ? 'bg-green-50 border-green-500'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Store className="w-5 h-5 text-gray-600" />
                          <h3 className="font-semibold text-gray-900">
                            {price.store?.name}
                          </h3>
                          {isActive && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-green-600 text-white rounded flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              PROMO
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mb-3">{price.store?.town}</p>

                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600">Regular Price:</span>
                            <span className={`text-xl font-bold ${isActive ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                              €{price.price.toFixed(2)}
                            </span>
                          </div>

                          {price.is_promotion && price.promotion_price && (
                            <div className="flex items-start gap-3">
                              <Tag className="w-4 h-4 text-green-600 mt-1" />
                              <div>
                                {isActive ? (
                                  <>
                                    <p className="text-2xl font-bold text-green-700">
                                      €{price.promotion_price.toFixed(2)}
                                    </p>
                                    <p className="text-sm text-green-600">
                                      Valid until {formatDate(price.promotion_end!)}
                                    </p>
                                    <p className="text-xs text-green-600 mt-1">
                                      Save €{(price.price - price.promotion_price).toFixed(2)}
                                    </p>
                                  </>
                                ) : (
                                  <>
                                    <p className="text-gray-700 font-medium">
                                      Promo: €{price.promotion_price.toFixed(2)}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      {formatDate(price.promotion_start!)} - {formatDate(price.promotion_end!)}
                                    </p>
                                    {new Date() < new Date(price.promotion_start!) && (
                                      <p className="text-sm text-blue-600">Starts {formatDate(price.promotion_start!)}</p>
                                    )}
                                    {new Date() > new Date(price.promotion_end!) && (
                                      <p className="text-sm text-red-600">Expired</p>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          )}

                          {!price.is_promotion && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">❌ No active promotion</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditPrice(price)}
                          className="p-2 hover:bg-gray-100 rounded-lg text-[#CC785C] transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePrice(price.id)}
                          className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Edit Price Modal */}
      {showEditPrice && editingPrice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-xl font-semibold">Edit Price at {editingPrice.store?.name}</h3>
              <button
                onClick={() => {
                  setShowEditPrice(false);
                  setEditingPrice(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Regular Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Regular Price (€) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editRegularPrice}
                  onChange={(e) => setEditRegularPrice(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CC785C] focus:border-transparent"
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-1">The everyday price for this product</p>
              </div>

              {/* Promotion Toggle */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="isPromotion"
                  checked={isPromotion}
                  onChange={(e) => setIsPromotion(e.target.checked)}
                  className="w-4 h-4 text-[#CC785C] border-gray-300 rounded focus:ring-[#CC785C]"
                />
                <label htmlFor="isPromotion" className="text-sm font-medium text-gray-700">
                  This product is on promotion
                </label>
              </div>

              {/* Promotion Details */}
              {isPromotion && (
                <div className="space-y-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Promotional Price (€) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editPromoPrice}
                      onChange={(e) => setEditPromoPrice(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CC785C] focus:border-transparent"
                      placeholder="0.00"
                    />
                    <p className="text-xs text-gray-500 mt-1">Must be less than regular price</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Promotion Start Date *
                    </label>
                    <input
                      type="date"
                      value={promoStart}
                      onChange={(e) => setPromoStart(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CC785C] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Promotion End Date *
                    </label>
                    <input
                      type="date"
                      value={promoEnd}
                      onChange={(e) => setPromoEnd(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CC785C] focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-gray-50 flex gap-3 sticky bottom-0">
              <button
                onClick={() => {
                  setShowEditPrice(false);
                  setEditingPrice(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePrice}
                disabled={saving}
                className="flex-1 btn-primary disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Price Modal */}
      {showAddPrice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-xl font-semibold">Add Price at Store</h3>
              <button
                onClick={() => setShowAddPrice(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Store Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Store *
                </label>
                <select
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CC785C] focus:border-transparent"
                >
                  <option value="">Choose a store...</option>
                  {availableStores.map(store => (
                    <option key={store.id} value={store.id}>
                      {store.name} - {store.town}
                    </option>
                  ))}
                </select>
              </div>

              {/* Regular Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Regular Price (€) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newRegularPrice}
                  onChange={(e) => setNewRegularPrice(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CC785C] focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              {/* Promotion Toggle */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="newIsPromo"
                  checked={newIsPromo}
                  onChange={(e) => setNewIsPromo(e.target.checked)}
                  className="w-4 h-4 text-[#CC785C] border-gray-300 rounded focus:ring-[#CC785C]"
                />
                <label htmlFor="newIsPromo" className="text-sm font-medium text-gray-700">
                  This is a promotional price
                </label>
              </div>

              {/* Promotion Details */}
              {newIsPromo && (
                <div className="space-y-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Promotional Price (€) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newPromoPrice}
                      onChange={(e) => setNewPromoPrice(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CC785C] focus:border-transparent"
                      placeholder="0.00"
                    />
                    <p className="text-xs text-gray-500 mt-1">Must be less than regular price</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Promotion Start Date *
                    </label>
                    <input
                      type="date"
                      value={newPromoStart}
                      onChange={(e) => setNewPromoStart(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CC785C] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Promotion End Date *
                    </label>
                    <input
                      type="date"
                      value={newPromoEnd}
                      onChange={(e) => setNewPromoEnd(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CC785C] focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-gray-50 flex gap-3 sticky bottom-0">
              <button
                onClick={() => setShowAddPrice(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPrice}
                disabled={adding || !selectedStore}
                className="flex-1 btn-primary disabled:opacity-50"
              >
                {adding ? 'Adding...' : 'Add Price'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}