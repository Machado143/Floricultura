# Flor & Cia Floricultura

Loja floral em Django, pronta para deploy na Vercel, com catálogo de produtos em arquivo Python e sem banco de dados em produção.

## Como rodar localmente

```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/macOS
# source venv/bin/activate

pip install -r requirements.txt
python manage.py runserver
```

Acesse: http://localhost:8000/

## Deploy na Vercel

1. Importe este repositório para a Vercel.
2. Defina a variável de ambiente `SECRET_KEY` no painel da Vercel.
3. Faça o deploy.

Exemplo:

```bash
SECRET_KEY=sua-chave-super-secreta
```

> A aplicação foi configurada para funcionar sem banco de dados, usando dados em memória em `loja/data.py` e WhiteNoise para arquivos estáticos.

---

## 📅 Histórico de Entregas por Sprints

### 🟢 Sprint 1: Fundação & Core Operacional
- Autenticação e permissões de usuários.
- Catálogo de Produtos e Montagem de Kits em Pedido Único (**RF06 / RN02**).
- PDV com aplicação de descontos, troco e múltiplos pagamentos.
- Módulo de Registro de Perdas com Baixa Automática no Estoque (**RF10 / RN01**).
- Cadastro Unificado de Clientes (**CAIOX-62 / RF07**).

### 🟢 Sprint 2: Gestão Avançada & Pós-venda
- **CAIOX-95:** Vínculo de cliente ao pedido no PDV e emissão de comprovante/recibo.
- **CAIOX-96:** Agendamento e gestão de entregas com validação estrita (**RF08 / RN03**).
- **CAIOX-97:** Ficha Botânica Expandida e Venda Casada (**RF01 / RF03**).
- **CAIOX-98:** Guia de Cuidados via WhatsApp pós-venda, aberto para confirmação do atendente (**RF05**).
- **CAIOX-99:** Pesquisa Global, busca web e notificações de estoque zerado/baixo (**RF02 / RF11**).

---

## 📝 Licença

Este projeto foi desenvolvido como ERP acadêmico/profissional para a disciplina de Engenharia de Software e Gestão Ágil.