import os
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.text import slugify

from catalogo.models import Categoria, Planta
from usuarios.models import Perfil


PLANTAS_INICIAIS = [
    {
        "nome_popular": "Buquê de Rosas Premium",
        "nome_cientifico": "Rosa hybrida",
        "categoria": "Buquês",
        "preco": "169.90",
        "estoque_atual": 32,
        "estoque_minimo": 8,
        "imagem_url": "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=900&q=80",
        "destaque": True,
        "luminosidade": "Meia sombra",
        "rega": "2 a 3 vezes por semana",
        "temperatura": "18°C a 24°C",
        "toxicidade_pet": "Alta",
        "porte": "Médio",
        "dificuldade": "Baixa",
        "descricao": "Buquê elegante para ocasiões especiais, com rosas premium e acabamento sofisticado.",
        "guia_cuidados": "Manter em local fresco, hidratar as hastes e trocar a água a cada 24h.",
    },
    {
        "nome_popular": "Arranjo de Girassóis",
        "nome_cientifico": "Helianthus annuus",
        "categoria": "Arranjos",
        "preco": "129.90",
        "estoque_atual": 18,
        "estoque_minimo": 6,
        "imagem_url": "https://images.unsplash.com/photo-1468327768560-75b778cbb551?auto=format&fit=crop&w=900&q=80",
        "destaque": True,
        "luminosidade": "Sol pleno",
        "rega": "Semanal",
        "temperatura": "20°C a 28°C",
        "toxicidade_pet": "Baixa",
        "porte": "Médio",
        "dificuldade": "Baixa",
        "descricao": "Composição vibrante com girassóis e folhagens para ambientes alegres.",
        "guia_cuidados": "Coloque em lugar iluminado e remova folhas abaixo da água para manter a flor fresca.",
    },
    {
        "nome_popular": "Orquídeas em Vaso",
        "nome_cientifico": "Orchidaceae",
        "categoria": "Plantas",
        "preco": "219.90",
        "estoque_atual": 16,
        "estoque_minimo": 5,
        "imagem_url": "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=900&q=80",
        "destaque": True,
        "luminosidade": "Indireta",
        "rega": "A cada 7 a 10 dias",
        "temperatura": "18°C a 25°C",
        "toxicidade_pet": "Baixa",
        "porte": "Pequeno",
        "dificuldade": "Média",
        "descricao": "Orquídeas em vaso com visual refinado e longa duração para decoração elegante.",
        "guia_cuidados": "Evite sol direto e mantenha o vaso com uma pequena quantidade de água na bandeja.",
    },
    {
        "nome_popular": "Cesta de Flores do Campo",
        "nome_cientifico": "Mix floral campestre",
        "categoria": "Presentes",
        "preco": "159.90",
        "estoque_atual": 12,
        "estoque_minimo": 5,
        "imagem_url": "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=900&q=80",
        "destaque": True,
        "luminosidade": "Meia sombra",
        "rega": "2 vezes por semana",
        "temperatura": "18°C a 26°C",
        "toxicidade_pet": "Média",
        "porte": "Médio",
        "dificuldade": "Baixa",
        "descricao": "Cesta charmosa com flores variadas e acabamento natural para presentear.",
        "guia_cuidados": "Aqueça o arranjo em local com boa ventilação e água limpa.",
    },
    {
        "nome_popular": "Bouquet de Flores Mistas",
        "nome_cientifico": "Floral mix",
        "categoria": "Buquês",
        "preco": "149.90",
        "estoque_atual": 28,
        "estoque_minimo": 7,
        "imagem_url": "https://images.unsplash.com/photo-1526045478516-99145907023c?auto=format&fit=crop&w=900&q=80",
        "destaque": False,
        "luminosidade": "Meia sombra",
        "rega": "2 vezes por semana",
        "temperatura": "18°C a 24°C",
        "toxicidade_pet": "Média",
        "porte": "Médio",
        "dificuldade": "Baixa",
        "descricao": "Mistura equilibrada de rosas, lírios e folhas para ocasiões especiais.",
        "guia_cuidados": "Mantenha em vaso com água sempre fresca e remova flores murchas.",
    },
    {
        "nome_popular": "Mini Arranjo de Eucalyptus",
        "nome_cientifico": "Eucalyptus globulus",
        "categoria": "Arranjos",
        "preco": "99.90",
        "estoque_atual": 22,
        "estoque_minimo": 6,
        "imagem_url": "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=900&q=80",
        "destaque": False,
        "luminosidade": "Luz indireta",
        "rega": "Semanal",
        "temperatura": "16°C a 24°C",
        "toxicidade_pet": "Baixa",
        "porte": "Pequeno",
        "dificuldade": "Baixa",
        "descricao": "Sofisticado e leve, ideal para ambientes discretos e elegantes.",
        "guia_cuidados": "Mantenha em local fresco e troque a água ao perceber resíduos.",
    },
    {
        "nome_popular": "Suculentas em Conjunto",
        "nome_cientifico": "Succulentaceae",
        "categoria": "Plantas",
        "preco": "89.90",
        "estoque_atual": 24,
        "estoque_minimo": 8,
        "imagem_url": "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=900&q=80",
        "destaque": False,
        "luminosidade": "Sol indireto",
        "rega": "A cada 10 a 14 dias",
        "temperatura": "20°C a 30°C",
        "toxicidade_pet": "Baixa",
        "porte": "Pequeno",
        "dificuldade": "Baixa",
        "descricao": "Conjunto moderno de suculentas para decorar ambientes com estilo clean.",
        "guia_cuidados": "Use vasos com drenagem e regue pouco, evitando encharcar o substrato.",
    },
    {
        "nome_popular": "Kit de Presentes Florais",
        "nome_cientifico": "Gift floral",
        "categoria": "Presentes",
        "preco": "239.90",
        "estoque_atual": 10,
        "estoque_minimo": 4,
        "imagem_url": "https://images.unsplash.com/photo-1519378058457-4c29a0a2efac?auto=format&fit=crop&w=900&q=80",
        "destaque": False,
        "luminosidade": "Meia sombra",
        "rega": "2 vezes por semana",
        "temperatura": "18°C a 25°C",
        "toxicidade_pet": "Média",
        "porte": "Médio",
        "dificuldade": "Baixa",
        "descricao": "Combo com buquê, cartão personalizado e embalagem premium.",
        "guia_cuidados": "Armazene em local arejado e mantenha a embalagem protegida até a entrega.",
    },
    {
        "nome_popular": "Ramo de Tulipas",
        "nome_cientifico": "Tulipa gesneriana",
        "categoria": "Buquês",
        "preco": "139.90",
        "estoque_atual": 20,
        "estoque_minimo": 6,
        "imagem_url": "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=900&q=80",
        "destaque": False,
        "luminosidade": "Meia sombra",
        "rega": "2 vezes por semana",
        "temperatura": "15°C a 22°C",
        "toxicidade_pet": "Baixa",
        "porte": "Médio",
        "dificuldade": "Baixa",
        "descricao": "Tulipas delicadas e em tom pastel para um presente sofisticado e leve.",
        "guia_cuidados": "A água deve ser trocada a cada dia e as hastes devem ficar sempre hidratadas.",
    },
    {
        "nome_popular": "Arranjo de Flores Brancas",
        "nome_cientifico": "Floral branco",
        "categoria": "Arranjos",
        "preco": "179.90",
        "estoque_atual": 14,
        "estoque_minimo": 5,
        "imagem_url": "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=900&q=80",
        "destaque": False,
        "luminosidade": "Meia sombra",
        "rega": "2 vezes por semana",
        "temperatura": "18°C a 24°C",
        "toxicidade_pet": "Baixa",
        "porte": "Médio",
        "dificuldade": "Baixa",
        "descricao": "Elegância clássica em tons brancos e verdes para eventos e celebrações.",
        "guia_cuidados": "Leve a composição para um ambiente iluminado e com ventilação suave.",
    },
    {
        "nome_popular": "Samambaia de Mesa",
        "nome_cientifico": "Nephrolepis exaltata",
        "categoria": "Plantas",
        "preco": "79.90",
        "estoque_atual": 26,
        "estoque_minimo": 7,
        "imagem_url": "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=900&q=80",
        "destaque": False,
        "luminosidade": "Meia sombra",
        "rega": "2 a 3 vezes por semana",
        "temperatura": "18°C a 26°C",
        "toxicidade_pet": "Baixa",
        "porte": "Pequeno",
        "dificuldade": "Baixa",
        "descricao": "Folhagem exuberante para compor mesas, cozinhas e ambientes aconchegantes.",
        "guia_cuidados": "Regue quando o substrato secar um pouco e evite excesso de água.",
    },
    {
        "nome_popular": "Caixa de Flores com Chocolate",
        "nome_cientifico": "Floral gourmet",
        "categoria": "Presentes",
        "preco": "189.90",
        "estoque_atual": 11,
        "estoque_minimo": 5,
        "imagem_url": "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=900&q=80",
        "destaque": False,
        "luminosidade": "Ambiente interno",
        "rega": "Semanal",
        "temperatura": "18°C a 25°C",
        "toxicidade_pet": "Baixa",
        "porte": "Médio",
        "dificuldade": "Baixa",
        "descricao": "Combinação irresistível com flores frescas e pequenos itens premium.",
        "guia_cuidados": "Manter em local seco e fresquinho, longe do calor direto.",
    },
    {
        "nome_popular": "Buquê de Lilis",
        "nome_cientifico": "Lilium candidum",
        "categoria": "Buquês",
        "preco": "185.90",
        "estoque_atual": 17,
        "estoque_minimo": 6,
        "imagem_url": "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=900&q=80",
        "destaque": False,
        "luminosidade": "Meia sombra",
        "rega": "2 vezes por semana",
        "temperatura": "18°C a 23°C",
        "toxicidade_pet": "Alta",
        "porte": "Médio",
        "dificuldade": "Média",
        "descricao": "Lírios delicados em composição sofisticada e perfumada.",
        "guia_cuidados": "Use água limpa e mantenha a base da haste bem hidratada.",
    },
    {
        "nome_popular": "Vaso de Hortênsias",
        "nome_cientifico": "Hydrangea macrophylla",
        "categoria": "Plantas",
        "preco": "149.90",
        "estoque_atual": 15,
        "estoque_minimo": 5,
        "imagem_url": "https://images.unsplash.com/photo-1468327768560-75b778cbb551?auto=format&fit=crop&w=900&q=80",
        "destaque": False,
        "luminosidade": "Luz filtrada",
        "rega": "3 vezes por semana",
        "temperatura": "17°C a 24°C",
        "toxicidade_pet": "Baixa",
        "porte": "Médio",
        "dificuldade": "Média",
        "descricao": "Hortênsias exuberantes para decorar ambientes elegantes e acolhedores.",
        "guia_cuidados": "Evite sol forte e mantenha a terra sempre úmida sem encharcar.",
    },
    {
        "nome_popular": "Inclinação de Fiori",
        "nome_cientifico": "Floral premium",
        "categoria": "Arranjos",
        "preco": "229.90",
        "estoque_atual": 9,
        "estoque_minimo": 3,
        "imagem_url": "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=900&q=80",
        "destaque": False,
        "luminosidade": "Meia sombra",
        "rega": "2 vezes por semana",
        "temperatura": "18°C a 24°C",
        "toxicidade_pet": "Média",
        "porte": "Grande",
        "dificuldade": "Média",
        "descricao": "Arranjo majestoso com flores em camadas e composição premium.",
        "guia_cuidados": "Coloque em local de destaque e mantenha a água sempre fresca.",
    },
]


class Command(BaseCommand):
    help = "Cria os perfis iniciais, usuário admin e catálogo base do sistema." 

    @transaction.atomic
    def handle(self, *args, **options):
        admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
        User = get_user_model()

        admin_user, created = User.objects.get_or_create(
            username="admin",
            defaults={"email": "admin@florenciacia.com.br", "is_staff": True, "is_superuser": True},
        )
        admin_user.set_password(admin_password)
        admin_user.save()
        Perfil.objects.update_or_create(user=admin_user, defaults={"papel": "ADMIN", "ativo": True})

        self.stdout.write(self.style.SUCCESS(f"Usuário admin ok: {admin_user.username} / senha via ADMIN_PASSWORD"))

        categoria_map = {}
        for nome in ["Buquês", "Arranjos", "Plantas", "Presentes"]:
            categoria, _ = Categoria.objects.get_or_create(
                nome=nome,
                defaults={"slug": slugify(nome)},
            )
            categoria_map[nome] = categoria

        for item in PLANTAS_INICIAIS:
            planta, created = Planta.objects.get_or_create(
                nome_popular=item["nome_popular"],
                defaults={
                    "nome_cientifico": item["nome_cientifico"],
                    "categoria": categoria_map[item["categoria"]],
                    "preco": Decimal(item["preco"]),
                    "estoque_atual": item["estoque_atual"],
                    "estoque_minimo": item["estoque_minimo"],
                    "imagem_url": item["imagem_url"],
                    "ativo": True,
                    "destaque": item["destaque"],
                    "luminosidade": item["luminosidade"],
                    "rega": item["rega"],
                    "temperatura": item["temperatura"],
                    "toxicidade_pet": item["toxicidade_pet"],
                    "porte": item["porte"],
                    "dificuldade": item["dificuldade"],
                    "descricao": item["descricao"],
                    "guia_cuidados": item["guia_cuidados"],
                },
            )
            if not created:
                planta.nome_cientifico = item["nome_cientifico"]
                planta.categoria = categoria_map[item["categoria"]]
                planta.preco = Decimal(item["preco"])
                planta.estoque_atual = item["estoque_atual"]
                planta.estoque_minimo = item["estoque_minimo"]
                planta.imagem_url = item["imagem_url"]
                planta.ativo = True
                planta.destaque = item["destaque"]
                planta.luminosidade = item["luminosidade"]
                planta.rega = item["rega"]
                planta.temperatura = item["temperatura"]
                planta.toxicidade_pet = item["toxicidade_pet"]
                planta.porte = item["porte"]
                planta.dificuldade = item["dificuldade"]
                planta.descricao = item["descricao"]
                planta.guia_cuidados = item["guia_cuidados"]
                planta.save()

        self.stdout.write(self.style.SUCCESS("Catálogo inicial ok: %s plantas." % Planta.objects.count()))
