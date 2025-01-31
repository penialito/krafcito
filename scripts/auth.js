import { auth, signInWithEmailAndPassword } from './firebase.js';

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Redirigir a dashboard (futura fase)
        window.location.href = '/dashboard.html';
    } catch (error) {
        console.error('Error:', error.code);
        alert('Credenciales incorrectas o error de conexión');
    }
});
