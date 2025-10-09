'use client';

import dynamic from 'next/dynamic';

const RichTextEditorTest = dynamic(
  () => import('@/components/ui/RichTextEditorTest').then(mod => ({ default: mod.RichTextEditorTest })),
  { 
    ssr: false,
    loading: () => <div className="min-h-screen bg-white flex items-center justify-center">Loading editor...</div>
  }
);

export default function TestEditorPage() {
  return (
    <div className="min-h-screen bg-white">
      <RichTextEditorTest />
    </div>
  );
}
