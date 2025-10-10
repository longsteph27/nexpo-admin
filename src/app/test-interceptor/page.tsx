'use client';

import { useState } from 'react';
import { directusHelpers } from '@/lib/directus';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function TestInterceptorPage() {
  const { isAuthenticated, user } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev]);
  };

  const testSingleRequest = async () => {
    setLoading(true);
    addLog('🚀 Testing single API request...');
    
    try {
      const result = await directusHelpers.getCurrentUser();
      if (result.success) {
        addLog('✅ Request successful: ' + result.data?.email);
      } else {
        addLog('❌ Request failed: ' + result.error);
      }
    } catch (error) {
      addLog('❌ Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const testMultipleRequests = async () => {
    setLoading(true);
    addLog('🚀 Testing multiple concurrent API requests...');
    
    try {
      const promises = [
        directusHelpers.getCurrentUser(),
        directusHelpers.getUserTenants(),
        directusHelpers.getUserPermissions(),
      ];

      const results = await Promise.all(promises);
      
      results.forEach((result, index) => {
        if (result.success) {
          addLog(`✅ Request ${index + 1} successful`);
        } else {
          addLog(`❌ Request ${index + 1} failed: ${result.error}`);
        }
      });
    } catch (error) {
      addLog('❌ Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const forceTokenExpiry = () => {
    addLog('⚠️ Simulating token expiry...');
    addLog('📝 To test: Manually modify your access token in localStorage');
    addLog('💡 Then click "Test Single Request" to see auto-refresh in action');
    
    // Instructions for manual testing
    const instructions = `
1. Open DevTools Console
2. Run: localStorage.setItem('nexpo-auth-storage', JSON.stringify({
   ...JSON.parse(localStorage.getItem('nexpo-auth-storage')),
   state: {
     ...JSON.parse(localStorage.getItem('nexpo-auth-storage')).state,
     accessToken: 'invalid-token'
   }
}))
3. Click "Test Single Request"
4. Watch console for interceptor logs
5. Request should auto-refresh and succeed
    `;
    
    addLog(instructions);
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('🧹 Logs cleared');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please login to test the interceptor</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle>Directus Interceptor Test Page</CardTitle>
            <CardDescription>
              Test auto token refresh when API returns 401
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-sm">
                User: {user?.email}
              </Badge>
              <Badge 
                variant={isAuthenticated ? "default" : "destructive"}
                className="text-sm"
              >
                {isAuthenticated ? "Authenticated ✓" : "Not Authenticated"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Test Controls</CardTitle>
            <CardDescription>
              Run tests to verify interceptor behavior
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button 
                onClick={testSingleRequest}
                disabled={loading}
                variant="default"
                className="w-full"
              >
                {loading ? 'Loading...' : 'Test Single Request'}
              </Button>
              
              <Button 
                onClick={testMultipleRequests}
                disabled={loading}
                variant="default"
                className="w-full"
              >
                {loading ? 'Loading...' : 'Test Multiple Requests'}
              </Button>
              
              <Button 
                onClick={forceTokenExpiry}
                disabled={loading}
                variant="secondary"
                className="w-full"
              >
                Instructions: Force Token Expiry
              </Button>
              
              <Button 
                onClick={clearLogs}
                variant="outline"
                className="w-full"
              >
                Clear Logs
              </Button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
              <p className="font-semibold text-blue-900 mb-2">How to test:</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-800">
                <li>Click "Test Single Request" - should work normally</li>
                <li>Click "Instructions: Force Token Expiry" for manual testing</li>
                <li>Open DevTools Console to see interceptor logs</li>
                <li>Watch for <code>[Directus Interceptor]</code> messages</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Logs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Activity Logs</CardTitle>
              <CardDescription>
                Real-time logs from API requests
              </CardDescription>
            </div>
            <Badge variant="secondary">{logs.length} logs</Badge>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
              {logs.length === 0 ? (
                <p className="text-content-tertiary">No logs yet. Run a test to see activity.</p>
              ) : (
                <div className="space-y-1">
                  {logs.map((log, index) => (
                    <div 
                      key={index}
                      className={`
                        ${log.includes('✅') ? 'text-green-400' : ''}
                        ${log.includes('❌') ? 'text-red-400' : ''}
                        ${log.includes('🚀') ? 'text-blue-400' : ''}
                        ${log.includes('⚠️') ? 'text-yellow-400' : ''}
                        ${log.includes('📝') || log.includes('💡') ? 'text-purple-400' : ''}
                        ${!log.includes('✅') && !log.includes('❌') && !log.includes('🚀') && !log.includes('⚠️') && !log.includes('📝') && !log.includes('💡') ? 'text-gray-300' : ''}
                      `}
                    >
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Documentation */}
        <Card>
          <CardHeader>
            <CardTitle>Expected Behavior</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">✅ Normal Request Flow:</h4>
                <ol className="list-decimal list-inside space-y-1 text-content-secondary">
                  <li>Request is made with current access token</li>
                  <li>API returns 200 OK</li>
                  <li>Data is returned to caller</li>
                </ol>
              </div>

              <div>
                <h4 className="font-semibold mb-2">🔄 Auto-Refresh Flow (when token expired):</h4>
                <ol className="list-decimal list-inside space-y-1 text-content-secondary">
                  <li>Request is made with expired access token</li>
                  <li>API returns 401 Unauthorized</li>
                  <li>Interceptor detects 401</li>
                  <li>Interceptor calls refresh token endpoint</li>
                  <li>New tokens are stored in Auth Store</li>
                  <li>Original request is retried with new token</li>
                  <li>API returns 200 OK</li>
                  <li>Data is returned to caller (transparent!)</li>
                </ol>
              </div>

              <div>
                <h4 className="font-semibold mb-2">🚫 Failed Refresh Flow:</h4>
                <ol className="list-decimal list-inside space-y-1 text-content-secondary">
                  <li>Request returns 401</li>
                  <li>Refresh token is also expired/invalid</li>
                  <li>Interceptor clears auth data</li>
                  <li>User is redirected to login page</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


