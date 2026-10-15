from django.urls import path

from . import views

urlpatterns = [
    path("pdv/", views.pdv, name="pdv"),
    path("<int:pedido_id>/", views.pedido_detalhe, name="pedido_detalhe"),
    path("<int:pedido_id>/recibo/", views.recibo, name="recibo"),
    path("<int:pedido_id>/finalizar/", views.finalizar_pedido, name="finalizar_pedido"),
    path("<int:pedido_id>/cancelar/", views.cancelar_pedido, name="cancelar_pedido"),
]
