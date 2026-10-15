import React, { useState, useMemo, useEffect } from 'react';
import { PracaLocation, LUANDA_PRACAS } from './LiveMapView';
import {
  QueueItemRecord,
  TripRecordAdmin,
  IncidentRecord,
  PaymentRecord,
  DriverRecord,
  VehicleRecord,
} from '../types/ecosystem';

export type DriverAccountStatus = 'pendente' | 'aprovado' | 'rejeitado' | 'nao_registado' | 'suspenso';
export type DriverAvailability = 'disponivel' | 'pausa' | 'fora_servico';

export interface DriverData {
  nomeCompleto: string;
  telefone: string;
  numeroCarta: string;
  numeroBi: string;
  matricula: string;
  tipoViatura: string;
  modeloViatura: string;
  lotacaoLugares: number;
  pracaOrigemId: string;
  rotaDestino: string;
  statusConta: DriverAccountStatus;
  motivoRejeicao?: string;
  motivoSuspensao?: string;
  dataRegisto: string;
  dataAprovacao?: string;
  aprovadoPor?: string;
  validadoPresencialmente: boolean;
  fiscalValidador?: string;
  fotoPasse?: string | null;
  biFrente?: string | null;
  biVerso?: string | null;
  cartaFrente?: string | null;
  cartaVerso?: string | null;
  fotoViatura?: string | null;
  livreteViatura?: string | null;
  inspecaoTecnica?: string | null;
  seguroObrigatorio?: string | null;
}

export interface PassengerBooking {
  id: string;
  tipo: 'Fila Virtual' | 'FilaPass' | 'Embarque Direto';
  nomePassageiro: string;
  telefone: string;
  assento: number;
  codigo?: string;
  status: 'Aguardando' | 'Embarcado';
  pago: boolean;
  metodoPagamento: 'Dinheiro' | 'Digital';
}

export interface DriverAreaProps {
  userLocation: { lat: number; lng: number } | null;
  currentOriginPraca: PracaLocation;
  setCurrentOriginPraca: (praca: PracaLocation) => void;
  currentDestName: string;
  setCurrentDestName: (dest: string) => void;
  onTriggerNotice: (title: string, message: string, icon?: string) => void;
  triggerVibrate: () => void;
  onOpenSos: () => void;
  onOpenFilaPass: (praca?: PracaLocation) => void;
  onSwitchToPassenger?: () => void;
  onSwitchToInspector?: () => void;
  onSwitchToAdmin?: () => void;
  driverAccountStatus?: DriverAccountStatus;

  // Sincronia de abas com a navegação inferior (Início, Minha Fila, Histórico, Perfil)
  currentTab?: 'inicio' | 'minha-fila' | 'historico' | 'perfil';
  onTabChange?: (tab: 'inicio' | 'minha-fila' | 'historico' | 'perfil') => void;
  onLogout?: () => void;

  // Sincronia opcional com o ecossistema compartilhado
  queues?: QueueItemRecord[];
  setQueues?: React.Dispatch<React.SetStateAction<QueueItemRecord[]>>;
  trips?: TripRecordAdmin[];
  setTrips?: React.Dispatch<React.SetStateAction<TripRecordAdmin[]>>;
  incidents?: IncidentRecord[];
  setIncidents?: React.Dispatch<React.SetStateAction<IncidentRecord[]>>;
  payments?: PaymentRecord[];
  setPayments?: React.Dispatch<React.SetStateAction<PaymentRecord[]>>;
  drivers?: DriverRecord[];
  setDrivers?: React.Dispatch<React.SetStateAction<DriverRecord[]>>;
  vehicles?: VehicleRecord[];
}

export type DriverTab = 'dashboard' | 'fila' | 'viagens' | 'ocorrencias' | 'perfil' | 'registo';

export type IncidentCategory =
  | 'Acidente'
  | 'Avaria'
  | 'Pneu furado'
  | 'Trânsito'
  | 'Operação policial'
  | 'Obras'
  | 'Problema com passageiro'
  | 'Problema de pagamento'
  | 'Outra ocorrência';

const DEFAULT_TAXI_IMAGE = '/src/assets/images/angola_taxi_hiace_1791809024746.jpg';
const DEFAULT_DRIVER_PHOTO =
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80';

export function DriverArea({
  userLocation,
  currentOriginPraca,
  setCurrentOriginPraca,
  currentDestName,
  setCurrentDestName,
  onTriggerNotice,
  triggerVibrate,
  onOpenSos,
  onSwitchToPassenger,
  onSwitchToInspector,
  onSwitchToAdmin,
  driverAccountStatus = 'aprovado',
  queues,
  setQueues,
  trips,
  setTrips,
  incidents,
  setIncidents,
  payments,
  setPayments,
  drivers,
  setDrivers,
  currentTab,
  onTabChange,
  onLogout,
}: DriverAreaProps) {
  // =========================================================================
  // SUB-ABAS MÓVEIS DA ÁREA DO MOTORISTA
  // =========================================================================
  const [activeDriverTab, setActiveDriverTab] = useState<DriverTab>('dashboard');

  // Sincronizar aba ativa quando o utilizador clica na barra inferior (Início, Minha Fila, Histórico, Perfil)
  useEffect(() => {
    if (currentTab === 'perfil') {
      setActiveDriverTab('perfil');
    } else if (currentTab === 'inicio') {
      setActiveDriverTab('dashboard');
    } else if (currentTab === 'minha-fila') {
      setActiveDriverTab('fila');
    } else if (currentTab === 'historico') {
      setActiveDriverTab('viagens');
    }
  }, [currentTab]);

  const handleTabSwitch = (tab: DriverTab) => {
    triggerVibrate();
    setActiveDriverTab(tab);
    if (onTabChange) {
      if (tab === 'dashboard') onTabChange('inicio');
      else if (tab === 'fila') onTabChange('minha-fila');
      else if (tab === 'viagens') onTabChange('historico');
      else if (tab === 'perfil' || tab === 'registo') onTabChange('perfil');
    }
  };

  // Motorista ativo no ecossistema central
  const currentDriverRecord = useMemo(() => {
    return drivers?.find((d) => d.id === 'driv-01');
  }, [drivers]);

  // =========================================================================
  // ESTADOS DO MOTORISTA (JOÃO MANUEL - DRIV-01)
  // =========================================================================
  const [currentAccountStatus, setCurrentAccountStatus] = useState<DriverAccountStatus>(driverAccountStatus);
  const [vehicleStatus, setVehicleStatus] = useState<'Aprovada' | 'Pendente' | 'Bloqueada'>('Aprovada');
  const [availability, setAvailability] = useState<DriverAvailability>('disponivel');
  const [fotoViaturaUrl, setFotoViaturaUrl] = useState<string | null>(null);

  // Dados do Motorista (sincronizados com o ecossistema central e uploads locais)
  const driverData: DriverData = useMemo(
    () => ({
      nomeCompleto: currentDriverRecord?.nomeCompleto || 'João Manuel',
      telefone: currentDriverRecord?.telefone || '+244 923 881 002',
      numeroCarta: currentDriverRecord?.numeroCarta || 'AO-49281-B',
      numeroBi: currentDriverRecord?.numeroBi || '004829104LA049',
      matricula: currentDriverRecord?.matricula || 'LD-00-00-XX',
      tipoViatura: currentDriverRecord?.tipoViatura || 'Táxi Colectivo (Toyota Hiace Azul/Branco)',
      modeloViatura: currentDriverRecord?.modeloViatura || 'Toyota Hiace (Azul/Branco Luanda)',
      lotacaoLugares: currentDriverRecord?.lotacaoLugares || 15,
      pracaOrigemId: currentOriginPraca.id,
      rotaDestino: currentDestName,
      statusConta: currentAccountStatus,
      dataRegisto: currentDriverRecord?.dataRegisto || '14/10/2026',
      dataAprovacao: currentAccountStatus === 'aprovado' ? '14/10/2026' : undefined,
      validadoPresencialmente: currentAccountStatus === 'aprovado',
      fiscalValidador: 'Fiscal Mateus (ANATA Luanda)',
      fotoPasse: currentDriverRecord?.fotoUrl || DEFAULT_DRIVER_PHOTO,
      fotoViatura: fotoViaturaUrl || currentDriverRecord?.fotoViatura || DEFAULT_TAXI_IMAGE,
      biFrente: currentDriverRecord?.documentos?.biFrente || 'Válido e Homologado',
      biVerso: currentDriverRecord?.documentos?.biVerso || currentDriverRecord?.documentos?.biFrente || 'Válido e Homologado',
      cartaFrente: currentDriverRecord?.documentos?.cartaFrente || 'Válido e Homologado (Cat. B/Profissional)',
      cartaVerso: currentDriverRecord?.documentos?.cartaVerso || 'Válido e Homologado',
      livreteViatura: currentDriverRecord?.documentos?.livrete || 'Emissão DNVT / Luanda',
      inspecaoTecnica: currentDriverRecord?.documentos?.inspecaoTecnica || 'Inspecção Periódica Aprovada 2026',
      seguroObrigatorio: currentDriverRecord?.documentos?.seguroObrigatorio || 'Seguro Obrigatório em Dia (ENSA)',
    }),
    [currentOriginPraca.id, currentDestName, currentAccountStatus, currentDriverRecord, fotoViaturaUrl]
  );

  // =========================================================================
  // GESTÃO DA FILA (ESTADO LOCAL / SINCRONIZADO)
  // =========================================================================
  const [isInQueue, setIsInQueue] = useState<boolean>(true);
  const [queuePosition, setQueuePosition] = useState<number>(2);
  const [queueEntryTime, setQueueEntryTime] = useState<string>('08:15');
  const [presenceRequested, setPresenceRequested] = useState<boolean>(false);
  const [presenceConfirmed, setPresenceConfirmed] = useState<boolean>(false);
  const [isCalledToCais, setIsCalledToCais] = useState<boolean>(false);
  const [readyConfirmed, setReadyConfirmed] = useState<boolean>(false);

  // Modal de saída da fila
  const [leaveQueueModalOpen, setLeaveQueueModalOpen] = useState(false);

  // =========================================================================
  // GESTÃO DE VIAGENS (FLUXO SEQUENCIAL SEGURO)
  // =========================================================================
  type TripStage =
    | 'sem_viagem'
    | 'atribuida'
    | 'na_baia'
    | 'embarcando'
    | 'em_viagem'
    | 'destino_chegado'
    | 'concluida';

  const [activeTripStage, setActiveTripStage] = useState<TripStage>('atribuida');
  const [currentTripId, setCurrentTripId] = useState<string>('viag-102');
  const [tripStartTime, setTripStartTime] = useState<string>('08:30');
  const [tripPassengerCount, setTripPassengerCount] = useState<number>(15);
  const [tripTarifaUnit, setTripTarifaUnit] = useState<number>(200);

  // Passageiros na viagem atual
  const [passengersList, setPassengersList] = useState<PassengerBooking[]>([
    { id: 'p1', tipo: 'Fila Virtual', nomePassageiro: 'Teresa da Silva', telefone: '+244 923 442 109', assento: 1, codigo: 'TK-101', status: 'Embarcado', pago: true, metodoPagamento: 'Digital' },
    { id: 'p2', tipo: 'FilaPass', nomePassageiro: 'António Maciel', telefone: '+244 912 884 921', assento: 2, codigo: 'FP-882', status: 'Embarcado', pago: true, metodoPagamento: 'Digital' },
    { id: 'p3', tipo: 'Embarque Direto', nomePassageiro: 'Manuel Simão', telefone: '+244 944 332 110', assento: 3, codigo: 'DIR-03', status: 'Embarcado', pago: true, metodoPagamento: 'Dinheiro' },
    { id: 'p4', tipo: 'Embarque Direto', nomePassageiro: 'Maria Quaresma', telefone: '+244 931 556 780', assento: 4, codigo: 'DIR-04', status: 'Embarcado', pago: true, metodoPagamento: 'Dinheiro' },
    { id: 'p5', tipo: 'Fila Virtual', nomePassageiro: 'José Pedro', telefone: '+244 922 110 994', assento: 5, codigo: 'TK-105', status: 'Embarcado', pago: true, metodoPagamento: 'Dinheiro' },
    { id: 'p6', tipo: 'Embarque Direto', nomePassageiro: 'Esperança Bento', telefone: '+244 945 009 231', assento: 6, codigo: 'DIR-06', status: 'Embarcado', pago: false, metodoPagamento: 'Dinheiro' },
    { id: 'p7', tipo: 'Embarque Direto', nomePassageiro: 'Paulo Afonso', telefone: '+244 919 778 334', assento: 7, codigo: 'DIR-07', status: 'Aguardando', pago: false, metodoPagamento: 'Dinheiro' },
    { id: 'p8', tipo: 'FilaPass', nomePassageiro: 'Carla Rodrigues', telefone: '+244 928 665 443', assento: 8, codigo: 'FP-304', status: 'Aguardando', pago: true, metodoPagamento: 'Digital' },
    { id: 'p9', tipo: 'Embarque Direto', nomePassageiro: 'Simão Kiala', telefone: '+244 933 221 887', assento: 9, codigo: 'DIR-09', status: 'Aguardando', pago: false, metodoPagamento: 'Dinheiro' },
    { id: 'p10', tipo: 'Embarque Direto', nomePassageiro: 'Rosa Domingos', telefone: '+244 941 123 456', assento: 10, codigo: 'DIR-10', status: 'Aguardando', pago: false, metodoPagamento: 'Dinheiro' },
    { id: 'p11', tipo: 'Embarque Direto', nomePassageiro: 'Gaspar Neto', telefone: '+244 927 987 654', assento: 11, codigo: 'DIR-11', status: 'Aguardando', pago: false, metodoPagamento: 'Dinheiro' },
    { id: 'p12', tipo: 'Embarque Direto', nomePassageiro: 'Domingas Luvumbo', telefone: '+244 914 556 677', assento: 12, codigo: 'DIR-12', status: 'Aguardando', pago: false, metodoPagamento: 'Dinheiro' },
    { id: 'p13', tipo: 'Embarque Direto', nomePassageiro: 'Filipe Cabinda', telefone: '+244 938 443 322', assento: 13, codigo: 'DIR-13', status: 'Aguardando', pago: false, metodoPagamento: 'Dinheiro' },
    { id: 'p14', tipo: 'Embarque Direto', nomePassageiro: 'Isabel Panzo', telefone: '+244 929 881 223', assento: 14, codigo: 'DIR-14', status: 'Aguardando', pago: false, metodoPagamento: 'Dinheiro' },
    { id: 'p15', tipo: 'Embarque Direto', nomePassageiro: 'Joaquim Ndala', telefone: '+244 947 002 918', assento: 15, codigo: 'DIR-15', status: 'Aguardando', pago: false, metodoPagamento: 'Dinheiro' },
  ]);

  // Modal de Interrupção / Cancelamento Autorizado
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState<string>('Avaria mecânica grave na via');
  const [cancelJustification, setCancelJustification] = useState<string>('');

  // Visualizador de fotografias do motorista e viatura
  const [viewingPhotoUrl, setViewingPhotoUrl] = useState<string | null>(null);
  const [viewingPhotoTitle, setViewingPhotoTitle] = useState<string>('');

  // Estados para submissão de documentos a partir dos directórios móveis (BI em PDF, etc.)
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [biFrenteName, setBiFrenteName] = useState<string>('bi_frente_homologado.pdf');
  const [biVersoName, setBiVersoName] = useState<string>('bi_verso_homologado.pdf');
  const [cartaName, setCartaName] = useState<string>('carta_conducao.pdf');
  const [fotoPasseName, setFotoPasseName] = useState<string>('foto_perfil.jpg');

  const [biFrenteUrl, setBiFrenteUrl] = useState<string | null>(null);
  const [biVersoUrl, setBiVersoUrl] = useState<string | null>(null);
  const [cartaUrl, setCartaUrl] = useState<string | null>(null);
  const [fotoPasseUrl, setFotoPasseUrl] = useState<string | null>(null);

  const handleMobileFileSelect = (e: React.ChangeEvent<HTMLInputElement>, docType: 'biFrente' | 'biVerso' | 'carta' | 'foto') => {
    const file = e.target.files?.[0];
    if (file) {
      triggerVibrate();
      const fileName = file.name;
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        if (docType === 'biFrente') {
          setBiFrenteName(fileName);
          setBiFrenteUrl(result);
        }
        if (docType === 'biVerso') {
          setBiVersoName(fileName);
          setBiVersoUrl(result);
        }
        if (docType === 'carta') {
          setCartaName(fileName);
          setCartaUrl(result);
        }
        if (docType === 'foto') {
          setFotoPasseName(fileName);
          setFotoPasseUrl(result);
        }
      };
      reader.readAsDataURL(file);

      onTriggerNotice('Ficheiro Seleccionado', `Documento ${fileName} carregado a partir dos directórios móveis com sucesso.`, 'attach_file');
    }
  };

  // Upload rápido de foto de perfil ou viatura diretamente do Perfil
  const handleQuickPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'fotoPasse' | 'fotoViatura') => {
    const file = e.target.files?.[0];
    if (file) {
      triggerVibrate();
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        if (type === 'fotoPasse') {
          setFotoPasseUrl(result);
          if (setDrivers) {
            setDrivers((prev) =>
              prev.map((d) => (d.id === 'driv-01' ? { ...d, fotoUrl: result } : d))
            );
          }
          onTriggerNotice('Fotografia Atualizada', 'Fotografia do motorista atualizada com sucesso no perfil e na central.', 'account_circle');
        } else {
          setFotoViaturaUrl(result);
          if (setDrivers) {
            setDrivers((prev) =>
              prev.map((d) => (d.id === 'driv-01' ? { ...d, fotoViatura: result } : d))
            );
          }
          onTriggerNotice('Viatura Atualizada', 'Fotografia da viatura atualizada com sucesso no perfil e na central.', 'directions_car');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmDocSubmission = () => {
    triggerVibrate();
    setUploadModalOpen(false);

    if (setDrivers) {
      setDrivers((prev) =>
        prev.map((d) =>
          d.id === 'driv-01'
            ? {
                ...d,
                fotoUrl: fotoPasseUrl || d.fotoUrl,
                statusConta: 'pendente',
                documentos: {
                  ...d.documentos,
                  biFrente: biFrenteUrl || d.documentos.biFrente,
                  biVerso: biVersoUrl || d.documentos.biVerso || d.documentos.biFrente,
                  cartaFrente: cartaUrl || d.documentos.cartaFrente,
                  cartaVerso: cartaUrl || d.documentos.cartaVerso,
                },
              }
            : d
        )
      );
    }

    onTriggerNotice(
      'Documentos Submetidos',
      'O Bilhete de Identidade (Frente e Verso) em PDF e demais documentos foram submetidos com sucesso a partir do dispositivo móvel. A aguardar validação final da Administração.',
      'verified'
    );
  };

  // =========================================================================
  // GESTÃO DE OCORRÊNCIAS
  // =========================================================================
  const [incidentType, setIncidentType] = useState<IncidentCategory>('Trânsito');
  const [incidentDesc, setIncidentDesc] = useState<string>('');
  const [incidentDate, setIncidentDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [incidentTime, setIncidentTime] = useState<string>(
    new Date().toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })
  );
  const [incidentLocation, setIncidentLocation] = useState<string>(`${currentOriginPraca.name} - Eixo Principal`);
  const [incidentPhoto, setIncidentPhoto] = useState<string | null>(null);
  const [incidentSuccessMsg, setIncidentSuccessMsg] = useState<string | null>(null);

  // Lista local de ocorrências do motorista
  const [driverIncidents, setDriverIncidents] = useState<
    Array<{
      id: string;
      codigo: string;
      tipo: IncidentCategory;
      descricao: string;
      data: string;
      hora: string;
      localizacao: string;
      foto?: string | null;
      status: 'Pendente' | 'Em Averiguação' | 'Resolvido';
    }>
  >([
    {
      id: 'oc-1',
      codigo: 'OC-9821',
      tipo: 'Trânsito',
      descricao: 'Engarrafamento severo na Av. Deolinda Rodrigues devido a camião imobilizado.',
      data: '14/10/2026',
      hora: '07:45',
      localizacao: 'Av. Deolinda Rodrigues (próximo à Unidade Operativa)',
      status: 'Resolvido',
    },
    {
      id: 'oc-2',
      codigo: 'OC-9834',
      tipo: 'Pneu furado',
      descricao: 'Furo no pneu traseiro direito. Substituição imediata realizada com pneu sobressalente.',
      data: '13/10/2026',
      hora: '14:20',
      localizacao: 'Largo das Heroínas',
      status: 'Resolvido',
    },
  ]);

  // Modal de zoom de foto/documento
  const [docModal, setDocModal] = useState<{ open: boolean; title: string; content: string }>({
    open: false,
    title: '',
    content: '',
  });

  // Notificações do sistema para o motorista
  const [notifications, setNotifications] = useState<
    Array<{ id: string; titulo: string; mensagem: string; hora: string; lida: boolean; tipo: 'fiscal' | 'fila' | 'sistema' }>
  >([
    {
      id: 'notif-1',
      titulo: 'Chamada para Carregamento',
      mensagem: `A sua viatura ${driverData.matricula} foi chamada para a baia 1 da Praça ${currentOriginPraca.name}.`,
      hora: '08:25',
      lida: false,
      tipo: 'fila',
    },
    {
      id: 'notif-2',
      titulo: 'Mensagem do Fiscal Mateus',
      mensagem: 'Mantenham a ordem na fila e confiram o troco antes de sair da praça.',
      hora: '07:30',
      lida: true,
      tipo: 'fiscal',
    },
    {
      id: 'notif-3',
      titulo: 'Regulamentação ANATA',
      mensagem: 'Vistoria periódica de pneus e extintores obrigatória até ao final do mês.',
      hora: 'Ontem',
      lida: true,
      tipo: 'sistema',
    },
  ]);

  // Histórico de viagens do motorista
  const [tripHistory, setTripHistory] = useState<
    Array<{ id: string; codigo: string; rota: string; hora: string; passageiros: number; valorKz: number; status: string }>
  >([
    { id: 'h1', codigo: 'V-091', rota: `${currentOriginPraca.name} → ${currentDestName}`, hora: '06:30 - 07:15', passageiros: 15, valorKz: 3000, status: 'Concluída' },
    { id: 'h2', codigo: 'V-092', rota: `${currentDestName} → ${currentOriginPraca.name}`, hora: '07:25 - 08:05', passageiros: 15, valorKz: 3000, status: 'Concluída' },
  ]);

  // Totais do dia
  const dailyTotalTrips = tripHistory.length + (activeTripStage === 'concluida' ? 1 : 0);
  const dailyTotalRevenue = dailyTotalTrips * (15 * tripTarifaUnit);

  // =========================================================================
  // HANDLERS DE FILA
  // =========================================================================
  const handleEnterQueue = () => {
    // REGRA RÍGIDA: Impedir a entrada de motoristas suspensos ou com viaturas não aprovadas
    if (currentAccountStatus !== 'aprovado') {
      triggerVibrate();
      onTriggerNotice(
        'Operação Bloqueada',
        'Impossível entrar na fila. O motorista deve aguardar a aprovação regulamentar pela Administração Central.',
        'block'
      );
      return;
    }

    if (vehicleStatus !== 'Aprovada') {
      triggerVibrate();
      onTriggerNotice(
        'Viatura Não Homologada',
        'Impossível entrar na fila. A sua viatura não possui inspecção aprovada pelo Fiscal de Praça.',
        'car_repair'
      );
      return;
    }

    triggerVibrate();
    setIsInQueue(true);
    setQueuePosition(3);
    setQueueEntryTime(new Date().toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' }));
    setIsCalledToCais(false);
    setReadyConfirmed(false);
    setPresenceConfirmed(false);

    // Sincronizar com lista geral de filas se disponível
    if (setQueues) {
      setQueues((prev) => [
        ...prev,
        {
          id: `q-${Date.now()}`,
          pracaId: currentOriginPraca.id,
          posicao: prev.length + 1,
          motoristaId: 'driv-01',
          motoristaNome: driverData.nomeCompleto,
          matricula: driverData.matricula,
          tempoEsperaMin: 12,
          status: 'em_fila',
          passageirosEmbarcados: 0,
          lotacaoMaxima: 15,
        },
      ]);
    }

    onTriggerNotice('Entrada na Fila', `Entrou na fila da Praça de ${currentOriginPraca.name} na posição #3.`, 'queue');
  };

  const handleLeaveQueue = () => {
    triggerVibrate();
    setIsInQueue(false);
    setLeaveQueueModalOpen(false);
    setIsCalledToCais(false);
    setPresenceRequested(false);
    setReadyConfirmed(false);

    // Sincronizar com filas gerais
    if (setQueues) {
      setQueues((prev) => prev.filter((q) => q.motoristaId !== 'driv-01'));
    }

    onTriggerNotice('Saída da Fila', 'Saiu da fila de carregamento voluntariamente conforme as regras.', 'logout');
  };

  const handleConfirmPresence = () => {
    triggerVibrate();
    setPresenceConfirmed(true);
    setPresenceRequested(false);
    onTriggerNotice('Presença Confirmada', 'A sua presença física na baia foi confirmada com sucesso.', 'verified');
  };

  const handleConfirmReadiness = () => {
    triggerVibrate();
    setReadyConfirmed(true);
    onTriggerNotice(
      'Disponibilidade Confirmada',
      'Informou o Fiscal que está pronto para receber os passageiros na baia.',
      'check_circle'
    );
  };

  // =========================================================================
  // HANDLERS DO FLUXO DE VIAGEM
  // =========================================================================
  const handleAcceptAssignment = () => {
    triggerVibrate();
    setActiveTripStage('na_baia');
    onTriggerNotice(
      'Atribuição Aceite',
      `Rota aceite: ${currentOriginPraca.name} → ${currentDestName}. Dirija-se à baia de embarque.`,
      'handshake'
    );
  };

  const handleConfirmArrivalAtBoarding = () => {
    triggerVibrate();
    setActiveTripStage('embarcando');
    onTriggerNotice('Chegada à Baia', 'Viatura posicionada no cais de embarque. Inicie a conferência de passageiros.', 'local_taxi');
  };

  const handleConfirmPassengerBoarded = (passengerId: string) => {
    triggerVibrate();
    setPassengersList((prev) =>
      prev.map((p) => (p.id === passengerId ? { ...p, status: 'Embarcado' } : p))
    );
  };

  const handleConfirmAllBoarded = () => {
    triggerVibrate();
    setPassengersList((prev) =>
      prev.map((p) => ({ ...p, status: 'Embarcado', pago: true }))
    );
    onTriggerNotice('Lotação Completa', 'Todos os 15 passageiros foram embarcados e validados.', 'groups');
  };

  const handleTogglePayment = (passengerId: string, metodo: 'Dinheiro' | 'Digital') => {
    triggerVibrate();
    setPassengersList((prev) =>
      prev.map((p) =>
        p.id === passengerId
          ? { ...p, pago: true, metodoPagamento: metodo }
          : p
      )
    );
  };

  const handleStartTrip = () => {
    triggerVibrate();
    setActiveTripStage('em_viagem');
    setTripStartTime(new Date().toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' }));

    // Atualizar no ecossistema central
    if (setTrips) {
      setTrips((prev) => [
        {
          id: currentTripId,
          codigo: `VIAG-${Math.floor(1000 + Math.random() * 9000)}`,
          passageiroNome: '15 Passageiros Colectivo',
          passageiroTelefone: '+244 923 442 109',
          motoristaNome: driverData.nomeCompleto,
          matricula: driverData.matricula,
          origemNome: currentOriginPraca.name,
          destinoNome: currentDestName,
          horaInicio: new Date().toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' }),
          estado: 'ongoing',
          valorKz: 15 * tripTarifaUnit,
          metodoPagamento: 'Dinheiro',
          statusPagamento: 'Confirmado',
        },
        ...prev,
      ]);
    }

    onTriggerNotice(
      'Viagem Iniciada',
      `Viagem iniciada rumo a ${currentDestName}. Dirija com prudência e respeite o limite de velocidade.`,
      'navigation'
    );
  };

  const handleArrivedAtDestination = () => {
    triggerVibrate();
    setActiveTripStage('destino_chegado');
    onTriggerNotice('Chegada ao Destino', `Chegou ao destino final: ${currentDestName}. Confirme o desembarque.`, 'flag');
  };

  const handleCompleteTrip = () => {
    triggerVibrate();
    setActiveTripStage('concluida');

    // Registar no histórico
    const newHistoryItem = {
      id: `h-${Date.now()}`,
      codigo: `V-${Math.floor(100 + Math.random() * 900)}`,
      rota: `${currentOriginPraca.name} → ${currentDestName}`,
      hora: `${tripStartTime} - ${new Date().toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}`,
      passageiros: 15,
      valorKz: 15 * tripTarifaUnit,
      status: 'Concluída',
    };
    setTripHistory((prev) => [newHistoryItem, ...prev]);

    // Atualizar pagamentos no ecossistema
    if (setPayments) {
      setPayments((prev) => [
        {
          id: `pay-${Date.now()}`,
          referencia: `PAY-${Math.floor(100000 + Math.random() * 900000)}`,
          valorKz: 15 * tripTarifaUnit,
          metodo: 'Dinheiro',
          estado: 'Confirmado',
          prestadorConfirmado: true,
          dataHora: new Date().toLocaleString('pt-AO'),
          viagemId: currentTripId,
          passageiroNome: 'Lotação Hiace 15L',
          motoristaNome: driverData.nomeCompleto,
          descricao: `Arrecadação total da viagem ${currentOriginPraca.name} → ${currentDestName}`,
        },
        ...prev,
      ]);
    }

    // Atualizar trips no ecossistema
    if (setTrips) {
      setTrips((prev) =>
        prev.map((t) => (t.id === currentTripId ? { ...t, estado: 'completed', horaFim: new Date().toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' }) } : t))
      );
    }

    onTriggerNotice('Viagem Concluída', `Viagem concluída com sucesso! Total arrecadado: ${(15 * tripTarifaUnit).toLocaleString('pt-AO')} Kz.`, 'check_circle');
  };

  const handleResetForNewTrip = () => {
    setActiveTripStage('sem_viagem');
    setIsInQueue(false);
  };

  const handleCancelAuthorizedTrip = () => {
    if (!cancelJustification.trim()) {
      onTriggerNotice('Justificação Obrigatória', 'Por favor descreva o motivo do cancelamento autorizado.', 'warning');
      return;
    }

    triggerVibrate();
    setActiveTripStage('sem_viagem');
    setCancelModalOpen(false);

    // Registar nos incidents ou logs de viagens
    if (setIncidents) {
      setIncidents((prev) => [
        {
          id: `inc-${Date.now()}`,
          codigo: `INT-${Math.floor(1000 + Math.random() * 9000)}`,
          titulo: `Interrupção Autorizada: ${cancelReason}`,
          tipo: 'Avaria na Via',
          descricao: `Motorista ${driverData.nomeCompleto} interrompeu viagem autorizada. Motivo: ${cancelReason}. Justificativa: ${cancelJustification}`,
          motoristaNome: driverData.nomeCompleto,
          praca: currentOriginPraca.name,
          dataHora: new Date().toLocaleString('pt-AO'),
          status: 'Resolvido',
          acaoTomada: 'Passageiros transferidos para viatura de apoio da praça.',
          severidade: 'media',
        },
        ...prev,
      ]);
    }

    onTriggerNotice(
      'Viagem Interrompida',
      'Interrupção autorizada registada no sistema. O Fiscal da Praça foi notificado.',
      'cancel'
    );
  };

  // =========================================================================
  // HANDLERS DE OCORRÊNCIAS
  // =========================================================================
  const handleUseCurrentLocation = () => {
    if (userLocation) {
      setIncidentLocation(`GPS: ${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)} (${currentOriginPraca.name})`);
      onTriggerNotice('Localização GPS', 'Coordenadas GPS atuais inseridas no formulário.', 'my_location');
    } else {
      setIncidentLocation(`Eixo Principal • ${currentOriginPraca.name}`);
    }
  };

  const handleSimulatePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setIncidentPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitIncident = (e: React.FormEvent) => {
    e.preventDefault();

    if (!incidentDesc.trim()) {
      onTriggerNotice('Descrição em Falta', 'Por favor descreva o ocorrido com clareza.', 'warning');
      return;
    }

    triggerVibrate();
    const newCode = `OC-${Math.floor(1000 + Math.random() * 9000)}`;

    const newIncidentItem = {
      id: `oc-${Date.now()}`,
      codigo: newCode,
      tipo: incidentType,
      descricao: incidentDesc,
      data: incidentDate,
      hora: incidentTime,
      localizacao: incidentLocation || currentOriginPraca.name,
      foto: incidentPhoto,
      status: 'Pendente' as const,
    };

    setDriverIncidents((prev) => [newIncidentItem, ...prev]);

    // Sincronizar com incidentes centrais
    if (setIncidents) {
      setIncidents((prev) => [
        {
          id: newIncidentItem.id,
          codigo: newCode,
          titulo: `${incidentType} - ${driverData.matricula}`,
          tipo: 'Avaria na Via',
          descricao: incidentDesc,
          motoristaNome: driverData.nomeCompleto,
          praca: currentOriginPraca.name,
          dataHora: `${incidentDate} ${incidentTime}`,
          status: 'Pendente',
          severidade: incidentType === 'Acidente' ? 'alta' : 'media',
        },
        ...prev,
      ]);
    }

    setIncidentDesc('');
    setIncidentPhoto(null);
    setIncidentSuccessMsg(`Ocorrência ${newCode} registada e comunicada ao Fiscal de Praça.`);

    setTimeout(() => {
      setIncidentSuccessMsg(null);
    }, 4500);

    onTriggerNotice(
      'Ocorrência Registada',
      `Ocorrência ${newCode} registada e transmitida ao Fiscal da Praça e à Central.`,
      'report'
    );
  };

  // Contagem de passageiros embarcados
  const boardedCount = passengersList.filter((p) => p.status === 'Embarcado').length;
  const paidCount = passengersList.filter((p) => p.pago).length;

  return (
    <div className="flex flex-col w-full pb-28 max-w-lg mx-auto min-h-screen bg-slate-50 text-slate-800 antialiased">
      {/* ===================================================================== */}
      {/* HEADER PRINCIPAL DO MOTORISTA (MOBILE)                               */}
      {/* ===================================================================== */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <div
            onClick={() => handleTabSwitch('perfil')}
            className="flex items-center gap-3 min-w-0 cursor-pointer group"
            title="Ver Meu Perfil e Documentos"
          >
            <div className="relative shrink-0">
              <img
                src={driverData.fotoPasse || DEFAULT_DRIVER_PHOTO}
                alt={driverData.nomeCompleto}
                className="w-11 h-11 rounded-full object-cover border-2 border-blue-900 shadow-2xs group-hover:ring-2 group-hover:ring-blue-400 transition-all"
              />
              <span
                className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                  availability === 'disponivel'
                    ? 'bg-emerald-500'
                    : availability === 'pausa'
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-sm font-bold text-slate-900 group-hover:text-blue-900 transition-colors truncate">{driverData.nomeCompleto}</h1>
                <span
                  className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                    currentAccountStatus === 'aprovado'
                      ? 'bg-emerald-100 text-emerald-800'
                      : currentAccountStatus === 'pendente'
                      ? 'bg-amber-100 text-amber-800'
                      : currentAccountStatus === 'suspenso'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {currentAccountStatus === 'aprovado'
                    ? 'Aprovado'
                    : currentAccountStatus === 'pendente'
                    ? 'Aguardando Aprovação'
                    : currentAccountStatus === 'suspenso'
                    ? 'Suspenso'
                    : 'Rejeitado'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                <span>{driverData.matricula}</span> • <span>{driverData.tipoViatura.slice(0, 24)}...</span>
              </p>
            </div>
          </div>

          {/* Botão de SOS de Emergência */}
          <button
            type="button"
            onClick={onOpenSos}
            className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer transition-transform shrink-0"
            title="Botão de Pânico / SOS"
          >
            <span className="material-symbols-outlined text-[16px]">e911_emergency</span>
            <span>SOS</span>
          </button>
        </div>

        {/* NAVEGAÇÃO ENTRE AS 5 SEÇÕES DO PERFIL DE MOTORISTA */}
        <nav className="flex items-center gap-1.5 pt-3 overflow-x-auto scrollbar-none text-xs">
          {[
            { id: 'dashboard', label: 'Painel', icon: 'dashboard' },
            { id: 'fila', label: 'Gestão da Fila', icon: 'queue' },
            { id: 'viagens', label: 'Viagens', icon: 'route' },
            { id: 'ocorrencias', label: 'Ocorrências', icon: 'report_problem' },
            { id: 'perfil', label: 'Meu Perfil', icon: 'person' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabSwitch(tab.id as DriverTab)}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
                activeDriverTab === tab.id || (tab.id === 'perfil' && activeDriverTab === 'registo')
                  ? 'bg-blue-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.id === 'fila' && isInQueue && (
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
              )}
              {tab.id === 'viagens' && activeTripStage !== 'sem_viagem' && activeTripStage !== 'concluida' && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              )}
            </button>
          ))}
        </nav>
      </header>

      {/* ===================================================================== */}
      {/* ALERTA REGULAMENTAR: SE NÃO ESTIVER APROVADO                           */}
      {/* ===================================================================== */}
      {currentAccountStatus !== 'aprovado' && (
        <div className="px-4 pt-3">
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 shadow-2xs flex flex-col gap-2">
            <div className="flex items-start gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">hourglass_top</span>
              </span>
              <div>
                <h2 className="text-xs font-bold text-amber-950">
                  {currentAccountStatus === 'pendente'
                    ? 'Aguardando Homologação da Central'
                    : currentAccountStatus === 'suspenso'
                    ? 'Conta Temporariamente Suspensa'
                    : 'Registo Não Homologado'}
                </h2>
                <p className="text-[11px] text-amber-900 mt-0.5 leading-relaxed">
                  De acordo com as normas da ANATA e Governo Provincial de Luanda,{' '}
                  <strong>o motorista deve aguardar a aprovação antes de operar</strong> e não pode entrar na fila nem realizar transportes.
                </p>
              </div>
            </div>

            {/* Alternador de simulação rápida para permitir testes */}
            <div className="flex items-center justify-between pt-1 border-t border-amber-200/80 text-[11px]">
              <span className="text-amber-800 font-medium">Modo de Teste / Simulação:</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentAccountStatus('aprovado');
                    onTriggerNotice('Conta Aprovada', 'Simulação: A conta de João Manuel foi aprovada.', 'verified');
                  }}
                  className="px-2 py-1 rounded bg-emerald-600 text-white font-bold text-[10px] cursor-pointer hover:bg-emerald-700"
                >
                  Simular Aprovação
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentAccountStatus('suspenso');
                    onTriggerNotice('Conta Suspensa', 'Simulação: A conta de João Manuel foi suspensa.', 'block');
                  }}
                  className="px-2 py-1 rounded bg-orange-600 text-white font-bold text-[10px] cursor-pointer hover:bg-orange-700"
                >
                  Simular Suspensão
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SEÇÃO 1: PAINEL PRINCIPAL (DASHBOARD COMPLETO)                        */}
      {/* ===================================================================== */}
      {activeDriverTab === 'dashboard' && (
        <div className="px-4 pt-3 space-y-4">
          {/* Card de 3 Estados: Conta, Viatura e Disponibilidade */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Estados Operacionais do Motorista:
            </h2>

            <div className="grid grid-cols-3 gap-2">
              {/* Estado da Conta */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
                <span className="text-[10px] font-bold text-slate-500 block truncate">Conta</span>
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    currentAccountStatus === 'aprovado'
                      ? 'bg-emerald-100 text-emerald-800'
                      : currentAccountStatus === 'pendente'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-orange-100 text-orange-800'
                  }`}
                >
                  {currentAccountStatus === 'aprovado'
                    ? 'Aprovada'
                    : currentAccountStatus === 'pendente'
                    ? 'Pendente'
                    : 'Suspensa'}
                </span>
              </div>

              {/* Estado da Viatura */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
                <span className="text-[10px] font-bold text-slate-500 block truncate">Viatura</span>
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${
                    vehicleStatus === 'Aprovada'
                      ? 'bg-emerald-100 text-emerald-800'
                      : vehicleStatus === 'Pendente'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                  onClick={() => {
                    const next = vehicleStatus === 'Aprovada' ? 'Pendente' : vehicleStatus === 'Pendente' ? 'Bloqueada' : 'Aprovada';
                    setVehicleStatus(next);
                  }}
                  title="Clique para alternar estado da viatura em teste"
                >
                  {vehicleStatus}
                </span>
              </div>

              {/* Estado de Disponibilidade */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
                <span className="text-[10px] font-bold text-slate-500 block truncate">Disponibilidade</span>
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    availability === 'disponivel'
                      ? 'bg-emerald-100 text-emerald-800'
                      : availability === 'pausa'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-200 text-slate-800'
                  }`}
                >
                  {availability === 'disponivel'
                    ? 'Disponível'
                    : availability === 'pausa'
                    ? 'Em Pausa'
                    : 'Fora Serviço'}
                </span>
              </div>
            </div>

            {/* Seletor Rápido de Disponibilidade */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-700 block mb-1.5">
                Alterar Disponibilidade:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'disponivel', label: 'Disponível', icon: 'check_circle', color: 'emerald' },
                  { id: 'pausa', label: 'Em Pausa', icon: 'coffee', color: 'amber' },
                  { id: 'fora_servico', label: 'Fora Serviço', icon: 'do_not_disturb_on', color: 'slate' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      triggerVibrate();
                      setAvailability(item.id as DriverAvailability);
                      onTriggerNotice('Disponibilidade Alterada', `Alterou estado para ${item.label}.`, 'info');
                    }}
                    className={`p-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      availability === item.id
                        ? 'bg-blue-900 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[17px]">{item.icon}</span>
                    <span className="text-[11px]">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Praça Atribuída e Rota */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-900 text-[20px]">hub</span>
                <h2 className="text-xs font-bold text-slate-900">Praça & Rota Atribuídas</h2>
              </div>
              <span className="text-[11px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md">
                15 Lugares (200 Kz)
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Praça de Embarque:</span>
                <select
                  value={currentOriginPraca.id}
                  onChange={(e) => {
                    const found = LUANDA_PRACAS.find((p) => p.id === e.target.value);
                    if (found) {
                      setCurrentOriginPraca(found);
                      if (found.destinations && found.destinations.length > 0) {
                        setCurrentDestName(found.destinations[0]);
                      }
                      onTriggerNotice('Praça Selecionada', `Praça alterada para ${found.name}.`, 'location_on');
                    }
                  }}
                  className="bg-white border border-slate-300 rounded-lg px-2 py-1 font-bold text-slate-800 text-xs focus:outline-none"
                >
                  {LUANDA_PRACAS.map((pr) => (
                    <option key={pr.id} value={pr.id}>
                      {pr.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Rota / Destino:</span>
                <span className="font-bold text-slate-900">→ {currentDestName}</span>
              </div>
            </div>
          </div>

          {/* Cartão de Posição na Fila */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600 text-[22px]">format_list_numbered</span>
                <h2 className="text-xs font-bold text-slate-900">Posição na Fila de Embarque</h2>
              </div>
              {isInQueue && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                  Activo na Fila
                </span>
              )}
            </div>

            {isInQueue ? (
              <div className="p-3 bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-xl flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-[11px] text-blue-200 block">Sua Posição Atual:</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-3xl font-black text-amber-400">#{queuePosition}</span>
                    <span className="text-xs text-blue-200">na fila da praça</span>
                  </div>
                  <span className="text-[10px] text-blue-300 block mt-1">
                    Entrada: {queueEntryTime} • Tempo est.: ~8 min
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    triggerVibrate();
                    setActiveDriverTab('fila');
                  }}
                  className="px-3 py-2 bg-amber-400 hover:bg-amber-300 text-blue-950 font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1 active:scale-95 transition-transform"
                >
                  <span>Gerir Fila</span>
                  <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                </button>
              </div>
            ) : (
              <div className="p-3 bg-slate-100 rounded-xl text-center space-y-2">
                <p className="text-xs text-slate-600">Não está na fila de carregamento da praça.</p>
                <button
                  type="button"
                  onClick={handleEnterQueue}
                  className="w-full py-2.5 bg-blue-900 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer hover:bg-blue-800 active:scale-95 transition-transform flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[17px]">queue</span>
                  <span>Entrar na Fila de {currentOriginPraca.name}</span>
                </button>
              </div>
            )}
          </div>

          {/* Pedidos Atribuídos / Chamada para Transporte */}
          {isInQueue && queuePosition === 1 && (
            <div className="p-4 rounded-2xl bg-amber-500 text-slate-950 shadow-md animate-pulse flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-10 h-10 rounded-full bg-white text-amber-700 flex items-center justify-center shrink-0 shadow-xs">
                  <span className="material-symbols-outlined text-[24px]">campaign</span>
                </span>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wide">É a Sua Vez! Chamada para Baia</h3>
                  <p className="text-[11px] font-semibold text-slate-900">
                    Avance com a viatura {driverData.matricula} para o cais de embarque.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerVibrate();
                  setActiveDriverTab('viagens');
                  setActiveTripStage('na_baia');
                }}
                className="px-3 py-2 bg-slate-950 text-white font-bold text-xs rounded-xl shadow-sm shrink-0 cursor-pointer active:scale-95"
              >
                Ir à Baia
              </button>
            </div>
          )}

          {/* Card de Viagem Activa */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-900 text-[22px]">route</span>
                <h2 className="text-xs font-bold text-slate-900">Viagem Activa</h2>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTripStage === 'em_viagem'
                    ? 'bg-emerald-100 text-emerald-800'
                    : activeTripStage === 'embarcando'
                    ? 'bg-blue-100 text-blue-800'
                    : activeTripStage === 'na_baia'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {activeTripStage === 'em_viagem'
                  ? 'Em Trânsito'
                  : activeTripStage === 'embarcando'
                  ? 'Embarcando'
                  : activeTripStage === 'na_baia'
                  ? 'Na Baia'
                  : activeTripStage === 'destino_chegado'
                  ? 'No Destino'
                  : activeTripStage === 'concluida'
                  ? 'Concluída'
                  : 'Nenhuma Activa'}
              </span>
            </div>

            {activeTripStage !== 'sem_viagem' && activeTripStage !== 'concluida' ? (
              <div className="p-3 bg-slate-50 rounded-xl space-y-2.5 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>
                    {currentOriginPraca.name} → {currentDestName}
                  </span>
                  <span className="text-blue-900 font-black">
                    {(tripPassengerCount * tripTarifaUnit).toLocaleString('pt-AO')} Kz
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Passageiros: {boardedCount}/15 embarcados</span>
                  <span>Pagos: {paidCount}/15</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-900 h-full rounded-full transition-all"
                    style={{ width: `${(boardedCount / 15) * 100}%` }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    triggerVibrate();
                    setActiveDriverTab('viagens');
                  }}
                  className="w-full py-2 bg-blue-900 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer hover:bg-blue-800 active:scale-95 transition-transform flex items-center justify-center gap-1"
                >
                  <span>Abrir Controles da Viagem</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-500 p-2 text-center bg-slate-50 rounded-xl">
                Nenhuma viagem em curso no momento.
              </p>
            )}
          </div>

          {/* Histórico do Dia & Faturamento */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] text-slate-500 font-medium block">Viagens Hoje</span>
              <div className="flex items-baseline gap-1">
                <strong className="text-2xl font-black text-slate-900">{dailyTotalTrips}</strong>
                <span className="text-xs text-slate-500">concluídas</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-bold block">
                {dailyTotalTrips * 15} passageiros
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] text-slate-500 font-medium block">Faturamento Bruto</span>
              <div className="flex items-baseline gap-1">
                <strong className="text-xl font-black text-blue-900">
                  {dailyTotalRevenue.toLocaleString('pt-AO')}
                </strong>
                <span className="text-xs text-blue-900 font-bold">Kz</span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium block">
                Tarifa: 200 Kz/lugar
              </span>
            </div>
          </div>

          {/* Central de Notificações */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-700 text-[20px]">notifications</span>
                <h2 className="text-xs font-bold text-slate-900">Avisos & Notificações</h2>
              </div>
              <span className="text-[10px] font-bold text-slate-500">{notifications.length} avisos</span>
            </div>

            <div className="space-y-2">
              {notifications.map((nt) => (
                <div
                  key={nt.id}
                  className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                    !nt.lida ? 'bg-blue-50/70 border-blue-200' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{nt.titulo}</span>
                    <span className="text-[10px] text-slate-400">{nt.hora}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">{nt.mensagem}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SEÇÃO 2: GESTÃO DA FILA                                               */}
      {/* ===================================================================== */}
      {activeDriverTab === 'fila' && (
        <div className="px-4 pt-3 space-y-4">
          {/* Validação de Bloqueio se não aprovado ou viatura não aprovada */}
          {(currentAccountStatus !== 'aprovado' || vehicleStatus !== 'Aprovada') && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs">
                <span className="material-symbols-outlined text-rose-600 text-[20px]">block</span>
                <span>Entrada na Fila Proibida</span>
              </div>
              <p className="text-xs leading-relaxed">
                {currentAccountStatus !== 'aprovado'
                  ? 'A sua conta está pendente ou suspensa. Regulamento ANATA: Somente motoristas com homologação aprovada podem entrar na fila.'
                  : 'A viatura não possui inspecção válida aprovada pelo Fiscal.'}
              </p>
            </div>
          )}

          {/* Painel Principal de Estado da Fila */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Fila da Praça: {currentOriginPraca.name}
                </h2>
                <p className="text-xs text-slate-500">Rota autorizada para: {currentDestName}</p>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  isInQueue ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {isInQueue ? 'Em Espera' : 'Fora da Fila'}
              </span>
            </div>

            {isInQueue ? (
              <div className="space-y-3">
                {/* Visualizador de Posição em Grande */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-blue-950 text-white text-center space-y-1 shadow-sm">
                  <span className="text-xs text-slate-300 uppercase tracking-wider font-semibold">
                    A sua posição atual
                  </span>
                  <div className="text-4xl font-black text-amber-400">#{queuePosition}</div>
                  <p className="text-xs text-slate-300">
                    {queuePosition === 1
                      ? 'É o próximo a carregar na baia!'
                      : `${queuePosition - 1} viatura(s) à sua frente`}
                  </p>
                  <div className="pt-2 flex justify-center items-center gap-4 text-xs text-slate-300 border-t border-slate-800">
                    <span>Entrada: {queueEntryTime}</span>
                    <span>Espera: ~{queuePosition * 4} min</span>
                  </div>
                </div>

                {/* Confirmação de Presença na Baia quando exigido */}
                {presenceRequested && !presenceConfirmed && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-700 text-[20px]">pin_drop</span>
                      <strong className="text-xs">O Fiscal solicita confirmação de presença!</strong>
                    </div>
                    <p className="text-[11px] text-amber-900 leading-snug">
                      Confirme que a viatura está fisicamente estacionada na área de espera da praça para não perder a sua vez.
                    </p>
                    <button
                      type="button"
                      onClick={handleConfirmPresence}
                      className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer"
                    >
                      Confirmar Presença na Praça
                    </button>
                  </div>
                )}

                {/* Chamada para Transporte (quando chega à vez ou chamado) */}
                {queuePosition === 1 && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-emerald-700 text-[22px]">campaign</span>
                      <strong className="text-xs">Chamada para Transporte Emitida!</strong>
                    </div>
                    <p className="text-[11px] text-emerald-900 leading-snug">
                      Dirija-se imediatamente à baia de embarque nº 1.
                    </p>
                    <div className="flex gap-2">
                      {!readyConfirmed ? (
                        <button
                          type="button"
                          onClick={handleConfirmReadiness}
                          className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg cursor-pointer"
                        >
                          Confirmar Disponibilidade
                        </button>
                      ) : (
                        <span className="flex-1 py-2 bg-emerald-200 text-emerald-900 font-bold text-xs rounded-lg text-center">
                          ✓ Pronto para Carregar
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          triggerVibrate();
                          setActiveDriverTab('viagens');
                          setActiveTripStage('na_baia');
                        }}
                        className="flex-1 py-2 bg-blue-900 text-white font-bold text-xs rounded-lg cursor-pointer"
                      >
                        Abrir Embarque
                      </button>
                    </div>
                  </div>
                )}

                {/* Botões de Ação na Fila */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      triggerVibrate();
                      setPresenceRequested(true);
                      setPresenceConfirmed(false);
                      onTriggerNotice('Simulação do Fiscal', 'O Fiscal de Praça solicitou o check-in de presença.', 'info');
                    }}
                    className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">touch_app</span>
                    <span>Testar Check-in</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLeaveQueueModalOpen(true)}
                    className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">logout</span>
                    <span>Sair da Fila</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Para carregar passageiros nesta praça, adicione a sua viatura à fila oficial monitorizada pelo Fiscal.
                </p>
                <button
                  type="button"
                  onClick={handleEnterQueue}
                  disabled={currentAccountStatus !== 'aprovado' || vehicleStatus !== 'Aprovada'}
                  className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all ${
                    currentAccountStatus === 'aprovado' && vehicleStatus === 'Aprovada'
                      ? 'bg-blue-900 hover:bg-blue-800 text-white active:scale-95'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">queue</span>
                  <span>Entrar na Fila ({currentOriginPraca.name})</span>
                </button>
              </div>
            )}
          </div>

          {/* Lista em Tempo Real de Viaturas na Praça */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Ordem dos Motoristas na Praça:
            </h2>

            <div className="space-y-2 text-xs">
              {[
                { pos: 1, nome: 'Manuel Cândido', matricula: 'LD-44-21-GP', status: 'Chamado ao Cais', isUser: false },
                { pos: 2, nome: driverData.nomeCompleto, matricula: driverData.matricula, status: 'Em Espera (Você)', isUser: true },
                { pos: 3, nome: 'António Kiala', matricula: 'LD-19-02-BA', status: 'Em Espera', isUser: false },
                { pos: 4, nome: 'Bernardo Ndala', matricula: 'LD-88-12-AK', status: 'Em Espera', isUser: false },
              ].map((m) => (
                <div
                  key={m.pos}
                  className={`p-2.5 rounded-xl border flex items-center justify-between ${
                    m.isUser
                      ? 'bg-blue-50/80 border-blue-300 font-bold'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        m.isUser ? 'bg-blue-900 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      #{m.pos}
                    </span>
                    <div>
                      <span className="text-slate-900 block font-semibold">{m.nome}</span>
                      <span className="text-[10px] text-slate-500">{m.matricula}</span>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      m.pos === 1
                        ? 'bg-amber-100 text-amber-800'
                        : m.isUser
                        ? 'bg-blue-100 text-blue-900'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SEÇÃO 3: VIAGENS (FLUXO SEQUENCIAL SEGURO)                             */}
      {/* ===================================================================== */}
      {activeDriverTab === 'viagens' && (
        <div className="px-4 pt-3 space-y-4">
          {/* Card com a Identificação da Viagem e Regra de Segurança */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">
                  Viagem ID: {currentTripId}
                </span>
                <h2 className="text-sm font-bold text-slate-900">
                  {currentOriginPraca.name} → {currentDestName}
                </h2>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                Atribuída a Você (João Manuel)
              </span>
            </div>

            <p className="text-[11px] text-slate-500 leading-snug">
              Segurança regulamentar: Apenas o motorista titular pode alterar o estado desta viagem e registar cobranças.
            </p>
          </div>

          {/* MAPA DE TRAJETÓRIA DA ROTA EM TEMPO REAL */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-400 text-[22px] animate-pulse">navigation</span>
                <div>
                  <h2 className="text-xs font-bold text-white tracking-wide uppercase">Mapa de Trajetória da Rota</h2>
                  <p className="text-[10px] text-slate-300">GPS em tempo real • Luanda Transit Network</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>GPS Ativo</span>
              </div>
            </div>

            {/* Simulação Visual do Mapa & Trajeto */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-3 relative">
              <div className="flex items-center justify-between text-[11px] text-slate-300">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-blue-400 text-[16px]">trip_origin</span>
                  <span className="font-bold text-white">{currentOriginPraca.name}</span>
                </div>
                <div className="flex-1 mx-3 border-t border-dashed border-slate-700 relative flex items-center justify-center">
                  <span className="absolute bg-slate-900 px-2 text-[10px] font-bold text-amber-400">
                    68% Percorrido
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-rose-400 text-[16px]">location_on</span>
                  <span className="font-bold text-white">{currentDestName}</span>
                </div>
              </div>

              {/* Barra de Progresso do Trajeto com Marcador da Viatura */}
              <div className="relative w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-amber-400 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: '68%' }}
                ></div>
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-amber-400 text-slate-950 shadow-lg flex items-center justify-center text-[10px] font-black transition-all duration-500"
                  style={{ left: 'calc(68% - 10px)' }}
                  title="Sua Viatura (Toyota Hiace)"
                >
                  🚐
                </div>
              </div>

              {/* Métricas de Navegação em Tempo Real */}
              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Velocidade GPS</span>
                  <span className="text-xs font-black text-amber-400">42.5 km/h</span>
                </div>
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Distância Restante</span>
                  <span className="text-xs font-black text-blue-400">3.8 km</span>
                </div>
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">ETA Estimado</span>
                  <span className="text-xs font-black text-emerald-400">~5 min</span>
                </div>
              </div>
            </div>

            {/* GOOGLE MAPS EMBED DA ROTA EM LUANDA */}
            <div className="w-full h-44 rounded-xl overflow-hidden border border-slate-800 relative bg-slate-950">
              <iframe
                title="Google Maps Rota Luanda"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(currentOriginPraca.name + ' para ' + currentDestName + ', Luanda, Angola')}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
              ></iframe>
              <div className="absolute bottom-2 right-2 bg-slate-900/90 text-white px-2 py-1 rounded text-[9px] font-bold border border-slate-700 flex items-center gap-1 shadow-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Google Maps Live</span>
              </div>
            </div>

            {/* Coordenadas atuais */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
              <span>Coordenadas: Lat -8.8390, Lng 13.2894</span>
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">my_location</span>
                <span>Rota Monitorizada</span>
              </span>
            </div>
          </div>

          {/* Linha do Tempo das Etapas Operacionais */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Fluxo da Corrida:
            </h2>

            <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-bold">
              {[
                { stage: 'atribuida', label: '1. Atribuição' },
                { stage: 'na_baia', label: '2. Na Baia' },
                { stage: 'embarcando', label: '3. Embarque' },
                { stage: 'em_viagem', label: '4. Em Viagem' },
              ].map((st) => (
                <div
                  key={st.stage}
                  className={`p-1.5 rounded-lg border ${
                    activeTripStage === st.stage
                      ? 'bg-blue-900 text-white border-blue-900'
                      : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}
                >
                  {st.label}
                </div>
              ))}
            </div>

            {/* ETAPA 1: ACEITAR ATRIBUIÇÃO */}
            {activeTripStage === 'atribuida' && (
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl space-y-2 text-xs">
                <span className="font-bold text-blue-950 block">Nova Atribuição da Central / Fiscal:</span>
                <p className="text-[11px] text-blue-900">
                  A sua viatura foi despachada para a rota {currentOriginPraca.name} ⇄ {currentDestName}. Confirme a aceitação para proceder à baia.
                </p>
                <button
                  type="button"
                  onClick={handleAcceptAssignment}
                  className="w-full py-2.5 bg-blue-900 text-white font-bold rounded-xl shadow-xs cursor-pointer hover:bg-blue-800"
                >
                  Aceitar Atribuição de Rota
                </button>
              </div>
            )}

            {/* ETAPA 2: CONFIRMAR CHEGADA AO PONTO DE EMBARQUE */}
            {activeTripStage === 'na_baia' && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs">
                <span className="font-bold text-amber-950 block">Dirija-se ao Ponto de Embarque:</span>
                <p className="text-[11px] text-amber-900">
                  Estacione na baia indicada na Praça de {currentOriginPraca.name} e sinalize quando estiver posicionado para iniciar o embarque.
                </p>
                <button
                  type="button"
                  onClick={handleConfirmArrivalAtBoarding}
                  className="w-full py-2.5 bg-amber-600 text-white font-bold rounded-xl shadow-xs cursor-pointer hover:bg-amber-700"
                >
                  Confirmar Chegada ao Ponto de Embarque
                </button>
              </div>
            )}

            {/* ETAPA 3: CONFIRMAR EMBARQUE E PAGAMENTOS */}
            {(activeTripStage === 'embarcando' || activeTripStage === 'na_baia') && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Conferência de Embarque ({boardedCount}/15 passageiros):
                  </span>
                  <button
                    type="button"
                    onClick={handleConfirmAllBoarded}
                    className="text-[11px] font-bold text-blue-800 underline cursor-pointer"
                  >
                    Confirmar Todos (15/15)
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 text-xs">
                  {passengersList.map((p) => (
                    <div
                      key={p.id}
                      className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                          {p.assento}
                        </span>
                        <div>
                          <span className="font-semibold text-slate-900 block text-[11px] truncate max-w-[130px]">
                            {p.nomePassageiro}
                          </span>
                          <span className="text-[9px] text-slate-500">{p.tipo}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {p.status !== 'Embarcado' ? (
                          <button
                            type="button"
                            onClick={() => handleConfirmPassengerBoarded(p.id)}
                            className="px-2 py-1 bg-blue-900 text-white rounded text-[10px] font-bold cursor-pointer"
                          >
                            Embarcar
                          </button>
                        ) : (
                          <span className="text-emerald-700 text-[10px] font-bold">✓ Embarcado</span>
                        )}

                        {!p.pago ? (
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => handleTogglePayment(p.id, 'Dinheiro')}
                              className="px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[9px] font-bold cursor-pointer"
                              title="Pagar Dinheiro"
                            >
                              Dinheiro
                            </button>
                            <button
                              type="button"
                              onClick={() => handleTogglePayment(p.id, 'Digital')}
                              className="px-1.5 py-0.5 bg-indigo-600 text-white rounded text-[9px] font-bold cursor-pointer"
                              title="Pagar Digital"
                            >
                              Digital
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[10px] font-bold">
                            {p.metodoPagamento === 'Digital' ? '📱 Pago' : '💵 Pago'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Botão de Iniciar Viagem */}
                <button
                  type="button"
                  onClick={handleStartTrip}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer active:scale-95 transition-transform flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                  <span>Iniciar Viagem Rumo a {currentDestName}</span>
                </button>
              </div>
            )}

            {/* ETAPA 4: EM VIAGEM (EM TRÂNSITO) */}
            {activeTripStage === 'em_viagem' && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                    <strong className="text-emerald-950">Viagem em Trânsito na Estrada</strong>
                  </div>
                  <span className="text-emerald-900 font-bold">Início: {tripStartTime}</span>
                </div>

                <div className="p-3 bg-white rounded-lg border border-emerald-100 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Origem:</span>
                    <strong className="text-slate-800">{currentOriginPraca.name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Destino:</span>
                    <strong className="text-slate-800">{currentDestName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Lotação:</span>
                    <strong className="text-emerald-700">15 Passageiros</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Arrecadado:</span>
                    <strong className="text-blue-900 font-black">
                      {(15 * tripTarifaUnit).toLocaleString('pt-AO')} Kz
                    </strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleArrivedAtDestination}
                  className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px]">flag</span>
                  <span>Confirmar Chegada ao Destino ({currentDestName})</span>
                </button>
              </div>
            )}

            {/* ETAPA 5: DESTINO CHEGADO & CONCLUIR VIAGEM */}
            {activeTripStage === 'destino_chegado' && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3 text-xs">
                <span className="font-bold text-blue-950 block">Chegada ao Destino Confirmada:</span>
                <p className="text-[11px] text-blue-900">
                  Os 15 passageiros completaram o trajecto até {currentDestName}. Proceda à conclusão para libertar o registo e contabilizar a receita do dia.
                </p>
                <button
                  type="button"
                  onClick={handleCompleteTrip}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                  <span>Concluir Viagem Oficialmente</span>
                </button>
              </div>
            )}

            {/* ETAPA 6: CONCLUÍDA */}
            {activeTripStage === 'concluida' && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2 text-xs">
                <span className="material-symbols-outlined text-emerald-600 text-[32px]">task_alt</span>
                <strong className="text-emerald-950 block">Viagem Concluída com Sucesso!</strong>
                <p className="text-[11px] text-emerald-800">
                  Os dados foram arquivados e sincronizados com a Administração Central.
                </p>
                <button
                  type="button"
                  onClick={handleResetForNewTrip}
                  className="mt-2 px-4 py-2 bg-blue-900 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Pronto para Nova Operação
                </button>
              </div>
            )}

            {/* Interrupção Autorizada (botão de segurança) */}
            {activeTripStage !== 'sem_viagem' && activeTripStage !== 'concluida' && (
              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(true)}
                  className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">cancel</span>
                  <span>Registar Cancelamento / Interrupção Autorizada</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SEÇÃO 4: OCORRÊNCIAS (FORMULÁRIO COMPLETO)                            */}
      {/* ===================================================================== */}
      {activeDriverTab === 'ocorrencias' && (
        <div className="px-4 pt-3 space-y-4">
          {/* Mensagem de Sucesso */}
          {incidentSuccessMsg && (
            <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>{incidentSuccessMsg}</span>
            </div>
          )}

          {/* Formulário de Nova Ocorrência */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600 text-[22px]">report_problem</span>
                <h2 className="text-xs font-bold text-slate-900">Registar Nova Ocorrência</h2>
              </div>
              <span className="text-[10px] font-bold text-slate-500">Notifica Fiscal</span>
            </div>

            <form onSubmit={handleSubmitIncident} className="space-y-3 text-xs">
              {/* Tipo de Ocorrência (Os 9 tipos requeridos) */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Tipo de Ocorrência *
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    'Acidente',
                    'Avaria',
                    'Pneu furado',
                    'Trânsito',
                    'Operação policial',
                    'Obras',
                    'Problema com passageiro',
                    'Problema de pagamento',
                    'Outra ocorrência',
                  ].map((tipo) => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => setIncidentType(tipo as IncidentCategory)}
                      className={`p-2 rounded-xl text-[10.5px] font-bold text-center border cursor-pointer transition-all ${
                        incidentType === tipo
                          ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {tipo}
                    </button>
                  ))}
                </div>
              </div>

              {/* Descrição Detalhada */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Descrição da Ocorrência *
                </label>
                <textarea
                  value={incidentDesc}
                  onChange={(e) => setIncidentDesc(e.target.value)}
                  placeholder="Descreva com detalhe o ocorrido na via, sentido da marcha ou intervenção necessária..."
                  rows={3}
                  required
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:border-blue-900"
                />
              </div>

              {/* Data e Hora */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Data *</label>
                  <input
                    type="date"
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    required
                    className="w-full h-10 px-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Hora *</label>
                  <input
                    type="time"
                    value={incidentTime}
                    onChange={(e) => setIncidentTime(e.target.value)}
                    required
                    className="w-full h-10 px-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none"
                  />
                </div>
              </div>

              {/* Localização Opcional */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Localização (Opcional):</label>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    className="text-[10px] text-blue-900 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[13px]">my_location</span>
                    <span>Usar GPS Atual</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={incidentLocation}
                  onChange={(e) => setIncidentLocation(e.target.value)}
                  placeholder="Ex: Av. Deolinda Rodrigues perto do Jumbo"
                  className="w-full h-10 px-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none"
                />
              </div>

              {/* Fotografia */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Fotografia de Evidência (Opcional):
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 h-10 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer text-slate-700 font-bold text-xs">
                    <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                    <span>{incidentPhoto ? 'Trocar Fotografia' : 'Carregar Fotografia'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSimulatePhotoUpload}
                      className="hidden"
                    />
                  </label>
                  {incidentPhoto && (
                    <button
                      type="button"
                      onClick={() => setIncidentPhoto(null)}
                      className="h-10 px-2.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Remover
                    </button>
                  )}
                </div>

                {/* Pré-visualização da Foto */}
                {incidentPhoto && (
                  <div className="mt-2 w-full h-32 rounded-xl overflow-hidden bg-slate-200 border border-slate-300">
                    <img src={incidentPhoto} alt="Ocorrência" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Botão de Envio */}
              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs cursor-pointer active:scale-95 transition-transform flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
                <span>Submeter Ocorrência para o Fiscal</span>
              </button>
            </form>
          </div>

          {/* Histórico de Ocorrências Reportadas */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Ocorrências Registadas por Você ({driverIncidents.length}):
            </h2>

            <div className="space-y-2 text-xs">
              {driverIncidents.map((oc) => (
                <div key={oc.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      {oc.codigo} • {oc.tipo}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        oc.status === 'Resolvido'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {oc.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">{oc.descricao}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                    <span>{oc.localizacao}</span>
                    <span>
                      {oc.data} às {oc.hora}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SEÇÃO 5: PERFIL COMPLETO DO MOTORISTA & DOCUMENTOS                     */}
      {/* Visualização de Fotografia, Viatura, Documentos (BI PDF/IMG), Dados    */}
      {/* ===================================================================== */}
      {(activeDriverTab === 'perfil' || activeDriverTab === 'registo') && (
        <div className="px-4 pt-3 space-y-4">
          {/* Card Principal do Perfil do Motorista */}
          <div className="bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 text-white p-5 rounded-3xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center text-center">
              {/* Fotografia Tipo Passe do Motorista com Zoom e Upload */}
              <div className="relative mb-3 group">
                <div 
                  onClick={() => {
                    setViewingPhotoUrl(driverData.fotoPasse || DEFAULT_DRIVER_PHOTO);
                    setViewingPhotoTitle(`Fotografia de Perfil - ${driverData.nomeCompleto}`);
                  }}
                  className="w-24 h-24 rounded-2xl overflow-hidden border-3 border-amber-400/80 shadow-xl cursor-pointer relative bg-slate-800"
                  title="Toque para ampliar a foto"
                >
                  <img
                    src={driverData.fotoPasse || DEFAULT_DRIVER_PHOTO}
                    alt={driverData.nomeCompleto}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="material-symbols-outlined text-white text-[20px]">zoom_in</span>
                  </div>
                </div>

                {/* Selo de status sobreposto */}
                <span
                  className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-slate-900 flex items-center justify-center text-white ${
                    currentAccountStatus === 'aprovado'
                      ? 'bg-emerald-500'
                      : currentAccountStatus === 'pendente'
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  title={currentAccountStatus === 'aprovado' ? 'Motorista Aprovado' : 'Aguardando Aprovação'}
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {currentAccountStatus === 'aprovado' ? 'check' : 'hourglass_top'}
                  </span>
                </span>

                {/* Botão para atualizar a foto do motorista */}
                <label
                  className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center cursor-pointer shadow-md border-2 border-slate-900 active:scale-95 transition-all"
                  title="Carregar ou Capturar Nova Fotografia"
                >
                  <span className="material-symbols-outlined text-[15px]">photo_camera</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="user"
                    className="hidden"
                    onChange={(e) => handleQuickPhotoUpload(e, 'fotoPasse')}
                  />
                </label>
              </div>

              {/* Nome e Selos Oficiais */}
              <div className="flex items-center gap-1.5 justify-center flex-wrap">
                <h2 className="text-lg font-extrabold tracking-tight text-white">{driverData.nomeCompleto}</h2>
                <span className="material-symbols-outlined text-amber-400 text-[18px]" title="Credenciado Oficial">
                  verified
                </span>
              </div>
              <p className="text-xs text-blue-200/80 font-medium mt-0.5">
                {driverData.matricula} • {driverData.tipoViatura.split('(')[0]}
              </p>

              {/* Badges de Homologação */}
              <div className="flex items-center gap-2 mt-3 flex-wrap justify-center">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-2xs ${
                    currentAccountStatus === 'aprovado'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : currentAccountStatus === 'pendente'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                  <span>
                    {currentAccountStatus === 'aprovado'
                      ? 'Conta Aprovada & Homologada'
                      : currentAccountStatus === 'pendente'
                      ? 'Aguardando Homologação Central'
                      : 'Conta Suspensa'}
                  </span>
                </span>

                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/10 text-white border border-white/20 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-amber-400">shield</span>
                  <span>ANATA Luanda</span>
                </span>
              </div>
            </div>

            {/* Faixa inferior do Card: Praça Base e Rota */}
            <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white/5 rounded-xl p-2.5">
                <span className="text-[10px] text-blue-200/70 block uppercase font-bold">Praça Habitual</span>
                <strong className="text-white font-bold block truncate mt-0.5">{currentOriginPraca.name}</strong>
              </div>
              <div className="bg-white/5 rounded-xl p-2.5">
                <span className="text-[10px] text-blue-200/70 block uppercase font-bold">Rota Autorizada</span>
                <strong className="text-amber-300 font-bold block truncate mt-0.5">→ {currentDestName}</strong>
              </div>
            </div>
          </div>

          {/* Secção 1: A Viatura do Motorista (Foto, Matrícula, Modelo, Inspeção) */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">directions_car</span>
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">A Viatura Cadastrada</h3>
                  <p className="text-[11px] text-slate-500">Dados do automóvel colectivo homologado</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-md border border-emerald-200">
                ✓ Viatura Aprovada
              </span>
            </div>

            {/* Fotografia da Viatura com Zoom */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-xs group">
              <div 
                onClick={() => {
                  setViewingPhotoUrl(driverData.fotoViatura || DEFAULT_TAXI_IMAGE);
                  setViewingPhotoTitle(`Fotografia da Viatura (${driverData.matricula})`);
                }}
                className="w-full h-44 cursor-pointer relative"
                title="Toque para ampliar a foto da viatura"
              >
                <img
                  src={driverData.fotoViatura || DEFAULT_TAXI_IMAGE}
                  alt={`Viatura ${driverData.matricula}`}
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform"
                />
                <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <div className="px-3 py-1.5 rounded-lg bg-black/70 text-white font-bold text-xs flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">zoom_in</span>
                    <span>Ampliar Fotografia</span>
                  </div>
                </div>
              </div>

              {/* Botão sobreposto para atualizar foto da viatura */}
              <label className="absolute top-2.5 right-2.5 px-2.5 py-1.5 rounded-xl bg-white/90 hover:bg-white text-slate-800 font-bold text-[11px] shadow-md flex items-center gap-1.5 cursor-pointer backdrop-blur-xs active:scale-95 transition-all">
                <span className="material-symbols-outlined text-[15px] text-blue-900">photo_camera</span>
                <span>Alterar Foto</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleQuickPhotoUpload(e, 'fotoViatura')}
                />
              </label>

              {/* Matrícula em estilo chapa oficial angolana */}
              <div className="absolute bottom-2.5 left-2.5 px-3 py-1 rounded-lg bg-white text-slate-900 font-mono font-black text-xs tracking-widest border-2 border-slate-900 shadow-md flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-600" />
                <span>{driverData.matricula}</span>
              </div>
            </div>

            {/* Ficha técnica da viatura */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase font-semibold">Modelo & Tipo</span>
                <strong className="text-slate-900 font-bold block truncate mt-0.5">{driverData.modeloViatura}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase font-semibold">Lotação Regulamentar</span>
                <strong className="text-slate-900 font-bold block truncate mt-0.5">{driverData.lotacaoLugares} Lugares (Hiace)</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase font-semibold">Livrete / Registo</span>
                <strong className="text-slate-900 font-bold block truncate mt-0.5">{driverData.livreteViatura}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase font-semibold">Inspecção Técnica</span>
                <strong className="text-emerald-700 font-bold block truncate mt-0.5">{driverData.inspecaoTecnica}</strong>
              </div>
            </div>
          </div>

          {/* Secção 2: Documentos Pessoais & Condução (BI Frente/Verso em PDF/IMG, Carta, etc.) */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">folder_shared</span>
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Dossiê de Documentos</h3>
                  <p className="text-[11px] text-slate-500">Documentação oficial homologada</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-blue-900">
                6 Cadastrados
              </span>
            </div>

            {/* Grade de Documentos */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* B.I. Frente */}
              <div 
                onClick={() => {
                  const doc = biFrenteUrl || (driverData.biFrente && driverData.biFrente.startsWith('data:') ? driverData.biFrente : null);
                  if (doc) {
                    setViewingPhotoUrl(doc);
                    setViewingPhotoTitle('Bilhete de Identidade (Frente)');
                  } else {
                    setDocModal({
                      open: true,
                      title: 'Bilhete de Identidade (Frente)',
                      content: `Número do B.I.: ${driverData.numeroBi}. Documento nacional conferido com a base de dados do Registo Civil e Direcção de Identificação de Luanda.`,
                    });
                  }
                }}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-400 cursor-pointer transition-all flex flex-col justify-between group shadow-2xs"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center group-hover:bg-blue-900 group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-[18px]">badge</span>
                  </span>
                  <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    ✓ Validado
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">B.I. (Frente)</span>
                  <span className="text-[10px] text-slate-500 truncate block mt-0.5">
                    {biFrenteName || driverData.numeroBi}
                  </span>
                </div>
                <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-blue-800 font-bold">
                  <span>Visualizar</span>
                  <span className="material-symbols-outlined text-[14px]">visibility</span>
                </div>
              </div>

              {/* B.I. Verso */}
              <div 
                onClick={() => {
                  const doc = biVersoUrl || (driverData.biVerso && driverData.biVerso.startsWith('data:') ? driverData.biVerso : null);
                  if (doc) {
                    setViewingPhotoUrl(doc);
                    setViewingPhotoTitle('Bilhete de Identidade (Verso)');
                  } else {
                    setDocModal({
                      open: true,
                      title: 'Bilhete de Identidade (Verso)',
                      content: `Verso do B.I. conferido com a Direcção de Identificação de Luanda. Residência: Luanda. Estado civil e filiação homologados.`,
                    });
                  }
                }}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-400 cursor-pointer transition-all flex flex-col justify-between group shadow-2xs"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center group-hover:bg-blue-900 group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-[18px]">badge</span>
                  </span>
                  <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    ✓ Validado
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">B.I. (Verso)</span>
                  <span className="text-[10px] text-slate-500 truncate block mt-0.5">
                    {biVersoName || 'Verso Homologado'}
                  </span>
                </div>
                <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-blue-800 font-bold">
                  <span>Visualizar</span>
                  <span className="material-symbols-outlined text-[14px]">visibility</span>
                </div>
              </div>

              {/* Carta de Condução (Frente) */}
              <div 
                onClick={() => {
                  const doc = cartaUrl || (driverData.cartaFrente && driverData.cartaFrente.startsWith('data:') ? driverData.cartaFrente : null);
                  if (doc) {
                    setViewingPhotoUrl(doc);
                    setViewingPhotoTitle('Carta de Condução (Frente)');
                  } else {
                    setDocModal({
                      open: true,
                      title: 'Carta de Condução (Frente)',
                      content: `Número da Carta: ${driverData.numeroCarta}. Categoria B Profissional autorizada para transporte público de passageiros em Luanda pela DNVT.`,
                    });
                  }
                }}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-400 cursor-pointer transition-all flex flex-col justify-between group shadow-2xs"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center group-hover:bg-blue-900 group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-[18px]">credit_card</span>
                  </span>
                  <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    ✓ Cat. B Prof.
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Carta (Frente)</span>
                  <span className="text-[10px] text-slate-500 truncate block mt-0.5">
                    {cartaName || driverData.numeroCarta}
                  </span>
                </div>
                <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-blue-800 font-bold">
                  <span>Visualizar</span>
                  <span className="material-symbols-outlined text-[14px]">visibility</span>
                </div>
              </div>

              {/* Carta de Condução (Verso) */}
              <div 
                onClick={() => {
                  setDocModal({
                    open: true,
                    title: 'Carta de Condução (Verso)',
                    content: `Verso da Carta de Condução Profissional. Averbamentos para condução de táxi colectivo 15 lugares emitidos pela DNVT Angola. Validade: Outubro 2029.`,
                  });
                }}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-400 cursor-pointer transition-all flex flex-col justify-between group shadow-2xs"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center group-hover:bg-blue-900 group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-[18px]">credit_card</span>
                  </span>
                  <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    ✓ Válido 2029
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Carta (Verso)</span>
                  <span className="text-[10px] text-slate-500 truncate block mt-0.5">Averbamentos Oficiais</span>
                </div>
                <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-blue-800 font-bold">
                  <span>Visualizar</span>
                  <span className="material-symbols-outlined text-[14px]">visibility</span>
                </div>
              </div>

              {/* Livrete da Viatura */}
              <div 
                onClick={() => {
                  setDocModal({
                    open: true,
                    title: 'Livrete da Viatura (DNVT)',
                    content: `Documento oficial da viatura ${driverData.matricula}. Registo de propriedade homologado, número de chassi verificado e taxa de circulação regularizada.`,
                  });
                }}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-400 cursor-pointer transition-all flex flex-col justify-between group shadow-2xs"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center group-hover:bg-blue-900 group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-[18px]">description</span>
                  </span>
                  <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    ✓ DNVT
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Livrete Oficial</span>
                  <span className="text-[10px] text-slate-500 truncate block mt-0.5">DNVT Luanda</span>
                </div>
                <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-blue-800 font-bold">
                  <span>Visualizar</span>
                  <span className="material-symbols-outlined text-[14px]">visibility</span>
                </div>
              </div>

              {/* Seguro Obrigatório ENSA */}
              <div 
                onClick={() => {
                  setDocModal({
                    open: true,
                    title: 'Seguro Obrigatório de Responsabilidade',
                    content: `Apólice de Seguro de Responsabilidade Civil Automóvel e Cobertura aos Passageiros emitida pela ENSA Seguros. Situação: Regularizada e Activa.`,
                  });
                }}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-400 cursor-pointer transition-all flex flex-col justify-between group shadow-2xs"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center group-hover:bg-blue-900 group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-[18px]">verified_user</span>
                  </span>
                  <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    ✓ ENSA
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Seguro ENSA</span>
                  <span className="text-[10px] text-slate-500 truncate block mt-0.5">Apólice Activa</span>
                </div>
                <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-blue-800 font-bold">
                  <span>Visualizar</span>
                  <span className="material-symbols-outlined text-[14px]">visibility</span>
                </div>
              </div>
            </div>

            {/* Botão de Destaque: Submissão de Documentos Móveis (PDF / Imagem) */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setUploadModalOpen(true)}
                className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
              >
                <span className="material-symbols-outlined text-[18px]">upload_file</span>
                <span>Submeter / Actualizar B.I. (PDF) e Documentos</span>
              </button>
            </div>
          </div>

          {/* Secção 3: Dados Pessoais & Cadastrais Completos */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">person</span>
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Informações Pessoais</h3>
                  <p className="text-[11px] text-slate-500">Registo cadastral de associado</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-400 text-[20px]">badge</span>
            </div>

            <div className="grid grid-cols-2 gap-y-3 gap-x-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block mb-0.5 uppercase font-semibold">Nome Completo</span>
                <strong className="text-slate-900 font-bold block">{driverData.nomeCompleto}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block mb-0.5 uppercase font-semibold">Nº do B.I.</span>
                <strong className="text-slate-900 font-bold block font-mono">{driverData.numeroBi}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block mb-0.5 uppercase font-semibold">Telefone Principal</span>
                <strong className="text-slate-900 font-bold block">{driverData.telefone}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block mb-0.5 uppercase font-semibold">Nº Carta Condução</span>
                <strong className="text-slate-900 font-bold block font-mono">{driverData.numeroCarta}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block mb-0.5 uppercase font-semibold">Associação / Sindicato</span>
                <strong className="text-blue-900 font-bold block">ANATA (Nova Aliança)</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block mb-0.5 uppercase font-semibold">Data de Homologação</span>
                <strong className="text-slate-900 font-bold block">{driverData.dataRegisto}</strong>
              </div>
              <div className="col-span-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Fiscal Validador</span>
                  <strong className="text-slate-900 font-bold block mt-0.5">{driverData.fiscalValidador}</strong>
                </div>
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-bold text-[10px]">
                  Vistoria OK
                </span>
              </div>
            </div>
          </div>

          {/* Secção 4: Desempenho e Estatísticas Operacionais */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">analytics</span>
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Desempenho na Fila</h3>
                  <p className="text-[11px] text-slate-500">Histórico e assiduidade</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-lg font-extrabold text-blue-900 block">4.9 ★</span>
                <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">Avaliação</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-lg font-extrabold text-slate-900 block">{tripHistory.length + 14}</span>
                <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">Viagens</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-lg font-extrabold text-emerald-700 block">99%</span>
                <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">Assiduidade</span>
              </div>
            </div>
          </div>

          {/* Ações da Conta */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider mb-1">
              Opções da Conta:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleTabSwitch('dashboard')}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">dashboard</span>
                <span>Ir ao Painel</span>
              </button>
              <button
                type="button"
                onClick={() => handleTabSwitch('fila')}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">queue</span>
                <span>Minha Fila</span>
              </button>
            </div>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="w-full py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                <span>Terminar Sessão</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: SAÍDA DA FILA                                                  */}
      {/* ===================================================================== */}
      {leaveQueueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-3 shadow-xl">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
              <span className="material-symbols-outlined text-[24px]">warning</span>
              <span>Confirmar Saída da Fila</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tem a certeza de que deseja sair da fila da Praça de <strong>{currentOriginPraca.name}</strong>? Se sair, perderá a sua posição <strong>#{queuePosition}</strong> e terá de se inscrever novamente no final da fila.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setLeaveQueueModalOpen(false)}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Permanecer na Fila
              </button>
              <button
                type="button"
                onClick={handleLeaveQueue}
                className="py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Confirmar Saída
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: INTERRUPÇÃO / CANCELAMENTO AUTORIZADO                          */}
      {/* ===================================================================== */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-3 shadow-xl">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
              <span className="material-symbols-outlined text-[24px]">cancel</span>
              <span>Registar Interrupção Autorizada</span>
            </div>
            <p className="text-xs text-slate-600">
              Selecione o motivo formal regulamentado e descreva a situação para averiguação da Central:
            </p>

            <div className="space-y-2 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Motivo Autorizado:</label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full h-10 px-2 rounded-xl bg-slate-50 border border-slate-300 font-semibold text-slate-800 text-xs focus:outline-none"
                >
                  <option value="Avaria mecânica grave na via">Avaria mecânica grave na via</option>
                  <option value="Bloqueio policial ou encerramento de via">Bloqueio policial ou via cortada</option>
                  <option value="Orientação expressa do Fiscal de Praça">Orientação do Fiscal de Praça</option>
                  <option value="Emergência médica a bordo">Emergência médica a bordo</option>
                  <option value="Outro motivo de força maior">Outro motivo de força maior</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Justificação Obrigatória *</label>
                <textarea
                  value={cancelJustification}
                  onChange={(e) => setCancelJustification(e.target.value)}
                  placeholder="Explique o que ocorreu com a viatura ou passageiros..."
                  rows={2}
                  className="w-full p-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleCancelAuthorizedTrip}
                className="py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Confirmar Interrupção
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: SUBMISSÃO DE DOCUMENTOS DOS DIRECTÓRIOS MÓVEIS (BI EM PDF)     */}
      {/* ===================================================================== */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
                <span className="material-symbols-outlined text-[22px]">upload_file</span>
                <span>Submeter Documentos Móveis</span>
              </div>
              <button
                type="button"
                onClick={() => setUploadModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Seleccione os ficheiros (PDF ou imagens) do Bilhete de Identidade (Frente e Verso) e demais documentos directamente dos directórios do seu telemóvel:
            </p>

            <div className="space-y-3 text-xs">
              {/* B.I. Frente (PDF / Imagem) */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-blue-800">badge</span>
                    B.I. (Frente - PDF / Imagem)
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold truncate max-w-[120px]">{biFrenteName}</span>
                </div>
                <label className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg flex items-center justify-center gap-2 cursor-pointer text-xs font-bold text-slate-700 shadow-2xs">
                  <span className="material-symbols-outlined text-[16px]">folder_open</span>
                  <span>Procurar nos Directórios Móveis</span>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    className="hidden"
                    onChange={(e) => handleMobileFileSelect(e, 'biFrente')}
                  />
                </label>
              </div>

              {/* B.I. Verso (PDF / Imagem) */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-blue-800">badge</span>
                    B.I. (Verso - PDF / Imagem)
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold truncate max-w-[120px]">{biVersoName}</span>
                </div>
                <label className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg flex items-center justify-center gap-2 cursor-pointer text-xs font-bold text-slate-700 shadow-2xs">
                  <span className="material-symbols-outlined text-[16px]">folder_open</span>
                  <span>Procurar nos Directórios Móveis</span>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    className="hidden"
                    onChange={(e) => handleMobileFileSelect(e, 'biVerso')}
                  />
                </label>
              </div>

              {/* Carta de Condução */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-blue-800">credit_card</span>
                    Carta de Condução
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold truncate max-w-[120px]">{cartaName}</span>
                </div>
                <label className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg flex items-center justify-center gap-2 cursor-pointer text-xs font-bold text-slate-700 shadow-2xs">
                  <span className="material-symbols-outlined text-[16px]">folder_open</span>
                  <span>Procurar nos Directórios Móveis</span>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    className="hidden"
                    onChange={(e) => handleMobileFileSelect(e, 'carta')}
                  />
                </label>
              </div>

              {/* Fotografia de Perfil */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-blue-800">account_box</span>
                    Fotografia Tipo Passe
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold truncate max-w-[120px]">{fotoPasseName}</span>
                </div>
                <label className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg flex items-center justify-center gap-2 cursor-pointer text-xs font-bold text-slate-700 shadow-2xs">
                  <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                  <span>Capturar ou Carregar Foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleMobileFileSelect(e, 'foto')}
                  />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUploadModalOpen(false)}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDocSubmission}
                className="py-2.5 px-3 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Enviar Documentos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL DE ZOOM DE DOCUMENTO                                            */}
      {/* ===================================================================== */}
      {docModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900">{docModal.title}</h3>
              <button
                type="button"
                onClick={() => setDocModal({ open: false, title: '', content: '' })}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{docModal.content}</p>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL DE AMPLIAÇÃO DE FOTOGRAFIA                                      */}
      {/* ===================================================================== */}
      {viewingPhotoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-4 space-y-3 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-900">{viewingPhotoTitle}</h3>
              <button
                type="button"
                onClick={() => setViewingPhotoUrl(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
            <div className="w-full h-64 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 flex items-center justify-center">
              {viewingPhotoUrl.startsWith('data:application/pdf') ? (
                <div className="flex flex-col items-center justify-center p-4 text-center">
                  <span className="material-symbols-outlined text-[54px] text-rose-500 mb-2">picture_as_pdf</span>
                  <span className="text-white font-bold text-xs mb-1">Documento PDF em Formato Oficial</span>
                  <span className="text-slate-400 text-[11px] mb-3">{viewingPhotoTitle}</span>
                  <a
                    href={viewingPhotoUrl}
                    download={`${viewingPhotoTitle.replace(/\s+/g, '_').toLowerCase()}.pdf`}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    <span>Descarregar / Abrir PDF</span>
                  </a>
                </div>
              ) : (
                <img src={viewingPhotoUrl} alt="Ampliação" className="w-full h-full object-contain" />
              )}
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setViewingPhotoUrl(null)}
                className="px-4 py-2 bg-blue-900 text-white font-bold text-xs rounded-xl hover:bg-blue-800 cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ===================================================================== */}
    </div>
  );
}
