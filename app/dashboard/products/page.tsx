'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Plus, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Product, Price } from '@/types';

interface ProductWithLatestPrice extends Product {
  latest_price?: Price;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductWithLatestPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentUser();
    fetchProducts();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setCurrentUserId(user.id);
        
        // Check if user is admin (your email)
        const { data: userData } = await supabase
          .from('users')
          .select('email')
          .eq('id', user.id)
          .single();
        
        setIsAdmin(userData?.email === 'levi.btzur@gmail.com');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const supabase = createClient();
      
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          prices (
            id,
            price,
            store_id,
            is_promotion,
            promotion_end_date,
            date_recorded,
            stores (
              id,
              name,
              town
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      const productsWithPrices = productsData?.map(product => {
        const sortedPrices = product.prices?.sort((a: any, b: any) => 
          new Date(b.date_recorded).getTime() - new Date(a.date_recorded).getTime()
        );
        
        return {
          ...product,
          latest_price: sortedPrices?.[0] || undefined,
        };
      }) || [];

      setProducts(productsWithPrices);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const canDelete = (product: ProductWithLatestPrice) => {
    // Admin can delete anything
    if (isAdmin) return true;
    
    // User can only delete their own products
    return product.created_by === currentUserId;
  };

  const handleDelete = async (e: React.MouseEvent, product: ProductWithLatestPrice) => {
    e.preventDefault(); // Prevent navigation to product detail
    e.stopPropagation();
    
    if (!canDelete(product)) {
      toast.error('You can only delete products you created');
      return;
    }

    const confirmMessage = `Delete "${product.name}"?\n\nThis will also delete all price records for this product.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setDeletingId(product.id);

    try {
      const supabase = createClient();
      
      // Delete all prices first (cascade)
      const { error: pricesError } = await supabase
        .from('prices')
        .delete()
        .eq('product_id', product.id);
      
      if (pricesError) throw pricesError;

      // Then delete the product
      const { error: productError } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id);

      if (productError) throw productError;

      toast.success('Product deleted successfully! 🗑️');
      
      // Remove from local state
      setProducts(products.filter(p => p.id !== product.id));
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast.error(error.message || 'Failed to delete product');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.brand?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading products...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Products</h1>
        <Link href="/dashboard/products/add" className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Product
        </Link>
      </div>

      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products..."
              className="input-field pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="input-field md:w-64"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.filter(c => c !== 'all').map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600 mb-4">
            {searchQuery || selectedCategory !== 'all' 
              ? 'No products found matching your filters.' 
              : 'No products yet. Start by adding your first product!'}
          </p>
          <Link href="/dashboard/products/add" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Your First Product
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="card hover:shadow-md transition-shadow relative group"
            >
              {canDelete(product) && (
                <button
                  onClick={(e) => handleDelete(e, product)}
                  disabled={deletingId === product.id}
                  className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed z-10"
                  title="Delete product"
                >
                  {deletingId === product.id ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                </button>
              )}
              
              <Link
                href={`/dashboard/products/${product.id}`}
                className="block"
              >
                <div className="flex items-start gap-4">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-20 h-20 object-cover rounded"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-surface rounded flex items-center justify-center text-gray-400">
                      📦
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                    {product.brand && (
                      <p className="text-sm text-gray-600">{product.brand}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">{product.category}</p>
                    
                    {product.latest_price && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-primary">
                            €{product.latest_price.price.toFixed(2)}
                          </span>
                          {product.latest_price.is_promotion && (
                            <span className="badge-promotion text-xs">PROMO</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          at {(product.latest_price as any).stores?.name}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}