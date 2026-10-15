import React, { useState } from 'react';
import { UserRole, AuthUser, PassengerRecord, DriverRecord, FiscalRecord } from '../types/ecosystem';
import { DOC_CARTA_SVG, DOC_LIVRETE_SVG, DOC_BI_SVG } from '../data/ecosystemData';

interface LoginScreenProps {
  onLoginSuccess: (user: AuthUser) => void;
  onExploreAsGuest?: () => void;
  onTriggerNotice?: (title: string, message: string, icon?: string) => void;
  triggerVibrate?: () => void;
  // Sincronização opcional ao criar novas contas
  setPassengers?: React.Dispatch<React.SetStateAction<PassengerRecord[]>>;
  setDrivers?: React.Dispatch<React.SetStateAction<DriverRecord[]>>;
  setFiscais?: React.Dispatch<React.SetStateAction<FiscalRecord[]>>;
}

export function LoginScreen({
  onLoginSuccess,
  onExploreAsGuest,
  onTriggerNotice,
  triggerVibrate,
  setPassengers,
  setDrivers,
  setFiscais,
}: LoginScreenProps) {
  // Modo atual: 'login' (Iniciar Sessão) ou 'register' (Criar Conta)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Perfil selecionado (4 Níveis de Acesso)
  const [selectedRole, setSelectedRole] = useState<UserRole>('passenger');

  // Campos do formulário
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [termosAceites, setTermosAceites] = useState(true);

  // Campos específicos do Registo de Motorista
  const [numeroBi, setNumeroBi] = useState('004829104LA049');
  const [numeroCarta, setNumeroCarta] = useState('CARTA-9920');
  const [matricula, setMatricula] = useState('LD-44-89-XX');
  const [modeloViatura, setModeloViatura] = useState('Toyota Hiace 15L');
  const [pracaPretendida, setPracaPretendida] = useState('Praça de São Paulo');
  const [rotaPretendida, setRotaPretendida] = useState('Benfica');

  // Estados para documentos e fotografias (Upload ou Captura)
  const [fotoCandidatoUrl, setFotoCandidatoUrl] = useState<string | null>(null);
  const [fotoViaturaUrl, setFotoViaturaUrl] = useState<string | null>(null);
  const [cartaFrenteUrl, setCartaFrenteUrl] = useState<string | null>(null);
  const [cartaVersoUrl, setCartaVersoUrl] = useState<string | null>(null);
  const [biFrenteUrl, setBiFrenteUrl] = useState<string | null>(null);
  const [biVersoUrl, setBiVersoUrl] = useState<string | null>(null);

  const [fotoCandidatoStatus, setFotoCandidatoStatus] = useState<string>('Pendente (Não Anexado)');
  const [fotoViaturaStatus, setFotoViaturaStatus] = useState<string>('Pendente (Não Anexado)');
  const [cartaFrenteStatus, setCartaFrenteStatus] = useState<string>('Pendente (Não Anexado)');
  const [cartaVersoStatus, setCartaVersoStatus] = useState<string>('Pendente (Não Anexado)');
  const [biFrenteStatus, setBiFrenteStatus] = useState<string>('Pendente (Não Anexado)');
  const [biVersoStatus, setBiVersoStatus] = useState<string>('Pendente (Não Anexado)');

  const handleDriverDocumentUpload = (
    file: File | undefined,
    docType: 'fotoPerfil' | 'fotoViatura' | 'cartaFrente' | 'cartaVerso' | 'biFrente' | 'biVerso'
  ) => {
    if (!file) return;
    if (triggerVibrate) triggerVibrate();

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const label = isPdf ? `PDF: ${file.name}` : `Anexado: ${file.name}`;

      if (docType === 'fotoPerfil') {
        setFotoCandidatoUrl(result);
        setFotoCandidatoStatus(label);
      } else if (docType === 'fotoViatura') {
        setFotoViaturaUrl(result);
        setFotoViaturaStatus(label);
      } else if (docType === 'cartaFrente') {
        setCartaFrenteUrl(result);
        setCartaFrenteStatus(label);
      } else if (docType === 'cartaVerso') {
        setCartaVersoUrl(result);
        setCartaVersoStatus(label);
      } else if (docType === 'biFrente') {
        setBiFrenteUrl(result);
        setBiFrenteStatus(label);
      } else if (docType === 'biVerso') {
        setBiVersoUrl(result);
        setBiVersoStatus(label);
      }

      if (onTriggerNotice) {
        onTriggerNotice(
          'Documento Carregado',
          `Ficheiro ${file.name} pronto para submissão à administração.`,
          'attach_file'
        );
      }
    };
    reader.readAsDataURL(file);
  };

  // Visibilidade da senha
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Estados de erro / feedback
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Perfis Demo Pré-Configurados para Acesso Rápido (1-Clique)
  const DEMO_PROFILES: Array<{
    role: UserRole;
    nome: string;
    telefone: string;
    label: string;
    icon: string;
    badgeColor: string;
    desc: string;
  }> = [
    {
      role: 'passenger',
      nome: 'Teresa da Silva',
      telefone: '+244 923 442 109',
      label: 'Passageiro',
      icon: 'person',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
      desc: 'Filas virtuais, bilhetes FilaPass e consulta de praças',
    },
    {
      role: 'driver',
      nome: 'João Manuel',
      telefone: '+244 923 881 002',
      label: 'Motorista',
      icon: 'local_taxi',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-200',
      desc: 'Gestão da fila, embarque 15L, viagens e ocorrências',
    },
    {
      role: 'inspector',
      nome: 'Fiscal Mateus',
      telefone: '+244 912 334 556',
      label: 'Fiscal de Praça',
      icon: 'shield_person',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      desc: 'Vistoria presencial, gestão de baias e despacho',
    },
    {
      role: 'admin',
      nome: 'Admin GPL / ANATA',
      telefone: '+244 924 000 111',
      label: 'Administrador',
      icon: 'admin_panel_settings',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      desc: 'Dashboard geral, aprovações, praças e relatórios',
    },
  ];

  // Helper para formatar telefone
  const handlePhoneChange = (val: string) => {
    // Manter apenas dígitos e o sinal de mais
    let clean = val.replace(/[^\d+]/g, '');
    if (!clean.startsWith('+244') && !clean.startsWith('+')) {
      if (clean.startsWith('9')) {
        clean = `+244 ${clean}`;
      }
    }
    setTelefone(clean);
  };

  // Submissão do formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (triggerVibrate) triggerVibrate();

    // Validações básicas
    if (!telefone.trim()) {
      setErrorMessage('Por favor informe o número de telefone.');
      return;
    }

    if (!senha.trim() || senha.length < 4) {
      setErrorMessage('A senha deve ter pelo menos 4 caracteres.');
      return;
    }

    if (authMode === 'register') {
      if (!nomeCompleto.trim()) {
        setErrorMessage('Por favor informe o seu nome completo.');
        return;
      }
      if (senha !== confirmarSenha) {
        setErrorMessage('As senhas não coincidem. Verifique e tente novamente.');
        return;
      }
      if (!termosAceites) {
        setErrorMessage('É necessário aceitar os termos de serviço e o regulamento do transporte coletivo.');
        return;
      }
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);

      if (authMode === 'login') {
        // Encontrar ou construir utilizador
        const demoMatch = DEMO_PROFILES.find((p) => p.role === selectedRole);
        const resolvedName = demoMatch ? demoMatch.nome : 'Utilizador FilaTáxi';

        const user: AuthUser = {
          id: `usr-${Date.now()}`,
          nome: resolvedName,
          telefone: telefone,
          role: selectedRole,
          dataLogin: new Date().toLocaleDateString('pt-AO'),
          token: `token-${Math.random().toString(36).substring(2)}`,
        };

        if (onTriggerNotice) {
          onTriggerNotice(
            'Sessão Iniciada',
            `Bem-vindo(a) de volta ao FilaTáxi AO como ${selectedRole.toUpperCase()}.`,
            'login'
          );
        }

        onLoginSuccess(user);
      } else {
        // Criar nova conta
        const newUserId = `usr-${Date.now()}`;
        const newUser: AuthUser = {
          id: newUserId,
          nome: nomeCompleto,
          telefone: telefone,
          role: selectedRole,
          dataLogin: new Date().toLocaleDateString('pt-AO'),
          token: `token-${Math.random().toString(36).substring(2)}`,
        };

        // Sincronizar com as listas de utilizadores se as funções foram passadas
        if (selectedRole === 'passenger' && setPassengers) {
          setPassengers((prev) => [
            {
              id: newUserId,
              nome: nomeCompleto,
              telefone: telefone,
              biNumero: '00' + Math.floor(10000000 + Math.random() * 90000000) + 'LA041',
              saldoKz: 2000,
              viagensRealizadas: 0,
              dataRegisto: new Date().toLocaleDateString('pt-AO'),
              status: 'ativo',
              municipioHabitual: 'Luanda',
            },
            ...prev,
          ]);
        } else if (selectedRole === 'driver' && setDrivers) {
          const resolvedFoto =
            fotoCandidatoUrl ||
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80';
          const resolvedFotoViatura =
            fotoViaturaUrl || '/src/assets/images/angola_taxi_hiace_1791809024746.jpg';

          setDrivers((prev) => [
            {
              id: newUserId,
              nomeCompleto: nomeCompleto,
              telefone: telefone,
              numeroCarta: numeroCarta,
              numeroBi: numeroBi,
              matricula: matricula,
              tipoViatura: 'Táxi Colectivo',
              modeloViatura: modeloViatura,
              anoViatura: 2023,
              lotacaoLugares: 15,
              pracaOrigemId: 'saopaulo',
              rotaDestino: rotaPretendida,
              statusConta: 'pendente', // Aguardando análise do Administrador
              viaturaAprovada: false,
              associacao: 'ANATA',
              dataRegisto: new Date().toLocaleDateString('pt-AO'),
              fotoUrl: resolvedFoto,
              fotoViatura: resolvedFotoViatura,
              documentos: {
                cartaFrente: cartaFrenteUrl || DOC_CARTA_SVG,
                cartaVerso: cartaVersoUrl || DOC_CARTA_SVG,
                biFrente: biFrenteUrl || DOC_BI_SVG,
                biVerso: biVersoUrl || DOC_BI_SVG,
                livrete: DOC_LIVRETE_SVG,
                inspecaoTecnica: DOC_LIVRETE_SVG,
                seguroObrigatorio: DOC_LIVRETE_SVG,
              },
              cotasEmDia: true,
              pontuacaoAvaliacao: 5.0,
            },
            ...prev,
          ]);
        } else if (selectedRole === 'inspector' && setFiscais) {
          setFiscais((prev) => [
            {
              id: newUserId,
              nome: nomeCompleto,
              contacto: telefone,
              numeroFuncionario: 'F-' + Math.floor(100 + Math.random() * 900),
              identificacaoFuncional: `FISC-${Math.floor(100 + Math.random() * 900)}`,
              associacao: 'ANATA',
              pracaAtribuidaId: 'saopaulo',
              pracaAtribuidaNome: 'Praça de São Paulo',
              pracasAtribuidas: ['saopaulo'],
              areaTrabalho: 'Luanda Centro • Baia 1',
              turno: 'Manhã (05:30 - 13:30)',
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
                { id: 'aud-' + Date.now(), data: new Date().toLocaleString('pt-AO'), acao: 'Conta criada via registo mobile', autor: 'Registo Autónomo' }
              ]
            },
            ...prev,
          ]);
        }

        setSuccessMessage('Conta criada com sucesso! A entrar no sistema...');

        if (onTriggerNotice) {
          onTriggerNotice(
            'Conta Criada',
            `Conta criada com sucesso para ${nomeCompleto} como ${selectedRole.toUpperCase()}.`,
            'how_to_reg'
          );
        }

        setTimeout(() => {
          onLoginSuccess(newUser);
        }, 800);
      }
    }, 400);
  };

  // Login direto com perfil de demonstração
  const handleQuickDemoLogin = (p: typeof DEMO_PROFILES[0]) => {
    if (triggerVibrate) triggerVibrate();

    const user: AuthUser = {
      id: `usr-demo-${p.role}`,
      nome: p.nome,
      telefone: p.telefone,
      role: p.role,
      dataLogin: new Date().toLocaleDateString('pt-AO'),
      token: `demo-token-${p.role}`,
    };

    if (onTriggerNotice) {
      onTriggerNotice(
        'Sessão Iniciada',
        `Acesso imediato com perfil de ${p.label}: ${p.nome}.`,
        'verified_user'
      );
    }

    onLoginSuccess(user);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-950 via-slate-900 to-slate-950 text-slate-100 antialiased p-4 sm:p-6 justify-center items-center">
      <div className="w-full max-w-md mx-auto space-y-4">
        {/* LOGO & CABEÇALHO INSTITUCIONAL */}
        <div className="text-center space-y-2 pt-2">
          <div className="inline-flex items-center justify-center gap-2 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-md">
            <span className="material-symbols-outlined text-[32px] text-amber-400">local_taxi</span>
            <div className="text-left">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-xl font-black tracking-tight text-white">FilaTáxi</span>
                <span className="px-1.5 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-[11px]">
                  AO
                </span>
              </div>
              <span className="text-[10px] text-slate-300 font-medium tracking-wide">
                Mobilidade Urbana • Luanda
              </span>
            </div>
          </div>

          <h1 className="text-xl font-bold text-white tracking-tight">
            {authMode === 'login' ? 'Iniciar Sessão no Sistema' : 'Criar Nova Conta'}
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Acesso integrado para Passageiros, Motoristas de Praça, Fiscais da ANATA e Administração.
          </p>
        </div>

        {/* ALTERNADOR ENTRE INICIAR SESSÃO E CRIAR CONTA */}
        <div className="bg-slate-800/80 p-1 rounded-2xl border border-slate-700/80 flex shadow-inner">
          <button
            type="button"
            onClick={() => {
              if (triggerVibrate) triggerVibrate();
              setAuthMode('login');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              authMode === 'login'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">login</span>
            <span>Iniciar Sessão</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (triggerVibrate) triggerVibrate();
              setAuthMode('register');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              authMode === 'register'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">person_add</span>
            <span>Criar Conta</span>
          </button>
        </div>

        {/* CARD PRINCIPAL DO FORMULÁRIO */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 text-slate-900 shadow-2xl border border-slate-100 space-y-4">
          {/* MENSAGEM DE ERRO OU SUCESSO */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-rose-600 shrink-0">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-emerald-600 shrink-0">check_circle</span>
              <span>{successMessage}</span>
            </div>
          )}

          {/* SELETOR DOS 4 NÍVEIS DE ACESSO */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
              1. Selecione o Nível de Acesso:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'passenger', label: 'Passageiro', icon: 'person', desc: 'Viajar em Luanda' },
                { id: 'driver', label: 'Motorista', icon: 'local_taxi', desc: 'Conduzir & Fila' },
                { id: 'inspector', label: 'Fiscal', icon: 'shield_person', desc: 'Fiscalizar Praça' },
                { id: 'admin', label: 'Administrador', icon: 'admin_panel_settings', desc: 'Central & Controlo' },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    if (triggerVibrate) triggerVibrate();
                    setSelectedRole(r.id as UserRole);
                  }}
                  className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                    selectedRole === r.id
                      ? 'bg-blue-50 border-blue-600 text-blue-950 ring-2 ring-blue-600/20 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedRole === r.id ? 'bg-blue-900 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{r.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold block truncate">{r.label}</span>
                    <span className="text-[10px] text-slate-500 block truncate">{r.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* FORMULÁRIO */}
          <form onSubmit={handleSubmit} className="space-y-3.5 pt-1 text-xs">
            {/* Nome Completo (Apenas no Modo Registo) */}
            {authMode === 'register' && (
              <div className="space-y-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nome Completo *</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">
                      badge
                    </span>
                    <input
                      type="text"
                      value={nomeCompleto}
                      onChange={(e) => setNomeCompleto(e.target.value)}
                      placeholder="Ex: Manuel António Domingos"
                      required
                      className="w-full h-11 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-900 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* CAMPOS ESPECÍFICOS DO MOTORISTA (CONFORME RECOMENDAÇÃO) */}
                {selectedRole === 'driver' && (
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3 animate-fadeIn">
                    <div className="flex items-center gap-1.5 text-amber-900 font-bold text-[11px]">
                      <span className="material-symbols-outlined text-[16px]">local_taxi</span>
                      <span>Dados Obrigatórios do Motorista (Regulamento ANATA)</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">N.º do BI / ID *</label>
                        <input
                          type="text"
                          value={numeroBi}
                          onChange={(e) => setNumeroBi(e.target.value)}
                          placeholder="004829104LA049"
                          required
                          className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-900"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Carta de Condução *</label>
                        <input
                          type="text"
                          value={numeroCarta}
                          onChange={(e) => setNumeroCarta(e.target.value)}
                          placeholder="CARTA-001"
                          required
                          className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Matrícula Viatura *</label>
                        <input
                          type="text"
                          value={matricula}
                          onChange={(e) => setMatricula(e.target.value)}
                          placeholder="LD-00-00-XX"
                          required
                          className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-900"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Modelo / Categoria *</label>
                        <input
                          type="text"
                          value={modeloViatura}
                          onChange={(e) => setModeloViatura(e.target.value)}
                          placeholder="Toyota Hiace 15L"
                          required
                          className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Praça Habitual *</label>
                        <input
                          type="text"
                          value={pracaPretendida}
                          onChange={(e) => setPracaPretendida(e.target.value)}
                          placeholder="Praça de São Paulo"
                          required
                          className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-900"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Rota Pretendida *</label>
                        <input
                          type="text"
                          value={rotaPretendida}
                          onChange={(e) => setRotaPretendida(e.target.value)}
                          placeholder="Benfica / Viana"
                          required
                          className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-900"
                        />
                      </div>
                    </div>

                    {/* SEÇÃO DE UPLOAD OU CAPTURA DE DOCUMENTOS E FOTOS */}
                    <div className="pt-2 border-t border-amber-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 block text-[11px]">
                          Fotografias e Documentos Obrigatórios (Upload ou Captura):
                        </span>
                        <span className="text-[9px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full font-bold">
                          Exibição no Admin
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        {/* Foto do Motorista */}
                        <div className="p-2 bg-white rounded-xl border border-slate-200 space-y-1">
                          <label className="font-bold text-slate-700 block truncate">Foto Perfil (Motorista)</label>
                          <div className="flex items-center gap-1.5">
                            {fotoCandidatoUrl && (
                              <img src={fotoCandidatoUrl} alt="Preview" className="w-6 h-6 rounded-full object-cover border" />
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              capture="user"
                              onChange={(e) => handleDriverDocumentUpload(e.target.files?.[0], 'fotoPerfil')}
                              className="w-full text-[10px] text-slate-500 file:mr-1 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-blue-50 file:text-blue-900 hover:file:bg-blue-100 cursor-pointer"
                            />
                          </div>
                          <span className="text-[9px] text-emerald-700 font-medium block truncate">
                            {fotoCandidatoStatus}
                          </span>
                        </div>

                        {/* Foto da Viatura */}
                        <div className="p-2 bg-white rounded-xl border border-slate-200 space-y-1">
                          <label className="font-bold text-slate-700 block truncate">Foto da Viatura</label>
                          <div className="flex items-center gap-1.5">
                            {fotoViaturaUrl && (
                              <img src={fotoViaturaUrl} alt="Preview" className="w-6 h-6 rounded-md object-cover border" />
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              onChange={(e) => handleDriverDocumentUpload(e.target.files?.[0], 'fotoViatura')}
                              className="w-full text-[10px] text-slate-500 file:mr-1 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-blue-50 file:text-blue-900 hover:file:bg-blue-100 cursor-pointer"
                            />
                          </div>
                          <span className="text-[9px] text-emerald-700 font-medium block truncate">
                            {fotoViaturaStatus}
                          </span>
                        </div>

                        {/* Carta de Condução - Frente */}
                        <div className="p-2 bg-white rounded-xl border border-slate-200 space-y-1">
                          <label className="font-bold text-slate-700 block truncate">Carta Condução (Frente)</label>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(e) => handleDriverDocumentUpload(e.target.files?.[0], 'cartaFrente')}
                            className="w-full text-[10px] text-slate-500 file:mr-1 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-blue-50 file:text-blue-900 hover:file:bg-blue-100 cursor-pointer"
                          />
                          <span className="text-[9px] text-emerald-700 font-medium block truncate">
                            {cartaFrenteStatus}
                          </span>
                        </div>

                        {/* Carta de Condução - Verso */}
                        <div className="p-2 bg-white rounded-xl border border-slate-200 space-y-1">
                          <label className="font-bold text-slate-700 block truncate">Carta Condução (Verso)</label>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(e) => handleDriverDocumentUpload(e.target.files?.[0], 'cartaVerso')}
                            className="w-full text-[10px] text-slate-500 file:mr-1 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-blue-50 file:text-blue-900 hover:file:bg-blue-100 cursor-pointer"
                          />
                          <span className="text-[9px] text-emerald-700 font-medium block truncate">
                            {cartaVersoStatus}
                          </span>
                        </div>

                        {/* Bilhete de Identidade - Frente (PDF ou Imagem) */}
                        <div className="p-2 bg-white rounded-xl border border-slate-200 space-y-1">
                          <label className="font-bold text-slate-700 block truncate">B.I. Frente (PDF / Imagem)</label>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(e) => handleDriverDocumentUpload(e.target.files?.[0], 'biFrente')}
                            className="w-full text-[10px] text-slate-500 file:mr-1 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-emerald-50 file:text-emerald-900 hover:file:bg-emerald-100 cursor-pointer"
                          />
                          <span className="text-[9px] text-emerald-700 font-medium block truncate">
                            {biFrenteStatus}
                          </span>
                        </div>

                        {/* Bilhete de Identidade - Verso (PDF ou Imagem) */}
                        <div className="p-2 bg-white rounded-xl border border-slate-200 space-y-1">
                          <label className="font-bold text-slate-700 block truncate">B.I. Verso (PDF / Imagem)</label>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(e) => handleDriverDocumentUpload(e.target.files?.[0], 'biVerso')}
                            className="w-full text-[10px] text-slate-500 file:mr-1 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-emerald-50 file:text-emerald-900 hover:file:bg-emerald-100 cursor-pointer"
                          />
                          <span className="text-[9px] text-emerald-700 font-medium block truncate">
                            {biVersoStatus}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-[10px] text-amber-900 bg-amber-100/70 p-2 rounded-lg font-medium">
                      O seu registo ficará com estado <strong>Pendente</strong> aguardando validação do Administrador.
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Número de Telefone */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Número de Telefone *</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">
                  call
                </span>
                <input
                  type="tel"
                  value={telefone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="+244 9XX XXX XXX"
                  required
                  className="w-full h-11 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-900 focus:bg-white transition-all"
                />
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Utilizado para confirmação via SMS e identificação na praça
              </span>
            </div>

            {/* Senha */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Senha de Acesso *</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">
                  lock
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Introduza a sua senha"
                  required
                  className="w-full h-11 pl-9 pr-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-900 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Confirmação de Senha (Apenas no Modo Registo) */}
            {authMode === 'register' && (
              <div>
                <label className="font-bold text-slate-700 block mb-1">Confirmar Senha *</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">
                    lock_reset
                  </span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    placeholder="Repita a sua senha"
                    required
                    className="w-full h-11 pl-9 pr-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-900 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showConfirmPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Termos de Serviço (Apenas no Modo Registo) */}
            {authMode === 'register' && (
              <label className="flex items-start gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termosAceites}
                  onChange={(e) => setTermosAceites(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-900 mt-0.5 focus:ring-0"
                />
                <span className="text-[11px] text-slate-600 leading-snug">
                  Concordo com os Termos de Serviço da <strong>ANATA</strong>, Governo Provincial de Luanda e política de mobilidade coletiva.
                </span>
              </label>
            )}

            {/* BOTÃO PRINCIPAL DE SUBMISSÃO */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>A processar...</span>
                </>
              ) : authMode === 'login' ? (
                <>
                  <span className="material-symbols-outlined text-[18px]">login</span>
                  <span>Entrar como {selectedRole.toUpperCase()}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                  <span>Concluir Criação de Conta ({selectedRole})</span>
                </>
              )}
            </button>
          </form>


        </div>

        {/* ACESSO CONVIDADO / EXPLORAR SEM LOGIN */}
        {onExploreAsGuest && (
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={onExploreAsGuest}
              className="text-xs font-semibold text-slate-400 hover:text-white underline cursor-pointer transition-colors"
            >
              Explorar como visitante sem iniciar sessão
            </button>
          </div>
        )}

        {/* RODAPÉ INSTITUCIONAL */}
        <div className="text-center space-y-1 text-[11px] text-slate-400">
          <p>Associação Nacional dos Taxistas de Angola (ANATA) • GPL</p>
          <p className="text-[10px]">© 2026 FilaTáxi AO • Todos os direitos reservados</p>
        </div>
      </div>
    </div>
  );
}
