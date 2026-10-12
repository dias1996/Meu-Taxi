import React, { useState, useEffect, useMemo } from 'react';
import { LiveMapView, LUANDA_PRACAS, PracaLocation } from './LiveMapView';

export type DriverAccountStatus = 'pendente' | 'aprovado' | 'rejeitado' | 'nao_registado';
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
  dataRegisto: string;
  dataAprovacao?: string;
  aprovadoPor?: string;
  validadoPresencialmente: boolean;
  fiscalValidador?: string;
  // Documentos anexados
  fotoPasse?: string | null;
  biFrente?: string | null;
  biVerso?: string | null;
  cartaFrente?: string | null;
  cartaVerso?: string | null;
  fotoViatura?: string | null;
  livreteViatura?: string | null;
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
  metodoPagamento: 'Dinheiro' | 'Multicaixa Express';
}

export interface DriverIncident {
  id: string;
  tipo: string;
  descricao: string;
  hora: string;
  local: string;
}

interface DriverAreaProps {
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
}

const DEFAULT_TAXI_IMAGE = '/src/assets/images/angola_taxi_hiace_1791809024746.jpg';

export function DriverArea({
  userLocation,
  currentOriginPraca,
  setCurrentOriginPraca,
  currentDestName,
  setCurrentDestName,
  onTriggerNotice,
  triggerVibrate,
  onOpenSos,
  onOpenFilaPass,
  onSwitchToPassenger,
  onSwitchToInspector,
  onSwitchToAdmin,
}: DriverAreaProps) {
  // =========================================================
  // SUB-TABS DO MOTORISTA
  // =========================================================
  const [activeDriverTab, setActiveDriverTab] = useState<
    'operacao' | 'fila' | 'viagem' | 'pagamentos' | 'ocorrencias' | 'perfil'
  >('operacao');

  // =========================================================
  // DADOS DO MOTORISTA E ESTADO DA CONTA
  // Inicialmente com a ficha padrão ilustrada na especificação
  // =========================================================
  const [driverData, setDriverData] = useState<DriverData>({
    nomeCompleto: 'João Manuel',
    telefone: '+244 9XX XXX XXX',
    numeroCarta: 'CARTA-001',
    numeroBi: '004829104LA049',
    matricula: 'LD-00-00-XX',
    tipoViatura: 'Táxi',
    modeloViatura: 'Toyota Hiace (Azul/Branco)',
    lotacaoLugares: 15,
    pracaOrigemId: currentOriginPraca.id,
    rotaDestino: currentDestName,
    statusConta: 'pendente', // Como na imagem: Estado da conta Pendente
    dataRegisto: new Date().toLocaleDateString('pt-AO'),
    validadoPresencialmente: false,
    fotoViatura: DEFAULT_TAXI_IMAGE,
  });

  // Formulário de registo temporário quando o motorista está a editar ou criar do zero
  const [formNome, setFormNome] = useState(driverData.nomeCompleto);
  const [formTelefone, setFormTelefone] = useState('+244 923 456 789');
  const [formCarta, setFormCarta] = useState(driverData.numeroCarta);
  const [formBi, setFormBi] = useState(driverData.numeroBi);
  const [formMatricula, setFormMatricula] = useState(driverData.matricula);
  const [formTipoViatura, setFormTipoViatura] = useState(driverData.tipoViatura);
  const [formModeloViatura, setFormModeloViatura] = useState(driverData.modeloViatura);
  const [formPracaId, setFormPracaId] = useState(currentOriginPraca.id);
  const [formDestino, setFormDestino] = useState(currentDestName);
  const [formTermosAceites, setFormTermosAceites] = useState(true);

  // Uploads simulados / reais para o formulário
  const [formFotoPasse, setFormFotoPasse] = useState<string | null>(null);
  const [formCartaFrente, setFormCartaFrente] = useState<string | null>(null);
  const [formCartaVerso, setFormCartaVerso] = useState<string | null>(null);
  const [formBiFrente, setFormBiFrente] = useState<string | null>(null);
  const [formBiVerso, setFormBiVerso] = useState<string | null>(null);
  const [formFotoViatura, setFormFotoViatura] = useState<string | null>(DEFAULT_TAXI_IMAGE);

  // Modal para exibir detalhes da Ficha Oficial ou Simulação de Validação
  const [viewFichaModalOpen, setViewFichaModalOpen] = useState(false);
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState(
    'Fotocópia da Carta de Condução ilegível. Favor reenviar imagem nítida.'
  );

  // Disponibilidade do Motorista
  const [availability, setAvailability] = useState<DriverAvailability>('disponivel');

  // =========================================================
  // GESTÃO DA FILA DE MOTORISTAS
  // =========================================================
  const [inQueue, setInQueue] = useState<boolean>(true);
  const [queuePosition, setQueuePosition] = useState<number>(17);
  const [queueState, setQueueState] = useState<'waiting' | 'turn'>('waiting');
  const [toleranceSeconds, setToleranceSeconds] = useState<number>(178); // 02:58

  // Passageiros da Viagem Atual / Carregamento do Hiace (15 lugares)
  const [tripPassengers, setTripPassengers] = useState<PassengerBooking[]>([
    { id: 'p1', tipo: 'Fila Virtual', nomePassageiro: 'António Kapita', telefone: '+244 923 111 222', assento: 1, status: 'Embarcado', pago: true, metodoPagamento: 'Dinheiro' },
    { id: 'p2', tipo: 'Fila Virtual', nomePassageiro: 'Teresa Domingos', telefone: '+244 931 444 555', assento: 2, status: 'Embarcado', pago: true, metodoPagamento: 'Multicaixa Express' },
    { id: 'p3', tipo: 'FilaPass', nomePassageiro: 'Manuel Afonso', telefone: '+244 944 777 888', assento: 3, codigo: 'FP-829104', status: 'Embarcado', pago: true, metodoPagamento: 'Multicaixa Express' },
    { id: 'p4', tipo: 'Fila Virtual', nomePassageiro: 'Esperança Bento', telefone: '+244 922 999 000', assento: 4, status: 'Embarcado', pago: true, metodoPagamento: 'Dinheiro' },
    { id: 'p5', tipo: 'Fila Virtual', nomePassageiro: 'José Vunge', telefone: '+244 912 333 444', assento: 5, status: 'Embarcado', pago: true, metodoPagamento: 'Dinheiro' },
    { id: 'p6', tipo: 'Fila Virtual', nomePassageiro: 'Ana Maria', telefone: '+244 928 555 666', assento: 6, status: 'Embarcado', pago: true, metodoPagamento: 'Multicaixa Express' },
    { id: 'p7', tipo: 'Embarque Direto', nomePassageiro: 'Carlos Dinis', telefone: '+244 933 666 777', assento: 7, status: 'Embarcado', pago: true, metodoPagamento: 'Dinheiro' },
    { id: 'p8', tipo: 'Fila Virtual', nomePassageiro: 'Beatriz Lemos', telefone: '+244 945 888 999', assento: 8, status: 'Embarcado', pago: true, metodoPagamento: 'Dinheiro' },
    { id: 'p9', tipo: 'Fila Virtual', nomePassageiro: 'Paulo Miguel', telefone: '+244 924 123 456', assento: 9, status: 'Embarcado', pago: true, metodoPagamento: 'Dinheiro' },
    { id: 'p10', tipo: 'Fila Virtual', nomePassageiro: 'Carla Silva', telefone: '+244 915 234 567', assento: 10, status: 'Embarcado', pago: true, metodoPagamento: 'Multicaixa Express' },
    { id: 'p11', tipo: 'Fila Virtual', nomePassageiro: 'Domingos Neto', telefone: '+244 934 345 678', assento: 11, status: 'Embarcado', pago: true, metodoPagamento: 'Dinheiro' },
    { id: 'p12', tipo: 'Fila Virtual', nomePassageiro: 'Francisca Lima', telefone: '+244 926 456 789', assento: 12, status: 'Embarcado', pago: true, metodoPagamento: 'Dinheiro' },
    { id: 'p13', tipo: 'Fila Virtual', nomePassageiro: 'Graça Martins', telefone: '+244 917 567 890', assento: 13, status: 'Embarcado', pago: true, metodoPagamento: 'Dinheiro' },
    { id: 'p14', tipo: 'Fila Virtual', nomePassageiro: 'Henrique Costa', telefone: '+244 938 678 901', assento: 14, status: 'Embarcado', pago: true, metodoPagamento: 'Dinheiro' },
    { id: 'p15', tipo: 'FilaPass', nomePassageiro: 'Isabel Gouveia', telefone: '+244 929 789 012', assento: 15, codigo: 'FP-918233', status: 'Embarcado', pago: true, metodoPagamento: 'Multicaixa Express' },
  ]);

  // =========================================================
  // TELEMETRIA E VIAGEM EM CURSO
  // =========================================================
  const [tripActive, setTripActive] = useState<boolean>(false);
  const [tripElapsedMinutes, setTripElapsedMinutes] = useState<number>(0);
  const [tripSpeedKmh, setTripSpeedKmh] = useState<number>(48);
  const [tripProgressPercent, setTripProgressPercent] = useState<number>(0);
  const [tripCompletedSummary, setTripCompletedSummary] = useState<boolean>(false);

  // Pagamentos e Receitas
  const [dailyTripsCount, setDailyTripsCount] = useState<number>(4);
  const [dailyRevenueKz, setDailyRevenueKz] = useState<number>(30000); // 4 viagens * 7500

  // Ocorrências Reportadas
  const [incidentsList, setIncidentsList] = useState<DriverIncident[]>([
    {
      id: 'inc-1',
      tipo: 'Engarrafamento Intenso',
      descricao: 'Trânsito muito lento junto ao nó viário da Corimba / Samba.',
      hora: '07:35',
      local: 'Avenida 21 de Janeiro (Corredor Sul)',
    },
    {
      id: 'inc-2',
      tipo: 'Operação Policial',
      descricao: 'Fiscalização de documentos da Polícia de Trânsito no desvio do Morro Bento.',
      hora: '08:10',
      local: 'Morro Bento',
    },
  ]);
  const [newIncidentTipo, setNewIncidentTipo] = useState('Engarrafamento');
  const [newIncidentDesc, setNewIncidentDesc] = useState('');
  const [newIncidentLocal, setNewIncidentLocal] = useState('');

  // Contador de tolerância regressivo
  useEffect(() => {
    if (queueState !== 'turn') return;
    const interval = setInterval(() => {
      setToleranceSeconds((prev) => (prev > 0 ? prev - 1 : 178));
    }, 1000);
    return () => clearInterval(interval);
  }, [queueState]);

  // Simulação de telemetria durante a viagem
  useEffect(() => {
    if (!tripActive) return;
    const interval = setInterval(() => {
      setTripElapsedMinutes((prev) => prev + 1);
      setTripProgressPercent((prev) => {
        if (prev >= 98) {
          return 100;
        }
        return prev + 5;
      });
      // Variação de velocidade realista em Luanda (25 - 65 km/h)
      setTripSpeedKmh((prev) => {
        const delta = Math.floor(Math.random() * 9) - 4;
        return Math.max(20, Math.min(68, prev + delta));
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [tripActive]);

  const formattedTolerance = useMemo(() => {
    const mins = Math.floor(toleranceSeconds / 60);
    const secs = toleranceSeconds % 60;
    return `0${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }, [toleranceSeconds]);

  // =========================================================
  // SUBMISSÃO DO FORMULÁRIO DE REGISTO DO MOTORISTA
  // Requisito 1 & 2: O motorista submete o registo; o sistema verifica campos obrigatórios
  // =========================================================
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerVibrate();

    // Validação de campos obrigatórios
    if (!formNome.trim()) {
      onTriggerNotice('Campo Obrigatório', 'Por favor preencha o Nome Completo.', 'warning');
      return;
    }
    if (!formTelefone.trim() || formTelefone.length < 9) {
      onTriggerNotice('Campo Obrigatório', 'Por favor indique um Número de Telefone válido.', 'warning');
      return;
    }
    if (!formCarta.trim()) {
      onTriggerNotice('Campo Obrigatório', 'Por favor informe o Número da Carta de Condução.', 'warning');
      return;
    }
    if (!formMatricula.trim()) {
      onTriggerNotice('Campo Obrigatório', 'Por favor informe a Matrícula do Táxi.', 'warning');
      return;
    }
    if (!formTermosAceites) {
      onTriggerNotice('Termos de Operação', 'Deve aceitar as regras regulamentares do serviço de táxis.', 'warning');
      return;
    }

    // Registo salvo com sucesso no estado PENDENTE
    const pracaSelecionada = LUANDA_PRACAS.find((p) => p.id === formPracaId) || currentOriginPraca;
    setCurrentOriginPraca(pracaSelecionada);
    setCurrentDestName(formDestino);

    setDriverData({
      nomeCompleto: formNome,
      telefone: formTelefone,
      numeroCarta: formCarta,
      numeroBi: formBi,
      matricula: formMatricula.toUpperCase(),
      tipoViatura: formTipoViatura,
      modeloViatura: formModeloViatura,
      lotacaoLugares: 15,
      pracaOrigemId: formPracaId,
      rotaDestino: formDestino,
      statusConta: 'pendente', // Mantém Pendente conforme requisito!
      dataRegisto: new Date().toLocaleDateString('pt-AO'),
      validadoPresencialmente: false,
      fotoPasse: formFotoPasse,
      cartaFrente: formCartaFrente,
      cartaVerso: formCartaVerso,
      biFrente: formBiFrente,
      biVerso: formBiVerso,
      fotoViatura: formFotoViatura || DEFAULT_TAXI_IMAGE,
    });

    onTriggerNotice(
      'Registo Submetido com Sucesso!',
      'O sistema guardou os seus dados. Conforme as regras da operação, a conta fica no estado "Pendente" até validação do Administrador e vistoria pelo Fiscal de Praça.',
      'hourglass_top'
    );

    setActiveDriverTab('operacao');
  };

  // =========================================================
  // SIMULAÇÕES DE VALIDAÇÃO (ADMINISTRADOR E FISCAL)
  // Requisito 3 & 4: Administrador/Fiscal valida dados -> Aprovado ou Rejeitado
  // =========================================================
  const handleApproveByAdmin = () => {
    triggerVibrate();
    setDriverData((prev) => ({
      ...prev,
      statusConta: 'aprovado',
      dataAprovacao: new Date().toLocaleDateString('pt-AO'),
      aprovadoPor: 'Administração Central FilaTáxi / ANATA',
      motivoRejeicao: undefined,
    }));
    setValidationModalOpen(false);
    onTriggerNotice(
      'Conta de Motorista Aprovada!',
      `Os dados e documentos de ${driverData.nomeCompleto} foram homologados pela Administração. O motorista pode agora associar-se a uma praça e operar.`,
      'verified'
    );
  };

  const handleValidateInPersonByFiscal = () => {
    triggerVibrate();
    setDriverData((prev) => ({
      ...prev,
      validadoPresencialmente: true,
      fiscalValidador: 'Fiscal Mateus Zua (Praça do Kilamba / Baia 03)',
      statusConta: 'aprovado',
    }));
    setValidationModalOpen(false);
    onTriggerNotice(
      'Validação Presencial Concluída!',
      `Vistoria técnica da viatura ${driverData.matricula} e conferência física dos documentos realizada com sucesso pelo Fiscal Mateus Zua.`,
      'badge'
    );
  };

  const handleRejectByAdmin = () => {
    triggerVibrate();
    setDriverData((prev) => ({
      ...prev,
      statusConta: 'rejeitado',
      motivoRejeicao: rejectionReasonInput || 'Documentação não conforme com os requisitos regulamentares.',
    }));
    setValidationModalOpen(false);
    onTriggerNotice(
      'Registo Rejeitado',
      `O registo do motorista foi rejeitado. Motivo: "${rejectionReasonInput}". O motorista deve retificar os dados para nova análise.`,
      'error'
    );
  };

  const handleResetToNewRegistration = () => {
    triggerVibrate();
    setDriverData((prev) => ({
      ...prev,
      statusConta: 'nao_registado',
      validadoPresencialmente: false,
    }));
    setActiveDriverTab('perfil');
    onTriggerNotice(
      'Novo Registo Iniciado',
      'Preencha o formulário completo com dados pessoais, carta de condução e documentos da viatura.',
      'edit_note'
    );
  };

  // =========================================================
  // AÇÕES DE OPERAÇÃO NA FILA E VIAGEM
  // =========================================================
  const handleAdvanceQueue = () => {
    triggerVibrate();
    if (queuePosition > 1) {
      const nextPos = queuePosition - 1;
      setQueuePosition(nextPos);
      if (nextPos === 1) {
        setQueueState('turn');
        setToleranceSeconds(180);
        onTriggerNotice(
          '🔔 É A SUA VEZ!',
          `Viatura ${driverData.matricula}: Desloque-se à Baia 03 para embarque imediato dos 15 passageiros!`,
          'notifications_active'
        );
      } else {
        onTriggerNotice(
          'Avanço na Fila',
          `Viatura avançou para a posição #${nextPos} na fila da Praça de ${currentOriginPraca.name}.`,
          'sync'
        );
      }
    } else {
      setQueueState('turn');
    }
  };

  const handleStartTrip = () => {
    triggerVibrate();
    setTripActive(true);
    setTripElapsedMinutes(1);
    setTripProgressPercent(5);
    setTripSpeedKmh(45);
    setTripCompletedSummary(false);
    setActiveDriverTab('viagem');
    onTriggerNotice(
      'Viagem Iniciada!',
      `Carrinha ${driverData.matricula} a caminho de ${currentDestName} com 15 passageiros a bordo. Telemetria e mapa em direto ativados.`,
      'play_arrow'
    );
  };

  const handleFinishTrip = () => {
    triggerVibrate();
    setTripActive(false);
    setTripCompletedSummary(true);
    setDailyTripsCount((prev) => prev + 1);
    setDailyRevenueKz((prev) => prev + 7500); // 15 lugares * 500 Kz
    onTriggerNotice(
      'Chegada à Praça de Destino!',
      `Viagem concluída em ${currentDestName}. Faturamento bruto da corrida: 7.500 Kz. Posição reservada na fila de retorno.`,
      'task_alt'
    );
  };

  const handleReturnQueueAtDestination = () => {
    triggerVibrate();
    // Inverte origem e destino para rota de regresso
    const pracaDestino =
      LUANDA_PRACAS.find((p) => p.name.toLowerCase().includes(currentDestName.toLowerCase())) ||
      LUANDA_PRACAS[1];
    const novoDestino = currentOriginPraca.name
      .replace('Praça do ', '')
      .replace('Praça da ', '')
      .replace('Praça de ', '');

    setCurrentOriginPraca(pracaDestino);
    setCurrentDestName(novoDestino);
    setQueuePosition(pracaDestino.naFila + 1);
    setQueueState('waiting');
    setTripCompletedSummary(false);
    setActiveDriverTab('fila');

    onTriggerNotice(
      'Inscrito na Fila de Regresso',
      `Viatura ${driverData.matricula} posicionada no final da fila da Praça de ${pracaDestino.name} (#${pracaDestino.naFila + 1}) com destino a ${novoDestino}.`,
      'login'
    );
  };

  const handleAddIncident = (e: React.FormEvent) => {
    e.preventDefault();
    triggerVibrate();
    if (!newIncidentDesc.trim()) {
      onTriggerNotice('Aviso', 'Descreva sucintamente a ocorrência.', 'warning');
      return;
    }
    const newInc: DriverIncident = {
      id: `inc-${Date.now()}`,
      tipo: newIncidentTipo,
      descricao: newIncidentDesc,
      hora: new Date().toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' }),
      local: newIncidentLocal || `${currentOriginPraca.corridor}`,
    };
    setIncidentsList([newInc, ...incidentsList]);
    setNewIncidentDesc('');
    setNewIncidentLocal('');
    onTriggerNotice(
      'Ocorrência Transmitida!',
      `Alerta de "${newIncidentTipo}" partilhado em tempo real com todos os motoristas e fiscais da rota.`,
      'campaign'
    );
  };

  return (
    <div className="flex flex-col w-full pb-20">
      {/* ========================================================= */}
      {/* SUB-NAVEGAÇÃO SUPERIOR DO MOTORISTA                       */}
      {/* ========================================================= */}
      <div className="bg-surface-container-low border-b border-surface-container px-gutter py-2 sticky top-16 z-30">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          {[
            { id: 'operacao', label: 'Painel', icon: 'dashboard' },
            { id: 'fila', label: 'Minha Fila', icon: 'queue' },
            { id: 'viagem', label: 'Viagem', icon: 'near_me' },
            { id: 'pagamentos', label: 'Pagamentos', icon: 'payments' },
            { id: 'ocorrencias', label: 'Ocorrências', icon: 'report_problem' },
            { id: 'perfil', label: 'Ficha / Registo', icon: 'badge' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                triggerVibrate();
                setActiveDriverTab(tab.id as typeof activeDriverTab);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                activeDriverTab === tab.id
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container text-on-surface-variant hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.id === 'fila' && driverData.statusConta === 'aprovado' && inQueue && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-secondary-container text-on-secondary-fixed text-[10px] font-extrabold">
                  #{queuePosition}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* BANNER REGULATÓRIO DE ESTADO DA CONTA                     */}
      {/* ========================================================= */}
      <div className="px-gutter pt-3">
        {driverData.statusConta === 'pendente' && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 shadow-sm flex flex-col gap-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">hourglass_top</span>
                </span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-title-lg text-sm font-bold text-amber-950">
                      Registo Submetido • Aguarda Homologação
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#ffeed9] text-[#c45e00] font-bold text-[11px]">
                      Pendente
                    </span>
                  </div>
                  <p className="text-xs text-amber-900 mt-0.5 leading-snug">
                    O sistema guardou os dados, mas <strong>não permite automaticamente</strong> que o motorista comece a operar até validação do Administrador e vistoria presencial pelo Fiscal.
                  </p>
                </div>
              </div>
            </div>

            {/* Ações de simulação para demonstração do fluxo completo */}
            <div className="flex flex-wrap gap-2 pt-1 border-t border-amber-200/80">
              <button
                onClick={() => setValidationModalOpen(true)}
                className="px-3 py-1.5 bg-primary text-on-primary text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-[16px] text-secondary-container">
                  admin_panel_settings
                </span>
                <span>Painel de Validação (Admin / Fiscal)</span>
              </button>
              <button
                onClick={() => setViewFichaModalOpen(true)}
                className="px-3 py-1.5 bg-white text-primary border border-amber-300 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer hover:bg-amber-100/50"
              >
                <span className="material-symbols-outlined text-[16px] text-secondary">
                  badge
                </span>
                <span>Ver Ficha Ilustrada</span>
              </button>
            </div>
          </div>
        )}

        {driverData.statusConta === 'rejeitado' && (
          <div className="p-3.5 rounded-2xl bg-error-container/40 border border-error/30 shadow-sm flex flex-col gap-2 text-on-error-container">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-error text-[24px]">cancel</span>
                <span className="font-bold text-sm text-error">Conta Rejeitada pela Administração</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-error text-white font-bold text-[10px]">
                Rejeitado
              </span>
            </div>
            <p className="text-xs leading-relaxed">
              <strong>Motivo:</strong> {driverData.motivoRejeicao}
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  setActiveDriverTab('perfil');
                  setDriverData((prev) => ({ ...prev, statusConta: 'nao_registado' }));
                }}
                className="px-3 py-1.5 bg-error text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Corrigir Documentos e Reenviar
              </button>
              <button
                onClick={() => setValidationModalOpen(true)}
                className="px-3 py-1.5 bg-surface-container text-primary text-xs font-bold rounded-lg cursor-pointer"
              >
                Simular Aprovação
              </button>
            </div>
          </div>
        )}

        {driverData.statusConta === 'aprovado' && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-sm flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">verified</span>
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-emerald-950 truncate">
                    Motorista Credenciado & Aprovado
                  </span>
                  <span className="px-2 py-0.2 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                    Aprovado
                  </span>
                </div>
                <span className="text-[11px] text-emerald-800 block truncate">
                  Viatura {driverData.matricula} • {driverData.validadoPresencialmente ? 'Vistoriado na Baia' : 'Homologado Central'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setViewFichaModalOpen(true)}
              className="px-2.5 py-1 bg-white border border-emerald-300 text-emerald-900 font-bold text-xs rounded-lg cursor-pointer shrink-0"
            >
              Ficha
            </button>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* FICHA DO MOTORISTA (EXEMPLO FIEL À IMAGEM DO UTILIZADOR)  */}
      {/* ========================================================= */}
      <div className="px-gutter pt-3">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 leading-snug">
              Exemplo de ficha do motorista
            </h3>
            <p className="text-xs text-slate-500">
              Dados ilustrativos de um registo.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs pt-1">
            {/* Nome completo */}
            <div>
              <span className="text-slate-500 block text-[11px] mb-0.5">Nome completo</span>
              <strong className="text-slate-900 text-sm font-semibold block">
                {driverData.nomeCompleto}
              </strong>
            </div>

            {/* Telefone */}
            <div>
              <span className="text-slate-500 block text-[11px] mb-0.5">Telefone</span>
              <strong className="text-slate-900 text-sm font-semibold block">
                {driverData.telefone}
              </strong>
            </div>

            {/* N.º da carta */}
            <div>
              <span className="text-slate-500 block text-[11px] mb-0.5">N.º da carta</span>
              <strong className="text-slate-900 text-sm font-semibold block tracking-wide">
                {driverData.numeroCarta}
              </strong>
            </div>

            {/* Matrícula */}
            <div>
              <span className="text-slate-500 block text-[11px] mb-0.5">Matrícula</span>
              <strong className="text-slate-900 text-sm font-semibold block tracking-wider">
                {driverData.matricula}
              </strong>
            </div>

            {/* Tipo de viatura */}
            <div>
              <span className="text-slate-500 block text-[11px] mb-0.5">Tipo de viatura</span>
              <strong className="text-slate-900 text-sm font-semibold block">
                {driverData.tipoViatura}
              </strong>
            </div>

            {/* Estado da conta */}
            <div>
              <span className="text-slate-500 block text-[11px] mb-1">Estado da conta</span>
              {driverData.statusConta === 'pendente' && (
                <span className="inline-block px-3 py-1 rounded-full bg-[#ffeed9] text-[#c45e00] text-xs font-semibold">
                  Pendente
                </span>
              )}
              {driverData.statusConta === 'aprovado' && (
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                  Aprovado
                </span>
              )}
              {driverData.statusConta === 'rejeitado' && (
                <span className="inline-block px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-semibold">
                  Rejeitado
                </span>
              )}
              {driverData.statusConta === 'nao_registado' && (
                <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                  Não Registado
                </span>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11.5px] text-slate-600 leading-relaxed">
            {driverData.statusConta === 'pendente' ? (
              <span className="text-slate-700 font-medium">
                O sistema guarda os dados, mas não deve permitir automaticamente que o motorista comece a operar.
              </span>
            ) : driverData.statusConta === 'aprovado' ? (
              <span className="text-emerald-800 font-medium">
                Conta validada pela Administração e Fiscal. Operação liberada na Praça de {currentOriginPraca.name}.
              </span>
            ) : (
              <span className="text-rose-800 font-medium">
                Registo pendente de correção. Não autorizado para transporte de passageiros.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SE O MOTORISTA NÃO ESTIVER APROVADO: BLOQUEIO REGULAMENTAR */}
      {/* ========================================================= */}
      {driverData.statusConta !== 'aprovado' && activeDriverTab !== 'perfil' && (
        <div className="px-gutter pt-4">
          <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container text-center space-y-3 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-secondary-container/30 text-secondary flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[32px]">lock</span>
            </div>
            <div className="space-y-1">
              <h4 className="font-title-lg text-primary text-base font-bold">
                Operação Bloqueada até Validação
              </h4>
              <p className="text-xs text-on-surface-variant max-w-xs mx-auto leading-relaxed">
                De acordo com as regras da operação do transporte colectivo em Luanda, o motorista só pode associar-se a uma praça e entrar na fila após aprovação pelo Administrador e validação presencial pelo Fiscal.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-2 justify-center">
              <button
                onClick={() => setValidationModalOpen(true)}
                className="py-2.5 px-4 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-transform cursor-pointer"
              >
                <span className="material-symbols-outlined text-[17px] text-secondary-container">
                  admin_panel_settings
                </span>
                Validar e Aprovar Conta Agora
              </button>
              <button
                onClick={() => setActiveDriverTab('perfil')}
                className="py-2.5 px-4 rounded-xl bg-surface-container text-primary font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[17px]">edit</span>
                Editar Formulário de Registo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ABA 1: OPERAÇÃO / DISPONIBILIDADE E DASHBOARD             */}
      {/* ========================================================= */}
      {activeDriverTab === 'operacao' && driverData.statusConta === 'aprovado' && (
        <div className="px-gutter pt-4 space-y-4">
          {/* Cartão de Disponibilidade e Associação à Praça */}
          <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[22px]">
                  commute
                </span>
                <span className="font-title-lg text-primary font-bold text-sm">
                  Disponibilidade & Associação à Praça
                </span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  availability === 'disponivel'
                    ? 'bg-emerald-100 text-emerald-800'
                    : availability === 'pausa'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {availability === 'disponivel'
                  ? '🟢 Disponível'
                  : availability === 'pausa'
                  ? '🟡 Em Pausa'
                  : '🔴 Fora de Serviço'}
              </span>
            </div>

            {/* Seletor de Disponibilidade */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'disponivel', label: 'Disponível', icon: 'check_circle', color: 'emerald' },
                { id: 'pausa', label: 'Pausa/Almoço', icon: 'coffee', color: 'amber' },
                { id: 'fora_servico', label: 'Fora Serviço', icon: 'do_not_disturb_on', color: 'slate' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    triggerVibrate();
                    setAvailability(item.id as DriverAvailability);
                  }}
                  className={`p-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    availability === item.id
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {/* Associação à Praça e Rota */}
            <div className="p-3 rounded-xl bg-surface-container-low space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant font-medium">Praça Associada:</span>
                <strong className="text-primary font-bold">{currentOriginPraca.name}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant font-medium">Rota / Destino:</span>
                <strong className="text-secondary font-bold">→ {currentDestName}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant font-medium">Viatura:</span>
                <strong className="text-primary">{driverData.matricula} ({driverData.tipoViatura})</strong>
              </div>
            </div>

            {/* Botão de Ação Rápida */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  triggerVibrate();
                  setActiveDriverTab('fila');
                }}
                className="py-3 px-3 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-transform cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-secondary-container">
                  queue
                </span>
                <span>Ir para Minha Fila (#{queuePosition})</span>
              </button>
              <button
                onClick={() => {
                  triggerVibrate();
                  handleAdvanceQueue();
                }}
                className="py-3 px-3 rounded-xl bg-secondary-container text-on-secondary-fixed font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">fast_forward</span>
                <span>Simular Avanço</span>
              </button>
            </div>
          </div>

          {/* Resumo Financeiro e Viagens do Dia */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-surface-container-lowest p-3.5 rounded-2xl shadow-sm space-y-1">
              <span className="text-[11px] text-on-surface-variant font-medium block">
                Viagens Realizadas Hoje
              </span>
              <div className="flex items-baseline gap-1">
                <strong className="text-2xl font-black text-primary">{dailyTripsCount}</strong>
                <span className="text-xs text-on-surface-variant">corridas</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-bold block">
                {dailyTripsCount * 15} passageiros transportados
              </span>
            </div>

            <div className="bg-surface-container-lowest p-3.5 rounded-2xl shadow-sm space-y-1">
              <span className="text-[11px] text-on-surface-variant font-medium block">
                Faturamento Bruto
              </span>
              <div className="flex items-baseline gap-1">
                <strong className="text-xl font-black text-primary">
                  {dailyRevenueKz.toLocaleString('pt-AO')}
                </strong>
                <span className="text-xs text-primary font-bold">Kz</span>
              </div>
              <span className="text-[10px] text-secondary font-bold block">
                Comissão motorista: {Math.round(dailyRevenueKz * 0.35).toLocaleString('pt-AO')} Kz
              </span>
            </div>
          </div>

          {/* Mapa da Praça ao Vivo */}
          <div className="bg-surface-container-lowest p-3.5 rounded-2xl shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-secondary">explore</span>
                <span className="text-xs font-bold text-primary">
                  Terminal de Despacho • {currentOriginPraca.name}
                </span>
              </div>
              <span className="text-[11px] text-emerald-700 font-bold">GPS em Direto</span>
            </div>
            <div className="w-full h-40 rounded-xl overflow-hidden shadow-inner">
              <LiveMapView
                center={{ lat: currentOriginPraca.lat, lng: currentOriginPraca.lng }}
                zoom={14}
                userLocation={userLocation}
                selectedPraca={currentOriginPraca}
                heightClass="h-40"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ABA 2: MINHA FILA (AGUARDANDO A VEZ & "É A SUA VEZ!")     */}
      {/* ========================================================= */}
      {activeDriverTab === 'fila' && driverData.statusConta === 'aprovado' && (
        <div className="px-gutter pt-4 space-y-4">
          {/* Seletor de Simulação de Estado da Fila */}
          <div className="flex items-center justify-between p-2.5 bg-surface-container-low rounded-xl text-xs">
            <span className="font-bold text-on-surface-variant">Simulador de Despacho:</span>
            <div className="flex gap-1.5">
              <button
                onClick={() => {
                  triggerVibrate();
                  setQueueState('waiting');
                  setQueuePosition(12);
                }}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  queueState === 'waiting'
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                Na Fila (#12)
              </button>
              <button
                onClick={() => {
                  triggerVibrate();
                  setQueueState('turn');
                  setQueuePosition(1);
                  setToleranceSeconds(180);
                }}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  queueState === 'turn'
                    ? 'bg-secondary-container text-on-secondary-fixed shadow-sm'
                    : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                Sua Vez! 🔔
              </button>
            </div>
          </div>

          {queueState === 'waiting' ? (
            /* VISÃO: AGUARDANDO NA FILA */
            <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-secondary font-bold uppercase tracking-wider block">
                    Praça de Despacho
                  </span>
                  <h3 className="font-headline-sm text-primary text-lg font-extrabold">
                    {currentOriginPraca.name} ➔ {currentDestName}
                  </h3>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold text-xs">
                  Fila Operacional
                </span>
              </div>

              {/* Destaque de Posição */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-secondary-container via-amber-200 to-secondary-container text-on-secondary-fixed flex items-center justify-between shadow-inner">
                <div>
                  <span className="text-[11px] uppercase font-bold tracking-wider text-amber-950 block">
                    Sua Posição Oficial
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-4xl font-black text-amber-950">#{queuePosition}</span>
                    <span className="text-xs font-bold text-amber-900">na carrinha</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-amber-900 block font-medium">Tempo estimado</span>
                  <strong className="text-xl font-black text-amber-950">
                    ~{Math.max(2, Math.round(queuePosition * 1.5))} min
                  </strong>
                  <span className="text-[10px] text-amber-900 block mt-0.5">
                    {Math.max(0, queuePosition - 1)} táxis à frente
                  </span>
                </div>
              </div>

              {/* Botões de Ação na Fila */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={handleAdvanceQueue}
                  className="w-full h-13 rounded-xl bg-primary text-on-primary font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition-transform cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px] text-secondary-container">
                    fast_forward
                  </span>
                  Avançar Posição na Fila
                </button>
                <button
                  onClick={() => {
                    triggerVibrate();
                    setInQueue(false);
                    onTriggerNotice(
                      'Pausa Temporária',
                      'Viatura saiu temporariamente da fila da praça. Pode reentrar a qualquer momento.',
                      'logout'
                    );
                  }}
                  className="w-full py-2.5 rounded-xl bg-surface-container text-on-surface-variant font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">pause_circle</span>
                  Suspender Fila Temporariamente
                </button>
              </div>
            </div>
          ) : (
            /* VISÃO: É A SUA VEZ! DESPACHO IMEDIATO NA BAIA */
            <div className="bg-primary text-on-primary p-5 rounded-2xl shadow-xl space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-primary-container pb-2">
                <span className="px-3 py-1 rounded-full bg-secondary-container text-on-secondary-fixed text-xs font-black flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">notifications_active</span>
                  CHAMADA DE DESPACHO
                </span>
                <span className="text-xs text-primary-fixed-dim">
                  Fiscal: Mateus Zua
                </span>
              </div>

              <div className="text-center space-y-1 py-1">
                <div className="w-16 h-16 rounded-full bg-secondary-container text-on-secondary-fixed flex items-center justify-center mx-auto shadow-lg animate-bounce">
                  <span className="material-symbols-outlined text-[36px]">local_taxi</span>
                </div>
                <h3 className="text-2xl font-black text-on-primary tracking-tight">
                  🔔 É A SUA VEZ!
                </h3>
                <p className="text-sm font-bold text-secondary-container">
                  Encoste agora na BAIA 03 da Praça de {currentOriginPraca.name}
                </p>
              </div>

              {/* Informações da Baia e Tolerância */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-surface-container-lowest text-primary p-3 rounded-xl shadow-xs">
                  <span className="text-[11px] text-on-surface-variant block">Baia Designada</span>
                  <strong className="text-lg font-black text-secondary">BAIA 03</strong>
                  <span className="text-[10px] text-on-surface-variant block mt-0.5">
                    Destino: {currentDestName}
                  </span>
                </div>
                <div className="bg-surface-container-lowest text-primary p-3 rounded-xl shadow-xs">
                  <span className="text-[11px] text-on-surface-variant block">Tempo Tolerância</span>
                  <strong className="text-lg font-black text-rose-600">{formattedTolerance}</strong>
                  <span className="text-[10px] text-on-surface-variant block mt-0.5">
                    15 pessoas aguardando
                  </span>
                </div>
              </div>

              {/* Ação Primária: Iniciar Viagem */}
              <button
                onClick={handleStartTrip}
                className="w-full h-15 rounded-xl bg-secondary-container text-on-secondary-fixed font-black text-base flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform cursor-pointer"
              >
                <span className="material-symbols-outlined text-[26px]">play_arrow</span>
                CONFIRMAR EMBARQUE & INICIAR VIAGEM
              </button>
            </div>
          )}

          {/* Lista de Passageiros Alinhados para Embarque */}
          <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">
                  groups
                </span>
                <span className="font-bold text-sm text-primary">
                  Passageiros Alinhados ({tripPassengers.length}/15 Lugares)
                </span>
              </div>
              <span className="text-xs font-bold text-emerald-700">Lotação Completa</span>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {tripPassengers.map((p) => (
                <div
                  key={p.id}
                  className="p-2.5 rounded-xl bg-surface-container-low flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-6 h-6 rounded-md bg-primary text-on-primary flex items-center justify-center font-bold text-[11px] shrink-0">
                      {p.assento}
                    </span>
                    <div className="min-w-0">
                      <strong className="text-primary truncate block">{p.nomePassageiro}</strong>
                      <span className="text-[10px] text-on-surface-variant block">
                        {p.tipo} {p.codigo ? `(${p.codigo})` : ''} • {p.metodoPagamento}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0">
                    500 Kz (Pago)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ABA 3: VIAGEM EM CURSO E REGISTO DE CHEGADA               */}
      {/* ========================================================= */}
      {activeDriverTab === 'viagem' && (
        <div className="px-gutter pt-4 space-y-4">
          {tripActive ? (
            /* MODO DE NAVEGAÇÃO E TELEMETRIA EM DIRETO */
            <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="font-bold text-sm text-primary">
                    Viagem em Curso: {currentOriginPraca.name} ➔ {currentDestName}
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-primary text-on-primary text-xs font-bold">
                  {tripElapsedMinutes} min decorridos
                </span>
              </div>

              {/* Velocímetro e Telemetria */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-xl bg-surface-container-low">
                  <span className="text-[10px] text-on-surface-variant block">Velocidade</span>
                  <strong className="text-2xl font-black text-primary">{tripSpeedKmh}</strong>
                  <span className="text-[10px] text-on-surface-variant block">km/h</span>
                </div>
                <div className="p-3 rounded-xl bg-surface-container-low">
                  <span className="text-[10px] text-on-surface-variant block">Passageiros</span>
                  <strong className="text-2xl font-black text-secondary">15</strong>
                  <span className="text-[10px] text-on-surface-variant block">a bordo</span>
                </div>
                <div className="p-3 rounded-xl bg-surface-container-low">
                  <span className="text-[10px] text-on-surface-variant block">Previsão</span>
                  <strong className="text-2xl font-black text-emerald-700">~18</strong>
                  <span className="text-[10px] text-on-surface-variant block">min restantes</span>
                </div>
              </div>

              {/* Barra de Progresso no Corredor */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-on-surface-variant font-medium">
                  <span>Partida: {currentOriginPraca.name}</span>
                  <span>Chegada: {currentDestName}</span>
                </div>
                <div className="w-full h-3 rounded-full bg-surface-container overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500 rounded-full"
                    style={{ width: `${tripProgressPercent}%` }}
                  ></div>
                </div>
              </div>

              {/* Mapa de Rastreio em Direto */}
              <div className="w-full h-44 rounded-xl overflow-hidden shadow-inner">
                <LiveMapView
                  center={{ lat: currentOriginPraca.lat, lng: currentOriginPraca.lng }}
                  zoom={13}
                  userLocation={userLocation}
                  selectedPraca={currentOriginPraca}
                  heightClass="h-44"
                />
              </div>

              {/* Botão de Conclusão e Registo de Chegada */}
              <button
                onClick={handleFinishTrip}
                className="w-full h-14 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform cursor-pointer"
              >
                <span className="material-symbols-outlined text-[24px]">task_alt</span>
                REGISTAR CHEGADA À PRAÇA DE {currentDestName.toUpperCase()}
              </button>
            </div>
          ) : tripCompletedSummary ? (
            /* RESUMO DA VIAGEM CONCLUÍDA */
            <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[36px]">check_circle</span>
              </div>
              <div>
                <h3 className="font-headline-sm text-primary text-xl font-black">
                  Viagem Concluída com Sucesso!
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Desembarque registado na Praça de {currentDestName}
                </p>
              </div>

              {/* Faturamento da Corrida */}
              <div className="p-4 rounded-xl bg-primary text-on-primary space-y-1">
                <span className="text-xs text-primary-fixed-dim uppercase tracking-wider block">
                  Faturamento Bruto da Viagem
                </span>
                <strong className="text-3xl font-black text-secondary-container">
                  7.500 Kz
                </strong>
                <span className="text-xs text-primary-fixed-dim block">
                  Tarifa: 500 Kz × 15 passageiros
                </span>
              </div>

              {/* Ação de Retorno à Fila */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={handleReturnQueueAtDestination}
                  className="w-full h-14 rounded-xl bg-secondary-container text-on-secondary-fixed font-black text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[22px]">login</span>
                  ENTRAR NA FILA DE RETORNO EM {currentDestName.toUpperCase()}
                </button>
                <button
                  onClick={() => {
                    triggerVibrate();
                    setActiveDriverTab('operacao');
                  }}
                  className="w-full py-2.5 rounded-xl bg-surface-container text-primary font-bold text-xs cursor-pointer"
                >
                  Voltar ao Painel Geral
                </button>
              </div>
            </div>
          ) : (
            /* SEM VIAGEM ATIVA */
            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm text-center space-y-3">
              <span className="material-symbols-outlined text-[40px] text-on-surface-variant">
                directions_car
              </span>
              <h4 className="font-bold text-primary text-base">Sem Viagem em Curso</h4>
              <p className="text-xs text-on-surface-variant max-w-xs mx-auto">
                Aguarde a sua vez na fila para embarque na baia ou inicie a próxima rota.
              </p>
              <button
                onClick={() => setActiveDriverTab('fila')}
                className="py-2.5 px-4 rounded-xl bg-primary text-on-primary font-bold text-xs cursor-pointer"
              >
                Ver Estado da Minha Fila
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* ABA 4: PAGAMENTOS E DIVISÃO DIGITAL DE RECEITAS           */}
      {/* ========================================================= */}
      {activeDriverTab === 'pagamentos' && (
        <div className="px-gutter pt-4 space-y-4">
          <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-surface-container pb-2">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-secondary-container text-on-secondary-fixed flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[22px]">payments</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-primary">Registo de Pagamentos & Multicaixa</h3>
                  <p className="text-[11px] text-on-surface-variant">Multicaixa Express & Dinheiro Físico</p>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Ativo</span>
            </div>

            {/* Divisão Digital Automática de Receitas */}
            <div className="p-3.5 rounded-xl bg-surface-container-low space-y-2 text-xs">
              <div className="flex items-center justify-between pb-1 border-b border-surface-container">
                <span className="font-bold text-primary">
                  Divisão Automática Regulamentar (Base: {dailyRevenueKz.toLocaleString('pt-AO')} Kz)
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Homologada AO
                </span>
              </div>
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-primary">key</span>
                    Cota do Proprietário (60%):
                  </span>
                  <strong className="text-primary font-bold">
                    {Math.round(dailyRevenueKz * 0.6).toLocaleString('pt-AO')} Kz
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-secondary">badge</span>
                    Comissão Motorista & Cobrador (35%):
                  </span>
                  <strong className="text-primary font-bold">
                    {Math.round(dailyRevenueKz * 0.35).toLocaleString('pt-AO')} Kz
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-primary">account_balance</span>
                    Taxa Sindical & Fiscal de Praça (5%):
                  </span>
                  <strong className="text-primary font-bold">
                    {Math.round(dailyRevenueKz * 0.05).toLocaleString('pt-AO')} Kz
                  </strong>
                </div>
              </div>
            </div>

            {/* Ações Rápidas de Pagamento */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  triggerVibrate();
                  setDailyRevenueKz((prev) => prev + 500);
                  onTriggerNotice(
                    'Pagamento Dinheiro Registado',
                    'Recebido 500 Kz em dinheiro físico de passageiro a bordo.',
                    'payments'
                  );
                }}
                className="py-2.5 px-3 rounded-xl bg-surface-container-high text-primary font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-[18px]">attach_money</span>
                + 500 Kz Dinheiro
              </button>
              <button
                onClick={() => {
                  triggerVibrate();
                  setDailyRevenueKz((prev) => prev + 500);
                  onTriggerNotice(
                    'Pagamento Multicaixa Express',
                    'Recebido 500 Kz via Multicaixa Express.',
                    'qr_code_2'
                  );
                }}
                className="py-2.5 px-3 rounded-xl bg-secondary-container text-on-secondary-fixed font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
                + 500 Kz MCX
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ABA 5: OCORRÊNCIAS E TRÂNSITO EM TEMPO REAL               */}
      {/* ========================================================= */}
      {activeDriverTab === 'ocorrencias' && (
        <div className="px-gutter pt-4 space-y-4">
          <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-surface-container pb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[22px]">
                  campaign
                </span>
                <h3 className="font-bold text-sm text-primary">Registo de Ocorrências no Corredor</h3>
              </div>
              <span className="text-xs text-on-surface-variant">{incidentsList.length} reportadas</span>
            </div>

            {/* Formulário para Reportar Ocorrência */}
            <form onSubmit={handleAddIncident} className="space-y-2.5 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-primary block mb-1">
                    Tipo de Ocorrência
                  </label>
                  <select
                    value={newIncidentTipo}
                    onChange={(e) => setNewIncidentTipo(e.target.value)}
                    className="w-full h-10 px-2.5 rounded-lg bg-surface-container-low text-primary text-xs font-medium focus:outline-none"
                  >
                    <option value="Engarrafamento">Engarrafamento</option>
                    <option value="Operação Policial">Operação Policial</option>
                    <option value="Avaria na Via">Avaria na Via</option>
                    <option value="Obras na Pista">Obras na Pista</option>
                    <option value="Passageiro sem Troco">Passageiro sem Troco</option>
                    <option value="Outro Incidente">Outro Incidente</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-primary block mb-1">
                    Local / Ponto de Referência
                  </label>
                  <input
                    type="text"
                    value={newIncidentLocal}
                    onChange={(e) => setNewIncidentLocal(e.target.value)}
                    placeholder="Ex: Nó da Corimba"
                    className="w-full h-10 px-2.5 rounded-lg bg-surface-container-low text-primary text-xs font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-primary block mb-1">
                  Descrição Rápida
                </label>
                <input
                  type="text"
                  value={newIncidentDesc}
                  onChange={(e) => setNewIncidentDesc(e.target.value)}
                  placeholder="Ex: Trânsito parado no sentido Benfica - Centro devido a obras"
                  className="w-full h-10 px-2.5 rounded-lg bg-surface-container-low text-primary text-xs font-medium focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full h-11 bg-primary text-on-primary font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-secondary-container">
                  send
                </span>
                Transmitir Alerta aos Motoristas & Fiscais
              </button>
            </form>
          </div>

          {/* Histórico de Ocorrências */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-primary px-1">Alertas Recentes em Luanda</h4>
            {incidentsList.map((inc) => (
              <div
                key={inc.id}
                className="p-3 rounded-xl bg-surface-container-lowest border border-surface-container text-xs space-y-1 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary flex items-center gap-1">
                    <span className="material-symbols-outlined text-secondary text-[16px]">
                      warning
                    </span>
                    {inc.tipo}
                  </span>
                  <span className="text-[10px] text-on-surface-variant">{inc.hora}</span>
                </div>
                <p className="text-on-surface leading-snug">{inc.descricao}</p>
                <span className="text-[10px] text-on-surface-variant block font-medium">
                  📍 {inc.local}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ABA 6: FICHA E FORMULÁRIO COMPLETO DO MOTORISTA           */}
      {/* ========================================================= */}
      {activeDriverTab === 'perfil' && (
        <div className="px-gutter pt-4 space-y-4">
          {/* Formulário de Criação / Edição de Conta de Motorista */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-surface-container pb-2">
              <div>
                <h3 className="font-bold text-base text-primary">Formulário de Registo do Motorista</h3>
                <p className="text-xs text-on-surface-variant">
                  Registe os seus dados, a carta de condução e associe a viatura
                </p>
              </div>
              <button
                onClick={handleResetToNewRegistration}
                className="px-2.5 py-1 bg-surface-container text-primary text-[11px] font-bold rounded-lg cursor-pointer"
                title="Limpar e criar do zero"
              >
                Criar do Zero
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
              {/* Nome Completo */}
              <div>
                <label className="font-bold text-primary block mb-1">Nome Completo *</label>
                <input
                  type="text"
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  placeholder="Ex: João Manuel"
                  required
                  className="w-full h-11 px-3 rounded-lg bg-surface-container-low text-primary font-medium focus:outline-none"
                />
              </div>

              {/* Telefone & WhatsApp */}
              <div>
                <label className="font-bold text-primary block mb-1">Telefone / WhatsApp *</label>
                <input
                  type="tel"
                  value={formTelefone}
                  onChange={(e) => setFormTelefone(e.target.value)}
                  placeholder="+244 9XX XXX XXX"
                  required
                  className="w-full h-11 px-3 rounded-lg bg-surface-container-low text-primary font-medium focus:outline-none"
                />
              </div>

              {/* Documentos: Carta de Condução e B.I. */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-primary block mb-1">N.º da Carta *</label>
                  <input
                    type="text"
                    value={formCarta}
                    onChange={(e) => setFormCarta(e.target.value.toUpperCase())}
                    placeholder="CARTA-001"
                    required
                    className="w-full h-11 px-3 rounded-lg bg-surface-container-low text-primary font-medium uppercase focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-primary block mb-1">N.º do B.I. *</label>
                  <input
                    type="text"
                    value={formBi}
                    onChange={(e) => setFormBi(e.target.value.toUpperCase())}
                    placeholder="004829104LA049"
                    required
                    className="w-full h-11 px-3 rounded-lg bg-surface-container-low text-primary font-medium uppercase focus:outline-none"
                  />
                </div>
              </div>

              {/* Associação da Viatura */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-primary block mb-1">Matrícula da Viatura *</label>
                  <input
                    type="text"
                    value={formMatricula}
                    onChange={(e) => setFormMatricula(e.target.value.toUpperCase())}
                    placeholder="LD-00-00-XX"
                    required
                    className="w-full h-11 px-3 rounded-lg bg-surface-container-low text-primary font-medium uppercase focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-primary block mb-1">Tipo de Viatura *</label>
                  <select
                    value={formTipoViatura}
                    onChange={(e) => setFormTipoViatura(e.target.value)}
                    className="w-full h-11 px-2.5 rounded-lg bg-surface-container-low text-primary font-medium focus:outline-none"
                  >
                    <option value="Táxi">Táxi (Candongueiro)</option>
                    <option value="Táxi Colectivo 15L">Táxi Colectivo 15L</option>
                    <option value="Carrinha Lotação">Carrinha Lotação</option>
                  </select>
                </div>
              </div>

              {/* Modelo da Viatura */}
              <div>
                <label className="font-bold text-primary block mb-1">Marca / Modelo da Viatura</label>
                <input
                  type="text"
                  value={formModeloViatura}
                  onChange={(e) => setFormModeloViatura(e.target.value)}
                  placeholder="Toyota Hiace (Azul/Branco)"
                  className="w-full h-11 px-3 rounded-lg bg-surface-container-low text-primary font-medium focus:outline-none"
                />
              </div>

              {/* Praça e Rota Habitual */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-primary block mb-1">Praça de Saída</label>
                  <select
                    value={formPracaId}
                    onChange={(e) => {
                      setFormPracaId(e.target.value);
                      const p = LUANDA_PRACAS.find((item) => item.id === e.target.value);
                      if (p) setFormDestino(p.destinations[0]);
                    }}
                    className="w-full h-11 px-2.5 rounded-lg bg-surface-container-low text-primary font-medium focus:outline-none"
                  >
                    {LUANDA_PRACAS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-primary block mb-1">Rota / Destino</label>
                  <input
                    type="text"
                    value={formDestino}
                    onChange={(e) => setFormDestino(e.target.value)}
                    placeholder="Mutamba"
                    className="w-full h-11 px-3 rounded-lg bg-surface-container-low text-primary font-medium focus:outline-none"
                  />
                </div>
              </div>

              {/* Checkbox Termos */}
              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="driverTermsCheck"
                  checked={formTermosAceites}
                  onChange={(e) => setFormTermosAceites(e.target.checked)}
                  className="mt-0.5 accent-primary"
                />
                <label htmlFor="driverTermsCheck" className="text-[11px] text-on-surface-variant leading-tight">
                  Declaro que as informações e documentos submetidos são verdadeiros e que cumpro os regulamentos sindicais e a lotação oficial de 15 passageiros.
                </label>
              </div>

              {/* Botão de Submissão */}
              <button
                type="submit"
                className="w-full h-13 mt-2 bg-primary text-on-primary font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-98 transition-transform cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px] text-secondary-container">
                  send
                </span>
                Submeter Registo para Análise (Estado Pendente)
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: PAINEL DE VALIDAÇÃO (ADMINISTRADOR & FISCAL)       */}
      {/* ========================================================= */}
      {validationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary/70 backdrop-blur-sm p-margin">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl p-space-lg shadow-2xl space-y-space-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-1 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[22px] text-secondary-container">
                    admin_panel_settings
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-base text-primary">Validação Regulamentar de Conta</h3>
                  <p className="text-[11px] text-on-surface-variant">
                    Homologação pelo Administrador e Fiscal de Praça
                  </p>
                </div>
              </div>
              <button
                onClick={() => setValidationModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Dados do Motorista em Análise */}
            <div className="p-3.5 rounded-xl bg-surface-container-low space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Candidato a Motorista:</span>
                <strong className="text-primary font-bold">{driverData.nomeCompleto}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Contacto:</span>
                <span className="text-primary">{driverData.telefone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Carta de Condução:</span>
                <span className="text-primary font-bold">{driverData.numeroCarta}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Viatura Associada:</span>
                <span className="text-primary font-bold">{driverData.matricula} ({driverData.tipoViatura})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Estado Atual:</span>
                <span className="px-2 py-0.5 rounded-full bg-[#ffeed9] text-[#c45e00] font-bold text-[10px]">
                  {driverData.statusConta.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Checklist de Documentos Exigidos */}
            <div className="space-y-1.5 text-xs">
              <span className="font-bold text-primary block">Conferência de Documentos:</span>
              {[
                { doc: 'Carta de Condução Profissional (Válida)', status: 'Verificada' },
                { doc: 'Bilhete de Identidade (Nacionalidade)', status: 'Verificado' },
                { doc: 'Título de Registo / Livrete do Automóvel', status: 'Conforme' },
                { doc: 'Vistoria Física da Baia pelo Fiscal', status: driverData.validadoPresencialmente ? 'Aprovado na Baia' : 'Aguardando fiscal' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-1 border-b border-surface-container">
                  <span className="text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-emerald-600">check</span>
                    {item.doc}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-800">{item.status}</span>
                </div>
              ))}
            </div>

            {/* Motivo de Rejeição (caso rejeite) */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-primary block">
                Motivo de Rejeição (se aplicável):
              </label>
              <input
                type="text"
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg bg-surface-container-low text-primary text-xs focus:outline-none"
              />
            </div>

            {/* Botões de Decisão */}
            <div className="space-y-2 pt-1">
              <button
                onClick={handleApproveByAdmin}
                className="w-full h-12 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">verified</span>
                1. Homologar e Aprovar Conta (Administrador)
              </button>
              <button
                onClick={handleValidateInPersonByFiscal}
                className="w-full h-12 bg-primary text-on-primary font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-secondary-container">
                  badge
                </span>
                2. Validação Presencial na Baia (Fiscal de Praça)
              </button>
              <button
                onClick={handleRejectByAdmin}
                className="w-full h-11 bg-rose-50 text-rose-800 border border-rose-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">block</span>
                Rejeitar Registo (Simulação de Inconformidade)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: VER FICHA ILUSTRADA                                */}
      {/* ========================================================= */}
      {viewFichaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/70 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Etapa 2 — O Motorista cria a conta
              </span>
              <button
                onClick={() => setViewFichaModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                Exemplo de ficha do motorista
              </h3>
              <p className="text-xs text-slate-500">
                Dados ilustrativos de um registo.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-y-3.5 gap-x-4 text-xs pt-1">
              <div>
                <span className="text-slate-500 block text-[11px]">Nome completo</span>
                <strong className="text-slate-900 text-sm font-semibold block">{driverData.nomeCompleto}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Telefone</span>
                <strong className="text-slate-900 text-sm font-semibold block">{driverData.telefone}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">N.º da carta</span>
                <strong className="text-slate-900 text-sm font-semibold block">{driverData.numeroCarta}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Matrícula</span>
                <strong className="text-slate-900 text-sm font-semibold block">{driverData.matricula}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Tipo de viatura</span>
                <strong className="text-slate-900 text-sm font-semibold block">{driverData.tipoViatura}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] mb-0.5">Estado da conta</span>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    driverData.statusConta === 'pendente'
                      ? 'bg-[#ffeed9] text-[#c45e00]'
                      : driverData.statusConta === 'aprovado'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {driverData.statusConta === 'pendente'
                    ? 'Pendente'
                    : driverData.statusConta === 'aprovado'
                    ? 'Aprovado'
                    : 'Rejeitado'}
                </span>
              </div>
            </div>

            <p className="text-[11.5px] text-slate-600 pt-2 border-t border-slate-100 leading-snug">
              O sistema guarda os dados, mas não deve permitir automaticamente que o motorista comece a operar.
            </p>

            <button
              onClick={() => setViewFichaModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
