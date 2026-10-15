from urllib.parse import quote

from django.db.models import Q
from django.http import Http404
from django.shortcuts import render

from catalogo.models import Categoria, Planta


def _categorias_disponiveis():
    return list(Categoria.objects.filter(plantas__ativo=True).distinct())


def home(request):
    destaques = Planta.objects.filter(ativo=True, destaque=True)[:4]
    contexto = {
        "produtos_destaque": destaques,
        "categorias": _categorias_disponiveis(),
    }
    return render(request, "loja/home.html", contexto)


def catalogo(request):
    categoria_slug = (request.GET.get("categoria") or "").strip()
    busca = (request.GET.get("q") or "").strip()
    faixa = request.GET.get("faixa") or ""
    apenas_estoque = request.GET.get("estoque") == "1"

    produtos = Planta.objects.filter(ativo=True)
    if categoria_slug:
        produtos = produtos.filter(categoria__slug=categoria_slug)
    if busca:
        produtos = produtos.filter(
            Q(nome_popular__icontains=busca) |
            Q(nome_cientifico__icontains=busca) |
            Q(categoria__nome__icontains=busca)
        )
    if faixa == "baixo":
        produtos = produtos.filter(preco__lt=100)
    elif faixa == "medio":
        produtos = produtos.filter(preco__gte=100, preco__lt=200)
    elif faixa == "alto":
        produtos = produtos.filter(preco__gte=200)
    if apenas_estoque:
        produtos = produtos.filter(estoque_atual__gt=0)

    contexto = {
        "produtos": produtos.order_by("nome_popular"),
        "categoria_atual": categoria_slug,
        "busca": busca,
        "categorias": _categorias_disponiveis(),
        "faixa": faixa,
        "apenas_estoque": apenas_estoque,
    }
    return render(request, "loja/catalogo.html", contexto)


def produto(request, produto_id):
    produto = Planta.objects.filter(pk=produto_id, ativo=True).first()
    if produto is None:
        raise Http404("Produto não encontrado.")

    produto_whatsapp = "https://wa.me/5511999999999?text=" + quote(
        f"Olá! Gostaria de pedir o produto {produto.nome_popular} por R$ {produto.preco:.2f}."
    )

    contexto = {
        "produto": produto,
        "produto_whatsapp": produto_whatsapp,
    }
    return render(request, "loja/produto.html", contexto)


def sobre(request):
    return render(request, "loja/sobre.html")


def contato(request):
    return render(request, "loja/contato.html")
