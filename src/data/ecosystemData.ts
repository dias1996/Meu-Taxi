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
} from '../types/ecosystem';
import { LUANDA_PRACAS } from '../components/LiveMapView';

// Mock documentos SVGs oficiais de Luanda / Angola
export const DOC_CARTA_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250">
  <rect width="400" height="250" rx="14" fill="#f8fafc" stroke="#2563eb" stroke-width="2"/>
  <rect x="20" y="20" width="360" height="35" rx="6" fill="#1e3a8a"/>
  <text x="200" y="42" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#ffffff">REPÚBLICA DE ANGOLA • DNVT</text>
  <rect x="30" y="75" width="80" height="100" rx="6" fill="#e2e8f0" stroke="#94a3b8"/>
  <circle cx="70" cy="110" r="22" fill="#64748b"/>
  <path d="M 45 160 Q 70 135 95 160" fill="#64748b"/>
  <text x="130" y="95" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#0f172a">CARTA DE CONDUÇÃO PROFISSIONAL</text>
  <text x="130" y="120" font-family="Arial, sans-serif" font-size="10" fill="#475569">Categoria: Ligeiro / Pesado Transporte Colectivo</text>
  <text x="130" y="145" font-family="Arial, sans-serif" font-size="10" fill="#475569">Válida em todo o território nacional</text>
  <rect x="130" y="170" width="230" height="25" rx="4" fill="#eff6ff" stroke="#bfdbfe"/>
  <text x="140" y="186" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#1d4ed8">HOMOLOGAÇÃO ANATA / ATL ACTIVA</text>
</svg>`);

export const DOC_LIVRETE_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250">
  <rect width="400" height="250" rx="14" fill="#fffbeb" stroke="#d97706" stroke-width="2"/>
  <rect x="20" y="20" width="360" height="35" rx="6" fill="#78350f"/>
  <text x="200" y="42" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#ffffff">LIVRETE / TÍTULO DE PROPRIEDADE AUTOMÓVEL</text>
  <text x="30" y="90" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#451a03">Marca / Modelo: Toyota Hiace (15 Lugares)</text>
  <text x="30" y="115" font-family="Arial, sans-serif" font-size="11" fill="#78350f">Cor: Azul e Branco Regulamentar</text>
  <text x="30" y="140" font-family="Arial, sans-serif" font-size="11" fill="#78350f">Combustível: Gasóleo • Cilindrada: 2982 cc</text>
  <text x="30" y="165" font-family="Arial, sans-serif" font-size="11" fill="#78350f">Finalidade: Transporte Público Urbano de Passageiros</text>
  <rect x="30" y="190" width="340" height="30" rx="6" fill="#fef3c7" stroke="#f59e0b"/>
  <text x="40" y="210" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#92400e">INSPECÇÃO TÉCNICA E SEGURO OBRIGATÓRIO VÁLIDOS</text>
</svg>`);

export const DOC_BI_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250">
  <rect width="400" height="250" rx="14" fill="#f0fdf4" stroke="#059669" stroke-width="2"/>
  <rect x="20" y="20" width="360" height="35" rx="6" fill="#065f46"/>
  <text x="200" y="42" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#ffffff">REPÚBLICA DE ANGOLA • BILHETE DE IDENTIDADE</text>
  <rect x="30" y="75" width="80" height="100" rx="6" fill="#d1fae5" stroke="#10b981"/>
  <circle cx="70" cy="110" r="22" fill="#047857"/>
  <path d="M 45 160 Q 70 135 95 160" fill="#047857"/>
  <text x="130" y="95" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#064e3b">REGISTO DE IDENTIFICAÇÃO CIVIL</text>
  <text x="130" y="120" font-family="Arial, sans-serif" font-size="10" fill="#047857">Nacionalidade: Angolana • Sexo: M</text>
  <text x="130" y="145" font-family="Arial, sans-serif" font-size="10" fill="#047857">Emitido pelo Arquivo de Identificação de Luanda</text>
  <rect x="130" y="170" width="230" height="25" rx="4" fill="#ecfdf5" stroke="#a7f3d0"/>
  <text x="140" y="186" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#065f46">DOCUMENTO AUTÊNTICO E HOMOLOGADO</text>
</svg>`);

// 1. Passageiros Iniciais
export const INITIAL_PASSENGERS: PassengerRecord[] = [
  {
    id: 'pass-01',
    nome: 'Teresa da Silva',
    telefone: '+244 923 442 109',
    biNumero: '002918231LA041',
    saldoKz: 4800,
    viagensRealizadas: 34,
    dataRegisto: '12/01/2026',
    status: 'ativo',
    municipioHabitual: 'Belas (Kilamba)',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'pass-02',
    nome: 'António Maciel',
    telefone: '+244 912 884 921',
    biNumero: '005721992LA089',
    saldoKz: 1200,
    viagensRealizadas: 18,
    dataRegisto: '22/01/2026',
    status: 'ativo',
    municipioHabitual: 'Viana',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'pass-03',
    nome: 'Maria Fernandes Luamba',
    telefone: '+244 931 556 780',
    biNumero: '004128941LA012',
    saldoKz: 15400,
    viagensRealizadas: 67,
    dataRegisto: '05/01/2026',
    status: 'ativo',
    municipioHabitual: 'Luanda (Maianga)',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'pass-04',
    nome: 'Pedro Manuel Quicongo',
    telefone: '+244 944 112 334',
    biNumero: '001928371LA055',
    saldoKz: 0,
    viagensRealizadas: 4,
    dataRegisto: '10/02/2026',
    status: 'suspenso',
    motivoSuspensao: 'Tentativa recorrente de cancelamento abusivo após embarque.',
    municipioHabitual: 'Cacuaco',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'pass-05',
    nome: 'Esperança dos Santos',
    telefone: '+244 928 901 223',
    biNumero: '003891029LA077',
    saldoKz: 3500,
    viagensRealizadas: 29,
    dataRegisto: '18/01/2026',
    status: 'ativo',
    municipioHabitual: 'Talatona',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  },
];

// 2. Motoristas Iniciais
export const INITIAL_DRIVERS: DriverRecord[] = [
  {
    id: 'driv-01',
    nomeCompleto: 'João Manuel',
    telefone: '+244 923 881 002',
    numeroCarta: 'CARTA-001',
    numeroBi: '004829104LA049',
    matricula: 'LD-00-00-XX',
    tipoViatura: 'Táxi Colectivo',
    modeloViatura: 'Toyota Hiace (Azul/Branco)',
    anoViatura: 2021,
    lotacaoLugares: 15,
    pracaOrigemId: 'kilamba',
    rotaDestino: 'Mutamba',
    statusConta: 'pendente',
    viaturaAprovada: true,
    associacao: 'ANATA',
    dataRegisto: '14/10/2026',
    fotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    documentos: {
      cartaFrente: DOC_CARTA_SVG,
      cartaVerso: DOC_CARTA_SVG,
      biFrente: DOC_CARTA_SVG,
      livrete: DOC_LIVRETE_SVG,
      inspecaoTecnica: DOC_LIVRETE_SVG,
      seguroObrigatorio: DOC_LIVRETE_SVG,
    },
    cotasEmDia: true,
    pontuacaoAvaliacao: 4.8,
  },
  {
    id: 'driv-pedro',
    nomeCompleto: 'Pedro Ribeiro',
    telefone: '+244 923 112 445',
    numeroCarta: 'CARTA-9920',
    numeroBi: '004829434LA049',
    matricula: 'LD-44-89-XX',
    tipoViatura: 'Táxi Colectivo',
    modeloViatura: 'Toyota Hiace 15L',
    anoViatura: 2023,
    lotacaoLugares: 15,
    pracaOrigemId: 'saopaulo',
    rotaDestino: 'Benfica',
    statusConta: 'pendente',
    viaturaAprovada: false,
    associacao: 'ANATA',
    dataRegisto: '15/10/2026',
    fotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    fotoViatura: '/src/assets/images/angola_taxi_hiace_1791809024746.jpg',
    documentos: {
      cartaFrente: DOC_CARTA_SVG,
      cartaVerso: DOC_CARTA_SVG,
      biFrente: DOC_BI_SVG,
      biVerso: DOC_BI_SVG,
      livrete: DOC_LIVRETE_SVG,
      inspecaoTecnica: DOC_LIVRETE_SVG,
      seguroObrigatorio: DOC_LIVRETE_SVG,
    },
    cotasEmDia: true,
    pontuacaoAvaliacao: 5.0,
  },
  {
    id: 'driv-02',
    nomeCompleto: 'Manuel Bento Cândido',
    telefone: '+244 912 443 219',
    numeroCarta: 'CARTA-088',
    numeroBi: '001928341LA092',
    matricula: 'LD-44-21-GP',
    tipoViatura: 'Táxi Colectivo',
    modeloViatura: 'Toyota Hiace (Azul/Branco)',
    anoViatura: 2022,
    lotacaoLugares: 15,
    pracaOrigemId: 'viana',
    rotaDestino: 'São Paulo',
    statusConta: 'aprovado',
    viaturaAprovada: true,
    associacao: 'ANATA',
    dataRegisto: '03/01/2026',
    dataAprovacao: '04/01/2026',
    fotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    documentos: {
      cartaFrente: DOC_CARTA_SVG,
      cartaVerso: DOC_CARTA_SVG,
      biFrente: DOC_CARTA_SVG,
      livrete: DOC_LIVRETE_SVG,
      inspecaoTecnica: DOC_LIVRETE_SVG,
      seguroObrigatorio: DOC_LIVRETE_SVG,
    },
    cotasEmDia: true,
    pontuacaoAvaliacao: 4.9,
  },
  {
    id: 'driv-03',
    nomeCompleto: 'Domingos Gaspar Neto',
    telefone: '+244 931 990 123',
    numeroCarta: 'CARTA-104',
    numeroBi: '003819201LA073',
    matricula: 'LD-12-89-AO',
    tipoViatura: 'Minibus Urbano',
    modeloViatura: 'Toyota Coaster (Azul/Branco)',
    anoViatura: 2020,
    lotacaoLugares: 26,
    pracaOrigemId: 'mutamba',
    rotaDestino: 'Benfica',
    statusConta: 'aprovado',
    viaturaAprovada: true,
    associacao: 'ATL',
    dataRegisto: '15/01/2026',
    dataAprovacao: '16/01/2026',
    fotoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    documentos: {
      cartaFrente: DOC_CARTA_SVG,
      cartaVerso: DOC_CARTA_SVG,
      biFrente: DOC_CARTA_SVG,
      livrete: DOC_LIVRETE_SVG,
      inspecaoTecnica: DOC_LIVRETE_SVG,
      seguroObrigatorio: DOC_LIVRETE_SVG,
    },
    cotasEmDia: true,
    pontuacaoAvaliacao: 4.7,
  },
  {
    id: 'driv-04',
    nomeCompleto: 'Mateus Zua Panzo',
    telefone: '+244 945 221 889',
    numeroCarta: 'CARTA-302',
    numeroBi: '009281726LA019',
    matricula: 'LD-98-33-LA',
    tipoViatura: 'Táxi Colectivo',
    modeloViatura: 'Toyota Hiace (Azul/Branco)',
    anoViatura: 2019,
    lotacaoLugares: 15,
    pracaOrigemId: 'saopaulo',
    rotaDestino: 'Cacuaco',
    statusConta: 'pendente',
    viaturaAprovada: false,
    associacao: 'ANATA',
    dataRegisto: '12/10/2026',
    fotoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    documentos: {
      cartaFrente: DOC_CARTA_SVG,
      cartaVerso: DOC_CARTA_SVG,
      biFrente: DOC_CARTA_SVG,
      livrete: DOC_LIVRETE_SVG,
      inspecaoTecnica: DOC_LIVRETE_SVG,
      seguroObrigatorio: DOC_LIVRETE_SVG,
    },
    cotasEmDia: false,
    pontuacaoAvaliacao: 4.2,
  },
  {
    id: 'driv-05',
    nomeCompleto: 'Sebastião Quaresma',
    telefone: '+244 928 334 112',
    numeroCarta: 'CARTA-411',
    numeroBi: '007182930LA061',
    matricula: 'LD-55-10-BC',
    tipoViatura: 'Táxi Colectivo',
    modeloViatura: 'Toyota Hiace (Azul/Branco)',
    anoViatura: 2018,
    lotacaoLugares: 15,
    pracaOrigemId: 'benfica',
    rotaDestino: 'Mutamba',
    statusConta: 'suspenso',
    motivoSuspensao: 'Cobrança ilícita de preço duplo (encurtamento de rota na paragem da Filda).',
    viaturaAprovada: true,
    associacao: 'ANATA',
    dataRegisto: '20/12/2025',
    fotoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    documentos: {
      cartaFrente: DOC_CARTA_SVG,
      cartaVerso: DOC_CARTA_SVG,
      biFrente: DOC_CARTA_SVG,
      livrete: DOC_LIVRETE_SVG,
      inspecaoTecnica: DOC_LIVRETE_SVG,
      seguroObrigatorio: DOC_LIVRETE_SVG,
    },
    cotasEmDia: false,
    pontuacaoAvaliacao: 3.6,
  },
];

// 3. Viaturas Iniciais
export const INITIAL_VEHICLES: VehicleRecord[] = [
  {
    id: 'veh-01',
    matricula: 'LD-00-00-XX',
    modelo: 'Toyota Hiace (Azul/Branco)',
    ano: 2021,
    lotacao: 15,
    cor: 'Azul e Branco Regulamentar',
    motoristaNome: 'João Manuel',
    proprietarioNome: 'Cooperativa Táxis do Sul de Luanda',
    inspecaoValidaAte: '15/12/2026',
    seguroValidoAte: '20/03/2027',
    status: 'Aprovada',
  },
  {
    id: 'veh-pedro',
    matricula: 'LD-44-89-XX',
    modelo: 'Toyota Hiace 15L',
    ano: 2023,
    lotacao: 15,
    cor: 'Azul e Branco Regulamentar',
    motoristaNome: 'Pedro Ribeiro',
    proprietarioNome: 'Pedro Ribeiro',
    inspecaoValidaAte: '15/10/2027',
    seguroValidoAte: '15/10/2027',
    status: 'Pendente',
  },
  {
    id: 'veh-02',
    matricula: 'LD-44-21-GP',
    modelo: 'Toyota Hiace (Azul/Branco)',
    ano: 2022,
    lotacao: 15,
    cor: 'Azul e Branco Regulamentar',
    motoristaNome: 'Manuel Bento Cândido',
    proprietarioNome: 'Empresa de Transportes Kwanza Lda',
    inspecaoValidaAte: '10/11/2026',
    seguroValidoAte: '15/01/2027',
    status: 'Aprovada',
  },
  {
    id: 'veh-03',
    matricula: 'LD-12-89-AO',
    modelo: 'Toyota Coaster (Azul/Branco)',
    ano: 2020,
    lotacao: 26,
    cor: 'Azul e Branco Regulamentar',
    motoristaNome: 'Domingos Gaspar Neto',
    proprietarioNome: 'Associação dos Taxistas de Luanda',
    inspecaoValidaAte: '05/08/2026',
    seguroValidoAte: '12/09/2026',
    status: 'Aprovada',
  },
  {
    id: 'veh-04',
    matricula: 'LD-98-33-LA',
    modelo: 'Toyota Hiace (Azul/Branco)',
    ano: 2019,
    lotacao: 15,
    cor: 'Azul e Branco Regulamentar',
    motoristaNome: 'Mateus Zua Panzo',
    proprietarioNome: 'Mateus Zua Panzo',
    inspecaoValidaAte: '18/06/2026',
    seguroValidoAte: '18/07/2026',
    status: 'Pendente',
  },
  {
    id: 'veh-05',
    matricula: 'LD-55-10-BC',
    modelo: 'Toyota Hiace (Azul/Branco)',
    ano: 2018,
    lotacao: 15,
    cor: 'Azul e Branco Regulamentar',
    motoristaNome: 'Sebastião Quaresma',
    proprietarioNome: 'Sebastião Quaresma',
    inspecaoValidaAte: '01/04/2026',
    seguroValidoAte: '01/05/2026',
    status: 'Bloqueada',
    motivoBloqueio: 'Bloqueio administrativo cautelar por infração tarifária.',
  },
];

// 4. Fiscais Iniciais
export const INITIAL_FISCAIS: FiscalRecord[] = [
  {
    id: 'FISC-LU-042',
    nome: 'Mateus Afonso Domingos',
    contacto: '+244 923 456 789',
    numeroFuncionario: 'F-042',
    identificacaoFuncional: 'ANATA-FIS-042/LU',
    associacao: 'ANATA',
    pracaAtribuidaId: 'saopaulo',
    pracaAtribuidaNome: 'Praça de São Paulo',
    pracasAtribuidas: ['saopaulo', 'mutamba'],
    areaTrabalho: 'Baia Principal / Corredor Cacuaco & Viana',
    turno: 'Manhã (05:30 - 13:30)',
    status: 'ativo',
    totalDespachosHoje: 48,
    dataAutorizacao: '15/01/2026',
    senhaHash: 'secure_hash_123',
    permissoes: {
      validacaoPresencial: true,
      gestaoBaia: true,
      registoOcorrencias: true,
      correcoesFila: true,
      conferenciaTaxas: true,
    },
    fotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    biNumero: '003948291LA042',
    biFotoFrente: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&auto=format&fit=crop&q=80',
    biFotoVerso: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80',
    auditLog: [
      { id: 'aud-1', data: '15/01/2026 08:30', acao: 'Conta criada e autorizada pelo Administrador GPL', autor: 'Admin GPL / ANATA' }
    ]
  },
  {
    id: 'FISC-LU-018',
    nome: 'António Kapita',
    contacto: '+244 912 334 455',
    numeroFuncionario: 'F-018',
    identificacaoFuncional: 'ATL-FIS-018/LU',
    associacao: 'ATL',
    pracaAtribuidaId: 'viana',
    pracaAtribuidaNome: 'Praça de Viana (Estalagem)',
    pracasAtribuidas: ['viana'],
    areaTrabalho: 'Baia 02 / Corredor Estrada de Catete',
    turno: 'Integral',
    status: 'ativo',
    totalDespachosHoje: 62,
    dataAutorizacao: '02/02/2026',
    senhaHash: 'secure_hash_456',
    permissoes: {
      validacaoPresencial: true,
      gestaoBaia: true,
      registoOcorrencias: true,
      correcoesFila: true,
      conferenciaTaxas: true,
    },
    fotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    biNumero: '004829102LA018',
    biFotoFrente: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&auto=format&fit=crop&q=80',
    biFotoVerso: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80',
    auditLog: [
      { id: 'aud-2', data: '02/02/2026 09:15', acao: 'Conta criada e autorizada pelo Administrador ATL', autor: 'Admin GPL / ANATA' }
    ]
  },
  {
    id: 'FISC-LU-077',
    nome: 'Bernardo Kiala Zua',
    contacto: '+244 931 778 990',
    numeroFuncionario: 'F-077',
    identificacaoFuncional: 'GPL-FIS-077/LU',
    associacao: 'GPL',
    pracaAtribuidaId: 'mutamba',
    pracaAtribuidaNome: 'Praça da Mutamba',
    pracasAtribuidas: ['mutamba', 'cacuaco'],
    areaTrabalho: 'Terminal Centro / Baia 01 & 02',
    turno: 'Tarde (13:30 - 21:30)',
    status: 'ativo',
    totalDespachosHoje: 35,
    dataAutorizacao: '10/02/2026',
    senhaHash: 'secure_hash_789',
    permissoes: {
      validacaoPresencial: true,
      gestaoBaia: true,
      registoOcorrencias: true,
      correcoesFila: false,
      conferenciaTaxas: true,
    },
    fotoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    biNumero: '002938481LA077',
    biFotoFrente: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&auto=format&fit=crop&q=80',
    biFotoVerso: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80',
    auditLog: [
      { id: 'aud-3', data: '10/02/2026 11:00', acao: 'Conta criada pelo Administrador GPL', autor: 'Admin GPL / ANATA' }
    ]
  },
  {
    id: 'FISC-LU-093',
    nome: 'Simão Bartolomeu',
    contacto: '+244 944 892 110',
    numeroFuncionario: 'F-093',
    identificacaoFuncional: 'ANATA-FIS-093/LU',
    associacao: 'ANATA',
    pracaAtribuidaId: 'kilamba',
    pracaAtribuidaNome: 'Praça do Kilamba',
    pracasAtribuidas: ['kilamba'],
    areaTrabalho: 'Bloco W • Terminal Sul',
    turno: 'Manhã (05:30 - 13:30)',
    status: 'ativo',
    totalDespachosHoje: 41,
    dataAutorizacao: '20/02/2026',
    senhaHash: 'secure_hash_999',
    permissoes: {
      validacaoPresencial: true,
      gestaoBaia: true,
      registoOcorrencias: true,
      correcoesFila: true,
      conferenciaTaxas: true,
    },
    fotoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    biNumero: '005928102LA093',
    biFotoFrente: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&auto=format&fit=crop&q=80',
    biFotoVerso: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80',
    auditLog: [
      { id: 'aud-4', data: '20/02/2026 08:00', acao: 'Conta criada pelo Administrador ANATA', autor: 'Admin GPL / ANATA' }
    ]
  },
];

// 5. Praças Adaptadas dos dados existentes
export const INITIAL_PRACAS: PracaRecord[] = LUANDA_PRACAS.map((p) => {
  const taxaPadrao = p.id === 'cacuaco' ? 300 : p.taxaKz || (p.id === 'saopaulo' ? 200 : p.id === 'viana' ? 200 : 500);
  const nomePadrao = p.id === 'cacuaco' ? 'Praça Cacuaco 300kz' : `${p.name} ${taxaPadrao}kz`;
  return {
    id: p.id,
    name: p.name,
    subtitle: p.subtitle,
    lat: p.lat,
    lng: p.lng,
    municipio:
      p.id === 'kilamba'
        ? 'Belas'
        : p.id === 'cacuaco'
        ? 'Cacuaco'
        : p.id === 'viana'
        ? 'Viana'
        : p.id === 'mutamba'
        ? 'Luanda (Ingombota)'
        : p.id === 'benfica'
        ? 'Talatona'
        : p.id === 'talatona'
        ? 'Talatona'
        : 'Sambizanga (Luanda)',
    corridor: p.corridor,
    naFila: p.naFila,
    noCais: p.noCais,
    capacidadeTotal: p.naFila + 20,
    minEspera: p.minEspera,
    status: p.status === 'Movimento Intenso' ? 'Movimento Intenso' : 'Operacional',
    destinations: p.destinations,
    taxaKz: taxaPadrao,
    nomeTaxa: nomePadrao,
    dataAtualizacaoTaxa: '15/01/2026',
    fiscaisAtribuidos:
      p.id === 'saopaulo'
        ? ['Mateus Afonso Domingos']
        : p.id === 'viana'
        ? ['António Kapita']
        : p.id === 'mutamba'
        ? ['Bernardo Kiala Zua']
        : ['Simão Bartolomeu'],
  };
});

// 6. Rotas Iniciais
export const INITIAL_ROUTES: RouteRecord[] = [
  {
    id: 'rot-01',
    nome: 'Kilamba ⇄ Mutamba (Via Expressa / 21 de Janeiro)',
    origemId: 'kilamba',
    origemNome: 'Praça do Kilamba',
    destinoId: 'mutamba',
    destinoNome: 'Praça da Mutamba',
    tipoTransporte: 'Carrinha 15L (Azul/Branco)',
    tarifaKz: 500,
    distanciaKm: 28.5,
    tempoEstimadoMin: 45,
    status: 'ativa',
    fiscaisSupervisores: ['Simão Bartolomeu', 'Bernardo Kiala Zua'],
  },
  {
    id: 'rot-02',
    nome: 'Viana (Estalagem) ⇄ São Paulo (Estrada de Catete / Deolinda)',
    origemId: 'viana',
    origemNome: 'Praça de Viana',
    destinoId: 'saopaulo',
    destinoNome: 'Praça de São Paulo',
    tipoTransporte: 'Carrinha 15L (Azul/Branco)',
    tarifaKz: 500,
    distanciaKm: 18.2,
    tempoEstimadoMin: 35,
    status: 'ativa',
    fiscaisSupervisores: ['António Kapita', 'Mateus Afonso Domingos'],
  },
  {
    id: 'rot-03',
    nome: 'Benfica ⇄ Mutamba (EN 100 / Corredor Sul)',
    origemId: 'benfica',
    origemNome: 'Praça do Benfica',
    destinoId: 'mutamba',
    destinoNome: 'Praça da Mutamba',
    tipoTransporte: 'Carrinha 15L (Azul/Branco)',
    tarifaKz: 500,
    distanciaKm: 22.0,
    tempoEstimadoMin: 40,
    status: 'ativa',
    fiscaisSupervisores: ['Bernardo Kiala Zua'],
  },
  {
    id: 'rot-04',
    nome: 'Kilamba ⇄ Viana (Via Expressa Transversal)',
    origemId: 'kilamba',
    origemNome: 'Praça do Kilamba',
    destinoId: 'viana',
    destinoNome: 'Praça de Viana',
    tipoTransporte: 'Express Direto (15L)',
    tarifaKz: 500,
    distanciaKm: 16.0,
    tempoEstimadoMin: 25,
    status: 'ativa',
    fiscaisSupervisores: ['Simão Bartolomeu', 'António Kapita'],
  },
  {
    id: 'rot-05',
    nome: 'Talatona ⇄ São Paulo (Van-Dúnem Loy / Samba)',
    origemId: 'talatona',
    origemNome: 'Praça de Talatona',
    destinoId: 'saopaulo',
    destinoNome: 'Praça de São Paulo',
    tipoTransporte: 'Carrinha 15L (Azul/Branco)',
    tarifaKz: 500,
    distanciaKm: 19.5,
    tempoEstimadoMin: 38,
    status: 'ativa',
    fiscaisSupervisores: ['Mateus Afonso Domingos'],
  },
  {
    id: 'rot-06',
    nome: 'São Paulo ⇄ Cacuaco (Eixo Norte)',
    origemId: 'saopaulo',
    origemNome: 'Praça de São Paulo',
    destinoId: 'cacuaco',
    destinoNome: 'Praça de Cacuaco',
    tipoTransporte: 'Carrinha 15L (Azul/Branco)',
    tarifaKz: 300,
    distanciaKm: 14.2,
    tempoEstimadoMin: 30,
    status: 'ativa',
    nomeTaxa: 'Praça Cacuaco 300kz',
    dataAtualizacaoTaxa: '15/01/2026',
    fiscaisSupervisores: ['Mateus Afonso Domingos'],
  },
];

// 7. Filas Iniciais por Praça
export const INITIAL_QUEUES: QueueItemRecord[] = [
  {
    id: 'q-01',
    pracaId: 'kilamba',
    posicao: 1,
    motoristaId: 'driv-01',
    motoristaNome: 'João Manuel',
    matricula: 'LD-00-00-XX',
    tempoEsperaMin: 4,
    status: 'no_cais',
    passageirosEmbarcados: 14,
    lotacaoMaxima: 15,
    ultimaIntervencaoFiscal: 'Cais 01 liberado pelo Fiscal Simão B.',
    notificadoCais: true,
  },
  {
    id: 'q-02',
    pracaId: 'kilamba',
    posicao: 2,
    motoristaId: 'driv-02',
    motoristaNome: 'Manuel Bento Cândido',
    matricula: 'LD-44-21-GP',
    tempoEsperaMin: 9,
    status: 'em_embarque',
    passageirosEmbarcados: 7,
    lotacaoMaxima: 15,
  },
  {
    id: 'q-03',
    pracaId: 'kilamba',
    posicao: 3,
    motoristaId: 'driv-03',
    motoristaNome: 'Domingos Gaspar Neto',
    matricula: 'LD-12-89-AO',
    tempoEsperaMin: 16,
    status: 'em_fila',
    passageirosEmbarcados: 0,
    lotacaoMaxima: 26,
  },
  {
    id: 'q-04',
    pracaId: 'kilamba',
    posicao: 4,
    motoristaId: 'driv-04',
    motoristaNome: 'Mateus Zua Panzo',
    matricula: 'LD-98-33-LA',
    tempoEsperaMin: 22,
    status: 'em_fila',
    passageirosEmbarcados: 0,
    lotacaoMaxima: 15,
  },
  {
    id: 'q-05',
    pracaId: 'kilamba',
    posicao: 5,
    motoristaId: 'driv-06',
    motoristaNome: 'Filipe Samba',
    matricula: 'LD-71-02-KL',
    tempoEsperaMin: 28,
    status: 'ausente',
    passageirosEmbarcados: 0,
    lotacaoMaxima: 15,
    ultimaIntervencaoFiscal: 'Chamada emitida sem resposta há 10 min.',
  },
];

// 8. Intervenções Fiscais e Administrativas
export const INITIAL_INTERVENTIONS: QueueInterventionRecord[] = [
  {
    id: 'int-01',
    timestamp: '14/10/2026 10:14:22',
    pracaNome: 'Praça do Kilamba',
    motoristaNome: 'Filipe Samba',
    matricula: 'LD-71-02-KL',
    tipoIntervencao: 'Retirar por Ausência',
    realizadoPor: 'Fiscal Simão Bartolomeu',
    justificativaObrigatoria: 'Motorista ausente do veículo por mais de 15 minutos durante chamada de baia.',
    resultado: 'Passado para final da fila após conferência.',
  },
  {
    id: 'int-02',
    timestamp: '14/10/2026 09:30:05',
    pracaNome: 'Praça de Viana',
    motoristaNome: 'Manuel Bento Cândido',
    matricula: 'LD-44-21-GP',
    tipoIntervencao: 'Prioridade Mecânica',
    realizadoPor: 'Administrador Central',
    justificativaObrigatoria: 'Retorno de reparo de pneu certificado pelo posto oficial ANATA.',
    resultado: 'Posicionado no Cais 02 para despacho prioritário.',
  },
  {
    id: 'int-03',
    timestamp: '14/10/2026 08:45:12',
    pracaNome: 'Praça de São Paulo',
    motoristaNome: 'Sebastião Quaresma',
    matricula: 'LD-55-10-BC',
    tipoIntervencao: 'Despacho Cautelar',
    realizadoPor: 'Fiscal Mateus Afonso',
    justificativaObrigatoria: 'Suspeita de encurtamento na linha Cacuaco. Encaminhado para a sede ANATA.',
    resultado: 'Viatura suspensa até homologação disciplinar.',
  },
];

// 9. Viagens Administrativas
export const INITIAL_TRIPS: TripRecordAdmin[] = [
  {
    id: 'trip-01',
    codigo: 'FTX-2026-0941',
    passageiroNome: 'Teresa da Silva',
    passageiroTelefone: '+244 923 442 109',
    motoristaNome: 'João Manuel',
    matricula: 'LD-00-00-XX',
    origemNome: 'Praça do Kilamba',
    destinoNome: 'Praça da Mutamba',
    horaInicio: '10:15',
    estado: 'ongoing',
    valorKz: 500,
    metodoPagamento: 'Pagamento Digital',
    statusPagamento: 'Confirmado',
  },
  {
    id: 'trip-02',
    codigo: 'FTX-2026-0938',
    passageiroNome: 'António Maciel',
    passageiroTelefone: '+244 912 884 921',
    motoristaNome: 'Manuel Bento Cândido',
    matricula: 'LD-44-21-GP',
    origemNome: 'Praça de Viana',
    destinoNome: 'Praça de São Paulo',
    horaInicio: '09:20',
    horaFim: '09:55',
    estado: 'completed',
    valorKz: 500,
    metodoPagamento: 'Dinheiro',
    statusPagamento: 'Confirmado',
  },
  {
    id: 'trip-03',
    codigo: 'FTX-2026-0935',
    passageiroNome: 'Maria Fernandes Luamba',
    passageiroTelefone: '+244 931 556 780',
    motoristaNome: 'Domingos Gaspar Neto',
    matricula: 'LD-12-89-AO',
    origemNome: 'Praça da Mutamba',
    destinoNome: 'Praça do Benfica',
    horaInicio: '08:40',
    horaFim: '09:25',
    estado: 'completed',
    valorKz: 500,
    metodoPagamento: 'Transferência Multicaixa',
    statusPagamento: 'Confirmado',
  },
  {
    id: 'trip-04',
    codigo: 'FTX-2026-0929',
    passageiroNome: 'Pedro Manuel Quicongo',
    passageiroTelefone: '+244 944 112 334',
    motoristaNome: 'Sebastião Quaresma',
    matricula: 'LD-55-10-BC',
    origemNome: 'Praça de São Paulo',
    destinoNome: 'Praça de Cacuaco',
    horaInicio: '07:50',
    estado: 'cancelled',
    valorKz: 500,
    metodoPagamento: 'Dinheiro',
    statusPagamento: 'Falhado',
    ocorrenciaAssociada: 'Motorista tentou desviar a rota no desvio da Cimangola.',
  },
  {
    id: 'trip-05',
    codigo: 'FTX-2026-0920',
    passageiroNome: 'Esperança dos Santos',
    passageiroTelefone: '+244 928 901 223',
    motoristaNome: 'Manuel Bento Cândido',
    matricula: 'LD-44-21-GP',
    origemNome: 'Praça de Talatona',
    destinoNome: 'Praça de São Paulo',
    horaInicio: '07:10',
    horaFim: '07:48',
    estado: 'completed',
    valorKz: 500,
    metodoPagamento: 'Pagamento Digital',
    statusPagamento: 'Confirmado',
  },
];

// 10. Pagamentos Registados
export const INITIAL_PAYMENTS: PaymentRecord[] = [
  {
    id: 'pay-01',
    referencia: 'REF-MCX-90182',
    valorKz: 500,
    metodo: 'Pagamento Digital',
    estado: 'Confirmado',
    prestadorConfirmado: true,
    dataHora: '14/10/2026 10:15:10',
    viagemId: 'trip-01',
    passageiroNome: 'Teresa da Silva',
    motoristaNome: 'João Manuel',
    descricao: 'Débito na Carteira Digital FilaTáxi AO • Viagem Kilamba-Mutamba',
  },
  {
    id: 'pay-02',
    referencia: 'REF-CASH-77120',
    valorKz: 500,
    metodo: 'Dinheiro',
    estado: 'Confirmado',
    prestadorConfirmado: true,
    dataHora: '14/10/2026 09:22:04',
    viagemId: 'trip-02',
    passageiroNome: 'António Maciel',
    motoristaNome: 'Manuel Bento Cândido',
    descricao: 'Pagamento físico em numerário verificado no cais pelo cobrador/fiscal.',
  },
  {
    id: 'pay-03',
    referencia: 'REF-EMIS-48190',
    valorKz: 500,
    metodo: 'Transferência Multicaixa',
    estado: 'Confirmado',
    prestadorConfirmado: true,
    dataHora: '14/10/2026 08:42:15',
    viagemId: 'trip-03',
    passageiroNome: 'Maria Fernandes Luamba',
    motoristaNome: 'Domingos Gaspar Neto',
    descricao: 'Transferência Multicaixa Express reconciliada via Banco BAI.',
  },
  {
    id: 'pay-04',
    referencia: 'REF-EXP-33219',
    valorKz: 500,
    metodo: 'Pagamento Digital',
    estado: 'Pendente',
    prestadorConfirmado: false,
    dataHora: '14/10/2026 10:35:40',
    viagemId: 'trip-pend-01',
    passageiroNome: 'Simão Kwanza',
    motoristaNome: 'João Manuel',
    descricao: 'Solicitação de recarga via Multicaixa Express (aguardando confirmação do gateway EMIS).',
  },
  {
    id: 'pay-05',
    referencia: 'REF-CASH-12998',
    valorKz: 500,
    metodo: 'Dinheiro',
    estado: 'Confirmado',
    prestadorConfirmado: true,
    dataHora: '14/10/2026 07:12:00',
    viagemId: 'trip-05',
    passageiroNome: 'Esperança dos Santos',
    motoristaNome: 'Manuel Bento Cândido',
    descricao: 'Pagamento de passagem regular no cais de Talatona.',
  },
];

// 11. Ocorrências Pendentes e Registadas
export const INITIAL_INCIDENTS: IncidentRecord[] = [
  {
    id: 'inc-01',
    codigo: 'OC-LU-2026-104',
    titulo: 'Denúncia de Encurtamento de Rota',
    tipo: 'Encurtamento de Rota',
    descricao:
      'Passageiros relatam que a carrinha LD-55-10-BC parou na Filda forçando os passageiros a pagar nova passagem para a Mutamba.',
    motoristaNome: 'Sebastião Quaresma',
    passageiroNome: 'Pedro Manuel Quicongo',
    praca: 'Praça de São Paulo',
    dataHora: '14/10/2026 08:00',
    status: 'Em Averiguação',
    acaoTomada: 'Motorista notificado pela comissão disciplinar da ANATA. Conta suspensa preventivamente.',
    severidade: 'alta',
  },
  {
    id: 'inc-02',
    codigo: 'OC-LU-2026-105',
    titulo: 'Vistoria Documental Inconforme no Cais',
    tipo: 'Documentação Irregular',
    descricao:
      'Livrete da viatura LD-98-33-LA com selo de inspecção periódica rasurado durante conferência do Fiscal.',
    motoristaNome: 'Mateus Zua Panzo',
    praca: 'Praça de São Paulo',
    dataHora: '14/10/2026 09:15',
    status: 'Pendente',
    acaoTomada: 'Homologação travada até apresentação do duplicado emitido pela DNVT.',
    severidade: 'media',
  },
  {
    id: 'inc-03',
    codigo: 'OC-LU-2026-098',
    titulo: 'Avaria Mecânica na Baia 02',
    tipo: 'Avaria na Via',
    descricao:
      'Superaquecimento no radiador da viatura ao entrar no cais de embarque, causando bloqueio parcial de 10 minutos.',
    motoristaNome: 'Filipe Samba',
    praca: 'Praça do Kilamba',
    dataHora: '13/10/2026 17:30',
    status: 'Resolvido',
    acaoTomada: 'Viatura rebocada e fila reordenada pelo Fiscal de serviço.',
    severidade: 'baixa',
  },
];
