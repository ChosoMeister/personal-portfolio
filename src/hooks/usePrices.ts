import { useQuery } from '@tanstack/react-query';
import { API } from '../services/api';

export const usePrices = () => {
    return useQuery({
        queryKey: ['prices'],
        queryFn: API.getPrices,
        refetchInterval: 5 * 60 * 1000, // 5 minutes
        staleTime: 60 * 1000, // 1 minute
    });
};
