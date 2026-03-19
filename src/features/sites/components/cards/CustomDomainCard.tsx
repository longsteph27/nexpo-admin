'use client';

import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button-base';
import Input from '@/components/ui/input';
import { toast } from 'sonner';
import { siteApi } from '../../api';
import type { FeatureSite } from '../../types';
import { useAuthStore } from '@/store/auth';

const CNAME_TARGET = process.env.NEXT_PUBLIC_CNAME_TARGET || 'cname.nexpo.vn';

interface CustomDomainCardProps {
  site?: FeatureSite | null;
  onUpdate?: () => void;
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
      title="Copy"
    >
      <Icon
        icon={copied ? 'lucide:check' : 'lucide:copy'}
        className={`w-3.5 h-3.5 ${copied ? 'text-green-600' : 'text-gray-400'}`}
      />
    </button>
  );
}

export default function CustomDomainCard({ site, onUpdate }: CustomDomainCardProps) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [isEditing, setIsEditing] = useState(false);
  const [domain, setDomain] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!site) return null;

  const currentDomain = site.domain;
  const isVerified = site.domain_verified === true;
  // Apex domain = only 2 parts, e.g. jobfair.vn (not work.jobfair.vn)
  const isApex = (currentDomain?.split('.').length ?? 0) === 2;

  const handleStartEdit = () => {
    setDomain(site.domain ?? '');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setDomain('');
  };

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
        toast.success('Domain saved. Configure your DNS then verify.');
        setIsEditing(false);
        onUpdate?.();
      } else {
        toast.error(result.error || 'Failed to save domain');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveDomain = async () => {
    setIsSaving(true);
    try {
      const result = await siteApi.updateSite(site.id, {
        domain: '',
        domain_verified: false,
      });
      if (result.success) {
        toast.success('Domain removed');
        onUpdate?.();
      } else {
        toast.error(result.error || 'Failed to remove domain');
      }
    } finally {
      setIsSaving(false);
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
      const data = (await res.json()) as { verified: boolean; found?: string };
      if (data.verified) {
        toast.success('Domain verified!');
        onUpdate?.();
      } else {
        const found = data.found ? ` (hiện tại trỏ tới: ${data.found})` : '';
        toast.error(`Chưa verify được. Hãy đặt CNAME trỏ tới ${CNAME_TARGET}${found}`);
      }
    } catch {
      toast.error('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <section className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-content-primary">Custom Domain</h2>
          <p className="text-xs text-content-tertiary">Map your own domain to this site</p>
        </div>
        {!isEditing && (
          <Button size="sm" variant="outline" onClick={handleStartEdit}>
            <Icon icon="lucide:pencil" className="w-3.5 h-3.5 mr-1.5" />
            {currentDomain ? 'Change' : 'Add Domain'}
          </Button>
        )}
      </div>

      <div className="p-6 space-y-4">
        {/* Edit mode */}
        {isEditing ? (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-content-primary mb-1.5">Domain</label>
              <Input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="jobfair.com"
                className="font-mono"
                autoFocus
              />
              <p className="text-xs text-content-tertiary mt-1">
                Không bao gồm <span className="font-mono">https://</span>
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveDomain} disabled={isSaving}>
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : 'Save'}
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCancelEdit} disabled={isSaving}>
                Cancel
              </Button>
            </div>
          </div>
        ) : currentDomain ? (
          <div className="space-y-4">
            {/* Domain + status row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon icon="lucide:globe" className="w-4 h-4 text-gray-400" />
                <span className="font-mono text-sm font-medium text-content-primary">{currentDomain}</span>
              </div>
              <div className="flex items-center gap-2">
                {isVerified ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                    <Icon icon="lucide:shield-check" className="w-3.5 h-3.5" />
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                    <Icon icon="lucide:clock" className="w-3.5 h-3.5" />
                    Pending
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleRemoveDomain}
                  disabled={isSaving}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                  title="Remove domain"
                >
                  <Icon icon="lucide:x" className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* DNS instructions — chỉ hiện khi chưa verified */}
            {!isVerified && (
              <>
                <div className="rounded-lg border border-gray-200 overflow-hidden text-sm">
                  <div className="grid grid-cols-[80px_1fr_1fr_32px] bg-gray-50 px-4 py-2 text-xs font-semibold text-content-tertiary uppercase tracking-wide">
                    <span>Type</span>
                    <span>Name</span>
                    <span>Value</span>
                    <span />
                  </div>
                  {/* CNAME row — www for apex, full domain for subdomain */}
                  <div className="grid grid-cols-[80px_1fr_1fr_32px] items-center px-4 py-3 border-t border-gray-200">
                    <span className="font-mono font-semibold text-blue-700 bg-blue-50 rounded px-1.5 py-0.5 w-fit text-xs">CNAME</span>
                    <div className="flex items-center gap-1 font-mono text-xs">
                      <span className="truncate">{isApex ? 'www' : currentDomain}</span>
                      <CopyButton value={isApex ? 'www' : currentDomain!} />
                    </div>
                    <div className="flex items-center gap-1 font-mono text-xs">
                      <span className="truncate">{CNAME_TARGET}</span>
                      <CopyButton value={CNAME_TARGET} />
                    </div>
                    <div />
                  </div>
                  {/* ALIAS row — only for apex domains */}
                  {isApex && (
                    <div className="grid grid-cols-[80px_1fr_1fr_32px] items-center px-4 py-3 border-t border-gray-200 bg-orange-50/40">
                      <span className="font-mono font-semibold text-orange-700 bg-orange-50 rounded px-1.5 py-0.5 w-fit text-xs">ALIAS</span>
                      <div className="flex items-center gap-1 font-mono text-xs">
                        <span>@ (root)</span>
                      </div>
                      <div className="flex items-center gap-1 font-mono text-xs">
                        <span className="truncate">{CNAME_TARGET}</span>
                        <CopyButton value={CNAME_TARGET} />
                      </div>
                      <div />
                    </div>
                  )}
                </div>

                {isApex ? (
                  <p className="text-xs text-content-tertiary">
                    Apex domain: thêm CNAME cho <span className="font-mono">www</span> và ALIAS/ANAME cho <span className="font-mono">@</span>.
                    Cloudflare hỗ trợ CNAME tại root. DNS có thể mất tới 48h.
                  </p>
                ) : (
                  <p className="text-xs text-content-tertiary">
                    Thêm CNAME record trên vào DNS provider, sau đó nhấn Verify. DNS có thể mất tới 48h để propagate.
                  </p>
                )}

                <Button size="sm" onClick={handleVerify} disabled={isVerifying}>
                  {isVerifying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Đang kiểm tra...
                    </>
                  ) : (
                    <>
                      <Icon icon="lucide:shield-check" className="w-4 h-4 mr-2" />
                      Verify DNS
                    </>
                  )}
                </Button>
              </>
            )}

            {/* Verified state */}
            {isVerified && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-3 flex items-center gap-2">
                <Icon icon="lucide:circle-check" className="w-4 h-4 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-800">
                  Domain active — traffic đang được route tới site này.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Empty state */
          <div className="text-center py-6">
            <Icon icon="lucide:globe" className="mx-auto h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-content-secondary">Chưa có custom domain</p>
            <p className="text-xs text-content-tertiary mt-1">Nhấn "Add Domain" để cấu hình</p>
          </div>
        )}
      </div>
    </section>
  );
}
