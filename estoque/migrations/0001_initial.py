from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ('catalogo', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Perda',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('quantidade', models.PositiveIntegerField(default=1)),
                ('motivo', models.CharField(choices=[('MURCHA', 'Murcha'), ('QUEBRA', 'Quebra'), ('PRAGA', 'Praga'), ('VENCIMENTO', 'Vencimento'), ('OUTRO', 'Outro')], default='OUTRO', max_length=20)),
                ('observacao', models.TextField(blank=True)),
                ('data', models.DateTimeField(auto_now_add=True)),
                ('planta', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='perdas', to='catalogo.planta')),
                ('usuario', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='perdas_registradas', to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ['-data']},
        ),
    ]
