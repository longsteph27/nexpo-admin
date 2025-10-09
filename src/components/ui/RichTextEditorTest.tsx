'use client';

import React from 'react';
import { RichTextEditor } from './RichTextEditor';

export function RichTextEditorTest() {
  const [content, setContent] = React.useState(`
    <p>Tran Minh Long test At our digital agency, we believe that standing out in the crowded digital landscape requires a unique approach. That's why we take a <a href="https://example.com">holistic approach</a> to digital marketing, focusing on building a strong brand identity and developing strategies that are tailored to our clients' specific needs.</p>
    
    <p><a href="https://google.com">Test Button</a></p>
    
    <h1>H1</h1>
    
    <p>Our team of experts brings a diverse range of skills and experiences to the table, including web design, content creation, SEO, social media marketing, and more. We're not just interested in getting quick results; we're invested in helping our clients build sustainable, long-term success.</p>
    
    <ol>
      <li>Number 1</li>
      <li>Number 2 (Who does number 2 work for)</li>
      <li>Number 3</li>
    </ol>
    
    <ul>
      <li>Item 1</li>
      <li>Item 2</li>
      <li>Item 3</li>
    </ul>
    
    <h2>H2</h2>
    <p>Some text</p>
    
    <h3>H3</h3>
    <p>Some text</p>
    
    <p>From the initial consultation to ongoing support, we're dedicated to providing personalized attention and exceptional service. At our digital agency, we're not just different from the rest - we're better.</p>
  `);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Rich Text Editor Test</h2>
      <RichTextEditor
        value={content}
        onChange={setContent}
        placeholder="Enter your content..."
      />
      
      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Current Content:</h3>
        <pre className="text-sm overflow-auto">{content}</pre>
      </div>
    </div>
  );
}
