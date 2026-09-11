var VNL_RULES = Object.freeze({
  EVENT_ID: 'VNL_2026',
  ORIGINS: ['HANNAH', 'NOAH', 'VAGNER'],
  MIN_PARTY_SIZE: 1,
  MAX_PARTY_SIZE: 20,
  MAX_NAME_LENGTH: 120,
  MAX_COMPANIONS_LENGTH: 500,
  MAX_NOTE_LENGTH: 1000
});

function vnlCleanText(value) {
  return String(value == null ? '' : value).trim();
}

function vnlNormalizePhone(value) {
  var digits = vnlCleanText(value).replace(/\D/g, '');
  if ((digits.length === 12 || digits.length === 13) && digits.indexOf('55') === 0) {
    digits = digits.slice(2);
  }
  if (digits.length !== 10 && digits.length !== 11) return null;
  var ddd = Number(digits.slice(0, 2));
  if (ddd < 11 || ddd > 99) return null;
  if (digits.length === 11 && digits.charAt(2) !== '9') return null;
  if (digits.length === 10 && !/[2-5]/.test(digits.charAt(2))) return null;
  return '55' + digits;
}

function vnlValidatePayload(payload) {
  var source = payload || {};
  var errors = [];
  var eventId = vnlCleanText(source.evento_id);
  var origin = vnlCleanText(source.origem).toUpperCase();
  var requestId = vnlCleanText(source.request_id);
  var name = vnlCleanText(source.nome_responsavel);
  var phoneInput = vnlCleanText(source.telefone);
  var phone = vnlNormalizePhone(phoneInput);
  var presence = vnlCleanText(source.presenca).toUpperCase();
  var companions = vnlCleanText(source.acompanhantes);
  var note = vnlCleanText(source.observacao);
  var quantity = presence === 'NAO' ? 0 : Number(source.quantidade);

  if (eventId !== VNL_RULES.EVENT_ID) errors.push('Evento inválido.');
  if (VNL_RULES.ORIGINS.indexOf(origin) === -1) errors.push('Origem inválida.');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) errors.push('Identificador de envio inválido.');
  if (name.length < 2 || name.length > VNL_RULES.MAX_NAME_LENGTH) errors.push('Informe o nome do responsável ou família.');
  if (!phone) errors.push('Informe um telefone brasileiro válido com DDD.');
  if (presence !== 'SIM' && presence !== 'NAO') errors.push('Informe se estará presente.');
  if (presence === 'SIM' && (!Number.isInteger(quantity) || quantity < VNL_RULES.MIN_PARTY_SIZE || quantity > VNL_RULES.MAX_PARTY_SIZE)) {
    errors.push('A quantidade deve ser um número inteiro entre 1 e 20.');
  }
  if (companions.length > VNL_RULES.MAX_COMPANIONS_LENGTH) errors.push('A lista de acompanhantes é muito longa.');
  if (note.length > VNL_RULES.MAX_NOTE_LENGTH) errors.push('A observação é muito longa.');

  return {
    ok: errors.length === 0,
    errors: errors,
    value: {
      request_id: requestId,
      evento_id: eventId,
      origem: origin,
      nome_responsavel: name,
      telefone_informado: phoneInput,
      telefone_normalizado: phone,
      presenca: presence,
      quantidade: presence === 'NAO' ? 0 : quantity,
      acompanhantes: companions,
      observacao: note
    }
  };
}

function vnlIsRsvpOpenAt(now, configuredLimit, active) {
  if (active !== true) return false;
  if (!now || typeof now.getTime !== 'function' || isNaN(now.getTime())) return false;
  if (!configuredLimit || typeof configuredLimit.getTime !== 'function' || isNaN(configuredLimit.getTime())) return false;
  // O minuto configurado como limite permanece integralmente válido.
  return now.getTime() < configuredLimit.getTime() + 60000;
}

function vnlSafeMessage(message) {
  var output = {
    type: 'VNL_RSVP_RESULT',
    request_id: vnlCleanText(message.request_id),
    ok: message.ok === true,
    code: vnlCleanText(message.code),
    message: vnlCleanText(message.message),
    rsvp_open: message.rsvp_open === true
  };
  return output;
}
