import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, ThumbsUp, ThumbsDown, Minus, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Survey {
  id: string;
  title: string;
  form_companies: {
    name: string;
  };
}

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  options?: string[];
}

interface Response {
  id: string;
  survey_id: string;
  completed_at: string;
}

interface Answer {
  id: string;
  response_id: string;
  question_id: string;
  answer_value: string;
  created_at: string;
}

interface NPSData {
  score: number;
  count: number;
}

const SurveyAnalytics = () => {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [npsData, setNpsData] = useState<NPSData[]>([]);
  const [totalResponses, setTotalResponses] = useState(0);
  const [promoters, setPromoters] = useState(0);
  const [detractors, setDetractors] = useState(0);
  const [neutrals, setNeutrals] = useState(0);
  const [npsScore, setNpsScore] = useState(0);

  useEffect(() => {
    if (surveyId) {
      fetchSurveyData();
      setupRealtimeSubscriptions();
    }
  }, [surveyId]);

  const setupRealtimeSubscriptions = () => {
    if (!surveyId) return;

    // Subscribe to responses changes for this survey
    const responsesSubscription = supabase
      .channel(`survey-responses-${surveyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'form_responses',
          filter: `survey_id=eq.${surveyId}`
        },
        (payload) => {
          console.log('Response change detected:', payload);
          fetchSurveyData(); // Refresh all data when responses change
        }
      )
      .subscribe();

    // Subscribe to answers changes
    const answersSubscription = supabase
      .channel(`survey-answers-${surveyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'form_answers'
        },
        (payload) => {
          console.log('Answer change detected:', payload);
          fetchSurveyData(); // Refresh all data when answers change
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      responsesSubscription.unsubscribe();
      answersSubscription.unsubscribe();
    };
  };

  const fetchSurveyData = async () => {
    try {
      setLoading(true);

      // Buscar dados da pesquisa
      const { data: surveyData, error: surveyError } = await supabase
        .from('form_surveys')
        .select(`
          id,
          title,
          form_companies (
            name
          )
        `)
        .eq('id', surveyId)
        .single();

      if (surveyError) throw surveyError;
      setSurvey(surveyData);

      // Buscar perguntas
      const { data: questionsData, error: questionsError } = await supabase
        .from('form_questions')
        .select('*')
        .eq('survey_id', surveyId)
        .order('created_at');

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);

      // Buscar respostas
      const { data: responsesData, error: responsesError } = await supabase
        .from('form_responses')
        .select('*')
        .eq('survey_id', surveyId);

      if (responsesError) throw responsesError;
      setResponses(responsesData || []);

      // Buscar answers
      const responseIds = responsesData?.map(r => r.id) || [];
      let answersData: Answer[] = [];
      
      if (responseIds.length > 0) {
        const { data: answersResult, error: answersError } = await supabase
          .from('form_answers')
          .select('*')
          .in('response_id', responseIds);

        if (answersError) throw answersError;
        answersData = answersResult || [];
      }
      
      setAnswers(answersData);

      // Processar dados NPS
      processNPSData(answersData, questionsData || []);

    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast.error('Erro ao carregar dados da pesquisa');
    } finally {
      setLoading(false);
    }
  };

  const processNPSData = (answersData: Answer[], questionsData: Question[]) => {
    // Encontrar pergunta NPS
    const npsQuestion = questionsData.find(q => q.question_type === 'nps');
    if (!npsQuestion) return;

    // Filtrar respostas NPS
    const npsAnswers = answersData.filter(a => 
      a.question_id === npsQuestion.id && 
      a.answer_value !== null && 
      a.answer_value !== undefined
    );

    // Contar respostas por score
    const scoreCount: { [key: number]: number } = {};
    for (let i = 0; i <= 10; i++) {
      scoreCount[i] = 0;
    }

    let promotersCount = 0;
    let detractorsCount = 0;
    let neutralsCount = 0;

    npsAnswers.forEach(answer => {
      const score = parseInt(answer.answer_value);
      if (!isNaN(score) && score >= 0 && score <= 10) {
        scoreCount[score]++;

        if (score >= 9) {
          promotersCount++;
        } else if (score <= 6) {
          detractorsCount++;
        } else {
          neutralsCount++;
        }
      }
    });

    // Converter para array para o gráfico
    const chartData = Object.entries(scoreCount).map(([score, count]) => ({
      score: parseInt(score),
      count
    }));

    setNpsData(chartData);
    setTotalResponses(npsAnswers.length);
    setPromoters(promotersCount);
    setDetractors(detractorsCount);
    setNeutrals(neutralsCount);

    // Calcular NPS Score
    if (npsAnswers.length > 0) {
      const nps = Math.round(((promotersCount - detractorsCount) / npsAnswers.length) * 100);
      setNpsScore(nps);
    }
  };

  const getQuestionAnswers = (questionId: string) => {
    return answers.filter(a => a.question_id === questionId);
  };

  const getTextResponses = () => {
    const textQuestions = questions.filter(q => q.question_type === 'text');
    const textResponses: string[] = [];
    
    textQuestions.forEach(question => {
      const questionAnswers = getQuestionAnswers(question.id);
      questionAnswers.forEach(answer => {
        if (answer.answer_value) {
          textResponses.push(answer.answer_value);
        }
      });
    });
    
    return textResponses;
  };

  const generateWordCloud = () => {
    const textResponses = getTextResponses();
    const words: { [key: string]: number } = {};
    
    textResponses.forEach(text => {
      const cleanText = text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3);
      
      cleanText.forEach(word => {
        words[word] = (words[word] || 0) + 1;
      });
    });

    return Object.entries(words)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([word, count]) => ({ word, count }));
  };

  const renderQuestionChart = (question: Question) => {
    const questionAnswers = getQuestionAnswers(question.id);
    
    if (question.question_type === 'multiple_choice') {
      const optionCounts: { [key: string]: number } = {};
      question.options?.forEach(option => {
        optionCounts[option] = 0;
      });
      
      questionAnswers.forEach(answer => {
        if (answer.answer_value && optionCounts.hasOwnProperty(answer.answer_value)) {
          optionCounts[answer.answer_value]++;
        }
      });

      const chartData = Object.entries(optionCounts).map(([option, count]) => ({
        option,
        count
      }));

      return (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="option" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (question.question_type === 'yes_no') {
      const yesCount = questionAnswers.filter(a => a.answer_value === 'true' || a.answer_value === 'sim').length;
      const noCount = questionAnswers.filter(a => a.answer_value === 'false' || a.answer_value === 'não').length;
      
      const pieData = [
        { name: 'Sim', value: yesCount, color: '#22c55e' },
        { name: 'Não', value: noCount, color: '#ef4444' }
      ];

      return (
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              outerRadius={60}
              fill="#8884d8"
              dataKey="value"
              label={({ name, value }) => `${name}: ${value}`}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    if (question.question_type === 'stars') {
      const starCounts: { [key: number]: number } = {};
      for (let i = 1; i <= 5; i++) {
        starCounts[i] = 0;
      }
      
      questionAnswers.forEach(answer => {
        const stars = parseInt(answer.answer_value);
        if (!isNaN(stars) && stars >= 1 && stars <= 5) {
          starCounts[stars]++;
        }
      });

      const chartData = Object.entries(starCounts).map(([stars, count]) => ({
        stars: `${stars} ⭐`,
        count
      }));

      return (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="stars" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#fbbf24" />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    return <p className="text-muted-foreground">Gráfico não disponível para este tipo de pergunta</p>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 rounded-3xl text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground">Carregando análise...</p>
        </div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 rounded-3xl text-center">
          <p className="text-lg text-muted-foreground">Pesquisa não encontrada</p>
          <Button onClick={() => navigate('/dashboard')} className="mt-4">
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const wordCloudData = generateWordCloud();

  return (
    <div className="min-h-screen p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-8">
        {/* Header */}
        <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold neon-text truncate">Análise da Pesquisa</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base truncate">
              {survey.title} - {survey.form_companies?.name}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="glass-button w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>

        {/* Métricas NPS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Respostas</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalResponses}</div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Promotores</CardTitle>
              <ThumbsUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{promoters}</div>
              <p className="text-xs text-muted-foreground">Notas 9-10</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Neutros</CardTitle>
              <Minus className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{neutrals}</div>
              <p className="text-xs text-muted-foreground">Notas 7-8</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Detratores</CardTitle>
              <ThumbsDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{detractors}</div>
              <p className="text-xs text-muted-foreground">Notas 0-6</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">NPS Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${npsScore >= 50 ? 'text-green-600' : npsScore >= 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                {npsScore}
              </div>
              <p className="text-xs text-muted-foreground">
                {npsScore >= 50 ? 'Excelente' : npsScore >= 0 ? 'Bom' : 'Crítico'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Explicação das categorias */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Entenda as Categorias NPS</CardTitle>
            <CardDescription>
              O Net Promoter Score (NPS) classifica os clientes em três categorias baseadas na pergunta: "Qual a probabilidade de você recomendar nossa empresa/produto/serviço para um amigo ou colega?"
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
                <ThumbsUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold text-green-800">Promotores (9-10)</h3>
                <p className="text-sm text-green-700">Clientes leais que irão recomendar e impulsionar o crescimento</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                <Minus className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <h3 className="font-semibold text-yellow-800">Neutros (7-8)</h3>
                <p className="text-sm text-yellow-700">Clientes satisfeitos mas não entusiasmados, vulneráveis à concorrência</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-red-50 border border-red-200">
                <ThumbsDown className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <h3 className="font-semibold text-red-800">Detratores (0-6)</h3>
                <p className="text-sm text-red-700">Clientes insatisfeitos que podem prejudicar a marca através de comentários negativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de distribuição NPS */}
        {npsData.length > 0 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Distribuição de Respostas por Escala (0-10)</CardTitle>
              <CardDescription>Visualização da distribuição das notas atribuídas pelos respondentes</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={npsData}>
                  <XAxis dataKey="score" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Nuvem de palavras */}
        {wordCloudData.length > 0 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Nuvem de Palavras</CardTitle>
              <CardDescription>Palavras mais frequentes nos comentários dos respondentes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 justify-center">
                {wordCloudData.map(({ word, count }) => (
                  <span
                    key={word}
                    className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary font-medium"
                    style={{
                      fontSize: `${Math.max(12, Math.min(24, count * 2))}px`
                    }}
                  >
                    {word} ({count})
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SurveyAnalytics;