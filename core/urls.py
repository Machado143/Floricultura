from django.urls import path

from . import views

urlpatterns = [
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),
    path("painel/", views.painel, name="painel"),
    path("403/", views.pagina_403, name="pagina_403"),
    path("buscar/", views.busca_global, name="busca_global"),
    path("estoque/alertas/", views.estoque_alertas, name="estoque_alertas"),
]
