#!/usr/bin/env python3
"""
Corrige a estrutura de fechamento do bloco da aba planos.
O problema: o script anterior não fechou corretamente o ternário isEditingPlano ? (...) : (lista).
A linha 2325 tem um ')}'  extra que fecha o isEditingPlano ternário antes do tempo,
e o fechamento do tab de planos está duplicado.

Diagnóstico: Linhas 2319-2328:
  2319: }) - fecha (() => { calc vars })()
  2320: })()}  - ERRADO, fecha o IIFE e o isEditingPlano (fecharia tudo)
  2321: </div>
  2322: </div>
  2323: )}
  2324: </div>
  2325: )}    <- LINHA COM ERRO (linha 2325:22 no build)
  2326: </div>
  2327: )
  2328: )}

Precisamos:
  2319: ); - fecha o return() do IIFE do editor
  2320: })() - fecha o IIFE
  2321: ) : ( - abre o ramo da lista  [JA EXISTE]
  ... lista/kanban ...
  ...
  </div>  <- fecha space-y-6
  ) <- fecha o ternário (...) : (...)
  )} <- fecha activeTab === 'planos' && (...)
"""

with open('app/planejamento/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
print(f"Total lines: {len(lines)}")

# Mostrar contexto ao redor das linhas problemáticas
print("\n=== Linhas 2105-2130 (fechamento do editor inline) ===")
for i in range(2104, 2130):
    print(f"{i+1}: {lines[i]}")

print("\n=== Linhas 2315-2335 (área do build error) ===")
for i in range(2314, 2335):
    print(f"{i+1}: {lines[i]}")
