import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, BarChart3, Heart } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-8 max-w-4xl"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary mb-4"
        >
          <Sparkles className="w-12 h-12 text-primary-foreground" />
        </motion.div>

        {/* Title */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-bold neon-text">
            Express Poll
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground">
            Sistema Inteligente de Pesquisa de Satisfação
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
          <div className="glass-card rounded-2xl p-6 space-y-2">
            <BarChart3 className="w-8 h-8 text-primary mx-auto" />
            <h3 className="font-bold">Análise NPS</h3>
            <p className="text-sm text-muted-foreground">
              Acompanhe métricas em tempo real
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-2">
            <Sparkles className="w-8 h-8 text-secondary mx-auto" />
            <h3 className="font-bold">Design Moderno</h3>
            <p className="text-sm text-muted-foreground">
              Interface intuitiva e responsiva
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-2">
            <Heart className="w-8 h-8 text-success mx-auto" />
            <h3 className="font-bold">Personalizável</h3>
            <p className="text-sm text-muted-foreground">
              Adapte para sua marca
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
          <Link to="/login">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-primary-foreground font-semibold px-8 py-6 text-lg rounded-xl"
            >
              Acessar Dashboard
            </Button>
          </Link>
        </div>

        {/* Info */}
        <p className="text-sm text-muted-foreground mt-8">
          Crie pesquisas personalizadas e colete feedback valioso dos seus clientes
        </p>
      </motion.div>
    </div>
  );
};

export default Index;
