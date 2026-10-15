import React, { useState, useMemo } from 'react';
import {
  PassengerRecord,
  DriverRecord,
  VehicleRecord,
  FiscalRecord,
  PracaRecord,
  RouteRecord,
  QueueItemRecord,
  QueueInterventionRecord,
  TripRecordAdmin,
  PaymentRecord,
  IncidentRecord,
  AdminTab,
} from '../types/ecosystem';
import { exportToExcel, exportToPDF } from '../utils/reportExporter';
import { DOC_CARTA_SVG, DOC_LIVRETE_SVG, DOC_BI_SVG } from '../data/ecosystemData';

const DEFAULT_TAXI_IMAGE = '/src/assets/images/angola_taxi_hiace_1791809024746.jpg';
const DEFAULT_DRIVER_PHOTO =
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80';

interface AdminAreaProps {
  passengers: PassengerRecord[];
  setPassengers: React.Dispatch<React.SetStateAction<PassengerRecord[]>>;
  drivers: DriverRecord[];
  setDrivers: React.Dispatch<React.SetStateAction<DriverRecord[]>>;
  vehicles: VehicleRecord[];
  setVehicles: React.Dispatch<React.SetStateAction<VehicleRecord[]>>;
  fiscais: FiscalRecord[];
  setFiscais: React.Dispatch<React.SetStateAction<FiscalRecord[]>>;
  pracas: PracaRecord[];
  setPracas: React.Dispatch<React.SetStateAction<PracaRecord[]>>;
  routes: RouteRecord[];
  setRoutes: React.Dispatch<React.SetStateAction<RouteRecord[]>>;
  queues: QueueItemRecord[];
  setQueues: React.Dispatch<React.SetStateAction<QueueItemRecord[]>>;
  interventions: QueueInterventionRecord[];
  setInterventions: React.Dispatch<React.SetStateAction<QueueInterventionRecord[]>>;
  trips: TripRecordAdmin[];
  setTrips: React.Dispatch<React.SetStateAction<TripRecordAdmin[]>>;
  payments: PaymentRecord[];
  setPayments: React.Dispatch<React.SetStateAction<PaymentRecord[]>>;
  incidents: IncidentRecord[];
  setIncidents: React.Dispatch<React.SetStateAction<IncidentRecord[]>>;
  onTriggerNotice: (title: string, message: string, icon?: string) => void;
  triggerVibrate: () => void;
  onSwitchToPassenger: () => void;
  onSwitchToDriver: () => void;
  onSwitchToInspector: () => void;
}

export function AdminArea({
  passengers,
  setPassengers,
  drivers,
  setDrivers,
  vehicles,
  setVehicles,
  fiscais,
  setFiscais,
  pracas,
  setPracas,
  routes,
  setRoutes,
  queues,
  setQueues,
  interventions,
  setInterventions,
  trips,
  setPayments,
  payments,
  incidents,
  setIncidents,
  onTriggerNotice,
  triggerVibrate,
  onSwitchToPassenger,
  onSwitchToDriver,
  onSwitchToInspector,
}: AdminAreaProps) {
  // Sub-abas Administrativas
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('dashboard');

  // Modais de Operação
  const [selectedDriverDocs, setSelectedDriverDocs] = useState<DriverRecord | null>(null);
  const [zoomedDoc, setZoomedDoc] = useState<{ title: string; url: string; isPdf?: boolean } | null>(null);

  const resolveDocUrl = (docValue: string | undefined, defaultSvg: string): { url: string; isPdf: boolean } => {
    if (!docValue || docValue === 'Enviado' || docValue.trim() === '') {
      return { url: defaultSvg, isPdf: false };
    }
    const isPdf = docValue.startsWith('data:application/pdf') || docValue.toLowerCase().endsWith('.pdf');
    return { url: docValue, isPdf };
  };

  const [newFiscalModalOpen, setNewFiscalModalOpen] = useState(false);
  const [newPracaModalOpen, setNewPracaModalOpen] = useState(false);
  const [newRouteModalOpen, setNewRouteModalOpen] = useState(false);
  const [interventionModalQueueItem, setInterventionModalQueueItem] = useState<QueueItemRecord | null>(null);
  const [interventionJustification, setInterventionJustification] = useState('');
  const [interventionType, setInterventionType] = useState<
    'Reordenar Fila' | 'Prioridade Mecânica' | 'Retirar por Ausência' | 'Chamada de Urgência' | 'Despacho Cautelar'
  >('Prioridade Mecânica');

  // Modal de Verificação de Pagamento Digital
  const [verifyingPayment, setVerifyingPayment] = useState<PaymentRecord | null>(null);
  const [isVerifyingWithProvider, setIsVerifyingWithProvider] = useState(false);

  // Filtros internos
  const [userSubTab, setUserSubTab] = useState<'motoristas' | 'passageiros' | 'viaturas' | 'fiscais' | 'permissoes'>('motoristas');
  const [driverFilterStatus, setDriverFilterStatus] = useState<string>('todos');
  const [selectedQueuePracaId, setSelectedQueuePracaId] = useState<string>(pracas[0]?.id || 'kilamba');
  const [tripFilterState, setTripFilterState] = useState<string>('todas');
  const [paymentFilterMethod, setPaymentFilterMethod] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Formulário de Novo Fiscal (Legado / Rápido)
  const [newFiscalForm, setNewFiscalForm] = useState({
    nome: '',
    contacto: '+244 ',
    identificacaoFuncional: 'ANATA-FIS-',
    associacao: 'ANATA' as 'ANATA' | 'ATL' | 'GPL',
    pracaAtribuidaId: pracas[0]?.id || 'kilamba',
    areaTrabalho: 'Baia 01 / Cais de Embarque',
    turno: 'Manhã (05:30 - 13:30)' as 'Manhã (05:30 - 13:30)' | 'Tarde (13:30 - 21:30)' | 'Integral',
  });

  // Gestão de Fiscais Avançada (Módulo Completo com Audit Log e Credenciais)
  const [fiscalModalMode, setFiscalModalMode] = useState<'create' | 'edit' | 'details' | null>(null);
  const [selectedFiscalForMgmt, setSelectedFiscalForMgmt] = useState<FiscalRecord | null>(null);
  const [fiscalMgmtForm, setFiscalMgmtForm] = useState({
    nome: '',
    contacto: '+244 ',
    numeroFuncionario: 'F-0' + (fiscais.length + 1),
    identificacaoFuncional: 'ANATA-FIS-00' + (fiscais.length + 1) + '/LU',
    associacao: 'ANATA' as 'ANATA' | 'ATL' | 'GPL',
    pracasAtribuidas: [pracas[0]?.id || 'saopaulo'],
    areaTrabalho: 'Baia Principal / Terminal',
    turno: 'Manhã (05:30 - 13:30)' as 'Manhã (05:30 - 13:30)' | 'Tarde (13:30 - 21:30)' | 'Noite (21:30 - 05:30)' | 'Integral',
    senha: 'secure_password_123',
    biNumero: '',
    fotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    biFotoFrente: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&auto=format&fit=crop&q=80',
    biFotoVerso: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80',
    permissoes: {
      validacaoPresencial: true,
      gestaoBaia: true,
      registoOcorrencias: true,
      correcoesFila: true,
      conferenciaTaxas: true,
    },
  });

  const [fiscalFileNames, setFiscalFileNames] = useState<{
    foto: string | null;
    biFrente: string | null;
    biVerso: string | null;
  }>({
    foto: null,
    biFrente: null,
    biVerso: null,
  });

  const handleFiscalManualFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    docType: 'foto' | 'biFrente' | 'biVerso'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    triggerVibrate();
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (docType === 'foto') {
        setFiscalMgmtForm((prev) => ({ ...prev, fotoUrl: result }));
        setFiscalFileNames((prev) => ({ ...prev, foto: file.name }));
        onTriggerNotice('Fotografia Anexada', `Fotografia ${file.name} anexada de forma manual.`, 'add_a_photo');
      } else if (docType === 'biFrente') {
        setFiscalMgmtForm((prev) => ({ ...prev, biFotoFrente: result }));
        setFiscalFileNames((prev) => ({ ...prev, biFrente: file.name }));
        onTriggerNotice('B.I. Frente Anexado', `Documento ${file.name} anexado de forma manual.`, 'badge');
      } else if (docType === 'biVerso') {
        setFiscalMgmtForm((prev) => ({ ...prev, biFotoVerso: result }));
        setFiscalFileNames((prev) => ({ ...prev, biVerso: file.name }));
        onTriggerNotice('B.I. Verso Anexado', `Documento ${file.name} anexado de forma manual.`, 'badge');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleOpenCreateFiscal = () => {
    triggerVibrate();
    setFiscalMgmtForm({
      nome: '',
      contacto: '+244 ',
      numeroFuncionario: 'F-0' + (fiscais.length + 1),
      identificacaoFuncional: 'ANATA-FIS-00' + (fiscais.length + 1) + '/LU',
      associacao: 'ANATA',
      pracasAtribuidas: [pracas[0]?.id || 'saopaulo'],
      areaTrabalho: 'Baia Principal / Terminal',
      turno: 'Manhã (05:30 - 13:30)',
      senha: 'secure_password_123',
      biNumero: '',
      fotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      biFotoFrente: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&auto=format&fit=crop&q=80',
      biFotoVerso: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80',
      permissoes: {
        validacaoPresencial: true,
        gestaoBaia: true,
        registoOcorrencias: true,
        correcoesFila: true,
        conferenciaTaxas: true,
      },
    });
    setFiscalFileNames({ foto: null, biFrente: null, biVerso: null });
    setSelectedFiscalForMgmt(null);
    setFiscalModalMode('create');
  };

  const handleOpenEditFiscal = (f: FiscalRecord) => {
    triggerVibrate();
    setSelectedFiscalForMgmt(f);
    setFiscalMgmtForm({
      nome: f.nome,
      contacto: f.contacto,
      numeroFuncionario: f.numeroFuncionario || 'F-001',
      identificacaoFuncional: f.identificacaoFuncional,
      associacao: f.associacao,
      pracasAtribuidas: f.pracasAtribuidas || [f.pracaAtribuidaId],
      areaTrabalho: f.areaTrabalho,
      turno: f.turno,
      senha: '••••••••',
      biNumero: f.biNumero || '',
      fotoUrl: f.fotoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      biFotoFrente: f.biFotoFrente || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&auto=format&fit=crop&q=80',
      biFotoVerso: f.biFotoVerso || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80',
      permissoes: { ...f.permissoes },
    });
    setFiscalFileNames({
      foto: f.fotoUrl ? 'Fotografia existente' : null,
      biFrente: f.biFotoFrente ? 'B.I. Frente existente' : null,
      biVerso: f.biFotoVerso ? 'B.I. Verso existente' : null,
    });
    setFiscalModalMode('edit');
  };

  const handleSaveFiscalMgmt = (e: React.FormEvent) => {
    e.preventDefault();
    triggerVibrate();

    if (!fiscalMgmtForm.nome.trim() || !fiscalMgmtForm.contacto.trim()) {
      onTriggerNotice('Erro', 'Por favor preencha o nome e o contacto do fiscal.', 'error');
      return;
    }

    const agora = new Date().toLocaleString('pt-AO');
    const pracaPrimariaId = fiscalMgmtForm.pracasAtribuidas[0] || 'saopaulo';
    const pracaObj = pracas.find(p => p.id === pracaPrimariaId);
    const pracaNome = pracaObj ? pracaObj.name : 'Praça Principal';

    if (fiscalModalMode === 'create') {
      const newId = 'FISC-LU-' + Math.floor(100 + Math.random() * 900);
      const novoFiscal: FiscalRecord = {
        id: newId,
        nome: fiscalMgmtForm.nome,
        contacto: fiscalMgmtForm.contacto,
        numeroFuncionario: fiscalMgmtForm.numeroFuncionario,
        identificacaoFuncional: fiscalMgmtForm.identificacaoFuncional,
        associacao: fiscalMgmtForm.associacao,
        pracaAtribuidaId: pracaPrimariaId,
        pracaAtribuidaNome: pracaNome,
        pracasAtribuidas: fiscalMgmtForm.pracasAtribuidas,
        areaTrabalho: fiscalMgmtForm.areaTrabalho,
        turno: fiscalMgmtForm.turno,
        status: 'ativo',
        totalDespachosHoje: 0,
        dataAutorizacao: agora.split(',')[0],
        senhaHash: 'hash_' + Math.random().toString(36).substring(7),
        permissoes: { ...fiscalMgmtForm.permissoes },
        fotoUrl: fiscalMgmtForm.fotoUrl,
        biNumero: fiscalMgmtForm.biNumero,
        biFotoFrente: fiscalMgmtForm.biFotoFrente,
        biFotoVerso: fiscalMgmtForm.biFotoVerso,
        auditLog: [
          { id: 'aud-' + Date.now(), data: agora, acao: 'Conta criada e credenciais geradas pelo Administrador', autor: 'Admin GPL / ANATA' }
        ]
      };
      setFiscais(prev => [novoFiscal, ...prev]);
      onTriggerNotice('Fiscal Registado', `O fiscal ${novoFiscal.nome} foi criado com sucesso e associado a ${fiscalMgmtForm.pracasAtribuidas.length} praça(s).`, 'check_circle');
    } else if (fiscalModalMode === 'edit' && selectedFiscalForMgmt) {
      setFiscais(prev => prev.map(f => {
        if (f.id === selectedFiscalForMgmt.id) {
          const auditItem = { id: 'aud-' + Date.now(), data: agora, acao: 'Dados, praças ou permissões actualizadas pelo Administrador', autor: 'Admin GPL / ANATA' };
          return {
            ...f,
            nome: fiscalMgmtForm.nome,
            contacto: fiscalMgmtForm.contacto,
            numeroFuncionario: fiscalMgmtForm.numeroFuncionario,
            identificacaoFuncional: fiscalMgmtForm.identificacaoFuncional,
            associacao: fiscalMgmtForm.associacao,
            pracaAtribuidaId: pracaPrimariaId,
            pracaAtribuidaNome: pracaNome,
            pracasAtribuidas: fiscalMgmtForm.pracasAtribuidas,
            areaTrabalho: fiscalMgmtForm.areaTrabalho,
            turno: fiscalMgmtForm.turno,
            biNumero: fiscalMgmtForm.biNumero,
            fotoUrl: fiscalMgmtForm.fotoUrl,
            biFotoFrente: fiscalMgmtForm.biFotoFrente,
            biFotoVerso: fiscalMgmtForm.biFotoVerso,
            permissoes: { ...fiscalMgmtForm.permissoes },
            auditLog: [auditItem, ...(f.auditLog || [])]
          };
        }
        return f;
      }));
      onTriggerNotice('Fiscal Actualizado', `Os dados de ${fiscalMgmtForm.nome} foram actualizados com sucesso.`, 'check_circle');
    }

    setFiscalModalMode(null);
    setSelectedFiscalForMgmt(null);
  };

  const handleUpdateFiscalStatusMgmt = (fiscalId: string, novoStatus: 'ativo' | 'suspenso' | 'desativado') => {
    triggerVibrate();
    const agora = new Date().toLocaleString('pt-AO');
    const acaoTexto = novoStatus === 'ativo' ? 'Conta activada pelo Administrador' : novoStatus === 'suspenso' ? 'Conta suspensa (operações bloqueadas)' : 'Conta desactivada permanentemente';

    setFiscais(prev => prev.map(f => {
      if (f.id === fiscalId) {
        const auditItem = { id: 'aud-' + Date.now(), data: agora, acao: acaoTexto, autor: 'Admin GPL / ANATA' };
        return {
          ...f,
          status: novoStatus,
          auditLog: [auditItem, ...(f.auditLog || [])]
        };
      }
      return f;
    }));
    onTriggerNotice('Estado Alterado', `O estado do fiscal foi alterado para: ${novoStatus.toUpperCase()}. Operações protegidas sincronizadas.`, 'info');
  };


  // Formulário de Nova Praça com Taxa Oficial (Exclusivo Administrador)
  const [newPracaForm, setNewPracaForm] = useState({
    name: '',
    subtitle: '',
    municipio: 'Luanda',
    corridor: 'Avenida Deolinda Rodrigues',
    lat: -8.8383,
    lng: 13.2344,
    capacidadeTotal: 30,
    taxaKz: 300,
    nomeTaxa: '',
  });

  // Modal e Formulário Exclusivo do Administrador para Criar Nova Taxa de Transporte
  const [newTaxaModalOpen, setNewTaxaModalOpen] = useState(false);
  const [newTaxaForm, setNewTaxaForm] = useState({
    nomeTaxa: 'Praça Cacuaco 300kz',
    pracaId: pracas[0]?.id || 'cacuaco',
    taxaKz: 300,
    tipoTransporte: 'Carrinha 15L (Azul/Branco)' as
      | 'Carrinha 15L (Azul/Branco)'
      | 'Express Direto (15L)'
      | 'Autocarro Urbano (TCUL)'
      | 'Carro de Praça (4L)',
    baseLegal: 'Decreto Executivo GPL / ANATA 2026',
    aplicarATodasRotas: true,
  });

  // Modal Exclusivo do Administrador para Renomear e Ajustar a Taxa de Transporte
  const [editingTaxaModal, setEditingTaxaModal] = useState<{
    id: string;
    type: 'praca' | 'route';
    nomeAtual: string;
    taxaAtualKz: number;
    nomeTaxaAtual: string;
    nomePracaOuRota: string;
  } | null>(null);

  const [renameTaxaInput, setRenameTaxaInput] = useState('');
  const [renameTaxaValorKz, setRenameTaxaValorKz] = useState(300);
  const [renamePracaNomeInput, setRenamePracaNomeInput] = useState('');

  // Formulário de Nova Rota
  const [newRouteForm, setNewRouteForm] = useState({
    origemId: pracas[0]?.id || '',
    destinoNome: '',
    tipoTransporte: 'Carrinha 15L (Azul/Branco)' as
      | 'Carrinha 15L (Azul/Branco)'
      | 'Express Direto (15L)'
      | 'Autocarro Urbano (TCUL)'
      | 'Carro de Praça (4L)',
    tarifaKz: 500,
    distanciaKm: 18,
    tempoEstimadoMin: 35,
  });

  // ============================================================================
  // INDICADORES CENTRAIS (CALCULADOS COM DADOS REAIS DO ECOSSISTEMA)
  // ============================================================================
  const stats = useMemo(() => {
    const passageirosRegistados = passengers.length;
    const motoristasActivos = drivers.filter((d) => d.statusConta === 'aprovado').length;
    const motoristasPendentes = drivers.filter((d) => d.statusConta === 'pendente').length;
    const viaturasAprovadas = vehicles.filter((v) => v.status === 'Aprovada').length;
    const pracasActivas = pracas.filter((p) => p.status !== 'Em Obras').length;
    const rotasActivas = routes.filter((r) => r.status === 'ativa').length;
    const pedidosDoDia = trips.length + 8; // senhas virtuais e embarques
    const viagensEmCurso = trips.filter((t) => t.estado === 'ongoing').length;
    const viagensConcluidas = trips.filter((t) => t.estado === 'completed').length;
    const cancelamentos = trips.filter((t) => t.estado === 'cancelled').length;
    const pagamentosConfirmadosKz = payments
      .filter((p) => p.estado === 'Confirmado')
      .reduce((acc, p) => acc + p.valorKz, 0);
    const ocorrenciasPendentes = incidents.filter((i) => i.status !== 'Resolvido').length;

    return {
      passageirosRegistados,
      motoristasActivos,
      motoristasPendentes,
      viaturasAprovadas,
      pracasActivas,
      rotasActivas,
      pedidosDoDia,
      viagensEmCurso,
      viagensConcluidas,
      cancelamentos,
      pagamentosConfirmadosKz,
      ocorrenciasPendentes,
    };
  }, [passengers, drivers, vehicles, pracas, routes, trips, payments, incidents]);

  // ============================================================================
  // AÇÕES SOBRE MOTORISTAS & VIATURAS
  // ============================================================================
  const handleApproveDriver = (driverId: string) => {
    triggerVibrate();
    setDrivers((prev) =>
      prev.map((d) =>
        d.id === driverId
          ? {
              ...d,
              statusConta: 'aprovado',
              viaturaAprovada: true,
              dataAprovacao: new Date().toLocaleDateString('pt-AO'),
            }
          : d
      )
    );
    // Também aprova a viatura correspondente
    const targetDriver = drivers.find((d) => d.id === driverId);
    if (targetDriver) {
      setVehicles((prev) =>
        prev.map((v) =>
          v.matricula === targetDriver.matricula ? { ...v, status: 'Aprovada' } : v
        )
      );
      onTriggerNotice(
        'Motorista Homologado',
        `A conta de ${targetDriver.nomeCompleto} (${targetDriver.matricula}) foi homologada com sucesso. O motorista agora pode operar e entrar na fila oficial.`,
        'verified'
      );
    }
  };

  const handleRejectDriver = (driverId: string) => {
    triggerVibrate();
    const targetDriver = drivers.find((d) => d.id === driverId);
    setDrivers((prev) =>
      prev.map((d) =>
        d.id === driverId
          ? {
              ...d,
              statusConta: 'rejeitado',
              motivoRejeicao: 'Documentação inconforme com o regulamento do GPL/ANATA.',
            }
          : d
      )
    );
    if (targetDriver) {
      onTriggerNotice(
        'Registo Rejeitado',
        `A candidatura de ${targetDriver.nomeCompleto} foi rejeitada por inconformidade documental. Notificação enviada.`,
        'error'
      );
    }
  };

  const handleToggleSuspendDriver = (driverId: string) => {
    triggerVibrate();
    setDrivers((prev) =>
      prev.map((d) => {
        if (d.id === driverId) {
          const isSuspended = d.statusConta === 'suspenso';
          const newStatus = isSuspended ? 'aprovado' : 'suspenso';
          onTriggerNotice(
            isSuspended ? 'Conta Reactivada' : 'Conta Suspensa',
            `O motorista ${d.nomeCompleto} foi ${isSuspended ? 'reactivado' : 'suspenso pelo administrador'}.`,
            isSuspended ? 'check_circle' : 'block'
          );
          return {
            ...d,
            statusConta: newStatus,
            motivoSuspensao: isSuspended ? undefined : 'Suspensão cautelar administrativa.',
          };
        }
        return d;
      })
    );
  };

  const handleToggleVehicleApproval = (matricula: string) => {
    triggerVibrate();
    setVehicles((prev) =>
      prev.map((v) => {
        if (v.matricula === matricula) {
          const isApproved = v.status === 'Aprovada';
          const newStatus = isApproved ? 'Bloqueada' : 'Aprovada';
          onTriggerNotice(
            isApproved ? 'Viatura Bloqueada' : 'Viatura Aprovada',
            `A viatura ${v.matricula} (${v.modelo}) foi marcada como ${newStatus}.`,
            isApproved ? 'car_crash' : 'verified'
          );
          return { ...v, status: newStatus };
        }
        return v;
      })
    );
  };

  // ============================================================================
  // AÇÕES SOBRE PASSAGEIROS
  // ============================================================================
  const handleToggleSuspendPassenger = (passId: string) => {
    triggerVibrate();
    setPassengers((prev) =>
      prev.map((p) => {
        if (p.id === passId) {
          const isSuspended = p.status === 'suspenso';
          onTriggerNotice(
            isSuspended ? 'Passageiro Reactivado' : 'Passageiro Suspenso',
            `A conta do passageiro ${p.nome} está agora ${isSuspended ? 'ativa' : 'suspensa'}.`,
            isSuspended ? 'check_circle' : 'person_off'
          );
          return {
            ...p,
            status: isSuspended ? 'ativo' : 'suspenso',
            motivoSuspensao: isSuspended ? undefined : 'Suspensão administrativa por conduta imprópria.',
          };
        }
        return p;
      })
    );
  };

  // ============================================================================
  // CRIAÇÃO E GESTÃO DE FISCAIS
  // ============================================================================
  const handleCreateFiscal = (e: React.FormEvent) => {
    e.preventDefault();
    triggerVibrate();
    if (!newFiscalForm.nome.trim()) {
      onTriggerNotice('Erro', 'Por favor indique o nome completo do Fiscal.', 'warning');
      return;
    }
    const targetPraca = pracas.find((p) => p.id === newFiscalForm.pracaAtribuidaId) || pracas[0];
    const newId = `FISC-LU-${Math.floor(100 + Math.random() * 900)}`;
    const newRecord: FiscalRecord = {
      id: newId,
      nome: newFiscalForm.nome,
      contacto: newFiscalForm.contacto,
      numeroFuncionario: 'F-' + Math.floor(100 + Math.random() * 900),
      identificacaoFuncional: newFiscalForm.identificacaoFuncional || `${newFiscalForm.associacao}-FIS-${newId}/LU`,
      associacao: newFiscalForm.associacao,
      pracaAtribuidaId: targetPraca.id,
      pracaAtribuidaNome: targetPraca.name,
      pracasAtribuidas: [targetPraca.id],
      areaTrabalho: newFiscalForm.areaTrabalho,
      turno: newFiscalForm.turno,
      status: 'ativo',
      totalDespachosHoje: 0,
      dataAutorizacao: new Date().toLocaleDateString('pt-AO'),
      senhaHash: 'hash_' + Math.random().toString(36).substring(7),
      permissoes: {
        validacaoPresencial: true,
        gestaoBaia: true,
        registoOcorrencias: true,
        correcoesFila: true,
        conferenciaTaxas: true,
      },
      fotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      auditLog: [
        { id: 'aud-' + Date.now(), data: new Date().toLocaleString('pt-AO'), acao: 'Conta criada via painel administrativo', autor: 'Admin GPL / ANATA' }
      ]
    };

    setFiscais((prev) => [newRecord, ...prev]);
    // Atualiza a praça associando o fiscal
    setPracas((prev) =>
      prev.map((p) =>
        p.id === targetPraca.id
          ? { ...p, fiscaisAtribuidos: Array.from(new Set([...p.fiscaisAtribuidos, newRecord.nome])) }
          : p
      )
    );

    setNewFiscalModalOpen(false);
    setNewFiscalForm({
      nome: '',
      contacto: '+244 ',
      identificacaoFuncional: 'ANATA-FIS-',
      associacao: 'ANATA',
      pracaAtribuidaId: pracas[0]?.id || 'kilamba',
      areaTrabalho: 'Baia 01 / Cais de Embarque',
      turno: 'Manhã (05:30 - 13:30)',
    });
    onTriggerNotice(
      'Fiscal Credenciado',
      `O Fiscal ${newRecord.nome} foi credenciado e associado à ${targetPraca.name}. As credenciais móveis foram ativadas no posto do fiscal.`,
      'badge'
    );
  };

  // ============================================================================
  // CRIAÇÃO E GESTÃO DE PRAÇAS & ROTAS
  // ============================================================================
  const handleCreatePraca = (e: React.FormEvent) => {
    e.preventDefault();
    triggerVibrate();
    if (!newPracaForm.name.trim()) return;

    const id = newPracaForm.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const newPraca: PracaRecord = {
      id: id || `praca-${Date.now()}`,
      name: newPracaForm.name,
      subtitle: newPracaForm.subtitle || 'Terminal e Baia Oficial',
      lat: Number(newPracaForm.lat) || -8.8383,
      lng: Number(newPracaForm.lng) || 13.2344,
      municipio: newPracaForm.municipio,
      corridor: newPracaForm.corridor,
      naFila: 0,
      noCais: 0,
      capacidadeTotal: Number(newPracaForm.capacidadeTotal) || 25,
      minEspera: '5-10',
      status: 'Operacional',
      destinations: ['Mutamba', 'São Paulo'],
      fiscaisAtribuidos: [],
    };

    setPracas((prev) => [...prev, newPraca]);
    setNewPracaModalOpen(false);
    onTriggerNotice(
      'Praça Criada',
      `A nova praça ${newPraca.name} foi registada com sucesso no sistema e agora está visível para motoristas e passageiros.`,
      'add_location_alt'
    );
  };

  const handleCreateRoute = (e: React.FormEvent) => {
    e.preventDefault();
    triggerVibrate();
    const origemPraca = pracas.find((p) => p.id === newRouteForm.origemId) || pracas[0];
    if (!origemPraca || !newRouteForm.destinoNome.trim()) return;

    const newRoute: RouteRecord = {
      id: `rot-${Date.now().toString().slice(-4)}`,
      nome: `${origemPraca.name} ⇄ ${newRouteForm.destinoNome}`,
      origemId: origemPraca.id,
      origemNome: origemPraca.name,
      destinoId: newRouteForm.destinoNome.toLowerCase().replace(/\s+/g, '-'),
      destinoNome: newRouteForm.destinoNome,
      tipoTransporte: newRouteForm.tipoTransporte,
      tarifaKz: Number(newRouteForm.tarifaKz) || 500,
      distanciaKm: Number(newRouteForm.distanciaKm) || 15,
      tempoEstimadoMin: Number(newRouteForm.tempoEstimadoMin) || 30,
      status: 'ativa',
      fiscaisSupervisores: origemPraca.fiscaisAtribuidos,
    };

    setRoutes((prev) => [newRoute, ...prev]);
    // Adiciona o destino à praça se não existir
    setPracas((prev) =>
      prev.map((p) =>
        p.id === origemPraca.id && !p.destinations.includes(newRoute.destinoNome)
          ? { ...p, destinations: [...p.destinations, newRoute.destinoNome] }
          : p
      )
    );

    setNewRouteModalOpen(false);
    onTriggerNotice(
      'Rota Oficial Criada',
      `Rota ${newRoute.nome} registada com tarifa homologada de ${newRoute.tarifaKz} Kz. Sincronizada com passageiros e motoristas.`,
      'alt_route'
    );
  };

  const handleToggleRouteStatus = (routeId: string) => {
    triggerVibrate();
    setRoutes((prev) =>
      prev.map((r) => {
        if (r.id === routeId) {
          const isAtiva = r.status === 'ativa';
          onTriggerNotice(
            isAtiva ? 'Rota Desativada' : 'Rota Ativada',
            `A rota ${r.nome} foi ${isAtiva ? 'desativada temporariamente' : 'reativada'}.`,
            isAtiva ? 'pause_circle' : 'play_circle'
          );
          return { ...r, status: isAtiva ? 'desativada' : 'ativa' };
        }
        return r;
      })
    );
  };

  const handleUpdateRouteTarifa = (routeId: string, novaTarifa: number) => {
    triggerVibrate();
    setRoutes((prev) =>
      prev.map((r) => (r.id === routeId ? { ...r, tarifaKz: novaTarifa } : r))
    );
    onTriggerNotice(
      'Tarifa Regulamentada Atualizada',
      `Nova tarifa oficial de ${novaTarifa} Kz fixada para esta rota.`,
      'payments'
    );
  };

  const handleCreateTaxa = (e: React.FormEvent) => {
    e.preventDefault();
    triggerVibrate();
    if (!newTaxaForm.nomeTaxa.trim()) return;

    const dataHoje = new Date().toLocaleDateString('pt-AO');
    // Actualiza a praça associada ou todas as rotas
    setPracas((prev) =>
      prev.map((p) =>
        p.id === newTaxaForm.pracaId
          ? { ...p, taxaKz: Number(newTaxaForm.taxaKz), nomeTaxa: newTaxaForm.nomeTaxa, dataAtualizacaoTaxa: dataHoje }
          : p
      )
    );

    if (newTaxaForm.aplicarATodasRotas) {
      setRoutes((prev) =>
        prev.map((r) =>
          r.origemId === newTaxaForm.pracaId
            ? { ...r, tarifaKz: Number(newTaxaForm.taxaKz), nomeTaxa: newTaxaForm.nomeTaxa, dataAtualizacaoTaxa: dataHoje }
            : r
        )
      );
    }

    setNewTaxaModalOpen(false);
    onTriggerNotice(
      'Taxa de Transporte Fixada',
      `A taxa exclusiva "${newTaxaForm.nomeTaxa}" de ${newTaxaForm.taxaKz} Kz foi criada e homologada pelo Administrador. Sincronizada em tempo real.`,
      'verified'
    );
  };

  const handleSaveRenameTaxa = (e: React.FormEvent) => {
    e.preventDefault();
    triggerVibrate();
    if (!editingTaxaModal || !renameTaxaInput.trim()) return;

    const dataHoje = new Date().toLocaleDateString('pt-AO');
    const { id, type } = editingTaxaModal;

    if (type === 'praca') {
      setPracas((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                name: renamePracaNomeInput.trim() || p.name,
                taxaKz: Number(renameTaxaValorKz),
                nomeTaxa: renameTaxaInput,
                dataAtualizacaoTaxa: dataHoje,
              }
            : p
        )
      );
    } else {
      setRoutes((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                nome: renamePracaNomeInput.trim() || r.nome,
                tarifaKz: Number(renameTaxaValorKz),
                nomeTaxa: renameTaxaInput,
                dataAtualizacaoTaxa: dataHoje,
              }
            : r
        )
      );
    }

    setEditingTaxaModal(null);
    onTriggerNotice(
      'Taxa Renomeada & Ajustada',
      `A designação oficial foi atualizada para "${renameTaxaInput}" (${renameTaxaValorKz} Kz) pelo Administrador.`,
      'edit'
    );
  };

  // ============================================================================
  // INTERVENÇÃO EXCEPCIONAL ADMINISTRATIVA NA FILA
  // ============================================================================
  const handleExecuteIntervention = () => {
    if (!interventionModalQueueItem) return;
    if (!interventionJustification.trim()) {
      onTriggerNotice(
        'Justificação Obrigatória',
        'Por exigência regulamentar do GPL e ANATA, qualquer intervenção na ordem da fila requer uma justificativa formal.',
        'warning'
      );
      return;
    }

    triggerVibrate();
    const item = interventionModalQueueItem;
    const targetPraca = pracas.find((p) => p.id === item.pracaId) || pracas[0];

    // Cria o log auditado de intervenção
    const interventionLog: QueueInterventionRecord = {
      id: `int-${Date.now()}`,
      timestamp: new Date().toLocaleString('pt-AO'),
      pracaNome: targetPraca.name,
      motoristaNome: item.motoristaNome,
      matricula: item.matricula,
      tipoIntervencao: interventionType,
      realizadoPor: 'Administrador Central (Supervisão Geral)',
      justificativaObrigatoria: interventionJustification,
      resultado:
        interventionType === 'Prioridade Mecânica'
          ? 'Posicionado imediatamente como 1º no Cais de Embarque.'
          : interventionType === 'Retirar por Ausência'
          ? 'Retirado da baia e reencaminhado para verificação.'
          : 'Fila reordenada com autorização central.',
    };

    setInterventions((prev) => [interventionLog, ...prev]);

    // Aplica o efeito na fila
    if (interventionType === 'Prioridade Mecânica' || interventionType === 'Chamada de Urgência') {
      setQueues((prev) => {
        const withoutItem = prev.filter((q) => q.id !== item.id);
        const updatedItem: QueueItemRecord = {
          ...item,
          posicao: 1,
          status: 'no_cais',
          ultimaIntervencaoFiscal: `Prioridade concedida pela Central: ${interventionJustification.slice(0, 35)}...`,
        };
        // Reordena posições
        return [updatedItem, ...withoutItem.map((q, idx) => ({ ...q, posicao: idx + 2 }))];
      });
    } else if (interventionType === 'Retirar por Ausência' || interventionType === 'Despacho Cautelar') {
      setQueues((prev) =>
        prev
          .filter((q) => q.id !== item.id)
          .map((q, idx) => ({ ...q, posicao: idx + 1 }))
      );
    }

    setInterventionModalQueueItem(null);
    setInterventionJustification('');
    onTriggerNotice(
      'Intervenção Executada',
      `Intervenção de "${interventionType}" registada no livro de auditoria e refletida imediatamente no terminal do fiscal e do motorista.`,
      'gavel'
    );
  };

  // ============================================================================
  // PAGAMENTOS DIGITAIS: VERIFICAÇÃO COM PRESTADOR (REGRA DE SEGURANÇA)
  // ============================================================================
  const handleVerifyDigitalPayment = (payment: PaymentRecord) => {
    setVerifyingPayment(payment);
    setIsVerifyingWithProvider(true);
    triggerVibrate();

    // Simulação segura de consulta ao gateway interbancário EMIS / Multicaixa
    setTimeout(() => {
      setIsVerifyingWithProvider(false);
      setPayments((prev) =>
        prev.map((p) =>
          p.id === payment.id
            ? {
                ...p,
                estado: 'Confirmado',
                prestadorConfirmado: true,
                descricao: `${p.descricao} • Confirmado via Gateway Interbancário EMIS (Liquidado).`,
              }
            : p
        )
      );
      onTriggerNotice(
        'Pagamento Confirmado pelo Prestador',
        `Transação ${payment.referencia} de ${payment.valorKz} Kz validada com sucesso pelo gateway Multicaixa. Saldo conciliado.`,
        'verified'
      );
      setVerifyingPayment(null);
    }, 1800);
  };

  // ============================================================================
  // EXPORTAÇÃO DE RELATÓRIOS (PDF & EXCEL)
  // ============================================================================
  const handleExport = (format: 'pdf' | 'excel', module?: string) => {
    triggerVibrate();
    const bundle = {
      title: 'Relatório Geral FilaTáxi AO Luanda',
      generatedAt: new Date().toLocaleString('pt-AO'),
      generatedBy: 'Administração Central (Direção Operacional)',
      passengers,
      drivers,
      trips,
      payments,
      pracas,
      queues,
      incidents,
      fiscais,
    };

    if (format === 'excel') {
      exportToExcel(bundle, module);
      onTriggerNotice('Relatório Excel Gerado', 'O ficheiro .xlsx foi gerado e transferido para o seu telemóvel.', 'table_view');
    } else {
      exportToPDF(bundle, module);
      onTriggerNotice('Relatório PDF Gerado', 'O ficheiro PDF timbrado oficial foi gerado e transferido.', 'picture_as_pdf');
    }
  };

  return (
    <div className="flex flex-col w-full pb-28 text-on-surface">
      {/* ===================================================================== */}
      {/* SUB-HEADER ADMINISTRATIVO MOBILE-FIRST COM ABAS DESLIZÁVEIS          */}
      {/* ===================================================================== */}
      <div className="sticky top-16 z-30 bg-surface/95 backdrop-blur-md border-b border-surface-container px-3 py-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
            </div>
            <div>
              <h2 className="font-bold text-xs text-primary leading-tight">Painel Administrativo</h2>
              <p className="text-[10px] text-on-surface-variant">ANATA • ATL • Governo de Luanda</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleExport('excel')}
              title="Exportar Excel"
              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1 active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[15px]">table_chart</span>
              <span className="hidden sm:inline text-[10px]">Excel</span>
            </button>
            <button
              onClick={() => handleExport('pdf')}
              title="Exportar PDF"
              className="p-1.5 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold flex items-center gap-1 active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[15px]">picture_as_pdf</span>
              <span className="hidden sm:inline text-[10px]">PDF</span>
            </button>
          </div>
        </div>

        {/* Barra de Navegação Horizontal das Abas Administrativas */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
          {[
            { id: 'dashboard' as AdminTab, label: 'Dashboard', icon: 'dashboard' },
            { id: 'users' as AdminTab, label: 'Utilizadores', icon: 'group' },
            { id: 'fiscais-mgmt' as AdminTab, label: `Gestão Fiscais (${fiscais.length})`, icon: 'shield_person' },
            { id: 'pracas' as AdminTab, label: 'Praças & Rotas', icon: 'map' },
            { id: 'queues' as AdminTab, label: 'Filas & Cais', icon: 'format_list_numbered' },
            { id: 'trips' as AdminTab, label: 'Viagens', icon: 'route' },
            { id: 'payments' as AdminTab, label: 'Pagamentos', icon: 'payments' },
            { id: 'reports' as AdminTab, label: 'Relatórios', icon: 'summarize' },
          ].map((tab) => {
            const isActive = activeAdminTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  triggerVibrate();
                  setActiveAdminTab(tab.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-gutter pt-3 space-y-4">
        {/* ===================================================================== */}
        {/* ABA 1: DASHBOARD EXECUTIVO COM INDICADORES REAIS                     */}
        {/* ===================================================================== */}
        {activeAdminTab === 'dashboard' && (
          <div className="space-y-4">
            {/* Banner Informativo */}
            <div className="p-3.5 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                  Supervisão Central • Rede Luanda
                </span>
                <h3 className="font-bold text-sm text-primary">Estado Operacional Geral</h3>
                <p className="text-[11px] text-on-surface-variant">
                  Indicadores atualizados em tempo real a partir dos despachos dos fiscais e viagens.
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>SINCRONIZADO</span>
              </div>
            </div>

            {/* Grid dos 12 Indicadores Oficiais Requeridos */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {/* 1. Passageiros Registados */}
              <div className="p-3 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs space-y-1">
                <div className="flex items-center justify-between text-secondary">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Passageiros</span>
                  <span className="material-symbols-outlined text-[18px]">person</span>
                </div>
                <div className="text-xl font-extrabold text-primary">{stats.passageirosRegistados}</div>
                <span className="text-[10px] text-on-surface-variant block">Registos na base</span>
              </div>

              {/* 2. Motoristas Activos */}
              <div className="p-3 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs space-y-1">
                <div className="flex items-center justify-between text-emerald-600">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Motoristas Ativos</span>
                  <span className="material-symbols-outlined text-[18px]">local_taxi</span>
                </div>
                <div className="text-xl font-extrabold text-emerald-700">{stats.motoristasActivos}</div>
                <span className="text-[10px] text-on-surface-variant block">Homologados & Aptos</span>
              </div>

              {/* 3. Motoristas Pendentes */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-amber-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Pendentes</span>
                  <span className="material-symbols-outlined text-[18px]">pending_actions</span>
                </div>
                <div className="text-xl font-extrabold text-amber-900">{stats.motoristasPendentes}</div>
                <span className="text-[10px] text-amber-800 block">Aguardam homologação</span>
              </div>

              {/* 4. Viaturas Aprovadas */}
              <div className="p-3 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs space-y-1">
                <div className="flex items-center justify-between text-primary">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Viaturas Aprovadas</span>
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                </div>
                <div className="text-xl font-extrabold text-primary">{stats.viaturasAprovadas}</div>
                <span className="text-[10px] text-on-surface-variant block">Inspeção periódica OK</span>
              </div>

              {/* 5. Praças Activas */}
              <div className="p-3 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs space-y-1">
                <div className="flex items-center justify-between text-secondary">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Praças Ativas</span>
                  <span className="material-symbols-outlined text-[18px]">storefront</span>
                </div>
                <div className="text-xl font-extrabold text-primary">{stats.pracasActivas}</div>
                <span className="text-[10px] text-on-surface-variant block">Terminais em Luanda</span>
              </div>

              {/* 6. Rotas Activas */}
              <div className="p-3 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs space-y-1">
                <div className="flex items-center justify-between text-primary">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Rotas Oficiais</span>
                  <span className="material-symbols-outlined text-[18px]">alt_route</span>
                </div>
                <div className="text-xl font-extrabold text-primary">{stats.rotasActivas}</div>
                <span className="text-[10px] text-on-surface-variant block">Corredores tarifados</span>
              </div>

              {/* 7. Pedidos do Dia */}
              <div className="p-3 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs space-y-1">
                <div className="flex items-center justify-between text-secondary">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Pedidos Hoje</span>
                  <span className="material-symbols-outlined text-[18px]">confirmation_number</span>
                </div>
                <div className="text-xl font-extrabold text-primary">{stats.pedidosDoDia}</div>
                <span className="text-[10px] text-on-surface-variant block">Senhas & Lotações</span>
              </div>

              {/* 8. Viagens em Curso */}
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-blue-700">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Em Curso</span>
                  <span className="material-symbols-outlined text-[18px]">directions_car</span>
                </div>
                <div className="text-xl font-extrabold text-blue-800">{stats.viagensEmCurso}</div>
                <span className="text-[10px] text-blue-700 block">Viaturas em trânsito</span>
              </div>

              {/* 9. Viagens Concluídas */}
              <div className="p-3 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs space-y-1">
                <div className="flex items-center justify-between text-emerald-600">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Concluídas</span>
                  <span className="material-symbols-outlined text-[18px]">task_alt</span>
                </div>
                <div className="text-xl font-extrabold text-primary">{stats.viagensConcluidas}</div>
                <span className="text-[10px] text-on-surface-variant block">Chegadas ao destino</span>
              </div>

              {/* 10. Cancelamentos */}
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-rose-700">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Cancelamentos</span>
                  <span className="material-symbols-outlined text-[18px]">cancel</span>
                </div>
                <div className="text-xl font-extrabold text-rose-800">{stats.cancelamentos}</div>
                <span className="text-[10px] text-rose-700 block">Desistências / Incidentes</span>
              </div>

              {/* 11. Pagamentos Registados */}
              <div className="p-3 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs space-y-1">
                <div className="flex items-center justify-between text-emerald-600">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Receita (Kz)</span>
                  <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                </div>
                <div className="text-base font-extrabold text-emerald-700 truncate">
                  {stats.pagamentosConfirmadosKz.toLocaleString('pt-AO')} Kz
                </div>
                <span className="text-[10px] text-on-surface-variant block">Liquidação confirmada</span>
              </div>

              {/* 12. Ocorrências Pendentes */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-amber-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Ocorrências</span>
                  <span className="material-symbols-outlined text-[18px]">report_problem</span>
                </div>
                <div className="text-xl font-extrabold text-amber-900">{stats.ocorrenciasPendentes}</div>
                <span className="text-[10px] text-amber-800 block">Em triagem / fiscalização</span>
              </div>
            </div>

            {/* Ações Rápidas de Alinhamento e Comutação */}
            <div className="p-3.5 rounded-2xl bg-surface-container-lowest border border-surface-container space-y-2">
              <span className="text-xs font-bold text-primary block">
                Verificação de Sincronia entre Perfis:
              </span>
              <p className="text-[11px] text-on-surface-variant">
                Comute instantaneamente para qualquer perfil para conferir como as decisões administrativas se refletem no terreno:
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  onClick={() => {
                    triggerVibrate();
                    onSwitchToPassenger();
                  }}
                  className="py-2 px-2 bg-surface-container hover:bg-surface-container-high rounded-xl text-center text-xs font-bold text-primary flex flex-col items-center gap-1 active:scale-95 transition-transform"
                >
                  <span className="material-symbols-outlined text-[18px] text-secondary">person</span>
                  <span>Passageiro</span>
                </button>
                <button
                  onClick={() => {
                    triggerVibrate();
                    onSwitchToDriver();
                  }}
                  className="py-2 px-2 bg-surface-container hover:bg-surface-container-high rounded-xl text-center text-xs font-bold text-primary flex flex-col items-center gap-1 active:scale-95 transition-transform"
                >
                  <span className="material-symbols-outlined text-[18px] text-secondary">local_taxi</span>
                  <span>Motorista</span>
                </button>
                <button
                  onClick={() => {
                    triggerVibrate();
                    onSwitchToInspector();
                  }}
                  className="py-2 px-2 bg-surface-container hover:bg-surface-container-high rounded-xl text-center text-xs font-bold text-primary flex flex-col items-center gap-1 active:scale-95 transition-transform"
                >
                  <span className="material-symbols-outlined text-[18px] text-secondary">badge</span>
                  <span>Fiscal</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* ABA 2: GESTÃO DE UTILIZADORES (PASSAGEIROS, MOTORISTAS, VIATURAS, FISCAIS) */}
        {/* ===================================================================== */}
        {activeAdminTab === 'users' && (
          <div className="space-y-3">
            {/* Sub-navegador de Utilizadores */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: 'motoristas', label: `Motoristas (${drivers.length})`, icon: 'local_taxi' },
                { id: 'passageiros', label: `Passageiros (${passengers.length})`, icon: 'person' },
                { id: 'viaturas', label: `Viaturas (${vehicles.length})`, icon: 'directions_bus' },
                { id: 'fiscais', label: `Fiscais (${fiscais.length})`, icon: 'badge' },
                { id: 'permissoes', label: 'Permissões Admin', icon: 'security' },
              ].map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => {
                    triggerVibrate();
                    setUserSubTab(sub.id as any);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all ${
                    userSubTab === sub.id
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-lowest text-on-surface border border-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">{sub.icon}</span>
                  <span>{sub.label}</span>
                </button>
              ))}
            </div>

            {/* SEÇÃO 2.1: MOTORISTAS & HOMOLOGAÇÃO */}
            {userSubTab === 'motoristas' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex gap-1">
                    {['todos', 'pendente', 'aprovado', 'suspenso'].map((st) => (
                      <button
                        key={st}
                        onClick={() => setDriverFilterStatus(st)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold capitalize ${
                          driverFilterStatus === st
                            ? 'bg-secondary text-on-secondary'
                            : 'bg-surface-container-low text-on-surface-variant'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                  <span className="text-[11px] text-on-surface-variant">
                    {drivers.filter((d) => driverFilterStatus === 'todos' || d.statusConta === driverFilterStatus).length} motoristas
                  </span>
                </div>

                <div className="space-y-2">
                  {drivers
                    .filter((d) => driverFilterStatus === 'todos' || d.statusConta === driverFilterStatus)
                    .map((drv) => (
                      <div
                        key={drv.id}
                        className="p-3 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={drv.fotoUrl}
                              alt={drv.nomeCompleto}
                              className="w-10 h-10 rounded-full object-cover shrink-0 border border-surface-container"
                            />
                            <div className="min-w-0">
                              <h4 className="font-bold text-xs text-primary truncate">{drv.nomeCompleto}</h4>
                              <p className="text-[11px] text-on-surface-variant truncate">
                                {drv.telefone} • {drv.associacao}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                              drv.statusConta === 'aprovado'
                                ? 'bg-emerald-100 text-emerald-800'
                                : drv.statusConta === 'pendente'
                                ? 'bg-amber-100 text-amber-800 animate-pulse'
                                : drv.statusConta === 'suspenso'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {drv.statusConta}
                          </span>
                        </div>

                        <div className="p-2 rounded-xl bg-surface-container-low text-[11px] space-y-1 text-on-surface-variant">
                          <div className="flex justify-between">
                            <span>Carta: <strong className="text-primary">{drv.numeroCarta}</strong></span>
                            <span>B.I.: <strong className="text-primary font-mono">{drv.numeroBi}</strong></span>
                          </div>
                          <div className="flex justify-between">
                            <span>Viatura: <strong className="text-primary">{drv.matricula}</strong></span>
                            <span>{drv.modeloViatura}</span>
                          </div>
                          {drv.motivoSuspensao && (
                            <div className="p-1.5 rounded bg-rose-50 text-rose-800 text-[10px] font-bold">
                              Motivo da Suspensão: {drv.motivoSuspensao}
                            </div>
                          )}
                        </div>

                        {/* Botões de Ação para o Smartphone */}
                        <div className="flex items-center gap-1.5 pt-1">
                          <button
                            onClick={() => {
                              triggerVibrate();
                              setSelectedDriverDocs(drv);
                            }}
                            className="flex-1 py-1.5 px-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-bold text-primary flex items-center justify-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[15px]">file_open</span>
                            <span>Ver Documentos</span>
                          </button>

                          {drv.statusConta === 'pendente' && (
                            <>
                              <button
                                onClick={() => handleApproveDriver(drv.id)}
                                className="py-1.5 px-3 rounded-lg bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 active:scale-95"
                              >
                                <span className="material-symbols-outlined text-[15px]">check</span>
                                <span>Homologar</span>
                              </button>
                              <button
                                onClick={() => handleRejectDriver(drv.id)}
                                className="py-1.5 px-2.5 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold"
                              >
                                Rejeitar
                              </button>
                            </>
                          )}

                          {drv.statusConta !== 'pendente' && (
                            <button
                              onClick={() => handleToggleSuspendDriver(drv.id)}
                              className={`py-1.5 px-3 rounded-lg text-xs font-bold flex items-center gap-1 ${
                                drv.statusConta === 'suspenso'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-50 text-rose-800 border border-rose-200'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[15px]">
                                {drv.statusConta === 'suspenso' ? 'lock_open' : 'block'}
                              </span>
                              <span>{drv.statusConta === 'suspenso' ? 'Reactivar' : 'Suspender'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* SEÇÃO 2.2: PASSAGEIROS */}
            {userSubTab === 'passageiros' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-on-surface-variant">
                  <span>Passageiros registados com dados civis:</span>
                  <span>{passengers.length} contas</span>
                </div>

                {passengers.map((pass) => (
                  <div
                    key={pass.id}
                    className="p-3 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={pass.avatarUrl}
                          alt={pass.nome}
                          className="w-10 h-10 rounded-full object-cover shrink-0 border border-surface-container"
                        />
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-primary truncate">{pass.nome}</h4>
                          <p className="text-[11px] text-on-surface-variant truncate">
                            {pass.telefone} • {pass.municipioHabitual}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          pass.status === 'ativo' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {pass.status}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-surface-container-low text-[11px] flex items-center justify-between">
                      <div>
                        <span className="text-on-surface-variant block">Saldo Carteira:</span>
                        <strong className="text-emerald-700 font-extrabold text-xs">
                          {pass.saldoKz.toLocaleString('pt-AO')} Kz
                        </strong>
                      </div>
                      <div>
                        <span className="text-on-surface-variant block">Viagens Feitas:</span>
                        <strong className="text-primary">{pass.viagensRealizadas}</strong>
                      </div>
                      <div>
                        <span className="text-on-surface-variant block">Registo:</span>
                        <span className="text-primary">{pass.dataRegisto}</span>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleToggleSuspendPassenger(pass.id)}
                        className={`py-1.5 px-3 rounded-lg text-xs font-bold flex items-center gap-1 ${
                          pass.status === 'suspenso'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[15px]">
                          {pass.status === 'suspenso' ? 'lock_open' : 'person_off'}
                        </span>
                        <span>{pass.status === 'suspenso' ? 'Reactivar Conta' : 'Suspender Conta'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* SEÇÃO 2.3: VIATURAS */}
            {userSubTab === 'viaturas' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-on-surface-variant">
                  <span>Frota oficial de táxis de Luanda:</span>
                  <span>{vehicles.length} viaturas</span>
                </div>

                {vehicles.map((veh) => (
                  <div
                    key={veh.id}
                    className="p-3 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-xs text-primary">{veh.matricula}</h4>
                        <p className="text-[11px] text-on-surface-variant">
                          {veh.modelo} • {veh.ano} ({veh.lotacao} lugares)
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          veh.status === 'Aprovada'
                            ? 'bg-emerald-100 text-emerald-800'
                            : veh.status === 'Pendente'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {veh.status}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-surface-container-low text-[11px] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Condutor Atribuído:</span>
                        <strong className="text-primary">{veh.motoristaNome}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Proprietário / Cooperativa:</span>
                        <span className="text-primary">{veh.proprietarioNome}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Validade Inspecção:</span>
                        <span className="text-primary">{veh.inspecaoValidaAte}</span>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleToggleVehicleApproval(veh.matricula)}
                        className={`py-1.5 px-3 rounded-lg text-xs font-bold flex items-center gap-1 ${
                          veh.status === 'Aprovada'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-emerald-700 text-white'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[15px]">
                          {veh.status === 'Aprovada' ? 'block' : 'verified'}
                        </span>
                        <span>{veh.status === 'Aprovada' ? 'Bloquear Viatura' : 'Aprovar Viatura'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* SEÇÃO 2.4: FISCAIS */}
            {userSubTab === 'fiscais' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-on-surface-variant">
                    Quadro de Fiscais de Praça ({fiscais.length}):
                  </span>
                  <button
                    onClick={() => {
                      triggerVibrate();
                      setNewFiscalModalOpen(true);
                    }}
                    className="py-1 px-2.5 rounded-lg bg-primary text-on-primary text-xs font-bold flex items-center gap-1 active:scale-95 transition-transform"
                  >
                    <span className="material-symbols-outlined text-[15px]">add</span>
                    <span>Criar Fiscal</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {fiscais.map((fisc) => (
                    <div
                      key={fisc.id}
                      className="p-3 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-secondary-container text-on-secondary-fixed flex items-center justify-center font-bold shrink-0">
                            <span className="material-symbols-outlined text-[18px]">badge</span>
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-primary truncate">{fisc.nome}</h4>
                            <p className="text-[10px] text-on-surface-variant font-mono truncate">
                              {fisc.identificacaoFuncional} • {fisc.associacao}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            fisc.status === 'ativo' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {fisc.status}
                        </span>
                      </div>

                      <div className="p-2 rounded-xl bg-surface-container-low text-[11px] space-y-1">
                        <div className="flex justify-between">
                          <span className="text-on-surface-variant">Praça Atribuída:</span>
                          <strong className="text-primary">{fisc.pracaAtribuidaNome}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-on-surface-variant">Turno Operacional:</span>
                          <span className="text-primary">{fisc.turno}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-on-surface-variant">Despachos Hoje:</span>
                          <span className="font-bold text-secondary">{fisc.totalDespachosHoje} carrinhas</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-[11px]">
                        <span className="text-on-surface-variant">Permissões: Baia, Vistoria, Ocorrências</span>
                        <button
                          onClick={() => {
                            triggerVibrate();
                            setFiscais((prev) =>
                              prev.map((f) =>
                                f.id === fisc.id
                                  ? { ...f, status: f.status === 'ativo' ? 'suspenso' : 'ativo' }
                                  : f
                              )
                            );
                            onTriggerNotice(
                              'Estado do Fiscal Alterado',
                              `O Fiscal ${fisc.nome} está agora ${fisc.status === 'ativo' ? 'suspenso' : 'ativo'}.`,
                              'badge'
                            );
                          }}
                          className={`px-2 py-1 rounded-lg text-xs font-bold ${
                            fisc.status === 'ativo'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {fisc.status === 'ativo' ? 'Suspender' : 'Reactivar'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SEÇÃO 2.5: PERMISSÕES ADMINISTRATIVAS */}
            {userSubTab === 'permissoes' && (
              <div className="p-3.5 rounded-2xl bg-surface-container-lowest border border-surface-container space-y-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-primary">admin_panel_settings</span>
                  <h4 className="font-bold text-xs text-primary">Níveis de Acesso & Segurança Administrativa</h4>
                </div>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  Defina as permissões concedidas aos operadores da plataforma (Direção Provincial, Cooperativas e Fiscais-Gerais):
                </p>

                <div className="space-y-2">
                  {[
                    { title: 'Supervisão Geral (GPL / ANATA / ATL)', desc: 'Acesso irrestrito a homologação, tarifas, praças e intervenções excepcionais.', active: true },
                    { title: 'Homologação de Frotas e Motoristas', desc: 'Permissão para aprovar carteiras de condução e livretes de carrinhas.', active: true },
                    { title: 'Gestão Tarifária & Rotas Oficiais', desc: 'Permissão para reajustar o preço oficial da passagem e criar novos corredores.', active: true },
                    { title: 'Intervenções Forçadas na Fila', desc: 'Permissão para reordenar a fila mediante exigência de justificação oficial.', active: true },
                    { title: 'Auditoria Financeira e Exportação', desc: 'Permissão para descarregar relatórios em Excel e PDF com valores de arrecadação.', active: true },
                  ].map((perm, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-surface-container-low flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <strong className="text-xs text-primary block truncate">{perm.title}</strong>
                        <span className="text-[10px] text-on-surface-variant block">{perm.desc}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0">
                        Ativa
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================================================================== */}
        {/* ABA 3: GESTÃO DE PRAÇAS & ROTAS                                      */}
        {/* ===================================================================== */}
        {activeAdminTab === 'pracas' && (
          <div className="space-y-4">
            {/* Header Praças */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xs text-primary">Terminais & Praças Oficiais ({pracas.length})</h3>
                <p className="text-[10px] text-on-surface-variant">Infraestrutura regulamentada de Luanda</p>
              </div>
              <button
                onClick={() => {
                  triggerVibrate();
                  setNewPracaModalOpen(true);
                }}
                className="py-1 px-2.5 rounded-lg bg-primary text-on-primary text-xs font-bold flex items-center gap-1 active:scale-95"
              >
                <span className="material-symbols-outlined text-[15px]">add_location</span>
                <span>Nova Praça</span>
              </button>
            </div>

            {/* Lista de Praças com edição rápida */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {pracas.map((pr) => (
                <div
                  key={pr.id}
                  className="p-3 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-primary truncate">{pr.name}</h4>
                      <p className="text-[10px] text-on-surface-variant truncate">
                        {pr.municipio} • {pr.corridor}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        pr.status === 'Operacional'
                          ? 'bg-emerald-100 text-emerald-800'
                          : pr.status === 'Movimento Intenso'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {pr.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-surface-container-low text-[10px] text-center">
                    <div>
                      <span className="text-on-surface-variant block">Na Fila</span>
                      <strong className="text-primary text-xs">{pr.naFila} táxis</strong>
                    </div>
                    <div>
                      <span className="text-on-surface-variant block">No Cais</span>
                      <strong className="text-emerald-700 text-xs">{pr.noCais} baia</strong>
                    </div>
                    <div>
                      <span className="text-on-surface-variant block">Espera Média</span>
                      <strong className="text-secondary text-xs">{pr.minEspera}m</strong>
                    </div>
                  </div>

                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Fiscais em Turno:</span>
                      <span className="text-primary font-bold">
                        {pr.fiscaisAtribuidos.length > 0 ? pr.fiscaisAtribuidos.join(', ') : 'Nenhum atribuído'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Coordenadas:</span>
                      <span className="text-on-surface-variant font-mono text-[10px]">
                        {pr.lat.toFixed(4)}, {pr.lng.toFixed(4)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => {
                        triggerVibrate();
                        setPracas((prev) =>
                          prev.map((p) =>
                            p.id === pr.id
                              ? {
                                  ...p,
                                  status:
                                    p.status === 'Operacional'
                                      ? 'Movimento Intenso'
                                      : p.status === 'Movimento Intenso'
                                      ? 'Em Obras'
                                      : 'Operacional',
                                }
                              : p
                          )
                        );
                      }}
                      className="flex-1 py-1 px-2 rounded-lg bg-surface-container text-xs font-bold text-primary hover:bg-surface-container-high"
                    >
                      Mudar Estado ({pr.status})
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* SEÇÃO ROTAS OFICIAIS */}
            <div className="pt-2 border-t border-surface-container space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xs text-primary">Rotas & Tarifas Homologadas ({routes.length})</h3>
                  <p className="text-[10px] text-on-surface-variant">Controlo de preços oficiais do Governo</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      triggerVibrate();
                      setNewTaxaModalOpen(true);
                    }}
                    className="py-1 px-2.5 rounded-lg bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 active:scale-95 shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[15px]">payments</span>
                    <span>Criar Taxa</span>
                  </button>
                  <button
                    onClick={() => {
                      triggerVibrate();
                      setNewRouteModalOpen(true);
                    }}
                    className="py-1 px-2.5 rounded-lg bg-primary text-on-primary text-xs font-bold flex items-center gap-1 active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[15px]">add</span>
                    <span>Nova Rota</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {routes.map((rt) => (
                  <div
                    key={rt.id}
                    className="p-3 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-xs text-primary truncate">{rt.nome}</h4>
                          {rt.nomeTaxa && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[9px] font-bold shrink-0">
                              {rt.nomeTaxa}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-on-surface-variant truncate">
                          {rt.tipoTransporte} • {rt.distanciaKm} km • ~{rt.tempoEstimadoMin} min
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            triggerVibrate();
                            setEditingTaxaModal({
                              id: rt.id,
                              type: 'route',
                              nomeAtual: rt.nome,
                              taxaAtualKz: rt.tarifaKz,
                              nomeTaxaAtual: rt.nomeTaxa || `${rt.origemNome} ${rt.tarifaKz}kz`,
                              nomePracaOuRota: rt.nome,
                            });
                            setRenameTaxaInput(rt.nomeTaxa || `${rt.origemNome} ${rt.tarifaKz}kz`);
                            setRenameTaxaValorKz(rt.tarifaKz);
                            setRenamePracaNomeInput(rt.nome);
                          }}
                          className="px-2 py-0.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-[10px] font-bold text-primary flex items-center gap-1"
                          title="Renomear ou Ajustar Taxa (Exclusivo Administrador)"
                        >
                          <span className="material-symbols-outlined text-[12px]">edit</span>
                          <span>Renomear Taxa</span>
                        </button>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            rt.status === 'ativa' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {rt.status}
                        </span>
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-surface-container-low flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-on-surface-variant block">Tarifa Oficial Regulada:</span>
                        <div className="flex items-center gap-1.5">
                          <strong className="text-base font-extrabold text-emerald-700">{rt.tarifaKz} Kz</strong>
                          <span className="text-[10px] text-on-surface-variant">(por passageiro)</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleUpdateRouteTarifa(rt.id, Math.max(100, rt.tarifaKz - 50))}
                          className="w-7 h-7 rounded-lg bg-surface-container font-bold text-sm text-primary flex items-center justify-center hover:bg-surface-container-high"
                        >
                          -
                        </button>
                        <button
                          onClick={() => handleUpdateRouteTarifa(rt.id, rt.tarifaKz + 50)}
                          className="w-7 h-7 rounded-lg bg-surface-container font-bold text-sm text-primary flex items-center justify-center hover:bg-surface-container-high"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleToggleRouteStatus(rt.id)}
                        className={`py-1.5 px-3 rounded-lg text-xs font-bold flex items-center gap-1 ${
                          rt.status === 'ativa'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-emerald-700 text-white'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[15px]">
                          {rt.status === 'ativa' ? 'pause' : 'play_arrow'}
                        </span>
                        <span>{rt.status === 'ativa' ? 'Desativar Rota' : 'Ativar Rota'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* ABA 4: GESTÃO DE FILAS & CAIS COM INTERVENÇÕES EXCEPCIONAIS          */}
        {/* ===================================================================== */}
        {activeAdminTab === 'queues' && (
          <div className="space-y-3">
            {/* Seletor de Praça para Visualizar a Fila */}
            <div className="p-3 rounded-2xl bg-surface-container-lowest border border-surface-container space-y-2">
              <label className="text-xs font-bold text-primary block">
                Selecionar Praça / Terminal de Embarque:
              </label>
              <select
                value={selectedQueuePracaId}
                onChange={(e) => {
                  triggerVibrate();
                  setSelectedQueuePracaId(e.target.value);
                }}
                className="w-full h-11 px-3 rounded-xl bg-surface-container-low text-xs font-bold text-primary focus:outline-none border border-surface-container"
              >
                {pracas.map((pr) => (
                  <option key={pr.id} value={pr.id}>
                    {pr.name} ({pr.naFila} na fila • {pr.noCais} no cais)
                  </option>
                ))}
              </select>
            </div>

            {/* Lista dos Motoristas na Fila da Praça Selecionada */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-on-surface-variant">
                <span>Ordem Oficial de Chegada & Despacho:</span>
                <span>{queues.length} carrinhas na baia</span>
              </div>

              {queues.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 ${
                          item.posicao === 1
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'bg-surface-container text-primary'
                        }`}
                      >
                        #{item.posicao}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-primary truncate">{item.motoristaNome}</h4>
                        <p className="text-[10px] text-on-surface-variant truncate">
                          Matrícula: {item.matricula}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                        item.status === 'no_cais'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'em_embarque'
                          ? 'bg-blue-100 text-blue-800'
                          : item.status === 'ausente'
                          ? 'bg-rose-100 text-rose-800 animate-pulse'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {item.status === 'no_cais'
                        ? '1º No Cais'
                        : item.status === 'em_embarque'
                        ? 'A Embarcar'
                        : item.status === 'ausente'
                        ? 'Ausente da Baia'
                        : 'Na Fila'}
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-surface-container-low text-[11px] grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-on-surface-variant block">Tempo em Espera:</span>
                      <strong className="text-secondary">{item.tempoEsperaMin} minutos</strong>
                    </div>
                    <div>
                      <span className="text-on-surface-variant block">Ocupação Atual:</span>
                      <strong className="text-primary">
                        {item.passageirosEmbarcados} / {item.lotacaoMaxima} lugares
                      </strong>
                    </div>
                    {item.ultimaIntervencaoFiscal && (
                      <div className="col-span-2 text-[10px] text-amber-800 font-bold bg-amber-50 p-1 rounded">
                        {item.ultimaIntervencaoFiscal}
                      </div>
                    )}
                  </div>

                  {/* Botão de Intervenção Excepcional */}
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => {
                        triggerVibrate();
                        setInterventionModalQueueItem(item);
                      }}
                      className="py-1.5 px-3 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-1 active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[15px]">gavel</span>
                      <span>Intervenção Excepcional</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Histórico das Intervenções Administrativas e de Fiscais */}
            <div className="p-3.5 rounded-2xl bg-surface-container-lowest border border-surface-container space-y-2.5">
              <div className="flex items-center gap-1.5 text-primary font-bold text-xs">
                <span className="material-symbols-outlined text-[17px] text-secondary">history_edu</span>
                <span>Registo Auditado de Intervenções nas Filas</span>
              </div>
              <div className="space-y-1.5">
                {interventions.map((int) => (
                  <div key={int.id} className="p-2 rounded-xl bg-surface-container-low text-[11px] space-y-1">
                    <div className="flex items-center justify-between">
                      <strong className="text-primary">{int.tipoIntervencao}</strong>
                      <span className="text-[10px] text-on-surface-variant">{int.timestamp}</span>
                    </div>
                    <p className="text-on-surface-variant">
                      Motorista: <strong className="text-primary">{int.motoristaNome}</strong> ({int.matricula}) • {int.pracaNome}
                    </p>
                    <p className="text-[10px] text-amber-900 bg-amber-50 p-1 rounded font-medium">
                      Justificativa: {int.justificativaObrigatoria}
                    </p>
                    <span className="text-[10px] text-on-surface-variant block">Por: {int.realizadoPor}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* ABA 5: GESTÃO DE VIAGENS                                             */}
        {/* ===================================================================== */}
        {activeAdminTab === 'trips' && (
          <div className="space-y-3">
            {/* Filtros de Viagens */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-1 overflow-x-auto scrollbar-none">
                {['todas', 'ongoing', 'completed', 'cancelled'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setTripFilterState(st)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize ${
                      tripFilterState === st
                        ? 'bg-secondary text-on-secondary'
                        : 'bg-surface-container-low text-on-surface-variant'
                    }`}
                  >
                    {st === 'ongoing' ? 'Em Curso' : st === 'completed' ? 'Concluídas' : st === 'cancelled' ? 'Canceladas' : 'Todas'}
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-on-surface-variant">{trips.length} viagens</span>
            </div>

            {/* Lista Detalhada de Viagens */}
            <div className="space-y-2">
              {trips
                .filter((t) => tripFilterState === 'todas' || t.estado === tripFilterState)
                .map((trip) => (
                  <div
                    key={trip.id}
                    className="p-3 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-extrabold text-primary">{trip.codigo}</span>
                          <span
                            className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                              trip.estado === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : trip.estado === 'ongoing'
                                ? 'bg-blue-100 text-blue-800 animate-pulse'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {trip.estado === 'completed' ? 'Concluída' : trip.estado === 'ongoing' ? 'Em Curso' : 'Cancelada'}
                          </span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant truncate">
                          {trip.origemNome} ⇄ {trip.destinoNome}
                        </p>
                      </div>

                      <strong className="text-emerald-700 font-extrabold text-xs shrink-0">
                        {trip.valorKz} Kz
                      </strong>
                    </div>

                    <div className="p-2 rounded-xl bg-surface-container-low text-[11px] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Passageiro:</span>
                        <span className="text-primary font-bold">
                          {trip.passageiroNome} ({trip.passageiroTelefone})
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Motorista / Táxi:</span>
                        <span className="text-primary">
                          {trip.motoristaNome} • {trip.matricula}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Horário:</span>
                        <span className="text-primary">
                          Início {trip.horaInicio} {trip.horaFim ? `• Término ${trip.horaFim}` : ''}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Pagamento:</span>
                        <span className="text-primary">
                          {trip.metodoPagamento} ({trip.statusPagamento})
                        </span>
                      </div>
                    </div>

                    {trip.ocorrenciaAssociada && (
                      <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[10px] space-y-0.5">
                        <div className="flex items-center gap-1 font-bold">
                          <span className="material-symbols-outlined text-[14px]">warning</span>
                          <span>Ocorrência Vinculada:</span>
                        </div>
                        <p>{trip.ocorrenciaAssociada}</p>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* ABA 6: PAGAMENTOS (DINHEIRO, TRANSFERÊNCIA & DIGITAL COM GATEWAY)     */}
        {/* ===================================================================== */}
        {activeAdminTab === 'payments' && (
          <div className="space-y-3">
            {/* Aviso de Segurança de Pagamento Digital */}
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <span className="material-symbols-outlined text-[16px]">verified_user</span>
                <span>Regra de Auditoria Financeira:</span>
              </div>
              <p>
                Nenhum pagamento digital é marcado como liquidado sem a reconciliação automática ou confirmação expressa do prestador interbancário (EMIS / Multicaixa Express).
              </p>
            </div>

            {/* Filtros de Métodos */}
            <div className="flex gap-1 overflow-x-auto scrollbar-none">
              {['todos', 'Dinheiro', 'Transferência Multicaixa', 'Pagamento Digital'].map((m) => (
                <button
                  key={m}
                  onClick={() => setPaymentFilterMethod(m)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                    paymentFilterMethod === m
                      ? 'bg-secondary text-on-secondary'
                      : 'bg-surface-container-low text-on-surface-variant'
                  }`}
                >
                  {m === 'todos' ? 'Todos os Métodos' : m}
                </button>
              ))}
            </div>

            {/* Lista de Pagamentos Registados */}
            <div className="space-y-2">
              {payments
                .filter((p) => paymentFilterMethod === 'todos' || p.metodo === paymentFilterMethod)
                .map((pay) => (
                  <div
                    key={pay.id}
                    className="p-3 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="font-mono text-[10px] text-on-surface-variant block">{pay.referencia}</span>
                        <h4 className="font-bold text-xs text-primary">{pay.descricao}</h4>
                      </div>
                      <strong className="text-emerald-700 font-extrabold text-sm shrink-0">
                        {pay.valorKz} Kz
                      </strong>
                    </div>

                    <div className="p-2 rounded-xl bg-surface-container-low text-[11px] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Método:</span>
                        <strong className="text-primary">{pay.metodo}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Passageiro:</span>
                        <span className="text-primary">{pay.passageiroNome}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Motorista:</span>
                        <span className="text-primary">{pay.motoristaNome}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Data & Hora:</span>
                        <span className="text-primary">{pay.dataHora}</span>
                      </div>
                      <div className="flex justify-between items-center pt-0.5">
                        <span className="text-on-surface-variant">Estado:</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            pay.estado === 'Confirmado'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800 animate-pulse'
                          }`}
                        >
                          {pay.estado} ({pay.prestadorConfirmado ? 'Conciliado' : 'Aguardando Prestador'})
                        </span>
                      </div>
                    </div>

                    {/* Botão de Verificação para Pagamentos Digitais Pendentes */}
                    {!pay.prestadorConfirmado && (
                      <div className="pt-1 flex justify-end">
                        <button
                          onClick={() => handleVerifyDigitalPayment(pay)}
                          disabled={isVerifyingWithProvider}
                          className="py-1.5 px-3 rounded-lg bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 active:scale-95 disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[15px]">sync_saved_locally</span>
                          <span>Consultar Prestador Multicaixa</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* ABA: GESTÃO AVANÇADA DE FISCAIS                                       */}
        {/* ===================================================================== */}
        {activeAdminTab === 'fiscais-mgmt' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xs text-primary">Módulo de Registo e Gestão de Fiscais</h3>
                  <p className="text-[11px] text-on-surface-variant">
                    Controlo centralizado de fiscais, credenciais seguras, atribuição de praças e histórico de auditoria.
                  </p>
                </div>
                <button
                  onClick={handleOpenCreateFiscal}
                  className="py-2 px-3 rounded-xl bg-primary text-on-primary text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">person_add</span>
                  <span>Novo Fiscal</span>
                </button>
              </div>

              {/* Lista de Fiscais */}
              <div className="space-y-2 pt-2">
                {fiscais.map((f) => (
                  <div key={f.id} className="p-3 rounded-xl bg-surface-container-low border border-surface-container space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <img
                          src={f.fotoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
                          alt={f.nome}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-xs text-slate-900">{f.nome}</h4>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 font-bold">
                              {f.associacao}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 block">
                            ID Funcional: <strong className="text-slate-700">{f.identificacaoFuncional}</strong> • Turno: {f.turno}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            f.status === 'ativo'
                              ? 'bg-emerald-100 text-emerald-800'
                              : f.status === 'suspenso'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {f.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2 rounded-lg border border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Contacto:</span>
                        <strong className="text-slate-700">{f.contacto}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Praça Atribuída:</span>
                        <strong className="text-slate-700">{f.pracaAtribuidaNome}</strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 gap-1 flex-wrap">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedFiscalForMgmt(f);
                            setFiscalModalMode('details');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface text-[11px] font-bold flex items-center gap-1 hover:bg-surface-container-high"
                        >
                          <span className="material-symbols-outlined text-[14px]">visibility</span>
                          <span>Detalhes & Auditoria</span>
                        </button>
                        <button
                          onClick={() => handleOpenEditFiscal(f)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 text-[11px] font-bold flex items-center gap-1 hover:bg-blue-100"
                        >
                          <span className="material-symbols-outlined text-[14px]">edit</span>
                          <span>Editar</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        {f.status !== 'ativo' && (
                          <button
                            onClick={() => handleUpdateFiscalStatusMgmt(f.id, 'ativo')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[14px]">check_circle</span>
                            <span>Activar</span>
                          </button>
                        )}
                        {f.status !== 'suspenso' && (
                          <button
                            onClick={() => handleUpdateFiscalStatusMgmt(f.id, 'suspenso')}
                            className="px-2.5 py-1 rounded-lg bg-amber-600 text-white text-[11px] font-bold flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[14px]">pause_circle</span>
                            <span>Suspender</span>
                          </button>
                        )}
                        {f.status !== 'desativado' && (
                          <button
                            onClick={() => handleUpdateFiscalStatusMgmt(f.id, 'desativado')}
                            className="px-2.5 py-1 rounded-lg bg-rose-700 text-white text-[11px] font-bold flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[14px]">block</span>
                            <span>Desactivar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* ABA 7: RELATÓRIOS OFICIAIS & EXPORTAÇÃO PDF / EXCEL                   */}
        {/* ===================================================================== */}
        {activeAdminTab === 'reports' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xs space-y-2">
              <h3 className="font-bold text-xs text-primary">Emissão de Relatórios Oficiais de Supervisão</h3>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                Gere e transfira relatórios executivos homologados para apresentação à ANATA, Associação dos Taxistas de Luanda (ATL) e Direção Provincial dos Transportes:
              </p>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => handleExport('excel')}
                  className="py-3 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
                >
                  <span className="material-symbols-outlined text-[22px]">table_view</span>
                  <span>Baixar Excel (.xlsx)</span>
                  <span className="text-[9px] opacity-80">Com todas as folhas</span>
                </button>

                <button
                  onClick={() => handleExport('pdf')}
                  className="py-3 px-3 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
                >
                  <span className="material-symbols-outlined text-[22px]">picture_as_pdf</span>
                  <span>Baixar PDF Timbrado</span>
                  <span className="text-[9px] opacity-80">Formato oficial A4</span>
                </button>
              </div>
            </div>

            {/* Relatórios Segmentados por Módulo */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-primary block">Exportações Específicas por Módulo:</span>
              {[
                { id: 'motoristas', title: 'Relatório de Homologação de Motoristas', desc: 'Cartas de condução, viaturas e conformidade cadastral.', icon: 'badge' },
                { id: 'viagens', title: 'Relatório de Viagens e Taxa de Cumprimento', desc: 'Histórico de corridas, origens, destinos e cancelamentos.', icon: 'route' },
                { id: 'filas', title: 'Relatório de Filas e Tempos de Espera', desc: 'Desempenho por praça, ausências e intervenções de fiscais.', icon: 'format_list_numbered' },
                { id: 'pagamentos', title: 'Relatório Financeiro & Emolumentos (Kz)', desc: 'Totais por Multicaixa Express, numerário e carteira digital.', icon: 'payments' },
                { id: 'ocorrencias', title: 'Relatório de Ocorrências e Infrações', desc: 'Encurtamentos de rota denunciados e medidas tomadas.', icon: 'report_problem' },
              ].map((rep) => (
                <div
                  key={rep.id}
                  className="p-3 rounded-2xl bg-surface-container-lowest border border-surface-container flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-surface-container text-primary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[18px]">{rep.icon}</span>
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-primary truncate">{rep.title}</h4>
                      <p className="text-[10px] text-on-surface-variant truncate">{rep.desc}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleExport('excel', rep.id)}
                      className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200"
                    >
                      XLS
                    </button>
                    <button
                      onClick={() => handleExport('pdf', rep.id)}
                      className="p-1.5 rounded-lg bg-rose-50 text-rose-800 text-[10px] font-bold border border-rose-200"
                    >
                      PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* MODAL: DOSSIÊ DOCUMENTAL COMPLETO DO MOTORISTA                       */}
      {/* ===================================================================== */}
      {selectedDriverDocs && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-3xl p-4 sm:p-5 shadow-2xl max-h-[92vh] overflow-y-auto space-y-4">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between border-b border-surface-container pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">badge</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-primary">Dossiê Documental do Motorista</h3>
                  <p className="text-[11px] text-on-surface-variant font-medium">
                    {selectedDriverDocs.nomeCompleto} • <span className="font-mono">{selectedDriverDocs.matricula}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDriverDocs(null)}
                className="w-8 h-8 rounded-full bg-surface-container text-primary flex items-center justify-center hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Perfil & Viatura - Fotografias Oficiais */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
                1. Fotografias do Candidato & Viatura:
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                {/* Foto do Motorista */}
                <div
                  onClick={() =>
                    setZoomedDoc({
                      title: `Fotografia de Perfil: ${selectedDriverDocs.nomeCompleto}`,
                      url: selectedDriverDocs.fotoUrl || DEFAULT_DRIVER_PHOTO,
                    })
                  }
                  className="p-2.5 bg-surface-container-low rounded-2xl border border-surface-container flex flex-col items-center text-center cursor-pointer hover:border-primary transition-all group shadow-2xs"
                >
                  <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-primary shadow-xs mb-1.5 bg-surface-container">
                    <img
                      src={selectedDriverDocs.fotoUrl || DEFAULT_DRIVER_PHOTO}
                      alt={selectedDriverDocs.nomeCompleto}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="material-symbols-outlined text-white text-[18px]">zoom_in</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-primary">Foto do Motorista</span>
                  <span className="text-[9px] text-secondary font-medium">Toque para ampliar</span>
                </div>

                {/* Foto da Viatura */}
                <div
                  onClick={() =>
                    setZoomedDoc({
                      title: `Viatura Registada (${selectedDriverDocs.matricula})`,
                      url: selectedDriverDocs.fotoViatura || DEFAULT_TAXI_IMAGE,
                    })
                  }
                  className="p-2.5 bg-surface-container-low rounded-2xl border border-surface-container flex flex-col items-center text-center cursor-pointer hover:border-primary transition-all group shadow-2xs"
                >
                  <div className="relative w-full h-20 rounded-xl overflow-hidden border border-surface-container shadow-xs mb-1.5 bg-surface-container">
                    <img
                      src={selectedDriverDocs.fotoViatura || DEFAULT_TAXI_IMAGE}
                      alt="Viatura"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="material-symbols-outlined text-white text-[18px]">zoom_in</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-primary">Viatura ({selectedDriverDocs.matricula})</span>
                  <span className="text-[9px] text-secondary font-medium">Toque para ampliar</span>
                </div>
              </div>
            </div>

            {/* Documentos Obrigatórios Submetidos */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
                2. Documentos de Habilitação & Identificação:
              </span>

              {/* Carta de Condução (Frente e Verso) */}
              <div className="p-3 rounded-2xl bg-surface-container-low border border-surface-container space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-primary">credit_card</span>
                    Carta de Condução (N.º {selectedDriverDocs.numeroCarta})
                  </span>
                  <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md font-bold">
                    Profissional / 15L
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Frente */}
                  <div>
                    <span className="text-[10px] text-on-surface-variant font-medium block mb-1">Frente da Carta</span>
                    {(() => {
                      const doc = resolveDocUrl(selectedDriverDocs.documentos.cartaFrente, DOC_CARTA_SVG);
                      if (doc.isPdf) {
                        return (
                          <div
                            onClick={() => setZoomedDoc({ title: 'Carta de Condução (Frente - PDF)', url: doc.url, isPdf: true })}
                            className="w-full h-24 rounded-xl border border-rose-200 bg-rose-50 flex flex-col items-center justify-center text-rose-700 cursor-pointer hover:bg-rose-100 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[28px]">picture_as_pdf</span>
                            <span className="text-[10px] font-bold">Ficheiro PDF</span>
                            <span className="text-[9px] text-rose-600 underline">Visualizar</span>
                          </div>
                        );
                      }
                      return (
                        <div
                          onClick={() => setZoomedDoc({ title: 'Carta de Condução (Frente)', url: doc.url })}
                          className="relative w-full h-24 rounded-xl overflow-hidden border border-surface-container cursor-pointer group bg-surface-container"
                        >
                          <img src={doc.url} alt="Carta Frente" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="material-symbols-outlined text-white text-[18px]">zoom_in</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Verso */}
                  <div>
                    <span className="text-[10px] text-on-surface-variant font-medium block mb-1">Verso da Carta</span>
                    {(() => {
                      const doc = resolveDocUrl(selectedDriverDocs.documentos.cartaVerso, DOC_CARTA_SVG);
                      if (doc.isPdf) {
                        return (
                          <div
                            onClick={() => setZoomedDoc({ title: 'Carta de Condução (Verso - PDF)', url: doc.url, isPdf: true })}
                            className="w-full h-24 rounded-xl border border-rose-200 bg-rose-50 flex flex-col items-center justify-center text-rose-700 cursor-pointer hover:bg-rose-100 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[28px]">picture_as_pdf</span>
                            <span className="text-[10px] font-bold">Ficheiro PDF</span>
                            <span className="text-[9px] text-rose-600 underline">Visualizar</span>
                          </div>
                        );
                      }
                      return (
                        <div
                          onClick={() => setZoomedDoc({ title: 'Carta de Condução (Verso)', url: doc.url })}
                          className="relative w-full h-24 rounded-xl overflow-hidden border border-surface-container cursor-pointer group bg-surface-container"
                        >
                          <img src={doc.url} alt="Carta Verso" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="material-symbols-outlined text-white text-[18px]">zoom_in</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Bilhete de Identidade (Frente e Verso / PDF) */}
              <div className="p-3 rounded-2xl bg-surface-container-low border border-surface-container space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-primary">badge</span>
                    Bilhete de Identidade (N.º {selectedDriverDocs.numeroBi})
                  </span>
                  <span className="text-[10px] text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md font-bold">
                    Registo Civil
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* BI Frente */}
                  <div>
                    <span className="text-[10px] text-on-surface-variant font-medium block mb-1">B.I. (Frente)</span>
                    {(() => {
                      const doc = resolveDocUrl(selectedDriverDocs.documentos.biFrente, DOC_BI_SVG);
                      if (doc.isPdf) {
                        return (
                          <div
                            onClick={() => setZoomedDoc({ title: 'Bilhete de Identidade (Frente - PDF)', url: doc.url, isPdf: true })}
                            className="w-full h-24 rounded-xl border border-rose-200 bg-rose-50 flex flex-col items-center justify-center text-rose-700 cursor-pointer hover:bg-rose-100 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[28px]">picture_as_pdf</span>
                            <span className="text-[10px] font-bold">Ficheiro PDF</span>
                            <span className="text-[9px] text-rose-600 underline">Visualizar</span>
                          </div>
                        );
                      }
                      return (
                        <div
                          onClick={() => setZoomedDoc({ title: 'Bilhete de Identidade (Frente)', url: doc.url })}
                          className="relative w-full h-24 rounded-xl overflow-hidden border border-surface-container cursor-pointer group bg-surface-container"
                        >
                          <img src={doc.url} alt="BI Frente" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="material-symbols-outlined text-white text-[18px]">zoom_in</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* BI Verso */}
                  <div>
                    <span className="text-[10px] text-on-surface-variant font-medium block mb-1">B.I. (Verso)</span>
                    {(() => {
                      const doc = resolveDocUrl(selectedDriverDocs.documentos.biVerso, DOC_BI_SVG);
                      if (doc.isPdf) {
                        return (
                          <div
                            onClick={() => setZoomedDoc({ title: 'Bilhete de Identidade (Verso - PDF)', url: doc.url, isPdf: true })}
                            className="w-full h-24 rounded-xl border border-rose-200 bg-rose-50 flex flex-col items-center justify-center text-rose-700 cursor-pointer hover:bg-rose-100 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[28px]">picture_as_pdf</span>
                            <span className="text-[10px] font-bold">Ficheiro PDF</span>
                            <span className="text-[9px] text-rose-600 underline">Visualizar</span>
                          </div>
                        );
                      }
                      return (
                        <div
                          onClick={() => setZoomedDoc({ title: 'Bilhete de Identidade (Verso)', url: doc.url })}
                          className="relative w-full h-24 rounded-xl overflow-hidden border border-surface-container cursor-pointer group bg-surface-container"
                        >
                          <img src={doc.url} alt="BI Verso" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="material-symbols-outlined text-white text-[18px]">zoom_in</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Livrete & Inspecção da Viatura */}
              <div className="p-3 rounded-2xl bg-surface-container-low border border-surface-container space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-primary">description</span>
                    Livrete & Inspecção da Viatura ({selectedDriverDocs.matricula})
                  </span>
                  <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md font-bold">
                    DNVT Luanda
                  </span>
                </div>
                {(() => {
                  const doc = resolveDocUrl(selectedDriverDocs.documentos.livrete, DOC_LIVRETE_SVG);
                  return (
                    <div
                      onClick={() => setZoomedDoc({ title: `Livrete da Viatura (${selectedDriverDocs.matricula})`, url: doc.url })}
                      className="relative w-full h-28 rounded-xl overflow-hidden border border-surface-container cursor-pointer group bg-surface-container"
                    >
                      <img src={doc.url} alt="Livrete" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="material-symbols-outlined text-white text-[18px]">zoom_in</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Informações Cadastrais Resumidas */}
            <div className="p-3 rounded-2xl bg-surface-container-low text-xs space-y-1.5 border border-surface-container">
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider block mb-1">
                3. Dados Operacionais & Regulamentares:
              </span>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">B.I. Número:</span>
                  <strong className="text-primary font-mono">{selectedDriverDocs.numeroBi}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Carta Número:</span>
                  <strong className="text-primary font-mono">{selectedDriverDocs.numeroCarta}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Viatura:</span>
                  <strong className="text-primary font-mono">{selectedDriverDocs.matricula}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Categoria:</span>
                  <span className="text-primary font-semibold">{selectedDriverDocs.modeloViatura || 'Toyota Hiace 15L'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Associação:</span>
                  <strong className="text-primary">{selectedDriverDocs.associacao}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Cotas Sindicais:</span>
                  <span className="text-emerald-700 font-bold">Pagas & Regulares</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Rota Pretendida:</span>
                  <span className="text-primary font-semibold truncate max-w-[100px]">{selectedDriverDocs.rotaDestino || 'Benfica'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Estado Atual:</span>
                  <span className={`font-bold uppercase text-[10px] ${
                    selectedDriverDocs.statusConta === 'aprovado'
                      ? 'text-emerald-700'
                      : selectedDriverDocs.statusConta === 'pendente'
                      ? 'text-amber-700'
                      : 'text-rose-700'
                  }`}>
                    {selectedDriverDocs.statusConta}
                  </span>
                </div>
              </div>
            </div>

            {/* Ações do Administrador */}
            <div className="space-y-2 pt-1 border-t border-surface-container">
              {selectedDriverDocs.statusConta === 'pendente' ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleApproveDriver(selectedDriverDocs.id);
                      setSelectedDriverDocs(null);
                    }}
                    className="py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-transform"
                  >
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    <span>Homologar Motorista</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleRejectDriver(selectedDriverDocs.id);
                      setSelectedDriverDocs(null);
                    }}
                    className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                  >
                    <span className="material-symbols-outlined text-[16px]">cancel</span>
                    <span>Rejeitar Registo</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleToggleSuspendDriver(selectedDriverDocs.id);
                      setSelectedDriverDocs(null);
                    }}
                    className={`flex-1 py-2.5 px-3 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedDriverDocs.statusConta === 'suspenso'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {selectedDriverDocs.statusConta === 'suspenso' ? 'lock_open' : 'block'}
                    </span>
                    <span>{selectedDriverDocs.statusConta === 'suspenso' ? 'Reactivar Motorista' : 'Suspender Operações'}</span>
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setSelectedDriverDocs(null)}
                className="w-full py-2 bg-surface-container hover:bg-surface-container-high text-primary font-bold text-xs rounded-xl cursor-pointer transition-colors"
              >
                Fechar Dossiê
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Zoom / Inspeção Ampliada do Documento */}
      {zoomedDoc && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-3xl p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-surface-container pb-2">
              <h4 className="font-bold text-xs text-primary truncate max-w-[280px]">{zoomedDoc.title}</h4>
              <button
                onClick={() => setZoomedDoc(null)}
                className="w-7 h-7 rounded-full bg-surface-container text-primary flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            <div className="w-full h-72 rounded-2xl overflow-hidden bg-slate-900 border border-surface-container flex items-center justify-center">
              {zoomedDoc.isPdf ? (
                <div className="text-center p-4 text-white space-y-2">
                  <span className="material-symbols-outlined text-[48px] text-rose-500">picture_as_pdf</span>
                  <p className="text-xs font-bold">{zoomedDoc.title}</p>
                  <a
                    href={zoomedDoc.url}
                    download="documento_motorista.pdf"
                    className="inline-block px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    Descarregar / Abrir PDF
                  </a>
                </div>
              ) : (
                <img src={zoomedDoc.url} alt={zoomedDoc.title} className="w-full h-full object-contain" />
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setZoomedDoc(null)}
                className="px-4 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl cursor-pointer"
              >
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: INTERVENÇÃO EXCEPCIONAL COM JUSTIFICATIVA OBRIGATÓRIA         */}
      {/* ===================================================================== */}
      {interventionModalQueueItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-3xl p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-surface-container pb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-amber-700">gavel</span>
                <h3 className="font-bold text-sm text-primary">Intervenção Excepcional na Fila</h3>
              </div>
              <button
                onClick={() => setInterventionModalQueueItem(null)}
                className="w-8 h-8 rounded-full bg-surface-container text-primary flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-2.5 rounded-xl bg-surface-container-low text-xs space-y-1">
              <p>
                Alvo da Intervenção: <strong className="text-primary">{interventionModalQueueItem.motoristaNome}</strong>
              </p>
              <p className="text-on-surface-variant">
                Matrícula: {interventionModalQueueItem.matricula} • Posição Atual: #{interventionModalQueueItem.posicao}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-primary block">Tipo de Intervenção:</label>
              <select
                value={interventionType}
                onChange={(e) => setInterventionType(e.target.value as any)}
                className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-xs font-bold text-primary focus:outline-none border border-surface-container"
              >
                <option value="Prioridade Mecânica">Prioridade Mecânica (Avaria sanada no posto oficial)</option>
                <option value="Reordenar Fila">Reordenar Fila (Ajuste de horário de pico)</option>
                <option value="Retirar por Ausência">Retirar por Ausência da Baia</option>
                <option value="Chamada de Urgência">Chamada de Urgência (Socorro de passageiros)</option>
                <option value="Despacho Cautelar">Despacho Cautelar (Suspensão temporária)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-primary block">
                Justificação Oficial Obrigatória: <span className="text-rose-600">*</span>
              </label>
              <textarea
                value={interventionJustification}
                onChange={(e) => setInterventionJustification(e.target.value)}
                placeholder="Indique com clareza o motivo da alteração da ordem da fila (ex: ordem da ANATA nº 12, pneu substituído com comprovativo do fiscal)..."
                rows={3}
                className="w-full p-2.5 rounded-xl bg-surface-container-low text-xs text-primary focus:outline-none border border-surface-container resize-none"
              />
              <span className="text-[10px] text-on-surface-variant block">
                Este registo será auditado e disponibilizado aos fiscais e sindicatos.
              </span>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleExecuteIntervention}
                className="flex-1 py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-xl"
              >
                Confirmar Intervenção
              </button>
              <button
                onClick={() => setInterventionModalQueueItem(null)}
                className="px-3 py-2 bg-surface-container text-primary font-bold text-xs rounded-xl"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: CRIAR NOVO FISCAL DIRETO NO SMARTPHONE                        */}
      {/* ===================================================================== */}
      {newFiscalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
          <form
            onSubmit={handleCreateFiscal}
            className="bg-surface-container-lowest w-full max-w-md rounded-3xl p-4 shadow-2xl space-y-3"
          >
            <div className="flex items-center justify-between border-b border-surface-container pb-2">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[20px] text-secondary">badge</span>
                <h3 className="font-bold text-sm text-primary">Credenciar Novo Fiscal de Praça</h3>
              </div>
              <button
                type="button"
                onClick={() => setNewFiscalModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container text-primary flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="font-bold text-primary block mb-0.5">Nome Completo do Fiscal:</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Lourenço Kwanza"
                  value={newFiscalForm.nome}
                  onChange={(e) => setNewFiscalForm({ ...newFiscalForm, nome: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-primary block mb-0.5">Contacto Telefónico:</label>
                  <input
                    type="text"
                    required
                    value={newFiscalForm.contacto}
                    onChange={(e) => setNewFiscalForm({ ...newFiscalForm, contacto: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-primary block mb-0.5">Associação Sindical:</label>
                  <select
                    value={newFiscalForm.associacao}
                    onChange={(e) => setNewFiscalForm({ ...newFiscalForm, associacao: e.target.value as any })}
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container focus:outline-none"
                  >
                    <option value="ANATA">ANATA (Associação de Táxis)</option>
                    <option value="ATL">ATL (Associação dos Taxistas)</option>
                    <option value="GPL">GPL (Governo de Luanda)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-primary block mb-0.5">Praça Atribuída Inicial:</label>
                <select
                  value={newFiscalForm.pracaAtribuidaId}
                  onChange={(e) => setNewFiscalForm({ ...newFiscalForm, pracaAtribuidaId: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container focus:outline-none"
                >
                  {pracas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.corridor})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-primary block mb-0.5">Turno Operacional:</label>
                <select
                  value={newFiscalForm.turno}
                  onChange={(e) => setNewFiscalForm({ ...newFiscalForm, turno: e.target.value as any })}
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container focus:outline-none"
                >
                  <option value="Manhã (05:30 - 13:30)">Manhã (05:30 - 13:30)</option>
                  <option value="Tarde (13:30 - 21:30)">Tarde (13:30 - 21:30)</option>
                  <option value="Integral">Integral (Manhã + Tarde)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl active:scale-95 transition-transform"
              >
                Emitir Credencial & Salvar
              </button>
              <button
                type="button"
                onClick={() => setNewFiscalModalOpen(false)}
                className="px-3 py-2 bg-surface-container text-primary font-bold text-xs rounded-xl"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: CRIAR NOVA PRAÇA                                              */}
      {/* ===================================================================== */}
      {newPracaModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
          <form
            onSubmit={handleCreatePraca}
            className="bg-surface-container-lowest w-full max-w-md rounded-3xl p-4 shadow-2xl space-y-3"
          >
            <div className="flex items-center justify-between border-b border-surface-container pb-2">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[20px] text-primary">add_location_alt</span>
                <h3 className="font-bold text-sm text-primary">Registar Nova Praça Oficial</h3>
              </div>
              <button
                type="button"
                onClick={() => setNewPracaModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container text-primary flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="font-bold text-primary block mb-0.5">Nome da Praça:</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Praça do Cacuaco"
                  value={newPracaForm.name}
                  onChange={(e) => setNewPracaForm({ ...newPracaForm, name: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-primary block mb-0.5">Município:</label>
                  <input
                    type="text"
                    required
                    value={newPracaForm.municipio}
                    onChange={(e) => setNewPracaForm({ ...newPracaForm, municipio: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-primary block mb-0.5">Capacidade de Carrinhas:</label>
                  <input
                    type="number"
                    min={5}
                    value={newPracaForm.capacidadeTotal}
                    onChange={(e) => setNewPracaForm({ ...newPracaForm, capacidadeTotal: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-primary block mb-0.5">Corredor Viário:</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Estrada Direita de Cacuaco / EN 100"
                  value={newPracaForm.corridor}
                  onChange={(e) => setNewPracaForm({ ...newPracaForm, corridor: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-primary block mb-0.5">Latitude:</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newPracaForm.lat}
                    onChange={(e) => setNewPracaForm({ ...newPracaForm, lat: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-primary block mb-0.5">Longitude:</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newPracaForm.lng}
                    onChange={(e) => setNewPracaForm({ ...newPracaForm, lng: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl active:scale-95 transition-transform"
              >
                Criar Praça
              </button>
              <button
                type="button"
                onClick={() => setNewPracaModalOpen(false)}
                className="px-3 py-2 bg-surface-container text-primary font-bold text-xs rounded-xl"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: CRIAR NOVA ROTA & DEFINIR TARIFA                              */}
      {/* ===================================================================== */}
      {newRouteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
          <form
            onSubmit={handleCreateRoute}
            className="bg-surface-container-lowest w-full max-w-md rounded-3xl p-4 shadow-2xl space-y-3"
          >
            <div className="flex items-center justify-between border-b border-surface-container pb-2">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[20px] text-primary">alt_route</span>
                <h3 className="font-bold text-sm text-primary">Criar Rota & Tarifa Oficial</h3>
              </div>
              <button
                type="button"
                onClick={() => setNewRouteModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container text-primary flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="font-bold text-primary block mb-0.5">Praça de Origem:</label>
                <select
                  value={newRouteForm.origemId}
                  onChange={(e) => setNewRouteForm({ ...newRouteForm, origemId: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container focus:outline-none"
                >
                  {pracas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-primary block mb-0.5">Praça ou Terminal de Destino:</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Praça de Cacuaco"
                  value={newRouteForm.destinoNome}
                  onChange={(e) => setNewRouteForm({ ...newRouteForm, destinoNome: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-primary block mb-0.5">Tarifa Regulada (Kz):</label>
                  <input
                    type="number"
                    min={50}
                    step={50}
                    required
                    value={newRouteForm.tarifaKz}
                    onChange={(e) => setNewRouteForm({ ...newRouteForm, tarifaKz: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-primary block mb-0.5">Tipo de Transporte:</label>
                  <select
                    value={newRouteForm.tipoTransporte}
                    onChange={(e) => setNewRouteForm({ ...newRouteForm, tipoTransporte: e.target.value as any })}
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container focus:outline-none"
                  >
                    <option value="Carrinha 15L (Azul/Branco)">Carrinha 15L (Azul/Branco)</option>
                    <option value="Express Direto (15L)">Express Direto (15L)</option>
                    <option value="Autocarro Urbano (TCUL)">Autocarro Urbano (TCUL)</option>
                    <option value="Carro de Praça (4L)">Carro de Praça (4L)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-primary block mb-0.5">Distância (km):</label>
                  <input
                    type="number"
                    value={newRouteForm.distanciaKm}
                    onChange={(e) => setNewRouteForm({ ...newRouteForm, distanciaKm: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-primary block mb-0.5">Tempo Estimado (min):</label>
                  <input
                    type="number"
                    value={newRouteForm.tempoEstimadoMin}
                    onChange={(e) => setNewRouteForm({ ...newRouteForm, tempoEstimadoMin: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl active:scale-95 transition-transform"
              >
                Registar Rota
              </button>
              <button
                type="button"
                onClick={() => setNewRouteModalOpen(false)}
                className="px-3 py-2 bg-surface-container text-primary font-bold text-xs rounded-xl"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL DE GESTÃO AVANÇADA DE FISCAIS (NOVO / EDITAR / DETALHES)         */}
      {/* ===================================================================== */}
      {fiscalModalMode && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">
                  {fiscalModalMode === 'details' ? 'badge' : 'admin_panel_settings'}
                </span>
                <h3 className="font-bold text-sm text-primary">
                  {fiscalModalMode === 'create'
                    ? 'Registar Novo Fiscal (Administração)'
                    : fiscalModalMode === 'edit'
                    ? 'Editar Dados e Atribuições do Fiscal'
                    : 'Detalhes, Permissões & Auditoria do Fiscal'}
                </h3>
              </div>
              <button
                onClick={() => setFiscalModalMode(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {fiscalModalMode === 'details' && selectedFiscalForMgmt ? (
              <div className="space-y-4 text-xs">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <img
                    src={selectedFiscalForMgmt.fotoUrl}
                    alt={selectedFiscalForMgmt.nome}
                    className="w-14 h-14 rounded-full object-cover border-2 border-primary"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{selectedFiscalForMgmt.nome}</h4>
                    <span className="text-slate-500 block">ID: {selectedFiscalForMgmt.identificacaoFuncional} • Nº Func: {selectedFiscalForMgmt.numeroFuncionario || 'F-001'}</span>
                    <span className="text-slate-500 block">Associação: {selectedFiscalForMgmt.associacao} • Turno: {selectedFiscalForMgmt.turno}</span>
                    <span className="text-slate-700 font-bold block mt-0.5">B.I. Nº: {selectedFiscalForMgmt.biNumero || 'Não especificado'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200">
                    <span className="text-blue-900 font-bold block">Contacto:</span>
                    <span className="text-blue-950">{selectedFiscalForMgmt.contacto}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                    <span className="text-emerald-900 font-bold block">Praça Atribuída:</span>
                    <span className="text-emerald-950">{selectedFiscalForMgmt.pracaAtribuidaNome}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="font-bold text-slate-900 block">Documento de Identificação (B.I. Frente e Verso):</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-1">Frente do B.I.</span>
                      {selectedFiscalForMgmt.biFotoFrente?.startsWith('data:application/pdf') ? (
                        <div className="w-full h-24 rounded-xl border border-rose-200 bg-rose-50 flex flex-col items-center justify-center text-rose-700">
                          <span className="material-symbols-outlined text-[30px]">picture_as_pdf</span>
                          <span className="text-[10px] font-bold">Ficheiro PDF Anexado</span>
                        </div>
                      ) : (
                        <img
                          src={selectedFiscalForMgmt.biFotoFrente || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&auto=format&fit=crop&q=80'}
                          alt="BI Frente"
                          className="w-full h-24 object-cover rounded-xl border border-slate-200"
                        />
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-1">Verso do B.I.</span>
                      {selectedFiscalForMgmt.biFotoVerso?.startsWith('data:application/pdf') ? (
                        <div className="w-full h-24 rounded-xl border border-rose-200 bg-rose-50 flex flex-col items-center justify-center text-rose-700">
                          <span className="material-symbols-outlined text-[30px]">picture_as_pdf</span>
                          <span className="text-[10px] font-bold">Ficheiro PDF Anexado</span>
                        </div>
                      ) : (
                        <img
                          src={selectedFiscalForMgmt.biFotoVerso || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80'}
                          alt="BI Verso"
                          className="w-full h-24 object-cover rounded-xl border border-slate-200"
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <span className="font-bold text-slate-900 block">Permissões Específicas na Praça:</span>
                  <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-700">
                    <div>✓ Validação Presencial: {selectedFiscalForMgmt.permissoes.validacaoPresencial ? 'Sim' : 'Não'}</div>
                    <div>✓ Gestão de Baia: {selectedFiscalForMgmt.permissoes.gestaoBaia ? 'Sim' : 'Não'}</div>
                    <div>✓ Registo Ocorrências: {selectedFiscalForMgmt.permissoes.registoOcorrencias ? 'Sim' : 'Não'}</div>
                    <div>✓ Correções de Fila: {selectedFiscalForMgmt.permissoes.correcoesFila ? 'Sim' : 'Não'}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="font-bold text-slate-900 block">Histórico de Auditoria da Conta:</span>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {(selectedFiscalForMgmt.auditLog || []).map((audit) => (
                      <div key={audit.id} className="p-2 rounded-lg bg-slate-100 text-[11px] space-y-0.5">
                        <div className="flex justify-between font-bold text-slate-800">
                          <span>{audit.acao}</span>
                          <span className="text-[10px] text-slate-500">{audit.data}</span>
                        </div>
                        <span className="text-slate-500 block text-[10px]">Responsável: {audit.autor}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setFiscalModalMode(null)}
                    className="w-full py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs"
                  >
                    Fechar Detalhes
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveFiscalMgmt} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-primary block mb-1">Nome Completo:</label>
                  <input
                    type="text"
                    required
                    value={fiscalMgmtForm.nome}
                    onChange={(e) => setFiscalMgmtForm({ ...fiscalMgmtForm, nome: e.target.value })}
                    placeholder="Ex: Mateus Domingos"
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-primary block mb-1">Número de Telefone:</label>
                    <input
                      type="text"
                      required
                      value={fiscalMgmtForm.contacto}
                      onChange={(e) => setFiscalMgmtForm({ ...fiscalMgmtForm, contacto: e.target.value })}
                      placeholder="+244 923..."
                      className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-primary block mb-1">Nº do BI:</label>
                    <input
                      type="text"
                      required
                      value={fiscalMgmtForm.biNumero}
                      onChange={(e) => setFiscalMgmtForm({ ...fiscalMgmtForm, biNumero: e.target.value })}
                      placeholder="Ex: 003948291LA042"
                      className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-primary block mb-1">Nº de Funcionário:</label>
                    <input
                      type="text"
                      required
                      value={fiscalMgmtForm.numeroFuncionario}
                      onChange={(e) => setFiscalMgmtForm({ ...fiscalMgmtForm, numeroFuncionario: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-primary block mb-1">Associação:</label>
                    <select
                      value={fiscalMgmtForm.associacao}
                      onChange={(e) => setFiscalMgmtForm({ ...fiscalMgmtForm, associacao: e.target.value as any })}
                      className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container focus:outline-none"
                    >
                      <option value="ANATA">ANATA</option>
                      <option value="ATL">ATL</option>
                      <option value="GPL">GPL</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-primary block mb-1">Turno de Serviço:</label>
                  <select
                    value={fiscalMgmtForm.turno}
                    onChange={(e) => setFiscalMgmtForm({ ...fiscalMgmtForm, turno: e.target.value as any })}
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container focus:outline-none"
                  >
                    <option value="Manhã (05:30 - 13:30)">Manhã (05:30 - 13:30)</option>
                    <option value="Tarde (13:30 - 21:30)">Tarde (13:30 - 21:30)</option>
                    <option value="Noite (21:30 - 05:30)">Noite (21:30 - 05:30)</option>
                    <option value="Integral">Integral</option>
                  </select>
                </div>

                <div className="space-y-3 p-3.5 rounded-2xl bg-surface-container-low border border-surface-container">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary block text-xs">
                      Fotografia e Documentos de Identificação (B.I.):
                    </span>
                    <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-emerald-200">
                      <span className="material-symbols-outlined text-[13px]">check_circle</span>
                      Anexação Manual
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Item 1: Fotografia do Fiscal */}
                    <div className="p-3 rounded-xl bg-surface border border-surface-container flex flex-col items-center text-center space-y-2 shadow-2xs">
                      <span className="text-[11px] font-bold text-on-surface block">Foto do Fiscal</span>
                      <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-primary bg-surface-container flex items-center justify-center shadow-xs">
                        {fiscalMgmtForm.fotoUrl ? (
                          <img src={fiscalMgmtForm.fotoUrl} alt="Fiscal" className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-primary text-[28px]">person</span>
                        )}
                      </div>
                      <span className="text-[10px] text-on-surface-variant font-medium truncate max-w-[120px] block" title={fiscalFileNames.foto || 'Foto Selecionada'}>
                        {fiscalFileNames.foto || (fiscalMgmtForm.fotoUrl ? 'Foto selecionada' : 'Sem foto')}
                      </span>
                      <label className="w-full py-1.5 px-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer text-[11px] font-bold transition-colors">
                        <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                        <span>{fiscalMgmtForm.fotoUrl ? 'Alterar Foto' : 'Anexar Foto'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFiscalManualFileUpload(e, 'foto')}
                        />
                      </label>
                    </div>

                    {/* Item 2: Bilhete de Identidade Frente */}
                    <div className="p-3 rounded-xl bg-surface border border-surface-container flex flex-col items-center text-center space-y-2 shadow-2xs">
                      <span className="text-[11px] font-bold text-on-surface block">B.I. (Frente)</span>
                      <div className="relative w-full h-14 rounded-lg overflow-hidden border border-surface-container bg-surface-container-low flex items-center justify-center">
                        {fiscalMgmtForm.biFotoFrente?.startsWith('data:application/pdf') ? (
                          <div className="flex flex-col items-center text-rose-600">
                            <span className="material-symbols-outlined text-[24px]">picture_as_pdf</span>
                            <span className="text-[9px] font-bold">PDF Anexado</span>
                          </div>
                        ) : fiscalMgmtForm.biFotoFrente ? (
                          <img src={fiscalMgmtForm.biFotoFrente} alt="BI Frente" className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-slate-400 text-[24px]">badge</span>
                        )}
                      </div>
                      <span className="text-[10px] text-on-surface-variant font-medium truncate max-w-[120px] block" title={fiscalFileNames.biFrente || 'Frente Anexada'}>
                        {fiscalFileNames.biFrente || (fiscalMgmtForm.biFotoFrente ? 'Frente anexada' : 'Não anexado')}
                      </span>
                      <label className="w-full py-1.5 px-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer text-[11px] font-bold transition-colors">
                        <span className="material-symbols-outlined text-[16px]">upload_file</span>
                        <span>{fiscalMgmtForm.biFotoFrente ? 'Alterar Frente' : 'Anexar Frente'}</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={(e) => handleFiscalManualFileUpload(e, 'biFrente')}
                        />
                      </label>
                    </div>

                    {/* Item 3: Bilhete de Identidade Verso */}
                    <div className="p-3 rounded-xl bg-surface border border-surface-container flex flex-col items-center text-center space-y-2 shadow-2xs">
                      <span className="text-[11px] font-bold text-on-surface block">B.I. (Verso)</span>
                      <div className="relative w-full h-14 rounded-lg overflow-hidden border border-surface-container bg-surface-container-low flex items-center justify-center">
                        {fiscalMgmtForm.biFotoVerso?.startsWith('data:application/pdf') ? (
                          <div className="flex flex-col items-center text-rose-600">
                            <span className="material-symbols-outlined text-[24px]">picture_as_pdf</span>
                            <span className="text-[9px] font-bold">PDF Anexado</span>
                          </div>
                        ) : fiscalMgmtForm.biFotoVerso ? (
                          <img src={fiscalMgmtForm.biFotoVerso} alt="BI Verso" className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-slate-400 text-[24px]">badge</span>
                        )}
                      </div>
                      <span className="text-[10px] text-on-surface-variant font-medium truncate max-w-[120px] block" title={fiscalFileNames.biVerso || 'Verso Anexado'}>
                        {fiscalFileNames.biVerso || (fiscalMgmtForm.biFotoVerso ? 'Verso anexado' : 'Não anexado')}
                      </span>
                      <label className="w-full py-1.5 px-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer text-[11px] font-bold transition-colors">
                        <span className="material-symbols-outlined text-[16px]">upload_file</span>
                        <span>{fiscalMgmtForm.biFotoVerso ? 'Alterar Verso' : 'Anexar Verso'}</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={(e) => handleFiscalManualFileUpload(e, 'biVerso')}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-primary block mb-1">Praça Principal Atribuída:</label>
                  <select
                    value={fiscalMgmtForm.pracasAtribuidas[0]}
                    onChange={(e) => setFiscalMgmtForm({ ...fiscalMgmtForm, pracasAtribuidas: [e.target.value] })}
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container focus:outline-none"
                  >
                    {pracas.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.municipio})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-primary block mb-1">Palavra-passe Inicial (Credenciais Seguras):</label>
                  <input
                    type="password"
                    value={fiscalMgmtForm.senha}
                    onChange={(e) => setFiscalMgmtForm({ ...fiscalMgmtForm, senha: e.target.value })}
                    placeholder="••••••••"
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Guardada de forma encriptada (Hash seguro).</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="font-bold text-primary block">Permissões de Acesso Mobile do Fiscal:</span>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fiscalMgmtForm.permissoes.validacaoPresencial}
                        onChange={(e) => setFiscalMgmtForm({
                          ...fiscalMgmtForm,
                          permissoes: { ...fiscalMgmtForm.permissoes, validacaoPresencial: e.target.checked }
                        })}
                        className="rounded accent-primary"
                      />
                      <span>Validação Presencial de Passageiros e Motoristas</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fiscalMgmtForm.permissoes.gestaoBaia}
                        onChange={(e) => setFiscalMgmtForm({
                          ...fiscalMgmtForm,
                          permissoes: { ...fiscalMgmtForm.permissoes, gestaoBaia: e.target.checked }
                        })}
                        className="rounded accent-primary"
                      />
                      <span>Gestão de Baias e Despacho de Táxis (15L)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fiscalMgmtForm.permissoes.registoOcorrencias}
                        onChange={(e) => setFiscalMgmtForm({
                          ...fiscalMgmtForm,
                          permissoes: { ...fiscalMgmtForm.permissoes, registoOcorrencias: e.target.checked }
                        })}
                        className="rounded accent-primary"
                      />
                      <span>Registo de Ocorrências e Infrações</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fiscalMgmtForm.permissoes.correcoesFila}
                        onChange={(e) => setFiscalMgmtForm({
                          ...fiscalMgmtForm,
                          permissoes: { ...fiscalMgmtForm.permissoes, correcoesFila: e.target.checked }
                        })}
                        className="rounded accent-primary"
                      />
                      <span>Correções Excepcionais de Fila</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl active:scale-95 transition-transform"
                  >
                    {fiscalModalMode === 'create' ? 'Concluir Registo do Fiscal' : 'Guardar Alterações'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiscalModalMode(null)}
                    className="px-4 py-2.5 bg-surface-container text-primary font-bold text-xs rounded-xl"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {/* ===================================================================== */}
      {/* MODAL: CRIAR NOVA TAXA DE TRANSPORTE (EXCLUSIVO ADMINISTRADOR)        */}
      {/* ===================================================================== */}
      {newTaxaModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
          <form
            onSubmit={handleCreateTaxa}
            className="bg-surface-container-lowest w-full max-w-md rounded-3xl p-4 shadow-2xl space-y-3"
          >
            <div className="flex items-center justify-between border-b border-surface-container pb-2">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[20px] text-emerald-700">payments</span>
                <h3 className="font-bold text-sm text-primary">Criar Nova Taxa de Transporte (Admin)</h3>
              </div>
              <button
                type="button"
                onClick={() => setNewTaxaModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container text-primary flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="font-bold text-primary block mb-0.5">Designação / Nome da Taxa (Ex: Praça Cacuaco 300kz):</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Praça Cacuaco 300kz"
                  value={newTaxaForm.nomeTaxa}
                  onChange={(e) => setNewTaxaForm({ ...newTaxaForm, nomeTaxa: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container focus:outline-none font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-primary block mb-0.5">Praça / Terminal:</label>
                  <select
                    value={newTaxaForm.pracaId}
                    onChange={(e) => setNewTaxaForm({ ...newTaxaForm, pracaId: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container focus:outline-none"
                  >
                    {pracas.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-primary block mb-0.5">Valor da Taxa (Kz):</label>
                  <input
                    type="number"
                    min={50}
                    step={50}
                    required
                    value={newTaxaForm.taxaKz}
                    onChange={(e) => setNewTaxaForm({ ...newTaxaForm, taxaKz: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container focus:outline-none font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-primary block mb-0.5">Tipo de Transporte:</label>
                <select
                  value={newTaxaForm.tipoTransporte}
                  onChange={(e) => setNewTaxaForm({ ...newTaxaForm, tipoTransporte: e.target.value as any })}
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container focus:outline-none"
                >
                  <option value="Carrinha 15L (Azul/Branco)">Carrinha 15L (Azul/Branco)</option>
                  <option value="Express Direto (15L)">Express Direto (15L)</option>
                  <option value="Autocarro Urbano (TCUL)">Autocarro Urbano (TCUL)</option>
                  <option value="Carro de Praça (4L)">Carro de Praça (4L)</option>
                </select>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                <span className="font-bold block flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                  Privilégio Exclusivo do Administrador
                </span>
                <p className="text-[10px] leading-tight">
                  Somente o Administrador da Plataforma pode criar, fixar e renomear tarifas oficiais. Esta taxa será sincronizada imediatamente com motoristas, fiscais e passageiros.
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2 bg-emerald-700 text-white font-bold text-xs rounded-xl active:scale-95 transition-transform shadow-sm"
              >
                Homologar & Criar Taxa
              </button>
              <button
                type="button"
                onClick={() => setNewTaxaModalOpen(false)}
                className="px-3 py-2 bg-surface-container text-primary font-bold text-xs rounded-xl"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: RENOMEAR E AJUSTAR TAXA DE TRANSPORTE (EXCLUSIVO ADMINISTRADOR)  */}
      {/* ===================================================================== */}
      {editingTaxaModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
          <form
            onSubmit={handleSaveRenameTaxa}
            className="bg-surface-container-lowest w-full max-w-md rounded-3xl p-4 shadow-2xl space-y-3"
          >
            <div className="flex items-center justify-between border-b border-surface-container pb-2">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[20px] text-primary">edit_note</span>
                <h3 className="font-bold text-sm text-primary">Renomear & Ajustar Taxa Oficial (Admin)</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingTaxaModal(null)}
                className="w-8 h-8 rounded-full bg-surface-container text-primary flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="font-bold text-primary block mb-0.5">Nova Designação da Taxa (Ex: Praça Cacuaco 300kz):</label>
                <input
                  type="text"
                  required
                  value={renameTaxaInput}
                  onChange={(e) => setRenameTaxaInput(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container focus:outline-none font-bold text-primary"
                />
              </div>

              <div>
                <label className="font-bold text-primary block mb-0.5">Nome da Praça ou Rota:</label>
                <input
                  type="text"
                  required
                  value={renamePracaNomeInput}
                  onChange={(e) => setRenamePracaNomeInput(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-primary block mb-0.5">Valor da Tarifa Homologada (Kz):</label>
                <input
                  type="number"
                  min={50}
                  step={50}
                  required
                  value={renameTaxaValorKz}
                  onChange={(e) => setRenameTaxaValorKz(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container focus:outline-none font-bold text-emerald-700 text-sm"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[10px] space-y-0.5">
                <div className="font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">lock</span>
                  Restrito a Controlo Administrativo
                </div>
                <p>Alterações efetuadas aqui refletem-se instantaneamente em todo o ecossistema FilaTáxi.</p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl active:scale-95 transition-transform"
              >
                Guardar Alterações da Taxa
              </button>
              <button
                type="button"
                onClick={() => setEditingTaxaModal(null)}
                className="px-3 py-2 bg-surface-container text-primary font-bold text-xs rounded-xl"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
