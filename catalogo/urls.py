from django.urls import path

from . import views

urlpatterns = [
    path("", views.plantas_listar, name="plantas_listar"),
    path("novo/", views.planta_criar, name="planta_criar"),
    path("<int:planta_id>/", views.planta_detalhe, name="planta_detalhe"),
    path("<int:planta_id>/editar/", views.planta_editar, name="planta_editar"),
]
