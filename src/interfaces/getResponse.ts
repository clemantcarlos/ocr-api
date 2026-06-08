export interface GetResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    total: number;
    page: number;
    totalPages: number;
  };
}
export interface ResponseDto<T> {
  success: boolean;
  data: T;
}