import { motion } from "framer-motion";

interface NPSQuestionProps {
  question: any;
  value: string;
  onChange: (value: string) => void;
}

const NPSQuestion = ({ value, onChange }: NPSQuestionProps) => {
  const numbers = Array.from({ length: 11 }, (_, i) => i);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-6 md:grid-cols-11 gap-2">
        {numbers.map((num) => (
          <motion.button
            key={num}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(num.toString())}
            className={`aspect-square rounded-xl font-bold text-lg transition-all ${
              value === num.toString()
                ? "bg-gradient-to-br from-primary to-secondary text-white scale-110"
                : "glass-button text-black hover:bg-white/10"
            }`}
          >
            {num}
          </motion.button>
        ))}
      </div>
      <div className="flex justify-between text-sm text-muted-foreground px-2">
        <span>Improvável</span>
        <span>Muito provável</span>
      </div>
    </div>
  );
};

export default NPSQuestion;
