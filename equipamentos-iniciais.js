/* ETAPA 31 — Dados FICTÍCIOS de demonstração, com cadastro técnico, preventivas, chamados e histórico.
   São carregados somente quando não há lista salva no localStorage. Não sobrescreve dados reais.
   Datas e pessoas são exemplos para demonstrar telas, filtros e fluxos; não são registros reais. */
window.PANNA_EQUIPAMENTOS_INICIAIS = [
  {
    "codigo": "EQP-00185538",
    "nome": "Aspirador de pó industrial",
    "grupo": "Aspiradores",
    "localizacao": "Toyota Sorocaba",
    "voltagem": "220V",
    "situacao": "Em manutenção",
    "marca": "Kärcher",
    "modelo": "NT 70/2 Me Classic",
    "numeroSerie": "KAR-NT70-2024-0185",
    "patrimonio": "PAT-000185",
    "fornecedor": "Fornecedor homologado (demonstração)",
    "valorAquisicao": "2.912,00",
    "dataAquisicao": "2024-02-15",
    "fimGarantia": "2026-02-15",
    "responsavel": "Carlos Oliveira",
    "observacoes": "Utilizado na limpeza de áreas produtivas. Inspecionar vedação, mangueiras e filtros antes do uso.",
    "proximaPreventiva": "2026-12-10",
    "criadoEm": "2026-10-01T09:00:00",
    "planosPreventivos": [
      {
        "id": "prev-demo-001",
        "tipo": "Troca de filtro",
        "periodicidade": "Mensal",
        "dataPrevista": "2026-12-10",
        "avisoAntecipado": "7 dias",
        "insumos": [
          {
            "nome": "Filtro cartucho",
            "quantidade": 2,
            "unidade": "un"
          }
        ]
      }
    ],
    "chamados": [
      {
        "id": "CH-DEMO-001",
        "tipo": "Corretiva",
        "prioridade": "Alta",
        "descricao": "Perda de sucção e aquecimento após 20 minutos de operação.",
        "estado": "Aceito",
        "criadoEm": "2026-11-12T09:15:00",
        "origem": "demonstração",
        "localAtendimento": "Toyota Sorocaba",
        "estadoManutencao": "Em manutenção"
      }
    ],
    "eventos": [
      {
        "id": "evt-demo-cadastro-1",
        "tipo": "cadastro",
        "titulo": "Equipamento cadastrado (demonstração)",
        "descricao": "Cadastro fictício para apresentação das funcionalidades do sistema.",
        "data": "2026-10-01T09:00:00"
      },
      {
        "id": "evt-CH-DEMO-001",
        "tipo": "chamado",
        "titulo": "Chamado de demonstração: Aceito",
        "descricao": "Perda de sucção e aquecimento após 20 minutos de operação.",
        "data": "2026-11-12T09:15:00"
      }
    ]
  },
  {
    "codigo": "EQP-00172204",
    "nome": "Trator agrícola",
    "grupo": "Tratores",
    "localizacao": "ZF Sorocaba",
    "voltagem": "Diesel",
    "situacao": "Em funcionamento",
    "marca": "New Holland",
    "modelo": "TT4.75",
    "numeroSerie": "NH-TT475-2022-0722",
    "patrimonio": "PAT-000172",
    "fornecedor": "Fornecedor homologado (demonstração)",
    "valorAquisicao": "198.500,00",
    "dataAquisicao": "2022-08-11",
    "fimGarantia": "2024-08-11",
    "responsavel": "Fernanda Lima",
    "observacoes": "Uso restrito a operadores habilitados. Conferir pneus, fluidos, freios e sistema hidráulico.",
    "proximaPreventiva": "2026-12-28",
    "criadoEm": "2026-10-01T09:00:00",
    "planosPreventivos": [
      {
        "id": "prev-demo-002",
        "tipo": "Troca de óleo",
        "periodicidade": "Trimestral",
        "dataPrevista": "2026-12-28",
        "avisoAntecipado": "7 dias",
        "insumos": [
          {
            "nome": "Óleo lubrificante 15W40",
            "quantidade": 12,
            "unidade": "L"
          }
        ]
      }
    ],
    "chamados": [],
    "eventos": [
      {
        "id": "evt-demo-cadastro-2",
        "tipo": "cadastro",
        "titulo": "Equipamento cadastrado (demonstração)",
        "descricao": "Cadastro fictício para apresentação das funcionalidades do sistema.",
        "data": "2026-10-01T09:00:00"
      }
    ]
  },
  {
    "codigo": "EQP-00168821",
    "nome": "Betoneira 400 L",
    "grupo": "Betoneiras",
    "localizacao": "Clarios Sorocaba",
    "voltagem": "220V",
    "situacao": "Parado",
    "marca": "Menegotti",
    "modelo": "Prime 400L",
    "numeroSerie": "MGT-400-2023-0411",
    "patrimonio": "PAT-000168",
    "fornecedor": "Fornecedor homologado (demonstração)",
    "valorAquisicao": "6.480,00",
    "dataAquisicao": "2023-05-19",
    "fimGarantia": "2024-05-19",
    "responsavel": "Ricardo Alves",
    "observacoes": "Equipamento indisponível por falha na transmissão. Não operar até liberação técnica.",
    "proximaPreventiva": "2026-10-23",
    "criadoEm": "2026-10-01T09:00:00",
    "planosPreventivos": [
      {
        "id": "prev-demo-003",
        "tipo": "Inspeção de correias",
        "periodicidade": "Mensal",
        "dataPrevista": "2026-10-23",
        "avisoAntecipado": "7 dias",
        "insumos": [
          {
            "nome": "Correia de transmissão",
            "quantidade": 1,
            "unidade": "un"
          }
        ]
      }
    ],
    "chamados": [
      {
        "id": "CH-DEMO-002",
        "tipo": "Corretiva",
        "prioridade": "Urgente",
        "descricao": "Correia rompida; equipamento não pode operar.",
        "estado": "Aceito",
        "criadoEm": "2026-11-14T07:40:00",
        "origem": "demonstração",
        "localAtendimento": "Clarios Sorocaba",
        "estadoManutencao": "Pendente"
      }
    ],
    "eventos": [
      {
        "id": "evt-demo-cadastro-3",
        "tipo": "cadastro",
        "titulo": "Equipamento cadastrado (demonstração)",
        "descricao": "Cadastro fictício para apresentação das funcionalidades do sistema.",
        "data": "2026-10-01T09:00:00"
      },
      {
        "id": "evt-CH-DEMO-002",
        "tipo": "chamado",
        "titulo": "Chamado de demonstração: Aceito",
        "descricao": "Correia rompida; equipamento não pode operar.",
        "data": "2026-11-14T07:40:00"
      }
    ]
  },
  {
    "codigo": "EQP-00159033",
    "nome": "Multicalibrador digital",
    "grupo": "Medição",
    "localizacao": "Dana Sorocaba",
    "voltagem": "Bivolt",
    "situacao": "Em funcionamento",
    "marca": "Fluke",
    "modelo": "754",
    "numeroSerie": "FLK754-2021-0992",
    "patrimonio": "PAT-000159",
    "fornecedor": "Fornecedor homologado (demonstração)",
    "valorAquisicao": "34.900,00",
    "dataAquisicao": "2021-10-07",
    "fimGarantia": "2023-10-07",
    "responsavel": "Patrícia Costa",
    "observacoes": "Instrumento de medição; manter certificado de calibração atualizado e armazenar em estojo apropriado.",
    "proximaPreventiva": "2026-11-09",
    "criadoEm": "2026-10-01T09:00:00",
    "planosPreventivos": [
      {
        "id": "prev-demo-004",
        "tipo": "Calibração",
        "periodicidade": "Anual",
        "dataPrevista": "2026-11-09",
        "avisoAntecipado": "7 dias",
        "insumos": [
          {
            "nome": "Etiqueta de calibração",
            "quantidade": 1,
            "unidade": "un"
          }
        ]
      }
    ],
    "chamados": [
      {
        "id": "CH-DEMO-003",
        "tipo": "Corretiva",
        "prioridade": "Média",
        "descricao": "Oscilação na leitura durante a verificação de rotina.",
        "estado": "Aberto",
        "criadoEm": "2026-11-16T10:25:00",
        "origem": "demonstração",
        "localAtendimento": "Dana Sorocaba"
      }
    ],
    "eventos": [
      {
        "id": "evt-demo-cadastro-4",
        "tipo": "cadastro",
        "titulo": "Equipamento cadastrado (demonstração)",
        "descricao": "Cadastro fictício para apresentação das funcionalidades do sistema.",
        "data": "2026-10-01T09:00:00"
      },
      {
        "id": "evt-CH-DEMO-003",
        "tipo": "chamado",
        "titulo": "Chamado de demonstração: Aberto",
        "descricao": "Oscilação na leitura durante a verificação de rotina.",
        "data": "2026-11-16T10:25:00"
      }
    ]
  },
  {
    "codigo": "EQP-00143377",
    "nome": "Enceradeira industrial",
    "grupo": "Enceradeiras",
    "localizacao": "Emphasis Sorocaba",
    "voltagem": "127V",
    "situacao": "Em funcionamento",
    "marca": "Bralimpia",
    "modelo": "CL 350",
    "numeroSerie": "BRL-CL350-2024-0631",
    "patrimonio": "PAT-000143",
    "fornecedor": "Fornecedor homologado (demonstração)",
    "valorAquisicao": "4.350,00",
    "dataAquisicao": "2024-03-25",
    "fimGarantia": "2025-03-25",
    "responsavel": "Mariana Souza",
    "observacoes": "Utilizado em limpeza de pisos industriais. Conferir cabo, disco e proteção elétrica.",
    "proximaPreventiva": "2026-11-25",
    "criadoEm": "2026-10-01T09:00:00",
    "planosPreventivos": [
      {
        "id": "prev-demo-005",
        "tipo": "Inspeção do disco",
        "periodicidade": "Mensal",
        "dataPrevista": "2026-11-25",
        "avisoAntecipado": "7 dias",
        "insumos": [
          {
            "nome": "Disco de limpeza 350 mm",
            "quantidade": 1,
            "unidade": "un"
          }
        ]
      }
    ],
    "chamados": [
      {
        "id": "CH-DEMO-004",
        "tipo": "Corretiva",
        "prioridade": "Baixa",
        "descricao": "Ruído intermitente na tampa de proteção.",
        "estado": "Recusado",
        "criadoEm": "2026-11-10T14:10:00",
        "origem": "demonstração",
        "localAtendimento": "Emphasis Sorocaba"
      }
    ],
    "eventos": [
      {
        "id": "evt-demo-cadastro-5",
        "tipo": "cadastro",
        "titulo": "Equipamento cadastrado (demonstração)",
        "descricao": "Cadastro fictício para apresentação das funcionalidades do sistema.",
        "data": "2026-10-01T09:00:00"
      },
      {
        "id": "evt-CH-DEMO-004",
        "tipo": "chamado",
        "titulo": "Chamado de demonstração: Recusado",
        "descricao": "Ruído intermitente na tampa de proteção.",
        "data": "2026-11-10T14:10:00"
      }
    ]
  },
  {
    "codigo": "EQP-00131250",
    "nome": "Esmerilhadeira angular",
    "grupo": "Esmerilhadeiras",
    "localizacao": "Dana Itu",
    "voltagem": "220V",
    "situacao": "Inativo",
    "marca": "Bosch",
    "modelo": "GWS 9-125",
    "numeroSerie": "BSH-GWS9-2020-0342",
    "patrimonio": "PAT-000131",
    "fornecedor": "Fornecedor homologado (demonstração)",
    "valorAquisicao": "680,00",
    "dataAquisicao": "2020-09-18",
    "fimGarantia": "2021-09-18",
    "responsavel": "Eduardo Martins",
    "observacoes": "Equipamento inativado para avaliação de substituição. Não disponibilizar para operação.",
    "proximaPreventiva": "2026-12-05",
    "criadoEm": "2026-10-01T09:00:00",
    "planosPreventivos": [
      {
        "id": "prev-demo-006",
        "tipo": "Inspeção do disco",
        "periodicidade": "Trimestral",
        "dataPrevista": "2026-12-05",
        "avisoAntecipado": "7 dias",
        "insumos": [
          {
            "nome": "Disco de corte 125 mm",
            "quantidade": 2,
            "unidade": "un"
          }
        ]
      }
    ],
    "chamados": [],
    "eventos": [
      {
        "id": "evt-demo-cadastro-6",
        "tipo": "cadastro",
        "titulo": "Equipamento cadastrado (demonstração)",
        "descricao": "Cadastro fictício para apresentação das funcionalidades do sistema.",
        "data": "2026-10-01T09:00:00"
      }
    ]
  }
];


/* ETAPA 32 — Compatibilidade dos exemplos antigos com a Etapa 31.
   O localStorage tem prioridade sobre os exemplos; por isso, instalações antigas
   não exibiam os campos novos. Esta atualização preenche SOMENTE campos vazios
   dos seis códigos demonstrativos conhecidos, sem substituir alterações existentes.
   Planos preventivos são adicionados apenas quando não existe um array de planos;
   chamados e histórico existentes nunca são alterados nem duplicados.
   O marcador por equipamento impede que campos apagados pelo usuário sejam
   preenchidos novamente nas visitas seguintes. */
(function atualizarExemplosLegados() {
    'use strict';
    const chave = 'panna-assets-equipamentos-v1';
    let lista;
    try {
        const bruto = localStorage.getItem(chave);
        if (bruto === null) return; // Primeira visita: a carga completa já é usada.
        lista = JSON.parse(bruto);
        if (!Array.isArray(lista)) return;
    } catch (erro) {
        console.warn('ETAPA 32: não foi possível ler os equipamentos salvos.', erro);
        return;
    }
    const exemplos = new Map((window.PANNA_EQUIPAMENTOS_INICIAIS || []).map(e => [e.codigo, e]));
    const camposComplementares = [
        'marca', 'modelo', 'numeroSerie', 'patrimonio', 'potencia', 'fornecedor',
        'valorAquisicao', 'dataAquisicao', 'fimGarantia', 'responsavel', 'observacoes'
    ];
    let alterou = false;
    lista.forEach(equipamento => {
        const modelo = exemplos.get(equipamento?.codigo);
        if (!modelo || equipamento._pannaDemoEnriquecidoV32) return;
        // ETAPA 32: não alterar cadastros que já têm identificação técnica própria.
        // O conjunto original tinha marca/modelo/série/patrimônio ausentes.
        const pareceExemploAntigo = ['marca','modelo','numeroSerie','patrimonio']
            .every(campo => equipamento[campo] === undefined || equipamento[campo] === null || equipamento[campo] === '');
        if (!pareceExemploAntigo) return;
        camposComplementares.forEach(campo => {
            if ((equipamento[campo] === undefined || equipamento[campo] === null || equipamento[campo] === '') && modelo[campo] != null) {
                equipamento[campo] = modelo[campo];
            }
        });
        // ETAPA 32: um plano que já tenha sido editado ou removido explicitamente
        // (array existente, mesmo vazio) é mantido como está.
        if (!Array.isArray(equipamento.planosPreventivos)) {
            equipamento.planosPreventivos = (modelo.planosPreventivos || []).map(plano => ({
                ...plano,
                dataPrevista: equipamento.proximaPreventiva && equipamento.proximaPreventiva !== '-'
                    ? equipamento.proximaPreventiva : plano.dataPrevista,
                insumos: (plano.insumos || []).map(insumo => ({...insumo}))
            }));
        }
        equipamento._pannaDemoEnriquecidoV32 = true;
        alterou = true;
    });
    if (alterou) {
        try { localStorage.setItem(chave, JSON.stringify(lista)); }
        catch (erro) { console.warn('ETAPA 32: espaço insuficiente para salvar os exemplos atualizados.', erro); }
    }
})();
