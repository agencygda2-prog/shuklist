'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ShoppingCart, Store, TrendingDown, Tag, Plus, Camera, Building2, List } from 'lucide-react';

type Stats = {
  lists: number;
  stores: number;
  products: number;
  promotions: number;
};

export default function DashboardPage() {
  const [userData, setUserData] = useState<any>(null);
  const [stats, setStats] = useState<Stats>({ lists: 0, stores: 0, products: 0, promotions: 0 });
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      setUserData(profile);

      // Get stats
      const [listsRes, storesRes, productsRes, promotionsRes] = await Promise.all([
        supabase.from('shopping_lists').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('stores').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('prices').select('id', { count: 'exact', head: true }).eq('is_promotion', true)
      ]);

      setStats({
        lists: listsRes.count || 0,
        stores: storesRes.count || 0,
        products: productsRes.count || 0,
        promotions: promotionsRes.count || 0
      });

      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20">
      <div className="max-w-6xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {userData?.full_name?.split(' ')[0] || 'there'}! 👋
          </h1>
          <p className="text-gray-600">
            Compare prices and save money on your grocery shopping
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => router.push('/dashboard/lists')}
            className="card hover:shadow-lg transition-shadow cursor-pointer text-left group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition-colors">
                <List className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stats.lists}</p>
            <p className="text-sm text-gray-600">Shopping Lists</p>
          </button>

          <button
            onClick={() => router.push('/dashboard/stores')}
            className="card hover:shadow-lg transition-shadow cursor-pointer text-left group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-purple-100 p-3 rounded-lg group-hover:bg-purple-200 transition-colors">
                <Store className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stats.stores}</p>
            <p className="text-sm text-gray-600">Stores</p>
          </button>

          <button
            onClick={() => router.push('/dashboard/products')}
            className="card hover:shadow-lg transition-shadow cursor-pointer text-left group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-green-100 p-3 rounded-lg group-hover:bg-green-200 transition-colors">
                <ShoppingCart className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stats.products}</p>
            <p className="text-sm text-gray-600">Products</p>
          </button>

          <div className="card">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-orange-100 p-3 rounded-lg">
                <Tag className="w-6 h-6 text-[#CC785C]" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stats.promotions}</p>
            <p className="text-sm text-gray-600">Promotions</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-3">
            <button
              onClick={() => router.push('/dashboard/lists/create')}
              className="flex items-center gap-3 p-4 bg-[#CC785C] hover:bg-[#B86A4F] text-white rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">New Shopping List</span>
            </button>
            <button
              onClick={() => router.push('/dashboard/products/add')}
              className="flex items-center gap-3 p-4 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition-colors"
            >
              <Camera className="w-5 h-5" />
              <span className="font-medium">Scan Product</span>
            </button>
            <button
              onClick={() => router.push('/dashboard/stores')}
              className="flex items-center gap-3 p-4 border-2 border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg transition-colors"
            >
              <Building2 className="w-5 h-5" />
              <span className="font-medium">Browse Stores</span>
            </button>
          </div>
        </div>

        {/* Getting Started - Show only if no products */}
        {stats.products === 0 && (
          <div className="card bg-orange-50 border-2 border-[#CC785C]">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">🚀 Getting Started</h2>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="bg-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-[#CC785C] flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-900">Add products you buy regularly</p>
                  <p className="text-sm text-gray-600">Use the barcode scanner or add manually</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="bg-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-[#CC785C] flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-900">Create a shopping list</p>
                  <p className="text-sm text-gray-600">Add the products you need this week</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="bg-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-[#CC785C] flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="font-medium text-gray-900">Compare prices & save money</p>
                  <p className="text-sm text-gray-600">See which store offers the best deal</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push('/dashboard/products/add')}
              className="mt-6 w-full btn-primary"
            >
              Add Your First Product
            </button>
          </div>
        )}

        {/* Show next step if they have products but no lists */}
        {stats.products > 0 && stats.lists === 0 && (
          <div className="card bg-green-50 border-2 border-green-500">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">✨ Ready for the next step!</h2>
            <p className="text-gray-700 mb-4">
              You have {stats.products} products. Now create a shopping list to start comparing prices and saving money.
            </p>
            <button
              onClick={() => router.push('/dashboard/lists/create')}
              className="btn-primary"
            >
              Create Your First Shopping List
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
