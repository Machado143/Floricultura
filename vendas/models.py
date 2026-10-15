from decimal import Decimal

from django.conf import settings
from django.db import models

from catalogo.models import Planta
from clientes.models import Cliente


class Pedido(models.Model):
    STATUS_CHOICES = [
        ("ABERTO", "Aberto"),
        ("FINALIZADO", "Finalizado"),
        ("CANCELADO", "Cancelado"),
    ]
    TIPO_CHOICES = [
        ("BALCAO", "Balcão"),
        ("ENTREGA", "Entrega"),
    ]
    FORMA_PAGAMENTO_CHOICES = [
        ("DINHEIRO", "Dinheiro"),
        ("CARTAO", "Cartão"),
        ("PIX", "Pix"),
        ("CREDITO", "Crédito"),
    ]

    cliente = models.ForeignKey(Cliente, null=True, blank=True, on_delete=models.SET_NULL, related_name="pedidos")
    vendedor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="pedidos_vendidos")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="ABERTO")
    forma_pagamento = models.CharField(max_length=20, choices=FORMA_PAGAMENTO_CHOICES, default="PIX")
    desconto = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default="BALCAO")
    criado_em = models.DateTimeField(auto_now_add=True)
    guia_enviado_em = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-criado_em"]

    def __str__(self):
        return f"Pedido #{self.pk}"


class ItemPedido(models.Model):
    pedido = models.ForeignKey(Pedido, related_name="itens", on_delete=models.CASCADE)
    planta = models.ForeignKey(Planta, on_delete=models.PROTECT, related_name="itens_pedido")
    quantidade = models.PositiveIntegerField(default=1)
    preco_unitario = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.planta.nome_popular} x{self.quantidade}"

    @property
    def subtotal(self):
        return self.preco_unitario * self.quantidade
