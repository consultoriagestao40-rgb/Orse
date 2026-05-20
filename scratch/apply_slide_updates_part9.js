const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '../app/propostas/nova/page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

console.log('Iniciando aplicacao de otimizacoes do Slide 12 e Slide 13 (Parte 9)...');

content = content.split('\r\n').join('\n');

// 1. REDUZIR O TAMANHO DOS ÍCONES DE CHECK NO SLIDE 12 (TELA E PDF) PARA size={8}
content = content.split('<CheckCircle2 size={13} className="text-[#1b4d3e] shrink-0 mt-0.5" />').join('<CheckCircle2 size={8} className="text-[#1b4d3e] shrink-0 mt-0.5" />');

// 2. DETECTAR E ATUALIZAR O SLIDE 13 TELA PARA EXIBIR OS CAMPOS DE ACEITE
const oldLeftTela = `<div className="text-white/80 text-[10px] leading-relaxed space-y-3 font-semibold text-justify">
                                           <p>Ao assinar este termo de aceite, o <strong className="text-white font-extrabold">{proposta.cliente.cliente || "Erasto Gaertner"}</strong> manifesta sua concordância com os valores descritos, premissas de investimento e condições comerciais apresentadas nesta proposta comercial.</p>
                                           <p>Este documento servirá como base oficial para a elaboração do instrumento jurídico definitivo (Contrato de Prestação de Serviços) entre as partes.</p>
                                        </div>`;

const newLeftTela = `<div className="text-white/80 text-[10px] leading-relaxed space-y-2 font-semibold text-justify">
                                           <p>Ao assinar este termo de aceite, o <strong className="text-white font-extrabold">{proposta.cliente.cliente || "Erasto Gaertner"}</strong> manifesta sua concordância com os valores descritos, premissas de investimento e condições comerciais apresentadas nesta proposta comercial.</p>
                                           <p>Este documento servirá como base oficial para a elaboração do instrumento jurídico definitivo (Contrato de Prestação de Serviços) entre as partes.</p>
                                        </div>
                                        <div className="bg-white/5 border border-white/10 rounded-xl p-3 mt-3.5 space-y-2 text-[9px] font-semibold text-white/90">
                                           <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                              <div className="flex flex-col">
                                                 <span className="text-[7.5px] font-black text-white/55 uppercase tracking-wider">Razão Social</span>
                                                 <span className="truncate text-white font-bold">{proposta.cliente.razaoSocial || proposta.cliente.cliente || "Não informada"}</span>
                                              </div>
                                              <div className="flex flex-col">
                                                 <span className="text-[7.5px] font-black text-white/55 uppercase tracking-wider">CNPJ</span>
                                                 <span className="text-white font-bold">{proposta.cliente.cnpj || "Não informado"}</span>
                                              </div>
                                              <div className="flex flex-col">
                                                 <span className="text-[7.5px] font-black text-white/55 uppercase tracking-wider">Data de Início</span>
                                                 <span className="text-white font-bold">{proposta.cliente.dataInicio || "A definir"}</span>
                                              </div>
                                              <div className="flex flex-col">
                                                 <span className="text-[7.5px] font-black text-white/55 uppercase tracking-wider">Data de Vencimento</span>
                                                 <span className="text-white font-bold">{proposta.cliente.dataVencimento || "A definir"}</span>
                                              </div>
                                              <div className="flex flex-col col-span-2">
                                                 <span className="text-[7.5px] font-black text-white/55 uppercase tracking-wider">Cargo do Contato / Representante</span>
                                                 <span className="truncate text-white font-bold">{proposta.cliente.contatoCargo || "Representante Legal"}</span>
                                              </div>
                                           </div>
                                        </div>`;

if (content.includes(oldLeftTela)) {
   content = content.split(oldLeftTela).join(newLeftTela);
   console.log('✔ Bloco de Aceite adicionado no Slide 13 TELA.');
} else {
   console.log('⚠ Não foi possível encontrar o bloco da esquerda do Slide 13 TELA.');
}

// 3. DETECTAR E ATUALIZAR O SLIDE 13 PDF PARA EXIBIR OS CAMPOS DE ACEITE
const oldLeftPDF = `<div className="text-white/80 text-[10px] leading-relaxed space-y-3 font-semibold text-justify">
                                     <p>Ao assinar este termo de aceite, o <strong className="text-white font-extrabold">{proposta.cliente.cliente || "Erasto Gaertner"}</strong> manifesta sua concordância com os valores descritos, premissas de investimento e condições comerciais apresentadas nesta proposta comercial.</p>
                                     <p>Este documento servirá como base oficial para a elaboração do instrumento jurídico definitivo (Contrato de Prestação de Serviços) entre as partes.</p>
                                  </div>`;

const newLeftPDF = `<div className="text-white/80 text-[10px] leading-relaxed space-y-2 font-semibold text-justify">
                                     <p>Ao assinar este termo de aceite, o <strong className="text-white font-extrabold">{proposta.cliente.cliente || "Erasto Gaertner"}</strong> manifesta sua concordância com os valores descritos, premissas de investimento e condições comerciais apresentadas nesta proposta comercial.</p>
                                     <p>Este documento servirá como base oficial para a elaboração do instrumento jurídico definitivo (Contrato de Prestação de Serviços) entre as partes.</p>
                                  </div>
                                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 mt-3.5 space-y-2 text-[9px] font-semibold text-white/90">
                                     <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                        <div className="flex flex-col">
                                           <span className="text-[7.5px] font-black text-white/55 uppercase tracking-wider">Razão Social</span>
                                           <span className="truncate text-white font-bold">{proposta.cliente.razaoSocial || proposta.cliente.cliente || "Não informada"}</span>
                                        </div>
                                        <div className="flex flex-col">
                                           <span className="text-[7.5px] font-black text-white/55 uppercase tracking-wider">CNPJ</span>
                                           <span className="text-white font-bold">{proposta.cliente.cnpj || "Não informado"}</span>
                                        </div>
                                        <div className="flex flex-col">
                                           <span className="text-[7.5px] font-black text-white/55 uppercase tracking-wider">Data de Início</span>
                                           <span className="text-white font-bold">{proposta.cliente.dataInicio || "A definir"}</span>
                                        </div>
                                        <div className="flex flex-col">
                                           <span className="text-[7.5px] font-black text-white/55 uppercase tracking-wider">Data de Vencimento</span>
                                           <span className="text-white font-bold">{proposta.cliente.dataVencimento || "A definir"}</span>
                                        </div>
                                        <div className="flex flex-col col-span-2">
                                           <span className="text-[7.5px] font-black text-white/55 uppercase tracking-wider">Cargo do Contato / Representante</span>
                                           <span className="truncate text-white font-bold">{proposta.cliente.contatoCargo || "Representante Legal"}</span>
                                        </div>
                                     </div>
                                  </div>`;

if (content.includes(oldLeftPDF)) {
   content = content.split(oldLeftPDF).join(newLeftPDF);
   console.log('✔ Bloco de Aceite adicionado no Slide 13 PDF.');
} else {
   console.log('⚠ Não foi possível encontrar o bloco da esquerda do Slide 13 PDF.');
}

fs.writeFileSync(pagePath, content, 'utf8');
console.log('✔ page.tsx gravado com sucesso na Parte 9!');
