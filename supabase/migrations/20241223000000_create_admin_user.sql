-- Create admin user for testing
-- Password is stored as plain text for demo - in production use bcrypt or similar

-- Insert admin user (email: admin@customshowers.uk, password: admin123)
INSERT INTO admin_users (email, password_hash, full_name, role, is_active)
VALUES (
  'admin@customshowers.uk',
  'admin123', -- CHANGE THIS IN PRODUCTION!
  'Custom Showers Admin',
  'admin',
  true
)
ON CONFLICT (email) DO NOTHING;

-- Note: In production, you should:
-- 1. Use proper password hashing (bcrypt with salt)
-- 2. Store hashed passwords, not plain text
-- 3. Implement rate limiting on login attempts
-- 4. Add 2FA for extra security
