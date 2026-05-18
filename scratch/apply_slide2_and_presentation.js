const fs = require('fs');
const pagePath = 'app/propostas/nova/page.tsx';
let content = fs.readFileSync(pagePath, 'utf8');

// 1. Initial state defaults
const oldStateStr = `      vendedorNome: 'Ádamo Quadros',
      vendedorCargo: 'Novos Negócios',
      vendedorTelefone: '(41) 9 9737-0880',
      vendedorEmail: 'adamo@grupojvsserv.com.br',`;

const newStateStr = `      vendedorNome: '',
      vendedorCargo: '',
      vendedorTelefone: '',
      vendedorEmail: '',`;

if (content.includes(oldStateStr)) {
   content = content.replace(oldStateStr, newStateStr);
   console.log("✔ Initial state defaults cleaned!");
} else {
   console.error("❌ Old state string not found!");
}

// 2. Add state variables for currentUser and presentationMode
const oldStateHook = `  const [showClientDropdown, setShowClientDropdown] = useState(false);`;
const newStateHook = `  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [presentationMode, setPresentationMode] = useState(false);`;

if (content.includes(oldStateHook)) {
   content = content.replace(oldStateHook, newStateHook);
   console.log("✔ State variables for Presentation Mode added!");
} else {
   console.error("❌ State hook target not found!");
}

// 3. Set currentUser inside load()
const oldLoadHook = `        const clientesData = await getClientes();
        setClientesList(clientesData || []);
        console.log('Clientes carregados:', clientesData?.length || 0);`;

const newLoadHook = `        const clientesData = await getClientes();
        setClientesList(clientesData || []);
        console.log('Clientes carregados:', clientesData?.length || 0);
        setCurrentUser(loggedUser);`;

if (content.includes(oldLoadHook)) {
   content = content.replace(oldLoadHook, newLoadHook);
   console.log("✔ setCurrentUser added to load()!");
} else {
   console.error("❌ load() hook target not found!");
}

// 4. Update seller details initialization in load()
const oldVendedorInit = `                  vendedorNome: fullData.cliente.vendedorNome || loggedUser?.nome || 'Ádamo Quadros',
                  vendedorCargo: fullData.cliente.vendedorCargo || (loggedUser?.role === 'ADMIN' ? 'Diretor Comercial' : loggedUser?.role === 'MANAGER' ? 'Gerente Comercial' : 'Novos Negócios'),
                  vendedorTelefone: fullData.cliente.vendedorTelefone || '(41) 9 9737-0880',
                  vendedorEmail: fullData.cliente.vendedorEmail || loggedUser?.email || 'adamo@grupojvsserv.com.br',`;

const newVendedorInit = `                  vendedorNome: (!fullData.cliente.vendedorNome || fullData.cliente.vendedorNome === 'Ádamo Quadros') ? (loggedUser?.nome || 'Ádamo Quadros') : fullData.cliente.vendedorNome,
                  vendedorCargo: (!fullData.cliente.vendedorCargo || fullData.cliente.vendedorCargo === 'Novos Negócios') ? (loggedUser?.role === 'ADMIN' ? 'Diretor Comercial' : loggedUser?.role === 'MANAGER' ? 'Gerente Comercial' : 'Novos Negócios') : fullData.cliente.vendedorCargo,
                  vendedorTelefone: fullData.cliente.vendedorTelefone || '(41) 9 9737-0880',
                  vendedorEmail: (!fullData.cliente.vendedorEmail || fullData.cliente.vendedorEmail === 'adamo@grupojvsserv.com.br') ? (loggedUser?.email || 'adamo@grupojvsserv.com.br') : fullData.cliente.vendedorEmail,`;

if (content.includes(oldVendedorInit)) {
   content = content.replace(oldVendedorInit, newVendedorInit);
   console.log("✔ load() seller details initialization updated!");
} else {
   console.error("❌ Seller details initialization target not found!");
}

// 5. Add keyboard navigation hook for Presentation Mode
const oldCctEffect = `  // Sincroniza a CCTBase de toda a equipe quando o sindicato principal muda
  useEffect(() => {
    if (proposta.cliente.sindicatoId && ccts.length > 0) {
      const selectedCct = ccts.find(c => c.id === proposta.cliente.sindicatoId);
      if (selectedCct) {
        const needsUpdate = proposta.equipe.some((p: any) => p.cctBase?.id !== selectedCct.id);
        if (needsUpdate) {
          const newEquipe = proposta.equipe.map((p: any) => ({
            ...p,
            cctBase: selectedCct
          }));
          setProposta((prev: any) => ({...prev, equipe: newEquipe}));
        }
      }
    }
  }, [proposta.cliente.sindicatoId, ccts]);`;

const newCctEffect = `  // Sincroniza a CCTBase de toda a equipe quando o sindicato principal muda
  useEffect(() => {
    if (proposta.cliente.sindicatoId && ccts.length > 0) {
      const selectedCct = ccts.find(c => c.id === proposta.cliente.sindicatoId);
      if (selectedCct) {
        const needsUpdate = proposta.equipe.some((p: any) => p.cctBase?.id !== selectedCct.id);
        if (needsUpdate) {
          const newEquipe = proposta.equipe.map((p: any) => ({
            ...p,
            cctBase: selectedCct
          }));
          setProposta((prev: any) => ({...prev, equipe: newEquipe}));
        }
      }
    }
  }, [proposta.cliente.sindicatoId, ccts]);

  // Atalhos de teclado para o Modo Apresentação
  useEffect(() => {
    if (!presentationMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        setCurrentSlide(prev => (prev === 13 ? 1 : prev + 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentSlide(prev => (prev === 1 ? 13 : prev - 1));
      } else if (e.key === 'Escape') {
        setPresentationMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [presentationMode]);`;

if (content.includes(oldCctEffect)) {
   content = content.replace(oldCctEffect, newCctEffect);
   console.log("✔ Presentation Mode keyboard listeners hook added!");
} else {
   console.error("❌ CCTBase effect hook target not found!");
}

// 6. Style tag replacement (print and screen rules)
const oldStyleBlock = `                  <style>{\`
                     @media print {
                        /* Oculta tudo na página para a impressão */
                        body, html, #root, [class*="layout"], [class*="sidebar"], [class*="main"], header, nav, button, div:not(.print-slide-deck):not(.print-slide-deck *) {
                           display: none !important;
                           height: 0 !important;
                           overflow: hidden !important;
                        }
                        
                        /* Mostra apenas a print-slide-deck */
                        .print-slide-deck {
                           display: block !important;
                           position: absolute !important;
                           left: 0 !important;
                           top: 0 !important;
                           width: 100% !important;
                           background: white !important;
                           visibility: visible !important;
                        }
                        
                        .print-slide-deck * {
                           visibility: visible !important;
                        }
                        
                        .print-slide {
                           display: flex !important;
                           page-break-after: always !important;
                           break-after: page !important;
                           width: 100% !important;
                           height: 100vh !important;
                           box-sizing: border-box !important;
                           margin: 0 !important;
                           padding: 4rem !important;
                           position: relative !important;
                           background: white !important;
                        }
                     }
                  \`}</style>`;

const newStyleBlock = `                  <style>{\`
                     @media screen {
                        .print-slide-deck {
                           display: none !important;
                        }
                     }
                     @media print {
                        @page {
                           size: A4 landscape !important;
                           margin: 0 !important;
                        }
                        
                        body {
                           margin: 0 !important;
                           padding: 0 !important;
                           background: white !important;
                           -webkit-print-color-adjust: exact !important;
                           print-color-adjust: exact !important;
                        }

                        body * {
                           visibility: hidden !important;
                        }

                        .print-slide-deck, .print-slide-deck * {
                           visibility: visible !important;
                        }

                        .print-slide-deck {
                           display: block !important;
                           position: absolute !important;
                           left: 0 !important;
                           top: 0 !important;
                           width: 297mm !important;
                           height: auto !important;
                           background: white !important;
                           margin: 0 !important;
                           padding: 0 !important;
                           border: none !important;
                        }

                        .print-slide {
                           display: flex !important;
                           page-break-after: always !important;
                           break-after: page !important;
                           width: 297mm !important;
                           height: 210mm !important;
                           box-sizing: border-box !important;
                           margin: 0 !important;
                           padding: 4rem !important;
                           position: relative !important;
                           background: white !important;
                           overflow: hidden !important;
                           border: none !important;
                        }
                     }
                  \`}</style>`;

if (content.includes(oldStyleBlock)) {
   content = content.replace(oldStyleBlock, newStyleBlock);
   console.log("✔ Print Stylesheet updated to landscape slides!");
} else {
   console.error("❌ Style block target not found!");
}

// 7. Add "🖥️ Apresentar" button next to "🖨️ Salvar PDF / Imprimir"
const oldPrintButton = `                        <button
                           onClick={() => window.print()}
                           className="bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white font-extrabold px-5 py-3 rounded-xl text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                        >
                           <span>🖨️</span> Salvar PDF / Imprimir
                        </button>`;

const newPrintButton = `                        <div className="flex gap-3">
                           <button
                              type="button"
                              onClick={() => setPresentationMode(true)}
                              className="bg-[#1B4D3E] hover:bg-[#13382D] text-white font-extrabold px-5 py-3 rounded-xl text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                           >
                              <span>🖥️</span> Apresentar
                           </button>
                           <button
                              type="button"
                              onClick={() => window.print()}
                              className="bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white font-extrabold px-5 py-3 rounded-xl text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                           >
                              <span>🖨️</span> Salvar PDF / Imprimir
                           </button>
                        </div>`;

if (content.includes(oldPrintButton)) {
   content = content.replace(oldPrintButton, newPrintButton);
   console.log("✔ Presentation Mode action button added!");
} else {
   console.error("❌ Print button target not found!");
}

// 8. Visual slides container start classes (conditional)
const oldContainerStart = `                  {/* CONTAINER DOS SLIDES PARA VISUALIZAÇÃO EM TELA */}
                  <div className="w-full bg-slate-900/5 rounded-3xl p-8 border border-slate-200/40 flex justify-center items-center overflow-x-auto">
                     <div className="w-full max-w-[960px] aspect-[16/9] min-w-[760px] bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden relative select-none flex flex-col justify-between">`;

const newContainerStart = `                  {/* CONTAINER DOS SLIDES PARA VISUALIZAÇÃO EM TELA */}
                  <div className={presentationMode 
                     ? "fixed inset-0 bg-slate-950/98 z-[99999] flex flex-col justify-center items-center select-none p-6" 
                     : "w-full bg-slate-900/5 rounded-3xl p-8 border border-slate-200/40 flex justify-center items-center overflow-x-auto"
                  }>
                     <div className={presentationMode
                        ? "w-[90vw] h-[50.625vw] max-h-[85vh] max-w-[151.1vh] bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden relative flex flex-col justify-between"
                        : "w-full max-w-[960px] aspect-[16/9] min-w-[760px] bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden relative select-none flex flex-col justify-between"
                     }>`;

if (content.includes(oldContainerStart)) {
   content = content.replace(oldContainerStart, newContainerStart);
   console.log("✔ Conditional Container classes for Presentation Mode applied!");
} else {
   console.error("❌ Container start target not found!");
}

// 9. Floating Controls Dock and print-slide-deck wrapper
const oldContainerEnd = `                     )}
                  </div>

                  <div className="hidden print-slide-deck">`;

const newContainerEnd = `                     )}
                     
                     {/* Floating Controls Dock no Modo Apresentação */}
                     {presentationMode && (
                        <div className="absolute bottom-6 bg-slate-900/90 backdrop-blur text-white px-6 py-3 rounded-full flex items-center gap-6 shadow-2xl z-[100000] border border-slate-700/50">
                           <button 
                              type="button"
                              onClick={() => setCurrentSlide(prev => (prev === 1 ? 13 : prev - 1))}
                              className="hover:text-emerald-400 font-extrabold text-sm transition-all"
                           >
                              ◀ Anterior
                           </button>
                           <span className="font-extrabold text-xs tracking-widest text-slate-400">
                              SLIDE {String(currentSlide).padStart(2, '0')} / 13
                           </span>
                           <button 
                              type="button"
                              onClick={() => setCurrentSlide(prev => (prev === 13 ? 1 : prev + 1))}
                              className="hover:text-emerald-400 font-extrabold text-sm transition-all"
                           >
                              Próximo ▶
                           </button>
                           <div className="h-4 w-px bg-slate-700" />
                           <button 
                              type="button"
                              onClick={() => setPresentationMode(false)}
                              className="text-rose-400 hover:text-rose-300 font-extrabold text-xs uppercase tracking-wider transition-all"
                           >
                              Sair (ESC) 🚪
                           </button>
                        </div>
                     )}
                  </div>

                  <div className="print-slide-deck">`;

if (content.includes(oldContainerEnd)) {
   content = content.replace(oldContainerEnd, newContainerEnd);
   console.log("✔ Floating Controls Dock and print-slide-deck class updated!");
} else {
   console.error("❌ Container end / print-slide-deck target not found!");
}

fs.writeFileSync(pagePath, content, 'utf8');
console.log("✔ page.tsx completely updated successfully!");
