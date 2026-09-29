import { useToast } from 'twenty-ui/components';

type SnackBarOptions = { message: string };

export const useSnackBar = () => {
  const { enqueueToast } = useToast();

  return {
    enqueueErrorSnackBar: ({ message }: SnackBarOptions) =>
      enqueueToast({ variant: 'error', children: message }),
    enqueueSuccessSnackBar: ({ message }: SnackBarOptions) =>
      enqueueToast({ variant: 'success', children: message }),
  };
};
