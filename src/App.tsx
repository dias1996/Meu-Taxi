/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { LiveMapView, LUANDA_PRACAS, PracaLocation } from './components/LiveMapView';
import { PassengerArea } from './components/PassengerArea';
import { DriverArea } from './components/DriverArea';
import { InspectorArea } from './components/InspectorArea';
import { AdminArea } from './components/AdminArea';
import { LoginScreen } from './components/LoginScreen';
import {
  INITIAL_PASSENGERS,
  INITIAL_DRIVERS,
  INITIAL_VEHICLES,
  INITIAL_FISCAIS,
  INITIAL_PRACAS,
  INITIAL_ROUTES,
  INITIAL_QUEUES,
  INITIAL_INTERVENTIONS,
  INITIAL_TRIPS,
  INITIAL_PAYMENTS,
  INITIAL_INCIDENTS,
} from './data/ecosystemData';
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
  AuthUser,
} from './types/ecosystem';

export type UserRole = 'passenger' | 'driver' | 'inspector' | 'admin';

type MainTab = 'inicio' | 'minha-fila' | 'historico' | 'perfil';
type AuthTab = 'login' | 'register';
type HistoricoView = 'passenger' | 'driver';
type QueueState = 'waiting' | 'turn';
type TripState = 'ongoing' | 'completed';

interface TripRecord {
  id: string;
  origin: string;
  destination: string;
  date: string;
  passengers: number;
  revenueKz: number;
  status: 'Concluída';
}

const LOGO_URL = '/src/assets/images/filataxi_logo_icon_1791808363316.jpg';
const PROFILE_AVATAR_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC2r3aCmeVJQsl3Z5uxmsUFCQeLTaxPIDu8oVc4rSoQdLYHM1M82pB29lDQnbAS9IXd0j7OgMGZ0hlwiIEiurjt9DdJSV-8Z0MLgoZ_MD519opCYJvy7DcTmxcmanXtazrDbc5AoSSTtzoIi9BSlxAHjxTPbKL98c66DoQvFGMmgQWphlUPvhfnXC956Owedq9DAvV14fa0g8UpePUOuvTwYfE5Tene0nnV9ciU3r9H9V1WfQKVnblYig';
const DRIVER_PORTRAIT_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDNJqMwGs4dYuqJcjYiOSwHP0TsTrcb6wcTw0IVR2pNjP-omgfuIxaIh1RlTVyEVOasxS05ihG3DzNeZDB6q3A3MZgJfwiPnOevyXURIyqXA1nbUZimjPrSXCJdxHO1N3Ydrdd0A2r4E0ppwGymp5JuRXJUVa9iEa9w2RR3atsNezsW6aMcGKePVy-B2mdp854V0mh4kALiGSsz8JPClctCCgdk0N4nqewTEkp19jqsHnS3KDyQPEbj7g';
const TRIP_DRIVER_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDDx5_b7KtpzQrWMz2cgD0RGZOUHQv8qgm3_H9HjiYZXIostNhaUj2DT3blYZ863JO3r060PkPzPvQc-kPmBjgbO_3d-eZ8T7fsbkuwUKSUzNeaYQYG8koUkPHEfE86l92OlKV-aJAwqt_puZu0X9wZqxx-8t2hB-sn0dYBKP_AxJn-1aBcN2V0KEk3FgSV0n7Qln7uUbn1aP3Qpu1iwC7Ich6xKx_IAGnmnf3ncTZwsI1BvICnyjO0pw';
const DEFAULT_VEHICLE_PHOTO_URL = '/src/assets/images/angola_taxi_hiace_1791809024746.jpg';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

function calcDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function App() {
  // Quota Exceeded State (Google Maps Platform Demo Key requirement)
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  // Utilizador Autenticado e Ecrã de Login
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('filataxi_auth_user');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null; // Quando null, apresenta o LoginScreen conforme solicitado!
  });

  // 4 Execution Levels (Passageiro, Motorista, Fiscal, Administração)
  const [userRole, setUserRole] = useState<UserRole>(() => {
    try {
      const saved = localStorage.getItem('filataxi_auth_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.role) return parsed.role;
      }
    } catch {}
    return 'passenger';
  });
  const [roleModalOpen, setRoleModalOpen] = useState(false);

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    setUserRole(user.role);
    try {
      localStorage.setItem('filataxi_auth_user', JSON.stringify(user));
    } catch {}
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('filataxi_auth_user');
    } catch {}
    showModal('Sessão Terminada', 'A sua sessão foi encerrada com sucesso.', 'logout');
  };

  // =========================================================================
  // ECOSSISTEMA COMPARTILHADO & SINCRONIA GERAL (PASSAGEIRO, MOTORISTA, FISCAL, ADMIN)
  // =========================================================================
  const [passengersList, setPassengersList] = useState<PassengerRecord[]>(() => {
    try {
      const saved = localStorage.getItem('filataxi_passengers_list');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_PASSENGERS;
  });

  const [driversList, setDriversList] = useState<DriverRecord[]>(() => {
    try {
      const saved = localStorage.getItem('filataxi_drivers_list');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_DRIVERS;
  });

  const [vehiclesList, setVehiclesList] = useState<VehicleRecord[]>(() => {
    try {
      const saved = localStorage.getItem('filataxi_vehicles_list');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_VEHICLES;
  });

  const [fiscaisList, setFiscaisList] = useState<FiscalRecord[]>(() => {
    try {
      const saved = localStorage.getItem('filataxi_fiscais_list');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_FISCAIS;
  });

  const [pracasList, setPracasList] = useState<PracaRecord[]>(() => {
    try {
      const saved = localStorage.getItem('filataxi_pracas_list');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_PRACAS;
  });

  const [routesList, setRoutesList] = useState<RouteRecord[]>(() => {
    try {
      const saved = localStorage.getItem('filataxi_routes_list');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_ROUTES;
  });

  const [queuesList, setQueuesList] = useState<QueueItemRecord[]>(() => {
    try {
      const saved = localStorage.getItem('filataxi_queues_list');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_QUEUES;
  });

  const [interventionsList, setInterventionsList] = useState<QueueInterventionRecord[]>(() => {
    try {
      const saved = localStorage.getItem('filataxi_interventions_list');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_INTERVENTIONS;
  });

  const [tripsList, setTripsList] = useState<TripRecordAdmin[]>(() => {
    try {
      const saved = localStorage.getItem('filataxi_trips_list');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_TRIPS;
  });

  const [paymentsList, setPaymentsList] = useState<PaymentRecord[]>(() => {
    try {
      const saved = localStorage.getItem('filataxi_payments_list');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_PAYMENTS;
  });

  const [incidentsList, setIncidentsList] = useState<IncidentRecord[]>(() => {
    try {
      const saved = localStorage.getItem('filataxi_incidents_list');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_INCIDENTS;
  });

  // Salvar no localStorage para persistência e reatividade contínua
  useEffect(() => {
    try {
      localStorage.setItem('filataxi_passengers_list', JSON.stringify(passengersList));
      localStorage.setItem('filataxi_drivers_list', JSON.stringify(driversList));
      localStorage.setItem('filataxi_vehicles_list', JSON.stringify(vehiclesList));
      localStorage.setItem('filataxi_fiscais_list', JSON.stringify(fiscaisList));
      localStorage.setItem('filataxi_pracas_list', JSON.stringify(pracasList));
      localStorage.setItem('filataxi_routes_list', JSON.stringify(routesList));
      localStorage.setItem('filataxi_queues_list', JSON.stringify(queuesList));
      localStorage.setItem('filataxi_interventions_list', JSON.stringify(interventionsList));
      localStorage.setItem('filataxi_trips_list', JSON.stringify(tripsList));
      localStorage.setItem('filataxi_payments_list', JSON.stringify(paymentsList));
      localStorage.setItem('filataxi_incidents_list', JSON.stringify(incidentsList));
    } catch {}
  }, [
    passengersList,
    driversList,
    vehiclesList,
    fiscaisList,
    pracasList,
    routesList,
    queuesList,
    interventionsList,
    tripsList,
    paymentsList,
    incidentsList,
  ]);

  // PWA Online/Offline Status Tracking
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showModal('Ligação Restaurada', 'Conexão com a rede de Luanda restabelecida. Sincronização em tempo real ativa.', 'wifi');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showModal('Modo Offline Ativo', 'Sem conexão com a internet. A operar com dados em cache local (PWA Offline).', 'wifi_off');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const requestPushNotifications = async () => {
    triggerVibrate();
    if (!('Notification' in window)) {
      showModal('Notificações Indisponíveis', 'O seu navegador não suporta notificações Push nativas.', 'info');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      new Notification('FilaTáxi AO • Alerta em Tempo Real', {
        body: 'Notificações Push ativadas com sucesso! Será alertado quando for a sua vez na fila.',
        icon: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=192&h=192&fit=crop&q=80',
      });
      showModal('Push Ativado', 'Notificações push em tempo real ativadas com sucesso.', 'notifications_active');
    } else {
      showModal('Permissão Negada', 'Pode ativar as notificações nas definições do seu navegador.', 'notifications_off');
    }
  };

  const joaoStatus = useMemo(() => {
    return driversList.find((d) => d.id === 'driv-01')?.statusConta || 'pendente';
  }, [driversList]);

  // Navigation & View States
  const [activeTab, setActiveTab] = useState<MainTab>('inicio');
  const [inActiveTripScreen, setInActiveTripScreen] = useState(false);
  const [tripState, setTripState] = useState<TripState>('ongoing');
  const [historicoView, setHistoricoView] = useState<HistoricoView>('passenger');
  const [queueState, setQueueState] = useState<QueueState>('waiting');
  const [authTab, setAuthTab] = useState<AuthTab>('login');
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  // Driver & Queue Operational States
  const [driverName, setDriverName] = useState('João Manuel');
  const [driverPassportPhoto, setDriverPassportPhoto] = useState<string | null>(null);
  const [idCardFrontPhoto, setIdCardFrontPhoto] = useState<string | null>(null);
  const [idCardBackPhoto, setIdCardBackPhoto] = useState<string | null>(null);
  const [vehiclePhoto, setVehiclePhoto] = useState<string>(DEFAULT_VEHICLE_PHOTO_URL);
  const [licenseFrontPhoto, setLicenseFrontPhoto] = useState<string | null>(null);
  const [licenseBackPhoto, setLicenseBackPhoto] = useState<string | null>(null);
  const [vehiclePlate, setVehiclePlate] = useState('LD-44-21-GP');
  const [vehicleModel, setVehicleModel] = useState('Toyota Hiace (Azul/Branco)');
  const [licenseNumber, setLicenseNumber] = useState('LIC-08834/AO');
  const [biNumber, setBiNumber] = useState('004829104LA049');
  const [queuePosition, setQueuePosition] = useState<number>(17);
  const [inQueue, setInQueue] = useState<boolean>(true);
  const [currentOriginPraca, setCurrentOriginPraca] = useState<PracaLocation>(LUANDA_PRACAS[0]); // Kilamba
  const [currentDestName, setCurrentDestName] = useState<string>('Mutamba');

  // Passenger Search & Filter States
  const [searchOrigin, setSearchOrigin] = useState('Kilamba');
  const [searchDestination, setSearchDestination] = useState('');
  const [notifiedPracas, setNotifiedPracas] = useState<string[]>([]);
  const [expandedMapModal, setExpandedMapModal] = useState<PracaLocation | null>(null);

  // Modals & Notifications
  const [noticeModal, setNoticeModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    icon: string;
  }>({ open: false, title: '', message: '', icon: 'info' });
  const [incidentModalOpen, setIncidentModalOpen] = useState(false);
  const [routeSelectorModalOpen, setRouteSelectorModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Innovative Features Modals & States
  const [filaPassModalOpen, setFilaPassModalOpen] = useState(false);
  const [selectedFilaPassPraca, setSelectedFilaPassPraca] = useState<PracaLocation>(LUANDA_PRACAS[0]);
  const [selectedSeatNum, setSelectedSeatNum] = useState<number>(15);
  const [peakHourSlot, setPeakHourSlot] = useState<string>('Embarque Imediato (Baia 03)');
  const [passengerFilaPhone, setPassengerFilaPhone] = useState<string>('+244 923 442 109');
  const [filaPassSuccessTicket, setFilaPassSuccessTicket] = useState<{
    code: string;
    seatNum: number;
    praca: string;
    dest: string;
    time: string;
  } | null>(null);
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [sosActivated, setSosActivated] = useState(false);
  const [passengerCountCurrent, setPassengerCountCurrent] = useState<number>(14);

  // EMIS / Multicaixa Express Real Payment Gateway & Webhook States
  const [emisModalOpen, setEmisModalOpen] = useState(false);
  const [emisPayment, setEmisPayment] = useState<{
    id: string;
    tipo: 'quota' | 'bilhete' | 'taxa' | 'multa';
    titulo: string;
    entidade: string;
    referencia: string;
    montanteKz: number;
    estado: 'Pendente' | 'Confirmado';
    dataCriacao: string;
  }>({
    id: 'EMIS-TX-99214',
    tipo: 'quota',
    titulo: 'Quota Mensal Sócio ANATA / FilaTáxi',
    entidade: '00182',
    referencia: '982 419 302',
    montanteKz: 5000,
    estado: 'Pendente',
    dataCriacao: new Date().toLocaleString('pt-AO'),
  });

  const handleOpenEmisPayment = (tipo: 'quota' | 'bilhete' | 'taxa' | 'multa', titulo: string, montanteKz: number) => {
    triggerVibrate();
    const refNum = `${Math.floor(100 + Math.random() * 900)} ${Math.floor(100 + Math.random() * 900)} ${Math.floor(100 + Math.random() * 900)}`;
    setEmisPayment({
      id: `EMIS-TX-${Math.floor(10000 + Math.random() * 90000)}`,
      tipo,
      titulo,
      entidade: '00182',
      referencia: refNum,
      montanteKz,
      estado: 'Pendente',
      dataCriacao: new Date().toLocaleString('pt-AO'),
    });
    setEmisModalOpen(true);
  };

  const handleSimulateEmisWebhook = () => {
    triggerVibrate();
    setEmisPayment((prev) => ({ ...prev, estado: 'Confirmado' }));
    
    const newRecord: PaymentRecord = {
      id: emisPayment.id,
      referencia: emisPayment.referencia,
      valorKz: emisPayment.montanteKz,
      metodo: 'Transferência Multicaixa',
      estado: 'Confirmado',
      prestadorConfirmado: true,
      dataHora: new Date().toLocaleString('pt-AO'),
      viagemId: 'TRIP-' + Math.floor(1000 + Math.random() * 9000),
      passageiroNome: currentUser?.nome || 'João Manuel',
      motoristaNome: 'João Manuel (Sócio ANATA)',
      descricao: `${emisPayment.titulo} - Ref: ${emisPayment.referencia} (EMIS Multicaixa Express)`,
    };
    setPaymentsList((prev) => [newRecord, ...prev]);

    showModal(
      'Webhook EMIS: Pagamento Confirmado!',
      `O webhook interbancário notificou a liquidação de ${emisPayment.montanteKz.toLocaleString('pt-AO')} Kz via Multicaixa Express. Registo atualizado com sucesso em tempo real.`,
      'verified'
    );
  };

  // Real-time Geolocation State
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>({
    lat: -8.9986,
    lng: 13.2683,
  });
  const [gpsStatus, setGpsStatus] = useState<'Ativo' | 'Simulado (Luanda)' | 'A localizar...'>(
    'A localizar...'
  );

  // Active Trip Telemetry & Timers
  const [toleranceSeconds, setToleranceSeconds] = useState(178); // 02:58
  const [tripElapsedMinutes, setTripElapsedMinutes] = useState(18);
  const [routeMetrics, setRouteMetrics] = useState<{ distanceKm: string; durationMin: number }>({
    distanceKm: '28.0',
    durationMin: 37,
  });
  const [tripProgressFactor, setTripProgressFactor] = useState(0.45);

  // Driver Statistics & Trip History
  const [dailyTripsCount, setDailyTripsCount] = useState(4);
  const [dailyRevenueKz, setDailyRevenueKz] = useState(12500);
  const [tripHistory, setTripHistory] = useState<TripRecord[]>([
    {
      id: 't1',
      origin: 'Kilamba',
      destination: 'Mutamba',
      date: '06 de Out',
      passengers: 15,
      revenueKz: 7500,
      status: 'Concluída',
    },
    {
      id: 't2',
      origin: 'Kilamba',
      destination: 'Viana',
      date: '05 de Out',
      passengers: 15,
      revenueKz: 5000,
      status: 'Concluída',
    },
  ]);

  // Listen to Google Maps Demo Key Quota Exceeded Event
  useEffect(() => {
    const handleQuota = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  // Watch Real-time Geolocation via navigator.geolocation
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setGpsStatus('Simulado (Luanda)');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        // Check if user is physically near Luanda (within ~150km), otherwise provide real GPS or allow toggle
        const distToLuanda = calcDistanceKm(latitude, longitude, -8.839, 13.289);
        if (distToLuanda < 150) {
          setUserLocation({ lat: latitude, lng: longitude });
          setGpsStatus('Ativo');
        } else {
          // Keep Luanda coordinates for visual relevance on Luanda map while acknowledging GPS lock
          setUserLocation({ lat: -8.9986, lng: 13.2683 });
          setGpsStatus('Ativo');
        }
      },
      () => {
        setGpsStatus('Simulado (Luanda)');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Tolerance countdown timer when in "Sua Vez!" state
  useEffect(() => {
    if (queueState !== 'turn') return;
    const interval = setInterval(() => {
      setToleranceSeconds((prev) => (prev > 0 ? prev - 1 : 178));
    }, 1000);
    return () => clearInterval(interval);
  }, [queueState]);

  // Simulate moving taxi position along route during active trip
  useEffect(() => {
    if (!inActiveTripScreen || tripState !== 'ongoing') return;
    const interval = setInterval(() => {
      setTripProgressFactor((prev) => (prev >= 0.95 ? 0.15 : prev + 0.03));
    }, 2500);
    return () => clearInterval(interval);
  }, [inActiveTripScreen, tripState]);

  const formattedTolerance = useMemo(() => {
    const mins = Math.floor(toleranceSeconds / 60);
    const secs = toleranceSeconds % 60;
    return `0${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }, [toleranceSeconds]);

  const destPracaObj = useMemo(() => {
    return (
      LUANDA_PRACAS.find((p) =>
        p.name.toLowerCase().includes(currentDestName.toLowerCase())
      ) || LUANDA_PRACAS[2] // Default Mutamba
    );
  }, [currentDestName]);

  const simulatedMovingTaxiCoords = useMemo(() => {
    const lat =
      currentOriginPraca.lat +
      (destPracaObj.lat - currentOriginPraca.lat) * tripProgressFactor;
    const lng =
      currentOriginPraca.lng +
      (destPracaObj.lng - currentOriginPraca.lng) * tripProgressFactor;
    return { lat, lng };
  }, [currentOriginPraca, destPracaObj, tripProgressFactor]);

  // Filter Praças in Passenger View
  const filteredPracas = useMemo(() => {
    return LUANDA_PRACAS.filter((p) => {
      const matchOrigin =
        !searchOrigin.trim() ||
        p.name.toLowerCase().includes(searchOrigin.toLowerCase()) ||
        p.subtitle.toLowerCase().includes(searchOrigin.toLowerCase());
      const matchDest =
        !searchDestination.trim() ||
        p.destinations.some((d) =>
          d.toLowerCase().includes(searchDestination.toLowerCase())
        ) ||
        p.name.toLowerCase().includes(searchDestination.toLowerCase());
      return matchOrigin && matchDest;
    });
  }, [searchOrigin, searchDestination]);

  const showModal = (title: string, message: string, icon = 'info') => {
    setNoticeModal({ open: true, title, message, icon });
  };

  const triggerVibrate = () => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(25);
    }
  };

  const handleAdvanceQueueSimulation = () => {
    triggerVibrate();
    if (!inQueue) {
      setInQueue(true);
      setQueuePosition(17);
      return;
    }
    if (queuePosition > 1) {
      const nextPos = Math.max(1, queuePosition - 4);
      setQueuePosition(nextPos);
      if (nextPos === 1) {
        setQueueState('turn');
      }
    } else {
      setQueueState('turn');
    }
  };

  const handleStartTrip = () => {
    triggerVibrate();
    setInActiveTripScreen(true);
    setTripState('ongoing');
    setTripElapsedMinutes(18);
  };

  const handleCompleteTrip = () => {
    triggerVibrate();
    setTripState('completed');
    setDailyTripsCount((c) => c + 1);
    setDailyRevenueKz((r) => r + 7500);
    const newRecord: TripRecord = {
      id: `t-${Date.now()}`,
      origin: currentOriginPraca.name.replace('Praça do ', '').replace('Praça da ', '').replace('Praça de ', ''),
      destination: currentDestName,
      date: 'Hoje',
      passengers: 15,
      revenueKz: 7500,
      status: 'Concluída',
    };
    setTripHistory((prev) => [newRecord, ...prev]);
  };

  const handleReturnQueueAtDestination = () => {
    triggerVibrate();
    const newOrigin = destPracaObj;
    const oldOriginShort = currentOriginPraca.name
      .replace('Praça do ', '')
      .replace('Praça da ', '')
      .replace('Praça de ', '');
    setCurrentOriginPraca(newOrigin);
    setCurrentDestName(oldOriginShort);
    setQueuePosition(8);
    setInQueue(true);
    setQueueState('waiting');
    setInActiveTripScreen(false);
    setActiveTab('minha-fila');
    showModal(
      'Posicionado na Fila Digital',
      `Viatura ${vehiclePlate} posicionada com sucesso no fim da fila da ${newOrigin.name}! Posição atribuída: #08.`,
      'check_circle'
    );
  };

  const toggleModeShortcut = () => {
    triggerVibrate();
    if (activeTab === 'historico') {
      setHistoricoView((v) => (v === 'passenger' ? 'driver' : 'passenger'));
    } else {
      setActiveTab('historico');
      setHistoricoView('passenger');
    }
  };

  const getHeaderTitle = () => {
    if (inActiveTripScreen) return 'Embarque Ativo';
    if (userRole === 'passenger') return 'Área do Passageiro';
    if (userRole === 'inspector') return 'Área do Fiscal de Praça';
    if (userRole === 'admin') return 'Painel Administrativo';
    switch (activeTab) {
      case 'inicio':
        return 'Início';
      case 'minha-fila':
        return 'Minha Fila';
      case 'historico':
        return 'Histórico';
      case 'perfil':
        return 'Perfil & Acesso';
    }
  };

  if (!currentUser) {
    return (
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY} language="pt-AO" region="AO">
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          onExploreAsGuest={() => {
            handleLoginSuccess({
              id: 'usr-guest',
              nome: 'Visitante',
              telefone: '+244 900 000 000',
              role: 'passenger',
              dataLogin: new Date().toLocaleDateString('pt-AO'),
            });
          }}
          onTriggerNotice={showModal}
          triggerVibrate={triggerVibrate}
          setPassengers={setPassengersList}
          setDrivers={setDriversList}
          setFiscais={setFiscaisList}
        />
        {/* Notice Modal */}
        {noticeModal.open && (
          <div className="fixed inset-0 bg-primary/60 backdrop-blur-sm z-50 flex items-end justify-center p-4">
            <div className="bg-surface-container-lowest w-full max-w-sm rounded-xl p-space-lg shadow-xl flex flex-col gap-3">
              <div className="w-12 h-12 rounded-full bg-secondary-container/20 text-secondary flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[28px]">{noticeModal.icon}</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface text-center">
                {noticeModal.title}
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant text-center">
                {noticeModal.message}
              </p>
              <button
                onClick={() => setNoticeModal((prev) => ({ ...prev, open: false }))}
                className="w-full py-3 rounded-xl bg-primary text-on-primary font-label-lg active:scale-95 transition-transform cursor-pointer"
              >
                Compreendi
              </button>
            </div>
          </div>
        )}
      </APIProvider>
    );
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} language="pt-AO" region="AO">
      <div className="bg-surface font-body-md text-body-md text-on-surface flex flex-col min-h-screen max-w-md mx-auto w-full shadow-2xl relative">
        {/* Mandatory Google Maps Demo Key Quota Banner */}
        {quotaExceeded && (
          <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
            <span>
              Google Maps Platform quota reached. If you are the app owner, visit{' '}
              <a
                href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold text-amber-950 hover:text-amber-800"
              >
                maps developer site
              </a>{' '}
              for instructions to update your account.
            </span>
          </div>
        )}

        {/* ========================================================= */}
        {/* SCREEN: EMBARQUE ATIVO (ACTIVE TRIP STACK SCREEN)         */}
        {/* ========================================================= */}
        {inActiveTripScreen ? (
          <>
            <header className="fixed top-0 inset-x-0 max-w-md mx-auto z-40 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] pt-safe">
              <div className="h-16 px-gutter flex items-center justify-between gap-space-sm">
                <div className="flex items-center gap-space-sm min-w-0">
                  <button
                    aria-label="Voltar"
                    onClick={() => setInActiveTripScreen(false)}
                    className="w-11 h-11 -ml-1.5 flex items-center justify-center rounded-full text-on-surface hover:text-primary active:bg-surface-container cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[24px]">arrow_back</span>
                  </button>
                  <img
                    alt="FilaTáxi Angola Logo"
                    className="h-9 w-9 rounded-lg object-cover shadow-sm"
                    src={LOGO_URL}
                    referrerPolicy="no-referrer"
                  />
                  <h1 className="font-headline-sm text-headline-sm text-primary truncate">
                    Embarque Ativo
                  </h1>
                </div>
                <div className="flex items-center gap-space-sm shrink-0">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-surface-container-low">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                      Ativo
                    </span>
                  </div>
                  <img
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover"
                    src={driverPassportPhoto || PROFILE_AVATAR_URL}
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </header>

            <main className="flex flex-col relative w-full pt-20 pb-12 bg-surface flex-1">
              <div className="flex flex-col w-full px-margin space-y-space-md">
                {/* Interactive Dynamic View Switcher */}
                <div className="flex items-center justify-between p-1 bg-surface-container rounded-xl shadow-sm">
                  <button
                    onClick={() => setTripState('ongoing')}
                    className={`flex-1 py-2 px-3 rounded-lg text-center font-label-md transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                      tripState === 'ongoing'
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'text-on-surface-variant'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">local_taxi</span>
                    <span>1. Em Andamento</span>
                  </button>
                  <button
                    onClick={() => setTripState('completed')}
                    className={`flex-1 py-2 px-3 rounded-lg text-center font-label-md transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                      tripState === 'completed'
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'text-on-surface-variant'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    <span>2. Concluída</span>
                  </button>
                </div>

                {tripState === 'ongoing' ? (
                  <div className="flex flex-col space-y-space-md transition-opacity duration-300">
                    {/* Top Status Banner */}
                    <div className="bg-primary-container text-on-primary rounded-xl p-space-md shadow-md relative overflow-hidden">
                      <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary-container opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary-container"></span>
                          </span>
                          <span className="font-label-lg text-secondary-container tracking-wide uppercase">
                            Viagem Ativa
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              triggerVibrate();
                              setSosModalOpen(true);
                            }}
                            className="px-2 py-0.5 rounded-full bg-error text-white font-label-sm font-bold flex items-center gap-1 text-[11px] shadow-sm cursor-pointer active:scale-95 transition-transform"
                          >
                            <span className="material-symbols-outlined text-[13px]">shield</span>
                            SOS
                          </button>
                          <div className="px-2.5 py-1 rounded-full bg-surface-tint/20 text-inverse-on-surface font-label-sm">
                            FilaTáxi GPS Sync
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 relative z-10">
                        <span className="font-label-sm text-on-primary-container uppercase tracking-wider">
                          Itinerário em Curso
                        </span>
                        <h2 className="font-headline-lg text-headline-lg text-on-primary mt-0.5">
                          {currentOriginPraca.name
                            .replace('Praça do ', '')
                            .replace('Praça da ', '')
                            .replace('Praça de ', '')}{' '}
                          → {currentDestName}
                        </h2>
                        <div className="flex items-center gap-1.5 text-on-primary-container mt-1 font-body-sm text-body-sm">
                          <span className="material-symbols-outlined text-[16px]">alt_route</span>
                          <span>Corredor {currentOriginPraca.corridor} • Tráfego Fluido</span>
                        </div>
                      </div>
                      <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-secondary-container/10 pointer-events-none"></div>
                    </div>

                    {/* Live Ride Map Pinning Visual */}
                    <div className="relative w-full h-48 rounded-xl overflow-hidden shadow-sm bg-surface-container-high">
                      <LiveMapView
                        userLocation={userLocation}
                        showRouteFrom={{
                          lat: currentOriginPraca.lat,
                          lng: currentOriginPraca.lng,
                        }}
                        showRouteTo={{
                          lat: destPracaObj.lat,
                          lng: destPracaObj.lng,
                        }}
                        movingTaxiPos={simulatedMovingTaxiCoords}
                        heightClass="h-48"
                        onRouteCalculated={(details) => setRouteMetrics(details)}
                      />
                      <div className="absolute top-3 left-3 bg-surface-container-lowest/95 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-md flex items-center gap-2 z-10 pointer-events-none">
                        <div className="w-7 h-7 rounded-full bg-secondary-container text-primary flex items-center justify-center font-headline-sm">
                          <span className="material-symbols-outlined text-[18px]">navigation</span>
                        </div>
                        <div>
                          <div className="font-label-sm text-on-surface-variant">Posição Atual</div>
                          <div className="font-title-lg text-primary text-[13px] leading-tight">
                            {currentOriginPraca.corridor}
                          </div>
                        </div>
                      </div>
                      <div className="absolute bottom-3 right-3 bg-primary text-on-primary px-3 py-1 rounded-full shadow font-label-sm flex items-center gap-1.5 z-10 pointer-events-none">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span>Velocidade: 48 km/h</span>
                      </div>
                    </div>

                    {/* Telemetry & Time Grid */}
                    <div className="grid grid-cols-2 gap-space-sm">
                      <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
                        <div className="flex items-center gap-1.5 text-on-surface-variant font-label-md">
                          <span className="material-symbols-outlined text-[18px] text-secondary">
                            schedule
                          </span>
                          <span>Hora Partida</span>
                        </div>
                        <div className="mt-2">
                          <span className="font-headline-md text-headline-md text-primary">
                            14:15
                          </span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant block">
                            Pontual • {routeMetrics.distanceKm} km
                          </span>
                        </div>
                      </div>
                      <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between">
                        <div className="flex items-center gap-1.5 text-on-surface-variant font-label-md">
                          <span className="material-symbols-outlined text-[18px] text-secondary">
                            timer
                          </span>
                          <span>Tempo Decorrido</span>
                        </div>
                        <div className="mt-2 flex items-baseline gap-1">
                          <span className="font-headline-md text-headline-md text-secondary">
                            {tripElapsedMinutes}
                          </span>
                          <span className="font-label-md text-on-surface">
                            / ~{routeMetrics.durationMin} min
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Vehicle & Driver Card */}
                    <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm">
                      <div className="flex items-center gap-space-md">
                        <img
                          className="w-14 h-14 rounded-full object-cover shadow-sm shrink-0"
                          alt="Motorista João Manuel"
                          src={TRIP_DRIVER_URL}
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-title-lg text-title-lg text-primary truncate">
                              {driverName}
                            </h3>
                            <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-sm font-mono">
                              {vehiclePlate}
                            </span>
                          </div>
                          <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 truncate">
                            {vehicleModel}
                          </p>
                          <div className="flex items-center gap-1 mt-1 text-secondary">
                            <span
                              className="material-symbols-outlined text-[16px]"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              star
                            </span>
                            <span className="font-label-sm text-label-sm text-on-surface font-semibold">
                              4.9
                            </span>
                            <span className="font-body-sm text-on-surface-variant text-[11px]">
                              (320 viagens)
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 bg-surface-container-low p-3 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-surface-container-lowest text-primary flex items-center justify-center">
                            <span className="material-symbols-outlined text-[20px]">groups</span>
                          </div>
                          <div>
                            <div className="font-label-sm text-on-surface-variant">
                              Lotação Atual em Tempo Real
                            </div>
                            <div className="font-label-lg text-primary">
                              {passengerCountCurrent} / 15 Passageiros
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              triggerVibrate();
                              setPassengerCountCurrent((prev) => Math.max(1, prev - 1));
                            }}
                            className="w-7 h-7 rounded bg-surface-container flex items-center justify-center font-bold text-primary active:scale-90"
                            title="Descer passageiro"
                          >
                            -
                          </button>
                          <button
                            onClick={() => {
                              triggerVibrate();
                              setPassengerCountCurrent((prev) => Math.min(15, prev + 1));
                            }}
                            className="w-7 h-7 rounded bg-surface-container flex items-center justify-center font-bold text-primary active:scale-90"
                            title="Subir passageiro"
                          >
                            +
                          </button>
                          <span
                            className={`px-2.5 py-1 rounded-full font-label-sm uppercase font-bold text-[10px] ${
                              passengerCountCurrent >= 15
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {passengerCountCurrent >= 15 ? 'Carro Cheio' : `${15 - passengerCountCurrent} Vagos`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Ferramentas em Viagem: WhatsApp & SOS */}
                    <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm space-y-2">
                      <div className="flex items-center justify-between text-xs pb-1 border-b border-surface-container">
                        <span className="font-bold text-primary flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-secondary">
                            bolt
                          </span>
                          Ferramentas em Viagem
                        </span>
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
                          Segurança & Viagem
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">

                        <button
                          onClick={() => {
                            triggerVibrate();
                            const text = encodeURIComponent(
                              `Estou a viajar no candongueiro FilaTáxi (${vehiclePlate}) de ${currentOriginPraca.name} para ${currentDestName}. Acompanha a minha localização GPS em tempo real: https://filataxi.ao/live/${vehiclePlate}`
                            );
                            window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
                            showModal(
                              'Link de Rastreio Gerado',
                              'O link de partilha GPS foi preparado para envio aos seus contactos de confiança via WhatsApp.',
                              'share'
                            );
                          }}
                          className="p-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 flex flex-col items-center justify-center text-center gap-1 active:scale-95 transition-transform cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[20px] text-emerald-700">
                            share_location
                          </span>
                          <span className="text-[11px] font-bold text-emerald-950 block leading-tight">
                            WhatsApp
                          </span>
                          <span className="text-[9px] text-emerald-800 font-medium">Partilhar GPS</span>
                        </button>

                        <button
                          onClick={() => {
                            triggerVibrate();
                            setSosModalOpen(true);
                          }}
                          className="p-2.5 rounded-lg bg-error-container/30 hover:bg-error-container/50 border border-error/30 text-on-error-container flex flex-col items-center justify-center text-center gap-1 active:scale-95 transition-transform cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[20px] text-error">
                            crisis_alert
                          </span>
                          <span className="text-[11px] font-bold text-error block leading-tight">
                            SOS Pânico
                          </span>
                          <span className="text-[9px] text-error font-medium">Alerta 113</span>
                        </button>
                      </div>
                    </div>

                    {/* Main Dispatch Action */}
                    <div className="pt-2">
                      <button
                        onClick={handleCompleteTrip}
                        className="w-full h-14 rounded-xl bg-secondary-container hover:bg-secondary text-primary hover:text-on-secondary font-headline-sm flex items-center justify-center gap-2 shadow-lg active:scale-[0.99] transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[24px]">flag</span>
                        <span>CONCLUIR VIAGEM</span>
                      </button>
                      <p className="text-center font-body-sm text-on-surface-variant mt-2">
                        Toque apenas ao desembarcar na Praça de {currentDestName}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* MÓDULO 2: VIAGEM CONCLUÍDA */
                  <div className="flex flex-col space-y-space-md transition-opacity duration-300">
                    <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-md text-center flex flex-col items-center relative overflow-hidden">
                      <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2 shadow-inner">
                        <span
                          className="material-symbols-outlined text-[36px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          check_circle
                        </span>
                      </div>
                      <span className="px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-label-sm uppercase font-bold mb-1">
                        Chegada Confirmada
                      </span>
                      <h2 className="font-headline-lg text-primary">
                        Boa viagem, {driverName.split(' ')[0]}!
                      </h2>
                      <p className="font-body-md text-on-surface-variant mt-1 max-w-xs">
                        O seu registo operacional foi atualizado com sucesso no terminal de Luanda.
                      </p>
                    </div>

                    <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-space-md">
                      <div className="flex items-center justify-between pb-1">
                        <span className="font-label-lg text-primary">Resumo da Rota</span>
                        <span className="font-label-sm text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
                          Expresso
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-surface-container-low p-space-md rounded-xl">
                        <div className="text-left">
                          <span className="font-label-sm text-on-surface-variant block">
                            Hora Saída
                          </span>
                          <span className="font-headline-sm text-primary font-bold">14:15</span>
                          <span className="font-body-sm text-on-surface-variant text-[11px] block">
                            {currentOriginPraca.name
                              .replace('Praça do ', '')
                              .replace('Praça da ', '')
                              .replace('Praça de ', '')}
                          </span>
                        </div>
                        <div className="flex flex-col items-center px-2">
                          <span className="font-label-sm text-secondary font-bold">
                            {routeMetrics.durationMin} min
                          </span>
                          <div className="w-20 h-1 bg-outline-variant rounded-full my-1 relative">
                            <div className="w-full h-full bg-primary rounded-full"></div>
                          </div>
                          <span className="font-body-sm text-on-surface-variant text-[11px]">
                            {routeMetrics.distanceKm} km
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-label-sm text-on-surface-variant block">
                            Hora Chegada
                          </span>
                          <span className="font-headline-sm text-primary font-bold">14:52</span>
                          <span className="font-body-sm text-on-surface-variant text-[11px] block">
                            {currentDestName}
                          </span>
                        </div>
                      </div>

                      <div className="bg-primary text-on-primary p-space-md rounded-xl flex items-center justify-between shadow-sm">
                        <div>
                          <span className="font-label-sm text-on-primary-container uppercase">
                            Faturamento Bruto
                          </span>
                          <div className="font-display-lg-mobile text-secondary-container mt-0.5">
                            7.500 Kz
                          </div>
                          <span className="font-body-sm text-on-primary-container text-[12px]">
                            Tarifa: 500 Kz × 15 passageiros
                          </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center text-secondary-container shadow-inner">
                          <span className="material-symbols-outlined text-[28px]">payments</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-surface-container rounded-xl p-space-md shadow-sm">
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-secondary text-[24px] mt-0.5">
                          queue
                        </span>
                        <div className="flex-1">
                          <h4 className="font-title-lg text-primary">
                            Praça de Desembarque: {currentDestName}
                          </h4>
                          <p className="font-body-sm text-on-surface-variant mt-1 leading-relaxed">
                            Ao confirmar, será posicionado automaticamente no final da fila digital
                            da Praça de {currentDestName} para retorno.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-space-sm pt-1">
                      <button
                        onClick={handleReturnQueueAtDestination}
                        className="w-full h-14 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-headline-sm flex items-center justify-center gap-2 shadow-md active:scale-[0.99] transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[22px] text-secondary-container">
                          login
                        </span>
                        <span>VOLTAR À FILA EM {currentDestName.toUpperCase()}</span>
                      </button>
                      <button
                        onClick={() => setIncidentModalOpen(true)}
                        className="w-full h-12 rounded-xl bg-surface-container-low hover:bg-surface-container text-primary font-label-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[20px] text-secondary">
                          report_problem
                        </span>
                        <span>Reportar Ocorrência / Trânsito</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </main>
          </>
        ) : (
          /* ========================================================= */
          /* STANDARD SHELL WITH HEADER & BOTTOM NAVIGATION            */
          /* ========================================================= */
          <>
            <header className="fixed top-0 inset-x-0 max-w-md mx-auto z-40 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] pt-safe">
                <div className="h-16 px-gutter flex items-center justify-between gap-gutter-sm">
                  <div className="flex items-center gap-space-sm">
                    <img
                      alt="FilaTáxi Angola Logo"
                      className="h-9 w-9 rounded-lg object-cover shadow-sm"
                      src={LOGO_URL}
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-space-xs">
                        <span className="font-title-lg text-title-lg text-primary tracking-tight">
                          FilaTáxi
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-fixed text-label-sm font-label-sm uppercase">
                          AO
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                          Online • GPS {gpsStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-space-sm">
                    <button
                      aria-label="Mudar perfil de utilizador"
                      onClick={() => {
                        triggerVibrate();
                        setRoleModalOpen(true);
                      }}
                      className="h-10 px-2.5 rounded-xl bg-secondary-container/20 border border-secondary-container/40 text-primary flex items-center gap-1.5 font-label-md text-xs font-bold active:scale-95 transition-transform cursor-pointer shadow-xs"
                      title="Mudar nível de acesso"
                    >
                      <span className="material-symbols-outlined text-[17px] text-secondary">
                        {userRole === 'passenger'
                          ? 'person'
                          : userRole === 'driver'
                          ? 'local_taxi'
                          : userRole === 'inspector'
                          ? 'badge'
                          : 'admin_panel_settings'}
                      </span>
                      <span className="text-primary font-bold">
                        {userRole === 'passenger'
                          ? 'Passageiro'
                          : userRole === 'driver'
                          ? 'Motorista'
                          : userRole === 'inspector'
                          ? 'Fiscal'
                          : 'Admin'}
                      </span>
                      <span className="material-symbols-outlined text-[14px] text-outline">
                        arrow_drop_down
                      </span>
                    </button>
                    <button
                      onClick={requestPushNotifications}
                      className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:text-primary active:bg-surface-container cursor-pointer relative"
                      title="Ativar Notificações Push & Alertas em Tempo Real"
                    >
                      <span className="material-symbols-outlined text-[20px]">notifications_active</span>
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                    </button>
                    <div
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shrink-0 ${
                        isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800 animate-pulse'
                      }`}
                      title={isOnline ? 'Rede Online (Sincronização Ativa)' : 'Modo Offline (PWA Local Ativo)'}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                      <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
                    </div>
                    <button
                      aria-label="Notificações"
                      onClick={() =>
                        showModal(
                          'Central de Notificações',
                          userRole === 'passenger'
                            ? `Passageiro conectado à Praça ${currentOriginPraca.name}. Tarifa oficial: 500 Kz. Destinos disponíveis: ${currentOriginPraca.destinations.join(', ')}.`
                            : `Viatura ${vehiclePlate} sincronizada com ${currentOriginPraca.name}. Posição atual na fila: #${queuePosition}.`,
                          'notifications_active'
                        )
                      }
                      className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:text-primary active:bg-surface-container cursor-pointer relative"
                    >
                      <span className="material-symbols-outlined text-[20px]">notifications</span>
                      {queueState === 'turn' && (
                        <span className="w-2.5 h-2.5 rounded-full bg-error absolute top-2 right-2 animate-ping" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        if (userRole === 'passenger') {
                          // In passenger mode, open profile or role modal
                          setRoleModalOpen(true);
                        } else {
                          setActiveTab('perfil');
                        }
                      }}
                      className="rounded-full overflow-hidden focus:outline-none cursor-pointer"
                      title={currentUser?.nome || 'Perfil'}
                    >
                      <img
                        alt="Profile"
                        className="w-8 h-8 rounded-full object-cover"
                        src={driverPassportPhoto || PROFILE_AVATAR_URL}
                        referrerPolicy="no-referrer"
                      />
                    </button>
                    <button
                      aria-label="Terminar Sessão"
                      onClick={handleLogout}
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 active:scale-95 transition-all cursor-pointer shadow-2xs"
                      title="Terminar Sessão / Voltar ao Login"
                    >
                      <span className="material-symbols-outlined text-[19px]">logout</span>
                    </button>
                  </div>
                </div>
                <div className="px-gutter pb-space-sm flex items-center justify-between">
                  <h1 className="font-headline-sm text-headline-sm text-primary">
                    {getHeaderTitle()}
                  </h1>
                  <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-secondary">
                      local_taxi
                    </span>
                    Luanda Central
                  </span>
                </div>
              </header>

            <main
              className={`flex flex-col relative w-full flex-1 bg-surface ${
                userRole === 'passenger'
                  ? 'pt-24 pb-24'
                  : 'pt-28 pb-24'
              }`}
            >
              {userRole === 'passenger' ? (
                /* ========================================================= */
                /* NÍVEL 1: PASSAGEIRO (QUEM SOLICITA O TRANSPORTE)         */
                /* ========================================================= */
                <PassengerArea
                  userLocation={userLocation}
                  currentOriginPraca={currentOriginPraca}
                  setCurrentOriginPraca={setCurrentOriginPraca}
                  currentDestName={currentDestName}
                  setCurrentDestName={setCurrentDestName}
                  onTriggerNotice={showModal}
                  triggerVibrate={triggerVibrate}
                  onOpenSos={() => setSosModalOpen(true)}
                  onOpenFilaPass={(praca) => {
                    if (praca) setSelectedFilaPassPraca(praca);
                    setFilaPassModalOpen(true);
                  }}
                  onSwitchToDriver={() => setUserRole('driver')}
                  currentTab={activeTab}
                  onTabChange={(tab) => {
                    if (tab === 'solicitar') setActiveTab('inicio');
                    else setActiveTab(tab as MainTab);
                  }}
                />
              ) : userRole === 'driver' ? (
                /* ========================================================= */
                /* NÍVEL 2: MOTORISTA (QUEM DISPONIBILIZA O TRANSPORTE)     */
                /* ========================================================= */
                <DriverArea
                  userLocation={userLocation}
                  currentOriginPraca={currentOriginPraca}
                  setCurrentOriginPraca={setCurrentOriginPraca}
                  currentDestName={currentDestName}
                  setCurrentDestName={setCurrentDestName}
                  onTriggerNotice={showModal}
                  triggerVibrate={triggerVibrate}
                  onOpenSos={() => setSosModalOpen(true)}
                  onOpenFilaPass={(praca) => {
                    if (praca) setSelectedFilaPassPraca(praca);
                    setFilaPassModalOpen(true);
                  }}
                  onSwitchToPassenger={() => setUserRole('passenger')}
                  onSwitchToInspector={() => setUserRole('inspector')}
                  onSwitchToAdmin={() => setUserRole('admin')}
                  driverAccountStatus={joaoStatus}
                  queues={queuesList}
                  setQueues={setQueuesList}
                  trips={tripsList}
                  setTrips={setTripsList}
                  incidents={incidentsList}
                  setIncidents={setIncidentsList}
                  payments={paymentsList}
                  setPayments={setPaymentsList}
                  drivers={driversList}
                  setDrivers={setDriversList}
                  vehicles={vehiclesList}
                  currentTab={activeTab}
                  onTabChange={(tab) => setActiveTab(tab as MainTab)}
                  onLogout={handleLogout}
                />
              ) : userRole === 'inspector' ? (
                /* ========================================================= */
                /* NÍVEL 3: FISCAL DE PRAÇA (ETAPA 4 — O FISCAL ENTRA)        */
                /* ========================================================= */
                <InspectorArea
                  currentOriginPraca={currentOriginPraca}
                  setCurrentOriginPraca={setCurrentOriginPraca}
                  currentDestName={currentDestName}
                  setCurrentDestName={setCurrentDestName}
                  onTriggerNotice={showModal}
                  triggerVibrate={triggerVibrate}
                  onSwitchToPassenger={() => setUserRole('passenger')}
                  onSwitchToDriver={() => setUserRole('driver')}
                  onSwitchToAdmin={() => setUserRole('admin')}
                />
              ) : userRole === 'admin' ? (
                /* ========================================================= */
                /* NÍVEL 4: ÁREA ADMINISTRATIVA TOTALMENTE MÓVEL (LUANDA)   */
                /* ========================================================= */
                <AdminArea
                  passengers={passengersList}
                  setPassengers={setPassengersList}
                  drivers={driversList}
                  setDrivers={setDriversList}
                  vehicles={vehiclesList}
                  setVehicles={setVehiclesList}
                  fiscais={fiscaisList}
                  setFiscais={setFiscaisList}
                  pracas={pracasList}
                  setPracas={setPracasList}
                  routes={routesList}
                  setRoutes={setRoutesList}
                  queues={queuesList}
                  setQueues={setQueuesList}
                  interventions={interventionsList}
                  setInterventions={setInterventionsList}
                  trips={tripsList}
                  setTrips={setTripsList}
                  payments={paymentsList}
                  setPayments={setPaymentsList}
                  incidents={incidentsList}
                  setIncidents={setIncidentsList}
                  onTriggerNotice={showModal}
                  triggerVibrate={triggerVibrate}
                  onSwitchToPassenger={() => setUserRole('passenger')}
                  onSwitchToDriver={() => setUserRole('driver')}
                  onSwitchToInspector={() => setUserRole('inspector')}
                />
              ) : (
                <>
                  {/* TAB 1: INÍCIO (DRIVER HOME & DISPATCH DASHBOARD)          */}
                  {activeTab === 'inicio' && (
                <div className="flex flex-col w-full px-gutter space-y-space-md">
                  {/* Driver Status & Profile Greeting Header */}
                  <div className="bg-surface-container-lowest p-gutter rounded-xl shadow-md flex flex-col gap-space-sm relative overflow-hidden">
                    <div className="flex items-center justify-between gap-space-sm">
                      <div className="flex items-center gap-space-sm min-w-0">
                        <div className="relative flex-shrink-0">
                          <img
                            className="w-12 h-12 rounded-full object-cover shadow-sm"
                            alt="Motorista João Manuel"
                            src={driverPassportPhoto || DRIVER_PORTRAIT_URL}
                            referrerPolicy="no-referrer"
                          />
                          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-surface-container-lowest"></span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h2 className="font-headline-sm text-headline-sm text-primary truncate">
                              Olá, {driverName}
                            </h2>
                            <span className="text-base select-none">👋</span>
                          </div>
                          <p className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px] text-secondary">
                              verified
                            </span>
                            Motorista Credenciado
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 shadow-sm flex-shrink-0">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                        <span className="font-label-sm text-label-sm font-semibold">
                          Disponível
                        </span>
                      </div>
                    </div>

                    {/* Daily Quick Summary Strip */}
                    <div className="bg-surface-container-low rounded-lg p-2.5 flex items-center justify-between gap-2 text-on-surface">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="material-symbols-outlined text-[18px] text-secondary">
                          commute
                        </span>
                        <span className="font-label-md text-label-md font-semibold truncate">
                          {dailyTripsCount} Viagens
                        </span>
                      </div>
                      <div className="h-4 w-px bg-outline-variant/40"></div>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="material-symbols-outlined text-[18px] text-secondary">
                          payments
                        </span>
                        <span className="font-label-md text-label-md font-bold text-primary truncate">
                          {dailyRevenueKz.toLocaleString('pt-AO')} Kz
                        </span>
                      </div>
                      <div className="h-4 w-px bg-outline-variant/40"></div>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <img
                          src={vehiclePhoto}
                          alt="Fotografia do Automóvel"
                          referrerPolicy="no-referrer"
                          className="w-7 h-5 rounded object-cover border border-outline-variant/50 shrink-0"
                        />
                        <span className="font-label-sm text-label-sm uppercase bg-surface-container px-1.5 py-0.5 rounded font-bold tracking-tight text-primary truncate">
                          {vehiclePlate}
                        </span>
                      </div>
                    </div>

                    {/* Fotografia do Automóvel (Carro) registado na Praça */}
                    <div className="bg-surface-container-low rounded-xl p-2 flex items-center justify-between gap-3 border border-surface-container">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-20 h-14 rounded-lg overflow-hidden shadow-sm shrink-0 bg-surface-container relative">
                          <img
                            src={vehiclePhoto}
                            alt={`Automóvel ${vehicleModel}`}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-label-sm text-[10px] text-secondary uppercase tracking-wider font-bold">
                            Fotografia do Automóvel
                          </span>
                          <span className="font-title-lg text-[14px] text-primary font-bold truncate">
                            {vehicleModel}
                          </span>
                          <span className="font-body-sm text-[11px] text-on-surface-variant truncate">
                            Matrícula: <strong className="text-primary">{vehiclePlate}</strong> • 15 Lugares
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hero Card: MINHA FILA (Real-time Queue Focus) */}
                  <div className="bg-surface-container-lowest rounded-xl p-gutter shadow-xl relative overflow-hidden flex flex-col gap-space-md">
                    <div className="flex items-start justify-between gap-space-sm">
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
                          <span className="material-symbols-outlined text-[15px] text-secondary">
                            pin_drop
                          </span>
                          <span className="truncate">
                            {currentOriginPraca.name} ({currentOriginPraca.subtitle.split('•')[0].trim()})
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-1 rounded-md bg-primary-container text-on-primary font-label-md text-label-md font-bold flex items-center gap-1">
                            {currentOriginPraca.name
                              .replace('Praça do ', '')
                              .replace('Praça da ', '')
                              .replace('Praça de ', '')}
                            <span className="material-symbols-outlined text-[14px]">
                              arrow_forward
                            </span>
                            {currentDestName}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-fixed font-label-sm text-label-sm uppercase font-bold">
                            Candongueiro
                          </span>
                        </div>
                      </div>
                      <button
                        aria-label="Atualizar estado da fila"
                        onClick={handleAdvanceQueueSimulation}
                        title="Simular avanço na fila"
                        className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-primary active:rotate-180 transition-transform cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[20px]">sync</span>
                      </button>
                    </div>

                    {/* Sequence Hero Banner: Taxi Yellow Highlight */}
                    <div className="bg-gradient-to-r from-secondary-container via-secondary-fixed-dim to-secondary-container p-4 rounded-xl shadow-inner flex items-center justify-between text-on-secondary-fixed">
                      <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm uppercase tracking-wider font-extrabold text-on-secondary-fixed-variant">
                          Sua Posição Oficial
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="font-queue-number text-queue-number font-display-lg leading-none tracking-tight text-on-secondary-fixed drop-shadow-sm">
                            {inQueue ? `#${queuePosition < 10 ? `0${queuePosition}` : queuePosition}` : 'Fora'}
                          </span>
                          <span className="font-label-sm text-label-sm font-semibold opacity-90">
                            {inQueue ? 'na vez' : 'da fila'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end text-right">
                        <div className="flex items-center gap-1 bg-surface-container-lowest/80 px-2.5 py-1 rounded-full shadow-sm">
                          <span className="material-symbols-outlined text-[16px] text-secondary">
                            schedule
                          </span>
                          <span className="font-title-lg text-title-lg font-bold text-primary">
                            ~{inQueue ? Math.max(2, Math.round(queuePosition * 1.5)) : 0} min
                          </span>
                        </div>
                        <span className="font-label-sm text-label-sm mt-1 font-semibold text-on-secondary-fixed-variant">
                          {inQueue ? `${Math.max(0, queuePosition - 1)} carrinhas à frente` : 'Sem fila ativa'}
                        </span>
                      </div>
                    </div>

                    {/* Visual Linear Queue Progress Rail */}
                    <div className="flex flex-col gap-1.5 bg-surface-container-low p-3 rounded-lg">
                      <div className="flex justify-between items-center text-on-surface-variant font-label-sm text-label-sm">
                        <span className="flex items-center gap-1 font-semibold text-primary">
                          <span className="material-symbols-outlined text-[15px] text-secondary">
                            airport_shuttle
                          </span>{' '}
                          Embarque (#01)
                        </span>
                        <span className="font-bold text-secondary flex items-center gap-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>{' '}
                          Você (#{queuePosition})
                        </span>
                        <span>Fim (#32)</span>
                      </div>
                      <div className="relative w-full h-3 bg-surface-container rounded-full overflow-hidden flex items-center">
                        <div
                          className="absolute left-0 top-0 bottom-0 bg-primary-container rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, Math.max(8, Math.round(((32 - queuePosition) / 32) * 100)))}%`,
                          }}
                        ></div>
                        <div
                          className="absolute -translate-x-1/2 w-4 h-4 rounded-full bg-secondary-container shadow-md border border-surface-container-lowest flex items-center justify-center transition-all duration-300"
                          style={{
                            left: `${Math.min(96, Math.max(8, Math.round(((32 - queuePosition) / 32) * 100)))}%`,
                          }}
                        >
                          <div className="w-1.5 h-1.5 bg-on-secondary-fixed rounded-full"></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-0.5">
                        <span>Partida média: a cada 1.5 min</span>
                        <span className="text-emerald-700 font-semibold">Fluxo Normal</span>
                      </div>
                    </div>

                    {/* Tactile CTA Cluster */}
                    <div className="flex flex-col gap-space-sm pt-1">
                      <button
                        onClick={() => {
                          triggerVibrate();
                          setActiveTab('minha-fila');
                        }}
                        className="h-14 w-full rounded-lg bg-primary text-on-primary font-title-lg text-title-lg flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-transform cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[22px] text-secondary-container">
                          radar
                        </span>
                        VER MINHA POSIÇÃO COMPLETA
                      </button>
                      <button
                        onClick={() => {
                          triggerVibrate();
                          setRouteSelectorModalOpen(true);
                        }}
                        className="h-11 w-full rounded-lg bg-surface-container text-primary font-label-lg text-label-lg flex items-center justify-center gap-1.5 active:bg-surface-container-high transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                          swap_calls
                        </span>
                        Trocar de Rota / Praça
                      </button>
                    </div>

                    {/* Sync and Network Telemetry */}
                    <div className="flex items-center justify-center gap-2 pt-1 text-on-surface-variant font-label-sm text-label-sm border-t border-surface-container">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span className="truncate">
                        Conectado à rede Unitel • Sincronizado em tempo real
                      </span>
                    </div>
                  </div>

                  {/* Hub de Inovação FilaTáxi: FilaPass e SOS */}
                  <div className="grid grid-cols-2 gap-2">

                    <button
                      onClick={() => {
                        triggerVibrate();
                        setSelectedFilaPassPraca(currentOriginPraca);
                        setFilaPassModalOpen(true);
                      }}
                      className="bg-surface-container-lowest p-3 rounded-xl shadow-sm flex flex-col items-center justify-between text-center gap-1.5 hover:bg-surface-container-low transition-all cursor-pointer group active:scale-95"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                        <span className="material-symbols-outlined text-[22px] text-secondary-container">
                          confirmation_number
                        </span>
                      </div>
                      <div>
                        <span className="font-label-md text-label-md text-primary font-bold block leading-tight">
                          FilaPass
                        </span>
                        <span className="font-label-sm text-[10px] text-on-surface-variant font-semibold">
                          Reservar Lugar
                        </span>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        triggerVibrate();
                        setSosModalOpen(true);
                      }}
                      className="bg-surface-container-lowest p-3 rounded-xl shadow-sm flex flex-col items-center justify-between text-center gap-1.5 hover:bg-error-container/20 transition-all cursor-pointer group active:scale-95"
                    >
                      <div className="w-10 h-10 rounded-xl bg-error-container text-on-error-container flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                        <span className="material-symbols-outlined text-[22px]">shield</span>
                      </div>
                      <div>
                        <span className="font-label-md text-label-md text-error font-bold block leading-tight">
                          SOS & Trajeto
                        </span>
                        <span className="font-label-sm text-[10px] text-error font-semibold">
                          Segurança
                        </span>
                      </div>
                    </button>
                  </div>

                  {/* Real-time Live Rank Status Selector (Luanda Mobility Hubs) */}
                  <div className="flex flex-col gap-space-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[20px] text-primary">
                          hub
                        </span>
                        <h3 className="font-title-lg text-title-lg text-primary">
                          Praças em Tempo Real
                        </h3>
                      </div>
                      <button
                        onClick={() => {
                          setActiveTab('historico');
                          setHistoricoView('passenger');
                        }}
                        className="font-label-sm text-label-sm text-secondary font-bold cursor-pointer hover:underline"
                      >
                        Ver Todas ({LUANDA_PRACAS.length})
                      </button>
                    </div>

                    {/* Horizontal Fast Swipe Chip Corridor */}
                    <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none -mx-gutter px-gutter">
                      {LUANDA_PRACAS.map((praca) => {
                        const isCurrent = praca.id === currentOriginPraca.id;
                        const isFast = praca.status === 'Operacional';
                        return (
                          <button
                            key={praca.id}
                            onClick={() => {
                              triggerVibrate();
                              setCurrentOriginPraca(praca);
                              setCurrentDestName(praca.destinations[0]);
                            }}
                            className={`min-w-[150px] bg-surface-container-lowest p-3 rounded-xl shadow-sm flex flex-col justify-between gap-2 flex-shrink-0 text-left transition-all cursor-pointer ${
                              isCurrent ? 'border-b-2 border-secondary-container ring-1 ring-secondary-container/40' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="font-label-lg text-label-lg font-bold text-primary">
                                {praca.name
                                  .replace('Praça do ', '')
                                  .replace('Praça da ', '')
                                  .replace('Praça de ', '')}
                              </span>
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  isFast ? 'bg-emerald-500' : 'bg-amber-500'
                                }`}
                              ></span>
                            </div>
                            <div className="flex items-baseline justify-between w-full">
                              <span className="font-body-sm text-body-sm text-on-surface-variant">
                                Espera
                              </span>
                              <span
                                className={`font-label-md text-label-md font-bold ${
                                  isFast ? 'text-emerald-800' : 'text-amber-800'
                                }`}
                              >
                                ~{praca.minEspera} min
                              </span>
                            </div>
                            <span
                              className={`px-1.5 py-0.5 rounded font-label-sm text-[10px] text-center font-bold w-full ${
                                isFast
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : 'bg-amber-100 text-amber-900'
                              }`}
                            >
                              {isFast ? 'Fila Rápida' : 'Movimento Alto'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Operational Visual: Dispatch Radar Snapshot with Real Google Map */}
                  <div className="bg-surface-container-lowest p-gutter rounded-xl shadow-md flex flex-col gap-space-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px] text-secondary">
                          explore
                        </span>
                        <span className="font-title-lg text-title-lg text-primary">
                          Terminal de Despacho (GPS Real)
                        </span>
                      </div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        Raio 3.5 km
                      </span>
                    </div>

                    <div className="w-full h-44 rounded-lg relative overflow-hidden shadow-inner">
                      <LiveMapView
                        center={{ lat: currentOriginPraca.lat, lng: currentOriginPraca.lng }}
                        zoom={13}
                        userLocation={userLocation}
                        selectedPraca={currentOriginPraca}
                        onSelectPraca={(p) => {
                          setCurrentOriginPraca(p);
                          setCurrentDestName(p.destinations[0]);
                        }}
                        heightClass="h-44"
                      />
                      <div className="absolute bottom-2 left-2 right-2 bg-surface-container-lowest/90 backdrop-blur-md px-2.5 py-1.5 rounded-md flex items-center justify-between z-10 text-primary pointer-events-none">
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="material-symbols-outlined text-[16px] text-secondary">
                            traffic
                          </span>
                          <span className="font-label-sm text-label-sm font-semibold truncate">
                            {currentOriginPraca.corridor}: Trânsito Fluido
                          </span>
                        </div>
                        <span className="font-label-sm text-label-sm font-bold text-emerald-700">
                          92% fluidez
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Floating Fixed Thumb Friendly Bottom Command Button */}
                  <div className="pt-2 pb-1">
                    <button
                      onClick={() => {
                        triggerVibrate();
                        setRouteSelectorModalOpen(true);
                      }}
                      className="w-full h-14 rounded-xl bg-secondary-container text-on-secondary-fixed font-title-lg text-title-lg font-bold flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-transform cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[24px]">add_circle</span>
                      ENTRAR NUMA NOVA FILA
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 2: MINHA FILA (REAL-TIME QUEUE & "É A SUA VEZ!")       */}
              {/* ========================================================= */}
              {activeTab === 'minha-fila' && (
                <div className="flex flex-col w-full px-gutter space-y-space-md">
                  {/* Interactive Demo Switcher (Simulates Transition from Waiting Queue to "It's Your Turn!") */}
                  <div className="flex items-center justify-between p-space-sm bg-surface-container-low rounded-xl shadow-sm">
                    <div className="flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-secondary text-[20px]">
                        sensors
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                        Simulação Operacional:
                      </span>
                    </div>
                    <div className="flex gap-1.5 p-0.5 bg-surface-container rounded-lg">
                      <button
                        onClick={() => setQueueState('waiting')}
                        className={`px-3 py-1 rounded-md text-label-sm font-label-sm transition-all cursor-pointer ${
                          queueState === 'waiting'
                            ? 'bg-primary text-on-primary shadow-sm'
                            : 'text-on-surface-variant hover:text-primary'
                        }`}
                      >
                        Fila (#{queuePosition})
                      </button>
                      <button
                        onClick={() => setQueueState('turn')}
                        className={`px-3 py-1 rounded-md text-label-sm font-label-sm transition-all cursor-pointer ${
                          queueState === 'turn'
                            ? 'bg-secondary-container text-on-secondary-fixed shadow-sm font-bold'
                            : 'text-on-surface-variant hover:text-primary'
                        }`}
                      >
                        Sua Vez! 🔔
                      </button>
                    </div>
                  </div>

                  {/* Route Banner Header */}
                  <div className="p-space-md bg-surface-container-lowest rounded-xl shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-secondary-container text-on-secondary-fixed flex items-center justify-center font-display-lg text-[22px] shadow-sm">
                        🚕
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider">
                          Rota Expressa Candongueiro
                        </span>
                        <h2 className="font-headline-sm text-headline-sm text-primary flex items-center gap-1.5">
                          <span>
                            {currentOriginPraca.name
                              .replace('Praça do ', '')
                              .replace('Praça da ', '')
                              .replace('Praça de ', '')}
                          </span>
                          <span className="material-symbols-outlined text-[16px] text-outline">
                            arrow_forward
                          </span>
                          <span>{currentDestName}</span>
                        </h2>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-label-sm font-label-sm font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>{' '}
                        Em Fluxo
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                        {currentOriginPraca.subtitle.split('•')[0]}
                      </span>
                    </div>
                  </div>

                  {/* Live Mini Map Preview Anchor (Real Google Map) */}
                  <div className="relative w-full h-36 rounded-xl overflow-hidden shadow-sm">
                    <LiveMapView
                      center={{ lat: currentOriginPraca.lat, lng: currentOriginPraca.lng }}
                      zoom={15}
                      userLocation={userLocation}
                      selectedPraca={currentOriginPraca}
                      heightClass="h-36"
                    />
                    <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md bg-primary text-on-primary text-label-sm font-label-sm flex items-center gap-1.5 shadow-md z-10 pointer-events-none">
                      <span className="material-symbols-outlined text-[14px] text-secondary-fixed">
                        pin_drop
                      </span>
                      <span>{currentOriginPraca.name}</span>
                    </div>
                    <div className="absolute bottom-2 inset-x-2.5 bg-primary/85 backdrop-blur-sm px-2.5 py-1 rounded-md flex items-center justify-between text-on-primary font-label-sm text-label-sm z-10 pointer-events-none">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px] text-secondary-fixed">
                          speed
                        </span>
                        <span>
                          Velocidade de Despacho: <strong>~1.4 min/táxi</strong>
                        </span>
                      </span>
                      <span className="bg-surface-container-lowest/20 px-2 py-0.5 rounded">
                        GPS Ativo
                      </span>
                    </div>
                  </div>

                  {queueState === 'waiting' ? (
                    /* VIEW 1: WAITING IN QUEUE STATE */
                    <div className="flex flex-col space-y-space-md">
                      <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-space-md">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                              A sua posição atual
                            </span>
                            <div className="flex items-baseline gap-2 mt-1">
                              <span className="font-queue-number text-queue-number text-primary tracking-tight">
                                #{queuePosition < 10 ? `0${queuePosition}` : queuePosition}
                              </span>
                              <span className="font-title-lg text-title-lg text-secondary">
                                na fila
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end text-right">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-primary font-label-md text-label-md">
                              <span className="material-symbols-outlined text-[16px] text-secondary">
                                hourglass_top
                              </span>
                              <span className="font-bold">
                                {Math.max(2, Math.round(queuePosition * 1.5))} minutos
                              </span>
                            </div>
                            <span className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                              Tempo estimado
                            </span>
                          </div>
                        </div>

                        <div className="p-space-sm bg-surface-container-low rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center">
                              <span className="material-symbols-outlined text-[18px]">group</span>
                            </div>
                            <div>
                              <p className="font-title-lg text-title-lg text-primary leading-tight">
                                {Math.max(0, queuePosition - 1)} táxis à sua frente
                              </p>
                              <p className="font-body-sm text-body-sm text-on-surface-variant">
                                Capacidade da praça: 100% ativa
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={handleAdvanceQueueSimulation}
                            className="font-label-sm text-label-sm font-bold px-2.5 py-1 rounded bg-secondary-fixed text-on-secondary-fixed cursor-pointer active:scale-95"
                          >
                            Avançar Fila
                          </button>
                        </div>

                        <div className="w-full bg-surface-container rounded-full h-3 overflow-hidden p-0.5">
                          <div
                            className="bg-secondary-container h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, Math.max(15, Math.round(((25 - queuePosition) / 25) * 100)))}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Live Vertical Queue Stream */}
                      <div className="flex flex-col space-y-space-sm">
                        <div className="flex items-center justify-between px-1">
                          <h3 className="font-title-lg text-title-lg text-primary flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[18px] text-secondary">
                              format_list_bulleted
                            </span>
                            <span>Ordem de Despacho ao Vivo</span>
                          </h3>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">
                            Atualizado em direto
                          </span>
                        </div>

                        {/* Position #01 */}
                        <div className="p-space-md rounded-xl bg-emerald-50 text-emerald-950 shadow-sm flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-emerald-600 text-white font-headline-sm text-headline-sm font-bold">
                              #01
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-title-lg text-title-lg text-emerald-950 font-bold">
                                  Táxi #001
                                </span>
                                <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 font-label-sm text-label-sm font-bold">
                                  A EMBARCAR
                                </span>
                              </div>
                              <span className="font-body-sm text-body-sm text-emerald-800 font-semibold mt-0.5">
                                Matrícula: LD-12-88-BA • Baia 01
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="font-label-md text-label-md text-emerald-900 font-bold">
                              14/15 Lugares
                            </span>
                            <span className="font-body-sm text-body-sm text-emerald-700">
                              A fechar
                            </span>
                          </div>
                        </div>

                        {/* Position #02 */}
                        <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-center justify-center w-11 h-11 rounded-lg bg-surface-container-high text-primary font-headline-sm text-headline-sm font-bold">
                              #02
                            </div>
                            <div className="flex flex-col">
                              <span className="font-title-lg text-title-lg text-primary">
                                Táxi #014
                              </span>
                              <span className="font-body-sm text-body-sm text-on-surface-variant">
                                Matrícula: LD-77-34-AZ • Pronto a encostar
                              </span>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded bg-surface-container text-primary font-label-sm text-label-sm font-bold">
                            2 min
                          </span>
                        </div>

                        {/* Position #03 */}
                        <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-center justify-center w-11 h-11 rounded-lg bg-surface-container-high text-primary font-headline-sm text-headline-sm font-bold">
                              #03
                            </div>
                            <div className="flex flex-col">
                              <span className="font-title-lg text-title-lg text-primary">
                                Táxi #025
                              </span>
                              <span className="font-body-sm text-body-sm text-on-surface-variant">
                                Matrícula: LD-31-09-CX • Aguarda Baia
                              </span>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded bg-surface-container text-primary font-label-sm text-label-sm font-bold">
                            4 min
                          </span>
                        </div>

                        {queuePosition > 4 && (
                          <div className="flex items-center justify-center py-1">
                            <div className="flex gap-1.5 items-center px-4 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-bold">
                              <span className="material-symbols-outlined text-[16px]">
                                more_vert
                              </span>
                              <span>
                                {queuePosition - 4} táxis em aproximação contínua
                              </span>
                              <span className="material-symbols-outlined text-[16px]">
                                more_vert
                              </span>
                            </div>
                          </div>
                        )}

                        {/* YOU (Highlighted Card) */}
                        <div className="p-space-md rounded-xl bg-secondary-container text-on-secondary-fixed shadow-md flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-primary text-on-primary font-queue-number text-[22px] font-bold">
                              #{queuePosition < 10 ? `0${queuePosition}` : queuePosition}
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-title-lg text-title-lg text-on-secondary-fixed font-extrabold">
                                  VOCÊ ({driverName})
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-primary text-on-primary text-label-sm font-label-sm font-black tracking-wide">
                                  VOCÊ
                                </span>
                              </div>
                              <span className="font-body-sm text-body-sm text-on-secondary-fixed font-bold mt-0.5">
                                Matrícula: {vehiclePlate} • {vehicleModel}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="font-headline-sm text-headline-sm font-black text-on-secondary-fixed">
                              {Math.max(2, Math.round(queuePosition * 1.5))} min
                            </span>
                            <span className="font-label-sm text-label-sm text-on-secondary-fixed uppercase font-semibold">
                              Tolerância OK
                            </span>
                          </div>
                        </div>

                        {/* Behind You */}
                        <div className="p-space-md rounded-xl bg-surface-container-lowest opacity-75 shadow-sm flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-surface-container text-primary font-headline-sm text-[16px] font-bold">
                              #{queuePosition + 1}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-title-lg text-title-lg text-primary">
                                Táxi #092
                              </span>
                              <span className="font-body-sm text-body-sm text-on-surface-variant">
                                Matrícula: LD-82-11-AA • Na fila
                              </span>
                            </div>
                          </div>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">
                            Atrás de si
                          </span>
                        </div>
                      </div>

                      {/* Exit Queue Discreet Action */}
                      <div className="pt-space-sm flex flex-col items-center gap-2">
                        <button
                          onClick={() => {
                            triggerVibrate();
                            setInQueue(false);
                            showModal(
                              'Fila Suspensa Temporariamente',
                              `Saiu da fila para a rota ${currentOriginPraca.name} → ${currentDestName}. Pode retomar a posição quando estiver pronto na praça.`,
                              'pause_circle'
                            );
                          }}
                          className="h-11 px-4 rounded-lg bg-error-container text-on-error-container hover:bg-error/20 active:scale-98 transition-all flex items-center justify-center gap-2 font-label-md text-label-md cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">logout</span>
                          <span>Sair da fila temporariamente</span>
                        </button>
                        <span className="font-body-sm text-body-sm text-on-surface-variant text-center">
                          Pode suspender sem perder a prioridade se justificado junto do fiscal.
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* VIEW 2: HIGH-ALERT "É A SUA VEZ!" CALL BANNER */
                    <div className="flex flex-col space-y-space-md">
                      <div className="p-space-lg rounded-xl bg-primary text-on-primary shadow-xl flex flex-col items-center text-center relative overflow-hidden">
                        <div className="w-full flex items-center justify-between pb-space-sm">
                          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-fixed font-label-sm text-label-sm font-black">
                            <span className="material-symbols-outlined text-[16px]">
                              notifications_active
                            </span>
                            CHAMADA DE DESPACHO
                          </span>
                          <span className="font-label-sm text-label-sm text-primary-fixed-dim uppercase tracking-wider">
                            Fiscal: Mateus Zua
                          </span>
                        </div>

                        <div className="my-space-sm w-20 h-20 rounded-full bg-secondary-container text-on-secondary-fixed flex items-center justify-center shadow-lg animate-bounce">
                          <span className="material-symbols-outlined text-[44px]">local_taxi</span>
                        </div>
                        <h2 className="font-display-lg-mobile text-display-lg-mobile text-on-primary tracking-tight font-extrabold mt-1">
                          🔔 É A SUA VEZ!
                        </h2>
                        <p className="font-title-lg text-title-lg text-secondary-fixed mt-1 font-bold">
                          Dirija-se à zona de embarque agora!
                        </p>

                        <div className="w-full mt-space-md p-space-md rounded-xl bg-surface-container-lowest text-on-surface grid grid-cols-3 gap-2 text-left shadow-sm">
                          <div className="flex flex-col">
                            <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
                              Praça Origem
                            </span>
                            <span className="font-title-lg text-title-lg text-primary font-bold truncate">
                              {currentOriginPraca.name
                                .replace('Praça do ', '')
                                .replace('Praça da ', '')
                                .replace('Praça de ', '')}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
                              Destino Final
                            </span>
                            <span className="font-title-lg text-title-lg text-primary font-bold truncate">
                              {currentDestName}
                            </span>
                          </div>
                          <div className="flex flex-col bg-secondary-container/20 p-1.5 rounded-lg">
                            <span className="font-label-sm text-label-sm text-secondary font-black">
                              Baia Indicada
                            </span>
                            <span className="font-display-lg-mobile text-[22px] text-secondary font-extrabold">
                              BAIA 03
                            </span>
                          </div>
                        </div>

                        <div className="w-full mt-space-md p-space-sm rounded-lg bg-surface-container-high/20 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-secondary-fixed text-[20px] animate-spin">
                              timer
                            </span>
                            <span className="font-label-md text-label-md text-on-primary">
                              Tempo de tolerância para encostar:
                            </span>
                          </div>
                          <span className="font-title-lg text-title-lg text-secondary-container font-black">
                            {formattedTolerance}
                          </span>
                        </div>

                        <div className="w-full mt-space-sm flex items-center justify-between font-body-sm text-body-sm text-primary-fixed-dim">
                          <span>
                            Passageiros alinhados: <strong>15 pessoas aguardando</strong>
                          </span>
                          <span>
                            Tarifa oficial: <strong>500 Kz</strong>
                          </span>
                        </div>
                      </div>

                      {/* Giant Primary Action Dispatch Button */}
                      <div className="flex flex-col gap-space-xs">
                        <button
                          onClick={handleStartTrip}
                          className="w-full h-16 rounded-xl bg-secondary-container hover:bg-secondary-fixed text-on-secondary-fixed font-headline-md text-headline-md tracking-wide flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[28px] font-bold">
                            play_arrow
                          </span>
                          <span>INICIAR VIAGEM</span>
                        </button>
                        <div className="flex items-center justify-center gap-1.5 text-on-surface-variant font-label-sm text-label-sm pt-1">
                          <span className="material-symbols-outlined text-[16px] text-emerald-600">
                            verified
                          </span>
                          <span>
                            Confirmação imediata para o painel da paragem e passageiros
                          </span>
                        </div>
                      </div>

                      {/* Rapid Driver Quick Tools */}
                      <div className="grid grid-cols-2 gap-space-sm pt-space-xs">
                        <button
                          onClick={() =>
                            showModal(
                              'Contacto Fiscal de Praça',
                              'A ligar para o Fiscal Mateus Zua (+244 923 410 882) - Terminal do Kilamba Baia 03.',
                              'call'
                            )
                          }
                          className="h-12 px-3 rounded-lg bg-surface-container-lowest shadow-sm flex items-center justify-center gap-2 text-primary font-label-md text-label-md active:bg-surface-container cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-secondary text-[20px]">
                            call
                          </span>
                          <span>Contactar Fiscal</span>
                        </button>
                        <button
                          onClick={() => setIncidentModalOpen(true)}
                          className="h-12 px-3 rounded-lg bg-surface-container-lowest shadow-sm flex items-center justify-center gap-2 text-primary font-label-md text-label-md active:bg-surface-container cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-secondary text-[20px]">
                            report_problem
                          </span>
                          <span>Reportar Avaria</span>
                        </button>
                      </div>

                      {/* Botões Rápidos SOS em Modo Embarque */}
                      <div>
                        <button
                          onClick={() => {
                            triggerVibrate();
                            setSosModalOpen(true);
                          }}
                          className="w-full h-12 px-3 rounded-lg bg-error-container text-on-error-container shadow-sm flex items-center justify-center gap-2 font-label-md text-label-md active:scale-98 transition-transform cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            emergency_share
                          </span>
                          <span>Central SOS / Pânico</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Operational Info Note Card */}
                  <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-secondary shrink-0">
                      <span className="material-symbols-outlined text-[20px]">info</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-title-lg text-title-lg text-primary">
                        Regulamento da Paragem
                      </span>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 leading-relaxed">
                        Mantenha o veículo pronto e motor ligado ao atingir o Top 3. O não
                        comparecimento na baia no prazo de 3 minutos transfere a vez para o veículo
                        seguinte.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 3: HISTÓRICO (PASSENGERS RADAR & DRIVER ANALYTICS)    */}
              {/* ========================================================= */}
              {activeTab === 'historico' && (
                <div className="flex flex-col w-full px-gutter space-y-space-md">
                  <section className="bg-surface-container-low p-1.5 rounded-xl shadow-sm flex items-center justify-between gap-1">
                    <button
                      onClick={() => setHistoricoView('passenger')}
                      className={`flex-1 py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
                        historicoView === 'passenger'
                          ? 'bg-primary text-on-primary'
                          : 'bg-transparent text-on-surface-variant hover:text-primary'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">commute</span>
                      <span className="font-label-lg text-label-lg">Passageiros</span>
                    </button>
                    <button
                      onClick={() => setHistoricoView('driver')}
                      className={`flex-1 py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
                        historicoView === 'driver'
                          ? 'bg-primary text-on-primary'
                          : 'bg-transparent text-on-surface-variant hover:text-primary'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">badge</span>
                      <span className="font-label-lg text-label-lg">Área do Motorista</span>
                    </button>
                  </section>

                  {historicoView === 'passenger' ? (
                    <div className="flex flex-col space-y-space-md">
                      {/* Search Box for Passengers */}
                      <section className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm space-y-space-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-headline-sm text-headline-sm text-primary flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-secondary text-[22px]">
                              travel_explore
                            </span>
                            Encontrar uma Praça
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
                            Acesso Público
                          </span>
                        </div>
                        <div className="space-y-2 pt-1">
                          <div className="relative flex items-center">
                            <span className="material-symbols-outlined absolute left-3 text-secondary text-[20px]">
                              trip_origin
                            </span>
                            <input
                              className="w-full h-12 pl-10 pr-8 rounded-lg bg-surface-container-low text-primary font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none transition-all placeholder:text-outline"
                              placeholder="De onde? (Ex: Kilamba, Viana)"
                              type="text"
                              value={searchOrigin}
                              onChange={(e) => setSearchOrigin(e.target.value)}
                            />
                            {searchOrigin && (
                              <button
                                onClick={() => setSearchOrigin('')}
                                className="absolute right-2.5 text-outline hover:text-primary cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[18px]">close</span>
                              </button>
                            )}
                          </div>
                          <div className="relative flex items-center">
                            <span className="material-symbols-outlined absolute left-3 text-secondary text-[20px]">
                              location_on
                            </span>
                            <input
                              className="w-full h-12 pl-10 pr-8 rounded-lg bg-surface-container-low text-primary font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none transition-all placeholder:text-outline"
                              placeholder="Para onde? (Ex: Mutamba, Viana)"
                              type="text"
                              value={searchDestination}
                              onChange={(e) => setSearchDestination(e.target.value)}
                            />
                            {searchDestination && (
                              <button
                                onClick={() => setSearchDestination('')}
                                className="absolute right-2.5 text-outline hover:text-primary cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[18px]">close</span>
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1 text-nowrap">
                          <span className="font-label-sm text-label-sm text-on-surface-variant">
                            Destinos frequentes:
                          </span>
                          {['Mutamba', 'Viana', 'Benfica', 'São Paulo', 'Todos'].map((dest) => (
                            <button
                              key={dest}
                              onClick={() => {
                                if (dest === 'Todos') {
                                  setSearchOrigin('');
                                  setSearchDestination('');
                                } else {
                                  setSearchDestination(dest);
                                }
                              }}
                              className={`px-2.5 py-1 rounded-full font-label-sm text-label-sm cursor-pointer transition-colors ${
                                searchDestination === dest
                                  ? 'bg-secondary-container text-on-secondary-fixed font-bold'
                                  : 'bg-surface-container text-primary active:bg-secondary-container'
                              }`}
                            >
                              {dest}
                            </button>
                          ))}
                        </div>
                      </section>

                      <div className="flex items-center justify-between px-1">
                        <span className="font-title-lg text-title-lg text-primary">
                          Praças em Tempo Real ({filteredPracas.length})
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Atualizado agora
                        </span>
                      </div>

                      <section className="space-y-space-sm">
                        {filteredPracas.map((praca) => {
                          const isNotified = notifiedPracas.includes(praca.id);
                          const isOperational = praca.status === 'Operacional';
                          return (
                            <div
                              key={praca.id}
                              className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm space-y-space-sm"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="w-10 h-10 rounded-lg bg-secondary-container text-on-secondary-fixed flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[24px]">
                                      local_taxi
                                    </span>
                                  </span>
                                  <div>
                                    <h2 className="font-headline-sm text-headline-sm text-primary">
                                      {praca.name}
                                    </h2>
                                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                                      {praca.subtitle}
                                    </p>
                                  </div>
                                </div>
                                <span
                                  className={`px-2.5 py-1 rounded-full font-label-sm text-label-sm flex items-center gap-1 ${
                                    isOperational
                                      ? 'bg-emerald-50 text-emerald-800'
                                      : 'bg-amber-50 text-amber-900'
                                  }`}
                                >
                                  <span
                                    className={`w-2 h-2 rounded-full ${
                                      isOperational ? 'bg-emerald-500' : 'bg-amber-500'
                                    }`}
                                  ></span>
                                  {praca.status}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 py-2">
                                <div className="bg-surface-container-low p-2 rounded-lg text-center">
                                  <span className="block font-queue-number text-queue-number text-primary">
                                    {praca.naFila < 10 ? `0${praca.naFila}` : praca.naFila}
                                  </span>
                                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                                    Na Fila
                                  </span>
                                </div>
                                <div className="bg-surface-container-low p-2 rounded-lg text-center">
                                  <span className="block font-queue-number text-queue-number text-primary">
                                    {praca.noCais < 10 ? `0${praca.noCais}` : praca.noCais}
                                  </span>
                                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                                    No Cais
                                  </span>
                                </div>
                                <div className="bg-surface-container-low p-2 rounded-lg text-center">
                                  <span className="block font-title-lg text-title-lg text-secondary pt-1">
                                    {praca.minEspera}
                                  </span>
                                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                                    Min Espera
                                  </span>
                                </div>
                              </div>
                              <div className="bg-surface-container-low p-2.5 rounded-lg flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="material-symbols-outlined text-secondary text-[18px]">
                                    airline_seat_recline_normal
                                  </span>
                                  <div>
                                    <span className="text-[11px] font-bold text-primary block">
                                      Próxima Carrinha na Baia 03: 14/15 Lugares
                                    </span>
                                    <span className="text-[10px] text-emerald-700 font-semibold">
                                      Falta apenas 1 lugar para partir!
                                    </span>
                                  </div>
                                </div>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                  Lotação 93%
                                </span>
                              </div>
                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  onClick={() => {
                                    triggerVibrate();
                                    setExpandedMapModal(praca);
                                  }}
                                  className="h-11 px-3 rounded-lg bg-surface-container text-primary font-label-md text-label-md flex items-center justify-center gap-1.5 active:bg-surface-container-high cursor-pointer"
                                  title="Ver no mapa"
                                >
                                  <span className="material-symbols-outlined text-[18px]">map</span>
                                </button>
                                <button
                                  onClick={() => {
                                    triggerVibrate();
                                    setSelectedFilaPassPraca(praca);
                                    setFilaPassModalOpen(true);
                                  }}
                                  className="w-full h-11 px-3 rounded-lg bg-primary text-on-primary font-label-md text-label-md flex items-center justify-center gap-1.5 active:bg-primary-container transition-colors cursor-pointer font-bold shadow-sm"
                                >
                                  <span className="material-symbols-outlined text-[18px] text-secondary-container">
                                    confirmation_number
                                  </span>
                                  FilaPass (Reservar)
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </section>

                      {/* Live Interactive Map Overview Card */}
                      <div className="w-full h-52 rounded-xl overflow-hidden shadow-sm relative">
                        <LiveMapView
                          userLocation={userLocation}
                          heightClass="h-52"
                          onSelectPraca={(p) => setExpandedMapModal(p)}
                        />
                        <div className="absolute bottom-2.5 inset-x-2.5 bg-primary/90 backdrop-blur-md px-3 py-2 rounded-lg text-on-primary flex items-center justify-between z-10">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-secondary text-[20px]">
                              explore
                            </span>
                            <span className="font-label-md text-label-md">
                              Mapa de Terminais & Praças Ativas
                            </span>
                          </div>
                          <button
                            onClick={() => setExpandedMapModal(LUANDA_PRACAS[0])}
                            className="font-label-sm text-label-sm text-secondary-container hover:underline cursor-pointer"
                          >
                            Expandir
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* DRIVER AREA VIEW IN HISTÓRICO */
                    <div className="flex flex-col space-y-space-md">
                      <section className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm space-y-space-md">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <img
                                alt="Perfil do Motorista"
                                className="w-14 h-14 rounded-full object-cover shadow-sm"
                                src={driverPassportPhoto || PROFILE_AVATAR_URL}
                                referrerPolicy="no-referrer"
                              />
                              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 absolute bottom-0 right-0"></span>
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h2 className="font-headline-sm text-headline-sm text-primary">
                                  {driverName}
                                </h2>
                                <span className="material-symbols-outlined text-[18px] text-secondary">
                                  verified
                                </span>
                              </div>
                              <p className="font-body-sm text-body-sm text-on-surface-variant">
                                Motorista Profissional Certificado
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setActiveTab('perfil')}
                            className="w-10 h-10 rounded-full bg-surface-container-low text-on-surface-variant flex items-center justify-center active:bg-surface-container cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[20px]">settings</span>
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div className="bg-surface-container-low p-2.5 rounded-lg flex items-center gap-2.5">
                            <img
                              src={vehiclePhoto}
                              alt="Viatura"
                              referrerPolicy="no-referrer"
                              className="w-12 h-10 rounded-md object-cover shadow-sm shrink-0"
                            />
                            <div className="flex flex-col justify-center min-w-0">
                              <span className="font-label-sm text-label-sm text-on-surface-variant truncate">
                                Matrícula (Viatura)
                              </span>
                              <span className="font-title-lg text-title-lg text-primary tracking-wide truncate">
                                {vehiclePlate}
                              </span>
                            </div>
                          </div>
                          <div className="bg-surface-container-low p-2.5 rounded-lg flex flex-col justify-center">
                            <span className="font-label-sm text-label-sm text-on-surface-variant">
                              N.º Licença MTT
                            </span>
                            <span className="font-title-lg text-title-lg text-primary">
                              {licenseNumber}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant bg-surface-container px-3 py-2 rounded-lg">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px] text-secondary">
                              badge
                            </span>
                            B.I.: {biNumber}
                          </span>
                          <span className="text-emerald-700 font-label-sm flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Válido
                            até 2026
                          </span>
                        </div>
                      </section>

                      {/* CARTEIRA DIGITAL FILAPAY & DIVISÃO AUTOMÁTICA DE RECEITAS */}
                      <section className="bg-gradient-to-br from-surface-container-lowest to-surface-container-low p-space-md rounded-xl shadow-md border border-secondary-container/30 space-y-3">
                        <div className="flex items-center justify-between pb-1 border-b border-surface-container">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-secondary-container text-on-secondary-fixed flex items-center justify-center font-bold shadow-sm">
                              <span className="material-symbols-outlined text-[22px]">payments</span>
                            </div>
                            <div>
                              <h3 className="font-headline-sm text-primary text-sm font-bold">
                                Gestão Financeira & Divisão Automática
                              </h3>
                              <p className="text-[11px] text-on-surface-variant">
                                Arrecadação de Receitas em Tempo Real
                              </p>
                            </div>
                          </div>
                          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                            Ativo na Baia
                          </span>
                        </div>

                        <div className="bg-primary text-on-primary p-3.5 rounded-xl shadow-sm flex items-center justify-between">
                          <div>
                            <span className="text-[11px] text-primary-fixed-dim uppercase tracking-wider block">
                              Saldo Acumulado Hoje
                            </span>
                            <div className="text-2xl font-black text-secondary-container font-mono mt-0.5">
                              {(dailyRevenueKz + 16000).toLocaleString('pt-AO')} Kz
                            </div>
                            <span className="text-[11px] text-primary-fixed-dim">
                              Total de {dailyTripsCount + 2} corridas concluídas hoje
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              triggerVibrate();
                              showModal(
                                'Levantamento de Saldo',
                                `Transferência de ${(dailyRevenueKz + 16000).toLocaleString('pt-AO')} Kz iniciada com sucesso para a conta bancária associada ao telefone (+244 923 442 109).`,
                                'account_balance_wallet'
                              );
                            }}
                            className="px-3 py-2 rounded-lg bg-secondary-container text-on-secondary-fixed text-xs font-bold active:scale-95 transition-transform cursor-pointer shadow"
                          >
                            Levantar Saldo
                          </button>
                        </div>

                        {/* Divisão Automática das Receitas */}
                        <div className="bg-surface-container-lowest p-3 rounded-xl border border-surface-container space-y-2">
                          <div className="flex items-center justify-between text-xs pb-1 border-b border-surface-container">
                            <span className="font-bold text-primary flex items-center gap-1">
                              <span className="material-symbols-outlined text-[15px] text-secondary">
                                pie_chart
                              </span>
                              Repartição Automática das Receitas
                            </span>
                            <span className="text-[10px] text-on-surface-variant">Regra da Associação</span>
                          </div>
                          <div className="space-y-1.5 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-on-surface-variant flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px] text-primary">key</span>
                                Cota do Proprietário (60%)
                              </span>
                              <span className="font-bold text-primary">
                                {Math.round((dailyRevenueKz + 16000) * 0.6).toLocaleString('pt-AO')} Kz
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-on-surface-variant flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px] text-secondary">badge</span>
                                Comissão Motorista & Cobrador (35%)
                              </span>
                              <span className="font-bold text-primary">
                                {Math.round((dailyRevenueKz + 16000) * 0.35).toLocaleString('pt-AO')} Kz
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-on-surface-variant flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px] text-primary">account_balance</span>
                                Taxa Sindical & Fiscal de Praça (5%)
                              </span>
                              <span className="font-bold text-primary">
                                {Math.round((dailyRevenueKz + 16000) * 0.05).toLocaleString('pt-AO')} Kz
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <button
                            onClick={() => {
                              triggerVibrate();
                              setSosModalOpen(true);
                            }}
                            className="w-full py-2.5 px-3 rounded-lg bg-error-container text-on-error-container font-bold text-xs flex items-center justify-center gap-1.5 active:opacity-90 cursor-pointer shadow-sm"
                          >
                            <span className="material-symbols-outlined text-[18px]">shield</span>
                            Central SOS / Pânico
                          </button>
                        </div>
                      </section>

                      <section className="grid grid-cols-3 gap-2">
                        <div className="bg-surface-container-lowest p-space-sm rounded-xl shadow-sm flex flex-col items-center justify-center text-center">
                          <span className="material-symbols-outlined text-secondary text-[22px] mb-1">
                            route
                          </span>
                          <span className="font-queue-number text-queue-number text-primary">
                            {140 + tripHistory.length}
                          </span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant leading-tight">
                            Viagens Totais
                          </span>
                        </div>
                        <div className="bg-surface-container-lowest p-space-sm rounded-xl shadow-sm flex flex-col items-center justify-center text-center">
                          <span className="material-symbols-outlined text-secondary text-[22px] mb-1">
                            hourglass_top
                          </span>
                          <span className="font-queue-number text-queue-number text-primary">
                            48h
                          </span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant leading-tight">
                            Fila este mês
                          </span>
                        </div>
                        <div className="bg-surface-container-lowest p-space-sm rounded-xl shadow-sm flex flex-col items-center justify-center text-center">
                          <span className="material-symbols-outlined text-secondary text-[22px] mb-1">
                            pie_chart
                          </span>
                          <span className="font-title-lg text-title-lg text-primary">68%</span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant leading-tight">
                            Kilamba (Top)
                          </span>
                        </div>
                      </section>

                      {/* Weekly Bar Chart */}
                      <section className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm space-y-space-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-title-lg text-title-lg text-primary">
                            Atividade Semanal de Embarques
                          </span>
                          <span className="font-label-sm text-label-sm text-secondary font-semibold">
                            {16 + tripHistory.length} Corridas
                          </span>
                        </div>
                        <div className="h-28 w-full flex items-end justify-between pt-2 px-2">
                          <div className="flex flex-col items-center gap-1.5 flex-1">
                            <div
                              className="w-5 bg-surface-container rounded-t-sm"
                              style={{ height: '40px' }}
                            ></div>
                            <span className="font-label-sm text-label-sm text-on-surface-variant">
                              Seg
                            </span>
                          </div>
                          <div className="flex flex-col items-center gap-1.5 flex-1">
                            <div
                              className="w-5 bg-secondary-container rounded-t-sm"
                              style={{ height: '75px' }}
                            ></div>
                            <span className="font-label-sm text-label-sm text-primary font-bold">
                              Ter
                            </span>
                          </div>
                          <div className="flex flex-col items-center gap-1.5 flex-1">
                            <div
                              className="w-5 bg-surface-container rounded-t-sm"
                              style={{ height: '55px' }}
                            ></div>
                            <span className="font-label-sm text-label-sm text-on-surface-variant">
                              Qua
                            </span>
                          </div>
                          <div className="flex flex-col items-center gap-1.5 flex-1">
                            <div
                              className="w-5 bg-surface-container rounded-t-sm"
                              style={{ height: '35px' }}
                            ></div>
                            <span className="font-label-sm text-label-sm text-on-surface-variant">
                              Qui
                            </span>
                          </div>
                          <div className="flex flex-col items-center gap-1.5 flex-1">
                            <div
                              className="w-5 bg-secondary-container rounded-t-sm"
                              style={{ height: '85px' }}
                            ></div>
                            <span className="font-label-sm text-label-sm text-primary font-bold">
                              Sex
                            </span>
                          </div>
                          <div className="flex flex-col items-center gap-1.5 flex-1">
                            <div
                              className="w-5 bg-surface-container rounded-t-sm"
                              style={{ height: '60px' }}
                            ></div>
                            <span className="font-label-sm text-label-sm text-on-surface-variant">
                              Sáb
                            </span>
                          </div>
                          <div className="flex flex-col items-center gap-1.5 flex-1">
                            <div
                              className="w-5 bg-surface-container rounded-t-sm"
                              style={{ height: '25px' }}
                            ></div>
                            <span className="font-label-sm text-label-sm text-on-surface-variant">
                              Dom
                            </span>
                          </div>
                        </div>
                      </section>

                      {/* Recent Trips History */}
                      <section className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm space-y-space-sm">
                        <div className="flex items-center justify-between pb-1">
                          <h3 className="font-title-lg text-title-lg text-primary">
                            Histórico de Corridas Recentes
                          </h3>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">
                            Outubro 2026
                          </span>
                        </div>
                        <div className="space-y-2">
                          {tripHistory.map((item) => (
                            <div
                              key={item.id}
                              className="p-3 bg-surface-container-low rounded-lg flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3">
                                <span className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
                                  <span className="material-symbols-outlined text-[20px]">
                                    check_circle
                                  </span>
                                </span>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-label-lg text-label-lg text-primary">
                                      {item.origin} → {item.destination}
                                    </span>
                                  </div>
                                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                                    {item.date} • {item.passengers} Lugares cheios •{' '}
                                    {item.revenueKz.toLocaleString('pt-AO')} Kz
                                  </span>
                                </div>
                              </div>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-label-sm text-label-sm">
                                {item.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </section>

                      <section className="pt-2">
                        <button
                          onClick={() => {
                            setIsLoggedIn(false);
                            setActiveTab('perfil');
                            showModal(
                              'Sessão Terminada',
                              'A sua sessão de motorista foi encerrada. Faça login novamente para entrar na fila.',
                              'logout'
                            );
                          }}
                          className="w-full h-12 rounded-lg bg-error-container text-on-error-container font-label-lg text-label-lg flex items-center justify-center gap-2 active:opacity-80 transition-opacity cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[20px]">logout</span>
                          Terminar Sessão do Motorista
                        </button>
                      </section>
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 4: PERFIL & ACESSO (LOGIN / REGISTER / CREDENTIALS)   */}
              {/* ========================================================= */}
              {activeTab === 'perfil' && (
                <div className="flex flex-col w-full">
                  <div className="relative bg-primary text-on-primary px-margin pt-space-lg pb-space-xl overflow-hidden rounded-b-xl shadow-md">
                    <div className="absolute -top-12 -right-12 w-48 h-48 bg-secondary-container/15 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-36 h-36 bg-surface-variant/10 rounded-full blur-xl pointer-events-none"></div>
                    <div className="relative z-10 flex flex-col items-center text-center">
                      <div className="w-20 h-20 rounded-2xl bg-surface-container-lowest p-1.5 shadow-lg mb-space-sm flex items-center justify-center">
                        <img
                          alt="FilaTáxi Angola Logo"
                          className="w-full h-full object-cover rounded-xl"
                          src={LOGO_URL}
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-space-sm py-0.5 rounded-full bg-surface-container-highest/20 text-secondary-fixed text-label-sm font-label-sm mb-space-xs uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-secondary-container"></span>
                        Plataforma Oficial das Praças
                      </div>
                      <h1 className="font-display-lg-mobile text-display-lg-mobile text-on-primary tracking-tight">
                        FilaTáxi Angola
                      </h1>
                      <p className="font-headline-sm text-headline-sm text-secondary-fixed-dim mt-1">
                        Organize a sua fila. Trabalhe melhor.
                      </p>
                      <p className="font-body-sm text-body-sm text-on-primary-container mt-1 max-w-xs">
                        Gestão digital de filas de táxi colectivo em Angola com transparência e
                        rapidez.
                      </p>
                    </div>
                  </div>

                  <div className="px-margin -mt-4 z-20 pb-space-xl flex flex-col gap-space-md">
                    <div className="bg-surface-container-lowest rounded-xl p-1 shadow-sm flex items-center">
                      <button
                        onClick={() => setAuthTab('login')}
                        className={`flex-1 py-2.5 rounded-lg font-label-lg text-label-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          authTab === 'login'
                            ? 'text-on-primary bg-primary shadow-sm'
                            : 'text-on-surface-variant bg-transparent'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">badge</span>
                        Entrar
                      </button>
                      <button
                        onClick={() => setAuthTab('register')}
                        className={`flex-1 py-2.5 rounded-lg font-label-lg text-label-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          authTab === 'register'
                            ? 'text-on-primary bg-primary shadow-sm'
                            : 'text-on-surface-variant bg-transparent'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">person_add</span>
                        Criar Conta
                      </button>
                    </div>

                    {authTab === 'login' ? (
                      <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-md flex flex-col gap-space-md">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-headline-sm text-headline-sm text-on-surface block">
                              Acesso Motorista
                            </span>
                            <span className="font-body-sm text-body-sm text-outline">
                              {isLoggedIn
                                ? `Sessão ativa como ${driverName} (${vehiclePlate})`
                                : 'Introduza as suas credenciais de praça'}
                            </span>
                          </div>
                          <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-[20px]">
                              local_taxi
                            </span>
                          </div>
                        </div>

                        <form
                          className="flex flex-col gap-space-md"
                          onSubmit={(e) => {
                            e.preventDefault();
                            setIsLoggedIn(true);
                            showModal(
                              'A entrar na Fila',
                              'Credenciais verificadas com sucesso. A sincronizar a sua viatura com a praça seleccionada...',
                              'check_circle'
                            );
                            setTimeout(() => setActiveTab('inicio'), 1200);
                          }}
                        >
                          <div className="flex flex-col gap-1.5">
                            <label className="font-label-md text-label-md text-on-surface">
                              Número de Telefone
                            </label>
                            <div className="relative flex items-center">
                              <span className="absolute left-3 text-outline flex items-center">
                                <span className="material-symbols-outlined text-[20px]">call</span>
                              </span>
                              <input
                                className="w-full h-12 pl-10 pr-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none transition-colors placeholder:text-outline-variant"
                                placeholder="+244 923 000 000"
                                defaultValue="+244 923 442 109"
                                required
                                type="tel"
                              />
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                              <label className="font-label-md text-label-md text-on-surface">
                                Palavra-passe
                              </label>
                              <button
                                className="font-label-sm text-label-sm text-secondary hover:underline cursor-pointer"
                                onClick={() =>
                                  showModal(
                                    'Recuperação de Acesso',
                                    'Para redefinir o seu PIN de motorista, contacte o fiscal da sua praça habitual ou envie um SMS grátis para 19 822.',
                                    'vpn_key'
                                  )
                                }
                                type="button"
                              >
                                Esqueci a palavra-passe
                              </button>
                            </div>
                            <div className="relative flex items-center">
                              <span className="absolute left-3 text-outline flex items-center">
                                <span className="material-symbols-outlined text-[20px]">lock</span>
                              </span>
                              <input
                                className="w-full h-12 pl-10 pr-11 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none transition-colors placeholder:text-outline-variant"
                                placeholder="••••••••"
                                defaultValue="12345678"
                                required
                                type={showPassword ? 'text' : 'password'}
                              />
                              <button
                                aria-label="Alternar visualização da senha"
                                className="absolute right-3 text-outline hover:text-on-surface p-1 rounded-md transition-colors cursor-pointer"
                                onClick={() => setShowPassword(!showPassword)}
                                type="button"
                              >
                                <span className="material-symbols-outlined text-[20px]">
                                  {showPassword ? 'visibility_off' : 'visibility'}
                                </span>
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                defaultChecked
                                className="w-4 h-4 rounded bg-surface-container-low text-primary accent-primary"
                                type="checkbox"
                              />
                              <span className="font-body-sm text-body-sm text-on-surface-variant">
                                Lembrar neste telefone
                              </span>
                            </label>
                            <span className="font-label-sm text-label-sm text-on-tertiary-container bg-surface-container px-2 py-0.5 rounded-full">
                              AO Oficial
                            </span>
                          </div>
                          <button
                            className="w-full h-14 mt-1 bg-secondary-container text-on-secondary-fixed font-title-lg text-title-lg rounded-lg shadow-md active:scale-[0.99] transition-transform flex items-center justify-center gap-2 cursor-pointer"
                            type="submit"
                          >
                            <span className="material-symbols-outlined text-[22px]">login</span>
                            Entrar na Minha Praça
                          </button>
                        </form>

                        <div className="flex items-center gap-3 my-1">
                          <div className="flex-1 h-0.5 bg-surface-container"></div>
                          <span className="font-label-sm text-label-sm text-outline">
                            NOVO MOTORISTA?
                          </span>
                          <div className="flex-1 h-0.5 bg-surface-container"></div>
                        </div>
                        <button
                          className="w-full h-12 bg-surface-container text-on-surface font-label-lg text-label-lg rounded-lg hover:bg-surface-container-high transition-colors flex items-center justify-center gap-2 cursor-pointer"
                          onClick={() => setAuthTab('register')}
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                          Ainda não possui conta? Criar conta
                        </button>
                      </div>
                    ) : (
                      /* REGISTER FORM */
                      <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-md flex flex-col gap-space-md">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-headline-sm text-headline-sm text-on-surface block">
                              Registo de Motorista
                            </span>
                            <span className="font-body-sm text-body-sm text-outline">
                              Associe a sua viatura à praça digital
                            </span>
                          </div>
                          <div className="w-9 h-9 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed">
                            <span className="material-symbols-outlined text-[20px]">
                              app_registration
                            </span>
                          </div>
                        </div>
                        <form
                          className="flex flex-col gap-3"
                          onSubmit={(e) => {
                            e.preventDefault();
                            setIsLoggedIn(true);
                            showModal(
                              'Registo Submetido',
                              `Bem-vindo, ${driverName}! A viatura ${vehiclePlate} foi registada e associada à praça digital.`,
                              'verified'
                            );
                            setTimeout(() => setActiveTab('inicio'), 1400);
                          }}
                        >
                          <div className="flex flex-col gap-1">
                            <label className="font-label-md text-label-md text-on-surface">
                              Nome Completo
                            </label>
                            <input
                              className="w-full h-11 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none"
                              placeholder="Ex: Mateus António Sebastião"
                              value={driverName}
                              onChange={(e) => setDriverName(e.target.value)}
                              required
                              type="text"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col gap-1">
                              <label className="font-label-md text-label-md text-on-surface">
                                Nº de B.I.
                              </label>
                              <input
                                className="w-full h-11 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none uppercase"
                                placeholder="005928172LA041"
                                value={biNumber}
                                onChange={(e) => setBiNumber(e.target.value)}
                                required
                                type="text"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="font-label-md text-label-md text-on-surface">
                                Nº Carta/Licença
                              </label>
                              <input
                                className="w-full h-11 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none uppercase"
                                placeholder="AO-49281-B"
                                value={licenseNumber}
                                onChange={(e) => setLicenseNumber(e.target.value)}
                                required
                                type="text"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col gap-1">
                              <label className="font-label-md text-label-md text-on-surface">
                                Matrícula (Kandongueiro)
                              </label>
                              <input
                                className="w-full h-11 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none uppercase tracking-wider font-semibold"
                                placeholder="LD-44-82-GS"
                                value={vehiclePlate}
                                onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                                required
                                type="text"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="font-label-md text-label-md text-on-surface">
                                Modelo da Viatura
                              </label>
                              <div className="relative">
                                <select
                                  value={vehicleModel}
                                  onChange={(e) => setVehicleModel(e.target.value)}
                                  className="w-full h-11 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none appearance-none pr-8 truncate"
                                >
                                  <optgroup label="Táxis Colectivos & Utilitários">
                                    <option value="Toyota Hiace (Azul/Branco)">Toyota Hiace (Azul/Branco)</option>
                                    <option value="Toyota Coaster">Toyota Coaster</option>
                                    <option value="Hyundai H100">Hyundai H100</option>
                                  </optgroup>
                                  <optgroup label="Marcas Populares e Mais Vendidas">
                                    <option value="Toyota (Hilux / Land Cruiser / CFAO)">Toyota (Hilux / Land Cruiser / CFAO)</option>
                                    <option value="Jetour">Jetour</option>
                                    <option value="Suzuki">Suzuki</option>
                                    <option value="Nissan (Navara / Patrol)">Nissan (Navara / Patrol)</option>
                                    <option value="Geely">Geely</option>
                                    <option value="Hyundai (AutoFuturo)">Hyundai (AutoFuturo)</option>
                                    <option value="Kia">Kia</option>
                                    <option value="Changan">Changan</option>
                                    <option value="Chery (Chery Angola)">Chery (Chery Angola)</option>
                                    <option value="Wuling">Wuling</option>
                                  </optgroup>
                                  <optgroup label="Outras Marcas de Passageiros e SUVs">
                                    <option value="Audi">Audi</option>
                                    <option value="BMW">BMW</option>
                                    <option value="Chevrolet (Tahoe)">Chevrolet (Tahoe)</option>
                                    <option value="Citroën (Caetano Angola)">Citroën (Caetano Angola)</option>
                                    <option value="Fiat">Fiat</option>
                                    <option value="Ford (Caetano Angola)">Ford (Caetano Angola)</option>
                                    <option value="GAC (GS3 Emzoom / GS4 Max)">GAC (GS3 Emzoom / GS4 Max)</option>
                                    <option value="Honda">Honda</option>
                                    <option value="Infiniti">Infiniti</option>
                                    <option value="JAC Motors">JAC Motors</option>
                                    <option value="Jaguar">Jaguar</option>
                                    <option value="Jeep">Jeep</option>
                                    <option value="JMC (Vigus / Grand Avenue)">JMC (Vigus / Grand Avenue)</option>
                                    <option value="Land Rover / Range Rover">Land Rover / Range Rover</option>
                                    <option value="Lexus">Lexus</option>
                                    <option value="Maserati">Maserati</option>
                                    <option value="Mazda">Mazda</option>
                                    <option value="Mercedes-Benz">Mercedes-Benz</option>
                                    <option value="Mini">Mini</option>
                                    <option value="Mitsubishi">Mitsubishi</option>
                                    <option value="Opel">Opel</option>
                                    <option value="Peugeot (Caetano Angola)">Peugeot (Caetano Angola)</option>
                                    <option value="Porsche">Porsche</option>
                                    <option value="Renault (Duster / Koleos)">Renault (Duster / Koleos)</option>
                                    <option value="Subaru">Subaru</option>
                                    <option value="Volkswagen">Volkswagen</option>
                                    <option value="Volvo">Volvo</option>
                                  </optgroup>
                                  <optgroup label="Veículos Comerciais e Pesados">
                                    <option value="Hino (CFAO)">Hino (CFAO)</option>
                                    <option value="Iveco">Iveco</option>
                                    <option value="Man">Man</option>
                                    <option value="Scania">Scania</option>
                                    <option value="Sinotruk">Sinotruk</option>
                                    <option value="Dongfeng">Dongfeng</option>
                                    <option value="Renault Trucks (Caetano Angola)">Renault Trucks (Caetano Angola)</option>
                                    <option value="Outro Utilitário">Outro Utilitário</option>
                                  </optgroup>
                                </select>
                                <span className="material-symbols-outlined absolute right-2 top-3 text-[18px] text-outline pointer-events-none">
                                  expand_more
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="font-label-md text-label-md text-on-surface">
                              Praça Habitual / Terminal de Saída
                            </label>
                            <div className="relative">
                              <select
                                onChange={(e) => {
                                  const found = LUANDA_PRACAS.find((p) => p.id === e.target.value);
                                  if (found) {
                                    setCurrentOriginPraca(found);
                                    setCurrentDestName(found.destinations[0]);
                                  }
                                }}
                                value={currentOriginPraca.id}
                                className="w-full h-11 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none appearance-none pr-8"
                              >
                                {LUANDA_PRACAS.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} ⇄ {p.destinations[0]}
                                  </option>
                                ))}
                              </select>
                              <span className="material-symbols-outlined absolute right-2 top-3 text-[18px] text-outline pointer-events-none">
                                pin_drop
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="font-label-md text-label-md text-on-surface">
                              Telemóvel (WhatsApp / SMS de Fila)
                            </label>
                            <input
                              className="w-full h-11 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none"
                              placeholder="+244 9XX XXX XXX"
                              defaultValue="+244 923 442 109"
                              required
                              type="tel"
                            />
                          </div>

                          {/* Fotografia Tipo Passe do Motorista */}
                          <div className="flex flex-col gap-1.5 pt-1">
                            <div className="flex items-center justify-between">
                              <label className="font-label-md text-label-md text-on-surface flex items-center gap-1">
                                <span className="material-symbols-outlined text-[16px] text-secondary">
                                  portrait
                                </span>
                                Fotografia Tipo Passe (Motorista)
                              </label>
                              {driverPassportPhoto && (
                                <span className="text-[11px] font-label-sm text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                  <span className="material-symbols-outlined text-[13px]">
                                    check_circle
                                  </span>
                                  Anexada
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-container-low border border-dashed border-outline-variant/70">
                              <div className="w-16 h-20 rounded-lg bg-surface-container overflow-hidden flex-shrink-0 flex flex-col items-center justify-center border border-outline-variant/40 relative shadow-sm">
                                {driverPassportPhoto ? (
                                  <img
                                    src={driverPassportPhoto}
                                    alt="Fotografia Tipo Passe"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <>
                                    <span className="material-symbols-outlined text-[26px] text-on-surface-variant">
                                      account_box
                                    </span>
                                    <span className="text-[9px] font-label-sm text-outline uppercase mt-0.5">
                                      3x4 Passe
                                    </span>
                                  </>
                                )}
                              </div>
                              <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                                <p className="font-body-sm text-body-sm text-on-surface-variant leading-snug">
                                  Tire uma foto de rosto nítida ou carregue uma fotografia tipo passe atualizada.
                                </p>
                                <div className="flex items-center gap-2">
                                  <label className="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm flex items-center gap-1 cursor-pointer active:scale-95 transition-transform shadow-sm">
                                    <span className="material-symbols-outlined text-[15px] text-secondary-container">
                                      photo_camera
                                    </span>
                                    <span>{driverPassportPhoto ? 'Trocar Foto' : 'Carregar Foto'}</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      capture="user"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          const reader = new FileReader();
                                          reader.onloadend = () =>
                                            setDriverPassportPhoto(reader.result as string);
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                    />
                                  </label>
                                  {driverPassportPhoto && (
                                    <button
                                      type="button"
                                      onClick={() => setDriverPassportPhoto(null)}
                                      className="px-2 py-1.5 rounded-lg bg-error-container text-on-error-container font-label-sm text-label-sm cursor-pointer"
                                    >
                                      Remover
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Bilhete de Identidade: Frente e Verso */}
                          <div className="flex flex-col gap-1.5 pt-1">
                            <div className="flex items-center justify-between">
                              <label className="font-label-md text-label-md text-on-surface flex items-center gap-1">
                                <span className="material-symbols-outlined text-[16px] text-secondary">
                                  assignment_ind
                                </span>
                                Bilhete de Identidade (Frente e Verso)
                              </label>
                              <span className="text-[11px] font-label-sm text-on-surface-variant">
                                {[idCardFrontPhoto, idCardBackPhoto].filter(Boolean).length}/2 lados
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2.5">
                              {/* Frente do B.I. */}
                              <div className="relative rounded-xl bg-surface-container-low border border-dashed border-outline-variant/70 p-2 flex flex-col items-center justify-between min-h-[112px] overflow-hidden">
                                {idCardFrontPhoto ? (
                                  <>
                                    <img
                                      src={idCardFrontPhoto}
                                      alt="Bilhete de Identidade - Frente"
                                      className="w-full h-20 object-cover rounded-lg shadow-sm"
                                    />
                                    <div className="w-full flex items-center justify-between mt-1.5 px-0.5">
                                      <span className="text-[10px] font-label-sm text-emerald-800 flex items-center gap-0.5 font-bold">
                                        <span className="material-symbols-outlined text-[13px]">
                                          verified
                                        </span>
                                        Frente OK
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => setIdCardFrontPhoto(null)}
                                        className="text-[10px] font-label-sm text-error hover:underline cursor-pointer"
                                      >
                                        Trocar
                                      </button>
                                    </div>
                                  </>
                                ) : (
                                  <label className="w-full h-full flex flex-col items-center justify-center text-center cursor-pointer py-2 group">
                                    <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-primary group-hover:bg-secondary-container transition-colors mb-1">
                                      <span className="material-symbols-outlined text-[20px]">
                                        branding_watermark
                                      </span>
                                    </div>
                                    <span className="font-label-sm text-label-sm text-primary">
                                      B.I. • Frente
                                    </span>
                                    <span className="text-[10px] text-outline mt-0.5">
                                      Toque para anexar
                                    </span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      capture="environment"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          const reader = new FileReader();
                                          reader.onloadend = () =>
                                            setIdCardFrontPhoto(reader.result as string);
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                    />
                                  </label>
                                )}
                              </div>

                              {/* Verso do B.I. */}
                              <div className="relative rounded-xl bg-surface-container-low border border-dashed border-outline-variant/70 p-2 flex flex-col items-center justify-between min-h-[112px] overflow-hidden">
                                {idCardBackPhoto ? (
                                  <>
                                    <img
                                      src={idCardBackPhoto}
                                      alt="Bilhete de Identidade - Verso"
                                      className="w-full h-20 object-cover rounded-lg shadow-sm"
                                    />
                                    <div className="w-full flex items-center justify-between mt-1.5 px-0.5">
                                      <span className="text-[10px] font-label-sm text-emerald-800 flex items-center gap-0.5 font-bold">
                                        <span className="material-symbols-outlined text-[13px]">
                                          verified
                                        </span>
                                        Verso OK
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => setIdCardBackPhoto(null)}
                                        className="text-[10px] font-label-sm text-error hover:underline cursor-pointer"
                                      >
                                        Trocar
                                      </button>
                                    </div>
                                  </>
                                ) : (
                                  <label className="w-full h-full flex flex-col items-center justify-center text-center cursor-pointer py-2 group">
                                    <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-primary group-hover:bg-secondary-container transition-colors mb-1">
                                      <span className="material-symbols-outlined text-[20px]">
                                        flip
                                      </span>
                                    </div>
                                    <span className="font-label-sm text-label-sm text-primary">
                                      B.I. • Verso
                                    </span>
                                    <span className="text-[10px] text-outline mt-0.5">
                                      Toque para anexar
                                    </span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      capture="environment"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          const reader = new FileReader();
                                          reader.onloadend = () =>
                                            setIdCardBackPhoto(reader.result as string);
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                    />
                                  </label>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Carta de Condução: Frente e Verso */}
                          <div className="flex flex-col gap-1.5 pt-1">
                            <div className="flex items-center justify-between">
                              <label className="font-label-md text-label-md text-on-surface flex items-center gap-1">
                                <span className="material-symbols-outlined text-[16px] text-secondary">
                                  badge
                                </span>
                                Carta de Condução (Frente e Verso)
                              </label>
                              <span className="text-[11px] font-label-sm text-on-surface-variant">
                                {[licenseFrontPhoto, licenseBackPhoto].filter(Boolean).length}/2 lados
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2.5">
                              {/* Frente da Carta */}
                              <div className="relative rounded-xl bg-surface-container-low border border-dashed border-outline-variant/70 p-2 flex flex-col items-center justify-between min-h-[112px] overflow-hidden">
                                {licenseFrontPhoto ? (
                                  <>
                                    <img
                                      src={licenseFrontPhoto}
                                      alt="Carta de Condução - Frente"
                                      className="w-full h-20 object-cover rounded-lg shadow-sm"
                                    />
                                    <div className="w-full flex items-center justify-between mt-1.5 px-0.5">
                                      <span className="text-[10px] font-label-sm text-emerald-800 flex items-center gap-0.5 font-bold">
                                        <span className="material-symbols-outlined text-[13px]">
                                          verified
                                        </span>
                                        Frente OK
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => setLicenseFrontPhoto(null)}
                                        className="text-[10px] font-label-sm text-error hover:underline cursor-pointer"
                                      >
                                        Trocar
                                      </button>
                                    </div>
                                  </>
                                ) : (
                                  <label className="w-full h-full flex flex-col items-center justify-center text-center cursor-pointer py-2 group">
                                    <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-primary group-hover:bg-secondary-container transition-colors mb-1">
                                      <span className="material-symbols-outlined text-[20px]">
                                        id_card
                                      </span>
                                    </div>
                                    <span className="font-label-sm text-label-sm text-primary">
                                      Carta • Frente
                                    </span>
                                    <span className="text-[10px] text-outline mt-0.5">
                                      Toque para anexar
                                    </span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      capture="environment"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          const reader = new FileReader();
                                          reader.onloadend = () =>
                                            setLicenseFrontPhoto(reader.result as string);
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                    />
                                  </label>
                                )}
                              </div>

                              {/* Verso da Carta */}
                              <div className="relative rounded-xl bg-surface-container-low border border-dashed border-outline-variant/70 p-2 flex flex-col items-center justify-between min-h-[112px] overflow-hidden">
                                {licenseBackPhoto ? (
                                  <>
                                    <img
                                      src={licenseBackPhoto}
                                      alt="Carta de Condução - Verso"
                                      className="w-full h-20 object-cover rounded-lg shadow-sm"
                                    />
                                    <div className="w-full flex items-center justify-between mt-1.5 px-0.5">
                                      <span className="text-[10px] font-label-sm text-emerald-800 flex items-center gap-0.5 font-bold">
                                        <span className="material-symbols-outlined text-[13px]">
                                          verified
                                        </span>
                                        Verso OK
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => setLicenseBackPhoto(null)}
                                        className="text-[10px] font-label-sm text-error hover:underline cursor-pointer"
                                      >
                                        Trocar
                                      </button>
                                    </div>
                                  </>
                                ) : (
                                  <label className="w-full h-full flex flex-col items-center justify-center text-center cursor-pointer py-2 group">
                                    <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-primary group-hover:bg-secondary-container transition-colors mb-1">
                                      <span className="material-symbols-outlined text-[20px]">
                                        credit_card
                                      </span>
                                    </div>
                                    <span className="font-label-sm text-label-sm text-primary">
                                      Carta • Verso
                                    </span>
                                    <span className="text-[10px] text-outline mt-0.5">
                                      Toque para anexar
                                    </span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      capture="environment"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          const reader = new FileReader();
                                          reader.onloadend = () =>
                                            setLicenseBackPhoto(reader.result as string);
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                    />
                                  </label>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Fotografia do Automóvel (Carro) */}
                          <div className="flex flex-col gap-1.5 pt-1">
                            <div className="flex items-center justify-between">
                              <label className="font-label-md text-label-md text-on-surface flex items-center gap-1">
                                <span className="material-symbols-outlined text-[16px] text-secondary">
                                  directions_car
                                </span>
                                Fotografia do Automóvel (Carro)
                              </label>
                              <span className="text-[11px] font-label-sm text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[13px]">
                                  check_circle
                                </span>
                                Registada
                              </span>
                            </div>
                            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-container-low border border-dashed border-outline-variant/70">
                              <div className="w-24 h-16 rounded-lg bg-surface-container overflow-hidden flex-shrink-0 flex items-center justify-center border border-outline-variant/40 relative shadow-sm">
                                <img
                                  src={vehiclePhoto}
                                  alt="Fotografia do Automóvel"
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                                <p className="font-body-sm text-body-sm text-on-surface-variant leading-snug">
                                  Fotografia exterior visível do carro/táxi com a matrícula legível.
                                </p>
                                <div className="flex items-center gap-2">
                                  <label className="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm flex items-center gap-1 cursor-pointer active:scale-95 transition-transform shadow-sm">
                                    <span className="material-symbols-outlined text-[15px] text-secondary-container">
                                      add_a_photo
                                    </span>
                                    <span>Carregar Foto do Carro</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      capture="environment"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          const reader = new FileReader();
                                          reader.onloadend = () =>
                                            setVehiclePhoto(reader.result as string);
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                    />
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>
                          <button
                            className="w-full h-13 mt-2 bg-secondary-container text-on-secondary-fixed font-title-lg text-title-lg rounded-lg shadow-md active:scale-[0.99] transition-transform flex items-center justify-center gap-2 cursor-pointer"
                            type="submit"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              check_circle
                            </span>
                            Concluir Registo do Motorista
                          </button>
                        </form>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-space-sm">
                      <button
                        className="p-space-sm bg-surface-container-low hover:bg-surface-container rounded-xl shadow-sm text-left flex flex-col justify-between transition-colors cursor-pointer"
                        onClick={() => {
                          setActiveTab('historico');
                          setHistoricoView('passenger');
                        }}
                        type="button"
                      >
                        <div className="w-8 h-8 rounded-lg bg-surface-variant text-on-surface flex items-center justify-center mb-2">
                          <span className="material-symbols-outlined text-[20px]">
                            directions_walk
                          </span>
                        </div>
                        <div>
                          <span className="font-label-md text-label-md text-on-surface block leading-tight">
                            Acesso Passageiro
                          </span>
                          <span className="font-body-sm text-body-sm text-outline mt-0.5 block">
                            Ver lotação sem conta
                          </span>
                        </div>
                      </button>
                      <button
                        className="p-space-sm bg-surface-container-low hover:bg-surface-container rounded-xl shadow-sm text-left flex flex-col justify-between transition-colors cursor-pointer"
                        onClick={() =>
                          showModal(
                            'Área do Fiscal de Praça',
                            'Terminal sincronizado com a Associação de Taxistas de Luanda (ANATA). Fiscais ativos em 6 praças.',
                            'security'
                          )
                        }
                        type="button"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary-fixed text-on-primary-fixed flex items-center justify-center mb-2">
                          <span className="material-symbols-outlined text-[20px]">
                            admin_panel_settings
                          </span>
                        </div>
                        <div>
                          <span className="font-label-md text-label-md text-on-surface block leading-tight">
                            Painel Gestão
                          </span>
                          <span className="font-body-sm text-body-sm text-outline mt-0.5 block">
                            Fiscais & Associações
                          </span>
                        </div>
                      </button>
                    </div>

                    <div className="bg-surface-container rounded-xl p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary-container/20 flex items-center justify-center text-secondary">
                        <span className="material-symbols-outlined text-[20px]">
                          support_agent
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-label-md text-label-md text-on-surface block truncate">
                          Apoio ao Motorista no Terreno
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant block truncate">
                          Linha Grátis Unitel/Movicel: 19 822
                        </span>
                      </div>
                      <span className="material-symbols-outlined text-outline text-[18px]">
                        chevron_right
                      </span>
                    </div>
                  </div>
                </div>
              )}
              </>
            )}
          </main>

          {/* Fixed Bottom Navigation Bar */}
          <nav className="fixed bottom-0 inset-x-0 max-w-md mx-auto z-40 pb-safe bg-surface/90 backdrop-blur-xl shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
            <div className="flex justify-around items-center h-16 px-gutter">
              <button
                onClick={() => {
                  triggerVibrate();
                  setActiveTab('inicio');
                }}
                className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] transition-colors cursor-pointer ${
                  activeTab === 'inicio'
                    ? 'text-primary font-bold'
                    : 'text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-[24px]">
                  {userRole === 'passenger' ? 'travel_explore' : 'home'}
                </span>
                <span className="font-label-sm text-label-sm">
                  {userRole === 'passenger' ? 'Solicitar' : 'Início'}
                </span>
              </button>
              <button
                onClick={() => {
                  triggerVibrate();
                  setActiveTab('minha-fila');
                }}
                className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] transition-colors cursor-pointer relative ${
                  activeTab === 'minha-fila'
                    ? 'text-primary font-bold'
                    : 'text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-[24px]">
                  format_list_numbered
                </span>
                <span className="font-label-sm text-label-sm">Minha Fila</span>
                {queueState === 'turn' && (
                  <span className="w-2 h-2 rounded-full bg-secondary-container absolute top-1.5 right-2" />
                )}
              </button>
              <button
                onClick={() => {
                  triggerVibrate();
                  setActiveTab('historico');
                }}
                className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] transition-colors cursor-pointer ${
                  activeTab === 'historico'
                    ? 'text-primary font-bold'
                    : 'text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-[24px]">
                  {userRole === 'passenger' ? 'receipt_long' : 'history'}
                </span>
                <span className="font-label-sm text-label-sm">Histórico</span>
              </button>
              <button
                onClick={() => {
                  triggerVibrate();
                  setActiveTab('perfil');
                }}
                className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] transition-colors cursor-pointer ${
                  activeTab === 'perfil'
                    ? 'text-primary font-bold'
                    : 'text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-[24px]">
                  {userRole === 'passenger' ? 'account_circle' : 'person'}
                </span>
                <span className="font-label-sm text-label-sm">
                  {userRole === 'passenger' ? 'Conta' : 'Perfil'}
                </span>
              </button>
            </div>
          </nav>
        </>
      )}

      {/* ========================================================= */}
      {/* GLOBAL MODALS (ROLES, NOTICE, ROUTE SELECTOR, MAP)        */}
      {/* ========================================================= */}

      {/* Modal: Seletor de Nível de Execução */}
      {roleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary/70 backdrop-blur-sm p-margin">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl p-space-lg shadow-2xl space-y-space-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-1 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-secondary-container text-on-secondary-fixed flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[22px]">switch_account</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-primary">Níveis de Execução</h3>
                  <p className="font-body-sm text-on-surface-variant text-[11px]">
                    Selecione o perfil operacional na rede FilaTáxi Angola
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRoleModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {[
                {
                  role: 'passenger' as UserRole,
                  title: '1. Passageiro',
                  subtitle: 'Quem solicita o transporte',
                  desc: 'Cria conta e regista dados, escolhe praças e rotas de Luanda, consulta lotação ao vivo, entra na fila virtual (#P-xx), FilaPass e pagamentos digitais.',
                  icon: 'person',
                  badge: 'Em Execução',
                },
                {
                  role: 'driver' as UserRole,
                  title: '2. Motorista',
                  subtitle: 'Quem conduz o táxi colectivo',
                  desc: 'Gestão da fila de carrinhas (15 lugares), cota diária do proprietário, comissão do motorista, velocímetro e navegação em tempo real.',
                  icon: 'local_taxi',
                  badge: 'Operacional',
                },
                {
                  role: 'inspector' as UserRole,
                  title: '3. Fiscal de Praça',
                  subtitle: 'Quem organiza a baia e valida o embarque',
                  desc: 'Despacho de carrinhas na baia, leitura de QR Codes dos passageiros e chamada da próxima carrinha no cais.',
                  icon: 'badge',
                  badge: 'Terreno',
                },
                {
                  role: 'admin' as UserRole,
                  title: '4. Área Administrativa',
                  subtitle: 'Gestão de praças, cooperativas e tarifas',
                  desc: 'Supervisão de associações (ANATA/ATL), corredores viários de Luanda, relatórios sindicais e segurança.',
                  icon: 'admin_panel_settings',
                  badge: 'Central',
                },
              ].map((item) => (
                <button
                  key={item.role}
                  onClick={() => {
                    triggerVibrate();
                    setUserRole(item.role);
                    setRoleModalOpen(false);
                    if (item.role === 'passenger') {
                      setActiveTab('inicio');
                    }
                    showModal(
                      `Nível de Execução: ${item.title}`,
                      item.role === 'passenger'
                        ? 'Modo Passageiro ativado. Pode pesquisar praças, consultar a fila ao vivo e acompanhar a sua senha digital.'
                        : `Perfil comutado para ${item.title} (${item.subtitle}).`,
                      item.icon
                    );
                  }}
                  className={`w-full p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                    userRole === item.role
                      ? 'bg-secondary-container/20 border-secondary shadow-sm scale-101'
                      : 'bg-surface-container-low border-surface-container hover:bg-surface-container'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      userRole === item.role
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container text-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-primary leading-tight">
                        {item.title}
                      </span>
                      {userRole === item.role ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[12px]">check</span>
                          Ativo
                        </span>
                      ) : (
                        <span className="text-[10px] text-on-surface-variant font-medium">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-secondary block mt-0.5">
                      {item.subtitle}
                    </span>
                    <p className="text-[11px] text-on-surface-variant mt-1 leading-snug">
                      {item.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-surface-container flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setRoleModalOpen(false);
                  handleLogout();
                }}
                className="flex-1 py-3 bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5 hover:bg-rose-100 active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                <span>Terminar Sessão</span>
              </button>
              <button
                type="button"
                onClick={() => setRoleModalOpen(false)}
                className="flex-1 py-3 bg-surface-container text-primary font-bold text-xs rounded-xl cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

        {/* ========================================================= */}
        {/* GLOBAL MODALS (NOTICE, ROUTE SELECTOR, MAP, INCIDENTS)    */}
        {/* ========================================================= */}

        {/* Notice Modal */}
        {noticeModal.open && (
          <div className="fixed inset-0 bg-primary/60 backdrop-blur-sm z-50 flex items-end justify-center p-4">
            <div className="bg-surface-container-lowest w-full max-w-sm rounded-xl p-space-lg shadow-xl flex flex-col gap-3">
              <div className="w-12 h-12 rounded-full bg-secondary-container/20 text-secondary flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[28px]">{noticeModal.icon}</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface text-center">
                {noticeModal.title}
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant text-center">
                {noticeModal.message}
              </p>
              <button
                className="w-full h-11 bg-primary text-on-primary font-label-lg text-label-lg rounded-lg mt-2 cursor-pointer"
                onClick={() => setNoticeModal({ ...noticeModal, open: false })}
                type="button"
              >
                Entendido
              </button>
            </div>
          </div>
        )}

        {/* Route / Praça Switcher Modal */}
        {routeSelectorModalOpen && (
          <div className="fixed inset-0 bg-primary/60 backdrop-blur-sm z-50 flex items-end justify-center p-4">
            <div className="bg-surface-container-lowest w-full max-w-sm rounded-2xl p-space-lg shadow-xl space-y-space-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[24px]">
                    swap_calls
                  </span>
                  <h3 className="font-headline-sm text-primary">Escolher Praça & Rota</h3>
                </div>
                <button
                  onClick={() => setRouteSelectorModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {LUANDA_PRACAS.map((praca) => (
                  <div
                    key={praca.id}
                    className={`p-3 rounded-xl border transition-all ${
                      currentOriginPraca.id === praca.id
                        ? 'bg-surface-container border-secondary-container'
                        : 'bg-surface-container-low border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-title-lg text-primary font-bold">{praca.name}</span>
                      <span className="text-xs font-semibold text-secondary">
                        {praca.naFila} na fila (~{praca.minEspera}m)
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {praca.destinations.map((dest) => (
                        <button
                          key={dest}
                          onClick={() => {
                            setCurrentOriginPraca(praca);
                            setCurrentDestName(dest);
                            setInQueue(true);
                            setQueuePosition(praca.naFila + 1);
                            setQueueState('waiting');
                            setRouteSelectorModalOpen(false);
                            showModal(
                              'Inscrito na Nova Fila',
                              `Viatura ${vehiclePlate} entrou na fila de ${praca.name} → ${dest} na posição #${praca.naFila + 1}.`,
                              'local_taxi'
                            );
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                            currentOriginPraca.id === praca.id && currentDestName === dest
                              ? 'bg-primary text-on-primary'
                              : 'bg-surface-container-lowest text-primary hover:bg-secondary-container'
                          }`}
                        >
                          → {dest}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Expanded Interactive Map Modal for Passenger Praça Inspection */}
        {expandedMapModal && (
          <div className="fixed inset-0 bg-primary/70 backdrop-blur-sm z-50 flex items-end justify-center p-3">
            <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl p-space-md shadow-2xl space-y-space-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-headline-sm text-primary">{expandedMapModal.name}</h3>
                  <p className="font-body-sm text-on-surface-variant">
                    {expandedMapModal.subtitle} • {expandedMapModal.corridor}
                  </p>
                </div>
                <button
                  onClick={() => setExpandedMapModal(null)}
                  className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-primary cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
              <LiveMapView
                center={{ lat: expandedMapModal.lat, lng: expandedMapModal.lng }}
                zoom={14}
                userLocation={userLocation}
                selectedPraca={expandedMapModal}
                onSelectPraca={(p) => setExpandedMapModal(p)}
                heightClass="h-72"
              />
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="bg-surface-container-low p-2 rounded-lg text-center">
                  <span className="font-title-lg text-primary font-bold block">
                    {expandedMapModal.naFila}
                  </span>
                  <span className="text-[11px] text-on-surface-variant">Táxis na Fila</span>
                </div>
                <div className="bg-surface-container-low p-2 rounded-lg text-center">
                  <span className="font-title-lg text-primary font-bold block">
                    {expandedMapModal.noCais}
                  </span>
                  <span className="text-[11px] text-on-surface-variant">No Cais</span>
                </div>
                <div className="bg-surface-container-low p-2 rounded-lg text-center">
                  <span className="font-title-lg text-secondary font-bold block">
                    {expandedMapModal.minEspera}m
                  </span>
                  <span className="text-[11px] text-on-surface-variant">Espera Média</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setCurrentOriginPraca(expandedMapModal);
                  setCurrentDestName(expandedMapModal.destinations[0]);
                  setExpandedMapModal(null);
                  setActiveTab('minha-fila');
                }}
                className="w-full h-12 rounded-xl bg-primary text-on-primary font-label-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-secondary-container">
                  directions_car
                </span>
                Ir para Fila desta Praça
              </button>
            </div>
          </div>
        )}

        {/* Incident Reporting Modal Drawer */}
        {incidentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary/60 backdrop-blur-sm p-margin">
            <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl p-space-lg shadow-xl space-y-space-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[24px]">
                    traffic
                  </span>
                  <h3 className="font-headline-sm text-primary">Comunicar Ocorrência</h3>
                </div>
                <button
                  className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant cursor-pointer"
                  onClick={() => setIncidentModalOpen(false)}
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
              <p className="font-body-sm text-on-surface-variant">
                Ajude os outros motoristas e fiscais com informações em tempo real no corredor{' '}
                {currentOriginPraca.corridor}.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {[
                  { label: 'Engarrafamento', icon: 'traffic', color: 'text-secondary' },
                  { label: 'Operação Policial', icon: 'local_police', color: 'text-primary' },
                  { label: 'Avaria na Via', icon: 'build', color: 'text-secondary' },
                  { label: 'Obras na Pista', icon: 'construction', color: 'text-primary' },
                ].map((inc) => (
                  <button
                    key={inc.label}
                    className="p-3 rounded-lg bg-surface-container-low text-left font-label-md text-primary hover:bg-surface-container flex flex-col gap-1 cursor-pointer"
                    onClick={() => {
                      setIncidentModalOpen(false);
                      showModal(
                        'Ocorrência Registada',
                        `Alerta de "${inc.label}" enviado em tempo real aos motoristas e fiscais da linha ${currentOriginPraca.name} → ${currentDestName}.`,
                        'campaign'
                      );
                    }}
                  >
                    <span className={`material-symbols-outlined ${inc.color}`}>{inc.icon}</span>
                    <span>{inc.label}</span>
                  </button>
                ))}
              </div>
              <button
                className="w-full py-3 rounded-xl bg-surface-container text-on-surface-variant font-label-lg cursor-pointer"
                onClick={() => setIncidentModalOpen(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* MODAL: FILAPASS (RESERVA DE ASSENTO & BILHETE DIGITAL COM SMS/WHATSAPP) */}
        {filaPassModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary/70 backdrop-blur-sm p-margin">
            <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl p-space-lg shadow-2xl space-y-space-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-1 border-b border-surface-container">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-[22px] text-secondary-container">
                      confirmation_number
                    </span>
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-primary">FilaPass • Reserva de Assento</h3>
                    <p className="font-body-sm text-on-surface-variant text-[11px]">
                      Fura-Fila Digital com Confirmação SMS e WhatsApp
                    </p>
                  </div>
                </div>
                <button
                  className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant cursor-pointer"
                  onClick={() => {
                    setFilaPassModalOpen(false);
                    setFilaPassSuccessTicket(null);
                  }}
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {!filaPassSuccessTicket ? (
                <>
                  {/* Seletor de Hora de Ponta / Janela de Partida */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-primary block">
                      Selecione o Horário / Linha Desejada:
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        'Embarque Imediato (Baia 03)',
                        'Kilamba às 06:30 (Ponta)',
                        'Mutamba às 17:00 (Ponta)',
                        'Viana às 07:00 (Ponta)',
                      ].map((slot) => (
                        <button
                          key={slot}
                          onClick={() => setPeakHourSlot(slot)}
                          className={`p-2 rounded-lg text-left text-[11px] font-bold transition-all cursor-pointer ${
                            peakHourSlot === slot
                              ? 'bg-secondary-container text-on-secondary-fixed ring-2 ring-primary'
                              : 'bg-surface-container-low text-primary hover:bg-surface-container'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Painel de Ocupação em Direto */}
                  <div className="bg-surface-container-low p-3.5 rounded-xl space-y-2 border border-surface-container">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-secondary uppercase font-bold tracking-wider">
                        Painel de Ocupação ao Vivo
                      </span>
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        {peakHourSlot.includes('Imediato') ? 'Próxima Carrinha' : 'Reserva Garantida'}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="font-headline-md text-primary font-bold">
                        {selectedFilaPassPraca.name}
                      </span>
                      <span className="text-xs text-on-surface-variant">
                        → {selectedFilaPassPraca.destinations[0]}
                      </span>
                    </div>

                    {/* Grade Interativa de 15 Assentos da Carrinha */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] text-on-surface-variant font-medium">
                          Toque para escolher o seu lugar (Toyota Hiace):
                        </span>
                        <span className="text-xs font-bold text-secondary">
                          Assento #{selectedSeatNum}
                        </span>
                      </div>
                      <div className="grid grid-cols-5 gap-1.5 p-2 bg-surface-container-lowest rounded-lg border border-outline-variant/30">
                        {Array.from({ length: 15 }).map((_, idx) => {
                          const seatNum = idx + 1;
                          const isOccupied = seatNum < 14;
                          const isSelected = seatNum === selectedSeatNum;
                          return (
                            <button
                              key={seatNum}
                              disabled={isOccupied}
                              onClick={() => setSelectedSeatNum(seatNum)}
                              className={`p-1.5 rounded flex flex-col items-center justify-center text-[10px] font-bold transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-secondary-container text-on-secondary-fixed ring-2 ring-primary scale-105 shadow'
                                  : isOccupied
                                  ? 'bg-surface-container text-outline opacity-60 cursor-not-allowed'
                                  : 'bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-emerald-200'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                event_seat
                              </span>
                              <span>#{seatNum}</span>
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-on-surface-variant pt-1 px-1">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-surface-container"></span> Ocupado (13)
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Disponível (2)
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-secondary"></span> Seu Lugar (#{selectedSeatNum})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dados para envio do bilhete */}
                  <div className="space-y-2">
                    <label className="font-label-md text-label-md text-on-surface block">
                      Número para Confirmação do Bilhete (SMS / WhatsApp)
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3 text-secondary text-[20px]">
                        smartphone
                      </span>
                      <input
                        type="tel"
                        value={passengerFilaPhone}
                        onChange={(e) => setPassengerFilaPhone(e.target.value)}
                        placeholder="+244 9XX XXX XXX"
                        className="w-full h-12 pl-10 pr-3 rounded-lg bg-surface-container-low text-primary font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none"
                      />
                    </div>
                    <p className="text-[11px] text-on-surface-variant">
                      Garante o seu assento reservado na Baia 03 sem enfrentar a fila física na paragem.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      triggerVibrate();
                      const code = `FP-${Math.floor(100000 + Math.random() * 900000)}`;
                      setFilaPassSuccessTicket({
                        code,
                        seatNum: selectedSeatNum,
                        praca: selectedFilaPassPraca.name,
                        dest: selectedFilaPassPraca.destinations[0],
                        time: peakHourSlot,
                      });
                      showModal(
                        'Reserva FilaPass Confirmada!',
                        `Assento #${selectedSeatNum} reservado com sucesso! Foi gerado o código ${code} e enviado para o seu telemóvel por SMS e WhatsApp.`,
                        'verified'
                      );
                    }}
                    className="w-full h-14 rounded-xl bg-primary text-on-primary font-title-lg text-title-lg flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[22px] text-secondary-container">
                      airplane_ticket
                    </span>
                    <span>CONFIRMAR RESERVA (500 Kz)</span>
                  </button>
                </>
              ) : (
                /* Bilhete Digital FilaPass Gerado */
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-gradient-to-r from-secondary-container to-secondary-fixed-dim text-on-secondary-fixed border border-secondary shadow-md space-y-2">
                    <div className="flex items-center justify-between border-b border-on-secondary-fixed/20 pb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[20px]">
                          confirmation_number
                        </span>
                        <span className="font-bold text-sm uppercase">Bilhete FilaPass AO</span>
                      </div>
                      <span className="font-mono font-black text-sm">
                        {filaPassSuccessTicket.code}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div>
                        <span className="opacity-80 block text-[10px]">Origem</span>
                        <strong className="text-sm">{filaPassSuccessTicket.praca}</strong>
                      </div>
                      <div>
                        <span className="opacity-80 block text-[10px]">Destino</span>
                        <strong className="text-sm">{filaPassSuccessTicket.dest}</strong>
                      </div>
                      <div>
                        <span className="opacity-80 block text-[10px]">Assento Reservado</span>
                        <strong className="text-sm font-black">
                          #{filaPassSuccessTicket.seatNum} (Baia 03)
                        </strong>
                      </div>
                      <div>
                        <span className="opacity-80 block text-[10px]">Horário / Janela</span>
                        <strong className="text-xs">{filaPassSuccessTicket.time}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-900 text-xs flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-emerald-600">
                      check_circle
                    </span>
                    <span>SMS e Notificação WhatsApp enviadas com o voucher digital para {passengerFilaPhone}.</span>
                  </div>

                  {/* Ações do Bilhete */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        triggerVibrate();
                        const text = encodeURIComponent(
                          `🎟️ Meu Bilhete FilaPass: Código ${filaPassSuccessTicket.code} | Assento #${filaPassSuccessTicket.seatNum} | ${filaPassSuccessTicket.praca} → ${filaPassSuccessTicket.dest} | Horário: ${filaPassSuccessTicket.time}. Apresentar na Baia 03.`
                        );
                        window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
                      }}
                      className="py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow active:scale-95 transition-transform cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">share</span>
                      WhatsApp
                    </button>
                    <button
                      onClick={() => {
                        triggerVibrate();
                        navigator.clipboard?.writeText(filaPassSuccessTicket.code);
                        showModal(
                          'Código Copiado',
                          `Código ${filaPassSuccessTicket.code} copiado para a área de transferência.`,
                          'content_copy'
                        );
                      }}
                      className="py-3 bg-surface-container text-primary font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-transform cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">content_copy</span>
                      Copiar Código
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setFilaPassModalOpen(false);
                      setFilaPassSuccessTicket(null);
                    }}
                    className="w-full h-12 bg-primary text-on-primary font-label-md rounded-xl cursor-pointer"
                  >
                    Concluir e Voltar
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL: SOS DE EMERGÊNCIA & RASTREIO SEGURO PARA PASSAGEIROS E FAMILIARES */}
        {sosModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary/70 backdrop-blur-sm p-margin">
            <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl p-space-lg shadow-2xl space-y-space-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-1 border-b border-surface-container">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-error-container text-on-error-container flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-[22px]">shield</span>
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-primary">SOS & Rastreio Seguro</h3>
                    <p className="font-body-sm text-on-surface-variant text-[11px]">
                      Partilha de Viagem em Tempo Real & Alerta Policial
                    </p>
                  </div>
                </div>
                <button
                  className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant cursor-pointer"
                  onClick={() => setSosModalOpen(false)}
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {/* Rastreio e Partilha WhatsApp com Familiares */}
              <div className="bg-surface-container-low p-3.5 rounded-xl space-y-2.5 border border-surface-container">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <span className="material-symbols-outlined text-secondary text-[20px]">
                    share_location
                  </span>
                  <span>Partilhar Viagem com Familiares</span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Envie um link dinâmico pelo WhatsApp com a matrícula (
                  <strong className="text-primary">{vehiclePlate}</strong>), condutor (
                  <strong className="text-primary">{driverName}</strong>) e posição GPS em direto no corredor{' '}
                  {currentOriginPraca.corridor}.
                </p>
                <button
                  onClick={() => {
                    triggerVibrate();
                    const text = encodeURIComponent(
                      `Estou a viajar no candongueiro FilaTáxi (${vehiclePlate}) com o motorista ${driverName} de ${currentOriginPraca.name} para ${currentDestName}. Acompanha a minha localização GPS em tempo real: https://filataxi.ao/live/${vehiclePlate}?lat=${userLocation?.lat}&lng=${userLocation?.lng}`
                    );
                    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
                    showModal(
                      'Link de Rastreio Gerado',
                      'O link de partilha GPS foi preparado para envio aos seus contactos de confiança via WhatsApp.',
                      'share'
                    );
                  }}
                  className="w-full h-11 bg-emerald-700 hover:bg-emerald-800 text-white font-label-md rounded-lg flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-transform cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">share</span>
                  Partilhar Trajeto no WhatsApp
                </button>
              </div>

              {/* Contactos Diretos de Emergência */}
              <div className="bg-surface-container-low p-3 rounded-xl space-y-2 border border-surface-container">
                <span className="text-xs font-bold text-primary block">
                  Linhas Diretas de Emergência (Luanda):
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href="tel:113"
                    className="p-2.5 rounded-lg bg-error-container text-on-error-container font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform"
                  >
                    <span className="material-symbols-outlined text-[18px]">local_police</span>
                    Polícia Nacional (113)
                  </a>
                  <a
                    href="tel:+244923000113"
                    className="p-2.5 rounded-lg bg-surface-container text-primary font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform"
                  >
                    <span className="material-symbols-outlined text-[18px]">call</span>
                    Central Fiscais
                  </a>
                </div>
              </div>

              {/* Botão de Pânico / SOS de Emergência Silencioso */}
              <div className="bg-error-container/30 border border-error/30 p-3.5 rounded-xl space-y-2.5">
                <div className="flex items-center gap-2 text-error font-bold text-sm">
                  <span className="material-symbols-outlined text-[22px]">e911_emergency</span>
                  <span>Botão de Pânico / Alerta Silencioso</span>
                </div>
                <p className="text-xs text-on-error-container leading-relaxed">
                  Em caso de assalto, desvio de itinerário suspeito ou perigo, acione o alerta silencioso. A Central da Associação de Táxis e o piquete da Polícia Nacional (113) recebem as coordenadas GPS imediatamente.
                </p>

                {sosActivated ? (
                  <div className="p-3 bg-error text-white rounded-xl text-center space-y-1 animate-pulse">
                    <span className="font-bold text-sm block">🚨 ALERTA SOS TRANSMITIDO EM TEMPO REAL!</span>
                    <span className="text-[11px] block">
                      Localização transmitida ao Comando Provincial de Luanda e aos fiscais do corredor ({userLocation?.lat.toFixed(4)}, {userLocation?.lng.toFixed(4)}).
                    </span>
                    <button
                      onClick={() => setSosActivated(false)}
                      className="mt-2 px-3 py-1 bg-white text-error rounded-lg text-xs font-bold"
                    >
                      Desativar Alerta
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      triggerVibrate();
                      setSosActivated(true);
                      showModal(
                        'Alerta SOS Transmitido',
                        `Sinal de pânico silencioso enviado com sucesso com as coordenadas de GPS (${userLocation?.lat.toFixed(4)}, ${userLocation?.lng.toFixed(4)}) para o piquete central de segurança e Polícia Nacional.`,
                        'warning'
                      );
                    }}
                    className="w-full h-13 bg-error hover:bg-red-700 text-white font-headline-sm text-sm rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[24px]">crisis_alert</span>
                    ACIONAR SOS DE EMERGÊNCIA
                  </button>
                )}
              </div>

              <button
                onClick={() => setSosModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-surface-container text-on-surface-variant font-label-md cursor-pointer"
              >
                Voltar
              </button>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* MODAL: GATEWAY DE PAGAMENTO EMIS / MULTICAIXA EXPRESS & WEBHOOK        */}
        {/* ===================================================================== */}
        {emisModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-[20px]">account_balance</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">EMIS / Multicaixa Express Gateway</h3>
                    <p className="text-[10px] text-slate-500">Serviço Interbancário Autorizado de Angola</p>
                  </div>
                </div>
                <button
                  onClick={() => setEmisModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {/* Cabeçalho do Pagamento Gerado */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white space-y-3 shadow-md">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-[10px] uppercase font-bold text-blue-300 tracking-wider">Referência Interbancária EMIS</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${emisPayment.estado === 'Confirmado' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-slate-950'}`}>
                    {emisPayment.estado === 'Confirmado' ? '✓ Pago & Conciliado (Webhook)' : '⏳ Aguardando Pagamento'}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-300 block">{emisPayment.titulo}</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-2xl font-black text-amber-400">{emisPayment.montanteKz.toLocaleString('pt-AO')} Kz</span>
                    <span className="text-[11px] font-mono text-slate-300">{emisPayment.id}</span>
                  </div>
                </div>

                {/* Dados para pagamento no Multicaixa Express / ATM */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center font-mono">
                  <div className="bg-white/5 p-2 rounded-xl">
                    <span className="text-[9px] text-slate-400 block uppercase font-sans">Entidade</span>
                    <strong className="text-white text-xs">{emisPayment.entidade}</strong>
                  </div>
                  <div className="bg-white/5 p-2 rounded-xl">
                    <span className="text-[9px] text-slate-400 block uppercase font-sans">Referência</span>
                    <strong className="text-amber-300 text-xs">{emisPayment.referencia}</strong>
                  </div>
                  <div className="bg-white/5 p-2 rounded-xl">
                    <span className="text-[9px] text-slate-400 block uppercase font-sans">Montante</span>
                    <strong className="text-emerald-300 text-xs">{emisPayment.montanteKz} Kz</strong>
                  </div>
                </div>
              </div>

              {/* Botões de Ação de Cópia */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(`Entidade: ${emisPayment.entidade} | Ref: ${emisPayment.referencia} | Montante: ${emisPayment.montanteKz} Kz`);
                    showModal('Dados Copiados', 'Dados de pagamento Multicaixa copiados para a área de transferência.', 'content_copy');
                  }}
                  className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">content_copy</span>
                  Copiar Referência
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const newRef = `${Math.floor(100 + Math.random() * 900)} ${Math.floor(100 + Math.random() * 900)} ${Math.floor(100 + Math.random() * 900)}`;
                    setEmisPayment(prev => ({ ...prev, referencia: newRef, estado: 'Pendente' }));
                    showModal('Nova Referência Gerada', `Ref: ${newRef} gerada com sucesso.`, 'refresh');
                  }}
                  className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">refresh</span>
                  Gerar Nova Ref.
                </button>
              </div>

              {/* Secção do Webhook & Simulação de Pagamento Instantâneo */}
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-3">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                  <span className="material-symbols-outlined text-[20px]">webhook</span>
                  <span>Simulação de Webhook API EMIS (Conciliação em Tempo Real)</span>
                </div>
                <p className="text-[11px] text-blue-950 leading-relaxed">
                  No ambiente de produção, quando o cliente efectua o pagamento no Multicaixa Express ou ATM, a EMIS envia um webhook seguro para o nosso servidor. Clique abaixo para simular este pagamento instantâneo:
                </p>

                {emisPayment.estado === 'Confirmado' ? (
                  <div className="p-3 bg-emerald-600 text-white rounded-xl text-center space-y-1">
                    <span className="font-bold text-xs block">✓ PAGAMENTO CONCILIADO COM SUCESSO!</span>
                    <span className="text-[10px] block opacity-90">Recibo digital oficial emitido e quotas/bilhetes marcados como confirmados.</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleSimulateEmisWebhook}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform"
                  >
                    <span className="material-symbols-outlined text-[18px]">bolt</span>
                    <span>Simular Pagamento Instantâneo via Webhook (API EMIS)</span>
                  </button>
                )}
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setEmisModalOpen(false)}
                  className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Fechar Janela
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </APIProvider>
  );
}
