from django.urls import path

from . import views

urlpatterns = [
    path("", views.estoque_listar, name="estoque_listar"),
    path("perdas/", views.perdas_listar, name="perdas_listar"),
    path("perdas/novo/", views.perda_criar, name="perda_criar"),
]
