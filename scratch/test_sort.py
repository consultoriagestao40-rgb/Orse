def main():
    baseItems = [
      { 'label': 'Radar Comercial' },
      { 'label': 'Prospecção Inteligente' },
      { 'label': 'Calendário Global' },
      { 'label': 'Pipeline de Leads' },
      { 'label': 'Gestão de E-mails' },
      { 'label': 'Pipeline de FVP' },
      { 'label': 'Proposta Comercial' },
      { 'label': 'Contratos' },
      { 'label': 'Regras (CCT)' },
      { 'label': 'Equipes Técnicas (SPOT)' },
      { 'label': 'Clientes' },
      { 'label': 'Usuários e Permissões' },
      { 'label': 'Produtos e Insumos' },
      { 'label': 'EPIs e Uniformes' },
      { 'label': 'Configurações' }
    ]
    orderArray = ['Radar Comercial', 'Prospecção Inteligente', 'Calendário Global', 'Pipeline de Leads', 'Gestão de E-mails', 'Pipeline de FVP', 'Proposta Comercial']
    
    # Python equivalent of the sort logic
    from functools import cmp_to_key
    def compare(a, b):
        idxA = orderArray.index(a['label']) if a['label'] in orderArray else -1
        idxB = orderArray.index(b['label']) if b['label'] in orderArray else -1
        if idxA == -1 and idxB == -1: return 0
        if idxA == -1: return 1
        if idxB == -1: return -1
        return idxA - idxB

    sorted_items = sorted(baseItems, key=cmp_to_key(compare))
    print([x['label'] for x in sorted_items])

if __name__ == "__main__":
    main()
