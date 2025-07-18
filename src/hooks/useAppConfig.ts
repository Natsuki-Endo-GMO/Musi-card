import { useState, useEffect } from 'react';

interface AppConfig {
  enableDebugPanels: boolean;
  enableDataMigration: boolean;
  enableAdminPanel: boolean;
  enableDataSourceIndicator: boolean;
  adminUsers: string[];
  environment: string;
  isProduction: boolean;
}

export function useAppConfig() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/config');
        if (response.ok) {
          const data = await response.json();
          setConfig(data);
        } else {
          setError('設定の取得に失敗しました');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  return { config, loading, error };
} 