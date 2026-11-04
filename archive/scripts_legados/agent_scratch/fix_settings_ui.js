const fs = require('fs');
const path = 'app/admin/settings/page.tsx';

try {
  let content = fs.readFileSync(path, 'utf8');
  
  // 1. Update initial state
  content = content.replace(/const \[newUnidade, setNewUnidade\] = useState(\{ nome: '', sigla: '' \});/g, "const [newUnidade, setNewUnidade] = useState({ nome: '' });");

  // 2. Update handleAddUnidade
  content = content.replace(/if \(!newUnidade\.nome\.trim\(\) \|\| !newUnidade\.sigla\.trim\(\)\) \{[\s\S]+?alert\('Preencha o nome e a sigla da unidade\.'\);[\s\S]+?return;[\s\S]+?\}[\s\S]+?const res = await createUnidadeMedida\(newUnidade\.nome, newUnidade\.sigla\);/g, 
    "if (!newUnidade.nome.trim()) {\n      alert('Preencha o nome da unidade.');\n      return;\n    }\n    const res = await createUnidadeMedida(newUnidade.nome);");

  content = content.replace(/setNewUnidade\(\{ nome: '', sigla: '' \}\);/g, "setNewUnidade({ nome: '' });");

  // 3. Update the UI Form
  const formStart = '<div className="flex gap-2">';
  const formEnd = '</button>';
  
  // We need to find the one inside activeTab === 'unidades'
  const searchBlock = "activeTab === 'unidades'";
  const blockIndex = content.indexOf(searchBlock);
  
  if (blockIndex !== -1) {
    const subContent = content.substring(blockIndex);
    const startIndex = subContent.indexOf(formStart);
    const endIndex = subContent.indexOf(formEnd) + formEnd.length;
    
    if (startIndex !== -1 && endIndex !== -1) {
      const newForm = `<div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Unidade de Medida (Ex: UN, KG, LITRO)"
                      value={newUnidade.nome}
                      onChange={e => setNewUnidade({nome: e.target.value})}
                      onKeyDown={e => e.key === 'Enter' && handleAddUnidade()}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm outline-none focus:border-[#1B4D3E] font-bold uppercase"
                    />
                    <button 
                      onClick={handleAddUnidade}
                      className="bg-[#1B4D3E] hover:bg-emerald-900 text-white px-6 py-2 rounded text-sm font-bold flex items-center gap-2 shadow-sm transition-all"
                    >
                      <Plus size={16} /> Adicionar
                    </button>
                  </div>`;
      
      content = content.substring(0, blockIndex + startIndex) + newForm + content.substring(blockIndex + endIndex);
    }
  }

  // 4. Update the Grid display
  content = content.replace(/<p className="text-\[9px\] font-bold text-slate-400 uppercase tracking-widest mb-1">\{u\.nome\}<\/p>[\s\S]+?<p className="text-lg font-black text-slate-800">\{u\.sigla\}<\/p>/g,
    '<p className="text-lg font-black text-slate-800 uppercase">{u.nome}</p>');

  fs.writeFileSync(path, content, 'utf8');
  console.log('Success');
} catch (err) {
  console.error(err);
}
