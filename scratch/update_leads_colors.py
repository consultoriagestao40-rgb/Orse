# -*- coding: utf-8 -*-
import os

filepath = "/Users/cristianosilva/.gemini/antigravity/scratch/orse/app/leads/LeadsKanban.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update status cards container (originally line ~1248)
target_status = """                    <div className="flex-1 flex flex-col p-3 overflow-y-auto space-y-3 bg-[#F8FAFC] border-x border-b border-slate-200 rounded-b-2xl -mt-[1px] z-0">
                      {stageLeads.map(lead => ("""

replacement_status = """                    <div 
                      className="flex-1 flex flex-col p-3 overflow-y-auto space-y-3 border-x border-b rounded-b-2xl -mt-[1px] z-0"
                      style={{
                        backgroundColor: hexToRgba(resolvedHex, 0.04),
                        borderColor: hexToRgba(resolvedHex, 0.15),
                        borderWidth: '0 1px 1px 1px',
                        borderStyle: 'solid'
                      }}
                    >
                      {stageLeads.map(lead => ("""

if target_status in content:
    content = content.replace(target_status, replacement_status, 1)
    print("Status background updated!")
else:
    print("Warning: target_status not found!")

# 2. Update vendedor cards container (originally line ~1540)
target_vendedor = """                    <div className="flex-1 flex flex-col p-3 overflow-y-auto space-y-3 bg-[#F8FAFC] border-x border-b border-slate-200 rounded-b-2xl -mt-[1px] z-0">
                      {colLeads.map(lead => ("""

replacement_vendedor = """                    <div 
                      className="flex-1 flex flex-col p-3 overflow-y-auto space-y-3 border-x border-b rounded-b-2xl -mt-[1px] z-0"
                      style={{
                        backgroundColor: hexToRgba(resolvedHex, 0.04),
                        borderColor: hexToRgba(resolvedHex, 0.15),
                        borderWidth: '0 1px 1px 1px',
                        borderStyle: 'solid'
                      }}
                    >
                      {colLeads.map(lead => ("""

if target_vendedor in content:
    content = content.replace(target_vendedor, replacement_vendedor, 1)
    print("Vendedor background updated!")
else:
    print("Warning: target_vendedor not found!")

# 3. Update segmento cards container (originally line ~1783)
target_segmento = """                    <div className="flex-1 flex flex-col p-3 overflow-y-auto space-y-3 bg-[#F8FAFC] border-x border-b border-slate-200 rounded-b-2xl -mt-[1px] z-0">
                      {colLeads.map(lead => ("""

replacement_segmento = """                    <div 
                      className="flex-1 flex flex-col p-3 overflow-y-auto space-y-3 border-x border-b rounded-b-2xl -mt-[1px] z-0"
                      style={{
                        backgroundColor: hexToRgba(resolvedHex, 0.04),
                        borderColor: hexToRgba(resolvedHex, 0.15),
                        borderWidth: '0 1px 1px 1px',
                        borderStyle: 'solid'
                      }}
                    >
                      {colLeads.map(lead => ("""

if target_segmento in content:
    content = content.replace(target_segmento, replacement_segmento, 1)
    print("Segmento background updated!")
else:
    print("Warning: target_segmento not found!")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Leads background colors updated successfully!")
