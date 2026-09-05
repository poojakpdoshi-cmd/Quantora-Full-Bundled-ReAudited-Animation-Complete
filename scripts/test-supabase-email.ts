import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://apnjyhpuukytlirqezvq.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_FxLRmFgoqXVDwjXzT-bnfg_vZ4k96ec';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSupabaseOtpEmail() {
  console.log('Sending OTP email to poojakpdoshi@gmail.com via Supabase Auth...');
  const { data, error } = await supabase.auth.signInWithOtp({
    email: 'poojakpdoshi@gmail.com',
    options: {
      shouldCreateUser: true
    }
  });

  if (error) {
    console.error('Supabase signInWithOtp Error:', error);
  } else {
    console.log('Supabase signInWithOtp Success! Email dispatched:', data);
  }
}

testSupabaseOtpEmail().catch(console.error);
