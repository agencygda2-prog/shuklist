'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ShoppingCart, Plus, Trash2, ChevronRight } from 'lucide-react';

type ShoppingList = {
  id: string;
  name: string;
  created_at: string;
  item_count?: number;
};

export default function ListsPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    try {
      // Get all shopping lists for current user
      const { data: listsData, error: listsError } = await supabase
        .from('shopping_lists')
        .select('id, name, created_at')
        .order('created_at', { ascending: false });

      if (listsError) throw listsError;

      // Get item counts for each list
      const listsWithCounts = await Promise.all(
        (listsData || []).map(async (list) => {
          const { count } = await supabase
            .from('shopping_list_items')
            .select('*', { count: 'exact', head: true })
            .eq('list_id', list.id);

          return {
            ...list,
            item_count: count || 0
          };
        })
      );

      setLists(listsWithCounts);
    } catch (error) {
      console.error('Error fetching lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteList = async (listId: string, listName: string) => {
    if (!confirm(`Are you sure you want to delete "${listName}"? This will also delete all items in this list.`)) {
      return;
    }

    try {
      // Delete list items first (foreign key constraint)
      const { error: itemsError } = await supabase
        .from('shopping_list_items')
        .delete()
        .eq('list_id', listId);

      if (itemsError) throw itemsError;

      // Delete the list
      const { error: listError } = await supabase
        .from('shopping_lists')
        .delete()
        .eq('id', listId);

      if (listError) throw listError;

      // Refresh lists
      await fetchLists();
    } catch (error) {
      console.error('Error deleting list:', error);
      alert('Failed to delete list. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading lists...</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Shopping Lists</h1>
          <p className="text-gray-600">Create and manage your shopping lists</p>
        </div>

        {/* Create New List Button */}
        <button
          onClick={() => router.push('/dashboard/lists/create')}
          className="w-full mb-6 p-4 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all flex items-center justify-center gap-2 text-gray-600 hover:text-orange-600"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Create New Shopping List</span>
        </button>

        {/* Lists */}
        {lists.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No lists yet</h2>
            <p className="text-gray-600 mb-6">Create your first shopping list to start comparing prices</p>
            <button
              onClick={() => router.push('/dashboard/lists/create')}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Your First List
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {lists.map((list) => (
              <div
                key={list.id}
                className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => router.push(`/dashboard/lists/${list.id}`)}
                    className="flex-1 flex items-center gap-4 text-left"
                  >
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <ShoppingCart className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                        {list.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {list.item_count} {list.item_count === 1 ? 'item' : 'items'} • Created {new Date(list.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteList(list.id, list.name);
                    }}
                    className="ml-2 p-2 hover:bg-red-50 rounded-lg text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete list"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
