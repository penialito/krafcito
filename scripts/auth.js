import { createClient } from '@supabase/supabase-js';

const supabase = createClient('TU_URL', 'TU_KEY');

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert('Error de autenticación: ' + error.message);
    return;
  }

  // Verificar rol de usuario
  const { data: userData } = await supabase
    .from('clientes')
    .select('*')
    .eq('email', email)
    .single();

  if (userData) {
    sessionStorage.setItem('user', JSON.stringify(userData));
    window.location.href = 'dashboard.html';
  }
});
