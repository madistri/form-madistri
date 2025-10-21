-- Fix search_path for security functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO form_users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION add_default_nps_question()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO form_questions (survey_id, question_text, question_type, is_required, order_number)
  VALUES (
    NEW.id,
    'De 0 a 10, o quanto você recomendaria nossa empresa para um amigo?',
    'nps',
    true,
    1
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;