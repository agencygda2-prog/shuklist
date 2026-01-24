'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Store } from '@/types';
import { MapPin, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import AddStoreModal from './AddStoreModal';

export default function StoreList() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

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
    } finally {
      setLoading(false);
    }
  };

  const handleStoreAdded = () => {
    fetchStores();
    setShowAddModal(false);
    toast.success('Store added successfully!');
  };

  // Group stores by town
  const storesByTown = stores.reduce((acc, store) => {
    if (!acc[store.town]) {
      acc[store.town] = [];
    }
    acc[store.town].push(store);
    return acc;
  }, {} as Record<string, Store[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading stores...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Stores</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Store
        </button>
      </div>

      {/* Stores by Town */}
      <div className="space-y-8">
        {Object.entries(storesByTown).map(([town, townStores]) => (
          <div key={town}>
            <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              {town}
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {townStores.map((store) => (
                <div key={store.id} className="card hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">{store.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{store.town}</p>
                      {store.address && (
                        <p className="text-xs text-gray-500 mt-1">{store.address}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add Store Modal */}
      {showAddModal && (
        <AddStoreModal
          onClose={() => setShowAddModal(false)}
          onStoreAdded={handleStoreAdded}
        />
      )}
    </div>
  );
}
