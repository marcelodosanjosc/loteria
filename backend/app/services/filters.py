from typing import List, Set, Dict, Any

# Listas estáticas auxiliares para números de 1 a 100
PRIMOS = {2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97}
FIBONACCI = {1, 2, 3, 5, 8, 13, 21, 34, 55, 89}

# Molduras clássicas baseadas nas grades físicas das loterias
MOLDURA_LOTOFACIL = {1, 2, 3, 4, 5, 6, 10, 11, 15, 16, 20, 21, 22, 23, 24, 25}
MOLDURA_MEGA_SENA = {
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    11, 20, 21, 30, 31, 40, 41, 50,
    51, 52, 53, 54, 55, 56, 57, 58, 59, 60
}
MOLDURA_QUINA = set(range(1, 11)) | {11, 21, 31, 41, 51, 61, 71, 20, 30, 40, 50, 60, 70, 80} | set(range(72, 80))
MOLDURA_LOTOMANIA = set(range(1, 11)) | {11, 21, 31, 41, 51, 61, 71, 81, 91, 20, 30, 40, 50, 60, 70, 80, 90, 100} | set(range(92, 100))
MOLDURA_DUPLA_SENA = set(range(1, 11)) | {11, 21, 31, 41, 20, 30, 40, 50} | set(range(42, 50))

def obter_moldura(modalidade_slug: str) -> Set[int]:
    slug = modalidade_slug.lower()
    if "lotofacil" in slug:
        return MOLDURA_LOTOFACIL
    elif "quina" in slug:
        return MOLDURA_QUINA
    elif "lotomania" in slug:
        return MOLDURA_LOTOMANIA
    elif "dupla-sena" in slug:
        return MOLDURA_DUPLA_SENA
    return MOLDURA_MEGA_SENA

def contar_primos(jogo: List[int]) -> int:
    return len([num for num in jogo if num in PRIMOS])

def contar_fibonacci(jogo: List[int]) -> int:
    return len([num for num in jogo if num in FIBONACCI])

def contar_pares(jogo: List[int]) -> int:
    return len([num for num in jogo if num % 2 == 0])

def contar_impares(jogo: List[int]) -> int:
    return len([num for num in jogo if num % 2 != 0])

def contar_moldura(jogo: List[int], modalidade_slug: str) -> int:
    moldura = obter_moldura(modalidade_slug)
    return len([num for num in jogo if num in moldura])

def calcular_soma(jogo: List[int]) -> int:
    return sum(jogo)

def obter_maior_sequencia_consecutiva(jogo: List[int]) -> int:
    """
    Retorna o tamanho da maior sequência de números consecutivos no jogo.
    Ex: [4, 12, 13, 14, 28, 29] -> [12, 13, 14] tem tamanho 3. Retorna 3.
    """
    if not jogo:
        return 0
    
    jogo_ordenado = sorted(list(set(jogo)))
    maior_seq = 1
    seq_atual = 1
    
    for i in range(1, len(jogo_ordenado)):
        if jogo_ordenado[i] == jogo_ordenado[i-1] + 1:
            seq_atual += 1
        else:
            maior_seq = max(maior_seq, seq_atual)
            seq_atual = 1
            
    return max(maior_seq, seq_atual)

def filtrar_jogos(
    jogos: List[List[int]],
    modalidade_slug: str,
    filtros: Dict[str, Any]
) -> List[List[int]]:
    """
    Aplica filtros condicionais a uma lista de jogos.
    O dicionário 'filtros' pode conter configurações do tipo:
    {
        "primos": {"min": 1, "max": 3},
        "fibonacci": {"min": 1, "max": 2},
        "pares": {"min": 2, "max": 4},
        "impares": {"min": 2, "max": 4},
        "moldura": {"min": 3, "max": 5},
        "soma": {"min": 120, "max": 200},
        "consecutivos_limite": 2
    }
    """
    jogos_filtrados = []
    
    for jogo in jogos:
        jogo_valido = True
        
        # 1. Filtro de Pares
        if "pares" in filtros and filtros["pares"]:
            pares = contar_pares(jogo)
            limites = filtros["pares"]
            if not (limites.get("min", 0) <= pares <= limites.get("max", len(jogo))):
                jogo_valido = False
                
        # 2. Filtro de Ímpares
        if jogo_valido and "impares" in filtros and filtros["impares"]:
            impares = contar_impares(jogo)
            limites = filtros["impares"]
            if not (limites.get("min", 0) <= impares <= limites.get("max", len(jogo))):
                jogo_valido = False
                
        # 3. Filtro de Primos
        if jogo_valido and "primos" in filtros and filtros["primos"]:
            primos = contar_primos(jogo)
            limites = filtros["primos"]
            if not (limites.get("min", 0) <= primos <= limites.get("max", len(jogo))):
                jogo_valido = False
                
        # 4. Filtro de Fibonacci
        if jogo_valido and "fibonacci" in filtros and filtros["fibonacci"]:
            fib = contar_fibonacci(jogo)
            limites = filtros["fibonacci"]
            if not (limites.get("min", 0) <= fib <= limites.get("max", len(jogo))):
                jogo_valido = False
                
        # 5. Filtro de Moldura
        if jogo_valido and "moldura" in filtros and filtros["moldura"]:
            mold = contar_moldura(jogo, modalidade_slug)
            limites = filtros["moldura"]
            if not (limites.get("min", 0) <= mold <= limites.get("max", len(jogo))):
                jogo_valido = False
                
        # 6. Filtro de Soma
        if jogo_valido and "soma" in filtros and filtros["soma"]:
            soma = calcular_soma(jogo)
            limites = filtros["soma"]
            if not (limites.get("min", 0) <= soma <= limites.get("max", 99999)):
                jogo_valido = False
                
        # 7. Filtro de Dezenas Vizinhas (Consecutivos)
        if jogo_valido and "consecutivos_limite" in filtros and filtros["consecutivos_limite"] is not None:
            max_consecutivo = obter_maior_sequencia_consecutiva(jogo)
            limite = filtros["consecutivos_limite"]
            if max_consecutivo > limite:
                jogo_valido = False
                
        if jogo_valido:
            jogos_filtrados.append(jogo)
            
    return jogos_filtrados
