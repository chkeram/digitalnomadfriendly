// Database Types - Generated from Schema
// These types match the database schema in database/migrations/001_initial_schema.sql

// Custom Enums
export type UserWorkStyle = 'focused' | 'collaborative' | 'mixed';
export type PreferredSeating = 'quiet' | 'social' | 'outdoor' | 'any';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type VenueStatus = 'active' | 'pending' | 'closed' | 'archived';
export type VisitTimeOfDay = 'morning' | 'afternoon' | 'evening';
export type VisitPurpose = 'work' | 'meeting' | 'social' | 'other';
export type ReportType = 'closed' | 'incorrect_info' | 'inappropriate' | 'duplicate' | 'spam' | 'other';
export type ReportStatus = 'pending' | 'investigating' | 'resolved' | 'dismissed';

// Business Hours Type
export interface BusinessHours {
  [key: string]: {
    open: string;  // HH:MM format
    close: string; // HH:MM format
  } | null; // null for closed days
}

// Database Tables

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  
  // User preferences
  noise_tolerance?: number; // 1-5 scale
  wifi_importance?: number; // 1-5 scale
  preferred_seating?: PreferredSeating;
  work_style?: UserWorkStyle;
  
  // User activity tracking
  total_reviews: number;
  total_venues_visited: number;
  is_verified: boolean;
  verification_date?: string;
  
  // Soft delete
  deleted_at?: string;
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  city?: string;
  country?: string;
  postal_code?: string;
  
  // Geospatial data (lat/lng)
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  
  // Google Places integration
  place_id?: string;
  google_rating?: number;
  google_review_count?: number;
  
  // Contact and web presence
  phone?: string;
  website?: string;
  email?: string;
  
  // Business hours
  hours?: BusinessHours;
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by_user_id?: string;
  
  // Status and moderation
  status: VenueStatus;
  verified_at?: string;
  verified_by_user_id?: string;
  
  // Aggregate ratings
  overall_rating: number;
  total_reviews: number;
  
  // Soft delete
  deleted_at?: string;
}

export interface VenueAmenities {
  id: string;
  venue_id: string;
  
  // Work-related amenities
  wifi_quality?: number; // 1-5 scale
  wifi_password_required?: boolean;
  noise_level?: number; // 1-5 scale (1=very quiet, 5=very noisy)
  
  // Physical amenities
  power_outlets?: boolean;
  power_outlet_count?: number;
  seating_comfort?: number; // 1-5 scale
  table_space_adequate?: boolean;
  
  // Food and beverage
  has_food?: boolean;
  has_coffee?: boolean;
  food_quality?: number; // 1-5 scale
  price_range?: number; // 1-4 scale ($=1, $$=2, $$$=3, $$$$=4)
  
  // Environment
  natural_lighting?: boolean;
  air_conditioning?: boolean;
  outdoor_seating?: boolean;
  pet_friendly?: boolean;
  smoking_allowed?: boolean;
  
  // Business facilities
  meeting_rooms?: boolean;
  phone_booth?: boolean;
  printer_access?: boolean;
  whiteboard_available?: boolean;
  
  // Accessibility and parking
  wheelchair_accessible?: boolean;
  parking_available?: boolean;
  parking_paid?: boolean;
  
  // Music and atmosphere
  background_music?: boolean;
  music_volume?: number; // 1-5 scale
  atmosphere_description?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface VenuePhoto {
  id: string;
  venue_id: string;
  uploaded_by_user_id?: string;
  
  // Photo data
  photo_url: string;
  thumbnail_url?: string;
  caption?: string;
  alt_text?: string;
  
  // Photo metadata
  is_primary: boolean;
  display_order: number;
  upload_date: string;
  
  // Moderation
  is_approved: boolean;
  approved_by_user_id?: string;
  approved_at?: string;
  
  // Soft delete
  deleted_at?: string;
}

export interface Review {
  id: string;
  user_id: string;
  venue_id: string;
  
  // Ratings
  overall_rating: number; // 1-5 scale
  wifi_rating?: number; // 1-5 scale
  noise_rating?: number; // 1-5 scale
  comfort_rating?: number; // 1-5 scale
  food_rating?: number; // 1-5 scale
  
  // Review content
  title?: string;
  text?: string;
  
  // Visit context
  visit_date?: string; // Date
  visit_time_of_day?: VisitTimeOfDay;
  visit_duration_hours?: number;
  crowd_level?: number; // 1-5 scale (1=empty, 5=packed)
  
  // Review metadata
  created_at: string;
  updated_at: string;
  
  // Community features
  helpful_votes: number;
  total_votes: number;
  
  // Moderation
  is_flagged: boolean;
  flagged_reason?: string;
  is_verified: boolean; // Location-verified review
  
  // Soft delete
  deleted_at?: string;
}

export interface ReviewPhoto {
  id: string;
  review_id: string;
  photo_url: string;
  thumbnail_url?: string;
  caption?: string;
  display_order: number;
  created_at: string;
  
  // Soft delete
  deleted_at?: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  venue_id: string;
  created_at: string;
  
  // Notes and organization
  personal_notes?: string;
  list_name?: string;
}

export interface ReviewVote {
  id: string;
  review_id: string;
  user_id: string;
  is_helpful: boolean; // true=helpful, false=not helpful
  created_at: string;
}

export interface VenueVisit {
  id: string;
  user_id?: string;
  venue_id: string;
  
  // Visit tracking
  visit_date: string;
  location_verified: boolean;
  check_in_location?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  
  // Visit context
  duration_minutes?: number;
  purpose?: VisitPurpose;
  
  // Anonymous visits
  session_id?: string;
  
  // Privacy settings
  is_public: boolean;
}

export interface VenueReport {
  id: string;
  venue_id: string;
  reported_by_user_id?: string;
  
  // Report details
  report_type: ReportType;
  description?: string;
  
  // Report status
  status: ReportStatus;
  resolved_by_user_id?: string;
  resolution_notes?: string;
  
  // Timestamps
  created_at: string;
  resolved_at?: string;
}

// Joined/Extended Types for API responses

export interface VenueWithAmenities extends Venue {
  amenities?: VenueAmenities;
  photos?: VenuePhoto[];
  primary_photo?: VenuePhoto;
}

export interface ReviewWithUser extends Review {
  user: Pick<User, 'id' | 'name' | 'avatar_url' | 'is_verified'>;
  photos?: ReviewPhoto[];
}

export interface VenueWithDetails extends VenueWithAmenities {
  reviews?: ReviewWithUser[];
  distance_km?: number;
  compatibility_score?: number;
  is_favorited?: boolean;
  user_review?: Review;
}

// Search and Filter Types

export interface VenueSearchFilters {
  // Location
  latitude?: number;
  longitude?: number;
  radius_km?: number;
  
  // Amenities
  min_wifi_quality?: number;
  max_noise_level?: number;
  power_outlets?: boolean;
  outdoor_seating?: boolean;
  pet_friendly?: boolean;
  meeting_rooms?: boolean;
  parking_available?: boolean;
  wheelchair_accessible?: boolean;
  
  // Ratings and reviews
  min_overall_rating?: number;
  min_review_count?: number;
  
  // Price and food
  max_price_range?: number;
  has_food?: boolean;
  
  // Business hours
  open_now?: boolean;
  open_at?: string; // HH:MM format
  
  // Sorting
  sort_by?: 'distance' | 'rating' | 'reviews' | 'compatibility';
  sort_order?: 'asc' | 'desc';
}

export interface SearchResult<T> {
  data: T[];
  total_count: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

// Geospatial Types

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

// API Response Types

export interface VenueSearchResponse extends SearchResult<VenueWithDetails> {
  center?: Coordinates;
  bounds?: BoundingBox;
}

export interface RecommendationResponse {
  venues: VenueWithDetails[];
  user_preferences: Pick<User, 'noise_tolerance' | 'wifi_importance' | 'preferred_seating' | 'work_style'>;
  explanation?: string;
}

// Form Types

export interface CreateVenueRequest {
  name: string;
  address: string;
  city?: string;
  country?: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
  hours?: BusinessHours;
  amenities?: Partial<Omit<VenueAmenities, 'id' | 'venue_id' | 'created_at' | 'updated_at'>>;
}

export interface CreateReviewRequest {
  venue_id: string;
  overall_rating: number;
  wifi_rating?: number;
  noise_rating?: number;
  comfort_rating?: number;
  food_rating?: number;
  title?: string;
  text?: string;
  visit_date?: string;
  visit_time_of_day?: VisitTimeOfDay;
  visit_duration_hours?: number;
  crowd_level?: number;
  photos?: File[];
}

export interface UpdateUserPreferencesRequest {
  noise_tolerance?: number;
  wifi_importance?: number;
  preferred_seating?: PreferredSeating;
  work_style?: UserWorkStyle;
}

// Analytics Types

export interface VenueAnalytics {
  venue_id: string;
  total_visits: number;
  unique_visitors: number;
  average_duration_minutes: number;
  peak_hours: { hour: number; visit_count: number }[];
  popular_purposes: { purpose: VisitPurpose; count: number }[];
  weekly_pattern: { day: DayOfWeek; visit_count: number }[];
}

export interface UserActivitySummary {
  user_id: string;
  total_reviews: number;
  total_visits: number;
  favorite_venues: number;
  average_rating_given: number;
  most_visited_venue?: Pick<Venue, 'id' | 'name'>;
  preferred_work_hours?: string[];
}