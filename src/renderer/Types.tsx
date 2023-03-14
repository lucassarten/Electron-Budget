export type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
};

export type Category = {
  id: string;
  name: string;
  type: string;
  target: number;
};
