/* eslint-disable import/order */
const WhatsAppService = require('../services/whatsapp.service');
const { Schedules, Service } = require('../database/models');
const moment = require('moment');
const { Op } = require('sequelize');

class WhatsAppController {
  constructor() {
    this.whatsappService = new WhatsAppService();
    this.userSessions = new Map(); // Armazena sessoes de usuarios
  }

  /**
   * Verifica webhook do WhatsApp
   */
  verifyWebhook(req, res) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log("Mode: ", mode);

    const result = this.whatsappService.verifyWebhook(mode, token, challenge);

    if (result) {
      res.status(200).send(result);
    } else {
      res.status(403).json({ error: 'Forbidden' });
    }
  }

  /**
   * Processa mensagens recebidas do WhatsApp
   */
  async handleWebhook(req, res) {
    try {
      const messageData = this.whatsappService.processIncomingMessage(req.body);

      if (!messageData) {
        return res.status(200).json({ status: 'ok' });
      }

      const { from, text, contact } = messageData;

      // Processa a mensagem baseada no estado da sessao do usuario
      await this.processMessage(from, text, contact);

      res.status(200).json({ status: 'ok' });
    } catch (error) {
      console.error('Erro no webhook:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Processa mensagem do usuario
   */
  async processMessage(phone, text, contact) {
    const session = this.getUserSession(phone);
    const cleanText = text.toLowerCase().trim();

    // Comandos principais
    if (cleanText === 'menu' || cleanText === 'inicio' || cleanText === 'comecar') {
      await this.sendMainMenu(phone, contact && contact.name ? contact.name : '');
      this.setUserSession(phone, { step: 'main_menu' });
    }
    else if (cleanText === 'agendar' || cleanText === 'marcar') {
      await this.startSchedulingProcess(phone, contact && contact.name ? contact.name : '');
    }
    else if (cleanText === 'meus agendamentos' || cleanText === 'agendamentos') {
      await this.showUserSchedules(phone, contact && contact.name ? contact.name : '');
    }
    else if (cleanText === 'cancelar' || cleanText === 'sair') {
      await this.cancelProcess(phone);
    }
    else {
      // Processa baseado no estado da sessao
      await this.processSessionStep(phone, text, session);
    }
  }

  /**
   * Processa passos da sessao de agendamento
   */
  async processSessionStep(phone, text, session) {
    if (!session) {
      await this.sendMainMenu(phone);
      return;
    }

    switch (session.step) {
      case 'select_service':
        await this.handleServiceSelection(phone, text, session);
        break;
      case 'select_date':
        await this.handleDateSelection(phone, text, session);
        break;
      case 'select_time':
        await this.handleTimeSelection(phone, text, session);
        break;
      case 'confirm_booking':
        await this.handleBookingConfirmation(phone, text, session);
        break;
      default:
        await this.sendMainMenu(phone);
    }
  }

  /**
   * Inicia processo de agendamento
   */
  async startSchedulingProcess(phone, userName) {
    const services = [
      { id: '1', name: 'Corte de Cabelo', duration: 60 },
      { id: '2', name: 'Escova', duration: 30 },
      { id: '3', name: 'Coloracao', duration: 120 },
      { id: '4', name: 'Manicure', duration: 45 },
      { id: '5', name: 'Pedicure', duration: 60 },
      { id: '6', name: 'Tratamento Capilar', duration: 90 }
    ];

    const message = `Olá${userName ? ' ' + userName : ''}! \n\nEscolha o serviço que deseja agendar:\n\n` +
      services.map(s => `${s.id}. ${s.name} (${s.duration} min)`).join('\n') +
      '\n\nDigite o número do serviço desejado.';

    await this.whatsappService.sendTextMessage(phone, message);
    this.setUserSession(phone, {
      step: 'select_service',
      services: services,
      userName: userName
    });
  }

  /**
   * Processa selecao de servico
   */
  async handleServiceSelection(phone, text, session) {
    const serviceId = text.trim();
    const selectedService = session.services.find(s => s.id === serviceId);

    if (!selectedService) {
      await this.whatsappService.sendTextMessage(phone,
        'Opção inválida. Digite o número do serviço desejado.');
      return;
    }

    // Busca datas disponiveis (proximos 30 dias)
    const availableDates = this.getAvailableDates();

    const message = `Serviço selecionado: ${selectedService.name}\n\n` +
      'Escolha uma data:\n\n' +
      availableDates.map((date, index) =>
        `${index + 1}. ${date.format('DD/MM/YYYY')}`
      ).join('\n') +
      '\n\nDigite o número da data desejada.';

    await this.whatsappService.sendTextMessage(phone, message);
    this.setUserSession(phone, {
      ...session,
      step: 'select_date',
      selectedService: selectedService,
      availableDates: availableDates
    });
  }

  /**
   * Processa selecao de data
   */
  async handleDateSelection(phone, text, session) {
    const dateIndex = parseInt(text.trim()) - 1;
    const selectedDate = session.availableDates[dateIndex];

    if (!selectedDate) {
      await this.whatsappService.sendTextMessage(phone,
        'Data inválida. Digite o número da data desejada.');
      return;
    }

    // Busca horarios disponiveis para a data selecionada
    const availableTimes = await this.getAvailableTimes(selectedDate, session.selectedService.duration);

    if (availableTimes.length === 0) {
      await this.whatsappService.sendTextMessage(phone,
        'Não há horários disponíveis para esta data. Escolha outra data.');
      return;
    }

    const message = `Data selecionada: ${selectedDate.format('DD/MM/YYYY')}\n\n` +
      'Horários disponíveis:\n\n' +
      availableTimes.map((time, index) =>
        `${index + 1}. ${time.format('HH:mm')}`
      ).join('\n') +
      '\n\nDigite o número do horário desejado.';

    await this.whatsappService.sendTextMessage(phone, message);
    this.setUserSession(phone, {
      ...session,
      step: 'select_time',
      selectedDate: selectedDate,
      availableTimes: availableTimes
    });
  }

  /**
   * Processa selecao de horario
   */
  async handleTimeSelection(phone, text, session) {
    const timeIndex = parseInt(text.trim()) - 1;
    const selectedTime = session.availableTimes[timeIndex];

    if (!selectedTime) {
      await this.whatsappService.sendTextMessage(phone,
        'Horário inválido. Digite o número do horário desejado.');
      return;
    }

    const appointmentDateTime = session.selectedDate.clone().hour(selectedTime.hour()).minute(selectedTime.minute());

    // Verifica se ainda ha vagas disponiveis
    const isAvailable = await this.checkAvailability(appointmentDateTime, session.selectedService.duration);

    if (!isAvailable) {
      await this.whatsappService.sendTextMessage(phone,
        'Este horário não está mais disponível. Escolha outro horário.');
      return;
    }

    const message = `Confirmação do Agendamento:\n\n` +
      `Cliente: ${session.userName}\n` +
      `Serviço: ${session.selectedService.name}\n` +
      `Data: ${appointmentDateTime.format('DD/MM/YYYY')}\n` +
      `Horário: ${appointmentDateTime.format('HH:mm')}\n` +
      `Duração: ${session.selectedService.duration} minutos\n\n` +
      `Digite "CONFIRMAR" para confirmar ou "CANCELAR" para cancelar.`;

    await this.whatsappService.sendTextMessage(phone, message);
    this.setUserSession(phone, {
      ...session,
      step: 'confirm_booking',
      appointmentDateTime: appointmentDateTime
    });
  }

  /**
   * Processa confirmacao do agendamento
   */
  async handleBookingConfirmation(phone, text, session) {
    const cleanText = text.toLowerCase().trim();

    if (cleanText === 'confirmar') {
      try {
        // Cria o agendamento
        const schedule = await this.createSchedule(session);
        
        // Cria o servico LIGADO AO SCHEDULE
        const service = await this.createService(session, schedule.id);
        
        const message = `✅ Agendamento confirmado com sucesso!\n\n` +
          ` Código: ${schedule.id.substring(0, 8)}\n` +
          `📅 Data: ${session.appointmentDateTime.format('DD/MM/YYYY')}\n` +
          ` Horário: ${session.appointmentDateTime.format('HH:mm')}\n` +
          `✂️ Serviço: ${session.selectedService.name}\n\n` +
          `Obrigado por escolher nosso salão!✨`;

        await this.whatsappService.sendTextMessage(phone, message);
        
        // Limpa a sessao
        this.clearUserSession(phone);
        
      } catch (error) {
        console.error('Erro ao criar agendamento:', error);
        await this.whatsappService.sendTextMessage(phone, 
          '❌ Erro ao confirmar agendamento. Tente novamente mais tarde.');
      }
    } else if (cleanText === 'cancelar') {
      await this.cancelProcess(phone);
    } else {
      await this.whatsappService.sendTextMessage(phone,
        'Digite "CONFIRMAR" para confirmar ou "CANCELAR" para cancelar.');
    }
  }

  /**
   * Mostra agendamentos do usuario
   */
  async showUserSchedules(phone, userName) {
    try {
      // Busca agendamentos do usuario pelos proximos 30 dias
      const schedules = await Schedules.findAll({
        where: {
          client_id_schedules: phone, // Assumindo que o phone e usado como ID
          date_and_houres: {
            [Op.gte]: new Date(),
            [Op.lte]: moment().add(30, 'days').toDate()
          }
        },
        include: [{
          model: Service,
          as: 'Services'  // ✅ CORRIGIR NOME DA ASSOCIAÇÃO
        }],
        order: [['date_and_houres', 'ASC']]
      });

      if (!schedules || schedules.length === 0) {
        await this.whatsappService.sendTextMessage(phone,
          'Você não possui agendamentos nos próximos 30 dias.');
        return;
      }

      let message = 'Seus Agendamentos:\n\n';

      schedules.forEach((schedule, index) => {
        const date = moment(schedule.date_and_houres);
        message += `${index + 1}. ${date.format('DD/MM/YYYY')} às ${date.format('HH:mm')}\n`;
        if (schedule.Services && Array.isArray(schedule.Services) && schedule.Services.length > 0) {
          message += `  Serviços: ${schedule.Services.map(s => s.service).join(', ')}\n`;
        }
        message += `  Status: ${schedule.active ? (schedule.finished ? 'Finalizado' : 'Ativo') : 'Cancelado'}\n\n`;
      });

      await this.whatsappService.sendTextMessage(phone, message);

    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      await this.whatsappService.sendTextMessage(phone,
        'Erro ao buscar agendamentos. Tente novamente mais tarde.');
    }
  }

  /**
   * Cancela processo atual
   */
  async cancelProcess(phone) {
    this.clearUserSession(phone);
    await this.whatsappService.sendTextMessage(phone,
      'Processo cancelado. Digite "MENU" para ver as opções disponíveis.');
  }

  /**
   * Envia menu principal
   */
  async sendMainMenu(phone, userName = '') {
    const greeting = userName ? `Olá ${userName}!` : 'Olá!';

    const message = `${greeting}\n\n` +
      'Escolha uma opção:\n\n' +
      '1 AGENDAR - Marcar um serviço\n' +
      '2 AGENDAMENTOS - Ver meus agendamentos\n' +
      '3 CANCELAR - Cancelar processo atual\n\n' +
      'Digite o número da opção desejada.';

    await this.whatsappService.sendTextMessage(phone, message);
  }

  /**
   * Cria agendamento no banco
   */
  async createSchedule(session) {
    return await Schedules.create({
      name_client: session.userName,
      date_and_houres: session.appointmentDateTime.toDate(),
      active: true,
      finished: false,
      client_id_schedules: session.phone,
      provider_id_schedules: process.env.DEFAULT_PROVIDER_ID || 'default-provider'
    });
  }

  /**
   * Cria servico no banco
   */
  async createService(session, scheduleId) {
    return await Service.create({
      service: session.selectedService.name,
      date_service: session.appointmentDateTime.toDate(),
      additionalComments: `Agendado via WhatsApp - ${session.userName}`,
      client_id_service: session.phone,
      provider_id_service: process.env.DEFAULT_PROVIDER_ID || 'default-provider',
      schedule_id: scheduleId
    });
  }

  /**
   * Verifica disponibilidade de horario
   */
  async checkAvailability(dateTime, duration) {
    const endTime = moment(dateTime).add(duration, 'minutes');

    // Conta quantos SERVICOS existem no mesmo horario
    const count = await Service.count({
      where: {
        date_service: {
          [Op.between]: [dateTime.toDate(), endTime.toDate()]
        }
      }
    });

    // Maximo de 3 servicos no mesmo horario
    return count < 3;
  }

  /**
   * Obtem datas disponiveis (proximos 30 dias)
   */
  getAvailableDates() {
    const dates = [];
    const today = moment();

    for (let i = 1; i <= 30; i++) {
      const date = today.clone().add(i, 'days');
      // Exclui domingos
      if (date.day() !== 0) {
        dates.push(date);
      }
    }

    return dates;
  }

  /**
   * Obtem horarios disponiveis para uma data
   */
  async getAvailableTimes(date, duration) {
    const times = [];
    const startHour = 8; // 8:00
    const endHour = 18; // 18:00

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) { // Intervalos de 30 min
        const time = moment(date).hour(hour).minute(minute).second(0).millisecond(0);
        const isAvailable = await this.checkAvailability(time, duration);

        if (isAvailable) {
          times.push(time);
        }
      }
    }

    return times;
  }

  /**
   * Gerencia sessoes de usuarios
   */
  getUserSession(phone) {
    return this.userSessions.get(phone);
  }

  setUserSession(phone, session) {
    this.userSessions.set(phone, { ...session, phone });
  }

  clearUserSession(phone) {
    this.userSessions.delete(phone);
  }
}

module.exports = new WhatsAppController();
