from django.db import models


class Categoria(models.Model):
    nome = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)

    class Meta:
        ordering = ["nome"]
        verbose_name = "Categoria"
        verbose_name_plural = "Categorias"

    def __str__(self):
        return self.nome


class Planta(models.Model):
    nome_popular = models.CharField(max_length=200)
    nome_cientifico = models.CharField(max_length=200, blank=True)
    categoria = models.ForeignKey("catalogo.Categoria", on_delete=models.PROTECT, related_name="plantas")
    preco = models.DecimalField(max_digits=10, decimal_places=2)
    estoque_atual = models.IntegerField(default=0)
    estoque_minimo = models.IntegerField(default=5)
    imagem_url = models.URLField(max_length=500, blank=True)
    ativo = models.BooleanField(default=True)
    destaque = models.BooleanField(default=False)
    luminosidade = models.CharField(max_length=100, blank=True)
    rega = models.CharField(max_length=100, blank=True)
    temperatura = models.CharField(max_length=100, blank=True)
    toxicidade_pet = models.CharField(max_length=100, blank=True)
    porte = models.CharField(max_length=100, blank=True)
    dificuldade = models.CharField(max_length=100, blank=True)
    descricao = models.TextField(blank=True)
    guia_cuidados = models.TextField(blank=True)
    complementares = models.ManyToManyField("self", blank=True, symmetrical=False)

    class Meta:
        ordering = ["nome_popular"]
        verbose_name = "Planta"
        verbose_name_plural = "Plantas"

    def __str__(self):
        return self.nome_popular

    @property
    def nome(self):
        return self.nome_popular

    @property
    def imagem(self):
        return self.imagem_url or "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=900&q=80"

    @property
    def categoria_nome(self):
        return self.categoria.nome if self.categoria else ""
