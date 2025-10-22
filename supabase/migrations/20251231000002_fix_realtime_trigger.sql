-- Fix the notify_stats_update function to handle form_responses table correctly
-- This fixes the error: record "new" has no field "company_id"

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