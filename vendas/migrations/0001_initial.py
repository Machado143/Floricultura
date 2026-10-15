from decimal import Decimal

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ('catalogo', '0001_initial'),
        ('clientes', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Pedido',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(choices=[('ABERTO', 'Aberto'), ('FINALIZADO', 'Finalizado'), ('CANCELADO', 'Cancelado')], default='ABERTO', max_length=20)),
                ('forma_pagamento', models.CharField(choices=[('DINHEIRO', 'Dinheiro'), ('CARTAO', 'Cartão'), ('PIX', 'Pix'), ('CREDITO', 'Crédito')], default='PIX', max_length=20)),
                ('desconto', models.DecimalField(decimal_places=2, default=Decimal('0.00'), max_digits=10)),
                ('total', models.DecimalField(decimal_places=2, default=Decimal('0.00'), max_digits=12)),
                ('tipo', models.CharField(choices=[('BALCAO', 'Balcão'), ('ENTREGA', 'Entrega')], default='BALCAO', max_length=20)),
                ('criado_em', models.DateTimeField(auto_now_add=True)),
                ('guia_enviado_em', models.DateTimeField(blank=True, null=True)),
                ('cliente', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='pedidos', to='clientes.cliente')),
                ('vendedor', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='pedidos_vendidos', to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ['-criado_em']},
        ),
        migrations.CreateModel(
            name='ItemPedido',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('quantidade', models.PositiveIntegerField(default=1)),
                ('preco_unitario', models.DecimalField(decimal_places=2, max_digits=10)),
                ('pedido', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='itens', to='vendas.pedido')),
                ('planta', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='itens_pedido', to='catalogo.planta')),
            ],
            options={'ordering': ['id']},
        ),
    ]
