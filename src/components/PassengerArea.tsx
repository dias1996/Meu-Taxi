import React, { useState } from 'react';
import { LiveMapView, LUANDA_PRACAS, PracaLocation } from './LiveMapView';

export interface PassengerProfile {
  name: string;
  phone: string;
  email: string;
  biNumber: string;
  avatarUrl: string;
  notificationChannel: 'WhatsApp' | 'SMS' | 'Ambos';
}

export interface PassengerTripRecord {
  id: string;
  origin: string;
  destination: string;
  date: string;
  time: string;
  vehiclePlate: string;
  driverName: string;
  vehicleModel: string;
  amountKz: number;
  paymentMethod: 'Dinheiro' | 'Dinheiro Físico';
  paymentRef: string;
  paymentStatus: 'Confirmado' | 'Pendente';
  rating?: number;
}

export interface TransportRequestOrder {
  id: string;
  pracaOrigem: string;
  rotaDestino: string;
  data: string;
  hora: string;
  timestamp: number;
  lugares: number;
  tarifaTotalKz: number;
  status: 'Pendente na Fila' | 'Viatura Atribuída' | 'A Caminho' | 'Embarque Autorizado' | 'Concluído' | 'Cancelado';
  tipoPedido: 'Fila Virtual' | 'Embarque Direto' | 'Reserva FilaPass';
  veiculoPlaca?: string;
  motoristaNome?: string;
  baia?: string;
}

interface PassengerAreaProps {
  userLocation: { lat: number; lng: number } | null;
  currentOriginPraca: PracaLocation;
  setCurrentOriginPraca: (praca: PracaLocation) => void;
  currentDestName: string;
  setCurrentDestName: (dest: string) => void;
  onTriggerNotice: (title: string, message: string, icon?: string) => void;
  triggerVibrate: () => void;
  onOpenSos: () => void;
  onOpenFilaPass: (praca?: PracaLocation) => void;
  onSwitchToDriver: () => void;
  currentTab?: string;
  onTabChange?: (tab: 'solicitar' | 'minha-fila' | 'historico' | 'perfil') => void;
}

type PassengerSubTab = 'solicitar' | 'minha-fila' | 'historico' | 'perfil';

export function PassengerArea({
  userLocation,
  currentOriginPraca,
  setCurrentOriginPraca,
  currentDestName,
  setCurrentDestName,
  onTriggerNotice,
  triggerVibrate,
  onOpenSos,
  onOpenFilaPass,
  currentTab,
  onTabChange,
}: PassengerAreaProps) {
  // Synchronized Passenger Navigation Tab
  const [internalTab, setInternalTab] = useState<PassengerSubTab>('solicitar');
  const activePassengerTab: PassengerSubTab = currentTab
    ? currentTab === 'inicio'
      ? 'solicitar'
      : (currentTab as PassengerSubTab)
    : internalTab;

  const setActivePassengerTab = (tab: PassengerSubTab) => {
    setInternalTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  // 1. Passageiro Profile State
  const [profile, setProfile] = useState<PassengerProfile>({
    name: 'Manuel Dias',
    phone: '+244 923 442 109',
    email: 'diasmanuel1996@gmail.com',
    biNumber: '004829104LA049',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC2r3aCmeVJQsl3Z5uxmsUFCQeLTaxPIDu8oVc4rSoQdLYHM1M82pB29lDQnbAS9IXd0j7OgMGZ0hlwiIEiurjt9DdJSV-8Z0MLgoZ_MD519opCYJvy7DcTmxcmanXtazrDbc5AoSSTtzoIi9BSlgMGZ0hlwiIEiurjt9DdJSV-8Z0MLgoZ_MD519opCYJvy7DcTmxcmanXtazrDbc5AoSSTtzoIi9BSlxAHjxTPbKL98c66DoQvFGMmgQWphlUPvhfnXC956Owedq9DAvV14fa0g8UpePUOuvTwYfE5Tene0nnV9ciU3r9H9V1WfQKVnblYig',
    notificationChannel: 'Ambos',
  });

  // Account Registration & Confirmation State (O passageiro regista-se com os dados necessários)
  const [isAccountConfirmed, setIsAccountConfirmed] = useState<boolean>(true);
  const [accountRegisterStep, setAccountRegisterStep] = useState<'form' | 'otp'>('form');
  const [regName, setRegName] = useState(profile.name);
  const [regPhone, setRegPhone] = useState(profile.phone);
  const [regPassword, setRegPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [otpCode, setOtpCode] = useState('');
  const [simulatedOtp, setSimulatedOtp] = useState('8421');
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [tariffGuideModalOpen, setTariffGuideModalOpen] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<TransportRequestOrder | null>(null);

  // Sistema de Registo de Pedidos de Transporte (Praça, rota, data, hora, estado)
  const [transportOrders, setTransportOrders] = useState<TransportRequestOrder[]>([
    {
      id: 'PED-2026-9142',
      pracaOrigem: 'Praça do Kilamba',
      rotaDestino: 'Mutamba',
      data: '12/10/2026',
      hora: '13:42:10',
      timestamp: Date.now() - 3600000,
      lugares: 1,
      tarifaTotalKz: 500,
      status: 'Concluído',
      tipoPedido: 'Fila Virtual',
      veiculoPlaca: 'LD-44-21-GP',
      motoristaNome: 'João Manuel',
      baia: 'Baia 03',
    },
    {
      id: 'PED-2026-8904',
      pracaOrigem: 'Praça de Viana',
      rotaDestino: 'São Paulo',
      data: '11/10/2026',
      hora: '08:12:44',
      timestamp: Date.now() - 86400000,
      lugares: 1,
      tarifaTotalKz: 500,
      status: 'Concluído',
      tipoPedido: 'Embarque Direto',
      veiculoPlaca: 'LD-12-88-BA',
      motoristaNome: 'Mateus Gaspar',
      baia: 'Baia 01',
    },
  ]);

  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);

  // 2 & 3. Search and Route States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeatCount, setSelectedSeatCount] = useState<number>(1);

  // 4 & 5. Queue State (Passenger Queue Token & Progress)
  const [inPassengerQueue, setInPassengerQueue] = useState(false);
  const [queueTokenNumber, setQueueTokenNumber] = useState<string>('P-07');
  const [passengersAhead, setPassengersAhead] = useState<number>(6);
  const [estimatedWaitMin, setEstimatedWaitMin] = useState<number>(3);
  const [isPassengerTurn, setIsPassengerTurn] = useState<boolean>(false);
  const [assignedBay, setAssignedBay] = useState<string>('Baia 03');
  const [assignedTaxiPlate, setAssignedTaxiPlate] = useState<string>('LD-44-21-GP');
  const [assignedDriver, setAssignedDriver] = useState<string>('João Manuel');

  // 6. Trips and Payment History State
  const [tripHistory, setTripHistory] = useState<PassengerTripRecord[]>([
    {
      id: 'PT-9941',
      origin: 'Praça do Kilamba',
      destination: 'Mutamba',
      date: 'Hoje, 12 de Outubro',
      time: '13:45',
      vehiclePlate: 'LD-44-21-GP',
      driverName: 'João Manuel',
      vehicleModel: 'Toyota Hiace (Azul/Branco)',
      amountKz: 500,
      paymentMethod: 'Dinheiro',
      paymentRef: 'TX-829104',
      paymentStatus: 'Confirmado',
      rating: 5,
    },
    {
      id: 'PT-9932',
      origin: 'Praça de Viana',
      destination: 'São Paulo',
      date: 'Ontem, 11 de Outubro',
      time: '08:15',
      vehiclePlate: 'LD-12-88-BA',
      driverName: 'Mateus Gaspar',
      vehicleModel: 'Toyota Hiace',
      amountKz: 500,
      paymentMethod: 'Dinheiro',
      paymentRef: 'TX-39182',
      paymentStatus: 'Confirmado',
      rating: 5,
    },
    {
      id: 'PT-9915',
      origin: 'Praça do Benfica',
      destination: 'Mutamba',
      date: '09 de Outubro',
      time: '17:30',
      vehiclePlate: 'LD-77-34-AZ',
      driverName: 'Domingos Neto',
      vehicleModel: 'Toyota Hiace',
      amountKz: 500,
      paymentMethod: 'Dinheiro',
      paymentRef: 'TX-774912',
      paymentStatus: 'Confirmado',
      rating: 4,
    },
  ]);

  const [receiptModalTrip, setReceiptModalTrip] = useState<PassengerTripRecord | null>(null);

  // Available Destinations for current Praça
  const availableDestinations = currentOriginPraca.destinations;

  // Filtered Praças
  const filteredPracas = LUANDA_PRACAS.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.destinations.some((d) => d.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Registo do Pedido de Transporte pelo Sistema (Praça, rota, data, hora, estado)
  const registerTransportOrder = (
    tipo: 'Fila Virtual' | 'Embarque Direto' | 'Reserva FilaPass',
    initialStatus: TransportRequestOrder['status'] = 'Pendente na Fila'
  ) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-AO');
    const timeStr = now.toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const orderId = `PED-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: TransportRequestOrder = {
      id: orderId,
      pracaOrigem: currentOriginPraca.name,
      rotaDestino: currentDestName,
      data: dateStr,
      hora: timeStr,
      timestamp: Date.now(),
      lugares: selectedSeatCount,
      tarifaTotalKz: selectedSeatCount * 500,
      status: initialStatus,
      tipoPedido: tipo,
      veiculoPlaca: assignedTaxiPlate,
      motoristaNome: assignedDriver,
      baia: assignedBay,
    };

    setTransportOrders((prev) => [newOrder, ...prev]);
    return newOrder;
  };

  // Enter Passenger Queue Action
  const handleJoinQueue = () => {
    triggerVibrate();
    const token = `P-0${Math.floor(Math.random() * 8) + 2}`;
    setQueueTokenNumber(token);
    setPassengersAhead(5);
    setEstimatedWaitMin(3);
    setInPassengerQueue(true);
    setIsPassengerTurn(false);
    setActivePassengerTab('minha-fila');
    const order = registerTransportOrder('Fila Virtual', 'Pendente na Fila');
    onTriggerNotice(
      'Pedido Registado no Sistema!',
      `Registo ${order.id}: ${currentOriginPraca.name} → ${currentDestName} (${order.data} às ${order.hora}). Senha ${token}. Estado do Pedido: Pendente na Fila.`,
      'confirmation_number'
    );
  };

  // Advance Passenger Queue simulation
  const handleAdvancePassengerQueue = () => {
    triggerVibrate();
    if (passengersAhead > 1) {
      setPassengersAhead((prev) => Math.max(1, prev - 2));
      setEstimatedWaitMin((prev) => Math.max(1, prev - 1));
      onTriggerNotice(
        'Fila a Avançar!',
        `A sua senha ${queueTokenNumber} avançou. Restam apenas ${Math.max(1, passengersAhead - 2)} pessoas à sua frente.`,
        'directions_walk'
      );
    } else {
      setPassengersAhead(0);
      setEstimatedWaitMin(0);
      setIsPassengerTurn(true);
      setTransportOrders((prev) =>
        prev.map((ord, idx) => (idx === 0 && ord.status === 'Pendente na Fila' ? { ...ord, status: 'Viatura Atribuída' } : ord))
      );
      onTriggerNotice(
        '🔔 É A SUA VEZ DE EMBARCAR!',
        `Dirija-se imediatamente à ${assignedBay}. A viatura ${assignedTaxiPlate} com o motorista ${assignedDriver} aguarda por si!`,
        'notifications_active'
      );
    }
  };

  // Leave Passenger Queue
  const handleLeaveQueue = () => {
    triggerVibrate();
    setInPassengerQueue(false);
    setIsPassengerTurn(false);
    setTransportOrders((prev) =>
      prev.map((ord, idx) =>
        idx === 0 && (ord.status === 'Pendente na Fila' || ord.status === 'Viatura Atribuída')
          ? { ...ord, status: 'Cancelado' }
          : ord
      )
    );
    onTriggerNotice('Saiu da Fila', 'A sua senha de fila foi cancelada e o pedido atualizado no sistema.', 'info');
  };

  // Confirm Passenger Boarding
  const handleConfirmBoarding = () => {
    triggerVibrate();
    // Update transport order status to Concluído
    setTransportOrders((prev) =>
      prev.map((ord, idx) => (idx === 0 ? { ...ord, status: 'Concluído' } : ord))
    );
    // Register trip in history
    const newTrip: PassengerTripRecord = {
      id: `PT-${Math.floor(1000 + Math.random() * 9000)}`,
      origin: currentOriginPraca.name,
      destination: currentDestName,
      date: 'Hoje, ' + new Date().toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' }),
      time: new Date().toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' }),
      vehiclePlate: assignedTaxiPlate,
      driverName: assignedDriver,
      vehicleModel: 'Toyota Hiace (Azul/Branco)',
      amountKz: selectedSeatCount * 500,
      paymentMethod: 'Dinheiro',
      paymentRef: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
      paymentStatus: 'Confirmado',
    };
    setTripHistory([newTrip, ...tripHistory]);
    setInPassengerQueue(false);
    setIsPassengerTurn(false);
    onTriggerNotice(
      'Embarque Confirmado!',
      `Boa viagem! O seu pagamento de ${(selectedSeatCount * 500).toLocaleString('pt-AO')} Kz foi registado. Comprovativo disponível no Histórico.`,
      'verified'
    );
    setActivePassengerTab('historico');
  };

  // Submeter Registo do Passageiro (Nome completo, Telefone/WhatsApp, Palavra-passe, Termos)
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerVibrate();
    if (!regName.trim() || !regPhone.trim() || !regPassword.trim() || !acceptedTerms) {
      onTriggerNotice(
        'Dados Incompletos',
        'Por favor, preencha todos os campos obrigatórios e aceite os termos de utilização.',
        'warning'
      );
      return;
    }
    const code = `${Math.floor(1000 + Math.random() * 9000)}`;
    setSimulatedOtp(code);
    setAccountRegisterStep('otp');
    onTriggerNotice(
      'Código Enviado por SMS/WhatsApp!',
      `Enviámos o código de verificação (${code}) para ${regPhone}. Introduza-o para confirmar a sua conta.`,
      'sms'
    );
  };

  // Confirmar Conta do Passageiro
  const handleConfirmAccount = () => {
    triggerVibrate();
    if (otpCode !== simulatedOtp && otpCode !== '1234') {
      onTriggerNotice(
        'Código Inválido',
        'O código introduzido está incorreto. Use o código simulado sugerido.',
        'error'
      );
      return;
    }
    setIsAccountConfirmed(true);
    setProfile((prev) => ({
      ...prev,
      name: regName,
      phone: regPhone,
    }));
    onTriggerNotice(
      'Conta Confirmada com Sucesso!',
      `Bem-vindo, ${regName}! A sua conta está confirmada. Já pode consultar praças, rotas e tarifas disponíveis e solicitar o seu transporte.`,
      'verified'
    );
  };

  // SE A CONTA NÃO ESTIVER CONFIRMADA: APRESENTA O ECRÃ DE REGISTO E CONFIRMAÇÃO
  if (!isAccountConfirmed) {
    return (
      <div className="flex flex-col w-full px-gutter py-4 space-y-4 pb-20">
        {/* Banner do Nível 1: Passageiro */}
        <div className="bg-gradient-to-r from-primary via-primary-container to-primary text-on-primary p-4 rounded-2xl shadow-md space-y-1">
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-fixed text-[10px] font-bold uppercase tracking-wider">
              Nível 1: Passageiro
            </span>
            <span className="text-[11px] text-primary-fixed-dim">
              FilaTáxi Angola
            </span>
          </div>
          <h2 className="text-base font-bold text-white">
            {accountRegisterStep === 'form' ? 'Registo de Passageiro' : 'Confirmação da Conta'}
          </h2>
          <p className="text-xs text-primary-fixed-dim leading-tight">
            {accountRegisterStep === 'form'
              ? 'Registe os seus dados para utilizar o serviço. Depois de confirmar a conta, poderá consultar as praças, rotas e tarifas disponíveis.'
              : 'Introduza o código de 4 dígitos enviado por SMS/WhatsApp para ativar o seu acesso.'}
          </p>
        </div>

        {accountRegisterStep === 'form' ? (
          <form
            onSubmit={handleRegisterSubmit}
            className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-surface-container space-y-3.5"
          >
            <div className="flex items-center gap-1.5 pb-1 border-b border-surface-container">
              <span className="material-symbols-outlined text-secondary text-[20px]">
                person_add
              </span>
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                Dados Necessários para Registo
              </span>
            </div>

            {/* 1. Nome Completo */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-primary flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-secondary">badge</span>
                Nome Completo *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Manuel António Dias"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-primary font-medium text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* 2. Número de Telefone / WhatsApp */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-primary flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-secondary">smartphone</span>
                Número de Telefone / WhatsApp *
              </label>
              <div className="flex gap-2">
                <span className="h-11 px-3 rounded-xl bg-surface-container text-primary font-bold text-xs flex items-center shrink-0">
                  🇦🇴 +244
                </span>
                <input
                  type="tel"
                  required
                  placeholder="923 442 109"
                  value={regPhone.replace('+244', '').trim()}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setRegPhone(`+244 ${raw}`);
                  }}
                  className="flex-1 h-11 px-3.5 rounded-xl bg-surface-container-low text-primary font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <span className="text-[10px] text-on-surface-variant">
                Receberá notificações da sua posição na fila e comprovativo digital via WhatsApp/SMS.
              </span>
            </div>

            {/* 3. Palavra-passe */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-primary flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-secondary">lock</span>
                Palavra-passe *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Introduza uma palavra-passe"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full h-11 pl-3.5 pr-10 rounded-xl bg-surface-container-low text-primary text-xs focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-outline hover:text-primary cursor-pointer"
                  title={showPassword ? 'Ocultar' : 'Mostrar'}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              <span className="text-[10px] text-on-surface-variant">
                Protege o seu perfil e o acesso aos seus pedidos de transporte.
              </span>
            </div>

            {/* 4. Aceitação dos Termos de Utilização */}
            <div className="p-3 bg-surface-container-low rounded-xl border border-surface-container space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer accent-primary"
                />
                <span className="text-xs text-primary leading-tight font-medium">
                  Declaro que li e aceito os{' '}
                  <button
                    type="button"
                    onClick={() => setTermsModalOpen(true)}
                    className="font-bold text-secondary underline hover:text-secondary-fixed inline cursor-pointer"
                  >
                    Termos de Utilização do Serviço
                  </button>
                  , a política de privacidade e as normas de trânsito da Associação de Taxistas de Angola (ATA).
                </span>
              </label>
            </div>

            {/* Botão de Submissão do Registo */}
            <button
              type="submit"
              disabled={!regName.trim() || !regPhone.trim() || !regPassword.trim() || !acceptedTerms}
              className={`w-full py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all ${
                regName.trim() && regPhone.trim() && regPassword.trim() && acceptedTerms
                  ? 'bg-primary text-on-primary hover:bg-primary-container cursor-pointer active:scale-95'
                  : 'bg-surface-container text-outline cursor-not-allowed'
              }`}
            >
              <span className="material-symbols-outlined text-[18px] text-secondary-container">
                how_to_reg
              </span>
              <span>Registar Conta & Receber Código SMS/WhatsApp</span>
            </button>

            {/* Botão de Acesso Rápido para Demonstração */}
            <div className="pt-2 text-center border-t border-surface-container">
              <button
                type="button"
                onClick={() => {
                  triggerVibrate();
                  setIsAccountConfirmed(true);
                  onTriggerNotice('Conta Ativada', 'Acedeu diretamente como passageiro VIP Manuel Dias.', 'verified');
                }}
                className="text-[11px] text-secondary font-bold hover:underline cursor-pointer"
              >
                Continuar com a Conta de Teste (Manuel Dias) →
              </button>
            </div>
          </form>
        ) : (
          /* PASSO 2: CONFIRMAÇÃO DA CONTA */
          <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-surface-container space-y-4">
            <div className="text-center space-y-1">
              <div className="w-14 h-14 rounded-full bg-secondary-container/30 text-secondary flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[30px]">sms</span>
              </div>
              <h3 className="text-base font-bold text-primary">Confirmação de Conta</h3>
              <p className="text-xs text-on-surface-variant">
                Enviámos um código de ativação de 4 dígitos para:
              </p>
              <span className="font-mono font-bold text-sm text-primary block">
                {regPhone}
              </span>
            </div>

            {/* Código SMS/WhatsApp Simulado */}
            <div className="p-3 bg-secondary-container/20 border border-secondary-container rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-on-secondary-fixed font-semibold uppercase block">
                  Código SMS / WhatsApp
                </span>
                <strong className="text-xl font-mono text-primary font-black tracking-widest">
                  {simulatedOtp}
                </strong>
              </div>
              <button
                type="button"
                onClick={() => setOtpCode(simulatedOtp)}
                className="px-3 py-1.5 rounded-lg bg-secondary-container text-on-secondary-fixed text-xs font-bold cursor-pointer active:scale-95"
              >
                Inserir {simulatedOtp}
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-primary block text-center">
                Introduza o Código de 4 Dígitos:
              </label>
              <input
                type="text"
                maxLength={4}
                placeholder="0000"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-full h-14 text-center tracking-[0.5em] font-mono text-2xl font-black rounded-xl bg-surface-container-low text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <button
              type="button"
              onClick={handleConfirmAccount}
              disabled={otpCode.length < 4}
              className={`w-full py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all ${
                otpCode.length >= 4
                  ? 'bg-primary text-on-primary hover:bg-primary-container cursor-pointer active:scale-95'
                  : 'bg-surface-container text-outline cursor-not-allowed'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span>Confirmar Conta e Desbloquear Praças & Rotas</span>
            </button>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => setAccountRegisterStep('form')}
                className="text-on-surface-variant hover:text-primary font-bold underline cursor-pointer"
              >
                ← Corrigir Dados
              </button>
              <button
                type="button"
                onClick={() => {
                  const code = `${Math.floor(1000 + Math.random() * 9000)}`;
                  setSimulatedOtp(code);
                  onTriggerNotice('Novo Código', `Novo código gerado: ${code}`, 'sms');
                }}
                className="text-secondary font-bold hover:underline cursor-pointer"
              >
                Reenviar Código
              </button>
            </div>
          </div>
        )}

        {/* Modal dos Termos de Utilização (caso seja acionado durante o registo) */}
        {termsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary/70 backdrop-blur-sm p-4">
            <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl p-5 shadow-2xl space-y-3.5 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-1 border-b border-surface-container">
                <h3 className="text-sm font-bold text-primary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-secondary text-[20px]">
                    policy
                  </span>
                  Termos de Utilização do Serviço
                </h3>
                <button
                  onClick={() => setTermsModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <div className="space-y-3 text-xs text-on-surface-variant leading-relaxed">
                <div className="p-2.5 bg-surface-container-low rounded-xl">
                  <strong className="text-primary block font-bold">1. Registo e Identificação</strong>
                  <p>
                    O passageiro compromete-se a fornecer dados verídicos (nome completo e telemóvel angolano ativo) para assegurar a comunicação de embarque e segurança a bordo.
                  </p>
                </div>
                <div className="p-2.5 bg-surface-container-low rounded-xl">
                  <strong className="text-primary block font-bold">2. Fila Virtual e Ordem na Baia</strong>
                  <p>
                    A senha atribuída pelo sistema FilaTáxi tem prioridade obrigatória no cais. O embarque é validado pelo fiscal de praça e pelo motorista credenciado.
                  </p>
                </div>
                <div className="p-2.5 bg-surface-container-low rounded-xl">
                  <strong className="text-primary block font-bold">3. Tarifário Oficial de Luanda</strong>
                  <p>
                    A tarifa standard em vigor é de 500 Kz por assento, conforme tabela fixada pelo Governo Provincial de Luanda e Associação de Taxistas de Angola (ATA).
                  </p>
                </div>
                <div className="p-2.5 bg-surface-container-low rounded-xl">
                  <strong className="text-primary block font-bold">4. Lotação e Segurança</strong>
                  <p>
                    É estritamente proibida a sobrelotação (máximo 15 passageiros por Toyota Hiace). Botão SOS disponível para emergências e ligação à central policial.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setAcceptedTerms(true);
                  setTermsModalOpen(false);
                }}
                className="w-full py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl cursor-pointer"
              >
                Compreendi e Aceito os Termos
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full pb-20">



      {/* ========================================================= */}
      {/* 1. TAB: SOLICITAR VIAGEM & CONSULTAR PRAÇAS/ROTAS         */}
      {/* ========================================================= */}
      {activePassengerTab === 'solicitar' && (
        <div className="flex flex-col px-gutter pt-3 space-y-space-md">
          {/* Welcome Passenger Card & Quick Wallet Indicator */}
          <div className="bg-gradient-to-r from-primary to-primary-container text-on-primary p-4 rounded-2xl shadow-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-secondary-container"
                />
                <span className="w-3 h-3 rounded-full bg-emerald-400 absolute bottom-0 right-0 border border-primary"></span>
              </div>
              <div>
                <span className="text-[11px] text-primary-fixed-dim uppercase tracking-wider block font-semibold">
                  Olá, Passageiro
                </span>
                <h3 className="text-base font-bold text-on-primary leading-tight">
                  {profile.name}
                </h3>
                <span className="text-[11px] text-secondary-container font-medium flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-[13px]">verified</span>
                  Passageiro Verificado
                </span>
              </div>
            </div>
          </div>

          {/* Selector de Origem e Destino do Transporte */}
          <section className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-headline-sm text-sm text-primary font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary text-[20px]">
                  route
                </span>
                Escolher Rota & Paragem
              </span>
              <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-fixed text-[10px] font-bold">
                Tarifa: 500 Kz
              </span>
            </div>

            {/* Origem */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-on-surface-variant flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Praça de Partida (Origem):
              </label>
              <div className="relative">
                <select
                  value={currentOriginPraca.id}
                  onChange={(e) => {
                    const found = LUANDA_PRACAS.find((p) => p.id === e.target.value);
                    if (found) {
                      triggerVibrate();
                      setCurrentOriginPraca(found);
                      setCurrentDestName(found.destinations[0]);
                    }
                  }}
                  className="w-full h-12 pl-3 pr-8 rounded-xl bg-surface-container-low text-primary font-bold text-sm focus:outline-none appearance-none cursor-pointer"
                >
                  {LUANDA_PRACAS.map((praca) => (
                    <option key={praca.id} value={praca.id}>
                      {praca.name} ({praca.subtitle.split('•')[0]})
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-3 text-outline pointer-events-none">
                  arrow_drop_down
                </span>
              </div>
            </div>

            {/* Destino */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-on-surface-variant flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-secondary"></span>
                Destino Final:
              </label>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {availableDestinations.map((dest) => (
                  <button
                    key={dest}
                    onClick={() => {
                      triggerVibrate();
                      setCurrentDestName(dest);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      currentDestName === dest
                        ? 'bg-primary text-on-primary shadow-sm scale-102 ring-2 ring-secondary-container'
                        : 'bg-surface-container-low text-primary hover:bg-surface-container'
                    }`}
                  >
                    → {dest}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantidade de Lugares */}
            <div className="pt-2 border-t border-surface-container flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-primary block">Quantidade de Lugares:</span>
                <span className="text-[11px] text-on-surface-variant">
                  Total: {(selectedSeatCount * 500).toLocaleString('pt-AO')} Kz
                </span>
              </div>
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    onClick={() => setSelectedSeatCount(num)}
                    className={`w-9 h-9 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                      selectedSeatCount === num
                        ? 'bg-secondary-container text-on-secondary-fixed ring-2 ring-primary'
                        : 'bg-surface-container text-primary'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons Cluster & SOS Panic Button */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <button
                onClick={handleJoinQueue}
                className="py-3 px-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-md active:scale-95 transition-transform cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-secondary-container">
                  confirmation_number
                </span>
                <span>Fila Virtual</span>
              </button>

              <button
                onClick={() => onOpenFilaPass(currentOriginPraca)}
                className="py-3 px-2 rounded-xl bg-secondary-container hover:bg-secondary text-on-secondary-fixed font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-md active:scale-95 transition-transform cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">
                  airplane_ticket
                </span>
                <span>FilaPass</span>
              </button>

              <button
                onClick={() => {
                  triggerVibrate();
                  onOpenSos();
                }}
                className="py-3 px-2 rounded-xl bg-error hover:bg-red-700 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-md active:scale-95 transition-transform cursor-pointer"
                title="Botão de Pânico / SOS de Emergência"
              >
                <span className="material-symbols-outlined text-[18px]">
                  e911_emergency
                </span>
                <span>SOS Pânico</span>
              </button>
            </div>


          </section>

          {/* ========================================================= */}
          {/* CONSULTA DE PRAÇAS, ROTAS E TARIFAS DISPONÍVEIS          */}
          {/* ========================================================= */}
          <section className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm space-y-3 border border-surface-container">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary text-[20px]">
                  price_change
                </span>
                <span className="font-headline-sm text-sm text-primary font-bold">
                  Consulta de Praças, Rotas e Tarifas
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                Tabela Oficial
              </span>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Consulte as praças ativas, trajetos urbanos intermunicipais e as tarifas regulamentadas para o transporte colectivo de Luanda.
            </p>

            {/* Quadro Resumo de Tarifas */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-surface-container-low rounded-xl">
                <span className="text-[10px] text-on-surface-variant block font-medium">
                  Tarifa Urbana Standard
                </span>
                <span className="text-base font-black text-primary font-mono block mt-0.5">
                  500 Kz <span className="text-[10px] font-normal text-on-surface-variant">/ lugar</span>
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
                  Preço fixo regulado
                </span>
              </div>
              <div className="p-3 bg-surface-container-low rounded-xl">
                <span className="text-[10px] text-on-surface-variant block font-medium">
                  Tarifa Rota Selecionada
                </span>
                <span className="text-base font-black text-secondary font-mono block mt-0.5">
                  {(selectedSeatCount * 500).toLocaleString('pt-AO')} Kz
                </span>
                <span className="text-[10px] text-on-surface-variant block mt-0.5">
                  {selectedSeatCount} {selectedSeatCount === 1 ? 'lugar' : 'lugares'} ({currentOriginPraca.name.replace('Praça do ', '').replace('Praça de ', '')} → {currentDestName})
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                triggerVibrate();
                setTariffGuideModalOpen(true);
              }}
              className="w-full py-2.5 rounded-xl bg-surface-container text-primary hover:bg-surface-container-high font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[16px] text-secondary">
                menu_book
              </span>
              <span>Abrir Guia Oficial de Tarifas & Praças de Luanda</span>
            </button>
          </section>

          {/* ========================================================= */}
          {/* REGISTO DO SISTEMA: PEDIDOS DE TRANSPORTE SOLICITADOS     */}
          {/* ========================================================= */}
          <section className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm space-y-3 border border-surface-container">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary text-[20px]">
                  receipt_long
                </span>
                <span className="font-headline-sm text-sm text-primary font-bold">
                  Registo do Sistema: Pedidos de Transporte
                </span>
              </div>
              <span className="text-[10px] font-bold bg-primary text-on-primary px-2.5 py-0.5 rounded-full font-mono whitespace-nowrap inline-flex items-center gap-1">
                {transportOrders.length} {transportOrders.length === 1 ? 'pedido' : 'pedidos'}
              </span>
            </div>

            <p className="text-xs text-on-surface-variant">
              Ao solicitar transporte, o sistema regista a praça ou rota escolhida, a data, a hora e o estado do pedido.
            </p>

            <div className="space-y-2">
              {transportOrders.slice(0, 3).map((order) => (
                <div
                  key={order.id}
                  className="p-3 bg-surface-container-low rounded-xl border border-surface-container space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-primary">
                      {order.id}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        order.status === 'Pendente na Fila'
                          ? 'bg-amber-100 text-amber-800'
                          : order.status === 'Viatura Atribuída'
                          ? 'bg-blue-100 text-blue-800 animate-pulse'
                          : order.status === 'Concluído'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div className="text-xs space-y-0.5">
                    <div className="flex items-center justify-between text-primary font-bold">
                      <span>{order.pracaOrigem} → {order.rotaDestino}</span>
                      <span className="font-mono text-secondary">{order.tarifaTotalKz.toLocaleString('pt-AO')} Kz</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                      <span>Data: {order.data} às {order.hora}</span>
                      <span>{order.lugares} {order.lugares === 1 ? 'lugar' : 'lugares'} ({order.tipoPedido})</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1 border-t border-surface-container">
                    <button
                      onClick={() => {
                        triggerVibrate();
                        setSelectedOrderDetails(order);
                      }}
                      className="flex-1 py-1.5 rounded-lg bg-surface-container-lowest text-primary font-bold text-[11px] flex items-center justify-center gap-1 active:scale-98 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">visibility</span>
                      Ver Ficha do Pedido
                    </button>
                    <button
                      onClick={() => {
                        triggerVibrate();
                        const text = encodeURIComponent(
                          `🚕 Registo FilaTáxi (${order.id}): ${order.pracaOrigem} → ${order.rotaDestino} solicitado em ${order.data} às ${order.hora}. Estado: ${order.status}. Valor: ${order.tarifaTotalKz} Kz.`
                        );
                        window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                      title="Partilhar no WhatsApp"
                    >
                      <span className="material-symbols-outlined text-[14px]">share</span>
                      WhatsApp
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Visualizador de Táxis & Filas em Direto na Praça Escolhida */}
          <section className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-headline-sm text-sm text-primary font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary text-[20px]">
                  local_taxi
                </span>
                Estado da Fila na {currentOriginPraca.name}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                Ao Vivo
              </span>
            </div>

            {/* Painel com 3 Métricas Rápidas */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-surface-container-low p-2.5 rounded-xl text-center">
                <span className="font-queue-number text-lg text-primary block font-bold">
                  {currentOriginPraca.noCais}
                </span>
                <span className="text-[10px] text-on-surface-variant font-medium">
                  Táxis no Cais
                </span>
              </div>
              <div className="bg-surface-container-low p-2.5 rounded-xl text-center">
                <span className="font-queue-number text-lg text-primary block font-bold">
                  {currentOriginPraca.naFila}
                </span>
                <span className="text-[10px] text-on-surface-variant font-medium">
                  Táxis na Fila
                </span>
              </div>
              <div className="bg-surface-container-low p-2.5 rounded-xl text-center">
                <span className="font-queue-number text-lg text-secondary block font-bold">
                  ~{currentOriginPraca.minEspera}m
                </span>
                <span className="text-[10px] text-on-surface-variant font-medium">
                  Tempo Médio
                </span>
              </div>
            </div>

            {/* Carrinha que está a carregar agora na baia */}
            <div className="bg-surface-container-low p-3.5 rounded-xl space-y-2 border border-surface-container">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-secondary text-[16px]">
                    airport_shuttle
                  </span>
                  A Embarcar Agora: Baia 03
                </span>
                <span className="font-mono text-xs font-black text-primary bg-white px-2 py-0.5 rounded shadow-xs">
                  LD-44-21-GP
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-on-surface-variant">
                <span>Motorista: <strong>João Manuel</strong></span>
                <span className="text-emerald-700 font-bold">13/15 Lugares cheios</span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div className="bg-secondary-container h-full w-[86%] rounded-full"></div>
              </div>
              <span className="text-[11px] text-emerald-800 font-medium block">
                Faltam apenas <strong>2 lugares</strong> para a carrinha partir rumo a {currentDestName}!
              </span>
            </div>

            {/* Mapa Interativo de Luanda com a Praça */}
            <div className="rounded-xl overflow-hidden h-44 relative shadow-inner">
              <LiveMapView
                center={{ lat: currentOriginPraca.lat, lng: currentOriginPraca.lng }}
                zoom={14}
                userLocation={userLocation}
                selectedPraca={currentOriginPraca}
                heightClass="h-44"
              />
              <div className="absolute top-2 left-2 bg-primary/90 text-on-primary text-[10px] px-2 py-1 rounded shadow flex items-center gap-1 pointer-events-none">
                <span className="material-symbols-outlined text-[13px] text-secondary">
                  pin_drop
                </span>
                <span>{currentOriginPraca.name}</span>
              </div>
            </div>
          </section>

          {/* Consulta de outras praças disponíveis */}
          <section className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary">
                Outras Praças Conectadas em Luanda:
              </span>
              <span className="text-[10px] text-on-surface-variant">
                {LUANDA_PRACAS.length} Terminais
              </span>
            </div>
            <div className="space-y-2">
              {LUANDA_PRACAS.filter((p) => p.id !== currentOriginPraca.id).map((praca) => (
                <div
                  key={praca.id}
                  onClick={() => {
                    triggerVibrate();
                    setCurrentOriginPraca(praca);
                    setCurrentDestName(praca.destinations[0]);
                  }}
                  className="p-2.5 bg-surface-container-low hover:bg-surface-container rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-surface-container-lowest text-primary flex items-center justify-center font-bold text-xs">
                      🚕
                    </div>
                    <div>
                      <span className="text-xs font-bold text-primary block leading-tight">
                        {praca.name}
                      </span>
                      <span className="text-[10px] text-on-surface-variant">
                        Destinos: {praca.destinations.slice(0, 2).join(', ')}...
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-secondary block">
                      ~{praca.minEspera} min
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold">
                      {praca.naFila} táxis
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. TAB: MINHA FILA DE PASSAGEIRO (ACOMPANHAMENTO AO VIVO)  */}
      {/* ========================================================= */}
      {activePassengerTab === 'minha-fila' && (
        <div className="flex flex-col px-gutter pt-3 space-y-space-md">
          {inPassengerQueue ? (
            <>
              {/* Cartão de Senha & Status da Fila */}
              <div
                className={`p-5 rounded-2xl text-center space-y-3 shadow-lg relative overflow-hidden ${
                  isPassengerTurn
                    ? 'bg-gradient-to-b from-secondary-container to-secondary-fixed text-on-secondary-fixed border-2 border-primary'
                    : 'bg-primary text-on-primary'
                }`}
              >
                <div className="flex items-center justify-between pb-1 border-b border-white/20">
                  <span className="text-[11px] uppercase tracking-wider font-bold opacity-80">
                    Sua Senha Digital
                  </span>
                  <span className="text-[11px] font-bold bg-white/20 px-2 py-0.5 rounded-full">
                    {assignedBay}
                  </span>
                </div>

                <div className="py-2">
                  <span className="text-5xl font-black font-mono tracking-tight block drop-shadow-sm">
                    {queueTokenNumber}
                  </span>
                  <span className="text-xs font-semibold opacity-90 mt-1 block">
                    Linha: {currentOriginPraca.name.replace('Praça do ', '').replace('Praça de ', '')} → {currentDestName}
                  </span>
                </div>

                {isPassengerTurn ? (
                  /* ALERTA: É A SUA VEZ! */
                  <div className="p-3 bg-white text-primary rounded-xl shadow-md space-y-1.5 animate-bounce">
                    <div className="flex items-center justify-center gap-1.5 text-secondary font-black text-sm">
                      <span className="material-symbols-outlined text-[20px]">
                        notifications_active
                      </span>
                      <span>É A SUA VEZ DE EMBARCAR!</span>
                    </div>
                    <p className="text-xs font-bold leading-tight">
                      Dirija-se imediatamente à <strong>{assignedBay}</strong>! A carrinha{' '}
                      <strong>{assignedTaxiPlate}</strong> com o motorista <strong>{assignedDriver}</strong> está pronta para partir.
                    </p>
                    <div className="pt-1">
                      <button
                        onClick={handleConfirmBoarding}
                        className="w-full py-2.5 bg-primary text-on-primary font-bold text-xs rounded-lg shadow cursor-pointer active:scale-95"
                      >
                        Validar Embarque na Baia
                      </button>
                    </div>
                  </div>
                ) : (
                  /* A AGUARDAR NA FILA */
                  <div className="grid grid-cols-2 gap-2 bg-white/10 p-2.5 rounded-xl text-center">
                    <div>
                      <span className="text-[10px] opacity-80 block">À Sua Frente</span>
                      <strong className="text-base font-bold">
                        {passengersAhead} {passengersAhead === 1 ? 'passageiro' : 'passageiros'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] opacity-80 block">Espera Estimada</span>
                      <strong className="text-base font-bold text-secondary-container">
                        ~{estimatedWaitMin} minutos
                      </strong>
                    </div>
                  </div>
                )}

                {/* Barra de Progresso de Aproximação */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[10px] opacity-80">
                    <span>Entrada (#10)</span>
                    <span>Embarque (#01)</span>
                  </div>
                  <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="bg-secondary-container h-full rounded-full transition-all duration-500"
                      style={{
                        width: isPassengerTurn ? '100%' : `${Math.max(25, (10 - passengersAhead) * 10)}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Botões de Ação da Fila */}
              <div className="space-y-2">
                {!isPassengerTurn && (
                  <button
                    onClick={handleAdvancePassengerQueue}
                    className="w-full py-3.5 bg-secondary-container text-on-secondary-fixed font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-transform cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">fast_forward</span>
                    <span>Simular Avanço da Fila (Passo Seguinte)</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    triggerVibrate();
                    const text = encodeURIComponent(
                      `Estou na fila do táxi no ${currentOriginPraca.name} para ${currentDestName}. Minha senha é ${queueTokenNumber} e estou a aguardar o embarque na ${assignedBay}.`
                    );
                    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
                  }}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow cursor-pointer active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">share</span>
                  Partilhar Senha no WhatsApp com Familiares
                </button>

                <button
                  onClick={handleLeaveQueue}
                  className="w-full py-2.5 bg-error-container text-on-error-container font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">logout</span>
                  Sair da Fila Virtual
                </button>
              </div>

              {/* Dica de Segurança e Convivência */}
              <div className="bg-surface-container-low p-3 rounded-xl flex items-start gap-2.5 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">
                  verified_user
                </span>
                <p className="leading-relaxed">
                  O sistema digital garante o seu assento por ordem de chegada. Não é necessário empurrar na baia: o fiscal só permite o embarque com a validação da senha <strong>{queueTokenNumber}</strong>.
                </p>
              </div>
            </>
          ) : (
            /* PASSAGEIRO NÃO ESTÁ NA FILA */
            <div className="bg-surface-container-lowest p-6 rounded-2xl text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-secondary-container/20 text-secondary flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[32px]">queue</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-primary">Não tem nenhuma fila ativa</h3>
                <p className="text-xs text-on-surface-variant max-w-xs mx-auto">
                  Selecione a sua praça e destino para retirar uma senha digital e aguardar confortavelmente sem filas físicas.
                </p>
              </div>
              <button
                onClick={() => {
                  triggerVibrate();
                  setActivePassengerTab('solicitar');
                }}
                className="w-full py-3 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px] text-secondary-container">
                  travel_explore
                </span>
                <span>Escolher Rota e Entrar na Fila</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. TAB: HISTÓRICO DE VIAGENS & ESTADO DOS PAGAMENTOS       */}
      {/* ========================================================= */}
      {activePassengerTab === 'historico' && (
        <div className="flex flex-col px-gutter pt-3 space-y-space-md">
          {/* Resumo Financeiro do Passageiro */}
          <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary flex items-center gap-1">
                <span className="material-symbols-outlined text-secondary text-[18px]">
                  account_balance_wallet
                </span>
                Resumo de Pagamentos do Passageiro
              </span>
              <span className="text-[10px] text-on-surface-variant">Outubro 2026</span>
            </div>
            <div className="bg-surface-container-low p-3 rounded-xl">
              <span className="text-[11px] text-on-surface-variant block">Total Gasto em Táxis (Mês Atual)</span>
              <span className="text-xl font-bold text-primary block mt-0.5">
                {(tripHistory.length * 500).toLocaleString('pt-AO')} Kz
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold">
                {tripHistory.length} viagens efetuadas com pagamento confirmado
              </span>
            </div>
          </div>

          {/* Lista de Viagens Realizadas */}
          <section className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-primary">
                Histórico de Viagens & Comprovativos:
              </span>
              <span className="text-[10px] text-on-surface-variant">
                {tripHistory.length} Registos
              </span>
            </div>

            {tripHistory.map((trip) => (
              <div
                key={trip.id}
                className="bg-surface-container-lowest p-3.5 rounded-2xl shadow-sm space-y-2 border border-surface-container"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-secondary-container/20 text-secondary flex items-center justify-center font-bold">
                      <span className="material-symbols-outlined text-[20px]">directions_car</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-primary">
                        {trip.origin.replace('Praça do ', '').replace('Praça de ', '')} → {trip.destination}
                      </h4>
                      <span className="text-[10px] text-on-surface-variant block">
                        {trip.date} às {trip.time} • Viatura {trip.vehiclePlate}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    {trip.paymentStatus}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-surface-container text-xs">
                  <div className="flex items-center gap-1 text-on-surface-variant text-[11px]">
                    <span className="material-symbols-outlined text-[14px] text-primary">payments</span>
                    <span>{trip.paymentMethod}</span>
                    <span className="text-[10px] opacity-75 font-mono">({trip.paymentRef})</span>
                  </div>
                  <span className="font-mono font-bold text-primary">
                    {trip.amountKz.toLocaleString('pt-AO')} Kz
                  </span>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => {
                      triggerVibrate();
                      setReceiptModalTrip(trip);
                    }}
                    className="flex-1 py-1.5 rounded-lg bg-surface-container-low text-primary font-bold text-[11px] flex items-center justify-center gap-1 active:bg-surface-container cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">receipt</span>
                    Ver Comprovativo
                  </button>
                  <button
                    onClick={() => {
                      triggerVibrate();
                      const text = encodeURIComponent(
                        `🧾 Comprovativo de Táxi FilaTáxi: Viagem ${trip.origin} → ${trip.destination} (${trip.amountKz} Kz) paga via ${trip.paymentMethod} (${trip.paymentRef}) na viatura ${trip.vehiclePlate}.`
                      );
                      window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-[11px] flex items-center justify-center gap-1 hover:bg-emerald-100 cursor-pointer"
                    title="Partilhar recibo no WhatsApp"
                  >
                    <span className="material-symbols-outlined text-[14px]">share</span>
                    WhatsApp
                  </button>
                </div>
              </div>
            ))}
          </section>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. TAB: CONTA DO PASSAGEIRO & GESTÃO DE DADOS             */}
      {/* ========================================================= */}
      {activePassengerTab === 'perfil' && (
        <div className="flex flex-col px-gutter pt-3 space-y-4">
          {/* BANNER DE ESTADO: CONTA CONFIRMADA & ATIVA (Exclusivo da opção Conta) */}
          <div className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs shadow-xs">
            <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
              <span className="material-symbols-outlined text-[18px] text-emerald-600">verified</span>
              <span className="text-[11px] leading-tight">
                Conta Confirmada & Ativa ({profile.phone})
              </span>
            </div>
            <button
              onClick={() => {
                triggerVibrate();
                setIsAccountConfirmed(false);
                setAccountRegisterStep('form');
                onTriggerNotice('Modo Registo', 'Pode agora testar o registo inicial do passageiro.', 'info');
              }}
              className="text-[10px] text-primary font-bold hover:underline cursor-pointer flex items-center gap-0.5 bg-white px-2 py-0.5 rounded shadow-xs"
              title="Simular Novo Registo de Passageiro do Zero"
            >
              <span className="material-symbols-outlined text-[12px]">person_add</span>
              <span>Simular Registo</span>
            </button>
          </div>

          {/* Cartão Digital do Passageiro com Borda Elegante */}
          <div className="bg-gradient-to-br from-primary via-primary-container to-primary text-on-primary p-5 rounded-2xl shadow-md border border-primary-container/40 relative overflow-hidden space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary-container text-[20px]">
                  badge
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-secondary-container">
                  Cartão Digital do Passageiro
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold uppercase backdrop-blur-xs">
                Utilizador VIP
              </span>
            </div>

            <div className="flex items-center gap-3.5">
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-secondary shadow-md"
              />
              <div className="space-y-0.5">
                <h3 className="text-lg font-bold text-white">{profile.name}</h3>
                <span className="text-xs text-primary-fixed-dim block font-mono">
                  {profile.phone}
                </span>
                <span className="text-[11px] text-secondary-container block">
                  B.I.: {profile.biNumber}
                </span>
              </div>
            </div>
          </div>

          {/* Dados do Passageiro (Box com bordas organizadas e sem poluição) */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b border-surface-container bg-surface-container-lowest">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">account_circle</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-primary">Dados Pessoais Registados</h4>
                  <span className="text-[10px] text-on-surface-variant block">Identificação e contacto do titular</span>
                </div>
              </div>
              <button
                onClick={() => setEditProfileModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-xs font-bold text-secondary flex items-center gap-1 transition-colors cursor-pointer border border-surface-container"
              >
                <span className="material-symbols-outlined text-[14px]">edit</span>
                <span>Editar Dados</span>
              </button>
            </div>

            <div className="p-4 divide-y divide-surface-container space-y-0 text-xs">
              <div className="flex items-center justify-between py-2.5 first:pt-0">
                <span className="text-on-surface-variant flex items-center gap-1.5 font-medium">
                  <span className="material-symbols-outlined text-[16px] text-outline">person</span>
                  Nome Completo:
                </span>
                <strong className="text-primary font-bold">{profile.name}</strong>
              </div>

              <div className="flex items-center justify-between py-2.5">
                <span className="text-on-surface-variant flex items-center gap-1.5 font-medium">
                  <span className="material-symbols-outlined text-[16px] text-outline">call</span>
                  N.º de Telemóvel:
                </span>
                <strong className="text-primary font-mono font-bold">{profile.phone}</strong>
              </div>

              <div className="flex items-center justify-between py-2.5">
                <span className="text-on-surface-variant flex items-center gap-1.5 font-medium">
                  <span className="material-symbols-outlined text-[16px] text-outline">mail</span>
                  E-mail:
                </span>
                <strong className="text-primary font-bold">{profile.email}</strong>
              </div>

              <div className="flex items-center justify-between py-2.5">
                <span className="text-on-surface-variant flex items-center gap-1.5 font-medium">
                  <span className="material-symbols-outlined text-[16px] text-outline">badge</span>
                  B.I. / NIF:
                </span>
                <strong className="text-primary font-mono font-bold">{profile.biNumber}</strong>
              </div>

              <div className="flex items-center justify-between py-2.5">
                <span className="text-on-surface-variant flex items-center gap-1.5 font-medium">
                  <span className="material-symbols-outlined text-[16px] text-outline">notifications</span>
                  Notificações:
                </span>
                <strong className="text-primary font-bold">{profile.notificationChannel}</strong>
              </div>

              <div className="flex items-center justify-between py-2.5 last:pb-0">
                <span className="text-on-surface-variant flex items-center gap-1.5 font-medium">
                  <span className="material-symbols-outlined text-[16px] text-outline">verified_user</span>
                  Estado da Conta:
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  Ativa & Verificada
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDITAR DADOS DO PASSAGEIRO                         */}
      {/* ========================================================= */}
      {editProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary/70 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl p-5 shadow-2xl space-y-3.5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-1 border-b border-surface-container">
              <h3 className="text-sm font-bold text-primary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary text-[20px]">
                  manage_accounts
                </span>
                Editar Registo de Passageiro
              </h3>
              <button
                onClick={() => setEditProfileModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Foto de Perfil Upload */}
            <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl">
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="w-14 h-14 rounded-full object-cover border-2 border-secondary shadow-sm"
              />
              <div className="flex-1 space-y-1">
                <span className="font-bold text-primary block">Fotografia do Passageiro</span>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold cursor-pointer active:scale-95 transition-transform shadow-xs">
                  <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                  Carregar Nova Foto
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = URL.createObjectURL(file);
                        setProfile((prev) => ({ ...prev, avatarUrl: url }));
                        onTriggerNotice('Foto Atualizada', 'A sua fotografia de perfil foi carregada.', 'check_circle');
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-1 border-b border-surface-container">
                <span className="font-bold text-primary">Preencha os seus dados de passageiro:</span>
                <span className="text-[10px] text-on-surface-variant font-medium">Todos os campos são atualizados em direto</span>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-primary">Nome Completo</label>
                <input
                  type="text"
                  placeholder="Ex: Manuel António Dias"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl bg-surface-container-low text-primary font-medium focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-primary">Telemóvel (WhatsApp / SMS)</label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl bg-surface-container-low text-primary font-medium focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-primary">E-mail</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl bg-surface-container-low text-primary font-medium focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-primary">Bilhete de Identidade (B.I.)</label>
                <input
                  type="text"
                  value={profile.biNumber}
                  onChange={(e) => setProfile({ ...profile, biNumber: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl bg-surface-container-low text-primary font-medium focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-primary">Canal de Notificação Preferido</label>
                <select
                  value={profile.notificationChannel}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      notificationChannel: e.target.value as any,
                    })
                  }
                  className="w-full h-11 px-3 rounded-xl bg-surface-container-low text-primary font-medium focus:outline-none"
                >
                  <option value="Ambos">Ambos (WhatsApp + SMS)</option>
                  <option value="WhatsApp">Apenas WhatsApp</option>
                  <option value="SMS">Apenas SMS</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => {
                triggerVibrate();
                setEditProfileModalOpen(false);
                onTriggerNotice('Dados Atualizados', 'O seu perfil de passageiro foi gravado com sucesso.', 'check_circle');
              }}
              className="w-full py-3 bg-primary text-on-primary font-bold text-xs rounded-xl shadow cursor-pointer active:scale-95"
            >
              Guardar Alterações
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: COMPROVATIVO DE VIAGEM DIGITAL                    */}
      {/* ========================================================= */}
      {receiptModalTrip && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary/70 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl p-5 shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between pb-1 border-b border-surface-container">
              <h3 className="text-sm font-bold text-primary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary text-[20px]">
                  receipt_long
                </span>
                Comprovativo Digital de Viagem
              </h3>
              <button
                onClick={() => setReceiptModalTrip(null)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="bg-gradient-to-b from-white to-surface-container-low p-4 rounded-xl border border-secondary shadow-sm space-y-2.5 text-xs">
              <div className="flex justify-between border-b border-surface-container pb-2">
                <span className="text-primary font-bold uppercase">FilaTáxi Angola Oficial</span>
                <span className="font-mono font-bold text-secondary">{receiptModalTrip.id}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-on-surface-variant">
                <div>
                  <span className="text-[10px] block opacity-75">Origem:</span>
                  <strong className="text-primary">{receiptModalTrip.origin}</strong>
                </div>
                <div>
                  <span className="text-[10px] block opacity-75">Destino:</span>
                  <strong className="text-primary">{receiptModalTrip.destination}</strong>
                </div>
                <div>
                  <span className="text-[10px] block opacity-75">Viatura:</span>
                  <strong className="text-primary font-mono">{receiptModalTrip.vehiclePlate}</strong>
                </div>
                <div>
                  <span className="text-[10px] block opacity-75">Motorista:</span>
                  <strong className="text-primary">{receiptModalTrip.driverName}</strong>
                </div>
                <div>
                  <span className="text-[10px] block opacity-75">Pagamento:</span>
                  <strong className="text-primary">{receiptModalTrip.paymentMethod}</strong>
                </div>
                <div>
                  <span className="text-[10px] block opacity-75">Ref. Transação:</span>
                  <strong className="text-primary font-mono">{receiptModalTrip.paymentRef}</strong>
                </div>
              </div>
              <div className="pt-2 border-t border-surface-container flex justify-between items-center text-sm">
                <span className="font-bold text-primary">Tarifa Paga:</span>
                <span className="font-mono font-black text-secondary">
                  {receiptModalTrip.amountKz.toLocaleString('pt-AO')} Kz
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  triggerVibrate();
                  const text = encodeURIComponent(
                    `🧾 Comprovativo de Viagem FilaTáxi (${receiptModalTrip.id}): ${receiptModalTrip.origin} → ${receiptModalTrip.destination} | Valor: ${receiptModalTrip.amountKz} Kz pago via ${receiptModalTrip.paymentMethod}. Viatura: ${receiptModalTrip.vehiclePlate}.`
                  );
                  window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
                }}
                className="py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 shadow cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">share</span>
                Enviar WhatsApp
              </button>
              <button
                onClick={() => setReceiptModalTrip(null)}
                className="py-2.5 bg-surface-container text-primary font-bold text-xs rounded-xl cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: TERMOS DE UTILIZAÇÃO DO SERVIÇO FILATÁXI           */}
      {/* ========================================================= */}
      {termsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary/70 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl p-5 shadow-2xl space-y-3.5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-1 border-b border-surface-container">
              <h3 className="text-sm font-bold text-primary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary text-[20px]">
                  policy
                </span>
                Termos de Utilização do Serviço
              </h3>
              <button
                onClick={() => setTermsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-on-surface-variant leading-relaxed">
              <div className="p-3 bg-surface-container-low rounded-xl space-y-1">
                <strong className="text-primary font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-secondary">verified_user</span>
                  1. Registo e Identificação Oficial
                </strong>
                <p>
                  O passageiro regista-se com os dados necessários (Nome completo, Número de telefone/WhatsApp, Palavra-passe e Aceitação dos termos). Os dados são estritamente utilizados para emissão da senha digital e gestão segura do transporte.
                </p>
              </div>

              <div className="p-3 bg-surface-container-low rounded-xl space-y-1">
                <strong className="text-primary font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-secondary">confirmation_number</span>
                  2. Registo Obrigatório dos Pedidos de Transporte
                </strong>
                <p>
                  Ao solicitar transporte, o sistema regista automaticamente a praça ou rota escolhida, a data, a hora e o estado do pedido. A ordem de chegada na fila virtual é inviolável.
                </p>
              </div>

              <div className="p-3 bg-surface-container-low rounded-xl space-y-1">
                <strong className="text-primary font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-secondary">payments</span>
                  3. Tarifário Oficial e Pagamento Digital
                </strong>
                <p>
                  A tarifa regulamentada para a malha urbana de Luanda é de 500 Kz por passageiro/assento. O pagamento pode ser feito de forma instantânea via Express ou numerário.
                </p>
              </div>

              <div className="p-3 bg-surface-container-low rounded-xl space-y-1">
                <strong className="text-primary font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-secondary">shield</span>
                  4. Lotação Máxima e Segurança
                </strong>
                <p>
                  As viaturas Toyota Hiace têm capacidade limite de 15 passageiros sentados. É proibida a sobrelotação. Em qualquer situação anómala, o passageiro tem acesso ao Botão SOS de emergência.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                triggerVibrate();
                setAcceptedTerms(true);
                setTermsModalOpen(false);
              }}
              className="w-full py-3 bg-primary text-on-primary font-bold text-xs rounded-xl shadow cursor-pointer active:scale-95"
            >
              Compreendi e Aceito os Termos
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: GUIA OFICIAL DE PRAÇAS, ROTAS E TARIFAS DE LUANDA  */}
      {/* ========================================================= */}
      {tariffGuideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary/70 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl p-5 shadow-2xl space-y-3.5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-1 border-b border-surface-container">
              <h3 className="text-sm font-bold text-primary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary text-[20px]">
                  menu_book
                </span>
                Guia Oficial de Praças, Rotas e Tarifas
              </h3>
              <button
                onClick={() => setTariffGuideModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-3 bg-secondary-container/20 rounded-xl border border-secondary-container flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-primary block">Tarifa Regulamentada (Luanda)</span>
                <span className="text-[11px] text-on-surface-variant">
                  Fixada pelo Governo Provincial & ATA
                </span>
              </div>
              <span className="font-mono font-black text-lg text-primary">
                500 Kz <span className="text-[10px] font-normal">/ passageiro</span>
              </span>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-primary block">
                Rotas Urbanas Disponíveis & Frequência:
              </span>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {LUANDA_PRACAS.map((praca) =>
                  praca.destinations.map((dest) => (
                    <div
                      key={`${praca.id}-${dest}`}
                      onClick={() => {
                        triggerVibrate();
                        setCurrentOriginPraca(praca);
                        setCurrentDestName(dest);
                        setTariffGuideModalOpen(false);
                      }}
                      className="p-2.5 bg-surface-container-low hover:bg-surface-container rounded-xl flex items-center justify-between cursor-pointer transition-colors text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold text-primary block">
                          {praca.name.replace('Praça do ', '').replace('Praça de ', '')} → {dest}
                        </span>
                        <span className="text-[10px] text-on-surface-variant">
                          Terminal: {praca.subtitle.split('•')[0]} • Espera média: ~{praca.minEspera}m
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-secondary block">
                          500 Kz
                        </span>
                        <span className="text-[10px] text-emerald-700 font-semibold">
                          {praca.naFila} táxis
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-surface-container flex items-center justify-between text-xs">
              <span className="text-on-surface-variant">
                Total para {selectedSeatCount} lugar{selectedSeatCount > 1 ? 'es' : ''}:
              </span>
              <strong className="font-mono font-bold text-primary text-sm">
                {(selectedSeatCount * 500).toLocaleString('pt-AO')} Kz
              </strong>
            </div>

            <button
              onClick={() => setTariffGuideModalOpen(false)}
              className="w-full py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl cursor-pointer"
            >
              Fechar Guia
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: FICHA OFICIAL DO PEDIDO DE TRANSPORTE REGISTADO     */}
      {/* ========================================================= */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary/70 backdrop-blur-sm p-4">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl p-5 shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between pb-1 border-b border-surface-container">
              <h3 className="text-sm font-bold text-primary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary text-[20px]">
                  receipt_long
                </span>
                Ficha do Pedido de Transporte
              </h3>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="bg-surface-container-low p-4 rounded-xl border border-surface-container space-y-2.5 text-xs">
              <div className="flex justify-between items-center border-b border-surface-container pb-2">
                <span className="text-primary font-bold uppercase tracking-wider">
                  Registo Oficial do Sistema
                </span>
                <span className="font-mono font-black text-secondary">
                  {selectedOrderDetails.id}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-on-surface-variant">
                <div>
                  <span className="text-[10px] block opacity-75">Praça Escolhida (Origem):</span>
                  <strong className="text-primary">{selectedOrderDetails.pracaOrigem}</strong>
                </div>
                <div>
                  <span className="text-[10px] block opacity-75">Rota / Destino:</span>
                  <strong className="text-primary">{selectedOrderDetails.rotaDestino}</strong>
                </div>
                <div>
                  <span className="text-[10px] block opacity-75">Data do Pedido:</span>
                  <strong className="text-primary font-mono">{selectedOrderDetails.data}</strong>
                </div>
                <div>
                  <span className="text-[10px] block opacity-75">Hora do Pedido:</span>
                  <strong className="text-primary font-mono">{selectedOrderDetails.hora}</strong>
                </div>
                <div>
                  <span className="text-[10px] block opacity-75">Tipo de Solicitação:</span>
                  <strong className="text-primary">{selectedOrderDetails.tipoPedido}</strong>
                </div>
                <div>
                  <span className="text-[10px] block opacity-75">Estado do Pedido:</span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedOrderDetails.status === 'Pendente na Fila'
                        ? 'bg-amber-100 text-amber-800'
                        : selectedOrderDetails.status === 'Viatura Atribuída'
                        ? 'bg-blue-100 text-blue-800'
                        : selectedOrderDetails.status === 'Concluído'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {selectedOrderDetails.status}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] block opacity-75">Lugares Solicitados:</span>
                  <strong className="text-primary">{selectedOrderDetails.lugares}</strong>
                </div>
                <div>
                  <span className="text-[10px] block opacity-75">Viatura Atribuída:</span>
                  <strong className="text-primary font-mono">{selectedOrderDetails.veiculoPlaca || 'Em Atribuição'}</strong>
                </div>
              </div>

              <div className="pt-2 border-t border-surface-container flex justify-between items-center text-sm">
                <span className="font-bold text-primary">Tarifa Total:</span>
                <span className="font-mono font-black text-secondary">
                  {selectedOrderDetails.tarifaTotalKz.toLocaleString('pt-AO')} Kz
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  triggerVibrate();
                  const text = encodeURIComponent(
                    `🚕 Ficha do Pedido FilaTáxi (${selectedOrderDetails.id}): Rota ${selectedOrderDetails.pracaOrigem} → ${selectedOrderDetails.rotaDestino} registado em ${selectedOrderDetails.data} às ${selectedOrderDetails.hora}. Estado: ${selectedOrderDetails.status}. Total: ${selectedOrderDetails.tarifaTotalKz} Kz.`
                  );
                  window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
                }}
                className="py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 shadow cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">share</span>
                Enviar WhatsApp
              </button>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="py-2.5 bg-surface-container text-primary font-bold text-xs rounded-xl cursor-pointer"
              >
                Fechar Ficha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
