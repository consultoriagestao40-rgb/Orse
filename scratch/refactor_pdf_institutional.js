const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '..', 'app', 'propostas', 'nova', 'page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

console.log("📖 Lendo o arquivo page.tsx para a refatoração dos slides institucionais (03, 04, 05 e 06) do PDF...");

// Âncoras exatas para as substituições
const s03StartStr = '{/* SLIDE 03 PRINT - NOSSA PRESENÇA / QUEM SOMOS */}';
const s03EndStr = '{/* SLIDE 04 PRINT - NOSSOS VALORES */}';

const s04StartStr = '{/* SLIDE 04 PRINT - NOSSOS VALORES */}';
const s04EndStr = '{/* SLIDE 05 PRINT - PRINCIPAIS SERVIÇOS PRESTADOS */}';

const s05StartStr = '{/* SLIDE 05 PRINT - PRINCIPAIS SERVIÇOS PRESTADOS */}';
const s05EndStr = '{/* SLIDE 06 PRINT - SETORES ATENDIDOS */}';

const s06StartStr = '{/* SLIDE 06 PRINT - SETORES ATENDIDOS */}';
const s06EndStr = '{/* SLIDE 07 PRINT - PRINCIPAIS FERRAMENTAS */}';

// ----------------------------------------------------
// 1. REFATORAÇÃO DO SLIDE 03 PRINT - QUEM SOMOS
// ----------------------------------------------------
const s03StartIdx = content.indexOf(s03StartStr);
const s03EndIdx = content.indexOf(s03EndStr);

if (s03StartIdx !== -1 && s03EndIdx !== -1) {
   console.log("✔ Slide 03 PRINT (Quem Somos) localizado!");
   
   const newS03Content = s03StartStr + `
                      <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-gradient-to-br from-[#1e4480] to-[#0f284e] p-16 flex flex-col justify-between relative overflow-hidden h-[100vh] text-white">
                         {/* Stripes de fundo refinados */}
                         <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10" xmlns="http://www.w3.org/2000/svg">
                            <line x1="-100" y1="100" x2="400" y2="-400" stroke="#FFFFFF" strokeWidth="18" />
                            <line x1="-100" y1="150" x2="450" y2="-400" stroke="#FFFFFF" strokeWidth="12" />
                            <line x1="500" y1="900" x2="1200" y2="200" stroke="#FFFFFF" strokeWidth="18" />
                         </svg>

                         <div className="grid grid-cols-12 gap-8 items-center h-[calc(100%-60px)] relative z-10">
                            {/* Coluna de Texto e KPIs (Esquerda) */}
                            <div className="col-span-7 flex flex-col justify-between h-full py-4 text-white">
                               <div>
                                  <span className="text-emerald-400 text-[10px] font-black tracking-[0.2em] uppercase">QUEM SOMOS</span>
                                  <h2 className="text-3xl font-black text-white tracking-tight leading-none uppercase mt-1">
                                     NOSSA PRESENÇA
                                  </h2>
                                  <p className="text-white/80 text-[11px] font-semibold leading-relaxed mt-4 max-w-xl">
                                     Há mais de 30 anos no mercado de Facilities, somos especialistas em prestações de serviços de limpeza profissional e similares, entregando soluções integradas com máxima eficiência e qualidade técnica validada.
                                  </p>
                               </div>

                               {/* Grid de KPIs de Glassmorphism Premium */}
                               <div className="grid grid-cols-5 gap-3 pt-6 border-t border-white/10">
                                  {/* Anos de atuação */}
                                  <div className="bg-white/10 border border-white/15 backdrop-blur-md rounded-2xl p-3.5 flex flex-col items-center justify-between text-center shadow-md h-32">
                                     <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mb-1 shrink-0 shadow-sm">
                                        <Award size={18} className="text-[#1e4480] shrink-0" />
                                     </div>
                                     <div className="flex flex-col items-center">
                                        <span className="text-[13px] font-black text-white leading-none whitespace-nowrap">+de 30</span>
                                        <span className="text-[6.5px] font-black text-white/70 uppercase mt-1 leading-tight tracking-wider block max-w-[65px]">
                                           Anos de atuação
                                        </span>
                                     </div>
                                  </div>

                                  {/* Postos ativos */}
                                  <div className="bg-white/10 border border-white/15 backdrop-blur-md rounded-2xl p-3.5 flex flex-col items-center justify-between text-center shadow-md h-32">
                                     <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mb-1 shrink-0 shadow-sm">
                                        <MapPin size={18} className="text-[#1e4480] shrink-0" />
                                     </div>
                                     <div className="flex flex-col items-center">
                                        <span className="text-[13px] font-black text-white leading-none whitespace-nowrap">+ 100</span>
                                        <span className="text-[6.5px] font-black text-white/70 uppercase mt-1 leading-tight tracking-wider block max-w-[65px]">
                                           Postos ativos
                                        </span>
                                     </div>
                                  </div>

                                  {/* Clientes atendidos */}
                                  <div className="bg-white/10 border border-white/15 backdrop-blur-md rounded-2xl p-3.5 flex flex-col items-center justify-between text-center shadow-md h-32">
                                     <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mb-1 shrink-0 shadow-sm">
                                        <Users size={18} className="text-[#1e4480] shrink-0" />
                                     </div>
                                     <div className="flex flex-col items-center">
                                        <span className="text-[13px] font-black text-white leading-none whitespace-nowrap">+ 200</span>
                                        <span className="text-[6.5px] font-black text-white/70 uppercase mt-1 leading-tight tracking-wider block max-w-[65px]">
                                           Clientes
                                        </span>
                                     </div>
                                  </div>

                                  {/* Limpeza em altura */}
                                  <div className="bg-white/10 border border-white/15 backdrop-blur-md rounded-2xl p-3.5 flex flex-col items-center justify-between text-center shadow-md h-32">
                                     <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mb-1 shrink-0 shadow-sm">
                                        <ShieldCheck size={18} className="text-[#1e4480] shrink-0" />
                                     </div>
                                     <div className="flex flex-col items-center">
                                        <span className="text-[10px] font-black text-emerald-400 leading-none whitespace-nowrap">+100 mil</span>
                                        <span className="text-[6.5px] font-black text-white/70 uppercase mt-1 leading-tight tracking-wider block max-w-[65px]">
                                           m² em altura
                                        </span>
                                     </div>
                                  </div>

                                  {/* Pisos tratados */}
                                  <div className="bg-white/10 border border-white/15 backdrop-blur-md rounded-2xl p-3.5 flex flex-col items-center justify-between text-center shadow-md h-32">
                                     <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mb-1 shrink-0 shadow-sm">
                                        <Sparkles size={18} className="text-[#1e4480] shrink-0" />
                                     </div>
                                     <div className="flex flex-col items-center">
                                        <span className="text-[10px] font-black text-emerald-400 leading-none whitespace-nowrap">+500 mil</span>
                                        <span className="text-[6.5px] font-black text-white/70 uppercase mt-1 leading-tight tracking-wider block max-w-[65px]">
                                           m² de pisos
                                        </span>
                                     </div>
                                  </div>
                               </div>
                            </div>

                            {/* Coluna do Mapa (Direita) */}
                            <div className="col-span-5 h-full flex flex-col justify-center items-center relative pr-2">
                               <div className="bg-white/5 border border-white/10 backdrop-blur-lg rounded-3xl p-6 shadow-xl flex flex-col justify-center items-center h-[340px] w-[340px] relative overflow-hidden">
                                  <div className="absolute right-[-10px] top-[-10px] w-20 h-20 bg-emerald-500/10 rounded-full blur-xl"></div>
                                  <div className="w-full max-w-[240px] aspect-square drop-shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
                                     <BrazilMap highlightedStates={['PR', 'SC', 'RS']} className="w-full h-full text-emerald-400" />
                                  </div>
                                  <div className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mt-4 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full shadow-xs">
                                     Atendimento em toda Região Sul
                                  </div>
                               </div>
                            </div>
                         </div>

                         {/* Rodapé */}
                         <div className="relative z-20 flex justify-between items-end w-full text-white/70 text-[10px] font-extrabold uppercase tracking-wider pr-4 mt-auto">
                            <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">www.grupojvsserv.com.br</span>
                            <span className="text-[9px] font-black text-white bg-white/10 px-2.5 py-0.5 rounded backdrop-blur-xs">03</span>
                         </div>
                      </div>\n\n`;

   content = content.substring(0, s03StartIdx) + newS03Content + content.substring(s03EndIdx);
   console.log("✔ Slide 03 PRINT atualizado com sucesso!");
}

// ----------------------------------------------------
// 2. REFATORAÇÃO DO SLIDE 04 PRINT - NOSSOS VALORES
// ----------------------------------------------------
const s04StartIdx = content.indexOf(s04StartStr);
const s04EndIdx = content.indexOf(s04EndStr);

if (s04StartIdx !== -1 && s04EndIdx !== -1) {
   console.log("✔ Slide 04 PRINT (Nossos Valores) localizado!");

   const newS04Content = s04StartStr + `
                      <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-white p-16 flex flex-col justify-between relative overflow-hidden h-[100vh]">
                         {/* Stripes de fundo */}
                         <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" xmlns="http://www.w3.org/2000/svg">
                            <line x1="-100" y1="100" x2="400" y2="-400" stroke="#F1F5F9" strokeWidth="18" />
                            <line x1="-100" y1="150" x2="450" y2="-400" stroke="#F1F5F9" strokeWidth="12" />
                            <line x1="500" y1="900" x2="1200" y2="200" stroke="#F1F5F9" strokeWidth="18" />
                         </svg>
                         
                         <div className="grid grid-cols-12 gap-8 items-center h-[calc(100%-40px)] relative z-10">
                            {/* Coluna de Texto (Esquerda) */}
                            <div className="col-span-6 flex flex-col justify-center space-y-4 pl-2 h-full">
                               <div>
                                  <span className="text-[#1e4480] text-[10px] font-black tracking-[0.2em] uppercase">DIRETRIZES CORPORATIVAS</span>
                                  <h2 className="text-3xl font-black text-[#1e4480] tracking-tight leading-none uppercase mt-1">
                                     NOSSOS VALORES
                                  </h2>
                                  <p className="text-slate-600 text-[11px] font-semibold leading-relaxed mt-4">
                                     Nosso compromisso é guiado por princípios sólidos: agimos com <strong className="underline decoration-[#1e4480] decoration-2 font-black text-[#1e4480]">ética</strong>, mantendo a integridade acima de benefícios momentâneos. Buscamos <strong className="underline decoration-emerald-500 decoration-2 font-black text-[#1e4480]">agilidade</strong>, <strong className="underline decoration-emerald-500 decoration-2 font-black text-[#1e4480]">eficiência</strong> e <strong className="underline decoration-emerald-500 decoration-2 font-black text-[#1e4480]">excelência</strong> através do aprimoramento contínuo de processos e sistemas. 
                                  </p>
                                  <p className="text-slate-600 text-[11px] font-semibold leading-relaxed mt-3">
                                     <strong className="underline decoration-[#1e4480] decoration-2 font-black text-[#1e4480]">Valorizamos nossas pessoas</strong>, promovendo um ambiente humanizado e soluções que garantem a satisfação e a permanência dos colaboradores. Somos comprometidos com a <strong className="underline decoration-emerald-500 decoration-2 font-black text-[#1e4480]">entrega</strong> dos nossos acordos, além de investir continuamente em <strong className="underline decoration-emerald-500 decoration-2 font-black text-[#1e4480]">inovação</strong> e <strong className="underline decoration-emerald-500 decoration-2 font-black text-[#1e4480]">tecnologia</strong>.
                                  </p>
                               </div>
                            </div>

                            {/* Coluna Gráfica (Direita) */}
                            <div className="col-span-6 h-full w-full flex items-center justify-center relative">
                               {/* Grid em Escada de 3 Cards Premium */}
                               <div className="grid grid-cols-1 gap-4 w-full max-w-sm">
                                  {/* Card 1: Excelência */}
                                  <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-md flex items-center gap-4 border-l-4 border-l-[#1e4480] hover:translate-x-1 transition-transform">
                                     <div className="w-12 h-12 rounded-full bg-[#1e4480]/10 flex items-center justify-center shrink-0">
                                        <Trophy size={22} className="text-[#1e4480]" />
                                     </div>
                                     <div>
                                        <h4 className="text-[11px] font-black text-[#1e4480] uppercase tracking-wider">Excelência & Entrega</h4>
                                        <p className="text-[9px] text-slate-500 font-semibold leading-normal mt-0.5">Agilidade e eficiência com foco no aprimoramento e cumprimento de todos os acordos firmados.</p>
                                     </div>
                                  </div>

                                  {/* Card 2: Inovação */}
                                  <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-md flex items-center gap-4 border-l-4 border-l-emerald-500 hover:translate-x-1 transition-transform">
                                     <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                                        <Lightbulb size={22} className="text-emerald-600" />
                                     </div>
                                     <div>
                                        <h4 className="text-[11px] font-black text-emerald-700 uppercase tracking-wider">Inovação & Tecnologia</h4>
                                        <p className="text-[9px] text-slate-500 font-semibold leading-normal mt-0.5">Sistemas e automação de ponta para otimizar os processos, elevando a produtividade operacional.</p>
                                     </div>
                                  </div>

                                  {/* Card 3: Pessoas */}
                                  <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-md flex items-center gap-4 border-l-4 border-l-[#1e4480] hover:translate-x-1 transition-transform">
                                     <div className="w-12 h-12 rounded-full bg-[#1e4480]/10 flex items-center justify-center shrink-0">
                                        <Users size={22} className="text-[#1e4480]" />
                                     </div>
                                     <div>
                                        <h4 className="text-[11px] font-black text-[#1e4480] uppercase tracking-wider">Valorização de Pessoas</h4>
                                        <p className="text-[9px] text-slate-500 font-semibold leading-normal mt-0.5">Construção de ambiente humanizado que propicia a satisfação e retenção de nossos talentos.</p>
                                     </div>
                                  </div>
                               </div>
                            </div>
                         </div>

                         <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.grupojvsserv.com.br</span>
                            <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">04</span>
                         </div>
                      </div>\n\n`;

   content = content.substring(0, s04StartIdx) + newS04Content + content.substring(s04EndIdx);
   console.log("✔ Slide 04 PRINT atualizado com sucesso!");
}

// ----------------------------------------------------
// 3. REFATORAÇÃO DO SLIDE 05 PRINT - SERVIÇOS PRESTADOS
// ----------------------------------------------------
const s05StartIdx = content.indexOf(s05StartStr);
const s05EndIdx = content.indexOf(s05EndStr);

if (s05StartIdx !== -1 && s05EndIdx !== -1) {
   console.log("✔ Slide 05 PRINT (Serviços Prestados) localizado!");

   const newS05Content = s05StartStr + `
                      <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-white p-16 flex flex-col justify-between relative overflow-hidden h-[100vh]">
                         {/* Stripes de fundo */}
                         <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-50" xmlns="http://www.w3.org/2000/svg">
                            <line x1="-100" y1="100" x2="400" y2="-400" stroke="#F1F5F9" strokeWidth="18" />
                            <line x1="-100" y1="150" x2="450" y2="-400" stroke="#F1F5F9" strokeWidth="12" />
                            <line x1="500" y1="900" x2="1200" y2="200" stroke="#F1F5F9" strokeWidth="18" />
                         </svg>
                         
                         <div className="grid grid-cols-12 gap-8 items-stretch h-[calc(100%-140px)] relative z-10 my-auto">
                            {/* Coluna do Título (Esquerda) */}
                            <div className="col-span-3 flex flex-col justify-center h-full">
                               <span className="text-[#1e4480] text-[10px] font-black tracking-[0.2em] uppercase">NOSSO ESCOPO</span>
                               <h2 className="text-2xl font-black text-[#1e4480] uppercase tracking-tight leading-none mt-1">
                                  PRINCIPAIS<br />
                                  SERVIÇOS<br />
                                  PRESTADOS
                               </h2>
                            </div>

                            {/* Coluna 1 (Centro) - Terceirização */}
                            <div className="col-span-4 bg-white border border-slate-150 rounded-2xl p-6 shadow-lg flex flex-col justify-between hover:scale-[1.01] transition-transform">
                               <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                  <span className="text-[#1e4480] text-[10px] font-black tracking-wide uppercase leading-tight max-w-[170px]">
                                     TERCEIRIZAÇÃO DE FACILITIES
                                  </span>
                                  <div className="text-[#1e4480] shrink-0">
                                     <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 shrink-0">
                                        <path d="M12 52L24 40M52 52L40 40" stroke="#1e4480" strokeWidth="3" />
                                        <path d="M22 38L14 30M42 38L50 30" stroke="#1e4480" strokeWidth="3" />
                                        <line x1="24" y1="40" x2="36" y2="28" stroke="#1e4480" strokeWidth="2.5" />
                                        <line x1="40" y1="40" x2="28" y2="28" stroke="#1e4480" strokeWidth="2.5" />
                                        <path d="M18 42C18 42 22 46 28 46C34 46 38 42 38 36" stroke="#1e4480" strokeWidth="2.5" />
                                        <path d="M46 42C46 42 42 46 36 46C30 46 26 42 26 36" stroke="#1e4480" strokeWidth="2.5" />
                                        <path d="M32 8L34 14L40 16L34 18L32 24L30 18L24 16L30 14Z" fill="#1e4480" />
                                        <path d="M18 16L19 19L22 20L19 21L18 24L17 21L14 20L17 19Z" fill="#1e4480" />
                                        <path d="M46 16L47 19L50 20L47 21L46 24L45 21L42 20L45 19Z" fill="#1e4480" />
                                     </svg>
                                  </div>
                               </div>
                               <p className="text-slate-500 text-[8.5px] font-semibold leading-relaxed mt-3">
                                  Gestão e execução de serviços essenciais como limpeza, portaria, recepção e jardinagem, garantindo a organização total e a produtividade máxima dos postos de trabalho dos nossos parceiros corporativos.
                               </p>
                            </div>

                            {/* Coluna 2 (Direita) - Limpeza em Altura */}
                            <div className="col-span-5 bg-white border border-slate-150 rounded-2xl p-6 shadow-lg flex flex-col justify-between hover:scale-[1.01] transition-transform">
                               <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                  <span className="text-[#1e4480] text-[10px] font-black tracking-wide uppercase leading-tight">
                                     LIMPEZA TÉCNICA E EM ALTURA
                                  </span>
                                  <div className="text-[#1e4480] shrink-0">
                                     <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 shrink-0">
                                        <rect x="6" y="6" width="20" height="52" rx="2" stroke="#cbd5e1" strokeWidth="1.5" />
                                        <line x1="6" y1="20" x2="26" y2="20" stroke="#cbd5e1" strokeWidth="1.5" />
                                        <line x1="6" y1="36" x2="26" y2="36" stroke="#cbd5e1" strokeWidth="1.5" />
                                        <line x1="16" y1="6" x2="16" y2="58" stroke="#cbd5e1" strokeWidth="1.5" />
                                        <line x1="38" y1="2" x2="38" y2="62" stroke="#1e4480" strokeWidth="1.5" strokeDasharray="3 3" />
                                        <line x1="48" y1="2" x2="48" y2="62" stroke="#1e4480" strokeWidth="1.5" />
                                        <circle cx="48" cy="22" r="4" fill="#1e4480" />
                                        <path d="M44 20H48V24" stroke="#1e4480" strokeWidth="2" />
                                        <path d="M48 26L42 36" stroke="#1e4480" strokeWidth="4" />
                                        <path d="M42 36L46 44L52 46" stroke="#1e4480" strokeWidth="3" />
                                        <path d="M42 36L36 42L38 48" stroke="#1e4480" strokeWidth="3" />
                                        <path d="M46 28L34 26" stroke="#1e4480" strokeWidth="2.5" />
                                        <line x1="34" y1="20" x2="34" y2="32" stroke="#1e4480" strokeWidth="3" />
                                        <line x1="34" y1="26" x2="30" y2="26" stroke="#1e4480" strokeWidth="2" />
                                        <circle cx="28" cy="24" r="1.5" fill="#38bdf8" />
                                        <circle cx="26" cy="29" r="1" fill="#38bdf8" />
                                     </svg>
                                  </div>
                               </div>
                               <p className="text-slate-500 text-[8.5px] font-semibold leading-relaxed mt-3">
                                  Serviço técnico especializado para áreas de difícil acesso, como fachadas de vidro e estruturas industriais elevadas. Utilizamos as mais rígidas metodologias de segurança (NR-35) e equipamentos profissionais certificados.
                               </p>
                            </div>
                         </div>

                         {/* Painel inferior com as 5 categorias de serviços */}
                         <div className="flex justify-between items-center w-full pt-4 mt-auto border-t border-slate-100 relative z-20 gap-3">
                            {[
                               {
                                  title: 'LIMPEZA',
                                  desc: 'Higienização técnica',
                                  svg: (
                                     <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-white">
                                        <circle cx="32" cy="16" r="6" fill="currentColor" />
                                        <path d="M26 14C26 12 30 10 34 10H38" stroke="currentColor" strokeWidth="2.5" />
                                        <path d="M22 28C22 24 25 24 32 24C39 24 42 24 42 28V46H22V28Z" fill="currentColor" />
                                        <path d="M28 24V46M36 24V46" stroke="#1e4480" strokeWidth="1.5" />
                                        <path d="M22 30L12 34L12 48" stroke="currentColor" strokeWidth="3.5" />
                                        <line x1="10" y1="12" x2="10" y2="54" stroke="currentColor" strokeWidth="2.5" />
                                        <path d="M4 54H16L18 58H2L4 54Z" fill="currentColor" />
                                        <path d="M42 30L50 36L50 44" stroke="currentColor" strokeWidth="3.5" />
                                        <path d="M46 44H54L56 56H44L46 44Z" fill="currentColor" />
                                        <path d="M46 44C46 44 48 40 50 40C52 40 54 44 54 44" stroke="currentColor" strokeWidth="1.5" />
                                     </svg>
                                  )
                               },
                               {
                                  title: 'PORTARIA',
                                  desc: 'Controle especializado',
                                  svg: (
                                     <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-white">
                                        <path d="M18 18C18 10 24 8 32 8C40 8 46 10 46 18H18Z" fill="currentColor" />
                                        <path d="M14 18H50V20C50 20 40 22 32 22C24 22 14 20 14 20Z" fill="currentColor" />
                                        <path d="M32 10L35 13L32 16L29 13Z" fill="#eab308" />
                                        <circle cx="32" cy="25" r="6" fill="currentColor" />
                                        <path d="M16 38C16 33 20 32 32 32C44 32 48 33 48 38V52H16V38Z" fill="currentColor" />
                                        <path d="M28 32L32 40L36 32Z" fill="#ffffff" />
                                        <path d="M31 35L33 35L33 48L31 48Z" fill="#1e4480" />
                                        <path d="M22 36L25 38L24 41L20 41L19 38Z" fill="#eab308" />
                                        <path d="M16 34H22" stroke="#eab308" strokeWidth="2.5" />
                                        <path d="M42 34H48" stroke="#eab308" strokeWidth="2.5" />
                                     </svg>
                                  )
                               },
                               {
                                  title: 'RECEPÇÃO',
                                  desc: 'Atendimento corporativo',
                                  svg: (
                                     <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-white">
                                        <path d="M4 42H60V54H4V42Z" fill="currentColor" />
                                        <line x1="8" y1="46" x2="56" y2="46" stroke="#1e4480" strokeWidth="2" />
                                        <circle cx="22" cy="22" r="5" fill="currentColor" />
                                        <path d="M17 18C15 21 16 25 22 25C28 25 29 21 27 18" stroke="currentColor" strokeWidth="2.5" />
                                        <path d="M12 36C12 30 15 28 22 28C29 28 32 30 32 36V42H12V36Z" fill="currentColor" />
                                        <circle cx="42" cy="22" r="5" fill="currentColor" />
                                        <path d="M37 20C37 15 47 15 47 20" stroke="currentColor" strokeWidth="2" />
                                        <path d="M32 36C32 30 35 28 42 28C49 28 52 30 52 36V42H32V36Z" fill="currentColor" />
                                        <path d="M26 38L30 32H34L38 38H26Z" fill="#cbd5e1" stroke="currentColor" strokeWidth="1.5" />
                                        <line x1="24" y1="40" x2="40" y2="40" stroke="currentColor" strokeWidth="2" />
                                     </svg>
                                  )
                               },
                               {
                                  title: 'MANUTENÇÃO',
                                  desc: 'Conservação preventiva',
                                  svg: (
                                     <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-white">
                                        <circle cx="48" cy="20" r="8" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
                                        <path d="M48 10V12M48 28V30M38 20H40M56 20H58" stroke="currentColor" strokeWidth="2" />
                                        <circle cx="28" cy="18" r="6" fill="currentColor" />
                                        <path d="M22 15C22 13 26 11 31 11H36" stroke="currentColor" strokeWidth="2.5" />
                                        <path d="M16 30C16 26 19 25 28 25C37 25 40 26 40 30V48H16V30Z" fill="currentColor" />
                                        <path d="M38 32L48 28L48 40" stroke="currentColor" strokeWidth="3.5" />
                                        <path d="M46 20L50 24" stroke="currentColor" strokeWidth="3.5" />
                                        <circle cx="45" cy="19" r="3" stroke="currentColor" strokeWidth="2" fill="#1e4480" />
                                        <circle cx="51" cy="25" r="3" stroke="currentColor" strokeWidth="2" fill="#1e4480" />
                                        <rect x="20" y="29" width="4" height="6" rx="0.5" fill="#ffffff" />
                                     </svg>
                                  )
                               },
                               {
                                  title: 'JARDINAGEM',
                                  desc: 'Escopo paisagístico',
                                  svg: (
                                     <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-white">
                                        <path d="M14 20C14 20 22 12 32 12C42 12 50 20 50 20H14Z" fill="currentColor" stroke="currentColor" strokeWidth="1" />
                                        <ellipse cx="32" cy="20" rx="22" ry="3" fill="currentColor" />
                                        <circle cx="32" cy="26" r="5" fill="currentColor" />
                                        <path d="M18 36C18 32 21 31 32 31C43 31 46 32 46 36V50H18V36Z" fill="currentColor" />
                                        <path d="M24 31V50M40 31V50" stroke="#1e4480" strokeWidth="2.5" />
                                        <path d="M44 38C44 38 48 34 52 35C52 35 54 40 48 42" fill="currentColor" />
                                        <path d="M48 30C48 30 52 27 55 30C55 30 54 35 49 33" fill="currentColor" />
                                        <path d="M28 42H36L38 48H26L28 42Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
                                        <circle cx="32" cy="38" r="2" fill="#eab308" />
                                     </svg>
                                  )
                               }
                            ].map((cat, idx) => (
                               <div key={idx} className="flex-1 bg-white border border-slate-150 rounded-2xl p-4 shadow-md flex flex-col items-center justify-between text-center h-32 hover:scale-[1.03] transition-transform duration-300">
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#1e4480] to-[#2c65bd] flex items-center justify-center shrink-0 shadow-sm">
                                     {cat.svg}
                                  </div>
                                  <div className="flex flex-col items-center">
                                     <span className="text-[#1e4480] text-[9px] font-black tracking-wider uppercase">{cat.title}</span>
                                     <span className="text-[7.5px] text-slate-400 font-bold mt-0.5 leading-tight">{cat.desc}</span>
                                  </div>
                               </div>
                            ))}
                         </div>

                         <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.grupojvsserv.com.br</span>
                            <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">05</span>
                         </div>
                      </div>\n\n`;

   content = content.substring(0, s05StartIdx) + newS05Content + content.substring(s05EndIdx);
   console.log("✔ Slide 05 PRINT atualizado com sucesso!");
}

// ----------------------------------------------------
// 4. REFATORAÇÃO DO SLIDE 06 PRINT - SETORES ATENDIDOS
// ----------------------------------------------------
const s06StartIdx = content.indexOf(s06StartStr);
const s06EndIdx = content.indexOf(s06EndStr);

if (s06StartIdx !== -1 && s06EndIdx !== -1) {
   console.log("✔ Slide 06 PRINT (Setores Atendidos) localizado!");

   const newS06Content = s06StartStr + `
                      <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-gradient-to-br from-[#1e4480] to-[#0f284e] p-16 flex flex-col justify-between relative overflow-hidden h-[100vh] text-white">
                         {/* Stripes de fundo */}
                         <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10" xmlns="http://www.w3.org/2000/svg">
                            <line x1="-100" y1="100" x2="400" y2="-400" stroke="#FFFFFF" strokeWidth="18" />
                            <line x1="-100" y1="150" x2="450" y2="-400" stroke="#FFFFFF" strokeWidth="12" />
                            <line x1="500" y1="900" x2="1200" y2="200" stroke="#FFFFFF" strokeWidth="18" />
                         </svg>
                         
                         <div className="grid grid-cols-12 gap-8 items-stretch h-[calc(100%-140px)] relative z-10 my-auto">
                            {/* Coluna do Título (Esquerda) */}
                            <div className="col-span-3 flex flex-col justify-center h-full">
                               <span className="text-emerald-400 text-[10px] font-black tracking-[0.2em] uppercase">CARTEIRA SÓLIDA</span>
                               <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-none mt-1">
                                  SETORES<br />
                                  ATENDIDOS
                               </h2>
                            </div>

                            {/* Coluna 1 (Centro) - Indústria */}
                            <div className="col-span-4 bg-white/10 border border-white/15 backdrop-blur-md rounded-2xl p-6 shadow-lg flex flex-col justify-between hover:scale-[1.01] transition-transform">
                               <div className="flex items-center justify-between gap-2 border-b border-white/15 pb-3">
                                  <span className="text-white text-[10px] font-black tracking-wide uppercase leading-tight">
                                     INDÚSTRIA E LOGÍSTICA
                                  </span>
                                  <div className="bg-white/15 p-2 rounded-xl text-white shrink-0 shadow-sm">
                                     <Factory size={20} className="stroke-[2.5]" />
                                  </div>
                               </div>
                               <p className="text-white/85 text-[8.5px] font-semibold leading-relaxed mt-3">
                                  Com processos minuciosos e rigorosos de auditorias, o setor industrial chancela a capacidade técnica da JVS Facilities de operar em ambientes de altíssima exigência, conformidade técnica e regulamentação (NRs).
                               </p>
                            </div>

                            {/* Coluna 2 (Direita) - Varejo */}
                            <div className="col-span-5 bg-white/10 border border-white/15 backdrop-blur-md rounded-2xl p-6 shadow-lg flex flex-col justify-between hover:scale-[1.01] transition-transform">
                               <div className="flex items-center justify-between gap-2 border-b border-white/15 pb-3">
                                  <span className="text-white text-[10px] font-black tracking-wide uppercase leading-tight">
                                     VAREJO, CORPORATIVO E PÚBLICO
                                  </span>
                                  <div className="bg-white/15 p-2 rounded-xl text-white shrink-0 shadow-sm">
                                     <Store size={20} className="stroke-[2.5]" />
                                  </div>
                               </div>
                               <p className="text-white/85 text-[8.5px] font-semibold leading-relaxed mt-3">
                                  Um dos nossos maiores pilares. Atendemos redes de varejo exigindo máxima resiliência e dinamismo operacional em grande escala, resultando em índices impecáveis de absenteísmo, satisfação e rotatividade controlada.
                               </p>
                            </div>
                         </div>

                         {/* Painel inferior com as 5 categorias de setores */}
                         <div className="flex justify-between items-center w-full pt-4 mt-auto border-t border-white/15 relative z-20 gap-3">
                            {[
                               {
                                  title: 'TRANSPORTE',
                                  desc: 'Hubs logísticos',
                                  svg: <Bus size={18} className="text-[#1e4480] stroke-[2.5]" />
                               },
                               {
                                  title: 'CONDOMÍNIOS',
                                  desc: 'Edifícios e residenciais',
                                  svg: <Building size={18} className="text-[#1e4480] stroke-[2.5]" />
                               },
                               {
                                  title: 'HOSPITAIS',
                                  desc: 'Clínicas e saúde',
                                  svg: <Hospital size={18} className="text-[#1e4480] stroke-[2.5]" />
                               },
                               {
                                  title: 'SHOPPING CENTERS',
                                  desc: 'Grandes empreendimentos',
                                  svg: <ShoppingBag size={18} className="text-[#1e4480] stroke-[2.5]" />
                               },
                               {
                                  title: 'EDUCACIONAL',
                                  desc: 'Escolas e universidades',
                                  svg: <GraduationCap size={18} className="text-[#1e4480] stroke-[2.5]" />
                               }
                            ].map((setor, idx) => (
                               <div key={idx} className="flex-1 bg-white border border-slate-150 rounded-2xl p-4 shadow-lg flex flex-col items-center justify-between text-center h-28 hover:scale-[1.03] transition-transform duration-300">
                                  <div className="w-10 h-10 rounded-full bg-[#1e4480]/10 flex items-center justify-center shrink-0">
                                     {setor.svg}
                                  </div>
                                  <div className="flex flex-col items-center">
                                     <span className="text-[#1e4480] text-[8.5px] font-black tracking-wider uppercase leading-tight">{setor.title}</span>
                                     <span className="text-[7px] text-slate-400 font-bold mt-0.5 leading-none">{setor.desc}</span>
                                  </div>
                               </div>
                            ))}
                         </div>

                         <div className="flex justify-between items-center border-t border-white/20 pt-4 mt-auto">
                            <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">www.grupojvsserv.com.br</span>
                            <span className="text-[9px] font-black text-white/80 bg-white/10 px-2.5 py-0.5 rounded">06</span>
                         </div>
                      </div>\n\n`;

   content = content.substring(0, s06StartIdx) + newS06Content + content.substring(s06EndIdx);
   console.log("✔ Slide 06 PRINT atualizado com sucesso!");
}

// ----------------------------------------------------
// 5. GRAVAÇÃO FINAL DO ARQUIVO
// ----------------------------------------------------
fs.writeFileSync(pagePath, content, 'utf8');
console.log("✔ Arquivo page.tsx atualizado com as refatorações institucionais premium!");
