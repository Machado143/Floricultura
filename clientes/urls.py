from django.urls import path

from . import views

urlpatterns = [
    path("", views.clientes_listar, name="clientes_listar"),
    path("novo/", views.cliente_criar, name="cliente_criar"),
    path("<int:cliente_id>/editar/", views.cliente_editar, name="cliente_editar"),
]
