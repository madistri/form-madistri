# MAForm - Sistema de Pesquisa de Satisfação

## Sobre o Projeto

O **MAForm** é um sistema inteligente de pesquisa de satisfação com análise NPS (Net Promoter Score) em tempo real. Desenvolvido para empresas que desejam coletar e analisar feedback de clientes de forma eficiente e moderna.

## Funcionalidades

- ✅ Criação de pesquisas personalizadas
- ✅ Múltiplos tipos de perguntas (NPS, múltipla escolha, sim/não, estrelas, texto)
- ✅ Dashboard de analytics em tempo real
- ✅ Análise NPS automática
- ✅ Nuvem de palavras dos comentários
- ✅ Interface responsiva e moderna

## Como executar o projeto

**Desenvolvimento Local**

Para executar o projeto localmente, você precisa ter Node.js & npm instalados.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Siga estes passos:

```sh
# Passo 1: Clone o repositório
git clone <URL_DO_SEU_REPOSITORIO>

# Passo 2: Navegue para o diretório do projeto
cd form-madistri

# Passo 3: Instale as dependências
npm install

# Passo 4: Configure as variáveis de ambiente
# Copie o arquivo .env.example para .env e configure suas credenciais do Supabase

# Passo 5: Execute o servidor de desenvolvimento
npm run dev
```

## Tecnologias Utilizadas

Este projeto foi construído com:

- **Vite** - Build tool e dev server
- **TypeScript** - Tipagem estática
- **React** - Biblioteca de interface
- **shadcn/ui** - Componentes de UI
- **Tailwind CSS** - Framework de CSS
- **Supabase** - Backend as a Service (banco de dados, autenticação, storage)
- **Recharts** - Biblioteca de gráficos

## Estrutura do Banco de Dados

O sistema utiliza as seguintes tabelas principais:

- `form_companies` - Empresas cadastradas
- `form_surveys` - Pesquisas criadas
- `form_questions` - Perguntas das pesquisas
- `form_responses` - Respostas dos usuários
- `form_answers` - Valores das respostas

## Contribuição

Para contribuir com o projeto:

1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request
