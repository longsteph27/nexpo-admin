'use client';

import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import ProtectedRoute from '@/components/ProtectedRoute';
import CollectionList from '@/components/collections/CollectionList';
import { getCollectionInfo } from '@/lib/collection-metadata';
import { CollectionName } from '@/types/collections';
import Header from '@/components/layout/Header';

function CollectionManagementContent() {
  const params = useParams();
  const router = useRouter();
  const collection = params.collection as CollectionName;

  // Get collection info
  const collectionInfo = getCollectionInfo(collection);

  const handleBack = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header title={`Manage ${collectionInfo.displayName}`} />
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Back Button */}
          <div className="mb-6">
            <button
              onClick={handleBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Icon icon="mdi:arrow-left" className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
          </div>

          {/* Collection Management */}
          <CollectionList 
            collection={collection} 
            collectionInfo={collectionInfo} 
          />
        </div>
      </main>
    </div>
  );
}

export default function CollectionManagementPage() {
  return (
    <ProtectedRoute>
      <CollectionManagementContent />
    </ProtectedRoute>
  );
}

