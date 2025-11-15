import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Connection } from '@types/connections'
import { connectionsService } from '@services/connectionsService'

export const useConnections = () => {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['connections'],
    queryFn: () => connectionsService.fetchConnections(),
    staleTime: 10_000,
  })

  const createMutation = useMutation(connectionsService.createConnection, {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['connections'] }),
  })

  const updateMutation = useMutation(connectionsService.updateConnection, {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['connections'] }),
  })

  const deleteMutation = useMutation(connectionsService.deleteConnection, {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['connections'] }),
  })

  const importMutation = useMutation(connectionsService.importConnections, {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['connections'] }),
  })

  const exportMutation = useMutation(connectionsService.exportConnections)

  const connections = useMemo<Connection[]>(() => query.data ?? [], [query.data])

  return {
    connections,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    createConnection: createMutation.mutateAsync,
    updateConnection: updateMutation.mutateAsync,
    deleteConnection: deleteMutation.mutateAsync,
    importConnections: importMutation.mutateAsync,
    exportConnections: exportMutation.mutateAsync,
    isCreating: createMutation.isLoading,
    isUpdating: updateMutation.isLoading,
    isDeleting: deleteMutation.isLoading,
    isImporting: importMutation.isLoading,
    isExporting: exportMutation.isLoading,
  }
}
