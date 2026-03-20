import directus from '@/lib/directus';
import { readItems, updateItem, createItem } from '@directus/sdk';
import type { BusinessRequirement, BusinessMatchSuggestion, BusinessMatchSuggestionStatus } from '../types';

export const businessMatchingApi = {
  async getRequirements(eventId: number): Promise<BusinessRequirement[]> {
    const data = await directus.request(
      readItems('business_requirements' as any, {
        filter: { event_id: { _eq: eventId } } as any,
        fields: [
          'id', 'status', 'requirement_type', 'summary', 'partnership_goals',
          'industry_focus', 'target_markets', 'company_size_preference',
          'date_created', 'date_updated',
          'exhibitor_id.id', 'exhibitor_id.translations.languages_code',
          'exhibitor_id.translations.company_name',
        ] as any,
        sort: ['-date_created' as any],
        limit: 200,
      })
    );
    return data as BusinessRequirement[];
  },

  async getSuggestions(eventId: number, status?: string): Promise<BusinessMatchSuggestion[]> {
    const filter: Record<string, unknown> = { event_id: { _eq: eventId } };
    if (status) filter.status = { _eq: status };
    const data = await directus.request(
      readItems('business_match_suggestions' as any, {
        filter,
        fields: [
          'id', 'status', 'score', 'ai_reasoning', 'organizer_note',
          'date_created', 'date_reviewed',
          'exhibitor_id.id', 'exhibitor_id.translations.languages_code',
          'exhibitor_id.translations.company_name',
          'registration_id.id', 'registration_id.full_name', 'registration_id.email',
          'business_requirement_id.id', 'business_requirement_id.requirement_type',
          'business_requirement_id.summary',
        ] as any,
        sort: ['-score' as any, '-date_created' as any],
        limit: 300,
      })
    );
    return data as BusinessMatchSuggestion[];
  },

  async updateSuggestion(id: string, payload: { status?: BusinessMatchSuggestionStatus; organizer_note?: string }): Promise<BusinessMatchSuggestion> {
    const data = await directus.request(updateItem('business_match_suggestions' as any, id, payload));
    return data as BusinessMatchSuggestion;
  },

  async createMeetingFromSuggestion(
    suggestionId: string,
    eventId: number,
    exhibitorId: string,
    registrationId: string,
    businessRequirementId: string,
  ): Promise<{ id: string }> {
    const meeting = await directus.request(
      createItem('meetings' as any, {
        event_id: eventId,
        meeting_category: 'business',
        source: 'ai_matching',
        status: 'pending',
        exhibitor_id: exhibitorId,
        registration_id: registrationId,
        business_requirement_id: businessRequirementId,
        business_match_suggestion_id: suggestionId,
      } as any)
    );
    await directus.request(
      updateItem('business_match_suggestions' as any, suggestionId, { status: 'converted_to_meeting' })
    );
    return { id: (meeting as any).id };
  },
};
