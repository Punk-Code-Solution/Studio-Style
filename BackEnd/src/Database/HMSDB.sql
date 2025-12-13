-- Create Database
CREATE DATABASE HMSDB
  ENCODING = 'UTF8';

-- Create TypeAccount Table
CREATE TABLE public."TypeAccounts"(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(100),
  edit BOOLEAN,
  creat BOOLEAN,
  viwer BOOLEAN,
  delet BOOLEAN,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create Hair Table
CREATE TABLE public."Hairs"(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(100),
  level INTEGER,
  letter VARCHAR(10),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create Account Table
CREATE TABLE public."Accounts"(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100),
  lastname VARCHAR(100),
  password VARCHAR(100),
  cpf VARCHAR(14),
  start_date DATE,
  birthday DATE,
  deleted BOOLEAN,
  avatar VARCHAR(255),
  "typeaccount_id" UUID REFERENCES public."TypeAccounts" (id),
  "type_hair_id" UUID REFERENCES public."Hairs" (id),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create Purchase Table
CREATE TABLE public."Purchases"(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nameproduct VARCHAR(100),
  amount_product INTEGER,
  value_product FLOAT,
  date_purchase DATE,
  product_description TEXT,
  "account_id_purchase" UUID REFERENCES public."Accounts" (id),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create Product Table
CREATE TABLE public."Products"(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liters FLOAT,
  weight FLOAT,
  name VARCHAR(100),
  "priceTotal" FLOAT,
  amount INTEGER,
  description TEXT,
  "tipeProduct" VARCHAR(100),
  brand VARCHAR(100),
  date_validity DATE,
  "purchase_id_product" UUID REFERENCES public."Purchases" (id),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create Address Table
CREATE TABLE public."Adresses"(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city VARCHAR(100),
  neighborhood VARCHAR(100),
  road VARCHAR(100),
  cep INTEGER,
  "account_id_adress" UUID REFERENCES public."Accounts" (id),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create Phone Table
CREATE TABLE public."Phones"(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(15),
  ddd INTEGER,
  active DATE,
  type VARCHAR(100),
  "account_id_phone" UUID REFERENCES public."Accounts" (id),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create Email Table
CREATE TABLE public."Emails"(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100),
  active DATE,
  email VARCHAR(100),
  "account_id_email" UUID REFERENCES public."Accounts" (id),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create Schedules Table
CREATE TABLE public."Schedules"(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_client VARCHAR(100),
  date_and_houres TIMESTAMP,
  active BOOLEAN,
  finished BOOLEAN,
  "provider_id_schedules" UUID REFERENCES public."Accounts" (id),
  "client_id_schedules" UUID REFERENCES public."Accounts" (id),
  payment_method VARCHAR(20) CHECK (payment_method IN ('CASH', 'CARD', 'PIX', 'OTHER')),
  apply_gateway_fee BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create Service Table
CREATE TABLE public."Services"(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service VARCHAR(255),
  "additionalComments" VARCHAR(255),
  price FLOAT,
  commission_rate FLOAT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create Payment Table
CREATE TABLE public."Payments"(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "valueTotal" FLOAT,
  "discountValue" FLOAT,
  "tipePayment" VARCHAR(200),
  date DATE,
  "service_id_payment" UUID REFERENCES public."Schedules" (id),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create Action Table
CREATE TABLE public."Actions"(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200),
  "additionalComments" TEXT,
  "service_id_action" UUID REFERENCES public."Services" (id),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create Sale Table
CREATE TABLE public."Sales"(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_product VARCHAR(100),
  amount_product INTEGER,
  price_total FLOAT,
  discount INTEGER,
  date_sale DATE,
  paid_off BOOLEAN,
  remaining FLOAT,
  "client_id_sale" UUID REFERENCES public."Accounts" (id),
  "account_id_sale" UUID REFERENCES public."Accounts" (id),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create Purchase_Material Table
CREATE TABLE public."Purchase_Materials"(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100),
  amount INTEGER,
  value FLOAT,
  date DATE,
  product_description VARCHAR(255),
  "account_id_purchase_material" UUID REFERENCES public."Accounts" (id),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create SaleProducts Table (Junction Table)
CREATE TABLE public."SaleProducts"(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "saleId" UUID REFERENCES public."Sales" (id),
  "productId" UUID REFERENCES public."Products" (id),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create Schedule_Service Table (Junction Table)
CREATE TABLE public."Schedule_Services"(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "schedules_id" UUID REFERENCES public."Schedules" (id) ON DELETE CASCADE ON UPDATE CASCADE,
  "service_id" UUID REFERENCES public."Services" (id) ON DELETE CASCADE ON UPDATE CASCADE,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create CompanySettings Table
CREATE TABLE public."CompanySettings"(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_regime VARCHAR(20) CHECK (tax_regime IN ('MEI', 'SIMPLES_NACIONAL', 'LUCRO_PRESUMIDO', 'LUCRO_REAL')) DEFAULT 'MEI',
  is_partner_salon BOOLEAN DEFAULT false,
  tax_rate DECIMAL(5, 4) DEFAULT 0.0000,
  payment_gateway_fee DECIMAL(5, 4) DEFAULT 0.0299,
  default_commission_rate DECIMAL(5, 4) DEFAULT 0.5000,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create CommissionRules Table
CREATE TABLE public."CommissionRules"(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_type VARCHAR(20) CHECK (rule_type IN ('GENERAL', 'SERVICE', 'PROFESSIONAL')) DEFAULT 'GENERAL',
  service_id UUID REFERENCES public."Services" (id) ON DELETE CASCADE ON UPDATE CASCADE,
  professional_id UUID REFERENCES public."Accounts" (id) ON DELETE CASCADE ON UPDATE CASCADE,
  commission_rate DECIMAL(5, 4) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create Expenses Table
CREATE TABLE public."Expenses"(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_type VARCHAR(20) CHECK (expense_type IN ('FIXED', 'VARIABLE')) NOT NULL,
  category VARCHAR(255) NOT NULL,
  description TEXT,
  amount DECIMAL(15, 2) NOT NULL,
  due_date DATE,
  payment_date DATE,
  is_paid BOOLEAN DEFAULT false,
  is_recurring BOOLEAN DEFAULT false,
  recurring_period VARCHAR(20) CHECK (recurring_period IN ('MONTHLY', 'WEEKLY', 'YEARLY')),
  product_id UUID REFERENCES public."Products" (id) ON DELETE SET NULL ON UPDATE CASCADE,
  schedule_id UUID REFERENCES public."Schedules" (id) ON DELETE SET NULL ON UPDATE CASCADE,
  created_by UUID REFERENCES public."Accounts" (id) ON DELETE SET NULL ON UPDATE CASCADE,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create FinancialLedger Table
CREATE TABLE public."FinancialLedger"(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type VARCHAR(20) CHECK (transaction_type IN ('INCOME', 'EXPENSE')) NOT NULL,
  category VARCHAR(50) CHECK (category IN ('SERVICE_PAYMENT', 'COMMISSION_PAYMENT', 'TAX_PAYMENT', 'GATEWAY_FEE', 'PRODUCT_COST', 'FIXED_EXPENSE', 'VARIABLE_EXPENSE', 'OTHER')) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  description TEXT,
  reference_id UUID,
  reference_type VARCHAR(255),
  schedule_id UUID REFERENCES public."Schedules" (id) ON DELETE SET NULL ON UPDATE CASCADE,
  expense_id UUID REFERENCES public."Expenses" (id) ON DELETE SET NULL ON UPDATE CASCADE,
  transaction_date TIMESTAMP DEFAULT NOW(),
  metadata JSONB,
  created_by UUID REFERENCES public."Accounts" (id) ON DELETE SET NULL ON UPDATE CASCADE,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create Conversations Table
CREATE TABLE public."Conversations"(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number VARCHAR(20) NOT NULL,
  contact_name VARCHAR(255),
  last_message TEXT,
  last_message_at TIMESTAMP,
  unread_count INTEGER DEFAULT 0,
  status VARCHAR(20) CHECK (status IN ('active', 'archived', 'spam')) DEFAULT 'active',
  account_id UUID REFERENCES public."Accounts" (id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create Messages Table
CREATE TABLE public."Messages"(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public."Conversations" (id) ON DELETE CASCADE,
  whatsapp_message_id VARCHAR(255),
  "from" VARCHAR(20) NOT NULL,
  "to" VARCHAR(20) NOT NULL,
  direction VARCHAR(10) CHECK (direction IN ('incoming', 'outgoing')) NOT NULL,
  message_type VARCHAR(20) CHECK (message_type IN ('text', 'image', 'video', 'audio', 'document', 'location', 'contacts', 'interactive', 'button', 'template')) DEFAULT 'text',
  content TEXT NOT NULL,
  media_url TEXT,
  status VARCHAR(20) CHECK (status IN ('sent', 'delivered', 'read', 'failed')) DEFAULT 'sent',
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMP DEFAULT NOW(),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create Indexes for better performance
CREATE INDEX idx_conversations_phone_number ON public."Conversations" ("phone_number");
CREATE INDEX idx_conversations_status ON public."Conversations" ("status");
CREATE INDEX idx_conversations_last_message_at ON public."Conversations" ("last_message_at");
CREATE INDEX idx_conversations_account_id ON public."Conversations" ("account_id");

CREATE INDEX idx_messages_conversation_id ON public."Messages" ("conversation_id");
CREATE INDEX idx_messages_whatsapp_id ON public."Messages" ("whatsapp_message_id");
CREATE INDEX idx_messages_from ON public."Messages" ("from");
CREATE INDEX idx_messages_to ON public."Messages" ("to");
CREATE INDEX idx_messages_direction ON public."Messages" ("direction");
CREATE INDEX idx_messages_timestamp ON public."Messages" ("timestamp");

-- 1. Corrigir nome da tabela Adresses para Addresses
ALTER TABLE IF EXISTS public."Adresses" RENAME TO "Addresses";

-- 2. Adicionar restrição de chave estrangeira para Conversations
ALTER TABLE public."Conversations" 
ADD CONSTRAINT "Conversations_fk_Account" 
FOREIGN KEY ("account_id") 
REFERENCES public."Accounts" (id) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- 3. (Opcional) Renomear tabela Hairs para HairStyles
-- ALTER TABLE public."Hairs" RENAME TO "HairStyles";

-- 4. Adicionar índices adicionais para melhor desempenho
-- Índice para busca por data de criação em Conversations
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON public."Conversations" ("createdAt");

-- Índice para busca por data de criação em Messages
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public."Messages" ("createdAt");

-- Índice para busca por status em Messages
CREATE INDEX IF NOT EXISTS idx_messages_status ON public."Messages" ("status");

-- Add Foreign Key Constraints
ALTER TABLE public."Emails" ADD CONSTRAINT "Emails_fk_Account" FOREIGN KEY ("account_id_email")
  REFERENCES public."Accounts" (id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE public."Phones" ADD CONSTRAINT "Phones_fk_Account" FOREIGN KEY ("account_id_phone")
  REFERENCES public."Accounts" (id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE public."Accounts" ADD CONSTRAINT "TypeAccount_fk" FOREIGN KEY ("typeaccount_id")
  REFERENCES public."TypeAccounts" (id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE public."Accounts" ADD CONSTRAINT "Hair_fk" FOREIGN KEY ("type_hair_id")
  REFERENCES public."Hairs" (id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE public."Actions" ADD CONSTRAINT "Actions_fk" FOREIGN KEY ("service_id_action")
  REFERENCES public."Services" (id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE public."Purchase_Materials" ADD CONSTRAINT "Purchase_Materials_fk_Account" FOREIGN KEY ("account_id_purchase_material")
  REFERENCES public."Accounts" (id) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE public."Addresses" ADD CONSTRAINT "Adresses_fk_Account" FOREIGN KEY ("account_id_adress")
  REFERENCES public."Accounts" (id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE public."Schedules" ADD CONSTRAINT "Schedules_fk_Account_Client" FOREIGN KEY ("client_id_schedules")
  REFERENCES public."Accounts" (id) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE public."Schedules" ADD CONSTRAINT "Schedules_fk_Account_Provider" FOREIGN KEY ("provider_id_schedules")
  REFERENCES public."Accounts" (id) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE public."Sales" ADD CONSTRAINT "Sales_fk_Account_Client" FOREIGN KEY ("client_id_sale")
  REFERENCES public."Accounts" (id) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE public."Sales" ADD CONSTRAINT "Sales_fk_Account_Seller" FOREIGN KEY ("account_id_sale")
  REFERENCES public."Accounts" (id) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE public."Purchases" ADD CONSTRAINT "Purchases_fk_Account" FOREIGN KEY ("account_id_purchase")
  REFERENCES public."Accounts" (id) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE public."Products" ADD CONSTRAINT "Products_fk_Purchase" FOREIGN KEY ("purchase_id_product")
  REFERENCES public."Purchases" (id) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE public."Payments" ADD CONSTRAINT "Payments_fk_Schedule" FOREIGN KEY ("service_id_payment")
  REFERENCES public."Schedules" (id) ON DELETE NO ACTION ON UPDATE CASCADE;

-- Add Unique Constraints
CREATE UNIQUE INDEX accounts_cpf_unique ON public."Accounts" ("cpf");
CREATE UNIQUE INDEX emails_email_unique ON public."Emails" ("email");

-- Create Indexes for better performance
CREATE INDEX idx_services_schedule_service ON public."Schedule_Services" ("schedules_id");
CREATE INDEX idx_services_service_id ON public."Schedule_Services" ("service_id");
CREATE INDEX idx_schedules_client_id ON public."Schedules" ("client_id_schedules");
CREATE INDEX idx_schedules_provider_id ON public."Schedules" ("provider_id_schedules");
CREATE INDEX idx_schedules_date ON public."Schedules" ("date_and_houres");
CREATE INDEX idx_accounts_cpf ON public."Accounts" ("cpf");
CREATE INDEX idx_commission_rules_service_id ON public."CommissionRules" ("service_id");
CREATE INDEX idx_commission_rules_professional_id ON public."CommissionRules" ("professional_id");
CREATE INDEX idx_commission_rules_type_active ON public."CommissionRules" ("rule_type", "is_active");
CREATE INDEX idx_financial_ledger_transaction_date ON public."FinancialLedger" ("transaction_date");
CREATE INDEX idx_financial_ledger_type_category ON public."FinancialLedger" ("transaction_type", "category");
CREATE INDEX idx_financial_ledger_schedule_id ON public."FinancialLedger" ("schedule_id");
CREATE INDEX idx_financial_ledger_expense_id ON public."FinancialLedger" ("expense_id");
CREATE INDEX idx_expenses_due_date ON public."Expenses" ("due_date");
CREATE INDEX idx_expenses_type_paid ON public."Expenses" ("expense_type", "is_paid");
CREATE INDEX idx_expenses_schedule_id ON public."Expenses" ("schedule_id");
