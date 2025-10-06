import { readItems } from '@directus/sdk'
import directus from '../client'
import { withRevalidate, safeApiCall } from '../utils'
import type { Page } from '../types'
import { getSite } from './sites'

// Mock data for fallback when Directus is not available
const getMockPage = (siteSlug: string, lang: string, slug: string): Page => ({
  id: '1',
  status: 'published',
  site_id: '1',
  title: 'Mock Page',
  translations: [
    {
      id: '1',
      languages_code: lang,
      title: 'Mock Page',
      permalink: `/${slug}`,
      blocks: []
    }
  ]
})

// --- Field fragments for blocks ---
const blockFormFields = [
  '*',
  {
    form: [
      '*',
      {
        fields: [
          '*',
          { translations: ['languages_code', 'label', 'placeholder', 'help', 'options'] },
        ],
      },
      { translations: ['languages_code', 'title', 'submit_label', 'success_message'] },
    ],
  },
  { translations: ['title', 'headline', 'languages_code'] },
];

const galleryItemFields = [
  '*',
  { directus_files_id: ['*'] },
  {
    translations: [
      '*',
      { title: ['*'], headline: ['*'] }
    ]
  }
];

const blockTeamFields = [
  '*',
  { team: [
      '*',
      { image: ['*'] },
      { translations: ['bio', 'job_title', 'languages_code'] }
    ]
  },
  {
    translations: [
      'title',
      'headline',
      'content',
      'languages_code'
    ]
  }
];

const blockItemFields = [
  '*',
  { form: [
    '*', 
    { fields: [
      '*',
      { translations: ['*'] }] },
    { translations: ['*'] }] },
  { team: [
      '*',
      { image: ['*'] },
      { translations: ['bio', 'job_title', 'languages_code'] }
    ]
  },
  { translations: ['*', { faqs: ['*'] }] },
  { button_group: ['*', { buttons: ['*', { translations: ['*'] }] }] },
  { rows: ['*', { translations: ['*'] }] },
  { steps: ['*', { translations: ['*'] }] },
  { testimonials: [
      '*',
      { testimonials_id: ['*', { translations: ['*'] }] },
      { translations: ['*'] }
    ]
  },
  { logos: ['*', { directus_files_id: ['*'] }, { translations: ['*', 'title', 'headline'] }] },
  { gallery_items: galleryItemFields },
  { block_form: blockFormFields },
  { block_team: blockTeamFields },
  { video: ['*', { translations: ['*'] }] },
];

const langMap = { 'vi': 'vi-VN', 'en': 'en-US' } as const;

export const fetchPage = async (siteSlug: string, lang: string, permalink: string = '/') => {
  const site = await getSite(siteSlug);
  if (!site) return null;

  const langCode = langMap[lang as keyof typeof langMap] || lang;

  return await safeApiCall(async () => {
    const pages = await directus.request(
      withRevalidate(
        readItems('pages' as any, {
          filter: {
            site_id: { _eq: site.id },
            translations: { permalink: { _eq: permalink } },
          },
          fields: [
            '*',
            { translations: ['*'] },
            { blocks: ['*', { item: blockItemFields }] },
            { seo: ['*'] },
            { site_id: ['*'] },
          ],
          deep: {
            // TypeScript is too strict for Directus _filter syntax, so we cast as any for these nested filters
            blocks: {
              item: {
                translations: { _filter: { languages_code: { _eq: langCode } } } as any,
                form: {
                  translations: { _filter: { languages_code: { _eq: langCode } } } as any,
                  fields: {
                    translations: { _filter: { languages_code: { _eq: langCode } } } as any,
                  },
                },
              },
            },
          },
          limit: 1,
        }),
        60
      )
    ) as any[];

    if (!pages[0]) return null;

    // Debug logs
    console.log('[fetchPage] Full Page Data:', JSON.stringify(pages[0], null, 2));
    const blocks = (pages[0].blocks ?? []) as any[];
    if (Array.isArray(blocks)) {
      console.log('[fetchPage] Blocks:', JSON.stringify(blocks, null, 2));
      blocks.forEach((block: any, index: number) => {
        if (block.item?.button_group) {
          console.log(`[fetchPage] Block ${index} button_group:`, JSON.stringify(block.item.button_group, null, 2));
          if (block.item.button_group.buttons) {
            console.log(`[fetchPage] Block ${index} buttons:`, JSON.stringify(block.item.button_group.buttons, null, 2));
          }
        }
      });
    } else {
      console.log('[fetchPage] No blocks found in pages.');
    }

    return pages[0];
  }, getMockPage(siteSlug, langCode, permalink) as any, `fetchPage(${siteSlug}, ${lang}, ${permalink})`);
} 