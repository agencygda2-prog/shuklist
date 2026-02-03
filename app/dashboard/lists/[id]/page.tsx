'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ArrowLeft, Plus, TrendingDown, Store, Trash2, Search, X } from 'lucide-react';

type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
};

type ProductWithPrice = Product & {
  cheapest_price?: number;
  cheapest_store?: string;
};

type ListItem = {
  id: string;
  product_id: string;
  quantity: number;
  product: Product;
};

type Price = {
  product_id: string;
  store_id: string;
  price: number;
  is_promotion: boolean;
};

type StoreData = {
  id: string;
  name: string;
  town: string;
};

type StoreComparison = {
  store: StoreData;
  total: number;
  available_items: number;
  missing_items: number;
  savings?: number;
};

export default function ListDetailPage() {
  const params = useParams();
  const listId = params?.id as string;
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [listName, setListName] = useState('');
  const [items, setItems] = useState<ListItem[]>([]);
  const [comparison, setComparison] = useState<StoreComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);

  // Add product modal state
  const [products, setProducts] = useState<ProductWithPrice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (listId) {
      fetchListData();
    }
  }, [listId]);

  const fetchListData = async () => {
    try {
      // Get list details
      const { data: listData, error: listError } = await supabase
        .from('shopping_lists')
        .select('name')
        .eq('id', listId)
        .single();

      if (listError) throw listError;
      setListName(listData.name);

      // Get list items with product details
      const { data: itemsData, error: itemsError } = await supabase
        .from('shopping_list_items')
        .select(`
          id,
          product_id,
          quantity,
          products (
            id,
            name,
            brand,
            category
          )
        `)
        .eq('list_id', listId);

      if (itemsError) throw itemsError;

      const transformedItems = itemsData?.map(item => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        product: item.products as unknown as Product
      })) || [];

      setItems(transformedItems);

      // Calculate price comparison
      if (transformedItems.length > 0) {
        await calculateComparison(transformedItems);
      }
    } catch (error) {
      console.error('Error fetching list:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateComparison = async (listItems: ListItem[]) => {
    try {
      const productIds = listItems.map(item => item.product_id);

      // Get all prices for these products
      const { data: pricesData, error: pricesError } = await supabase
        .from('prices')
        .select('product_id, store_id, price, is_promotion')
        .in('product_id', productIds);

      if (pricesError) throw pricesError;

      // Get all stores
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('id, name, town');

      if (storesError) throw storesError;

      // Calculate total for each store
      const storeComparisons: StoreComparison[] = storesData.map(store => {
        let total = 0;
        let availableItems = 0;
        let missingItems = 0;

        listItems.forEach(item => {
          const price = pricesData.find(
            p => p.product_id === item.product_id && p.store_id === store.id
          );

          if (price) {
            total += price.price * item.quantity;
            availableItems++;
          } else {
            missingItems++;
          }
        });

        return {
          store,
          total,
          available_items: availableItems,
          missing_items: missingItems
        };
      });

      // Sort by total (only stores with all items)
      const completeStores = storeComparisons.filter(sc => sc.missing_items === 0);
      completeStores.sort((a, b) => a.total - b.total);

      // Calculate savings vs cheapest
      if (completeStores.length > 0) {
        const cheapest = completeStores[0].total;
        completeStores.forEach(sc => {
          sc.savings = sc.total - cheapest;
        });
      }

      // Combine complete stores first, then incomplete
      const incompleteStores = storeComparisons.filter(sc => sc.missing_items > 0);
      setComparison([...completeStores, ...incompleteStores]);
    } catch (error) {
      console.error('Error calculating comparison:', error);
    }
  };

  const openAddProduct = async () => {
    setShowAddProduct(true);
    // Fetch all products with their cheapest prices
    try {
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, brand, category')
        .order('name');

      if (productsError) throw productsError;

      // Fetch all prices
      const { data: pricesData, error: pricesError } = await supabase
        .from('prices')
        .select('product_id, store_id, price');

      if (pricesError) throw pricesError;

      // Fetch all stores
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('id, name');

      if (storesError) throw storesError;

      // Attach cheapest price to each product
      const productsWithPrices: ProductWithPrice[] = productsData.map(product => {
        const productPrices = pricesData.filter(p => p.product_id === product.id);
        
        if (productPrices.length > 0) {
          // Find cheapest price
          const cheapest = productPrices.reduce((min, p) => p.price < min.price ? p : min);
          const store = storesData.find(s => s.id === cheapest.store_id);
          
          return {
            ...product,
            cheapest_price: cheapest.price,
            cheapest_store: store?.name || 'Unknown'
          };
        }
        
        return product;
      });

      // Sort by price (products with prices first, then alphabetically)
      productsWithPrices.sort((a, b) => {
        if (a.cheapest_price && b.cheapest_price) {
          return a.cheapest_price - b.cheapest_price;
        }
        if (a.cheapest_price) return -1;
        if (b.cheapest_price) return 1;
        return a.name.localeCompare(b.name);
      });

      setProducts(productsWithPrices);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleAddProduct = async () => {
    if (!selectedProduct || adding) return;

    setAdding(true);
    try {
      // Check if product already in list
      const existing = items.find(item => item.product_id === selectedProduct);
      if (existing) {
        alert('This product is already in your list');
        setAdding(false);
        return;
      }

      const { error } = await supabase
        .from('shopping_list_items')
        .insert({
          list_id: listId,
          product_id: selectedProduct,
          quantity: quantity
        });

      if (error) throw error;

      // Refresh list
      await fetchListData();

      // Reset modal
      setShowAddProduct(false);
      setSelectedProduct(null);
      setQuantity(1);
      setSearchTerm('');
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Failed to add product. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('shopping_list_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      // Refresh list
      await fetchListData();
    } catch (error) {
      console.error('Error removing item:', error);
      alert('Failed to remove item. Please try again.');
    }
  };

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      const { error } = await supabase
        .from('shopping_list_items')
        .update({ quantity: newQuantity })
        .eq('id', itemId);

      if (error) throw error;

      // Update local state and recalculate
      const updatedItems = items.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      );
      setItems(updatedItems);
      await calculateComparison(updatedItems);
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.brand?.toLowerCase().includes(searchTerm.toLowerCase() ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-500">Loading list...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard/lists')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Lists</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{listName}</h1>
          <p className="text-gray-600">{items.length} items in this list</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column: Items */}
          <div>
            <div className="card mb-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Items</h2>
                <button
                  onClick={openAddProduct}
                  className="btn-primary text-sm py-2 px-4 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Product
                </button>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No items yet</p>
                  <button
                    onClick={openAddProduct}
                    className="btn-primary text-sm inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Your First Product
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.product.name}</p>
                        <p className="text-sm text-gray-500">{item.product.brand}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 flex items-center justify-center"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 rounded-lg text-red-600 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Price Comparison */}
          <div>
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingDown className="w-6 h-6 text-[#CC785C]" />
                Price Comparison
              </h2>

              {items.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Add items to see price comparison</p>
                </div>
              ) : comparison.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No stores have prices for these products yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {comparison.map((sc, index) => {
                    const isComplete = sc.missing_items === 0;
                    const isCheapest = index === 0 && isComplete;

                    return (
                      <div
                        key={sc.store.id}
                        className={`p-4 rounded-lg border-2 ${
                          isCheapest
                            ? 'bg-green-50 border-green-500'
                            : isComplete
                            ? 'bg-white border-gray-200'
                            : 'bg-gray-50 border-gray-300 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <Store className="w-5 h-5 text-gray-600" />
                              <h3 className="font-semibold text-gray-900">{sc.store.name}</h3>
                              {isCheapest && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-green-600 text-white rounded">
                                  BEST PRICE
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mt-1">{sc.store.town}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900">
                              €{sc.total.toFixed(2)}
                            </p>
                            {isComplete && sc.savings !== undefined && sc.savings > 0 && (
                              <p className="text-sm text-red-600">
                                +€{sc.savings.toFixed(2)}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-600">
                            {sc.available_items} of {items.length} items
                          </span>
                          {sc.missing_items > 0 && (
                            <span className="text-orange-600">
                              {sc.missing_items} missing
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {comparison.length > 0 && comparison[0].missing_items === 0 && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    💰 Potential Savings
                  </p>
                  <p className="text-sm text-blue-700">
                    Shopping at {comparison[0].store.name} saves you €
                    {comparison[comparison.length - 1].total - comparison[0].total > 0
                      ? (comparison[comparison.length - 1].total - comparison[0].total).toFixed(2)
                      : '0.00'
                    } compared to the most expensive option
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-xl font-semibold">Add Product to List</h3>
              <button
                onClick={() => {
                  setShowAddProduct(false);
                  setSelectedProduct(null);
                  setSearchTerm('');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CC785C] focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    {searchTerm ? 'No products found' : 'No products available. Add products first!'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => setSelectedProduct(product.id)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedProduct === product.id
                          ? 'border-[#CC785C] bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                            <span>{product.brand}</span>
                            <span>•</span>
                            <span>{product.category}</span>
                          </div>
                        </div>
                        {product.cheapest_price && (
                          <div className="text-right ml-3">
                            <p className="text-lg font-bold text-green-600">
                              €{product.cheapest_price.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">at {product.cheapest_store}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedProduct && (
              <div className="p-4 border-t bg-gray-50">
                <div className="flex items-center gap-4 mb-4">
                  <label className="text-sm font-medium text-gray-700">Quantity:</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 flex items-center justify-center font-semibold"
                    >
                      -
                    </button>
                    <span className="w-12 text-center font-semibold text-lg">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 flex items-center justify-center font-semibold"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAddProduct}
                  disabled={adding}
                  className="w-full btn-primary disabled:opacity-50"
                >
                  {adding ? 'Adding...' : 'Add to List'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
