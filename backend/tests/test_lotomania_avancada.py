#!/usr/bin/env python3
"""
Teste unitário para validar as novas funções de quadrante e o algoritmo
avançado de fechamento da Lotomania.

Roda diretamente sem necessidade de banco de dados ou servidor.
"""
import sys
import os

# Adiciona o diretório backend ao PYTHONPATH para importar os módulos
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.services.filters import (
    obter_quadrante,
    contar_quadrantes_ocupados,
    filtro_quadrantes
)
from app.services.combinatorics import (
    gerar_fechamento_lotomania_avancado,
    gerar_fechamento_guloso
)

import logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s - %(name)s - %(message)s')

PASSED = 0
FAILED = 0

def assert_eq(label, actual, expected):
    global PASSED, FAILED
    if actual == expected:
        PASSED += 1
        print(f"  ✅ {label}: {actual}")
    else:
        FAILED += 1
        print(f"  ❌ {label}: esperado={expected}, obtido={actual}")

def assert_true(label, condition):
    global PASSED, FAILED
    if condition:
        PASSED += 1
        print(f"  ✅ {label}")
    else:
        FAILED += 1
        print(f"  ❌ {label}: condição falsa")


# ═══════════════════════════════════════════════════════════════
# TESTE 1: Função obter_quadrante
# ═══════════════════════════════════════════════════════════════
print("\n" + "=" * 60)
print("TESTE 1: obter_quadrante(dezena)")
print("=" * 60)

assert_eq("Q0: dezena 1", obter_quadrante(1), 0)
assert_eq("Q0: dezena 4", obter_quadrante(4), 0)
assert_eq("Q1: dezena 5", obter_quadrante(5), 1)
assert_eq("Q1: dezena 8", obter_quadrante(8), 1)
assert_eq("Q12: dezena 50", obter_quadrante(50), 12)
assert_eq("Q24: dezena 97", obter_quadrante(97), 24)
assert_eq("Q24: dezena 100", obter_quadrante(100), 24)


# ═══════════════════════════════════════════════════════════════
# TESTE 2: Função contar_quadrantes_ocupados
# ═══════════════════════════════════════════════════════════════
print("\n" + "=" * 60)
print("TESTE 2: contar_quadrantes_ocupados(jogo)")
print("=" * 60)

# Jogo com 4 dezenas todas no mesmo quadrante
assert_eq("4 dezenas no Q0", contar_quadrantes_ocupados([1, 2, 3, 4]), 1)

# Jogo com dezenas em 2 quadrantes
assert_eq("2 quadrantes", contar_quadrantes_ocupados([1, 2, 5, 6]), 2)

# Jogo com dezenas espalhadas em 25 quadrantes (uma de cada)
jogo_espalhado = [1, 5, 9, 13, 17, 21, 25, 29, 33, 37, 41, 45, 49,
                  53, 57, 61, 65, 69, 73, 77, 81, 85, 89, 93, 97]
assert_eq("25 quadrantes (máx espalhamento)", contar_quadrantes_ocupados(jogo_espalhado), 25)


# ═══════════════════════════════════════════════════════════════
# TESTE 3: Função filtro_quadrantes
# ═══════════════════════════════════════════════════════════════
print("\n" + "=" * 60)
print("TESTE 3: filtro_quadrantes(jogo, max_quadrantes)")
print("=" * 60)

# Bilhete concentrado (deve passar com max=15)
jogo_concentrado = list(range(1, 51))  # dezenas 1-50 = 13 quadrantes
qtd = contar_quadrantes_ocupados(jogo_concentrado)
print(f"  Info: jogo [1..50] usa {qtd} quadrantes")
assert_true(f"jogo [1..50] passa com max=15 ({qtd} quadrantes)", filtro_quadrantes(jogo_concentrado, 15))

# Bilhete muito espalhado (deve falhar com max=15)
jogo_muito_espalhado = list(range(1, 101, 2))[:50]  # ímpares de 1 a 99
qtd_esp = contar_quadrantes_ocupados(jogo_muito_espalhado)
print(f"  Info: jogo ímpares usa {qtd_esp} quadrantes")
if qtd_esp > 15:
    assert_true(f"jogo ímpares NÃO passa com max=15 ({qtd_esp} quadrantes)", not filtro_quadrantes(jogo_muito_espalhado, 15))
else:
    assert_true(f"jogo ímpares passa com max=15 ({qtd_esp} quadrantes)", filtro_quadrantes(jogo_muito_espalhado, 15))


# ═══════════════════════════════════════════════════════════════
# TESTE 4: Algoritmo clássico (atalho pior caso) — N=52, garantia=17
# ═══════════════════════════════════════════════════════════════
print("\n" + "=" * 60)
print("TESTE 4: Atalho matemático (pior caso)")
print("=" * 60)

# Com 52 dezenas, condição 20, garantia 17:
# pior_caso = 50 - (52 - 20) = 18 >= 17, então deve retornar 1 bilhete
dezenas_52 = list(range(1, 53))
jogos_atalho = gerar_fechamento_guloso(
    dezenas_escolhidas=dezenas_52,
    tamanho_bilhete=50,
    garantia_acerto=17,
    condicao_acerto=20
)
assert_eq("N=52, garantia=17: deve retornar 1 bilhete (atalho)", len(jogos_atalho), 1)
assert_eq("Bilhete tem 50 dezenas", len(jogos_atalho[0]), 50)


# ═══════════════════════════════════════════════════════════════
# TESTE 5: Algoritmo AVANÇADO — N=56 dezenas (caso mínimo)
# ═══════════════════════════════════════════════════════════════
print("\n" + "=" * 60)
print("TESTE 5: Algoritmo avançado Lotomania (N=56, garantia=16)")
print("=" * 60)

dezenas_56 = list(range(1, 57))
jogos_56 = gerar_fechamento_lotomania_avancado(
    dezenas_escolhidas=dezenas_56,
    tamanho_bilhete=50,
    garantia_acerto=16,
    condicao_acerto=20,
    max_quadrantes=15
)
print(f"  Resultado: {len(jogos_56)} cartões gerados")
assert_true("Gerou pelo menos 1 cartão", len(jogos_56) >= 1)
assert_true("Cada cartão tem 50 dezenas", all(len(j) == 50 for j in jogos_56))
assert_true("Dezenas estão ordenadas", all(j == sorted(j) for j in jogos_56))
assert_true("Todas dezenas válidas (1-56)", all(all(1 <= d <= 56 for d in j) for j in jogos_56))

# Verifica filtro de quadrantes nos resultados
quadrantes_ok = all(contar_quadrantes_ocupados(j) <= 15 for j in jogos_56)
assert_true("Todos os bilhetes respeitam o filtro de <= 15 quadrantes", quadrantes_ok)


# ═══════════════════════════════════════════════════════════════
# TESTE 6: Algoritmo AVANÇADO — N=70 dezenas (caso top da estratégia)
# ═══════════════════════════════════════════════════════════════
print("\n" + "=" * 60)
print("TESTE 6: Algoritmo avançado Lotomania (N=70, garantia=16)")
print("  >> Este teste pode levar 30-60 segundos...")
print("=" * 60)

dezenas_70 = list(range(1, 71))
jogos_70 = gerar_fechamento_lotomania_avancado(
    dezenas_escolhidas=dezenas_70,
    tamanho_bilhete=50,
    garantia_acerto=16,
    condicao_acerto=20,
    max_quadrantes=15
)
print(f"  Resultado: {len(jogos_70)} cartões gerados")
assert_true("Gerou pelo menos 1 cartão", len(jogos_70) >= 1)
assert_true("Cada cartão tem 50 dezenas", all(len(j) == 50 for j in jogos_70))
assert_true("Todas dezenas são das 70 escolhidas", all(all(d in dezenas_70 for d in j) for j in jogos_70))

# Verifica quadrantes em todos os bilhetes
quadrantes_70 = [contar_quadrantes_ocupados(j) for j in jogos_70]
max_q_encontrado = max(quadrantes_70) if quadrantes_70 else 0
assert_true(f"Máx quadrantes por bilhete: {max_q_encontrado} (<=15)", max_q_encontrado <= 15)

# Custo estimado
custo = len(jogos_70) * 3.00
print(f"\n  📊 Resumo do fechamento N=70:")
print(f"     Cartões: {len(jogos_70)}")
print(f"     Custo estimado: R$ {custo:.2f}")
print(f"     Quadrantes por bilhete: min={min(quadrantes_70)}, max={max(quadrantes_70)}")


# ═══════════════════════════════════════════════════════════════
# RESULTADO FINAL
# ═══════════════════════════════════════════════════════════════
print("\n" + "=" * 60)
print(f"RESULTADO FINAL: {PASSED} passou(aram), {FAILED} falhou(aram)")
print("=" * 60)

if FAILED > 0:
    sys.exit(1)
else:
    print("🎉 Todos os testes passaram!")
    sys.exit(0)
