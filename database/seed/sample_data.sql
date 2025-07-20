-- Digital Nomad Friendly - Sample Data
-- This file contains sample data for development and testing

-- Sample users
INSERT INTO users (id, email, name, avatar_url, noise_tolerance, wifi_importance, preferred_seating, work_style, is_verified) VALUES
('123e4567-e89b-12d3-a456-426614174000', 'alice@example.com', 'Alice Johnson', 'https://example.com/avatar1.jpg', 3, 5, 'quiet', 'focused', true),
('123e4567-e89b-12d3-a456-426614174001', 'bob@example.com', 'Bob Smith', 'https://example.com/avatar2.jpg', 4, 4, 'social', 'collaborative', true),
('123e4567-e89b-12d3-a456-426614174002', 'carol@example.com', 'Carol Davis', null, 2, 5, 'outdoor', 'mixed', false);

-- Sample venues in San Francisco
INSERT INTO venues (id, name, address, city, country, location, place_id, google_rating, phone, website, hours, created_by_user_id, status, overall_rating, total_reviews) VALUES
('234e5678-f90c-23e4-b567-537725285111', 
 'Blue Bottle Coffee', 
 '66 Mint St, San Francisco, CA 94103', 
 'San Francisco', 
 'United States',
 ST_MakePoint(-122.417385, 37.782682)::geography,
 'ChIJExample1',
 4.3,
 '+1-415-495-3394',
 'https://bluebottlecoffee.com',
 '{"monday": {"open": "06:30", "close": "19:00"}, "tuesday": {"open": "06:30", "close": "19:00"}, "wednesday": {"open": "06:30", "close": "19:00"}, "thursday": {"open": "06:30", "close": "19:00"}, "friday": {"open": "06:30", "close": "19:00"}, "saturday": {"open": "07:00", "close": "19:00"}, "sunday": {"open": "07:00", "close": "19:00"}}',
 '123e4567-e89b-12d3-a456-426614174000',
 'active',
 4.2,
 15),

('234e5678-f90c-23e4-b567-537725285222',
 'Ritual Coffee Roasters',
 '1026 Valencia St, San Francisco, CA 94110',
 'San Francisco',
 'United States',
 ST_MakePoint(-122.420679, 37.756681)::geography,
 'ChIJExample2',
 4.1,
 '+1-415-641-1011',
 'https://ritualroasters.com',
 '{"monday": {"open": "06:00", "close": "18:00"}, "tuesday": {"open": "06:00", "close": "18:00"}, "wednesday": {"open": "06:00", "close": "18:00"}, "thursday": {"open": "06:00", "close": "18:00"}, "friday": {"open": "06:00", "close": "18:00"}, "saturday": {"open": "06:30", "close": "18:00"}, "sunday": {"open": "06:30", "close": "18:00"}}',
 '123e4567-e89b-12d3-a456-426614174001',
 'active',
 3.8,
 8),

('234e5678-f90c-23e4-b567-537725285333',
 'The Mill',
 '736 Divisadero St, San Francisco, CA 94117',
 'San Francisco', 
 'United States',
 ST_MakePoint(-122.437756, 37.775069)::geography,
 'ChIJExample3',
 4.0,
 '+1-415-345-1953',
 'https://themillsf.com',
 '{"monday": {"open": "07:00", "close": "17:00"}, "tuesday": {"open": "07:00", "close": "17:00"}, "wednesday": {"open": "07:00", "close": "17:00"}, "thursday": {"open": "07:00", "close": "17:00"}, "friday": {"open": "07:00", "close": "17:00"}, "saturday": {"open": "08:00", "close": "17:00"}, "sunday": {"open": "08:00", "close": "17:00"}}',
 '123e4567-e89b-12d3-a456-426614174002',
 'active',
 4.5,
 22);

-- Sample venue amenities
INSERT INTO venue_amenities (venue_id, wifi_quality, wifi_password_required, noise_level, power_outlets, power_outlet_count, seating_comfort, table_space_adequate, has_food, has_coffee, food_quality, price_range, natural_lighting, air_conditioning, outdoor_seating, pet_friendly, smoking_allowed, meeting_rooms, phone_booth, printer_access, whiteboard_available, wheelchair_accessible, parking_available, parking_paid, background_music, music_volume, atmosphere_description) VALUES
('234e5678-f90c-23e4-b567-537725285111', 5, true, 3, true, 8, 4, true, true, true, 4, 3, true, true, false, true, false, false, false, false, false, true, false, false, true, 2, 'Modern industrial space with high ceilings and plenty of natural light'),
('234e5678-f90c-23e4-b567-537725285222', 4, true, 4, true, 6, 3, true, true, true, 3, 2, true, false, true, true, false, false, false, false, false, true, true, true, true, 3, 'Cozy neighborhood spot with eclectic decor and community vibe'),
('234e5678-f90c-23e4-b567-537725285333', 4, false, 2, true, 12, 5, true, true, true, 5, 3, true, true, true, false, false, true, false, false, true, true, false, false, true, 1, 'Spacious cafe with excellent pastries and quiet work areas');

-- Sample reviews
INSERT INTO reviews (id, user_id, venue_id, overall_rating, wifi_rating, noise_rating, comfort_rating, food_rating, title, text, visit_date, visit_time_of_day, visit_duration_hours, crowd_level, helpful_votes, total_votes) VALUES
('345f6789-g01d-34f5-c678-648836396444',
 '123e4567-e89b-12d3-a456-426614174000',
 '234e5678-f90c-23e4-b567-537725285111',
 5, 5, 3, 4, 4,
 'Perfect for morning work sessions',
 'Great wifi and plenty of outlets. Can get a bit noisy during lunch rush but overall excellent for getting work done. The coffee is top-notch and the natural lighting is perfect.',
 '2024-01-15',
 'morning',
 3.5,
 3,
 12, 15),

('345f6789-g01d-34f5-c678-648836396555',
 '123e4567-e89b-12d3-a456-426614174001',
 '234e5678-f90c-23e4-b567-537725285222',
 4, 4, 4, 3, 3,
 'Good vibe but can be crowded',
 'Love the community atmosphere here. WiFi is reliable and there are enough outlets. Gets pretty busy in the afternoons but thats part of the charm. Good spot for collaborative work.',
 '2024-01-20',
 'afternoon',
 2.0,
 4,
 8, 10),

('345f6789-g01d-34f5-c678-648836396666',
 '123e4567-e89b-12d3-a456-426614174002',
 '234e5678-f90c-23e4-b567-537725285333',
 5, 4, 5, 5, 5,
 'Hidden gem for quiet work',
 'This place is amazing! Super quiet, comfortable seating, and the pastries are incredible. Free wifi and tons of space. Perfect for deep focus work. The back area has large tables great for spreading out.',
 '2024-01-25',
 'morning',
 4.0,
 2,
 18, 20),

('345f6789-g01d-34f5-c678-648836396777',
 '123e4567-e89b-12d3-a456-426614174000',
 '234e5678-f90c-23e4-b567-537725285333',
 4, 4, 5, 5, 4,
 'Great for weekend coding',
 'Spent the whole Saturday here working on a project. Very quiet, comfortable chairs, and good coffee. The meeting room in the back is a nice touch. Would definitely come back.',
 '2024-02-03',
 'morning',
 6.0,
 1,
 5, 6);

-- Sample favorites
INSERT INTO favorites (user_id, venue_id, personal_notes, list_name) VALUES
('123e4567-e89b-12d3-a456-426614174000', '234e5678-f90c-23e4-b567-537725285111', 'Best spot for client calls', 'Work Favorites'),
('123e4567-e89b-12d3-a456-426614174000', '234e5678-f90c-23e4-b567-537725285333', 'Quiet zone for deep work', 'Work Favorites'),
('123e4567-e89b-12d3-a456-426614174001', '234e5678-f90c-23e4-b567-537725285222', 'Good for team meetups', 'Collaboration Spots'),
('123e4567-e89b-12d3-a456-426614174002', '234e5678-f90c-23e4-b567-537725285333', 'Perfect pastries and quiet', 'Must Visit');

-- Sample review votes
INSERT INTO review_votes (review_id, user_id, is_helpful) VALUES
('345f6789-g01d-34f5-c678-648836396444', '123e4567-e89b-12d3-a456-426614174001', true),
('345f6789-g01d-34f5-c678-648836396444', '123e4567-e89b-12d3-a456-426614174002', true),
('345f6789-g01d-34f5-c678-648836396555', '123e4567-e89b-12d3-a456-426614174000', true),
('345f6789-g01d-34f5-c678-648836396555', '123e4567-e89b-12d3-a456-426614174002', false),
('345f6789-g01d-34f5-c678-648836396666', '123e4567-e89b-12d3-a456-426614174000', true),
('345f6789-g01d-34f5-c678-648836396666', '123e4567-e89b-12d3-a456-426614174001', true);

-- Sample venue visits
INSERT INTO venue_visits (user_id, venue_id, visit_date, location_verified, check_in_location, duration_minutes, purpose, is_public) VALUES
('123e4567-e89b-12d3-a456-426614174000', '234e5678-f90c-23e4-b567-537725285111', '2024-01-15 09:30:00', true, ST_MakePoint(-122.417385, 37.782682)::geography, 210, 'work', true),
('123e4567-e89b-12d3-a456-426614174001', '234e5678-f90c-23e4-b567-537725285222', '2024-01-20 14:15:00', true, ST_MakePoint(-122.420679, 37.756681)::geography, 120, 'work', true),
('123e4567-e89b-12d3-a456-426614174002', '234e5678-f90c-23e4-b567-537725285333', '2024-01-25 08:45:00', true, ST_MakePoint(-122.437756, 37.775069)::geography, 240, 'work', false),
('123e4567-e89b-12d3-a456-426614174000', '234e5678-f90c-23e4-b567-537725285333', '2024-02-03 10:00:00', true, ST_MakePoint(-122.437756, 37.775069)::geography, 360, 'work', true);

-- Sample venue photos
INSERT INTO venue_photos (venue_id, uploaded_by_user_id, photo_url, thumbnail_url, caption, alt_text, is_primary, display_order, is_approved, approved_by_user_id, approved_at) VALUES
('234e5678-f90c-23e4-b567-537725285111', '123e4567-e89b-12d3-a456-426614174000', 'https://example.com/photos/bluebottle_main.jpg', 'https://example.com/thumbs/bluebottle_main.jpg', 'Main seating area with industrial design', 'Spacious cafe interior with exposed brick and high ceilings', true, 1, true, '123e4567-e89b-12d3-a456-426614174000', NOW()),
('234e5678-f90c-23e4-b567-537725285111', '123e4567-e89b-12d3-a456-426614174001', 'https://example.com/photos/bluebottle_counter.jpg', 'https://example.com/thumbs/bluebottle_counter.jpg', 'Coffee counter and ordering area', 'Modern coffee counter with menu board', false, 2, true, '123e4567-e89b-12d3-a456-426614174000', NOW()),
('234e5678-f90c-23e4-b567-537725285222', '123e4567-e89b-12d3-a456-426614174001', 'https://example.com/photos/ritual_exterior.jpg', 'https://example.com/thumbs/ritual_exterior.jpg', 'Storefront on Valencia Street', 'Ritual Coffee exterior with outdoor seating', true, 1, true, '123e4567-e89b-12d3-a456-426614174001', NOW()),
('234e5678-f90c-23e4-b567-537725285333', '123e4567-e89b-12d3-a456-426614174002', 'https://example.com/photos/mill_workspace.jpg', 'https://example.com/thumbs/mill_workspace.jpg', 'Quiet work area in the back', 'Large communal table with laptops and natural lighting', true, 1, true, '123e4567-e89b-12d3-a456-426614174002', NOW());