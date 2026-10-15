# Flor & Cia Floricultura

Sistema de gestão para floricultura em Django, com vitrine pública, catálogo interno, clientes, PDV, estoque, entregas e autenticação de usuários.

## Requisitos

- Python 3.11+
- Pip
- PostgreSQL em produção (opcional em desenvolvimento)

## Configuração local

```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# Linux/macOS
# source .venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py setup_inicial
python manage.py runserver
```

Acesse: http://localhost:8000/

A conta administrativa padrão criada pelo setup inicial é:

- usuário: `admin`
- senha: `admin123` (ou a variável `ADMIN_PASSWORD`)

## Variáveis de ambiente

### Desenvolvimento local

```bash
export SECRET_KEY='sua-chave-secreta'
export DEBUG='True'
export ADMIN_PASSWORD='admin123'
```

### Produção / Vercel

Configure no painel da Vercel:

```bash
SECRET_KEY=sua-chave-super-secreta
DEBUG=False
ADMIN_PASSWORD=sua-senha-forte
DATABASE_URL=postgresql://usuario:senha@host:5432/banco
```

> Em produção, a aplicação usa `DATABASE_URL` com PostgreSQL. Se a variável não existir, o projeto usa SQLite local.

## Comandos úteis

```bash
python manage.py check
python manage.py migrate
python manage.py setup_inicial
python manage.py shell
```

## Deploy na Vercel

1. Faça o import do repositório.
2. Configure as variáveis de ambiente acima.
3. Use o arquivo `vercel.json` já preparado para WSGI/Python.
4. Faça o deploy.

O projeto usa WhiteNoise para servir arquivos estáticos em produção.

## Estrutura principal

- `loja/`: vitrine pública
- `catalogo/`: plantas e categorias
- `clientes/`: cadastro de clientes
- `vendas/`: PDV e pedidos
- `estoque/`: controle e perdas
- `entregas/`: agendamento e acompanhamento
- `usuarios/`: perfis e autenticação
- `core/`: painel, busca e setup inicial

## Licença

Projeto de gestão para floricultura em ambiente acadêmico/profissional.