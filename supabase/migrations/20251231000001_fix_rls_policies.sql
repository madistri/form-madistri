-- Fix RLS policies for form_responses and form_answers
-- This migration fixes the incomplete policy that was causing the 42501 error

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "public_insert_responses" ON form_responses;
DROP POLICY IF EXISTS "anyone_can_insert_responses" ON form_responses;
DROP POLICY IF EXISTS "owners_view_responses" ON form_responses;

DROP POLICY IF EXISTS "public_insert_answers" ON form_answers;
DROP POLICY IF EXISTS "anyone_can_insert_answers" ON form_answers;
DROP POLICY IF EXISTS "owners_view_answers" ON form_answers;

-- Create correct policies for form_responses
CREATE POLICY "allow_public_insert_responses"
ON form_responses
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "allow_owners_view_responses"
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

-- Create correct policies for form_answers
CREATE POLICY "allow_public_insert_answers"
ON form_answers
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "allow_owners_view_answers"
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