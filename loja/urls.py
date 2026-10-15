from django.urls import path

from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("catalogo/", views.catalogo, name="catalogo"),
    path("produto/<int:produto_id>/", views.produto, name="produto"),
    path("sobre/", views.sobre, name="sobre"),
    path("contato/", views.contato, name="contato"),
]
