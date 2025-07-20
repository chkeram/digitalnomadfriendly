// Core types for the digital nomad cafe finder app

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  noise_tolerance: number; // 1-5 scale
  wifi_importance: number; // 1-5 scale
  preferred_seating: 'quiet' | 'social' | 'outdoor' | 'any';
  work_style: 'focused' | 'collaborative' | 'mixed';
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  place_id?: string; // Google Places ID
  hours?: OpeningHours;
  amenities: VenueAmenities;
  rating: number; // Aggregate work-friendliness rating
  review_count: number;
  photos: string[];
  created_at: string;
  updated_at: string;
}

export interface VenueAmenities {
  wifi_quality: number; // 1-5 rating
  power_outlets: boolean;
  noise_level: number; // 1-5 scale (1=very quiet, 5=very noisy)
  seating_comfort: number; // 1-5 rating
  has_food: boolean;
  has_coffee: boolean;
  outdoor_seating: boolean;
  meeting_rooms: boolean;
  printer_access: boolean;
  parking: boolean;
  pet_friendly: boolean;
}

export interface OpeningHours {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
}

export interface DayHours {
  open: string; // HH:MM format
  close: string; // HH:MM format
  closed?: boolean;
}

export interface Review {
  id: string;
  user_id: string;
  venue_id: string;
  overall_rating: number; // 1-5 stars
  wifi_rating: number;
  noise_rating: number;
  comfort_rating: number;
  food_rating?: number;
  text: string;
  photos: string[];
  visit_time: 'morning' | 'afternoon' | 'evening';
  helpful_votes: number;
  created_at: string;
  user?: Pick<User, 'name' | 'avatar_url'>;
}

export interface Favorite {
  id: string;
  user_id: string;
  venue_id: string;
  created_at: string;
}

export interface LocationCoords {
  lat: number;
  lng: number;
}

export interface SearchFilters {
  radius?: number; // in kilometers
  wifi_min?: number;
  noise_max?: number;
  has_power?: boolean;
  has_food?: boolean;
  open_now?: boolean;
  rating_min?: number;
}

export interface VenueSearchResult extends Venue {
  distance?: number; // in kilometers
}