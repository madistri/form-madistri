-- Drop ALL existing policies on form_companies
DROP POLICY IF EXISTS "Admins can manage companies" ON form_companies;
DROP POLICY IF EXISTS "Anyone can view active companies" ON form_companies;
DROP POLICY IF EXISTS "Authenticated users can create companies" ON form_companies;
DROP POLICY IF EXISTS "Anyone can view companies" ON form_companies;
DROP POLICY IF EXISTS "Users can update their own companies" ON form_companies;
DROP POLICY IF EXISTS "Users can delete their own companies" ON form_companies;

-- Drop ALL existing policies on form_surveys
DROP POLICY IF EXISTS "Anyone can view active surveys" ON form_surveys;
DROP POLICY IF EXISTS "Company admins can manage their surveys" ON form_surveys;
DROP POLICY IF EXISTS "Company owners can manage their surveys" ON form_surveys;

-- Drop ALL existing policies on form_questions
DROP POLICY IF EXISTS "Anyone can view questions from active surveys" ON form_questions;
DROP POLICY IF EXISTS "Company admins can manage questions" ON form_questions;
DROP POLICY IF EXISTS "Survey owners can manage questions" ON form_questions;

-- Drop ALL existing policies on form_responses
DROP POLICY IF EXISTS "Anyone can create responses" ON form_responses;
DROP POLICY IF EXISTS "Company admins can view responses" ON form_responses;
DROP POLICY IF EXISTS "Survey owners can view responses" ON form_responses;

-- Drop ALL existing policies on form_answers
DROP POLICY IF EXISTS "Anyone can create answers" ON form_answers;
DROP POLICY IF EXISTS "Company admins can view answers" ON form_answers;
DROP POLICY IF EXISTS "Survey owners can view answers" ON form_answers;

-- ============================================
-- CREATE NEW POLICIES FOR form_companies
-- ============================================

CREATE POLICY "users_insert_own_companies"
ON form_companies
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "public_view_companies"
ON form_companies
FOR SELECT
TO public
USING (true);

CREATE POLICY "users_update_own_companies"
ON form_companies
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "users_delete_own_companies"
ON form_companies
FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

-- ============================================
-- CREATE NEW POLICIES FOR form_surveys
-- ============================================

CREATE POLICY "public_view_active_surveys"
ON form_surveys
FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "owners_manage_surveys"
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

-- ============================================
-- CREATE NEW POLICIES FOR form_questions
-- ============================================

CREATE POLICY "public_view_active_questions"
ON form_questions
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM form_surveys s
    WHERE s.id = form_questions.survey_id
    AND s.is_active = true
  )
);

CREATE POLICY "owners_manage_questions"
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

-- ============================================
-- CREATE NEW POLICIES FOR form_responses
-- ============================================

CREATE POLICY "public_insert_responses"
ON form_responses
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "owners_view_responses"
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

-- ============================================
-- CREATE NEW POLICIES FOR form_answers
-- ============================================

CREATE POLICY "public_insert_answers"
ON form_answers
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "owners_view_answers"
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