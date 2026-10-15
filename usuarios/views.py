from django.contrib import messages
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404, redirect, render

from .models import Perfil


@login_required
@user_passes_test(lambda u: getattr(u, "perfil", None) and u.perfil.papel == "ADMIN")
def usuarios_listar(request):
    usuarios = User.objects.select_related("perfil").all()
    return render(request, "usuarios/listar.html", {"usuarios": usuarios})


@login_required
@user_passes_test(lambda u: getattr(u, "perfil", None) and u.perfil.papel == "ADMIN")
def usuario_criar(request):
    if request.method == "POST":
        username = (request.POST.get("username") or "").strip()
        email = (request.POST.get("email") or "").strip()
        password = request.POST.get("password") or "trocar123"
        papel = request.POST.get("papel", "CAIXA")
        if not username:
            messages.error(request, "Informe o nome de usuário.")
        else:
            user = User.objects.create_user(username=username, email=email, password=password)
            Perfil.objects.update_or_create(user=user, defaults={"papel": papel, "ativo": True})
            messages.success(request, "Usuário criado com sucesso.")
            return redirect("usuarios_listar")
    return render(request, "usuarios/formulario.html", {"usuario": None})


@login_required
@user_passes_test(lambda u: getattr(u, "perfil", None) and u.perfil.papel == "ADMIN")
def usuario_editar(request, usuario_id):
    usuario = get_object_or_404(User, pk=usuario_id)
    perfil = getattr(usuario, "perfil", None)
    if request.method == "POST":
        usuario.username = (request.POST.get("username") or usuario.username).strip()
        usuario.email = (request.POST.get("email") or "").strip()
        usuario.is_active = request.POST.get("is_active") == "on"
        usuario.save()
        Perfil.objects.update_or_create(
            user=usuario,
            defaults={"papel": request.POST.get("papel", getattr(perfil, "papel", "CAIXA")), "ativo": usuario.is_active},
        )
        messages.success(request, "Usuário atualizado.")
        return redirect("usuarios_listar")
    return render(request, "usuarios/formulario.html", {"usuario": usuario})


@login_required
@user_passes_test(lambda u: getattr(u, "perfil", None) and u.perfil.papel == "ADMIN")
def usuario_toggle(request, usuario_id):
    usuario = get_object_or_404(User, pk=usuario_id)
    usuario.is_active = not usuario.is_active
    usuario.save()
    messages.success(request, "Status do usuário atualizado.")
    return redirect("usuarios_listar")
