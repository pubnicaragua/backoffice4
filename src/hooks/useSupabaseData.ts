import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useSupabaseData<T>(
  table: string,
  select: string = '*',
  filters?: Record<string, any>
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [table, select, JSON.stringify(filters)]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase.from(table).select(select);
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }
      
      const { data: result, error } = await query;
      
      if (error) {
        setError(error.message);
        setData([]);
      } else {
        const finalData = result || [];
        setData(finalData);
      }
    } catch (err: any) {
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchData();
  };

  return { data, loading, error, refetch };
}

export function useSupabaseInsert<T>(table: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const insert = async (data: Partial<T>) => {
    const startTime = Date.now();
    
    try {
      setLoading(true);
      setError(null);
      
      console.log(`📝 Inserting into ${table}:`, data);
      
      const { error } = await supabase.from(table).insert(data);
      
      const duration = Date.now() - startTime;
      
      console.log(`✅ Insert ${table}:`, {
        success: !error,
        duration: `${duration}ms`,
        error: error?.message
      });
      
      if (error) {
        setError(error.message);
        return false;
      }
      return true;
    } catch (err: any) {
      console.error(`❌ Insert ${table} error:`, err.message);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { insert, loading, error };
}

export function useSupabaseUpdate<T>(table: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = async (id: string, data: Partial<T>) => {
    const startTime = Date.now();
    
    try {
      setLoading(true);
      setError(null);
      
      console.log(`✏️ Updating ${table}:`, { id, data });
      
      const { error } = await supabase.from(table).update(data).eq('id', id);
      
      const duration = Date.now() - startTime;
      
      console.log(`✅ Update ${table}:`, {
        success: !error,
        duration: `${duration}ms`,
        error: error?.message
      });
      
      if (error) {
        setError(error.message);
        return false;
      }
      return true;
    } catch (err: any) {
      console.error(`❌ Update ${table} error:`, err.message);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { update, loading, error };
}