from django.conf import settings
from django.db import models

from vendas.models import Pedido


class Agendamento(models.Model):
    STATUS_CHOICES = [
        ("AGENDADO", "Agendado"),
        ("EM_ROTA", "Em rota"),
        ("ENTREGUE", "Entregue"),
        ("CANCELADO", "Cancelado"),
    ]

    pedido = models.OneToOneField(Pedido, on_delete=models.CASCADE, related_name="agendamento")
    data = models.DateField()
    janela_horario = models.CharField(max_length=50)
    endereco_entrega = models.TextField()
    destinatario = models.CharField(max_length=200)
    mensagem_cartao = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="AGENDADO")
    entregador = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="entregas")
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["data", "janela_horario"]

    def __str__(self):
        return f"Entrega #{self.pedido_id} - {self.destinatario}"
