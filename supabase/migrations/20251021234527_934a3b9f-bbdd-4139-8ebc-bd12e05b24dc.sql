-- Garantir que usuários não autenticados possam inserir respostas
DROP POLICY IF EXISTS "public_insert_responses" ON form_responses;
DROP POLICY IF EXISTS "public_insert_answers" ON form_answers;

-- Permitir que qualquer pessoa (autenticada ou não) crie respostas
CREATE POLICY "anyone_can_insert_responses"
ON form_responses
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Permitir que qualquer pessoa (autenticada ou não) crie answers
CREATE POLICY "anyone_can_insert_answers"
ON form_answers
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Garantir que usuários não autenticados possam ler perguntas de surveys ativos
DROP POLICY IF EXISTS "public_view_active_questions" ON form_questions;

CREATE POLICY "anyone_can_view_active_questions"
ON form_questions
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM form_surveys s
    WHERE s.id = form_questions.survey_id
    AND s.is_active = true
  )
);

-- Garantir que usuários não autenticados possam ler surveys ativos
DROP POLICY IF EXISTS "public_view_active_surveys" ON form_surveys;

CREATE POLICY "anyone_can_view_active_surveys"
ON form_surveys
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Garantir que usuários não autenticados possam ler empresas
DROP POLICY IF EXISTS "public_view_companies" ON form_companies;

CREATE POLICY "anyone_can_view_companies"
ON form_companies
FOR SELECT
TO anon, authenticated
USING (true);