from decimal import Decimal

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Categoria',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nome', models.CharField(max_length=100, unique=True)),
                ('slug', models.SlugField(unique=True)),
            ],
            options={
                'ordering': ['nome'],
                'verbose_name': 'Categoria',
                'verbose_name_plural': 'Categorias',
            },
        ),
        migrations.CreateModel(
            name='Planta',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nome_popular', models.CharField(max_length=200)),
                ('nome_cientifico', models.CharField(blank=True, max_length=200)),
                ('preco', models.DecimalField(decimal_places=2, max_digits=10)),
                ('estoque_atual', models.IntegerField(default=0)),
                ('estoque_minimo', models.IntegerField(default=5)),
                ('imagem_url', models.URLField(blank=True, max_length=500)),
                ('ativo', models.BooleanField(default=True)),
                ('destaque', models.BooleanField(default=False)),
                ('luminosidade', models.CharField(blank=True, max_length=100)),
                ('rega', models.CharField(blank=True, max_length=100)),
                ('temperatura', models.CharField(blank=True, max_length=100)),
                ('toxicidade_pet', models.CharField(blank=True, max_length=100)),
                ('porte', models.CharField(blank=True, max_length=100)),
                ('dificuldade', models.CharField(blank=True, max_length=100)),
                ('descricao', models.TextField(blank=True)),
                ('guia_cuidados', models.TextField(blank=True)),
                ('categoria', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='plantas', to='catalogo.categoria')),
            ],
            options={
                'ordering': ['nome_popular'],
                'verbose_name': 'Planta',
                'verbose_name_plural': 'Plantas',
            },
        ),
        migrations.AddField(
            model_name='planta',
            name='complementares',
            field=models.ManyToManyField(blank=True, related_name='complementares_rel_+', to='catalogo.planta'),
        ),
    ]
