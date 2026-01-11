-- BFS Website Database Schema
-- Version: 1.0.0
-- Description: Complete schema for shower design and e-commerce system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CUSTOMERS TABLE
-- ============================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  address JSONB,
  -- {
  --   line1: string,
  --   line2: string,
  --   city: string,
  --   county: string,
  --   postcode: string,
  --   country: string
  -- }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for customer lookups
CREATE INDEX idx_customers_email ON customers(email);

-- ============================================
-- DESIGNS TABLE
-- ============================================
CREATE TABLE designs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  -- Status: draft, quoted, ordered, archived

  -- Measurements (all in millimeters)
  measurements JSONB NOT NULL,
  -- {
  --   width: number,
  --   height: number,
  --   depth: number,
  --   wall_to_wall: boolean,
  --   left_angle: number,
  --   right_angle: number,
  --   floor_to_ceiling: number
  -- }

  -- Glass specifications
  glass_type TEXT NOT NULL,
  -- Values: clear, frosted, tinted
  glass_thickness INTEGER NOT NULL,
  -- Values: 8, 10, 12 (mm)

  -- Configuration
  configuration_type TEXT NOT NULL,
  -- Values: inline, corner, wetroom, walk-in
  door_type TEXT,
  -- Values: hinged, sliding, pivot, fixed
  door_opening TEXT,
  -- Values: inward, outward, left, right

  -- Hardware selections
  hardware_finish TEXT NOT NULL DEFAULT 'chrome',
  -- Values: chrome, brushed-nickel, matte-black, gold
  hinge_type TEXT,
  handle_type TEXT,

  -- Additional options
  options JSONB DEFAULT '{}',
  -- {
  --   include_installation: boolean,
  --   shower_tray: boolean,
  --   drainage_type: string,
  --   special_requirements: string,
  --   customer_notes: string
  -- }

  -- Visual data
  design_snapshot TEXT,
  -- Base64 image or storage URL

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_glass_type CHECK (glass_type IN ('clear', 'frosted', 'tinted')),
  CONSTRAINT valid_glass_thickness CHECK (glass_thickness IN (8, 10, 12)),
  CONSTRAINT valid_configuration CHECK (configuration_type IN ('inline', 'corner', 'wetroom', 'walk-in')),
  CONSTRAINT valid_door_type CHECK (door_type IN ('hinged', 'sliding', 'pivot', 'fixed') OR door_type IS NULL),
  CONSTRAINT valid_hardware_finish CHECK (hardware_finish IN ('chrome', 'brushed-nickel', 'matte-black', 'gold'))
);

-- Indexes for design queries
CREATE INDEX idx_designs_customer_id ON designs(customer_id);
CREATE INDEX idx_designs_status ON designs(status);
CREATE INDEX idx_designs_created_at ON designs(created_at DESC);

-- ============================================
-- QUOTES TABLE
-- ============================================
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  design_id UUID REFERENCES designs(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL NOT NULL,

  -- Pricing breakdown (all in GBP)
  glass_cost DECIMAL(10,2) NOT NULL,
  hardware_cost DECIMAL(10,2) NOT NULL,
  installation_cost DECIMAL(10,2) DEFAULT 0,
  additional_costs JSONB DEFAULT '[]',
  -- [{ item: string, cost: number }]

  subtotal DECIMAL(10,2) NOT NULL,
  vat DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,

  -- Quote metadata
  quote_number TEXT UNIQUE NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active',
  -- Status: active, expired, accepted, declined

  -- Quote details for reference
  quote_details JSONB DEFAULT '{}',
  -- Snapshot of design at time of quote

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_quote_status CHECK (status IN ('active', 'expired', 'accepted', 'declined'))
);

-- Indexes for quote queries
CREATE INDEX idx_quotes_quote_number ON quotes(quote_number);
CREATE INDEX idx_quotes_customer_id ON quotes(customer_id);
CREATE INDEX idx_quotes_design_id ON quotes(design_id);
CREATE INDEX idx_quotes_status ON quotes(status);

-- Function to generate quote number
CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  -- Format: Q-YYYYMMDD-XXXX
  SELECT COUNT(*) + 1 INTO counter
  FROM quotes
  WHERE created_at::DATE = CURRENT_DATE;

  new_number := 'Q-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate quote number
CREATE OR REPLACE FUNCTION set_quote_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.quote_number IS NULL THEN
    NEW.quote_number := generate_quote_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_quote_number
  BEFORE INSERT ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION set_quote_number();

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL NOT NULL,
  design_id UUID REFERENCES designs(id) ON DELETE SET NULL NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL NOT NULL,

  -- Order status
  status TEXT NOT NULL DEFAULT 'pending',
  -- Status: pending, payment_received, manufacturing, ready_for_delivery,
  --         in_transit, delivered, installed, completed, cancelled, refunded

  -- Payment details
  payment_status TEXT NOT NULL DEFAULT 'pending',
  -- Status: pending, paid, failed, refunded, partially_refunded
  payment_intent_id TEXT,
  -- Stripe payment intent ID
  payment_method TEXT,
  amount_paid DECIMAL(10,2),
  paid_at TIMESTAMPTZ,

  -- Fulfillment files
  dxf_file_url TEXT,
  hardware_spec_url TEXT,
  instruction_sheet_url TEXT,

  -- Delivery information
  delivery_address JSONB,
  estimated_delivery DATE,
  actual_delivery_date DATE,
  delivery_notes TEXT,

  -- Customer communication
  customer_notes TEXT,
  internal_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_order_status CHECK (status IN (
    'pending', 'payment_received', 'manufacturing', 'ready_for_delivery',
    'in_transit', 'delivered', 'installed', 'completed', 'cancelled', 'refunded'
  )),
  CONSTRAINT valid_payment_status CHECK (payment_status IN (
    'pending', 'paid', 'failed', 'refunded', 'partially_refunded'
  ))
);

-- Indexes for order queries
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  -- Format: BFS-YYYYMMDD-XXXX
  SELECT COUNT(*) + 1 INTO counter
  FROM orders
  WHERE created_at::DATE = CURRENT_DATE;

  new_number := 'BFS-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate order number
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();

-- ============================================
-- HARDWARE ITEMS TABLE
-- ============================================
CREATE TABLE hardware_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,

  -- Supplier information
  supplier TEXT NOT NULL,
  -- Values: CRL, Glass Parts UK

  -- Item details
  category TEXT NOT NULL,
  -- Values: hinge, handle, clamp, channel, seal, silicone, other
  part_number TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_cost DECIMAL(10,2),

  -- Item specifications
  specifications JSONB DEFAULT '{}',
  -- {
  --   finish: string,
  --   size: string,
  --   material: string,
  --   weight_capacity: string,
  --   glass_thickness: string
  -- }

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_supplier CHECK (supplier IN ('CRL', 'Glass Parts UK')),
  CONSTRAINT valid_category CHECK (category IN (
    'hinge', 'handle', 'clamp', 'channel', 'seal', 'silicone', 'other'
  )),
  CONSTRAINT positive_quantity CHECK (quantity > 0)
);

-- Index for hardware queries
CREATE INDEX idx_hardware_items_order_id ON hardware_items(order_id);
CREATE INDEX idx_hardware_items_supplier ON hardware_items(supplier);

-- ============================================
-- ORDER STATUS HISTORY TABLE
-- ============================================
CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL,
  notes TEXT,
  changed_by TEXT,
  -- User ID or 'system'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for history queries
CREATE INDEX idx_order_history_order_id ON order_status_history(order_id);
CREATE INDEX idx_order_history_created_at ON order_status_history(created_at DESC);

-- Trigger to log status changes
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO order_status_history (order_id, status, notes, changed_by)
    VALUES (NEW.id, NEW.status, NULL, 'system');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_order_status
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION log_order_status_change();

-- ============================================
-- ADMIN USERS TABLE
-- ============================================
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'admin',
  -- Roles: admin, manager, viewer
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_role CHECK (role IN ('admin', 'manager', 'viewer'))
);

-- Index for admin lookups
CREATE INDEX idx_admin_users_email ON admin_users(email);

-- ============================================
-- UPDATE TRIGGERS FOR TIMESTAMPS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_designs_updated_at BEFORE UPDATE ON designs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE hardware_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Customers: Can read/update their own data
CREATE POLICY customers_select_own ON customers
  FOR SELECT
  USING (auth.jwt() ->> 'email' = email);

CREATE POLICY customers_update_own ON customers
  FOR UPDATE
  USING (auth.jwt() ->> 'email' = email);

-- Designs: Customers can CRUD their own designs
CREATE POLICY designs_all_own ON designs
  FOR ALL
  USING (customer_id IN (
    SELECT id FROM customers WHERE email = auth.jwt() ->> 'email'
  ));

-- Quotes: Customers can read their own quotes
CREATE POLICY quotes_select_own ON quotes
  FOR SELECT
  USING (customer_id IN (
    SELECT id FROM customers WHERE email = auth.jwt() ->> 'email'
  ));

-- Orders: Customers can read their own orders
CREATE POLICY orders_select_own ON orders
  FOR SELECT
  USING (customer_id IN (
    SELECT id FROM customers WHERE email = auth.jwt() ->> 'email'
  ));

-- Hardware items: Customers can read items for their orders
CREATE POLICY hardware_items_select_own ON hardware_items
  FOR SELECT
  USING (order_id IN (
    SELECT o.id FROM orders o
    INNER JOIN customers c ON o.customer_id = c.id
    WHERE c.email = auth.jwt() ->> 'email'
  ));

-- Admin policies: Full access for authenticated admins
CREATE POLICY admin_all_customers ON customers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE email = auth.jwt() ->> 'email'
      AND is_active = TRUE
    )
  );

CREATE POLICY admin_all_designs ON designs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE email = auth.jwt() ->> 'email'
      AND is_active = TRUE
    )
  );

CREATE POLICY admin_all_quotes ON quotes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE email = auth.jwt() ->> 'email'
      AND is_active = TRUE
    )
  );

CREATE POLICY admin_all_orders ON orders
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE email = auth.jwt() ->> 'email'
      AND is_active = TRUE
    )
  );

CREATE POLICY admin_all_hardware ON hardware_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE email = auth.jwt() ->> 'email'
      AND is_active = TRUE
    )
  );

CREATE POLICY admin_all_history ON order_status_history
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE email = auth.jwt() ->> 'email'
      AND is_active = TRUE
    )
  );

-- Admin users can only be managed by other admins
CREATE POLICY admin_users_select ON admin_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.email = auth.jwt() ->> 'email'
      AND au.is_active = TRUE
    )
  );

-- ============================================
-- STORAGE BUCKETS SETUP
-- ============================================

-- Note: Storage buckets need to be created via Supabase dashboard or CLI
-- Bucket names:
-- - dxf-files (private)
-- - hardware-specs (private)
-- - instruction-sheets (private)
-- - design-snapshots (private)
-- - customer-uploads (private)

-- ============================================
-- INITIAL SEED DATA
-- ============================================

-- Insert a default admin user (update email as needed)
INSERT INTO admin_users (email, password_hash, full_name, role, is_active)
VALUES ('admin@bespokeframelessshowers.co.uk', 'changeme', 'System Admin', 'admin', TRUE)
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE customers IS 'Customer information and contact details';
COMMENT ON TABLE designs IS 'Shower design configurations created by customers';
COMMENT ON TABLE quotes IS 'Price quotes generated for designs';
COMMENT ON TABLE orders IS 'Customer orders with payment and fulfillment tracking';
COMMENT ON TABLE hardware_items IS 'Individual hardware components for each order';
COMMENT ON TABLE order_status_history IS 'Audit log of order status changes';
COMMENT ON TABLE admin_users IS 'Administrative users with backend access';

COMMENT ON COLUMN designs.measurements IS 'All measurements stored in millimeters (mm)';
COMMENT ON COLUMN quotes.vat IS 'UK VAT at 20%';
COMMENT ON COLUMN orders.payment_intent_id IS 'Stripe Payment Intent ID for tracking';
