import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = 'https://wahwrojbwxpskabxeepu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhaHdyb2pid3hwc2thYnhlZXB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE1NDkwMTUsImV4cCI6MjA0NzEyNTAxNX0.ynk_b--pIVDCSnEVAxRJ4r_vxhRzOqyYyPCXiSeYOro';

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});