from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ('vendas', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Agendamento',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('data', models.DateField()),
                ('janela_horario', models.CharField(max_length=50)),
                ('endereco_entrega', models.TextField()),
                ('destinatario', models.CharField(max_length=200)),
                ('mensagem_cartao', models.TextField(blank=True)),
                ('status', models.CharField(choices=[('AGENDADO', 'Agendado'), ('EM_ROTA', 'Em rota'), ('ENTREGUE', 'Entregue'), ('CANCELADO', 'Cancelado')], default='AGENDADO', max_length=20)),
                ('criado_em', models.DateTimeField(auto_now_add=True)),
                ('entregador', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='entregas', to=settings.AUTH_USER_MODEL)),
                ('pedido', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='agendamento', to='vendas.pedido')),
            ],
            options={'ordering': ['data', 'janela_horario']},
        ),
    ]
