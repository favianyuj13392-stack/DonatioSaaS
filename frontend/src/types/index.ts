export interface InstitutionalMetric {
  value: string;
  label: string;
}

export interface CorporatePartner {
  name: string;
  logo_url: string;
  website_url?: string;
}

export interface TestimonialItem {
  quote: string;
  author_name: string;
  author_role?: string;
  image_url?: string;
  location?: string;
}

export interface FundsBreakdownItem {
  category: string;
  amount: number;
  percentage: number;
  description?: string;
}

export interface ProgramItem {
  title: string;
  description: string;
  icon?: string;
  stat?: string;
}

export interface PaymentProvider {
  id: string;
  name: string;
  processor: string;
  is_active: boolean;
}

export interface Tenant {
  id: number;
  name: string;
  legal_name?: string;
  subdomain: string;
  code: string;
  nit?: string | null;
  legal_id_details?: string | null;
  location_city?: string | null;
  logo_url: string | null;
  primary_color: string;
  primary_color_hover?: string;
  secondary_color?: string;
  contact_email: string;
  phone?: string | null;
  hero_headline?: string | null;
  hero_description?: string | null;
  hero_image_url?: string | null;
  hero_cta_text?: string | null;
  hero_cta_url?: string | null;
  about_text?: string | null;
  mission?: string | null;
  vision?: string | null;
  values?: string[];
  programs?: ProgramItem[];
  institutional_metrics?: InstitutionalMetric[];
  corporate_partners?: CorporatePartner[];
  testimonial?: TestimonialItem | null;
  status: 'active' | 'suspended' | 'pending';
}

export interface DonationTier {
  amount: number;
  label: string;
  is_default?: boolean;
}

export interface TangibleImpactItem {
  icon: string;
  title: string;
  description: string;
  stat_highlight: string;
}

export interface Campaign {
  id: number;
  title: string;
  slug: string;
  headline?: string | null;
  description: string | null;
  story_markdown?: string | null;
  story_image_url?: string | null;
  banner_url: string | null;
  monetary_goal: number;
  current_amount: number;
  progress_percentage: number;
  allowed_frequencies?: 'all' | 'monthly_only' | 'single_only';
  allowed_payment_methods?: 'all' | 'card_only' | 'qr_only';
  donation_tiers?: DonationTier[];
  tangible_impact_items?: TangibleImpactItem[];
  funds_breakdown?: FundsBreakdownItem[] | null;
  testimonial?: TestimonialItem | null;
  thank_you_message?: string | null;
  monthly_label?: string | null;
  single_label?: string | null;
  status?: 'active' | 'completed' | 'paused' | 'suspended';
}

export interface TenantInstitutionalResponse {
  tenant: Tenant;
  featured_campaign: Campaign | null;
  campaigns_count: number;
  payment_providers: PaymentProvider[];
}

export interface CampaignDetailResponse {
  tenant: Tenant;
  campaign: Campaign;
  other_campaigns?: Campaign[];
  payment_providers: PaymentProvider[];
}

export interface CampaignListResponse {
  tenant: {
    id: number;
    name: string;
    subdomain: string;
    logo_url: string | null;
    primary_color: string;
  };
  campaigns: Campaign[];
}

export interface CheckoutPayload {
  foundation_id?: number;
  campaign_id?: number | null;
  amount: number;
  currency?: string;
  frequency: 'single' | 'monthly';
  donor_name?: string;
  donor_email?: string;
  is_anonymous: boolean;
  merchant_reference_number: string;
  card_number?: string;
  expiration_month?: string;
  expiration_year?: string;
  cvv?: string;
  country?: string;
  state?: string;
  locality?: string;
  address1?: string;
  postal_code?: string;
  fingerprint_session_id?: string;
  authentication_transaction_id?: string;
  cavv?: string;
  eci_raw?: string;
  xid?: string;
  three_ds_server_transaction_id?: string;
  accepted_terms?: boolean;
}

export interface QrResponse {
  donation_id: number;
  qr: {
    merchant_reference_number: string;
    qr_image_url: string;
    qr_raw_code: string;
    expires_at: string;
  };
}

export interface ReactivationData {
  valid: boolean;
  has_saved_card: boolean;
  subscription_id: number;
  amount: string;
  currency: string;
  card_last_four: string;
  card_brand: string;
  donor_name: string;
  donor_email: string;
  campaign_title: string;
  foundation: {
    name: string;
    subdomain: string;
    logo_url: string | null;
    primary_color: string;
  };
}
