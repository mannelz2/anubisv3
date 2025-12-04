/*
  # Add Comprehensive Tracking Columns to Transactions Table

  1. New Columns Added
    ## UTM Standard Fields
      - `utm_source` (text) - Traffic source (e.g., google, facebook, instagram)
      - `utm_medium` (text) - Marketing medium (e.g., cpc, email, social)
      - `utm_campaign` (text) - Campaign name
      - `utm_term` (text) - Paid search keywords
      - `utm_content` (text) - A/B testing and content-targeted ads
      - `src` (text) - Alternative source parameter
    
    ## Facebook-Specific Tracking Fields
      - `fb_campaign_id` (text) - Facebook Campaign ID (from cck parameter)
      - `fb_campaign_name` (text) - Facebook Campaign Name (from cname parameter)
      - `fb_adset_name` (text) - Facebook Adset Name (from adset parameter)
      - `fb_ad_name` (text) - Facebook Ad Name (from adname parameter)
      - `fb_placement` (text) - Ad placement (Feed, Stories, Reels, etc.)
    
    ## Additional Tracking Fields
      - `domain` (text) - Domain where user came from
      - `site_source` (text) - Site source identifier
      - `tracking_id` (text) - Custom tracking ID (from xgo parameter)
    
    ## Customer Information Fields
      - `customer_name` (text) - Customer full name
      - `customer_email` (text) - Customer email address
      - `customer_phone` (text) - Customer phone number
    
    ## Flexible Storage
      - `all_url_params` (jsonb) - Stores ALL URL parameters for future analysis
  
  2. Performance Optimization
    - Added indexes on frequently queried fields (utm_source, utm_campaign, fb_campaign_name)
    - Added index on customer_email for fast customer lookups
    - Added index on created_at for time-based queries
    - Added composite index on utm_source + created_at for campaign analysis
  
  3. Security
    - All new columns are nullable to maintain backward compatibility
    - No RLS changes needed (inherits existing policies)
*/

-- Add UTM standard fields
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'utm_source') THEN
    ALTER TABLE transactions ADD COLUMN utm_source text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'utm_medium') THEN
    ALTER TABLE transactions ADD COLUMN utm_medium text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'utm_campaign') THEN
    ALTER TABLE transactions ADD COLUMN utm_campaign text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'utm_term') THEN
    ALTER TABLE transactions ADD COLUMN utm_term text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'utm_content') THEN
    ALTER TABLE transactions ADD COLUMN utm_content text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'src') THEN
    ALTER TABLE transactions ADD COLUMN src text;
  END IF;
END $$;

-- Add Facebook-specific tracking fields
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'fb_campaign_id') THEN
    ALTER TABLE transactions ADD COLUMN fb_campaign_id text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'fb_campaign_name') THEN
    ALTER TABLE transactions ADD COLUMN fb_campaign_name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'fb_adset_name') THEN
    ALTER TABLE transactions ADD COLUMN fb_adset_name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'fb_ad_name') THEN
    ALTER TABLE transactions ADD COLUMN fb_ad_name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'fb_placement') THEN
    ALTER TABLE transactions ADD COLUMN fb_placement text;
  END IF;
END $$;

-- Add additional tracking fields
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'domain') THEN
    ALTER TABLE transactions ADD COLUMN domain text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'site_source') THEN
    ALTER TABLE transactions ADD COLUMN site_source text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'tracking_id') THEN
    ALTER TABLE transactions ADD COLUMN tracking_id text;
  END IF;
END $$;

-- Add customer information fields
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'customer_name') THEN
    ALTER TABLE transactions ADD COLUMN customer_name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'customer_email') THEN
    ALTER TABLE transactions ADD COLUMN customer_email text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'customer_phone') THEN
    ALTER TABLE transactions ADD COLUMN customer_phone text;
  END IF;
END $$;

-- Add flexible JSONB storage for all URL parameters
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'all_url_params') THEN
    ALTER TABLE transactions ADD COLUMN all_url_params jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_transactions_utm_source ON transactions(utm_source) WHERE utm_source IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_utm_campaign ON transactions(utm_campaign) WHERE utm_campaign IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_fb_campaign_name ON transactions(fb_campaign_name) WHERE fb_campaign_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_customer_email ON transactions(customer_email) WHERE customer_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_source_date ON transactions(utm_source, created_at DESC) WHERE utm_source IS NOT NULL;

-- Create a GIN index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_transactions_all_url_params ON transactions USING GIN(all_url_params);

-- Create helpful views for analytics
CREATE OR REPLACE VIEW campaign_performance AS
SELECT 
  utm_source,
  utm_campaign,
  fb_campaign_name,
  fb_adset_name,
  fb_ad_name,
  COUNT(*) as total_transactions,
  COUNT(*) FILTER (WHERE status = 'approved') as approved_transactions,
  SUM(amount) as total_revenue,
  SUM(amount) FILTER (WHERE status = 'approved') as approved_revenue,
  AVG(amount) as avg_transaction_value,
  AVG(amount) FILTER (WHERE status = 'approved') as avg_approved_value,
  DATE(created_at) as transaction_date
FROM transactions
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY utm_source, utm_campaign, fb_campaign_name, fb_adset_name, fb_ad_name, DATE(created_at)
ORDER BY transaction_date DESC, total_revenue DESC;

-- Create view for daily performance summary
CREATE OR REPLACE VIEW daily_performance_summary AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_transactions,
  COUNT(*) FILTER (WHERE status = 'approved') as approved_transactions,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_transactions,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected_transactions,
  SUM(amount) as total_revenue,
  SUM(amount) FILTER (WHERE status = 'approved') as approved_revenue,
  AVG(amount) as avg_transaction_value,
  COUNT(DISTINCT utm_campaign) as unique_campaigns,
  COUNT(DISTINCT fb_adset_name) as unique_adsets
FROM transactions
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;