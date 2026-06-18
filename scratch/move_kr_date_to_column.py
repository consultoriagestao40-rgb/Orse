import os

file_path = "/Users/cristianosilva/.gemini/antigravity/scratch/orse/app/planejamento/page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Replace Left Column rendering to remove inline date
left_col_old = """                                                  {/* Left Column: Description, Date & Progress */}
                                                  <div className="flex-1 min-w-0 space-y-2">
                                                    <div className="flex justify-between items-start gap-4">
                                                      <div className="min-w-0">
                                                        <p className="text-xs font-black text-slate-750">
                                                          KR {objIdx + 1}.{krIdx + 1}: {kr.descricao}
                                                        </p>
                                                        {kr.dataFim && (
                                                          <div className="text-[9.5px] font-bold text-slate-400 mt-1 flex items-center gap-1">
                                                            <Calendar size={11} className="text-slate-400 shrink-0" />
                                                            <span>Prazo: {formatLocalDate(kr.dataFim)}</span>
                                                          </div>
                                                        )}
                                                      </div>
                                                      <span className="text-xs font-black text-slate-800 shrink-0">
                                                        {formatKrValue(kr.valorAtual, kr.unidade)} / {formatKrValue(kr.valorAlvo, kr.unidade)}
                                                      </span>
                                                    </div>"""

left_col_new = """                                                  {/* Left Column: Description & Progress */}
                                                  <div className="flex-1 min-w-0 space-y-2">
                                                    <div className="flex justify-between items-start gap-4">
                                                      <p className="text-xs font-black text-slate-750">
                                                        KR {objIdx + 1}.{krIdx + 1}: {kr.descricao}
                                                      </p>
                                                      <span className="text-xs font-black text-slate-800 shrink-0">
                                                        {formatKrValue(kr.valorAtual, kr.unidade)} / {formatKrValue(kr.valorAlvo, kr.unidade)}
                                                      </span>
                                                    </div>"""

if left_col_old in content:
    content = content.replace(left_col_old, left_col_new)
    print("Left column overhauled successfully.")
else:
    print("Left column old pattern not found.")

# 2. Replace Right Column rendering to insert date column to the left of status badge
right_col_old = """                                                  {/* Right Column: Status, Owner & Actions Menu */}
                                                  <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end md:w-[35%] lg:w-[30%]">
                                                    {/* Status Badge */}
                                                    <span className={`text-[8.5px] font-black px-2.5 py-1 rounded-lg uppercase border tracking-wider shrink-0 ${"""

right_col_new = """                                                  {/* Right Column: Date, Status, Owner & Actions Menu */}
                                                  <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end md:w-[45%] lg:w-[40%]">
                                                    {/* Date Column */}
                                                    {kr.dataFim ? (
                                                      <div className="text-[10px] font-bold text-slate-550 flex items-center gap-1 shrink-0 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
                                                        <Calendar size={11} className="text-slate-400 shrink-0" />
                                                        <span>{formatLocalDate(kr.dataFim)}</span>
                                                      </div>
                                                    ) : (
                                                      <span className="text-[9.5px] font-bold text-slate-300 italic shrink-0">Sem prazo</span>
                                                    )}

                                                    {/* Status Badge */}
                                                    <span className={`text-[8.5px] font-black px-2.5 py-1 rounded-lg uppercase border tracking-wider shrink-0 ${"""

if right_col_old in content:
    content = content.replace(right_col_old, right_col_new)
    print("Right column overhauled successfully with Date column.")
else:
    print("Right column old pattern not found.")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("page.tsx saved successfully.")
