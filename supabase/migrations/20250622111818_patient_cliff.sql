/*
  # Initial Schema for Costing Management System

  1. New Tables
    - `rates`
      - `id` (bigint, primary key)
      - `name` (text)
      - `low` (integer) - minimum quantity
      - `high` (integer) - maximum quantity  
      - `rate` (numeric) - price per unit in USD
      - `created_at` (timestamp)
    
    - `products`
      - `id` (bigint, primary key)
      - `species` (text) - product species (e.g., BT)
      - `specification` (text) - product spec (e.g., HLSO, PND)
      - `glazing` (numeric) - glazing percentage
      - `size` (text) - size range (e.g., 13/15)
      - `low` (integer) - low range value
      - `high` (integer) - high range value
      - `reference_weight` (integer) - reference weight in grams
      - `status` (text) - active/inactive status
      - `created_at` (timestamp)
    
    - `constants`
      - `id` (bigint, primary key)
      - `usd_rate` (numeric) - USD to local currency exchange rate
      - `variable_overhead` (numeric) - variable overhead cost per unit
      - `fixed_overhead` (numeric) - fixed overhead cost per unit
      - `freight` (numeric) - freight rate as percentage
      - `insurance` (numeric) - insurance rate as percentage
      - `subsidy_rate` (numeric) - subsidy rate as percentage
      - `subsidy_cap` (numeric) - maximum subsidy amount
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for public access (since this is a demo app)
*/

-- Create rates table
CREATE TABLE IF NOT EXISTS rates (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name text NOT NULL,
  low integer NOT NULL,
  high integer NOT NULL,
  rate numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  species text NOT NULL,
  specification text NOT NULL,
  glazing numeric NOT NULL,
  size text NOT NULL,
  low integer NOT NULL,
  high integer NOT NULL,
  reference_weight integer NOT NULL,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- Create constants table
CREATE TABLE IF NOT EXISTS constants (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  usd_rate numeric NOT NULL,
  variable_overhead numeric NOT NULL,
  fixed_overhead numeric NOT NULL,
  freight numeric NOT NULL,
  insurance numeric NOT NULL,
  subsidy_rate numeric DEFAULT 0,
  subsidy_cap numeric DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE constants ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (demo purposes)
CREATE POLICY "Allow public read access on rates"
  ON rates FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public write access on rates"
  ON rates FOR ALL
  TO public
  USING (true);

CREATE POLICY "Allow public read access on products"
  ON products FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public write access on products"
  ON products FOR ALL
  TO public
  USING (true);

CREATE POLICY "Allow public read access on constants"
  ON constants FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public write access on constants"
  ON constants FOR ALL
  TO public
  USING (true);

-- Insert initial data
INSERT INTO rates (name, low, high, rate) VALUES
  ('A', 1, 4, 2200),
  ('B', 5, 9, 2050),
  ('C', 10, 13, 1750),
  ('D', 14, 19, 1600),
  ('E', 20, 25, 1380);

INSERT INTO products (species, specification, glazing, size, low, high, reference_weight, status) VALUES
  ('BT', 'HLSO', 100, '13/15', 18, 24, 640000, 'active'),
  ('BT', 'PND', 80, '13/15', 23, 28, 612864, 'active'),
  ('BT', 'PND', 80, '21/25', 37, 43, 588924, 'active'),
  ('BT', 'PND', 75, '26/30', 47, 56, 588924, 'active');

INSERT INTO constants (usd_rate, variable_overhead, fixed_overhead, freight, insurance, subsidy_rate, subsidy_cap) VALUES
  (122, 80, 70, 0.2, 0.15, 0.05, 100);