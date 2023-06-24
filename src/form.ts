export interface Success<R> {
  result: R;
}
export interface Failure {
  message: string;
}

export type Feedback<R> = Success<R> | Failure | undefined;

export function isSuccess<R>(feedback: Feedback<R>): feedback is Success<R> {
  return feedback !== undefined && 'result' in feedback;
}
export function isFailure<R>(feedback: Feedback<R>): feedback is Failure {
  return feedback !== undefined && 'message' in feedback;
}

export const formData = (data: any): FormData => {
  const formData = new FormData();
  for (const k of Object.keys(data)) formData.append(k, data[k]);
  return formData;
};
