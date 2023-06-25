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

export const responseToFeedback = async <R>(req: Promise<Response>): Promise<Feedback<R>> => {
  let feedback: Feedback<R>;
  try {
    const res = await req;
    const json = await res.json();
    if (res.status != 200) throw json;
    feedback = { result: json };
  } catch (err) {
    feedback = {
      message: JSON.stringify(err),
    };
  }
  return feedback;
};
