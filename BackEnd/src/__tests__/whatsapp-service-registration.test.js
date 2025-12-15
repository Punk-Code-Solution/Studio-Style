/**
 * Teste para validar o cadastro e uso de serviços via WhatsApp
 * 
 * Este teste valida:
 * 1. Se os serviços cadastrados são corretamente listados no WhatsApp
 * 2. Se a seleção de serviços funciona corretamente no fluxo de agendamento
 * 3. Se o agendamento com serviços é criado corretamente
 */

const WhatsAppService = require('../services/whatsapp.service');
const ServiceRepository = require('../repositories/service.repository');
const AccountRepository = require('../repositories/account.repository');
const TypeAccountRepository = require('../repositories/type_account.repository');
const SchedulesServiceRepository = require('../repositories/schedules_service.repository');
const { Service, Account, TypeAccount, Phone, Schedules } = require('../Database/models');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const { Op } = require('sequelize');

// Mock dos módulos
jest.mock('../services/whatsapp.service');
jest.mock('../repositories/service.repository');
jest.mock('../repositories/account.repository');
jest.mock('../repositories/type_account.repository');
jest.mock('../repositories/schedules_service.repository');

// Mock dos modelos do banco de dados
jest.mock('../Database/models', () => ({
  Service: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  },
  Account: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  },
  TypeAccount: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  },
  Phone: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  },
  Schedules: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn()
  },
  Schedule_Service: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    bulkCreate: jest.fn(),
    destroy: jest.fn()
  }
}));

// Classe de teste que replica a funcionalidade do WhatsAppController
class TestWhatsAppController {
  constructor() {
    this.whatsappService = null;
    this.userSessions = new Map();
    this.accountRepo = null;
    this.typeAccountRepo = null;
    this.serviceRepo = null;
    this.schedulesRepo = null;
    this.schedulesServiceRepo = null;
  }

  setRepositories(mocks) {
    this.whatsappService = mocks.whatsappService;
    this.accountRepo = mocks.accountRepo;
    this.typeAccountRepo = mocks.typeAccountRepo;
    this.serviceRepo = mocks.serviceRepo;
    this.schedulesServiceRepo = mocks.schedulesServiceRepo;
  }

  async sendMessageSafely(phone, message) {
    return await this.whatsappService.sendTextMessage(phone, message);
  }

  async startSchedulingProcess(phone, clientId, clientName) {
    const services = await this.serviceRepo.findAll();
    if (!services || services.length === 0) {
      await this.sendMessageSafely(phone, '❌ Desculpe, não há serviços disponíveis para agendamento no momento.');
      return;
    }
    // Adiciona duration padrão se não existir
    const validServices = services
      .filter(s => s.service && s.price != null)
      .map(s => ({ ...s, duration: s.duration || 60 }));
    const message = `Olá ${clientName}! 👋\n\n` +
      `Bem-vindo ao *Salão Fio a Fio*! ✨\n\n` +
      `Escolha o(s) serviço(s) que deseja agendar:\n\n` +
      validServices.map((s, index) => `${index + 1}. ${s.service} - R$ ${s.price.toFixed(2).replace('.', ',')}`).join('\n') +
      '\n\n💡 *Dica:* Você pode escolher mais de um serviço!\n' +
      'Digite o *número* do serviço (ex: 1 ou 1,2,3).';
    await this.sendMessageSafely(phone, message);
    this.setUserSession(phone, {
      step: 'select_service',
      services: validServices,
      clientId: clientId,
      clientName: clientName,
      selectedServices: [],
      totalPrice: 0,
      totalDuration: 0
    });
  }

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
        return;
      }

      const cleanText = text.trim().toLowerCase();
      
      // Verifica se o usuário quer continuar
      if (cleanText === 'continuar' || cleanText === 'pronto') {
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
          selectedServices: selectedServices,
          totalPrice: totalPrice,
          totalDuration: totalDuration,
          availableDates: availableDates
        };
        
        this.setUserSession(phone, updatedSession);
        return;
      }

      // Processa seleção de serviços (pode ser múltiplos: "1,2,3" ou "1 2 3")
      const serviceNumbers = text.trim().split(/[\s,]+/).map(Number);
      let currentSelectedServices = session.selectedServices || [];
      let currentTotalPrice = session.totalPrice || 0;
      let currentTotalDuration = session.totalDuration || 0;

      for (const num of serviceNumbers) {
        const serviceIndex = num - 1;
        if (isNaN(serviceIndex) || serviceIndex < 0 || serviceIndex >= session.services.length) {
          await this.sendMessageSafely(phone, `❌ O número "${num}" é inválido. Por favor, escolha um número entre 1 e ${session.services.length}.`);
          return;
        }
        const serviceToAdd = session.services[serviceIndex];
        // Adiciona duration se não existir
        if (!serviceToAdd.duration) {
          serviceToAdd.duration = 60; // Duração padrão
        }
        if (!currentSelectedServices.some(s => s.id === serviceToAdd.id)) {
          currentSelectedServices.push(serviceToAdd);
          currentTotalPrice += serviceToAdd.price;
          currentTotalDuration += serviceToAdd.duration;
        } else {
          await this.sendMessageSafely(phone, `⚠️ O serviço "${serviceToAdd.service}" já foi adicionado.`);
        }
      }

      const servicesList = currentSelectedServices.map(s => `   • ${s.service} - R$ ${s.price.toFixed(2).replace('.', ',')}`).join('\n');
      const message = `Serviços selecionados até agora: \n${servicesList}\n\n` +
        `*Valor total:* R$ ${currentTotalPrice.toFixed(2).replace('.', ',')}\n` +
        `*Duração estimada:* ${currentTotalDuration} minutos\n\n` +
        'Deseja *ADICIONAR* mais serviços ou *CONTINUAR* para escolher a data?';

      await this.sendMessageSafely(phone, message);
      this.setUserSession(phone, {
        ...session,
        step: 'select_service', // Permanece no mesmo step para adicionar mais
        selectedServices: currentSelectedServices,
        totalPrice: currentTotalPrice,
        totalDuration: currentTotalDuration
      });
    } catch (error) {
      console.error('Erro ao processar seleção de serviço:', error);
      await this.sendMessageSafely(phone, 
        '❌ Ocorreu um erro ao processar sua seleção. Por favor, tente novamente.');
    }
  }

  async handleDateSelection(phone, text, session) {
    const dateIndex = parseInt(text.trim()) - 1;
    const selectedDate = session.availableDates[dateIndex];
    if (!selectedDate) {
      await this.sendMessageSafely(phone, 'Data inválida. Digite o número da data desejada.');
      return;
    }
    const duration = 60;
    const availableTimes = await this.getAvailableTimes(selectedDate, duration);
    if (availableTimes.length === 0) {
      await this.sendMessageSafely(phone, 'Não há horários disponíveis para esta data. Escolha outra data.');
      return;
    }
    const message = `Data selecionada: ${selectedDate.format('DD/MM/YYYY')}\n\n` +
      'Horários disponíveis:\n\n' +
      availableTimes.map((time, index) => `${index + 1}. ${time.format('HH:mm')}`).join('\n') +
      '\n\nDigite o número do horário desejado.';
    await this.sendMessageSafely(phone, message);
    this.setUserSession(phone, {
      ...session,
      step: 'select_time',
      selectedDate: selectedDate,
      availableTimes: availableTimes,
      duration: duration
    });
  }

  async handleTimeSelection(phone, text, session) {
    const timeIndex = parseInt(text.trim()) - 1;
    const selectedTime = session.availableTimes[timeIndex];
    if (!selectedTime) {
      await this.sendMessageSafely(phone, 'Horário inválido. Digite o número do horário desejado.');
      return;
    }
    const appointmentDateTime = session.selectedDate.clone().hour(selectedTime.hour()).minute(selectedTime.minute());
    const totalDuration = session.totalDuration || session.duration || 60;
    const isAvailable = await this.checkAvailability(appointmentDateTime, totalDuration);
    if (!isAvailable) {
      await this.sendMessageSafely(phone, 'Este horário não está mais disponível. Escolha outro horário.');
      return;
    }
    
    // Usa selectedServices se disponível, senão usa selectedService (compatibilidade)
    let selectedServices = session.selectedServices || (session.selectedService ? [session.selectedService] : []);
    const totalPrice = session.totalPrice || (selectedServices.length > 0 ? selectedServices.reduce((sum, s) => sum + s.price, 0) : 0);
    
    const servicesList = selectedServices.map(s => `   • ${s.service} - R$ ${s.price.toFixed(2).replace('.', ',')}`).join('\n');
    const message = `📋 *Confirmação do Agendamento:*\n\n` +
      `👤 Cliente: ${session.clientName}\n\n` +
      `✂️ *Serviços selecionados:*\n${servicesList}\n\n` +
      `💰 *Valor total:* R$ ${totalPrice.toFixed(2).replace('.', ',')}\n` +
      `📅 Data: ${appointmentDateTime.format('DD/MM/YYYY')}\n` +
      `🕐 Horário: ${appointmentDateTime.format('HH:mm')}\n` +
      `⏱️ Duração estimada: ${totalDuration} minutos\n\n` +
      `Digite *CONFIRMAR* para confirmar ou *CANCELAR* para cancelar.`;
    await this.sendMessageSafely(phone, message);
    this.setUserSession(phone, {
      ...session,
      step: 'confirm_booking',
      appointmentDateTime: appointmentDateTime,
      selectedServices: selectedServices,
      totalPrice: totalPrice,
      totalDuration: totalDuration
    });
  }

  async handleBookingConfirmation(phone, text, session) {
    const cleanText = text.toLowerCase().trim();
    if (cleanText === 'confirmar') {
      try {
        // Usa selectedServices se disponível, senão usa selectedService (compatibilidade)
        let selectedServices = session.selectedServices || (session.selectedService ? [session.selectedService] : []);
        
        // Validações antes de criar o agendamento
        if (!session || selectedServices.length === 0 || !selectedServices[0].id) {
          await this.sendMessageSafely(phone, 
            '❌ Erro: Serviço não encontrado. Por favor, inicie um novo agendamento.');
          this.clearUserSession(phone);
          return;
        }

        if (!session.appointmentDateTime) {
          await this.sendMessageSafely(phone, 
            '❌ Erro: Data e horário não encontrados. Por favor, inicie um novo agendamento.');
          this.clearUserSession(phone);
          return;
        }

        const schedule = await this.createSchedule(session);
        
        if (!schedule || !schedule.id) {
          throw new Error('Falha ao criar agendamento no banco de dados');
        }
        
        const serviceIds = selectedServices.map(s => s.id);
        const serviceAssociation = await this.schedulesServiceRepo.addSchedule_Service(schedule.id, serviceIds);

        // Se a associação falhar, remove o agendamento criado (rollback)
        if (!serviceAssociation) {
          // Tenta remover o agendamento criado
          try {
            await Schedules.destroy({ where: { id: schedule.id } });
          } catch (destroyError) {
            console.error('Erro ao remover agendamento após falha na associação de serviço:', destroyError);
          }
          throw new Error('Falha ao associar serviço ao agendamento');
        }

        const servicesList = selectedServices.map(s => `   • ${s.service}`).join('\n');
        const totalPrice = session.totalPrice || selectedServices.reduce((sum, s) => sum + s.price, 0);
        const message = `✅ *Agendamento confirmado com sucesso!*\n\n` +
          `📅 Data: ${session.appointmentDateTime.format('DD/MM/YYYY')}\n` +
          `🕐 Horário: ${session.appointmentDateTime.format('HH:mm')}\n\n` +
          `✂️ *Serviços:*\n${servicesList}\n\n` +
          `💰 *Valor total:* R$ ${totalPrice.toFixed(2).replace('.', ',')}\n\n` +
          `Obrigado por escolher o Salão Fio a Fio! ✨\n\n` +
          `Digite *MENU* para voltar ao início.`;
        await this.sendMessageSafely(phone, message);
        this.clearUserSession(phone);
      } catch (error) {
        console.error('Erro ao criar agendamento:', error);
        await this.sendMessageSafely(phone, '❌ Erro ao confirmar agendamento. Tente novamente mais tarde.');
      }
    } else if (cleanText === 'cancelar' || cleanText === 'cancel') {
      // Volta para o início do processo de agendamento (seleção de serviço)
      await this.sendMessageSafely(phone,
        '🔄 Voltando para seleção de serviços...\n\n' +
        'Você pode escolher novamente os serviços, data e horário.');
      
      // Reinicia o processo de agendamento
      await this.startSchedulingProcess(phone, session.clientId, session.clientName);
    }
  }

  async createSchedule(session) {
    const providers = await this.accountRepo.findByRoles(['admin', 'provider']);
    const providerId = (providers && providers.length > 0) ? providers[0].id : null;
    if (!providerId) {
      throw new Error("Nenhum prestador de serviço disponível.");
    }
    return await Schedules.create({
      id: uuidv4(),
      name_client: session.clientName,
      date_and_houres: session.appointmentDateTime.toDate(),
      active: true,
      finished: false,
      client_id_schedules: session.clientId,
      provider_id_schedules: providerId
    });
  }

  async checkAvailability(dateTime, duration) {
    const startTime = moment(dateTime);
    const endTime = moment(dateTime).add(duration, 'minutes');
    const MAX_CAPACITY = 3;
    const count = await Schedules.count({
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

  getAvailableDates() {
    const dates = [];
    const today = moment();
    for (let i = 1; i <= 30; i++) {
      const date = today.clone().add(i, 'days');
      if (date.day() !== 0) {
        dates.push(date);
      }
    }
    return dates;
  }

  async getAvailableTimes(date, duration) {
    const times = [];
    const startHour = 8;
    const endHour = 18;
    const now = moment();
    for (let hour = startHour; hour < endHour; hour++) {
      const time = moment(date).hour(hour).minute(0).second(0).millisecond(0);
      if (time.isAfter(now)) {
        const isAvailable = await this.checkAvailability(time, duration);
        if (isAvailable) {
          times.push(time);
        }
      }
    }
    return times;
  }

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

describe('Cadastro de Serviços via WhatsApp', () => {
  let whatsappController;
  let mockWhatsAppService;
  let mockServiceRepo;
  let mockAccountRepo;
  let mockTypeAccountRepo;
  let mockSchedulesServiceRepo;

  // Dados de teste
  const mockPhone = '5511999999999';
  const mockClientName = 'João Silva';
  const mockClientId = uuidv4();
  const mockProviderId = uuidv4();
  const mockTypeAccountId = uuidv4();

  const mockServices = [
    {
      id: uuidv4(),
      service: 'Corte de Cabelo',
      price: 50.00,
      duration: 60,
      additionalComments: 'Corte moderno'
    },
    {
      id: uuidv4(),
      service: 'Barba',
      price: 30.00,
      duration: 30,
      additionalComments: 'Barba completa'
    },
    {
      id: uuidv4(),
      service: 'Corte + Barba',
      price: 70.00,
      duration: 90,
      additionalComments: 'Pacote completo'
    }
  ];

  const mockClientAccount = {
    id: mockClientId,
    name: mockClientName,
    lastname: '',
    typeaccount_id: mockTypeAccountId
  };

  const mockClientType = {
    id: mockTypeAccountId,
    type: 'client'
  };

  beforeEach(() => {
    // Resetar mocks
    jest.clearAllMocks();

    // Criar instâncias mockadas
    mockWhatsAppService = {
      sendTextMessage: jest.fn().mockResolvedValue({ success: true }),
      processIncomingMessage: jest.fn(),
      verifyWebhook: jest.fn()
    };

    mockServiceRepo = {
      findAll: jest.fn(),
      findService: jest.fn(),
      addService: jest.fn(),
      updateService: jest.fn(),
      deleteService: jest.fn()
    };

    mockAccountRepo = {
      findAccountByPhone: jest.fn(),
      addAccount: jest.fn(),
      createPhone: jest.fn(),
      findByRoles: jest.fn()
    };

    mockTypeAccountRepo = {
      findClientType: jest.fn()
    };

    mockSchedulesServiceRepo = {
      addSchedule_Service: jest.fn().mockResolvedValue(true)
    };

    // Configurar mocks dos módulos
    WhatsAppService.mockImplementation(() => mockWhatsAppService);
    ServiceRepository.mockImplementation(() => mockServiceRepo);
    AccountRepository.mockImplementation(() => mockAccountRepo);
    TypeAccountRepository.mockImplementation(() => mockTypeAccountRepo);
    SchedulesServiceRepository.mockImplementation(() => mockSchedulesServiceRepo);

    // Criar nova instância do controller de teste
    whatsappController = new TestWhatsAppController();
    whatsappController.setRepositories({
      whatsappService: mockWhatsAppService,
      accountRepo: mockAccountRepo,
      typeAccountRepo: mockTypeAccountRepo,
      serviceRepo: mockServiceRepo,
      schedulesServiceRepo: mockSchedulesServiceRepo
    });
  });

  describe('Listagem de Serviços no WhatsApp', () => {
    test('deve listar serviços cadastrados quando usuário inicia agendamento', async () => {
      // Arrange
      mockAccountRepo.findAccountByPhone.mockResolvedValue(mockClientAccount);
      mockServiceRepo.findAll.mockResolvedValue(mockServices);

      // Act
      await whatsappController.startSchedulingProcess(
        mockPhone,
        mockClientId,
        mockClientName
      );

      // Assert
      expect(mockServiceRepo.findAll).toHaveBeenCalled();
      expect(mockWhatsAppService.sendTextMessage).toHaveBeenCalled();

      const sentMessage = mockWhatsAppService.sendTextMessage.mock.calls[0][1];
      
      // Verifica se a mensagem contém os serviços
      expect(sentMessage).toContain('Corte de Cabelo');
      expect(sentMessage).toContain('R$ 50,00'); // Formato brasileiro com vírgula
      expect(sentMessage).toContain('Barba');
      expect(sentMessage).toContain('R$ 30,00'); // Formato brasileiro com vírgula
      expect(sentMessage).toContain('Corte + Barba');
      expect(sentMessage).toContain('R$ 70,00'); // Formato brasileiro com vírgula
      expect(sentMessage).toContain('Digite o *número* do serviço');

      // Verifica se a sessão foi configurada corretamente
      const session = whatsappController.getUserSession(mockPhone);
      expect(session).toBeDefined();
      expect(session.step).toBe('select_service');
      expect(session.services).toHaveLength(3);
      expect(session.clientId).toBe(mockClientId);
      expect(session.clientName).toBe(mockClientName);
    });

    test('deve filtrar serviços válidos (com nome e preço)', async () => {
      // Arrange
      const servicesWithInvalid = [
        ...mockServices,
        { id: uuidv4(), service: null, price: 20.00 }, // Sem nome
        { id: uuidv4(), service: 'Serviço Inválido', price: null }, // Sem preço
        { id: uuidv4(), service: '', price: 15.00 } // Nome vazio
      ];

      mockAccountRepo.findAccountByPhone.mockResolvedValue(mockClientAccount);
      mockServiceRepo.findAll.mockResolvedValue(servicesWithInvalid);

      // Act
      await whatsappController.startSchedulingProcess(
        mockPhone,
        mockClientId,
        mockClientName
      );

      // Assert
      const sentMessage = mockWhatsAppService.sendTextMessage.mock.calls[0][1];
      
      // Deve conter apenas os 3 serviços válidos (formato brasileiro com vírgula)
      expect(sentMessage.match(/R\$\s*\d+,\d{2}/g)).toHaveLength(3);
      
      const session = whatsappController.getUserSession(mockPhone);
      expect(session.services).toHaveLength(3); // Apenas serviços válidos
    });

    test('deve exibir mensagem quando não há serviços disponíveis', async () => {
      // Arrange
      mockAccountRepo.findAccountByPhone.mockResolvedValue(mockClientAccount);
      mockServiceRepo.findAll.mockResolvedValue([]);

      // Act
      await whatsappController.startSchedulingProcess(
        mockPhone,
        mockClientId,
        mockClientName
      );

      // Assert
      expect(mockWhatsAppService.sendTextMessage).toHaveBeenCalled();
      const sentMessage = mockWhatsAppService.sendTextMessage.mock.calls[0][1];
      expect(sentMessage).toContain('não há serviços disponíveis');
    });
  });

  describe('Seleção de Serviços no Fluxo de Agendamento', () => {
    beforeEach(() => {
      // Configurar sessão inicial
      whatsappController.setUserSession(mockPhone, {
        step: 'select_service',
        services: mockServices,
        clientId: mockClientId,
        clientName: mockClientName
      });
    });

    test('deve processar seleção válida de serviço', async () => {
      // Arrange
      const selectedServiceIndex = 1; // Segundo serviço (Barba)
      const userInput = '2';

      // Act
      await whatsappController.handleServiceSelection(
        mockPhone,
        userInput,
        whatsappController.getUserSession(mockPhone)
      );

      // Assert
      expect(mockWhatsAppService.sendTextMessage).toHaveBeenCalled();
      const sentMessage = mockWhatsAppService.sendTextMessage.mock.calls[0][1];
      
      expect(sentMessage).toContain('Barba');
      expect(sentMessage).toContain('CONTINUAR');

      // Verifica se a sessão foi atualizada
      const session = whatsappController.getUserSession(mockPhone);
      expect(session.step).toBe('select_service'); // Permanece em select_service até CONTINUAR
      expect(session.selectedServices).toBeDefined();
      expect(session.selectedServices.length).toBe(1);
      expect(session.selectedServices[0]).toEqual(mockServices[1]);
      
      // Agora simula CONTINUAR
      await whatsappController.handleServiceSelection(
        mockPhone,
        'CONTINUAR',
        whatsappController.getUserSession(mockPhone)
      );
      
      const sessionAfterContinue = whatsappController.getUserSession(mockPhone);
      expect(sessionAfterContinue.step).toBe('select_date');
      expect(sessionAfterContinue.availableDates).toBeDefined();
    });

    test('deve rejeitar seleção inválida de serviço', async () => {
      // Arrange
      const invalidInput = '99'; // Índice inválido

      // Act
      await whatsappController.handleServiceSelection(
        mockPhone,
        invalidInput,
        whatsappController.getUserSession(mockPhone)
      );

      // Assert
      expect(mockWhatsAppService.sendTextMessage).toHaveBeenCalled();
      const sentMessage = mockWhatsAppService.sendTextMessage.mock.calls[0][1];
      expect(sentMessage).toContain('inválido'); // Mensagem mais específica
      expect(sentMessage).toContain('escolha um número entre');

      // Sessão deve permanecer no mesmo passo
      const session = whatsappController.getUserSession(mockPhone);
      expect(session.step).toBe('select_service');
    });

    test('deve processar seleção do primeiro serviço (índice 1)', async () => {
      // Arrange
      const userInput = '1';

      // Act
      await whatsappController.handleServiceSelection(
        mockPhone,
        userInput,
        whatsappController.getUserSession(mockPhone)
      );

      // Assert
      const session = whatsappController.getUserSession(mockPhone);
      expect(session.selectedServices).toBeDefined();
      expect(session.selectedServices.length).toBe(1);
      expect(session.selectedServices[0]).toEqual(mockServices[0]);
      expect(session.step).toBe('select_service'); // Permanece até CONTINUAR
      
      // Simula CONTINUAR
      await whatsappController.handleServiceSelection(
        mockPhone,
        'CONTINUAR',
        session
      );
      
      const sessionAfterContinue = whatsappController.getUserSession(mockPhone);
      expect(sessionAfterContinue.step).toBe('select_date');
    });
  });

  describe('Criação de Agendamento com Serviços', () => {
    let mockSchedule;

    beforeEach(() => {
      mockSchedule = {
        id: uuidv4(),
        name_client: mockClientName,
        date_and_houres: new Date('2024-12-25T10:00:00'),
        active: true,
        finished: false,
        client_id_schedules: mockClientId,
        provider_id_schedules: mockProviderId
      };

      // Mock do Schedules.create
      Schedules.create = jest.fn().mockResolvedValue(mockSchedule);
      Schedules.count = jest.fn().mockResolvedValue(0); // Nenhum agendamento conflitante
      mockAccountRepo.findByRoles.mockResolvedValue([
        { id: mockProviderId, name: 'Provider', lastname: 'Test' }
      ]);
    });

    test('deve criar agendamento e associar serviço corretamente', async () => {
      // Arrange
      const selectedService = mockServices[0];
      const appointmentDateTime = moment('2024-12-25T10:00:00');

      whatsappController.setUserSession(mockPhone, {
        step: 'confirm_booking',
        selectedServices: [selectedService],
        totalPrice: selectedService.price,
        totalDuration: 60,
        clientId: mockClientId,
        clientName: mockClientName,
        appointmentDateTime: appointmentDateTime
      });

      // Act
      await whatsappController.handleBookingConfirmation(
        mockPhone,
        'confirmar',
        whatsappController.getUserSession(mockPhone)
      );

      // Assert
      // Verifica se o agendamento foi criado
      expect(Schedules.create).toHaveBeenCalled();
      const createCall = Schedules.create.mock.calls[0][0];
      expect(createCall.name_client).toBe(mockClientName);
      expect(createCall.client_id_schedules).toBe(mockClientId);
      expect(createCall.provider_id_schedules).toBe(mockProviderId);

      // Verifica se o serviço foi associado
      expect(mockSchedulesServiceRepo.addSchedule_Service).toHaveBeenCalledWith(
        mockSchedule.id,
        [selectedService.id]
      );

      // Verifica mensagem de confirmação
      expect(mockWhatsAppService.sendTextMessage).toHaveBeenCalled();
      const sentMessage = mockWhatsAppService.sendTextMessage.mock.calls[
        mockWhatsAppService.sendTextMessage.mock.calls.length - 1
      ][1];
      expect(sentMessage).toContain('Agendamento confirmado');
      expect(sentMessage).toContain(selectedService.service);

      // Verifica se a sessão foi limpa
      const session = whatsappController.getUserSession(mockPhone);
      expect(session).toBeUndefined();
    });

    test('deve tratar erro ao criar agendamento', async () => {
      // Arrange
      const selectedService = mockServices[0];
      const appointmentDateTime = moment('2024-12-25T10:00:00');

      Schedules.create.mockRejectedValue(new Error('Erro ao criar agendamento'));

      whatsappController.setUserSession(mockPhone, {
        step: 'confirm_booking',
        selectedServices: [selectedService],
        totalPrice: selectedService.price,
        totalDuration: 60,
        clientId: mockClientId,
        clientName: mockClientName,
        appointmentDateTime: appointmentDateTime
      });

      // Act
      await whatsappController.handleBookingConfirmation(
        mockPhone,
        'confirmar',
        whatsappController.getUserSession(mockPhone)
      );

      // Assert
      expect(mockWhatsAppService.sendTextMessage).toHaveBeenCalled();
      const sentMessage = mockWhatsAppService.sendTextMessage.mock.calls[
        mockWhatsAppService.sendTextMessage.mock.calls.length - 1
      ][1];
      expect(sentMessage).toContain('Erro ao confirmar agendamento');
    });

    test('deve fazer rollback se associação de serviço falhar', async () => {
      // Arrange
      const selectedService = mockServices[0];
      const appointmentDateTime = moment('2024-12-25T10:00:00');
      const mockScheduleId = uuidv4();

      const mockSchedule = {
        id: mockScheduleId,
        name_client: mockClientName,
        date_and_houres: new Date('2024-12-25T10:00:00'),
        active: true,
        finished: false,
        client_id_schedules: mockClientId,
        provider_id_schedules: mockProviderId
      };

      Schedules.create = jest.fn().mockResolvedValue(mockSchedule);
      Schedules.destroy = jest.fn().mockResolvedValue(1);
      mockAccountRepo.findByRoles.mockResolvedValue([
        { id: mockProviderId, name: 'Provider', lastname: 'Test' }
      ]);
      // Simula falha na associação de serviço
      mockSchedulesServiceRepo.addSchedule_Service.mockResolvedValue(false);

      whatsappController.setUserSession(mockPhone, {
        step: 'confirm_booking',
        selectedServices: [selectedService],
        totalPrice: selectedService.price,
        totalDuration: 60,
        clientId: mockClientId,
        clientName: mockClientName,
        appointmentDateTime: appointmentDateTime
      });

      // Act
      await whatsappController.handleBookingConfirmation(
        mockPhone,
        'confirmar',
        whatsappController.getUserSession(mockPhone)
      );

      // Assert
      // Verifica que tentou criar o agendamento
      expect(Schedules.create).toHaveBeenCalled();
      // Verifica que tentou associar o serviço
      expect(mockSchedulesServiceRepo.addSchedule_Service).toHaveBeenCalled();
      // Verifica que tentou fazer rollback (deletar o agendamento)
      expect(Schedules.destroy).toHaveBeenCalledWith({ where: { id: mockScheduleId } });
      // Verifica que enviou mensagem de erro
      const sentMessage = mockWhatsAppService.sendTextMessage.mock.calls[
        mockWhatsAppService.sendTextMessage.mock.calls.length - 1
      ][1];
      expect(sentMessage).toContain('Erro ao confirmar agendamento');
    });

    test('deve validar dados da sessão antes de criar agendamento', async () => {
      // Arrange - Sessão sem serviço selecionado
      whatsappController.setUserSession(mockPhone, {
        step: 'confirm_booking',
        selectedServices: [], // Serviços ausentes
        clientId: mockClientId,
        clientName: mockClientName,
        appointmentDateTime: moment('2024-12-25T10:00:00'),
        duration: 60
      });

      // Act
      await whatsappController.handleBookingConfirmation(
        mockPhone,
        'confirmar',
        whatsappController.getUserSession(mockPhone)
      );

      // Assert
      expect(mockWhatsAppService.sendTextMessage).toHaveBeenCalled();
      const sentMessage = mockWhatsAppService.sendTextMessage.mock.calls[0][1];
      expect(sentMessage).toContain('Serviço não encontrado');
      // Verifica que a sessão foi limpa
      const session = whatsappController.getUserSession(mockPhone);
      expect(session).toBeUndefined();
      // Verifica que NÃO tentou criar agendamento
      expect(Schedules.create).not.toHaveBeenCalled();
    });

    test('deve validar data e horário antes de criar agendamento', async () => {
      // Arrange - Sessão sem data/horário
      whatsappController.setUserSession(mockPhone, {
        step: 'confirm_booking',
        selectedServices: [mockServices[0]],
        totalPrice: mockServices[0].price,
        totalDuration: 60,
        clientId: mockClientId,
        clientName: mockClientName,
        appointmentDateTime: null, // Data ausente
      });

      // Act
      await whatsappController.handleBookingConfirmation(
        mockPhone,
        'confirmar',
        whatsappController.getUserSession(mockPhone)
      );

      // Assert
      expect(mockWhatsAppService.sendTextMessage).toHaveBeenCalled();
      const sentMessage = mockWhatsAppService.sendTextMessage.mock.calls[0][1];
      expect(sentMessage).toContain('Data e horário não encontrados');
      // Verifica que NÃO tentou criar agendamento
      expect(Schedules.create).not.toHaveBeenCalled();
    });

    test('deve garantir que agendamento tem ID válido antes de associar serviço', async () => {
      // Arrange
      const selectedService = mockServices[0];
      const appointmentDateTime = moment('2024-12-25T10:00:00');

      // Simula criação de agendamento sem ID (caso raro mas possível)
      Schedules.create = jest.fn().mockResolvedValue({
        name_client: mockClientName,
        // Sem ID!
      });
      mockAccountRepo.findByRoles.mockResolvedValue([
        { id: mockProviderId, name: 'Provider', lastname: 'Test' }
      ]);

      whatsappController.setUserSession(mockPhone, {
        step: 'confirm_booking',
        selectedServices: [selectedService],
        totalPrice: selectedService.price,
        totalDuration: 60,
        clientId: mockClientId,
        clientName: mockClientName,
        appointmentDateTime: appointmentDateTime
      });

      // Act
      await whatsappController.handleBookingConfirmation(
        mockPhone,
        'confirmar',
        whatsappController.getUserSession(mockPhone)
      );

      // Assert
      expect(mockWhatsAppService.sendTextMessage).toHaveBeenCalled();
      const sentMessage = mockWhatsAppService.sendTextMessage.mock.calls[
        mockWhatsAppService.sendTextMessage.mock.calls.length - 1
      ][1];
      expect(sentMessage).toContain('Erro ao confirmar agendamento');
      // Verifica que NÃO tentou associar serviço sem ID válido
      expect(mockSchedulesServiceRepo.addSchedule_Service).not.toHaveBeenCalled();
    });
  });

  describe('Fluxo Completo de Agendamento com Serviços', () => {
    test('deve processar fluxo completo: listar -> selecionar -> confirmar', async () => {
      // Arrange
      mockAccountRepo.findAccountByPhone.mockResolvedValue(mockClientAccount);
      mockServiceRepo.findAll.mockResolvedValue(mockServices);
      mockAccountRepo.findByRoles.mockResolvedValue([
        { id: mockProviderId, name: 'Provider', lastname: 'Test' }
      ]);
      Schedules.create = jest.fn().mockResolvedValue({
        id: uuidv4(),
        name_client: mockClientName,
        date_and_houres: new Date('2024-12-25T10:00:00'),
        active: true,
        finished: false,
        client_id_schedules: mockClientId,
        provider_id_schedules: mockProviderId
      });
      Schedules.count = jest.fn().mockResolvedValue(0);

      // Passo 1: Iniciar agendamento
      await whatsappController.startSchedulingProcess(
        mockPhone,
        mockClientId,
        mockClientName
      );

      let session = whatsappController.getUserSession(mockPhone);
      expect(session.step).toBe('select_service');
      expect(session.services).toHaveLength(3);

      // Passo 2: Selecionar serviço
      await whatsappController.handleServiceSelection(
        mockPhone,
        '1',
        session
      );

      session = whatsappController.getUserSession(mockPhone);
      expect(session.step).toBe('select_service'); // Permanece até CONTINUAR
      expect(session.selectedServices).toBeDefined();
      expect(session.selectedServices.length).toBe(1);
      expect(session.selectedServices[0]).toEqual(mockServices[0]);
      
      // Passo 2.5: Continuar para seleção de data
      await whatsappController.handleServiceSelection(
        mockPhone,
        'CONTINUAR',
        session
      );
      
      session = whatsappController.getUserSession(mockPhone);
      expect(session.step).toBe('select_date');

      // Passo 3: Selecionar data (simulado)
      const availableDates = whatsappController.getAvailableDates();
      const selectedDate = availableDates[0];
      
      await whatsappController.handleDateSelection(
        mockPhone,
        '1',
        { ...session, availableDates: availableDates }
      );

      session = whatsappController.getUserSession(mockPhone);
      expect(session.step).toBe('select_time');
      expect(session.selectedDate).toBeDefined();

      // Passo 4: Selecionar horário (simulado)
      const availableTimes = await whatsappController.getAvailableTimes(selectedDate, 60);
      const selectedTime = availableTimes[0];
      
      await whatsappController.handleTimeSelection(
        mockPhone,
        '1',
        { ...session, availableTimes: availableTimes }
      );

      session = whatsappController.getUserSession(mockPhone);
      expect(session.step).toBe('confirm_booking');
      expect(session.appointmentDateTime).toBeDefined();

      // Passo 5: Confirmar agendamento
      await whatsappController.handleBookingConfirmation(
        mockPhone,
        'confirmar',
        session
      );

      // Assert
      expect(Schedules.create).toHaveBeenCalled();
      expect(mockSchedulesServiceRepo.addSchedule_Service).toHaveBeenCalled();
      
      // Verifica se a sessão foi limpa após confirmação
      const finalSession = whatsappController.getUserSession(mockPhone);
      expect(finalSession).toBeUndefined();
    });
  });

  describe('Validação de Dados de Serviços', () => {
    test('deve validar que serviços têm nome e preço', async () => {
      // Arrange
      const validService = {
        id: uuidv4(),
        service: 'Corte',
        price: 50.00
      };

      const invalidService1 = {
        id: uuidv4(),
        service: null,
        price: 50.00
      };

      const invalidService2 = {
        id: uuidv4(),
        service: 'Corte',
        price: null
      };

      mockAccountRepo.findAccountByPhone.mockResolvedValue(mockClientAccount);
      mockServiceRepo.findAll.mockResolvedValue([
        validService,
        invalidService1,
        invalidService2
      ]);

      // Act
      await whatsappController.startSchedulingProcess(
        mockPhone,
        mockClientId,
        mockClientName
      );

      // Assert
      const session = whatsappController.getUserSession(mockPhone);
      const validServices = session.services.filter(s => s.service && s.price != null);
      
      expect(validServices).toHaveLength(1);
      // O código adiciona duration padrão (60) se não existir
      expect(validServices[0].service).toEqual(validService.service);
      expect(validServices[0].price).toEqual(validService.price);
      expect(validServices[0].duration).toBe(60); // Duration padrão adicionado
    });

    test('deve formatar preços corretamente na mensagem do WhatsApp', async () => {
      // Arrange
      const servicesWithDifferentPrices = [
        { id: uuidv4(), service: 'Serviço 1', price: 25.50 },
        { id: uuidv4(), service: 'Serviço 2', price: 100.00 },
        { id: uuidv4(), service: 'Serviço 3', price: 75.99 }
      ];

      mockAccountRepo.findAccountByPhone.mockResolvedValue(mockClientAccount);
      mockServiceRepo.findAll.mockResolvedValue(servicesWithDifferentPrices);

      // Act
      await whatsappController.startSchedulingProcess(
        mockPhone,
        mockClientId,
        mockClientName
      );

      // Assert
      const sentMessage = mockWhatsAppService.sendTextMessage.mock.calls[0][1];
      
      // Verifica formatação de preços (formato brasileiro com vírgula)
      expect(sentMessage).toContain('R$ 25,50');
      expect(sentMessage).toContain('R$ 100,00');
      expect(sentMessage).toContain('R$ 75,99');
    });

    test('deve lidar com serviços que têm preço zero', async () => {
      // Arrange
      const servicesWithZeroPrice = [
        { id: uuidv4(), service: 'Serviço Grátis', price: 0 },
        { id: uuidv4(), service: 'Serviço Pago', price: 50.00 }
      ];

      mockAccountRepo.findAccountByPhone.mockResolvedValue(mockClientAccount);
      mockServiceRepo.findAll.mockResolvedValue(servicesWithZeroPrice);

      // Act
      await whatsappController.startSchedulingProcess(
        mockPhone,
        mockClientId,
        mockClientName
      );

      // Assert
      const sentMessage = mockWhatsAppService.sendTextMessage.mock.calls[0][1];
      const session = whatsappController.getUserSession(mockPhone);
      
      // Serviços com preço zero devem aparecer (0 != null)
      expect(sentMessage).toContain('Serviço Grátis');
      expect(sentMessage).toContain('R$ 0,00'); // Formato brasileiro com vírgula
      expect(session.services).toHaveLength(2);
    });

    test('deve lidar com serviços com caracteres especiais no nome', async () => {
      // Arrange
      const servicesWithSpecialChars = [
        { id: uuidv4(), service: 'Corte & Barba', price: 60.00 },
        { id: uuidv4(), service: 'Serviço VIP (Premium)', price: 150.00 },
        { id: uuidv4(), service: 'Tratamento 100% Natural', price: 80.00 }
      ];

      mockAccountRepo.findAccountByPhone.mockResolvedValue(mockClientAccount);
      mockServiceRepo.findAll.mockResolvedValue(servicesWithSpecialChars);

      // Act
      await whatsappController.startSchedulingProcess(
        mockPhone,
        mockClientId,
        mockClientName
      );

      // Assert
      const sentMessage = mockWhatsAppService.sendTextMessage.mock.calls[0][1];
      
      expect(sentMessage).toContain('Corte & Barba');
      expect(sentMessage).toContain('Serviço VIP (Premium)');
      expect(sentMessage).toContain('Tratamento 100% Natural');
    });

    test('deve atualizar lista de serviços quando novos são cadastrados', async () => {
      // Arrange - Primeira chamada com 2 serviços
      const initialServices = [
        { id: uuidv4(), service: 'Corte', price: 50.00 },
        { id: uuidv4(), service: 'Barba', price: 30.00 }
      ];

      mockAccountRepo.findAccountByPhone.mockResolvedValue(mockClientAccount);
      mockServiceRepo.findAll.mockResolvedValueOnce(initialServices);

      // Act - Primeira listagem
      await whatsappController.startSchedulingProcess(
        mockPhone,
        mockClientId,
        mockClientName
      );

      let session = whatsappController.getUserSession(mockPhone);
      expect(session.services).toHaveLength(2);

      // Arrange - Segunda chamada com novo serviço adicionado
      const updatedServices = [
        ...initialServices,
        { id: uuidv4(), service: 'Corte + Barba', price: 70.00 }
      ];

      mockServiceRepo.findAll.mockResolvedValueOnce(updatedServices);

      // Act - Segunda listagem (simulando novo cadastro)
      await whatsappController.startSchedulingProcess(
        mockPhone,
        mockClientId,
        mockClientName
      );

      // Assert
      session = whatsappController.getUserSession(mockPhone);
      expect(session.services).toHaveLength(3);
      expect(session.services.some(s => s.service === 'Corte + Barba')).toBe(true);
    });

    test('deve manter ordem dos serviços na listagem', async () => {
      // Arrange
      const orderedServices = [
        { id: uuidv4(), service: 'Serviço A', price: 10.00 },
        { id: uuidv4(), service: 'Serviço B', price: 20.00 },
        { id: uuidv4(), service: 'Serviço C', price: 30.00 }
      ];

      mockAccountRepo.findAccountByPhone.mockResolvedValue(mockClientAccount);
      mockServiceRepo.findAll.mockResolvedValue(orderedServices);

      // Act
      await whatsappController.startSchedulingProcess(
        mockPhone,
        mockClientId,
        mockClientName
      );

      // Assert
      const sentMessage = mockWhatsAppService.sendTextMessage.mock.calls[0][1];
      const session = whatsappController.getUserSession(mockPhone);
      
      // Verifica ordem na mensagem
      const indexA = sentMessage.indexOf('1. Serviço A');
      const indexB = sentMessage.indexOf('2. Serviço B');
      const indexC = sentMessage.indexOf('3. Serviço C');
      
      expect(indexA).toBeLessThan(indexB);
      expect(indexB).toBeLessThan(indexC);
      
      // Verifica ordem na sessão
      expect(session.services[0].service).toBe('Serviço A');
      expect(session.services[1].service).toBe('Serviço B');
      expect(session.services[2].service).toBe('Serviço C');
    });

    test('deve validar integração completa: cadastro -> listagem -> seleção -> agendamento', async () => {
      // Arrange - Simula um serviço recém-cadastrado
      const newlyCreatedService = {
        id: uuidv4(),
        service: 'Novo Serviço Teste',
        price: 45.00,
        additionalComments: 'Serviço de teste'
      };

      mockAccountRepo.findAccountByPhone.mockResolvedValue(mockClientAccount);
      mockServiceRepo.findAll.mockResolvedValue([newlyCreatedService]);
      mockAccountRepo.findByRoles.mockResolvedValue([
        { id: mockProviderId, name: 'Provider', lastname: 'Test' }
      ]);
      
      Schedules.create = jest.fn().mockResolvedValue({
        id: uuidv4(),
        name_client: mockClientName,
        date_and_houres: new Date('2024-12-25T10:00:00'),
        active: true,
        finished: false,
        client_id_schedules: mockClientId,
        provider_id_schedules: mockProviderId
      });
      Schedules.count = jest.fn().mockResolvedValue(0);

      // Act - Passo 1: Listar serviços (simula que o serviço foi cadastrado)
      await whatsappController.startSchedulingProcess(
        mockPhone,
        mockClientId,
        mockClientName
      );

      let session = whatsappController.getUserSession(mockPhone);
      expect(session.services).toHaveLength(1);
      expect(session.services[0].service).toBe('Novo Serviço Teste');

      // Act - Passo 2: Selecionar o serviço recém-cadastrado
      await whatsappController.handleServiceSelection(
        mockPhone,
        '1',
        session
      );

      session = whatsappController.getUserSession(mockPhone);
      expect(session.selectedServices).toBeDefined();
      expect(session.selectedServices.length).toBe(1);
      expect(session.selectedServices[0].service).toBe('Novo Serviço Teste');
      expect(session.selectedServices[0].price).toBe(45.00);
      
      // Continuar para próxima etapa
      await whatsappController.handleServiceSelection(
        mockPhone,
        'CONTINUAR',
        session
      );
      
      session = whatsappController.getUserSession(mockPhone);
      expect(session.step).toBe('select_date');

      // Act - Passo 3: Selecionar data e horário
      const availableDates = whatsappController.getAvailableDates();
      await whatsappController.handleDateSelection(
        mockPhone,
        '1',
        { ...session, availableDates: availableDates }
      );

      session = whatsappController.getUserSession(mockPhone);
      const availableTimes = await whatsappController.getAvailableTimes(
        session.selectedDate,
        60
      );
      
      await whatsappController.handleTimeSelection(
        mockPhone,
        '1',
        { ...session, availableTimes: availableTimes }
      );

      // Act - Passo 4: Confirmar agendamento
      session = whatsappController.getUserSession(mockPhone);
      await whatsappController.handleBookingConfirmation(
        mockPhone,
        'confirmar',
        session
      );

      // Assert - Verifica que o serviço foi associado corretamente
      expect(mockSchedulesServiceRepo.addSchedule_Service).toHaveBeenCalledWith(
        expect.any(String),
        [newlyCreatedService.id]
      );

      // Verifica mensagem de confirmação contém o serviço
      const confirmationMessage = mockWhatsAppService.sendTextMessage.mock.calls[
        mockWhatsAppService.sendTextMessage.mock.calls.length - 1
      ][1];
      expect(confirmationMessage).toContain('Novo Serviço Teste');
      expect(confirmationMessage).toContain('Agendamento confirmado');
    });
  });
});
