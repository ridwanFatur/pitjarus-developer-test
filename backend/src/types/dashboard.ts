import { RowDataPacket } from 'mysql2';

export type Area = RowDataPacket & {
  area_id: number;
  area_name: string;
};

export type ChartRow = RowDataPacket & {
  area_id: number;
  area_name: string;
  compliance_percentage: number | string | null;
};

export type TableRow = RowDataPacket & {
  brand_id: number;
  brand_name: string;
  area_id: number;
  area_name: string;
  compliance_percentage: number | string | null;
};

export type AreaCompliance = {
  area_id: number;
  area_name: string;
  compliance_percentage: number;
};

export type BrandCompliance = {
  brand_id: number;
  brand_name: string;
  areas: AreaCompliance[];
};

export type DashboardPayload = {
  chart: AreaCompliance[];
  table: BrandCompliance[];
};
