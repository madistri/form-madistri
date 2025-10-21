-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can manage companies" ON form_companies;
DROP POLICY IF EXISTS "Anyone can view active companies" ON form_companies;

-- Create new policies for form_companies
-- Authenticated users can create companies
CREATE POLICY "Authenticated users can create companies"
ON form_companies
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Users can view all companies
CREATE POLICY "Anyone can view companies"
ON form_companies
FOR SELECT
TO public
USING (true);

-- Users can update their own companies
CREATE POLICY "Users can update their own companies"
ON form_companies
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- Users can delete their own companies
CREATE POLICY "Users can delete their own companies"
ON form_companies
FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

-- Update form_surveys policies to use created_by from company
DROP POLICY IF EXISTS "Company admins can manage their surveys" ON form_surveys;

CREATE POLICY "Company owners can manage their surveys"
ON form_surveys
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM form_companies c
    WHERE c.id = form_surveys.company_id
    AND c.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM form_companies c
    WHERE c.id = form_surveys.company_id
    AND c.created_by = auth.uid()
  )
);

-- Update form_questions policies
DROP POLICY IF EXISTS "Company admins can manage questions" ON form_questions;

CREATE POLICY "Survey owners can manage questions"
ON form_questions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM form_surveys s
    JOIN form_companies c ON s.company_id = c.id
    WHERE s.id = form_questions.survey_id
    AND c.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM form_surveys s
    JOIN form_companies c ON s.company_id = c.id
    WHERE s.id = form_questions.survey_id
    AND c.created_by = auth.uid()
  )
);

-- Update form_responses policies to ensure unauthenticated access
DROP POLICY IF EXISTS "Anyone can create responses" ON form_responses;
DROP POLICY IF EXISTS "Company admins can view responses" ON form_responses;

CREATE POLICY "Anyone can create responses"
ON form_responses
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Survey owners can view responses"
ON form_responses
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM form_surveys s
    JOIN form_companies c ON s.company_id = c.id
    WHERE s.id = form_responses.survey_id
    AND c.created_by = auth.uid()
  )
);

-- Update form_answers policies
DROP POLICY IF EXISTS "Anyone can create answers" ON form_answers;
DROP POLICY IF EXISTS "Company admins can view answers" ON form_answers;

CREATE POLICY "Anyone can create answers"
ON form_answers
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Survey owners can view answers"
ON form_answers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM form_responses r
    JOIN form_surveys s ON r.survey_id = s.id
    JOIN form_companies c ON s.company_id = c.id
    WHERE r.id = form_answers.response_id
    AND c.created_by = auth.uid()
  )
);