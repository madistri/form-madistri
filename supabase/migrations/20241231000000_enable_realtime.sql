-- Enable Realtime for tables that need real-time updates
-- This allows the dashboard to receive real-time updates when data changes

-- Enable realtime for companies table (only if not already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'form_companies'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE form_companies;
  END IF;
END $$;

-- Enable realtime for surveys table (only if not already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'form_surveys'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE form_surveys;
  END IF;
END $$;

-- Enable realtime for responses table (only if not already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'form_responses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE form_responses;
  END IF;
END $$;

-- Enable realtime for questions table (only if not already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'form_questions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE form_questions;
  END IF;
END $$;

-- Create a function to notify when stats need to be updated
CREATE OR REPLACE FUNCTION notify_stats_update()
RETURNS TRIGGER AS $$
DECLARE
  company_id_value UUID;
BEGIN
  -- Get company_id based on the table
  IF TG_TABLE_NAME = 'form_responses' THEN
    -- For responses, get company_id through survey
    SELECT s.company_id INTO company_id_value
    FROM form_surveys s
    WHERE s.id = COALESCE(NEW.survey_id, OLD.survey_id);
  ELSE
    -- For other tables, use direct company_id
    company_id_value := COALESCE(NEW.company_id, OLD.company_id);
  END IF;
  
  -- Notify that stats need to be recalculated
  PERFORM pg_notify('stats_update', json_build_object(
    'table', TG_TABLE_NAME,
    'operation', TG_OP,
    'company_id', company_id_value
  )::text);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for real-time stats updates
CREATE TRIGGER trigger_notify_stats_companies
  AFTER INSERT OR UPDATE OR DELETE ON form_companies
  FOR EACH ROW EXECUTE FUNCTION notify_stats_update();

CREATE TRIGGER trigger_notify_stats_surveys
  AFTER INSERT OR UPDATE OR DELETE ON form_surveys
  FOR EACH ROW EXECUTE FUNCTION notify_stats_update();

CREATE TRIGGER trigger_notify_stats_responses
  AFTER INSERT OR UPDATE OR DELETE ON form_responses
  FOR EACH ROW EXECUTE FUNCTION notify_stats_update();