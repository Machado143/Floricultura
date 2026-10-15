from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, redirect, render

from entregas.models import Agendamento


@login_required
def entregas_listar(request):
    entregas = Agendamento.objects.select_related("pedido", "entregador").all()
    if request.user.perfil.papel == "ENTREGADOR":
        entregas = entregas.filter(entregador=request.user)
    return render(request, "entregas/listar.html", {"entregas": entregas})


@login_required
def atualizar_status(request, agendamento_id):
    agendamento = get_object_or_404(Agendamento, pk=agendamento_id)
    if request.method == "POST":
        agendamento.status = request.POST.get("status", agendamento.status)
        agendamento.entregador = request.user if request.user.perfil.papel == "ENTREGADOR" else agendamento.entregador
        agendamento.save(update_fields=["status", "entregador"])
        messages.success(request, "Status da entrega atualizado.")
    return redirect("entregas_listar")
