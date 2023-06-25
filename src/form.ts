export interface Success<R> {
  result: R;
}
export interface Failure {
  error: { [key: string]: string };
}

export type Feedback<R> = Success<R> | Failure | undefined;

export function isSuccess<R>(feedback: Feedback<R>): feedback is Success<R> {
  return feedback !== undefined && 'result' in feedback;
}
export function isFailure<R>(feedback: Feedback<R>): feedback is Failure {
  return feedback !== undefined && 'error' in feedback;
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
    const error = (err as any).error || err;
    feedback = {
      error:
        typeof error === 'object'
          ? Object.fromEntries(Object.entries(error).map(([k, v]) => [k, (v as string[]).join(', ')]))
          : { error },
    };
    console.log(error, feedback);
  }
  return feedback;
};
