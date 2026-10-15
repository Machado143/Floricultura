from functools import wraps

from django.core.exceptions import PermissionDenied
from django.shortcuts import render


def papel_required(*papels):
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            perfil = getattr(request.user, "perfil", None)
            if not request.user.is_authenticated:
                raise PermissionDenied
            if perfil is None or perfil.papel not in papels:
                raise PermissionDenied
            return view_func(request, *args, **kwargs)

        return _wrapped_view

    return decorator


def papel_mixin(*papels):
    class PapelMixin:
        def dispatch(self, request, *args, **kwargs):
            perfil = getattr(request.user, "perfil", None)
            if not request.user.is_authenticated:
                return render(request, "403.html", status=403)
            if perfil is None or perfil.papel not in papels:
                return render(request, "403.html", status=403)
            return super().dispatch(request, *args, **kwargs)

    return PapelMixin
