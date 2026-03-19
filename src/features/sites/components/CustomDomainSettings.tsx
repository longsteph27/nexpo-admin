'use client';

import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button-base';
import Input from '@/components/ui/input';
import { toast } from 'sonner';
import { siteApi } from '@/features/sites';
import type { FeatureSite } from '@/features/sites';
import { useAuthStore } from '@/store/auth';

const CNAME_TARGET = process.env.NEXT_PUBLIC_CNAME_TARGET || 'cname.nexpo.vn';

interface CustomDomainSettingsProps {
  site: FeatureSite | null;
  onUpdate: () => void;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="p-1.5 rounded hover:bg-gray-100 transition-colors"
      title="Copy to clipboard"
    >
      <Icon
        icon={copied ? 'lucide:check' : 'lucide:copy'}
        className={`w-3.5 h-3.5 ${copied ? 'text-green-600' : 'text-content-tertiary'}`}
      />
    </button>
  );
}

export default function CustomDomainSettings({ site, onUpdate }: CustomDomainSettingsProps) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [domain, setDomain] = useState(site?.domain ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  if (!site) return null;

  const currentDomain = site.domain;
  const isVerified = site.domain_verified === true;
  const hasDomain = Boolean(currentDomain);
  // Determine if the input has changed from saved value
  const isDirty = domain.trim() !== (site.domain ?? '');

  const handleSaveDomain = async () => {
    const trimmed = domain.trim();
    if (!trimmed) {
      toast.error('Please enter a domain');
      return;
    }
    setIsSaving(true);
    try {
      const result = await siteApi.updateSite(site.id, {
        domain: trimmed,
        domain_verified: false,
      });
      if (result.success) {
        toast.success('Domain saved. Now configure your DNS and verify.');
        onUpdate();
      } else {
        toast.error(result.error || 'Failed to save domain');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveDomain = async () => {
    setIsRemoving(true);
    try {
      const result = await siteApi.updateSite(site.id, {
        domain: '',
        domain_verified: false,
      });
      if (result.success) {
        setDomain('');
        toast.success('Domain removed');
        onUpdate();
      } else {
        toast.error(result.error || 'Failed to remove domain');
      }
    } finally {
      setIsRemoving(false);
    }
  };

  const handleVerify = async () => {
    if (!currentDomain) return;
    setIsVerifying(true);
    try {
      const res = await fetch(
        `/api/domain/verify?domain=${encodeURIComponent(currentDomain)}&siteId=${site.id}`,
        {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        }
      );
      const data = (await res.json()) as { verified: boolean; found?: string; expected?: string; error?: string };

      if (data.verified) {
        toast.success('Domain verified successfully!');
        onUpdate();
      } else {
        const found = data.found ? ` (found: ${data.found})` : '';
        toast.error(
          `DNS not verified. Make sure your CNAME record points to ${CNAME_TARGET}${found}.`
        );
      }
    } catch {
      toast.error('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-base font-semibold text-content-primary">Custom Domain</h2>
        <p className="text-xs text-content-tertiary mt-0.5">
          Map your own domain to this site
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Domain input */}
        <div>
          <label className="block text-sm font-medium text-content-primary mb-2">
            Domain
          </label>
          <div className="flex gap-2">
            <Input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="jobfair.com"
              className="font-mono"
            />
            {isDirty ? (
              <Button size="sm" onClick={handleSaveDomain} disabled={isSaving}>
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Save'
                )}
              </Button>
            ) : hasDomain ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleRemoveDomain}
                disabled={isRemoving}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Remove
              </Button>
            ) : null}
          </div>
          <p className="text-xs text-content-tertiary mt-1.5">
            Enter your domain without <span className="font-mono">https://</span> (e.g. <span className="font-mono">jobfair.com</span>)
          </p>
        </div>

        {/* Status badge */}
        {hasDomain && !isDirty && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-content-secondary">Status:</span>
            {isVerified ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                <Icon icon="lucide:shield-check" className="w-3.5 h-3.5" />
                Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                <Icon icon="lucide:clock" className="w-3.5 h-3.5" />
                Pending verification
              </span>
            )}
          </div>
        )}

        {/* DNS records */}
        {hasDomain && !isDirty && !isVerified && (
          <div>
            <h3 className="text-sm font-semibold text-content-primary mb-3">
              DNS Configuration
            </h3>
            <p className="text-sm text-content-secondary mb-3">
              Add the following record to your DNS provider, then click <strong>Verify DNS</strong>.
            </p>

            <div className="rounded-lg border border-gray-200 overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[100px_1fr_1fr_36px] bg-gray-50 px-4 py-2 text-xs font-semibold text-content-tertiary uppercase tracking-wide">
                <span>Type</span>
                <span>Name / Host</span>
                <span>Value / Points to</span>
                <span />
              </div>

              {/* CNAME row */}
              <div className="grid grid-cols-[100px_1fr_1fr_36px] items-center px-4 py-3 border-t border-gray-200 bg-white">
                <span className="font-mono text-sm font-semibold text-blue-700 bg-blue-50 rounded px-1.5 py-0.5 w-fit">
                  CNAME
                </span>
                <div className="flex items-center gap-1 font-mono text-sm">
                  <span>{currentDomain}</span>
                  <CopyButton value={currentDomain!} />
                </div>
                <div className="flex items-center gap-1 font-mono text-sm">
                  <span>{CNAME_TARGET}</span>
                  <CopyButton value={CNAME_TARGET} />
                </div>
                <div />
              </div>
            </div>

            <p className="text-xs text-content-tertiary mt-2">
              DNS propagation can take up to 48 hours. You can check status by clicking Verify.
            </p>
          </div>
        )}

        {/* Verify button */}
        {hasDomain && !isDirty && !isVerified && (
          <div>
            <Button onClick={handleVerify} disabled={isVerifying} size="sm">
              {isVerifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Checking DNS...
                </>
              ) : (
                <>
                  <Icon icon="lucide:shield-check" className="w-4 h-4 mr-2" />
                  Verify DNS
                </>
              )}
            </Button>
          </div>
        )}

        {/* Already verified */}
        {hasDomain && !isDirty && isVerified && (
          <div className="rounded-lg bg-green-50 border border-green-200 p-4 flex items-start gap-3">
            <Icon icon="lucide:circle-check" className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800">Domain is active</p>
              <p className="text-xs text-green-700 mt-0.5">
                <span className="font-mono">{currentDomain}</span> is verified and routing traffic to this site.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
