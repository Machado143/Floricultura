from decimal import Decimal

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db.models import Q
from django.shortcuts import get_object_or_404, redirect, render

from .models import Categoria, Planta


@login_required
def plantas_listar(request):
    q = (request.GET.get("q") or "").strip()
    categoria = request.GET.get("categoria")
    plantas = Planta.objects.select_related("categoria").all()
    if q:
        plantas = plantas.filter(Q(nome_popular__icontains=q) | Q(nome_cientifico__icontains=q))
    if categoria:
        plantas = plantas.filter(categoria_id=categoria)
    categorias = Categoria.objects.all()
    return render(request, "catalogo/listar.html", {"plantas": plantas, "categorias": categorias, "q": q, "categoria": categoria})


@login_required
def planta_criar(request):
    categorias = Categoria.objects.all()
    if request.method == "POST":
        categoria, _ = Categoria.objects.get_or_create(nome=request.POST.get("categoria_nome", "").strip(), defaults={"slug": request.POST.get("categoria_slug", "").strip() or request.POST.get("categoria_nome", "").strip().lower().replace(" ", "-")})
        planta = Planta.objects.create(
            nome_popular=request.POST.get("nome_popular", "").strip(),
            nome_cientifico=request.POST.get("nome_cientifico", "").strip(),
            categoria=categoria,
            preco=Decimal(request.POST.get("preco", "0")),
            estoque_atual=int(request.POST.get("estoque_atual", 0)),
            estoque_minimo=int(request.POST.get("estoque_minimo", 5)),
            imagem_url=request.POST.get("imagem_url", ""),
            ativo=request.POST.get("ativo") == "on",
            destaque=request.POST.get("destaque") == "on",
            luminosidade=request.POST.get("luminosidade", ""),
            rega=request.POST.get("rega", ""),
            temperatura=request.POST.get("temperatura", ""),
            toxicidade_pet=request.POST.get("toxicidade_pet", ""),
            porte=request.POST.get("porte", ""),
            dificuldade=request.POST.get("dificuldade", ""),
            descricao=request.POST.get("descricao", ""),
            guia_cuidados=request.POST.get("guia_cuidados", ""),
        )
        messages.success(request, "Planta cadastrada com sucesso.")
        return redirect("plantas_listar")
    return render(request, "catalogo/formulario.html", {"planta": None, "categorias": categorias})


@login_required
def planta_editar(request, planta_id):
    planta = get_object_or_404(Planta, pk=planta_id)
    categorias = Categoria.objects.all()
    if request.method == "POST":
        categoria_name = request.POST.get("categoria_nome", "").strip()
        if categoria_name:
            categoria, _ = Categoria.objects.get_or_create(nome=categoria_name, defaults={"slug": categoria_name.lower().replace(" ", "-")})
        else:
            categoria = planta.categoria
        planta.nome_popular = request.POST.get("nome_popular", planta.nome_popular).strip()
        planta.nome_cientifico = request.POST.get("nome_cientifico", planta.nome_cientifico).strip()
        planta.categoria = categoria
        planta.preco = Decimal(request.POST.get("preco", planta.preco))
        planta.estoque_atual = int(request.POST.get("estoque_atual", planta.estoque_atual))
        planta.estoque_minimo = int(request.POST.get("estoque_minimo", planta.estoque_minimo))
        planta.imagem_url = request.POST.get("imagem_url", planta.imagem_url)
        planta.ativo = request.POST.get("ativo") == "on"
        planta.destaque = request.POST.get("destaque") == "on"
        planta.luminosidade = request.POST.get("luminosidade", planta.luminosidade)
        planta.rega = request.POST.get("rega", planta.rega)
        planta.temperatura = request.POST.get("temperatura", planta.temperatura)
        planta.toxicidade_pet = request.POST.get("toxicidade_pet", planta.toxicidade_pet)
        planta.porte = request.POST.get("porte", planta.porte)
        planta.dificuldade = request.POST.get("dificuldade", planta.dificuldade)
        planta.descricao = request.POST.get("descricao", planta.descricao)
        planta.guia_cuidados = request.POST.get("guia_cuidados", planta.guia_cuidados)
        planta.save()
        messages.success(request, "Planta atualizada.")
        return redirect("plantas_listar")
    return render(request, "catalogo/formulario.html", {"planta": planta, "categorias": categorias})


@login_required
def planta_detalhe(request, planta_id):
    planta = get_object_or_404(Planta, pk=planta_id)
    return render(request, "catalogo/detalhe.html", {"planta": planta})
