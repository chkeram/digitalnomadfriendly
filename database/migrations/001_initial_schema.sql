-- Digital Nomad Friendly - Initial Database Schema
-- This migration creates all core tables for the application

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create custom types
CREATE TYPE user_work_style AS ENUM ('focused', 'collaborative', 'mixed');
CREATE TYPE preferred_seating AS ENUM ('quiet', 'social', 'outdoor', 'any');
CREATE TYPE day_of_week AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');
CREATE TYPE venue_status AS ENUM ('active', 'pending', 'closed', 'archived');

-- =============================================================================
-- USERS TABLE
-- Stores user profiles and authentication data
-- =============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    -- User preferences for personalized recommendations
    noise_tolerance INTEGER CHECK (noise_tolerance >= 1 AND noise_tolerance <= 5),
    wifi_importance INTEGER CHECK (wifi_importance >= 1 AND wifi_importance <= 5),
    preferred_seating preferred_seating DEFAULT 'any',
    work_style user_work_style DEFAULT 'mixed',
    
    -- User activity tracking
    total_reviews INTEGER DEFAULT 0,
    total_venues_visited INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMP WITH TIME ZONE,
    
    -- Soft delete support
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- =============================================================================
-- VENUES TABLE
-- Stores cafe/venue information with geospatial data
-- =============================================================================
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(255),
    country VARCHAR(255),
    postal_code VARCHAR(20),
    
    -- Geospatial data (PostGIS)
    location GEOGRAPHY(POINT, 4326) NOT NULL, -- lat/lng as POINT
    
    -- Google Places integration
    place_id VARCHAR(255) UNIQUE, -- Google Places ID
    google_rating DECIMAL(2,1),
    google_review_count INTEGER,
    
    -- Contact and web presence
    phone VARCHAR(50),
    website TEXT,
    email VARCHAR(255),
    
    -- Business hours (stored as JSONB for flexibility)
    hours JSONB,
    
    -- Venue metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by_user_id UUID REFERENCES users(id),
    
    -- Venue status and moderation
    status venue_status DEFAULT 'pending',
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by_user_id UUID REFERENCES users(id),
    
    -- Aggregate ratings (updated by triggers)
    overall_rating DECIMAL(2,1) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    
    -- Soft delete support
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- =============================================================================
-- VENUE_AMENITIES TABLE
-- Detailed amenity information for venues
-- =============================================================================
CREATE TABLE venue_amenities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    
    -- Work-related amenities (1-5 scale or boolean)
    wifi_quality INTEGER CHECK (wifi_quality >= 1 AND wifi_quality <= 5),
    wifi_password_required BOOLEAN DEFAULT TRUE,
    noise_level INTEGER CHECK (noise_level >= 1 AND noise_level <= 5), -- 1=very quiet, 5=very noisy
    
    -- Physical amenities
    power_outlets BOOLEAN DEFAULT FALSE,
    power_outlet_count INTEGER,
    seating_comfort INTEGER CHECK (seating_comfort >= 1 AND seating_comfort <= 5),
    table_space_adequate BOOLEAN DEFAULT TRUE,
    
    -- Food and beverage
    has_food BOOLEAN DEFAULT FALSE,
    has_coffee BOOLEAN DEFAULT TRUE,
    food_quality INTEGER CHECK (food_quality >= 1 AND food_quality <= 5),
    price_range INTEGER CHECK (price_range >= 1 AND price_range <= 4), -- $=1, $$=2, $$$=3, $$$$=4
    
    -- Environment
    natural_lighting BOOLEAN DEFAULT FALSE,
    air_conditioning BOOLEAN DEFAULT FALSE,
    outdoor_seating BOOLEAN DEFAULT FALSE,
    pet_friendly BOOLEAN DEFAULT FALSE,
    smoking_allowed BOOLEAN DEFAULT FALSE,
    
    -- Business facilities
    meeting_rooms BOOLEAN DEFAULT FALSE,
    phone_booth BOOLEAN DEFAULT FALSE,
    printer_access BOOLEAN DEFAULT FALSE,
    whiteboard_available BOOLEAN DEFAULT FALSE,
    
    -- Accessibility and parking
    wheelchair_accessible BOOLEAN DEFAULT FALSE,
    parking_available BOOLEAN DEFAULT FALSE,
    parking_paid BOOLEAN DEFAULT FALSE,
    
    -- Music and atmosphere
    background_music BOOLEAN DEFAULT TRUE,
    music_volume INTEGER CHECK (music_volume >= 1 AND music_volume <= 5),
    atmosphere_description TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one amenities record per venue
    CONSTRAINT unique_venue_amenities UNIQUE (venue_id)
);

-- =============================================================================
-- VENUE_PHOTOS TABLE
-- Store venue photos and images
-- =============================================================================
CREATE TABLE venue_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    uploaded_by_user_id UUID REFERENCES users(id),
    
    -- Photo data
    photo_url TEXT NOT NULL,
    thumbnail_url TEXT,
    caption TEXT,
    alt_text TEXT,
    
    -- Photo metadata
    is_primary BOOLEAN DEFAULT FALSE, -- Main venue photo
    display_order INTEGER DEFAULT 0,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Moderation
    is_approved BOOLEAN DEFAULT FALSE,
    approved_by_user_id UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- =============================================================================
-- REVIEWS TABLE
-- User reviews and ratings for venues
-- =============================================================================
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    
    -- Overall rating and detailed ratings
    overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
    wifi_rating INTEGER CHECK (wifi_rating >= 1 AND wifi_rating <= 5),
    noise_rating INTEGER CHECK (noise_rating >= 1 AND noise_rating <= 5),
    comfort_rating INTEGER CHECK (comfort_rating >= 1 AND comfort_rating <= 5),
    food_rating INTEGER CHECK (food_rating >= 1 AND food_rating <= 5),
    
    -- Review content
    title VARCHAR(255),
    text TEXT,
    
    -- Visit context
    visit_date DATE,
    visit_time_of_day VARCHAR(20) CHECK (visit_time_of_day IN ('morning', 'afternoon', 'evening')),
    visit_duration_hours DECIMAL(3,1), -- How long they stayed
    crowd_level INTEGER CHECK (crowd_level >= 1 AND crowd_level <= 5), -- 1=empty, 5=packed
    
    -- Review metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Community features
    helpful_votes INTEGER DEFAULT 0,
    total_votes INTEGER DEFAULT 0,
    
    -- Moderation
    is_flagged BOOLEAN DEFAULT FALSE,
    flagged_reason TEXT,
    is_verified BOOLEAN DEFAULT FALSE, -- Location-verified review
    
    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Prevent duplicate reviews from same user for same venue
    CONSTRAINT unique_user_venue_review UNIQUE (user_id, venue_id)
);

-- =============================================================================
-- REVIEW_PHOTOS TABLE
-- Photos attached to reviews
-- =============================================================================
CREATE TABLE review_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    thumbnail_url TEXT,
    caption TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- =============================================================================
-- FAVORITES TABLE
-- User's favorite venues (bookmarks)
-- =============================================================================
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Notes and lists
    personal_notes TEXT,
    list_name VARCHAR(255), -- For organizing favorites into lists
    
    -- Prevent duplicate favorites
    CONSTRAINT unique_user_venue_favorite UNIQUE (user_id, venue_id)
);

-- =============================================================================
-- REVIEW_VOTES TABLE
-- Track helpful/not helpful votes on reviews
-- =============================================================================
CREATE TABLE review_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    is_helpful BOOLEAN NOT NULL, -- true=helpful, false=not helpful
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate votes from same user
    CONSTRAINT unique_user_review_vote UNIQUE (user_id, review_id)
);

-- =============================================================================
-- VENUE_VISITS TABLE
-- Track when users visit venues (for analytics and recommendations)
-- =============================================================================
CREATE TABLE venue_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    
    -- Visit tracking
    visit_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    location_verified BOOLEAN DEFAULT FALSE, -- GPS verification
    check_in_location GEOGRAPHY(POINT, 4326), -- Where they checked in from
    
    -- Visit context
    duration_minutes INTEGER,
    purpose VARCHAR(50) CHECK (purpose IN ('work', 'meeting', 'social', 'other')),
    
    -- Anonymous visits (for non-logged-in users using guest mode)
    session_id UUID, -- For tracking anonymous users
    
    -- Privacy settings
    is_public BOOLEAN DEFAULT FALSE -- Whether visit is visible to others
);

-- =============================================================================
-- VENUE_REPORTS TABLE
-- User reports for venue issues (closed, incorrect info, etc.)
-- =============================================================================
CREATE TABLE venue_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id),
    reported_by_user_id UUID REFERENCES users(id),
    
    -- Report details
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('closed', 'incorrect_info', 'inappropriate', 'duplicate', 'spam', 'other')),
    description TEXT,
    
    -- Report status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
    resolved_by_user_id UUID REFERENCES users(id),
    resolution_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- =============================================================================
-- Create indexes for performance
-- =============================================================================

-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;

-- Venues table indexes
CREATE INDEX idx_venues_location ON venues USING GIST(location); -- Geospatial index
CREATE INDEX idx_venues_city_country ON venues(city, country);
CREATE INDEX idx_venues_status ON venues(status);
CREATE INDEX idx_venues_overall_rating ON venues(overall_rating DESC);
CREATE INDEX idx_venues_created_at ON venues(created_at);
CREATE INDEX idx_venues_place_id ON venues(place_id);
CREATE INDEX idx_venues_deleted_at ON venues(deleted_at) WHERE deleted_at IS NULL;

-- Reviews table indexes
CREATE INDEX idx_reviews_venue_id ON reviews(venue_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_overall_rating ON reviews(overall_rating);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX idx_reviews_visit_date ON reviews(visit_date);
CREATE INDEX idx_reviews_deleted_at ON reviews(deleted_at) WHERE deleted_at IS NULL;

-- Favorites table indexes
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_venue_id ON favorites(venue_id);
CREATE INDEX idx_favorites_created_at ON favorites(created_at DESC);

-- Venue visits indexes (for analytics)
CREATE INDEX idx_venue_visits_venue_id ON venue_visits(venue_id);
CREATE INDEX idx_venue_visits_user_id ON venue_visits(user_id);
CREATE INDEX idx_venue_visits_visit_date ON venue_visits(visit_date DESC);
CREATE INDEX idx_venue_visits_location ON venue_visits USING GIST(check_in_location);

-- Review votes indexes
CREATE INDEX idx_review_votes_review_id ON review_votes(review_id);
CREATE INDEX idx_review_votes_user_id ON review_votes(user_id);

-- Venue amenities indexes
CREATE INDEX idx_venue_amenities_venue_id ON venue_amenities(venue_id);
CREATE INDEX idx_venue_amenities_wifi_quality ON venue_amenities(wifi_quality DESC);
CREATE INDEX idx_venue_amenities_noise_level ON venue_amenities(noise_level);

-- Venue photos indexes
CREATE INDEX idx_venue_photos_venue_id ON venue_photos(venue_id);
CREATE INDEX idx_venue_photos_is_primary ON venue_photos(is_primary) WHERE is_primary = true;
CREATE INDEX idx_venue_photos_approved ON venue_photos(is_approved) WHERE is_approved = true;

-- =============================================================================
-- Create updated_at triggers
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_venue_amenities_updated_at BEFORE UPDATE ON venue_amenities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Comments for documentation
-- =============================================================================
COMMENT ON TABLE users IS 'User profiles and authentication data';
COMMENT ON TABLE venues IS 'Cafe and venue information with geospatial data';
COMMENT ON TABLE venue_amenities IS 'Detailed amenity information for each venue';
COMMENT ON TABLE venue_photos IS 'Photos and images for venues';
COMMENT ON TABLE reviews IS 'User reviews and ratings for venues';
COMMENT ON TABLE review_photos IS 'Photos attached to reviews';
COMMENT ON TABLE favorites IS 'User favorite venues and bookmarks';
COMMENT ON TABLE review_votes IS 'Helpful/not helpful votes on reviews';
COMMENT ON TABLE venue_visits IS 'Visit tracking for analytics and recommendations';
COMMENT ON TABLE venue_reports IS 'User reports for venue issues';

COMMENT ON COLUMN venues.location IS 'PostGIS POINT geography for lat/lng coordinates';
COMMENT ON COLUMN venues.hours IS 'Business hours stored as JSONB: {"monday": {"open": "08:00", "close": "18:00"}, ...}';
COMMENT ON COLUMN venue_amenities.noise_level IS '1=very quiet, 5=very noisy';
COMMENT ON COLUMN venue_amenities.price_range IS '$=1, $$=2, $$$=3, $$$$=4';
COMMENT ON COLUMN reviews.crowd_level IS '1=empty, 5=packed';

-- =============================================================================
-- Row Level Security (RLS) Policies
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_reports ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can view public user data" ON users
    FOR SELECT USING (deleted_at IS NULL);

-- Venues table policies
CREATE POLICY "Anyone can view active venues" ON venues
    FOR SELECT USING (status = 'active' AND deleted_at IS NULL);

CREATE POLICY "Authenticated users can create venues" ON venues
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update venues they created" ON venues
    FOR UPDATE USING (auth.uid() = created_by_user_id);

-- Venue amenities policies
CREATE POLICY "Anyone can view venue amenities" ON venue_amenities
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM venues v 
        WHERE v.id = venue_id AND v.status = 'active' AND v.deleted_at IS NULL
    ));

CREATE POLICY "Authenticated users can create venue amenities" ON venue_amenities
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update amenities for venues they created" ON venue_amenities
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM venues v 
        WHERE v.id = venue_id AND auth.uid() = v.created_by_user_id
    ));

-- Venue photos policies
CREATE POLICY "Anyone can view approved venue photos" ON venue_photos
    FOR SELECT USING (is_approved = true AND deleted_at IS NULL);

CREATE POLICY "Authenticated users can upload venue photos" ON venue_photos
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can manage their own venue photos" ON venue_photos
    FOR ALL USING (auth.uid() = uploaded_by_user_id);

-- Reviews table policies
CREATE POLICY "Anyone can view non-flagged reviews" ON reviews
    FOR SELECT USING (is_flagged = false AND deleted_at IS NULL);

CREATE POLICY "Authenticated users can create reviews" ON reviews
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON reviews
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON reviews
    FOR DELETE USING (auth.uid() = user_id);

-- Review photos policies
CREATE POLICY "Anyone can view review photos" ON review_photos
    FOR SELECT USING (deleted_at IS NULL AND EXISTS (
        SELECT 1 FROM reviews r 
        WHERE r.id = review_id AND r.is_flagged = false AND r.deleted_at IS NULL
    ));

CREATE POLICY "Users can manage photos for their own reviews" ON review_photos
    FOR ALL USING (EXISTS (
        SELECT 1 FROM reviews r 
        WHERE r.id = review_id AND auth.uid() = r.user_id
    ));

-- Favorites table policies
CREATE POLICY "Users can view their own favorites" ON favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own favorites" ON favorites
    FOR ALL USING (auth.uid() = user_id);

-- Review votes policies
CREATE POLICY "Anyone can view review votes" ON review_votes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote on reviews" ON review_votes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" ON review_votes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" ON review_votes
    FOR DELETE USING (auth.uid() = user_id);

-- Venue visits policies
CREATE POLICY "Users can view their own visits" ON venue_visits
    FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can track their own visits" ON venue_visits
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own visits" ON venue_visits
    FOR UPDATE USING (auth.uid() = user_id);

-- Venue reports policies
CREATE POLICY "Users can view reports they created" ON venue_reports
    FOR SELECT USING (auth.uid() = reported_by_user_id);

CREATE POLICY "Authenticated users can create reports" ON venue_reports
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- =============================================================================
-- Aggregate Update Functions and Triggers
-- =============================================================================

-- Function to update venue aggregate ratings when reviews change
CREATE OR REPLACE FUNCTION update_venue_aggregates()
RETURNS TRIGGER AS $$
BEGIN
    -- Update venue aggregates when review is inserted, updated, or deleted
    IF TG_OP = 'DELETE' THEN
        UPDATE venues SET 
            overall_rating = (
                SELECT COALESCE(ROUND(AVG(overall_rating), 1), 0)
                FROM reviews 
                WHERE venue_id = OLD.venue_id AND deleted_at IS NULL
            ),
            total_reviews = (
                SELECT COUNT(*)
                FROM reviews 
                WHERE venue_id = OLD.venue_id AND deleted_at IS NULL
            )
        WHERE id = OLD.venue_id;
        RETURN OLD;
    ELSE
        UPDATE venues SET 
            overall_rating = (
                SELECT COALESCE(ROUND(AVG(overall_rating), 1), 0)
                FROM reviews 
                WHERE venue_id = NEW.venue_id AND deleted_at IS NULL
            ),
            total_reviews = (
                SELECT COUNT(*)
                FROM reviews 
                WHERE venue_id = NEW.venue_id AND deleted_at IS NULL
            )
        WHERE id = NEW.venue_id;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update user aggregate stats
CREATE OR REPLACE FUNCTION update_user_aggregates()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user stats when review is created or deleted
    IF TG_OP = 'DELETE' THEN
        UPDATE users SET 
            total_reviews = (
                SELECT COUNT(*)
                FROM reviews 
                WHERE user_id = OLD.user_id AND deleted_at IS NULL
            )
        WHERE id = OLD.user_id;
        RETURN OLD;
    ELSE
        UPDATE users SET 
            total_reviews = (
                SELECT COUNT(*)
                FROM reviews 
                WHERE user_id = NEW.user_id AND deleted_at IS NULL
            )
        WHERE id = NEW.user_id;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update review helpful votes
CREATE OR REPLACE FUNCTION update_review_votes()
RETURNS TRIGGER AS $$
BEGIN
    -- Update review vote counts when vote is inserted, updated, or deleted
    IF TG_OP = 'DELETE' THEN
        UPDATE reviews SET 
            helpful_votes = (
                SELECT COUNT(*)
                FROM review_votes 
                WHERE review_id = OLD.review_id AND is_helpful = true
            ),
            total_votes = (
                SELECT COUNT(*)
                FROM review_votes 
                WHERE review_id = OLD.review_id
            )
        WHERE id = OLD.review_id;
        RETURN OLD;
    ELSE
        UPDATE reviews SET 
            helpful_votes = (
                SELECT COUNT(*)
                FROM review_votes 
                WHERE review_id = NEW.review_id AND is_helpful = true
            ),
            total_votes = (
                SELECT COUNT(*)
                FROM review_votes 
                WHERE review_id = NEW.review_id
            )
        WHERE id = NEW.review_id;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for aggregate updates
CREATE TRIGGER trigger_update_venue_aggregates
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_venue_aggregates();

CREATE TRIGGER trigger_update_user_aggregates
    AFTER INSERT OR DELETE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_user_aggregates();

CREATE TRIGGER trigger_update_review_votes
    AFTER INSERT OR UPDATE OR DELETE ON review_votes
    FOR EACH ROW EXECUTE FUNCTION update_review_votes();

-- =============================================================================
-- Utility Functions for Geospatial Queries
-- =============================================================================

-- Function to find venues within radius
CREATE OR REPLACE FUNCTION find_venues_within_radius(
    center_lat DECIMAL,
    center_lng DECIMAL,
    radius_km DECIMAL DEFAULT 5.0
)
RETURNS TABLE (
    venue_id UUID,
    venue_name VARCHAR(255),
    venue_address TEXT,
    distance_km DECIMAL,
    overall_rating DECIMAL,
    total_reviews INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id,
        v.name,
        v.address,
        ROUND(ST_Distance(v.location, ST_MakePoint(center_lng, center_lat)::geography) / 1000, 2) as distance_km,
        v.overall_rating,
        v.total_reviews
    FROM venues v
    WHERE 
        v.status = 'active' 
        AND v.deleted_at IS NULL
        AND ST_DWithin(v.location, ST_MakePoint(center_lng, center_lat)::geography, radius_km * 1000)
    ORDER BY v.location <-> ST_MakePoint(center_lng, center_lat)::geography;
END;
$$ LANGUAGE plpgsql;

-- Function to get venue recommendations based on user preferences
CREATE OR REPLACE FUNCTION get_venue_recommendations(
    user_id_param UUID,
    center_lat DECIMAL,
    center_lng DECIMAL,
    radius_km DECIMAL DEFAULT 5.0
)
RETURNS TABLE (
    venue_id UUID,
    venue_name VARCHAR(255),
    venue_address TEXT,
    distance_km DECIMAL,
    overall_rating DECIMAL,
    compatibility_score DECIMAL
) AS $$
DECLARE
    user_noise_tolerance INTEGER;
    user_wifi_importance INTEGER;
    user_preferred_seating preferred_seating;
BEGIN
    -- Get user preferences
    SELECT noise_tolerance, wifi_importance, preferred_seating
    INTO user_noise_tolerance, user_wifi_importance, user_preferred_seating
    FROM users WHERE id = user_id_param;
    
    RETURN QUERY
    SELECT 
        v.id,
        v.name,
        v.address,
        ROUND(ST_Distance(v.location, ST_MakePoint(center_lng, center_lat)::geography) / 1000, 2) as distance_km,
        v.overall_rating,
        -- Simple compatibility score based on noise tolerance and wifi quality
        CASE 
            WHEN user_noise_tolerance IS NULL OR user_wifi_importance IS NULL THEN v.overall_rating
            ELSE ROUND(
                (v.overall_rating * 0.4) + 
                (COALESCE(va.wifi_quality, 3) * user_wifi_importance * 0.2) +
                (ABS(COALESCE(va.noise_level, 3) - user_noise_tolerance) * -0.1) + 2.5,
                1
            )
        END as compatibility_score
    FROM venues v
    LEFT JOIN venue_amenities va ON v.id = va.venue_id
    WHERE 
        v.status = 'active' 
        AND v.deleted_at IS NULL
        AND ST_DWithin(v.location, ST_MakePoint(center_lng, center_lat)::geography, radius_km * 1000)
    ORDER BY compatibility_score DESC, v.overall_rating DESC;
END;
$$ LANGUAGE plpgsql;