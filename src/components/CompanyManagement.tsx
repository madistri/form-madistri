import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Edit, Trash2, Building2, Palette, Image } from "lucide-react";
import { motion } from "framer-motion";

interface Company {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  thank_you_message: string;
  created_at: string;
}

interface CompanyManagementProps {
  onEditCompany: (company: Company) => void;
  onRefresh: () => void;
  refreshTrigger?: number;
}

export const CompanyManagement = ({ onEditCompany, onRefresh, refreshTrigger }: CompanyManagementProps) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (refreshTrigger) {
      fetchCompanies();
    }
  }, [refreshTrigger]);

  const fetchCompanies = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("form_companies")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error("Error loading companies:", error);
      toast.error("Erro ao carregar empresas");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCompany = async (companyId: string, companyName: string) => {
    if (!confirm(`Tem certeza que deseja excluir a empresa "${companyName}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      // Check if company has surveys
      const { data: surveys } = await supabase
        .from("form_surveys")
        .select("id")
        .eq("company_id", companyId);

      if (surveys && surveys.length > 0) {
        toast.error("Não é possível excluir uma empresa que possui pesquisas. Exclua as pesquisas primeiro.");
        return;
      }

      const { error } = await supabase
        .from("form_companies")
        .delete()
        .eq("id", companyId);

      if (error) throw error;

      toast.success("Empresa excluída com sucesso!");
      fetchCompanies();
      onRefresh();
    } catch (error) {
      console.error("Error deleting company:", error);
      toast.error("Erro ao excluir empresa");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Gerenciar Empresas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Carregando empresas...</p>
        </CardContent>
      </Card>
    );
  }

  if (companies.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Gerenciar Empresas
          </CardTitle>
          <CardDescription>
            Gerencie as empresas cadastradas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Nenhuma empresa cadastrada ainda.
            </p>
            <p className="text-sm text-muted-foreground">
              Clique em "Nova Empresa" para começar.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Gerenciar Empresas
        </CardTitle>
        <CardDescription>
          {companies.length} empresa{companies.length !== 1 ? 's' : ''} cadastrada{companies.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {companies.map((company, index) => (
            <motion.div
              key={company.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-4 rounded-lg border hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    {company.logo_url && (
                      <img
                        src={company.logo_url}
                        alt={company.name}
                        className="w-8 h-8 rounded object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">{company.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        /{company.slug}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      <div className="flex gap-1">
                        <div
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: company.primary_color }}
                          title={`Cor primária: ${company.primary_color}`}
                        />
                        <div
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: company.secondary_color }}
                          title={`Cor secundária: ${company.secondary_color}`}
                        />
                      </div>
                    </div>
                    
                    {company.logo_url && (
                      <div className="flex items-center gap-1">
                        <Image className="w-4 h-4" />
                        <span>Logo</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditCompany(company)}
                    className="glass-button"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteCompany(company.id, company.name)}
                    className="glass-button hover:bg-destructive/10 hover:border-destructive/30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};