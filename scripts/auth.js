import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://gztsbqbqmesfrvywpyhl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dHNicWJxbWVzZnJ2eXdweWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyMDg3NDUsImV4cCI6MjA1NDc4NDc0NX0.EmRDO3s64iYw1k3OY5W44twraLnJHy6bQh3HKTtx-wI');

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
