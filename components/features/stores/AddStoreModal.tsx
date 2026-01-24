'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { DEFAULT_TOWNS } from '@/types';

interface AddStoreModalProps {
  onClose: () => void;
  onStoreAdded: () => void;
}

export default function AddStoreModal({ onClose, onStoreAdded }: AddStoreModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    town: '',
    address: '',
    customTown: '',
  });
  const [useCustomTown, setUseCustomTown] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const town = useCustomTown ? formData.customTown : formData.town;

      if (!town) {
        toast.error('Please select or enter a town');
        setLoading(false);
        return;
      }

      // Insert the new store
      const { error } = await supabase
        .from('stores')
        .insert({
          name: formData.name,
          town: town,
          address: formData.address || null,
          created_by: user.id,
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new Error('This store already exists in this town');
        }
        throw error;
      }

      onStoreAdded();
    } catch (error: any) {
      console.error('Error adding store:', error);
      toast.error(error.message || 'Failed to add store');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-bold text-gray-900">Add New Store</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Store Name *
            </label>
            <input
              type="text"
              required
              className="input-field"
              placeholder="e.g., Lidl, Aldi, Penny Market"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Town *
            </label>
            {!useCustomTown ? (
              <>
                <select
                  required
                  className="input-field"
                  value={formData.town}
                  onChange={(e) => setFormData({ ...formData, town: e.target.value })}
                >
                  <option value="">Select town...</option>
                  {DEFAULT_TOWNS.map((town) => (
                    <option key={town} value={town}>
                      {town}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setUseCustomTown(true)}
                  className="text-sm text-primary hover:text-primary-dark mt-2"
                >
                  + Add a different town
                </button>
              </>
            ) : (
              <>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="Enter town name"
                  value={formData.customTown}
                  onChange={(e) => setFormData({ ...formData, customTown: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setUseCustomTown(false)}
                  className="text-sm text-primary hover:text-primary-dark mt-2"
                >
                  ← Back to list
                </button>
              </>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address (optional)
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Street address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? 'Adding...' : 'Add Store'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
