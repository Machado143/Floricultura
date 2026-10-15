from decimal import Decimal

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.db.models import F, Sum
from django.shortcuts import get_object_or_404, redirect, render

from catalogo.models import Planta
from clientes.models import Cliente
from vendas.models import ItemPedido, Pedido


@login_required
def pdv(request):
    pedido = Pedido.objects.filter(vendedor=request.user, status="ABERTO").order_by("-criado_em").first()
    if not pedido:
        pedido = Pedido.objects.create(vendedor=request.user, status="ABERTO", tipo="BALCAO")
    plantas = Planta.objects.filter(ativo=True, estoque_atual__gt=0)
    clientes = Cliente.objects.all()[:10]
    if request.method == "POST":
        acao = request.POST.get("acao")
        if acao == "adicionar_item":
            planta_id = request.POST.get("planta_id")
            quantidade = int(request.POST.get("quantidade", 1))
            planta = get_object_or_404(Planta, pk=planta_id)
            item, created = ItemPedido.objects.get_or_create(pedido=pedido, planta=planta, defaults={"preco_unitario": planta.preco})
            if not created:
                item.quantidade += quantidade
            item.preco_unitario = planta.preco
            item.save()
            messages.success(request, f"{planta.nome_popular} adicionado ao carrinho.")
            return redirect("pdv")
        if acao == "atribuir_cliente":
            cliente_id = request.POST.get("cliente_id")
            if cliente_id:
                pedido.cliente_id = cliente_id
                pedido.save()
            return redirect("pdv")
        if acao == "finalizar":
            return redirect("finalizar_pedido", pedido_id=pedido.pk)
    total = sum(item.subtotal for item in pedido.itens.all())
    pedido.total = total
    pedido.save(update_fields=["total"])
    return render(request, "vendas/pdv.html", {"pedido": pedido, "plantas": plantas, "clientes": clientes, "total": total})


@login_required
def pedido_detalhe(request, pedido_id):
    pedido = get_object_or_404(Pedido, pk=pedido_id)
    return render(request, "vendas/detalhe.html", {"pedido": pedido})


@login_required
def finalizar_pedido(request, pedido_id):
    pedido = get_object_or_404(Pedido, pk=pedido_id, vendedor=request.user)
    if not pedido.itens.exists():
        messages.error(request, "Pedido vazio.")
        return redirect("pdv")
    with transaction.atomic():
        for item in pedido.itens.select_related("planta").all():
            planta = item.planta
            if planta.estoque_atual < item.quantidade:
                raise ValueError("Estoque insuficiente")
            Planta.objects.select_for_update().filter(pk=planta.pk).update(estoque_atual=F("estoque_atual") - item.quantidade)
        pedido.status = "FINALIZADO"
        pedido.total = sum(item.subtotal for item in pedido.itens.all())
        pedido.save(update_fields=["status", "total"]) 
    messages.success(request, "Pedido finalizado com sucesso.")
    return redirect("recibo", pedido_id=pedido.pk)


@login_required
def cancelar_pedido(request, pedido_id):
    pedido = get_object_or_404(Pedido, pk=pedido_id, vendedor=request.user)
    pedido.status = "CANCELADO"
    pedido.save(update_fields=["status"])
    messages.success(request, "Pedido cancelado.")
    return redirect("pdv")


@login_required
def recibo(request, pedido_id):
    pedido = get_object_or_404(Pedido, pk=pedido_id, vendedor=request.user)
    return render(request, "vendas/recibo.html", {"pedido": pedido})
