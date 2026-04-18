export type CostCenter = {
  id: string;
  name: string;
  numericId?: number;
  key?: string;
};

export type CreateCostCenterPayload = {
  name: string;
  numericId?: number;
  key?: string;
};