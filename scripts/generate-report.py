"""
NexusCS — System Overview Report (PDF)
Generates a multi-page PDF with charts and tables.
Requirements: pip install matplotlib
"""

import matplotlib
matplotlib.use('Agg')

import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages
from matplotlib.table import Table
import matplotlib.patches as mpatches
from datetime import datetime
import os

# ---------------------------------------------------------------------------
# Color palette
# ---------------------------------------------------------------------------
BLUE      = '#2563EB'
BLUE_L    = '#93C5FD'
GREEN     = '#16A34A'
GREEN_L   = '#86EFAC'
RED       = '#DC2626'
RED_L     = '#FCA5A5'
ORANGE    = '#EA580C'
ORANGE_L  = '#FDBA74'
PURPLE    = '#7C3AED'
GRAY      = '#6B7280'
GRAY_L    = '#E5E7EB'
DARK      = '#1F2937'
WHITE     = '#FFFFFF'
BG        = '#F9FAFB'

CHART_COLORS = ['#2563EB', '#7C3AED', '#16A34A', '#EA580C', '#DC2626',
                '#0891B2', '#CA8A04', '#DB2777', '#4F46E5']

# ---------------------------------------------------------------------------
# Data (from MCP queries)
# ---------------------------------------------------------------------------

active_contracts = [
    ('CloudBase',    25000),
    ('FinPay',       18000),
    ('TechNova',     12000),
    ('NordPay',       7000),
    ('MedVita',       6500),
    ('Elevate',       5500),
    ('RetailMax',     4500),
    ('GreenLeaf',     3500),
    ('DataStream',    3000),
]

total_arr = sum(v for _, v in active_contracts)

countries = {
    'Brazil': 7,
    'Argentina': 1,
    'Colombia': 1,
    'Mexico': 1,
    'United States': 1,
    'Chile (inactive)': 1,
    'Peru (inactive)': 1,
}

upsells = [
    ('CloudBase',   5000, 'Fev/26'),
    ('FinPay',      3000, 'Dez/25'),
    ('TechNova',    2000, 'Fev/26'),
    ('NordPay',     2000, 'Mar/26'),
    ('Elevate',     1500, 'Mar/26'),
    ('DataStream',  1000, 'Mar/26'),
    ('GreenLeaf',   1000, 'Mar/26'),
]

downsells = [
    ('RetailMax', -1500, 'Mar/26'),
    ('MedVita',   -1500, 'Jan/26'),
]

losses = [
    ('QuickShip',   'CHURN',       5000, 'Jan/26'),
    ('BrightPath',  'NOT_RENEWED', 4000, 'Fev/26'),
    ('UrbanLoft',   'CUT',         3500, 'Mar/26'),
]

team = [
    ('Ana Costa',       'Manager',  190, ['TechNova', 'MedVita', 'Elevate', 'GreenLeaf', 'CloudBase']),
    ('Lucas Ferreira',  'Manager',  170, ['TechNova', 'FinPay', 'CloudBase', 'NordPay']),
    ('Mariana Silva',   'Analyst',  165, ['TechNova', 'RetailMax', 'DataStream', 'MedVita', 'NordPay']),
    ('Pedro Melo',      'Admin',     20, ['FinPay', 'CloudBase']),
]

renewals_60d = [
    ('RetailMax',    4500,  '01/Mai'),
    ('DataStream',   3000,  '15/Mai'),
    ('TechNova',    12000,  '15/Jun'),
    ('Elevate',      5500,  '15/Jun'),
    ('NordPay',      7000,  '20/Jun'),
]

revenue_summary = {
    'upsell':      15500,
    'downsell':    -3000,
    'churn':       -8500,
    'cut':         -3500,
    'not_renewed': -4000,
}

monthly_timeline = [
    ('Out/25',  0,     0,      0),
    ('Nov/25',  0,     0,      0),
    ('Dez/25',  3000,  0,      0),
    ('Jan/26',  0,     -1500,  -5000),
    ('Fev/26',  7000,  0,      -4000),
    ('Mar/26',  5500,  -1500,  -3500),
]

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def add_title_page(pdf):
    fig = plt.figure(figsize=(11.69, 8.27))
    fig.patch.set_facecolor(DARK)

    fig.text(0.5, 0.62, 'NexusCS', fontsize=52, fontweight='bold',
             color=WHITE, ha='center', va='center', fontfamily='sans-serif')
    fig.text(0.5, 0.50, 'Relatório de Visão Geral do Sistema',
             fontsize=22, color=BLUE_L, ha='center', va='center', fontfamily='sans-serif')
    fig.text(0.5, 0.38, datetime.now().strftime('%d de %B de %Y'),
             fontsize=14, color=GRAY, ha='center', va='center', fontfamily='sans-serif')

    kpi_y = 0.20
    kpis = [
        (f'R$ {total_arr:,.0f}', 'ARR Total'),
        ('9', 'Contratos Ativos'),
        ('11', 'Clientes Ativos'),
        ('6', 'Colaboradores'),
    ]
    for i, (val, label) in enumerate(kpis):
        x = 0.15 + i * 0.20
        fig.text(x, kpi_y + 0.03, val, fontsize=20, fontweight='bold',
                 color=GREEN_L, ha='center', fontfamily='sans-serif')
        fig.text(x, kpi_y - 0.03, label, fontsize=10,
                 color=GRAY, ha='center', fontfamily='sans-serif')

    pdf.savefig(fig)
    plt.close(fig)


def add_arr_page(pdf):
    fig, axes = plt.subplots(1, 2, figsize=(11.69, 8.27),
                             gridspec_kw={'width_ratios': [3, 2]})
    fig.patch.set_facecolor(BG)
    fig.suptitle('Receita Recorrente (ARR)', fontsize=18, fontweight='bold',
                 color=DARK, y=0.95)

    # Bar chart — ARR by contract
    ax = axes[0]
    names = [c[0] for c in active_contracts]
    values = [c[1] for c in active_contracts]
    colors = CHART_COLORS[:len(names)]
    bars = ax.barh(names[::-1], values[::-1], color=colors[::-1], height=0.6, edgecolor='white')
    ax.set_xlabel('ARR (R$)', fontsize=10, color=GRAY)
    ax.set_title('ARR por Contrato Ativo', fontsize=13, fontweight='bold', color=DARK, pad=12)
    ax.spines[['top', 'right']].set_visible(False)
    ax.tick_params(colors=GRAY)
    for bar, val in zip(bars, values[::-1]):
        ax.text(bar.get_width() + 300, bar.get_y() + bar.get_height() / 2,
                f'R$ {val:,.0f}', va='center', fontsize=9, color=DARK)
    ax.set_xlim(0, max(values) * 1.25)

    # Pie chart — concentration
    ax2 = axes[1]
    top3 = sum(values[:3])
    rest = total_arr - top3
    ax2.pie([top3, rest], labels=[f'Top 3\n(R$ {top3:,.0f})', f'Outros\n(R$ {rest:,.0f})'],
            colors=[BLUE, GRAY_L], autopct='%1.0f%%', startangle=90,
            textprops={'fontsize': 10, 'color': DARK},
            wedgeprops={'edgecolor': 'white', 'linewidth': 2})
    ax2.set_title('Concentração de Receita', fontsize=13, fontweight='bold', color=DARK, pad=12)

    fig.tight_layout(rect=[0, 0.02, 1, 0.92])
    pdf.savefig(fig)
    plt.close(fig)


def add_movements_page(pdf):
    fig, axes = plt.subplots(2, 1, figsize=(11.69, 8.27), height_ratios=[1, 1])
    fig.patch.set_facecolor(BG)
    fig.suptitle('Movimentações Financeiras', fontsize=18, fontweight='bold',
                 color=DARK, y=0.96)

    # Waterfall-style — revenue summary
    ax = axes[0]
    categories = ['Upsells', 'Downsells', 'Churn', 'Cut', 'Not Renewed', 'Saldo']
    vals = [15500, -3000, -8500, -3500, -4000]
    net = sum(vals)
    vals.append(net)
    bar_colors = [GREEN if v > 0 else RED for v in vals]
    bar_colors[-1] = PURPLE

    bars = ax.bar(categories, vals, color=bar_colors, width=0.5, edgecolor='white', linewidth=1.5)
    ax.axhline(0, color=GRAY, linewidth=0.8)
    ax.set_title('Impacto Acumulado (All-Time)', fontsize=13, fontweight='bold', color=DARK, pad=10)
    ax.spines[['top', 'right']].set_visible(False)
    ax.tick_params(colors=GRAY)
    ax.set_ylabel('R$', color=GRAY)
    for bar, val in zip(bars, vals):
        y_pos = bar.get_height() + (400 if val >= 0 else -800)
        ax.text(bar.get_x() + bar.get_width() / 2, y_pos,
                f'{"+" if val > 0 else ""}R$ {val:,.0f}',
                ha='center', fontsize=9, fontweight='bold',
                color=GREEN if val > 0 else (PURPLE if bar == bars[-1] else RED))

    # Monthly timeline
    ax2 = axes[1]
    months = [m[0] for m in monthly_timeline]
    ups = [m[1] for m in monthly_timeline]
    downs = [m[2] for m in monthly_timeline]
    churns = [m[3] for m in monthly_timeline]

    x_pos = range(len(months))
    w = 0.25
    ax2.bar([x - w for x in x_pos], ups, w, color=GREEN, label='Upsell')
    ax2.bar(x_pos, downs, w, color=ORANGE, label='Downsell')
    ax2.bar([x + w for x in x_pos], churns, w, color=RED, label='Perda (Churn/Cut/NR)')
    ax2.set_xticks(x_pos)
    ax2.set_xticklabels(months)
    ax2.axhline(0, color=GRAY, linewidth=0.8)
    ax2.set_title('Timeline Mensal (Out/25 - Mar/26)', fontsize=13, fontweight='bold', color=DARK, pad=10)
    ax2.spines[['top', 'right']].set_visible(False)
    ax2.tick_params(colors=GRAY)
    ax2.set_ylabel('R$', color=GRAY)
    ax2.legend(fontsize=9, loc='lower left')

    fig.tight_layout(rect=[0, 0.02, 1, 0.93])
    pdf.savefig(fig)
    plt.close(fig)


def add_clients_page(pdf):
    fig, axes = plt.subplots(1, 2, figsize=(11.69, 8.27))
    fig.patch.set_facecolor(BG)
    fig.suptitle('Clientes', fontsize=18, fontweight='bold', color=DARK, y=0.95)

    # Country distribution
    ax = axes[0]
    c_names = list(countries.keys())
    c_vals = list(countries.values())
    c_colors = [RED_L if 'inactive' in n else BLUE for n in c_names]
    ax.barh(c_names[::-1], c_vals[::-1], color=c_colors[::-1], height=0.5, edgecolor='white')
    ax.set_title('Distribuição por País', fontsize=13, fontweight='bold', color=DARK, pad=12)
    ax.spines[['top', 'right']].set_visible(False)
    ax.tick_params(colors=GRAY)
    for i, (n, v) in enumerate(zip(c_names[::-1], c_vals[::-1])):
        ax.text(v + 0.1, i, str(v), va='center', fontsize=10, color=DARK, fontweight='bold')
    ax.set_xlim(0, max(c_vals) + 1.5)
    active_patch = mpatches.Patch(color=BLUE, label='Ativo')
    inactive_patch = mpatches.Patch(color=RED_L, label='Inativo')
    ax.legend(handles=[active_patch, inactive_patch], fontsize=9, loc='lower right')

    # Status pie
    ax2 = axes[1]
    ax2.pie([11, 3], labels=['Ativos (11)', 'Inativos (3)'],
            colors=[BLUE, RED_L], autopct='%1.0f%%', startangle=90,
            textprops={'fontsize': 11, 'color': DARK},
            wedgeprops={'edgecolor': 'white', 'linewidth': 2})
    ax2.set_title('Status dos Clientes', fontsize=13, fontweight='bold', color=DARK, pad=12)

    fig.tight_layout(rect=[0, 0.02, 1, 0.92])
    pdf.savefig(fig)
    plt.close(fig)


def add_team_page(pdf):
    fig, axes = plt.subplots(1, 2, figsize=(11.69, 8.27),
                             gridspec_kw={'width_ratios': [3, 2]})
    fig.patch.set_facecolor(BG)
    fig.suptitle('Equipe & Alocação', fontsize=18, fontweight='bold', color=DARK, y=0.95)

    # Allocation bar
    ax = axes[0]
    names = [t[0] for t in team]
    allocs = [t[2] for t in team]
    bar_colors = [RED if a > 100 else GREEN for a in allocs]
    bars = ax.barh(names[::-1], allocs[::-1], color=[c for c in bar_colors[::-1]],
                   height=0.5, edgecolor='white')
    ax.axvline(100, color=RED, linewidth=1.5, linestyle='--', alpha=0.7, label='Limite 100%')
    ax.set_xlabel('Alocação (%)', fontsize=10, color=GRAY)
    ax.set_title('Alocação Total por Colaborador', fontsize=13, fontweight='bold', color=DARK, pad=12)
    ax.spines[['top', 'right']].set_visible(False)
    ax.tick_params(colors=GRAY)
    for bar, val in zip(bars, allocs[::-1]):
        color = RED if val > 100 else GREEN
        ax.text(bar.get_width() + 2, bar.get_y() + bar.get_height() / 2,
                f'{val}%', va='center', fontsize=10, fontweight='bold', color=color)
    ax.set_xlim(0, 220)
    ax.legend(fontsize=9)

    # Contracts per person
    ax2 = axes[1]
    contract_counts = [len(t[3]) for t in team]
    colors = CHART_COLORS[:len(names)]
    ax2.bar(names, contract_counts, color=colors, width=0.5, edgecolor='white')
    ax2.set_title('Contratos Ativos por Pessoa', fontsize=13, fontweight='bold', color=DARK, pad=12)
    ax2.spines[['top', 'right']].set_visible(False)
    ax2.tick_params(colors=GRAY, axis='x', rotation=30)
    ax2.set_ylabel('Contratos', color=GRAY)
    for i, v in enumerate(contract_counts):
        ax2.text(i, v + 0.1, str(v), ha='center', fontweight='bold', fontsize=11, color=DARK)
    ax2.set_ylim(0, max(contract_counts) + 1)

    fig.tight_layout(rect=[0, 0.02, 1, 0.92])
    pdf.savefig(fig)
    plt.close(fig)


def add_renewals_page(pdf):
    fig = plt.figure(figsize=(11.69, 8.27))
    fig.patch.set_facecolor(BG)
    fig.suptitle('Renovações Próximas (60 dias) & Riscos', fontsize=18,
                 fontweight='bold', color=DARK, y=0.95)

    # Renewals bar
    ax = fig.add_axes([0.08, 0.45, 0.84, 0.42])
    r_names = [r[0] for r in renewals_60d]
    r_vals = [r[1] for r in renewals_60d]
    r_dates = [r[2] for r in renewals_60d]
    colors = [RED if v >= 10000 else ORANGE if v >= 5000 else BLUE for v in r_vals]

    bars = ax.barh(r_names[::-1], r_vals[::-1], color=colors[::-1], height=0.5, edgecolor='white')
    ax.set_xlabel('ARR em Risco (R$)', fontsize=10, color=GRAY)
    ax.set_title(f'R$ {sum(r_vals):,.0f} em ARR com renewal nos próximos 60 dias (38% do total)',
                 fontsize=12, fontweight='bold', color=RED, pad=12)
    ax.spines[['top', 'right']].set_visible(False)
    ax.tick_params(colors=GRAY)
    for bar, val, date in zip(bars, r_vals[::-1], r_dates[::-1]):
        ax.text(bar.get_width() + 200, bar.get_y() + bar.get_height() / 2,
                f'R$ {val:,.0f}  ({date})', va='center', fontsize=10, color=DARK)
    ax.set_xlim(0, max(r_vals) * 1.4)

    # Key risks text box
    ax2 = fig.add_axes([0.08, 0.05, 0.84, 0.30])
    ax2.axis('off')
    risks = [
        '1.  Concentrao de receita: CloudBase sozinha = 29% do ARR. Perda seria critica.',
        '2.  R$ 32k em renewal em 60 dias: 5 contratos precisam de atencao imediata.',
        '3.  Equipe sobrecarregada: 3 de 4 colaboradores acima de 100% de alocacao.',
        '4.  Rafael Oliveira (convidado) ainda nao aceitou convite — capacidade limitada.',
        '5.  Churn rate de 21%: 3 clientes perdidos de 14. QuickShip churnou apos renewal.',
    ]

    ax2.add_patch(plt.Rectangle((0, 0), 1, 1, transform=ax2.transAxes,
                                facecolor=WHITE, edgecolor=RED_L, linewidth=2, zorder=0))
    ax2.text(0.02, 0.92, 'Pontos de Atencao', fontsize=14, fontweight='bold',
             color=RED, transform=ax2.transAxes, va='top')
    for i, risk in enumerate(risks):
        ax2.text(0.03, 0.75 - i * 0.16, risk, fontsize=10, color=DARK,
                 transform=ax2.transAxes, va='top')

    pdf.savefig(fig)
    plt.close(fig)


# ---------------------------------------------------------------------------
# Generate PDF
# ---------------------------------------------------------------------------

output_path = os.path.join(os.path.dirname(__file__), '..', 'NexusCS_Report.pdf')
output_path = os.path.abspath(output_path)

with PdfPages(output_path) as pdf:
    add_title_page(pdf)
    add_arr_page(pdf)
    add_movements_page(pdf)
    add_clients_page(pdf)
    add_team_page(pdf)
    add_renewals_page(pdf)

print(f'Report generated: {output_path}')
