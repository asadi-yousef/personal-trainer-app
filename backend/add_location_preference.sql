-- Add location_preference column to trainers table
-- Run this SQL script in your MySQL database

-- Check if column already exists
SELECT COUNT(*) as column_exists
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'trainers' 
AND COLUMN_NAME = 'location_preference';

-- Add the column if it doesn't exist
ALTER TABLE trainers 
ADD COLUMN location_preference VARCHAR(50) DEFAULT 'specific_gym' 
AFTER gym_phone;

-- Verify the column was added
DESCRIBE trainers;











