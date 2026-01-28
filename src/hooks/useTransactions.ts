import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API } from '../services/api';
import { Transaction } from '../../types'; // Adjust path if types.ts moved, but it is in root.
// Current path src/hooks/useTransactions.ts, types is at ../../types.ts
// Wait, root is project root. src/hooks -> ../hooks -> ../src -> project root?
// No. src/hooks/useTransactions.ts.
// ../../types.ts points to project root types.ts?
// Let's verify file structure.
// /Users/mustafa/Documents/Git/Github/personal-portfolio/types.ts
// /Users/mustafa/Documents/Git/Github/personal-portfolio/src/hooks/useTransactions.ts
// So yes, ../../types.ts is correct.

export const useTransactions = (username: string | undefined) => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['transactions', username],
        queryFn: () => username ? API.getTransactions(username) : Promise.resolve([]),
        enabled: !!username,
    });

    const saveMutation = useMutation({
        mutationFn: (tx: Transaction) => {
            if (!username) throw new Error('User not logged in');
            return API.saveTransaction(username, tx);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions', username] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => {
            if (!username) throw new Error('User not logged in');
            return API.deleteTransaction(username, id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions', username] });
        }
    });

    return {
        transactions: query.data || [],
        isLoading: query.isLoading,
        error: query.error,
        saveTransaction: saveMutation.mutateAsync,
        deleteTransaction: deleteMutation.mutateAsync,
        isSaving: saveMutation.isPending,
        isDeleting: deleteMutation.isPending
    };
};
