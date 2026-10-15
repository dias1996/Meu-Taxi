import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import {
  DriverRecord,
  PassengerRecord,
  TripRecordAdmin,
  PaymentRecord,
  PracaRecord,
  QueueItemRecord,
  IncidentRecord,
  FiscalRecord,
} from '../types/ecosystem';

export interface ReportDataBundle {
  title: string;
  generatedAt: string;
  generatedBy: string;
  passengers: PassengerRecord[];
  drivers: DriverRecord[];
  trips: TripRecordAdmin[];
  payments: PaymentRecord[];
  pracas: PracaRecord[];
  queues: QueueItemRecord[];
  incidents: IncidentRecord[];
  fiscais: FiscalRecord[];
}

/**
 * Exporta os dados operacionais para ficheiro Excel (.xlsx) real
 */
export function exportToExcel(bundle: ReportDataBundle, moduleFilter?: string) {
  const wb = XLSX.utils.book_new();

  // 1. Planilha Resumo & KPIs
  const resumoData = [
    ['REPÚBLICA DE ANGOLA - SISTEMA FILATÁXI AO'],
    ['RELATÓRIO OPERACIONAL ADMINISTRATIVO - LUANDA'],
    ['Data de Emissão:', bundle.generatedAt],
    ['Emitido por:', bundle.generatedBy],
    [''],
    ['INDICADOR', 'VALOR'],
    ['Passageiros Registados', bundle.passengers.length],
    ['Motoristas Activos', bundle.drivers.filter((d) => d.statusConta === 'aprovado').length],
    ['Motoristas Pendentes', bundle.drivers.filter((d) => d.statusConta === 'pendente').length],
    ['Praças Oficiais', bundle.pracas.length],
    ['Viagens Concluídas Hoje', bundle.trips.filter((t) => t.estado === 'completed').length],
    ['Viagens em Curso', bundle.trips.filter((t) => t.estado === 'ongoing').length],
    ['Viagens Canceladas', bundle.trips.filter((t) => t.estado === 'cancelled').length],
    ['Total Arrecadado (Kz)', bundle.payments.reduce((acc, p) => acc + (p.estado === 'Confirmado' ? p.valorKz : 0), 0)],
    ['Ocorrências Pendentes', bundle.incidents.filter((i) => i.status !== 'Resolvido').length],
    ['Fiscais em Serviço', bundle.fiscais.filter((f) => f.status === 'ativo').length],
  ];
  const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
  XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo Geral');

  // 2. Motoristas
  if (!moduleFilter || moduleFilter === 'motoristas') {
    const driversData = bundle.drivers.map((d) => ({
      Nome: d.nomeCompleto,
      Telefone: d.telefone,
      'Carta de Condução': d.numeroCarta,
      'N.º BI': d.numeroBi,
      Matrícula: d.matricula,
      Modelo: d.modeloViatura,
      Lotação: d.lotacaoLugares,
      Praça: d.pracaOrigemId,
      Associação: d.associacao,
      Estado: d.statusConta.toUpperCase(),
      'Data Registo': d.dataRegisto,
      'Cotas Pagas': d.cotasEmDia ? 'Sim' : 'Não',
    }));
    const wsDrivers = XLSX.utils.json_to_sheet(driversData);
    XLSX.utils.book_append_sheet(wb, wsDrivers, 'Motoristas');
  }

  // 3. Viagens
  if (!moduleFilter || moduleFilter === 'viagens') {
    const tripsData = bundle.trips.map((t) => ({
      Código: t.codigo,
      Passageiro: t.passageiroNome,
      Telefone: t.passageiroTelefone,
      Motorista: t.motoristaNome,
      Matrícula: t.matricula,
      Origem: t.origemNome,
      Destino: t.destinoNome,
      'Hora Início': t.horaInicio,
      'Hora Fim': t.horaFim || '-',
      Estado: t.estado.toUpperCase(),
      'Valor (Kz)': t.valorKz,
      'Método Pagamento': t.metodoPagamento,
      'Estado Pagamento': t.statusPagamento,
    }));
    const wsTrips = XLSX.utils.json_to_sheet(tripsData);
    XLSX.utils.book_append_sheet(wb, wsTrips, 'Viagens');
  }

  // 4. Pagamentos
  if (!moduleFilter || moduleFilter === 'pagamentos') {
    const paymentsData = bundle.payments.map((p) => ({
      Referência: p.referencia,
      Passageiro: p.passageiroNome,
      Motorista: p.motoristaNome,
      'Valor (Kz)': p.valorKz,
      Método: p.metodo,
      Estado: p.estado,
      'Prestador Confirmado': p.prestadorConfirmado ? 'Sim' : 'Pendente',
      'Data / Hora': p.dataHora,
      Descrição: p.descricao,
    }));
    const wsPayments = XLSX.utils.json_to_sheet(paymentsData);
    XLSX.utils.book_append_sheet(wb, wsPayments, 'Pagamentos');
  }

  // 5. Praças & Filas
  if (!moduleFilter || moduleFilter === 'pracas' || moduleFilter === 'filas') {
    const pracasData = bundle.pracas.map((pr) => ({
      Praça: pr.name,
      Município: pr.municipio,
      Corredor: pr.corridor,
      'Na Fila': pr.naFila,
      'No Cais': pr.noCais,
      'Tempo Médio (min)': pr.minEspera,
      Estado: pr.status,
      Fiscais: pr.fiscaisAtribuidos.join(', '),
    }));
    const wsPracas = XLSX.utils.json_to_sheet(pracasData);
    XLSX.utils.book_append_sheet(wb, wsPracas, 'Praças');
  }

  // 6. Ocorrências
  if (!moduleFilter || moduleFilter === 'ocorrencias') {
    const incidentsData = bundle.incidents.map((inc) => ({
      Código: inc.codigo,
      Título: inc.titulo,
      Tipo: inc.tipo,
      Praça: inc.praca,
      Motorista: inc.motoristaNome || '-',
      Passageiro: inc.passageiroNome || '-',
      'Data / Hora': inc.dataHora,
      Severidade: inc.severidade.toUpperCase(),
      Estado: inc.status,
      'Ação Tomada': inc.acaoTomada || '-',
    }));
    const wsIncidents = XLSX.utils.json_to_sheet(incidentsData);
    XLSX.utils.book_append_sheet(wb, wsIncidents, 'Ocorrências');
  }

  const fileName = `FilaTaxiAO_Relatorio_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Exporta os dados operacionais para ficheiro PDF timbrado
 */
export function exportToPDF(bundle: ReportDataBundle, moduleFilter?: string) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Cabeçalho Oficial
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('REPÚBLICA DE ANGOLA • FILATÁXI AO', 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('RELATÓRIO OFICIAL DE SUPERVISÃO ADMINISTRATIVA & FISCALIZAÇÃO', 14, 18);
  doc.text(`Emitido em: ${bundle.generatedAt} por ${bundle.generatedBy}`, 14, 23);

  // Linha amarela nacional
  doc.setDrawColor(234, 179, 8); // yellow-500
  doc.setLineWidth(1.5);
  doc.line(0, 28, 210, 28);

  let y = 38;

  // Painel de Indicadores Principais
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Indicadores Centrais do Sistema (Luanda)', 14, y);
  y += 6;

  const totalArrecadado = bundle.payments.reduce(
    (acc, p) => acc + (p.estado === 'Confirmado' ? p.valorKz : 0),
    0
  );

  const kpis = [
    `Passageiros: ${bundle.passengers.length}`,
    `Motoristas Activos: ${bundle.drivers.filter((d) => d.statusConta === 'aprovado').length}`,
    `Viagens Hoje: ${bundle.trips.length}`,
    `Praças Monitoradas: ${bundle.pracas.length}`,
    `Receita Registada: ${totalArrecadado.toLocaleString('pt-AO')} Kz`,
    `Ocorrências Abertas: ${bundle.incidents.filter((i) => i.status !== 'Resolvido').length}`,
  ];

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  kpis.forEach((kpi, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = col === 0 ? 14 : 110;
    doc.text(`• ${kpi}`, x, y + row * 6);
  });

  y += Math.ceil(kpis.length / 2) * 6 + 6;

  // 2. Tabela de Motoristas & Homologação
  if (!moduleFilter || moduleFilter === 'motoristas') {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('2. Quadro de Homologação de Motoristas', 14, y);
    y += 6;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y - 4, 182, 6, 'F');
    doc.text('Nome / Carta', 16, y);
    doc.text('Matrícula / Viatura', 70, y);
    doc.text('Associação', 125, y);
    doc.text('Estado da Conta', 160, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    bundle.drivers.slice(0, 10).forEach((drv) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(`${drv.nomeCompleto} (${drv.numeroCarta})`, 16, y);
      doc.text(`${drv.matricula} • ${drv.modeloViatura}`, 70, y);
      doc.text(`${drv.associacao}`, 125, y);
      doc.text(
        drv.statusConta === 'aprovado'
          ? 'APROVADO'
          : drv.statusConta === 'pendente'
          ? 'PENDENTE'
          : 'SUSPENSO',
        160,
        y
      );
      y += 5;
    });

    y += 4;
  }

  // 3. Tabela de Viagens Recentes
  if (!moduleFilter || moduleFilter === 'viagens') {
    if (y > 230) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('3. Registos de Viagens Recentes', 14, y);
    y += 6;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y - 4, 182, 6, 'F');
    doc.text('Código / Passageiro', 16, y);
    doc.text('Rota / Motorista', 70, y);
    doc.text('Valor', 140, y);
    doc.text('Estado', 165, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    bundle.trips.slice(0, 8).forEach((trip) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(`${trip.codigo} • ${trip.passageiroNome}`, 16, y);
      doc.text(`${trip.origemNome} ⇄ ${trip.destinoNome}`, 70, y);
      doc.text(`${trip.valorKz} Kz`, 140, y);
      doc.text(
        trip.estado === 'completed'
          ? 'Concluída'
          : trip.estado === 'ongoing'
          ? 'Em Curso'
          : 'Cancelada',
        165,
        y
      );
      y += 5;
    });

    y += 4;
  }

  // 4. Rodapé e Validação
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'FilaTáxi AO • Homologado pela ANATA / ATL / GPL • Documento gerado eletronicamente para fins de fiscalização e auditoria.',
      14,
      290
    );
    doc.text(`Página ${i} de ${pageCount}`, 190, 290, { align: 'right' });
  }

  const fileName = `FilaTaxiAO_Relatorio_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}
