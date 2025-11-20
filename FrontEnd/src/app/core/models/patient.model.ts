export interface Patient {
  id: string;
  name: string;
  lastname: string;
  phone?: string;
  email?: string;
  password?: string;
  cpf: string;
  start_date?: string;
  birthday?: string;
  deleted?: boolean;
  avatar?: string;
  typeaccount_id: string;
  company_id_account?: string;
  type_hair_id?: string;
  createdAt?: string;
  updatedAt?: string;
  TypeAccount?: {
    id: string;
    type: string;
    edit: boolean;
    creat: boolean;
    viwer: boolean;
    delet: boolean;
  };
  Emails?: Array<{
    id: string;
    name?: string;
    email: string;
    active?: string;
    account_id_email: string;
    company_id_email?: string;
  }>;
  Phones?: Array<{
    id: string;
    phone: string | number;
    ddd?: string | number;
    active?: string;
    type?: string;
    account_id_phone: string;
    company_id_phone?: string;
  }>;
}
