const request = require('supertest');
const app = require('../../server'); 
const { sequelize, Account, Service, Schedules, Phone, Email } = require('../Database/models');

describe('Integração Completa do Sistema (CRUD & Fluxos)', () => {
  let adminToken;
  let createdServiceId;
  let createdClientId;
  let createdScheduleId;

  const timestamp = Date.now();
  
  // Credenciais do Admin (devem bater com o seu Seed)
  const adminCredentials = {
    email: 'admin@admin.com',
    password: process.env.ADMIN_PASSWORD 
  };

  const testSale = {
    sale: `Venda Teste ${timestamp}`,
    price: 50.00,
    additionalComments: 'Venda criada via teste automatizado'
  };

  const testPurchase = {
    purchase: `Compra Teste ${timestamp}`,
    price: 50.00,
    additionalComments: 'Compra criada via teste automatizado'
  };

  const createdSaleId = null;

  const testService = {
    service: `Corte Teste ${timestamp}`,
    price: 50.00,
    additionalComments: 'Serviço criado via teste automatizado'
  };

  const testClient = {
    name: `Cliente Teste ${timestamp}`,
    email: `cliente${timestamp}@teste.com`,
    cpf: `${timestamp}`.slice(0, 11), 
    password: 'password123',
    role: 'client',
    phone: `1199999${timestamp.toString().slice(-4)}`
  };

  // ==========================================================================
  // SETUP
  // ==========================================================================
  beforeAll(async () => {
    try {
      await sequelize.authenticate();
      console.log('📡 Conectado ao banco de dados para testes.');
    } catch (err) {
      console.error('❌ Falha na conexão com o banco:', err);
    }

    const response = await request(app)
      .post('/api/auth/login')
      .send(adminCredentials);

    if (response.status !== 200) {
      // Se falhar login, tenta criar um admin de emergência para o teste não parar
      console.log('⚠️ Login falhou. Tentando continuar sem token (pode falhar se a rota exigir auth)...');
    } else {
      adminToken = response.body.data.token;
      console.log('🔑 Token de Admin obtido.');
    }
  });

  // ==========================================================================
  // TEARDOWN (Limpeza)
  // ==========================================================================
  afterAll(async () => {
    console.log('🧹 Iniciando limpeza dos dados de teste...');
    try {
      if (createdScheduleId) await Schedules.destroy({ where: { id: createdScheduleId }, force: true });
      if (createdServiceId) await Service.destroy({ where: { id: createdServiceId }, force: true });
      if (createdClientId) {
        await Phone.destroy({ where: { account_id_phone: createdClientId } });
        await Email.destroy({ where: { account_id_email: createdClientId } });
        await Account.destroy({ where: { id: createdClientId }, force: true });
      }
      console.log('✅ Dados removidos.');
    } catch (error) {
      console.error('❌ Erro na limpeza:', error);
    } finally {
      await sequelize.close();
    }
  });

  // ==========================================================================
  // 1. TESTES DE SERVIÇOS (ServiceController - Retornos Customizados)
  // ==========================================================================
  describe('Gerenciamento de Serviços', () => {
    it('Deve criar um novo serviço com sucesso', async () => {
      const res = await request(app)
        .post('/api/service')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testService);

      // ADAPTAÇÃO: ServiceController retorna { "result": { ... } } e status 201
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('result');
      expect(res.body.result).toHaveProperty('id');
      expect(res.body.result.service).toBe(testService.service);
      
      createdServiceId = res.body.result.id;
    });

    it('Deve listar todos os serviços e encontrar o criado', async () => {
      // ADAPTAÇÃO: ServiceController exige body ou query. Vamos mandar no body para garantir.
      const res = await request(app)
        .get('/api/service')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ limit: 100, base: 0 }); 

      // ADAPTAÇÃO: ServiceController retorna { "result": [ ... ] } (Array direto no result)
      // Nota: O status code no seu controller é 201 para GET (atípico, mas adaptamos aqui)
      expect(res.status).toBe(201); 
      expect(res.body).toHaveProperty('result');
      expect(Array.isArray(res.body.result)).toBe(true);
      
      const found = res.body.result.find(s => s.id === createdServiceId);
      expect(found).toBeDefined();
    });

    it('Deve atualizar o serviço criado', async () => {
      const updateData = { 
        id: createdServiceId,
        price: 75.50,
        additionalComments: 'Atualizado pelo teste'
      };

      const res = await request(app)
        .put('/api/service')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      // ADAPTAÇÃO: ServiceController retorna { "newService": { ... } }
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('newService');
      expect(res.body.newService.price).toBe(75.50);
    });
  });

  // ==========================================================================
  // 2. TESTES DE CLIENTES (AccountController - Padrão ResponseHandler)
  // ==========================================================================
  describe('Gerenciamento de Clientes', () => {
    it('Deve criar uma nova conta de cliente', async () => {
      const res = await request(app)
        .post('/api/account')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testClient);

      if (res.status === 409) {
        const existing = await Account.findOne({ where: { email: testClient.email } });
        createdClientId = existing.id;
      } else {
        // AccountController usa ResponseHandler: { success: true, data: ... }
        expect(res.status).toBe(201);
        expect(res.body.data).toHaveProperty('id');
        createdClientId = res.body.data.id;
      }
    });

    it('Deve buscar o cliente pelo ID', async () => {
      const res = await request(app)
        .get(`/api/account/id?id=${createdClientId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe(testClient.name);
    });

    it('Deve atualizar dados do cliente', async () => {
      const res = await request(app)
        .put('/api/account/id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          id: createdClientId,
          lastname: 'Atualizado'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.lastname).toBe('Atualizado');
    });
  });

  // ==========================================================================
  // 3. TESTES DE AGENDAMENTOS (SchedulesController - Padrão ResponseHandler)
  // ==========================================================================
  describe('Gerenciamento de Agendamentos', () => {
    it('Deve criar um agendamento', async () => {
      // Tenta pegar o perfil para obter o ID do provedor
      const profileRes = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${adminToken}`);

      // Fallback: Se profile falhar (500), usa um UUID fixo ou pula validação estrita de provider
      const providerId = (profileRes.status === 200) ? profileRes.body.data.id : createdClientId;

      const scheduleDate = new Date();
      scheduleDate.setDate(scheduleDate.getDate() + 1);

      const scheduleData = {
        name_client: testClient.name,
        date_and_houres: scheduleDate.toISOString(),
        active: true,
        finished: false,
        provider_id_schedules: providerId,
        client_id_schedules: createdClientId,
        services: [createdServiceId]
      };

      const res = await request(app)
        .post('/api/schedules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(scheduleData);

      if (res.status !== 201) console.error('Erro Schedule:', res.body);

      // SchedulesController usa ResponseHandler
      expect(res.status).toBe(201);
      expect(res.body.data.schedule).toHaveProperty('id');
      createdScheduleId = res.body.data.schedule.id;
    });

    it('Deve listar agendamentos', async () => {
      const res = await request(app)
        .get('/api/schedules')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      // SchedulesController retorna array em data
      const found = res.body.data.find(s => s.id === createdScheduleId);
      expect(found).toBeDefined();
    });

    it('Deve atualizar o status do agendamento', async () => {
      const res = await request(app)
        .put('/api/schedules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          id: createdScheduleId,
          finished: true
        });

      expect(res.status).toBe(200);
      expect(res.body.data.finished).toBe(true);
    });
  });

  describe('Gerenciamento de Vendas', () => {
    it('Deve criar uma nova venda', async () => {
      const res = await request(app)
        .post('/api/sale')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testSale);
    });

    it('Deve listar todas as vendas', async () => {
      const res = await request(app)
        .get('/api/sale')
        .set('Authorization', `Bearer ${adminToken}`);
    });

    it('Deve atualizar uma venda', async () => {
  });

    it('Deve deletar uma venda', async () => {
      const res = await request(app)
        .delete(`/api/sale/${createdSaleId}`)
        .set('Authorization', `Bearer ${adminToken}`);
    });
  });
  describe('Gerenciamento de Compras', () => {
    it('Deve criar uma nova compra', async () => {
      const res = await request(app)
        .post('/api/purchase')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testPurchase);
    });
  });
  describe('Gerenciamento de Compras', () => {
    it('Deve criar uma nova compra', async () => {
      const res = await request(app)
        .post('/api/purchase')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testPurchase);
    });
  });
});