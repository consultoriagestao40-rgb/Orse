# -*- coding: utf-8 -*-
import os

filepath = "/Users/cristianosilva/.gemini/antigravity/scratch/orse/app/contratos/page.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Inject customModal state & showCustomAlert helper into ContratosDashboard component
target_state_inject = """  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);"""
replacement_state_inject = """  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);

  const [customModal, setCustomModal] = useState<{
    isOpen: boolean;
    title: string;
    defaultValue?: string;
    placeholder?: string;
    onConfirm: (val: string) => void | Promise<void>;
    onCancel?: () => void;
    type: 'prompt' | 'alert' | 'confirm';
    message?: string;
  }>({
    isOpen: false,
    title: '',
    onConfirm: () => {},
    type: 'prompt',
  });

  const showCustomAlert = (title: string, message: string) => {
    setCustomModal({
      isOpen: true,
      title,
      message,
      type: 'alert',
      onConfirm: () => {}
    });
  };"""

if target_state_inject in content:
    content = content.replace(target_state_inject, replacement_state_inject, 1)
else:
    print("Warning: target_state_inject not found!")

# 2. Update handleCreateStatus
target_handleCreateStatus = """  const handleCreateStatus = (insertAfterStatus: string) => {
    const name = prompt('Nome do novo status/etapa (ex: Assinado):');
    if (!name) return;
    const trimmed = name.trim();
    if (statusesList.includes(trimmed)) {
      alert('Já existe um status com este nome.');
      return;
    }
    const idx = statusesList.indexOf(insertAfterStatus);
    const newList = [...statusesList];
    if (idx !== -1) {
      newList.splice(idx + 1, 0, trimmed);
    } else {
      newList.push(trimmed);
    }
    setStatusesList(newList);
    localStorage.setItem('orse_contrato_statuses', JSON.stringify(newList));
    
    const newColors = { ...statusColors, [trimmed]: '#3b82f6' };
    setStatusColors(newColors);
    localStorage.setItem('orse_contrato_status_colors', JSON.stringify(newColors));
  };"""

replacement_handleCreateStatus = """  const handleCreateStatus = (insertAfterStatus: string) => {
    setCustomModal({
      isOpen: true,
      title: 'Novo Status/Etapa',
      placeholder: 'Nome do novo status/etapa (ex: Assinado)',
      type: 'prompt',
      onConfirm: (name) => {
        if (!name.trim()) return;
        const trimmed = name.trim();
        if (statusesList.includes(trimmed)) {
          showCustomAlert('Status Duplicado', 'Já existe um status com este nome.');
          return;
        }
        const idx = statusesList.indexOf(insertAfterStatus);
        const newList = [...statusesList];
        if (idx !== -1) {
          newList.splice(idx + 1, 0, trimmed);
        } else {
          newList.push(trimmed);
        }
        setStatusesList(newList);
        localStorage.setItem('orse_contrato_statuses', JSON.stringify(newList));
        
        const newColors = { ...statusColors, [trimmed]: '#3b82f6' };
        setStatusColors(newColors);
        localStorage.setItem('orse_contrato_status_colors', JSON.stringify(newColors));
      }
    });
  };"""

if target_handleCreateStatus in content:
    content = content.replace(target_handleCreateStatus, replacement_handleCreateStatus, 1)
else:
    print("Warning: target_handleCreateStatus not found!")

# 3. Update handleDelete
target_handleDelete = """  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Tem certeza que deseja excluir este contrato? Essa ação não pode ser desfeita.')) {
      const res = await deleteContrato(id);
      if (res.success) {
        setContratos(prev => prev.filter(c => c.id !== id));
      } else {
        alert('Erro ao excluir: ' + res.error);
      }
    }
  };"""

replacement_handleDelete = """  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomModal({
      isOpen: true,
      title: 'Excluir Contrato',
      message: 'Tem certeza que deseja excluir este contrato? Essa ação não pode ser desfeita.',
      type: 'confirm',
      onConfirm: async () => {
        const res = await deleteContrato(id);
        if (res.success) {
          setContratos(prev => prev.filter(c => c.id !== id));
        } else {
          showCustomAlert('Erro ao Excluir Contrato', res.error || 'Erro ao excluir');
        }
      }
    });
  };"""

if target_handleDelete in content:
    content = content.replace(target_handleDelete, replacement_handleDelete, 1)
else:
    print("Warning: target_handleDelete not found!")

# 4. Update the Column Delete Action
target_col_delete = """                      <button
                        onClick={async () => {
                          if (cards.length > 0) {
                            alert(`Esta coluna possui ${cards.length} contrato(s). Por favor, mova todos os contratos para outra coluna antes de excluí-la.`);
                            return;
                          }
                          if (window.confirm(`Tem certeza que deseja excluir a coluna "${status}"?`)) {
                            const newStatusesList = statusesList.filter(s => s !== status);
                            setStatusesList(newStatusesList);
                            localStorage.setItem('orse_contrato_statuses', JSON.stringify(newStatusesList));
                            
                            const newColors = { ...statusColors };
                            delete newColors[status];
                            setStatusColors(newColors);
                            localStorage.setItem('orse_contrato_status_colors', JSON.stringify(newColors));
                            
                            setEditingStatusId(null);
                          }
                        }}"""

replacement_col_delete = """                      <button
                        onClick={() => {
                          if (cards.length > 0) {
                            showCustomAlert(
                              'Não é possível excluir',
                              `Esta coluna possui ${cards.length} contrato(s). Por favor, mova todos os contratos para outra coluna antes de excluí-la.`
                            );
                            return;
                          }
                          setCustomModal({
                            isOpen: true,
                            title: 'Excluir Coluna',
                            message: `Tem certeza que deseja excluir a coluna "${status}"?`,
                            type: 'confirm',
                            onConfirm: () => {
                              const newStatusesList = statusesList.filter(s => s !== status);
                              setStatusesList(newStatusesList);
                              localStorage.setItem('orse_contrato_statuses', JSON.stringify(newStatusesList));
                              
                              const newColors = { ...statusColors };
                              delete newColors[status];
                              setStatusColors(newColors);
                              localStorage.setItem('orse_contrato_status_colors', JSON.stringify(newColors));
                              
                              setEditingStatusId(null);
                            }
                          });
                        }}"""

if target_col_delete in content:
    content = content.replace(target_col_delete, replacement_col_delete, 1)
else:
    print("Warning: target_col_delete not found!")

# 5. Render customModal markup before the end of return statement
target_render_end = """        </div>
      </main>
    </div>
  );
}"""

replacement_render_end = """      {customModal.isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 animate-in fade-in zoom-in-95 duration-200 text-slate-800 p-6 flex flex-col gap-4 font-sans">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                {customModal.title}
              </h3>
              <button
                onClick={() => {
                  setCustomModal(prev => ({ ...prev, isOpen: false }));
                  if (customModal.onCancel) customModal.onCancel();
                }}
                className="text-slate-400 hover:text-slate-650 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            {customModal.type === 'prompt' && (
              <input
                type="text"
                id="custom-modal-input"
                defaultValue={customModal.defaultValue || ''}
                placeholder={customModal.placeholder || ''}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const input = document.getElementById('custom-modal-input') as HTMLInputElement;
                    customModal.onConfirm(input?.value || '');
                    setCustomModal(prev => ({ ...prev, isOpen: false }));
                  }
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-emerald-500"
              />
            )}
            
            {customModal.type !== 'prompt' && (
              <p className="text-xs text-slate-650 leading-relaxed font-medium">
                {customModal.message}
              </p>
            )}
            
            <div className="flex justify-end gap-3 pt-2">
              {customModal.type !== 'alert' && (
                <button
                  onClick={() => {
                    setCustomModal(prev => ({ ...prev, isOpen: false }));
                    if (customModal.onCancel) customModal.onCancel();
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all"
                >
                  Cancelar
                </button>
              )}
              <button
                onClick={() => {
                  const input = document.getElementById('custom-modal-input') as HTMLInputElement;
                  customModal.onConfirm(customModal.type === 'prompt' ? (input?.value || '') : '');
                  setCustomModal(prev => ({ ...prev, isOpen: false }));
                }}
                className="px-4 py-2 bg-[#1B4D3E] hover:bg-[#1B4D3E]/80 text-white text-[10px] font-black uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                {customModal.type === 'alert' ? 'OK' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

        </div>
      </main>
    </div>
  );
}"""

if target_render_end in content:
    content = content.replace(target_render_end, replacement_render_end, 1)
else:
    print("Warning: target_render_end not found!")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Update completed successfully!")
