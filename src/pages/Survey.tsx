import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { ChevronRight, ChevronLeft, Sparkles, Search, BarChart3, Users, MessageCircle, Star, TrendingUp } from "lucide-react";
import NPSQuestion from "@/components/survey/NPSQuestion";
import MultipleChoiceQuestion from "@/components/survey/MultipleChoiceQuestion";
import TextQuestion from "@/components/survey/TextQuestion";
import EmojiQuestion from "@/components/survey/EmojiQuestion";
import StarsQuestion from "@/components/survey/StarsQuestion";
import YesNoQuestion from "@/components/survey/YesNoQuestion";

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  thank_you_message: string;
}

interface Survey {
  id: string;
  title: string;
  description: string | null;
}

interface Question {
  id: string;
  question_text: string;
  question_type: "nps" | "multiple_choice" | "yes_no" | "text" | "emoji" | "stars";
  options: any;
  is_required: boolean;
  order_number: number;
}

// Componente de fundo animado
const AnimatedBackground = () => {
  const icons = [Search, BarChart3, Users, MessageCircle, Star, TrendingUp];
  const emojis = ['📊', '📈', '💭', '🔍', '⭐', '📋', '💡', '🎯', '📝', '👥'];
  
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Ícones animados */}
      {Array.from({ length: 8 }).map((_, i) => {
        const Icon = icons[i % icons.length];
        return (
          <motion.div
            key={`icon-${i}`}
            className="absolute text-gray-300/20"
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
              rotate: 0,
            }}
            animate={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
              rotate: 360,
            }}
            transition={{
              duration: 20 + Math.random() * 10,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <Icon size={24 + Math.random() * 16} />
          </motion.div>
        );
      })}
      
      {/* Emojis animados */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={`emoji-${i}`}
          className="absolute text-2xl opacity-30"
          initial={{
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
            scale: 0.5,
          }}
          animate={{
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 15 + Math.random() * 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {emojis[i % emojis.length]}
        </motion.div>
      ))}
      
      {/* Partículas flutuantes */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-1 h-1 bg-gray-400/20 rounded-full"
          initial={{
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
            y: (typeof window !== 'undefined' ? window.innerHeight : 800) + 10,
          }}
          animate={{
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
            y: -10,
          }}
          transition={{
            duration: 8 + Math.random() * 4,
            repeat: Infinity,
            ease: "linear",
            delay: Math.random() * 8,
          }}
        />
      ))}
    </div>
  );
};

const Survey = () => {
  const { slug } = useParams();
  const [company, setCompany] = useState<Company | null>(null);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const loadSurvey = async () => {
      try {
        // Load company
        const { data: companyData, error: companyError } = await supabase
          .from("form_companies")
          .select("*")
          .eq("slug", slug)
          .single();

        if (companyError) throw companyError;
        setCompany(companyData);

        // Apply company colors to CSS custom properties
        if (companyData) {
          document.documentElement.style.setProperty('--company-primary', companyData.primary_color);
          document.documentElement.style.setProperty('--company-secondary', companyData.secondary_color);
        }

        // Load active survey for company
        const { data: surveyData, error: surveyError } = await supabase
          .from("form_surveys")
          .select("*")
          .eq("company_id", companyData.id)
          .eq("is_active", true)
          .single();

        if (surveyError) throw surveyError;
        setSurvey(surveyData);

        // Load questions
        const { data: questionsData, error: questionsError } = await supabase
          .from("form_questions")
          .select("*")
          .eq("survey_id", surveyData.id)
          .order("order_number", { ascending: true });

        if (questionsError) throw questionsError;
        setQuestions(questionsData || []);
      } catch (error: any) {
        toast.error("Erro ao carregar pesquisa");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) loadSurvey();
  }, [slug]);

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    
    // Auto-advance for non-text questions after a short delay
    const currentQuestion = questions[currentQuestionIndex];
    if (currentQuestion && currentQuestion.question_type !== 'text') {
      setTimeout(() => {
        // Check if we can advance (question is answered)
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex((prev) => prev + 1);
        } else {
          handleSubmit();
        }
      }, 25); // 200ms delay to show the selection
    }
  };

  const handleNext = () => {
    const currentQuestion = questions[currentQuestionIndex];
    
    if (currentQuestion.is_required && !answers[currentQuestion.id]) {
      toast.error("Por favor, responda esta pergunta");
      return;
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      // Prepare answers array for the RPC function
      const answersArray = Object.entries(answers).map(([questionId, value]) => ({
        question_id: questionId,
        answer_value: value,
      }));

      // Use RPC function to submit response (bypasses RLS issues)
      const { data: responseId, error } = await supabase
        .rpc('submit_survey_response', {
          p_survey_id: survey!.id,
          p_answers: answersArray
        });

      if (error) throw error;

      // Show confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      setCompleted(true);
    } catch (error: any) {
      toast.error("Erro ao enviar respostas");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30 relative">
        <AnimatedBackground />
        <div className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl p-8 rounded-3xl relative z-10">
          <p className="text-slate-800">Carregando pesquisa...</p>
        </div>
      </div>
    );
  }

  if (!company || !survey || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30 relative">
        <AnimatedBackground />
        <div className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl p-8 rounded-3xl text-center relative z-10">
          <p className="text-slate-800">Pesquisa não encontrada</p>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-blue-50/30 relative">
        <AnimatedBackground />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl rounded-3xl p-12 max-w-2xl text-center space-y-6 relative z-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="text-8xl"
          >
            😁
          </motion.div>
          <h1 className="text-4xl font-bold text-slate-800" style={{ color: company?.primary_color || '#A855F7' }}>
            {company.thank_you_message}
          </h1>
          <p className="text-xl text-slate-600">
            Sua opinião é muito importante para nós!
          </p>
        </motion.div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const renderQuestion = () => {
    const questionProps = {
      question: currentQuestion,
      value: answers[currentQuestion.id] || "",
      onChange: (value: string) => handleAnswer(currentQuestion.id, value),
    };

    switch (currentQuestion.question_type) {
      case "nps":
        return <NPSQuestion {...questionProps} />;
      case "multiple_choice":
        return <MultipleChoiceQuestion {...questionProps} />;
      case "text":
        return <TextQuestion {...questionProps} />;
      case "emoji":
        return <EmojiQuestion {...questionProps} />;
      case "stars":
        return <StarsQuestion {...questionProps} />;
      case "yes_no":
        return <YesNoQuestion {...questionProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50/30 relative">
      {/* Fundo animado */}
      <AnimatedBackground />
      
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Progress 
          value={progress} 
          className="h-2 rounded-none" 
          indicatorColor={company?.primary_color || '#A855F7'}
        />
      </div>

      {/* Header */}
      <div className="p-6 text-center relative z-10">
        {company.logo_url && (
          <img
            src={company.logo_url}
            alt={company.name}
            className="h-12 mx-auto mb-2"
          />
        )}
        <h1 
          className="text-2xl font-bold"
          style={{ color: company?.primary_color || '#A855F7' }}
        >
          {company.name}
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Pergunta {currentQuestionIndex + 1} de {questions.length}
        </p>
      </div>

      {/* Question */}
      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl rounded-3xl p-8 space-y-8"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-center text-slate-800">
                {currentQuestion.question_text}
              </h2>
              
              {renderQuestion()}

              <div className="flex gap-4">
                {currentQuestionIndex > 0 && (
                  <Button
                    onClick={handlePrevious}
                    variant="outline"
                    className="flex-1 hover:opacity-90 font-semibold py-6 rounded-xl bg-white/50 border-white/30 text-slate-700 hover:bg-white/70 hover:text-slate-700"
                  >
                    <ChevronLeft className="w-5 h-5 mr-2" />
                    Voltar
                  </Button>
                )}
                
                <Button
                  onClick={handleNext}
                  disabled={submitting}
                  className={`hover:opacity-90 text-white font-semibold py-6 rounded-xl ${
                    currentQuestionIndex > 0 ? 'flex-1' : 'w-full'
                  }`}
                  style={{
                    background: `linear-gradient(to right, ${company?.primary_color || '#A855F7'}, ${company?.secondary_color || '#00FFFF'})`
                  }}
                >
                  {submitting
                    ? "Enviando..."
                    : currentQuestionIndex === questions.length - 1
                    ? "Enviar"
                    : "Próxima"}
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Survey;
