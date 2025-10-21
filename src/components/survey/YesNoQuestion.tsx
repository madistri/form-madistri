import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

interface YesNoQuestionProps {
  question: any;
  value: string;
  onChange: (value: string) => void;
}

const YesNoQuestion = ({ value, onChange }: YesNoQuestionProps) => {
  return (
    <div className="flex justify-center gap-6">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onChange("yes")}
        className={`flex flex-col items-center gap-3 p-8 rounded-2xl min-w-[150px] transition-all ${
          value === "yes"
            ? "bg-gradient-to-br from-success/20 to-success/30 border-2 border-success"
            : "glass-button hover:bg-white/10"
        }`}
      >
        <Check className={`w-12 h-12 ${value === "yes" ? "text-success" : "text-foreground"}`} />
        <span className="text-xl font-bold">Sim</span>
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onChange("no")}
        className={`flex flex-col items-center gap-3 p-8 rounded-2xl min-w-[150px] transition-all ${
          value === "no"
            ? "bg-gradient-to-br from-destructive/20 to-destructive/30 border-2 border-destructive"
            : "glass-button hover:bg-white/10"
        }`}
      >
        <X className={`w-12 h-12 ${value === "no" ? "text-destructive" : "text-foreground"}`} />
        <span className="text-xl font-bold">Não</span>
      </motion.button>
    </div>
  );
};

export default YesNoQuestion;
