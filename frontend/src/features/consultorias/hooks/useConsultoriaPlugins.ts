import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchPluginCatalog,
  fetchConsultancyPlugins,
  installPluginApi,
  uninstallPluginApi,
  pluginKeys,
  type Plugin,
  type ConsultancyPlugin,
} from '../../../api/plugins.ts';
import { toast } from 'sonner';

export type { Plugin, ConsultancyPlugin };

export function useConsultoriaPlugins(consultancyId: string) {
  const qc = useQueryClient();

  const { data: installedData, isLoading: installedLoading } = useQuery({
    queryKey: pluginKeys.byConsultancy(consultancyId),
    queryFn: () => fetchConsultancyPlugins(consultancyId),
    enabled: !!consultancyId,
    staleTime: 30_000,
  });

  const { data: catalogData } = useQuery({
    queryKey: pluginKeys.catalog(),
    queryFn: fetchPluginCatalog,
    staleTime: 5 * 60_000,
  });

  const installed = installedData ?? [];
  const catalog = catalogData ?? [];
  const installedSlugs = new Set(installed.map((p) => p.plugin_slug));

  const installMutation = useMutation({
    mutationFn: (slug: string) => installPluginApi(consultancyId, slug),
    onSuccess: (_, slug) => {
      qc.invalidateQueries({ queryKey: pluginKeys.byConsultancy(consultancyId) });
      const plugin = catalog.find((p) => p.slug === slug);
      toast.success(`Plugin "${plugin?.name ?? slug}" instalado.`);
    },
    onError: () => toast.error('Falha ao instalar plugin.'),
  });

  const uninstallMutation = useMutation({
    mutationFn: (slug: string) => uninstallPluginApi(consultancyId, slug),
    onSuccess: (_, slug) => {
      qc.invalidateQueries({ queryKey: pluginKeys.byConsultancy(consultancyId) });
      const plugin = catalog.find((p) => p.slug === slug);
      toast.success(`Plugin "${plugin?.name ?? slug}" removido.`);
    },
    onError: () => toast.error('Falha ao remover plugin.'),
  });

  return {
    installed,
    catalog,
    installedSlugs,
    installedLoading,
    install: (slug: string) => installMutation.mutate(slug),
    uninstall: (slug: string) => uninstallMutation.mutate(slug),
    isInstalling: installMutation.isPending,
    isUninstalling: uninstallMutation.isPending,
  };
}
