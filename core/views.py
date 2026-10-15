from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db.models import Count, F, Q, Sum
from django.shortcuts import redirect, render
from django.utils import timezone

from catalogo.models import Planta
from clientes.models import Cliente
from entregas.models import Agendamento
from estoque.models import Perda
from usuarios.models import Perfil
from vendas.models import Pedido


def login_view(request):
    if request.user.is_authenticated:
        return redirect("painel")

    if request.method == "POST":
        username = request.POST.get("username", "").strip()
        password = request.POST.get("password", "")
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect("painel")
        messages.error(request, "Credenciais inválidas. Tente novamente.")

    return render(request, "registration/login.html")


@login_required
def logout_view(request):
    logout(request)
    return redirect("home")


@login_required
def painel(request):
    perfil = getattr(request.user, "perfil", None)
    papel = perfil.papel if perfil else "CAIXA"

    hoje = timezone.now().date()
    vendas_hoje = Pedido.objects.filter(criado_em__date=hoje, status="FINALIZADO").count()
    pedidos_hoje = Pedido.objects.filter(criado_em__date=hoje).count()
    entregas_pendentes = Agendamento.objects.filter(status__in=["AGENDADO", "EM_ROTA"]).count()
    estoque_baixo = Planta.objects.filter(estoque_atual__lte=F("estoque_minimo")).count()

    context = {
        "papel": papel,
        "vendas_hoje": vendas_hoje,
        "pedidos_hoje": pedidos_hoje,
        "entregas_pendentes": entregas_pendentes,
        "estoque_baixo": estoque_baixo,
    }
    return render(request, "core/painel.html", context)


@login_required
def busca_global(request):
    termo = request.GET.get("q", "").strip()
    resultados = {"plantas": [], "clientes": [], "pedidos": [], "entregas": []}
    if termo:
        resultados["plantas"] = list(
            Planta.objects.filter(ativo=True, nome_popular__icontains=termo)[:10]
        )
        resultados["clientes"] = list(Cliente.objects.filter(nome__icontains=termo)[:10])
        pedido_ids = []
        if termo.isdigit():
            pedido_ids = list(Pedido.objects.filter(pk=int(termo))[:10])
        resultados["pedidos"] = pedido_ids
        resultados["entregas"] = list(Agendamento.objects.filter(destinatario__icontains=termo)[:10])
    return render(request, "core/busca_global.html", {"termo": termo, "resultados": resultados})


@login_required
def estoque_alertas(request):
    plantas = Planta.objects.filter(estoque_atual__lte=Planta._meta.get_field("estoque_minimo"))
    return render(request, "core/estoque_alertas.html", {"plantas": plantas})


def pagina_403(request):
    return render(request, "403.html", status=403)
