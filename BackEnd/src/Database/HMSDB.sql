-- Database: HMSDB

-- DROP DATABASE IF EXISTS "HMSDB";

-- CREATE DATABASE "HMSDB"
   -- WITH
    --OWNER = postgres
    --ENCODING = 'UTF8'
    --LC_COLLATE = 'Portuguese_Brazil.1252'
    --LC_CTYPE = 'Portuguese_Brazil.1252'
    --TABLESPACE = pg_default
    --CONNECTION LIMIT = -1
    --IS_TEMPLATE = False;

-- Database generated with pgModeler (PostgreSQL Database Modeler).
-- PostgreSQL version: 9.2
-- Project Site: pgmodeler.com.br
-- Model Author: Thiago de Freitas

SET check_function_bodies = false;
-- ddl-end --


-- Database creation must be done outside an multicommand file.
-- These commands were put in this file only for convenience.
-- -- object: "HMSDB" | type: DATABASE --
-- CREATE DATABASE "HMSDB"
-- 	ENCODING = 'UTF8'
-- ;
-- -- ddl-end --
-- 

-- object: public."Account" | type: TABLE --
CREATE TABLE public."Account"(	
	id integer,
	name varchar(100),
	password varchar(100),
	cpf bigint,
	start_date date,
	birthday date,
	active date,
	avatar smallint,
	"type_Account_id" integer,
	"type_hair_id" integer,
	"company_id", integer,
	CONSTRAINT account_id PRIMARY KEY (id)

);


CREATE TABLE public."Company"(
	name varchar(100),
	cnpj bigint,
	start_date date,
	active date,
	avatar smallint,
	id integer,
	"account_id_Adress" integer,
	"account_id_Phone" integer,
	"account_id_Email" integer,
	CONSTRAINT company_id PRIMARY KEY (id)

);
-- ddl-end --
-- object: public."Adress" | type: TABLE --
CREATE TABLE public."Adress"(
	id integer,
	city varchar(100),
	neighborhood varchar(100),
	road varchar(100),
	"account_id" integer,
	CONSTRAINT adress_id PRIMARY KEY (id)

);
-- ddl-end --
-- object: "Adress_fk" | type: CONSTRAINT --

-- ddl-end --


-- object: public."Phone" | type: TABLE --
CREATE TABLE public."Phone"(
	id integer,
	phone integer,
	ddd integer,
	active date,
	type smallint,
	"account_id" integer,
	CONSTRAINT phone_id PRIMARY KEY (id)

);
-- ddl-end --
-- object: "Phone_fk" | type: CONSTRAINT --

-- ddl-end --


-- object: public."Email" | type: TABLE --
CREATE TABLE public."Email"(
	id integer,
	name varchar(100),
	active date,
	email varchar(100),
	"account_id" integer,
	CONSTRAINT email_id PRIMARY KEY (id)

);
-- ddl-end --
-- object: "Email_fk" | type: CONSTRAINT --
ALTER TABLE public."Email" ADD CONSTRAINT "Email_fk" FOREIGN KEY ("account_id")
REFERENCES public."Account" (account_id) MATCH FULL
ON DELETE SET NULL ON UPDATE CASCADE NOT DEFERRABLE;
-- ddl-end ---
-- object: public."TypeAccount" | type: TABLE --
CREATE TABLE public."TypeAccount"(
	id integer,
	type varchar,
	edit boolean,
	creat boolean,
	viwer boolean,
	delete boolean,
	CONSTRAINT type_id PRIMARY KEY (id)
);
-- ddl-end --
-- object: "TypeAccount_fk" | type: CONSTRAINT --
-- ddl-end --


-- object: public."Hair" | type: TABLE --
CREATE TABLE public."Hair"(
	type varchar(100),
	level integer,
	letter smallint,
	id integer,
	CONSTRAINT hair_id PRIMARY KEY (id)

);
-- ddl-end --
-- object: "Hair_fk" | type: CONSTRAINT --

-- ddl-end --

-- object: public."Service" | type: TABLE --
CREATE TABLE public."Service"(
	id integer,
	name_provider varchar(100),
	additionalComments text,
	date_service date,
	"client_id" integer,
	"id_account_service_provider" integer
	CONSTRAINT service_id PRIMARY KEY (id)
);

CRETAE TABLE public."Payment"{

	id integer,
	valueTotal float,
	discountValue float,
	tipePayment varchar[200],
	date date,
	"service_id" integer,
	CONSTRAINT payment_id PRIMARY KEY (id)

}

CREATE TABLE public."Action"(
	id integer,
	name varchar(200),	
	additionalComments text,
	date_service date,
	"service_id" integer
);


-- ddl-end --
-- object: public."Sale" | type: TABLE --
CREATE TABLE public."Sale"(
	id integer,
	amount_product integer,
	price_total float,	
	discount integer,
	date_sale date,
	paid_off boolean,
	reamining float,
	"client_id" integer,
	"account_id_sale" integer,
	"product_id" integer,
	CONSTRAINT sale_id PRIMARY KEY (id)
);
-- ddl-end --
-- object: public."Purchase" | type: TABLE --
CREATE TABLE public."Purchase"(
	id integer,
	nameproduct varchar(100),
	amount_product varchar(100),
	value_product float,
	date_purchase date,
	product_description text,
	"account_id" integer,
	"company_id" integer,
	CONSTRAINT purchase_id PRIMARY KEY (id)

);

CREATE TABLE public."Purchase_Material"(
	id integer,
	name varchar(100),
	amount integer,
	value float,
	date date,	
	product_description text,
	"account_id" integer,
	CONSTRAINT purchaseMaterial_id PRIMARY KEY (id)

);

-- ddl-end --
-- object: public."Product" | type: TABLE --
CREATE TABLE public."Product"(
	purchase_id integer,
	liters float,
	weight float,
	name varchar(100),
	priceTotal float,
	amount smallint,
	description text,
	"tipeProduct" varchar(100),
	brand varchar(100),
	date_validity date,
	id integer,
	CONSTRAINT product_id PRIMARY KEY (id)

);

ALTER TABLE public."Phone" ADD CONSTRAINT "Phone_fk" FOREIGN KEY ("account_id")
REFERENCES public."Account" (account_id) MATCH FULL
ON DELETE SET NULL ON UPDATE CASCADE NOT DEFERRABLE;

ALTER TABLE public."Account" ADD CONSTRAINT "TypeAccount_fk" FOREIGN KEY ("type_Account_id")
REFERENCES public."TypeAccount" (type_id) MATCH FULL
ON DELETE SET NULL ON UPDATE CASCADE NOT DEFERRABLE;

ALTER TABLE public."Account" ADD CONSTRAINT "Hair_fk" FOREIGN KEY ("type_hair_id")
REFERENCES public."Hair" (hair_id) MATCH FULL
ON DELETE SET NULL ON UPDATE CASCADE NOT DEFERRABLE;

ALTER TABLE public."Action" ADD CONSTRAINT "Action_fk" FOREIGN KEY ("service_id")
REFERENCES public."Service" (service_id) MATCH FULL
ON DELETE SET NULL ON UPDATE CASCADE NOT DEFERRABLE;

ALTER TABLE public."Purchase_Material" ADD CONSTRAINT Purchase_Material_fk FOREIGN KEY (account_id)
REFERENCES public."Account" (account_id) MATCH SIMPLE
ON DELETE NO ACTION ON UPDATE NO ACTION NOT DEFERRABLE;

ALTER TABLE public."Adress" ADD CONSTRAINT "Adress_fk" FOREIGN KEY ("account_id")
REFERENCES public."Account" (account_id) MATCH FULL
ON DELETE SET NULL ON UPDATE CASCADE NOT DEFERRABLE;
-- ddl-end --
-- object: provider_id | type: CONSTRAINT --
ALTER TABLE public."Service" ADD CONSTRAINT provider_id FOREIGN KEY (id_account_service_provider)
REFERENCES public."Account" (account_id) MATCH SIMPLE
ON DELETE NO ACTION ON UPDATE NO ACTION NOT DEFERRABLE;
-- ddl-end --


-- object: client_id | type: CONSTRAINT --
ALTER TABLE public."Service" ADD CONSTRAINT client_id_service FOREIGN KEY (client_id)
REFERENCES public."Account" (account_id) MATCH FULL
ON DELETE NO ACTION ON UPDATE NO ACTION NOT DEFERRABLE;
-- ddl-end --


-- object: client_id | type: CONSTRAINT --
ALTER TABLE public."Sale" ADD CONSTRAINT client_id_sale FOREIGN KEY (client_id)
REFERENCES public."Account" (account_id) MATCH SIMPLE
ON DELETE NO ACTION ON UPDATE NO ACTION NOT DEFERRABLE;
-- ddl-end --


-- object: account_id_sale | type: CONSTRAINT --
ALTER TABLE public."Sale" ADD CONSTRAINT account_id_sale FOREIGN KEY (account_id_sale)
REFERENCES public."Account" (account_id) MATCH SIMPLE
ON DELETE NO ACTION ON UPDATE NO ACTION NOT DEFERRABLE;
-- ddl-end --


-- object: product_id | type: CONSTRAINT --
ALTER TABLE public."Sale" ADD CONSTRAINT product_id_sale FOREIGN KEY (product_id)
REFERENCES public."Product" (id) MATCH FULL
ON DELETE NO ACTION ON UPDATE CASCADE NOT DEFERRABLE;
-- ddl-end --


-- object: account_id | type: CONSTRAINT --
ALTER TABLE public."Purchase" ADD CONSTRAINT account_id_purchase FOREIGN KEY (id_account)
REFERENCES public."Account" (account_id) MATCH SIMPLE
ON DELETE NO ACTION ON UPDATE CASCADE NOT DEFERRABLE;
-- ddl-end --


-- object: company_id | type: CONSTRAINT --
ALTER TABLE public."Purchase" ADD CONSTRAINT company_id_purchase FOREIGN KEY (id_company_purchase)
REFERENCES public."Account" (account_id) MATCH SIMPLE
ON DELETE NO ACTION ON UPDATE CASCADE NOT DEFERRABLE;
-- ddl-end --


-- object: purchase_id | type: CONSTRAINT --
ALTER TABLE public."Product" ADD CONSTRAINT purchase_id_product FOREIGN KEY (purchase_id)
REFERENCES public."Purchase" (id) MATCH SIMPLE
ON DELETE NO ACTION ON UPDATE CASCADE NOT DEFERRABLE;
-- ddl-end --



