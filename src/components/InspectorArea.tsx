import React, { useState, useEffect, useMemo } from 'react';
import { LUANDA_PRACAS, PracaLocation } from './LiveMapView';

export interface FiscalPermissions {
  validacaoPresencial: boolean; // Vistoria presencial de viaturas e motoristas
  gestaoBaia: boolean;          // Despacho de carrinhas e organização da fila
  registoOcorrencias: boolean;  // Registo de infrações, incidentes e segurança
  correcoesFila: boolean;       // Reordenamento e ajustes manuais na fila
  conferenciaTaxas: boolean;    // Fiscalização de tarifa (500 Kz) e taxas
}

export interface FiscalAccount {
  id: string;                    // ex: 'FISC-LU-042'
  nome: string;                  // ex: 'Mateus Afonso Domingos'
  contacto: string;              // ex: '+244 923 456 789'
  identificacaoFuncional: string;// ex: 'ANATA-FIS-042/LU'
  pracaAtribuidaId: string;      // id da praça (ex: 'praca-sp')
  pracaAtribuidaNome: string;    // 'São Paulo'
  areaTrabalho: string;          // 'Baia 01 / Cais de Embarque Corredor Viana'
  username: string;              // 'fiscal.mateus'
  telefoneAuth: string;          // '923456789'
  permissoes: FiscalPermissions;
  status: 'ativo' | 'suspenso' | 'pendente_autorizacao';
  autorizadoPor: string;         // 'Diretoria Central ANATA & ATL'
  dataAutorizacao: string;
  pinAuth?: string;
  fotoUrl?: string;
}

export type FiscalActionCategory =
  | 'validacao_presencial'
  | 'correcao_fila'
  | 'ocorrencia'
  | 'despacho_viatura'
  | 'conferencia_taxa'
  | 'autenticacao';

export interface FiscalActionLog {
  id: string;
  timestamp: string;
  fiscalId: string;
  fiscalNome: string;
  fiscalIdentificacao: string;
  praca: string;
  baia: string;
  categoria: FiscalActionCategory;
  titulo: string;
  descricao: string;
  alvo?: string; // ex: 'Viatura LD-00-00-XX (Motorista João Manuel)'
  resultado: 'Aprovado' | 'Rejeitado' | 'Corrigido' | 'Registado' | 'Despachado' | 'Alerta' | 'Conferido' | 'Bloqueio';
  icone: string;
  corTag: string;
}

export interface DriverInspectionQueueItem {
  id: string;
  motoristaNome: string;
  telefone: string;
  numeroCarta: string;
  numeroBi: string;
  matricula: string;
  modelo: string;
  lotacao: number;
  pracaNome: string;
  destino: string;
  statusVistoria: 'pendente' | 'aprovado' | 'rejeitado';
  itensVerificados: {
    cartaConducao: boolean;
    biOriginal: boolean;
    pneusBomEstado: boolean;
    extintorValido: boolean;
    coleteTriangulo: boolean;
    lotacao15Lugares: boolean;
    higieneSinalizacao: boolean;
  };
  observacoes?: string;
}

const DEFAULT_FISCAIS: FiscalAccount[] = [
  {
    id: 'FISC-LU-042',
    nome: 'Mateus Afonso Domingos',
    contacto: '+244 923 456 789',
    identificacaoFuncional: 'ANATA-FIS-042/LU',
    pracaAtribuidaId: 'praca-sp',
    pracaAtribuidaNome: 'São Paulo',
    areaTrabalho: 'Baia Principal / Corredor Cacuaco & Viana',
    username: 'fiscal.mateus',
    telefoneAuth: '923456789',
    pinAuth: '1234',
    permissoes: {
      validacaoPresencial: true,
      gestaoBaia: true,
      registoOcorrencias: true,
      correcoesFila: true,
      conferenciaTaxas: true,
    },
    status: 'ativo',
    autorizadoPor: 'Administração Geral ANATA & ATL Luanda',
    dataAutorizacao: '15/01/2026',
    fotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'FISC-LU-018',
    nome: 'António Kapita',
    contacto: '+244 912 334 455',
    identificacaoFuncional: 'ATL-FIS-018/LU',
    pracaAtribuidaId: 'praca-viana',
    pracaAtribuidaNome: 'Viana (Estalagem)',
    areaTrabalho: 'Baia 02 / Corredor Estrada de Catete',
    username: 'fiscal.kapita',
    telefoneAuth: '912334455',
    pinAuth: '1234',
    permissoes: {
      validacaoPresencial: true,
      gestaoBaia: true,
      registoOcorrencias: true,
      correcoesFila: true,
      conferenciaTaxas: false,
    },
    status: 'ativo',
    autorizadoPor: 'Direção Municipal de Viana / ANATA',
    dataAutorizacao: '02/02/2026',
    fotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'FISC-LU-077',
    nome: 'Bernardo Kiala Zua',
    contacto: '+244 931 778 990',
    identificacaoFuncional: 'GPL-FIS-077/LU',
    pracaAtribuidaId: 'praca-maculusso',
    pracaAtribuidaNome: 'Maculusso',
    areaTrabalho: 'Terminal Centro / Baia 01 & 02',
    username: 'fiscal.kiala',
    telefoneAuth: '931778990',
    pinAuth: '1234',
    permissoes: {
      validacaoPresencial: true,
      gestaoBaia: true,
      registoOcorrencias: true,
      correcoesFila: false,
      conferenciaTaxas: true,
    },
    status: 'ativo',
    autorizadoPor: 'Governo Provincial de Luanda (GPL) / Transportes',
    dataAutorizacao: '10/03/2026',
    fotoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  },
];

const INITIAL_LOGS: FiscalActionLog[] = [
  {
    id: 'LOG-89101',
    timestamp: '12 Out 2026, 07:15:32',
    fiscalId: 'FISC-LU-042',
    fiscalNome: 'Mateus Afonso Domingos',
    fiscalIdentificacao: 'ANATA-FIS-042/LU',
    praca: 'São Paulo',
    baia: 'Baia 01',
    categoria: 'despacho_viatura',
    titulo: 'Despacho de Carrinha #01',
    descricao: 'Carrinha LD-44-21-GB despachada com 15 passageiros completos rumo a Viana.',
    alvo: 'Carrinha LD-44-21-GB (Motorista Sebastião)',
    resultado: 'Despachado',
    icone: 'send',
    corTag: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  {
    id: 'LOG-89100',
    timestamp: '12 Out 2026, 06:50:18',
    fiscalId: 'FISC-LU-042',
    fiscalNome: 'Mateus Afonso Domingos',
    fiscalIdentificacao: 'ANATA-FIS-042/LU',
    praca: 'São Paulo',
    baia: 'Baia 01',
    categoria: 'validacao_presencial',
    titulo: 'Vistoria Presencial Aprovada',
    descricao: 'Inspeção presencial dos itens de segurança e documentos originais da viatura LD-12-88-FA homologada.',
    alvo: 'Viatura LD-12-88-FA (Motorista Manuel Bento)',
    resultado: 'Aprovado',
    icone: 'verified',
    corTag: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  {
    id: 'LOG-89098',
    timestamp: '12 Out 2026, 06:30:05',
    fiscalId: 'FISC-LU-042',
    fiscalNome: 'Mateus Afonso Domingos',
    fiscalIdentificacao: 'ANATA-FIS-042/LU',
    praca: 'São Paulo',
    baia: 'Baia 02',
    categoria: 'correcao_fila',
    titulo: 'Reordenamento Manual da Fila',
    descricao: 'Carrinha LD-99-12-BB recolocada no fim da fila devido a pneu suplente despressurizado.',
    alvo: 'Viatura LD-99-12-BB',
    resultado: 'Corrigido',
    icone: 'published_with_changes',
    corTag: 'bg-amber-100 text-amber-800 border-amber-300',
  },
];

interface InspectorAreaProps {
  currentOriginPraca: PracaLocation;
  setCurrentOriginPraca: (praca: PracaLocation) => void;
  currentDestName: string;
  setCurrentDestName: (dest: string) => void;
  onTriggerNotice: (title: string, message: string, icon?: string) => void;
  triggerVibrate: () => void;
  onSwitchToPassenger: () => void;
  onSwitchToDriver: () => void;
  onSwitchToAdmin: () => void;
}

export function InspectorArea({
  currentOriginPraca,
  setCurrentOriginPraca,
  currentDestName,
  setCurrentDestName,
  onTriggerNotice,
  triggerVibrate,
  onSwitchToPassenger,
  onSwitchToDriver,
  onSwitchToAdmin,
}: InspectorAreaProps) {
  // Lista de Fiscais conhecidos
  const [fiscais, setFiscais] = useState<FiscalAccount[]>(() => {
    try {
      const saved = localStorage.getItem('filataxi_fiscais_list');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_FISCAIS;
  });

  // Fiscal atualmente com sessão iniciada
  const [activeFiscalId, setActiveFiscalId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem('filataxi_active_fiscal_id');
      if (savedId) return savedId;
    } catch {
      // fallback
    }
    return 'FISC-LU-042';
  });

  const activeFiscal = useMemo(() => {
    return fiscais.find((f) => f.id === activeFiscalId) || fiscais[0] || DEFAULT_FISCAIS[0];
  }, [fiscais, activeFiscalId]);

  // Auditoria de Ações do Fiscal
  const [auditLogs, setAuditLogs] = useState<FiscalActionLog[]>(() => {
    try {
      const saved = localStorage.getItem('filataxi_fiscal_audit_logs');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_LOGS;
  });

  // Salvar no localStorage
  useEffect(() => {
    try {
      localStorage.setItem('filataxi_fiscais_list', JSON.stringify(fiscais));
    } catch {
      // ignore
    }
  }, [fiscais]);

  useEffect(() => {
    try {
      localStorage.setItem('filataxi_active_fiscal_id', activeFiscalId);
    } catch {
      // ignore
    }
  }, [activeFiscalId]);

  useEffect(() => {
    try {
      localStorage.setItem('filataxi_fiscal_audit_logs', JSON.stringify(auditLogs));
    } catch {
      // ignore
    }
  }, [auditLogs]);

  // Sincronizar praça ativa com a do fiscal quando mudar
  useEffect(() => {
    if (activeFiscal && activeFiscal.pracaAtribuidaNome) {
      const matchingPraca = LUANDA_PRACAS.find(
        (p) => p.name.toLowerCase() === activeFiscal.pracaAtribuidaNome.toLowerCase()
      );
      if (matchingPraca && matchingPraca.id !== currentOriginPraca.id) {
        setCurrentOriginPraca(matchingPraca);
      }
    }
  }, [activeFiscal]);

  // Sub-aba ativa dentro da área do fiscal
  const [activeFiscalTab, setActiveFiscalTab] = useState<
    'posto' | 'vistoria' | 'correcao' | 'ocorrencias' | 'auditoria' | 'conta'
  >('posto');

  // Baia operacional selecionada
  const [selectedBaia, setSelectedBaia] = useState<string>('Baia 01');

  // Fila de carrinhas simulada para a baia
  const [taxisNaBaia, setTaxisNaBaia] = useState([
    {
      id: 'tx-1',
      ordem: 1,
      matricula: 'LD-44-21-GB',
      motorista: 'Sebastião Quaresma',
      destino: 'Viana (Vila)',
      lotacaoAtual: 15,
      lotacaoMax: 15,
      status: 'Pronto para Despacho',
      corredor: 'Estrada de Catete',
    },
    {
      id: 'tx-2',
      ordem: 2,
      matricula: 'LD-00-00-XX',
      motorista: 'João Manuel',
      destino: currentDestName || 'Viana (Vila)',
      lotacaoAtual: 12,
      lotacaoMax: 15,
      status: 'A Carregar Passageiros',
      corredor: 'Deolinda Rodrigues',
    },
    {
      id: 'tx-3',
      ordem: 3,
      matricula: 'LD-19-45-KA',
      motorista: 'Afonso Pedro',
      destino: 'Cacuaco',
      lotacaoAtual: 0,
      lotacaoMax: 15,
      status: 'Aguardando Vez no Cais',
      corredor: 'Via Expressa',
    },
    {
      id: 'tx-4',
      ordem: 4,
      matricula: 'LD-88-32-ZC',
      motorista: 'Mateus Gouveia',
      destino: 'Benfica',
      lotacaoAtual: 0,
      lotacaoMax: 15,
      status: 'Na Fila Externa',
      corredor: 'Samba / Corredor Sul',
    },
  ]);

  // Fila de vistorias pendentes (conectada ao registo de motoristas)
  const [inspectionsQueue, setInspectionsQueue] = useState<DriverInspectionQueueItem[]>([
    {
      id: 'insp-1',
      motoristaNome: 'João Manuel',
      telefone: '+244 923 000 111',
      numeroCarta: 'CARTA-001',
      numeroBi: '004829104LA049',
      matricula: 'LD-00-00-XX',
      modelo: 'Toyota Hiace Azul e Branco',
      lotacao: 15,
      pracaNome: activeFiscal.pracaAtribuidaNome,
      destino: 'Viana',
      statusVistoria: 'pendente',
      itensVerificados: {
        cartaConducao: true,
        biOriginal: true,
        pneusBomEstado: true,
        extintorValido: true,
        coleteTriangulo: true,
        lotacao15Lugares: true,
        higieneSinalizacao: true,
      },
    },
    {
      id: 'insp-2',
      motoristaNome: 'Domingos Chivela',
      telefone: '+244 912 888 222',
      numeroCarta: 'CARTA-LU-4982',
      numeroBi: '002938475LA033',
      matricula: 'LD-52-19-HY',
      modelo: 'Toyota Hiace Minibus',
      lotacao: 15,
      pracaNome: activeFiscal.pracaAtribuidaNome,
      destino: 'Cacuaco',
      statusVistoria: 'pendente',
      itensVerificados: {
        cartaConducao: true,
        biOriginal: true,
        pneusBomEstado: false,
        extintorValido: true,
        coleteTriangulo: true,
        lotacao15Lugares: true,
        higieneSinalizacao: false,
      },
      observacoes: 'Pneu traseiro esquerdo com desgaste excessivo; requer substituição.',
    },
  ]);

  // Formulário de Nova Ocorrência
  const [novaOcorrenciaTipo, setNovaOcorrenciaTipo] = useState<string>('Superlotação Irregular');
  const [novaOcorrenciaViatura, setNovaOcorrenciaViatura] = useState<string>('LD-00-00-XX');
  const [novaOcorrenciaDescricao, setNovaOcorrenciaDescricao] = useState<string>('');
  const [novaOcorrenciaGravidade, setNovaOcorrenciaGravidade] = useState<'Baixa' | 'Média' | 'Alta' | 'Crítica'>('Média');
  const [novaOcorrenciaAcao, setNovaOcorrenciaAcao] = useState<string>('Advertência no local e desembarque do excedente');

  // Formulário de Correcção de Fila
  const [correcaoViatura, setCorrecaoViatura] = useState<string>('LD-00-00-XX');
  const [correcaoTipo, setCorrecaoTipo] = useState<string>('Reordenamento por avaria temporária');
  const [correcaoMotivo, setCorrecaoMotivo] = useState<string>('');
  const [correcaoNovaPosicao, setCorrecaoNovaPosicao] = useState<number>(3);

  // Modal para criar/solicitar conta de Fiscal
  const [showNovoFiscalModal, setShowNovoFiscalModal] = useState(false);
  const [novoFiscalNome, setNovoFiscalNome] = useState('');
  const [novoFiscalContacto, setNovoFiscalContacto] = useState('');
  const [novoFiscalIdFuncional, setNovoFiscalIdFuncional] = useState('');
  const [novoFiscalPracaId, setNovoFiscalPracaId] = useState('praca-sp');
  const [novoFiscalUsername, setNovoFiscalUsername] = useState('');
  const [novoFiscalPin, setNovoFiscalPin] = useState('1234');
  const [novoFiscalPermissoes, setNovoFiscalPermissoes] = useState<FiscalPermissions>({
    validacaoPresencial: true,
    gestaoBaia: true,
    registoOcorrencias: true,
    correcoesFila: true,
    conferenciaTaxas: true,
  });

  // Filtro do registo de auditoria
  const [logFilter, setLogFilter] = useState<'todos' | FiscalActionCategory>('todos');

  // Função central para registar ação importante do fiscal com assinatura digital e auditoria
  const recordFiscalAction = (params: {
    categoria: FiscalActionCategory;
    titulo: string;
    descricao: string;
    alvo?: string;
    resultado: 'Aprovado' | 'Rejeitado' | 'Corrigido' | 'Registado' | 'Despachado' | 'Alerta' | 'Conferido' | 'Bloqueio';
    icone: string;
    corTag: string;
  }) => {
    const now = new Date();
    const timeStr = now.toLocaleDateString('pt-AO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }) + ', ' + now.toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const newLog: FiscalActionLog = {
      id: `LOG-${Math.floor(10000 + Math.random() * 90000)}`,
      timestamp: timeStr,
      fiscalId: activeFiscal.id,
      fiscalNome: activeFiscal.nome,
      fiscalIdentificacao: activeFiscal.identificacaoFuncional,
      praca: activeFiscal.pracaAtribuidaNome,
      baia: selectedBaia,
      categoria: params.categoria,
      titulo: params.titulo,
      descricao: params.descricao,
      alvo: params.alvo,
      resultado: params.resultado,
      icone: params.icone,
      corTag: params.corTag,
    };

    setAuditLogs((prev) => [newLog, ...prev]);
    return newLog;
  };

  // 1. AÇÃO: Despachar Carrinha com 15 passageiros
  const handleDespacharTaxi = (taxi: typeof taxisNaBaia[0]) => {
    triggerVibrate();
    recordFiscalAction({
      categoria: 'despacho_viatura',
      titulo: `Despacho de Carrinha #${taxi.ordem} (${taxi.matricula})`,
      descricao: `O Fiscal confirmou os 15 passageiros sentados na ${selectedBaia} e autorizou a saída oficial rumo a ${taxi.destino}.`,
      alvo: `${taxi.matricula} • Motorista ${taxi.motorista}`,
      resultado: 'Despachado',
      icone: 'local_taxi',
      corTag: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    });

    // Reorganizar fila da baia
    setTaxisNaBaia((prev) => {
      const rest = prev.filter((t) => t.id !== taxi.id);
      return rest.map((t, index) => ({
        ...t,
        ordem: index + 1,
        status: index === 0 ? 'Pronto para Despacho' : index === 1 ? 'A Carregar Passageiros' : 'Aguardando Vez no Cais',
        lotacaoAtual: index === 0 ? 15 : index === 1 ? 11 : 0,
      }));
    });

    onTriggerNotice(
      'Carrinha Despachada com Sucesso!',
      `Viatura ${taxi.matricula} despachada pelo Fiscal ${activeFiscal.nome} (${activeFiscal.identificacaoFuncional}). Ação registada na auditoria oficial da ANATA.`,
      'verified'
    );
  };

  // 2. AÇÃO: Chamar Próximo Táxi para o Cais
  const handleChamarProximoTaxi = () => {
    triggerVibrate();
    const proximo = taxisNaBaia[0];
    if (!proximo) return;

    recordFiscalAction({
      categoria: 'despacho_viatura',
      titulo: `Chamada da Carrinha #${proximo.ordem} ao Cais de Embarque`,
      descricao: `Acionado alerta sonoro e chamada no painel luminoso da ${selectedBaia} para a viatura ${proximo.matricula} encostar na plataforma.`,
      alvo: proximo.matricula,
      resultado: 'Despachado',
      icone: 'campaign',
      corTag: 'bg-blue-100 text-blue-800 border-blue-300',
    });

    onTriggerNotice(
      'Chamada Transmitida na Baia!',
      `Chamada emitida para a viatura ${proximo.matricula} (Motorista ${proximo.motorista}). Passageiros com senha digital informados no ecrã.`,
      'campaign'
    );
  };

  // 3. AÇÃO: Aprovar Vistoria Presencial
  const handleAprovarVistoria = (item: DriverInspectionQueueItem) => {
    triggerVibrate();
    recordFiscalAction({
      categoria: 'validacao_presencial',
      titulo: `Vistoria Presencial Homologada: ${item.motoristaNome}`,
      descricao: `O Fiscal confirmou presencialmente carta de condução (${item.numeroCarta}), bilhete de identidade, extintor carregado, estepe, colete e lotação regulamentar de 15 lugares na viatura ${item.matricula}.`,
      alvo: `Motorista ${item.motoristaNome} (${item.matricula})`,
      resultado: 'Aprovado',
      icone: 'verified',
      corTag: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    });

    setInspectionsQueue((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, statusVistoria: 'aprovado' } : i))
    );

    onTriggerNotice(
      'Vistoria Presencial Homologada!',
      `O Fiscal ${activeFiscal.nome} aprovou presencialmente a viatura ${item.matricula} do motorista ${item.motoristaNome}. O motorista está autorizado a entrar na fila oficial.`,
      'verified'
    );
  };

  // 4. AÇÃO: Rejeitar Vistoria Presencial
  const handleRejeitarVistoria = (item: DriverInspectionQueueItem, motivo: string) => {
    triggerVibrate();
    recordFiscalAction({
      categoria: 'validacao_presencial',
      titulo: `Vistoria Presencial Rejeitada: ${item.motoristaNome}`,
      descricao: `Não-conformidade detectada: ${motivo}. Viatura ${item.matricula} impedida de carregar passageiros até regularização técnica.`,
      alvo: `Motorista ${item.motoristaNome} (${item.matricula})`,
      resultado: 'Rejeitado',
      icone: 'warning',
      corTag: 'bg-rose-100 text-rose-800 border-rose-300',
    });

    setInspectionsQueue((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, statusVistoria: 'rejeitado', observacoes: motivo } : i
      )
    );

    onTriggerNotice(
      'Vistoria Rejeitada / Pendente de Correção',
      `Auto de não-conformidade emitido pelo Fiscal ${activeFiscal.nome}. O motorista foi notificado para sanar a pendência.`,
      'error'
    );
  };

  // 5. AÇÃO: Submeter Registo de Ocorrência
  const handleRegistarOcorrencia = (e: React.FormEvent) => {
    e.preventDefault();
    triggerVibrate();

    if (!novaOcorrenciaDescricao.trim()) {
      onTriggerNotice('Atenção', 'Por favor descreva os factos da ocorrência detalhadamente.', 'warning');
      return;
    }

    recordFiscalAction({
      categoria: 'ocorrencia',
      titulo: `Ocorrência: ${novaOcorrenciaTipo}`,
      descricao: `${novaOcorrenciaDescricao} | Gravidade: ${novaOcorrenciaGravidade}. Medida adotada pelo Fiscal: ${novaOcorrenciaAcao}.`,
      alvo: `Viatura ${novaOcorrenciaViatura} • ${activeFiscal.pracaAtribuidaNome} (${selectedBaia})`,
      resultado: novaOcorrenciaGravidade === 'Crítica' ? 'Bloqueio' : 'Registado',
      icone: 'report_problem',
      corTag:
        novaOcorrenciaGravidade === 'Crítica'
          ? 'bg-rose-100 text-rose-900 border-rose-400'
          : 'bg-amber-100 text-amber-900 border-amber-300',
    });

    onTriggerNotice(
      'Ocorrência Registada e Transmitida!',
      `Ocorrência formalizada pelo Fiscal ${activeFiscal.nome} (${activeFiscal.identificacaoFuncional}) e sincronizada com a Administração Central da ANATA/GPL.`,
      'report'
    );

    setNovaOcorrenciaDescricao('');
    setActiveFiscalTab('auditoria');
  };

  // 6. AÇÃO: Executar e Gravar Correcção na Fila
  const handleSubmeterCorrecaoFila = (e: React.FormEvent) => {
    e.preventDefault();
    triggerVibrate();

    if (!correcaoMotivo.trim()) {
      onTriggerNotice(
        'Justificação Obrigatória',
        'Todo ajuste ou correcção na fila exige um motivo formal auditável pelo Fiscal.',
        'warning'
      );
      return;
    }

    recordFiscalAction({
      categoria: 'correcao_fila',
      titulo: `Correcção Operacional: ${correcaoTipo}`,
      descricao: `Ajuste manual da fila pelo Fiscal: Viatura ${correcaoViatura} reordenada para a posição #${correcaoNovaPosicao}. Justificação oficial: "${correcaoMotivo}".`,
      alvo: `Viatura ${correcaoViatura}`,
      resultado: 'Corrigido',
      icone: 'published_with_changes',
      corTag: 'bg-purple-100 text-purple-800 border-purple-300',
    });

    onTriggerNotice(
      'Correcção de Fila Homologada!',
      `Alteração de ordem gravada com sucesso com carimbo digital do Fiscal ${activeFiscal.nome}. Fila atualizada no painel dos motoristas.`,
      'published_with_changes'
    );

    setCorrecaoMotivo('');
    setActiveFiscalTab('auditoria');
  };

  // 7. AÇÃO: Criar Novo Registo de Fiscal (ou solicitar autorização)
  const handleCriarNovoFiscal = (e: React.FormEvent) => {
    e.preventDefault();
    triggerVibrate();

    if (!novoFiscalNome.trim() || !novoFiscalContacto.trim() || !novoFiscalIdFuncional.trim()) {
      onTriggerNotice('Campos Obrigatórios', 'Preencha o nome, contacto e identificação funcional do Fiscal.', 'warning');
      return;
    }

    const pracaObj = LUANDA_PRACAS.find((p) => p.id === novoFiscalPracaId) || LUANDA_PRACAS[0];
    const generatedId = `FISC-LU-${Math.floor(100 + Math.random() * 900)}`;

    const newAccount: FiscalAccount = {
      id: generatedId,
      nome: novoFiscalNome,
      contacto: novoFiscalContacto,
      identificacaoFuncional: novoFiscalIdFuncional,
      pracaAtribuidaId: pracaObj.id,
      pracaAtribuidaNome: pracaObj.name,
      areaTrabalho: `Baia Principal / Corredor ${pracaObj.corridor}`,
      username: novoFiscalUsername || novoFiscalContacto.replace(/\D/g, ''),
      telefoneAuth: novoFiscalContacto.replace(/\D/g, ''),
      pinAuth: novoFiscalPin || '1234',
      permissoes: novoFiscalPermissoes,
      status: 'ativo',
      autorizadoPor: 'Administração Geral ANATA & ATL Luanda',
      dataAutorizacao: new Date().toLocaleDateString('pt-AO'),
      fotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    };

    setFiscais((prev) => [newAccount, ...prev]);
    setActiveFiscalId(newAccount.id);
    setShowNovoFiscalModal(false);

    recordFiscalAction({
      categoria: 'autenticacao',
      titulo: `Novo Fiscal Credenciado no Sistema: ${newAccount.nome}`,
      descricao: `Conta de Fiscal criada e autorizada pela Administração. Identificação: ${newAccount.identificacaoFuncional}, Praça: ${newAccount.pracaAtribuidaNome}.`,
      alvo: `${newAccount.nome} (${newAccount.id})`,
      resultado: 'Aprovado',
      icone: 'badge',
      corTag: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    });

    onTriggerNotice(
      'Fiscal Credenciado com Sucesso!',
      `Conta do Fiscal ${newAccount.nome} homologada com as permissões atribuídas para a Praça ${newAccount.pracaAtribuidaNome}.`,
      'verified'
    );

    // Reset form
    setNovoFiscalNome('');
    setNovoFiscalContacto('');
    setNovoFiscalIdFuncional('');
    setNovoFiscalUsername('');
  };

  // Filtrar logs
  const filteredLogs = useMemo(() => {
    if (logFilter === 'todos') return auditLogs;
    return auditLogs.filter((log) => log.categoria === logFilter);
  }, [auditLogs, logFilter]);

  return (
    <div className="flex flex-col w-full pb-16">
      {/* ========================================================= */}
      {/* 1. CABEÇALHO DO FISCAL COM IDENTIFICAÇÃO FUNCIONAL OFICIAL */}
      {/* ========================================================= */}
      <div className="bg-primary text-on-primary px-4 pt-3 pb-4 shadow-md">
        <div className="flex items-center justify-between gap-2 border-b border-primary-container/20 pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative">
              <img
                src={activeFiscal.fotoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
                alt={activeFiscal.nome}
                className="w-12 h-12 rounded-xl object-cover border-2 border-secondary-container shadow-sm"
              />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-secondary-container text-on-secondary-fixed text-[10px] font-black tracking-wider uppercase">
                  FISCAL EM TURNO
                </span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  AUTORIZADO
                </span>
              </div>
              <h2 className="text-base font-bold text-on-primary truncate mt-0.5">
                {activeFiscal.nome}
              </h2>
              <div className="flex items-center gap-2 text-[11px] text-surface-container-high truncate">
                <span className="flex items-center gap-0.5 font-mono text-secondary-container font-semibold">
                  <span className="material-symbols-outlined text-[13px]">badge</span>
                  {activeFiscal.identificacaoFuncional}
                </span>
                <span>•</span>
                <span className="truncate">{activeFiscal.pracaAtribuidaNome}</span>
              </div>
            </div>
          </div>

          {/* Trocar Fiscal ou Ver Conta */}
          <button
            onClick={() => setActiveFiscalTab('conta')}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/10 hover:bg-white/15 text-on-primary text-[10px] font-bold active:scale-95 transition-transform cursor-pointer shrink-0 border border-white/15"
            title="Conta & Credencial do Fiscal"
          >
            <span className="material-symbols-outlined text-[20px] text-secondary-container">
              account_box
            </span>
            <span>Credencial</span>
          </button>
        </div>

        {/* Barra de Status da Praça Atribuída & Baia */}
        <div className="grid grid-cols-3 gap-2 pt-2.5 text-center">
          <div className="bg-white/10 rounded-xl p-2 border border-white/10">
            <span className="text-[10px] text-surface-container-high block">Praça Atribuída</span>
            <strong className="text-xs text-secondary-container block truncate font-bold">
              {activeFiscal.pracaAtribuidaNome}
            </strong>
          </div>
          <div className="bg-white/10 rounded-xl p-2 border border-white/10">
            <span className="text-[10px] text-surface-container-high block">Baia Ativa</span>
            <select
              value={selectedBaia}
              onChange={(e) => setSelectedBaia(e.target.value)}
              className="text-xs text-white bg-transparent font-bold focus:outline-none cursor-pointer"
            >
              <option value="Baia 01" className="text-neutral-900">Baia 01</option>
              <option value="Baia 02" className="text-neutral-900">Baia 02</option>
              <option value="Baia 03" className="text-neutral-900">Baia 03</option>
              <option value="Cais Principal" className="text-neutral-900">Cais Principal</option>
            </select>
          </div>
          <div className="bg-white/10 rounded-xl p-2 border border-white/10">
            <span className="text-[10px] text-surface-container-high block">Ações Gravadas</span>
            <strong className="text-xs text-emerald-300 block font-bold">
              {auditLogs.filter((l) => l.fiscalId === activeFiscal.id).length} registos
            </strong>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. BARRA DE SUB-ABAS OPERACIONAIS DO FISCAL               */}
      {/* ========================================================= */}
      <div className="sticky top-14 z-20 bg-surface-container-lowest border-b border-surface-container px-2 py-2 flex items-center gap-1.5 overflow-x-auto shadow-xs scrollbar-none">
        <button
          onClick={() => setActiveFiscalTab('posto')}
          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
            activeFiscalTab === 'posto'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'bg-surface-container-low text-primary hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[17px]">local_shipping</span>
          <span>Despacho & Baia</span>
        </button>

        <button
          onClick={() => setActiveFiscalTab('vistoria')}
          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer relative ${
            activeFiscalTab === 'vistoria'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'bg-surface-container-low text-primary hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[17px]">verified</span>
          <span>Vistoria Técnica</span>
          {inspectionsQueue.filter((i) => i.statusVistoria === 'pendente').length > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
              {inspectionsQueue.filter((i) => i.statusVistoria === 'pendente').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveFiscalTab('correcao')}
          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
            activeFiscalTab === 'correcao'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'bg-surface-container-low text-primary hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[17px]">published_with_changes</span>
          <span>Correcção de Fila</span>
        </button>

        <button
          onClick={() => setActiveFiscalTab('ocorrencias')}
          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
            activeFiscalTab === 'ocorrencias'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'bg-surface-container-low text-primary hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[17px]">report</span>
          <span>Ocorrências</span>
        </button>

        <button
          onClick={() => setActiveFiscalTab('auditoria')}
          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
            activeFiscalTab === 'auditoria'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'bg-surface-container-low text-primary hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[17px]">history_edu</span>
          <span>Registo & Auditoria</span>
        </button>

        <button
          onClick={() => setActiveFiscalTab('conta')}
          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
            activeFiscalTab === 'conta'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'bg-surface-container-low text-primary hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[17px]">badge</span>
          <span>Credencial</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* 3. CONTEÚDO ESPECÍFICO DE CADA ABA DO FISCAL              */}
      {/* ========================================================= */}
      <div className="px-4 pt-3 space-y-4">

        {/* --------------------------------------------------------- */}
        {/* ABA 1: POSTO DE OPERAÇÕES & DESPACHO DE BAIAS            */}
        {/* --------------------------------------------------------- */}
        {activeFiscalTab === 'posto' && (
          <div className="space-y-4">
            {/* Banner de Aviso Legal e Permissões Operacionais */}
            <div className="bg-surface-container-lowest p-3.5 rounded-2xl border border-surface-container shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-secondary">security</span>
                  Competência Operacional do Fiscal de Praça
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {selectedBaia} Ativa
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                Cada autorização de saída, validação de viatura ou chamada de carrinha emitida é rubricada digitalmente com o ID <strong className="text-primary font-mono">{activeFiscal.identificacaoFuncional}</strong> para conferência da Administração e da Associação de Taxistas.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {activeFiscal.permissoes.gestaoBaia && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-surface-container text-primary font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px] text-emerald-600">check_circle</span>
                    Despacho de Baia
                  </span>
                )}
                {activeFiscal.permissoes.validacaoPresencial && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-surface-container text-primary font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px] text-emerald-600">check_circle</span>
                    Vistoria Presencial
                  </span>
                )}
                {activeFiscal.permissoes.correcoesFila && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-surface-container text-primary font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px] text-emerald-600">check_circle</span>
                    Correcções de Fila
                  </span>
                )}
                {activeFiscal.permissoes.registoOcorrencias && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-surface-container text-primary font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px] text-emerald-600">check_circle</span>
                    Ocorrências
                  </span>
                )}
              </div>
            </div>

            {/* Ações Rápidas no Cais */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={handleChamarProximoTaxi}
                className="p-3.5 rounded-2xl bg-secondary-container text-on-secondary-fixed font-bold text-xs flex flex-col items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform cursor-pointer text-center"
              >
                <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[22px]">campaign</span>
                </div>
                <span>Chamar Próximo Táxi</span>
                <span className="text-[10px] text-on-secondary-fixed/80 font-normal">Aviso Sonoro & Painel</span>
              </button>

              <button
                onClick={() => {
                  triggerVibrate();
                  recordFiscalAction({
                    categoria: 'conferencia_taxa',
                    titulo: 'Conferência de Tarifa Oficial (500 Kz)',
                    descricao: `Fiscal fiscalizou a cobrança na ${selectedBaia}. Nenhuma especulação tarifária detectada nos passageiros embarcados.`,
                    alvo: `Passageiros ${selectedBaia}`,
                    resultado: 'Conferido',
                    icone: 'payments',
                    corTag: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                  });
                  onTriggerNotice(
                    'Tarifa Regulamentar Auditada',
                    `Fiscal ${activeFiscal.nome} conferiu a tarifa oficial tabelada de 500 Kz na ${selectedBaia}. Registo salvo no livro de auditoria.`,
                    'payments'
                  );
                }}
                className="p-3.5 rounded-2xl bg-surface-container-lowest text-primary border border-surface-container font-bold text-xs flex flex-col items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-transform cursor-pointer text-center"
              >
                <div className="w-10 h-10 rounded-xl bg-surface-container text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px] text-emerald-700">price_check</span>
                </div>
                <span>Conferir Tarifa 500 Kz</span>
                <span className="text-[10px] text-on-surface-variant font-normal">Evitar Especulação</span>
              </button>
            </div>

            {/* Carrinhas em Operação na Baia */}
            <div className="bg-surface-container-lowest rounded-2xl p-4 border border-surface-container shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-primary">Carrinhas na Baia & Cais de Embarque</h3>
                  <p className="text-[11px] text-on-surface-variant">
                    {activeFiscal.pracaAtribuidaNome} • {selectedBaia}
                  </p>
                </div>
                <span className="text-[11px] font-bold text-secondary px-2.5 py-1 rounded-full bg-secondary-container/30">
                  {taxisNaBaia.length} viaturas
                </span>
              </div>

              <div className="space-y-2.5">
                {taxisNaBaia.map((taxi) => (
                  <div
                    key={taxi.id}
                    className={`p-3 rounded-xl border transition-all ${
                      taxi.ordem === 1
                        ? 'bg-amber-50/60 border-amber-300'
                        : 'bg-surface-container-low border-surface-container'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                            taxi.ordem === 1
                              ? 'bg-primary text-on-primary'
                              : 'bg-surface-container text-primary'
                          }`}
                        >
                          #{taxi.ordem}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <strong className="text-xs text-primary font-mono">{taxi.matricula}</strong>
                            <span className="text-[10px] text-on-surface-variant font-normal">
                              ({taxi.motorista})
                            </span>
                          </div>
                          <span className="text-[11px] text-secondary font-semibold block">
                            Destino: {taxi.destino} • {taxi.corredor}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            taxi.lotacaoAtual >= taxi.lotacaoMax
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {taxi.lotacaoAtual}/{taxi.lotacaoMax} passageiros
                        </span>
                        <span className="text-[10px] text-on-surface-variant block mt-0.5">
                          {taxi.status}
                        </span>
                      </div>
                    </div>

                    {/* Barra de lotação */}
                    <div className="w-full h-2 rounded-full bg-surface-container mt-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          taxi.lotacaoAtual >= taxi.lotacaoMax ? 'bg-emerald-600' : 'bg-primary'
                        }`}
                        style={{ width: `${(taxi.lotacaoAtual / taxi.lotacaoMax) * 100}%` }}
                      />
                    </div>

                    {/* Botão de Despacho para a Carrinha #01 */}
                    {taxi.ordem === 1 && (
                      <div className="pt-2 flex items-center gap-2">
                        <button
                          onClick={() => handleDespacharTaxi(taxi)}
                          className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs active:scale-95 transition-transform flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[17px]">verified</span>
                          <span>Autorizar Saída & Despacho Oficial (15/15)</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* ABA 2: VISTORIA TÉCNICA PRESENCIAL DE MOTORISTAS          */}
        {/* --------------------------------------------------------- */}
        {activeFiscalTab === 'vistoria' && (
          <div className="space-y-4">
            <div className="bg-surface-container-lowest p-3.5 rounded-2xl border border-surface-container shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-surface-container">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">fact_check</span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-primary">Vistoria Presencial na Praça</h3>
                    <p className="text-[10px] text-on-surface-variant">
                      Validação obrigatória no terreno pelo Fiscal antes da entrada na fila
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                  {inspectionsQueue.filter((i) => i.statusVistoria === 'pendente').length} Pendentes
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant pt-2 leading-relaxed">
                De acordo com as regras operacionais da Associação e do GPL, a aprovação do motorista exige conferência física dos documentos originais e inspeção visual da viatura.
              </p>
            </div>

            {/* Lista de Motoristas e Viaturas para Vistoria */}
            <div className="space-y-3">
              {inspectionsQueue.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    item.statusVistoria === 'aprovado'
                      ? 'bg-emerald-50/70 border-emerald-300'
                      : item.statusVistoria === 'rejeitado'
                      ? 'bg-rose-50/70 border-rose-300'
                      : 'bg-surface-container-lowest border-surface-container'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-primary">{item.motoristaNome}</h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.statusVistoria === 'aprovado'
                              ? 'bg-emerald-200 text-emerald-900'
                              : item.statusVistoria === 'rejeitado'
                              ? 'bg-rose-200 text-rose-900'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {item.statusVistoria === 'aprovado'
                            ? 'Aprovado Presencialmente'
                            : item.statusVistoria === 'rejeitado'
                            ? 'Rejeitado / Pendente Correção'
                            : 'Aguardando Vistoria'}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant font-mono mt-0.5">
                        {item.matricula} • {item.modelo}
                      </p>
                    </div>

                    <span className="text-xs font-semibold text-secondary">
                      {item.destino}
                    </span>
                  </div>

                  {/* Detalhes de Documentos */}
                  <div className="grid grid-cols-2 gap-2 my-2.5 p-2.5 rounded-xl bg-surface-container-low text-[11px]">
                    <div>
                      <span className="text-on-surface-variant block text-[10px]">Carta de Condução:</span>
                      <strong className="text-primary font-mono">{item.numeroCarta}</strong>
                    </div>
                    <div>
                      <span className="text-on-surface-variant block text-[10px]">Bilhete de Identidade:</span>
                      <strong className="text-primary font-mono">{item.numeroBi}</strong>
                    </div>
                    <div>
                      <span className="text-on-surface-variant block text-[10px]">Telefone / WhatsApp:</span>
                      <span className="text-primary">{item.telefone}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant block text-[10px]">Lotação Regulamentar:</span>
                      <span className="text-primary font-bold">{item.lotacao} Passageiros</span>
                    </div>
                  </div>

                  {/* Checklist Presencial do Fiscal */}
                  <div className="space-y-1 py-1">
                    <span className="text-[11px] font-bold text-primary block">
                      Checklist Técnica Presencial:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.itensVerificados.cartaConducao}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setInspectionsQueue((prev) =>
                              prev.map((i) =>
                                i.id === item.id
                                  ? {
                                      ...i,
                                      itensVerificados: { ...i.itensVerificados, cartaConducao: val },
                                    }
                                  : i
                              )
                            );
                          }}
                          className="rounded text-primary focus:ring-0"
                        />
                        <span>Carta Física Válida</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.itensVerificados.extintorValido}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setInspectionsQueue((prev) =>
                              prev.map((i) =>
                                i.id === item.id
                                  ? {
                                      ...i,
                                      itensVerificados: { ...i.itensVerificados, extintorValido: val },
                                    }
                                  : i
                              )
                            );
                          }}
                          className="rounded text-primary focus:ring-0"
                        />
                        <span>Extintor Carregado</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.itensVerificados.pneusBomEstado}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setInspectionsQueue((prev) =>
                              prev.map((i) =>
                                i.id === item.id
                                  ? {
                                      ...i,
                                      itensVerificados: { ...i.itensVerificados, pneusBomEstado: val },
                                    }
                                  : i
                              )
                            );
                          }}
                          className="rounded text-primary focus:ring-0"
                        />
                        <span>Pneus & Estepe OK</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.itensVerificados.lotacao15Lugares}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setInspectionsQueue((prev) =>
                              prev.map((i) =>
                                i.id === item.id
                                  ? {
                                      ...i,
                                      itensVerificados: { ...i.itensVerificados, lotacao15Lugares: val },
                                    }
                                  : i
                              )
                            );
                          }}
                          className="rounded text-primary focus:ring-0"
                        />
                        <span>15 Lugares Fixos</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.itensVerificados.coleteTriangulo}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setInspectionsQueue((prev) =>
                              prev.map((i) =>
                                i.id === item.id
                                  ? {
                                      ...i,
                                      itensVerificados: { ...i.itensVerificados, coleteTriangulo: val },
                                    }
                                  : i
                              )
                            );
                          }}
                          className="rounded text-primary focus:ring-0"
                        />
                        <span>Colete & Triângulo</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.itensVerificados.higieneSinalizacao}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setInspectionsQueue((prev) =>
                              prev.map((i) =>
                                i.id === item.id
                                  ? {
                                      ...i,
                                      itensVerificados: { ...i.itensVerificados, higieneSinalizacao: val },
                                    }
                                  : i
                              )
                            );
                          }}
                          className="rounded text-primary focus:ring-0"
                        />
                        <span>Pintura Azul e Branco</span>
                      </label>
                    </div>
                  </div>

                  {item.observacoes && (
                    <div className="p-2 rounded-lg bg-amber-100/60 text-amber-900 text-[11px] mt-2 border border-amber-200">
                      <strong>Observações do Fiscal:</strong> {item.observacoes}
                    </div>
                  )}

                  {/* Ações de Homologação */}
                  <div className="flex items-center gap-2 pt-3 border-t border-surface-container mt-2">
                    <button
                      onClick={() => handleAprovarVistoria(item)}
                      className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs active:scale-95 transition-transform flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">verified</span>
                      <span>Homologar Presencialmente</span>
                    </button>
                    <button
                      onClick={() =>
                        handleRejeitarVistoria(
                          item,
                          'Inconformidade detectada nos equipamentos de segurança / pneus.'
                        )
                      }
                      className="px-3.5 py-2 bg-surface-container text-rose-800 border border-rose-200 font-bold text-xs rounded-xl active:scale-95 transition-transform cursor-pointer"
                    >
                      Rejeitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* ABA 3: CORRECÇÃO E AJUSTES DE FILA                        */}
        {/* --------------------------------------------------------- */}
        {activeFiscalTab === 'correcao' && (
          <div className="space-y-4">
            <div className="bg-surface-container-lowest p-4 rounded-2xl border border-surface-container shadow-xs space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-700 text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">tune</span>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-primary">Registo de Correcções e Ajustes de Fila</h3>
                  <p className="text-[10px] text-on-surface-variant">
                    Todas as correcções manuais ficam gravadas com o seu identificador fiscal
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                Em caso de avaria mecânica, desistência ou prioridade estipulada pelas normas de trânsito de Luanda, o Fiscal pode reordenar a fila indicando a justificação formal obrigatória.
              </p>
            </div>

            <form
              onSubmit={handleSubmeterCorrecaoFila}
              className="bg-surface-container-lowest p-4 rounded-2xl border border-surface-container shadow-xs space-y-3"
            >
              <div>
                <label className="text-xs font-bold text-primary block mb-1">
                  Viatura Alvo da Correcção:
                </label>
                <select
                  value={correcaoViatura}
                  onChange={(e) => setCorrecaoViatura(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-surface-container bg-surface-container-low text-xs text-primary font-bold focus:outline-none"
                >
                  {taxisNaBaia.map((t) => (
                    <option key={t.id} value={t.matricula}>
                      {t.matricula} — {t.motorista} (Posição atual: #{t.ordem})
                    </option>
                  ))}
                  <option value="LD-99-12-BB">LD-99-12-BB — Fila Externa</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-primary block mb-1">
                  Tipo de Correcção:
                </label>
                <select
                  value={correcaoTipo}
                  onChange={(e) => setCorrecaoTipo(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-surface-container bg-surface-container-low text-xs text-primary focus:outline-none"
                >
                  <option value="Reordenamento por avaria mecânica temporária">
                    Reordenamento por avaria mecânica temporária (pneu/radiador)
                  </option>
                  <option value="Remoção da fila por ausência do motorista na chamada">
                    Remoção da fila por ausência do motorista na chamada
                  </option>
                  <option value="Reintegração após resolução de pendência técnica">
                    Reintegração após resolução de pendência técnica
                  </option>
                  <option value="Troca autorizada de destino por excesso de passageiros">
                    Troca autorizada de destino por excesso de passageiros
                  </option>
                  <option value="Prioridade de despacho por escala extraordinária ANATA">
                    Prioridade de despacho por escala extraordinária ANATA
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-primary block mb-1">
                    Nova Posição na Fila:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={correcaoNovaPosicao}
                    onChange={(e) => setCorrecaoNovaPosicao(parseInt(e.target.value) || 1)}
                    className="w-full p-2.5 rounded-xl border border-surface-container bg-surface-container-low text-xs text-primary font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-primary block mb-1">
                    Praça & Baia:
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`${activeFiscal.pracaAtribuidaNome} (${selectedBaia})`}
                    className="w-full p-2.5 rounded-xl border border-surface-container bg-surface-container text-xs text-on-surface-variant font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-primary block mb-1">
                  Justificação Formal do Fiscal (Obrigatório para Auditoria):
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Descreva o motivo formal do ajuste para validação da Direção de Operações..."
                  value={correcaoMotivo}
                  onChange={(e) => setCorrecaoMotivo(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-surface-container bg-surface-container-low text-xs text-primary focus:outline-none"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-900 border border-purple-200 text-[11px] flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">fingerprint</span>
                <span>
                  Esta alteração será assinada com o carimbo <strong>{activeFiscal.identificacaoFuncional}</strong> ({activeFiscal.nome}).
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-primary hover:bg-primary/95 text-on-primary font-bold text-xs rounded-xl shadow-xs active:scale-95 transition-transform flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[17px]">published_with_changes</span>
                <span>Efetuar Correcção & Gravar no Registo</span>
              </button>
            </form>
          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* ABA 4: REGISTO DE OCORRÊNCIAS OPERACIONAIS                 */}
        {/* --------------------------------------------------------- */}
        {activeFiscalTab === 'ocorrencias' && (
          <div className="space-y-4">
            <div className="bg-surface-container-lowest p-4 rounded-2xl border border-surface-container shadow-xs space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">report_problem</span>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-primary">Registo de Ocorrências no Terreno</h3>
                  <p className="text-[10px] text-on-surface-variant">
                    Comunicação oficial de incidentes na Praça e nos corredores viários
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                Todas as infrações (como superlotação, cobrança abusiva superior a 500 Kz, desvios ou conflitos) devem ser lavradas pelo Fiscal com identificação da viatura e providências adotadas.
              </p>
            </div>

            <form
              onSubmit={handleRegistarOcorrencia}
              className="bg-surface-container-lowest p-4 rounded-2xl border border-surface-container shadow-xs space-y-3"
            >
              <div>
                <label className="text-xs font-bold text-primary block mb-1">
                  Natureza da Ocorrência:
                </label>
                <select
                  value={novaOcorrenciaTipo}
                  onChange={(e) => setNovaOcorrenciaTipo(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-surface-container bg-surface-container-low text-xs text-primary font-bold focus:outline-none"
                >
                  <option value="Superlotação Irregular">
                    Superlotação Irregular (Mais de 15 passageiros a bordo)
                  </option>
                  <option value="Especulação Tarifária">
                    Especulação Tarifária (Cobrança superior à tarifa de 500 Kz)
                  </option>
                  <option value="Desvio de Rota / Encurtamento">
                    Desvio de Rota / Encurtamento de percurso antes do destino
                  </option>
                  <option value="Conflito na Baia de Embarque">
                    Conflito / Desacato entre motoristas ou passageiros
                  </option>
                  <option value="Viatura com Avaria / Derrame de Combustível">
                    Viatura com Avaria no cais / Derrame de combustível
                  </option>
                  <option value="Operação Policial / Bloqueio de Via">
                    Operação Policial / Bloqueio ou congestionamento grave na via
                  </option>
                  <option value="Extravio de Bagagem ou Pertences">
                    Extravio de Bagagem ou pertences de passageiro
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-primary block mb-1">
                    Viatura ou Alvo:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: LD-00-00-XX"
                    value={novaOcorrenciaViatura}
                    onChange={(e) => setNovaOcorrenciaViatura(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-surface-container bg-surface-container-low text-xs text-primary font-mono font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-primary block mb-1">
                    Nível de Gravidade:
                  </label>
                  <select
                    value={novaOcorrenciaGravidade}
                    onChange={(e) => setNovaOcorrenciaGravidade(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-surface-container bg-surface-container-low text-xs text-primary font-bold focus:outline-none"
                  >
                    <option value="Baixa">Baixa (Advertência verbal)</option>
                    <option value="Média">Média (Ajuste no local)</option>
                    <option value="Alta">Alta (Suspensão temporária)</option>
                    <option value="Crítica">Crítica (Intervenção Policial / ANATA)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-primary block mb-1">
                  Descrição Circunstanciada dos Factos:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Indique local exato, pessoas envolvidas, horários e testemunhas..."
                  value={novaOcorrenciaDescricao}
                  onChange={(e) => setNovaOcorrenciaDescricao(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-surface-container bg-surface-container-low text-xs text-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-primary block mb-1">
                  Medida / Providência Adotada pelo Fiscal:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Passageiro excedente desembarcado; devolução de dinheiro cobrado a mais."
                  value={novaOcorrenciaAcao}
                  onChange={(e) => setNovaOcorrenciaAcao(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-surface-container bg-surface-container-low text-xs text-primary focus:outline-none"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-[11px] flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">shield</span>
                <span>
                  O auto será associado ao Fiscal <strong>{activeFiscal.nome}</strong> (ID: {activeFiscal.identificacaoFuncional}).
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-xs active:scale-95 transition-transform flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[17px]">send</span>
                <span>Lavrar Auto de Ocorrência & Transmitir à Central</span>
              </button>
            </form>
          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* ABA 5: REGISTO & AUDITORIA DE AÇÕES (QUEM FEZ O QUÊ)      */}
        {/* --------------------------------------------------------- */}
        {activeFiscalTab === 'auditoria' && (
          <div className="space-y-4">
            <div className="bg-surface-container-lowest p-4 rounded-2xl border border-surface-container shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">history_edu</span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-primary">Registo Oficial de Auditoria do Fiscal</h3>
                    <p className="text-[10px] text-on-surface-variant">
                      Rastreabilidade completa: quem realizou cada validação, correcção ou ocorrência
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-secondary-container/40 text-secondary">
                  {filteredLogs.length} Registos
                </span>
              </div>

              {/* Filtros de Categoria */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-2 scrollbar-none text-[11px]">
                <button
                  onClick={() => setLogFilter('todos')}
                  className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-colors cursor-pointer ${
                    logFilter === 'todos'
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-primary'
                  }`}
                >
                  Todos ({auditLogs.length})
                </button>
                <button
                  onClick={() => setLogFilter('validacao_presencial')}
                  className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-colors cursor-pointer ${
                    logFilter === 'validacao_presencial'
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-primary'
                  }`}
                >
                  Vistorias
                </button>
                <button
                  onClick={() => setLogFilter('correcao_fila')}
                  className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-colors cursor-pointer ${
                    logFilter === 'correcao_fila'
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-primary'
                  }`}
                >
                  Correcções de Fila
                </button>
                <button
                  onClick={() => setLogFilter('ocorrencia')}
                  className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-colors cursor-pointer ${
                    logFilter === 'ocorrencia'
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-primary'
                  }`}
                >
                  Ocorrências
                </button>
                <button
                  onClick={() => setLogFilter('despacho_viatura')}
                  className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-colors cursor-pointer ${
                    logFilter === 'despacho_viatura'
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-primary'
                  }`}
                >
                  Despachos
                </button>
              </div>
            </div>

            {/* Lista dos Logs de Auditoria */}
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-surface-container-lowest p-3.5 rounded-2xl border border-surface-container shadow-xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[18px] text-primary">
                          {log.icone}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-primary leading-tight">
                          {log.titulo}
                        </h4>
                        <span className="text-[10px] text-on-surface-variant block mt-0.5">
                          {log.timestamp} • {log.praca} ({log.baia})
                        </span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${log.corTag}`}>
                      {log.resultado}
                    </span>
                  </div>

                  <p className="text-[11px] text-on-surface leading-snug pl-10">
                    {log.descricao}
                  </p>

                  {log.alvo && (
                    <div className="ml-10 p-2 rounded-lg bg-surface-container-low text-[10px] font-mono text-primary flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px] text-secondary">
                        directions_car
                      </span>
                      <span>Alvo: {log.alvo}</span>
                    </div>
                  )}

                  {/* Carimbo de Auditoria: Fiscal Responsável */}
                  <div className="ml-10 pt-2 border-t border-surface-container/60 flex items-center justify-between text-[10px]">
                    <span className="text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px] text-emerald-600">
                        verified_user
                      </span>
                      Registado e Carimbado por:
                    </span>
                    <div className="text-right">
                      <strong className="text-primary">{log.fiscalNome}</strong>
                      <span className="text-on-surface-variant font-mono ml-1">
                        ({log.fiscalIdentificacao})
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Botão de Exportação / Relatório de Turno */}
            <div className="pt-2">
              <button
                onClick={() => {
                  triggerVibrate();
                  onTriggerNotice(
                    'Relatório de Turno Gerado!',
                    `Relatório operacional da ${activeFiscal.pracaAtribuidaNome} exportado com ${auditLogs.length} atos fiscalizados pelo Fiscal ${activeFiscal.nome}. Documento pronto para envio à ANATA e GPL.`,
                    'download_done'
                  );
                }}
                className="w-full py-2.5 bg-surface-container-low hover:bg-surface-container text-primary font-bold text-xs rounded-xl border border-surface-container flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-[18px]">print</span>
                <span>Exportar Relatório de Turno Oficial (PDF / ANATA)</span>
              </button>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* ABA 6: CONTA, CREDENCIAL & PERMISSÕES DO FISCAL          */}
        {/* --------------------------------------------------------- */}
        {activeFiscalTab === 'conta' && (
          <div className="space-y-4">
            {/* Carteira Funcional Digital Oficial */}
            <div className="bg-gradient-to-br from-primary via-primary/95 to-slate-900 text-on-primary p-4 rounded-2xl shadow-md space-y-3 relative overflow-hidden border border-secondary-container/40">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <span className="material-symbols-outlined text-[110px]">shield</span>
              </div>

              <div className="flex items-center justify-between border-b border-white/15 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-secondary-container text-on-secondary-fixed flex items-center justify-center font-black">
                    <span className="material-symbols-outlined text-[20px]">badge</span>
                  </div>
                  <div>
                    <span className="text-[10px] tracking-wider text-secondary-container font-black uppercase block">
                      REPÚBLICA DE ANGOLA
                    </span>
                    <h3 className="text-xs font-bold leading-tight">
                      Credencial Oficial de Fiscal de Praça
                    </h3>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
                  {activeFiscal.id}
                </span>
              </div>

              <div className="flex items-center gap-3.5 pt-1">
                <img
                  src={activeFiscal.fotoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
                  alt={activeFiscal.nome}
                  className="w-16 h-16 rounded-xl object-cover border-2 border-secondary-container shrink-0 shadow-md"
                />
                <div className="min-w-0 flex-1 space-y-0.5">
                  <h4 className="text-sm font-bold text-white truncate">{activeFiscal.nome}</h4>
                  <div className="text-[11px] text-surface-container-high font-mono">
                    ID Funcional: <strong className="text-secondary-container">{activeFiscal.identificacaoFuncional}</strong>
                  </div>
                  <div className="text-[11px] text-surface-container-high truncate">
                    Contacto: {activeFiscal.contacto}
                  </div>
                  <div className="text-[11px] text-surface-container-high">
                    Praça: <strong className="text-white">{activeFiscal.pracaAtribuidaNome}</strong>
                  </div>
                </div>
              </div>

              <div className="p-2 rounded-xl bg-white/10 text-[10px] space-y-1 border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-surface-container-high">Autorizado e Homologado por:</span>
                  <span className="font-bold text-secondary-container truncate ml-1">{activeFiscal.autorizadoPor}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-surface-container-high">Data de Homologação:</span>
                  <span className="font-mono text-white">{activeFiscal.dataAutorizacao}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-surface-container-high">Área de Trabalho:</span>
                  <span className="text-white truncate ml-1">{activeFiscal.areaTrabalho}</span>
                </div>
              </div>
            </div>

            {/* Permissões Operacionais Outorgadas */}
            <div className="bg-surface-container-lowest p-4 rounded-2xl border border-surface-container shadow-xs space-y-2.5">
              <h4 className="text-xs font-bold text-primary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[17px] text-secondary">
                  admin_panel_settings
                </span>
                Permissões Operacionais Outorgadas pela Administração:
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-xl bg-surface-container-low">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-emerald-700">verified</span>
                    <div>
                      <strong className="block text-primary">Validação Presencial e Vistoria</strong>
                      <span className="text-[10px] text-on-surface-variant block">Homologação de documentos e estado da viatura</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${activeFiscal.permissoes.validacaoPresencial ? 'bg-emerald-100 text-emerald-800' : 'bg-surface-container text-on-surface-variant'}`}>
                    {activeFiscal.permissoes.validacaoPresencial ? 'Ativa' : 'Inativa'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-surface-container-low">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-emerald-700">local_shipping</span>
                    <div>
                      <strong className="block text-primary">Gestão de Baias & Despacho</strong>
                      <span className="text-[10px] text-on-surface-variant block">Chamada de carrinhas e autorização de partida</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${activeFiscal.permissoes.gestaoBaia ? 'bg-emerald-100 text-emerald-800' : 'bg-surface-container text-on-surface-variant'}`}>
                    {activeFiscal.permissoes.gestaoBaia ? 'Ativa' : 'Inativa'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-surface-container-low">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-emerald-700">published_with_changes</span>
                    <div>
                      <strong className="block text-primary">Correcções de Fila</strong>
                      <span className="text-[10px] text-on-surface-variant block">Reordenamento com justificativa obrigatória</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${activeFiscal.permissoes.correcoesFila ? 'bg-emerald-100 text-emerald-800' : 'bg-surface-container text-on-surface-variant'}`}>
                    {activeFiscal.permissoes.correcoesFila ? 'Ativa' : 'Inativa'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-surface-container-low">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-emerald-700">report_problem</span>
                    <div>
                      <strong className="block text-primary">Registo de Ocorrências</strong>
                      <span className="text-[10px] text-on-surface-variant block">Lavratura de incidentes e infrações</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${activeFiscal.permissoes.registoOcorrencias ? 'bg-emerald-100 text-emerald-800' : 'bg-surface-container text-on-surface-variant'}`}>
                    {activeFiscal.permissoes.registoOcorrencias ? 'Ativa' : 'Inativa'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-surface-container-low">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-emerald-700">payments</span>
                    <div>
                      <strong className="block text-primary">Fiscalização de Tarifas</strong>
                      <span className="text-[10px] text-on-surface-variant block">Controle da tarifa oficial de 500 Kz e taxas</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${activeFiscal.permissoes.conferenciaTaxas ? 'bg-emerald-100 text-emerald-800' : 'bg-surface-container text-on-surface-variant'}`}>
                    {activeFiscal.permissoes.conferenciaTaxas ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
              </div>
            </div>

            {/* Alternar Fiscal Autorizado / Iniciar Sessão com Outro Fiscal */}
            <div className="bg-surface-container-lowest p-4 rounded-2xl border border-surface-container shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-primary">Fiscais Credenciados pela Administração</h4>
                  <p className="text-[10px] text-on-surface-variant">
                    Contas autorizadas com credenciais activas
                  </p>
                </div>
                <button
                  onClick={() => setShowNovoFiscalModal(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-primary text-on-primary font-bold text-[11px] flex items-center gap-1 active:scale-95 transition-transform cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">person_add</span>
                  <span>Novo Fiscal</span>
                </button>
              </div>

              <div className="space-y-2">
                {fiscais.map((f) => (
                  <div
                    key={f.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                      f.id === activeFiscal.id
                        ? 'bg-secondary-container/20 border-secondary'
                        : 'bg-surface-container-low border-surface-container'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={f.fotoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
                        alt={f.nome}
                        className="w-9 h-9 rounded-lg object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <strong className="text-xs text-primary block truncate">{f.nome}</strong>
                        <span className="text-[10px] text-on-surface-variant font-mono block">
                          {f.identificacaoFuncional} • {f.pracaAtribuidaNome}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      {f.id === activeFiscal.id ? (
                        <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          Em Turno
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            triggerVibrate();
                            setActiveFiscalId(f.id);
                            onTriggerNotice(
                              'Sessão Iniciada com Sucesso!',
                              `Sessão operacional iniciada pelo Fiscal ${f.nome} (${f.identificacaoFuncional}) na Praça ${f.pracaAtribuidaNome}.`,
                              'badge'
                            );
                          }}
                          className="px-2.5 py-1 bg-surface-container-highest hover:bg-primary hover:text-white text-primary text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Entrar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alternar Nível Rápido */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                onClick={() => {
                  triggerVibrate();
                  onSwitchToPassenger();
                }}
                className="py-2.5 bg-surface-container-low text-primary font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">person</span>
                <span>Passageiro</span>
              </button>
              <button
                onClick={() => {
                  triggerVibrate();
                  onSwitchToDriver();
                }}
                className="py-2.5 bg-surface-container-low text-primary font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] text-secondary">local_taxi</span>
                <span>Motorista</span>
              </button>
              <button
                onClick={() => {
                  triggerVibrate();
                  onSwitchToAdmin();
                }}
                className="py-2.5 bg-secondary-container text-on-secondary-fixed font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                <span>Administração</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL: CRIAR OU SOLICITAR CONTA DE FISCAL                 */}
      {/* ========================================================= */}
      {showNovoFiscalModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-primary/70 backdrop-blur-sm p-3">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl p-4 shadow-2xl space-y-3 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">badge</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-primary">Registo e Credenciamento de Fiscal</h3>
                  <p className="text-[10px] text-on-surface-variant">
                    Conta criada ou autorizada pela Administração Central
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNovoFiscalModal(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCriarNovoFiscal} className="space-y-2.5 text-xs">
              <div>
                <label className="font-bold text-primary block mb-0.5">Nome Completo:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Domingos Baptista"
                  value={novoFiscalNome}
                  onChange={(e) => setNovoFiscalNome(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-surface-container bg-surface-container-low text-xs text-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-primary block mb-0.5">Telefone / Contacto:</label>
                  <input
                    type="text"
                    required
                    placeholder="+244 9XX XXX XXX"
                    value={novoFiscalContacto}
                    onChange={(e) => setNovoFiscalContacto(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-surface-container bg-surface-container-low text-xs text-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-primary block mb-0.5">Identificação Funcional:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: ANATA-FIS-104/LU"
                    value={novoFiscalIdFuncional}
                    onChange={(e) => setNovoFiscalIdFuncional(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-surface-container bg-surface-container-low text-xs text-primary font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-primary block mb-0.5">Praça ou Área de Trabalho Atribuída:</label>
                <select
                  value={novoFiscalPracaId}
                  onChange={(e) => setNovoFiscalPracaId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-surface-container bg-surface-container-low text-xs text-primary font-bold focus:outline-none"
                >
                  {LUANDA_PRACAS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.corridor})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-primary block mb-0.5">Nome de Utilizador / Tel:</label>
                  <input
                    type="text"
                    placeholder="Ex: fiscal.carlos"
                    value={novoFiscalUsername}
                    onChange={(e) => setNovoFiscalUsername(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-surface-container bg-surface-container-low text-xs text-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-primary block mb-0.5">PIN de Acesso:</label>
                  <input
                    type="password"
                    maxLength={6}
                    value={novoFiscalPin}
                    onChange={(e) => setNovoFiscalPin(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-surface-container bg-surface-container-low text-xs text-primary font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-primary block mb-1">Permissões Operacionais a Atribuir:</label>
                <div className="space-y-1 p-2.5 rounded-xl bg-surface-container-low border border-surface-container">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={novoFiscalPermissoes.validacaoPresencial}
                      onChange={(e) =>
                        setNovoFiscalPermissoes({
                          ...novoFiscalPermissoes,
                          validacaoPresencial: e.target.checked,
                        })
                      }
                      className="rounded text-primary"
                    />
                    <span>Validação presencial e vistoria técnica</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={novoFiscalPermissoes.gestaoBaia}
                      onChange={(e) =>
                        setNovoFiscalPermissoes({
                          ...novoFiscalPermissoes,
                          gestaoBaia: e.target.checked,
                        })
                      }
                      className="rounded text-primary"
                    />
                    <span>Gestão de baias e chamada/despacho de carrinhas</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={novoFiscalPermissoes.registoOcorrencias}
                      onChange={(e) =>
                        setNovoFiscalPermissoes({
                          ...novoFiscalPermissoes,
                          registoOcorrencias: e.target.checked,
                        })
                      }
                      className="rounded text-primary"
                    />
                    <span>Registo de ocorrências de praça e incidentes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={novoFiscalPermissoes.correcoesFila}
                      onChange={(e) =>
                        setNovoFiscalPermissoes({
                          ...novoFiscalPermissoes,
                          correcoesFila: e.target.checked,
                        })
                      }
                      className="rounded text-primary"
                    />
                    <span>Registo de correcções e ajustes na fila</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={novoFiscalPermissoes.conferenciaTaxas}
                      onChange={(e) =>
                        setNovoFiscalPermissoes({
                          ...novoFiscalPermissoes,
                          conferenciaTaxas: e.target.checked,
                        })
                      }
                      className="rounded text-primary"
                    />
                    <span>Conferência de tarifas (500 Kz) e taxas sindicais</span>
                  </label>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl shadow-xs active:scale-95 transition-transform flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[17px]">verified</span>
                  <span>Autorizar & Credenciar Fiscal na Administração</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
