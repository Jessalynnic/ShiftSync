-- Create business_locations table
CREATE TABLE IF NOT EXISTS business_locations (
  business_locations_id SERIAL PRIMARY KEY,
  business_id INTEGER NOT NULL REFERENCES business(business_id) ON DELETE CASCADE,
  business_hours JSONB DEFAULT '{}',
  street_address VARCHAR(255),
  zipcode VARCHAR(10),
  city VARCHAR(100),
  state VARCHAR(50),
  phone_number VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Add unique constraint to ensure one location per business
  UNIQUE(business_id)
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_business_locations_business_id ON business_locations(business_id);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_business_locations_updated_at 
    BEFORE UPDATE ON business_locations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE business_locations IS 'Stores business location information including address and operating hours';
COMMENT ON COLUMN business_locations.business_hours IS 'JSON object containing business hours for each day of the week'; 