import type { DirectusFile, LanguageCode } from '@/types/directus-collections'

export interface BlockTestimonials {
    id: string
    status: string
    sort: number | null
    user_created: string
    date_created: string
    user_updated: string | null
    date_updated: string | null
    title?: string
    headline?: string
    tenant_id: number
    event_id: number
    translations?: BlockTestimonialsTranslation[]
    testimonials?: BlockTestimonialSliderItem[]
}

export interface BlockTestimonialsTranslation {
    id: number
    block_testimonials_id: string
    languages_code: LanguageCode
    title: string
    headline: string
}

export interface BlockTestimonialSliderItem {
    id: string
    sort: number
    testimonials_id: Testimonial | string
    block_testimonial_slider_id: string
}

export interface Testimonial {
    id: string
    company: string
    company_logo: string | DirectusFile | null
    status: 'published' | 'draft' | 'archived'
    link: string | null
    sort: number | null
    image: string | DirectusFile | null
    translations?: TestimonialTranslation[]
}

export interface TestimonialTranslation {
    id: number
    testimonials_id: string
    languages_code: string
    title: string
    subtitle: string
    content: string
}
