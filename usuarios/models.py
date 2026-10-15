from django.contrib.auth.models import User
from django.db import models


class Perfil(models.Model):
    PAPEL_CHOICES = [
        ("ADMIN", "Administrador"),
        ("GERENTE", "Gerente"),
        ("CAIXA", "Caixa"),
        ("ENTREGADOR", "Entregador"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="perfil")
    papel = models.CharField(max_length=20, choices=PAPEL_CHOICES, default="CAIXA")
    ativo = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} ({self.papel})"
