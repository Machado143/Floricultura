from django.conf import settings
from django.db import models

from catalogo.models import Planta


class Perda(models.Model):
    MOTIVO_CHOICES = [
        ("MURCHA", "Murcha"),
        ("QUEBRA", "Quebra"),
        ("PRAGA", "Praga"),
        ("VENCIMENTO", "Vencimento"),
        ("OUTRO", "Outro"),
    ]

    planta = models.ForeignKey(Planta, on_delete=models.PROTECT, related_name="perdas")
    quantidade = models.PositiveIntegerField(default=1)
    motivo = models.CharField(max_length=20, choices=MOTIVO_CHOICES, default="OUTRO")
    observacao = models.TextField(blank=True)
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="perdas_registradas")
    data = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-data"]

    def __str__(self):
        return f"{self.planta.nome_popular} - {self.motivo}"
