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

-- Create Company Table
CREATE TABLE public."Companies"(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100),
  cnpj VARCHAR(18),
  start_date DATE,
  active DATE,
  avatar TEXT,
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
  "company_id_account" UUID REFERENCES public."Companies" (id),
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
  "company_id_purchase" UUID REFERENCES public."Companies" (id),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create Product Table
CREATE TABLE public."Products"(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liters FLOAT,
  weight FLOAT,
  name VARCHAR(100),
  priceTotal FLOAT,
  amount INTEGER,
  description TEXT,
  tipeProduct VARCHAR(100),
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
  "account_id_adress" UUID REFERENCES public."Accounts" (id),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create Phone Table
CREATE TABLE public."Phones"(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(15),
  ddd VARCHAR(3),
  active DATE,
  type VARCHAR(100),
  "account_id_phone" UUID REFERENCES public."Accounts" (id),
  "company_id_phone" UUID REFERENCES public."Companies" (id),
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
  "company_id_email" UUID REFERENCES public."Companies" (id),
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
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create Service Table
CREATE TABLE public."Services"(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service VARCHAR(255),
  date_service TIMESTAMP,
  additionalComments TEXT,
  "client_id_service" UUID REFERENCES public."Accounts" (id),
  "provider_id_service" UUID REFERENCES public."Accounts" (id),
  "schedule_id" UUID REFERENCES public."Schedules" (id) ON DELETE SET NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create Payment Table
CREATE TABLE public."Payments"(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  valueTotal FLOAT,
  discountValue FLOAT,
  tipePayment VARCHAR(200),
  date DATE,
  "service_id_payment" UUID REFERENCES public."Services" (id),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create Action Table
CREATE TABLE public."Actions"(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200),
  additionalComments TEXT,
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
  product_description TEXT,
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

-- Create HairAccount Table (Junction Table)
CREATE TABLE public."HairAccounts"(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "hairId" UUID REFERENCES public."Hairs" (id),
  "accountId" UUID REFERENCES public."Accounts" (id),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Add Foreign Key Constraints
ALTER TABLE public."Emails" ADD CONSTRAINT "Emails_fk_Account" FOREIGN KEY ("account_id_email")
  REFERENCES public."Accounts" (id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE public."Emails" ADD CONSTRAINT "Emails_fk_Company" FOREIGN KEY ("company_id_email")
  REFERENCES public."Companies" (id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE public."Phones" ADD CONSTRAINT "Phones_fk_Account" FOREIGN KEY ("account_id_phone")
  REFERENCES public."Accounts" (id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE public."Phones" ADD CONSTRAINT "Phones_fk_Company" FOREIGN KEY ("company_id_phone")
  REFERENCES public."Companies" (id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE public."Accounts" ADD CONSTRAINT "TypeAccount_fk" FOREIGN KEY ("typeaccount_id")
  REFERENCES public."TypeAccounts" (id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE public."Accounts" ADD CONSTRAINT "Hair_fk" FOREIGN KEY ("type_hair_id")
  REFERENCES public."Hairs" (id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE public."Actions" ADD CONSTRAINT "Actions_fk" FOREIGN KEY ("service_id_action")
  REFERENCES public."Services" (id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE public."Purchase_Materials" ADD CONSTRAINT "Purchase_Materials_fk_Account" FOREIGN KEY ("account_id_purchase_material")
  REFERENCES public."Accounts" (id) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE public."Adresses" ADD CONSTRAINT "Adresses_fk_Account" FOREIGN KEY ("account_id_adress")
  REFERENCES public."Accounts" (id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE public."Services" ADD CONSTRAINT "Services_fk_Account_Client" FOREIGN KEY ("client_id_service")
  REFERENCES public."Accounts" (id) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE public."Services" ADD CONSTRAINT "Services_fk_Account_Provider" FOREIGN KEY ("provider_id_service")
  REFERENCES public."Accounts" (id) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE public."Services" ADD CONSTRAINT "Services_fk_Schedules" FOREIGN KEY ("schedule_id")
  REFERENCES public."Schedules" (id) ON DELETE SET NULL ON UPDATE CASCADE;

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

ALTER TABLE public."Purchases" ADD CONSTRAINT "Purchases_fk_Company" FOREIGN KEY ("company_id_purchase")
  REFERENCES public."Companies" (id) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE public."Products" ADD CONSTRAINT "Products_fk_Purchase" FOREIGN KEY ("purchase_id_product")
  REFERENCES public."Purchases" (id) ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE public."Payments" ADD CONSTRAINT "Payments_fk_Service" FOREIGN KEY ("service_id_payment")
  REFERENCES public."Services" (id) ON DELETE NO ACTION ON UPDATE CASCADE;

-- Create Indexes for better performance
CREATE INDEX idx_services_schedule_id ON public."Services" ("schedule_id");
CREATE INDEX idx_services_client_id ON public."Services" ("client_id_service");
CREATE INDEX idx_services_provider_id ON public."Services" ("provider_id_service");
CREATE INDEX idx_schedules_client_id ON public."Schedules" ("client_id_schedules");
CREATE INDEX idx_schedules_provider_id ON public."Schedules" ("provider_id_schedules");
CREATE INDEX idx_schedules_date ON public."Schedules" ("date_and_houres");
CREATE INDEX idx_accounts_cpf ON public."Accounts" ("cpf");
CREATE INDEX idx_companies_cnpj ON public."Companies" ("cnpj");
