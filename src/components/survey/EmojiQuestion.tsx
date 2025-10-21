import { motion } from "framer-motion";

interface EmojiQuestionProps {
  question: any;
  value: string;
  onChange: (value: string) => void;
}

const emojis = [
  { emoji: "😞", label: "Muito insatisfeito", value: "1" },
  { emoji: "😐", label: "Insatisfeito", value: "2" },
  { emoji: "😊", label: "Neutro", value: "3" },
  { emoji: "😄", label: "Satisfeito", value: "4" },
  { emoji: "🤩", label: "Muito satisfeito", value: "5" },
];

const EmojiQuestion = ({ value, onChange }: EmojiQuestionProps) => {
  return (
    <div className="flex justify-center gap-4 flex-wrap">
      {emojis.map((item) => (
        <motion.button
          key={item.value}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onChange(item.value)}
          className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all ${
            value === item.value
              ? "bg-gradient-to-br from-primary/20 to-secondary/20 scale-110"
              : "glass-button hover:bg-white/10"
          }`}
        >
          <span className="text-5xl">{item.emoji}</span>
          <span className="text-sm text-muted-foreground">{item.label}</span>
        </motion.button>
      ))}
    </div>
  );
};

export default EmojiQuestion;
