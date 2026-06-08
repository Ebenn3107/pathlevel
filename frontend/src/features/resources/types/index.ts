export interface Resource {
  id: string;
  title: string;
  url: string | null;
  description: string | null;
  tags: string[];
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateResourceInput {
  title: string;
  url?: string;
  description?: string;
  tags?: string[];
}

export interface UpdateResourceInput {
  title?: string;
  url?: string | null;
  description?: string;
  tags?: string[];
  completed?: boolean;
}
