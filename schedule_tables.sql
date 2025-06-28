-- Create schedule table
CREATE TABLE IF NOT EXISTS schedule (
  schedule_id SERIAL PRIMARY KEY,
  business_id INTEGER NOT NULL REFERENCES business(business_id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  title VARCHAR(255),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one schedule per business per week
  UNIQUE(business_id, week_start_date)
);

-- Create shift table
CREATE TABLE IF NOT EXISTS shift (
  shift_id SERIAL PRIMARY KEY,
  schedule_id INTEGER NOT NULL REFERENCES schedule(schedule_id) ON DELETE CASCADE,
  employee_id INTEGER NOT NULL REFERENCES employee(emp_id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  row_index INTEGER DEFAULT 0,
  title VARCHAR(255),
  description TEXT,
  shift_status VARCHAR(20) DEFAULT 'assigned' CHECK (shift_status IN ('assigned', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create employee availability table
CREATE TABLE IF NOT EXISTS employee_availability (
  availability_id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employee(emp_id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  start_time TIME,
  end_time TIME,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one availability record per employee per day
  UNIQUE(employee_id, day_of_week)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_schedule_business_id ON schedule(business_id);
CREATE INDEX IF NOT EXISTS idx_schedule_week_start ON schedule(week_start_date);
CREATE INDEX IF NOT EXISTS idx_shift_schedule_id ON shift(schedule_id);
CREATE INDEX IF NOT EXISTS idx_shift_employee_id ON shift(employee_id);
CREATE INDEX IF NOT EXISTS idx_shift_date ON shift(date);
CREATE INDEX IF NOT EXISTS idx_shift_status ON shift(shift_status);
CREATE INDEX IF NOT EXISTS idx_availability_employee_id ON employee_availability(employee_id);
CREATE INDEX IF NOT EXISTS idx_availability_day ON employee_availability(day_of_week);

-- Create trigger to automatically update updated_at timestamp for schedule table
CREATE TRIGGER update_schedule_updated_at 
    BEFORE UPDATE ON schedule 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to automatically update updated_at timestamp for shift table
CREATE TRIGGER update_shift_updated_at 
    BEFORE UPDATE ON shift 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to automatically update updated_at timestamp for employee_availability table
CREATE TRIGGER update_availability_updated_at 
    BEFORE UPDATE ON employee_availability 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments to tables
COMMENT ON TABLE schedule IS 'Stores weekly schedules for businesses';
COMMENT ON COLUMN schedule.title IS 'Optional title for the schedule (e.g., "Week of Jan 15th")';
COMMENT ON COLUMN schedule.description IS 'Optional description or notes for the schedule';
COMMENT ON TABLE shift IS 'Stores individual shifts assigned to employees';
COMMENT ON COLUMN shift.title IS 'Optional title for the shift (e.g., "Morning Shift", "Cashier")';
COMMENT ON COLUMN shift.description IS 'Optional description or notes for the shift';
COMMENT ON COLUMN shift.shift_status IS 'Status of the shift: assigned, completed, or cancelled';
COMMENT ON COLUMN shift.row_index IS 'Position of the shift in the schedule grid (0-based)';
COMMENT ON TABLE employee_availability IS 'Stores employee availability for each day of the week';
COMMENT ON COLUMN employee_availability.day_of_week IS 'Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)';

-- Insert some sample availability data for testing (optional)
-- This can be removed in production
INSERT INTO employee_availability (employee_id, day_of_week, start_time, end_time, is_available) 
SELECT 
  emp_id, 
  generate_series(0, 6) as day_of_week,
  '09:00:00'::time as start_time,
  '17:00:00'::time as end_time,
  true as is_available
FROM employee 
WHERE is_active = true
ON CONFLICT (employee_id, day_of_week) DO NOTHING; 