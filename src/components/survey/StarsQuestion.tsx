import { motion } from "framer-motion";
import { Star } from "lucide-react";

interface StarsQuestionProps {
  question: any;
  value: string;
  onChange: (value: string) => void;
}

const StarsQuestion = ({ value, onChange }: StarsQuestionProps) => {
  const stars = [1, 2, 3, 4, 5];

  // Função para obter a cor da estrela baseada no valor selecionado
  const getStarColor = (starNumber: number, selectedValue: number) => {
    if (selectedValue >= starNumber) {
      // Degradê do vermelho (1) ao verde (5)
      switch (selectedValue) {
        case 1:
          return "text-red-500 fill-red-500";
        case 2:
          return "text-orange-500 fill-orange-500";
        case 3:
          return "text-yellow-500 fill-yellow-500";
        case 4:
          return "text-lime-500 fill-lime-500";
        case 5:
          return "text-green-500 fill-green-500";
        default:
          return "text-muted-foreground";
      }
    }
    return "text-muted-foreground";
  };

  return (
    <div className="flex justify-center gap-2">
      {stars.map((star) => (
        <motion.button
          key={star}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onChange(star.toString())}
        >
          <Star
            className={`w-12 h-12 transition-all ${getStarColor(star, parseInt(value) || 0)}`}
          />
        </motion.button>
      ))}
    </div>
  );
};

export default StarsQuestion;
