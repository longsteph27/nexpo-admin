'use client';

import React from 'react';
import { Icon } from '@iconify/react';

interface GenericBlockEditorProps {
  collection: string;
}

export default function GenericBlockEditor({ collection }: GenericBlockEditorProps) {
  return (
    <div className="text-center py-12">
      <Icon icon="lucide:construction" className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
      <p className="text-sm text-neutral-500">
        Editor for <span className="font-medium">{collection}</span> is under construction
      </p>
    </div>
  );
}




