import { motion } from "framer-motion";
import { Star } from "lucide-react";

interface StarsQuestionProps {
  question: any;
  value: string;
  onChange: (value: string) => void;
}

const StarsQuestion = ({ value, onChange }: StarsQuestionProps) => {
  const stars = [1, 2, 3, 4, 5];

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
            className={`w-12 h-12 transition-all ${
              parseInt(value) >= star
                ? "fill-primary text-primary"
                : "text-muted-foreground"
            }`}
          />
        </motion.button>
      ))}
    </div>
  );
};

export default StarsQuestion;
