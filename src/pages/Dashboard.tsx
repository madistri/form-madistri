import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, PlusCircle, BarChart3, Settings } from "lucide-react";
import { toast } from "sonner";
import { CompanyDialog } from "@/components/CompanyDialog";
import { SurveyDialog } from "@/components/SurveyDialog";
import { CompanyManagement } from "@/components/CompanyManagement";

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ companies: 0, surveys: 0, responses: 0 });
  const [surveys, setSurveys] = useState<any[]>([]);
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);
  const [surveyDialogOpen, setSurveyDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/login");
        return;
      }

      setUser(session.user);
      setLoading(false);
      fetchStats();
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/login");
      }
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: companiesData } = await supabase
        .from("form_companies")
        .select("*")
        .eq("created_by", user.id);

      const companyIds = companiesData?.map(c => c.id) || [];

      const { data: surveysData } = await supabase
        .from("form_surveys")
        .select("*, form_companies(name)")
        .in("company_id", companyIds);

      setSurveys(surveysData || []);
      const surveyIds = surveysData?.map(s => s.id) || [];

      const { count: responsesCount } = await supabase
        .from("form_responses")
        .select("*", { count: "exact", head: true })
        .in("survey_id", surveyIds);

      setStats({
        companies: companiesData?.length || 0,
        surveys: surveysData?.length || 0,
        responses: responsesCount || 0,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout realizado com sucesso!");
  };

  const handleEditCompany = (company: any) => {
    setEditingCompany(company);
    setCompanyDialogOpen(true);
  };

  const handleCompanyDialogClose = () => {
    setCompanyDialogOpen(false);
    setEditingCompany(null);
  };

  const handleCompanySuccess = () => {
    fetchStats();
    fetchSurveys();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 rounded-3xl">
          <p className="text-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-8">
        {/* Header */}
        <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold neon-text truncate">Dashboard</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base truncate">
              Bem-vindo, {user?.email}
            </p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="glass-button w-full sm:w-auto"
            size="sm"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
          <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
              <h3 className="font-semibold text-sm sm:text-base">Empresas</h3>
            </div>
            <p className="text-3xl sm:text-4xl font-bold">{stats.companies}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Total cadastradas</p>
          </div>

          <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-2">
            <div className="flex items-center gap-2 text-secondary">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
              <h3 className="font-semibold text-sm sm:text-base">Pesquisas</h3>
            </div>
            <p className="text-3xl sm:text-4xl font-bold">{stats.surveys}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Formulários ativos</p>
          </div>

          <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-2">
            <div className="flex items-center gap-2 text-success">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
              <h3 className="font-semibold text-sm sm:text-base">Respostas</h3>
            </div>
            <p className="text-3xl sm:text-4xl font-bold">{stats.responses}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Coletadas</p>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
          <div className="glass-card rounded-xl sm:rounded-2xl p-5 sm:p-8 space-y-3 sm:space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold">Empresas</h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Cadastre e gerencie empresas que utilizarão o sistema de pesquisa.
            </p>
            <Button 
              className="w-full bg-gradient-to-r from-primary to-secondary h-11"
              onClick={() => {
                setEditingCompany(null);
                setCompanyDialogOpen(true);
              }}
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Nova Empresa
            </Button>
          </div>

          <div className="glass-card rounded-xl sm:rounded-2xl p-5 sm:p-8 space-y-3 sm:space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold">Pesquisas</h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Crie e personalize formulários de satisfação para suas empresas.
            </p>
            <Button 
              className="w-full bg-gradient-to-r from-secondary to-primary h-11"
              onClick={() => setSurveyDialogOpen(true)}
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Nova Pesquisa
            </Button>
          </div>
        </div>

        {/* Company Management */}
        <CompanyManagement 
          onEditCompany={handleEditCompany}
          onRefresh={handleCompanySuccess}
        />

        {/* Surveys List */}
        {surveys.length > 0 && (
          <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Minhas Pesquisas</h3>
            <div className="space-y-2 sm:space-y-3">
              {surveys.map((survey) => (
                <div
                  key={survey.id}
                  className="glass-card p-3 sm:p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-primary/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm sm:text-base truncate">{survey.title}</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {survey.form_companies?.name}
                    </p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/analytics/${survey.id}`)}
                      className="glass-button flex-1 sm:flex-none"
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Analisar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/survey/${survey.id}`)}
                      className="glass-button flex-1 sm:flex-none"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Gerenciar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-2">Como começar?</h3>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground text-sm sm:text-base">
            <li>Cadastre uma empresa com seu slug único (ex: farmacia-vida)</li>
            <li>Crie uma pesquisa e adicione perguntas personalizadas</li>
            <li>Clique em "Gerenciar" para personalizar as perguntas</li>
            <li>Compartilhe o link /empresa/[slug] com seus clientes</li>
          </ol>
        </div>
      </div>

      <CompanyDialog 
        open={companyDialogOpen} 
        onOpenChange={handleCompanyDialogClose}
        onSuccess={handleCompanySuccess}
        company={editingCompany}
      />
      
      <SurveyDialog 
        open={surveyDialogOpen} 
        onOpenChange={setSurveyDialogOpen}
        onSuccess={fetchStats}
      />
    </div>
  );
};

export default Dashboard;
