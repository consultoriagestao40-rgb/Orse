const fs = require('fs');

function fixErasto(filePath) {
  let t = fs.readFileSync(filePath, 'utf8');
  t = t.split('proposta.cliente.cliente || "Erasto Gaertner"').join('proposta.cliente.nomeFantasia || proposta.cliente.razaoSocial || "Cliente Não Informado"');
  t = t.split('proposta.cliente.cliente || \'Erasto Gaertner\'').join('proposta.cliente.nomeFantasia || proposta.cliente.razaoSocial || "Cliente Não Informado"');
  fs.writeFileSync(filePath, t, 'utf8');
}

fixErasto('components/PropostaApresentacaoPrint.tsx');
fixErasto('components/PropostaApresentacao.tsx');
console.log('Ambos corrigidos!');
