import os

files_to_edit = [
    {
        "path": "components/PropostaApresentacao.tsx",
        "target_import": "import React, { useState } from 'react';",
        "replace_import": "import React, { useState, useEffect } from 'react';",
        "target_start": "export default function PropostaApresentacao({ proposta, resultado, empresaEmissora, presentationMode, setPresentationMode }: any) {",
        "replace_start": """export default function PropostaApresentacao({ proposta, resultado, empresaEmissora, presentationMode, setPresentationMode }: any) {
  const [companyLogo, setCompanyLogo] = useState<string>('https://via.placeholder.com/300x80?text=Silva+Consultoria');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cookie = document.cookie.split('; ').find(row => row.startsWith('sb_user='));
      if (cookie) {
        try {
          const parsed = JSON.parse(decodeURIComponent(cookie.split('=')[1]));
          if (parsed.tenantLogoUrl) {
            setCompanyLogo(parsed.tenantLogoUrl);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);"""
    },
    {
        "path": "components/PropostaApresentacaoPrint.tsx",
        "target_import": "import React from 'react';",
        "replace_import": "import React, { useState, useEffect } from 'react';",
        "target_start": "export default function PropostaApresentacaoPrint({ proposta, resultado, empresaEmissora }: { proposta: any, resultado?: any, empresaEmissora?: any }) {",
        "replace_start": """export default function PropostaApresentacaoPrint({ proposta, resultado, empresaEmissora }: { proposta: any, resultado?: any, empresaEmissora?: any }) {
  const [companyLogo, setCompanyLogo] = useState<string>('https://via.placeholder.com/300x80?text=Silva+Consultoria');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cookie = document.cookie.split('; ').find(row => row.startsWith('sb_user='));
      if (cookie) {
        try {
          const parsed = JSON.parse(decodeURIComponent(cookie.split('=')[1]));
          if (parsed.tenantLogoUrl) {
            setCompanyLogo(parsed.tenantLogoUrl);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);"""
    },
    {
        "path": "components/DocumentoA4.tsx",
        "target_import": "import React, { useState } from 'react';",
        "replace_import": "import React, { useState, useEffect } from 'react';",
        "target_start": "export default function DocumentoA4({ proposta, resultado, empresaEmissora, templates, onUpdateClausulas, onUpdateCliente, onUpdateItens }: { proposta: any, resultado: any, empresaEmissora: any, templates?: any[], onUpdateClausulas?: (c: any[]) => void, onUpdateCliente?: (c: any) => void, onUpdateItens?: (i: any[]) => void }) {",
        "replace_start": """export default function DocumentoA4({ proposta, resultado, empresaEmissora, templates, onUpdateClausulas, onUpdateCliente, onUpdateItens }: { proposta: any, resultado: any, empresaEmissora: any, templates?: any[], onUpdateClausulas?: (c: any[]) => void, onUpdateCliente?: (c: any) => void, onUpdateItens?: (i: any[]) => void }) {
  const [companyLogo, setCompanyLogo] = useState<string>('https://via.placeholder.com/300x80?text=Silva+Consultoria');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cookie = document.cookie.split('; ').find(row => row.startsWith('sb_user='));
      if (cookie) {
        try {
          const parsed = JSON.parse(decodeURIComponent(cookie.split('=')[1]));
          if (parsed.tenantLogoUrl) {
            setCompanyLogo(parsed.tenantLogoUrl);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);"""
    }
]

base_dir = "/Users/cristianosilva/.gemini/antigravity/scratch/orse/"

for item in files_to_edit:
    filepath = os.path.join(base_dir, item["path"])
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        continue
    
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    # 1. Update imports
    content = content.replace(item["target_import"], item["replace_import"], 1)
    
    # 2. Update function start and inject state + effect
    content = content.replace(item["target_start"], item["replace_start"], 1)
    
    # 3. Replace placeholder url string with React dynamic variable
    old_url = '"https://via.placeholder.com/300x80?text=Silva+Consultoria"'
    new_url = '{companyLogo}'
    
    occurrences = content.count(old_url)
    print(f"Found {occurrences} placeholder logo URLs in {item['path']}")
    
    content = content.replace(old_url, new_url)
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
        
    print(f"File {item['path']} processed successfully!")
