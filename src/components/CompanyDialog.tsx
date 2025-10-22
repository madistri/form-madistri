import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";

interface Company {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  thank_you_message: string;
}

interface CompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  company?: Company | null;
}

export const CompanyDialog = ({ open, onOpenChange, onSuccess, company }: CompanyDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    logo_url: "",
    primary_color: "#A855F7",
    secondary_color: "#00FFFF",
    thank_you_message: "Obrigado por sua resposta!",
  });

  // Initialize form with company data when editing
  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name,
        slug: company.slug,
        logo_url: company.logo_url || "",
        primary_color: company.primary_color,
        secondary_color: company.secondary_color,
        thank_you_message: company.thank_you_message,
      });
    } else {
      setFormData({
        name: "",
        slug: "",
        logo_url: "",
        primary_color: "#A855F7",
        secondary_color: "#00FFFF",
        thank_you_message: "Obrigado por sua resposta!",
      });
    }
  }, [company, open]);

  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `company-logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('company-assets')
        .getPublicUrl(filePath);

      setFormData({ ...formData, logo_url: publicUrl });
      toast.success("Logo enviada com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao enviar logo: " + error.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("Arquivo muito grande. Máximo 5MB.");
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error("Por favor, selecione uma imagem.");
        return;
      }
      handleLogoUpload(file);
    }
  };

  const removeLogo = () => {
    setFormData({ ...formData, logo_url: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Você precisa estar logado");
        return;
      }

      const companyData = {
        name: formData.name,
        slug: formData.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        logo_url: formData.logo_url || null,
        primary_color: formData.primary_color,
        secondary_color: formData.secondary_color,
        thank_you_message: formData.thank_you_message,
      };

      if (company) {
        // Update existing company
        const { error } = await supabase
          .from("form_companies")
          .update(companyData)
          .eq("id", company.id);

        if (error) throw error;
        toast.success("Empresa atualizada com sucesso!");
      } else {
        // Create new company
        const { error } = await supabase.from("form_companies").insert({
          ...companyData,
          created_by: user.id,
        });

        if (error) throw error;
        toast.success("Empresa cadastrada com sucesso!");
      }

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || (company ? "Erro ao atualizar empresa" : "Erro ao cadastrar empresa"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-white/10 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl">
            {company ? "Editar Empresa" : "Nova Empresa"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {company 
              ? "Edite as informações da empresa" 
              : "Cadastre uma nova empresa para criar pesquisas personalizadas"
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Empresa *</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Farmácia Vida"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug (URL única) *</Label>
            <Input
              id="slug"
              required
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="Ex: farmacia-vida"
            />
            <p className="text-xs text-muted-foreground">
              Será usado na URL: /empresa/{formData.slug || "seu-slug"}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Logo da Empresa</Label>
            <div className="flex flex-col gap-2">
              {formData.logo_url ? (
                <div className="relative inline-block">
                  <img 
                    src={formData.logo_url} 
                    alt="Logo da empresa" 
                    className="w-32 h-32 object-contain border rounded-lg bg-white"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                    onClick={removeLogo}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingLogo}
                    >
                      {uploadingLogo ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Selecionar Logo
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG até 5MB</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary_color">Cor Primária</Label>
              <Input
                id="primary_color"
                type="color"
                value={formData.primary_color}
                onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary_color">Cor Secundária</Label>
              <Input
                id="secondary_color"
                type="color"
                value={formData.secondary_color}
                onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="thank_you_message">Mensagem de Agradecimento</Label>
            <Textarea
              id="thank_you_message"
              value={formData.thank_you_message}
              onChange={(e) => setFormData({ ...formData, thank_you_message: e.target.value })}
              placeholder="Obrigado por sua resposta!"
            />
          </div>

          <Button type="submit" className="w-full h-11" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {company ? "Atualizando..." : "Cadastrando..."}
              </>
            ) : (
              company ? "Atualizar Empresa" : "Cadastrar Empresa"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
