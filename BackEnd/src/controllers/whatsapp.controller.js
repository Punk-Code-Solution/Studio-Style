const WhatsAppService = require("../services/whatsapp.service");
const { Schedules, Service, Account } = require("../Database/models");
const moment = require('moment');

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
      await this.sendMainMenu(phone, contact.name);
      this.setUserSession(phone, { step: 'main_menu' });
    }
    else if (cleanText === 'agendar' || cleanText === 'marcar') {
      await this.startSchedulingProcess(phone, contact.name);
    }
    else if (cleanText === 'meus agendamentos' || cleanText === 'agendamentos') {
      await this.showUserSchedules(phone, contact.name);
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

    const message = Ola ! \n\nEscolha o servico que deseja agendar:\n\n +
      services.map(s => ${s.id}.  (min)).join('\n') +
      '\n\nDigite o numero do servico desejado.';

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
        ' Opcao invalida. Digite o numero do servico desejado.');
      return;
    }

    // Busca datas disponiveis (proximos 30 dias)
    const availableDates = this.getAvailableDates();
    
    const message =  Servico selecionado: \n\n +
      Escolha uma data:\n\n +
      availableDates.map((date, index) => 
        ${index + 1}.  ()
      ).join('\n') +
      '\n\nDigite o numero da data desejada.';

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
        ' Data invalida. Digite o numero da data desejada.');
      return;
    }

    // Busca horarios disponiveis para a data selecionada
    const availableTimes = await this.getAvailableTimes(selectedDate, session.selectedService.duration);
    
    if (availableTimes.length === 0) {
      await this.whatsappService.sendTextMessage(phone, 
        ' Nao ha horarios disponiveis para esta data. Escolha outra data.');
      return;
    }

    const message =  Data selecionada: \n\n +
      Horarios disponiveis:\n\n +
      availableTimes.map((time, index) => 
        ${index + 1}. 
      ).join('\n') +
      '\n\nDigite o numero do horario desejado.';

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
        ' Horario invalido. Digite o numero do horario desejado.');
      return;
    }

    const appointmentDateTime = session.selectedDate.clone().hour(selectedTime.hour()).minute(selectedTime.minute());
    
    // Verifica se ainda ha vagas disponiveis
    const isAvailable = await this.checkAvailability(appointmentDateTime, session.selectedService.duration);
    
    if (!isAvailable) {
      await this.whatsappService.sendTextMessage(phone, 
        ' Este horario nao esta mais disponivel. Escolha outro horario.');
      return;
    }

    const message =  Confirmacao do Agendamento:\n\n +
       Cliente: \n +
       Servico: \n +
       Data: \n +
       Horario: \n +
       Duracao:  minutos\n\n +
      Digite "CONFIRMAR" para confirmar ou "CANCELAR" para cancelar.;

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
        
        // Cria o servico
        const service = await this.createService(session);
        
        const message =  Agendamento confirmado com sucesso!\n\n +
           Codigo: \n +
           Data: \n +
           Horario: \n +
           Servico: \n\n +
          Obrigado por escolher nosso salao! ;

        await this.whatsappService.sendTextMessage(phone, message);
        
        // Limpa a sessao
        this.clearUserSession(phone);
        
      } catch (error) {
        console.error('Erro ao criar agendamento:', error);
        await this.whatsappService.sendTextMessage(phone, 
          ' Erro ao confirmar agendamento. Tente novamente mais tarde.');
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
            [require('sequelize').Op.gte]: new Date(),
            [require('sequelize').Op.lte]: moment().add(30, 'days').toDate()
          }
        },
        include: [{
          model: Service,
          as: 'services'
        }],
        order: [['date_and_houres', 'ASC']]
      });

      if (schedules.length === 0) {
        await this.whatsappService.sendTextMessage(phone, 
          'Voce nao possui agendamentos nos proximos 30 dias.');
        return;
      }

      let message =  Seus Agendamentos:\n\n;
      
      schedules.forEach((schedule, index) => {
        const date = moment(schedule.date_and_houres);
        message += ${index + 1}. \n;
        if (schedule.services && schedule.services.length > 0) {
          message +=    Servicos: \n;
        }
        message +=    Status: \n\n;
      });

      await this.whatsappService.sendTextMessage(phone, message);
      
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      await this.whatsappService.sendTextMessage(phone, 
        ' Erro ao buscar agendamentos. Tente novamente mais tarde.');
    }
  }

  /**
   * Cancela processo atual
   */
  async cancelProcess(phone) {
    this.clearUserSession(phone);
    await this.whatsappService.sendTextMessage(phone, 
      ' Processo cancelado. Digite "MENU" para ver as opcoes disponiveis.');
  }

  /**
   * Envia menu principal
   */
  async sendMainMenu(phone, userName = '') {
    const greeting = userName ? Ola !  : 'Ola! ';
    
    const message = ${greeting}\n\n +
      Escolha uma opcao:\n\n +
      1 AGENDAR - Marcar um servico\n +
      2 AGENDAMENTOS - Ver meus agendamentos\n +
      3 CANCELAR - Cancelar processo atual\n\n +
      Digite o numero da opcao desejada.;

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
  async createService(session) {
    return await Service.create({
      service: session.selectedService.name,
      date_service: session.appointmentDateTime.toDate(),
      additionalComments: Agendado via WhatsApp - ,
      client_id_service: session.phone,
      provider_id_service: process.env.DEFAULT_PROVIDER_ID || 'default-provider'
    });
  }

  /**
   * Verifica disponibilidade de horario
   */
  async checkAvailability(dateTime, duration) {
    const endTime = moment(dateTime).add(duration, 'minutes');
    
    // Conta quantos agendamentos existem no mesmo horario
    const count = await Schedules.count({
      where: {
        date_and_houres: {
          [require('sequelize').Op.between]: [dateTime.toDate(), endTime.toDate()]
        },
        active: true
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
        const time = moment(date).hour(hour).minute(minute);
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
