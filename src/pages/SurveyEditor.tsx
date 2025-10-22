import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QuestionDialog } from "@/components/QuestionDialog";
import { toast } from "sonner";
import { ArrowLeft, Plus, Edit, Trash2, Copy, ExternalLink, QrCode, Download } from "lucide-react";
import { motion } from "framer-motion";
import QRCode from "qrcode";

export default function SurveyEditor() {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [qrCodeModalOpen, setQrCodeModalOpen] = useState(false);

  useEffect(() => {
    loadSurveyData();
  }, [surveyId]);

  const loadSurveyData = async () => {
    try {
      const { data: surveyData, error: surveyError } = await supabase
        .from("form_surveys")
        .select("*, form_companies(*)")
        .eq("id", surveyId)
        .single();

      if (surveyError) throw surveyError;
      setSurvey(surveyData);

      const { data: questionsData, error: questionsError } = await supabase
        .from("form_questions")
        .select("*")
        .eq("survey_id", surveyId)
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

  const deleteQuestion = async (questionId: string) => {
    if (!confirm("Deseja realmente excluir esta pergunta?")) return;

    try {
      const { error } = await supabase
        .from("form_questions")
        .delete()
        .eq("id", questionId);

      if (error) throw error;
      toast.success("Pergunta excluída!");
      loadSurveyData();
    } catch (error: any) {
      toast.error("Erro ao excluir pergunta");
    }
  };

  const copyLink = () => {
    if (!survey?.form_companies?.slug) return;
    const link = `${window.location.origin}/empresa/${survey.form_companies.slug}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado!");
  };

  const openLink = () => {
    if (!survey?.form_companies?.slug) return;
    const link = `${window.location.origin}/empresa/${survey.form_companies.slug}`;
    window.open(link, "_blank");
  };

  const generateSurveyURL = () => {
    if (!survey?.form_companies?.slug) return "";
    return `${window.location.origin}/empresa/${survey.form_companies.slug}`;
  };

  const downloadQRCode = async () => {
    try {
      const url = generateSurveyURL();
      if (!url) return;

      const qrCodeDataURL = await QRCode.toDataURL(url, {
        width: 512,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      const link = document.createElement("a");
      link.href = qrCodeDataURL;
      link.download = `qrcode-${survey?.title?.replace(/[^a-zA-Z0-9]/g, "-") || "pesquisa"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("QR Code baixado com sucesso!");
    } catch (error) {
      toast.error("Erro ao gerar QR Code");
      console.error(error);
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      nps: "NPS (0-10)",
      multiple_choice: "Múltipla Escolha",
      text: "Texto Livre",
      emoji: "Emoji",
      stars: "Estrelas",
      yes_no: "Sim/Não",
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle>Pesquisa não encontrada</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/dashboard")}>
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg p-3 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
        >
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard")}
            className="glass-button w-full sm:w-auto"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={copyLink} variant="outline" className="glass-button" size="sm">
              <Copy className="w-4 h-4 mr-2" />
              <span className="sm:inline">Copiar Link</span>
            </Button>
            <Button onClick={() => setQrCodeModalOpen(true)} variant="outline" className="glass-button" size="sm">
              <QrCode className="w-4 h-4 mr-2" />
              <span className="sm:inline">Ver QR Code</span>
            </Button>
            <Button onClick={openLink} variant="outline" className="glass-button" size="sm">
              <ExternalLink className="w-4 h-4 mr-2" />
              <span className="sm:inline">Abrir</span>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-card border-white/10">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-xl sm:text-2xl neon-text">{survey.title}</CardTitle>
              <CardDescription className="text-base sm:text-lg">
                {survey.description || "Sem descrição"}
              </CardDescription>
              <div className="pt-2 text-xs sm:text-sm text-muted-foreground">
                Empresa: {survey.form_companies?.name}
              </div>
            </CardHeader>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-card border-white/10">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex-1">
                  <CardTitle className="text-base sm:text-lg">Perguntas da Pesquisa</CardTitle>
                  <CardDescription className="text-sm">
                    Gerencie as perguntas que serão exibidas
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setEditingQuestion(null);
                    setDialogOpen(true);
                  }}
                  className="glass-button w-full sm:w-auto"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Pergunta
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
              {questions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Nenhuma pergunta cadastrada ainda
                </div>
              ) : (
                questions.map((question, index) => (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="glass-card p-3 sm:p-4 rounded-lg space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className="text-xs sm:text-sm font-semibold text-primary">
                            #{question.order_number}
                          </span>
                          <span className="text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 bg-primary/20 rounded whitespace-nowrap">
                            {getQuestionTypeLabel(question.question_type)}
                          </span>
                          {question.is_required && (
                            <span className="text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 bg-red-500/20 rounded text-red-300 whitespace-nowrap">
                              Obrigatória
                            </span>
                          )}
                          {question.question_type === 'nps' && (
                            <span className="text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-500/20 rounded text-blue-300 whitespace-nowrap">
                              Padrão
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm sm:text-base break-words">{question.question_text}</p>
                        {question.options?.options && (
                          <div className="mt-2 text-xs sm:text-sm text-muted-foreground break-words">
                            Opções: {question.options.options.join(", ")}
                          </div>
                        )}
                      </div>
                      {question.question_type !== 'nps' && (
                        <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2 shrink-0">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 sm:h-10 sm:w-10"
                            onClick={() => {
                              setEditingQuestion(question);
                              setDialogOpen(true);
                            }}
                          >
                            <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 sm:h-10 sm:w-10"
                            onClick={() => deleteQuestion(question.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Modal de QR Code */}
      <Dialog open={qrCodeModalOpen} onOpenChange={setQrCodeModalOpen}>
        <DialogContent className="glass-card border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">QR Code da Pesquisa</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Informações da pesquisa */}
            <div className="bg-primary/10 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">📋 {survey?.title}</h3>
              <p className="text-sm text-muted-foreground mb-1">
                <strong>Empresa:</strong> {survey?.form_companies?.name}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>URL:</strong> {generateSurveyURL()}
              </p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-lg">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(generateSurveyURL())}`}
                  alt="QR Code da Pesquisa"
                  className="w-48 h-48"
                />
              </div>
            </div>

            {/* Botões de ação */}
            <div className="space-y-3">
              <Button 
                onClick={downloadQRCode}
                className="w-full h-11 bg-gradient-to-r from-primary to-secondary"
              >
                <Download className="w-4 h-4 mr-2" />
                Baixar QR Code
              </Button>
              
              <Button 
                onClick={() => {
                  navigator.clipboard.writeText(generateSurveyURL());
                  toast.success("URL copiada para a área de transferência!");
                }}
                variant="outline"
                className="w-full h-11"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copiar URL da Pesquisa
              </Button>
            </div>

            <div className="bg-primary/10 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                💡 Compartilhe o QR Code ou a URL com seus clientes para que eles possam responder à pesquisa
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <QuestionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={loadSurveyData}
        surveyId={surveyId!}
        existingQuestion={editingQuestion}
        nextOrder={questions.length + 1}
      />
    </div>
  );
}
