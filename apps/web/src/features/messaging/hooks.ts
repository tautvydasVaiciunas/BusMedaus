import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiClientError, apiClient } from "../../lib/apiClient";
import { formatSentAt } from "./utils";

export type CommentApiItem = {
  id: string;
  content: string;
  author: {
    id: string;
    email: string;
    roles: string[];
  };
  createdAt: string;
};

export type ThreadComment = {
  id: string;
  content: string;
  createdAt: string;
  formattedCreatedAt: string;
  authorLabel: string;
  isOptimistic?: boolean;
};

export const mapCommentResponse = (item: CommentApiItem): ThreadComment => ({
  id: item.id,
  content: item.content,
  createdAt: item.createdAt,
  formattedCreatedAt: formatSentAt(item.createdAt),
  authorLabel: item.author.email
});

export const useTaskComments = (taskId: string | null) =>
  useQuery<CommentApiItem[], ApiClientError, ThreadComment[]>({
    queryKey: ["task-comments", taskId],
    queryFn: () => apiClient.get<CommentApiItem[]>(`/tasks/${taskId}/comments`),
    enabled: Boolean(taskId),
    select: (items) => items.map(mapCommentResponse),
    staleTime: 10_000
  });

type ComposerContext = {
  previousComments?: ThreadComment[];
};

export const useCommentComposer = (taskId: string | null) => {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const queryKey = useMemo(() => (taskId ? (["task-comments", taskId] as const) : null), [taskId]);

  useEffect(() => {
    setError(null);
  }, [taskId]);

  const mutation = useMutation<CommentApiItem, ApiClientError, string, ComposerContext>({
    mutationFn: async (content: string) => {
      if (!taskId) {
        throw new Error("Nepasirinkta užduotis.");
      }
      return apiClient.post<CommentApiItem>(`/tasks/${taskId}/comments`, { content });
    },
    onMutate: async (content) => {
      if (!queryKey) {
        return {};
      }
      setError(null);
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ThreadComment[]>(queryKey) ?? [];
      const timestamp = new Date().toISOString();
      const optimistic: ThreadComment = {
        id: `optimistic-${Date.now()}`,
        content,
        createdAt: timestamp,
        formattedCreatedAt: formatSentAt(timestamp),
        authorLabel: "Jūs",
        isOptimistic: true
      };
      queryClient.setQueryData<ThreadComment[]>(queryKey, [...previous, optimistic]);
      return { previousComments: previous };
    },
    onError: (err, _variables, context) => {
      if (queryKey && context?.previousComments) {
        queryClient.setQueryData<ThreadComment[]>(queryKey, context.previousComments);
      }
      const fallback = "Nepavyko išsiųsti žinutės. Pabandykite dar kartą.";
      if (err instanceof ApiClientError) {
        setError(err.message || fallback);
      } else {
        setError(fallback);
      }
    },
    onSuccess: (comment) => {
      if (!queryKey) {
        return;
      }
      setError(null);
      queryClient.setQueryData<ThreadComment[]>(queryKey, (current = []) => {
        const stable = current.filter((item) => !item.isOptimistic);
        return [...stable, mapCommentResponse(comment)];
      });
    },
    onSettled: () => {
      if (queryKey) {
        queryClient.invalidateQueries({ queryKey });
      }
    }
  });

  const submit = useCallback(
    (content: string) => mutation.mutateAsync(content),
    [mutation]
  );

  const resetError = useCallback(() => setError(null), []);

  return {
    submit,
    isSubmitting: mutation.isPending,
    error,
    resetError
  };
};
