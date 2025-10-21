import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { ChevronRight, Sparkles } from "lucide-react";
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

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      // Create response
      const { data: responseData, error: responseError } = await supabase
        .from("form_responses")
        .insert({
          survey_id: survey!.id,
          respondent_identifier: null,
        })
        .select()
        .single();

      if (responseError) throw responseError;

      // Create answers
      const answersArray = Object.entries(answers).map(([questionId, value]) => ({
        response_id: responseData.id,
        question_id: questionId,
        answer_value: value,
      }));

      const { error: answersError } = await supabase
        .from("form_answers")
        .insert(answersArray);

      if (answersError) throw answersError;

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 rounded-3xl">
          <p className="text-foreground">Carregando pesquisa...</p>
        </div>
      </div>
    );
  }

  if (!company || !survey || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 rounded-3xl text-center">
          <p className="text-foreground">Pesquisa não encontrada</p>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-3xl p-12 max-w-2xl text-center space-y-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="text-8xl"
          >
            😁
          </motion.div>
          <h1 className="text-4xl font-bold neon-text">
            {company.thank_you_message}
          </h1>
          <p className="text-xl text-muted-foreground">
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
    <div className="min-h-screen flex flex-col">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Progress value={progress} className="h-2 rounded-none" />
      </div>

      {/* Header */}
      <div className="p-6 text-center">
        {company.logo_url && (
          <img
            src={company.logo_url}
            alt={company.name}
            className="h-12 mx-auto mb-2"
          />
        )}
        <h1 className="text-2xl font-bold neon-text">{company.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pergunta {currentQuestionIndex + 1} de {questions.length}
        </p>
      </div>

      {/* Question */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="glass-card rounded-3xl p-8 space-y-8"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-center">
                {currentQuestion.question_text}
              </h2>
              
              {renderQuestion()}

              <Button
                onClick={handleNext}
                disabled={submitting}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-primary-foreground font-semibold py-6 rounded-xl"
              >
                {submitting
                  ? "Enviando..."
                  : currentQuestionIndex === questions.length - 1
                  ? "Enviar"
                  : "Próxima"}
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Survey;
