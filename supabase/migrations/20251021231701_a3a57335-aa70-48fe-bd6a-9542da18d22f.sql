-- Create enum for question types
CREATE TYPE question_type AS ENUM ('nps', 'multiple_choice', 'yes_no', 'text', 'emoji', 'stars');

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('admin', 'company_admin', 'user');

-- Create form_users table (linked to auth.users)
CREATE TABLE form_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create form_companies table
CREATE TABLE form_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#A855F7',
  secondary_color TEXT DEFAULT '#00FFFF',
  thank_you_message TEXT DEFAULT 'Obrigado por sua resposta!',
  created_by UUID REFERENCES form_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create form_surveys table
CREATE TABLE form_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES form_companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create form_questions table
CREATE TABLE form_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES form_surveys(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type question_type NOT NULL,
  options JSONB, -- For multiple choice options
  is_required BOOLEAN NOT NULL DEFAULT true,
  order_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create form_responses table
CREATE TABLE form_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES form_surveys(id) ON DELETE CASCADE,
  respondent_identifier TEXT, -- Optional: for tracking unique responses
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create form_answers table
CREATE TABLE form_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES form_responses(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES form_questions(id) ON DELETE CASCADE,
  answer_value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE form_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for form_users
CREATE POLICY "Users can view their own profile"
  ON form_users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON form_users FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for form_companies
CREATE POLICY "Anyone can view active companies"
  ON form_companies FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage companies"
  ON form_companies FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM form_users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for form_surveys
CREATE POLICY "Anyone can view active surveys"
  ON form_surveys FOR SELECT
  USING (is_active = true);

CREATE POLICY "Company admins can manage their surveys"
  ON form_surveys FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM form_companies c
      JOIN form_users u ON c.created_by = u.id
      WHERE c.id = company_id AND u.id = auth.uid()
    )
  );

-- RLS Policies for form_questions
CREATE POLICY "Anyone can view questions from active surveys"
  ON form_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM form_surveys
      WHERE id = survey_id AND is_active = true
    )
  );

CREATE POLICY "Company admins can manage questions"
  ON form_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM form_surveys s
      JOIN form_companies c ON s.company_id = c.id
      JOIN form_users u ON c.created_by = u.id
      WHERE s.id = survey_id AND u.id = auth.uid()
    )
  );

-- RLS Policies for form_responses (anyone can submit)
CREATE POLICY "Anyone can create responses"
  ON form_responses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Company admins can view responses"
  ON form_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM form_surveys s
      JOIN form_companies c ON s.company_id = c.id
      JOIN form_users u ON c.created_by = u.id
      WHERE s.id = survey_id AND u.id = auth.uid()
    )
  );

-- RLS Policies for form_answers (anyone can submit)
CREATE POLICY "Anyone can create answers"
  ON form_answers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Company admins can view answers"
  ON form_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM form_responses r
      JOIN form_surveys s ON r.survey_id = s.id
      JOIN form_companies c ON s.company_id = c.id
      JOIN form_users u ON c.created_by = u.id
      WHERE r.id = response_id AND u.id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_form_users_updated_at
  BEFORE UPDATE ON form_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_form_companies_updated_at
  BEFORE UPDATE ON form_companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_form_surveys_updated_at
  BEFORE UPDATE ON form_surveys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_form_questions_updated_at
  BEFORE UPDATE ON form_questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically create form_users entry on signup
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create form_users entry
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Insert default NPS question for each survey
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
$$ LANGUAGE plpgsql;

-- Trigger to add NPS question to new surveys
CREATE TRIGGER add_nps_question_on_survey_create
  AFTER INSERT ON form_surveys
  FOR EACH ROW EXECUTE FUNCTION add_default_nps_question();