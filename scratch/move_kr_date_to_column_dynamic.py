import os

file_path = "/Users/cristianosilva/.gemini/antigravity/scratch/orse/app/planejamento/page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Overhaul Left Column: find start and end of left col header/title
marker_left_start = "/* Left Column: Description, Date & Progress */"
marker_left_end = "/* Purple progress bar matching Mereo style */"

idx_start = content.find(marker_left_start)
idx_end = content.find(marker_left_end)

if idx_start != -1 and idx_end != -1:
    # We want to replace the whole block from the <div> container down to the end marker
    # The block start is the beginning of the comment line
    comment_line_start = content.rfind("{", 0, idx_start)
    # The block end is before the comment marker of progress bar
    block_end = content.rfind("{", 0, idx_end)
    
    old_block = content[comment_line_start:block_end]
    new_block = """{/* Left Column: Description & Progress */}
                                                  <div className="flex-1 min-w-0 space-y-2">
                                                    <div className="flex justify-between items-start gap-4">
                                                      <p className="text-xs font-black text-slate-750">
                                                        KR {objIdx + 1}.{krIdx + 1}: {kr.descricao}
                                                      </p>
                                                      <span className="text-xs font-black text-slate-800 shrink-0">
                                                        {formatKrValue(kr.valorAtual, kr.unidade)} / {formatKrValue(kr.valorAlvo, kr.unidade)}
                                                      </span>
                                                    </div>
                                                    """
    content = content.replace(old_block, new_block)
    print("Successfully overhauled Left Column.")
else:
    print("Left Column markers not found.")

# Reload content after first replace to avoid offset mismatch
# Actually we can do it directly if we search again
marker_right_start = "/* Right Column: Status, Owner & Actions Menu */"
marker_right_end = "/* Status Badge */"

idx_r_start = content.find(marker_right_start)
idx_r_end = content.find(marker_right_end)

if idx_r_start != -1 and idx_r_end != -1:
    comment_r_start = content.rfind("{", 0, idx_r_start)
    block_r_end = content.rfind("{", 0, idx_r_end)
    
    old_r_block = content[comment_r_start:block_r_end]
    new_r_block = """{/* Right Column: Date, Status, Owner & Actions Menu */}
                                                  <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end md:w-[45%] lg:w-[40%]">
                                                    {/* Date Column */}
                                                    {kr.dataFim ? (
                                                      <div className="text-[10px] font-bold text-slate-550 flex items-center gap-1 shrink-0 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                                                        <Calendar size={11} className="text-slate-400 shrink-0" />
                                                        <span>{formatLocalDate(kr.dataFim)}</span>
                                                      </div>
                                                    ) : (
                                                      <span className="text-[9.5px] font-bold text-slate-300 italic shrink-0">Sem prazo</span>
                                                    )}

                                                    """
    content = content.replace(old_r_block, new_r_block)
    print("Successfully overhauled Right Column with Date.")
else:
    print("Right Column markers not found.")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("page.tsx saved successfully.")
