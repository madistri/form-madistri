-- Create a function to submit survey responses that bypasses RLS issues
CREATE OR REPLACE FUNCTION submit_survey_response(
  p_survey_id UUID,
  p_answers JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  response_id UUID;
  answer_record RECORD;
BEGIN
  -- Insert the response
  INSERT INTO form_responses (survey_id, respondent_identifier)
  VALUES (p_survey_id, NULL)
  RETURNING id INTO response_id;
  
  -- Insert all answers
  FOR answer_record IN 
    SELECT 
      (value->>'question_id')::UUID as question_id,
      value->>'answer_value' as answer_value
    FROM jsonb_array_elements(p_answers) as value
  LOOP
    INSERT INTO form_answers (response_id, question_id, answer_value)
    VALUES (response_id, answer_record.question_id, answer_record.answer_value);
  END LOOP;
  
  RETURN response_id;
END;
$$;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION submit_survey_response(UUID, JSONB) TO anon;
GRANT EXECUTE ON FUNCTION submit_survey_response(UUID, JSONB) TO authenticated;