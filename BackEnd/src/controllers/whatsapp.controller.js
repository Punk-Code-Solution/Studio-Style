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
    this.SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos de inatividade

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
      // O número do WhatsApp vem no formato: 5511999999999 (55 + DDD + número)
      const cleanPhone = phone.replace(/\D/g, ''); // Remove caracteres não numéricos
      let phoneWithoutCountryCode = cleanPhone;
      let ddd = null;
      
      // Se começa com 55 (código do Brasil), remove e extrai DDD
      if (cleanPhone.startsWith('55') && cleanPhone.length >= 12) {
        phoneWithoutCountryCode = cleanPhone.substring(2); // Remove "55"
        ddd = cleanPhone.substring(2, 4); // Extrai DDD (posições 2-4 do número original)
      } else if (cleanPhone.length >= 10) {
        // Se não tem código do país, assume que os 2 primeiros dígitos são o DDD
        ddd = cleanPhone.substring(0, 2);
        phoneWithoutCountryCode = cleanPhone;
      }
      
      const phoneData = {
        phone: phoneWithoutCountryCode, // Número sem código do país
        ddd: ddd,
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
    const greeting = clientName ? `Olá, ${clientName}! 👋` : 'Olá! 👋';
    const message = `${greeting}\n\n` +
      'Bem-vindo ao *Salão Fio a Fio*! ✨\n\n' +
      'Estou aqui para ajudar você a agendar seus serviços de forma rápida e fácil.\n\n' +
      'Digite *MENU* para ver as opções disponíveis.';
    
    // Pequeno delay para melhorar a experiência do usuário
    await new Promise(resolve => setTimeout(resolve, 1500));
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
        '3️⃣ FINALIZAR SESSÃO\n\n' +
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
    // 1. Identifica o cliente (Account UUID) antes de qualquer ação
    // O getOrCreateClient normaliza o telefone internamente
    const clientAccount = await this.getOrCreateClient(phone, contact.name);

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
    const normalizedText = cleanText.replace(/[^a-z0-9\s]/gi, '').toLowerCase();

    // VALIDAÇÃO 1: Se há uma sessão ativa com um step específico, processa baseado no step
    // Isso evita que números sejam interpretados como comandos principais
    if (session && session.step && 
        (session.step === 'select_service' || 
         session.step === 'select_date' || 
         session.step === 'select_time' || 
         session.step === 'confirm_booking' ||
         session.step === 'viewing_schedules')) {
      console.log(`[processMessage] Processando step: ${session.step}, Telefone: ${phone}, Texto: ${text}`);
      await this.processSessionStep(phone, text, session);
      return;
    }

    // VALIDAÇÃO 2: Comandos principais só são aceitos se não estiver em um fluxo ativo
    // Se está no menu principal, processa comandos normalmente
    const isFirstInteraction = !session || !session.step;
    const isInMainMenu = session && session.step === 'main_menu';

    // Comandos que sempre funcionam (MENU, CANCELAR)
    if (normalizedText === 'menu' || normalizedText === 'inicio' || normalizedText === 'comecar' || normalizedText === '0') {
      await this.sendMainMenu(phone, clientName, isFirstInteraction);
      this.setUserSession(phone, { step: 'main_menu', clientId, clientName });
      return;
    }
    
    if (normalizedText === 'cancelar' || normalizedText === 'sair' || normalizedText === 'finalizar' || normalizedText === '3') {
      await this.cancelProcess(phone);
      return;
    }
    
    // VALIDAÇÃO 3: Comandos numéricos só funcionam no menu principal ou primeira interação
    // Isso evita que números sejam interpretados incorretamente após mostrar agendamentos
    if (isFirstInteraction || isInMainMenu) {
      if (normalizedText === 'agendar' || normalizedText === 'marcar' || normalizedText === '1') {
      await this.startSchedulingProcess(phone, clientId, clientName);
        return;
    }
      
      if (normalizedText === 'meus agendamentos' || normalizedText === 'agendamentos' || normalizedText === '2') {
      await this.showUserSchedules(phone, clientId, clientName);
        return;
    }
    }
    
    // VALIDAÇÃO 4: Se não reconheceu o comando e não está em um step específico
      if (isFirstInteraction) {
        await this.sendMainMenu(phone, clientName, true);
        this.setUserSession(phone, { step: 'main_menu', clientId, clientName });
    } else if (isInMainMenu) {
      // Se está no menu principal mas não reconheceu o comando
      await this.sendMessageSafely(phone,
        '❌ Opção inválida. Por favor, digite o *número* (1, 2 ou 3) ou o *nome* da opção desejada.\n\n' +
        'Digite *MENU* para ver as opções novamente.');
      } else {
      // Processa baseado no estado da sessao (menu principal)
        await this.processSessionStep(phone, text, session);
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

      const message = `Perfeito, ${clientName}! ✂️\n\n` +
        'Aqui estão nossos serviços disponíveis:\n\n' +
        validServices.map((s, index) => 
          `${index + 1}. ${s.service} - R$ ${s.price.toFixed(2).replace('.', ',')}`
        ).join('\n') +
        '\n\nVocê pode selecionar *um ou mais serviços*.\n' +
        'Digite o *número* do serviço (ex: 1) ou *vários números separados por vírgula* (ex: 1,2,3).\n\n' +
        'Quando terminar, digite *CONTINUAR* para escolher a data.';

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
        selectedServices: [], // Array para armazenar múltiplos serviços selecionados
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
        case 'main_menu':
          // Trata números no menu principal
          const menuOption = text.trim();
          const normalizedMenuOption = menuOption.replace(/[^a-z0-9\s]/gi, '').toLowerCase();
          
          if (normalizedMenuOption === '1' || normalizedMenuOption === 'agendar' || normalizedMenuOption === 'marcar') {
            await this.startSchedulingProcess(phone, session.clientId, session.clientName);
          } else if (normalizedMenuOption === '2' || normalizedMenuOption === 'meus agendamentos' || normalizedMenuOption === 'agendamentos') {
            await this.showUserSchedules(phone, session.clientId, session.clientName);
          } else if (normalizedMenuOption === '3' || normalizedMenuOption === 'cancelar' || normalizedMenuOption === 'sair' || normalizedMenuOption === 'finalizar') {
            await this.cancelProcess(phone);
          } else {
            await this.sendMessageSafely(phone,
              '❌ Opção inválida. Digite o *número* (1, 2 ou 3) ou o *nome* da opção desejada.');
          }
          break;
        case 'viewing_schedules':
          // VALIDAÇÃO: Após ver agendamentos, apenas MENU ou comandos específicos são aceitos
          const viewingOption = text.trim().toLowerCase();
          const normalizedViewingOption = viewingOption.replace(/[^a-z0-9\s]/gi, '').toLowerCase();
          
          if (normalizedViewingOption === 'menu' || normalizedViewingOption === 'inicio' || normalizedViewingOption === 'comecar' || normalizedViewingOption === '0') {
            await this.sendMainMenu(phone, session.clientName || '', false);
            this.setUserSession(phone, { step: 'main_menu', clientId: session.clientId, clientName: session.clientName });
          } else {
            await this.sendMessageSafely(phone,
              '⚠️ Você está visualizando seus agendamentos.\n\n' +
              'Digite *MENU* para voltar ao início e escolher outra opção.');
          }
          break;
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
      // VALIDAÇÃO: Verifica se está no step correto
      if (!session || session.step !== 'select_service') {
        await this.sendMessageSafely(phone,
          '⚠️ Você não está no processo de seleção de serviço.\n\n' +
          'Digite *MENU* para começar um novo agendamento.');
        return;
      }
      
      // VALIDAÇÃO: Verifica se há serviços disponíveis
      if (!session.services || session.services.length === 0) {
        await this.sendMessageSafely(phone,
          '❌ Não há serviços disponíveis. Por favor, tente novamente mais tarde.');
        await this.sendMainMenu(phone, session.clientName || '', false);
        this.setUserSession(phone, { step: 'main_menu', clientId: session.clientId, clientName: session.clientName });
      return;
    }

      const cleanText = text.trim().toLowerCase();
      
      // Verifica se o usuário quer continuar
      if (cleanText === 'continuar' || cleanText === 'continuar' || cleanText === 'pronto') {
        const selectedServices = session.selectedServices || [];
        
        if (selectedServices.length === 0) {
          await this.sendMessageSafely(phone,
            '❌ Você precisa selecionar pelo menos um serviço antes de continuar.\n\n' +
            'Digite o *número* do serviço desejado.');
          return;
        }
        
        // Calcula o valor total
        const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
        const totalDuration = selectedServices.reduce((sum, s) => sum + (s.duration || 60), 0);
        
        const availableDates = this.getAvailableDates();
        
        if (!availableDates || availableDates.length === 0) {
          await this.sendMessageSafely(phone, '❌ Não há datas disponíveis para agendamento no momento.');
          return;
        }
        
        const servicesList = selectedServices.map(s => `   • ${s.service} - R$ ${s.price.toFixed(2).replace('.', ',')}`).join('\n');
        const message = `Ótima escolha! ✨\n\n` +
          `*Serviços selecionados:*\n${servicesList}\n\n` +
          `*Valor total:* R$ ${totalPrice.toFixed(2).replace('.', ',')}\n\n` +
          'Agora, escolha uma data para seu agendamento:\n\n' +
          availableDates.map((date, index) => 
            `${index + 1}. ${date.format('DD/MM/YYYY')} (${date.format('dddd').charAt(0).toUpperCase() + date.format('dddd').slice(1)})`
      ).join('\n') +
          '\n\nDigite o *número* da data desejada.';

    await this.sendMessageSafely(phone, message);
        
        const updatedSession = {
          ...session,
          step: 'select_date',
          selectedServices: selectedServices, // Mantém o array de serviços
          totalPrice: totalPrice,
          totalDuration: totalDuration,
          availableDates: availableDates
        };
        
        this.setUserSession(phone, updatedSession);
        return;
      }
      
      // Processa seleção de serviços (pode ser um número ou vários separados por vírgula/espaço)
      const serviceNumbers = text.split(/[,\s]+/).map(n => parseInt(n.trim(), 10) - 1).filter(n => !isNaN(n) && n >= 0);
      
      if (serviceNumbers.length === 0) {
      await this.sendMessageSafely(phone,
          `❌ Formato inválido. Digite o *número* do serviço (1 a ${session.services.length}) ou vários números separados por vírgula.\n\n` +
          'Exemplo: 1 ou 1,2,3');
      return;
    }

      // Valida os índices
      const invalidIndices = serviceNumbers.filter(idx => idx >= session.services.length);
      if (invalidIndices.length > 0) {
        await this.sendMessageSafely(phone, 
          `❌ Alguns números são inválidos. Escolha números entre 1 e ${session.services.length}.`);
        return;
      }
      
      // Adiciona os serviços selecionados (evita duplicatas)
      const currentSelected = session.selectedServices || [];
      const newServices = serviceNumbers
        .map(idx => session.services[idx])
        .filter(service => !currentSelected.some(s => s.id === service.id));
      
      if (newServices.length === 0) {
        await this.sendMessageSafely(phone,
          '⚠️ Esses serviços já foram selecionados.\n\n' +
          'Digite outros números ou *CONTINUAR* para prosseguir.');
        return;
      }
      
      const updatedSelected = [...currentSelected, ...newServices];
      const totalPrice = updatedSelected.reduce((sum, s) => sum + s.price, 0);
      
      const servicesList = updatedSelected.map(s => `   • ${s.service} - R$ ${s.price.toFixed(2).replace('.', ',')}`).join('\n');
      const message = `✅ Serviços selecionados:\n\n${servicesList}\n\n` +
        `💰 *Total:* R$ ${totalPrice.toFixed(2).replace('.', ',')}\n\n` +
        'Deseja adicionar mais serviços?\n' +
        'Digite o *número* de outro serviço ou *CONTINUAR* para escolher a data.';

    await this.sendMessageSafely(phone, message);
      
    this.setUserSession(phone, {
      ...session,
        selectedServices: updatedSelected
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
      // VALIDAÇÃO: Verifica se está no step correto
      if (!session || session.step !== 'select_date') {
        await this.sendMessageSafely(phone,
          '⚠️ Você não está no processo de seleção de data.\n\n' +
          'Digite *MENU* para começar um novo agendamento.');
        return;
      }
      
      // VALIDAÇÃO: Verifica se há serviços selecionados
      const servicesForDate = session.selectedServices || (session.selectedService ? [session.selectedService] : []);
      if (servicesForDate.length === 0) {
      await this.sendMessageSafely(phone,
          '❌ Nenhum serviço selecionado. Por favor, inicie um novo agendamento.');
        await this.sendMainMenu(phone, session.clientName || '', false);
        this.setUserSession(phone, { step: 'main_menu', clientId: session.clientId, clientName: session.clientName });
      return;
    }

      const dateIndex = parseInt(text.trim(), 10) - 1;
      
      // VALIDAÇÃO: Verifica se há datas disponíveis
      if (!session.availableDates || session.availableDates.length === 0) {
        await this.sendMessageSafely(phone, '❌ Não há datas disponíveis. Por favor, tente novamente mais tarde.');
        await this.sendMainMenu(phone, session.clientName || '', false);
        this.setUserSession(phone, { step: 'main_menu', clientId: session.clientId, clientName: session.clientName });
        return;
      }
      
      if (isNaN(dateIndex) || dateIndex < 0 || dateIndex >= session.availableDates.length) {
      await this.sendMessageSafely(phone,
          `❌ Data inválida. Por favor, escolha um número entre 1 e ${session.availableDates.length}.`);
      return;
    }

      const selectedDate = session.availableDates[dateIndex];
      // Usa a duração total dos serviços selecionados
      const duration = session.totalDuration || servicesForDate.reduce((sum, s) => sum + (s.duration || 60), 0);
      const availableTimes = await this.getAvailableTimes(selectedDate, duration);
      
      if (!availableTimes || availableTimes.length === 0) {
        await this.sendMessageSafely(phone, '❌ Não há horários disponíveis para a data selecionada. Por favor, escolha outra data.');
        return;
      }
      
      const message = `Perfeito! 📅\n\n` +
        `*Data selecionada:* ${selectedDate.format('DD/MM/YYYY')}\n\n` +
        'Agora, escolha um horário disponível:\n\n' +
      availableTimes.map((time, index) =>
          `${index + 1}. ${time.format('HH:mm')}h`
      ).join('\n') +
        '\n\nDigite o *número* do horário desejado.';

    await this.sendMessageSafely(phone, message);
      
    this.setUserSession(phone, {
      ...session,
      step: 'select_time',
      selectedDate: selectedDate,
      availableTimes: availableTimes,
        duration: duration
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
      // VALIDAÇÃO: Verifica se está no step correto
      if (!session || session.step !== 'select_time') {
        await this.sendMessageSafely(phone,
          '⚠️ Você não está no processo de seleção de horário.\n\n' +
          'Digite *MENU* para começar um novo agendamento.');
        return;
      }
      
      // VALIDAÇÃO: Verifica se há serviços e data selecionados
      const servicesToCheck = session.selectedServices || (session.selectedService ? [session.selectedService] : []);
      if (servicesToCheck.length === 0) {
      await this.sendMessageSafely(phone,
          '❌ Nenhum serviço selecionado. Por favor, inicie um novo agendamento.');
        await this.sendMainMenu(phone, session.clientName || '', false);
        this.setUserSession(phone, { step: 'main_menu', clientId: session.clientId, clientName: session.clientName });
      return;
    }

      if (!session.selectedDate) {
        await this.sendMessageSafely(phone,
          '❌ Data não encontrada. Por favor, inicie um novo agendamento.');
        await this.sendMainMenu(phone, session.clientName || '', false);
        this.setUserSession(phone, { step: 'main_menu', clientId: session.clientId, clientName: session.clientName });
        return;
      }
      
      const timeIndex = parseInt(text.trim(), 10) - 1;
      
      // VALIDAÇÃO: Verifica se há horários disponíveis
      if (!session.availableTimes || session.availableTimes.length === 0) {
        await this.sendMessageSafely(phone, '❌ Não há horários disponíveis. Por favor, escolha outra data.');
        // Volta para seleção de data
        const availableDates = this.getAvailableDates();
        const message = `Escolha uma data para o agendamento:\n\n` +
          availableDates.map((date, index) => 
            `${index + 1}. ${date.format('DD/MM/YYYY')}`
          ).join('\n') +
          '\n\nDigite o *número* da data desejada.';
        await this.sendMessageSafely(phone, message);
        this.setUserSession(phone, {
          ...session,
          step: 'select_date',
          availableDates: availableDates
        });
        return;
      }
      
      if (isNaN(timeIndex) || timeIndex < 0 || timeIndex >= session.availableTimes.length) {
      await this.sendMessageSafely(phone,
          `❌ Horário inválido. Por favor, escolha um número entre 1 e ${session.availableTimes.length}.`);
      return;
    }

      const selectedTime = session.availableTimes[timeIndex];
      // O horário já está em UTC+3, mantemos assim para exibição
      const appointmentDateTime = selectedTime.clone().utcOffset(3);
      
      // Verifica se ainda há vagas disponíveis
      const duration = session.duration || session.selectedService?.duration || 60;
      // Para verificação de disponibilidade, usamos o horário em UTC+3
      const timeForCheck = appointmentDateTime.clone();
      const isAvailable = await this.checkAvailability(timeForCheck, duration);

      if (!isAvailable) {
        await this.sendMessageSafely(phone,
          '❌ Este horário não está mais disponível. Escolha outro horário.');
        return;
      }
      
      // Atualiza a sessão com os dados do agendamento
    this.setUserSession(phone, {
      ...session,
      step: 'confirm_booking',
      appointmentDateTime: appointmentDateTime
    });
      
      // Prepara lista de serviços para exibição
      const selectedServices = session.selectedServices || (session.selectedService ? [session.selectedService] : []);
      const servicesList = selectedServices.map(s => `   • ${s.service} - R$ ${s.price.toFixed(2).replace('.', ',')}`).join('\n');
      const totalPrice = session.totalPrice || selectedServices.reduce((sum, s) => sum + s.price, 0);
      
      // Envia mensagem de confirmação
      const message = `📋 *Resumo do Agendamento*\n\n` +
        `✂️ *Serviços:*\n${servicesList}\n\n` +
        `💰 *Valor total:* R$ ${totalPrice.toFixed(2).replace('.', ',')}\n` +
        `📅 *Data:* ${appointmentDateTime.format('DD/MM/YYYY')}\n` +
        `⏰ *Horário:* ${appointmentDateTime.format('HH:mm')}h\n\n` +
        'Está tudo correto?\n\n' +
        'Digite *CONFIRMAR* para finalizar ou *CANCELAR* para voltar e escolher novamente.';
        
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
      // VALIDAÇÃO: Verifica se está no step correto
      if (!session || session.step !== 'confirm_booking') {
          await this.sendMessageSafely(phone, 
          '⚠️ Você não está no processo de confirmação de agendamento.\n\n' +
          'Digite *MENU* para começar um novo agendamento.');
        return;
      }
      
      // VALIDAÇÃO: Verifica se todos os dados necessários estão presentes
      const servicesForValidation = session.selectedServices || (session.selectedService ? [session.selectedService] : []);
      if (servicesForValidation.length === 0) {
        await this.sendMessageSafely(phone,
          '❌ Nenhum serviço selecionado. Por favor, inicie um novo agendamento.');
        await this.sendMainMenu(phone, session.clientName || '', false);
        this.setUserSession(phone, { step: 'main_menu', clientId: session.clientId, clientName: session.clientName });
          return;
        }

        if (!session.appointmentDateTime) {
          await this.sendMessageSafely(phone, 
          '❌ Data e horário não encontrados. Por favor, inicie um novo agendamento.');
        await this.sendMainMenu(phone, session.clientName || '', false);
        this.setUserSession(phone, { step: 'main_menu', clientId: session.clientId, clientName: session.clientName });
          return;
        }

      const cleanText = text.trim().toLowerCase();
      
      if (cleanText === 'confirmar' || cleanText === 'confirm') {
        // Cria o agendamento no banco de dados
        const schedule = await this.createSchedule(session);
        
        if (!schedule || !schedule.id) {
          throw new Error('Falha ao criar agendamento');
        }

        // Prepara lista de serviços para exibição
        const selectedServices = session.selectedServices || (session.selectedService ? [session.selectedService] : []);
        const servicesList = selectedServices.map(s => `   • ${s.service} - R$ ${s.price.toFixed(2).replace('.', ',')}`).join('\n');
        const totalPrice = session.totalPrice || selectedServices.reduce((sum, s) => sum + s.price, 0);
        
        // Envia mensagem de confirmação
        const message = `✅ *Agendamento confirmado com sucesso!*\n\n` +
          `✂️ *Serviços:*\n${servicesList}\n\n` +
          `💰 *Valor total:* R$ ${totalPrice.toFixed(2).replace('.', ',')}\n` +
          `📅 *Data:* ${session.appointmentDateTime.format('DD/MM/YYYY')}\n` +
          `⏰ *Horário:* ${session.appointmentDateTime.format('HH:mm')}h\n\n` +
          'Muito obrigado por escolher o *Salão Fio a Fio*! 💇‍♀️✨\n\n' +
          'Estamos ansiosos para atendê-lo. Se precisar de algo, é só chamar!\n\n' +
          'Digite *MENU* para ver outras opções.';

        await this.sendMessageSafely(phone, message);
        
        // Limpa a sessão
        this.clearUserSession(phone);
      } else if (cleanText === 'cancelar' || cleanText === 'cancel') {
        // Volta para o início do processo de agendamento (seleção de serviço)
        await this.sendMessageSafely(phone,
          '🔄 Voltando para seleção de serviços...\n\n' +
          'Você pode escolher novamente os serviços, data e horário.');
        
        // Reinicia o processo de agendamento
        await this.startSchedulingProcess(phone, session.clientId, session.clientName);
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
      const schedules = await Schedules.findAll({
        where: {
          client_id_schedules: clientId,
          date_and_houres: {
            [Op.gte]: new Date() // Apenas agendamentos futuros
          }
        },
        include: [{
          model: Service,
          as: 'Services',
          through: { attributes: [] } // Não inclui dados da tabela de junção
        }],
        order: [['date_and_houres', 'ASC']],
        limit: 5 // Limita a 5 agendamentos
      });

      // Define sessão como "viewing_schedules" para evitar processamento incorreto de números
      const session = this.getUserSession(phone);

      if (!schedules || schedules.length === 0) {
        await this.sendMessageSafely(phone,
          `Olá ${clientName}! 👋\n\n` +
          `Você não possui agendamentos futuros no momento.\n\n` +
          `Digite *MENU* para ver outras opções.`);
        // Volta para o menu principal
        this.setUserSession(phone, { step: 'main_menu', clientId, clientName });
      } else {
        let message = `📅 *Seus próximos agendamentos*\n\n`;

      schedules.forEach((schedule, index) => {
          // Converte de UTC para UTC+3 para exibição
          const date = moment(schedule.date_and_houres).utcOffset(3);
          message += `*${index + 1}.* ${date.format('DD/MM/YYYY [às] HH:mm')}\n`;
          
          if (schedule.Services && schedule.Services.length > 0) {
            message += `   ✂️ ${schedule.Services.map(s => s.service).join(', ')}\n\n`;
          } else {
            message += '\n';
          }
        });
        
        message += 'Digite *MENU* para voltar ao início.';
      await this.sendMessageSafely(phone, message);
        
        // Define sessão como "viewing_schedules" para evitar que números sejam interpretados como comandos
        this.setUserSession(phone, { 
          step: 'viewing_schedules', 
          clientId, 
          clientName 
        });
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
    try {
      // Validações antes de criar o agendamento
      const selectedServices = session.selectedServices || (session.selectedService ? [session.selectedService] : []);
      if (selectedServices.length === 0) {
        throw new Error('Nenhum serviço selecionado. Por favor, inicie um novo agendamento.');
      }

      if (!session.appointmentDateTime) {
        throw new Error('Data e horário não encontrados. Por favor, inicie um novo agendamento.');
      }

      // Busca um provider (Admin ou Provider)
    const providers = await this.accountRepo.findByRoles(['admin', 'provider']);
    const providerId = (providers && providers.length > 0) 
      ? providers[0].id 
      : (process.env.DEFAULT_PROVIDER_ID || null);
      
    if (!providerId) {
        throw new Error("Nenhum prestador de serviço disponível.");
    }

      // O horário foi selecionado em UTC+3 (horário local do Brasil)
      // Para salvar no banco (que espera UTC), precisamos:
      // - Se o usuário selecionou 8h UTC+3, queremos salvar como 11h UTC (8h + 3h = 11h)
      // Isso garante que quando lermos do banco e convertermos para UTC+3, teremos 8h novamente
      const appointmentDate = session.appointmentDateTime.clone();
      // Garante que está em UTC+3 primeiro
      const dateInUTC3 = appointmentDate.utcOffset(3, true);
      // Converte para UTC (adiciona 3 horas ao horário para compensar o timezone)
      const dateToSave = dateInUTC3.utc().toDate();
      
      // Cria o agendamento usando o método do repositório
      const schedule = await this.schedulesRepo.addSchedules({
      name_client: session.clientName,
        date_and_houres: dateToSave,
      active: true,
      finished: false,
        client_id_schedules: session.clientId,
        provider_id_schedules: providerId
      });

      if (!schedule || !schedule.id) {
        throw new Error('Falha ao criar agendamento no banco de dados');
      }

      // Associa os serviços ao agendamento usando a tabela pivô
      const serviceIds = selectedServices.map(s => s.id);
      const serviceAssociation = await this.schedulesServiceRepo.addSchedule_Service(schedule.id, serviceIds);

      // Se a associação falhar, remove o agendamento criado (rollback)
      if (!serviceAssociation) {
        try {
          await Schedules.destroy({ where: { id: schedule.id } });
        } catch (destroyError) {
          console.error('Erro ao remover agendamento após falha na associação de serviço:', destroyError);
        }
        throw new Error('Falha ao associar serviço ao agendamento');
      }

      // Emitir evento Socket.IO para atualizar Dashboard em tempo real
      try {
        const { emitScheduleCreated } = require('../utils/socket.io');
        const fullSchedule = await this.schedulesRepo.findSchedules(schedule.id);
        if (fullSchedule) {
          emitScheduleCreated(fullSchedule);
        }
      } catch (socketError) {
        // Não falhar a criação se o Socket.IO não estiver disponível
        console.warn('Erro ao emitir evento Socket.IO:', socketError.message);
      }

      return schedule;
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      throw error;
    }
  }

  /**
   * Verifica disponibilidade de horário
   * Usa timezone UTC+3 (Brasil)
   */
  async checkAvailability(dateTime, duration) {
    // Garante que está trabalhando com UTC+3
    const startTime = moment(dateTime).utcOffset(3);
    const endTime = moment(dateTime).utcOffset(3).add(duration, 'minutes');
    
    // Capacidade máxima de 3 agendamentos simultâneos
    const MAX_CAPACITY = 3;

    // Conta quantos agendamentos existem no mesmo horário
    // Converte para UTC para comparar com o banco (que salva em UTC)
    const count = await Schedules.count({
      where: {
        active: true,
        date_and_houres: {
          [Op.gte]: startTime.utc().toDate(),
          [Op.lt]: endTime.utc().toDate()
        }
      }
    });
    
    return count < MAX_CAPACITY;
  }

  /**
   * Obtém datas disponíveis para agendamento (próximos 30 dias)
   * Usa timezone UTC+3 (Brasil)
   */
  getAvailableDates() {
    const dates = [];
    // Define timezone UTC+3 para o Brasil
    const today = moment().utcOffset(3).startOf('day');
    const endDate = moment().utcOffset(3).add(30, 'days');
    
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
   * Usa timezone UTC+3 (Brasil)
   */
  async getAvailableTimes(date, duration) {
    const times = [];
    const startHour = 8; // 8:00
    const endHour = 18;  // 18:00
    // Define timezone UTC+3 para comparação
    const now = moment().utcOffset(3);

    // Para cada hora do dia
    for (let hour = startHour; hour < endHour; hour++) {
      // Garante que a data está em UTC+3
      const time = moment(date).utcOffset(3).hour(hour).minute(0).second(0);

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
        '⏰ *Sessão encerrada por inatividade*\n\n' +
        'Olá! Percebi que você não respondeu por um tempo.\n' +
        'Sua sessão foi encerrada automaticamente.\n\n' +
        'Não se preocupe, você pode continuar de onde parou a qualquer momento.\n\n' +
        'Digite *MENU* para ver as opções disponíveis.');
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
   * Finaliza a sessão atual e retorna ao menu principal
   */
  async cancelProcess(phone) {
    try {
      // Limpa a sessão do usuário
      this.clearUserSession(phone);
      
      // Envia mensagem de sessão finalizada
      await this.sendMessageSafely(
        phone,
        '✅ *Sessão finalizada*\n\n' +
        'Sua sessão foi encerrada com sucesso.\n\n' +
        'Obrigado por usar o *Salão Fio a Fio*! 💇‍♀️✨\n\n' +
        'Se precisar de algo, é só digitar *MENU* a qualquer momento.'
      );
      
    } catch (error) {
      console.error('Erro ao processar finalização de sessão:', error);
      await this.sendMessageSafely(
        phone,
        '❌ Ocorreu um erro ao finalizar a sessão. Por favor, tente novamente.'
      );
    }
  }
}

module.exports = new WhatsAppController();
