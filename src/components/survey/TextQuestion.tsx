import { Textarea } from "@/components/ui/textarea";

interface TextQuestionProps {
  question: any;
  value: string;
  onChange: (value: string) => void;
}

const TextQuestion = ({ value, onChange }: TextQuestionProps) => {
  return (
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Digite sua resposta aqui..."
      className="min-h-[150px] glass-card border-border bg-card/50 text-lg resize-none"
    />
  );
};

export default TextQuestion;
