export interface content {
  type: string | number | boolean | object;
  validation: string[];
}

export interface modal {
  title: string;
  isFormdata: boolean;
  content: content[];
}
