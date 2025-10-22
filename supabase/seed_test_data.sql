-- Script para inserir dados de teste
-- ATENÇÃO: Execute este script apenas em ambiente de desenvolvimento

-- Inserir empresa de teste
INSERT INTO form_companies (id, slug, name, primary_color, secondary_color, thank_you_message, created_by)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'empresa-teste',
  'Empresa Teste',
  '#A855F7',
  '#00FFFF',
  'Obrigado por sua resposta!',
  NULL
) ON CONFLICT (slug) DO NOTHING;

-- Inserir pesquisa de teste
INSERT INTO form_surveys (id, company_id, title, description, is_active)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440000',
  'Pesquisa de Satisfação - Teste',
  'Pesquisa para testar o dashboard de analytics',
  true
) ON CONFLICT (id) DO NOTHING;

-- Inserir perguntas de teste (a pergunta NPS já é criada automaticamente pelo trigger)
INSERT INTO form_questions (id, survey_id, question_text, question_type, options, is_required, order_number)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Qual é o seu produto favorito?', 'multiple_choice', '["Produto A", "Produto B", "Produto C", "Produto D"]', true, 2),
  ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Você recomendaria nossos serviços?', 'yes_no', null, true, 3),
  ('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'Como você avalia nosso atendimento?', 'stars', null, true, 4),
  ('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', 'Deixe um comentário sobre sua experiência:', 'text', null, false, 5)
ON CONFLICT (id) DO NOTHING;

-- Inserir respostas de teste
INSERT INTO form_responses (id, survey_id, respondent_identifier)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440001', 'respondent_1'),
  ('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', 'respondent_2'),
  ('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440001', 'respondent_3'),
  ('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440001', 'respondent_4'),
  ('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440001', 'respondent_5'),
  ('550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440001', 'respondent_6'),
  ('550e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440001', 'respondent_7'),
  ('550e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440001', 'respondent_8'),
  ('550e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440001', 'respondent_9'),
  ('550e8400-e29b-41d4-a716-446655440019', '550e8400-e29b-41d4-a716-446655440001', 'respondent_10')
ON CONFLICT (id) DO NOTHING;

-- Primeiro, vamos buscar o ID da pergunta NPS que foi criada automaticamente
-- Como não podemos fazer isso diretamente no SQL, vamos inserir as respostas NPS com IDs fixos

-- Inserir answers de teste para NPS (assumindo que a pergunta NPS tem um ID específico)
-- Vamos criar respostas variadas: promotores (9-10), neutros (7-8), detratores (0-6)
DO $$
DECLARE
    nps_question_id UUID;
BEGIN
    -- Buscar o ID da pergunta NPS
    SELECT id INTO nps_question_id 
    FROM form_questions 
    WHERE survey_id = '550e8400-e29b-41d4-a716-446655440001' 
    AND question_type = 'nps' 
    LIMIT 1;
    
    IF nps_question_id IS NOT NULL THEN
        -- Inserir respostas NPS variadas
        INSERT INTO form_answers (response_id, question_id, answer_value) VALUES
        ('550e8400-e29b-41d4-a716-446655440010', nps_question_id, '9'),  -- Promoter
        ('550e8400-e29b-41d4-a716-446655440011', nps_question_id, '10'), -- Promoter
        ('550e8400-e29b-41d4-a716-446655440012', nps_question_id, '8'),  -- Neutral
        ('550e8400-e29b-41d4-a716-446655440013', nps_question_id, '7'),  -- Neutral
        ('550e8400-e29b-41d4-a716-446655440014', nps_question_id, '6'),  -- Detractor
        ('550e8400-e29b-41d4-a716-446655440015', nps_question_id, '5'),  -- Detractor
        ('550e8400-e29b-41d4-a716-446655440016', nps_question_id, '9'),  -- Promoter
        ('550e8400-e29b-41d4-a716-446655440017', nps_question_id, '4'),  -- Detractor
        ('550e8400-e29b-41d4-a716-446655440018', nps_question_id, '10'), -- Promoter
        ('550e8400-e29b-41d4-a716-446655440019', nps_question_id, '8')   -- Neutral
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Inserir respostas para pergunta de múltipla escolha
INSERT INTO form_answers (response_id, question_id, answer_value) VALUES
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440002', 'Produto A'),
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440002', 'Produto B'),
('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440002', 'Produto A'),
('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440002', 'Produto C'),
('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440002', 'Produto A'),
('550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440002', 'Produto B'),
('550e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440002', 'Produto D'),
('550e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440002', 'Produto A'),
('550e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440002', 'Produto C'),
('550e8400-e29b-41d4-a716-446655440019', '550e8400-e29b-41d4-a716-446655440002', 'Produto B')
ON CONFLICT DO NOTHING;

-- Inserir respostas para pergunta sim/não
INSERT INTO form_answers (response_id, question_id, answer_value) VALUES
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440003', 'sim'),
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440003', 'sim'),
('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440003', 'não'),
('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440003', 'sim'),
('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440003', 'não'),
('550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440003', 'não'),
('550e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440003', 'sim'),
('550e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440003', 'não'),
('550e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440003', 'sim'),
('550e8400-e29b-41d4-a716-446655440019', '550e8400-e29b-41d4-a716-446655440003', 'sim')
ON CONFLICT DO NOTHING;

-- Inserir respostas para pergunta de estrelas
INSERT INTO form_answers (response_id, question_id, answer_value) VALUES
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440004', '5'),
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440004', '4'),
('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440004', '3'),
('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440004', '5'),
('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440004', '2'),
('550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440004', '4'),
('550e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440004', '5'),
('550e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440004', '3'),
('550e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440004', '4'),
('550e8400-e29b-41d4-a716-446655440019', '550e8400-e29b-41d4-a716-446655440004', '5')
ON CONFLICT DO NOTHING;

-- Inserir respostas de texto
INSERT INTO form_answers (response_id, question_id, answer_value) VALUES
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440005', 'Excelente atendimento, muito satisfeito com o serviço prestado.'),
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440005', 'Bom produto, mas poderia melhorar a entrega.'),
('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440005', 'Atendimento regular, esperava mais qualidade.'),
('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440005', 'Muito bom, recomendo para todos os amigos.'),
('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440005', 'Produto com defeito, atendimento demorado.'),
('550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440005', 'Não gostei da experiência, muito caro.'),
('550e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440005', 'Fantástico! Superou minhas expectativas.'),
('550e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440005', 'Ruim, não voltaria a comprar.'),
('550e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440005', 'Ótima qualidade, preço justo.'),
('550e8400-e29b-41d4-a716-446655440019', '550e8400-e29b-41d4-a716-446655440005', 'Muito satisfeito, empresa confiável.')
ON CONFLICT DO NOTHING;