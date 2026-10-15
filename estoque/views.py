from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.db.models import F
from django.shortcuts import redirect, render

from catalogo.models import Planta
from estoque.models import Perda


@login_required
def estoque_listar(request):
    plantas = Planta.objects.order_by("nome_popular")
    return render(request, "estoque/listar.html", {"plantas": plantas})


@login_required
def perdas_listar(request):
    perdas = Perda.objects.select_related("planta", "usuario").all()
    return render(request, "estoque/perdas.html", {"perdas": perdas})


@login_required
def perda_criar(request):
    if request.method == "POST":
        planta_id = request.POST.get("planta_id")
        quantidade = int(request.POST.get("quantidade", 1))
        motivo = request.POST.get("motivo", "OUTRO")
        observacao = request.POST.get("observacao", "")
        planta = Planta.objects.get(pk=planta_id)
        with transaction.atomic():
            Planta.objects.select_for_update().filter(pk=planta.pk).update(estoque_atual=F("estoque_atual") - quantidade)
            Perda.objects.create(planta=planta, quantidade=quantidade, motivo=motivo, observacao=observacao, usuario=request.user)
        messages.success(request, "Perda registrada com baixa de estoque.")
        return redirect("estoque_listar")
    plantas = Planta.objects.filter(ativo=True)
    return render(request, "estoque/perda_form.html", {"plantas": plantas})
