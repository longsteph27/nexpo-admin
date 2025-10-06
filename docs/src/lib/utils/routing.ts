// Helper function to determine routing context
export function getRoutingContext(hostnameOverride?: string, currentPathname?: string) {
  // If we have a currentPathname, use it to determine routing context
  if (currentPathname) {
    const pathSegments = currentPathname.split('/').filter(Boolean)
    
    // If the pathname starts with a language, it's domain-based routing
    if (pathSegments.length > 0 && ['en', 'vi'].includes(pathSegments[0])) {
      return { isDomainBased: true, siteSlug: null }
    }
    
    // If the pathname starts with a site slug (not a language), check if it's followed by a language
    if (pathSegments.length > 0 && !['en', 'vi'].includes(pathSegments[0])) {
      // If second segment is a language, this is slug-based routing
      if (pathSegments.length > 1 && ['en', 'vi'].includes(pathSegments[1])) {
        return { isDomainBased: false, siteSlug: pathSegments[0] }
      }
      // If no language in second segment, this might be domain-based routing with site slug added by middleware
      // We need to check the hostname to determine the actual routing mode
    }
  }
  
  // Fallback to hostname-based logic
  const hostname = hostnameOverride || (typeof window !== 'undefined' ? window.location.hostname : '')
  const isDevelopment = ['localhost', '127.0.0.1'].some(domain => hostname.includes(domain))
  
  if (isDevelopment) {
    // For development, we need to extract site slug from pathname
    // This should be handled by the application logic, not hardcoded
    return { isDomainBased: false, siteSlug: null }
  }
  
  // Check if this is a production domain with mapping
  const productionDomains: Record<string, string> = {
    'event.nexpo.vn': 'nexpo'
  }
  
  const siteSlug = productionDomains[hostname]
  if (siteSlug) {
    return { isDomainBased: true, siteSlug }
  }
  
  // For other domains, assume domain-based routing
  return { isDomainBased: true, siteSlug: null }
}

// Helper function to get current language from pathname
export function getCurrentLanguage(pathname: string): string {
  const pathSegments = pathname.split('/').filter(Boolean)
  
  // For domain-based routing, language is the first segment
  // For slug-based routing, language is the second segment after site slug
  if (pathSegments.length > 0) {
    // Check if first segment is a language
    if (['en', 'vi'].includes(pathSegments[0])) {
      return pathSegments[0]
    } else if (pathSegments.length > 1 && ['en', 'vi'].includes(pathSegments[1])) {
      // For slug-based routing, language is second segment
      return pathSegments[1]
    }
  }
  
  return 'en' // default fallback
}

// Helper function to get site slug from pathname
export function getSiteSlugFromPathname(pathname: string): string | null {
  const pathSegments = pathname.split('/').filter(Boolean)
  
  // For slug-based routing, site slug is the first segment
  if (pathSegments.length > 0) {
    const firstSegment = pathSegments[0]
    // Check if first segment is not a language (to avoid confusion)
    if (!['en', 'vi'].includes(firstSegment)) {
      return firstSegment
    }
  }
  
  return null
}

// Helper function to build URL based on routing context
export function buildUrl(lang: string, permalink: string, hostnameOverride?: string, currentPathname?: string): string {
  const { isDomainBased, siteSlug } = getRoutingContext(hostnameOverride, currentPathname)
  
  console.log('[buildUrl] Debug:', { lang, permalink, hostnameOverride, isDomainBased, siteSlug, currentPathname })
  
  // Additional check for domain-based routing when pathname contains site slug
  // This happens when middleware rewrites URLs for domain-based routing
  const hostname = hostnameOverride || (typeof window !== 'undefined' ? window.location.hostname : '')
  const productionDomains: Record<string, string> = {
    'event.nexpo.vn': 'nexpo'
  }
  
  const actualSiteSlug = productionDomains[hostname]
  const isActuallyDomainBased = actualSiteSlug && hostname !== 'localhost' && !hostname.includes('127.0.0.1')
  
  if (isDomainBased || isActuallyDomainBased) {
    // Domain-based routing: /{lang}/{permalink}
    // Domain is just an alias for the site slug
    const cleanPermalink = permalink.startsWith('/') ? permalink.slice(1) : permalink
    const url = `/${lang}${cleanPermalink ? `/${cleanPermalink}` : ''}`
    console.log('[buildUrl] Domain-based URL:', url)
    return url
  } else {
    // Slug-based routing: /{site}/{lang}/{permalink}
    // Get site slug from current pathname or use provided siteSlug
    const currentSiteSlug = siteSlug || (currentPathname ? getSiteSlugFromPathname(currentPathname) : null) || 'nexpo'
    const cleanPermalink = permalink.startsWith('/') ? permalink.slice(1) : permalink
    const url = `/${currentSiteSlug}/${lang}${cleanPermalink ? `/${cleanPermalink}` : ''}`
    console.log('[buildUrl] Slug-based URL:', url)
    return url
  }
}

// Helper function to get default redirect URL based on routing context
export function getDefaultRedirectUrl(hostnameOverride?: string, currentPathname?: string): string {
  const { isDomainBased, siteSlug } = getRoutingContext(hostnameOverride, currentPathname)
  
  if (isDomainBased) {
    // Domain-based routing: redirect to default language
    return '/en'
  } else {
    // Slug-based routing: redirect to site slug (without language)
    return `/${siteSlug}`
  }
} 