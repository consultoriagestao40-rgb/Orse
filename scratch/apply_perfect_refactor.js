const fs = require('fs');
const path = require('path');

// 1. Primeiro vamos garantir que page.tsx esteja resetado para d66bdf8 antes de reaplicar
const { execSync } = require('child_process');
console.log("🔄 Resetando page.tsx para o estado original estável do Git...");
execSync('git checkout d66bdf8 -- app/propostas/nova/page.tsx');

const pagePath = path.join(__dirname, '..', 'app', 'propostas', 'nova', 'page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

console.log("📖 Lendo page.tsx resetado para aplicação cirúrgica...");

// Âncoras exatas completas do arquivo original
const s03StartStr = '{/* SLIDE 03 PRINT - NOSSA PRESENÇA / QUEM SOMOS */}';
const s04StartStr = '{/* SLIDE 04 PRINT - NOSSOS VALORES */}';
const s05StartStr = '{/* SLIDE 05 PRINT - PRINCIPAIS SERVIÇOS PRESTADOS */}';
const s06StartStr = '{/* SLIDE 06 PRINT - SETORES ATENDIDOS */}';
const s07StartStr = '{/* SLIDE 07 PRINT - PRINCIPAIS FERRAMENTAS */}';

// Localizar os índices absolutos das âncoras
const idx03 = content.indexOf(s03StartStr);
const idx04 = content.indexOf(s04StartStr);
const idx05 = content.indexOf(s05StartStr);
const idx06 = content.indexOf(s06StartStr);
const idx07 = content.indexOf(s07StartStr);

console.log("Índices das âncoras:", { idx03, idx04, idx05, idx06, idx07 });

if (idx03 !== -1 && idx04 !== -1 && idx05 !== -1 && idx06 !== -1 && idx07 !== -1) {
   console.log("✔ Todas as âncoras institucionais localizadas perfeitamente!");

   const newS03Code = `
                      <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-[#1e4480] p-16 flex flex-col justify-between relative overflow-hidden h-[100vh] text-white">
                         {/* Linhas diagonais decorativas da marca */}
                         <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
                            <line x1="-50" y1="150" x2="350" y2="-250" stroke="#FFFFFF" strokeWidth="10" />
                            <line x1="-50" y1="200" x2="400" y2="-250" stroke="#FFFFFF" strokeWidth="6" />
                            <line x1="-50" y1="250" x2="450" y2="-250" stroke="#FFFFFF" strokeWidth="3" />
                            
                            <line x1="600" y1="800" x2="1100" y2="300" stroke="#FFFFFF" strokeWidth="10" />
                            <line x1="650" y1="800" x2="1150" y2="300" stroke="#FFFFFF" strokeWidth="6" />
                            <line x1="700" y1="800" x2="1200" y2="300" stroke="#FFFFFF" strokeWidth="3" />
                         </svg>

                         <div className="grid grid-cols-12 gap-8 items-center h-[calc(100%-40px)] relative z-10">
                            {/* Coluna de Texto e KPIs (Esquerda) */}
                            <div className="col-span-7 flex flex-col justify-center space-y-5 pl-2 h-full text-white">
                               <div>
                                  <h2 className="text-4xl font-black text-white tracking-tight leading-none uppercase">
                                     QUEM SOMOS
                                  </h2>
                                  <p className="text-white/95 text-[14px] font-semibold leading-relaxed mt-4 max-w-xl">
                                     Há mais de 30 anos no mercado de Facilities, somos especialistas em prestações de serviços de limpeza profissional e similares.
                                  </p>
                               </div>

                               {/* Grid de KPIs */}
                               <div className="grid grid-cols-5 gap-4 pt-6 border-t border-white/15">
                                  {/* Anos de atuação */}
                                  <div className="flex flex-col items-center text-center">
                                     <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-2 shadow-md">
                                        <Award size={26} className="text-white shrink-0" />
                                     </div>
                                     <span className="text-[14px] font-bold text-white leading-none whitespace-nowrap">+de <strong className="text-xl font-black">30</strong></span>
                                     <span className="text-[10px] font-extrabold text-white/90 uppercase mt-1 leading-tight tracking-wide block max-w-[85px]">
                                        Anos de atuação em Facilities
                                     </span>
                                  </div>

                                  {/* Postos ativos */}
                                  <div className="flex flex-col items-center text-center">
                                     <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-2 shadow-md">
                                        <MapPin size={26} className="text-white shrink-0" />
                                     </div>
                                     <span className="text-[14px] font-bold text-white leading-none whitespace-nowrap">+ <strong className="text-xl font-black">100</strong></span>
                                     <span className="text-[10px] font-extrabold text-white/90 uppercase mt-1 leading-tight tracking-wide block max-w-[85px]">
                                        postos ativos
                                     </span>
                                  </div>

                                  {/* Clientes atendidos */}
                                  <div className="flex flex-col items-center text-center">
                                     <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-2 shadow-md">
                                        <Users size={26} className="text-white shrink-0" />
                                     </div>
                                     <span className="text-[14px] font-bold text-white leading-none whitespace-nowrap">+ <strong className="text-xl font-black">200</strong></span>
                                     <span className="text-[10px] font-extrabold text-white/90 uppercase mt-1 leading-tight tracking-wide block max-w-[85px]">
                                        Clientes atendidos
                                     </span>
                                  </div>

                                  {/* Limpeza em altura */}
                                  <div className="flex flex-col items-center text-center">
                                     <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-2 shadow-md">
                                        <ShieldCheck size={26} className="text-white shrink-0" />
                                     </div>
                                     <span className="text-[12px] font-black text-white leading-none whitespace-nowrap">+100.000m²</span>
                                     <span className="text-[10px] font-extrabold text-white/90 uppercase mt-1 leading-tight tracking-wide block max-w-[85px]">
                                        de limpeza em altura
                                     </span>
                                  </div>

                                  {/* Pisos tratados */}
                                  <div className="flex flex-col items-center text-center">
                                     <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-2 shadow-md">
                                        <Sparkles size={26} className="text-white shrink-0" />
                                     </div>
                                     <span className="text-[12px] font-black text-white leading-none whitespace-nowrap">+500.000m²</span>
                                     <span className="text-[10px] font-extrabold text-white/90 uppercase mt-1 leading-tight tracking-wide block max-w-[85px]">
                                        de Pisos tratados
                                     </span>
                                  </div>
                               </div>
                            </div>

                            {/* Coluna do Mapa (Direita) */}
                            <div className="col-span-5 h-full flex flex-col justify-center items-center relative pr-2">
                               <div className="w-full max-w-[300px] aspect-square drop-shadow-lg">
                                  <BrazilMap highlightedStates={['PR', 'SC', 'RS']} className="w-full h-full" />
                               </div>
                               <div className="text-[13px] font-black text-white uppercase tracking-widest mt-4 bg-white/10 px-4 py-1.5 rounded-full shadow-sm">
                                  Atendimento em toda Região Sul
                               </div>
                            </div>
                         </div>

                         {/* Rodapé do Slide 3 */}
                         <div className="relative z-20 flex justify-between items-end w-full text-white/70 text-[10px] font-extrabold uppercase tracking-wider pr-4 mt-auto">
                            <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest">www.grupojvsserv.com.br</span>
                            <span className="text-[9px] font-black text-white bg-white/10 px-2.5 py-0.5 rounded backdrop-blur-xs">03</span>
                         </div>
                      </div>
`;

   const newS04Code = `
                      <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-white p-16 flex flex-col justify-between relative overflow-hidden h-[100vh]">
                         {/* Stripes de fundo */}
                         <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" xmlns="http://www.w3.org/2000/svg">
                            <line x1="-50" y1="150" x2="350" y2="-250" stroke="#E2E8F0" strokeWidth="10" />
                            <line x1="-50" y1="200" x2="400" y2="-250" stroke="#E2E8F0" strokeWidth="6" />
                            <line x1="-50" y1="250" x2="450" y2="-250" stroke="#E2E8F0" strokeWidth="3" />
                            
                            <line x1="600" y1="800" x2="1100" y2="300" stroke="#E2E8F0" strokeWidth="10" />
                            <line x1="650" y1="800" x2="1150" y2="300" stroke="#E2E8F0" strokeWidth="6" />
                            <line x1="700" y1="800" x2="1200" y2="300" stroke="#E2E8F0" strokeWidth="3" />
                         </svg>
                         
                         <div className="grid grid-cols-12 gap-8 items-center h-[calc(100%-40px)] relative z-10">
                            {/* Coluna de Texto (Esquerda) */}
                            <div className="col-span-7 flex flex-col justify-center space-y-4 pl-2 h-full">
                               <div>
                                  <h2 className="text-4xl font-black text-[#1E3A8A] tracking-tight leading-none uppercase">
                                     NOSSOS VALORES
                                  </h2>
                                  <p className="text-slate-600 text-[14px] font-semibold leading-relaxed mt-5">
                                     Nosso compromisso é guiado por princípios sólidos: agimos com <strong className="underline decoration-[#1B4D3E] decoration-2 font-black text-slate-800">ética</strong>, mantendo a integridade acima de benefícios momentâneos. Buscamos <strong className="underline decoration-[#1B4D3E] decoration-2 font-black text-slate-800">agilidade</strong>, <strong className="underline decoration-[#1B4D3E] decoration-2 font-black text-slate-800">eficiência</strong> e <strong className="underline decoration-[#1B4D3E] decoration-2 font-black text-slate-800">excelência</strong> através do aprimoramento contínuo de processos e sistemas. <strong className="underline decoration-[#1B4D3E] decoration-2 font-black text-slate-800">Valorizamos nossas pessoas</strong>, promovendo um ambiente humanizado e soluções que garantem a satisfação e a permanência dos colaboradores. Somos comprometidos com a <strong className="underline decoration-[#1B4D3E] decoration-2 font-black text-slate-800">entrega</strong> dos nossos acordos, mesmo diante de desafios. Além disso, investimos em <strong className="underline decoration-[#1B4D3E] decoration-2 font-black text-slate-800">inovação</strong> e <strong className="underline decoration-[#1B4D3E] decoration-2 font-black text-slate-800">tecnologia</strong> para otimizar a automação, produtividade e eficiência.
                                  </p>
                               </div>
                            </div>

                            {/* Coluna Gráfica (Direita) */}
                            <div className="col-span-5 h-full w-full flex items-center justify-center relative">
                               {/* Imagem da mão recortada no canto inferior direito */}
                               <div 
                                  className="absolute right-0 bottom-0 w-[320px] h-[180px] bg-contain bg-right-bottom bg-no-repeat pointer-events-none opacity-90 z-10"
                                  style={{ backgroundImage: "url('https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=800')" }}
                               ></div>

                               {/* As 3 Esferas de Valores */}
                               <div className="relative w-full h-[220px] z-20">
                                  {/* Esfera 1 (Trophy) */}
                                  <div className="absolute top-0 left-1/2 -translate-x-1/2 flex items-center justify-center w-20 h-20 rounded-full bg-[#1e4480] text-white shadow-2xl">
                                     <Trophy size={36} className="text-white shrink-0" />
                                  </div>

                                  {/* Esfera 2 (Lightbulb) */}
                                  <div className="absolute bottom-12 left-4 flex items-center justify-center w-20 h-20 rounded-full bg-[#1e4480] text-white shadow-2xl">
                                     <Lightbulb size={36} className="text-white shrink-0" />
                                  </div>

                                  {/* Esfera 3 (Users) */}
                                  <div className="absolute bottom-12 right-4 flex items-center justify-center w-20 h-20 rounded-full bg-[#1e4480] text-white shadow-2xl">
                                     <Users size={36} className="text-white shrink-0" />
                                  </div>
                               </div>
                            </div>
                         </div>

                         <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.grupojvsserv.com.br</span>
                            <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">04</span>
                         </div>
                      </div>
`;

   const newS05Code = `
                      <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-white p-16 flex flex-col justify-between relative overflow-hidden h-[100vh]">
                         {/* Stripes de fundo */}
                         <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-50" xmlns="http://www.w3.org/2000/svg">
                            <line x1="-100" y1="100" x2="400" y2="-400" stroke="#F1F5F9" strokeWidth="18" />
                            <line x1="-100" y1="150" x2="450" y2="-400" stroke="#F1F5F9" strokeWidth="12" />
                            <line x1="-100" y1="200" x2="500" y2="-400" stroke="#F1F5F9" strokeWidth="6" />
                            <line x1="-100" y1="250" x2="550" y2="-400" stroke="#F1F5F9" strokeWidth="3" />
                            <line x1="-100" y1="300" x2="600" y2="-400" stroke="#F1F5F9" strokeWidth="12" />
                            <line x1="-100" y1="350" x2="650" y2="-400" stroke="#F1F5F9" strokeWidth="4" />
                            
                            <line x1="500" y1="900" x2="1200" y2="200" stroke="#F1F5F9" strokeWidth="18" />
                            <line x1="550" y1="900" x2="1250" y2="200" stroke="#F1F5F9" strokeWidth="12" />
                            <line x1="600" y1="900" x2="1300" y2="200" stroke="#F1F5F9" strokeWidth="6" />
                            <line x1="650" y1="900" x2="1350" y2="200" stroke="#F1F5F9" strokeWidth="3" />
                            <line x1="700" y1="900" x2="1400" y2="200" stroke="#F1F5F9" strokeWidth="12" />
                            <line x1="750" y1="900" x2="1450" y2="200" stroke="#F1F5F9" strokeWidth="4" />
                         </svg>
                         
                         <div className="grid grid-cols-12 gap-8 items-center h-[calc(100%-150px)] relative z-10">
                            {/* Coluna do Título (Esquerda) */}
                            <div className="col-span-4 flex flex-col justify-center h-full pr-2">
                               <h2 className="text-4xl font-black text-[#1e4480] uppercase tracking-tight leading-none">
                                  PRINCIPAIS<br />
                                  SERVIÇOS<br />
                                  PRESTADOS
                               </h2>
                            </div>

                            {/* Coluna 1 (Centro) - Terceirização */}
                            <div className="col-span-4 flex flex-col space-y-3 h-full justify-center">
                               <div className="flex items-center justify-between gap-2 border-b border-slate-150 pb-2">
                                  <span className="text-[#1e4480] text-[13px] font-black tracking-wide uppercase leading-tight max-w-[200px]">
                                     TERCEIRIZAÇÃO DE SERVIÇOS DE FACILITIES
                                  </span>
                                  <div className="text-[#1e4480] shrink-0">
                                     <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16 shrink-0">
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
                               <p className="text-slate-600 text-[12.5px] font-semibold leading-relaxed mt-2">
                                  Gestão e execução de serviços essenciais, como limpeza, manutenção e segurança, que garantem o bom funcionamento e organização de um ambiente de trabalho. Nossa função é cuidar de tudo isso para que a empresa possa focar no que faz de melhor, enquanto oferecemos um espaço eficiente, seguro e bem cuidado.
                               </p>
                            </div>

                            {/* Coluna 2 (Direita) - Limpeza em Altura */}
                            <div className="col-span-4 flex flex-col space-y-3 h-full justify-center pl-2">
                               <div className="flex items-center justify-between gap-2 border-b border-slate-150 pb-2">
                                  <span className="text-[#1e4480] text-[13px] font-black tracking-wide uppercase leading-tight">
                                     LIMPEZA EM ALTURA
                                  </span>
                                  <div className="text-[#1e4480] shrink-0">
                                     <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16 shrink-0">
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
                               <p className="text-slate-600 text-[12.5px] font-semibold leading-relaxed mt-2">
                                  Serviço que é realizado em áreas de difícil acesso, como fachadas de prédios, janelas externas e estruturas elevadas. Usamos equipamentos específicos e técnicas seguras para garantir que essas superfícies sejam limpas de maneira eficiente, mantendo a estética e a segurança dos espaços altos, onde o cuidado e a precisão são essenciais.
                               </p>
                            </div>
                         </div>

                         {/* Painel inferior com as 5 categorias de serviços */}
                         <div className="flex justify-around items-center w-full pt-6 mt-auto border-t border-slate-100 relative z-20">
                            {/* Categoria 1: Limpeza */}
                            <div className="flex flex-col items-center justify-center">
                               <div className="bg-[#1e4480] text-white w-24 h-24 flex items-center justify-center rounded-full shadow-2xl">
                                  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16 text-white">
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
                               </div>
                               <span className="text-[#1e4480] text-[13px] font-black tracking-wider uppercase mt-4">
                                  LIMPEZA
                               </span>
                            </div>

                            {/* Categoria 2: Portaria */}
                            <div className="flex flex-col items-center justify-center">
                               <div className="bg-[#1e4480] text-white w-24 h-24 flex items-center justify-center rounded-full shadow-2xl">
                                  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16 text-white">
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
                               </div>
                               <span className="text-[#1e4480] text-[13px] font-black tracking-wider uppercase mt-4">
                                  PORTARIA
                               </span>
                            </div>

                            {/* Categoria 3: Recepção */}
                            <div className="flex flex-col items-center justify-center">
                               <div className="bg-[#1e4480] text-white w-24 h-24 flex items-center justify-center rounded-full shadow-2xl">
                                  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16 text-white">
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
                               </div>
                               <span className="text-[#1e4480] text-[13px] font-black tracking-wider uppercase mt-4">
                                  RECEPÇÃO
                               </span>
                            </div>

                            {/* Categoria 4: Manutenção */}
                            <div className="flex flex-col items-center justify-center">
                               <div className="bg-[#1e4480] text-white w-24 h-24 flex items-center justify-center rounded-full shadow-2xl">
                                  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16 text-white">
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
                               </div>
                               <span className="text-[#1e4480] text-[13px] font-black tracking-wider uppercase mt-4">
                                  MANUTENÇÃO
                               </span>
                            </div>

                            {/* Categoria 5: Jardinagem */}
                            <div className="flex flex-col items-center justify-center">
                               <div className="bg-[#1e4480] text-white w-24 h-24 flex items-center justify-center rounded-full shadow-2xl">
                                  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16 text-white">
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
                               </div>
                               <span className="text-[#1e4480] text-[13px] font-black tracking-wider uppercase mt-4">
                                  JARDINAGEM
                               </span>
                            </div>
                         </div>

                         <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.grupojvsserv.com.br</span>
                            <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">05</span>
                         </div>
                      </div>
`;

   const newS06Code = `
                      <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-[#1e4480] p-16 flex flex-col justify-between relative overflow-hidden h-[100vh] text-white">
                         {/* Stripes de fundo */}
                         <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
                            <line x1="-50" y1="150" x2="350" y2="-250" stroke="#FFFFFF" strokeWidth="10" />
                            <line x1="-50" y1="200" x2="400" y2="-250" stroke="#FFFFFF" strokeWidth="6" />
                            <line x1="-50" y1="250" x2="450" y2="-250" stroke="#FFFFFF" strokeWidth="3" />
                            <line x1="600" y1="800" x2="1100" y2="300" stroke="#FFFFFF" strokeWidth="10" />
                            <line x1="650" y1="800" x2="1150" y2="300" stroke="#FFFFFF" strokeWidth="6" />
                            <line x1="700" y1="800" x2="1200" y2="300" stroke="#FFFFFF" strokeWidth="3" />
                         </svg>
                         
                         <div className="grid grid-cols-12 gap-8 items-center h-[calc(100%-110px)] relative z-10">
                            {/* Coluna do Título (Esquerda) */}
                            <div className="col-span-4 flex flex-col justify-center h-full pr-2">
                               <h2 className="text-4xl font-black text-white uppercase tracking-tight leading-none">
                                  SETORES<br />
                                  ATENDIDOS
                               </h2>
                            </div>

                            {/* Coluna 1 (Centro) - Industria */}
                            <div className="col-span-4 flex flex-col space-y-3 h-full justify-center">
                               <div className="flex flex-col border-b border-white/20 pb-2">
                                  <div className="w-12 h-1.5 bg-white mb-2"></div>
                                  <div className="flex items-center justify-between gap-2">
                                     <span className="text-white text-[14px] font-black tracking-wide uppercase leading-tight">
                                        INDUSTRIA
                                     </span>
                                     <div className="bg-white/10 p-2 rounded-xl text-white shrink-0 shadow-sm">
                                        <Factory size={22} className="stroke-[2.5]" />
                                     </div>
                                  </div>
                               </div>
                               <p className="text-white/90 text-[12.5px] font-semibold leading-relaxed mt-2">
                                  Com processos minuciosos e detalhados, o sector industrial trouxe para o escopo da JVS Facilities a capacidade de atender clientes de alta exigência. Possuímos qualidade técnica validada no mercado para atender as mais variadas necessidades da industria.
                               </p>
                            </div>

                            {/* Coluna 2 (Direita) - Varejo */}
                            <div className="col-span-4 flex flex-col space-y-3 h-full justify-center pl-2">
                               <div className="flex flex-col border-b border-white/20 pb-2">
                                  <div className="w-12 h-1.5 bg-white mb-2"></div>
                                  <div className="flex items-center justify-between gap-2">
                                     <span className="text-white text-[14px] font-black tracking-wide uppercase leading-tight">
                                        VAREJO
                                     </span>
                                     <div className="bg-white/10 p-2 rounded-xl text-white shrink-0 shadow-sm">
                                        <Store size={22} className="stroke-[2.5]" />
                                     </div>
                                  </div>
                               </div>
                               <p className="text-white/90 text-[12.5px] font-semibold leading-relaxed mt-2">
                                  Um dos setores com maior participação em nossa carteira de clientes, o varejo exigiu resiliência e trabalho árduo em busca de superar os desafios operacionais, que por fim, resultaram em constantes avaliações positivas de satisfação e controle dos indicadores de rotatividade e absenteísmo.
                               </p>
                            </div>
                         </div>

                         {/* Painel inferior com as 5 categorias de setores */}
                         <div className="flex justify-around items-center w-full pt-6 mt-auto border-t border-white/20 relative z-20">
                            {/* Setor 1: Transporte */}
                            <div className="flex flex-col items-center justify-center">
                               <div className="bg-white text-[#1e4480] shadow-xl w-16 h-16 flex items-center justify-center rounded-full">
                                  <Bus size={26} className="stroke-[2]" />
                               </div>
                               <span className="text-white text-[11px] font-black tracking-wider uppercase mt-3 text-center max-w-[100px] leading-tight">
                                  TRANSPORTE<br />E LOGÍSTICA
                               </span>
                            </div>

                            {/* Setor 2: Condominios */}
                            <div className="flex flex-col items-center justify-center">
                               <div className="bg-white text-[#1e4480] shadow-xl w-16 h-16 flex items-center justify-center rounded-full">
                                  <Building size={26} className="stroke-[2]" />
                               </div>
                               <span className="text-white text-[11px] font-black tracking-wider uppercase mt-3 text-center max-w-[110px] leading-tight">
                                  CONDOMÍNIOS<br />E EDIFÍCIOS
                               </span>
                            </div>

                            {/* Setor 3: Clinicas */}
                            <div className="flex flex-col items-center justify-center">
                               <div className="bg-white text-[#1e4480] shadow-xl w-16 h-16 flex items-center justify-center rounded-full">
                                  <Hospital size={26} className="stroke-[2]" />
                               </div>
                               <span className="text-white text-[11px] font-black tracking-wider uppercase mt-3 text-center max-w-[100px] leading-tight">
                                  CLÍNICAS E<br />HOSPITAIS
                               </span>
                            </div>

                            {/* Setor 4: Shoppings */}
                            <div className="flex flex-col items-center justify-center">
                               <div className="bg-white text-[#1e4480] shadow-xl w-16 h-16 flex items-center justify-center rounded-full">
                                  <ShoppingBag size={26} className="stroke-[2]" />
                               </div>
                               <span className="text-white text-[11px] font-black tracking-wider uppercase mt-3 text-center max-w-[100px] leading-tight">
                                  SHOPPING<br />CENTERS
                               </span>
                            </div>

                            {/* Setor 5: Educacionais */}
                            <div className="flex flex-col items-center justify-center">
                               <div className="bg-white text-[#1e4480] shadow-xl w-16 h-16 flex items-center justify-center rounded-full">
                                  <GraduationCap size={26} className="stroke-[2]" />
                               </div>
                               <span className="text-white text-[11px] font-black tracking-wider uppercase mt-3 text-center max-w-[120px] leading-tight">
                                  ESTABELECIMENTOS<br />EDUCACIONAIS
                               </span>
                            </div>
                         </div>

                         <div className="flex justify-between items-center border-t border-white/20 pt-4 mt-auto">
                            <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">www.grupojvsserv.com.br</span>
                            <span className="text-[9px] font-black text-white/80 bg-white/10 px-2.5 py-0.5 rounded">06</span>
                         </div>
                      </div>
`;

   // Realizar as substituições com as âncoras completas intactas
   content = 
      content.substring(0, idx03) + s03StartStr + newS03Code +
      s04StartStr + newS04Code +
      s05StartStr + newS05Code +
      s06StartStr + newS06Code +
      content.substring(idx06 + s06StartStr.length);

   console.log("✔ Slides institucionais (03, 04, 05, 06) atualizados perfeitamente!");
} else {
   console.log("❌ Falha crítica ao localizar slides institucionais!");
}


// ==========================================
// 3. REFATORAÇÃO - SLIDES COMERCIAIS / FINANCEIROS (09 A 13)
// ==========================================

const s09StartStr = '{/* SLIDE 09 PRINT - QUADRO EFETIVO */}';
const s09EndStr = '{/* SLIDE 10 PRINT - ITENS INCLUSOS E EXCLUSÍDOS */}';

const s10StartStr = '{/* SLIDE 10 PRINT - ITENS INCLUSOS E EXCLUSÍDOS */}';
const s10EndStr = '{/* SLIDE 11 PRINT - RESUMO DA PROPOSTA */}';

const s11StartStr = '{/* SLIDE 11 PRINT - RESUMO DA PROPOSTA */}';
const s11EndStr = '{/* SLIDE 12 PRINT - CONDIÇÕES DA PROPOSTA */}';

const s12StartStr = '{/* SLIDE 12 PRINT - CONDIÇÕES DA PROPOSTA */}';
const s12EndStr = '{/* SLIDE 13 PRINT - ACEITE */}';

const s13StartStr = '{/* SLIDE 13 PRINT - ACEITE */}';

// SLIDE 09
const s09StartIdx = content.indexOf(s09StartStr);
const s09EndIdx = content.indexOf(s09EndStr);
if (s09StartIdx !== -1 && s09EndIdx !== -1) {
   const newS09Content = s09StartStr + `
                      <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-white p-16 flex flex-col justify-between relative overflow-hidden h-[100vh] text-slate-800">
                         {/* Stripes de fundo corporativos modernos */}
                         <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" xmlns="http://www.w3.org/2000/svg">
                            <line x1="-100" y1="100" x2="400" y2="-400" stroke="#F1F5F9" strokeWidth="18" />
                            <line x1="-100" y1="150" x2="450" y2="-400" stroke="#F1F5F9" strokeWidth="12" />
                            <line x1="-100" y1="200" x2="500" y2="-400" stroke="#F1F5F9" strokeWidth="6" />
                            <line x1="500" y1="900" x2="1200" y2="200" stroke="#F1F5F9" strokeWidth="18" />
                            <line x1="550" y1="900" x2="1250" y2="200" stroke="#F1F5F9" strokeWidth="12" />
                         </svg>

                         <div className="flex flex-col justify-between h-full relative z-10 w-full">
                            {/* Header */}
                            <div className="flex justify-between items-center w-full pb-4 border-b border-slate-100">
                               <div className="flex flex-col">
                                  <span className="text-[#1e4480] text-[10px] font-black tracking-[0.2em] uppercase">JVS FACILITIES</span>
                                  <h2 className="text-xl font-black text-[#1e4480] uppercase tracking-tight">QUADRO DE EQUIPE EFETIVO</h2>
                               </div>
                               <img 
                                  src="https://grupojvsserv.com.br/wp-content/uploads/2023/11/logo-horizontal-300px.png" 
                                  alt="JVS Facilities Logo" 
                                  className="max-h-10 w-auto object-contain"
                               />
                            </div>

                            {/* Conteúdo Principal */}
                            <div className="my-auto w-full max-w-4xl mx-auto grid grid-cols-12 gap-8 items-stretch">
                               {/* Tabela de Quadro Efetivo */}
                               <div className="col-span-8 bg-white rounded-2xl border border-slate-150 shadow-lg overflow-hidden flex flex-col">
                                  <div className="bg-[#1e4480] text-center py-3">
                                     <h3 className="text-white text-xs font-black tracking-widest uppercase">{proposta.cliente.quadroEfetivoSubtitulo || 'Quadro efetivo - Opções'}</h3>
                                  </div>
                                  <div className="flex-1">
                                     <table className="w-full text-left border-collapse">
                                        <thead>
                                           <tr className="bg-slate-50 text-[#1e4480] text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                                              <th className="px-5 py-3">Função</th>
                                              <th className="px-5 py-3 text-center w-24">Qtd.</th>
                                              <th className="px-5 py-3 text-center w-28">Escala</th>
                                              <th className="px-5 py-3 text-center w-36">Horário</th>
                                           </tr>
                                        </thead>
                                        <tbody>
                                           {proposta.equipe && proposta.equipe.length > 0 ? (
                                              proposta.equipe.map((p: any, idx: number) => (
                                                 <tr key={p.id || idx} className={\`border-b border-slate-100 text-[10px] font-bold text-slate-700 \${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'}\`}>
                                                    <td className="px-5 py-3.5 font-black text-slate-800">{p.nomeCargo || "Selecione a Função"}</td>
                                                    <td className="px-5 py-3.5 text-center font-black text-[#1e4480]">{(p.quantidade || 0).toFixed(2).replace('.', ',')}</td>
                                                    <td className="px-5 py-3.5 text-center">{p.escala || "A definir"}</td>
                                                    <td className="px-5 py-3.5 text-center font-semibold text-slate-500">
                                                       {p.parametrosPosto?.horarioInicio && p.parametrosPosto?.horarioFim 
                                                          ? \`\${p.parametrosPosto.horarioInicio} às \${p.parametrosPosto.horarioFim}\` 
                                                          : '08:00 às 17:00'}
                                                    </td>
                                                 </tr>
                                              ))
                                           ) : (
                                              <tr className="border-b border-slate-100 text-[10px] font-semibold text-slate-400 italic">
                                                 <td colSpan={4} className="px-5 py-8 text-center bg-slate-50/10">
                                                    <div className="flex flex-col items-center justify-center space-y-1 py-4">
                                                       <p className="text-slate-400">Nenhum posto de trabalho inserido.</p>
                                                       <p className="text-[9px] text-slate-300">Por favor, adicione postos na aba 4 (Quadro Equipe).</p>
                                                    </div>
                                                 </td>
                                              </tr>
                                           )}
                                        </tbody>
                                     </table>
                                  </div>
                               </div>

                               {/* Cláusulas Operacionais */}
                               <div className="col-span-4 flex flex-col justify-center">
                                  <div className="bg-slate-50/70 border border-slate-150 rounded-2xl p-6 shadow-xs space-y-4">
                                     <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                                        <div className="w-2 h-4 bg-[#1e4480] rounded-full shrink-0"></div>
                                        <h4 className="text-[10px] font-black text-[#1e4480] uppercase tracking-wider">Diretrizes Operacionais</h4>
                                     </div>
                                     <div className="space-y-3">
                                        {(() => {
                                           const clausulas = proposta.cliente.quadroEfetivoClausulas || [
                                              proposta.cliente.quadroEfetivoClausula1 || 'Em casos de trabalho em feriados ou necessidades de jornada fora do escopo o funcionário deverá ter duas folgas compensatórias em sequência;',
                                              proposta.cliente.quadroEfetivoClausula2 || 'Para reduções no efetivo prazo de 30 (trinta) dias;',
                                              proposta.cliente.quadroEfetivoClausula3 || 'Intervalo para jornadas acima de 6h diárias de no mínimo 60 minutos, entre 4h a 6h o intervalo será de 15 minutos (CLT).'
                                           ];
                                           return clausulas.map((c: string, cIdx: number) => (
                                              <div key={cIdx} className="flex items-start gap-2.5">
                                                 <svg className="w-4 h-4 text-[#1e4480] shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                                                 </svg>
                                                 <p className="text-slate-600 text-[8.5px] font-semibold leading-relaxed">
                                                    {c}
                                                 </p>
                                              </div>
                                           ));
                                        })()}
                                     </div>
                                  </div>
                               </div>
                            </div>

                            {/* Rodapé */}
                            <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto">
                               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.grupojvsserv.com.br</span>
                               <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">09</span>
                            </div>
                         </div>
                      </div>\n\n`;
   content = content.substring(0, s09StartIdx) + newS09Content + content.substring(s09EndIdx);
   console.log("✔ Slide 09 PRINT atualizado!");
}

// SLIDE 10
const s10StartIdx = content.indexOf(s10StartStr);
const s10EndIdx = content.indexOf(s10EndStr);
if (s10StartIdx !== -1 && s10EndIdx !== -1) {
   const newS10Content = s10StartStr + `
                      <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-white p-16 flex flex-col justify-between relative overflow-hidden h-[100vh] text-slate-800">
                         {/* Stripes de fundo */}
                         <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" xmlns="http://www.w3.org/2000/svg">
                            <line x1="-100" y1="100" x2="400" y2="-400" stroke="#F1F5F9" strokeWidth="18" />
                            <line x1="-100" y1="150" x2="450" y2="-400" stroke="#F1F5F9" strokeWidth="12" />
                            <line x1="500" y1="900" x2="1200" y2="200" stroke="#F1F5F9" strokeWidth="18" />
                         </svg>

                         <div className="relative z-10 flex flex-col h-full justify-between">
                            {/* Header */}
                            <div className="flex justify-between items-center w-full pb-4 border-b border-slate-100">
                               <div className="flex flex-col">
                                  <span className="text-[#1e4480] text-[10px] font-black tracking-[0.2em] uppercase">JVS FACILITIES</span>
                                  <h2 className="text-xl font-black text-[#1e4480] uppercase tracking-tight">ITENS INCLUSOS E EXCLUÍDOS</h2>
                                </div>
                               <img 
                                  src="https://grupojvsserv.com.br/wp-content/uploads/2023/11/logo-horizontal-300px.png" 
                                  alt="JVS Facilities Logo" 
                                  className="max-h-10 w-auto object-contain"
                               />
                            </div>

                            {/* Tabela de Itens */}
                            <div className="my-auto w-full max-w-4xl mx-auto">
                               <div className="w-full bg-white rounded-2xl border border-slate-150 shadow-lg overflow-hidden">
                                  <table className="w-full text-left border-collapse">
                                     <thead>
                                        <tr className="bg-[#1e4480] text-white text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                                           <th className="px-6 py-3.5 w-32">Item</th>
                                           <th className="px-6 py-3.5">Descrição</th>
                                           <th className="px-6 py-3.5 text-center w-40">Status</th>
                                        </tr>
                                     </thead>
                                     <tbody>
                                        {(proposta.itensInclusosExcluidos || []).map((p: any, idx: number) => (
                                           <tr key={p.id || idx} className={\`border-b border-slate-100 text-[10px] font-bold text-slate-700 \${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'}\`}>
                                              <td className="px-6 py-3.5 font-black text-slate-500">{String(idx + 1).padStart(2, '0')}</td>
                                              <td className="px-6 py-3.5 font-semibold text-slate-800 leading-normal">{p.descricao}</td>
                                              <td className="px-6 py-3.5 text-center">
                                                 {p.incluso ? (
                                                    <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto shadow-xs">
                                                       <svg className="w-4 h-4 stroke-[3.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                                                       </svg>
                                                    </div>
                                                 ) : (
                                                    <div className="w-7 h-7 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-400 mx-auto opacity-90 shadow-xs">
                                                       <svg className="w-3.5 h-3.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                                                       </svg>
                                                    </div>
                                                 )}
                                              </td>
                                           </tr>
                                        ))}
                                     </tbody>
                                  </table>
                               </div>
                            </div>

                            {/* Rodapé */}
                            <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto">
                               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.grupojvsserv.com.br</span>
                               <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">10</span>
                            </div>
                         </div>
                      </div>\n\n`;
   content = content.substring(0, s10StartIdx) + newS10Content + content.substring(s10EndIdx);
   console.log("✔ Slide 10 PRINT atualizado!");
}

// SLIDE 11
const s11StartIdx = content.indexOf(s11StartStr);
const s11EndIdx = content.indexOf(s11EndStr);
if (s11StartIdx !== -1 && s11EndIdx !== -1) {
   const newS11Content = s11StartStr + `
                      {(() => {
                         const fc = formatCurrency;
                         const divisorTributos = resultado?.divisor || 1;
                         const txAdm = (proposta.premissas.taxaAdm || 0) / 100;
                         const txLucro = (proposta.premissas.margemLucro || 0) / 100;
                         
                         const applyCascata = (custo: any) => {
                           const cD = Number(custo) || 0;
                           const comAdm = cD * (1 + txAdm);
                           const comLucro = comAdm * (1 + txLucro);
                           return divisorTributos > 0 ? (comLucro / divisorTributos) : comLucro;
                         };

                         const maoDeObraSubtotal = resultado?.items?.reduce((acc: any, i: any) => acc + (i.precoVenda || 0), 0) || 0;
                         const insumosSubtotal = applyCascata(
                           Number(proposta.insumos.materiais || 0) + 
                           Number(proposta.insumos.maquinas || 0) + 
                           Number(proposta.insumos.descartaveis || 0) + 
                           Number(proposta.insumos.servicos || 0)
                         );

                         // Função auxiliar para renderizar linhas de insumos com tratamento premium de valores zerados
                         const renderInsumoRow = (label: string, value: number) => {
                            const isZero = value === 0;
                            return (
                               <tr className={\`border-b border-slate-100 \${isZero ? 'opacity-40 text-slate-400 bg-slate-50/10' : 'text-slate-700 font-bold'}\`}>
                                  <td className="py-3 px-4 font-semibold">{label}</td>
                                  <td className={\`py-3 px-4 text-right font-black \${isZero ? 'text-slate-300' : 'text-slate-800'}\`}>
                                     {isZero ? '-' : fc(value)}
                                  </td>
                               </tr>
                            );
                         };

                         return (
                            <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-white p-16 flex flex-col justify-between relative overflow-hidden h-[100vh] text-slate-800">
                               {/* Stripes de fundo */}
                               <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" xmlns="http://www.w3.org/2000/svg">
                                  <line x1="-100" y1="100" x2="400" y2="-400" stroke="#F1F5F9" strokeWidth="18" />
                                  <line x1="500" y1="900" x2="1200" y2="200" stroke="#F1F5F9" strokeWidth="18" />
                               </svg>

                               <div className="relative z-10 flex flex-col h-full justify-between">
                                  {/* Top Header */}
                                  <div className="flex justify-between items-center w-full pb-4 border-b border-slate-100">
                                     <div className="flex flex-col">
                                        <span className="text-[#1e4480] text-[10px] font-black tracking-[0.2em] uppercase">JVS FACILITIES</span>
                                        <h2 className="text-xl font-black text-[#1e4480] uppercase tracking-tight">RESUMO DA PROPOSTA COMERCIAL</h2>
                                     </div>
                                     <img 
                                        src="https://grupojvsserv.com.br/wp-content/uploads/2023/11/logo-horizontal-300px.png" 
                                        alt="JVS Facilities Logo" 
                                        className="max-h-10 w-auto object-contain"
                                     />
                                  </div>

                                  {/* Grid Central Simétrico */}
                                  <div className="my-auto grid grid-cols-2 gap-10 w-full max-w-5xl mx-auto items-stretch">
                                     {/* Coluna Esquerda: Mão de Obra */}
                                     <div className="bg-white rounded-2xl border border-slate-150 p-6 flex flex-col justify-between shadow-lg">
                                        <div>
                                           <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                                              <div className="w-2.5 h-2.5 rounded-full bg-[#1e4480]"></div>
                                              <h3 className="text-xs font-black text-[#1e4480] uppercase tracking-wider">1) Mão de Obra — Efetivo</h3>
                                           </div>
                                           <div className="pr-1">
                                              <table className="w-full text-left text-[10px] border-collapse">
                                                 <thead>
                                                    <tr className="border-b border-slate-200 text-[#1e4480] font-black uppercase tracking-wider text-[9px] bg-slate-50/50">
                                                       <th className="py-2 px-3">Função</th>
                                                       <th className="py-2 px-3 text-center w-14">Qtd.</th>
                                                       <th className="py-2 px-3 text-right w-24">Unitário</th>
                                                       <th className="py-2 px-3 text-right w-28">Total</th>
                                                    </tr>
                                                 </thead>
                                                 <tbody>
                                                    {proposta.equipe.length === 0 ? (
                                                       <tr>
                                                          <td colSpan={4} className="py-6 text-center text-slate-400 italic">Nenhum colaborador no Quadro de Equipe.</td>
                                                       </tr>
                                                    ) : (
                                                       proposta.equipe.map((p: any, idx: number) => {
                                                          const itemRes = resultado?.items?.find((x: any) => x.id === p.id);
                                                          const precoVendaItem = itemRes?.precoVenda || 0;
                                                          const precoUnitario = p.quantidade > 0 ? precoVendaItem / p.quantidade : 0;
                                                          return (
                                                             <tr key={p.id} className="border-b border-slate-100 text-slate-700">
                                                                <td className="py-3 px-3 font-bold">{p.nomeCargo}</td>
                                                                <td className="py-3 px-3 text-center font-black text-[#1e4480]">{p.quantidade}</td>
                                                                <td className="py-3 px-3 text-right text-slate-500 font-semibold">{fc(precoUnitario)}</td>
                                                                <td className="py-3 px-3 text-right font-black text-slate-800">{fc(precoVendaItem)}</td>
                                                             </tr>
                                                          );
                                                       })
                                                    )}
                                                 </tbody>
                                              </table>
                                           </div>
                                        </div>
                                        <div className="border-t border-slate-200 pt-3.5 mt-4 flex justify-between items-center text-xs">
                                           <span className="font-extrabold text-slate-500 uppercase tracking-wider">Subtotal Mão de Obra</span>
                                           <span className="font-black text-[#1e4480] text-base">{fc(maoDeObraSubtotal)}</span>
                                        </div>
                                     </div>

                                     {/* Coluna Direita: Insumos & Total Geral */}
                                     <div className="flex flex-col justify-between gap-8">
                                        {/* Tabela de Insumos */}
                                        <div className="bg-white rounded-2xl border border-slate-150 p-6 shadow-lg">
                                           <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                                              <div className="w-2.5 h-2.5 rounded-full bg-slate-500"></div>
                                              <h3 className="text-xs font-black text-slate-600 uppercase tracking-wider">2) Materiais, Equipamentos e Serviços</h3>
                                           </div>
                                           <table className="w-full text-left text-[10px] border-collapse">
                                              <tbody>
                                                 {renderInsumoRow('Materiais e Produtos de Limpeza', applyCascata(proposta.insumos.materiais))}
                                                 {renderInsumoRow('Máquinas e Equipamentos', applyCascata(proposta.insumos.maquinas))}
                                                 {renderInsumoRow('Descartáveis', applyCascata(proposta.insumos.descartaveis))}
                                                 {renderInsumoRow(
                                                    \`Serviços \${proposta.insumos.servicosDescricao ? \`(\${proposta.insumos.servicosDescricao})\` : ''}\`, 
                                                    applyCascata(proposta.insumos.servicos)
                                                 )}
                                              </tbody>
                                           </table>
                                           <div className="border-t border-slate-200 pt-3.5 mt-4 flex justify-between items-center text-xs">
                                              <span className="font-extrabold text-slate-500 uppercase tracking-wider">Subtotal Insumos</span>
                                              <span className="font-black text-slate-700 text-base">{fc(insumosSubtotal)}</span>
                                           </div>
                                        </div>

                                        {/* Card Valor Final */}
                                        <div className="bg-gradient-to-r from-[#1e4480] to-[#12382d] rounded-2xl p-6 text-white flex justify-between items-center shadow-xl relative overflow-hidden">
                                           <div className="absolute right-[-10px] top-[-10px] w-24 h-24 bg-white/5 rounded-full"></div>
                                           <div>
                                              <h4 className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mb-0.5">VALOR FINAL DA VENDA</h4>
                                              <p className="text-xs font-extrabold text-white tracking-tight uppercase">TOTAL GERAL DA PROPOSTA</p>
                                           </div>
                                           <div className="text-3xl font-black text-emerald-400 tracking-tight z-10">
                                              {fc(resultado?.faturamentoBruto || 0)}
                                           </div>
                                        </div>
                                     </div>
                                  </div>

                                  {/* Footer */}
                                  <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto">
                                     <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.grupojvsserv.com.br</span>
                                     <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">11</span>
                                  </div>
                               </div>
                            </div>
                         );
                      })()}\n\n`;
   content = content.substring(0, s11StartIdx) + newS11Content + content.substring(s11EndIdx);
   console.log("✔ Slide 11 PRINT atualizado!");
}

// SLIDE 12
const s12StartIdx = content.indexOf(s12StartStr);
const s12EndIdx = content.indexOf(s12EndStr);
if (s12StartIdx !== -1 && s12EndIdx !== -1) {
   const newS12Content = s12StartStr + `
                      <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-slate-50 p-16 flex flex-col justify-between relative overflow-hidden h-[100vh] text-slate-800">
                         {/* Stripes de fundo */}
                         <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
                            <line x1="-100" y1="100" x2="400" y2="-400" stroke="#1e4480" strokeWidth="18" />
                            <line x1="500" y1="900" x2="1200" y2="200" stroke="#1e4480" strokeWidth="18" />
                         </svg>

                         <div className="relative z-10 flex flex-col h-full justify-between">
                            {/* Header */}
                            <div className="flex justify-between items-center w-full pb-4 border-b border-slate-200/60">
                               <div className="flex flex-col">
                                  <span className="text-[#1e4480] text-[10px] font-black tracking-[0.2em] uppercase">JVS FACILITIES</span>
                                  <h2 className="text-xl font-black text-[#1e4480] uppercase tracking-tight">CONDIÇÕES GERAIS DA PROPOSTA</h2>
                               </div>
                               <img 
                                  src="https://grupojvsserv.com.br/wp-content/uploads/2023/11/logo-horizontal-300px.png" 
                                  alt="JVS Facilities Logo" 
                                  className="max-h-10 w-auto object-contain"
                               />
                            </div>

                            {/* Grid Central de Duas Colunas de Cards */}
                            <div className="my-auto grid grid-cols-2 gap-8 w-full max-w-5xl mx-auto items-stretch">
                               {/* Card Esquerdo: Colaboradores */}
                               <div className="bg-white rounded-2xl border border-slate-150 p-8 shadow-lg border-t-4 border-t-[#1e4480] flex flex-col space-y-4">
                                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                     <svg className="w-5 h-5 text-[#1e4480]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                     </svg>
                                     <h3 className="text-[#1e4480] text-xs font-black tracking-wider uppercase">
                                        CONDIÇÕES PARA OS COLABORADORES
                                     </h3>
                                  </div>
                                  <ul className="space-y-3 text-slate-600 text-[10px] font-semibold leading-relaxed">
                                     {((proposta.cliente.condicoesColaboradores && proposta.cliente.condicoesColaboradores.length > 0)
                                        ? proposta.cliente.condicoesColaboradores
                                        : [
                                           proposta.cliente.condicaoColaboradores1 || 'Vale alimentação de R$900,00;',
                                           proposta.cliente.condicaoColaboradores2 || 'Cesta trimestral de assiduidade;',
                                           proposta.cliente.condicaoColaboradores3 || '2 Vales transporte por dia.'
                                        ]
                                     ).map((cond: string, idx: number) => (
                                        <li key={idx} className="flex items-start gap-2">
                                           <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1"></div>
                                           <span>{cond}</span>
                                        </li>
                                     ))}
                                  </ul>
                               </div>

                               {/* Card Direito: Cliente */}
                               <div className="bg-white rounded-2xl border border-slate-150 p-8 shadow-lg border-t-4 border-t-emerald-500 flex flex-col space-y-4">
                                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                     <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0V9a2 2 0 012-2h2a2 2 0 012 2v12m-6 0h6"></path>
                                     </svg>
                                     <h3 className="text-emerald-600 text-xs font-black tracking-wider uppercase">
                                        CONDIÇÕES PARA O CLIENTE
                                     </h3>
                                  </div>
                                  <ul className="space-y-3 text-slate-600 text-[10px] font-semibold leading-relaxed">
                                     {((proposta.cliente.condicoesCliente && proposta.cliente.condicoesCliente.length > 0)
                                        ? proposta.cliente.condicoesCliente
                                        : [
                                           proposta.cliente.condicaoCliente1 || 'Faturamento dos serviços aos dias 15 ou 30 de cada mês com vencimento nos próximos 15 dias;',
                                           proposta.cliente.condicaoCliente2 || 'Reajuste anual, automático e equivalente ao dissídio da categoria (SIEMACO) todo mês fevereiro de cada ano subsequente;',
                                           proposta.cliente.condicaoCliente3 || 'Próximo reajuste Fevereiro/2026.'
                                        ]
                                     ).map((cond: string, idx: number) => (
                                        <li key={idx} className="flex items-start gap-2">
                                           <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1"></div>
                                           <span className={idx === (proposta.cliente.condicoesCliente || []).length - 1 ? "font-extrabold text-[#1B4D3E]" : ""}>{cond}</span>
                                        </li>
                                     ))}
                                  </ul>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex justify-between items-center border-t border-slate-200 pt-4 mt-auto">
                               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">www.grupojvsserv.com.br</span>
                               <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded font-black">12</span>
                            </div>
                         </div>
                      </div>\n\n`;
   content = content.substring(0, s12StartIdx) + newS12Content + content.substring(s12EndIdx);
   console.log("✔ Slide 12 PRINT atualizado!");
}

// SLIDE 13
const s13StartIdx = content.indexOf(s13StartStr);
const s13EndIdx = content.lastIndexOf('</main>');
if (s13StartIdx !== -1 && s13EndIdx !== -1) {
   const newS13Content = s13StartStr + `
                      <div className="print-slide w-full aspect-[16/9] border border-slate-200 bg-[#1e4480] p-16 flex flex-col justify-between relative overflow-hidden h-[100vh] text-white">
                         <div className="relative z-10 flex flex-col h-full justify-between">
                            {/* Header */}
                            <div className="flex justify-between items-center w-full pb-3 border-b border-white/15">
                               <h2 className="text-3xl font-black text-white tracking-widest uppercase">ACEITE</h2>
                               <img 
                                  src="https://grupojvsserv.com.br/wp-content/uploads/2023/11/logo-horizontal-300px.png" 
                                  alt="JVS Facilities Logo" 
                                  className="max-h-10 w-auto object-contain"
                               />
                            </div>

                            {/* Cards de Dados de Glassmorphism Premium */}
                            <div className="my-auto max-w-4xl w-full mx-auto grid grid-cols-2 gap-x-12 gap-y-4">
                               {/* Coluna Esquerda: Dados da Empresa */}
                               <div className="space-y-3">
                                  {[
                                     { label: 'Razão Social', value: proposta.cliente.razaoSocial || proposta.cliente.cliente || '-' },
                                     { label: 'Nome Fantasia', value: proposta.cliente.cliente || '-' },
                                     { label: 'CNPJ', value: proposta.cliente.cnpj || '-' },
                                     { label: 'Valor Mensal', value: formatCurrency(resultado?.faturamentoBruto || 0) },
                                     { label: 'Início', value: proposta.cliente.dataInicio || '-' },
                                     { label: 'Vencimento', value: proposta.cliente.dataVencimento || '-' }
                                  ].map((item, idx) => (
                                     <div key={idx} className="bg-white/10 border border-white/15 backdrop-blur-md rounded-2xl py-2 px-5 flex justify-between items-center text-[10px] font-black tracking-wider uppercase shadow-xs">
                                        <span className="text-white/60 shrink-0">{item.label}</span>
                                        <span className="text-white font-extrabold text-ellipsis overflow-hidden whitespace-nowrap ml-4 max-w-[220px]">{item.value}</span>
                                     </div>
                                  ))}
                               </div>

                               {/* Coluna Direita: Contato do Cliente */}
                               <div className="space-y-3">
                                  {[
                                     { label: 'Contato', value: proposta.cliente.contato || '-' },
                                     { label: 'Cargo', value: proposta.cliente.contatoCargo || '-' },
                                     { label: 'Celular / Tel', value: proposta.cliente.celular || '-' },
                                     { label: 'E-mail', value: proposta.cliente.email || '-' }
                                  ].map((item, idx) => (
                                     <div key={idx} className="bg-white/10 border border-white/15 backdrop-blur-md rounded-2xl py-2 px-5 flex justify-between items-center text-[10px] font-black tracking-wider uppercase shadow-xs">
                                        <span className="text-white/60 shrink-0">{item.label}</span>
                                        <span className="text-white font-extrabold text-ellipsis overflow-hidden whitespace-nowrap ml-4 max-w-[220px]">{item.value}</span>
                                     </div>
                                  ))}
                               </div>
                            </div>

                            {/* Seção Dupla de Assinaturas Imponentes e Simétricas */}
                            <div className="grid grid-cols-2 gap-24 w-full max-w-4xl mx-auto pt-6 border-t border-white/15 mt-auto">
                               {/* Representante SmartBid / Vendedor */}
                               <div className="flex flex-col items-center">
                                  <div className="border-t border-white/40 w-full my-1"></div>
                                  <span className="text-[10px] font-black text-white uppercase tracking-widest mt-1">SmartBid / JVS Facilities</span>
                                  <span className="text-[9px] text-white/70 font-semibold leading-relaxed mt-0.5">
                                     {proposta.cliente.vendedorNome || 'Representante'} — {proposta.cliente.vendedorCargo || 'Comercial'}
                                  </span>
                               </div>

                               {/* Representante do Cliente */}
                               <div className="flex flex-col items-center">
                                  <div className="border-t border-white/40 w-full my-1"></div>
                                  <span className="text-[10px] font-black text-white uppercase tracking-widest mt-1">De Acordo / Assinatura do Cliente</span>
                                  <span className="text-[9px] text-white/70 font-semibold leading-relaxed mt-0.5">
                                     {proposta.cliente.cliente || 'Representante Legal'}
                                  </span>
                               </div>
                            </div>
                         </div>
                      </div>

                   </div>\n`;
   content = content.substring(0, s13StartIdx) + newS13Content + content.substring(s13EndIdx);
   console.log("✔ Slide 13 PRINT atualizado!");
}

// Salvar de volta em UTF-8 puro
fs.writeFileSync(pagePath, content, 'utf8');
console.log("✔ Consolidação cirúrgica concluída com absoluto sucesso!");
