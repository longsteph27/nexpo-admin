'use client';

export default function TestFontsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Font Test Page</h1>
          <p className="text-content-secondary">
            Test các fonts đã được cấu hình trong project
          </p>
        </div>

        {/* SF Pro Font Test */}
        <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2 text-blue-600">SF Pro Display</h2>
            <p className="text-sm text-content-tertiary mb-4">
              Trên macOS: Sẽ hiển thị SF Pro (system font)
              <br />
              Trên Windows/Linux: Sẽ fallback sang Segoe UI / Roboto
            </p>
          </div>

          {/* Different sizes */}
          <div className="space-y-4">
            <div>
              <p className="text-xs text-content-tertiary mb-1">Heading Large (font-sf)</p>
              <h1 className="font-sf text-4xl font-bold">
                Event Information
              </h1>
            </div>

            <div>
              <p className="text-xs text-content-tertiary mb-1">Heading Medium (font-sf)</p>
              <h2 className="font-sf text-2xl font-semibold">
                Sites Management
              </h2>
            </div>

            <div>
              <p className="text-xs text-content-tertiary mb-1">Body Text (font-sf)</p>
              <p className="font-sf text-base">
                This is a regular paragraph text using SF Pro Display font. 
                You should see clear, readable text with Apple's signature design.
              </p>
            </div>

            <div>
              <p className="text-xs text-content-tertiary mb-1">Small Text (font-sf)</p>
              <p className="font-sf text-sm text-content-secondary">
                Small text for labels and descriptions - Pages, Navigation Items
              </p>
            </div>

            <div>
              <p className="text-xs text-content-tertiary mb-1">Extra Small (font-sf)</p>
              <p className="font-sf text-xs text-content-tertiary uppercase tracking-wider">
                Event Information • Sites • Pages
              </p>
            </div>
          </div>

          {/* Font weights */}
          <div className="border-t pt-6">
            <h3 className="font-sf text-lg font-semibold mb-4">Font Weights</h3>
            <div className="space-y-2">
              <p className="font-sf font-normal">Font Normal (400) - Regular text</p>
              <p className="font-sf font-medium">Font Medium (500) - Labels and emphasis</p>
              <p className="font-sf font-semibold">Font Semibold (600) - Headers</p>
              <p className="font-sf font-bold">Font Bold (700) - Strong emphasis</p>
            </div>
          </div>
        </div>

        {/* SF Pro Text Test */}
        <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2 text-blue-600">SF Pro Text</h2>
            <p className="text-sm text-content-tertiary mb-4">
              Optimized for smaller text and body content
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-content-tertiary mb-1">Body Text (font-sf-text)</p>
              <p className="font-sf-text text-base">
                SF Pro Text is optimized for smaller sizes and longer reading. 
                It has subtle differences in letter spacing and weight compared to Display.
              </p>
            </div>

            <div>
              <p className="text-xs text-content-tertiary mb-1">Small Body Text (font-sf-text)</p>
              <p className="font-sf-text text-sm text-content-secondary">
                Perfect for descriptions, helper text, and secondary information 
                that users need to read comfortably.
              </p>
            </div>
          </div>
        </div>

        {/* Comparison */}
        <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
          <h2 className="text-2xl font-bold mb-2 text-blue-600">Font Comparison</h2>
          
          <div className="space-y-4">
            <div className="border-b pb-4">
              <p className="text-xs text-content-tertiary mb-2">SF Pro (font-sf)</p>
              <p className="font-sf text-lg">
                The quick brown fox jumps over the lazy dog 0123456789
              </p>
            </div>

            <div className="border-b pb-4">
              <p className="text-xs text-content-tertiary mb-2">Poppins (font-sans / default)</p>
              <p className="font-sans text-lg">
                The quick brown fox jumps over the lazy dog 0123456789
              </p>
            </div>

            <div className="border-b pb-4">
              <p className="text-xs text-content-tertiary mb-2">Inter</p>
              <p className="text-lg" style={{ fontFamily: 'Inter, sans-serif' }}>
                The quick brown fox jumps over the lazy dog 0123456789
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar Preview */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold mb-4 text-blue-600">Sidebar Preview</h2>
          <p className="text-sm text-content-tertiary mb-6">
            Xem trước các text trong EventSidebar với font SF Pro
          </p>

          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            {/* Header sections */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 py-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-sf text-sm font-medium text-content-primary">Event Information</span>
              </div>

              <div className="flex items-center space-x-2 py-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-sf text-sm font-medium text-content-primary">Sites</span>
              </div>
            </div>

            {/* Site items */}
            <div className="ml-6 space-y-2">
              <div className="flex items-center space-x-2 py-1 hover:bg-blue-50 rounded px-2 cursor-pointer">
                <svg className="w-4 h-4 text-content-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <span className="font-sf text-sm">Main Website</span>
              </div>

              <div className="ml-6">
                <div className="flex items-center space-x-2 py-1 hover:bg-gray-100 rounded px-2 cursor-pointer">
                  <svg className="w-4 h-4 text-content-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="font-sf text-sm text-content-primary">Pages</span>
                </div>

                <div className="ml-8 space-y-1 mt-2">
                  <div className="flex items-center space-x-2 py-1 hover:bg-blue-50 rounded px-2 cursor-pointer">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                    <span className="font-sf text-sm">Homepage</span>
                  </div>
                  <div className="flex items-center space-x-2 py-1 hover:bg-blue-50 rounded px-2 cursor-pointer">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                    <span className="font-sf text-sm">About Us</span>
                  </div>
                  <div className="flex items-center space-x-2 py-1 hover:bg-blue-50 rounded px-2 cursor-pointer">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                    <span className="font-sf text-sm">Contact</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-sf text-lg font-semibold text-blue-900 mb-4">
            ✅ Font đang hoạt động!
          </h3>
          
          <div className="space-y-3 text-sm text-blue-800">
            <p>
              <strong>Hiện tại:</strong> Đang sử dụng system font (-apple-system)
            </p>
            
            <p>
              • <strong>Trên macOS:</strong> Tự động dùng SF Pro (built-in system font) ✨
              <br />
              • <strong>Trên Windows:</strong> Fallback sang Segoe UI
              <br />
              • <strong>Trên Linux:</strong> Fallback sang Roboto
            </p>

            <div className="bg-white rounded p-4 mt-4">
              <p className="font-semibold text-blue-900 mb-2">
                📦 Muốn dùng custom font files?
              </p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Download SF Pro từ: <a href="https://developer.apple.com/fonts/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">developer.apple.com/fonts</a></li>
                <li>Copy 4 font files vào: <code className="bg-gray-100 px-2 py-1 rounded">/public/fonts/</code></li>
                <li>Uncomment @font-face trong <code className="bg-gray-100 px-2 py-1 rounded">globals.css</code></li>
                <li>Restart dev server</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-content-tertiary pb-8">
          <p>Navigate to: <code className="bg-gray-100 px-2 py-1 rounded">/test-fonts</code></p>
        </div>
      </div>
    </div>
  );
}

