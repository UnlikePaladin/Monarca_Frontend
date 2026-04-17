export type Company = {
  id: string;
  key: string;
  name: string;
  localCurrency: string;
};

export type CreateCompanyPayload = {
  key: string;
  name: string;
  localCurrency: string;
  admin: {
    email: string;
    name: string;
    lastName: string;
    password: string;
    username?: string;
  };
};

export type CompanyDepartment = {
  id: string;
  name: string;
  cost_center_id: number;
};

export type CreateCompanyDepartmentPayload = {
  name: string;
  cost_center_id: number;
};
