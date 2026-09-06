var VNL_SHEETS = Object.freeze({
  CONFIG: 'CONFIGURACAO',
  RESPONSES: 'RESPOSTAS',
  CURRENT: 'CONSOLIDADO',
  DASHBOARD: 'PAINEL'
});

var VNL_RESPONSE_HEADERS = [
  'response_id', 'data_hora', 'telefone_normalizado', 'telefone_informado',
  'nome_responsavel', 'presenca', 'quantidade', 'acompanhantes',
  'observacao', 'origem', 'canal', 'fora_prazo'
];

var VNL_CURRENT_HEADERS = [
  'telefone_normalizado', 'response_id_vigente', 'data_hora', 'nome_responsavel',
  'presenca', 'quantidade', 'acompanhantes', 'observacao', 'origem', 'canal'
];

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Convites VNL')
    .addItem('Inicializar ou reparar estrutura', 'setupProject')
    .addItem('Registrar resposta manual', 'showManualSidebar')
    .addToUi();
}

function setupProject() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  spreadsheet.setSpreadsheetTimeZone('America/Fortaleza');
  spreadsheet.setSpreadsheetLocale('en_US');

  setupConfigSheet_(spreadsheet);
  var responsesSheet = ensureHeader_(spreadsheet, VNL_SHEETS.RESPONSES, VNL_RESPONSE_HEADERS);
  var currentSheet = ensureHeader_(spreadsheet, VNL_SHEETS.CURRENT, VNL_CURRENT_HEADERS);
  responsesSheet.getRange('B:B').setNumberFormat('dd/MM/yyyy HH:mm:ss');
  currentSheet.getRange('C:C').setNumberFormat('dd/MM/yyyy HH:mm:ss');
  setupDashboard_(spreadsheet);

  protectWithWarning_(spreadsheet.getSheetByName(VNL_SHEETS.CONFIG), 'Configuração do evento');
  protectWithWarning_(spreadsheet.getSheetByName(VNL_SHEETS.RESPONSES), 'Histórico append-only');
  protectWithWarning_(spreadsheet.getSheetByName(VNL_SHEETS.CURRENT), 'Consolidado calculado pelo script');
  protectWithWarning_(spreadsheet.getSheetByName(VNL_SHEETS.DASHBOARD), 'Fórmulas do painel');

  spreadsheet.setActiveSheet(spreadsheet.getSheetByName(VNL_SHEETS.DASHBOARD));
  SpreadsheetApp.flush();
  return 'Estrutura pronta.';
}

function setupConfigSheet_(spreadsheet) {
  var sheet = spreadsheet.getSheetByName(VNL_SHEETS.CONFIG) || spreadsheet.insertSheet(VNL_SHEETS.CONFIG);
  var desired = [
    ['CHAVE', 'VALOR'],
    ['EVENTO_ID', 'VNL_2026'],
    ['DATA_EVENTO', new Date('2026-09-26T03:00:00.000Z')],
    ['HORARIO', '14:00'],
    ['LOCAL', 'Sítio Jalisco'],
    ['MAPS_URL', 'https://maps.app.goo.gl/N6HcsDhRMRoWT4E1A'],
    ['OBSERVACAO', 'Traga sua roupa de banho'],
    ['RSVP_LIMITE', new Date('2026-09-16T02:59:00.000Z')],
    ['TIMEZONE', 'America/Fortaleza'],
    ['RSVP_ATIVO', true],
    ['EMAIL_POS_PRAZO', 'niver.familia.vnl@gmail.com'],
    ['RATE_LIMIT_PHONE', 5],
    ['RATE_LIMIT_WINDOW_SECONDS', 600],
    ['RATE_LIMIT_GLOBAL_PER_MINUTE', 60]
  ];

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, desired.length, 2).setValues(desired);
  } else {
    var values = sheet.getRange(1, 1, sheet.getLastRow(), 2).getValues();
    if (values[0][0] !== 'CHAVE' || values[0][1] !== 'VALOR') {
      throw new Error('A aba CONFIGURACAO existe, mas não possui o cabeçalho esperado.');
    }
    var present = {};
    values.slice(1).forEach(function(row) { present[String(row[0])] = true; });
    desired.slice(1).forEach(function(row) {
      if (!present[row[0]]) sheet.appendRow(row);
    });
  }

  sheet.setFrozenRows(1);
  sheet.getRange('A1:B1').setFontWeight('bold').setBackground('#4b3d63').setFontColor('#ffffff');
  sheet.getRange('B3').setNumberFormat('dd/MM/yyyy');
  sheet.getRange('B8').setNumberFormat('dd/MM/yyyy HH:mm');
  sheet.autoResizeColumns(1, 2);
}

function ensureHeader_(spreadsheet, name, headers) {
  var sheet = spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  } else {
    var current = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
    if (current.join('|') !== headers.join('|')) {
      throw new Error('A aba ' + name + ' existe, mas o cabeçalho não corresponde ao contrato esperado.');
    }
  }
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#263a50').setFontColor('#ffffff');
  sheet.autoResizeColumns(1, headers.length);
  return sheet;
}

function setupDashboard_(spreadsheet) {
  var sheet = spreadsheet.getSheetByName(VNL_SHEETS.DASHBOARD) || spreadsheet.insertSheet(VNL_SHEETS.DASHBOARD);
  if (sheet.getLastRow() > 0) {
    var marker = sheet.getRange('A1').getValue();
    if (marker && marker !== 'PAINEL — CONVITES VNL 2026') {
      throw new Error('A aba PAINEL já contém conteúdo não reconhecido.');
    }
  }

  var labels = [
    ['PAINEL — CONVITES VNL 2026', ''],
    ['', ''],
    ['Confirmações únicas', '=COUNTIF(CONSOLIDADO!E2:E,"SIM")'],
    ['Pessoas confirmadas', '=SUMIF(CONSOLIDADO!E2:E,"SIM",CONSOLIDADO!F2:F)'],
    ['Respostas vigentes “não irá”', '=COUNTIF(CONSOLIDADO!E2:E,"NAO")'],
    ['Pessoas — Hannah', '=SUMIFS(CONSOLIDADO!F2:F,CONSOLIDADO!E2:E,"SIM",CONSOLIDADO!I2:I,"HANNAH")'],
    ['Pessoas — Noah', '=SUMIFS(CONSOLIDADO!F2:F,CONSOLIDADO!E2:E,"SIM",CONSOLIDADO!I2:I,"NOAH")'],
    ['Pessoas — Vagner', '=SUMIFS(CONSOLIDADO!F2:F,CONSOLIDADO!E2:E,"SIM",CONSOLIDADO!I2:I,"VAGNER")'],
    ['Última atualização', '=IFERROR(MAX(CONSOLIDADO!C2:C),"")']
  ];
  sheet.getRange('A1:B1').breakApart();
  sheet.getRange(1, 1, labels.length, 2).setValues(labels);
  sheet.getRange('A1:B1').merge().setFontSize(16).setFontWeight('bold').setBackground('#263a50').setFontColor('#ffffff');
  sheet.getRange('A3:A9').setFontWeight('bold');
  sheet.getRange('B3:B8').setFontSize(15).setHorizontalAlignment('right');
  sheet.getRange('B9').setNumberFormat('dd/MM/yyyy HH:mm:ss');
  sheet.setColumnWidth(1, 260);
  sheet.setColumnWidth(2, 180);
}

function protectWithWarning_(sheet, description) {
  var existing = sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET).filter(function(item) {
    return item.getDescription() === description;
  });
  if (existing.length === 0) {
    sheet.protect().setDescription(description).setWarningOnly(true);
  }
}

function getConfig_() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(VNL_SHEETS.CONFIG);
  if (!sheet) throw new Error('CONFIGURACAO não encontrada. Execute setupProject.');
  var rows = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 1), 2).getValues();
  var config = {};
  rows.forEach(function(row) {
    if (row[0] !== '') config[String(row[0])] = row[1];
  });
  return config;
}

function doGet(event) {
  var requestId = event && event.parameter ? vnlCleanText(event.parameter.request_id) : '';
  try {
    var config = getConfig_();
    var isOpen = vnlIsRsvpOpenAt(new Date(), config.RSVP_LIMITE, config.RSVP_ATIVO === true);
    return transportOutput_(vnlSafeMessage({
      request_id: requestId,
      ok: true,
      code: 'STATUS',
      message: isOpen ? 'Confirmações abertas.' : 'Prazo encerrado.',
      rsvp_open: isOpen
    }));
  } catch (error) {
    console.error(error);
    return transportOutput_(vnlSafeMessage({ request_id: requestId, ok: false, code: 'ERROR', message: 'Serviço indisponível.', rsvp_open: false }));
  }
}

function doPost(event) {
  var payload = event && event.parameter ? event.parameter : {};
  var result = processSubmission_(payload, 'WEB', true);
  return transportOutput_(result);
}

function processSubmission_(payload, channel, applyRateLimit) {
  if (channel === 'WEB' && vnlCleanText(payload.website)) {
    return vnlSafeMessage({ request_id: payload.request_id, ok: true, code: 'RECORDED', message: 'Resposta registrada.', rsvp_open: true });
  }

  var validation = vnlValidatePayload(payload);
  if (!validation.ok) {
    return vnlSafeMessage({ request_id: payload.request_id, ok: false, code: 'INVALID', message: validation.errors[0], rsvp_open: true });
  }

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    return vnlSafeMessage({ request_id: payload.request_id, ok: false, code: 'BUSY', message: 'Serviço ocupado.', rsvp_open: true });
  }

  try {
    var now = new Date();
    var config = getConfig_();
    if (applyRateLimit && !consumeRateLimit_(validation.value.telefone_normalizado, config, now)) {
      return vnlSafeMessage({ request_id: payload.request_id, ok: false, code: 'RATE_LIMITED', message: 'Muitas tentativas.', rsvp_open: true });
    }

    var isOpen = vnlIsRsvpOpenAt(now, config.RSVP_LIMITE, config.RSVP_ATIVO === true);
    var responseId = Utilities.getUuid();
    var item = validation.value;
    var responses = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(VNL_SHEETS.RESPONSES);
    responses.appendRow([
      responseId, now, item.telefone_normalizado, item.telefone_informado,
      item.nome_responsavel, item.presenca, item.quantidade, item.acompanhantes,
      item.observacao, item.origem, channel, !isOpen
    ]);

    if (!isOpen) {
      return vnlSafeMessage({ request_id: item.request_id, ok: false, code: 'CLOSED', message: 'Prazo encerrado.', rsvp_open: false });
    }

    upsertCurrent_(item, responseId, now, channel);
    SpreadsheetApp.flush();
    return vnlSafeMessage({ request_id: item.request_id, ok: true, code: 'RECORDED', message: 'Resposta registrada.', rsvp_open: true });
  } catch (error) {
    console.error(error);
    return vnlSafeMessage({ request_id: payload.request_id, ok: false, code: 'ERROR', message: 'Não foi possível registrar.', rsvp_open: true });
  } finally {
    lock.releaseLock();
  }
}

function upsertCurrent_(item, responseId, timestamp, channel) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(VNL_SHEETS.CURRENT);
  var row = sheet.getLastRow() + 1;
  if (sheet.getLastRow() > 1) {
    var phones = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
    for (var index = 0; index < phones.length; index += 1) {
      if (String(phones[index][0]) === item.telefone_normalizado) {
        row = index + 2;
        break;
      }
    }
  }
  sheet.getRange(row, 1, 1, VNL_CURRENT_HEADERS.length).setValues([[
    item.telefone_normalizado, responseId, timestamp, item.nome_responsavel,
    item.presenca, item.quantidade, item.acompanhantes, item.observacao,
    item.origem, channel
  ]]);
}

function consumeRateLimit_(phone, config, now) {
  var cache = CacheService.getScriptCache();
  var phoneLimit = Number(config.RATE_LIMIT_PHONE || 5);
  var phoneWindow = Number(config.RATE_LIMIT_WINDOW_SECONDS || 600);
  var globalLimit = Number(config.RATE_LIMIT_GLOBAL_PER_MINUTE || 60);
  var globalKey = 'global:' + Math.floor(now.getTime() / 60000);
  var phoneKey = 'phone:' + hashPhone_(phone);
  var globalCount = Number(cache.get(globalKey) || 0);
  var phoneCount = Number(cache.get(phoneKey) || 0);
  if (globalCount >= globalLimit || phoneCount >= phoneLimit) return false;
  cache.put(globalKey, String(globalCount + 1), 120);
  cache.put(phoneKey, String(phoneCount + 1), phoneWindow);
  return true;
}

function hashPhone_(phone) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, phone).map(function(byte) {
    return ('0' + ((byte + 256) % 256).toString(16)).slice(-2);
  }).join('');
}

function transportOutput_(message) {
  var json = JSON.stringify(message)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
  var html = '<!doctype html><html><head><meta charset="utf-8"></head><body>' +
    '<script>(function(m){var w=window;for(var i=0;i<5;i++){w.postMessage(m,"*");if(w===w.parent)break;w=w.parent;}})(' +
    json + ');</script></body></html>';
  return HtmlService.createHtmlOutput(html)
    .setTitle('Convites VNL 2026')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function showManualSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('Sidebar').setTitle('Resposta manual');
  SpreadsheetApp.getUi().showSidebar(html);
}

function submitManual(formData) {
  var payload = formData || {};
  payload.request_id = Utilities.getUuid();
  payload.evento_id = VNL_RULES.EVENT_ID;
  payload.website = '';
  return processSubmission_(payload, 'MANUAL', false);
}
