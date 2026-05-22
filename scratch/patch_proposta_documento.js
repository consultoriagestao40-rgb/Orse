const fs = require('fs');

let content = fs.readFileSync('app/propostas/nova/page.tsx', 'utf8');

// 1. Imports
if (!content.includes('getEmpresasEmissoras')) {
  content = content.replace(
    "import { getTiposServico, getSegmentos, createTipoServico, createSegmento } from '@/app/admin/settings/actions';",
    "import { getTiposServico, getSegmentos, createTipoServico, createSegmento } from '@/app/admin/settings/actions';\nimport { getEmpresasEmissoras } from '@/app/admin/settings/empresas-actions';"
  );
}

// 2. States
if (!content.includes("const [viewMode, setViewMode] = useState<'slide' | 'document'>('slide');")) {
  content = content.replace(
    "const [activeTab, setActiveTab] = useState('dados');",
    "const [activeTab, setActiveTab] = useState('dados');\n  const [viewMode, setViewMode] = useState<'slide' | 'document'>('slide');\n  const [empresasEmissoras, setEmpresasEmissoras] = useState<any[]>([]);\n  const [selectedEmpresa, setSelectedEmpresa] = useState<any>(null);"
  );
}

// 3. Load Empresas
if (!content.includes("getEmpresasEmissoras()")) {
  // Find where it loads other base data
  content = content.replace(
    "const [cctsList, escalasRes, tiposRes, segmentosRes] = await Promise.all([",
    "const [cctsList, escalasRes, tiposRes, segmentosRes, empresasRes] = await Promise.all([\n          getCCTs(),\n          getEscalas(),\n          getTiposServico(),\n          getSegmentos(),\n          getEmpresasEmissoras()\n        ]);\n        setEmpresasEmissoras(empresasRes || []);\n        if (empresasRes && empresasRes.length > 0) setSelectedEmpresa(empresasRes[0]);\n        /*"
  );
  // Actually, I should just find a good spot inside the main useEffect or `fetchBaseData`.
  // Wait, let's look at `fetchBaseData` or whatever the loading function is called.
}
