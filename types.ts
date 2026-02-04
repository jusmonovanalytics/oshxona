
export interface Product {
  id: string;
  name: string;
  unit: string;
}

export interface ProductStock {
  productId: string;
  product: string;
  quantity: number;
  unit: string;
  totalSum: number;
  date: string;
}

export interface Tovar {
  id: string;
  name: string;
  unit: string;
  type: string;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  role: string;
}

export interface Norma {
  'product id': string;
  'product': string;
  'product miqdor': number;
  'product birlik': string;
  'tovar id': string;
  'tovar': string;
  'tovar miqdor': number;
  'tovar birlik': string;
  'norma rasxod sana': string;
  'rasxod turi': string;
  'norma id': string;
  'ikkilamchi birlik': string;
  'asosiy miqdor': number;
}
