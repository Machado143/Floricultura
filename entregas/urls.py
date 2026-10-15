from django.urls import path

from . import views

urlpatterns = [
    path("", views.entregas_listar, name="entregas_listar"),
    path("<int:agendamento_id>/atualizar/", views.atualizar_status, name="atualizar_status"),
]
