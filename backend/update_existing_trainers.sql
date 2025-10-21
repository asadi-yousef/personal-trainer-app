-- Update existing trainers with location preferences
-- Run this SQL script in your MySQL database after adding the location_preference column
-- Database: fitconnect_db

-- Show current state
SELECT 
    id, 
    gym_name, 
    location_preference,
    CASE 
        WHEN gym_name IS NOT NULL AND gym_name != '' THEN 'specific_gym'
        ELSE 'customer_choice'
    END as suggested_preference
FROM trainers;

-- Update trainers with gym names to prefer specific gym
UPDATE trainers 
SET location_preference = 'specific_gym' 
WHERE gym_name IS NOT NULL 
AND gym_name != '' 
AND location_preference = 'specific_gym';

-- Update trainers without gym names to prefer customer's choice
UPDATE trainers 
SET location_preference = 'customer_choice' 
WHERE (gym_name IS NULL OR gym_name = '') 
AND location_preference = 'specific_gym';

-- Show final state
SELECT 
    location_preference, 
    COUNT(*) as count 
FROM trainers 
GROUP BY location_preference;

-- Show updated trainers
SELECT 
    id, 
    gym_name, 
    location_preference,
    CASE 
        WHEN gym_name IS NOT NULL AND gym_name != '' THEN 'Has gym - prefers specific location'
        ELSE 'No gym - prefers customer choice'
    END as reasoning
FROM trainers;
