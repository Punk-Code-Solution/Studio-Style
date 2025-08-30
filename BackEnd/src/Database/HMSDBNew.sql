-- Create Database
CREATE DATABASE HMSDB
  ENCODING = 'UTF8';

-- Create TypeAccount Table
CREATE TABLE public."TypeAccount"(
  id integer PRIMARY KEY,
  type varchar(100),
  edit boolean,
  creat boolean,
  viwer boolean,
  delete boolean
);

-- Create Hair Table
CREATE TABLE public."Hair"(
  id integer PRIMARY KEY,
  type varchar(100),
  level integer,
  letter smallint
);

CREATE TABLE public."Company"(
  id integer PRIMARY KEY,
  name varchar(100),
  cnpj bigint,
  start_date date,
  active date,
  avatar smallint
);

-- Create Account Table
CREATE TABLE public."Account"(	
  id integer PRIMARY KEY,
  name varchar(100),
  lastname varchar(100),
  password varchar(100),
  cpf bigint,
  start_date date,
  birthday date,
  active date,
  avatar smallint,
  "type_account_id" integer REFERENCES public."TypeAccount" (id),
  "type_hair_id" integer REFERENCES public."Hair" (id),
  "company_id_account" integer REFERENCES public."Company" (id)
);

CREATE TABLE public."Purchase"(
  id integer PRIMARY KEY,
  nameproduct varchar(100),
  amount_product integer,
  value_product float,
  date_purchase date,
  product_description text,
  "account_id_purchase" integer REFERENCES public."Account" (id),
  "company_id_purchase" integer REFERENCES public."Company" (id)
);

CREATE TABLE public."Product"(
  id integer PRIMARY KEY,  
  liters float,
  weight float,
  name varchar(100),
  priceTotal float,
  amount integer,
  description text,
  tipeProduct varchar(100),
  brand varchar(100),
  date_validity date,
  "purchase_id_product" integer REFERENCES public."Purchase" (id)
);

-- Create Adress Table
CREATE TABLE public."Adress"(
  id integer PRIMARY KEY,
  city varchar(100),
  neighborhood varchar(100),
  road varchar(100),
  "account_id" integer REFERENCES public."Account" (id)
);

-- Create Phone Table
CREATE TABLE public."Phone"(
  id integer PRIMARY KEY,
  phone integer,
  ddd integer,
  active date,
  type varchar(100),
  "account_id_phone" integer REFERENCES public."Account" (id),
  "company_id_phone" integer REFERENCES public."Company" (id)
);

-- Create Email Table
CREATE TABLE public."Email"(
  id integer PRIMARY KEY,
  name varchar(100),
  active date,
  email varchar(100),
  "account_id" integer REFERENCES public."Account" (id),
  "company_id" integer REFERENCES public."Company" (id)
);

-- Create Service Table
CREATE TABLE public."Service"(
  id integer PRIMARY KEY,
  service text,
  additionalComments text,
  date_service date,
  "client_id_service" integer REFERENCES public."Account" (id),
  "provider_id_service" integer REFERENCES public."Account" (id)
);

-- Create Payment Table
CREATE TABLE public."Payment"(
  id integer PRIMARY KEY,
  valueTotal float,
  discountValue float,
  tipePayment varchar(200),
  date date,
  "service_id_payment" integer REFERENCES public."Service" (id)
);

-- Create Action Table
CREATE TABLE public."Action"(
  id integer PRIMARY KEY,
  name varchar(200),
  additionalComments text,
  "service_id_action" integer REFERENCES public."Service" (id)
);

-- Create Sale Table
CREATE TABLE public."Sale"(
  id integer PRIMARY KEY,
  amount_product integer,
  price_total float,	
  discount integer,
  date_sale date,
  paid_off boolean,
  reamining float,
  "client_id_sale" integer REFERENCES public."Account" (id),
  "account_id_sale" integer REFERENCES public."Account" (id),
  "product_id_sale" integer REFERENCES public."Product" (id)
);

-- Create Purchase_Material Table
CREATE TABLE public."Purchase_Material"(
  id integer PRIMARY KEY,
  name varchar(100),
  amount integer,
  value float,
  date date,	
  product_description text,
  "account_id_purchase_material" integer REFERENCES public."Account" (id)
);

CREATE TABLE public."Schedules"(
  id integer PRIMARY KEY,
  name_client string,  
  date_and_houres date,  
  active boolean,
  finished boolean,
  "provider_id_schedules" integer REFERENCES public."Account" (id),
  "client_id_schedules" integer REFERENCES public."Account" (id)
);

-- -- Add Foreign Key Constraints
-- ALTER TABLE public."Email" ADD CONSTRAINT "Email_fk_Account" FOREIGN KEY ("account_id")
--   REFERENCES public."Account" (id) ON DELETE SET NULL ON UPDATE CASCADE;

-- ALTER TABLE public."Email" ADD CONSTRAINT "Email_fk_Company" FOREIGN KEY ("account_id")
--   REFERENCES public."Company" (id) ON DELETE SET NULL ON UPDATE CASCADE;

-- ALTER TABLE public."Phone" ADD CONSTRAINT "Phone_fk_Account" FOREIGN KEY ("account_id")
--   REFERENCES public."Account" (id) ON DELETE SET NULL ON UPDATE CASCADE;

-- ALTER TABLE public."Phone" ADD CONSTRAINT "Phone_fk_Company" FOREIGN KEY ("account_id")
--   REFERENCES public."Company" (id) ON DELETE SET NULL ON UPDATE CASCADE;

-- ALTER TABLE public."Account" ADD CONSTRAINT "TypeAccount_fk" FOREIGN KEY ("type_Account_id")
--   REFERENCES public."TypeAccount" (id) ON DELETE SET NULL ON UPDATE CASCADE;

-- ALTER TABLE public."Account" ADD CONSTRAINT "Hair_fk" FOREIGN KEY ("type_hair_id")
--   REFERENCES public."Hair" (id) ON DELETE SET NULL ON UPDATE CASCADE;

-- ALTER TABLE public."Action" ADD CONSTRAINT "Action_fk" FOREIGN KEY ("service_id")
--   REFERENCES public."Service" (id) ON DELETE SET NULL ON UPDATE CASCADE;

-- ALTER TABLE public."Purchase_Material" ADD CONSTRAINT "Purchase_Material_fk_Account" FOREIGN KEY ("account_id")
--   REFERENCES public."Account" (id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ALTER TABLE public."Adress" ADD CONSTRAINT "Adress_fk_Account" FOREIGN KEY ("account_id")
--   REFERENCES public."Account" (id) ON DELETE SET NULL ON UPDATE CASCADE;

--   ALTER TABLE public."Adress" ADD CONSTRAINT "Adress_fk_Company" FOREIGN KEY ("account_id")
--   REFERENCES public."Company" (id) ON DELETE SET NULL ON UPDATE CASCADE;

-- ALTER TABLE public."Service" ADD CONSTRAINT "Provider_fk_Account" FOREIGN KEY ("id_account_service_provider")
--   REFERENCES public."Account" (id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ALTER TABLE public."Service" ADD CONSTRAINT "Service_fk_Account" FOREIGN KEY ("client_id")
--   REFERENCES public."Account" (id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ALTER TABLE public."Sale" ADD CONSTRAINT "Sale_fk_Account" FOREIGN KEY ("client_id")
--   REFERENCES public."Account" (id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ALTER TABLE public."Sale" ADD CONSTRAINT "Sale_fk_Account" FOREIGN KEY ("account_id_sale")
--   REFERENCES public."Account" (id) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ALTER TABLE public."Sale" ADD CONSTRAINT "product_id_sale" FOREIGN KEY ("product_id")
--   REFERENCES public."Product" (id) ON DELETE NO ACTION ON UPDATE CASCADE;

-- ALTER TABLE public."Purchase" ADD CONSTRAINT "Purchase_fk_Account" FOREIGN KEY ("account_id")
--   REFERENCES public."Account" (id) ON DELETE NO ACTION ON UPDATE CASCADE;

-- ALTER TABLE public."Purchase" ADD CONSTRAINT "company_id_purchase" FOREIGN KEY ("company_id")
--   REFERENCES public."Company" (id) ON DELETE NO ACTION ON UPDATE CASCADE;

-- ALTER TABLE public."Product" ADD CONSTRAINT "purchase_id_product" FOREIGN KEY ("purchase_id")
--   REFERENCES public."Purchase" (id) ON DELETE NO ACTION ON UPDATE CASCADE;
