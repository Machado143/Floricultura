from django.urls import path

from . import views

urlpatterns = [
    path("", views.usuarios_listar, name="usuarios_listar"),
    path("novo/", views.usuario_criar, name="usuario_criar"),
    path("<int:usuario_id>/editar/", views.usuario_editar, name="usuario_editar"),
    path("<int:usuario_id>/toggle/", views.usuario_toggle, name="usuario_toggle"),
]
