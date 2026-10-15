/**
 * FilaTáxi AO - Ecossistema Integrado de Mobilidade Urbana de Luanda
 * Tipos e Modelos Compartilhados entre Passageiro, Motorista, Fiscal e Administrador
 */

export type UserRole = 'passenger' | 'driver' | 'inspector' | 'admin';

export interface AuthUser {
  id: string;
  nome: string;
  telefone: string;
  role: UserRole;
  dataLogin: string;
  token?: string;
  avatarUrl?: string;
}

export type AdminTab =
  | 'dashboard'
  | 'users'
  | 'fiscais-mgmt'
  | 'pracas'
  | 'queues'
  | 'trips'
  | 'payments'
  | 'reports';

export interface PassengerRecord {
  id: string;
  nome: string;
  telefone: string;
  biNumero: string;
  saldoKz: number;
  viagensRealizadas: number;
  dataRegisto: string;
  status: 'ativo' | 'suspenso';
  motivoSuspensao?: string;
  municipioHabitual: string;
  avatarUrl?: string;
}

export interface DriverRecord {
  id: string;
  nomeCompleto: string;
  telefone: string;
  numeroCarta: string;
  numeroBi: string;
  matricula: string;
  tipoViatura: string;
  modeloViatura: string;
  anoViatura: number;
  lotacaoLugares: number;
  pracaOrigemId: string;
  rotaDestino: string;
  statusConta: 'pendente' | 'aprovado' | 'rejeitado' | 'suspenso';
  viaturaAprovada: boolean;
  motivoRejeicao?: string;
  motivoSuspensao?: string;
  associacao: 'ANATA' | 'ATL' | 'GPL' | 'Independente';
  dataRegisto: string;
  dataAprovacao?: string;
  fotoUrl: string;
  fotoViatura?: string;
  documentos: {
    cartaFrente: string;
    cartaVerso: string;
    biFrente: string;
    biVerso?: string;
    livrete: string;
    inspecaoTecnica: string;
    seguroObrigatorio: string;
  };
  cotasEmDia: boolean;
  pontuacaoAvaliacao: number;
}

export interface VehicleRecord {
  id: string;
  matricula: string;
  modelo: string;
  ano: number;
  lotacao: number;
  cor: string;
  motoristaNome: string;
  proprietarioNome: string;
  inspecaoValidaAte: string;
  seguroValidoAte: string;
  status: 'Aprovada' | 'Pendente' | 'Bloqueada';
  motivoBloqueio?: string;
}

export interface FiscalPermissions {
  validacaoPresencial: boolean;
  gestaoBaia: boolean;
  registoOcorrencias: boolean;
  correcoesFila: boolean;
  conferenciaTaxas: boolean;
}

export interface AuditLogItem {
  id: string;
  data: string;
  acao: string;
  autor: string;
}

export interface FiscalRecord {
  id: string;
  nome: string;
  contacto: string;
  numeroFuncionario: string;
  identificacaoFuncional: string;
  associacao: 'ANATA' | 'ATL' | 'GPL';
  pracaAtribuidaId: string;
  pracaAtribuidaNome: string;
  pracasAtribuidas: string[]; // IDs das praças atribuídas
  areaTrabalho: string;
  turno: 'Manhã (05:30 - 13:30)' | 'Tarde (13:30 - 21:30)' | 'Noite (21:30 - 05:30)' | 'Integral';
  status: 'ativo' | 'suspenso' | 'desativado' | 'pendente_autorizacao';
  totalDespachosHoje: number;
  dataAutorizacao: string;
  senhaHash?: string; // Credencial segura (armazenada de forma cifrada/hash)
  permissoes: FiscalPermissions;
  fotoUrl?: string;
  biNumero?: string;
  biFotoFrente?: string;
  biFotoVerso?: string;
  auditLog: AuditLogItem[];
}

export interface PracaRecord {
  id: string;
  name: string;
  subtitle: string;
  lat: number;
  lng: number;
  municipio: string;
  corridor: string;
  naFila: number;
  noCais: number;
  capacidadeTotal: number;
  minEspera: string;
  status: 'Operacional' | 'Movimento Intenso' | 'Em Obras' | 'Condicionada';
  destinations: string[];
  fiscaisAtribuidos: string[];
  taxaKz?: number; // Taxa de transporte / Tarifa regulamentada exclusivamente pelo Administrador (Ex: 300 Kz)
  nomeTaxa?: string; // Designação personalizada da Taxa pelo Administrador (Ex: "Praça Cacuaco 300kz")
  dataAtualizacaoTaxa?: string; // Data da última fixação/renomeação da taxa
}

export interface RouteRecord {
  id: string;
  nome: string;
  origemId: string;
  origemNome: string;
  destinoId: string;
  destinoNome: string;
  tipoTransporte: 'Carrinha 15L (Azul/Branco)' | 'Express Direto (15L)' | 'Autocarro Urbano (TCUL)' | 'Carro de Praça (4L)';
  tarifaKz: number;
  distanciaKm: number;
  tempoEstimadoMin: number;
  status: 'ativa' | 'desativada';
  fiscaisSupervisores: string[];
  nomeTaxa?: string; // Designação oficial da Taxa (Ex: "Praça Cacuaco 300kz")
  dataAtualizacaoTaxa?: string;
}

export interface QueueItemRecord {
  id: string;
  pracaId: string;
  posicao: number;
  motoristaId: string;
  motoristaNome: string;
  matricula: string;
  tempoEsperaMin: number;
  status: 'no_cais' | 'em_fila' | 'ausente' | 'em_embarque';
  passageirosEmbarcados: number;
  lotacaoMaxima: number;
  ultimaIntervencaoFiscal?: string;
  notificadoCais?: boolean;
}

export interface QueueInterventionRecord {
  id: string;
  timestamp: string;
  pracaNome: string;
  motoristaNome: string;
  matricula: string;
  tipoIntervencao:
    | 'Reordenar Fila'
    | 'Prioridade Mecânica'
    | 'Retirar por Ausência'
    | 'Chamada de Urgência'
    | 'Despacho Cautelar'
    | 'Reposicionamento Baia';
  realizadoPor: string;
  justificativaObrigatoria: string;
  resultado: string;
}

export interface TripRecordAdmin {
  id: string;
  codigo: string;
  passageiroNome: string;
  passageiroTelefone: string;
  motoristaNome: string;
  matricula: string;
  origemNome: string;
  destinoNome: string;
  horaInicio: string;
  horaFim?: string;
  estado: 'ongoing' | 'completed' | 'cancelled';
  valorKz: number;
  metodoPagamento: 'Dinheiro' | 'Transferência Multicaixa' | 'Pagamento Digital';
  statusPagamento: 'Confirmado' | 'Pendente' | 'Falhado';
  ocorrenciaAssociada?: string;
}

export interface PaymentRecord {
  id: string;
  referencia: string;
  valorKz: number;
  metodo: 'Dinheiro' | 'Transferência Multicaixa' | 'Pagamento Digital';
  estado: 'Confirmado' | 'Pendente' | 'Falhado';
  prestadorConfirmado: boolean;
  comprovativoUrl?: string;
  dataHora: string;
  viagemId: string;
  passageiroNome: string;
  motoristaNome: string;
  descricao: string;
}

export interface IncidentRecord {
  id: string;
  codigo: string;
  titulo: string;
  tipo:
    | 'Encurtamento de Rota'
    | 'Tarifa Especulativa'
    | 'Superlotação'
    | 'Avaria na Via'
    | 'Desentendimento'
    | 'Documentação Irregular';
  descricao: string;
  motoristaNome?: string;
  passageiroNome?: string;
  praca: string;
  dataHora: string;
  status: 'Pendente' | 'Em Averiguação' | 'Resolvido';
  acaoTomada?: string;
  severidade: 'baixa' | 'media' | 'alta' | 'critica';
}
