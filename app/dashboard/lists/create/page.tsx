'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ArrowLeft, ShoppingCart } from 'lucide-react';

export default function CreateListPage() {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!name.trim()) {
      alert('Please enter a list name');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data, error } = await supabase
        .from('shopping_lists')
        .insert({
          user_id: user.id,
          name: name.trim()
        })
        .select()
        .single();

      if (error) throw error;

      // Redirect to the new list detail page
      router.push(`/dashboard/lists/${data.id}`);
    } catch (error) {
      console.error('Error creating list:', error);
      alert('Failed to create list. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Shopping List</h1>
          <p className="text-gray-600">Give your list a name to get started</p>
        </div>

        {/* Form */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* List Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                List Name *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Weekly Groceries, Party Supplies, Quick Trip"
                className="input-field"
                maxLength={100}
                disabled={isSubmitting}
                required
                autoFocus
              />
              <p className="mt-1 text-sm text-gray-500">
                Choose a descriptive name for your shopping list
              </p>
            </div>

            {/* Quick Suggestions */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Quick suggestions:</p>
              <div className="flex flex-wrap gap-2">
                {['Weekly Groceries', 'Monthly Stock-up', 'Party Supplies', 'Quick Trip'].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setName(suggestion)}
                    disabled={isSubmitting}
                    className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                disabled={isSubmitting}
                className="btn-secondary flex-1 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Create List'}
              </button>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 card bg-orange-50 border-orange-200">
          <div className="flex gap-3">
            <div className="bg-orange-100 p-2 rounded-lg h-fit">
              <ShoppingCart className="w-5 h-5 text-[#CC785C]" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 mb-1">What's next?</p>
              <p className="text-sm text-gray-700">
                After creating your list, you'll be able to add products and compare prices across all stores to find the best deals.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
