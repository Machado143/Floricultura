from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, path

urlpatterns = [
    path("", include("loja.urls")),
    path("", include("core.urls")),
    path("usuarios/", include("usuarios.urls")),
    path("plantas/", include("catalogo.urls")),
    path("clientes/", include("clientes.urls")),
    path("vendas/", include("vendas.urls")),
    path("estoque/", include("estoque.urls")),
    path("entregas/", include("entregas.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
