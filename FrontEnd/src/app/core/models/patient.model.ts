export interface Patient {
  id: string;
  name: string;
  lastname: string;
  email: string;
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
    name?: string;
  };
}
