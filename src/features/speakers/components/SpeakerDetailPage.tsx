'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button-base';
import ContainerHeader from '@/components/layout/Container-header';
import Container from '@/components/layout/Container';
import { Input } from '@/components/ui/input';
import { ImageUploadField } from '@/components/ui/ImageUploadField';
import { toast } from 'sonner';
import { useCreateSpeaker, useUpdateSpeaker } from '../hooks/useSpeakers';
import type { Speaker, SpeakerPayload, SocialLink } from '../types';

const LANGUAGES = [
  { code: 'en-US', label: 'English' },
  { code: 'vi-VN', label: 'Tiếng Việt' },
];

const SOCIAL_PLATFORMS = [
  { value: 'linkedin', label: 'LinkedIn', icon: 'lucide:linkedin' },
  { value: 'twitter', label: 'Twitter/X', icon: 'lucide:twitter' },
  { value: 'facebook', label: 'Facebook', icon: 'lucide:facebook' },
  { value: 'instagram', label: 'Instagram', icon: 'lucide:instagram' },
  { value: 'website', label: 'Website', icon: 'lucide:globe' },
  { value: 'youtube', label: 'YouTube', icon: 'lucide:youtube' },
];

interface SpeakerDetailPageProps {
  eventId: number;
  speaker?: Speaker;
  isNew?: boolean;
}

interface TranslationForm {
  id?: number;
  languages_code: string;
  bio: string;
  name: string;
  title: string;
  company: string;
}

export default function SpeakerDetailPage({ eventId, speaker, isNew }: SpeakerDetailPageProps) {
  const router = useRouter();
  const createMutation = useCreateSpeaker();
  const updateMutation = useUpdateSpeaker();

  const [name, setName] = useState(speaker?.name ?? '');
  const [position, setPosition] = useState(speaker?.position ?? '');
  const [company, setCompany] = useState(speaker?.company ?? '');
  const [linkedinUrl, setLinkedinUrl] = useState(speaker?.linkedin_url ?? '');
  const [status, setStatus] = useState(speaker?.status ?? 'draft');
  const [photo, setPhoto] = useState<string | null>(speaker?.avatar ?? speaker?.photo ?? null);
  const [bio, setBio] = useState(speaker?.bio ?? '');
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(speaker?.social_links ?? []);
  const [translations, setTranslations] = useState<TranslationForm[]>(() => {
    if (speaker?.translations?.length) {
      return speaker.translations.map((t) => ({
        id: t.id,
        languages_code: typeof t.languages_code === 'string' ? t.languages_code : (t.languages_code as any)?.code ?? 'en-US',
        bio: t.bio ?? '',
        name: t.name ?? '',
        title: t.title ?? '',
        company: t.company ?? '',
      }));
    }
    return [{ languages_code: 'en-US', bio: '', name: '', title: '', company: '' }];
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const addTranslation = () => {
    const usedCodes = translations.map((t) => t.languages_code);
    const available = LANGUAGES.find((l) => !usedCodes.includes(l.code));
    if (!available) return;
    setTranslations((prev) => [...prev, { languages_code: available.code, bio: '', name: '', title: '', company: '' }]);
  };

  const removeTranslation = (index: number) => {
    if (translations.length <= 1) return;
    setTranslations((prev) => prev.filter((_, i) => i !== index));
  };

  const addSocialLink = () => {
    setSocialLinks((prev) => [...prev, { platform: 'website', url: '' }]);
  };

  const removeSocialLink = (index: number) => {
    setSocialLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Name is required'); return; }

    const existing = translations.filter((t) => t.id !== undefined);
    const newTrans = translations.filter((t) => t.id === undefined);

    const payload: SpeakerPayload = {
      status,
      name: name.trim(),
      position: position.trim() || null,
      company: company.trim() || null,
      linkedin_url: linkedinUrl.trim() || null,
      photo: photo || null,
      avatar: photo || null,
      bio: bio.trim() || null,
      social_links: socialLinks.filter((l) => l.url.trim()),
      event_id: eventId,
      translations: {
        create: newTrans.map((t) => ({
          languages_code: { code: t.languages_code },
          bio: t.bio,
          name: t.name,
          title: t.title,
          company: t.company,
        })),
        update: existing.map((t) => ({
          id: t.id!,
          bio: t.bio,
          name: t.name,
          title: t.title,
          company: t.company,
        })),
      },
    };

    if (isNew) {
      createMutation.mutate(
        { eventId, data: payload },
        {
          onSuccess: () => { toast.success('Speaker created'); router.push(`/events/${eventId}/speakers`); },
          onError: () => toast.error('Failed to create speaker'),
        }
      );
    } else if (speaker) {
      updateMutation.mutate(
        { id: speaker.id, data: payload },
        {
          onSuccess: () => toast.success('Speaker updated'),
          onError: () => toast.error('Failed to update speaker'),
        }
      );
    }
  };

  return (
    <div className="space-y-4">
      <ContainerHeader className="flex items-end justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/events/${eventId}/speakers`)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-content-tertiary transition-colors"
          >
            <Icon icon="lucide:arrow-left" className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-content-primary">
              {isNew ? 'New Speaker' : (speaker?.name ?? 'Edit Speaker')}
            </h1>
            <p className="text-content-tertiary mt-0.5 text-sm">
              {isNew ? 'Add a new speaker' : 'Update speaker details'}
            </p>
          </div>
        </div>
        <Button variant="gradient" size="sm" onClick={handleSave} disabled={isSaving}>
          <Icon icon={isSaving ? 'lucide:loader-2' : 'lucide:save'} className={`w-3.5 h-3.5 mr-1.5 ${isSaving ? 'animate-spin' : ''}`} />
          {isSaving ? 'Saving…' : 'Save'}
        </Button>
      </ContainerHeader>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Main */}
        <div className="lg:col-span-2 space-y-4">
          {/* Basic Info */}
          <Container>
            <h2 className="text-sm font-semibold text-content-primary mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-content-secondary mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Speaker name…" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-content-secondary mb-1">Position / Title</label>
                  <Input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="e.g. CEO" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-content-secondary mb-1">Company</label>
                  <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Nexpo Inc." />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-content-secondary mb-1">LinkedIn URL</label>
                <Input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/…"
                />
              </div>
            </div>
          </Container>

          {/* Bio */}
          <Container>
            <h2 className="text-sm font-semibold text-content-primary mb-4">Bio (Default)</h2>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Speaker biography…"
              rows={5}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-content-primary bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </Container>

          {/* Translations */}
          <Container>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-content-primary">Translations</h2>
              {translations.length < LANGUAGES.length && (
                <button
                  onClick={addTranslation}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                >
                  <Icon icon="lucide:plus" className="w-3 h-3" />
                  Add language
                </button>
              )}
            </div>
            <div className="divide-y divide-slate-100">
              {translations.map((t, i) => {
                const lang = LANGUAGES.find((l) => l.code === t.languages_code);
                return (
                  <div key={i} className="py-4 first:pt-0 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wide text-content-tertiary">
                        {lang?.label ?? t.languages_code}
                      </span>
                      {translations.length > 1 && (
                        <button onClick={() => removeTranslation(i)} className="text-content-tertiary hover:text-red-500 transition-colors">
                          <Icon icon="lucide:trash-2" className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-content-secondary mb-1">Name</label>
                        <Input
                          value={t.name}
                          onChange={(e) => setTranslations((prev) => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                          placeholder="Translated name…"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-content-secondary mb-1">Title</label>
                        <Input
                          value={t.title}
                          onChange={(e) => setTranslations((prev) => prev.map((x, j) => j === i ? { ...x, title: e.target.value } : x))}
                          placeholder="e.g. CEO"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-content-secondary mb-1">Company</label>
                      <Input
                        value={t.company}
                        onChange={(e) => setTranslations((prev) => prev.map((x, j) => j === i ? { ...x, company: e.target.value } : x))}
                        placeholder="Company name…"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-content-secondary mb-1">Bio</label>
                      <textarea
                        value={t.bio}
                        onChange={(e) => setTranslations((prev) => prev.map((x, j) => j === i ? { ...x, bio: e.target.value } : x))}
                        placeholder="Speaker bio…"
                        rows={3}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-content-primary bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Container>

          {/* Social Links */}
          <Container>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-content-primary">Social Links</h2>
              <button
                onClick={addSocialLink}
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
              >
                <Icon icon="lucide:plus" className="w-3 h-3" />
                Add link
              </button>
            </div>
            {socialLinks.length === 0 ? (
              <p className="text-xs text-content-tertiary">No social links added yet.</p>
            ) : (
              <div className="space-y-3">
                {socialLinks.map((link, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <select
                      value={link.platform}
                      onChange={(e) => setSocialLinks((prev) => prev.map((l, j) => j === i ? { ...l, platform: e.target.value } : l))}
                      className="rounded-lg border border-slate-200 px-2 py-2 text-sm text-content-primary bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 w-36 shrink-0"
                    >
                      {SOCIAL_PLATFORMS.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                    <Input
                      type="url"
                      value={link.url}
                      onChange={(e) => setSocialLinks((prev) => prev.map((l, j) => j === i ? { ...l, url: e.target.value } : l))}
                      placeholder="https://…"
                      className="flex-1"
                    />
                    <button onClick={() => removeSocialLink(i)} className="text-content-tertiary hover:text-red-500 transition-colors p-1 shrink-0">
                      <Icon icon="lucide:trash-2" className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Container>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Photo */}
          <Container>
            <h2 className="text-sm font-semibold text-content-primary mb-4">Photo</h2>
            <ImageUploadField value={photo} onChange={setPhoto}>
              {({ imageUrl, openPicker, removeImage, hasImage, isUploading }) => (
                <div className="flex flex-col items-center gap-3">
                  <div
                    onClick={openPicker}
                    className="relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-slate-300 bg-slate-50 hover:border-blue-400 transition-colors"
                  >
                    {hasImage && imageUrl ? (
                      <img src={imageUrl} alt="Speaker photo" className="h-full w-full object-cover" />
                    ) : (
                      <Icon icon="lucide:user" className="w-8 h-8 text-slate-400" />
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Icon icon="lucide:loader-2" className="w-5 h-5 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={openPicker} disabled={isUploading}>
                      {hasImage ? 'Change' : 'Upload'}
                    </Button>
                    {hasImage && (
                      <Button variant="outline" size="sm" onClick={removeImage}>
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </ImageUploadField>
          </Container>

          {/* Status */}
          <Container>
            <h2 className="text-sm font-semibold text-content-primary mb-3">Status</h2>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-content-primary bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </Container>
        </div>
      </div>
    </div>
  );
}
