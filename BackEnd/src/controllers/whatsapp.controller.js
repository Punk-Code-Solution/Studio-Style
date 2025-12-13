/* eslint-disable import/order */
const WhatsAppService = require('../services/whatsapp.service');
const { Schedules, Service, Account, Phone, TypeAccount } = require('../Database/models'); // Modelos do DB
const moment = require('moment');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

// Repositórios para interagir com o DB
const AccountRepository = require('../repositories/account.repository');
const TypeAccountRepository = require('../repositories/type_account.repository');
const ServiceRepository = require('../repositories/service.repository');
const SchedulesRepository = require('../repositories/schedules.repository');
const SchedulesServiceRepository = require('../repositories/schedules_service.repository');

class WhatsAppController {
  constructor() {
    this.whatsappService = new WhatsAppService();
    this.userSessions = new Map(); // Armazena sessoes de usuarios
    this.SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutos de inatividade

    // Instanciando os repositórios
    this.accountRepo = new AccountRepository();
    this.typeAccountRepo = new TypeAccountRepository();
    this.serviceRepo = new ServiceRepository();
    this.schedulesRepo = new SchedulesRepository();
    this.schedulesServiceRepo = new SchedulesServiceRepository();
  }

  /**
   * Método auxiliar para enviar mensagens com tratamento de erros
   */
  async sendMessageSafely(phone, message) {
    const result = await this.whatsappService.sendTextMessage(phone, message);
    
    if (!result.success) {
      if (result.recoverable) {
        // Erro conhecido e recuperável (ex: número não permitido, token expirado)
        if (result.isAuthError) {
          // Erro de autenticação - loga como erro mas não quebra o webhook
          console.error(`❌ ERRO DE AUTENTICAÇÃO: Não foi possível enviar mensagem para ${phone}`);
          console.error(`❌ Token do WhatsApp expirado ou inválido. Verifique a variável WHATSAPP_ACCESS_TOKEN.`);
        } else {
          // Outros erros recuperáveis
          console.warn(`Não foi possível enviar mensagem para ${phone}: ${result.error}`);
        }
        return false;
      } else {
        // Erro crítico - lança exceção para ser tratado no catch
        throw new Error(result.error || 'Erro ao enviar mensagem');
      }
    }
    
    return true;
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
      // Erros recuperáveis (como número não permitido) não quebram o webhook
      await this.processMessage(from, text, contact);

      res.status(200).json({ status: 'ok' });
    } catch (error) {
      // Apenas erros críticos chegam aqui
      console.error('Erro crítico no webhook:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * (NOVO) Busca ou cria um cliente no banco de dados
   */
  async getOrCreateClient(phone, contactName) {
    try {
      // 1. Tenta encontrar a conta pelo número de telefone
      let account = await this.accountRepo.findAccountByPhone(phone);

      if (account) {
        return account;
      }

      // 2. Se não encontrar, cria um novo cliente

      // 2a. Busca o TypeAccount 'client'
      const clientType = await this.typeAccountRepo.findClientType();
      if (!clientType) {
        throw new Error('Tipo de conta "client" não encontrado no banco de dados.');
      }

      // 2b. Cria a nova Account
      const newAccountData = {
        name: contactName || 'Cliente WhatsApp',
        lastname: '',
        password: null, // Clientes de WhatsApp não precisam de senha
        cpf: null,
        typeaccount_id: clientType.id,
        deleted: false
      };
      const newAccount = await this.accountRepo.addAccount(newAccountData);

      if (!newAccount || newAccount.error) {
         throw new Error(`Falha ao criar conta: ${newAccount.error}`);
      }
      
      // 2c. Associa o número de telefone à nova conta
      const phoneData = {
        phone: phone, // Número completo
        ddd: phone.substring(2, 4), // Extrai DDD (Ex: 55[11]9...
        type: 'whatsapp',
        account_id_phone: newAccount.id
      };
      await this.accountRepo.createPhone(phoneData); // Usando o método do account.repository
      
      // Retorna o objeto Account completo
      // Precisamos recarregar para obter os dados completos (ou apenas retornar o newAccount)
      return newAccount;

    } catch (error) {
      console.error('Erro em getOrCreateClient:', error);
      return null;
    }
  }


  /**
   * Envia mensagem de boas-vindas ao usuário
   */
  async sendWelcomeMessage(phone, clientName = '') {
    const greeting = clientName ? `Olá, ${clientName}!` : 'Olá!';
    const message = `${greeting} Eu sou o assistente virtual do *Salão Fio a Fio*.\n\n` +
      'Como posso te ajudar hoje?\n' +
      'Digite *MENU* para ver as opções disponíveis.';
    
    // Pequeno delay para melhorar a experiência do usuário
    await new Promise(resolve => setTimeout(resolve, 1000));
    return this.sendMessageSafely(phone, message);
  }

  /**
   * Envia o menu principal para o usuário
   */
  async sendMainMenu(phone, clientName = '', showWelcome = false) {
    try {
      if (showWelcome) {
        await this.sendWelcomeMessage(phone, clientName);
      }

      const message = '📋 *MENU PRINCIPAL*\n\n' +
        'Escolha uma opção:\n\n' +
        '1️⃣ AGENDAR um serviço\n' +
        '2️⃣ MEUS AGENDAMENTOS\n' +
        '9️⃣ CANCELAR\n\n' +
        'Digite o *número* ou a *palavra* da opção desejada.';

      await this.sendMessageSafely(phone, message);
    } catch (error) {
      console.error('Erro ao enviar menu principal:', error);
      // Tenta enviar uma mensagem de erro genérica
      await this.sendMessageSafely(phone, '❌ Ocorreu um erro ao carregar o menu. Por favor, tente novamente.');
      throw error;
    }
  }

  /**
   * Processa mensagem do usuario
   */
  async processMessage(phone, text, contact) {
    // Remove o prefixo +55 do telefone para armazenamento
    const cleanPhone = phone.startsWith('55') ? phone.substring(2) : phone;
    
    // 1. Identifica o cliente (Account UUID) antes de qualquer ação
    const clientAccount = await this.getOrCreateClient(cleanPhone, contact.name);

    if (!clientAccount) {
      await this.sendMessageSafely(phone,
        '❌ Desculpe, não consegui identificar seu cadastro. Tente novamente mais tarde.');
      return;
    }
    
    // Armazena o ID (UUID) e o nome do cliente na sessão
    const clientId = clientAccount.id;
    const clientName = clientAccount.name;

    const session = this.getUserSession(phone);
    const cleanText = text.toLowerCase().trim();

    // Se não há sessão ativa, trata como primeira interação
    const isFirstInteraction = !session || !session.step;

    // Comandos principais - agora aceita números também
    const normalizedText = cleanText.replace(/[^a-z0-9\s]/gi, '').toLowerCase();
    
    if (normalizedText === 'menu' || normalizedText === 'inicio' || normalizedText === 'comecar' || normalizedText === '0') {
      await this.sendMainMenu(phone, clientName, isFirstInteraction);
      this.setUserSession(phone, { step: 'main_menu', clientId, clientName });
    }
    else if (normalizedText === 'agendar' || normalizedText === 'marcar' || normalizedText === '1') {
      await this.startSchedulingProcess(phone, clientId, clientName);
    }
    else if (normalizedText === 'meus agendamentos' || normalizedText === 'agendamentos' || normalizedText === '2') {
      await this.showUserSchedules(phone, clientId, clientName);
    }
    else if (normalizedText === 'cancelar' || normalizedText === 'sair' || normalizedText === '9') {
      await this.cancelProcess(phone);
    }
    else {
      // Se é primeira interação, mostra boas-vindas e menu
      if (isFirstInteraction) {
        await this.sendMainMenu(phone, clientName, true);
        this.setUserSession(phone, { step: 'main_menu', clientId, clientName });
      } else {
        // Processa baseado no estado da sessao
        await this.processSessionStep(phone, text, session);
      }
    }
  }

  /**
   * Processa passos da sessao de agendamento
   */
  async processSessionStep(phone, text, session) {
    if (!session || !session.step) {
      // Busca o nome do cliente quando a sessão não existe
      const clientAccount = await this.getOrCreateClient(phone, null);
      const clientName = clientAccount ? clientAccount.name : '';
      await this.sendMainMenu(phone, clientName, true);
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
        await this.sendMainMenu(phone, session?.clientName || '', false);
    }
  }

  /**
   * Inicia o processo de agendamento
   */
  async startSchedulingProcess(phone, clientId, clientName) {
    try {
      // Busca serviços do banco de dados
      const services = await this.serviceRepo.findAll();
      console.log('Serviços encontrados:', services?.length);

      if (!services || services.length === 0) {
        await this.sendMessageSafely(phone,
          '❌ Desculpe, não há serviços disponíveis para agendamento no momento.');
        return;
      }

      // Filtra serviços válidos (com preço e nome)
      const validServices = services.filter(s => s && s.service && s.price != null);
      console.log('Serviços válidos:', validServices.length);

      if (validServices.length === 0) {
        await this.sendMessageSafely(phone,
          '❌ Nenhum serviço válido encontrado para agendamento.');
        return;
      }

      const message = `Olá ${clientName}! \n\nEscolha o serviço que deseja agendar:\n\n` +
        validServices.map((s, index) => 
          `${index + 1}. ${s.service} (R$ ${s.price.toFixed(2)})`
        ).join('\n') +
        '\n\nDigite o número do serviço desejado.';
      
      await this.sendMessageSafely(phone, message);
      
      // Cria uma cópia limpa dos serviços, removendo métodos e metadados do Sequelize
      const cleanServices = validServices.map(service => ({
        id: service.id,
        service: service.service,
        price: service.price,
        duration: service.duration || 60 // Valor padrão de 60 minutos se não houver duração
      }));
      
      console.log('Configurando sessão com serviços:', cleanServices.length);
      this.setUserSession(phone, {
        step: 'select_service',
        services: cleanServices,
        clientId: clientId,
        clientName: clientName
      });
    } catch (error) {
      console.error('Erro ao iniciar processo de agendamento:', error);
      await this.sendMessageSafely(phone,
        '❌ Ocorreu um erro ao carregar os serviços. Por favor, tente novamente.');
    }
    
    this.setUserSession(phone, {
      ...session,
      step: 'select_date',
      selectedService: cleanSelectedService,
      availableDates: availableDates
    })
    
    if (!session.services || !Array.isArray(session.services)) {
      console.error('Nenhum serviço disponível na sessão');
      await this.sendMessageSafely(phone, '❌ Erro ao carregar os serviços. Por favor, tente novamente.');
      return;
    }
    
    const selectedService = session.services[serviceIndex];
    console.log('Serviço selecionado:', { serviceIndex, selectedService });

    if (!selectedService) {
      await this.sendMessageSafely(phone,
        `❌ Opção inválida. Por favor, digite um número entre 1 e ${session.services.length}.`);
      return;
    }

    try {
      // Busca datas disponiveis (proximos 30 dias)
      const availableDates = this.getAvailableDates();
      console.log('Datas disponíveis encontradas:', availableDates.length);

      if (!availableDates || availableDates.length === 0) {
        throw new Error('Nenhuma data disponível encontrada');
      }

      const message = `Serviço selecionado: ${selectedService.service}\n\n` +
        'Escolha uma data:\n\n' +
        availableDates.map((date, index) =>
          `${index + 1}. ${date.format('DD/MM/YYYY')}`
        ).join('\n') +
        '\n\nDigite o número da data desejada.';

      await this.sendMessageSafely(phone, message);
      
      // Cria uma cópia limpa do serviço selecionado
      const cleanSelectedService = {
        id: selectedService.id,
        service: selectedService.service,
        price: selectedService.price,
        duration: selectedService.duration || 60
      };
      
      this.setUserSession(phone, {
        ...session,
        step: 'select_date',
        selectedService: cleanSelectedService,
        availableDates: availableDates
      });
    } catch (error) {
      console.error('Erro ao processar seleção de serviço:', error);
      await this.sendMessageSafely(phone, 
        '❌ Ocorreu um erro ao processar sua seleção. Por favor, tente novamente.');
    }
  }

  /**
   * Processa selecao de data
   */
  async handleDateSelection(phone, text, session) {
    try {
      const dateIndex = parseInt(text.trim(), 10) - 1;
      
      if (isNaN(dateIndex) || dateIndex < 0 || !session.availableDates || dateIndex >= session.availableDates.length) {
        await this.sendMessageSafely(phone, '❌ Data inválida. Por favor, escolha uma data da lista.');
        return;
      }
      
      const selectedDate = session.availableDates[dateIndex];
      const availableTimes = await this.getAvailableTimes(selectedDate, session.selectedService.duration || 60);
      
      if (!availableTimes || availableTimes.length === 0) {
        await this.sendMessageSafely(phone, '❌ Não há horários disponíveis para a data selecionada. Por favor, escolha outra data.');
        return;
      }
      
      const message = `Data selecionada: ${selectedDate.format('DD/MM/YYYY')}\n\n` +
        'Escolha um horário:\n\n' +
        availableTimes.map((time, index) => 
          `${index + 1}. ${time.format('HH:mm')}`
        ).join('\n') +
        '\n\nDigite o número do horário desejado.';
        
      await this.sendMessageSafely(phone, message);
      
      this.setUserSession(phone, {
        ...session,
        step: 'select_time',
        selectedDate: selectedDate,
        availableTimes: availableTimes
      });
      
    } catch (error) {
      console.error('Erro ao processar seleção de data:', error);
      await this.sendMessageSafely(phone, 
        '❌ Ocorreu um erro ao processar a data selecionada. Por favor, tente novamente.');
    }
  }

  /**
   * Processa selecao de horario
   */
  async handleTimeSelection(phone, text, session) {
    // Implementação futura
    await this.sendMessageSafely(phone, 'Seleção de horário em desenvolvimento.');
  }

  /**
   * Mostra agendamentos do usuário
   */
  async showUserSchedules(phone, clientId, clientName) {
    try {
      const schedules = await Schedules.findAll({
        where: {
          client_id_schedules: clientId, // UUID do Cliente
          date_and_houres: {
            [Op.gte]: new Date(), // Apenas agendamentos futuros
          }
        },
        include: [{
          model: Service,
          as: 'Services',
          attributes: ['service', 'price'], // Puxa nome e preço do serviço
          through: { attributes: [] } // Não puxe dados da tabela pivo
        }],
        order: [['date_and_houres', 'ASC']],
        limit: 5 // Limita a 5 agendamentos
      });

      if (!schedules || schedules.length === 0) {
        await this.sendMessageSafely(phone,
          `Olá ${clientName}, você não possui agendamentos futuros.`);
        return;
      }

      let message = `Olá ${clientName}, seus próximos agendamentos:\n\n`;

      schedules.forEach((schedule, index) => {
        const date = moment(schedule.date_and_houres);
        message += `*${index + 1}. ${date.format('DD/MM/YYYY')} às ${date.format('HH:mm')}*\n`;
        if (schedule.Services && Array.isArray(schedule.Services) && schedule.Services.length > 0) {
          message += `  Serviços: ${schedule.Services.map(s => s.service).join(', ')}\n`;
        }
        message += `  Status: ${schedule.active ? (schedule.finished ? 'Finalizado' : 'Ativo') : 'Cancelado'}\n\n`;
      });

      message += 'Digite "MENU" para voltar ao início.';
      await this.sendMessageSafely(phone, message);

    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      await this.sendMessageSafely(phone,
        'Erro ao buscar seus agendamentos. Tente novamente mais tarde.');
    }
    
    // Mostra o menu principal após exibir os agendamentos
    await this.sendMainMenu(phone, clientName, false);
  }

  /**
   * Cria agendamento no banco (REFATORADO)
   */
  async createSchedule(session) {
    // Busca um provider (Admin ou Provider) - Lógica de exemplo
    const providers = await this.accountRepo.findByRoles(['admin', 'provider']);
    const providerId = (providers && providers.length > 0) 
      ? providers[0].id 
      : (process.env.DEFAULT_PROVIDER_ID || null);
      
    if (!providerId) {
        console.error("Nenhum provider 'admin' ou 'provider' encontrado no banco de dados.");
        throw new Error("Nenhum prestador de serviço disponível.");
    }

    return await Schedules.create({
      id: uuidv4(),
      name_client: session.clientName,
      date_and_houres: session.appointmentDateTime.toDate(),
      active: true,
      finished: false,
      client_id_schedules: session.clientId, // UUID do Cliente
      provider_id_schedules: providerId // UUID do Prestador
    });
  }

  /**
   * Verifica disponibilidade de horario (REFATORADO)
   */
  async checkAvailability(dateTime, duration) {
    const startTime = moment(dateTime);
    const endTime = moment(dateTime).add(duration, 'minutes');
    
    // Capacidade máxima de 3 agendamentos simultâneos (lógica do usuário)
    const MAX_CAPACITY = 3;

    // Conta quantos agendamentos (Schedules) *começam* durante o slot desejado
    const count = await Schedules.count({
      where: {
        active: true, // Apenas agendamentos ativos
        date_and_houres: {
          [Op.gte]: startTime.toDate(), // Começa em ou depois do início
          [Op.lt]: endTime.toDate()      // E começa antes do fim
        }
      }
    });
    
    // (Lógica mais complexa seria verificar sobreposição total,
    // mas isso exigiria armazenar a duração de cada agendamento no DB)
    
    return count < MAX_CAPACITY;
  }

  /**
   * Obtem datas disponiveis (proximos 30 dias)
   */
  getAvailableDates() {
    const dates = [];
    const today = moment();

    for (let i = 1; i <= 30; i++) {
      const date = today.clone().add(i, 'days');
      // Exclui domingos (Dia 0)
      if (date.day() !== 0) {
        dates.push(date);
      }
    }
    return dates;
  }

  /**
   * Obtem horarios disponiveis para uma data (REFATORADO)
   */
  async getAvailableTimes(date, duration) {
    const times = [];
    const startHour = 8; // 8:00
    const endHour = 18; // 18:00
    const now = moment();

    for (let hour = startHour; hour < endHour; hour++) {
      // Intervalos de 1 hora
      const time = moment(date).hour(hour).minute(0).second(0).millisecond(0);

      // Não mostra horários que já passaram
      if (time.isAfter(now)) {
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
    const session = this.userSessions.get(phone);
    
    // Verifica se a sessão expirou
    if (session && (Date.now() - session.lastActivity > this.SESSION_TIMEOUT)) {
      this.clearUserSession(phone);
      return null;
    }
    
    return session || null;
  }

  setUserSession(phone, session) {
    this.userSessions.set(phone, { 
      ...session, 
      lastActivity: Date.now(),
      // Configura o timeout para limpar a sessão
      timeoutId: setTimeout(() => {
        this.sendMessageSafely(phone, '⚠️ *Sessão encerrada por inatividade*\n\nSua sessão foi encerrada por ficar muito tempo sem interação.\n\nDigite *menu* para começar novamente.');
        this.clearUserSession(phone);
      }, this.SESSION_TIMEOUT)
    });
  }

  clearUserSession(phone) {
    const session = this.userSessions.get(phone);
    if (session && session.timeoutId) {
      clearTimeout(session.timeoutId);
    }
    this.userSessions.delete(phone);
  }

  /**
   * Cancela o processo atual e retorna ao menu principal
   */
  async cancelProcess(phone) {
    try {
      // Limpa a sessão do usuário
      this.clearUserSession(phone);
      
      // Envia mensagem de cancelamento
      await this.sendMessageSafely(
        phone,
        '❌ Operação cancelada.\n\n' +
        'Digite *MENU* para ver as opções disponíveis.'
      );
      
      // Retorna ao menu principal
      await this.sendMainMenu(phone, '', false);
      
    } catch (error) {
      console.error('Erro ao processar cancelamento:', error);
      await this.sendMessageSafely(
        phone,
        '❌ Ocorreu um erro ao processar o cancelamento. Por favor, tente novamente.'
      );
    }
  }
}

module.exports = new WhatsAppController();