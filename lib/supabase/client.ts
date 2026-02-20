import { createBrowserClient } from '@supabase/ssr';
import { Feedback } from '@/types';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function getFeedbackById(id: string): Promise<Feedback | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('feedbacks')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching feedback:', error);
    return null;
  }

  return data as Feedback;
}

export async function updateFeedback(
  id: string,
  updates: Partial<Feedback>
): Promise<Feedback | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('feedbacks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating feedback:', error);
    return null;
  }

  return data as Feedback;
}
