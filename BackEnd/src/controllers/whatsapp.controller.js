/* eslint-disable import/order */
const WhatsAppService = require('../services/whatsapp.service');
const { Schedules, Service, Account, Phone, TypeAccount, sequelize } = require('../Database/models'); // Modelos do DB
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

    try {
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
    } catch (error) {
      console.error('Erro ao processar etapa da sessão:', error);
      await this.sendMessageSafely(phone, 
        '❌ Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.');
      
      // Volta para o menu principal em caso de erro
      await this.sendMainMenu(phone, session?.clientName || '', false);
    }
  }

  /**
   * Processa seleção de serviço
   */
  async handleServiceSelection(phone, text, session) {
    try {
      const serviceIndex = parseInt(text.trim(), 10) - 1;
      
      if (isNaN(serviceIndex) || serviceIndex < 0 || !session.services || serviceIndex >= session.services.length) {
        await this.sendMessageSafely(phone, '❌ Serviço inválido. Por favor, escolha um serviço da lista.');
        return;
      }
      
      const selectedService = session.services[serviceIndex];
      const availableDates = this.getAvailableDates();
      
      if (!availableDates || availableDates.length === 0) {
        await this.sendMessageSafely(phone, '❌ Não há datas disponíveis para agendamento no momento.');
        return;
      }
      
      const message = `Serviço selecionado: ${selectedService.service}\n\n` +
        'Escolha uma data para o agendamento:\n\n' +
        availableDates.map((date, index) => 
          `${index + 1}. ${date.format('DD/MM/YYYY')}`
        ).join('\n') +
        '\n\nDigite o número da data desejada.';
        
      await this.sendMessageSafely(phone, message);
      
      this.setUserSession(phone, {
        ...session,
        step: 'select_date',
        selectedService: selectedService,
        availableDates: availableDates
      });
      
    } catch (error) {
      console.error('Erro ao processar seleção de serviço:', error);
      await this.sendMessageSafely(phone, 
        '❌ Ocorreu um erro ao processar sua seleção. Por favor, tente novamente.');
    }
  }

  /**
   * Processa seleção de data
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
   * Processa seleção de horário
   */
  async handleTimeSelection(phone, text, session) {
    try {
      const timeIndex = parseInt(text.trim(), 10) - 1;
      
      if (isNaN(timeIndex) || timeIndex < 0 || !session.availableTimes || timeIndex >= session.availableTimes.length) {
        await this.sendMessageSafely(phone, '❌ Horário inválido. Por favor, escolha um horário da lista.');
        return;
      }
      
      const selectedTime = session.availableTimes[timeIndex];
      const appointmentDateTime = selectedTime.clone();
      
      // Atualiza a sessão com os dados do agendamento
      this.setUserSession(phone, {
        ...session,
        step: 'confirm_booking',
        appointmentDateTime: appointmentDateTime
      });
      
      // Envia mensagem de confirmação
      const message = `📅 *Confirme seu agendamento*\n\n` +
        `📌 Serviço: ${session.selectedService.service}\n` +
        `📅 Data: ${appointmentDateTime.format('DD/MM/YYYY')}\n` +
        `⏰ Horário: ${appointmentDateTime.format('HH:mm')}\n\n` +
        'Digite *CONFIRMAR* para confirmar ou *CANCELAR* para cancelar.';
        
      await this.sendMessageSafely(phone, message);
      
    } catch (error) {
      console.error('Erro ao processar seleção de horário:', error);
      await this.sendMessageSafely(phone, 
        '❌ Ocorreu um erro ao processar o horário selecionado. Por favor, tente novamente.');
    }
  }

  /**
   * Processa confirmação de agendamento
   */
  async handleBookingConfirmation(phone, text, session) {
    try {
      const cleanText = text.trim().toLowerCase();
      
      if (cleanText === 'confirmar' || cleanText === 'confirm') {
        // Cria o agendamento no banco de dados
        const schedule = await this.createSchedule(session);
        
        if (schedule) {
          // Envia mensagem de confirmação
          const message = `✅ *Agendamento confirmado!*\n\n` +
            `📌 Serviço: ${session.selectedService.service}\n` +
            `📅 Data: ${session.appointmentDateTime.format('DD/MM/YYYY')}\n` +
            `⏰ Horário: ${session.appointmentDateTime.format('HH:mm')}\n\n` +
            'Obrigado por agendar conosco! Estamos ansiosos para atendê-lo.';
            
          await this.sendMessageSafely(phone, message);
          
          // Limpa a sessão
          this.clearUserSession(phone);
        } else {
          throw new Error('Falha ao criar agendamento');
        }
      } else if (cleanText === 'cancelar' || cleanText === 'cancel') {
        await this.cancelProcess(phone);
      } else {
        // Se a mensagem não for nem confirmar nem cancelar, pede confirmação novamente
        await this.sendMessageSafely(phone, 
          '❌ Opção inválida. Por favor, digite *CONFIRMAR* para confirmar ou *CANCELAR* para cancelar o agendamento.');
      }
      
    } catch (error) {
      console.error('Erro ao processar confirmação de agendamento:', error);
      await this.sendMessageSafely(phone, 
        '❌ Ocorreu um erro ao processar sua confirmação. Por favor, tente novamente.');
      
      // Volta para o menu principal em caso de erro
      await this.sendMainMenu(phone, session?.clientName || '', false);
    }
  }

  /**
   * Mostra agendamentos do usuário
   */
  async showUserSchedules(phone, clientId, clientName) {
    try {
      const schedules = await this.schedulesRepo.findByClientId(clientId, {
        where: {
          date_and_houres: {
            [Op.gte]: new Date() // Apenas agendamentos futuros
          }
        },
        include: [{
          model: Service,
          as: 'services',
          through: { attributes: [] } // Não inclui dados da tabela de junção
        }],
        order: [['date_and_houres', 'ASC']]
      });

      if (!schedules || schedules.length === 0) {
        await this.sendMessageSafely(phone,
          `Olá ${clientName}, você não possui agendamentos futuros.`);
      } else {
        let message = `📅 *Seus próximos agendamentos*\n\n`;
        
        schedules.forEach((schedule, index) => {
          const date = moment(schedule.date_and_houres);
          message += `*${index + 1}.* ${date.format('DD/MM/YYYY [às] HH:mm')}\n`;
          
          if (schedule.services && schedule.services.length > 0) {
            message += `   - ${schedule.services.map(s => s.service).join(', ')}\n\n`;
          } else {
            message += '\n';
          }
        });
        
        message += 'Digite *MENU* para voltar ao início.';
        await this.sendMessageSafely(phone, message);
      }
      
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      await this.sendMessageSafely(phone,
        '❌ Ocorreu um erro ao buscar seus agendamentos. Por favor, tente novamente mais tarde.');
    }
  }

  /**
   * Cria agendamento no banco de dados
   */
  async createSchedule(session) {
    const transaction = await sequelize.transaction();
    
    try {
      // Busca um provider (Admin ou Provider)
      const providers = await this.accountRepo.findByRoles(['admin', 'provider']);
      const providerId = (providers && providers.length > 0) 
        ? providers[0].id 
        : (process.env.DEFAULT_PROVIDER_ID || null);
        
      if (!providerId) {
        await transaction.rollback();
        throw new Error("Nenhum prestador de serviço disponível.");
      }

      // Validar horário ocupado antes de criar agendamento
      const dateAndHours = session.appointmentDateTime.toDate();
      const hasConflict = await this.schedulesRepo.checkTimeConflict(
        dateAndHours,
        providerId,
        null, // Não é atualização
        transaction
      );

      if (hasConflict) {
        await transaction.rollback();
        throw new Error('Horário já está ocupado para este prestador');
      }

      // Prepara dados do agendamento
      const scheduleData = {
        id: uuidv4(),
        name_client: session.clientName,
        date_and_houres: dateAndHours,
        active: true,
        finished: false,
        client_id_schedules: session.clientId,
        provider_id_schedules: providerId
      };

      // Cria o agendamento dentro da transação
      const schedule = await this.schedulesRepo.addSchedules(scheduleData, transaction);

      if (!schedule) {
        await transaction.rollback();
        throw new Error('Falha ao criar agendamento');
      }

      // Associa o serviço ao agendamento dentro da transação
      if (schedule && session.selectedService) {
        const result_services = await this.schedulesServiceRepo.addSchedule_Service(
          schedule.id,
          [session.selectedService.id],
          transaction
        );

        if (!result_services) {
          await transaction.rollback();
          throw new Error('Falha ao associar serviço ao agendamento');
        }
      }

      // Commit da transação
      await transaction.commit();

      return schedule;
    } catch (error) {
      // Rollback em caso de erro
      await transaction.rollback();
      console.error('Erro ao criar agendamento:', error);
      throw error;
    }
  }

  /**
   * Verifica disponibilidade de horário
   */
  async checkAvailability(dateTime, duration) {
    const startTime = moment(dateTime);
    const endTime = moment(dateTime).add(duration, 'minutes');
    
    // Capacidade máxima de 3 agendamentos simultâneos
    const MAX_CAPACITY = 3;

    // Conta quantos agendamentos existem no mesmo horário
    const count = await this.schedulesRepo.count({
      where: {
        active: true,
        date_and_houres: {
          [Op.gte]: startTime.toDate(),
          [Op.lt]: endTime.toDate()
        }
      }
    });
    
    return count < MAX_CAPACITY;
  }

  /**
   * Obtém datas disponíveis para agendamento (próximos 30 dias)
   */
  getAvailableDates() {
    const dates = [];
    const today = moment().startOf('day');
    const endDate = moment().add(30, 'days');
    
    for (let date = moment(today); date.isBefore(endDate); date.add(1, 'day')) {
      // Exclui domingos (0) e sábados (6)
      if (date.day() !== 0 && date.day() !== 6) {
        dates.push(date.clone());
      }
    }
    
    return dates;
  }

  /**
   * Obtém horários disponíveis para uma data específica
   */
  async getAvailableTimes(date, duration) {
    const times = [];
    const startHour = 8; // 8:00
    const endHour = 18;  // 18:00
    const now = moment();
    
    // Para cada hora do dia
    for (let hour = startHour; hour < endHour; hour++) {
      const time = moment(date).hour(hour).minute(0).second(0);
      
      // Não mostra horários que já passaram
      if (time.isAfter(now)) {
        const isAvailable = await this.checkAvailability(time, duration);
        
        if (isAvailable) {
          times.push(time.clone());
        }
      }
    }
    
    return times;
  }

  /**
   * Gerencia sessões de usuários
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

  /**
   * Define/atualiza a sessão do usuário
   */
  setUserSession(phone, session) {
    // Limpa o timeout anterior, se existir
    const currentSession = this.userSessions.get(phone);
    if (currentSession && currentSession.timeoutId) {
      clearTimeout(currentSession.timeoutId);
    }
    
    // Configura um novo timeout para a sessão
    const timeoutId = setTimeout(() => {
      this.sendMessageSafely(phone, 
        '⚠️ *Sessão encerrada por inatividade*\n\n' +
        'Sua sessão foi encerrada por ficar muito tempo sem interação.\n' +
        'Digite *MENU* para começar novamente.');
      this.clearUserSession(phone);
    }, this.SESSION_TIMEOUT);
    
    // Salva a sessão com o novo timeout
    this.userSessions.set(phone, {
      ...session,
      lastActivity: Date.now(),
      timeoutId: timeoutId
    });
  }

  /**
   * Remove a sessão do usuário
   */
  clearUserSession(phone) {
    const session = this.userSessions.get(phone);
    
    // Limpa o timeout da sessão
    if (session && session.timeoutId) {
      clearTimeout(session.timeoutId);
    }
    
    // Remove a sessão
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
