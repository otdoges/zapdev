export interface FragmentDisplay {
  id: string;
  sandboxId?: string | null;
  sandboxUrl?: string | null;
  title?: string | null;
  files: { [path: string]: string };
  createdAt?: Date | string | null;
  isDraft?: boolean;
}
