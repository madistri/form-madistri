import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface MultipleChoiceQuestionProps {
  question: any;
  value: string;
  onChange: (value: string) => void;
}

const MultipleChoiceQuestion = ({ question, value, onChange }: MultipleChoiceQuestionProps) => {
  const options = question.options?.options || [];

  return (
    <div className="space-y-3">
      {options.map((option: string, index: number) => (
        <motion.button
          key={index}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onChange(option)}
          className={`w-full p-4 rounded-xl text-left transition-all flex items-center gap-3 ${
            value === option
              ? "bg-gradient-to-r from-primary/20 to-secondary/20 border-2 border-primary"
              : "glass-button hover:bg-white/10"
          }`}
        >
          <div
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
              value === option
                ? "border-primary bg-primary"
                : "border-muted-foreground"
            }`}
          >
            {value === option && <Check className="w-4 h-4 text-primary-foreground" />}
          </div>
          <span className="font-medium">{option}</span>
        </motion.button>
      ))}
    </div>
  );
};

export default MultipleChoiceQuestion;
