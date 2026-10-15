from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db.models import Q
from django.shortcuts import get_object_or_404, redirect, render

from .models import Cliente


@login_required
def clientes_listar(request):
    q = (request.GET.get("q") or "").strip()
    clientes = Cliente.objects.all()
    if q:
        clientes = clientes.filter(Q(nome__icontains=q) | Q(telefone__icontains=q) | Q(email__icontains=q))
    return render(request, "clientes/listar.html", {"clientes": clientes, "q": q})


@login_required
def cliente_criar(request):
    if request.method == "POST":
        Cliente.objects.create(
            nome=request.POST.get("nome", "").strip(),
            telefone=request.POST.get("telefone", "").strip(),
            email=request.POST.get("email", "").strip(),
            cpf=request.POST.get("cpf", "").strip(),
            endereco=request.POST.get("endereco", "").strip(),
            observacoes=request.POST.get("observacoes", "").strip(),
        )
        messages.success(request, "Cliente cadastrado.")
        return redirect("clientes_listar")
    return render(request, "clientes/formulario.html", {"cliente": None})


@login_required
def cliente_editar(request, cliente_id):
    cliente = get_object_or_404(Cliente, pk=cliente_id)
    if request.method == "POST":
        cliente.nome = request.POST.get("nome", cliente.nome).strip()
        cliente.telefone = request.POST.get("telefone", cliente.telefone).strip()
        cliente.email = request.POST.get("email", cliente.email).strip()
        cliente.cpf = request.POST.get("cpf", cliente.cpf).strip()
        cliente.endereco = request.POST.get("endereco", cliente.endereco).strip()
        cliente.observacoes = request.POST.get("observacoes", cliente.observacoes).strip()
        cliente.save()
        messages.success(request, "Cliente atualizado.")
        return redirect("clientes_listar")
    return render(request, "clientes/formulario.html", {"cliente": cliente})
