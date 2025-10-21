import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";

interface QuestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  surveyId: string;
  existingQuestion?: any;
  nextOrder: number;
}

export const QuestionDialog = ({ 
  open, 
  onOpenChange, 
  onSuccess, 
  surveyId,
  existingQuestion,
  nextOrder
}: QuestionDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<{
    question_text: string;
    question_type: "emoji" | "multiple_choice" | "nps" | "stars" | "text" | "yes_no";
    is_required: boolean;
    order_number: number;
    options: any;
  }>({
    question_text: "",
    question_type: "text",
    is_required: true,
    order_number: nextOrder,
    options: null,
  });
  const [multipleChoiceOptions, setMultipleChoiceOptions] = useState<string[]>([""])

  useEffect(() => {
    if (open) {
      if (existingQuestion) {
        setFormData({
          question_text: existingQuestion.question_text,
          question_type: existingQuestion.question_type,
          is_required: existingQuestion.is_required,
          order_number: existingQuestion.order_number,
          options: existingQuestion.options,
        });
        setMultipleChoiceOptions(existingQuestion.options?.options || [""]);
      } else {
        setFormData({
          question_text: "",
          question_type: "text",
          is_required: true,
          order_number: nextOrder,
          options: null,
        });
        setMultipleChoiceOptions([""]);
      }
    }
  }, [open, existingQuestion, nextOrder]);

  const questionTypes = [
    { value: "nps", label: "NPS (0-10)" },
    { value: "multiple_choice", label: "Múltipla Escolha" },
    { value: "text", label: "Texto Livre" },
    { value: "emoji", label: "Emoji" },
    { value: "stars", label: "Estrelas (1-5)" },
    { value: "yes_no", label: "Sim/Não" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let options = null;
      if (formData.question_type === "multiple_choice") {
        const validOptions = multipleChoiceOptions.filter(opt => opt.trim() !== "");
        if (validOptions.length < 2) {
          toast.error("Adicione pelo menos 2 opções");
          setLoading(false);
          return;
        }
        options = { options: validOptions };
      }

      const questionData = {
        survey_id: surveyId,
        question_text: formData.question_text,
        question_type: formData.question_type,
        is_required: formData.is_required,
        order_number: formData.order_number,
        options,
      };

      if (existingQuestion) {
        const { error } = await supabase
          .from("form_questions")
          .update(questionData)
          .eq("id", existingQuestion.id);
        if (error) throw error;
        toast.success("Pergunta atualizada!");
      } else {
        const { error } = await supabase
          .from("form_questions")
          .insert(questionData);
        if (error) throw error;
        toast.success("Pergunta adicionada!");
      }

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar pergunta");
    } finally {
      setLoading(false);
    }
  };

  const addOption = () => {
    setMultipleChoiceOptions([...multipleChoiceOptions, ""]);
  };

  const removeOption = (index: number) => {
    setMultipleChoiceOptions(multipleChoiceOptions.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...multipleChoiceOptions];
    newOptions[index] = value;
    setMultipleChoiceOptions(newOptions);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-white/10 max-h-[90vh] overflow-y-auto w-[95vw] sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl">
            {existingQuestion ? "Editar Pergunta" : "Nova Pergunta"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            Configure a pergunta e escolha o tipo de resposta
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="question_text">Texto da Pergunta *</Label>
            <Textarea
              id="question_text"
              required
              value={formData.question_text}
              onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
              placeholder="Ex: Como você avalia nosso atendimento?"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="question_type">Tipo de Resposta *</Label>
            <Select
              value={formData.question_type}
              onValueChange={(value) => setFormData({ ...formData, question_type: value as "emoji" | "multiple_choice" | "nps" | "stars" | "text" | "yes_no" })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {questionTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.question_type === "multiple_choice" && (
            <div className="space-y-2">
              <Label>Opções *</Label>
              {multipleChoiceOptions.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Opção ${index + 1}`}
                  />
                  {multipleChoiceOptions.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeOption(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addOption}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Opção
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="order_number">Ordem</Label>
            <Input
              id="order_number"
              type="number"
              min="1"
              value={formData.order_number}
              onChange={(e) => setFormData({ ...formData, order_number: parseInt(e.target.value) })}
            />
          </div>

          <div className="flex items-center justify-between p-4 glass-card rounded-lg">
            <Label htmlFor="is_required" className="cursor-pointer">
              Resposta Obrigatória
            </Label>
            <Switch
              id="is_required"
              checked={formData.is_required}
              onCheckedChange={(checked) => setFormData({ ...formData, is_required: checked })}
            />
          </div>

          <Button type="submit" className="w-full h-11" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              existingQuestion ? "Atualizar Pergunta" : "Adicionar Pergunta"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
